// Native ad STYLE config (native_ads_style_config) — mirrors the brain-training app.
// Sources of truth mirrored here (keep in sync, do NOT import across repos):
//   brain-training/src/types/index.tsx              (NativeAdStyleRaw shape)
//   brain-training/src/new-ads/nativeAdStyleDefaults.ts (NATIVE_STYLE_DEFAULTS + INLINE_BASE)
//   brain-training/src/new-ads/nativeAdStyle.ts      (clamp ranges + resolve/color logic)
//
// Firebase value shape: { default?: NativeAdStyleRaw, layouts?: Record<layoutKey, NativeAdStyleRaw> }.
// The app resolves a layout as:  DEFAULTS[layout] ⊕ cfg.default ⊕ cfg.layouts[layout], then clamps.

export const NATIVE_STYLE_KEY = "native_ads_style_config";

// Raw per-layout style overrides. Every field optional; colors are #AARRGGBB
// (Android). Mirror of brain-training NativeAdStyleRaw.
export type NativeAdStyleRaw = {
  // colors
  ad_container_background_color?: string;
  ad_container_border_color?: string;
  ad_container_has_shadow?: boolean;
  ad_title_color?: string;
  ad_content_text_color?: string;
  ad_text_color?: string; // badge text
  ad_text_background_color?: string; // badge bg
  cta_background_color?: string;
  cta_text_color?: string;
  cta_has_shadow?: boolean;
  // sizes (dp/sp)
  container_corner_radius?: number;
  container_border_width?: number;
  padding?: number;
  badge_text_size?: number;
  badge_corner_radius?: number;
  title_text_size?: number;
  title_max_lines?: number;
  body_text_size?: number;
  body_max_lines?: number;
  icon_size?: number;
  icon_corner_radius?: number;
  media_height?: number;
  media_square_size?: number;
  cta_height?: number;
  cta_text_size?: number;
  cta_corner_radius?: number;
  cta_side_width?: number;
  vertical_space?: number;
  horizontal_space?: number;
  media_scale?: "fit_center" | "center_crop";
};

export type NativeAdStyleConfigRaw = {
  default?: NativeAdStyleRaw;
  layouts?: Record<string, NativeAdStyleRaw>;
};

// ── Layout catalog ──────────────────────────────────────────────────────────
export type NativeStyleLayoutKey =
  | "small"
  | "small_cta_bottom"
  | "in_line_cta_right"
  | "collapsible"
  | "media_full"
  | "dialog"
  | "bottom_card"
  | "media_large"
  | "media_small"
  | "media_header";

export type LayoutGroup = "inline" | "collapsible" | "fullscreen";

export type LayoutMeta = {
  key: NativeStyleLayoutKey;
  group: LayoutGroup;
  label: string;
  desc: string;
};

export const NATIVE_STYLE_LAYOUT_KEYS: LayoutMeta[] = [
  // inline (RN) — SmallNativeLayout1/2/3
  { key: "small", group: "inline", label: "Small (media trái)", desc: "Media vuông bên trái · nút to bên dưới" },
  { key: "small_cta_bottom", group: "inline", label: "Small · CTA dưới", desc: "Dọc · icon+title trên · nút full-width dưới" },
  { key: "in_line_cta_right", group: "inline", label: "Inline · CTA phải", desc: "Gọn 1 hàng kiểu banner · nút nhỏ bên phải" },
  // collapsible expanded (native android)
  { key: "collapsible", group: "collapsible", label: "Collapsible", desc: "Bung 16:9 media · icon · CTA (ExpandedNativeAdView)" },
  // fullscreen native (android) — default nằm trong XML
  { key: "media_full", group: "fullscreen", label: "Media full", desc: "Toàn màn · media lớn" },
  { key: "dialog", group: "fullscreen", label: "Dialog", desc: "Hộp thoại giữa màn" },
  { key: "bottom_card", group: "fullscreen", label: "Bottom card", desc: "Thẻ dưới màn hình" },
  { key: "media_large", group: "fullscreen", label: "Media large", desc: "Media lớn" },
  { key: "media_small", group: "fullscreen", label: "Media small", desc: "Media nhỏ" },
  { key: "media_header", group: "fullscreen", label: "Media header", desc: "Media trên đầu" },
];

export const LAYOUT_GROUP_LABELS: Record<LayoutGroup, string> = {
  inline: "Inline (trong màn)",
  collapsible: "Collapsible",
  fullscreen: "Fullscreen (default trong Android XML)",
};

export const isFullscreenLayout = (key: string): boolean =>
  NATIVE_STYLE_LAYOUT_KEYS.some((l) => l.key === key && l.group === "fullscreen");

// ── Project defaults (mirror of nativeAdStyleDefaults.ts) ────────────────────
// Base for inline layouts (nền sáng #F6FAFB).
const INLINE_BASE: NativeAdStyleRaw = {
  ad_container_background_color: "#F6FAFB",
  ad_container_border_color: "#00000000",
  ad_container_has_shadow: false,
  ad_title_color: "#FF1A1A1A",
  ad_content_text_color: "#FF888888",
  ad_text_color: "#FF1A1A1A",
  ad_text_background_color: "#FFA5E8F0",
  cta_text_color: "#FFFFFFFF",
  cta_has_shadow: false,
  container_corner_radius: 0,
  container_border_width: 0,
  padding: 12,
  badge_text_size: 10,
  badge_corner_radius: 4,
  title_text_size: 14,
  title_max_lines: 2,
  body_text_size: 14,
  body_max_lines: 2,
  icon_size: 48,
  icon_corner_radius: 8,
  media_height: 156,
  media_square_size: 120,
  cta_height: 48,
  cta_text_size: 14,
  cta_corner_radius: 30,
  cta_side_width: 120,
  vertical_space: 4,
  horizontal_space: 12,
  media_scale: "center_crop",
};

export { INLINE_BASE };

// Real project defaults — the diff baseline the editor serializes against, and the
// preview baseline for these 4 layouts. Fullscreen layouts are intentionally absent
// (their real defaults live in Android XML — see FULLSCREEN_PREVIEW_DEFAULTS).
export const NATIVE_STYLE_DEFAULTS: Partial<Record<NativeStyleLayoutKey, NativeAdStyleRaw>> = {
  small: { ...INLINE_BASE, body_max_lines: 3 },
  small_cta_bottom: { ...INLINE_BASE, padding: 16, badge_text_size: 12, horizontal_space: 8 },
  in_line_cta_right: {
    ...INLINE_BASE,
    media_square_size: 48,
    title_text_size: 12,
    title_max_lines: 1,
    body_text_size: 12,
    horizontal_space: 4,
  },
  collapsible: {
    ad_container_background_color: "#FFF6FAFB",
    ad_container_border_color: "#00000000",
    ad_container_has_shadow: false,
    ad_title_color: "#FF1A1A1A",
    ad_content_text_color: "#FF888888",
    ad_text_color: "#FF1A1A1A",
    ad_text_background_color: "#FFA5E8F0",
    cta_text_color: "#FFFFFFFF",
    cta_has_shadow: false,
    container_corner_radius: 0,
    container_border_width: 0,
    padding: 12,
    badge_text_size: 10,
    badge_corner_radius: 3,
    title_text_size: 15,
    title_max_lines: 1,
    body_text_size: 13,
    body_max_lines: 2,
    icon_size: 44,
    icon_corner_radius: 8,
    media_height: 180, // XML dùng 16:9 động; 180 chỉ để preview có chiều cao hợp lý
    media_square_size: 44,
    cta_height: 44,
    cta_text_size: 14,
    cta_corner_radius: 30,
    cta_side_width: 120,
    vertical_space: 4,
    horizontal_space: 10,
    media_scale: "center_crop",
  },
};

// Baselines used ONLY by the preview for the 6 fullscreen variants. Values are read
// from the real Android layouts (brain-training/android/app/src/main/res/layout/
// activity_native_ad*.xml + drawables), so the preview matches the device defaults:
//   CTA fill  native_cta_fill  → gradient #30CB83→#0D865E (== resolver CTA fallback,
//             so we leave cta_background_color UNSET to keep that exact gradient)
//   Badge     native_ad_badge  → yellow #FCB41C + white text
//   Cards     native_card_white / *_top_rounded radius 24dp; CTA radius 30dp
// These are NEVER written to config (the editor diffs against NATIVE_STYLE_DEFAULTS,
// which has no fullscreen entry, so every field the user sets is published as an
// override on top of the untouched XML defaults). Body/title colors are matched to
// each variant's card theme (dark variants show white title over a dark panel).
const FULLSCREEN_BASE: NativeAdStyleRaw = {
  ad_container_background_color: "#FFFFFFFF", // native_card_white
  ad_container_border_color: "#00000000",
  ad_container_has_shadow: false,
  ad_title_color: "#FF1A1A1A", // ad_headline on white card
  ad_content_text_color: "#FF888888", // ad_body on white card
  ad_text_color: "#FFFFFFFF", // badge text (native_ad_badge white glyph)
  ad_text_background_color: "#FFFCB41C", // badge yellow
  cta_text_color: "#FFFFFFFF", // ad_cta text @android:color/white
  cta_has_shadow: false, // native_cta_fill is a flat gradient shape
  container_corner_radius: 24, // native_card_* radius 24dp
  container_border_width: 0,
  padding: 16,
  badge_text_size: 11,
  badge_corner_radius: 4,
  title_text_size: 18, // ad_headline 18sp
  title_max_lines: 2,
  body_text_size: 14, // ad_body 14sp
  body_max_lines: 3,
  icon_size: 64,
  icon_corner_radius: 14,
  media_height: 220,
  media_square_size: 120,
  cta_height: 52,
  cta_text_size: 16, // ad_cta 16sp
  cta_corner_radius: 30, // native_cta_fill radius 30dp
  cta_side_width: 160,
  vertical_space: 10,
  horizontal_space: 12,
  media_scale: "center_crop",
};

export const FULLSCREEN_PREVIEW_DEFAULTS: Record<string, NativeAdStyleRaw> = {
  // media fills the whole screen; bottom scrim shows a white body line + a WHITE pill-card
  // (native_card_white) holding icon + dark headline + CTA. So headline is dark on the card,
  // body is white on the scrim, container = the white card.
  media_full: {
    ...FULLSCREEN_BASE,
    ad_container_background_color: "#FFFFFFFF",
    ad_title_color: "#FF1A1A1A",
    ad_content_text_color: "#FFFFFFFF",
    title_text_size: 14,
    body_text_size: 16,
    cta_text_size: 14,
    media_height: 300,
  },
  // white dialog card, icon 56, media 140, headline #1A1A1A / body #888888
  dialog: { ...FULLSCREEN_BASE, icon_size: 56, body_text_size: 14, ad_content_text_color: "#FF888888", media_height: 140 },
  // white top-rounded bottom card, icon 56, media 220, body #888888
  bottom_card: { ...FULLSCREEN_BASE, icon_size: 56, body_text_size: 14, ad_content_text_color: "#FF888888", media_height: 220 },
  // media (top) over #1A1A1A root, WHITE content panel (bottom) with CTA pinned to the
  // panel bottom. Headline #1A1A1A (dark) so it's visible on the white panel — matches the
  // XML fix (was white-on-white). body #AAAAAA.
  media_large: {
    ...FULLSCREEN_BASE,
    ad_container_background_color: "#FFFFFFFF",
    ad_title_color: "#FF1A1A1A",
    ad_content_text_color: "#FFAAAAAA",
    icon_size: 48,
    container_corner_radius: 0,
    media_height: 260,
  },
  // dark panel #1E1E1E (native_panel_top_rounded) → white headline 24sp, body 16sp
  media_small: {
    ...FULLSCREEN_BASE,
    ad_container_background_color: "#FF1E1E1E",
    ad_title_color: "#FFFFFFFF",
    ad_content_text_color: "#FFAAAAAA",
    title_text_size: 24,
    body_text_size: 16,
    media_height: 140,
  },
  // white content area, black headline, body/rating #AAAAAA
  media_header: {
    ...FULLSCREEN_BASE,
    ad_title_color: "#FF000000",
    ad_content_text_color: "#FFAAAAAA",
    icon_size: 80,
    container_corner_radius: 0,
    media_height: 180,
  },
};

// ── Field metadata (drives the editor form) ──────────────────────────────────
export type FieldGroup =
  | "container"
  | "badge"
  | "title"
  | "body"
  | "icon"
  | "media"
  | "cta"
  | "spacing";

export type StyleField = {
  key: keyof NativeAdStyleRaw;
  group: FieldGroup;
  label: string;
  control: "color" | "number" | "enum" | "bool";
  min?: number;
  max?: number;
  unit?: string;
};

export const FIELD_GROUP_LABELS: Record<FieldGroup, string> = {
  container: "Khung (container)",
  badge: 'Nhãn "Ad" (badge)',
  title: "Tiêu đề (title)",
  body: "Mô tả (body)",
  icon: "Icon",
  media: "Media (ảnh/video)",
  cta: "Nút CTA",
  spacing: "Khoảng cách",
};

// Numeric ranges mirror the clamp bounds in nativeAdStyle.ts:58-79.
export const STYLE_FIELDS: StyleField[] = [
  // container
  { key: "ad_container_background_color", group: "container", label: "Màu nền", control: "color" },
  { key: "ad_container_border_color", group: "container", label: "Màu viền", control: "color" },
  { key: "container_border_width", group: "container", label: "Độ dày viền", control: "number", min: 0, max: 4, unit: "dp" },
  { key: "container_corner_radius", group: "container", label: "Bo góc", control: "number", min: 0, max: 28, unit: "dp" },
  { key: "padding", group: "container", label: "Padding", control: "number", min: 0, max: 28, unit: "dp" },
  { key: "ad_container_has_shadow", group: "container", label: "Đổ bóng", control: "bool" },
  // badge
  { key: "ad_text_color", group: "badge", label: "Màu chữ", control: "color" },
  { key: "ad_text_background_color", group: "badge", label: "Màu nền", control: "color" },
  { key: "badge_text_size", group: "badge", label: "Cỡ chữ", control: "number", min: 1, max: 40, unit: "sp" },
  { key: "badge_corner_radius", group: "badge", label: "Bo góc", control: "number", min: 0, max: 16, unit: "dp" },
  // title
  { key: "ad_title_color", group: "title", label: "Màu chữ", control: "color" },
  { key: "title_text_size", group: "title", label: "Cỡ chữ", control: "number", min: 1, max: 40, unit: "sp" },
  { key: "title_max_lines", group: "title", label: "Số dòng tối đa", control: "number", min: 1, max: 4, unit: "dòng" },
  // body
  { key: "ad_content_text_color", group: "body", label: "Màu chữ", control: "color" },
  { key: "body_text_size", group: "body", label: "Cỡ chữ", control: "number", min: 1, max: 40, unit: "sp" },
  { key: "body_max_lines", group: "body", label: "Số dòng tối đa", control: "number", min: 1, max: 5, unit: "dòng" },
  // icon
  { key: "icon_size", group: "icon", label: "Kích thước", control: "number", min: 24, max: 120, unit: "dp" },
  { key: "icon_corner_radius", group: "icon", label: "Bo góc", control: "number", min: 0, max: 60, unit: "dp" },
  // media
  { key: "media_height", group: "media", label: "Chiều cao (dọc)", control: "number", min: 0, max: 600, unit: "dp" },
  { key: "media_square_size", group: "media", label: "Cạnh vuông (inline)", control: "number", min: 24, max: 320, unit: "dp" },
  { key: "media_scale", group: "media", label: "Cách scale", control: "enum" },
  // cta
  { key: "cta_background_color", group: "cta", label: "Màu nền", control: "color" },
  { key: "cta_text_color", group: "cta", label: "Màu chữ", control: "color" },
  { key: "cta_height", group: "cta", label: "Chiều cao", control: "number", min: 24, max: 160, unit: "dp" },
  { key: "cta_text_size", group: "cta", label: "Cỡ chữ", control: "number", min: 1, max: 40, unit: "sp" },
  { key: "cta_corner_radius", group: "cta", label: "Bo góc", control: "number", min: 0, max: 40, unit: "dp" },
  { key: "cta_side_width", group: "cta", label: "Bề rộng (CTA phải)", control: "number", min: 56, max: 220, unit: "dp" },
  { key: "cta_has_shadow", group: "cta", label: "Đổ bóng", control: "bool" },
  // spacing
  { key: "vertical_space", group: "spacing", label: "Dọc", control: "number", min: 0, max: 24, unit: "dp" },
  { key: "horizontal_space", group: "spacing", label: "Ngang", control: "number", min: 0, max: 24, unit: "dp" },
];

export const FIELD_GROUP_ORDER: FieldGroup[] = [
  "container",
  "badge",
  "title",
  "body",
  "icon",
  "media",
  "cta",
  "spacing",
];

export const MEDIA_SCALE_OPTIONS = [
  { label: "center_crop (cover)", value: "center_crop" },
  { label: "fit_center (contain)", value: "fit_center" },
] as const;

// ── Color helpers (port of nativeAdStyle.ts) ─────────────────────────────────
// #AARRGGBB → #RRGGBBAA (CSS 8-digit); #RRGGBB / other kept as-is.
export const aarrggbbToCss = (c: string): string => {
  const h = c.replace("#", "");
  return h.length === 8 ? "#" + h.slice(2) + h.slice(0, 2) : c;
};
// #RRGGBBAA (CSS / color picker) → #AARRGGBB (stored). #RRGGBB → #FFRRGGBB.
export const cssToAarrggbb = (c: string): string => {
  const h = c.replace("#", "").toUpperCase();
  if (h.length === 8) return "#" + h.slice(6) + h.slice(0, 6);
  if (h.length === 6) return "#FF" + h;
  return c;
};
// #AARRGGBB / #RRGGBB → #RRGGBB (drop alpha), for darkenColor.
const rgbOf = (c: string): string => {
  const h = c.replace("#", "");
  return h.length === 8 ? "#" + h.slice(2) : c;
};
// Mirror of brain-training darkenColor (returns #RRGGBB).
const darkenColor = (hex: string, amount: number): string => {
  let color = hex.replace("#", "");
  if (color.length === 3) color = color[0] + color[0] + color[1] + color[1] + color[2] + color[2];
  const num = parseInt(color, 16);
  let r = (num >> 16) - amount;
  let g = ((num >> 8) & 0x00ff) - amount;
  let b = (num & 0x0000ff) - amount;
  r = r < 0 ? 0 : r;
  g = g < 0 ? 0 : g;
  b = b < 0 ? 0 : b;
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
};

const CTA_START = "#FF30CB83";
const CTA_END = "#FF0D865E";

// ── Resolve + clamp (for the preview) ────────────────────────────────────────
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

const RANGES: Partial<Record<keyof NativeAdStyleRaw, [number, number]>> =
  Object.fromEntries(
    STYLE_FIELDS.filter((f) => f.control === "number").map((f) => [
      f.key,
      [f.min ?? 0, f.max ?? Number.MAX_SAFE_INTEGER],
    ]),
  ) as Partial<Record<keyof NativeAdStyleRaw, [number, number]>>;

const clampRaw = (raw: NativeAdStyleRaw): NativeAdStyleRaw => {
  const r = { ...raw };
  for (const [key, [lo, hi]] of Object.entries(RANGES)) {
    const v = (r as Record<string, unknown>)[key];
    if (typeof v === "number") (r as Record<string, unknown>)[key] = clamp(v, lo, hi);
  }
  return r;
};

// The diff baseline the editor serializes against + inherited-value display.
// Real project defaults only (fullscreen → {}).
export const projectDefaults = (layoutKey: string): NativeAdStyleRaw =>
  NATIVE_STYLE_DEFAULTS[layoutKey as NativeStyleLayoutKey] ?? {};

// Preview baseline: real defaults, falling back to the approximate fullscreen ones.
export const previewBaseline = (layoutKey: string): NativeAdStyleRaw =>
  NATIVE_STYLE_DEFAULTS[layoutKey as NativeStyleLayoutKey] ??
  FULLSCREEN_PREVIEW_DEFAULTS[layoutKey] ??
  INLINE_BASE;

// Merge one layout's raw style: base ⊕ cfg.default ⊕ cfg.layouts[layoutKey].
export const mergeRaw = (
  base: NativeAdStyleRaw,
  cfg: NativeAdStyleConfigRaw,
  layoutKey: string,
): NativeAdStyleRaw => ({
  ...base,
  ...(cfg.default || {}),
  ...((cfg.layouts && cfg.layouts[layoutKey]) || {}),
});

// Fully-resolved style for the preview: CSS colors + numbers + cover/contain.
export type ResolvedPreviewStyle = {
  containerBg: string;
  containerBorderColor: string;
  containerBorderWidth: number;
  containerHasShadow: boolean;
  titleColor: string;
  bodyColor: string;
  badgeTextColor: string;
  badgeBg: string;
  ctaGradStart: string;
  ctaGradEnd: string;
  ctaText: string;
  ctaHasShadow: boolean;
  containerCornerRadius: number;
  padding: number;
  badgeTextSize: number;
  badgeCornerRadius: number;
  titleSize: number;
  titleMaxLines: number;
  bodySize: number;
  bodyMaxLines: number;
  iconSize: number;
  iconCornerRadius: number;
  mediaHeight: number;
  mediaSquareSize: number;
  ctaHeight: number;
  ctaTextSize: number;
  ctaCornerRadius: number;
  ctaSideWidth: number;
  vSpace: number;
  hSpace: number;
  mediaScale: "cover" | "contain";
};

const toResolved = (r: NativeAdStyleRaw): ResolvedPreviewStyle => {
  const ctaBg = r.cta_background_color;
  return {
    containerBg: r.ad_container_background_color ? aarrggbbToCss(r.ad_container_background_color) : "#F6FAFBFF",
    containerBorderColor: r.ad_container_border_color ? aarrggbbToCss(r.ad_container_border_color) : "#00000000",
    containerBorderWidth: r.container_border_width ?? 0,
    containerHasShadow: !!r.ad_container_has_shadow,
    titleColor: r.ad_title_color ? aarrggbbToCss(r.ad_title_color) : "#1A1A1AFF",
    bodyColor: r.ad_content_text_color ? aarrggbbToCss(r.ad_content_text_color) : "#888888FF",
    badgeTextColor: r.ad_text_color ? aarrggbbToCss(r.ad_text_color) : "#1A1A1AFF",
    badgeBg: r.ad_text_background_color ? aarrggbbToCss(r.ad_text_background_color) : "#A5E8F0FF",
    ctaGradStart: ctaBg ? aarrggbbToCss(ctaBg) : aarrggbbToCss(CTA_START),
    ctaGradEnd: ctaBg ? darkenColor(rgbOf(ctaBg), 40) : aarrggbbToCss(CTA_END),
    ctaText: r.cta_text_color ? aarrggbbToCss(r.cta_text_color) : "#FFFFFFFF",
    ctaHasShadow: !!r.cta_has_shadow,
    containerCornerRadius: r.container_corner_radius ?? 0,
    padding: r.padding ?? 12,
    badgeTextSize: r.badge_text_size ?? 10,
    badgeCornerRadius: r.badge_corner_radius ?? 4,
    titleSize: r.title_text_size ?? 14,
    titleMaxLines: r.title_max_lines ?? 2,
    bodySize: r.body_text_size ?? 14,
    bodyMaxLines: r.body_max_lines ?? 2,
    iconSize: r.icon_size ?? 48,
    iconCornerRadius: r.icon_corner_radius ?? 8,
    mediaHeight: r.media_height ?? 0,
    mediaSquareSize: r.media_square_size ?? 120,
    ctaHeight: r.cta_height ?? 48,
    ctaTextSize: r.cta_text_size ?? 14,
    ctaCornerRadius: r.cta_corner_radius ?? 30,
    ctaSideWidth: r.cta_side_width ?? 120,
    vSpace: r.vertical_space ?? 4,
    hSpace: r.horizontal_space ?? 12,
    mediaScale: r.media_scale === "fit_center" ? "contain" : "cover",
  };
};

// Full resolve for the preview of a given layout under the current config.
export const resolveStyle = (
  layoutKey: string,
  cfg: NativeAdStyleConfigRaw,
): ResolvedPreviewStyle =>
  toResolved(clampRaw(mergeRaw(previewBaseline(layoutKey), cfg, layoutKey)));

// Inherited value shown as placeholder for a field when it's NOT overridden in the
// active scope. layout scope → cfg.default[f] ?? projectDefault[f]; default scope →
// INLINE_BASE[f] (generic hint, since the global default has no single layout base).
export const inheritedFieldValue = (
  scope: "default" | string,
  field: keyof NativeAdStyleRaw,
  cfg: NativeAdStyleConfigRaw,
): string | number | boolean | undefined => {
  if (scope === "default") return INLINE_BASE[field];
  return cfg.default?.[field] ?? projectDefaults(scope)[field];
};
