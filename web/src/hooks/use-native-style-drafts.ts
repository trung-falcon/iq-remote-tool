import { useCallback, useMemo, useState } from "react";
import { validateRawValue } from "../../../shared/schemas";
import {
  NATIVE_STYLE_KEY,
  type NativeAdStyleConfigRaw,
  type NativeAdStyleRaw,
} from "../../../shared/native-style-meta";
import type { ParamSummary } from "../api";

// Scope being edited: the global 'default' tier or one specific layout key.
export type StyleScope = "default" | string;
type FieldKey = keyof NativeAdStyleRaw;
type FieldValue = string | number | boolean;

const parse = (raw?: string): NativeAdStyleConfigRaw => {
  if (raw && raw.trim()) {
    try {
      const v = JSON.parse(raw);
      if (v && typeof v === "object" && !Array.isArray(v))
        return v as NativeAdStyleConfigRaw;
    } catch {
      /* fall through to empty */
    }
  }
  return {};
};

const serialize = (cfg: NativeAdStyleConfigRaw): string => JSON.stringify(cfg);

const scopeObj = (
  cfg: NativeAdStyleConfigRaw,
  scope: StyleScope,
): NativeAdStyleRaw =>
  scope === "default" ? cfg.default ?? {} : cfg.layouts?.[scope] ?? {};

// Immutably write (or, when obj is undefined, remove) a scope's raw object,
// pruning empty containers so cleared scopes leave no `{}` residue in the JSON.
const writeScope = (
  cfg: NativeAdStyleConfigRaw,
  scope: StyleScope,
  obj: NativeAdStyleRaw | undefined,
): NativeAdStyleConfigRaw => {
  const next: NativeAdStyleConfigRaw = { ...cfg };
  if (scope === "default") {
    if (obj && Object.keys(obj).length) next.default = obj;
    else delete next.default;
    return next;
  }
  const layouts = { ...(cfg.layouts ?? {}) };
  if (obj && Object.keys(obj).length) layouts[scope] = obj;
  else delete layouts[scope];
  if (Object.keys(layouts).length) next.layouts = layouts;
  else delete next.layouts;
  return next;
};

export function useNativeStyleDrafts(nativeStyle: Record<string, ParamSummary>) {
  const summary = nativeStyle[NATIVE_STYLE_KEY];
  const isLive = !!summary?.exists;

  const originalString = useMemo(
    () => serialize(parse(isLive ? summary?.defaultValue : undefined)),
    [isLive, summary?.defaultValue],
  );

  // null draft = untouched → mirror the live/original value.
  const [draft, setDraft] = useState<NativeAdStyleConfigRaw | null>(null);
  const [scope, setScope] = useState<StyleScope>("default");

  const config = draft ?? parse(originalString);
  const currentString = serialize(config);
  const dirty = draft !== null && currentString !== originalString;

  const error = useMemo(
    () => (dirty ? validateRawValue(NATIVE_STYLE_KEY, currentString) : null),
    [dirty, currentString],
  );

  const mutate = useCallback(
    (fn: (cfg: NativeAdStyleConfigRaw) => NativeAdStyleConfigRaw) =>
      setDraft((d) => fn(d ?? parse(originalString))),
    [originalString],
  );

  const active = scopeObj(config, scope);
  const changes: Record<string, string> = dirty
    ? { [NATIVE_STYLE_KEY]: currentString }
    : {};

  return {
    key: NATIVE_STYLE_KEY,
    isLive,
    summary,
    scope,
    setScope,
    config,
    currentString,
    dirty,
    error,
    changes,

    // A field is "overridden" in the active scope when it's present in that scope's object.
    isOverridden: (field: FieldKey) => field in active,
    // The stored override value for the active scope (undefined when not overridden).
    overrideValue: (field: FieldKey) => active[field],

    setField: (field: FieldKey, value: FieldValue) =>
      mutate((cfg) =>
        writeScope(cfg, scope, { ...scopeObj(cfg, scope), [field]: value }),
      ),
    clearField: (field: FieldKey) =>
      mutate((cfg) => {
        const obj = { ...scopeObj(cfg, scope) };
        delete obj[field];
        return writeScope(cfg, scope, obj);
      }),

    resetAll: () => setDraft(null),
  };
}

export type NativeStyleDrafts = ReturnType<typeof useNativeStyleDrafts>;
