import { z } from 'zod';
import { LAYOUTS, PARAM_KEYS, type ParamKey } from './params';

const weight = z.number().min(0, 'Weight must be >= 0');

// All objects are .strict(): unknown fields fail parsing (→ UI falls back to
// defaults with a visible warning) instead of being silently dropped on publish.
export const closeConfigSchema = z
  .object({
    enabled: z.boolean(),
    preClose: z
      .object({
        delaySeconds: z.number().min(0, 'Delay must be >= 0'),
        modeWeights: z
          .object({ fakeX: weight, openStore: weight, countdown: weight })
          .strict(),
      })
      .strict(),
    close: z.object({ delaySeconds: z.number().min(0, 'Delay must be >= 0') }).strict(),
  })
  .strict()
  .superRefine((cfg, ctx) => {
    const { fakeX, openStore, countdown } = cfg.preClose.modeWeights;
    if (cfg.enabled && fakeX + openStore + countdown <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['preClose', 'modeWeights'],
        message: 'At least one mode weight must be > 0 when enabled',
      });
    }
  });

export type CloseConfig = z.infer<typeof closeConfigSchema>;

const layoutMapSchema = z
  .record(z.string(), weight)
  .superRefine((map, ctx) => {
    for (const key of Object.keys(map)) {
      if (!(LAYOUTS as readonly string[]).includes(key)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Unknown layout "${key}" — allowed: ${LAYOUTS.join(', ')}`,
        });
      }
    }
  })
  .refine(
    map => Object.values(map).some(w => w > 0),
    'At least one layout weight must be > 0',
  );

export const layoutWeightsSchema = z
  .record(z.string().min(1, 'Event name must not be empty'), layoutMapSchema)
  .refine(map => 'default' in map, '"default" entry is required');

export type LayoutWeights = z.infer<typeof layoutWeightsSchema>;

export const timeoutSchema = z.number().min(0, 'Timeout must be >= 0');

// Validate the raw Remote Config string value of a given param key.
// Returns null when valid, otherwise a human-readable error message.
export function validateRawValue(key: ParamKey, raw: string): string | null {
  try {
    if (key === PARAM_KEYS.timeout) {
      const n = Number(raw);
      if (raw.trim() === '' || Number.isNaN(n)) return 'Timeout must be a number';
      timeoutSchema.parse(n);
      return null;
    }
    const parsed = JSON.parse(raw);
    if (key === PARAM_KEYS.closeConfig) closeConfigSchema.parse(parsed);
    if (key === PARAM_KEYS.layoutWeights) layoutWeightsSchema.parse(parsed);
    return null;
  } catch (e) {
    if (e instanceof z.ZodError) {
      return e.issues.map(i => (i.path.length ? `${i.path.join('.')}: ` : '') + i.message).join('; ');
    }
    return e instanceof SyntaxError ? `Invalid JSON: ${e.message}` : String(e);
  }
}
