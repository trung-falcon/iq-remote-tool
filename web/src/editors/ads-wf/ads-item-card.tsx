import { Input, InputNumber, Select, Space, Switch, Typography } from 'antd';
import { type AdsItem } from '../../../../shared/ads-wf-meta';
import { ADS_TYPES, MEDIATIONS } from '../../../../shared/trigger-meta';

const { Text } = Typography;
const typeOptions = ADS_TYPES.map(t => ({ value: t, label: t }));
const mediationOptions = MEDIATIONS.map(m => ({ value: m, label: m }));

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
      <Text style={{ width: 120, flexShrink: 0 }} type="secondary">{label}</Text>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
}

const FLAGS: { key: keyof AdsItem; label: string }[] = [
  { key: 'isHigh', label: 'isHigh (ưu tiên)' },
  { key: 'isHighFloor', label: 'isHighFloor (cao nhất)' },
  { key: 'disabled', label: 'disabled (tắt tạm)' },
  { key: 'isPermanentlyStopped', label: 'permanently stopped' },
];

// Editor body for one AdsItem. Optional fields set to `undefined` when off/empty
// so JSON.stringify omits them — keeps items minimal and round-trips originals.
export function AdsItemFields({ value, onChange }: { value: AdsItem; onChange: (v: AdsItem) => void }) {
  const set = (patch: Partial<AdsItem>) => onChange({ ...value, ...patch });

  return (
    <div>
      <Row label="Type / Mediation">
        <Space>
          <Select style={{ width: 130 }} value={value.type} options={typeOptions} onChange={type => set({ type })} />
          <Select style={{ width: 110 }} value={value.mediation} options={mediationOptions} onChange={mediation => set({ mediation })} />
        </Space>
      </Row>
      <Row label="Name">
        <Input value={value.name} placeholder="vd: inters_feature" onChange={e => set({ name: e.target.value })} />
      </Row>
      <Row label="Ad unit ID">
        <Input
          value={value.id}
          placeholder="ca-app-pub-…/…"
          style={{ fontFamily: 'monospace' }}
          status={value.id.trim() ? undefined : 'error'}
          onChange={e => set({ id: e.target.value })}
        />
      </Row>
      <Row label="Group name">
        <Input
          value={value.groupName}
          placeholder="(không nhóm) — khớp adsGroup của trigger"
          onChange={e => set({ groupName: e.target.value || undefined })}
        />
      </Row>
      <Row label="Flags">
        <Space size={16} wrap>
          {FLAGS.map(f => (
            <Space key={f.key} size={6}>
              <Switch
                size="small"
                checked={!!value[f.key]}
                onChange={on => set({ [f.key]: on ? true : undefined } as Partial<AdsItem>)}
              />
              <Text style={{ fontSize: 12 }}>{f.label}</Text>
            </Space>
          ))}
        </Space>
      </Row>
      <Row label="Retry override">
        <Space>
          <InputNumber
            min={0}
            placeholder="maxRetry (kế thừa)"
            style={{ width: 150 }}
            value={value.maxRetryNumber}
            onChange={v => set({ maxRetryNumber: v ?? undefined })}
          />
          <InputNumber
            min={0}
            placeholder="maxTimeReload (kế thừa)"
            style={{ width: 180 }}
            value={value.maxTimeReload}
            onChange={v => set({ maxTimeReload: v ?? undefined })}
          />
        </Space>
      </Row>
    </div>
  );
}
