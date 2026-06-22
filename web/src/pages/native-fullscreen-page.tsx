import { CodeOutlined } from '@ant-design/icons';
import { Alert, Col, Row, Segmented, Space, Spin, Typography } from 'antd';
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

  const hasErrors = Object.keys(n.errors).length > 0;

  const variantKeys = (baseKey: string) => [baseKey, `android_${baseKey}`, `ios_${baseKey}`];

  const variantOptions = (keys: string[]) =>
    keys.map(key => ({
      label: key.startsWith('android_') ? 'Android' : key.startsWith('ios_') ? 'iOS' : 'Chung',
      value: key,
    }));

  const variantLabel = (key: string) =>
    key.startsWith('android_') ? 'Android' : key.startsWith('ios_') ? 'iOS' : 'Chung (fallback)';

  return (
    <div>
      <PublishBar dirtyCount={n.dirtyKeys.length} hasErrors={hasErrors} flow={flow} />

      {n.warnings.map(w => (
        <Alert key={w} type="warning" showIcon closable message={w} style={{ marginBottom: 12 }} />
      ))}

      <Row gutter={16}>
        <Col xs={24} lg={14}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <Space wrap style={{ marginBottom: 8 }}>
                <Segmented
                  value={n.timeout.selected}
                  options={variantOptions(variantKeys(PARAM_KEYS.timeout)).map(opt => ({
                    ...opt,
                    label: n.timeout.variantExists(opt.value) ? opt.label : `${opt.label} · tạo mới`,
                  }))}
                  onChange={v => n.timeout.selectOrCreate(v as string)}
                />
                <Typography.Text code>{variantLabel(n.timeout.selected)}</Typography.Text>
                <Typography.Text code>{n.timeout.selected}</Typography.Text>
              </Space>
              <TimeoutEditor
                value={n.timeout.draft}
                summary={n.timeout.summaryFor(n.timeout.selected)}
                dirty={n.timeout.isDirty(n.timeout.selected)}
                error={n.errors[n.timeout.selected]}
                onChange={n.updateTimeout}
              />
            </div>

            <div>
              <Space wrap style={{ marginBottom: 8 }}>
                <Segmented
                  value={n.closeConfig.selected}
                  options={variantOptions(variantKeys(PARAM_KEYS.closeConfig)).map(opt => ({
                    ...opt,
                    label: n.closeConfig.variantExists(opt.value) ? opt.label : `${opt.label} · tạo mới`,
                  }))}
                  onChange={v => n.closeConfig.selectOrCreate(v as string)}
                />
                <Typography.Text code>{variantLabel(n.closeConfig.selected)}</Typography.Text>
                <Typography.Text code>{n.closeConfig.selected}</Typography.Text>
              </Space>
              <CloseConfigEditor
                value={n.closeConfig.draft}
                summary={n.closeConfig.summaryFor(n.closeConfig.selected)}
                dirty={n.closeConfig.isDirty(n.closeConfig.selected)}
                error={n.errors[n.closeConfig.selected]}
                onChange={n.updateCloseConfig}
              />
            </div>

            <div>
              <Space wrap style={{ marginBottom: 8 }}>
                <Segmented
                  value={n.layoutWeights.selected}
                  options={variantOptions(variantKeys(PARAM_KEYS.layoutWeights)).map(opt => ({
                    ...opt,
                    label: n.layoutWeights.variantExists(opt.value) ? opt.label : `${opt.label} · tạo mới`,
                  }))}
                  onChange={v => n.layoutWeights.selectOrCreate(v as string)}
                />
                <Typography.Text code>{variantLabel(n.layoutWeights.selected)}</Typography.Text>
                <Typography.Text code>{n.layoutWeights.selected}</Typography.Text>
              </Space>
              <LayoutWeightsEditor
                value={n.layoutWeights.draft}
                summary={n.layoutWeights.summaryFor(n.layoutWeights.selected)}
                dirty={n.layoutWeights.isDirty(n.layoutWeights.selected)}
                error={n.errors[n.layoutWeights.selected]}
                onChange={n.updateLayoutWeights}
              />
            </div>
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
          <JsonPreview title={n.timeout.selected} value={n.timeout.draft} dirty={n.timeout.isDirty(n.timeout.selected)} />
          <JsonPreview title={n.closeConfig.selected} value={n.closeConfig.draft} dirty={n.closeConfig.isDirty(n.closeConfig.selected)} />
          <JsonPreview title={n.layoutWeights.selected} value={n.layoutWeights.draft} dirty={n.layoutWeights.isDirty(n.layoutWeights.selected)} />
        </Col>
      </Row>
    </div>
  );
}
