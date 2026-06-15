// Per-screen native-ad config: onboarding screens (control_onboard_screen_{id})
// + the language settings screen (control_language_screens). Each screen object
// carries its own `nativeAdConfig` inline (merged over DEFAULT_NATIVE_AD_CONFIG by
// the app). Mirrors the app: Onboard_Screens (OnboardContext.tsx) + baseDefaultConfig
// (onboardScreenConfig.ts) + control_language_screens default (remoteConfig.ts).
import type { NativeAdConfig } from './native-ad-meta';

export const ONBOARD_SCREEN_PREFIX = 'control_onboard_screen_';
export const ONBOARD_SCREEN_RE = /^control_onboard_screen_[A-Za-z0-9]+$/;
export const LANGUAGE_SCREEN_KEY = 'control_language_screens';

export const onboardScreenKeyFor = (id: string): string => ONBOARD_SCREEN_PREFIX + id;
export const onboardIdFromKey = (key: string): string =>
  key.startsWith(ONBOARD_SCREEN_PREFIX) ? key.slice(ONBOARD_SCREEN_PREFIX.length) : key;

export type ScreenKind = 'onboard' | 'language';
export type ScreenEntry = { key: string; label: string; kind: ScreenKind };

// 12 onboard screen ids (order = Onboard_Screens) + the language screen.
const ONBOARD_SCREENS: { id: string; label: string }[] = [
  { id: 'BenefitsPage', label: 'Lợi ích' },
  { id: 'ScienceBasedPage', label: 'Khoa học' },
  { id: 'PersonalizedPage', label: 'Cá nhân hóa' },
  { id: 'AgeRangePage', label: 'Độ tuổi' },
  { id: 'GenderPage', label: 'Giới tính' },
  { id: 'GameCategoryTargetPage', label: 'Mục tiêu game' },
  { id: 'TestTargetPage', label: 'Mục tiêu test' },
  { id: 'DailyGoalPage', label: 'Mục tiêu hằng ngày' },
  { id: 'EnableNotiPage', label: 'Bật thông báo' },
  { id: 'StartTestPage', label: 'Bắt đầu test' },
  { id: 'IQTestPage', label: 'IQ test' },
  { id: 'PreparingTrainingPage', label: 'Chuẩn bị luyện tập' },
];

export const SCREEN_CATALOG: ScreenEntry[] = [
  ...ONBOARD_SCREENS.map(s => ({ key: onboardScreenKeyFor(s.id), label: s.label, kind: 'onboard' as const })),
  { key: LANGUAGE_SCREEN_KEY, label: 'Màn chọn ngôn ngữ', kind: 'language' as const },
];

export const screenKindOf = (key: string): ScreenKind =>
  key === LANGUAGE_SCREEN_KEY ? 'language' : 'onboard';

// --- Config shapes (all fields optional — per-screen partial overrides) ---
export type OnboardScreenConfig = {
  adType?: 'native' | 'banner' | 'none';
  showAd?: boolean;
  continueBtnType?: 'small' | 'large' | 'none';
  continueBtnPosition?: 'bottom' | 'top';
  progressBarPosition?: 'top' | 'bottom';
  smallBtnMode?: 'text' | 'fill' | 'stroke';
  progressStep?: boolean;
  continueWhenClickAd?: boolean;
  nativeAdGroup?: string;
  nativeAdConfig?: NativeAdConfig;
};

export type LanguageScreenConfig = {
  adType?: 'native' | 'banner' | 'none';
  saveBtnMode?: 'fill' | 'stroke';
  countdownTimer?: number;
  continueWhenClickAd?: boolean;
  nativeAdConfig?: NativeAdConfig;
};

export type ScreenConfig = OnboardScreenConfig & LanguageScreenConfig;

// Seed when creating a not-yet-published screen config (mirrors app defaults).
export const DEFAULT_ONBOARD_SCREEN: OnboardScreenConfig = {
  adType: 'native',
  showAd: false,
  continueBtnType: 'large',
  continueBtnPosition: 'bottom',
  progressBarPosition: 'top',
  smallBtnMode: 'fill',
  progressStep: false,
  continueWhenClickAd: false,
  nativeAdGroup: 'onboard_intro',
};

export const DEFAULT_LANGUAGE_SCREEN: LanguageScreenConfig = {
  adType: 'banner',
  saveBtnMode: 'fill',
  countdownTimer: 10,
  continueWhenClickAd: false,
};

export const defaultForKind = (kind: ScreenKind): ScreenConfig =>
  kind === 'language' ? { ...DEFAULT_LANGUAGE_SCREEN } : { ...DEFAULT_ONBOARD_SCREEN };

// Enum options for the editor selects.
export const AD_TYPES = ['native', 'banner', 'none'] as const;
export const CONTINUE_BTN_TYPES = ['small', 'large', 'none'] as const;
export const CONTINUE_BTN_POSITIONS = ['bottom', 'top'] as const;
export const PROGRESS_BAR_POSITIONS = ['top', 'bottom'] as const;
export const SMALL_BTN_MODES = ['text', 'fill', 'stroke'] as const;
export const SAVE_BTN_MODES = ['fill', 'stroke'] as const;
