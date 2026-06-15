import type {
  RemoteConfigParameter,
  RemoteConfigParameterValue,
  RemoteConfigTemplate,
} from 'firebase-admin/remote-config';
import { ADS_WF_KEYS } from '../../shared/ads-wf-meta';
import { ALL_PARAM_KEYS, PARAM_KEYS } from '../../shared/params';
import { validateRawValue } from '../../shared/schemas';
import { LANGUAGE_SCREEN_KEY } from '../../shared/screen-native-meta';
import { HttpError } from './firebase';
import {
  discoverObsoleteNativeKeys,
  discoverOnboardScreenKeys,
  discoverTriggerKeys,
  isManagedKey,
} from './managed-keys';

export type ParamSummary = {
  exists: boolean;
  defaultValue: string;
  hasConditionalValues: boolean;
};

function readValue(v: RemoteConfigParameterValue | undefined): string {
  return v && 'value' in v ? v.value : '';
}

// Params can live at the top level OR inside a parameter group (console allows
// grouping at any time). Always resolve where the param actually lives so we
// never misreport state or create a duplicate top-level param on publish.
function findParam(
  template: RemoteConfigTemplate,
  key: string,
): RemoteConfigParameter | undefined {
  if (template.parameters[key]) return template.parameters[key];
  for (const group of Object.values(template.parameterGroups ?? {})) {
    const param = group.parameters?.[key];
    if (param) return param;
  }
  return undefined;
}

function summarize(template: RemoteConfigTemplate, key: string): ParamSummary {
  const param = findParam(template, key);
  return {
    exists: !!param,
    defaultValue: readValue(param?.defaultValue),
    hasConditionalValues:
      !!param?.conditionalValues && Object.keys(param.conditionalValues).length > 0,
  };
}

// Summarize the 3 native fullscreen params.
export function extractParams(
  template: RemoteConfigTemplate,
): Record<string, ParamSummary> {
  const out: Record<string, ParamSummary> = {};
  for (const key of ALL_PARAM_KEYS) out[key] = summarize(template, key);
  return out;
}

// Summarize every trigger_* param discovered on the template.
export function extractTriggers(
  template: RemoteConfigTemplate,
): Record<string, ParamSummary> {
  const out: Record<string, ParamSummary> = {};
  for (const key of discoverTriggerKeys(template)) out[key] = summarize(template, key);
  return out;
}

// Summarize the 3 ads_wf_config variants (generic + android + ios).
export function extractAdsWf(
  template: RemoteConfigTemplate,
): Record<string, ParamSummary> {
  const out: Record<string, ParamSummary> = {};
  for (const key of ADS_WF_KEYS) out[key] = summarize(template, key);
  return out;
}

// Summarize per-screen native configs: every control_onboard_screen_* discovered
// + the fixed control_language_screens key.
export function extractScreens(
  template: RemoteConfigTemplate,
): Record<string, ParamSummary> {
  const out: Record<string, ParamSummary> = {};
  for (const key of discoverOnboardScreenKeys(template)) out[key] = summarize(template, key);
  out[LANGUAGE_SCREEN_KEY] = summarize(template, LANGUAGE_SCREEN_KEY);
  return out;
}

// Summarize leftover legacy control_native_* keys (for one-time cleanup).
export function extractObsoleteNative(
  template: RemoteConfigTemplate,
): Record<string, ParamSummary> {
  const out: Record<string, ParamSummary> = {};
  for (const key of discoverObsoleteNativeKeys(template)) out[key] = summarize(template, key);
  return out;
}

export type Changes = Record<string, string>;

// Zod-validate every changed value against its schema. Returns [] when all valid.
export function validateChanges(changes: Changes): { param: string; message: string }[] {
  const errors: { param: string; message: string }[] = [];
  for (const [key, raw] of Object.entries(changes)) {
    if (!isManagedKey(key)) {
      errors.push({ param: key, message: 'Unknown parameter — tool only manages the fullscreen_native keys and trigger_* keys' });
      continue;
    }
    const message = validateRawValue(key, raw);
    if (message) errors.push({ param: key, message });
  }
  return errors;
}

// PUBLISH SAFETY CORE: mutate ONLY the defaultValue of the managed keys,
// in place wherever the param lives (top level or inside a parameter group).
// Conditions, parameterGroups, other parameters and conditionalValues stay untouched.
export function applyChanges(template: RemoteConfigTemplate, changes: Changes): void {
  for (const [key, raw] of Object.entries(changes)) {
    if (!isManagedKey(key)) {
      throw new HttpError(400, `Refusing to modify unmanaged parameter "${key}"`);
    }
    const existing = findParam(template, key);
    if (existing) {
      existing.defaultValue = { value: raw };
    } else {
      template.parameters[key] = {
        defaultValue: { value: raw },
        valueType: key === PARAM_KEYS.timeout ? 'NUMBER' : 'JSON',
        description: 'Managed by iq-remote-tools',
      };
    }
  }
}

// Remove managed params entirely — top-level or inside a parameter group.
// Everything else stays untouched.
export function applyDeletes(template: RemoteConfigTemplate, deletes: string[]): void {
  for (const key of deletes) {
    if (!isManagedKey(key)) {
      throw new HttpError(400, `Refusing to delete unmanaged parameter "${key}"`);
    }
    if (template.parameters[key]) {
      delete template.parameters[key];
      continue;
    }
    for (const group of Object.values(template.parameterGroups ?? {})) {
      if (group.parameters?.[key]) {
        delete group.parameters[key];
        break;
      }
    }
  }
}
