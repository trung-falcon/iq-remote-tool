import type { RemoteConfigTemplate } from 'firebase-admin/remote-config';
import { ADS_WF_KEYS } from '../../shared/ads-wf-meta';
import { ALL_PARAM_KEYS, stripPlatformPrefix } from '../../shared/params';
import { LANGUAGE_SCREEN_KEY, ONBOARD_SCREEN_PREFIX, ONBOARD_SCREEN_RE } from '../../shared/screen-native-meta';
import { TRIGGER_PREFIX } from '../../shared/trigger-meta';

// Trigger keys are always lowercase ('trigger_' + event.toLowerCase()).
const TRIGGER_KEY_RE = /^trigger_[a-z0-9_]+$/;

// Legacy control_native_* keys — no longer written by the tool, but kept deletable
// so the per-screen migration can clean them off Firebase.
const OBSOLETE_NATIVE_PREFIX = 'control_native_';
const OBSOLETE_NATIVE_RE = /^control_native_[a-z0-9_]+$/;

// Allowlist for read/write: the 3 native fullscreen keys + 3 ads_wf variants +
// any trigger_* + per-screen native (control_onboard_screen_* + control_language_screens)
// + legacy control_native_* (delete-only). Anything else is refused.
export function isManagedKey(key: string): boolean {
  const baseKey = stripPlatformPrefix(key);
  return (
    (ALL_PARAM_KEYS as string[]).includes(baseKey) ||
    (ADS_WF_KEYS as readonly string[]).includes(baseKey) ||
    TRIGGER_KEY_RE.test(baseKey) ||
    ONBOARD_SCREEN_RE.test(baseKey) ||
    baseKey === LANGUAGE_SCREEN_KEY ||
    OBSOLETE_NATIVE_RE.test(baseKey)
  );
}

function collectManaged(template: RemoteConfigTemplate, predicate: (baseKey: string) => boolean): string[] {
  const keys = new Set<string>();
  const collect = (params?: Record<string, unknown>) => {
    for (const k of Object.keys(params ?? {})) {
      if (predicate(stripPlatformPrefix(k))) keys.add(k);
    }
  };
  collect(template.parameters);
  for (const group of Object.values(template.parameterGroups ?? {})) collect(group.parameters);
  return [...keys].sort();
}

// All trigger_* params on the template (top-level + inside groups).
export function discoverTriggerKeys(template: RemoteConfigTemplate): string[] {
  return collectManaged(template, baseKey => baseKey.startsWith(TRIGGER_PREFIX));
}

// All control_onboard_screen_* params on the template.
export function discoverOnboardScreenKeys(template: RemoteConfigTemplate): string[] {
  return collectManaged(template, baseKey => baseKey.startsWith(ONBOARD_SCREEN_PREFIX));
}

// Legacy control_native_* params still on the template (for cleanup).
export function discoverObsoleteNativeKeys(template: RemoteConfigTemplate): string[] {
  return collectManaged(template, baseKey => baseKey.startsWith(OBSOLETE_NATIVE_PREFIX));
}
