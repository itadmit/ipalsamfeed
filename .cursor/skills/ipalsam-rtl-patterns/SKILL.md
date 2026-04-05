---
name: ipalsam-rtl-patterns
description: RTL (Right-to-Left) patterns for iPalsam React Native app with I18nManager. Use when editing text alignment, adding new screens, creating components with Hebrew text, or fixing RTL layout issues.
---

# iPalsam RTL Patterns

## Critical Rule: textAlign is FLIPPED

`I18nManager.forceRTL(true)` is enabled globally (`app/_layout.tsx`).
This **flips** `textAlign` values at the native level:

| You write          | Physical result |
|--------------------|-----------------|
| `textAlign: "left"`  | RIGHT (what you want for Hebrew) |
| `textAlign: "right"` | LEFT (wrong!) |
| `textAlign: "center"` | center (no flip) |
| no textAlign (auto)  | LEFT (auto-detected then flipped) |

## How to Right-Align Hebrew Text

Use the `rtlText` helper from `lib/hebrewInputStyle.ts`:

```tsx
import { rtlText } from "../../lib/hebrewInputStyle";

// Display text
<Text style={rtlText}>שלום עולם</Text>

// With other inline styles
<Text style={{ fontSize: 18, color: "#333", ...rtlText }}>שלום</Text>

// With NativeWind className
<Text className="text-sm text-slate-700" style={rtlText}>שלום</Text>
```

For TextInput elements, use `hebrewTextInput` AND add `text-left` class:

```tsx
import { hebrewTextInput } from "../../lib/hebrewInputStyle";

<TextInput
  className="bg-slate-50 rounded-xl px-4 py-3 text-sm text-left"
  style={hebrewTextInput}
  placeholder="טקסט..."
/>
```

## Row Direction (flexDirection)

`I18nManager.isRTL=true` already flips `flexDirection: "row"` to RTL.
Use `rowRtl()` helper or plain `flex-row` — first child renders on the RIGHT.

```tsx
import { rowRtl } from "../../lib/rowRtl";

<View className={`${rowRtl()} items-center gap-3`}>
  <Avatar />   {/* appears on RIGHT */}
  <Text>Name</Text>  {/* appears LEFT of avatar */}
</View>
```

## Do NOT Use

- `textAlign: "right"` — renders as physical LEFT
- `text-right` NativeWind class — same problem
- `writingDirection: "rtl"` on Text — unnecessary, can cause issues
- `direction: "rtl"` on Views — causes double-reversal with I18nManager

## Tab Bar

The tab bar uses a special `tabBarLayoutStyle()` from `lib/rowRtl.ts` with explicit `direction: "rtl"`. This is the one place where `direction: "rtl"` is correct because React Navigation handles it differently.

## OTA Updates

Use `eas update --branch production` to push JS-only changes. Version label is in `app/(tabs)/settings.tsx` at the bottom. Bump it on each OTA for easy verification.

## Tech Stack

- React Native + Expo SDK (New Architecture / Fabric enabled)
- NativeWind v4 (Tailwind CSS for RN)
- Expo Router (file-system routing)
- @tanstack/react-query for data fetching
- Hebrew-first UI, all user-facing text in Hebrew
- Response language: always Hebrew
