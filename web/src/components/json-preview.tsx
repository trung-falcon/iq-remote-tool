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
  fontSize: 12,
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-all',
  maxHeight: 320,
  overflow: 'auto',
};

// Live JSON preview of one param draft (what will be published).
export function JsonPreview({ title, value, dirty }: { title: string; value: unknown; dirty: boolean }) {
  return (
    <Card
      size="small"
      title={<span style={{ fontFamily: 'monospace', fontSize: 12 }}>{title}</span>}
      extra={dirty && <Tag color="orange">đã sửa</Tag>}
      style={{ marginBottom: 12 }}
    >
      <pre style={preStyle}>{JSON.stringify(value, null, 2)}</pre>
    </Card>
  );
}
