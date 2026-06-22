import { AutoComplete, Card, Divider, Input, InputNumber, Select, Space, Switch, Typography } from 'antd';
import { ADS_TYPES, MEDIATIONS, type AdsType, type ShowAd } from '../../../../shared/trigger-meta';

const { Text } = Typography;

// Ad group input with suggestions from the Ads Waterfall (groupName/name), still free-text.
function AdGroupInput({
  value,
  options,
  onChange,
}: {
  value?: string;
  options: string[];
  onChange: (v?: string) => void;
}) {
  return (
    <AutoComplete
      style={{ width: 280 }}
      allowClear
      value={value}
      options={options.map(o => ({ value: o }))}
      placeholder="(không đặt) — gợi ý từ Ads Waterfall"
      filterOption={(i, o) => (o?.value ?? '').toLowerCase().includes(i.toLowerCase())}
      onChange={v => onChange(v || undefined)}
    />
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
      <div style={{ width: 200, flexShrink: 0 }}>
        <Text>{label}</Text>
        {hint && (
          <div>
            <Text type="secondary" style={{ fontSize: 11 }}>{hint}</Text>
          </div>
        )}
      </div>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
}

function AdsTypeSelect({
  value,
  onChange,
}: {
  value: AdsType | AdsType[];
  onChange: (v: AdsType | AdsType[]) => void;
}) {
  const arr = Array.isArray(value) ? value : value ? [value] : [];
  return (
    <Select
      mode="multiple"
      style={{ width: '100%' }}
      placeholder="reward / inter / native …"
      value={arr}
      options={ADS_TYPES.map(a => ({ value: a, label: a }))}
      onChange={(v: AdsType[]) => onChange(v.length === 1 ? v[0] : v)}
    />
  );
}

const mediationOptions = MEDIATIONS.map(m => ({ value: m, label: m }));

export function ShowAdSection({
  value,
  onChange,
  adGroupOptions,
}: {
  value: ShowAd;
  onChange: (s: ShowAd) => void;
  adGroupOptions: string[];
}) {
  const set = (patch: Partial<ShowAd>) => onChange({ ...value, ...patch });
  const aa = value.adAfterAd;
  const setAA = (patch: Partial<NonNullable<ShowAd['adAfterAd']>>) =>
    set({ adAfterAd: { adsType: 'native', ...aa, ...patch, active: true } });

  return (
    <Card
      title={
        <Space>
          <Switch checked={value.active} onChange={active => set({ active })} />
          <span>Hiện quảng cáo (showAd)</span>
        </Space>
      }
    >
      <div style={{ opacity: value.active ? 1 : 0.5, pointerEvents: value.active ? 'auto' : 'none' }}>
        <Row label="Loại ads" hint="1 loại → string; nhiều → mảng">
          <AdsTypeSelect value={value.adsType} onChange={adsType => set({ adsType })} />
        </Row>
        <Row label="Mediation">
          <Select
            allowClear
            style={{ width: 200 }}
            placeholder="(kế thừa)"
            value={value.mediation}
            options={mediationOptions}
            onChange={mediation => set({ mediation })}
          />
        </Row>
        <Row label="Ad group" hint="vd: onboard_1">
          <AdGroupInput
            value={value.adsGroup}
            options={adGroupOptions}
            onChange={adsGroup => set({ adsGroup })}
          />
        </Row>
        <Row label="Chờ high-floor (ms)">
          <InputNumber
            min={0}
            step={100}
            value={value.timeAwaitHighBeforeShow}
            onChange={v => set({ timeAwaitHighBeforeShow: v ?? 0 })}
          />
        </Row>
        <Row label="Bỏ qua cooldown">
          <Switch checked={!!value.skipCoolDownTime} onChange={v => set({ skipCoolDownTime: v })} />
        </Row>
        <Row label="Cập nhật lastShow">
          <Switch checked={!!value.updateToLastShow} onChange={v => set({ updateToLastShow: v })} />
        </Row>
        <Row label="Mở paywall sau ads">
          <Switch checked={!!value.purchaseAfterAds} onChange={v => set({ purchaseAfterAds: v })} />
        </Row>

        <Divider orientation="left" plain style={{ margin: '8px 0' }}>
          <Space>
            <Switch
              checked={!!aa?.active}
              onChange={on => set({ adAfterAd: on ? { adsType: 'native', ...aa, active: true } : undefined })}
            />
            <Text>Ad nối tiếp (adAfterAd)</Text>
          </Space>
        </Divider>
        {aa?.active && (
          <div style={{ paddingLeft: 8 }}>
            <Row label="Loại ads (ad-2)">
              <AdsTypeSelect value={aa.adsType} onChange={adsType => setAA({ adsType })} />
            </Row>
            <Row label="Mediation (ad-2)">
              <Select
                allowClear
                style={{ width: 200 }}
                placeholder="(kế thừa)"
                value={aa.mediation}
                options={mediationOptions}
                onChange={mediation => setAA({ mediation })}
              />
            </Row>
            <Row label="Ad group (ad-2)">
              <AdGroupInput
                value={aa.adsGroup}
                options={adGroupOptions}
                onChange={adsGroup => setAA({ adsGroup })}
              />
            </Row>
            <Row label="Preload khi ad-1 mở">
              <Switch checked={!!aa.loadOnPrevAdOpen} onChange={v => setAA({ loadOnPrevAdOpen: v })} />
            </Row>
          </div>
        )}
      </div>
    </Card>
  );
}
