import { useEffect, useId, useState, type CSSProperties } from 'react';
import {
  colorToCss,
  hexToRgb,
  hslToRgb,
  parseColor,
  rgbToHex,
  rgbToHsl,
  validateRGBA,
  type RGBA,
} from './color.js';

export interface ColorPickerProps {
  value?: RGBA;
  defaultValue?: RGBA;
  onChange?: (color: RGBA) => void;
  palette?: readonly string[];
  disabled?: boolean;
  label?: string;
  className?: string;
  style?: CSSProperties;
}

const initial: RGBA = { r: 99, g: 102, b: 241, a: 1 };
const defaultPalette = ['#ef4444', '#22c55e', '#3b82f6', '#ffffff', '#000000'];

export function ColorPicker({
  value,
  defaultValue = initial,
  onChange,
  palette = defaultPalette,
  disabled = false,
  label = 'Color picker',
  className = '',
  style,
}: ColorPickerProps) {
  const [internal, setInternal] = useState(() => ({ ...defaultValue }));
  const color = value ?? internal;
  validateRGBA(color);
  const canonical = rgbToHex(color);
  const [text, setText] = useState(canonical);
  const [error, setError] = useState('');
  const id = useId();
  const hsl = rgbToHsl(color);
  const swatches = palette.map((entry) => ({ entry, color: parseColor(entry) }));
  useEffect(() => {
    setText(canonical);
    setError('');
  }, [canonical]);

  function change(next: RGBA) {
    if (disabled) return;
    validateRGBA(next);
    if (value === undefined) setInternal({ ...next });
    onChange?.({ ...next });
  }

  function commit() {
    try {
      const next = parseColor(text);
      setError('');
      setText(rgbToHex(next));
      change(next);
    } catch (reason) {
      setError((reason as Error).message);
    }
  }

  return (
    <fieldset className={`lp-color-picker ${className}`} style={style} disabled={disabled}>
      <legend>{label}</legend>
      <div
        className="lp-color-picker__preview"
        style={{ background: colorToCss(color) }}
        role="img"
        aria-label={`Current color ${canonical}`}
      />
      <label>
        Color (HEX, RGB or HSL)
        <input
          value={text}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? id : undefined}
          onChange={(event) => setText(event.target.value)}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              commit();
            }
            if (event.key === 'Escape') {
              setText(canonical);
              setError('');
            }
          }}
        />
      </label>
      {error && (
        <p id={id} role="alert">
          {error}
        </p>
      )}
      <label>
        Visual color
        <input
          type="color"
          value={rgbToHex(color, false)}
          onChange={(event) => change({ ...hexToRgb(event.target.value), a: color.a })}
        />
      </label>
      <div className="lp-color-picker__channels">
        {(['r', 'g', 'b'] as const).map((key, index) => (
          <label key={key}>
            {['Red', 'Green', 'Blue'][index]}
            <input
              type="number"
              min={0}
              max={255}
              step={1}
              value={Number(color[key].toFixed(2))}
              onChange={(event) => {
                const n = event.target.valueAsNumber;
                if (Number.isFinite(n) && n >= 0 && n <= 255) change({ ...color, [key]: n });
              }}
            />
          </label>
        ))}
      </div>
      <div className="lp-color-picker__channels">
        {(['h', 's', 'l'] as const).map((key, index) => (
          <label key={key}>
            {['Hue', 'Saturation', 'Lightness'][index]}
            <input
              type="number"
              min={0}
              max={key === 'h' ? 360 : 100}
              step={0.1}
              value={Number(hsl[key].toFixed(2))}
              onChange={(event) => {
                const n = event.target.valueAsNumber;
                if (Number.isFinite(n) && n >= 0 && n <= (key === 'h' ? 360 : 100)) {
                  change(hslToRgb({ ...hsl, [key]: n }));
                }
              }}
            />
          </label>
        ))}
      </div>
      <label>
        Alpha
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={color.a}
          onChange={(event) => change({ ...color, a: event.target.valueAsNumber })}
        />
        <output>{Number(color.a.toFixed(2))}</output>
      </label>
      <div role="group" aria-label="Palette" className="lp-color-picker__palette">
        {swatches.map((swatch, index) => (
          <button
            key={`${swatch.entry}-${index}`}
            type="button"
            aria-label={`Use ${swatch.entry}`}
            aria-pressed={rgbToHex(swatch.color) === canonical}
            style={{ background: colorToCss(swatch.color) }}
            onClick={() => change(swatch.color)}
          />
        ))}
      </div>
      <output aria-label="CSS color">{colorToCss(color)}</output>
    </fieldset>
  );
}
