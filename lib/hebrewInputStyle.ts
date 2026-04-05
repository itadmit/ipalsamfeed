import type { StyleProp, TextStyle } from "react-native";

/**
 * I18nManager.isRTL=true flips textAlign values:
 *   "right" → physical LEFT,  "left" → physical RIGHT
 * So we use "left" to achieve physical right alignment.
 */
export const rtlText: TextStyle = { textAlign: "left" };

/** Hebrew TextInput: writingDirection for cursor + flipped textAlign */
export const hebrewTextInput: StyleProp<TextStyle> = {
  writingDirection: "rtl",
  textAlign: "left",
};
