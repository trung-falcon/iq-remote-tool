import { CloseCircleOutlined } from '@ant-design/icons';
import { Alert, Card, Divider, InputNumber, Space, Switch, Typography } from 'antd';
import {
  CLOSE_MODE_LABELS,
  CONTENT_TYPE_HINTS,
  CONTENT_TYPE_LABELS,
  CORNER_LABELS,
  CORNERS,
  NATIVE_CONTENT_TYPES,
  PARAM_KEYS,
  type NativeAdContentType,
} from '../../../shared/params';
import type { CloseConfig, ModeWeights } from '../../../shared/schemas';
import type { ParamSummary } from '../api';
import { ParamTags } from '../components/param-tags';
import { WeightRows } from './weight-rows';

const MODE_ORDER = ['fakeX', 'openStore', 'countdown'] as const;

type Props = {
  value: CloseConfig;
  summary?: ParamSummary;
  dirty: boolean;
  error?: string;
  onChange: (next: CloseConfig) => void;
};

export function CloseConfigEditor({ value, summary, dirty, error, onChange }: Props) {
  const disabled = !value.enabled;
  const overrides = value.overrides ?? {};

  // Set (or clear, when modeWeights is null) the override for one content type.
  // Other fields the override carries are preserved; an empty `overrides` is dropped.
  const setOverrideWeights = (type: NativeAdContentType, modeWeights: ModeWeights | null) => {
    const next: Record<string, any> = { ...(value.overrides ?? {}) };
    if (modeWeights === null) {
      delete next[type];
    } else {
      next[type] = { ...next[type], preClose: { ...next[type]?.preClose, modeWeights } };
    }
    onChange({ ...value, overrides: Object.keys(next).length ? next : undefined });
  };

  const toggleOverride = (type: NativeAdContentType, on: boolean) =>
    setOverrideWeights(type, on ? { ...value.preClose.modeWeights } : null);

  const setOverrideWeight = (type: NativeAdContentType, key: string, v: number) => {
    const cur = overrides[type]?.preClose.modeWeights ?? value.preClose.modeWeights;
    setOverrideWeights(type, { ...cur, [key]: v });
  };

  return (
    <Card
      title={
        <span>
          <CloseCircleOutlined style={{ color: '#3b82f6', marginRight: 8 }} />
          Flow đóng ad (2 giai đoạn)
        </span>
      }
      extra={<ParamTags summary={summary} dirty={dirty} />}
    >
      <Typography.Paragraph type="secondary" style={{ marginTop: 0 }}>
        Key: <Typography.Text code>{PARAM_KEYS.closeConfig}</Typography.Text> — giai đoạn 1
        (pre-close) hiện theo mode random theo trọng số, giai đoạn 2 hiện nút đóng thật.
      </Typography.Paragraph>

      <Space align="center">
        <Switch
          checked={value.enabled}
          onChange={enabled => onChange({ ...value, enabled })}
        />
        <Typography.Text>Bật flow đóng 2 giai đoạn</Typography.Text>
      </Space>

      <Divider orientation="left" plain style={{ margin: '16px 0 8px' }}>
        Giai đoạn 1 — Pre-close
      </Divider>
      <Space align="center" style={{ marginBottom: 8 }}>
        <Typography.Text type="secondary">Hiện sau</Typography.Text>
        <InputNumber
          min={0}
          step={1}
          disabled={disabled}
          value={value.preClose.delaySeconds}
          onChange={v =>
            onChange({ ...value, preClose: { ...value.preClose, delaySeconds: v ?? 0 } })
          }
          addonAfter="giây"
          style={{ width: 130 }}
        />
      </Space>
      <Typography.Paragraph type="secondary" style={{ fontSize: 12, marginBottom: 4 }}>
        Trọng số chọn mode pre-close (random theo tỉ lệ %):
      </Typography.Paragraph>
      <WeightRows
        weights={value.preClose.modeWeights}
        order={MODE_ORDER}
        labels={CLOSE_MODE_LABELS}
        disabled={disabled}
        onChange={(key, v) =>
          onChange({
            ...value,
            preClose: {
              ...value.preClose,
              modeWeights: { ...value.preClose.modeWeights, [key]: v },
            },
          })
        }
      />
      <Typography.Paragraph type="secondary" style={{ fontSize: 12, margin: '8px 0 4px' }}>
        Vị trí nút decoy (random theo trọng số góc):
      </Typography.Paragraph>
      <WeightRows
        weights={value.preClose.positionWeights}
        order={CORNERS}
        labels={CORNER_LABELS}
        disabled={disabled}
        allowZeroTotal
        onChange={(key, v) =>
          onChange({
            ...value,
            preClose: {
              ...value.preClose,
              positionWeights: { ...value.preClose.positionWeights, [key]: v },
            },
          })
        }
      />

      <Divider orientation="left" plain style={{ margin: '16px 0 8px' }}>
        Giai đoạn 2 — Close thật
      </Divider>
      <Space align="center" style={{ marginBottom: 8 }}>
        <Typography.Text type="secondary">Hiện nút X thật sau</Typography.Text>
        <InputNumber
          min={0}
          step={1}
          disabled={disabled}
          value={value.close.delaySeconds}
          onChange={v => onChange({ ...value, close: { ...value.close, delaySeconds: v ?? 0 } })}
          addonAfter="giây"
          style={{ width: 130 }}
        />
      </Space>
      <Typography.Paragraph type="secondary" style={{ fontSize: 12, marginBottom: 4 }}>
        Vị trí nút X thật (random theo trọng số góc):
      </Typography.Paragraph>
      <WeightRows
        weights={value.close.positionWeights}
        order={CORNERS}
        labels={CORNER_LABELS}
        disabled={disabled}
        allowZeroTotal
        onChange={(key, v) =>
          onChange({
            ...value,
            close: { ...value.close, positionWeights: { ...value.close.positionWeights, [key]: v } },
          })
        }
      />

      <Divider orientation="left" plain style={{ margin: '16px 0 8px' }}>
        Override theo loại nội dung native (tùy chọn)
      </Divider>
      <Typography.Paragraph type="secondary" style={{ fontSize: 12, marginBottom: 8 }}>
        Ghi đè <Typography.Text code>trọng số mode pre-close</Typography.Text> theo loại nội dung của
        native ad (deep-merge lên cấu hình gốc ở trên). Bật loại nào thì loại đó dùng trọng số riêng;
        tắt thì dùng cấu hình gốc. Các field khác của giai đoạn 1/2 vẫn lấy từ cấu hình gốc.
      </Typography.Paragraph>

      {NATIVE_CONTENT_TYPES.map(type => {
        const on = !!overrides[type];
        return (
          <div key={type} style={{ marginBottom: 12 }}>
            <Space align="center">
              <Switch checked={on} disabled={disabled} onChange={v => toggleOverride(type, v)} />
              <Typography.Text strong={on}>{CONTENT_TYPE_LABELS[type]}</Typography.Text>
            </Space>
            <Typography.Paragraph
              type="secondary"
              style={{ fontSize: 12, margin: '2px 0 0 46px' }}
            >
              {CONTENT_TYPE_HINTS[type]}
            </Typography.Paragraph>
            {on && (
              <div style={{ marginLeft: 46, marginTop: 6 }}>
                <WeightRows
                  weights={overrides[type]!.preClose.modeWeights}
                  order={MODE_ORDER}
                  labels={CLOSE_MODE_LABELS}
                  disabled={disabled}
                  onChange={(key, v) => setOverrideWeight(type, key, v)}
                />
              </div>
            )}
          </div>
        );
      })}

      {error && <Alert type="error" showIcon style={{ marginTop: 12 }} message={error} />}
    </Card>
  );
}
