import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Collapse, InputNumber, Segmented, Select, Space, Switch, Tooltip, Typography } from 'antd';
import {
  CUSTOM_LAYOUT_TOGGLES,
  LAYOUT_IDS,
  LAYOUT_NAMES,
  type NativeAdConfig,
  type NativeAdLayout,
  type NativeAdLayoutConfig,
} from '../../../../shared/native-ad-meta';

const { Text } = Typography;

const layoutLabel = (id: number): string => {
  const i = (LAYOUT_IDS as readonly number[]).indexOf(id);
  return i >= 0 ? `${id} · ${LAYOUT_NAMES[i]}` : String(id);
};

// Advanced per-layout appearance overrides (`layout[]`). Usually empty — collapsed
// by default. Each entry tweaks one layout id; unset = layout's built-in look.
export function NativeLayoutList({
  value,
  onChange,
}: {
  value: NativeAdConfig;
  onChange: (next: NativeAdConfig) => void;
}) {
  const layout = value.layout ?? [];
  const setLayout = (next: NativeAdLayout[]) => onChange({ ...value, layout: next });
  const updateItem = (idx: number, patch: Partial<NativeAdLayout>) =>
    setLayout(layout.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  const updateCustom = (idx: number, patch: Partial<NativeAdLayoutConfig>) =>
    updateItem(idx, { customLayout: { ...layout[idx].customLayout, ...patch } });

  const items = layout.map((it, idx) => ({
    key: String(idx),
    label: `Override layout ${layoutLabel(it.id)}`,
    extra: (
      <DeleteOutlined
        style={{ color: '#ef4444' }}
        onClick={e => {
          e.stopPropagation();
          setLayout(layout.filter((_, i) => i !== idx));
        }}
      />
    ),
    children: (
      <Space direction="vertical" size={10} style={{ width: '100%' }}>
        <Space>
          <Text style={{ fontSize: 12 }}>Áp dụng cho</Text>
          <Select
            size="small"
            style={{ width: 210 }}
            value={it.id}
            options={LAYOUT_IDS.map(id => ({ value: id, label: layoutLabel(id) }))}
            onChange={id => updateItem(idx, { id })}
          />
        </Space>
        <Space wrap size={[16, 8]}>
          {CUSTOM_LAYOUT_TOGGLES.map(t => (
            <Tooltip key={t.key} title={t.hint}>
              <Space size={4}>
                <Switch
                  size="small"
                  checked={!!it.customLayout[t.key]}
                  onChange={v => updateCustom(idx, { [t.key]: v })}
                />
                <Text style={{ fontSize: 12 }}>{t.label}</Text>
              </Space>
            </Tooltip>
          ))}
        </Space>
        <Space wrap>
          <Text style={{ fontSize: 12 }}>space</Text>
          <InputNumber
            size="small"
            value={it.customLayout.space}
            onChange={v => updateCustom(idx, { space: v == null ? undefined : Number(v) })}
          />
          <Text style={{ fontSize: 12, marginLeft: 8 }}>Nút CTA</Text>
          <Segmented
            size="small"
            value={it.customLayout.callToActionStyle ?? 'fill'}
            options={['fill', 'stroke']}
            onChange={v => updateCustom(idx, { callToActionStyle: v as 'fill' | 'stroke' })}
          />
        </Space>
      </Space>
    ),
  }));

  return (
    <div>
      <Text type="secondary" style={{ fontSize: 12 }}>
        Tùy biến giao diện từng layout. Bỏ trống = dùng giao diện mặc định của layout.
      </Text>
      {items.length > 0 && <Collapse size="small" items={items} style={{ marginTop: 8 }} />}
      <Button
        size="small"
        icon={<PlusOutlined />}
        onClick={() => setLayout([...layout, { id: 4, customLayout: {} }])}
        style={{ marginTop: 8 }}
      >
        Thêm override layout
      </Button>
    </div>
  );
}
