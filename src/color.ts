export interface RGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface HSLA {
  h: number;
  s: number;
  l: number;
  a: number;
}

function channel(value: number, min: number, max: number, name: string): void {
  if (!Number.isFinite(value) || value < min || value > max) {
    throw new RangeError(`${name} must be a finite number from ${min} to ${max}.`);
  }
}

export function validateRGBA(value: RGBA): void {
  if (!value || typeof value !== 'object') throw new TypeError('Expected RGBA.');
  channel(value.r, 0, 255, 'Red');
  channel(value.g, 0, 255, 'Green');
  channel(value.b, 0, 255, 'Blue');
  channel(value.a, 0, 1, 'Alpha');
}

export function validateHSLA(value: HSLA): void {
  if (!value || typeof value !== 'object') throw new TypeError('Expected HSLA.');
  channel(value.h, 0, 360, 'Hue');
  channel(value.s, 0, 100, 'Saturation');
  channel(value.l, 0, 100, 'Lightness');
  channel(value.a, 0, 1, 'Alpha');
}

export function hexToRgb(hex: string): RGBA {
  if (typeof hex !== 'string' || !/^#(?:[\da-f]{3}|[\da-f]{4}|[\da-f]{6}|[\da-f]{8})$/i.test(hex)) {
    throw new TypeError('Expected #RGB, #RGBA, #RRGGBB or #RRGGBBAA.');
  }
  let text = hex.slice(1);
  if (text.length < 5) text = [...text].map((c) => c + c).join('');
  return {
    r: parseInt(text.slice(0, 2), 16),
    g: parseInt(text.slice(2, 4), 16),
    b: parseInt(text.slice(4, 6), 16),
    a: text.length === 8 ? parseInt(text.slice(6, 8), 16) / 255 : 1,
  };
}

export function rgbToHex(value: RGBA, includeAlpha = true): string {
  validateRGBA(value);
  const byte = (n: number) => Math.round(n).toString(16).padStart(2, '0');
  return `#${byte(value.r)}${byte(value.g)}${byte(value.b)}${includeAlpha ? byte(value.a * 255) : ''}`;
}

export function rgbToHsl(value: RGBA): HSLA {
  validateRGBA(value);
  const r = value.r / 255;
  const g = value.g / 255;
  const b = value.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  const l = (max + min) / 2;
  let h = 0;
  if (delta) {
    if (max === r) h = ((g - b) / delta) % 6;
    else if (max === g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;
  }
  return {
    h: (h * 60 + 360) % 360,
    s: delta === 0 ? 0 : Math.min(100, Math.max(0, (delta / (1 - Math.abs(2 * l - 1))) * 100)),
    l: Math.min(100, Math.max(0, l * 100)),
    a: value.a,
  };
}

export function hslToRgb(value: HSLA): RGBA {
  validateHSLA(value);
  const h = (value.h % 360) / 60;
  const s = value.s / 100;
  const l = value.l / 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] =
    h < 1
      ? [c, x, 0]
      : h < 2
        ? [x, c, 0]
        : h < 3
          ? [0, c, x]
          : h < 4
            ? [0, x, c]
            : h < 5
              ? [x, 0, c]
              : [c, 0, x];
  const byte = (value: number) => Math.min(255, Math.max(0, value * 255));
  return { r: byte(r + m), g: byte(g + m), b: byte(b + m), a: value.a };
}

const number = '(\\d+(?:\\.\\d+)?|\\.\\d+)';
const rgbPattern = new RegExp(
  `^rgba?\\(\\s*${number}\\s*,\\s*${number}\\s*,\\s*${number}(?:\\s*,\\s*${number})?\\s*\\)$`,
  'i',
);
const hslPattern = new RegExp(
  `^hsla?\\(\\s*${number}\\s*,\\s*${number}%\\s*,\\s*${number}%(?:\\s*,\\s*${number})?\\s*\\)$`,
  'i',
);

export function parseColor(text: string): RGBA {
  if (typeof text !== 'string') throw new TypeError('Expected a color string.');
  const input = text.trim();
  if (input.startsWith('#')) return hexToRgb(input);
  const rgb = rgbPattern.exec(input);
  if (rgb) {
    const value = { r: +rgb[1], g: +rgb[2], b: +rgb[3], a: rgb[4] === undefined ? 1 : +rgb[4] };
    validateRGBA(value);
    return value;
  }
  const hsl = hslPattern.exec(input);
  if (hsl) {
    return hslToRgb({ h: +hsl[1], s: +hsl[2], l: +hsl[3], a: hsl[4] === undefined ? 1 : +hsl[4] });
  }
  throw new TypeError('Use HEX, comma-separated rgb(a), or hsl(a).');
}

export function colorToCss(value: RGBA): string {
  validateRGBA(value);
  return `rgba(${Math.round(value.r)}, ${Math.round(value.g)}, ${Math.round(value.b)}, ${Number(value.a.toFixed(4))})`;
}
