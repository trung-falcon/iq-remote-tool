import { DeleteOutlined, PlusOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { Alert, Button, Card, InputNumber, Space, Switch, Tag, Typography } from 'antd';
import {
  DEFAULT_ADAPTIVE_COOLDOWN,
  type AdaptiveCooldownConfig,
  type AdsRemoteConfig,
  type CooldownTier,
} from '../../../../shared/ads-wf-meta';

const { Text } = Typography;

const fmtSeconds = (ms: number) => `${Math.round((ms / 1000) * 10) / 10}s`;

type Props = {
  value: AdsRemoteConfig;
  onChange: (v: AdsRemoteConfig) => void;
};

// Editor for ads_wf_config.adaptiveCooldown: tiers of (minAdsShown → cooldownMs).
// The app picks the highest tier whose minAdsShown <= lifetime ads shown, so more
// ads → shorter cooldown. Off/empty → app uses the flat coolDownTime above.
export function AdaptiveCooldownEditor({ value, onChange }: Props) {
  const ac = value.adaptiveCooldown;
  const enabled = !!ac?.enabled;
  const tiers = ac?.tiers ?? [];

  const setAC = (next?: AdaptiveCooldownConfig) => onChange({ ...value, adaptiveCooldown: next });

  const toggle = (on: boolean) => {
    if (on) setAC({ enabled: true, tiers: tiers.length ? tiers : DEFAULT_ADAPTIVE_COOLDOWN.tiers });
    else if (ac) setAC({ ...ac, enabled: false });
  };

  const updateTiers = (fn: (t: CooldownTier[]) => CooldownTier[]) =>
    setAC({ enabled: true, ...ac, tiers: fn(tiers) });

  const setTier = (i: number, patch: Partial<CooldownTier>) =>
    updateTiers(ts => ts.map((t, idx) => (idx === i ? { ...t, ...patch } : t)));

  const addTier = () =>
    updateTiers(ts => {
      const last = ts[ts.length - 1];
      return [
        ...ts,
        { minAdsShown: last ? last.minAdsShown + 10 : 0, cooldownMs: last?.cooldownMs ?? value.coolDownTime },
      ];
    });

  const removeTier = (i: number) => updateTiers(ts => ts.filter((_, idx) => idx !== i));

  // Mirror the app's selection: sort by minAdsShown, keep valid tiers (cooldownMs > 0).
  const sortedValid = [...tiers]
    .filter(t => Number.isFinite(t.minAdsShown) && t.cooldownMs > 0)
    .sort((a, b) => a.minAdsShown - b.minAdsShown);

  return (
    <Card
      size="small"
      style={{ marginTop: 12 }}
      title={
        <Space>
          <ThunderboltOutlined style={{ color: '#3b82f6' }} />
          <span>Adaptive cooldown</span>
        </Space>
      }
      extra={
        <Space size={8}>
          <Switch checked={enabled} onChange={toggle} />
          <Text type="secondary">{enabled ? 'Bật' : 'Tắt'}</Text>
        </Space>
      }
    >
      <Typography.Paragraph type="secondary" style={{ fontSize: 12, marginTop: 0 }}>
        Cooldown giảm dần theo <b>tổng số ad mandatory đã show (lifetime)</b>: app chọn tier cao
        nhất có <Text code>minAdsShown ≤ tổng đã show</Text> rồi dùng <Text code>cooldownMs</Text>{' '}
        của tier đó. Tắt / không có tier hợp lệ → dùng <Text code>coolDownTime</Text> phẳng ở trên.
      </Typography.Paragraph>

      {!enabled ? (
        <Text type="secondary" style={{ fontSize: 12 }}>
          Đang dùng cooldown cố định ({value.coolDownTime} ms = {fmtSeconds(value.coolDownTime)}). Bật
          để cấu hình theo tier.
        </Text>
      ) : (
        <>
          {tiers.map((tier, i) => (
            <Space key={i} align="center" style={{ display: 'flex', marginBottom: 8 }}>
              <Text type="secondary" style={{ fontSize: 12, width: 60 }}>
                Từ
              </Text>
              <InputNumber
                min={0}
                step={1}
                value={tier.minAdsShown}
                onChange={v => setTier(i, { minAdsShown: v ?? 0 })}
                addonAfter="ad"
                style={{ width: 140 }}
              />
              <Text type="secondary" style={{ fontSize: 12 }}>
                → cooldown
              </Text>
              <InputNumber
                min={0}
                step={1000}
                value={tier.cooldownMs}
                onChange={v => setTier(i, { cooldownMs: v ?? 0 })}
                addonAfter="ms"
                style={{ width: 160 }}
              />
              <Tag color={tier.cooldownMs > 0 ? 'blue' : 'default'} style={{ marginRight: 0 }}>
                {fmtSeconds(tier.cooldownMs)}
              </Tag>
              <Button
                size="small"
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={() => removeTier(i)}
              />
            </Space>
          ))}

          <Button icon={<PlusOutlined />} onClick={addTier} size="small" style={{ marginTop: 4 }}>
            Thêm tier
          </Button>

          {enabled && sortedValid.length === 0 && (
            <Alert
              type="warning"
              showIcon
              style={{ marginTop: 12 }}
              message="Chưa có tier hợp lệ (cooldownMs > 0) — app sẽ fallback về coolDownTime."
            />
          )}

          {sortedValid.length > 0 && (
            <Text type="secondary" style={{ display: 'block', marginTop: 12, fontSize: 12 }}>
              Thứ tự áp dụng (app tự sắp xếp tăng dần):{' '}
              {sortedValid
                .map(t => `≥${t.minAdsShown} ad → ${fmtSeconds(t.cooldownMs)}`)
                .join('  ·  ')}
            </Text>
          )}
        </>
      )}
    </Card>
  );
}
