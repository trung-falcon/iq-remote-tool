import { ClockCircleOutlined } from '@ant-design/icons';
import { Alert, Card, InputNumber, Typography } from 'antd';
import { PARAM_KEYS } from '../../../shared/params';
import type { ParamSummary } from '../api';
import { ParamTags } from '../components/param-tags';

type Props = {
  value: number;
  summary?: ParamSummary;
  dirty: boolean;
  error?: string;
  onChange: (value: number) => void;
};

export function TimeoutEditor({ value, summary, dirty, error, onChange }: Props) {
  return (
    <Card
      title={
        <span>
          <ClockCircleOutlined style={{ color: '#3b82f6', marginRight: 8 }} />
          Thời gian hiện nút thoát
        </span>
      }
      extra={<ParamTags summary={summary} dirty={dirty} />}
    >
      <Typography.Paragraph type="secondary" style={{ marginTop: 0 }}>
        Key: <Typography.Text code>{PARAM_KEYS.timeout}</Typography.Text> — số giây sau khi ad
        fullscreen hiển thị thì nút thoát xuất hiện.
      </Typography.Paragraph>
      <InputNumber
        min={0}
        step={1}
        value={value}
        onChange={v => onChange(v ?? 0)}
        addonAfter="giây"
        style={{ width: 160 }}
      />
      {error && <Alert type="error" showIcon style={{ marginTop: 12 }} message={error} />}
    </Card>
  );
}
