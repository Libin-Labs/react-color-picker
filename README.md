# @lp-labs/react-color-picker

Package version: `0.1.0`.

An interactive React color picker with HEX, RGB, HSL, alpha, a native visual
color input and selectable palettes. Pure conversion helpers work without a
DOM. React 18.2 or 19 is the only peer; no runtime dependency is bundled.
ESM, CommonJS and TypeScript declarations are included.

## Install and use

```sh
npm install @lp-labs/react-color-picker react
```

```tsx
import { useState } from "react";
import { ColorPicker, hexToRgb, type RGBA } from "@lp-labs/react-color-picker";
import "@lp-labs/react-color-picker/style.css";

export function ForegroundPicker() {
  const [color, setColor] = useState<RGBA>(() => hexToRgb("#2563ebcc"));
  return (
    <ColorPicker
      value={color}
      onChange={setColor}
      palette={["#2563eb", "#ec4899", "#ffffff00", "hsl(120, 80%, 40%)"]}
    />
  );
}
```

For uncontrolled use, render `<ColorPicker />` or pass `defaultValue`.
Its default is `{ r: 99, g: 102, b: 241, a: 1 }` (`#6366f1ff`).
`defaultValue` is read on mount only. Do not switch controlled/uncontrolled
mode within a mount. In controlled mode callbacks propose a value; the preview
and numeric controls change only after the parent supplies it. Text drafts are
local and may temporarily differ from that value.

## Component API

`ColorPicker(props: ColorPickerProps)` is a named export.

| Prop | Type | Default / behavior |
| --- | --- | --- |
| `value` | `RGBA` | Omit for internal state |
| `defaultValue` | `RGBA` | Default above, used once |
| `onChange` | `(color: RGBA) => void` | Independent copy on valid edit requests; not called on mount |
| `palette` | `readonly string[]` | `["#ef4444", "#22c55e", "#3b82f6", "#ffffff", "#000000"]`; `[]` hides swatches |
| `disabled` | `boolean` | `false`; disables editing |
| `label` | `string` | `"Color picker"` |
| `className` | `string` | `""`; appended to root |
| `style` | `React.CSSProperties` | Optional root styles |

```ts
interface RGBA {
  r: number; // 0..255, fractional values allowed
  g: number; // 0..255
  b: number; // 0..255
  a: number; // 0..1
}
interface HSLA {
  h: number; // 0..360 degrees
  s: number; // 0..100 percent
  l: number; // 0..100 percent
  a: number; // 0..1
}
```

Every channel must be finite. Values are validated, **not silently clamped**;
conversion results are bounded against floating-point rounding error.
HSL conversion preserves fractional RGB precision. Hue 360 is equivalent to 0.
For achromatic colors, `rgbToHsl` returns hue 0 and saturation 0.

The text field accepts HEX, comma-separated RGB(A) and HSL(A) and commits on
blur or Enter. Escape restores the current canonical HEX value. Invalid drafts
show an associated error and do not emit. RGB and HSL number inputs apply valid
in-range edits immediately; invalid/empty numeric edits are ignored. RGB UI
steps are 1 and HSL steps are 0.1; shown numbers are rounded to two decimals,
without rounding the stored model. Alpha uses a 0.01-step range input.
The native visual input edits RGB while retaining alpha. Selecting a palette
entry replaces all four channels, including that entry's alpha.

## Pure helpers and types

All exports are named. Helpers do not mutate inputs.

| Export | Signature / behavior |
| --- | --- |
| `validateRGBA` | `(value: RGBA) => void`; validates all four channels |
| `validateHSLA` | `(value: HSLA) => void`; validates all four channels |
| `hexToRgb` | `(hex: string) => RGBA`; strict HEX with leading `#` |
| `rgbToHex` | `(value: RGBA, includeAlpha?: boolean) => string`; lowercase HEX; `includeAlpha` defaults to `true` |
| `rgbToHsl` | `(value: RGBA) => HSLA` |
| `hslToRgb` | `(value: HSLA) => RGBA` |
| `parseColor` | `(text: string) => RGBA`; trims outer whitespace |
| `colorToCss` | `(value: RGBA) => string`; `rgba(r, g, b, a)` |

`RGBA`, `HSLA` and `ColorPickerProps` are exported types.
HEX forms are `#RGB`, `#RGBA`, `#RRGGBB`, `#RRGGBBAA`, case-insensitive.
`hexToRgb` itself does not trim whitespace; `parseColor` does.
RGB(A) channels use absolute numeric values, not percentages. HSL(A) uses
degrees without a unit suffix and percentage saturation/lightness:

```ts
import {
  parseColor, rgbToHex, rgbToHsl, colorToCss,
} from "@lp-labs/react-color-picker";

const rgba = parseColor("hsla(210, 100%, 50%, 0.5)");
rgbToHex(rgba);        // "#0080ff80"
rgbToHex(rgba, false); // "#0080ff"
rgbToHsl(rgba);        // approximately { h: 210, s: 100, l: 50, a: 0.5 }
colorToCss(rgba);      // "rgba(0, 128, 255, 0.5)"
```

The parser accepts `rgb`/`rgba` or `hsl`/`hsla` names with three channels and an
optional fourth alpha, regardless of the `a` suffix. Unsigned plain decimals
(including `.5`) are supported; exponent notation is not. Formatting HEX rounds
RGB bytes and alpha to the nearest byte; CSS formatting rounds RGB bytes and
alpha to four decimals. Conversion to 8-bit HEX can lose alpha precision.
RGB/HSL conversions themselves do not intentionally round.

Helpers throw `TypeError` for malformed objects, invalid strings or unsupported
syntax, and `RangeError` for non-finite/out-of-range channels. Valid component
models and palettes are required; invalid props throw during render.
Validation helpers accept typed models; use `parseColor` to validate external
strings rather than casting unknown input to a model.

## Customization

Import the optional stylesheet once or provide your own. No unscoped document
rules are applied. Public CSS variables:

```css
.my-picker {
  --lp-color-accent: #0369a1;
  --lp-color-surface: #f0f9ff;
  --lp-color-text: #0c4a6e;
  max-width: 32rem;
}
```

Pass `className="my-picker"` or inline `style`. Structural classes use
`lp-color-picker` with `__preview`, `__channels` and `__palette` suffixes.

## Accessibility and limitations

Every input has a visible label. Native buttons, a fieldset legend, pressed
palette states, visible focus, native range keyboard controls, readable CSS
output and linked `aria-invalid`/alert messages provide keyboard alternatives.
The native color input's capabilities and dialog accessibility vary by browser.
No global keyboard or pointer listeners are installed.

This is an sRGB picker, not a color-management suite. It does not support named
colors, CSS variables, modern space/slash CSS syntax, RGB percentages, LAB,
OKLCH, wide gamut, gradients, eyedroppers, contrast audits, or a custom
saturation/value drag surface. HSL is derived from RGB, so a chosen hue is not
retained for black/white/gray until saturation and lightness permit it.
Palette equality uses rounded 8-bit HEX. Translucent previews depend on their
background. Accessibility and browser coverage have not been independently
certified.

Helpers and edits are synchronous; there is no persistence, subscription, worker,
or cancellation API. Import does not access browser globals. The native color
control requires a browser when mounted; root imports still resolve the React
peer even for helper-only use. Palette parsing/rendering visits every entry on
each render, so bound custom palettes rather than assuming virtualization.

## License

[MIT](./LICENSE).

## Support

If this library is useful to you, consider supporting its maintenance with a [donation via PayPal](https://www.paypal.me/LibinPrasanth).

## Author

Created by [Libin Prasanth](https://www.linkedin.com/in/libinprasanth/). Connect on LinkedIn for updates and discussion.
