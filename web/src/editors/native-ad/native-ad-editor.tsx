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

// Editor for a native ad config (embedded per-screen). onChange always spreads
// `value` so unknown/passthrough fields survive the edit. `hideShowAds` drops the
// showAds toggle for contexts where on/off is gated elsewhere (per-screen showAd/adType).
export function NativeAdEditor({
  value,
  onChange,
  hideShowAds,
}: {
  value: NativeAdConfig;
  onChange: (next: NativeAdConfig) => void;
  hideShowAds?: boolean;
}) {
  const toggles = hideShowAds ? TOGGLES.filter(t => t.key !== 'showAds') : TOGGLES;
  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Card title="Cấu hình chung" size="small">
        {toggles.map(t => (
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
