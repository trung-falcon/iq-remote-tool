import { Card, Tag } from 'antd';

// Pretty-print a raw Remote Config string: JSON when parseable, raw otherwise.
export function prettyValue(raw: string): string {
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
}

const preStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 12.5,
  lineHeight: 1.6,
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-all',
  maxHeight: 340,
  overflow: 'auto',
  background: '#0b1020',
  color: '#c8d3e6',
  border: '1px solid #1e2536',
  borderRadius: 8,
  padding: '12px 14px',
};

// Live JSON preview of one param draft (what will be published).
export function JsonPreview({ title, value, dirty }: { title: string; value: unknown; dirty: boolean }) {
  return (
    <Card
      size="small"
      title={<span style={{ fontFamily: 'monospace', fontSize: 12, color: '#93c5fd' }}>{title}</span>}
      extra={dirty && <Tag color="orange">đã sửa</Tag>}
      style={{ marginBottom: 12 }}
    >
      <pre style={preStyle}>{JSON.stringify(value, null, 2)}</pre>
    </Card>
  );
}
