import type { CSSProperties, ReactNode } from "react";

// A column that scrolls on its own. It sticks just under the app header and scrolls
// its content internally, so scrolling one column (e.g. the edit form) never moves the
// others (the left tab list, the right JSON, or a preview). Used to give each page a
// 3-zone independent-scroll layout.
export function ScrollPane({
  children,
  top = 76,
  style,
}: {
  children: ReactNode;
  top?: number;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        position: "sticky",
        top,
        maxHeight: `calc(100dvh - ${top + 20}px)`,
        overflowY: "auto",
        overflowX: "hidden",
        paddingRight: 4,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
