import { CodeOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Col, Empty, List, Popconfirm, Row, Space, Tag, Typography } from 'antd';
import { NATIVE_AD_POSITION_LABELS, positionFromKey } from '../../../shared/native-ad-meta';
import type { ParamSummary } from '../api';
import { JsonPreview } from '../components/json-preview';
import { PublishBar } from '../components/publish-bar';
import { NativeAdEditor } from '../editors/native-ad/native-ad-editor';
import { useNativeAdDrafts } from '../hooks/use-native-ad-drafts';
import { usePublishFlow } from '../hooks/use-publish-flow';

type Props = {
  nativeAds: Record<string, ParamSummary>;
  etag: string | null;
  reload: () => Promise<void> | void;
};

const labelFor = (key: string): string =>
  NATIVE_AD_POSITION_LABELS[positionFromKey(key)] ?? positionFromKey(key);

export function InlineNativePage({ nativeAds, etag, reload }: Props) {
  const nd = useNativeAdDrafts(nativeAds);
  const flow = usePublishFlow({
    etag,
    changes: nd.changes,
    deletes: nd.deletes,
    getSummary: k => nativeAds[k],
    reload,
  });

  const hasErrors = Object.keys(nd.errors).length > 0;
  const sel = nd.selected;
  const selNew = sel ? nd.isNew(sel) : false;
  const selDeleting = sel ? nd.isDeleting(sel) : false;

  return (
    <Row gutter={16}>
      <Col xs={24} lg={8}>
        <Card size="small" title="Vị trí native ad" styles={{ body: { padding: 8 } }}>
          <List
            size="small"
            dataSource={nd.keys}
            style={{ maxHeight: '70vh', overflow: 'auto' }}
            renderItem={key => (
              <List.Item
                onClick={() => nd.select(key)}
                style={{
                  cursor: 'pointer',
                  padding: '8px 10px',
                  borderRadius: 8,
                  background: nd.selected === key ? 'rgba(59,130,246,0.16)' : undefined,
                }}
              >
                <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Typography.Text style={{ fontSize: 13 }}>{labelFor(key)}</Typography.Text>
                    <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#64748b' }}>{key}</div>
                  </div>
                  {nd.isNew(key) ? (
                    <Tag color="green">mới</Tag>
                  ) : nd.isDeleting(key) ? (
                    <Tag color="red">sẽ xóa</Tag>
                  ) : nd.isDirty(key) ? (
                    <Tag color="orange">đã sửa</Tag>
                  ) : nd.isLive(key) ? (
                    <Tag color="blue">live</Tag>
                  ) : (
                    <Tag>mặc định app</Tag>
                  )}
                </div>
              </List.Item>
            )}
          />
        </Card>
      </Col>

      <Col xs={24} lg={16}>
        {!sel || !nd.draft ? (
          <Empty description="Chọn một vị trí native ad bên trái" style={{ marginTop: 80 }} />
        ) : (
          <div>
            <PublishBar
              dirtyCount={nd.dirtyKeys.length}
              hasErrors={hasErrors}
              flow={flow}
              left={
                <Space wrap>
                  <Typography.Text strong>{labelFor(sel)}</Typography.Text>
                  <Typography.Text style={{ fontFamily: 'monospace', fontSize: 12, color: '#64748b' }}>
                    {sel}
                  </Typography.Text>
                  {selNew ? (
                    <Button size="small" onClick={() => nd.discardDraft(sel)}>
                      Bỏ nháp
                    </Button>
                  ) : selDeleting ? (
                    <Button size="small" onClick={() => nd.toggleDelete(sel)}>
                      Hoàn tác xóa
                    </Button>
                  ) : nd.isLive(sel) ? (
                    <Popconfirm
                      title="Xóa hẳn key này khỏi Firebase?"
                      description="App sẽ dùng default trong app cho vị trí này."
                      okText="Xóa"
                      okButtonProps={{ danger: true }}
                      onConfirm={() => nd.toggleDelete(sel)}
                    >
                      <Button size="small" danger>
                        Xóa
                      </Button>
                    </Popconfirm>
                  ) : null}
                </Space>
              }
            />
            {selDeleting ? (
              <Alert
                type="error"
                showIcon
                message="Key này sẽ bị XÓA khi publish"
                description="Bấm Publish để xóa khỏi Firebase, hoặc Hoàn tác xóa để giữ lại."
              />
            ) : (
              <>
                {nd.errors[sel] && (
                  <Typography.Paragraph type="danger" style={{ fontSize: 12 }}>
                    {nd.errors[sel]}
                  </Typography.Paragraph>
                )}
                {!nd.isLive(sel) && !selNew && (
                  <Alert
                    style={{ marginBottom: 12 }}
                    type="info"
                    showIcon
                    message="Vị trí này chưa có trên Firebase — app đang dùng default. Chỉnh sửa để tạo & publish key mới."
                  />
                )}
                <Row gutter={16}>
                  <Col xs={24} xl={14}>
                    <NativeAdEditor value={nd.draft} onChange={nd.update} />
                  </Col>
                  <Col xs={24} xl={10}>
                    <Typography.Title
                      level={5}
                      style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: 8 }}
                    >
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
