import type { StyleProp, TextStyle } from "react-native";

/**
 * I18nManager.isRTL=true flips textAlign on Text components:
 *   "right" → physical LEFT,  "left" → physical RIGHT
 * So we use "left" to achieve physical right alignment for Text.
 */
export const rtlText: TextStyle = { textAlign: "left" };

/**
 * TextInput does NOT flip textAlign like Text does.
 * So we use "right" directly for physical right alignment.
 */
export const hebrewTextInput: StyleProp<TextStyle> = {
  writingDirection: "rtl",
  textAlign: "right",
};
