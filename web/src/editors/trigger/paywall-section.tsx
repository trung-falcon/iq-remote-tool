import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Card, Input, InputNumber, Select, Space, Switch, Tooltip, Typography } from 'antd';
import { PAYWALL_LEGACY, type Paywall } from '../../../../shared/trigger-meta';
import { StringListInput } from '../../components/string-list-input';

const { Text } = Typography;
const legacyOptions = PAYWALL_LEGACY.map(p => ({ value: p.value, label: `${p.value} · ${p.label}` }));

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
      <Text style={{ width: 200, flexShrink: 0 }}>{label}</Text>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
}

export function PaywallSection({ value, onChange }: { value: Paywall; onChange: (p: Paywall) => void }) {
  const set = (patch: Partial<Paywall>) => onChange({ ...value, ...patch });
  const screens = value.screens ?? [];
  const setScreen = (i: number, patch: Partial<Paywall['screens'][number]>) =>
    set({ screens: screens.map((s, j) => (j === i ? { ...s, ...patch } : s)) });

  return (
    <Card
      title={
        <Space>
          <Switch checked={value.active} onChange={active => set({ active })} />
          <span>Paywall</span>
        </Space>
      }
    >
      <div style={{ opacity: value.active ? 1 : 0.5, pointerEvents: value.active ? 'auto' : 'none' }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          Màn paywall hiển thị xoay vòng theo thứ tự (legacy lưu dạng số 0–5):
        </Text>
        <div style={{ margin: '8px 0' }}>
          {screens.map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
              <Text type="secondary" style={{ width: 24 }}>{i + 1}.</Text>
              <Select
                style={{ width: 200 }}
                value={s.legacy}
                options={legacyOptions}
                onChange={legacy => setScreen(i, { legacy })}
              />
              <Input
                style={{ flex: 1 }}
                placeholder="superwall placement (tùy chọn)"
                value={s.superwall}
                onChange={e => setScreen(i, { superwall: e.target.value || undefined })}
              />
              <Tooltip title="Xóa màn">
                <Button
                  size="small"
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => set({ screens: screens.filter((_, j) => j !== i) })}
                />
              </Tooltip>
            </div>
          ))}
          <Button
            block
            type="dashed"
            icon={<PlusOutlined />}
            onClick={() => set({ screens: [...screens, { legacy: 0 }] })}
          >
            Thêm màn paywall
          </Button>
        </div>

        <Row label="Cooldown (ms)">
          <InputNumber
            min={0}
            step={1000}
            style={{ width: 200 }}
            placeholder="(không đặt)"
            value={value.cooldownTime}
            onChange={v => set({ cooldownTime: v ?? undefined })}
          />
        </Row>
        <Row label="Bỏ qua sau N lần">
          <InputNumber
            min={0}
            style={{ width: 200 }}
            placeholder="(không đặt)"
            value={value.skipAfterNShows}
            onChange={v => set({ skipAfterNShows: v ?? undefined })}
          />
        </Row>
        <Row label="Chu kỳ xoay (swapAfterNS)">
          <StringListInput
            numeric
            placeholder="vd: 2, 3"
            value={value.swapAfterNS}
            onChange={swapAfterNS => set({ swapAfterNS: swapAfterNS as number[] | undefined })}
          />
        </Row>
      </div>
    </Card>
  );
}
