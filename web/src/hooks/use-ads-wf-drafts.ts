import { useCallback, useMemo, useState } from 'react';
import {
  ADS_SCALAR_FIELDS,
  ADS_WF_KEYS,
  DEFAULT_ADS_CONFIG,
  type AdsRemoteConfig,
} from '../../../shared/ads-wf-meta';
import { validateRawValue } from '../../../shared/schemas';
import type { ParamSummary } from '../api';

function parseRaw(raw: string): Record<string, any> {
  if (!raw || !raw.trim()) return {};
  try {
    const v = JSON.parse(raw);
    return v && typeof v === 'object' && !Array.isArray(v) ? v : {};
  } catch {
    return {};
  }
}

// Editable draft: timing fields materialized from default, ids as-is, unknown kept.
function toDraft(raw: string): AdsRemoteConfig {
  const parsed = parseRaw(raw);
  return { ...DEFAULT_ADS_CONFIG, ...parsed, ids: Array.isArray(parsed.ids) ? parsed.ids : [] };
}

// Preservation-first: start from the original stored object (keeps unknown keys
// and the exact set of present keys), overwrite present scalars in place, add a
// scalar only when the user changed it from default; ids always reflects edits.
function serialize(draft: AdsRemoteConfig, raw: string): string {
  const original = parseRaw(raw);
  const out: Record<string, any> = { ...original };
  for (const f of ADS_SCALAR_FIELDS) {
    if (f in original) out[f] = (draft as any)[f];
    else if ((draft as any)[f] !== (DEFAULT_ADS_CONFIG as any)[f]) out[f] = (draft as any)[f];
  }
  out.ids = draft.ids;
  // adaptiveCooldown is a nested object the editor owns: write the draft's value,
  // or drop the key entirely when cleared (≡ app falls back to coolDownTime).
  if (draft.adaptiveCooldown) out.adaptiveCooldown = draft.adaptiveCooldown;
  else delete out.adaptiveCooldown;
  return JSON.stringify(out);
}

export function useAdsWfDrafts(adsWf: Record<string, ParamSummary>) {
  const firstExisting = ADS_WF_KEYS.find(k => adsWf[k]?.exists) ?? ADS_WF_KEYS[0];
  const [selected, setSelected] = useState<string>(firstExisting);
  const [drafts, setDrafts] = useState<Record<string, AdsRemoteConfig>>({});
  const [created, setCreated] = useState<string[]>([]);

  const rawOf = useCallback((key: string) => adsWf[key]?.defaultValue ?? '', [adsWf]);
  const variantExists = useCallback(
    (key: string) => !!adsWf[key]?.exists || created.includes(key),
    [adsWf, created],
  );

  const draft = drafts[selected] ?? toDraft(rawOf(selected));

  const update = useCallback(
    (next: AdsRemoteConfig) => setDrafts(d => ({ ...d, [selected]: next })),
    [selected],
  );

  const createVariant = useCallback((key: string) => {
    setCreated(c => (c.includes(key) ? c : [...c, key]));
    setDrafts(d => (d[key] ? d : { ...d, [key]: { ...DEFAULT_ADS_CONFIG, ids: [] } }));
    setSelected(key);
  }, []);

  const normalizedOriginal = useCallback(
    (key: string) => serialize(toDraft(rawOf(key)), rawOf(key)),
    [rawOf],
  );
  const currentString = useCallback(
    (key: string) => serialize(drafts[key] ?? toDraft(rawOf(key)), rawOf(key)),
    [drafts, rawOf],
  );

  const dirtyKeys = useMemo(
    () =>
      (ADS_WF_KEYS as readonly string[]).filter(
        k => created.includes(k) || (!!drafts[k] && currentString(k) !== normalizedOriginal(k)),
      ),
    [drafts, created, currentString, normalizedOriginal],
  );

  const changes = useMemo(
    () => Object.fromEntries(dirtyKeys.map(k => [k, currentString(k)])),
    [dirtyKeys, currentString],
  );

  const error = useMemo(
    () => (dirtyKeys.includes(selected) ? validateRawValue(selected, currentString(selected)) : null),
    [dirtyKeys, selected, currentString],
  );

  return {
    selected,
    setSelected,
    draft,
    update,
    variantExists,
    createVariant,
    isDirty: (k: string) => dirtyKeys.includes(k),
    dirtyKeys,
    changes,
    error,
    currentObject: () => JSON.parse(currentString(selected)),
  };
}
