import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  APP_DEFAULTS,
  DEFAULT_MODE_WEIGHTS,
  LAYOUTS,
  PARAM_KEYS,
  stripPlatformPrefix,
  type ParamKey,
} from '../../../shared/params';
import {
  closeConfigSchema,
  describeError,
  layoutWeightsSchema,
  validateRawValue,
  type CloseConfig,
  type LayoutWeights,
} from '../../../shared/schemas';
import type { ParamSummary } from '../api';

export type Drafts = {
  timeout: number;
  closeConfig: CloseConfig;
  layoutWeights: LayoutWeights;
};

type ParseResult<T> = { draft: T; warning?: string };

type VariantFamilyState<T> = {
  selected: string;
  selectOrCreate: (key: string) => void;
  draft: T;
  update: (next: T) => void;
  variantExists: (key: string) => boolean;
  createVariant: (key: string) => void;
  dirtyKeys: string[];
  changes: Record<string, string>;
  error: string | null;
  isDirty: (key: string) => boolean;
  currentString: (key: string) => string;
  summaryFor: (key: string) => ParamSummary | undefined;
  availableKeys: string[];
  warnings: string[];
};

const ZERO_CORNERS = { TR: 0, TL: 0, BR: 0, BL: 0 };
const ZERO_MODES = { fakeX: 0, openStore: 0, countdown: 0 };

// Materialize modeWeights/positionWeights while preserving every other field
// (preClose.mode + unknown keys). Absent positionWeights → all-zero (≡ native TR).
function normalizeCloseConfig(raw: Record<string, any>): CloseConfig {
  const pre = raw.preClose ?? {};
  const close = raw.close ?? {};
  const baseModeWeights = pre.modeWeights
    ? { ...ZERO_MODES, ...pre.modeWeights }
    : { ...DEFAULT_MODE_WEIGHTS };

  const out: Record<string, any> = {
    ...raw,
    enabled: raw.enabled !== false,
    preClose: {
      ...pre,
      delaySeconds: typeof pre.delaySeconds === 'number' ? pre.delaySeconds : 0,
      modeWeights: baseModeWeights,
      positionWeights: { ...ZERO_CORNERS, ...(pre.positionWeights ?? {}) },
    },
    close: {
      ...close,
      delaySeconds: typeof close.delaySeconds === 'number' ? close.delaySeconds : 0,
      positionWeights: { ...ZERO_CORNERS, ...(close.positionWeights ?? {}) },
    },
  };

  // Per-content-type overrides: materialize each present override's modeWeights so
  // the editor has concrete numbers (seed from base when absent). Other override
  // fields are preserved via spread.
  if (raw.overrides && typeof raw.overrides === 'object') {
    const ov: Record<string, any> = { ...raw.overrides };
    for (const type of Object.keys(ov)) {
      const o = ov[type];
      if (o && typeof o === 'object') {
        const opre = o.preClose ?? {};
        ov[type] = {
          ...o,
          preClose: {
            ...opre,
            modeWeights: opre.modeWeights
              ? { ...ZERO_MODES, ...opre.modeWeights }
              : { ...baseModeWeights },
          },
        };
      }
    }
    out.overrides = ov;
  }

  return out as CloseConfig;
}

// Canonical 6 layouts (in order, 0 when missing) + any extra/non-canonical keys.
function normalizeLayoutMap(map: Record<string, number>): Record<string, number> {
  const out: Record<string, number> = {};
  for (const layout of LAYOUTS) out[layout] = map[layout] ?? 0;
  for (const [k, v] of Object.entries(map)) if (!(k in out)) out[k] = v;
  return out;
}

function normalizeLayoutWeights(lw: LayoutWeights): LayoutWeights {
  const out: LayoutWeights = {};
  for (const [event, map] of Object.entries(lw)) out[event] = normalizeLayoutMap(map);
  return out;
}

function collectVariantKeys(params: Record<string, ParamSummary>, baseKey: string): string[] {
  const keys = new Set<string>();
  for (const key of Object.keys(params)) {
    if (stripPlatformPrefix(key) === baseKey) keys.add(key);
  }
  if (!keys.size) keys.add(baseKey);
  return [...keys].sort((a, b) => {
    const rank = (key: string) => {
      if (key === baseKey) return 0;
      if (key.startsWith('android_')) return 1;
      if (key.startsWith('ios_')) return 2;
      return 3;
    };
    return rank(a) - rank(b) || a.localeCompare(b);
  });
}

function useVariantFamily<T>({
  params,
  baseKey,
  defaultDraft,
  parseExisting,
  serialize,
}: {
  params: Record<string, ParamSummary>;
  baseKey: string;
  defaultDraft: T;
  parseExisting: (raw: string, key: string) => ParseResult<T>;
  serialize: (draft: T) => string;
}): VariantFamilyState<T> {
  const availableKeys = useMemo(() => collectVariantKeys(params, baseKey), [params, baseKey]);
  const [selected, setSelected] = useState<string>(availableKeys[0] ?? baseKey);
  const [drafts, setDrafts] = useState<Record<string, T>>({});
  const [created, setCreated] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);

  useEffect(() => {
    setDrafts({});
    setCreated([]);
    setWarnings([]);
    setSelected(current => (availableKeys.includes(current) ? current : availableKeys[0] ?? baseKey));
  }, [availableKeys, baseKey]);

  const rawOf = useCallback((key: string) => params[key]?.defaultValue ?? '', [params]);
  const summaryFor = useCallback((key: string) => params[key], [params]);

  useEffect(() => {
    if (!selected) return;
    const parsed = parseExisting(rawOf(selected), selected);
    setDrafts(current => {
      if (current[selected]) return current;
      return { ...current, [selected]: parsed.draft };
    });
    if (parsed.warning) {
      setWarnings(current => (current.includes(parsed.warning!) ? current : [...current, parsed.warning!]));
    }
  }, [selected, rawOf, parseExisting]);

  const variantExists = useCallback(
    (key: string) => availableKeys.includes(key) || created.includes(key),
    [availableKeys, created],
  );

  const createVariant = useCallback(
    (key: string, seed?: T) => {
      setCreated(current => (current.includes(key) ? current : [...current, key]));
      setDrafts(current =>
        current[key]
          ? current
          : { ...current, [key]: structuredClone(seed ?? defaultDraft) },
      );
      setSelected(key);
    },
    [defaultDraft],
  );

  const selectOrCreate = useCallback(
    (key: string) => {
      if (variantExists(key)) {
        setSelected(key);
        return;
      }
      const seed = selected ? drafts[selected] ?? parseExisting(rawOf(selected), selected).draft : defaultDraft;
      createVariant(key, seed);
    },
    [createVariant, defaultDraft, drafts, parseExisting, rawOf, selected, variantExists],
  );

  const currentDraft = selected ? drafts[selected] ?? parseExisting(rawOf(selected), selected).draft : defaultDraft;
  const allKeys = useMemo(
    () => [...new Set([...availableKeys, ...created])],
    [availableKeys, created],
  );

  const normalizedOriginal = useCallback(
    (key: string) => serialize(parseExisting(rawOf(key), key).draft),
    [parseExisting, rawOf, serialize],
  );
  const currentString = useCallback(
    (key: string) => serialize(drafts[key] ?? parseExisting(rawOf(key), key).draft),
    [drafts, parseExisting, rawOf, serialize],
  );

  const dirtyKeys = useMemo(
    () =>
      allKeys.filter(
        key => created.includes(key) || (!!drafts[key] && currentString(key) !== normalizedOriginal(key)),
      ),
    [allKeys, created, currentString, drafts, normalizedOriginal],
  );

  const changes = useMemo(
    () => Object.fromEntries(dirtyKeys.map(key => [key, currentString(key)])),
    [dirtyKeys, currentString],
  );

  const error = useMemo(
    () => (selected && dirtyKeys.includes(selected) ? validateRawValue(selected, currentString(selected)) : null),
    [currentString, dirtyKeys, selected],
  );

  return {
    selected,
    selectOrCreate,
    draft: currentDraft,
    update: (next: T) => setDrafts(current => ({ ...current, [selected]: next })),
    variantExists,
    createVariant: (key: string) => createVariant(key),
    dirtyKeys,
    changes,
    error,
    isDirty: (key: string) => dirtyKeys.includes(key),
    currentString,
    summaryFor,
    availableKeys,
    warnings,
  };
}

function parseDrafts(params: Record<string, ParamSummary>) {
  const warnings: string[] = [];

  let timeout: number = APP_DEFAULTS.timeout;
  const t = params[PARAM_KEYS.timeout];
  if (t?.exists) {
    const n = Number(t.defaultValue);
    if (t.defaultValue.trim() !== '' && !Number.isNaN(n)) timeout = n;
    else warnings.push(`${PARAM_KEYS.timeout}: giá trị hiện tại không phải số — form khởi tạo từ default của app`);
  }

  let closeConfig = normalizeCloseConfig(structuredClone(APP_DEFAULTS.closeConfig));
  const c = params[PARAM_KEYS.closeConfig];
  if (c?.exists && c.defaultValue.trim()) {
    try {
      closeConfig = normalizeCloseConfig(closeConfigSchema.parse(JSON.parse(c.defaultValue)));
    } catch (e) {
      warnings.push(`${PARAM_KEYS.closeConfig}: không đọc được giá trị hiện tại (${describeError(e)}) — form khởi tạo từ default`);
    }
  }

  let layoutWeights = structuredClone(APP_DEFAULTS.layoutWeights) as LayoutWeights;
  const l = params[PARAM_KEYS.layoutWeights];
  if (l?.exists && l.defaultValue.trim()) {
    try {
      layoutWeights = layoutWeightsSchema.parse(JSON.parse(l.defaultValue));
    } catch (e) {
      warnings.push(`${PARAM_KEYS.layoutWeights}: không đọc được giá trị hiện tại (${describeError(e)}) — form khởi tạo từ default`);
    }
  }

  return {
    drafts: { timeout, closeConfig, layoutWeights: normalizeLayoutWeights(layoutWeights) },
    warnings,
  };
}

// Native fullscreen draft state, derived from the shared template `params`.
export function useNativeDrafts(params: Record<string, ParamSummary>) {
  const timeout = useVariantFamily<number>({
    params,
    baseKey: PARAM_KEYS.timeout,
    defaultDraft: APP_DEFAULTS.timeout,
    parseExisting: (raw, key) => {
      if (!raw.trim()) return { draft: APP_DEFAULTS.timeout };
      const n = Number(raw);
      if (!Number.isFinite(n)) {
        return {
          draft: APP_DEFAULTS.timeout,
          warning: `${key}: giá trị hiện tại không phải số — form khởi tạo từ default của app`,
        };
      }
      return { draft: n };
    },
    serialize: draft => String(draft),
  });

  const closeConfig = useVariantFamily<CloseConfig>({
    params,
    baseKey: PARAM_KEYS.closeConfig,
    defaultDraft: structuredClone(APP_DEFAULTS.closeConfig),
    parseExisting: (raw, key) => {
      if (!raw.trim()) return { draft: normalizeCloseConfig(structuredClone(APP_DEFAULTS.closeConfig)) };
      try {
        return { draft: normalizeCloseConfig(closeConfigSchema.parse(JSON.parse(raw))) };
      } catch (e) {
        return {
          draft: normalizeCloseConfig(structuredClone(APP_DEFAULTS.closeConfig)),
          warning: `${key}: không đọc được giá trị hiện tại (${describeError(e)}) — form khởi tạo từ default`,
        };
      }
    },
    serialize: draft => JSON.stringify(draft),
  });

  const layoutWeights = useVariantFamily<LayoutWeights>({
    params,
    baseKey: PARAM_KEYS.layoutWeights,
    defaultDraft: structuredClone(APP_DEFAULTS.layoutWeights) as LayoutWeights,
    parseExisting: (raw, key) => {
      if (!raw.trim()) {
        return { draft: normalizeLayoutWeights(structuredClone(APP_DEFAULTS.layoutWeights) as LayoutWeights) };
      }
      try {
        return { draft: normalizeLayoutWeights(layoutWeightsSchema.parse(JSON.parse(raw))) };
      } catch (e) {
        return {
          draft: normalizeLayoutWeights(structuredClone(APP_DEFAULTS.layoutWeights) as LayoutWeights),
          warning: `${key}: không đọc được giá trị hiện tại (${describeError(e)}) — form khởi tạo từ default`,
        };
      }
    },
    serialize: draft => JSON.stringify(draft),
  });

  const warnings = useMemo(
    () => [...timeout.warnings, ...closeConfig.warnings, ...layoutWeights.warnings],
    [closeConfig.warnings, layoutWeights.warnings, timeout.warnings],
  );

  const dirtyKeys = useMemo(
    () => Array.from(new Set([...timeout.dirtyKeys, ...closeConfig.dirtyKeys, ...layoutWeights.dirtyKeys])),
    [closeConfig.dirtyKeys, layoutWeights.dirtyKeys, timeout.dirtyKeys],
  );

  const changes = useMemo(
    () => ({ ...timeout.changes, ...closeConfig.changes, ...layoutWeights.changes }),
    [closeConfig.changes, layoutWeights.changes, timeout.changes],
  );

  const errors = useMemo(
    () => {
      const out: Record<string, string> = {};
      for (const key of dirtyKeys) {
        const message = validateRawValue(key, changes[key]);
        if (message) out[key] = message;
      }
      return out;
    },
    [changes, dirtyKeys],
  );

  return {
    drafts: {
      timeout: timeout.draft,
      closeConfig: closeConfig.draft,
      layoutWeights: layoutWeights.draft,
    },
    warnings,
    timeout,
    closeConfig,
    layoutWeights,
    dirtyKeys,
    errors,
    changes,
    updateTimeout: timeout.update,
    updateCloseConfig: closeConfig.update,
    updateLayoutWeights: layoutWeights.update,
  };
}
