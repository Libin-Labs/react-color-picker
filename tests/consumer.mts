import { createElement } from 'react';
import {
  ColorPicker,
  hexToRgb,
  rgbToHsl,
  type ColorPickerProps,
  type HSLA,
  type RGBA,
} from '@lp-labs/react-color-picker';

const value: RGBA = hexToRgb('#f008');
const hsl: HSLA = rgbToHsl(value);
const props: ColorPickerProps = {
  value,
  onChange(next) {
    const alpha: number = next.a;
    void alpha;
  },
};
createElement(ColorPicker, props);
// @ts-expect-error Alpha is required.
const bad: RGBA = { r: 0, g: 0, b: 0 };
void bad;
void hsl;
