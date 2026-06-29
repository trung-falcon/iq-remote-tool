import {
  DEFAULT_NATIVE_AD_CONFIG,
  type NativeAdConfig,
} from "./native-ad-meta";

export const INLINE_AD_KEYS = {
  gameFooter: "control_game_footer",
  homeFooter: "control_home_footer",
} as const;

export type InlineAdKey = (typeof INLINE_AD_KEYS)[keyof typeof INLINE_AD_KEYS];

export const INLINE_AD_KEY_LIST = Object.values(
  INLINE_AD_KEYS,
) as InlineAdKey[];

export type InlineAdType = "banner" | "native" | "none";

export type InlineAdConfig = {
  adType?: InlineAdType;
  nativeAdConfig?: NativeAdConfig;
};

export const DEFAULT_INLINE_AD_CONFIGS: Record<InlineAdKey, InlineAdConfig> = {
  [INLINE_AD_KEYS.gameFooter]: {
    adType: "native",
    nativeAdConfig: {
      ...DEFAULT_NATIVE_AD_CONFIG,
      random: [0, 0, 1],
      refresh: { enabled: true },
    },
  },
  [INLINE_AD_KEYS.homeFooter]: {
    adType: "native",
    nativeAdConfig: {
      ...DEFAULT_NATIVE_AD_CONFIG,
      random: [0, 0, 1],
      refresh: { enabled: true },
    },
  },
};
