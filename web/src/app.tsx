import {
  CloudUploadOutlined,
  CodeOutlined,
  ControlOutlined,
  HistoryOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { Alert, App, Badge, Button, Col, Result, Row, Space, Spin, Tag, Typography } from 'antd';
import { useState } from 'react';
import { PARAM_KEYS } from '../../shared/params';
import { api, ApiError } from './api';
import { DiffModal, type DiffItem } from './components/diff-modal';
import { JsonPreview } from './components/json-preview';
import { VersionDrawer } from './components/version-drawer';
import { CloseConfigEditor } from './editors/close-config-editor';
import { LayoutWeightsEditor } from './editors/layout-weights-editor';
import { TimeoutEditor } from './editors/timeout-editor';
import { useTemplate } from './use-template';

export default function RemoteConfigApp() {
  const t = useTemplate();
  const { message, modal } = App.useApp();
  const [diffOpen, setDiffOpen] = useState(false);
  const [validating, setValidating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const hasErrors = Object.keys(t.errors).length > 0;
  const dirtyCount = t.dirtyKeys.length;

  // Plain reload discards unpublished drafts — confirm first when dirty.
  const safeReload = () => {
    if (dirtyCount === 0) {
      void t.reload();
      return;
    }
    modal.confirm({
      title: 'Bỏ các chỉnh sửa chưa publish?',
      content: 'Tải lại sẽ lấy bản mới nhất từ Firebase, các thay đổi đang sửa sẽ bị mất.',
      okText: 'Tải lại',
      cancelText: 'Hủy',
      onOk: () => t.reload(),
    });
  };

  const openDiff = async () => {
    setValidating(true);
    try {
      await api.validate(t.changes);
      setDiffOpen(true);
    } catch (e) {
      message.error(`Validate thất bại: ${(e as Error).message}`);
    } finally {
      setValidating(false);
    }
  };

  const confirmPublish = async () => {
    if (!t.etag) return;
    setPublishing(true);
    try {
      const r = await api.publish(t.etag, t.changes);
      setDiffOpen(false);
      message.success(`Đã publish thành công — version ${r.versionNumber ?? '?'}`);
      await t.reload();
    } catch (e) {
      if (e instanceof ApiError && e.isEtagConflict) {
        setDiffOpen(false);
        modal.confirm({
          title: 'Template đã bị thay đổi từ nơi khác',
          content:
            'Có người khác vừa sửa Remote Config (etag conflict). Reload để lấy bản mới nhất? Các chỉnh sửa chưa publish sẽ bị mất.',
          okText: 'Reload',
          cancelText: 'Để sau',
          onOk: () => t.reload(),
        });
      } else {
        message.error(`Publish thất bại: ${(e as Error).message}`);
      }
    } finally {
      setPublishing(false);
    }
  };

  if (t.loading && !t.drafts) {
    return <Spin size="large" style={{ display: 'block', margin: '120px auto' }} />;
  }
  if (t.loadError || !t.drafts) {
    return (
      <Result
        status="error"
        title="Không tải được Remote Config template"
        subTitle={t.loadError}
        extra={
          <Button type="primary" icon={<ReloadOutlined />} onClick={t.reload}>
            Thử lại
          </Button>
        }
      />
    );
  }

  const diffItems: DiffItem[] = t.dirtyKeys.map(key => ({
    key,
    oldRaw: t.params[key]?.defaultValue ?? '',
    newRaw: t.changes[key],
    exists: t.params[key]?.exists ?? false,
  }));

  return (
    <div style={{ maxWidth: 1320, margin: '0 auto', padding: '0 20px 56px' }}>
      <header
        style={{
          position: 'sticky', top: 0, zIndex: 20,
          background: 'rgba(10,13,20,0.72)',
          backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 16, flexWrap: 'wrap',
          padding: '14px 20px', margin: '0 -20px 24px',
          borderBottom: '1px solid #1e2536',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 40, height: 40, borderRadius: 11, flexShrink: 0,
              display: 'grid', placeItems: 'center',
              background: 'linear-gradient(135deg, #3b82f6 0%, #22c55e 100%)',
              boxShadow: '0 6px 18px rgba(59,130,246,0.35)',
            }}
          >
            <ControlOutlined style={{ fontSize: 21, color: '#fff' }} />
          </div>
          <div>
            <Typography.Title level={4} style={{ margin: 0, lineHeight: 1.25 }}>
              Remote Config{' '}
              <Typography.Text style={{ color: '#64748b', fontWeight: 500, fontSize: 16 }}>
                · Native Fullscreen Ad
              </Typography.Text>
            </Typography.Title>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              <code style={{ color: '#94a3b8' }}>flab---brain-training</code>
              {t.version?.versionNumber && (
                <Tag color="blue" bordered={false} style={{ marginLeft: 8 }}>
                  v{t.version.versionNumber}
                  {t.version.updateTime &&
                    ` • ${new Date(t.version.updateTime).toLocaleString('vi-VN')}`}
                </Tag>
              )}
            </Typography.Text>
          </div>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={safeReload} loading={t.loading}>
            Tải lại
          </Button>
          <Button icon={<HistoryOutlined />} onClick={() => setHistoryOpen(true)}>
            Lịch sử
          </Button>
          <Badge count={dirtyCount}>
            <Button
              type="primary"
              icon={<CloudUploadOutlined />}
              disabled={dirtyCount === 0 || hasErrors}
              loading={validating}
              onClick={openDiff}
            >
              Publish
            </Button>
          </Badge>
        </Space>
      </header>

      {t.warnings.map(w => (
        <Alert key={w} type="warning" showIcon closable message={w} style={{ marginBottom: 12 }} />
      ))}
      {hasErrors && (
        <Alert
          type="error"
          showIcon
          message="Config đang không hợp lệ — sửa các lỗi bên dưới để Publish"
          style={{ marginBottom: 12 }}
        />
      )}

      <Row gutter={16}>
        <Col xs={24} lg={14}>
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <TimeoutEditor
              value={t.drafts.timeout}
              summary={t.params[PARAM_KEYS.timeout]}
              dirty={t.dirtyKeys.includes(PARAM_KEYS.timeout)}
              error={t.errors[PARAM_KEYS.timeout]}
              onChange={t.updateTimeout}
            />
            <CloseConfigEditor
              value={t.drafts.closeConfig}
              summary={t.params[PARAM_KEYS.closeConfig]}
              dirty={t.dirtyKeys.includes(PARAM_KEYS.closeConfig)}
              error={t.errors[PARAM_KEYS.closeConfig]}
              onChange={t.updateCloseConfig}
            />
            <LayoutWeightsEditor
              value={t.drafts.layoutWeights}
              summary={t.params[PARAM_KEYS.layoutWeights]}
              dirty={t.dirtyKeys.includes(PARAM_KEYS.layoutWeights)}
              error={t.errors[PARAM_KEYS.layoutWeights]}
              onChange={t.updateLayoutWeights}
            />
          </Space>
        </Col>
        <Col xs={24} lg={10}>
          <Typography.Title
            level={5}
            style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <CodeOutlined style={{ color: '#3b82f6' }} />
            JSON preview
            <Typography.Text type="secondary" style={{ fontSize: 12, fontWeight: 400 }}>
              (sẽ publish)
            </Typography.Text>
          </Typography.Title>
          <JsonPreview
            title={PARAM_KEYS.timeout}
            value={t.drafts.timeout}
            dirty={t.dirtyKeys.includes(PARAM_KEYS.timeout)}
          />
          <JsonPreview
            title={PARAM_KEYS.closeConfig}
            value={t.drafts.closeConfig}
            dirty={t.dirtyKeys.includes(PARAM_KEYS.closeConfig)}
          />
          <JsonPreview
            title={PARAM_KEYS.layoutWeights}
            value={t.drafts.layoutWeights}
            dirty={t.dirtyKeys.includes(PARAM_KEYS.layoutWeights)}
          />
        </Col>
      </Row>

      <DiffModal
        open={diffOpen}
        items={diffItems}
        loading={publishing}
        onConfirm={confirmPublish}
        onCancel={() => setDiffOpen(false)}
      />
      <VersionDrawer
        open={historyOpen}
        currentVersion={t.version?.versionNumber}
        onClose={() => setHistoryOpen(false)}
        onRolledBack={() => void t.reload()}
      />
    </div>
  );
}
