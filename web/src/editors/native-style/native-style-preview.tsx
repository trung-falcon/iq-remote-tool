import {
  resolveStyle,
  type NativeAdStyleConfigRaw,
  type ResolvedPreviewStyle,
} from "../../../../shared/native-style-meta";

// HTML/CSS approximation of a native ad, driven entirely by the resolved style so
// changing a parameter updates the mock live. The 4 inline/collapsible layouts are
// ported from the RN sources (SmallNativeLayout1/2/3, ExpandedNativeAdView) and render
// as a card; the 6 fullscreen variants render inside a phone-proportioned frame with
// per-variant placement (full-bleed / dialog / bottom card / panel) so the preview
// keeps screen aspect instead of shrinking to content.

// Placeholder ad content.
const HEADLINE = "Ad headline text";
const BODY =
  "Sample ad body description — a short sentence that shows how many lines fit before it clamps.";
const CTA = "Install";

const clampLines = (lines: number): React.CSSProperties => ({
  display: "-webkit-box",
  WebkitBoxOrient: "vertical",
  WebkitLineClamp: lines,
  overflow: "hidden",
});

function Badge({ s }: { s: ResolvedPreviewStyle }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 5px",
        height: s.badgeTextSize + 6,
        background: s.badgeBg,
        color: s.badgeTextColor,
        fontSize: s.badgeTextSize,
        fontWeight: 700,
        borderRadius: s.badgeCornerRadius,
        lineHeight: 1,
      }}
    >
      Ad
    </span>
  );
}

function Icon({ s }: { s: ResolvedPreviewStyle }) {
  return (
    <div
      style={{
        width: s.iconSize,
        height: s.iconSize,
        flexShrink: 0,
        borderRadius: s.iconCornerRadius,
        background: "linear-gradient(135deg,#3b82f6,#22c55e)",
        display: "grid",
        placeItems: "center",
        color: "#fff",
        fontWeight: 800,
        fontSize: s.iconSize * 0.42,
      }}
    >
      A
    </div>
  );
}

function Media({
  s,
  width,
  height,
}: {
  s: ResolvedPreviewStyle;
  width: number | string;
  height: number;
}) {
  return (
    <div
      style={{
        width,
        height,
        flexShrink: 0,
        borderRadius: 8,
        background:
          "repeating-linear-gradient(135deg,#c7d2fe 0 12px,#a5b4fc 12px 24px)",
        display: "grid",
        placeItems: "center",
        color: "#3730a3",
        fontSize: 11,
        fontWeight: 700,
        overflow: "hidden",
      }}
      title={`media_scale: ${s.mediaScale}`}
    >
      MEDIA
    </div>
  );
}

function Title({ s }: { s: ResolvedPreviewStyle }) {
  return (
    <div
      style={{
        fontSize: s.titleSize,
        fontWeight: 700,
        color: s.titleColor,
        ...clampLines(s.titleMaxLines),
      }}
    >
      {HEADLINE}
    </div>
  );
}

function Body({ s }: { s: ResolvedPreviewStyle }) {
  return (
    <div
      style={{
        fontSize: s.bodySize,
        color: s.bodyColor,
        ...clampLines(s.bodyMaxLines),
      }}
    >
      {BODY}
    </div>
  );
}

function Cta({
  s,
  width,
}: {
  s: ResolvedPreviewStyle;
  width: number | string;
}) {
  return (
    <div
      style={{
        width,
        height: s.ctaHeight,
        borderRadius: s.ctaCornerRadius,
        background: `linear-gradient(180deg, ${s.ctaGradStart}, ${s.ctaGradEnd})`,
        color: s.ctaText,
        fontSize: s.ctaTextSize,
        fontWeight: 700,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 20px",
        whiteSpace: "nowrap",
        boxShadow: s.ctaHasShadow ? "0 3px 8px rgba(0,0,0,0.28)" : undefined,
      }}
    >
      {CTA}
    </div>
  );
}

const container = (s: ResolvedPreviewStyle): React.CSSProperties => ({
  position: "relative",
  width: "100%",
  background: s.containerBg,
  border: s.containerBorderWidth
    ? `${s.containerBorderWidth}px solid ${s.containerBorderColor}`
    : undefined,
  borderRadius: s.containerCornerRadius,
  boxShadow: s.containerHasShadow ? "0 4px 14px rgba(0,0,0,0.22)" : undefined,
  overflow: "hidden",
});

// ── Per-layout renderers ─────────────────────────────────────────────────────

// SmallNativeLayout1 — media square left, text right, CTA full-width bottom. The card
// height is fixed to mediaHeight (like the RN NativeAdView) so the CTA anchors to the
// bottom of the right column WITHIN the media height, instead of being pushed below it.
function LayoutSmall({ s }: { s: ResolvedPreviewStyle }) {
  return (
    <div style={container(s)}>
      <div
        style={{
          display: "flex",
          gap: s.hSpace,
          padding: s.padding,
          height: s.mediaHeight,
          boxSizing: "border-box",
          alignItems: "stretch",
        }}
      >
        <div style={{ alignSelf: "center" }}>
          <Media s={s} width={s.mediaSquareSize} height={s.mediaSquareSize} />
        </div>
        <div
          style={{
            flex: 1,
            minWidth: 0,
            height: "100%",
            display: "flex",
            flexDirection: "column",
            gap: s.vSpace,
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 4,
              flex: 1,
              minHeight: 0,
              minWidth: 0,
            }}
          >
            <Icon s={s} />
            <div
              style={{
                flex: 1,
                minWidth: 0,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              <Title s={s} />
              <Body s={s} />
            </div>
          </div>
          <Cta s={s} width="100%" />
        </div>
      </div>
      <div style={{ position: "absolute", top: 4, right: 4 }}>
        <Badge s={s} />
      </div>
    </div>
  );
}

// SmallNativeLayout2 — vertical: [media + (icon+title, badge, body)] then CTA full-width.
function LayoutSmallCtaBottom({ s }: { s: ResolvedPreviewStyle }) {
  return (
    <div style={container(s)}>
      <div
        style={{
          padding: s.padding,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", gap: s.hSpace, alignItems: "center" }}>
          <Media s={s} width={s.mediaSquareSize} height={s.mediaSquareSize} />
          <div
            style={{
              flex: 1,
              minWidth: 0,
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <Icon s={s} />
              <div
                style={{
                  flex: 1,
                  minWidth: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                }}
              >
                <Title s={s} />
                <div>
                  <Badge s={s} />
                </div>
              </div>
            </div>
            <Body s={s} />
          </div>
        </div>
        <Cta s={s} width="100%" />
      </div>
    </div>
  );
}

// SmallNativeLayout3 — compact banner: media + icon + (title+badge, body) + CTA right.
function LayoutInlineCtaRight({ s }: { s: ResolvedPreviewStyle }) {
  return (
    <div style={container(s)}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: s.hSpace,
          padding: `6px ${s.padding}px`,
        }}
      >
        <Media s={s} width={s.mediaSquareSize} height={s.mediaSquareSize} />
        <Icon s={s} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <Title s={s} />
            </div>
            <Badge s={s} />
          </div>
          <Body s={s} />
        </div>
        <Cta s={s} width={s.ctaSideWidth} />
      </div>
    </div>
  );
}

// Collapsible expanded — 16:9-ish media on top, then icon + text + CTA.
function LayoutCollapsible({ s }: { s: ResolvedPreviewStyle }) {
  return (
    <div style={container(s)}>
      <div style={{ position: "relative" }}>
        <Media s={s} width="100%" height={s.mediaHeight || 180} />
        <div style={{ position: "absolute", top: 6, right: 6 }}>
          <Badge s={s} />
        </div>
      </div>
      <div
        style={{
          display: "flex",
          gap: s.hSpace,
          alignItems: "center",
          padding: s.padding,
        }}
      >
        <Icon s={s} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <Title s={s} />
          <Body s={s} />
        </div>
        <Cta s={s} width={s.ctaSideWidth} />
      </div>
    </div>
  );
}

// ── Fullscreen — rendered inside a phone-proportioned frame ───────────────────
// Fullscreen ads occupy a whole screen, so the preview must keep phone aspect (≈9:19.5)
// and place the ad by variant, rather than shrinking a card to its content.
// Render the frame at a real phone's dp size (so 1 style unit = 1 dp, same as the
// device — an 18sp title looks small relative to a 360dp-wide screen), then scale the
// whole frame down to fit the preview panel. Without this the dp values are rendered
// 1:1 into a narrow box and text/padding look oversized vs. reality.
const V_W = 360; // phone width in dp
const V_H = Math.round((V_W * 19.5) / 9); // ≈780
const SCALE = 0.72; // fit ~259px wide into the panel

function PhoneFrame({
  bg,
  children,
}: {
  bg: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ width: V_W * SCALE, height: V_H * SCALE }}>
      <div
        style={{
          width: V_W,
          height: V_H,
          transform: `scale(${SCALE})`,
          transformOrigin: "top left",
          borderRadius: 40,
          border: "9px solid #111827",
          background: bg,
          position: "relative",
          overflow: "hidden",
          boxShadow: "0 10px 34px rgba(0,0,0,0.4)",
        }}
      >
        {children}
      </div>
    </div>
  );
}

// Media that fills its parent (for full-bleed / header media).
function MediaFill({
  s,
  height,
}: {
  s: ResolvedPreviewStyle;
  height?: number | string;
}) {
  return (
    <div
      style={{
        width: "100%",
        height: height ?? "100%",
        background:
          "repeating-linear-gradient(135deg,#c7d2fe 0 16px,#a5b4fc 16px 32px)",
        display: "grid",
        placeItems: "center",
        color: "#3730a3",
        fontWeight: 700,
        fontSize: 12,
      }}
      title={`media_scale: ${s.mediaScale}`}
    >
      MEDIA
    </div>
  );
}

// "Ad" badge pinned at an absolute corner of its (position:relative) parent.
function BadgeAt({
  s,
  side,
}: {
  s: ResolvedPreviewStyle;
  side: "left" | "right";
}) {
  return (
    <div style={{ position: "absolute", top: 14, [side]: 14, zIndex: 3 }}>
      <Badge s={s} />
    </div>
  );
}

const centered: React.CSSProperties = { textAlign: "center", width: "100%" };
const fullColumn: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  height: "100%",
};
// A weighted flex region (media / panel), matching the XML layout_weight split.
const weight = (n: number): React.CSSProperties => ({ flexGrow: n, flexBasis: 0, minHeight: 0 });

// Each branch mirrors its Android XML (activity_native_ad*.xml) structure + colors.
function Fullscreen({
  layoutKey,
  s,
}: {
  layoutKey: string;
  s: ResolvedPreviewStyle;
}) {
  // media_full — media fills the screen; bottom scrim shows a white body line + a white
  // pill-card (icon + dark headline + CTA). (activity_native_ad.xml)
  if (layoutKey === "media_full") {
    return (
      <PhoneFrame bg="#000000">
        <MediaFill s={s} height="100%" />
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            padding: `48px 16px 24px`,
            background: "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(26,26,26,0.92) 55%)",
          }}
        >
          <div style={{ marginBottom: 8 }}>
            <Badge s={s} />
          </div>
          <div style={{ color: s.bodyColor, fontSize: s.bodySize, fontWeight: 700, marginBottom: 16, ...clampLines(s.bodyMaxLines) }}>
            {BODY}
          </div>
          <div style={{ ...container(s), display: "flex", alignItems: "center", gap: 8, padding: "12px 16px" }}>
            <Icon s={s} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <Title s={s} />
            </div>
            <Cta s={s} width="auto" />
          </div>
        </div>
      </PhoneFrame>
    );
  }

  // dialog — dimmed backdrop, centered white card: icon → headline → divider → media →
  // body → CTA. (activity_native_ad_dialog.xml)
  if (layoutKey === "dialog") {
    return (
      <PhoneFrame bg="#1f2937">
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", display: "grid", placeItems: "center", padding: 20 }}>
          <div style={{ ...container(s), padding: s.padding, position: "relative", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <BadgeAt s={s} side="left" />
            <div style={{ marginBottom: 12 }}>
              <Icon s={s} />
            </div>
            <div style={centered}>
              <Title s={s} />
            </div>
            <div style={{ width: 80, height: 1, background: "#DCDCDC", margin: "12px 0" }} />
            <div style={{ width: "100%", marginBottom: 12 }}>
              <MediaFill s={s} height={s.mediaHeight || 140} />
            </div>
            <div style={{ ...centered, marginBottom: 16 }}>
              <Body s={s} />
            </div>
            <Cta s={s} width="100%" />
          </div>
        </div>
      </PhoneFrame>
    );
  }

  // bottom_card — dimmed backdrop, white top-rounded card pinned bottom: media → (icon +
  // headline/body) → CTA; badge top-left. (activity_native_ad_bottom_card.xml)
  if (layoutKey === "bottom_card") {
    return (
      <PhoneFrame bg="#1f2937">
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)" }} />
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0 }}>
          <div
            style={{
              ...container(s),
              borderRadius: `${s.containerCornerRadius}px ${s.containerCornerRadius}px 0 0`,
              padding: s.padding,
              position: "relative",
            }}
          >
            <BadgeAt s={s} side="left" />
            <div style={{ marginBottom: 12 }}>
              <MediaFill s={s} height={s.mediaHeight || 220} />
            </div>
            <div style={{ display: "flex", gap: s.hSpace, alignItems: "center", marginBottom: 16 }}>
              <Icon s={s} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <Title s={s} />
                <Body s={s} />
              </div>
            </div>
            <Cta s={s} width="100%" />
          </div>
        </div>
      </PhoneFrame>
    );
  }

  // media_large — media 60% top, WHITE panel 40% bottom, CTA pinned to the panel bottom
  // (spacer), badge top-right. Headline #1A1A1A (dark) on the white panel.
  // (activity_native_ad_media_large.xml)
  if (layoutKey === "media_large") {
    return (
      <PhoneFrame bg="#1A1A1A">
        <div style={fullColumn}>
          <div style={weight(60)}>
            <MediaFill s={s} height="100%" />
          </div>
          <div style={{ ...weight(40), background: s.containerBg, position: "relative", display: "flex", flexDirection: "column", padding: 24 }}>
            <BadgeAt s={s} side="right" />
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <Icon s={s} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <Title s={s} />
                <Body s={s} />
              </div>
            </div>
            <div style={{ flex: 1 }} />
            <Cta s={s} width="100%" />
          </div>
        </div>
      </PhoneFrame>
    );
  }

  // media_small — media 35% top, dark panel 65% bottom, centered icon/headline/body/CTA,
  // badge top-left. (activity_native_ad_media_small.xml)
  if (layoutKey === "media_small") {
    return (
      <PhoneFrame bg="#1A1A1A">
        <div style={fullColumn}>
          <div style={weight(35)}>
            <MediaFill s={s} height="100%" />
          </div>
          <div
            style={{
              ...weight(65),
              background: s.containerBg,
              position: "relative",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "24px 24px 0",
              borderRadius: `${s.containerCornerRadius}px ${s.containerCornerRadius}px 0 0`,
            }}
          >
            <BadgeAt s={s} side="left" />
            <div style={{ marginBottom: 16 }}>
              <Icon s={s} />
            </div>
            <div style={centered}>
              <Title s={s} />
            </div>
            <div style={{ ...centered, margin: "12px 0 24px" }}>
              <Body s={s} />
            </div>
            <Cta s={s} width="100%" />
          </div>
        </div>
      </PhoneFrame>
    );
  }

  // media_header — WHITE header on top (icon + headline + rating row + CTA), media below on
  // black. (activity_native_ad_media_header.xml)
  return (
    <PhoneFrame bg="#000000">
      <div style={fullColumn}>
        <div style={{ background: s.containerBg, padding: 16 }}>
          <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 16 }}>
            <Icon s={s} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <Title s={s} />
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                <Badge s={s} />
                <span style={{ color: s.bodyColor, fontSize: s.bodySize }}>★ 4.5</span>
                <span style={{ fontSize: 11, color: "#9aa0a6", fontWeight: 700 }}>▶ Google Play</span>
              </div>
            </div>
          </div>
          <Cta s={s} width="100%" />
        </div>
        <div style={{ flex: 1, minHeight: 0 }}>
          <MediaFill s={s} height="100%" />
        </div>
      </div>
    </PhoneFrame>
  );
}

const RENDERERS: Record<
  string,
  (p: { s: ResolvedPreviewStyle }) => React.ReactNode
> = {
  small: LayoutSmall,
  small_cta_bottom: LayoutSmallCtaBottom,
  in_line_cta_right: LayoutInlineCtaRight,
  collapsible: LayoutCollapsible,
};

export function NativeStylePreview({
  layoutKey,
  config,
}: {
  layoutKey: string;
  config: NativeAdStyleConfigRaw;
}) {
  const s = resolveStyle(layoutKey, config);
  const Renderer = RENDERERS[layoutKey];
  return (
    <div
      style={{
        background: "#e5e7eb",
        borderRadius: 16,
        padding: 16,
        display: "flex",
        justifyContent: "center",
      }}
    >
      {Renderer ? (
        <div style={{ width: 360, maxWidth: "100%" }}>
          <Renderer s={s} />
        </div>
      ) : (
        <Fullscreen layoutKey={layoutKey} s={s} />
      )}
    </div>
  );
}
