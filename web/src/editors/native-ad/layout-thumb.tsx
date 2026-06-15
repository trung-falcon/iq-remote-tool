import { Tooltip } from 'antd';
import { LAYOUT_DESCRIPTIONS, LAYOUT_NAMES } from '../../../../shared/native-ad-meta';

// Schematic mini-mockups of the 3 small native layouts (SmallNativeLayout1/2/3).
// NOT a real ad — just a visual cue of where media / text / button sit so the
// person editing knows what each `random` weight selects.
const C = { card: '#0b1020', border: '#1e2536', media: 'rgba(59,130,246,0.28)', line: '#334155', btn: '#3b82f6' };

function Lines({ n }: { n: number }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3, justifyContent: 'center' }}>
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} style={{ height: 5, borderRadius: 3, background: C.line, width: i === 0 ? '70%' : '100%' }} />
      ))}
    </div>
  );
}
const media = (size: number): React.CSSProperties => ({ width: size, height: size, background: C.media, borderRadius: 5, flexShrink: 0 });
const btn = (w: number | string): React.CSSProperties => ({ height: 11, borderRadius: 6, background: C.btn, width: w, flexShrink: 0 });
const frame: React.CSSProperties = { width: '100%', background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 8, display: 'flex', gap: 6 };

function Thumb({ idx }: { idx: 3 | 4 | 5 }) {
  if (idx === 3) {
    return (
      <div style={{ ...frame, flexDirection: 'row', alignItems: 'stretch', minHeight: 72 }}>
        <div style={media(46)} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, justifyContent: 'space-between' }}>
          <Lines n={2} />
          <div style={btn('100%')} />
        </div>
      </div>
    );
  }
  if (idx === 5) {
    return (
      <div style={{ ...frame, flexDirection: 'row', alignItems: 'center' }}>
        <div style={media(24)} />
        <div style={{ ...media(24), borderRadius: 7 }} />
        <Lines n={2} />
        <div style={btn(34)} />
      </div>
    );
  }
  return (
    <div style={{ ...frame, flexDirection: 'column' }}>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <div style={media(38)} />
        <Lines n={2} />
      </div>
      <div style={btn('100%')} />
    </div>
  );
}

export function LayoutThumb({ idx }: { idx: 3 | 4 | 5 }) {
  const i = idx - 3;
  return (
    <Tooltip title={`${LAYOUT_NAMES[i]} — ${LAYOUT_DESCRIPTIONS[i]}`}>
      <div>
        <Thumb idx={idx} />
      </div>
    </Tooltip>
  );
}
