import { Card, Input, InputNumber, Segmented, Space, Switch, Typography } from 'antd';
import { type NativeAdConfig } from '../../../../shared/native-ad-meta';
import {
  AD_TYPES,
  CONTINUE_BTN_POSITIONS,
  CONTINUE_BTN_TYPES,
  PROGRESS_BAR_POSITIONS,
  SAVE_BTN_MODES,
  SMALL_BTN_MODES,
  type ScreenConfig,
  type ScreenKind,
} from '../../../../shared/screen-native-meta';
import { NativeAdEditor } from '../native-ad/native-ad-editor';

const { Text } = Typography;
const seg = (opts: readonly string[]) => opts.map(o => ({ label: o, value: o }));

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
      <Text style={{ width: 170, flexShrink: 0 }}>{label}</Text>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
}

// Editor for one screen's native config. Onboard screens gate the ad with
// showAd + adType; the language screen gates with adType only. onChange spreads
// `value` so unmodeled/passthrough fields survive.
export function ScreenNativeEditor({
  kind,
  value,
  onChange,
}: {
  kind: ScreenKind;
  value: ScreenConfig;
  onChange: (next: ScreenConfig) => void;
}) {
  const set = (patch: Partial<ScreenConfig>) => onChange({ ...value, ...patch });
  const adType = value.adType ?? (kind === 'language' ? 'banner' : 'native');

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Card title="Quảng cáo" size="small">
        <Row label="Loại ad (adType)">
          <Segmented value={adType} options={seg(AD_TYPES)} onChange={v => set({ adType: v as ScreenConfig['adType'] })} />
        </Row>
        {kind === 'onboard' && (
          <Row label="Hiện ad (showAd)">
            <Switch checked={!!value.showAd} onChange={showAd => set({ showAd })} />
          </Row>
        )}
        <Text type="secondary" style={{ fontSize: 12 }}>
          Native chỉ hiện khi adType = native{kind === 'onboard' ? ' và showAd bật' : ''}.
        </Text>
      </Card>

      {adType === 'native' && (
        <Card title="Native ad style" size="small">
          <NativeAdEditor
            value={value.nativeAdConfig ?? {}}
            hideShowAds
            onChange={(nativeAdConfig: NativeAdConfig) => set({ nativeAdConfig })}
          />
          {kind === 'onboard' && (
            <Row label="nativeAdGroup">
              <Input
                value={value.nativeAdGroup}
                placeholder="onboard_intro"
                onChange={e => set({ nativeAdGroup: e.target.value || undefined })}
              />
            </Row>
          )}
        </Card>
      )}

      <Card title="Layout màn" size="small">
        {kind === 'onboard' ? (
          <>
            <Row label="Nút tiếp tục">
              <Segmented value={value.continueBtnType ?? 'large'} options={seg(CONTINUE_BTN_TYPES)} onChange={v => set({ continueBtnType: v as ScreenConfig['continueBtnType'] })} />
            </Row>
            <Row label="Vị trí nút">
              <Segmented value={value.continueBtnPosition ?? 'bottom'} options={seg(CONTINUE_BTN_POSITIONS)} onChange={v => set({ continueBtnPosition: v as ScreenConfig['continueBtnPosition'] })} />
            </Row>
            <Row label="Progress bar">
              <Segmented value={value.progressBarPosition ?? 'top'} options={seg(PROGRESS_BAR_POSITIONS)} onChange={v => set({ progressBarPosition: v as ScreenConfig['progressBarPosition'] })} />
            </Row>
            <Row label="smallBtnMode">
              <Segmented value={value.smallBtnMode ?? 'fill'} options={seg(SMALL_BTN_MODES)} onChange={v => set({ smallBtnMode: v as ScreenConfig['smallBtnMode'] })} />
            </Row>
            <Row label="progressStep">
              <Switch checked={!!value.progressStep} onChange={progressStep => set({ progressStep })} />
            </Row>
          </>
        ) : (
          <>
            <Row label="saveBtnMode">
              <Segmented value={value.saveBtnMode ?? 'fill'} options={seg(SAVE_BTN_MODES)} onChange={v => set({ saveBtnMode: v as ScreenConfig['saveBtnMode'] })} />
            </Row>
            <Row label="countdownTimer (s)">
              <InputNumber min={0} value={value.countdownTimer} onChange={v => set({ countdownTimer: v == null ? undefined : Number(v) })} />
            </Row>
          </>
        )}
        <Row label="continueWhenClickAd">
          <Switch checked={!!value.continueWhenClickAd} onChange={continueWhenClickAd => set({ continueWhenClickAd })} />
        </Row>
      </Card>
    </Space>
  );
}
