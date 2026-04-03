import { I18nManager, Platform } from "react-native";

/**
 * כשהאפליקציה בעברית, האלמנט הראשון ב-JSX צריך להופיע בימין.
 * בנייטיב לפעמים forceRTL לא מחזיר isRTL=true עד ריסטארט — אז משתמשים ב-flex-row-reverse.
 * ב-web האב מקבל direction: rtl ולכן flex-row מספיק.
 */
function needRowReverse(): boolean {
  if (Platform.OS === "web") return false;
  return !I18nManager.isRTL;
}

/** מחלקת Tailwind לשורה אופקית בעברית (אווטאר/כותרת ראשונה מימין) */
export function rowRtl(): string {
  return needRowReverse() ? "flex-row-reverse" : "flex-row";
}

/** Style-based row direction for inline style props (not NativeWind) */
export function rtlRowStyle(): "row" | "row-reverse" {
  return needRowReverse() ? "row-reverse" : "row";
}

/** ל-ScrollView אופקי: הפריט הראשון במערך מימין */
export function horizontalRowDirection(): "row" | "row-reverse" {
  return needRowReverse() ? "row-reverse" : "row";
}

/**
 * בר הטאבים: בנייטיב עם `forceRTL` כבר יש RTL — `direction: 'rtl'` נוסף על הבר
 * עלול לייצר סדר "הפוך". ב-web צריך `direction` מפורש כי ה-theme של Navigation לעיתים LTR.
 */
export function tabBarLayoutStyle(): {
  flexDirection: "row";
  direction?: "rtl";
} {
  if (Platform.OS === "web") {
    return { flexDirection: "row", direction: "rtl" };
  }
  return { flexDirection: "row" };
}

/**
 * ScrollView אופקי: row-reverse לא הופך את כיוון הגלילה.
 * scaleX(-1) על המעטפת ועל כרטיסייה מחזיר תוכן רגיל ומרגיש כמו RTL.
 */
export function rtlMirrorHorizontalScroll(): boolean {
  if (Platform.OS === "web") return true;
  return !I18nManager.isRTL;
}
