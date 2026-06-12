import type {
  RemoteConfigParameter,
  RemoteConfigParameterValue,
  RemoteConfigTemplate,
} from 'firebase-admin/remote-config';
import { ALL_PARAM_KEYS, PARAM_KEYS, type ParamKey } from '../../shared/params';
import { validateRawValue } from '../../shared/schemas';
import { HttpError } from './firebase';

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

// Summarize only the params this tool manages — never expose/edit the rest.
export function extractParams(
  template: RemoteConfigTemplate,
): Record<string, ParamSummary> {
  const out: Record<string, ParamSummary> = {};
  for (const key of ALL_PARAM_KEYS) {
    const param = findParam(template, key);
    out[key] = {
      exists: !!param,
      defaultValue: readValue(param?.defaultValue),
      hasConditionalValues:
        !!param?.conditionalValues && Object.keys(param.conditionalValues).length > 0,
    };
  }
  return out;
}

export type Changes = Record<string, string>;

// Zod-validate every changed value against its schema. Returns [] when all valid.
export function validateChanges(changes: Changes): { param: string; message: string }[] {
  const errors: { param: string; message: string }[] = [];
  for (const [key, raw] of Object.entries(changes)) {
    if (!ALL_PARAM_KEYS.includes(key as ParamKey)) {
      errors.push({ param: key, message: 'Unknown parameter — this tool only manages the 3 fullscreen_native keys' });
      continue;
    }
    const message = validateRawValue(key as ParamKey, raw);
    if (message) errors.push({ param: key, message });
  }
  return errors;
}

// PUBLISH SAFETY CORE: mutate ONLY the defaultValue of the managed keys,
// in place wherever the param lives (top level or inside a parameter group).
// Conditions, parameterGroups, other parameters and conditionalValues stay untouched.
export function applyChanges(template: RemoteConfigTemplate, changes: Changes): void {
  for (const [key, raw] of Object.entries(changes)) {
    if (!ALL_PARAM_KEYS.includes(key as ParamKey)) {
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
