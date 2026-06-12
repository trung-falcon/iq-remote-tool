// Ads waterfall (ads_wf_config) constants + types. Mirrors the app's
// AdsRemoteConfig/AdsItem (brain-training/src/new-ads/index.ts:126-137, type.ts:7-19).
import type { AdsType, MediationType } from './trigger-meta';

// The app reads via getRemote(key) which tries `{platform}_{key}` then `{key}`
// (remoteConfig.ts:351-358), so up to 3 variants can exist.
export const ADS_WF_KEYS = [
  'ads_wf_config',
  'android_ads_wf_config',
  'ios_ads_wf_config',
] as const;

export const ADS_WF_VARIANTS: { key: string; label: string }[] = [
  { key: 'ads_wf_config', label: 'Chung (fallback)' },
  { key: 'android_ads_wf_config', label: 'Android' },
  { key: 'ios_ads_wf_config', label: 'iOS' },
];

export type AdsItem = {
  id: string;
  name: string;
  type: AdsType;
  mediation: MediationType;
  isHigh?: boolean;
  isHighFloor?: boolean;
  disabled?: boolean;
  isPermanentlyStopped?: boolean;
  groupName?: string;
  maxRetryNumber?: number;
  maxTimeReload?: number;
};

export type AdsRemoteConfig = {
  ids: AdsItem[];
  x: number;
  y: number;
  loadInterval: number;
  maxRetryNumber: number;
  maxTimeReload: number;
  coolDownTime: number;
  continueReloadAfter: number;
  enableAdmob: boolean;
  enableMax: boolean;
};

// Scalar (non-ids) top-level fields + labels/hints for the timing form.
export const ADS_SCALAR_FIELDS = [
  'enableAdmob',
  'enableMax',
  'coolDownTime',
  'loadInterval',
  'maxRetryNumber',
  'maxTimeReload',
  'continueReloadAfter',
  'x',
  'y',
] as const;

export const ADS_FIELD_LABELS: Record<string, string> = {
  enableAdmob: 'Bật AdMob',
  enableMax: 'Bật AppLovin MAX',
  coolDownTime: 'Cooldown giữa 2 ad (ms)',
  loadInterval: 'Khoảng cách load (ms)',
  maxRetryNumber: 'Số lần retry tối đa',
  maxTimeReload: 'Thời gian tối đa/lần reload (ms)',
  continueReloadAfter: 'Reset retry sau (ms)',
  x: 'Retry base (ms)',
  y: 'Retry offset (ms)',
};

// App default (index.ts:307-322). ids empty here — only used as the baseline for
// a brand-new variant; real variants are loaded from Firebase.
export const DEFAULT_ADS_CONFIG: AdsRemoteConfig = {
  ids: [],
  x: 10000,
  y: 5000,
  loadInterval: 200,
  maxRetryNumber: 10,
  maxTimeReload: 30000,
  coolDownTime: 60000,
  continueReloadAfter: 300000,
  enableAdmob: true,
  enableMax: false,
};
