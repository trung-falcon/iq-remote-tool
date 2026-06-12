// Single source of truth for the Remote Config parameters this tool manages.
// Key names MUST match the Firebase Remote Config keys used by the brain-training app
// (see brain-training/src/services/firebase/remoteConfig.ts — note the app constant
// `fullscreen_native_timeout_seconds` maps to the actual key `fullscreen_native_timeout`).

export const PARAM_KEYS = {
  timeout: 'fullscreen_native_timeout',
  closeConfig: 'fullscreen_native_close_config',
  layoutWeights: 'fullscreen_native_layout_weights',
} as const;

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

// Human labels for the pre-close modes (close_config.preClose.modeWeights).
export const CLOSE_MODE_LABELS: Record<string, string> = {
  fakeX: 'Fake X button',
  openStore: 'X opens store page',
  countdown: 'Countdown timer',
};

// App-side defaults — used to initialize drafts when a param is missing from the
// template or its current value fails to parse. Mirrors remoteConfig.ts defaults.
export const APP_DEFAULTS = {
  timeout: 5,
  closeConfig: {
    enabled: true,
    preClose: {
      delaySeconds: 2,
      modeWeights: { fakeX: 0, openStore: 0, countdown: 100 },
    },
    close: { delaySeconds: 3 },
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
