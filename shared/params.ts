// Single source of truth for the Remote Config parameters this tool manages.
// Key names MUST match the Firebase Remote Config keys used by the brain-training app
// (see brain-training/src/services/firebase/remoteConfig.ts — note the app constant
// `fullscreen_native_timeout_seconds` maps to the actual key `fullscreen_native_timeout`).

export const PARAM_KEYS = {
  timeout: 'fullscreen_native_timeout',
  closeConfig: 'fullscreen_native_close_config',
  layoutWeights: 'fullscreen_native_layout_weights',
} as const;

export const PLATFORM_PREFIXES = ['android_', 'ios_'] as const;

export const stripPlatformPrefix = (key: string): string => {
  for (const prefix of PLATFORM_PREFIXES) {
    if (key.startsWith(prefix)) return key.slice(prefix.length);
  }
  return key;
};

export const platformKeyFor = (platform: 'android' | 'ios', key: string): string => `${platform}_${key}`;

export type ParamKey = (typeof PARAM_KEYS)[keyof typeof PARAM_KEYS];

export const ALL_PARAM_KEYS: ParamKey[] = Object.values(PARAM_KEYS);

// Layout names the app understands (showNativeAdActivity.ts pickLayout).
export const LAYOUTS = [
  'dialog',
  'media_full',
  'bottom_card',
  'media_large',
  'media_small',
  'media_header',
] as const;

export type LayoutName = (typeof LAYOUTS)[number];

export const isCanonicalLayout = (name: string): boolean =>
  (LAYOUTS as readonly string[]).includes(name);

// Human labels for the pre-close modes (close_config.preClose.modeWeights).
export const CLOSE_MODE_LABELS: Record<string, string> = {
  fakeX: 'Fake X button',
  openStore: 'X opens store page',
  countdown: 'Countdown timer',
};

// Close-button corner positions — weighted-random pick (native side).
// TR/TL/BR/BL = Top/Bottom × Right/Left. All-zero ≡ absent → native defaults TR.
export const CORNERS = ['TR', 'TL', 'BR', 'BL'] as const;
export const CORNER_LABELS: Record<string, string> = {
  TR: 'Trên · Phải (TR)',
  TL: 'Trên · Trái (TL)',
  BR: 'Dưới · Phải (BR)',
  BL: 'Dưới · Trái (BL)',
};

export const DEFAULT_MODE_WEIGHTS = { fakeX: 0, openStore: 0, countdown: 100 };

// Native ad content type (close_config.overrides). The app (showNativeAdActivity.ts
// getNativeAdContentType) classifies each ad: 'appInstall' when it has store/price/
// starRating, else 'content'. close_config.overrides[type] is deep-merged onto the
// base close flow for that type.
export const NATIVE_CONTENT_TYPES = ['content', 'appInstall'] as const;
export type NativeAdContentType = (typeof NATIVE_CONTENT_TYPES)[number];

export const CONTENT_TYPE_LABELS: Record<NativeAdContentType, string> = {
  content: 'Content (nội dung / tin tức)',
  appInstall: 'App Install (quảng cáo cài app)',
};
export const CONTENT_TYPE_HINTS: Record<NativeAdContentType, string> = {
  content: 'Ad nội dung — không có store / giá / rating. Thường tương tác (CTR) cao hơn.',
  appInstall: 'Ad cài app — có store / giá / số sao đánh giá.',
};

// App-side defaults — used to initialize drafts when a param is missing from the
// template or its current value fails to parse. Mirrors the real config shape
// (close_config carries preClose.mode + positionWeights, close.positionWeights).
export const APP_DEFAULTS = {
  timeout: 5,
  closeConfig: {
    enabled: true,
    preClose: {
      delaySeconds: 2,
      mode: 'countdown',
      modeWeights: { fakeX: 0, openStore: 0, countdown: 100 },
      positionWeights: { TR: 50, TL: 50, BR: 0, BL: 0 },
    },
    close: { delaySeconds: 3, positionWeights: { TR: 50, TL: 50, BR: 0, BL: 0 } },
    overrides: {
      content: { preClose: { modeWeights: { fakeX: 40, openStore: 30, countdown: 30 } } },
      appInstall: { preClose: { modeWeights: { fakeX: 0, openStore: 0, countdown: 100 } } },
    },
  },
  layoutWeights: {
    default: {
      dialog: 16,
      media_full: 16,
      bottom_card: 17,
      media_large: 17,
      media_small: 17,
      media_header: 17,
    },
  },
} as const;
