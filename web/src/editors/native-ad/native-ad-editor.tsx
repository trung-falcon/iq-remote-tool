import { Card, Space, Switch, Tooltip, Typography } from 'antd';
import { type NativeAdConfig } from '../../../../shared/native-ad-meta';
import { NativeLayoutList } from './native-layout-list';
import { NativeRandomPicker } from './native-random-picker';

const { Text } = Typography;

const TOGGLES: { key: 'showAds' | 'highEcpm' | 'preload'; label: string; hint: string }[] = [
  { key: 'showAds', label: 'Hiển thị ad', hint: 'Bật/tắt native ad ở vị trí này' },
  { key: 'highEcpm', label: 'Ưu tiên high eCPM', hint: 'Ưu tiên lấy ad giá cao' },
  { key: 'preload', label: 'Preload', hint: 'Nạp trước ad để hiển thị nhanh hơn' },
];

function Row({ label, hint, children }: { label: string; hint: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
      <Tooltip title={hint}>
        <Text style={{ width: 180, flexShrink: 0 }}>{label}</Text>
      </Tooltip>
      <div>{children}</div>
    </div>
  );
}

// Editor for one inline native ad placement (control_native_*). onChange always
// spreads `value` so unknown/passthrough fields survive the edit.
export function NativeAdEditor({
  value,
  onChange,
}: {
  value: NativeAdConfig;
  onChange: (next: NativeAdConfig) => void;
}) {
  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Card title="Cấu hình chung" size="small">
        {TOGGLES.map(t => (
          <Row key={t.key} label={t.label} hint={t.hint}>
            <Switch checked={!!value[t.key]} onChange={v => onChange({ ...value, [t.key]: v })} />
          </Row>
        ))}
      </Card>
      <Card title="Layout (chọn theo trọng số)" size="small">
        <NativeRandomPicker value={value} onChange={onChange} />
      </Card>
      <Card title="Tùy biến layout (nâng cao)" size="small">
        <NativeLayoutList value={value} onChange={onChange} />
      </Card>
    </Space>
  );
}
