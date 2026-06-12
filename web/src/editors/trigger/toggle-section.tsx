import { Card, Space, Switch, Typography } from 'antd';
import type { Trigger } from '../../../../shared/trigger-meta';
import { StringListInput } from '../../components/string-list-input';

const { Text } = Typography;

type Props = {
  enableAd?: string[];
  disableAd?: Trigger['disableAd'];
  superwallPreload?: string[];
  onChange: (patch: Partial<Trigger>) => void;
};

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <Text>{label}</Text>
      {hint && (
        <Text type="secondary" style={{ fontSize: 11, marginLeft: 8 }}>{hint}</Text>
      )}
      <div style={{ marginTop: 4 }}>{children}</div>
    </div>
  );
}

export function ToggleSection({ enableAd, disableAd, superwallPreload, onChange }: Props) {
  return (
    <Card title="Bật / tắt ad group & preload">
      <Field label="Enable ad groups" hint="tên group cần bật">
        <StringListInput
          value={enableAd}
          placeholder="vd: onboard_1"
          onChange={v => onChange({ enableAd: v as string[] | undefined })}
        />
      </Field>

      <Field label="Disable ad groups" hint="tên group cần tắt">
        <StringListInput
          value={disableAd?.ads}
          placeholder="vd: onboard_1"
          onChange={v =>
            onChange({
              disableAd: v ? { ...disableAd, ads: v as string[] } : undefined,
            })
          }
        />
        {disableAd?.ads?.length ? (
          <Space style={{ marginTop: 8 }}>
            <Switch
              checked={!!disableAd.permanentlyStop}
              onChange={permanentlyStop => onChange({ disableAd: { ...disableAd, permanentlyStop } })}
            />
            <Text type="secondary">Permanently stop (đến khi restart app)</Text>
          </Space>
        ) : null}
      </Field>

      <Field label="Superwall preload" hint="placement nạp trước">
        <StringListInput
          value={superwallPreload}
          placeholder="vd: home_screen"
          onChange={v => onChange({ superwallPreload: v as string[] | undefined })}
        />
      </Field>
    </Card>
  );
}
