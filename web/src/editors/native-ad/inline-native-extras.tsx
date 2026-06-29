import { Card, Divider, InputNumber, Space, Switch, Typography } from "antd";
import {
  CLOSE_MODE_LABELS,
  CORNER_LABELS,
  CORNERS,
} from "../../../../shared/params";
import type {
  NativeAdCollapsibleCloseFlow,
  NativeAdCollapsibleConfig,
  NativeAdConfig,
  NativeAdRefreshConfig,
} from "../../../../shared/native-ad-meta";
import { WeightRows } from "../weight-rows";

const { Text, Paragraph } = Typography;

const MODE_ORDER = ["fakeX", "openStore", "countdown"] as const;

function Row({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
      <div style={{ width: 200, flexShrink: 0 }}>
        <Text>{label}</Text>
        {hint && (
          <div style={{ fontSize: 11, color: "#64748b" }}>{hint}</div>
        )}
      </div>
      <div>{children}</div>
    </div>
  );
}

// Editor for the inline-only native fields (selfLoad, showSkeleton, refresh,
// collapsible). Lives alongside NativeAdEditor in the InlineAd page. Every
// onChange spreads the prior value so passthrough/unknown fields survive.
export function InlineNativeExtras({
  value,
  onChange,
}: {
  value: NativeAdConfig;
  onChange: (next: NativeAdConfig) => void;
}) {
  const refresh = value.refresh ?? {};
  const collapsible = value.collapsible ?? {};
  const closeFlow = collapsible.closeFlow ?? {};

  const setRefresh = (patch: Partial<NativeAdRefreshConfig>) =>
    onChange({ ...value, refresh: { ...refresh, ...patch } });

  const setCollapsible = (patch: Partial<NativeAdCollapsibleConfig>) =>
    onChange({ ...value, collapsible: { ...collapsible, ...patch } });

  const setCloseFlow = (next: NativeAdCollapsibleCloseFlow) =>
    setCollapsible({ closeFlow: next });

  const preClose = closeFlow.preClose ?? {};
  const close = closeFlow.close ?? {};
  const preCloseModes = preClose.modeWeights ?? {};
  const preClosePos = preClose.positionWeights ?? {};
  const closePos = close.positionWeights ?? {};
  const cfDisabled = !closeFlow.enabled;

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <Card title="Tải & hiển thị" size="small">
        <Row
          label="Self-load"
          hint="Tự request ad trực tiếp, bỏ pool chung"
        >
          <Switch
            checked={!!value.selfLoad}
            onChange={(v) => onChange({ ...value, selfLoad: v })}
          />
        </Row>
        <Row label="Hiện skeleton" hint="Khung chờ khi đang load ad">
          <Switch
            checked={!!value.showSkeleton}
            onChange={(v) => onChange({ ...value, showSkeleton: v })}
          />
        </Row>
      </Card>

      <Card title="Tự làm mới (auto-refresh)" size="small">
        <Row label="Bật auto-refresh" hint="Swap ad mới theo nhịp">
          <Switch
            checked={!!refresh.enabled}
            onChange={(v) => setRefresh({ enabled: v })}
          />
        </Row>
        <Row label="Nhịp refresh">
          <InputNumber
            min={0}
            disabled={!refresh.enabled}
            value={refresh.intervalSeconds ?? 30}
            onChange={(v) => setRefresh({ intervalSeconds: v ?? 0 })}
            addonAfter="giây"
            style={{ width: 140 }}
          />
        </Row>
        <Row label="Preload trước" hint="Nạp ad mới trước khi swap">
          <InputNumber
            min={0}
            disabled={!refresh.enabled}
            value={refresh.preloadSeconds}
            onChange={(v) => setRefresh({ preloadSeconds: v ?? undefined })}
            addonAfter="giây"
            style={{ width: 140 }}
          />
        </Row>
      </Card>

      <Card title="Collapsible (bung/thu kiểu banner)" size="small">
        <Row label="Bật collapsible">
          <Switch
            checked={!!collapsible.enabled}
            onChange={(v) => setCollapsible({ enabled: v })}
          />
        </Row>
        <Row label="Tự bung khi mở" hint="Auto-expand ngay khi hiện">
          <Switch
            checked={!!collapsible.startExpanded}
            disabled={!collapsible.enabled}
            onChange={(v) => setCollapsible({ startExpanded: v })}
          />
        </Row>
        <Row label="Chờ trước khi bung">
          <InputNumber
            min={0}
            disabled={!collapsible.enabled || !collapsible.startExpanded}
            value={collapsible.startExpandedDelay}
            onChange={(v) =>
              setCollapsible({ startExpandedDelay: v ?? undefined })
            }
            addonAfter="ms"
            style={{ width: 140 }}
          />
        </Row>
        <Row label="Tỉ lệ bung" hint="Xác suất bung mỗi lần (0..1)">
          <InputNumber
            min={0}
            max={1}
            step={0.1}
            disabled={!collapsible.enabled}
            value={collapsible.expandRate ?? 1}
            onChange={(v) => setCollapsible({ expandRate: v ?? undefined })}
            style={{ width: 140 }}
          />
        </Row>

        <Divider orientation="left" plain style={{ margin: "8px 0" }}>
          Flow đóng khi đang bung
        </Divider>
        <Space align="center" style={{ marginBottom: 8 }}>
          <Switch
            checked={!!closeFlow.enabled}
            disabled={!collapsible.enabled}
            onChange={(v) => setCloseFlow({ ...closeFlow, enabled: v })}
          />
          <Text>Bật flow đóng 2 giai đoạn</Text>
        </Space>

        {collapsible.enabled && closeFlow.enabled && (
          <>
            <Divider orientation="left" plain style={{ margin: "12px 0 8px" }}>
              Giai đoạn 1 — Pre-close
            </Divider>
            <Space align="center" style={{ marginBottom: 8 }}>
              <Text type="secondary">Hiện sau</Text>
              <InputNumber
                min={0}
                disabled={cfDisabled}
                value={preClose.delaySeconds}
                onChange={(v) =>
                  setCloseFlow({
                    ...closeFlow,
                    preClose: { ...preClose, delaySeconds: v ?? 0 },
                  })
                }
                addonAfter="giây"
                style={{ width: 130 }}
              />
            </Space>
            <Paragraph type="secondary" style={{ fontSize: 12, marginBottom: 4 }}>
              Trọng số chọn mode pre-close:
            </Paragraph>
            <WeightRows
              weights={preCloseModes}
              order={MODE_ORDER}
              labels={CLOSE_MODE_LABELS}
              disabled={cfDisabled}
              onChange={(key, v) =>
                setCloseFlow({
                  ...closeFlow,
                  preClose: {
                    ...preClose,
                    modeWeights: { ...preCloseModes, [key]: v },
                  },
                })
              }
            />
            <Paragraph type="secondary" style={{ fontSize: 12, margin: "8px 0 4px" }}>
              Vị trí nút decoy:
            </Paragraph>
            <WeightRows
              weights={preClosePos}
              order={CORNERS}
              labels={CORNER_LABELS}
              disabled={cfDisabled}
              allowZeroTotal
              onChange={(key, v) =>
                setCloseFlow({
                  ...closeFlow,
                  preClose: {
                    ...preClose,
                    positionWeights: { ...preClosePos, [key]: v },
                  },
                })
              }
            />

            <Divider orientation="left" plain style={{ margin: "16px 0 8px" }}>
              Giai đoạn 2 — Close thật
            </Divider>
            <Space align="center" style={{ marginBottom: 8 }}>
              <Text type="secondary">Hiện nút X thật sau</Text>
              <InputNumber
                min={0}
                disabled={cfDisabled}
                value={close.delaySeconds}
                onChange={(v) =>
                  setCloseFlow({
                    ...closeFlow,
                    close: { ...close, delaySeconds: v ?? 0 },
                  })
                }
                addonAfter="giây"
                style={{ width: 130 }}
              />
            </Space>
            <Paragraph type="secondary" style={{ fontSize: 12, marginBottom: 4 }}>
              Vị trí nút X thật:
            </Paragraph>
            <WeightRows
              weights={closePos}
              order={CORNERS}
              labels={CORNER_LABELS}
              disabled={cfDisabled}
              allowZeroTotal
              onChange={(key, v) =>
                setCloseFlow({
                  ...closeFlow,
                  close: {
                    ...close,
                    positionWeights: { ...closePos, [key]: v },
                  },
                })
              }
            />
          </>
        )}
      </Card>
    </Space>
  );
}
