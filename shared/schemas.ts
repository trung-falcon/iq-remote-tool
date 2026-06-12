import { z } from 'zod';
import { PARAM_KEYS, type ParamKey } from './params';

const weight = z.number().min(0, 'Trọng số phải >= 0');

// Weighted-random close-button corner. Corners optional (missing = 0); all-zero
// is valid — native falls back to TR. Unknown keys preserved via passthrough.
const cornerWeightsSchema = z
  .object({ TR: weight, TL: weight, BR: weight, BL: weight })
  .partial()
  .passthrough();

// Preservation-first: every object is .passthrough() so fields the app/native
// read but this tool doesn't model (e.g. preClose.mode) survive an edit+publish
// instead of being silently dropped. Only the modeled fields are validated.
export const closeConfigSchema = z
  .object({
    enabled: z.boolean(),
    preClose: z
      .object({
        delaySeconds: weight,
        modeWeights: z
          .object({ fakeX: weight, openStore: weight, countdown: weight })
          .partial()
          .passthrough()
          .optional(),
        positionWeights: cornerWeightsSchema.optional(),
      })
      .passthrough(),
    close: z
      .object({
        delaySeconds: weight,
        positionWeights: cornerWeightsSchema.optional(),
      })
      .passthrough(),
  })
  .passthrough()
  .superRefine((cfg, ctx) => {
    const mw = cfg.preClose.modeWeights;
    const sum = mw ? (mw.fakeX ?? 0) + (mw.openStore ?? 0) + (mw.countdown ?? 0) : 0;
    if (cfg.enabled && mw && sum <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['preClose', 'modeWeights'],
        message: 'Cần ít nhất một mode pre-close có trọng số > 0',
      });
    }
  });

// Hand-written editor shapes — normalizeCloseConfig (use-template.ts) always
// materializes modeWeights + positionWeights so editors can assume them present.
export type ModeWeights = { fakeX: number; openStore: number; countdown: number };
export type CornerWeights = { TR: number; TL: number; BR: number; BL: number };
export type CloseConfig = {
  enabled: boolean;
  preClose: { delaySeconds: number; modeWeights: ModeWeights; positionWeights: CornerWeights };
  close: { delaySeconds: number; positionWeights: CornerWeights };
};

// Accept ANY layout name — native silently falls back to media_full for names
// it doesn't recognize, so non-canonical names are valid config (editor warns).
const layoutMapSchema = z
  .record(z.string(), weight)
  .refine(m => Object.values(m).some(w => w > 0), 'Cần ít nhất một layout có trọng số > 0');

export const layoutWeightsSchema = z
  .record(z.string().min(1, 'Tên event không được rỗng'), layoutMapSchema)
  .refine(m => 'default' in m, 'Bắt buộc có entry "default"');

export type LayoutWeights = z.infer<typeof layoutWeightsSchema>;

export const timeoutSchema = z.number().min(0, 'Timeout phải >= 0');

// Concise human-readable rendering of a parse/validation failure.
export function describeError(e: unknown): string {
  if (e instanceof z.ZodError) {
    return e.issues
      .map(i => (i.path.length ? `${i.path.join('.')}: ` : '') + i.message)
      .join('; ');
  }
  return e instanceof SyntaxError ? `JSON lỗi cú pháp: ${e.message}` : String(e);
}

// Validate the raw Remote Config string value of a given param key.
// Returns null when valid, otherwise a human-readable error message.
export function validateRawValue(key: ParamKey, raw: string): string | null {
  try {
    if (key === PARAM_KEYS.timeout) {
      const n = Number(raw);
      if (raw.trim() === '' || Number.isNaN(n)) return 'Timeout phải là một số';
      timeoutSchema.parse(n);
      return null;
    }
    const parsed = JSON.parse(raw);
    if (key === PARAM_KEYS.closeConfig) closeConfigSchema.parse(parsed);
    if (key === PARAM_KEYS.layoutWeights) layoutWeightsSchema.parse(parsed);
    return null;
  } catch (e) {
    return describeError(e);
  }
}
