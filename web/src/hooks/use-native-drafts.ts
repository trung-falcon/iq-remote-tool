import { useEffect, useMemo, useState } from 'react';
import {
  APP_DEFAULTS,
  DEFAULT_MODE_WEIGHTS,
  LAYOUTS,
  PARAM_KEYS,
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

const ZERO_CORNERS = { TR: 0, TL: 0, BR: 0, BL: 0 };

// Materialize modeWeights/positionWeights while preserving every other field
// (preClose.mode + unknown keys). Absent positionWeights → all-zero (≡ native TR).
function normalizeCloseConfig(raw: Record<string, any>): CloseConfig {
  const pre = raw.preClose ?? {};
  const close = raw.close ?? {};
  return {
    ...raw,
    enabled: raw.enabled !== false,
    preClose: {
      ...pre,
      delaySeconds: typeof pre.delaySeconds === 'number' ? pre.delaySeconds : 0,
      modeWeights: pre.modeWeights
        ? { fakeX: 0, openStore: 0, countdown: 0, ...pre.modeWeights }
        : { ...DEFAULT_MODE_WEIGHTS },
      positionWeights: { ...ZERO_CORNERS, ...(pre.positionWeights ?? {}) },
    },
    close: {
      ...close,
      delaySeconds: typeof close.delaySeconds === 'number' ? close.delaySeconds : 0,
      positionWeights: { ...ZERO_CORNERS, ...(close.positionWeights ?? {}) },
    },
  } as CloseConfig;
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

function serializeDrafts(d: Drafts): Record<ParamKey, string> {
  return {
    [PARAM_KEYS.timeout]: String(d.timeout),
    [PARAM_KEYS.closeConfig]: JSON.stringify(d.closeConfig),
    [PARAM_KEYS.layoutWeights]: JSON.stringify(d.layoutWeights),
  };
}

// Native fullscreen draft state, derived from the shared template `params`.
export function useNativeDrafts(params: Record<string, ParamSummary>) {
  const [drafts, setDrafts] = useState<Drafts | null>(null);
  const [initial, setInitial] = useState<Record<ParamKey, string> | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  // Re-parse whenever the template reloads (params object identity changes).
  useEffect(() => {
    const parsed = parseDrafts(params);
    setDrafts(parsed.drafts);
    setWarnings(parsed.warnings);
    setInitial(serializeDrafts(parsed.drafts));
  }, [params]);

  const serialized = useMemo(() => (drafts ? serializeDrafts(drafts) : null), [drafts]);

  const dirtyKeys = useMemo(() => {
    if (!serialized || !initial) return [] as ParamKey[];
    return (Object.keys(serialized) as ParamKey[]).filter(k => serialized[k] !== initial[k]);
  }, [serialized, initial]);

  const errors = useMemo(() => {
    const out: Partial<Record<ParamKey, string>> = {};
    if (!serialized) return out;
    for (const key of Object.keys(serialized) as ParamKey[]) {
      const message = validateRawValue(key, serialized[key]);
      if (message) out[key] = message;
    }
    return out;
  }, [serialized]);

  const changes = useMemo(
    () => Object.fromEntries(dirtyKeys.map(k => [k, serialized![k]])),
    [dirtyKeys, serialized],
  );

  return {
    drafts,
    warnings,
    dirtyKeys,
    errors,
    changes,
    updateTimeout: (timeout: number) => setDrafts(d => (d ? { ...d, timeout } : d)),
    updateCloseConfig: (closeConfig: CloseConfig) => setDrafts(d => (d ? { ...d, closeConfig } : d)),
    updateLayoutWeights: (layoutWeights: LayoutWeights) =>
      setDrafts(d => (d ? { ...d, layoutWeights } : d)),
  };
}
