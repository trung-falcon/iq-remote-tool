import { Col, Modal, Row, Typography } from 'antd';
import { prettyValue } from './json-preview';

export type DiffItem = {
  key: string;
  oldRaw: string; // current value on Firebase ('' when param doesn't exist yet)
  newRaw: string; // value that will be published
  exists: boolean;
};

const preBase: React.CSSProperties = {
  fontSize: 12,
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-all',
  padding: 8,
  borderRadius: 6,
  maxHeight: 260,
  overflow: 'auto',
  margin: 0,
};

type Props = {
  open: boolean;
  items: DiffItem[];
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

// Confirmation step before publishing: side-by-side old vs new value per param.
export function DiffModal({ open, items, loading, onConfirm, onCancel }: Props) {
  return (
    <Modal
      open={open}
      width={920}
      title="Xác nhận publish lên Firebase Remote Config"
      okText="Publish"
      okButtonProps={{ danger: true }}
      cancelText="Hủy"
      confirmLoading={loading}
      onOk={onConfirm}
      onCancel={onCancel}
    >
      {items.map(item => (
        <div key={item.key} style={{ marginBottom: 16 }}>
          <Typography.Text strong style={{ fontFamily: 'monospace' }}>
            {item.key}
          </Typography.Text>
          <Row gutter={12} style={{ marginTop: 4 }}>
            <Col span={12}>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                Hiện tại trên Firebase
              </Typography.Text>
              <pre style={{ ...preBase, background: '#fff1f0' }}>
                {item.exists ? prettyValue(item.oldRaw) : '(chưa tồn tại — sẽ được tạo mới)'}
              </pre>
            </Col>
            <Col span={12}>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                Giá trị mới
              </Typography.Text>
              <pre style={{ ...preBase, background: '#f6ffed' }}>{prettyValue(item.newRaw)}</pre>
            </Col>
          </Row>
        </div>
      ))}
    </Modal>
  );
}
