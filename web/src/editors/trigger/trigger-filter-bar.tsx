import { Tag } from 'antd';
import { type Trigger } from '../../../../shared/trigger-meta';

const { CheckableTag } = Tag;

export const TRIGGER_FACETS = [
  { key: 'showAd', label: 'Show ads' },
  { key: 'paywall', label: 'Paywall' },
  { key: 'enableAd', label: 'Enable ad' },
  { key: 'disableAd', label: 'Disable ad' },
  { key: 'superwallPreload', label: 'Preload' },
] as const;

// Which features a trigger configures — drives the list facet filter.
export function computeFacets(t: Trigger): string[] {
  const f: string[] = [];
  if (t.showAd?.active) f.push('showAd');
  if (t.paywall?.active) f.push('paywall');
  if (t.enableAd?.length) f.push('enableAd');
  if (t.disableAd?.ads?.length) f.push('disableAd');
  if (t.superwallPreload?.length) f.push('superwallPreload');
  return f;
}

// Checkable facet chips; a trigger must match ALL checked facets (AND).
export function TriggerFilterBar({
  value,
  onChange,
}: {
  value: string[];
  onChange: (next: string[]) => void;
}) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
      {TRIGGER_FACETS.map(f => (
        <CheckableTag
          key={f.key}
          checked={value.includes(f.key)}
          onChange={c => onChange(c ? [...value, f.key] : value.filter(k => k !== f.key))}
        >
          {f.label}
        </CheckableTag>
      ))}
    </div>
  );
}
