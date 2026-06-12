import { CloudUploadOutlined } from '@ant-design/icons';
import { Alert, Badge, Button, Space } from 'antd';
import type { PublishFlow } from '../hooks/use-publish-flow';
import { DiffModal } from './diff-modal';

type Props = {
  dirtyCount: number;
  hasErrors: boolean;
  flow: PublishFlow;
  // Optional extra controls rendered on the left (e.g. per-trigger actions).
  left?: React.ReactNode;
};

// Per-section publish control: dirty badge + Publish button + diff modal +
// inline "invalid config" notice. Reused by every section.
export function PublishBar({ dirtyCount, hasErrors, flow, left }: Props) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 0 }}>{left}</div>
        <Space>
          {hasErrors && (
            <Alert type="error" showIcon banner style={{ padding: '2px 10px' }} message="Config không hợp lệ" />
          )}
          <Badge count={dirtyCount}>
            <Button
              type="primary"
              icon={<CloudUploadOutlined />}
              disabled={dirtyCount === 0 || hasErrors}
              loading={flow.validating}
              onClick={flow.openDiff}
            >
              Publish
            </Button>
          </Badge>
        </Space>
      </div>
      <DiffModal
        open={flow.diffOpen}
        items={flow.diffItems}
        loading={flow.publishing}
        onConfirm={flow.confirmPublish}
        onCancel={flow.cancelDiff}
      />
    </div>
  );
}
