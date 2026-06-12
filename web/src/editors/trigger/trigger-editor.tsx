import { Card, Select, Space, Switch, Typography } from 'antd';
import { EXECUTION_ORDERS, type Trigger } from '../../../../shared/trigger-meta';
import { PaywallSection } from './paywall-section';
import { ShowAdSection } from './show-ad-section';
import { ToggleSection } from './toggle-section';

const { Text } = Typography;
const execOptions = EXECUTION_ORDERS.map(o => ({ value: o, label: o }));

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
      <Text style={{ width: 200, flexShrink: 0 }}>{label}</Text>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
}

export function TriggerEditor({
  value,
  onChange,
  adGroupOptions,
}: {
  value: Trigger;
  onChange: (t: Trigger) => void;
  adGroupOptions: string[];
}) {
  const set = (patch: Partial<Trigger>) => onChange({ ...value, ...patch });

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Card title="Cấu hình chung">
        <Row label="Thứ tự thực thi">
          <Select
            style={{ width: 220 }}
            value={value.executionOrder ?? 'ad_first'}
            options={execOptions}
            onChange={executionOrder => set({ executionOrder })}
          />
        </Row>
        <Row label="Tiếp tục nếu không có ad">
          <Switch checked={value.continueIfNoAds} onChange={continueIfNoAds => set({ continueIfNoAds })} />
        </Row>
        <Row label="Ghi log analytics">
          <Switch checked={value.log} onChange={log => set({ log })} />
        </Row>
      </Card>

      <ShowAdSection value={value.showAd} onChange={showAd => set({ showAd })} adGroupOptions={adGroupOptions} />
      <PaywallSection value={value.paywall} onChange={paywall => set({ paywall })} />
      <ToggleSection
        enableAd={value.enableAd}
        disableAd={value.disableAd}
        superwallPreload={value.superwallPreload}
        adGroupOptions={adGroupOptions}
        onChange={set}
      />
    </Space>
  );
}
