import { DeleteOutlined, WarningOutlined } from '@ant-design/icons';
import { Button, InputNumber, Slider, Tag, Tooltip, Typography } from 'antd';

type Props = {
  weights: Record<string, number>;
  // Render order + which rows to show (defaults to the map's own keys).
  order?: readonly string[];
  labels?: Record<string, string>;
  disabled?: boolean;
  // positionWeights: all-zero is valid (native falls back to TR) → no error hint.
  allowZeroTotal?: boolean;
  // Keys to flag with a warning (e.g. non-canonical layout names).
  warnKeys?: ReadonlySet<string>;
  warnTooltip?: string;
  // When provided, warn keys get a remove button.
  onRemoveKey?: (key: string) => void;
  onChange: (key: string, value: number) => void;
};

// Reusable weighted-random editor rows: label + slider + number + normalized %.
export function WeightRows({
  weights,
  order,
  labels,
  disabled,
  allowZeroTotal,
  warnKeys,
  warnTooltip,
  onRemoveKey,
  onChange,
}: Props) {
  const keys = order ?? Object.keys(weights);
  const total = keys.reduce((sum, k) => sum + (weights[k] ?? 0), 0);

  return (
    <div>
      {keys.map(key => {
        const value = weights[key] ?? 0;
        const percent = total > 0 ? Math.round((value / total) * 1000) / 10 : 0;
        const warn = warnKeys?.has(key);
        return (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Typography.Text
              style={{ width: 150 }}
              ellipsis={{ tooltip: true }}
              type={warn ? 'warning' : undefined}
            >
              {warn && (
                <Tooltip title={warnTooltip}>
                  <WarningOutlined style={{ marginRight: 4 }} />
                </Tooltip>
              )}
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
              style={{ width: 64 }}
              value={value}
              disabled={disabled}
              onChange={v => onChange(key, v ?? 0)}
            />
            <Tag color={value > 0 ? 'blue' : 'default'} style={{ width: 56, textAlign: 'center', marginRight: 0 }}>
              {percent}%
            </Tag>
            {warn && onRemoveKey ? (
              <Tooltip title="Xóa layout không chuẩn này">
                <Button
                  size="small"
                  type="text"
                  danger
                  disabled={disabled}
                  icon={<DeleteOutlined />}
                  onClick={() => onRemoveKey(key)}
                />
              </Tooltip>
            ) : (
              <span style={{ width: 24 }} />
            )}
          </div>
        );
      })}
      {total === 0 && !disabled && !allowZeroTotal && (
        <Typography.Text type="danger" style={{ fontSize: 12 }}>
          Tổng trọng số phải &gt; 0 (ít nhất một dòng &gt; 0)
        </Typography.Text>
      )}
      {total === 0 && allowZeroTotal && (
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          Tất cả 0 → native mặc định góc trên-phải (TR)
        </Typography.Text>
      )}
    </div>
  );
}
