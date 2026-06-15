import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  defaultForKind,
  SCREEN_CATALOG,
  screenKindOf,
  type ScreenConfig,
} from '../../../shared/screen-native-meta';
import { validateRawValue } from '../../../shared/schemas';
import type { ParamSummary } from '../api';

const CATALOG_KEYS = SCREEN_CATALOG.map(s => s.key);

// Parse a stored screen config, preserving unknown fields. Falls back to the
// per-kind default (baseline for a not-yet-published screen).
const parseConfig = (key: string, raw?: string): ScreenConfig => {
  if (raw && raw.trim()) {
    try {
      const v = JSON.parse(raw);
      if (v && typeof v === 'object' && !Array.isArray(v)) return v as ScreenConfig;
    } catch {
      /* fall through to default */
    }
  }
  return defaultForKind(screenKindOf(key));
};

const serialize = (c: ScreenConfig): string => JSON.stringify(c);

// Draft state for per-screen native configs (control_onboard_screen_* +
// control_language_screens). Catalog of 13 screens always listed; a screen not on
// Firebase shows its app default and becomes a CREATE once its draft differs.
export function useScreenNativeDrafts(screens: Record<string, ParamSummary>) {
  const [drafts, setDrafts] = useState<Record<string, ScreenConfig>>({});
  const [deletes, setDeletes] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    setDeletes(d => d.filter(k => k in screens));
  }, [screens]);

  const isLive = useCallback((key: string) => key in screens, [screens]);

  const keys = useMemo(() => {
    const extra = Object.keys(screens).filter(k => !CATALOG_KEYS.includes(k)).sort();
    return [...CATALOG_KEYS, ...extra];
  }, [screens]);

  const originalString = useCallback(
    (key: string) => serialize(parseConfig(key, isLive(key) ? screens[key]?.defaultValue : undefined)),
    [screens, isLive],
  );
  const currentString = useCallback(
    (key: string) => (drafts[key] ? serialize(drafts[key]) : originalString(key)),
    [drafts, originalString],
  );

  const select = useCallback(
    (key: string) => {
      setDrafts(d =>
        d[key] ? d : { ...d, [key]: parseConfig(key, isLive(key) ? screens[key]?.defaultValue : undefined) },
      );
      setSelected(key);
    },
    [screens, isLive],
  );

  // Reset a draft to its baseline (revert edits / drop a pending create).
  const discardDraft = useCallback(
    (key: string) =>
      setDrafts(d => ({ ...d, [key]: parseConfig(key, isLive(key) ? screens[key]?.defaultValue : undefined) })),
    [screens, isLive],
  );

  const toggleDelete = useCallback((key: string) => {
    setDeletes(d => (d.includes(key) ? d.filter(k => k !== key) : [...d, key]));
  }, []);

  const dirtyKeys = useMemo(
    () => keys.filter(k => deletes.includes(k) || (!!drafts[k] && currentString(k) !== originalString(k))),
    [keys, deletes, drafts, currentString, originalString],
  );

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
    update: (c: ScreenConfig) => setDrafts(d => (selected ? { ...d, [selected]: c } : d)),
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
