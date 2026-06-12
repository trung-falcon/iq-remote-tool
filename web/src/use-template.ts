import { useCallback, useEffect, useMemo, useState } from 'react';
import { APP_DEFAULTS, LAYOUTS, PARAM_KEYS, type ParamKey } from '../../shared/params';
import {
  closeConfigSchema,
  layoutWeightsSchema,
  validateRawValue,
  type CloseConfig,
  type LayoutWeights,
} from '../../shared/schemas';
import { api, type ParamSummary, type TemplateResponse } from './api';

export type Drafts = {
  timeout: number;
  closeConfig: CloseConfig;
  layoutWeights: LayoutWeights;
};

function normalizeLayoutMap(map: Record<string, number>): Record<string, number> {
  const out: Record<string, number> = {};
  for (const layout of LAYOUTS) out[layout] = map[layout] ?? 0;
  return out;
}

function normalizeLayoutWeights(lw: LayoutWeights): LayoutWeights {
  const out: LayoutWeights = {};
  for (const [event, map] of Object.entries(lw)) out[event] = normalizeLayoutMap(map);
  return out;
}

// Initialize typed drafts from the raw template values. Invalid/missing values
// fall back to the app-side defaults and produce a warning for the UI banner.
function parseDrafts(params: Record<string, ParamSummary>) {
  const warnings: string[] = [];

  let timeout: number = APP_DEFAULTS.timeout;
  const t = params[PARAM_KEYS.timeout];
  if (t?.exists) {
    const n = Number(t.defaultValue);
    if (t.defaultValue.trim() !== '' && !Number.isNaN(n)) timeout = n;
    else warnings.push(`${PARAM_KEYS.timeout}: giá trị hiện tại không phải số — form khởi tạo từ default của app`);
  }

  let closeConfig = structuredClone(APP_DEFAULTS.closeConfig) as CloseConfig;
  const c = params[PARAM_KEYS.closeConfig];
  if (c?.exists && c.defaultValue.trim()) {
    try {
      closeConfig = closeConfigSchema.parse(JSON.parse(c.defaultValue));
    } catch {
      warnings.push(`${PARAM_KEYS.closeConfig}: JSON hiện tại không hợp lệ — form khởi tạo từ default của app`);
    }
  }

  let layoutWeights = structuredClone(APP_DEFAULTS.layoutWeights) as LayoutWeights;
  const l = params[PARAM_KEYS.layoutWeights];
  if (l?.exists && l.defaultValue.trim()) {
    try {
      layoutWeights = layoutWeightsSchema.parse(JSON.parse(l.defaultValue));
    } catch {
      warnings.push(`${PARAM_KEYS.layoutWeights}: JSON hiện tại không hợp lệ — form khởi tạo từ default của app`);
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

export function useTemplate() {
  const [data, setData] = useState<TemplateResponse | null>(null);
  const [drafts, setDrafts] = useState<Drafts | null>(null);
  const [initialSerialized, setInitialSerialized] = useState<Record<ParamKey, string> | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const template = await api.getTemplate();
      const parsed = parseDrafts(template.params);
      setData(template);
      setDrafts(parsed.drafts);
      setWarnings(parsed.warnings);
      setInitialSerialized(serializeDrafts(parsed.drafts));
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const serialized = useMemo(() => (drafts ? serializeDrafts(drafts) : null), [drafts]);

  // Dirty = serialization differs from the serialization at load time. Formatting
  // differences in the raw console value never count as dirty.
  const dirtyKeys = useMemo(() => {
    if (!serialized || !initialSerialized) return [] as ParamKey[];
    return (Object.keys(serialized) as ParamKey[]).filter(
      k => serialized[k] !== initialSerialized[k],
    );
  }, [serialized, initialSerialized]);

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

  const updateTimeout = useCallback((timeout: number) => {
    setDrafts(d => (d ? { ...d, timeout } : d));
  }, []);

  const updateCloseConfig = useCallback((closeConfig: CloseConfig) => {
    setDrafts(d => (d ? { ...d, closeConfig } : d));
  }, []);

  const updateLayoutWeights = useCallback((layoutWeights: LayoutWeights) => {
    setDrafts(d => (d ? { ...d, layoutWeights } : d));
  }, []);

  return {
    loading,
    loadError,
    etag: data?.etag ?? null,
    version: data?.version,
    params: data?.params ?? {},
    drafts,
    warnings,
    dirtyKeys,
    errors,
    changes,
    updateTimeout,
    updateCloseConfig,
    updateLayoutWeights,
    reload: load,
  };
}
