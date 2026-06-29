import { useCallback, useMemo, useState } from "react";
import { validateRawValue } from "../../../shared/schemas";
import {
  DEFAULT_INLINE_AD_CONFIGS,
  INLINE_AD_KEY_LIST,
  type InlineAdConfig,
  type InlineAdKey,
} from "../../../shared/inline-ad-meta";
import type { ParamSummary } from "../api";

const parseConfig = (key: InlineAdKey, raw?: string): InlineAdConfig => {
  if (raw && raw.trim()) {
    try {
      const value = JSON.parse(raw);
      if (value && typeof value === "object" && !Array.isArray(value))
        return value as InlineAdConfig;
    } catch {
      /* fall through to default */
    }
  }
  return DEFAULT_INLINE_AD_CONFIGS[key];
};

const serialize = (value: InlineAdConfig): string => JSON.stringify(value);

export function useInlineAdDrafts(inlineAds: Record<string, ParamSummary>) {
  const [drafts, setDrafts] = useState<
    Partial<Record<InlineAdKey, InlineAdConfig>>
  >({});
  const [selected, setSelected] = useState<InlineAdKey>(INLINE_AD_KEY_LIST[0]);

  const isLive = useCallback(
    (key: InlineAdKey) => key in inlineAds,
    [inlineAds],
  );

  const originalString = useCallback(
    (key: InlineAdKey) =>
      serialize(
        parseConfig(
          key,
          isLive(key) ? inlineAds[key]?.defaultValue : undefined,
        ),
      ),
    [inlineAds, isLive],
  );

  const currentString = useCallback(
    (key: InlineAdKey) =>
      drafts[key]
        ? serialize(drafts[key] as InlineAdConfig)
        : originalString(key),
    [drafts, originalString],
  );

  const dirtyKeys = useMemo(
    () =>
      INLINE_AD_KEY_LIST.filter(
        (key) => !!drafts[key] && currentString(key) !== originalString(key),
      ),
    [drafts, currentString, originalString],
  );

  const errors = useMemo(() => {
    const out: Record<string, string> = {};
    for (const key of dirtyKeys) {
      const message = validateRawValue(key, currentString(key));
      if (message) out[key] = message;
    }
    return out;
  }, [dirtyKeys, currentString]);

  return {
    keys: INLINE_AD_KEY_LIST,
    selected,
    select: (key: InlineAdKey) => {
      setSelected(key);
      setDrafts((d) =>
        d[key]
          ? d
          : {
              ...d,
              [key]: parseConfig(
                key,
                isLive(key) ? inlineAds[key]?.defaultValue : undefined,
              ),
            },
      );
    },
    isLive,
    currentString,
    dirtyKeys,
    changes: Object.fromEntries(
      dirtyKeys.map((key) => [key, currentString(key)]),
    ),
    errors,
    draft:
      drafts[selected] ??
      parseConfig(
        selected,
        isLive(selected) ? inlineAds[selected]?.defaultValue : undefined,
      ),
    isDirty: (key: InlineAdKey) => dirtyKeys.includes(key),
    updateSelected: (value: InlineAdConfig) =>
      setDrafts((d) => ({ ...d, [selected]: value })),
    resetSelected: () =>
      setDrafts((d) => {
        const next = { ...d };
        delete next[selected];
        return next;
      }),
    summaryFor: (key: InlineAdKey) => inlineAds[key],
  };
}
