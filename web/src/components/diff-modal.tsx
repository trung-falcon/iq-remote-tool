import { Col, Modal, Row, Typography } from 'antd';
import { prettyValue } from './json-preview';

export type DiffItem = {
  key: string;
  oldRaw: string; // current value on Firebase ('' when param doesn't exist yet)
  newRaw: string; // value that will be published
  exists: boolean;
  deleted?: boolean; // param will be removed from the template entirely
};

const preBase: React.CSSProperties = {
  fontSize: 12.5,
  lineHeight: 1.6,
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-all',
  padding: '10px 12px',
  borderRadius: 8,
  maxHeight: 280,
  overflow: 'auto',
  margin: '4px 0 0',
};

const oldStyle: React.CSSProperties = {
  ...preBase,
  background: 'rgba(239,68,68,0.10)',
  border: '1px solid rgba(239,68,68,0.3)',
  color: '#fca5a5',
};

const newStyle: React.CSSProperties = {
  ...preBase,
  background: 'rgba(34,197,94,0.10)',
  border: '1px solid rgba(34,197,94,0.3)',
  color: '#86efac',
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
          {item.deleted ? (
            <>
              <Typography.Text type="danger" style={{ fontSize: 12, display: 'block' }}>
                🗑 Sẽ XÓA HẲN param này khỏi Firebase (app dùng in-app default)
              </Typography.Text>
              <pre style={oldStyle}>{prettyValue(item.oldRaw)}</pre>
            </>
          ) : (
            <Row gutter={12} style={{ marginTop: 4 }}>
              <Col span={12}>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  Hiện tại trên Firebase
                </Typography.Text>
                <pre style={oldStyle}>
                  {item.exists ? prettyValue(item.oldRaw) : '(chưa tồn tại — sẽ được tạo mới)'}
                </pre>
              </Col>
              <Col span={12}>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  Giá trị mới
                </Typography.Text>
                <pre style={newStyle}>{prettyValue(item.newRaw)}</pre>
              </Col>
            </Row>
          )}
        </div>
      ))}
    </Modal>
  );
}
