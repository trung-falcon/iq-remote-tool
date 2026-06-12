import { useCallback, useMemo, useState } from 'react';
import { validateRawValue } from '../../../shared/schemas';
import { DEFAULT_TRIGGER, triggerKeyFor, type Trigger } from '../../../shared/trigger-meta';
import type { ParamSummary } from '../api';
import { parseTrigger, serializeTriggerString } from './trigger-serialize';

// Trigger draft state derived from the shared template `triggers` map. Holds drafts
// per opened key; supports creating a new trigger (published on save) and discarding
// an unpublished new draft. Dirty/changes computed via normalized minimal serialize.
export function useTriggerDrafts(triggers: Record<string, ParamSummary>) {
  const [drafts, setDrafts] = useState<Record<string, Trigger>>({});
  const [newKeys, setNewKeys] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  const keys = useMemo(
    () => Array.from(new Set([...Object.keys(triggers), ...newKeys])).sort(),
    [triggers, newKeys],
  );

  const normalizedOriginal = useCallback(
    (key: string) => serializeTriggerString(parseTrigger(triggers[key]?.defaultValue)),
    [triggers],
  );

  const currentString = useCallback(
    (key: string) => (drafts[key] ? serializeTriggerString(drafts[key]) : normalizedOriginal(key)),
    [drafts, normalizedOriginal],
  );

  const select = useCallback(
    (key: string) => {
      setDrafts(d => (d[key] ? d : { ...d, [key]: parseTrigger(triggers[key]?.defaultValue) }));
      setSelected(key);
    },
    [triggers],
  );

  const createTrigger = useCallback(
    (event: string) => {
      const key = triggerKeyFor(event);
      setNewKeys(n => (triggers[key] || n.includes(key) ? n : [...n, key]));
      setDrafts(d => (d[key] ? d : { ...d, [key]: structuredClone(DEFAULT_TRIGGER) }));
      setSelected(key);
      return key;
    },
    [triggers],
  );

  // Only an unpublished, locally-created trigger can be discarded (no remote delete).
  const discardNew = useCallback((key: string) => {
    setNewKeys(n => n.filter(k => k !== key));
    setDrafts(d => {
      const { [key]: _drop, ...rest } = d;
      return rest;
    });
    setSelected(s => (s === key ? null : s));
  }, []);

  const dirtyKeys = useMemo(
    () =>
      keys.filter(
        k => newKeys.includes(k) || (!!drafts[k] && currentString(k) !== normalizedOriginal(k)),
      ),
    [keys, newKeys, drafts, currentString, normalizedOriginal],
  );

  const changes = useMemo(
    () => Object.fromEntries(dirtyKeys.map(k => [k, currentString(k)])),
    [dirtyKeys, currentString],
  );

  const errors = useMemo(() => {
    const out: Record<string, string> = {};
    for (const k of dirtyKeys) {
      const msg = validateRawValue(k, currentString(k));
      if (msg) out[k] = msg;
    }
    return out;
  }, [dirtyKeys, currentString]);

  return {
    keys,
    selected,
    select,
    draft: selected ? drafts[selected] : undefined,
    updateDraft: (t: Trigger) => setDrafts(d => (selected ? { ...d, [selected]: t } : d)),
    createTrigger,
    discardNew,
    isNew: (k: string) => newKeys.includes(k),
    isDirty: (k: string) => dirtyKeys.includes(k),
    dirtyKeys,
    changes,
    errors,
    currentString,
  };
}
