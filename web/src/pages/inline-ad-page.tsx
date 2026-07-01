import { CodeOutlined, RollbackOutlined } from "@ant-design/icons";
import {
  Alert,
  Button,
  Card,
  Col,
  Empty,
  List,
  Row,
  Segmented,
  Space,
  Tag,
  Typography,
} from "antd";
import { NativeAdEditor } from "../editors/native-ad/native-ad-editor";
import { InlineNativeExtras } from "../editors/native-ad/inline-native-extras";
import { JsonPreview } from "../components/json-preview";
import { PublishBar } from "../components/publish-bar";
import { ScrollPane } from "../components/scroll-pane";
import { useInlineAdDrafts } from "../hooks/use-inline-ad-drafts";
import { usePublishFlow } from "../hooks/use-publish-flow";
import {
  DEFAULT_INLINE_AD_CONFIGS,
  INLINE_AD_KEYS,
  type InlineAdConfig,
  type InlineAdKey,
  type InlineAdType,
} from "../../../shared/inline-ad-meta";
import type { ParamSummary } from "../api";

type Props = {
  inlineAds: Record<string, ParamSummary>;
  etag: string | null;
  reload: () => Promise<void> | void;
};

const inlineAdEntries: InlineAdKey[] = [
  INLINE_AD_KEYS.gameFooter,
  INLINE_AD_KEYS.homeFooter,
];

export function InlineAdPage({ inlineAds, etag, reload }: Props) {
  const d = useInlineAdDrafts(inlineAds);
  const flow = usePublishFlow({
    etag,
    changes: d.changes,
    getSummary: (k) => inlineAds[k],
    reload,
  });
  const hasErrors = Object.keys(d.errors).length > 0;

  const labels: Record<InlineAdKey, string> = {
    [INLINE_AD_KEYS.gameFooter]: "Game footer",
    [INLINE_AD_KEYS.homeFooter]: "Home footer",
  };

  const sel = d.selected;
  const value = d.draft;
  const adType =
    value.adType ?? DEFAULT_INLINE_AD_CONFIGS[sel].adType ?? "native";

  return (
    <div>
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="InlineAd dùng chung một remote config để chuyển giữa banner và native cho footer/home."
      />

      <Row gutter={16}>
        <Col xs={24} lg={6}>
          <ScrollPane>
          <Card
            size="small"
            title="InlineAd targets"
            styles={{ body: { padding: 6 } }}
          >
            <List
              size="small"
              dataSource={inlineAdEntries}
              renderItem={(key) => {
                const dirty = d.isDirty(key);
                const live = d.isLive(key);
                return (
                  <List.Item
                    onClick={() => d.select(key)}
                    style={{
                      cursor: "pointer",
                      padding: "6px 8px",
                      borderRadius: 6,
                      background:
                        sel === key ? "rgba(59,130,246,0.16)" : undefined,
                    }}
                  >
                    <div
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Typography.Text style={{ fontSize: 12 }}>
                          {labels[key]}
                        </Typography.Text>
                        <div style={{ fontSize: 10, color: "#64748b" }}>
                          <span style={{ fontFamily: "monospace" }}>{key}</span>
                        </div>
                      </div>
                      {live ? (
                        <Tag color="blue" style={{ marginInlineEnd: 0 }}>
                          live
                        </Tag>
                      ) : (
                        <Tag style={{ marginInlineEnd: 0 }}>app default</Tag>
                      )}
                      {dirty && (
                        <Tag color="orange" style={{ marginInlineEnd: 0 }}>
                          đã sửa
                        </Tag>
                      )}
                    </div>
                  </List.Item>
                );
              }}
            />
          </Card>
          </ScrollPane>
        </Col>

        <Col xs={24} lg={18}>
          {!sel ? (
            <Empty
              description="Chọn một target bên trái"
              style={{ marginTop: 80 }}
            />
          ) : (
            <div>
              <PublishBar
                dirtyCount={d.dirtyKeys.length}
                hasErrors={hasErrors}
                flow={flow}
                left={
                  <Space wrap>
                    <Typography.Text strong>{labels[sel]}</Typography.Text>
                    <Typography.Text
                      style={{
                        fontFamily: "monospace",
                        fontSize: 12,
                        color: "#64748b",
                      }}
                    >
                      {sel}
                    </Typography.Text>
                    {d.isDirty(sel) && (
                      <Button
                        size="small"
                        icon={<RollbackOutlined />}
                        onClick={() => d.resetSelected()}
                      >
                        Hoàn tác
                      </Button>
                    )}
                  </Space>
                }
              />

              {d.errors[sel] && (
                <Alert
                  type="error"
                  showIcon
                  style={{ marginBottom: 12 }}
                  message={d.errors[sel]}
                />
              )}
              {!d.isLive(sel) && !d.isDirty(sel) && (
                <Alert
                  style={{ marginBottom: 12 }}
                  type="info"
                  showIcon
                  message="Target này chưa có trên Firebase — app đang dùng default trong code."
                />
              )}

              <Row gutter={16}>
                <Col xs={24} xl={14}>
                  <ScrollPane>
                  <Card size="small" title="InlineAd config">
                    <Space
                      direction="vertical"
                      size={14}
                      style={{ width: "100%" }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          flexWrap: "wrap",
                        }}
                      >
                        <Typography.Text style={{ width: 110, flexShrink: 0 }}>
                          adType
                        </Typography.Text>
                        <Segmented
                          value={adType}
                          options={["banner", "native", "none"].map((v) => ({
                            label: v,
                            value: v,
                          }))}
                          onChange={(v) =>
                            d.updateSelected({
                              ...value,
                              adType: v as InlineAdType,
                            })
                          }
                        />
                      </div>

                      <Alert
                        type="info"
                        showIcon
                        message={
                          adType === "native"
                            ? "InlineAd sẽ hiển thị native với cấu hình bên dưới."
                            : adType === "banner"
                              ? "InlineAd sẽ hiển thị banner, phần native config sẽ bị bỏ qua."
                              : "InlineAd đang tắt."
                        }
                      />

                      {adType === "native" && (
                        <>
                          <NativeAdEditor
                            value={value.nativeAdConfig ?? {}}
                            hideShowAds
                            onChange={(nativeAdConfig) =>
                              d.updateSelected({ ...value, nativeAdConfig })
                            }
                          />
                          <InlineNativeExtras
                            value={value.nativeAdConfig ?? {}}
                            onChange={(nativeAdConfig) =>
                              d.updateSelected({ ...value, nativeAdConfig })
                            }
                          />
                        </>
                      )}
                    </Space>
                  </Card>
                  </ScrollPane>
                </Col>
                <Col xs={24} xl={10}>
                  <ScrollPane>
                  <Typography.Title
                    level={5}
                    style={{
                      marginTop: 0,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <CodeOutlined style={{ color: "#3b82f6" }} />
                    JSON (sẽ publish)
                  </Typography.Title>
                  <JsonPreview
                    title={sel}
                    value={JSON.parse(d.currentString(sel))}
                    dirty={d.isDirty(sel)}
                  />
                  </ScrollPane>
                </Col>
              </Row>
            </div>
          )}
        </Col>
      </Row>
    </div>
  );
}
