import { InputNumber, Space, Typography } from 'antd';
import { LAYOUT_NAMES, type NativeAdConfig } from '../../../../shared/native-ad-meta';
import { LayoutThumb } from './layout-thumb';

const { Text } = Typography;

// App reads up to 3 weights; normalize to a fixed triple for the editor.
const toTriple = (r?: number[]): number[] => [r?.[0] ?? 0, r?.[1] ?? 0, r?.[2] ?? 0];

// Weighted layout picker: 3 cards (thumbnail + name + weight). The app picks one
// layout at random proportional to these weights (InlineNativeAd.tsx).
export function NativeRandomPicker({
  value,
  onChange,
}: {
  value: NativeAdConfig;
  onChange: (next: NativeAdConfig) => void;
}) {
  const weights = toTriple(value.random);
  const total = weights.reduce((a, b) => a + b, 0);
  const setWeight = (i: number, w: number) => {
    const next = [...weights];
    next[i] = Number.isFinite(w) ? Math.max(0, w) : 0;
    onChange({ ...value, random: next });
  };

  return (
    <div>
      <Text type="secondary" style={{ fontSize: 12 }}>
        App bốc ngẫu nhiên 1 layout theo tỉ lệ trọng số. Để 0 hết hoặc bỏ trống → mặc định Layout 2.
      </Text>
      <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
        {[0, 1, 2].map(i => {
          const active = weights[i] > 0;
          const pct = total > 0 ? Math.round((weights[i] / total) * 100) : 0;
          return (
            <div
              key={i}
              style={{
                flex: 1,
                border: `1px solid ${active ? '#3b82f6' : '#1e2536'}`,
                borderRadius: 10,
                padding: 8,
                background: active ? 'rgba(59,130,246,0.08)' : 'transparent',
              }}
            >
              <LayoutThumb idx={(i + 3) as 3 | 4 | 5} />
              <div style={{ marginTop: 8, textAlign: 'center' }}>
                <Text style={{ fontSize: 12, fontWeight: 600 }}>{`Layout ${i + 1}`}</Text>
                <div style={{ fontSize: 10, color: '#64748b', fontFamily: 'monospace' }}>{LAYOUT_NAMES[i]}</div>
              </div>
              <Space style={{ width: '100%', justifyContent: 'center', marginTop: 6 }} size={6}>
                <InputNumber
                  size="small"
                  min={0}
                  value={weights[i]}
                  onChange={v => setWeight(i, Number(v ?? 0))}
                  style={{ width: 68 }}
                />
                <Text type="secondary" style={{ fontSize: 11 }}>
                  {total > 0 ? `${pct}%` : '—'}
                </Text>
              </Space>
            </div>
          );
        })}
      </div>
    </div>
  );
}
