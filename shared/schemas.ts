import { z } from "zod";
import { ADS_WF_KEYS } from "./ads-wf-meta";
import { INLINE_AD_KEYS } from "./inline-ad-meta";
import { LANGUAGE_SCREEN_KEY, ONBOARD_SCREEN_RE } from "./screen-native-meta";
import {
  NATIVE_CONTENT_TYPES,
  PARAM_KEYS,
  stripPlatformPrefix,
  type NativeAdContentType,
} from "./params";
import { TRIGGER_PREFIX } from "./trigger-meta";

const weight = z.number().min(0, "Trọng số phải >= 0");

// Weighted-random close-button corner. Corners optional (missing = 0); all-zero
// is valid — native falls back to TR. Unknown keys preserved via passthrough.
const cornerWeightsSchema = z
  .object({ TR: weight, TL: weight, BR: weight, BL: weight })
  .partial()
  .passthrough();

const modeWeightsSchema = z
  .object({ fakeX: weight, openStore: weight, countdown: weight })
  .partial()
  .passthrough();

// Per-content-type override (close_config.overrides.content / .appInstall): a
// PARTIAL close flow deep-merged onto the base. Every field optional; passthrough.
const closeOverrideSchema = z
  .object({
    preClose: z
      .object({
        delaySeconds: weight.optional(),
        modeWeights: modeWeightsSchema.optional(),
        positionWeights: cornerWeightsSchema.optional(),
      })
      .passthrough()
      .optional(),
    close: z
      .object({
        delaySeconds: weight.optional(),
        positionWeights: cornerWeightsSchema.optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

const sumModeWeights = (mw?: {
  fakeX?: number;
  openStore?: number;
  countdown?: number;
}) => (mw ? (mw.fakeX ?? 0) + (mw.openStore ?? 0) + (mw.countdown ?? 0) : 0);

// Preservation-first: every object is .passthrough() so fields the app/native
// read but this tool doesn't model (e.g. preClose.mode) survive an edit+publish
// instead of being silently dropped. Only the modeled fields are validated.
export const closeConfigSchema = z
  .object({
    enabled: z.boolean(),
    preClose: z
      .object({
        delaySeconds: weight,
        modeWeights: modeWeightsSchema.optional(),
        positionWeights: cornerWeightsSchema.optional(),
      })
      .passthrough(),
    close: z
      .object({
        delaySeconds: weight,
        positionWeights: cornerWeightsSchema.optional(),
      })
      .passthrough(),
    overrides: z
      .object({
        content: closeOverrideSchema.optional(),
        appInstall: closeOverrideSchema.optional(),
      })
      .partial()
      .passthrough()
      .optional(),
  })
  .passthrough()
  .superRefine((cfg, ctx) => {
    if (
      cfg.enabled &&
      cfg.preClose.modeWeights &&
      sumModeWeights(cfg.preClose.modeWeights) <= 0
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["preClose", "modeWeights"],
        message: "Cần ít nhất một mode pre-close có trọng số > 0",
      });
    }
    // A present override that zeroes out every mode would silently fall back — flag it.
    for (const type of NATIVE_CONTENT_TYPES) {
      const mw = cfg.overrides?.[type]?.preClose?.modeWeights;
      if (cfg.enabled && mw && sumModeWeights(mw) <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["overrides", type, "preClose", "modeWeights"],
          message: `Override "${type}": cần ít nhất một mode pre-close có trọng số > 0`,
        });
      }
    }
  });

// Hand-written editor shapes — normalizeCloseConfig (use-template.ts) always
// materializes modeWeights + positionWeights so editors can assume them present.
export type ModeWeights = {
  fakeX: number;
  openStore: number;
  countdown: number;
};
export type CornerWeights = { TR: number; TL: number; BR: number; BL: number };
// Editor shape for one content-type override. normalizeCloseConfig materializes
// preClose.modeWeights; other fields the user set in raw JSON are preserved at
// runtime (passthrough), mirroring how preClose.mode survives on the base.
export type CloseOverride = { preClose: { modeWeights: ModeWeights } };
export type CloseConfig = {
  enabled: boolean;
  preClose: {
    delaySeconds: number;
    modeWeights: ModeWeights;
    positionWeights: CornerWeights;
  };
  close: { delaySeconds: number; positionWeights: CornerWeights };
  overrides?: Partial<Record<NativeAdContentType, CloseOverride>>;
};

// Accept ANY layout name — native silently falls back to media_full for names
// it doesn't recognize, so non-canonical names are valid config (editor warns).
const layoutMapSchema = z
  .record(z.string(), weight)
  .refine(
    (m) => Object.values(m).some((w) => w > 0),
    "Cần ít nhất một layout có trọng số > 0",
  );

export const layoutWeightsSchema = z
  .record(z.string().min(1, "Tên event không được rỗng"), layoutMapSchema)
  .refine((m) => "default" in m, 'Bắt buộc có entry "default"');

export type LayoutWeights = z.infer<typeof layoutWeightsSchema>;

export const timeoutSchema = z.number().min(0, "Timeout phải >= 0");

// Ad trigger — stored values are PARTIAL overrides (unset fields inherit the
// app default), so every field is optional. passthrough() preserves anything the
// app reads but this tool doesn't model. Enums are only checked when present.
const adsTypeEnum = z.enum(["reward", "inter", "native", "open_ads", "banner"]);
const adsTypeField = z.union([adsTypeEnum, adsTypeEnum.array()]);
const mediationEnum = z.enum(["admob", "max"]);

const adAfterAdSchema = z
  .object({
    active: z.boolean().optional(),
    adsType: adsTypeField.optional(),
    mediation: mediationEnum.optional(),
    adsGroup: z.string().optional(),
    loadOnPrevAdOpen: z.boolean().optional(),
  })
  .passthrough();

const showAdSchema = z
  .object({
    active: z.boolean().optional(),
    updateToLastShow: z.boolean().optional(),
    timeAwaitHighBeforeShow: z.number().min(0).optional(),
    skipCoolDownTime: z.boolean().optional(),
    adsType: adsTypeField.optional(),
    mediation: mediationEnum.optional(),
    adsGroup: z.string().optional(),
    purchaseAfterAds: z.boolean().optional(),
    adAfterAd: adAfterAdSchema.optional(),
  })
  .passthrough();

const paywallSchema = z
  .object({
    active: z.boolean().optional(),
    screens: z
      .object({
        superwall: z.string().optional(),
        legacy: z.number().int().min(0).max(5),
      })
      .passthrough()
      .array()
      .optional(),
    cooldownTime: z.number().min(0).optional(),
    skipAfterNShows: z.number().min(0).optional(),
    swapAfterNS: z.number().array().optional(),
  })
  .passthrough();

export const triggerSchema = z
  .object({
    log: z.boolean().optional(),
    executionOrder: z.enum(["ad_first", "paywall_first"]).optional(),
    showAd: showAdSchema.optional(),
    enableAd: z.string().array().optional(),
    disableAd: z
      .object({
        ads: z.string().array(),
        permanentlyStop: z.boolean().optional(),
      })
      .passthrough()
      .optional(),
    continueIfNoAds: z.boolean().optional(),
    paywall: paywallSchema.optional(),
    superwallPreload: z.string().array().optional(),
  })
  .passthrough();

// Ads waterfall (ads_wf_config + platform variants). Lenient/passthrough; each
// AdsItem needs a non-empty id + name and valid type/mediation (catches typos in
// the editor); other fields optional. Timing fields optional (inherit app default).
const adsItemSchema = z
  .object({
    id: z.string().min(1, "id không được rỗng"),
    name: z.string().min(1, "name không được rỗng"),
    type: z.enum(["reward", "inter", "native", "open_ads", "banner"]),
    mediation: z.enum(["admob", "max"]),
    isHigh: z.boolean().optional(),
    isHighFloor: z.boolean().optional(),
    disabled: z.boolean().optional(),
    isPermanentlyStopped: z.boolean().optional(),
    groupName: z.string().optional(),
    maxRetryNumber: z.number().min(0).optional(),
    maxTimeReload: z.number().min(0).optional(),
  })
  .passthrough();

const num = z.number().min(0).optional();

// Adaptive cooldown tiers (ads_wf_config.adaptiveCooldown). Lenient/passthrough to
// match the app's defensive reads; the app itself drops tiers with non-finite
// minAdsShown or cooldownMs <= 0, so we flag those instead of hard-failing on shape.
const cooldownTierSchema = z
  .object({
    minAdsShown: z.number().min(0, "minAdsShown phải >= 0"),
    cooldownMs: z.number().min(0, "cooldownMs phải >= 0"),
  })
  .passthrough();

const adaptiveCooldownSchema = z
  .object({
    enabled: z.boolean().optional(),
    tiers: cooldownTierSchema.array().optional(),
  })
  .passthrough()
  .superRefine((ac, ctx) => {
    if (ac.enabled && !ac.tiers?.some((t) => t.cooldownMs > 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["tiers"],
        message:
          "Bật adaptive cooldown nhưng chưa có tier nào có cooldownMs > 0",
      });
    }
  });

export const adsWfSchema = z
  .object({
    ids: adsItemSchema.array().optional(),
    x: num,
    y: num,
    loadInterval: num,
    maxRetryNumber: num,
    maxTimeReload: num,
    coolDownTime: num,
    continueReloadAfter: num,
    enableAdmob: z.boolean().optional(),
    enableMax: z.boolean().optional(),
    adaptiveCooldown: adaptiveCooldownSchema.optional(),
  })
  .passthrough();

// Inline native ad placement config (control_native_*). All fields optional — the
// app merges each field independently over its in-app default. passthrough() keeps
// fields the app reads but this tool doesn't model (same risk control_language_screens
// already showed with real data).
const nativeLayoutItemSchema = z
  .object({
    id: z.number(),
    customLayout: z
      .object({
        hideMedia: z.boolean().optional(),
        space: z.number().optional(),
        hideIcon: z.boolean().optional(),
        smallFont: z.boolean().optional(),
        hideBody: z.boolean().optional(),
        hideButton: z.boolean().optional(),
        reverse: z.boolean().optional(),
        hideTagLine: z.boolean().optional(),
        callToActionStyle: z.enum(["fill", "stroke"]).optional(),
        showCloseButton: z.boolean().optional(),
      })
      .passthrough(),
  })
  .passthrough();

// Inline-native auto-refresh (NativeAdConfig.refresh). Replaces legacy
// autoRefresh/refreshSeconds — InlineNativeAd reads refresh.* only.
const refreshConfigSchema = z
  .object({
    enabled: z.boolean().optional(),
    intervalSeconds: z.number().min(0, "intervalSeconds phải >= 0").optional(),
    preloadSeconds: z.number().min(0, "preloadSeconds phải >= 0").optional(),
  })
  .passthrough();

// collapsible.closeFlow — same 2-stage shape as fullscreen close_config, embedded
// in the inline native config. Lenient/passthrough; only modeled fields checked.
const collapsibleCloseFlowSchema = z
  .object({
    enabled: z.boolean().optional(),
    preClose: z
      .object({
        delaySeconds: weight.optional(),
        modeWeights: modeWeightsSchema.optional(),
        positionWeights: cornerWeightsSchema.optional(),
      })
      .passthrough()
      .optional(),
    close: z
      .object({
        delaySeconds: weight.optional(),
        positionWeights: cornerWeightsSchema.optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

const collapsibleConfigSchema = z
  .object({
    enabled: z.boolean().optional(),
    startExpanded: z.boolean().optional(),
    startExpandedDelay: z
      .number()
      .min(0, "startExpandedDelay phải >= 0")
      .optional(),
    expandRate: z
      .number()
      .min(0, "expandRate trong khoảng 0..1")
      .max(1, "expandRate trong khoảng 0..1")
      .optional(),
    closeFlow: collapsibleCloseFlowSchema.optional(),
  })
  .passthrough();

export const nativeAdConfigSchema = z
  .object({
    showAds: z.boolean().optional(),
    preload: z.boolean().optional(),
    highEcpm: z.boolean().optional(),
    layout: nativeLayoutItemSchema.array().optional(),
    random: z.number().min(0, "Trọng số phải >= 0").array().optional(),
    selfLoad: z.boolean().optional(),
    showSkeleton: z.boolean().optional(),
    refresh: refreshConfigSchema.optional(),
    collapsible: collapsibleConfigSchema.optional(),
  })
  .passthrough();

export const inlineAdConfigSchema = z
  .object({
    adType: z.enum(["banner", "native", "none"]).optional(),
    nativeAdConfig: nativeAdConfigSchema.optional(),
  })
  .passthrough();

// Per-screen native ad config. Onboard screens (control_onboard_screen_*) carry
// layout + an embedded nativeAdConfig; the language screen (control_language_screens)
// carries its own fields. All optional (partial override); passthrough preserves
// fields the app reads but this tool doesn't model.
export const onboardScreenSchema = z
  .object({
    adType: z.enum(["native", "banner", "none"]).optional(),
    showAd: z.boolean().optional(),
    continueBtnType: z.enum(["small", "large", "none"]).optional(),
    continueBtnPosition: z.enum(["bottom", "top"]).optional(),
    progressBarPosition: z.enum(["top", "bottom"]).optional(),
    smallBtnMode: z.enum(["text", "fill", "stroke"]).optional(),
    progressStep: z.boolean().optional(),
    continueWhenClickAd: z.boolean().optional(),
    nativeAdGroup: z.string().optional(),
    nativeAdConfig: nativeAdConfigSchema.optional(),
  })
  .passthrough();

export const languageScreenSchema = z
  .object({
    adType: z.enum(["native", "banner", "none"]).optional(),
    saveBtnMode: z.enum(["fill", "stroke"]).optional(),
    countdownTimer: z.number().min(0).optional(),
    continueWhenClickAd: z.boolean().optional(),
    nativeAdConfig: nativeAdConfigSchema.optional(),
  })
  .passthrough();

// Concise human-readable rendering of a parse/validation failure.
export function describeError(e: unknown): string {
  if (e instanceof z.ZodError) {
    return e.issues
      .map((i) => (i.path.length ? `${i.path.join(".")}: ` : "") + i.message)
      .join("; ");
  }
  return e instanceof SyntaxError
    ? `JSON lỗi cú pháp: ${e.message}`
    : String(e);
}

// Validate the raw Remote Config string value of a given param key (native or
// any trigger_*). Returns null when valid, otherwise a human-readable message.
export function validateRawValue(key: string, raw: string): string | null {
  try {
    const baseKey = stripPlatformPrefix(key);
    if (baseKey === PARAM_KEYS.timeout) {
      const n = Number(raw);
      if (raw.trim() === "" || Number.isNaN(n)) return "Timeout phải là một số";
      timeoutSchema.parse(n);
      return null;
    }
    const parsed = JSON.parse(raw);
    if (baseKey === PARAM_KEYS.closeConfig) closeConfigSchema.parse(parsed);
    else if (baseKey === PARAM_KEYS.layoutWeights)
      layoutWeightsSchema.parse(parsed);
    else if ((ADS_WF_KEYS as readonly string[]).includes(baseKey))
      adsWfSchema.parse(parsed);
    else if (
      (Object.values(INLINE_AD_KEYS) as readonly string[]).includes(baseKey)
    )
      inlineAdConfigSchema.parse(parsed);
    else if (ONBOARD_SCREEN_RE.test(baseKey)) onboardScreenSchema.parse(parsed);
    else if (baseKey === LANGUAGE_SCREEN_KEY)
      languageScreenSchema.parse(parsed);
    else if (baseKey.startsWith(TRIGGER_PREFIX)) triggerSchema.parse(parsed);
    return null;
  } catch (e) {
    return describeError(e);
  }
}
