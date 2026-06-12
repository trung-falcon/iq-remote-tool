import { CodeOutlined } from '@ant-design/icons';
import { Alert, Col, Row, Spin, Typography } from 'antd';
import { PARAM_KEYS } from '../../../shared/params';
import type { ParamSummary } from '../api';
import { JsonPreview } from '../components/json-preview';
import { PublishBar } from '../components/publish-bar';
import { CloseConfigEditor } from '../editors/close-config-editor';
import { LayoutWeightsEditor } from '../editors/layout-weights-editor';
import { TimeoutEditor } from '../editors/timeout-editor';
import { useNativeDrafts } from '../hooks/use-native-drafts';
import { usePublishFlow } from '../hooks/use-publish-flow';

type Props = {
  params: Record<string, ParamSummary>;
  etag: string | null;
  reload: () => Promise<void> | void;
};

export function NativeFullscreenPage({ params, etag, reload }: Props) {
  const n = useNativeDrafts(params);
  const flow = usePublishFlow({ etag, changes: n.changes, getSummary: k => params[k], reload });

  if (!n.drafts) return <Spin />;
  const hasErrors = Object.keys(n.errors).length > 0;

  return (
    <div>
      <PublishBar dirtyCount={n.dirtyKeys.length} hasErrors={hasErrors} flow={flow} />

      {n.warnings.map(w => (
        <Alert key={w} type="warning" showIcon closable message={w} style={{ marginBottom: 12 }} />
      ))}

      <Row gutter={16}>
        <Col xs={24} lg={14}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <TimeoutEditor
              value={n.drafts.timeout}
              summary={params[PARAM_KEYS.timeout]}
              dirty={n.dirtyKeys.includes(PARAM_KEYS.timeout)}
              error={n.errors[PARAM_KEYS.timeout]}
              onChange={n.updateTimeout}
            />
            <CloseConfigEditor
              value={n.drafts.closeConfig}
              summary={params[PARAM_KEYS.closeConfig]}
              dirty={n.dirtyKeys.includes(PARAM_KEYS.closeConfig)}
              error={n.errors[PARAM_KEYS.closeConfig]}
              onChange={n.updateCloseConfig}
            />
            <LayoutWeightsEditor
              value={n.drafts.layoutWeights}
              summary={params[PARAM_KEYS.layoutWeights]}
              dirty={n.dirtyKeys.includes(PARAM_KEYS.layoutWeights)}
              error={n.errors[PARAM_KEYS.layoutWeights]}
              onChange={n.updateLayoutWeights}
            />
          </div>
        </Col>
        <Col xs={24} lg={10}>
          <Typography.Title level={5} style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <CodeOutlined style={{ color: '#3b82f6' }} />
            JSON preview
            <Typography.Text type="secondary" style={{ fontSize: 12, fontWeight: 400 }}>
              (sẽ publish)
            </Typography.Text>
          </Typography.Title>
          <JsonPreview title={PARAM_KEYS.timeout} value={n.drafts.timeout} dirty={n.dirtyKeys.includes(PARAM_KEYS.timeout)} />
          <JsonPreview title={PARAM_KEYS.closeConfig} value={n.drafts.closeConfig} dirty={n.dirtyKeys.includes(PARAM_KEYS.closeConfig)} />
          <JsonPreview title={PARAM_KEYS.layoutWeights} value={n.drafts.layoutWeights} dirty={n.dirtyKeys.includes(PARAM_KEYS.layoutWeights)} />
        </Col>
      </Row>
    </div>
  );
}
