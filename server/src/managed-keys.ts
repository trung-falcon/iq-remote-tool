import type { RemoteConfigTemplate } from 'firebase-admin/remote-config';
import { ADS_WF_KEYS } from '../../shared/ads-wf-meta';
import { NATIVE_AD_KEY_RE, NATIVE_AD_PREFIX } from '../../shared/native-ad-meta';
import { ALL_PARAM_KEYS } from '../../shared/params';
import { TRIGGER_PREFIX } from '../../shared/trigger-meta';

// Trigger keys are always lowercase ('trigger_' + event.toLowerCase()).
const TRIGGER_KEY_RE = /^trigger_[a-z0-9_]+$/;

// Allowlist for read/write: the 3 native fullscreen keys + the 3 ads_wf_config
// variants + any trigger_* key + any control_native_* (inline native) key. Anything
// else is refused so a crafted request can never touch unmanaged config.
export function isManagedKey(key: string): boolean {
  return (
    (ALL_PARAM_KEYS as string[]).includes(key) ||
    (ADS_WF_KEYS as readonly string[]).includes(key) ||
    TRIGGER_KEY_RE.test(key) ||
    NATIVE_AD_KEY_RE.test(key)
  );
}

// All trigger_* params present on the template (top-level + inside groups).
export function discoverTriggerKeys(template: RemoteConfigTemplate): string[] {
  const keys = new Set<string>();
  const collect = (params?: Record<string, unknown>) => {
    for (const k of Object.keys(params ?? {})) {
      if (k.startsWith(TRIGGER_PREFIX)) keys.add(k);
    }
  };
  collect(template.parameters);
  for (const group of Object.values(template.parameterGroups ?? {})) {
    collect(group.parameters);
  }
  return [...keys].sort();
}

// All control_native_* params present on the template (top-level + inside groups).
export function discoverNativeAdKeys(template: RemoteConfigTemplate): string[] {
  const keys = new Set<string>();
  const collect = (params?: Record<string, unknown>) => {
    for (const k of Object.keys(params ?? {})) {
      if (k.startsWith(NATIVE_AD_PREFIX)) keys.add(k);
    }
  };
  collect(template.parameters);
  for (const group of Object.values(template.parameterGroups ?? {})) {
    collect(group.parameters);
  }
  return [...keys].sort();
}
