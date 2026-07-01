import {
  Card,
  ColorPicker,
  InputNumber,
  Segmented,
  Space,
  Switch,
  Tooltip,
  Typography,
} from "antd";
import type { AggregationColor } from "antd/es/color-picker/color";
import {
  FIELD_GROUP_LABELS,
  FIELD_GROUP_ORDER,
  MEDIA_SCALE_OPTIONS,
  STYLE_FIELDS,
  aarrggbbToCss,
  cssToAarrggbb,
  inheritedFieldValue,
  type NativeAdStyleRaw,
  type StyleField,
} from "../../../../shared/native-style-meta";
import type { NativeStyleDrafts } from "../../hooks/use-native-style-drafts";

type FieldKey = keyof NativeAdStyleRaw;

// Sensible starting value when a field is toggled ON but has no inherited value
// (e.g. cta_background_color has no project default).
const fallbackFor = (f: StyleField): string | number | boolean => {
  switch (f.control) {
    case "color":
      return f.key === "cta_background_color" ? "#FF30CB83" : "#FF808080";
    case "number":
      return f.min ?? 0;
    case "bool":
      return false;
    case "enum":
      return "center_crop";
  }
};

const aggToAarrggbb = (c: AggregationColor): string => {
  const { r, g, b, a } = c.toRgb();
  const hex = (n: number) => Math.round(n).toString(16).padStart(2, "0");
  return cssToAarrggbb(`#${hex(r)}${hex(g)}${hex(b)}${hex((a ?? 1) * 255)}`);
};

export function NativeStyleEditor({ d }: { d: NativeStyleDrafts }) {
  const { scope, config } = d;

  const renderRow = (f: StyleField) => {
    const overridden = d.isOverridden(f.key);
    const inherited = inheritedFieldValue(scope, f.key, config);
    // Value shown in the control: the override when set, else the inherited value.
    const effective = overridden ? d.overrideValue(f.key) : inherited;

    const onToggle = (on: boolean) => {
      if (on) d.setField(f.key, (inherited ?? fallbackFor(f)) as never);
      else d.clearField(f.key);
    };

    let control: React.ReactNode = null;
    if (f.control === "color") {
      const css = typeof effective === "string" ? aarrggbbToCss(effective) : undefined;
      control = (
        <ColorPicker
          value={css}
          disabled={!overridden}
          showText={(c) => (
            <Typography.Text style={{ fontFamily: "monospace", fontSize: 11 }}>
              {typeof effective === "string" ? effective : "—"}
            </Typography.Text>
          )}
          onChangeComplete={(c) => d.setField(f.key, aggToAarrggbb(c))}
        />
      );
    } else if (f.control === "number") {
      control = (
        <InputNumber
          size="small"
          style={{ width: 130 }}
          min={f.min}
          max={f.max}
          value={typeof effective === "number" ? effective : undefined}
          disabled={!overridden}
          addonAfter={f.unit}
          onChange={(v) => v != null && d.setField(f.key, v)}
        />
      );
    } else if (f.control === "bool") {
      control = (
        <Switch
          size="small"
          checked={!!effective}
          disabled={!overridden}
          onChange={(v) => d.setField(f.key, v)}
        />
      );
    } else {
      control = (
        <Segmented
          size="small"
          value={typeof effective === "string" ? effective : "center_crop"}
          disabled={!overridden}
          options={MEDIA_SCALE_OPTIONS.map((o) => ({ ...o }))}
          onChange={(v) => d.setField(f.key, v as string)}
        />
      );
    }

    return (
      <div
        key={f.key}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "5px 0",
        }}
      >
        <Tooltip title={overridden ? "Đang ghi đè — tắt để kế thừa" : "Kế thừa — bật để ghi đè"}>
          <Switch size="small" checked={overridden} onChange={onToggle} />
        </Tooltip>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Typography.Text style={{ fontSize: 13 }}>{f.label}</Typography.Text>
          <div style={{ fontSize: 10, color: "#64748b", fontFamily: "monospace" }}>
            {f.key}
          </div>
        </div>
        <div style={{ opacity: overridden ? 1 : 0.5 }}>{control}</div>
      </div>
    );
  };

  return (
    <Space direction="vertical" size={12} style={{ width: "100%" }}>
      {FIELD_GROUP_ORDER.map((group) => {
        const fields = STYLE_FIELDS.filter((f) => f.group === group);
        return (
          <Card key={group} size="small" title={FIELD_GROUP_LABELS[group]} styles={{ body: { padding: "4px 12px" } }}>
            {fields.map(renderRow)}
          </Card>
        );
      })}
    </Space>
  );
}
