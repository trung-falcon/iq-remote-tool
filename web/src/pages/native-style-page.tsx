import { CodeOutlined, RollbackOutlined } from "@ant-design/icons";
import {
  Alert,
  Button,
  Card,
  Col,
  Row,
  Segmented,
  Select,
  Space,
  Typography,
} from "antd";
import { useState } from "react";
import {
  LAYOUT_GROUP_LABELS,
  NATIVE_STYLE_LAYOUT_KEYS,
  isFullscreenLayout,
  type LayoutGroup,
} from "../../../shared/native-style-meta";
import type { ParamSummary } from "../api";
import { JsonPreview } from "../components/json-preview";
import { PublishBar } from "../components/publish-bar";
import { ScrollPane } from "../components/scroll-pane";
import { NativeStyleEditor } from "../editors/native-style/native-style-editor";
import { NativeStylePreview } from "../editors/native-style/native-style-preview";
import {
  useNativeStyleDrafts,
  type StyleScope,
} from "../hooks/use-native-style-drafts";
import { usePublishFlow } from "../hooks/use-publish-flow";

type Props = {
  nativeStyle: Record<string, ParamSummary>;
  etag: string | null;
  reload: () => Promise<void> | void;
};

const GROUP_ORDER: LayoutGroup[] = ["inline", "collapsible", "fullscreen"];

// Grouped scope options for the Select: global default + every layout by group.
const scopeOptions = [
  { label: "Chung", options: [{ label: "Mặc định chung (default)", value: "default" }] },
  ...GROUP_ORDER.map((g) => ({
    label: LAYOUT_GROUP_LABELS[g],
    options: NATIVE_STYLE_LAYOUT_KEYS.filter((l) => l.group === g).map((l) => ({
      label: l.label,
      value: l.key,
    })),
  })),
];

const layoutDesc = (key: string) =>
  NATIVE_STYLE_LAYOUT_KEYS.find((l) => l.key === key)?.desc ?? "";

export function NativeStylePage({ nativeStyle, etag, reload }: Props) {
  const d = useNativeStyleDrafts(nativeStyle);
  const flow = usePublishFlow({
    etag,
    changes: d.changes,
    getSummary: (k) => nativeStyle[k],
    reload,
  });

  // When editing the global default scope there's no single layout to draw, so let
  // the user pick which layout to preview the default against.
  const [defaultPreview, setDefaultPreview] = useState<StyleScope>("small");
  const previewLayout = d.scope === "default" ? defaultPreview : d.scope;
  const fullscreenNote = isFullscreenLayout(previewLayout);

  return (
    <div>
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="Native Style điều khiển màu/cỡ chữ/kích thước của native ad. Chọn phạm vi (mặc định chung hoặc từng layout), bật công tắc để ghi đè một thông số, xem preview cập nhật ngay. Chỉ field được ghi đè mới publish."
      />

      <PublishBar
        dirtyCount={d.dirty ? 1 : 0}
        hasErrors={!!d.error}
        flow={flow}
        left={
          <Space wrap>
            <Typography.Text strong>Native style config</Typography.Text>
            <Typography.Text style={{ fontFamily: "monospace", fontSize: 12, color: "#64748b" }}>
              {d.key}
            </Typography.Text>
            {d.dirty && (
              <Button size="small" icon={<RollbackOutlined />} onClick={() => d.resetAll()}>
                Hoàn tác
              </Button>
            )}
          </Space>
        }
      />

      {d.error && (
        <Alert type="error" showIcon style={{ marginBottom: 12 }} message={d.error} />
      )}
      {!d.isLive && !d.dirty && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 12 }}
          message="Key này chưa có trên Firebase — app đang dùng default trong code. Ghi đè & publish để tạo mới."
        />
      )}

      <Row gutter={16}>
        {/* Left: the style editor — scrolls on its own so it never moves the preview/JSON. */}
        <Col xs={24} xl={13}>
          <Card
            size="small"
            title={
              <Space wrap>
                <span>Phạm vi</span>
                <Select
                  size="small"
                  style={{ minWidth: 240 }}
                  value={d.scope}
                  options={scopeOptions}
                  onChange={(v) => d.setScope(v)}
                />
              </Space>
            }
            styles={{ body: { padding: 0 } }}
          >
            <div style={{ padding: "12px 12px 0" }}>
              <Typography.Paragraph type="secondary" style={{ fontSize: 12, marginTop: 0 }}>
                {d.scope === "default"
                  ? "Áp cho MỌI layout (nền dưới cùng). Từng layout có thể ghi đè tiếp."
                  : layoutDesc(d.scope)}
              </Typography.Paragraph>
              {isFullscreenLayout(d.scope) && (
                <Alert
                  type="warning"
                  showIcon
                  style={{ marginBottom: 12 }}
                  message="Layout fullscreen: default thật nằm trong Android XML nên preview chỉ gần đúng. Field bạn bật sẽ được publish làm override."
                />
              )}
            </div>
            <ScrollPane top={200} style={{ padding: "0 12px 12px" }}>
              <NativeStyleEditor d={d} />
            </ScrollPane>
          </Card>
        </Col>

        {/* Right: preview stays put; only the JSON scrolls under it. */}
        <Col xs={24} xl={11}>
          <div
            style={{
              position: "sticky",
              top: 76,
              maxHeight: "calc(100dvh - 96px)",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <Card
              size="small"
              style={{ flexShrink: 0 }}
              title={
                <Space wrap>
                  <span>Preview</span>
                  {d.scope === "default" && (
                    <Segmented
                      size="small"
                      value={defaultPreview}
                      onChange={(v) => setDefaultPreview(v as StyleScope)}
                      options={NATIVE_STYLE_LAYOUT_KEYS.map((l) => ({
                        label: l.key,
                        value: l.key,
                      }))}
                    />
                  )}
                </Space>
              }
            >
              {fullscreenNote && (
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  Preview gần đúng ({previewLayout})
                </Typography.Text>
              )}
              <NativeStylePreview layoutKey={previewLayout} config={d.config} />
            </Card>

            <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflowY: "auto" }}>
              <Typography.Title
                level={5}
                style={{ marginTop: 0, display: "flex", alignItems: "center", gap: 8 }}
              >
                <CodeOutlined style={{ color: "#3b82f6" }} />
                JSON (sẽ publish)
              </Typography.Title>
              <JsonPreview title={d.key} value={JSON.parse(d.currentString)} dirty={d.dirty} />
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );
}
