import { CodeOutlined } from '@ant-design/icons';
import { Alert, Col, Row, Segmented, Space, Typography } from 'antd';
import { ADS_WF_VARIANTS } from '../../../shared/ads-wf-meta';
import type { ParamSummary } from '../api';
import { JsonPreview } from '../components/json-preview';
import { ParamTags } from '../components/param-tags';
import { PublishBar } from '../components/publish-bar';
import { ScrollPane } from '../components/scroll-pane';
import { AdaptiveCooldownEditor } from '../editors/ads-wf/adaptive-cooldown-editor';
import { AdsConfigFields } from '../editors/ads-wf/ads-config-fields';
import { AdsItemList } from '../editors/ads-wf/ads-item-list';
import { useAdsWfDrafts } from '../hooks/use-ads-wf-drafts';
import { usePublishFlow } from '../hooks/use-publish-flow';

type Props = {
  adsWf: Record<string, ParamSummary>;
  etag: string | null;
  reload: () => Promise<void> | void;
};

export function AdsWfPage({ adsWf, etag, reload }: Props) {
  const a = useAdsWfDrafts(adsWf);
  const flow = usePublishFlow({ etag, changes: a.changes, getSummary: k => adsWf[k], reload });

  const options = ADS_WF_VARIANTS.map(v => ({
    label: a.variantExists(v.key) ? v.label : `${v.label} · tạo mới`,
    value: v.key,
  }));

  const onVariant = (key: string) => {
    if (a.variantExists(key)) a.setSelected(key);
    else a.createVariant(key);
  };

  return (
    <div>
      <PublishBar
        dirtyCount={a.dirtyKeys.length}
        hasErrors={!!a.error}
        flow={flow}
        left={
          <Space wrap>
            <Segmented value={a.selected} options={options} onChange={v => onVariant(v as string)} />
            <Typography.Text code>{a.selected}</Typography.Text>
            <ParamTags summary={adsWf[a.selected]} dirty={a.isDirty(a.selected)} />
          </Space>
        }
      />

      {a.error && <Alert type="error" showIcon message={a.error} style={{ marginBottom: 12 }} />}

      <Row gutter={16}>
        <Col xs={24} xl={15}>
          <ScrollPane>
            <AdsConfigFields value={a.draft} onChange={a.update} />
            <AdaptiveCooldownEditor value={a.draft} onChange={a.update} />
            <AdsItemList value={a.draft} onChange={a.update} />
          </ScrollPane>
        </Col>
        <Col xs={24} xl={9}>
          <ScrollPane>
            <Typography.Title
              level={5}
              style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <CodeOutlined style={{ color: '#3b82f6' }} />
              JSON (sẽ publish)
            </Typography.Title>
            <JsonPreview title={a.selected} value={a.currentObject()} dirty={a.isDirty(a.selected)} />
          </ScrollPane>
        </Col>
      </Row>
    </div>
  );
}
