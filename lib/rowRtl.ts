import { I18nManager, Platform } from "react-native";

/**
 * RTL: root layout uses `I18nManager.forceRTL(true)` — avoid `direction: "rtl"` on
 * screens/containers (double flip). Plain `flex-row` already places first child on the right.
 * Tab bar order still uses `tabBarLayoutStyle()` with explicit `direction: "rtl"`.
 */

/** Tailwind class for horizontal RTL row */
export function rowRtl(): string {
  return "flex-row";
}

/** Inline style row direction */
export function rtlRowStyle(): "row" | "row-reverse" {
  return "row";
}

/** Horizontal ScrollView content direction */
export function horizontalRowDirection(): "row" | "row-reverse" {
  return "row";
}

/** Tab bar layout — always forces direction: rtl */
export function tabBarLayoutStyle(): {
  flexDirection: "row";
  direction: "rtl";
} {
  return { flexDirection: "row", direction: "rtl" };
}

/**
 * ScrollView horizontal mirroring via scaleX(-1).
 * Kept as-is: uses I18nManager.isRTL because scaleX is a separate
 * visual trick unrelated to the `direction` style prop.
 */
export function rtlMirrorHorizontalScroll(): boolean {
  if (Platform.OS === "web") return true;
  return !I18nManager.isRTL;
}
