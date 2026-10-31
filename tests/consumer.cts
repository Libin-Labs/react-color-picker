import { createElement } from 'react';
import { ColorPicker, hexToRgb, type ColorPickerProps } from '@lp-labs/react-color-picker';

const props: ColorPickerProps = {
  value: hexToRgb('#000'),
  onChange(next) {
    const r: number = next.r;
    void r;
  },
};
createElement(ColorPicker, props);
