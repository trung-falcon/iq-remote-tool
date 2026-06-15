// Inline native ad placement config (control_native_*). Mirrors the app's
// NATIVE_ADS_POSITION_KEYS_LIST + NativeAdConfig (brain-training/src/types/index.tsx
// + src/new-ads/nativeAdConfig.ts). The app merges each field independently over its
// in-app default, so partial writes are safe; we preserve the full object + any
// unknown fields on round-trip (preservation-first).

export const NATIVE_AD_PREFIX = 'control_native_';

// Catalog order = app's NATIVE_ADS_POSITION_KEYS_LIST.
export const NATIVE_AD_POSITIONS = [
  'common',
  'done_onboard',
  'enter_game',
  'next_level',
  'setting',
  'onboard1',
  'onboard2',
  'in_game',
] as const;

export type NativeAdPosition = (typeof NATIVE_AD_POSITIONS)[number];

export const controlNativeKeyFor = (pos: string): string => NATIVE_AD_PREFIX + pos;
export const positionFromKey = (key: string): string =>
  key.startsWith(NATIVE_AD_PREFIX) ? key.slice(NATIVE_AD_PREFIX.length) : key;

// Any control_native_* key (allowlist + discovery; lowercase like the app emits).
export const NATIVE_AD_KEY_RE = /^control_native_[a-z0-9_]+$/;

// The 8 catalog keys, in order.
export const NATIVE_AD_KEYS: string[] = NATIVE_AD_POSITIONS.map(controlNativeKeyFor);

// Friendly labels per placement (vi).
export const NATIVE_AD_POSITION_LABELS: Record<string, string> = {
  common: 'Chung',
  done_onboard: 'Hoàn tất onboard',
  enter_game: 'Vào game',
  next_level: 'Màn tiếp theo',
  setting: 'Cài đặt ngôn ngữ',
  onboard1: 'Onboard 1',
  onboard2: 'Onboard 2',
  in_game: 'Trong game',
};

// --- Value shape (NativeAdRemoteConfigType / NativeAdConfig) ---
export type NativeAdLayoutConfig = {
  hideMedia?: boolean;
  space?: number;
  hideIcon?: boolean;
  smallFont?: boolean;
  hideBody?: boolean;
  hideButton?: boolean;
  reverse?: boolean;
  hideTagLine?: boolean;
  callToActionStyle?: 'fill' | 'stroke';
};

export type NativeAdLayout = { id: number; customLayout: NativeAdLayoutConfig };

export type NativeAdConfig = {
  showAds?: boolean;
  preload?: boolean;
  highEcpm?: boolean;
  layout?: NativeAdLayout[];
  random?: number[];
};

// App default (nativeAdConfig.ts defaultNativeConfig) — seed for newly created keys.
export const DEFAULT_NATIVE_AD_CONFIG: NativeAdConfig = {
  showAds: true,
  preload: false,
  highEcpm: false,
  layout: [],
  random: [0, 0, 0],
};

// random[i] picks SmallNativeLayout{i+1} (app layout idx 3/4/5).
export const LAYOUT_NAMES = ['SmallNativeLayout1', 'SmallNativeLayout2', 'SmallNativeLayout3'] as const;
export const LAYOUT_IDS = [3, 4, 5] as const; // customLayout.id values mapping to the 3 layouts

// Short vi description of each layout (shown under the thumbnail).
export const LAYOUT_DESCRIPTIONS = [
  'Media vuông bên trái · nút to bên dưới',
  'Dọc · nút full-width dưới cùng (mặc định)',
  'Gọn 1 hàng kiểu banner · nút nhỏ bên phải',
] as const;

// customLayout toggle fields with vi tooltips (advanced layout editor).
export const CUSTOM_LAYOUT_TOGGLES: { key: keyof NativeAdLayoutConfig; label: string; hint: string }[] = [
  { key: 'hideMedia', label: 'Ẩn media', hint: 'Ẩn ảnh/video lớn của ad' },
  { key: 'hideIcon', label: 'Ẩn icon', hint: 'Ẩn icon app' },
  { key: 'hideBody', label: 'Ẩn mô tả', hint: 'Ẩn dòng nội dung (body)' },
  { key: 'hideButton', label: 'Ẩn nút', hint: 'Ẩn nút call-to-action' },
  { key: 'hideTagLine', label: 'Ẩn tiêu đề', hint: 'Ẩn headline' },
  { key: 'smallFont', label: 'Chữ nhỏ', hint: 'Dùng cỡ chữ nhỏ' },
  { key: 'reverse', label: 'Đảo chiều', hint: 'Đảo thứ tự text/nút' },
];
