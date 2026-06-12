import { AppstoreOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Input, Popconfirm, Tag, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { isCanonicalLayout, LAYOUTS, PARAM_KEYS } from '../../../shared/params';
import type { LayoutWeights } from '../../../shared/schemas';
import type { ParamSummary } from '../api';
import { ParamTags } from '../components/param-tags';
import { WeightRows } from './weight-rows';

const NAME_PATTERN = /^[a-z0-9_]+$/;
const LAYOUT_WARN = 'Native không nhận tên layout này → sẽ fallback về media_full. Nên đổi sang media_full.';

// Canonical layouts first (fixed order), then any extra/non-canonical keys present.
const layoutOrder = (map: Record<string, number>): string[] => [
  ...LAYOUTS,
  ...Object.keys(map).filter(k => !isCanonicalLayout(k)),
];

type Props = {
  value: LayoutWeights;
  summary?: ParamSummary;
  dirty: boolean;
  error?: string;
  onChange: (next: LayoutWeights) => void;
};

// Editable event-name input; commits rename on blur/Enter, reverts when the
// new name is empty, "default", or collides with an existing event.
function EventNameInput({
  name,
  taken,
  onRename,
}: {
  name: string;
  taken: (n: string) => boolean;
  onRename: (newName: string) => void;
}) {
  const [local, setLocal] = useState(name);
  useEffect(() => setLocal(name), [name]);
  const softWarn = local !== '' && !NAME_PATTERN.test(local);

  const commit = () => {
    const next = local.trim();
    if (next === name) return;
    if (!next || next === 'default' || taken(next)) {
      setLocal(name);
      return;
    }
    onRename(next);
  };

  return (
    <div style={{ padding: '4px 0' }}>
      <Input
        size="small"
        value={local}
        onChange={e => setLocal(e.target.value)}
        onBlur={commit}
        onPressEnter={e => (e.target as HTMLInputElement).blur()}
        placeholder="tên event (vd: native_enter_game)"
        status={softWarn ? 'warning' : undefined}
        style={{ width: 240, fontFamily: 'monospace' }}
      />
      {softWarn && (
        <Typography.Text type="warning" style={{ fontSize: 11, display: 'block' }}>
          Nên dùng chữ thường / số / dấu gạch dưới
        </Typography.Text>
      )}
    </div>
  );
}

export function LayoutWeightsEditor({ value, summary, dirty, error, onChange }: Props) {
  const events = Object.keys(value);
  const unknownNames = [
    ...new Set(
      events.flatMap(e => Object.keys(value[e])).filter(k => !isCanonicalLayout(k)),
    ),
  ];

  const setWeight = (event: string, layout: string, weight: number) =>
    onChange({ ...value, [event]: { ...value[event], [layout]: weight } });

  const removeLayout = (event: string, layout: string) => {
    const map = { ...value[event] };
    delete map[layout];
    onChange({ ...value, [event]: map });
  };

  const rename = (oldName: string, newName: string) => {
    const next: LayoutWeights = {};
    for (const [k, v] of Object.entries(value)) next[k === oldName ? newName : k] = v;
    onChange(next);
  };

  const remove = (event: string) => {
    const next = { ...value };
    delete next[event];
    onChange(next);
  };

  const add = () => {
    let suffix = 1;
    let name = 'new_event';
    while (value[name]) name = `new_event_${++suffix}`;
    onChange({ ...value, [name]: { ...value.default } });
  };

  return (
    <Card
      title={
        <span>
          <AppstoreOutlined style={{ color: '#3b82f6', marginRight: 8 }} />
          Trọng số chọn layout
        </span>
      }
      extra={<ParamTags summary={summary} dirty={dirty} />}
    >
      <Typography.Paragraph type="secondary" style={{ marginTop: 0 }}>
        Key: <Typography.Text code>{PARAM_KEYS.layoutWeights}</Typography.Text> — app chọn layout
        random theo trọng số. <Typography.Text strong>default</Typography.Text> áp dụng cho mọi
        event, có thể override riêng cho từng trigger event.
      </Typography.Paragraph>

      {unknownNames.length > 0 && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 12 }}
          message={`Tên layout không chuẩn: ${unknownNames.join(', ')}`}
          description={LAYOUT_WARN}
        />
      )}

      {events.map(event => (
        <Card
          key={event}
          size="small"
          type="inner"
          style={{ marginBottom: 12 }}
          title={
            event === 'default' ? (
              <Tag color="blue">default — áp dụng chung (bắt buộc)</Tag>
            ) : (
              <EventNameInput
                name={event}
                taken={n => n in value}
                onRename={newName => rename(event, newName)}
              />
            )
          }
          extra={
            event !== 'default' && (
              <Popconfirm title="Xóa override này?" onConfirm={() => remove(event)}>
                <Button size="small" danger type="text" icon={<DeleteOutlined />} />
              </Popconfirm>
            )
          }
        >
          <WeightRows
            weights={value[event]}
            order={layoutOrder(value[event])}
            warnKeys={new Set(Object.keys(value[event]).filter(k => !isCanonicalLayout(k)))}
            warnTooltip={LAYOUT_WARN}
            onRemoveKey={layout => removeLayout(event, layout)}
            onChange={(layout, w) => setWeight(event, layout, w)}
          />
        </Card>
      ))}

      <Button block type="dashed" icon={<PlusOutlined />} onClick={add}>
        Thêm override theo event
      </Button>

      {error && <Alert type="error" showIcon style={{ marginTop: 12 }} message={error} />}
    </Card>
  );
}
