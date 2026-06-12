import { DEFAULT_TRIGGER, type Trigger } from '../../../shared/trigger-meta';

// Replicate the app's merge (getTrigger, index.ts:93-104): top-level keys are a
// SHALLOW replace of defaults (paywall/disableAd/arrays replace wholesale), only
// `showAd` is one-level deep-merged. This yields the *effective* trigger the form edits.
export function parseTrigger(raw?: string): Trigger {
  let par: Record<string, any> = {};
  if (raw && raw.trim()) {
    try {
      const v = JSON.parse(raw);
      if (v && typeof v === 'object' && !Array.isArray(v)) par = v;
    } catch {
      par = {};
    }
  }
  return {
    ...DEFAULT_TRIGGER,
    ...par,
    executionOrder: par.executionOrder || DEFAULT_TRIGGER.executionOrder,
    showAd: { ...DEFAULT_TRIGGER.showAd, ...(par.showAd || {}) },
  } as Trigger;
}

const eq = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

// Inverse of parseTrigger: the minimal stored object that, under the app's merge,
// reproduces `t`. Omit any top-level field equal to default (default provides it);
// showAd is emitted as a partial of only its changed sub-keys (it's deep-merged).
// Unknown/extra keys differ from default(undefined) → preserved.
export function serializeTrigger(t: Trigger): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const def = DEFAULT_TRIGGER as Record<string, any>;
  for (const k of Object.keys(t)) {
    if (k === 'showAd') {
      const sub: Record<string, unknown> = {};
      const ds = DEFAULT_TRIGGER.showAd as Record<string, any>;
      const showAd = t.showAd as Record<string, any>;
      for (const s of Object.keys(showAd)) {
        if (!eq(showAd[s], ds[s])) sub[s] = showAd[s];
      }
      if (Object.keys(sub).length) out.showAd = sub;
    } else if (!eq((t as Record<string, any>)[k], def[k])) {
      out[k] = (t as Record<string, any>)[k];
    }
  }
  return out;
}

export const serializeTriggerString = (t: Trigger): string =>
  JSON.stringify(serializeTrigger(t));
