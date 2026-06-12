import { CodeOutlined, PlusOutlined } from '@ant-design/icons';
import { AutoComplete, Button, Card, Col, Empty, Input, List, Row, Space, Tag, Typography } from 'antd';
import { useMemo, useState } from 'react';
import { eventFromKey, TRIGGER_EVENTS, triggerKeyFor } from '../../../shared/trigger-meta';
import type { ParamSummary } from '../api';
import { JsonPreview } from '../components/json-preview';
import { PublishBar } from '../components/publish-bar';
import { TriggerEditor } from '../editors/trigger/trigger-editor';
import { usePublishFlow } from '../hooks/use-publish-flow';
import { useTriggerDrafts } from '../hooks/use-trigger-drafts';

type Props = {
  triggers: Record<string, ParamSummary>;
  etag: string | null;
  reload: () => Promise<void> | void;
};

export function TriggersPage({ triggers, etag, reload }: Props) {
  const tg = useTriggerDrafts(triggers);
  const flow = usePublishFlow({ etag, changes: tg.changes, getSummary: k => triggers[k], reload });
  const [filter, setFilter] = useState('');
  const [newEvent, setNewEvent] = useState('');

  const shown = useMemo(
    () => tg.keys.filter(k => k.toLowerCase().includes(filter.trim().toLowerCase())),
    [tg.keys, filter],
  );
  const eventOptions = useMemo(
    () =>
      TRIGGER_EVENTS.filter(e => !tg.keys.includes(triggerKeyFor(e))).map(e => ({ value: e })),
    [tg.keys],
  );

  const create = () => {
    if (newEvent.trim()) {
      tg.createTrigger(newEvent);
      setNewEvent('');
    }
  };

  const hasErrors = Object.keys(tg.errors).length > 0;
  const selectedNew = tg.selected ? tg.isNew(tg.selected) : false;

  return (
    <Row gutter={16}>
      <Col xs={24} lg={7}>
        <Card size="small" title={`Triggers (${tg.keys.length})`} styles={{ body: { padding: 8 } }}>
          <Space.Compact style={{ width: '100%', marginBottom: 8 }}>
            <AutoComplete
              style={{ width: '100%' }}
              options={eventOptions}
              value={newEvent}
              onChange={setNewEvent}
              onSelect={(v: string) => tg.createTrigger(v)}
              filterOption={(i, o) => (o?.value ?? '').toLowerCase().includes(i.toLowerCase())}
              placeholder="Tạo trigger: chọn/nhập event"
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={create} />
          </Space.Compact>
          <Input.Search
            placeholder="Lọc trigger…"
            allowClear
            value={filter}
            onChange={e => setFilter(e.target.value)}
            style={{ marginBottom: 8 }}
          />
          <List
            size="small"
            dataSource={shown}
            style={{ maxHeight: '64vh', overflow: 'auto' }}
            renderItem={key => (
              <List.Item
                onClick={() => tg.select(key)}
                style={{
                  cursor: 'pointer', padding: '8px 10px', borderRadius: 8,
                  background: tg.selected === key ? 'rgba(59,130,246,0.16)' : undefined,
                }}
              >
                <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Typography.Text style={{ flex: 1, fontFamily: 'monospace', fontSize: 12.5 }} ellipsis>
                    {eventFromKey(key)}
                  </Typography.Text>
                  {tg.isNew(key) && <Tag color="green">mới</Tag>}
                  {tg.isDirty(key) && !tg.isNew(key) && <Tag color="orange">đã sửa</Tag>}
                </div>
              </List.Item>
            )}
          />
        </Card>
      </Col>

      <Col xs={24} lg={17}>
        {!tg.selected || !tg.draft ? (
          <Empty description="Chọn một trigger bên trái hoặc tạo trigger mới" style={{ marginTop: 80 }} />
        ) : (
          <div>
            <PublishBar
              dirtyCount={tg.dirtyKeys.length}
              hasErrors={hasErrors}
              flow={flow}
              left={
                <Space>
                  <Typography.Text strong style={{ fontFamily: 'monospace' }}>
                    {tg.selected}
                  </Typography.Text>
                  {selectedNew && (
                    <Button size="small" danger onClick={() => tg.discardNew(tg.selected!)}>
                      Bỏ nháp
                    </Button>
                  )}
                </Space>
              }
            />
            {tg.errors[tg.selected] && (
              <Typography.Paragraph type="danger" style={{ fontSize: 12 }}>
                {tg.errors[tg.selected]}
              </Typography.Paragraph>
            )}
            <Row gutter={16}>
              <Col xs={24} xl={15}>
                <TriggerEditor value={tg.draft} onChange={tg.updateDraft} />
              </Col>
              <Col xs={24} xl={9}>
                <Typography.Title level={5} style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CodeOutlined style={{ color: '#3b82f6' }} />
                  JSON (sẽ publish)
                </Typography.Title>
                <JsonPreview
                  title={tg.selected}
                  value={JSON.parse(tg.currentString(tg.selected))}
                  dirty={tg.isDirty(tg.selected)}
                />
              </Col>
            </Row>
          </div>
        )}
      </Col>
    </Row>
  );
}
