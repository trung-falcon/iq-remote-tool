import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  DEFAULT_NATIVE_AD_CONFIG,
  NATIVE_AD_KEYS,
  type NativeAdConfig,
} from '../../../shared/native-ad-meta';
import { validateRawValue } from '../../../shared/schemas';
import type { ParamSummary } from '../api';

// Parse a stored value, preserving unknown fields. Falls back to the app default
// (used as the baseline for not-yet-published placements).
const parseConfig = (raw?: string): NativeAdConfig => {
  if (raw && raw.trim()) {
    try {
      const v = JSON.parse(raw);
      if (v && typeof v === 'object' && !Array.isArray(v)) return v as NativeAdConfig;
    } catch {
      /* fall through to default */
    }
  }
  return structuredClone(DEFAULT_NATIVE_AD_CONFIG);
};

const serialize = (c: NativeAdConfig): string => JSON.stringify(c);

// Draft state for inline native ad placements (control_native_*). The 8-key catalog
// is always listed; a key not on Firebase shows the app default and becomes a CREATE
// once its draft differs from default. Live keys can be edited or deleted. Everything
// flows through the shared publish flow (validate → diff → publish → etag 409).
export function useNativeAdDrafts(nativeAds: Record<string, ParamSummary>) {
  const [drafts, setDrafts] = useState<Record<string, NativeAdConfig>>({});
  const [deletes, setDeletes] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  // On reload, drop delete marks for keys that are already gone from the template.
  useEffect(() => {
    setDeletes(d => d.filter(k => k in nativeAds));
  }, [nativeAds]);

  const isLive = useCallback((key: string) => key in nativeAds, [nativeAds]);

  // Catalog (fixed order) ∪ any extra control_native_* discovered on Firebase.
  const keys = useMemo(() => {
    const extra = Object.keys(nativeAds).filter(k => !NATIVE_AD_KEYS.includes(k)).sort();
    return [...NATIVE_AD_KEYS, ...extra];
  }, [nativeAds]);

  // Baseline to compare a draft against: the live stored value, or the app default
  // for a placement not yet on Firebase.
  const originalString = useCallback(
    (key: string) => serialize(parseConfig(isLive(key) ? nativeAds[key]?.defaultValue : undefined)),
    [nativeAds, isLive],
  );

  const currentString = useCallback(
    (key: string) => (drafts[key] ? serialize(drafts[key]) : originalString(key)),
    [drafts, originalString],
  );

  const select = useCallback(
    (key: string) => {
      setDrafts(d => (d[key] ? d : { ...d, [key]: parseConfig(isLive(key) ? nativeAds[key]?.defaultValue : undefined) }));
      setSelected(key);
    },
    [nativeAds, isLive],
  );

  // Reset a draft back to its baseline (revert edits / drop a pending create).
  const discardDraft = useCallback(
    (key: string) =>
      setDrafts(d => ({ ...d, [key]: parseConfig(isLive(key) ? nativeAds[key]?.defaultValue : undefined) })),
    [nativeAds, isLive],
  );

  const toggleDelete = useCallback((key: string) => {
    setDeletes(d => (d.includes(key) ? d.filter(k => k !== key) : [...d, key]));
  }, []);

  const dirtyKeys = useMemo(
    () => keys.filter(k => deletes.includes(k) || (!!drafts[k] && currentString(k) !== originalString(k))),
    [keys, deletes, drafts, currentString, originalString],
  );

  // Deleted keys are removed (not written) — exclude from changes.
  const changes = useMemo(
    () => Object.fromEntries(dirtyKeys.filter(k => !deletes.includes(k)).map(k => [k, currentString(k)])),
    [dirtyKeys, deletes, currentString],
  );

  const errors = useMemo(() => {
    const out: Record<string, string> = {};
    for (const k of dirtyKeys) {
      if (deletes.includes(k)) continue;
      const msg = validateRawValue(k, currentString(k));
      if (msg) out[k] = msg;
    }
    return out;
  }, [dirtyKeys, deletes, currentString]);

  return {
    keys,
    selected,
    select,
    draft: selected ? drafts[selected] : undefined,
    update: (c: NativeAdConfig) => setDrafts(d => (selected ? { ...d, [selected]: c } : d)),
    discardDraft,
    toggleDelete,
    deletes,
    isLive,
    isNew: (k: string) => !isLive(k) && dirtyKeys.includes(k),
    isDeleting: (k: string) => deletes.includes(k),
    isDirty: (k: string) => dirtyKeys.includes(k),
    dirtyKeys,
    changes,
    errors,
    currentString,
  };
}
