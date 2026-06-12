import { CodeOutlined, PlusOutlined } from '@ant-design/icons';
import { Alert, AutoComplete, Button, Card, Col, Empty, Input, List, Popconfirm, Row, Space, Tag, Typography } from 'antd';
import { useMemo, useState } from 'react';
import { eventFromKey, TRIGGER_EVENTS, triggerKeyFor } from '../../../shared/trigger-meta';
import type { ParamSummary } from '../api';
import { JsonPreview } from '../components/json-preview';
import { PublishBar } from '../components/publish-bar';
import { TriggerEditor } from '../editors/trigger/trigger-editor';
import { computeFacets, TriggerFilterBar } from '../editors/trigger/trigger-filter-bar';
import { parseTrigger } from '../hooks/trigger-serialize';
import { usePublishFlow } from '../hooks/use-publish-flow';
import { useTriggerDrafts } from '../hooks/use-trigger-drafts';

type Props = {
  triggers: Record<string, ParamSummary>;
  adsWf: Record<string, ParamSummary>;
  etag: string | null;
  reload: () => Promise<void> | void;
};

// Ad group/name suggestions sourced from the 3 ads_wf variants' ad units.
function collectAdGroups(adsWf: Record<string, ParamSummary>): string[] {
  const set = new Set<string>();
  for (const s of Object.values(adsWf)) {
    try {
      const cfg = JSON.parse(s?.defaultValue || '{}');
      for (const it of cfg.ids ?? []) {
        if (it.groupName) set.add(it.groupName);
        if (it.name) set.add(it.name);
      }
    } catch {
      /* ignore */
    }
  }
  return [...set].sort();
}

export function TriggersPage({ triggers, adsWf, etag, reload }: Props) {
  const tg = useTriggerDrafts(triggers);
  const flow = usePublishFlow({
    etag,
    changes: tg.changes,
    deletes: tg.deletes,
    getSummary: k => triggers[k],
    reload,
  });
  const [filter, setFilter] = useState('');
  const [facets, setFacets] = useState<string[]>([]);
  const [newEvent, setNewEvent] = useState('');

  const adGroupOptions = useMemo(() => collectAdGroups(adsWf), [adsWf]);
  const facetByKey = useMemo(() => {
    const m: Record<string, string[]> = {};
    for (const k of Object.keys(triggers)) m[k] = computeFacets(parseTrigger(triggers[k]?.defaultValue));
    return m;
  }, [triggers]);

  const shown = useMemo(
    () =>
      tg.keys.filter(k => {
        if (!k.toLowerCase().includes(filter.trim().toLowerCase())) return false;
        if (!facets.length) return true;
        const f = facetByKey[k];
        return !f ? true : facets.every(x => f.includes(x)); // new local keys always shown
      }),
    [tg.keys, filter, facets, facetByKey],
  );
  const eventOptions = useMemo(
    () => TRIGGER_EVENTS.filter(e => !tg.keys.includes(triggerKeyFor(e))).map(e => ({ value: e })),
    [tg.keys],
  );

  const create = () => {
    if (newEvent.trim()) {
      tg.createTrigger(newEvent);
      setNewEvent('');
    }
  };

  const hasErrors = Object.keys(tg.errors).length > 0;
  const sel = tg.selected;
  const selNew = sel ? tg.isNew(sel) : false;
  const selDeleting = sel ? tg.isDeleting(sel) : false;

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
            placeholder="Lọc theo tên…"
            allowClear
            value={filter}
            onChange={e => setFilter(e.target.value)}
            style={{ marginBottom: 8 }}
          />
          <TriggerFilterBar value={facets} onChange={setFacets} />
          <List
            size="small"
            dataSource={shown}
            style={{ maxHeight: '60vh', overflow: 'auto' }}
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
                  {tg.isDeleting(key) && <Tag color="red">sẽ xóa</Tag>}
                  {tg.isDirty(key) && !tg.isNew(key) && !tg.isDeleting(key) && <Tag color="orange">đã sửa</Tag>}
                </div>
              </List.Item>
            )}
          />
        </Card>
      </Col>

      <Col xs={24} lg={17}>
        {!sel || !tg.draft ? (
          <Empty description="Chọn một trigger bên trái hoặc tạo trigger mới" style={{ marginTop: 80 }} />
        ) : (
          <div>
            <PublishBar
              dirtyCount={tg.dirtyKeys.length}
              hasErrors={hasErrors}
              flow={flow}
              left={
                <Space wrap>
                  <Typography.Text strong style={{ fontFamily: 'monospace' }}>{sel}</Typography.Text>
                  {selNew ? (
                    <Button size="small" danger onClick={() => tg.discardNew(sel)}>Bỏ nháp</Button>
                  ) : selDeleting ? (
                    <Button size="small" onClick={() => tg.toggleDelete(sel)}>Hoàn tác xóa</Button>
                  ) : (
                    <Popconfirm
                      title="Xóa hẳn trigger này khỏi Firebase?"
                      description="App sẽ dùng in-app default cho event này."
                      okText="Xóa"
                      okButtonProps={{ danger: true }}
                      onConfirm={() => tg.toggleDelete(sel)}
                    >
                      <Button size="small" danger>Xóa</Button>
                    </Popconfirm>
                  )}
                </Space>
              }
            />
            {selDeleting ? (
              <Alert
                type="error"
                showIcon
                message="Trigger này sẽ bị XÓA khi publish"
                description="Bấm Publish để xóa khỏi Firebase, hoặc Hoàn tác xóa để giữ lại."
              />
            ) : (
              <>
                {tg.errors[sel] && (
                  <Typography.Paragraph type="danger" style={{ fontSize: 12 }}>{tg.errors[sel]}</Typography.Paragraph>
                )}
                <Row gutter={16}>
                  <Col xs={24} xl={15}>
                    <TriggerEditor value={tg.draft} onChange={tg.updateDraft} adGroupOptions={adGroupOptions} />
                  </Col>
                  <Col xs={24} xl={9}>
                    <Typography.Title level={5} style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <CodeOutlined style={{ color: '#3b82f6' }} />
                      JSON (sẽ publish)
                    </Typography.Title>
                    <JsonPreview title={sel} value={JSON.parse(tg.currentString(sel))} dirty={tg.isDirty(sel)} />
                  </Col>
                </Row>
              </>
            )}
          </div>
        )}
      </Col>
    </Row>
  );
}
