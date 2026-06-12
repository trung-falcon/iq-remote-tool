import { InputNumber, Slider, Tag, Typography } from 'antd';

type Props = {
  weights: Record<string, number>;
  // Render order + which rows to show (defaults to the map's own keys).
  order?: readonly string[];
  labels?: Record<string, string>;
  disabled?: boolean;
  onChange: (key: string, value: number) => void;
};

// Reusable weighted-random editor rows: label + slider + number + normalized %.
export function WeightRows({ weights, order, labels, disabled, onChange }: Props) {
  const keys = order ?? Object.keys(weights);
  const total = keys.reduce((sum, k) => sum + (weights[k] ?? 0), 0);

  return (
    <div>
      {keys.map(key => {
        const value = weights[key] ?? 0;
        const percent = total > 0 ? Math.round((value / total) * 1000) / 10 : 0;
        return (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
            <Typography.Text style={{ width: 140 }} ellipsis={{ tooltip: true }}>
              {labels?.[key] ?? key}
            </Typography.Text>
            <Slider
              style={{ flex: 1, margin: '8px 0' }}
              min={0}
              max={100}
              value={value}
              disabled={disabled}
              onChange={v => onChange(key, v)}
            />
            <InputNumber
              min={0}
              size="small"
              style={{ width: 70 }}
              value={value}
              disabled={disabled}
              onChange={v => onChange(key, v ?? 0)}
            />
            <Tag color={value > 0 ? 'blue' : 'default'} style={{ width: 64, textAlign: 'center', marginRight: 0 }}>
              {percent}%
            </Tag>
          </div>
        );
      })}
      {total === 0 && !disabled && (
        <Typography.Text type="danger" style={{ fontSize: 12 }}>
          Tổng trọng số phải &gt; 0 (ít nhất một dòng &gt; 0)
        </Typography.Text>
      )}
    </div>
  );
}
