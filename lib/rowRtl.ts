import { I18nManager, Platform } from "react-native";

/**
 * RTL approach: every component/screen root sets `style={{ direction: "rtl" }}`.
 * This guarantees RTL layout regardless of I18nManager.isRTL native state
 * (which only takes effect after a full app restart).
 * With `direction: "rtl"`, plain `flex-row` renders first child on the RIGHT.
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
