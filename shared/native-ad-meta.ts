// Native ad config value shape (NativeAdRemoteConfigType / NativeAdConfig in the
// app) + display metadata for the native-ad editor. This config is embedded
// per-screen (control_onboard_screen_* / control_language_screens) — there is no
// shared control_native_* catalog anymore. App merges each field independently.

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

// App default (nativeAdConfig.ts DEFAULT_NATIVE_AD_CONFIG) — base for per-screen merges.
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
