import { CloseCircleOutlined } from '@ant-design/icons';
import { Alert, Card, Divider, InputNumber, Space, Switch, Typography } from 'antd';
import { CLOSE_MODE_LABELS, CORNER_LABELS, CORNERS, PARAM_KEYS } from '../../../shared/params';
import type { CloseConfig } from '../../../shared/schemas';
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

      {error && <Alert type="error" showIcon style={{ marginTop: 12 }} message={error} />}
    </Card>
  );
}
