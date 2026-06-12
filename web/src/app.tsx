import {
  ControlOutlined,
  HistoryOutlined,
  PartitionOutlined,
  PictureOutlined,
  ReloadOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { Button, Layout, Menu, Result, Space, Spin, Tag, Typography } from 'antd';
import { useState } from 'react';
import { VersionDrawer } from './components/version-drawer';
import { AdsWfPage } from './pages/ads-wf-page';
import { NativeFullscreenPage } from './pages/native-fullscreen-page';
import { TriggersPage } from './pages/triggers-page';
import { useTemplate } from './use-template';

type Section = 'native' | 'triggers' | 'ads-wf';

const NAV = [
  { key: 'ads-wf', icon: <PartitionOutlined />, label: 'Ads Waterfall' },
  { key: 'triggers', icon: <ThunderboltOutlined />, label: 'Ad Triggers' },
  { key: 'native', icon: <PictureOutlined />, label: 'Native Fullscreen Ad' },
];

export default function RemoteConfigApp() {
  const t = useTemplate();
  const [section, setSection] = useState<Section>('ads-wf');
  const [historyOpen, setHistoryOpen] = useState(false);

  return (
    <Layout style={{ minHeight: '100dvh', background: 'transparent' }}>
      <Layout.Header
        style={{
          position: 'sticky', top: 0, zIndex: 20, height: 60, lineHeight: '60px',
          paddingInline: 20, display: 'flex', alignItems: 'center', gap: 12,
          background: 'rgba(10,13,20,0.72)', backdropFilter: 'blur(12px)',
          borderBottom: '1px solid #1e2536',
        }}
      >
        <div
          style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            display: 'grid', placeItems: 'center',
            background: 'linear-gradient(135deg, #3b82f6 0%, #22c55e 100%)',
            boxShadow: '0 6px 18px rgba(59,130,246,0.35)',
          }}
        >
          <ControlOutlined style={{ fontSize: 19, color: '#fff' }} />
        </div>
        <Typography.Text strong style={{ fontSize: 16 }}>
          Remote Config
        </Typography.Text>
        <code style={{ color: '#94a3b8', fontSize: 12 }}>flab---brain-training</code>
        {t.version?.versionNumber && (
          <Tag color="blue" bordered={false}>
            v{t.version.versionNumber}
            {t.version.updateTime && ` • ${new Date(t.version.updateTime).toLocaleString('vi-VN')}`}
          </Tag>
        )}
        <div style={{ flex: 1 }} />
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => t.reload()} loading={t.loading}>
            Tải lại
          </Button>
          <Button icon={<HistoryOutlined />} onClick={() => setHistoryOpen(true)}>
            Lịch sử
          </Button>
        </Space>
      </Layout.Header>

      <Layout style={{ background: 'transparent' }}>
        <Layout.Sider
          width={224}
          breakpoint="lg"
          collapsedWidth={0}
          style={{ background: '#0e1320', borderRight: '1px solid #1e2536' }}
        >
          <Menu
            mode="inline"
            theme="dark"
            selectedKeys={[section]}
            onClick={e => setSection(e.key as Section)}
            items={NAV}
            style={{ background: 'transparent', borderInlineEnd: 'none', paddingTop: 8 }}
          />
        </Layout.Sider>

        <Layout.Content style={{ padding: '24px 24px 56px', maxWidth: 1320 }}>
          {t.loadError ? (
            <Result
              status="error"
              title="Không tải được Remote Config template"
              subTitle={t.loadError}
              extra={
                <Button type="primary" icon={<ReloadOutlined />} onClick={() => t.reload()}>
                  Thử lại
                </Button>
              }
            />
          ) : t.loading && !t.etag ? (
            <Spin size="large" style={{ display: 'block', margin: '120px auto' }} />
          ) : section === 'native' ? (
            <NativeFullscreenPage params={t.params} etag={t.etag} reload={t.reload} />
          ) : section === 'triggers' ? (
            <TriggersPage triggers={t.triggers} etag={t.etag} reload={t.reload} />
          ) : (
            <AdsWfPage adsWf={t.adsWf} etag={t.etag} reload={t.reload} />
          )}
        </Layout.Content>
      </Layout>

      <VersionDrawer
        open={historyOpen}
        currentVersion={t.version?.versionNumber}
        onClose={() => setHistoryOpen(false)}
        onRolledBack={() => void t.reload()}
      />
    </Layout>
  );
}
