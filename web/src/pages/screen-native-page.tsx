import { CodeOutlined, DeleteOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Col, Empty, List, Popconfirm, Row, Space, Tag, Typography } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { onboardIdFromKey, SCREEN_CATALOG, screenKindOf } from '../../../shared/screen-native-meta';
import type { ParamSummary } from '../api';
import { JsonPreview } from '../components/json-preview';
import { PublishBar } from '../components/publish-bar';
import { ScreenNativeEditor } from '../editors/screen-native/screen-native-editor';
import { useScreenNativeDrafts } from '../hooks/use-screen-native-drafts';
import { usePublishFlow } from '../hooks/use-publish-flow';

type Props = {
  screens: Record<string, ParamSummary>;
  obsoleteNative: Record<string, ParamSummary>;
  etag: string | null;
  reload: () => Promise<void> | void;
};

const LABELS = Object.fromEntries(SCREEN_CATALOG.map(s => [s.key, s.label]));
const labelFor = (key: string): string => LABELS[key] ?? onboardIdFromKey(key);

export function ScreenNativePage({ screens, obsoleteNative, etag, reload }: Props) {
  const nd = useScreenNativeDrafts(screens);
  const [obsoleteDeletes, setObsoleteDeletes] = useState<string[]>([]);
  const obsoleteKeys = Object.keys(obsoleteNative);

  useEffect(() => {
    setObsoleteDeletes(d => d.filter(k => k in obsoleteNative));
  }, [obsoleteNative]);

  const deletes = useMemo(() => [...nd.deletes, ...obsoleteDeletes], [nd.deletes, obsoleteDeletes]);
  const flow = usePublishFlow({
    etag,
    changes: nd.changes,
    deletes,
    getSummary: k => screens[k] ?? obsoleteNative[k],
    reload,
  });

  const hasErrors = Object.keys(nd.errors).length > 0;
  const sel = nd.selected;
  const selKind = sel ? screenKindOf(sel) : 'onboard';
  const selNew = sel ? nd.isNew(sel) : false;
  const selDeleting = sel ? nd.isDeleting(sel) : false;
  const dirtyCount = nd.dirtyKeys.length + obsoleteDeletes.length;
  const toggleObsolete = (k: string) =>
    setObsoleteDeletes(d => (d.includes(k) ? d.filter(x => x !== k) : [...d, k]));

  const statusTag = (key: string) =>
    nd.isNew(key) ? <Tag color="green">mới</Tag>
    : nd.isDeleting(key) ? <Tag color="red">sẽ xóa</Tag>
    : nd.isDirty(key) ? <Tag color="orange">đã sửa</Tag>
    : nd.isLive(key) ? <Tag color="blue">live</Tag>
    : <Tag>mặc định app</Tag>;

  return (
    <Row gutter={16}>
      <Col xs={24} lg={8}>
        <Card size="small" title="Màn hình" styles={{ body: { padding: 8 } }}>
          <List
            size="small"
            dataSource={nd.keys}
            style={{ maxHeight: '58vh', overflow: 'auto' }}
            renderItem={key => (
              <List.Item
                onClick={() => nd.select(key)}
                style={{
                  cursor: 'pointer', padding: '8px 10px', borderRadius: 8,
                  background: nd.selected === key ? 'rgba(59,130,246,0.16)' : undefined,
                }}
              >
                <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Typography.Text style={{ fontSize: 13 }}>{labelFor(key)}</Typography.Text>
                    <div style={{ fontSize: 11, color: '#64748b' }}>
                      <Tag color={screenKindOf(key) === 'language' ? 'purple' : 'geekblue'} bordered={false} style={{ marginInlineEnd: 4 }}>
                        {screenKindOf(key) === 'language' ? 'lang' : 'onboard'}
                      </Tag>
                      <span style={{ fontFamily: 'monospace' }}>{key}</span>
                    </div>
                  </div>
                  {statusTag(key)}
                </div>
              </List.Item>
            )}
          />
          {obsoleteKeys.length > 0 && (
            <Card
              size="small" type="inner" style={{ marginTop: 8 }} styles={{ body: { padding: 8 } }}
              title={<span style={{ color: '#ef4444', fontSize: 13 }}>Key cũ cần dọn ({obsoleteKeys.length})</span>}
            >
              <Typography.Paragraph type="secondary" style={{ fontSize: 11, marginBottom: 6 }}>
                control_native_* không còn dùng — xóa khỏi Firebase khi publish.
              </Typography.Paragraph>
              {obsoleteKeys.map(k => (
                <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <Typography.Text delete={obsoleteDeletes.includes(k)} style={{ flex: 1, fontFamily: 'monospace', fontSize: 11 }} ellipsis>
                    {k}
                  </Typography.Text>
                  <Button size="small" danger={!obsoleteDeletes.includes(k)} icon={<DeleteOutlined />} onClick={() => toggleObsolete(k)}>
                    {obsoleteDeletes.includes(k) ? 'Hoàn tác' : 'Xóa'}
                  </Button>
                </div>
              ))}
            </Card>
          )}
        </Card>
      </Col>

      <Col xs={24} lg={16}>
        {!sel || !nd.draft ? (
          <Empty description="Chọn một màn bên trái" style={{ marginTop: 80 }} />
        ) : (
          <div>
            <PublishBar
              dirtyCount={dirtyCount}
              hasErrors={hasErrors}
              flow={flow}
              left={
                <Space wrap>
                  <Typography.Text strong>{labelFor(sel)}</Typography.Text>
                  <Typography.Text style={{ fontFamily: 'monospace', fontSize: 12, color: '#64748b' }}>{sel}</Typography.Text>
                  {selNew ? (
                    <Button size="small" onClick={() => nd.discardDraft(sel)}>Bỏ nháp</Button>
                  ) : selDeleting ? (
                    <Button size="small" onClick={() => nd.toggleDelete(sel)}>Hoàn tác xóa</Button>
                  ) : nd.isLive(sel) ? (
                    <Popconfirm
                      title="Xóa hẳn key này khỏi Firebase?"
                      description="App sẽ dùng default trong app cho màn này."
                      okText="Xóa" okButtonProps={{ danger: true }}
                      onConfirm={() => nd.toggleDelete(sel)}
                    >
                      <Button size="small" danger>Xóa</Button>
                    </Popconfirm>
                  ) : null}
                </Space>
              }
            />
            {selDeleting ? (
              <Alert type="error" showIcon message="Key này sẽ bị XÓA khi publish"
                description="Bấm Publish để xóa khỏi Firebase, hoặc Hoàn tác xóa để giữ lại." />
            ) : (
              <>
                {nd.errors[sel] && (
                  <Typography.Paragraph type="danger" style={{ fontSize: 12 }}>{nd.errors[sel]}</Typography.Paragraph>
                )}
                {!nd.isLive(sel) && !selNew && (
                  <Alert style={{ marginBottom: 12 }} type="info" showIcon
                    message="Màn này chưa có trên Firebase — app đang dùng default. Chỉnh sửa để tạo & publish key mới." />
                )}
                <Row gutter={16}>
                  <Col xs={24} xl={14}>
                    <ScreenNativeEditor kind={selKind} value={nd.draft} onChange={nd.update} />
                  </Col>
                  <Col xs={24} xl={10}>
                    <Typography.Title level={5} style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <CodeOutlined style={{ color: '#3b82f6' }} />
                      JSON (sẽ publish)
                    </Typography.Title>
                    <JsonPreview title={sel} value={JSON.parse(nd.currentString(sel))} dirty={nd.isDirty(sel)} />
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
