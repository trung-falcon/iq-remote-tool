import { Modal, Typography } from 'antd';
import { prettyValue } from './json-preview';

export type DiffItem = {
  key: string;
  oldRaw: string; // current value on Firebase ('' when param doesn't exist yet)
  newRaw: string; // value that will be published
  exists: boolean;
  deleted?: boolean; // param will be removed from the template entirely
};

type Row = { type: 'eq' | 'add' | 'del'; text: string };

// Git-style unified line diff via LCS. Only lines that actually differ are
// marked added / removed; shared lines stay neutral. O(n·m) — fine for
// config-sized JSON.
function diffLines(oldStr: string, newStr: string): Row[] {
  const a = oldStr === '' ? [] : oldStr.split('\n');
  const b = newStr === '' ? [] : newStr.split('\n');
  const n = a.length;
  const m = b.length;

  // lcs[i][j] = length of the longest common subsequence of a[i:] and b[j:].
  const lcs: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      lcs[i][j] = a[i] === b[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }

  const rows: Row[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      rows.push({ type: 'eq', text: a[i] });
      i++;
      j++;
    } else if (lcs[i + 1][j] >= lcs[i][j + 1]) {
      rows.push({ type: 'del', text: a[i] });
      i++;
    } else {
      rows.push({ type: 'add', text: b[j] });
      j++;
    }
  }
  while (i < n) rows.push({ type: 'del', text: a[i++] });
  while (j < m) rows.push({ type: 'add', text: b[j++] });
  return rows;
}

type Cell = { text: string; changed: boolean } | null;

// Turn the unified diff into aligned side-by-side rows: removed lines line up on
// the left (red), added lines on the right (green), unchanged lines on both.
// Consecutive del/add runs are paired row-by-row so edits sit next to each other.
function toSideBySide(rows: Row[]): { left: Cell; right: Cell }[] {
  const out: { left: Cell; right: Cell }[] = [];
  let dels: string[] = [];
  let adds: string[] = [];
  const flush = () => {
    const len = Math.max(dels.length, adds.length);
    for (let k = 0; k < len; k++) {
      out.push({
        left: k < dels.length ? { text: dels[k], changed: true } : null,
        right: k < adds.length ? { text: adds[k], changed: true } : null,
      });
    }
    dels = [];
    adds = [];
  };
  for (const row of rows) {
    if (row.type === 'del') dels.push(row.text);
    else if (row.type === 'add') adds.push(row.text);
    else {
      flush();
      out.push({ left: { text: row.text, changed: false }, right: { text: row.text, changed: false } });
    }
  }
  flush();
  return out;
}

const codeBlock: React.CSSProperties = {
  margin: '4px 0 0',
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  fontSize: 12.5,
  lineHeight: 1.6,
  borderRadius: 8,
  border: '1px solid #1e2536',
  background: '#0b1020',
  maxHeight: 320,
  overflow: 'auto',
};

const cellBase: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-all',
  padding: '0 12px',
};

function HalfCell({ cell, side }: { cell: Cell; side: 'left' | 'right' }) {
  if (!cell) {
    // No counterpart line on this side — faint filler so rows stay aligned.
    return <div style={{ ...cellBase, background: 'rgba(148,163,184,0.05)' }}>{' '}</div>;
  }
  const changedStyle =
    side === 'left'
      ? { background: 'rgba(239,68,68,0.14)', color: '#fca5a5' }
      : { background: 'rgba(34,197,94,0.14)', color: '#86efac' };
  return (
    <div style={{ ...cellBase, ...(cell.changed ? changedStyle : { color: '#8b97ad' }) }}>
      {cell.text || ' '}
    </div>
  );
}

function DiffView({ oldStr, newStr }: { oldStr: string; newStr: string }) {
  const lines = toSideBySide(diffLines(oldStr, newStr));
  if (lines.length === 0) {
    return (
      <pre style={{ ...codeBlock, padding: '10px 12px', color: '#64748b' }}>(không có thay đổi)</pre>
    );
  }
  return (
    <div style={codeBlock}>
      {lines.map((line, idx) => (
        <div key={idx} style={{ display: 'flex' }}>
          <HalfCell cell={line.left} side="left" />
          <div style={{ width: 1, flexShrink: 0, background: '#1e2536' }} />
          <HalfCell cell={line.right} side="right" />
        </div>
      ))}
    </div>
  );
}

type Props = {
  open: boolean;
  items: DiffItem[];
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

// Confirmation step before publishing: side-by-side diff per param, with only the
// changed lines highlighted (red on the left = removed, green on the right = added).
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
              <DiffView oldStr={prettyValue(item.oldRaw)} newStr="" />
            </>
          ) : (
            <>
              <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
                {item.exists ? 'Khác biệt so với Firebase (đỏ = cũ, xanh = mới)' : '(chưa tồn tại — sẽ được tạo mới)'}
              </Typography.Text>
              <DiffView
                oldStr={item.exists ? prettyValue(item.oldRaw) : ''}
                newStr={prettyValue(item.newRaw)}
              />
            </>
          )}
        </div>
      ))}
    </Modal>
  );
}
