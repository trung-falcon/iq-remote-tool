// Ad-trigger constants + editor-facing types. Mirrors the app's Trigger schema
// (brain-training/src/new-ads/type.ts + defaultOption in index.ts:58-78).

export const TRIGGER_PREFIX = 'trigger_';

// Firebase key for an event name (app lowercases: 'trigger_' + event.toLowerCase()).
export const triggerKeyFor = (event: string): string =>
  TRIGGER_PREFIX + event.trim().toLowerCase();

export const eventFromKey = (key: string): string =>
  key.startsWith(TRIGGER_PREFIX) ? key.slice(TRIGGER_PREFIX.length) : key;

export type AdsType = 'reward' | 'inter' | 'native' | 'open_ads' | 'banner';
export type MediationType = 'admob' | 'max';
export type ExecutionOrder = 'ad_first' | 'paywall_first';

export const ADS_TYPES: AdsType[] = ['reward', 'inter', 'native', 'open_ads', 'banner'];
export const MEDIATIONS: MediationType[] = ['admob', 'max'];
export const EXECUTION_ORDERS: ExecutionOrder[] = ['ad_first', 'paywall_first'];

// PaywallLegacyType numeric enum (stored as 0-5 in JSON).
export const PAYWALL_LEGACY = [
  { value: 0, label: 'MAIN' },
  { value: 1, label: 'FIRST_SALE' },
  { value: 2, label: 'SECOND_SALE' },
  { value: 3, label: 'PURCHASE_MODAL' },
  { value: 4, label: 'REMOVE_ADS' },
  { value: 5, label: 'SHOP' },
] as const;

export type AdAfterAd = {
  active: boolean;
  adsType: AdsType | AdsType[];
  mediation?: MediationType;
  adsGroup?: string;
  loadOnPrevAdOpen?: boolean;
};

export type ShowAd = {
  active: boolean;
  updateToLastShow: boolean;
  timeAwaitHighBeforeShow: number;
  skipCoolDownTime: boolean;
  adsType: AdsType | AdsType[];
  mediation?: MediationType;
  adsGroup?: string;
  purchaseAfterAds?: boolean;
  adAfterAd?: AdAfterAd;
};

export type PaywallScreen = { superwall?: string; legacy: number };

export type Paywall = {
  active: boolean;
  screens: PaywallScreen[];
  cooldownTime?: number;
  skipAfterNShows?: number;
  swapAfterNS?: number[];
};

export type Trigger = {
  log: boolean;
  executionOrder?: ExecutionOrder;
  showAd: ShowAd;
  enableAd?: string[];
  disableAd?: { ads: string[]; permanentlyStop?: boolean };
  continueIfNoAds: boolean;
  paywall: Paywall;
  superwallPreload?: string[];
};

// Mirror of defaultOption (index.ts:58-78) — initializes new triggers and is the
// baseline for minimal-diff serialization (only non-default fields are published).
export const DEFAULT_TRIGGER: Trigger = {
  log: true,
  executionOrder: 'ad_first',
  showAd: {
    active: false,
    updateToLastShow: true,
    timeAwaitHighBeforeShow: 0,
    adsType: 'inter',
    skipCoolDownTime: false,
    purchaseAfterAds: false,
  },
  continueIfNoAds: true,
  paywall: {
    active: false,
    screens: [{ legacy: 0 }, { legacy: 2 }],
    swapAfterNS: [2, 3],
  },
};

// Known event names (autocomplete suggestions; free text also allowed).
export const TRIGGER_EVENTS: string[] = [
  'ad_revive_modal_cancel',
  'brain_score_result_got_it',
  'change_blocks',
  'click_assistant_report',
  'click_assistant_speak',
  'click_continue_playing_game',
  'click_continue_playing_test',
  'click_feedback_settings',
  'click_finish_NextGameModal',
  'click_header_avatar',
  'click_header_coin',
  'click_header_heart',
  'click_header_menu',
  'click_header_settings_button',
  'click_language_settings',
  'click_new_schedule_intro_continue',
  'click_next_game_NextGameModal',
  'click_next_level_NextGameModal',
  'click_notification_banner_enable',
  'click_onboard_get_started',
  'click_other_apps_settings',
  'click_premium_banner',
  'click_premium_benefits_card',
  'click_privacy_policy_settings',
  'click_rate_settings',
  'click_share_settings',
  'click_submit_feedback',
  'click_test_in_test_tab',
  'click_widget_settings',
  'complete_onboard',
  'disable_ads_except_rw',
  'done_daily_tasks',
  'enter_bonus_widget',
  'enter_games_tab',
  'enter_intro_screen',
  'enter_progress_tab',
  'enter_shop_tab',
  'enter_tests_tab',
  'enter_today_tab',
  'freeze_timer_booster',
  'iap_purchase_show',
  'inter_enter_game',
  'inter_enter_test',
  'inter_next_level',
  'last_onboard_show',
  'leave_game_pause',
  'leave_game_result',
  'locked_game_result',
  'onboard_skip_after_ad',
  'pause_continue_btn',
  'pause_leave_game_btn',
  'pause_select_level_btn',
  'preload_onboard_ads',
  'purchase_modal_continue',
  'quitLevelModal_continue_game',
  'quitLevelModal_quit_game',
  'refill_energy_with_coins',
  'remove_ads_modal_close_btn',
  'session2plus_open',
  'show_language_selection_modal',
  'skip_level_btn',
  'start_app',
  'start_app_open_ad_enable',
  'task_update_modal_close_btn',
];
