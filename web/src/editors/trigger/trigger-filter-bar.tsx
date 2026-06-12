import {
  CloudDownloadOutlined,
  CrownOutlined,
  FilterOutlined,
  MinusCircleOutlined,
  PlayCircleOutlined,
  PlusCircleOutlined,
} from '@ant-design/icons';
import { Button, Space, Typography } from 'antd';
import { type Trigger } from '../../../../shared/trigger-meta';

export const TRIGGER_FACETS = [
  { key: 'showAd', label: 'Show ads', icon: <PlayCircleOutlined /> },
  { key: 'paywall', label: 'Paywall', icon: <CrownOutlined /> },
  { key: 'enableAd', label: 'Enable ad', icon: <PlusCircleOutlined /> },
  { key: 'disableAd', label: 'Disable ad', icon: <MinusCircleOutlined /> },
  { key: 'superwallPreload', label: 'Preload', icon: <CloudDownloadOutlined /> },
] as const;

// Which features a trigger configures — drives the list facet filter.
export function computeFacets(t: Trigger): string[] {
  const f: string[] = [];
  if (t.showAd?.active) f.push('showAd');
  if (t.paywall?.active) f.push('paywall');
  if (t.enableAd?.length) f.push('enableAd');
  if (t.disableAd?.ads?.length) f.push('disableAd');
  if (t.superwallPreload?.length) f.push('superwallPreload');
  return f;
}

// Toggle-button facets (filled = active). A trigger must match ALL active ones (AND).
export function TriggerFilterBar({
  value,
  onChange,
}: {
  value: string[];
  onChange: (next: string[]) => void;
}) {
  return (
    <Space size={[4, 4]} wrap style={{ marginBottom: 10 }}>
      <Typography.Text type="secondary" style={{ fontSize: 12, marginRight: 2 }}>
        <FilterOutlined /> Lọc:
      </Typography.Text>
      {TRIGGER_FACETS.map(f => {
        const active = value.includes(f.key);
        return (
          <Button
            key={f.key}
            size="small"
            icon={f.icon}
            type={active ? 'primary' : 'default'}
            onClick={() => onChange(active ? value.filter(k => k !== f.key) : [...value, f.key])}
          >
            {f.label}
          </Button>
        );
      })}
      {value.length > 0 && (
        <Button size="small" type="link" onClick={() => onChange([])}>
          Xóa lọc
        </Button>
      )}
    </Space>
  );
}
