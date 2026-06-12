import { Alert, Card, InputNumber, Space, Switch, Typography } from 'antd';
import { ADS_FIELD_LABELS, type AdsRemoteConfig } from '../../../../shared/ads-wf-meta';

const { Text } = Typography;
const NUM_FIELDS: (keyof AdsRemoteConfig)[] = [
  'coolDownTime',
  'loadInterval',
  'maxRetryNumber',
  'maxTimeReload',
  'continueReloadAfter',
  'x',
  'y',
];

export function AdsConfigFields({
  value,
  onChange,
}: {
  value: AdsRemoteConfig;
  onChange: (v: AdsRemoteConfig) => void;
}) {
  const set = (patch: Partial<AdsRemoteConfig>) => onChange({ ...value, ...patch });
  const bothOff = !value.enableAdmob && !value.enableMax;

  return (
    <Card title="Cấu hình waterfall" size="small">
      <Space size={24} style={{ marginBottom: 12 }}>
        <Space size={8}>
          <Switch checked={value.enableAdmob} onChange={enableAdmob => set({ enableAdmob })} />
          <Text>{ADS_FIELD_LABELS.enableAdmob}</Text>
        </Space>
        <Space size={8}>
          <Switch checked={value.enableMax} onChange={enableMax => set({ enableMax })} />
          <Text>{ADS_FIELD_LABELS.enableMax}</Text>
        </Space>
      </Space>

      {bothOff && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 12 }}
          message="Cả AdMob và MAX đều tắt → không network nào chạy waterfall"
        />
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        {NUM_FIELDS.map(f => (
          <div key={f} style={{ width: 220 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>{ADS_FIELD_LABELS[f]}</Text>
            <InputNumber
              min={0}
              style={{ width: '100%' }}
              value={value[f] as number}
              onChange={v => set({ [f]: v ?? 0 } as Partial<AdsRemoteConfig>)}
            />
          </div>
        ))}
      </div>
    </Card>
  );
}
