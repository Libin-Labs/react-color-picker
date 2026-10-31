import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { afterEach, test } from 'node:test';
import { JSDOM } from 'jsdom';
import { act, createElement } from 'react';
import * as api from '../dist/esm/index.js';

const dom = new JSDOM('<!doctype html><html><body></body></html>');
Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  HTMLElement: dom.window.HTMLElement,
  IS_REACT_ACT_ENVIRONMENT: true,
});
Object.defineProperty(globalThis, 'navigator', { value: dom.window.navigator, configurable: true });
const { createRoot } = await import('react-dom/client');
const roots = [];
afterEach(() => {
  for (const root of roots.splice(0)) act(() => root.unmount());
  document.body.replaceChildren();
});

function mount(props = {}) {
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  roots.push(root);
  const render = (next) => act(() => root.render(createElement(api.ColorPicker, next)));
  render(props);
  return { container, render };
}
function input(element, value) {
  act(() => {
    Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, 'value').set.call(
      element,
      String(value),
    );
    element.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
    element.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
  });
}
function enter(element) {
  act(() =>
    element.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true })),
  );
}
function labeled(container, text) {
  return [...container.querySelectorAll('label')]
    .find((label) => label.textContent.startsWith(text))
    .querySelector('input');
}

test('HEX alpha and shorthand conversion round trips', () => {
  assert.deepEqual(api.hexToRgb('#f008'), { r: 255, g: 0, b: 0, a: 136 / 255 });
  assert.equal(api.rgbToHex(api.hexToRgb('#f008')), '#ff000088');
  assert.equal(api.rgbToHex({ r: 1.4, g: 2.6, b: 0, a: 0 }, false), '#010300');
  assert.equal(api.colorToCss({ r: 1, g: 2, b: 3, a: 0.125 }), 'rgba(1, 2, 3, 0.125)');
});

test('RGB/HSL conversions handle primaries, gray, hue wrap and fractional precision', () => {
  for (const rgb of [
    { r: 255, g: 0, b: 0, a: 0.5 },
    { r: 0, g: 255, b: 0, a: 1 },
    { r: 0, g: 0, b: 255, a: 0 },
    { r: 100, g: 100, b: 100, a: 1 },
    { r: 12.5, g: 89.2, b: 230, a: 0.42 },
    { r: 0, g: 0, b: 0, a: 1 },
    { r: 255, g: 255, b: 255, a: 1 },
  ]) {
    const roundtrip = api.hslToRgb(api.rgbToHsl(rgb));
    for (const key of ['r', 'g', 'b', 'a']) assert.ok(Math.abs(roundtrip[key] - rgb[key]) < 1e-8);
  }
  assert.deepEqual(api.hslToRgb({ h: 360, s: 100, l: 50, a: 1 }), { r: 255, g: 0, b: 0, a: 1 });
  for (let h = 0; h <= 360; h += 7) {
    const rgb = api.hslToRgb({ h, s: 100, l: 19.607843137254903, a: 1 });
    api.validateRGBA(rgb);
    api.validateHSLA(api.rgbToHsl(rgb));
  }
});

test('parser and validators reject unsafe/unsupported syntax and invalid ranges', () => {
  assert.deepEqual(api.parseColor(' rgba(1, 2, 3, .5) '), { r: 1, g: 2, b: 3, a: 0.5 });
  assert.equal(api.rgbToHex(api.parseColor('hsla(120, 100%, 50%, 0.5)')), '#00ff0080');
  for (const text of [
    'red',
    'rgb(100% 0% 0%)',
    '#12345',
    '#ffffff; color:red',
    'rgb(256,0,0)',
    'hsl(361,50%,50%)',
  ]) {
    assert.throws(() => api.parseColor(text));
  }
  assert.throws(() => api.validateRGBA({ r: NaN, g: 0, b: 0, a: 1 }), RangeError);
  assert.throws(() => api.validateHSLA({ h: 1, s: -1, l: 2, a: 1 }), RangeError);
});

test('uncontrolled text keyboard commit, RGB/HSL/alpha inputs, native color and palette work', () => {
  const changes = [];
  const { container } = mount({ onChange: (value) => changes.push(value) });
  const text = labeled(container, 'Color (');
  input(text, '#ff000080');
  enter(text);
  assert.equal(changes.at(-1).r, 255);
  assert.equal(changes.at(-1).a, 128 / 255);
  input(labeled(container, 'Red'), 100);
  assert.equal(changes.at(-1).r, 100);
  input(labeled(container, 'Hue'), 120);
  assert.ok(Math.abs(api.rgbToHsl(changes.at(-1)).h - 120) < 1e-8);
  input(labeled(container, 'Alpha'), 0.25);
  assert.equal(changes.at(-1).a, 0.25);
  input(labeled(container, 'Visual color'), '#112233');
  assert.equal(changes.at(-1).r, 17);
  assert.equal(changes.at(-1).a, 0.25);
  act(() => container.querySelector('[aria-label="Use #22c55e"]').click());
  assert.equal(api.rgbToHex(changes.at(-1)), '#22c55eff');
  assert.match(container.querySelector('[aria-label="CSS color"]').textContent, /34, 197, 94/);
});

test('invalid draft is accessible, does not emit, and Escape restores valid text', () => {
  let count = 0;
  const { container } = mount({ onChange: () => count++ });
  const text = labeled(container, 'Color (');
  input(text, 'not-a-color');
  enter(text);
  assert.equal(count, 0);
  assert.equal(text.getAttribute('aria-invalid'), 'true');
  assert.ok(container.querySelector('[role="alert"]'));
  act(() =>
    text.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true })),
  );
  assert.equal(text.value, '#6366f1ff');
  assert.equal(container.querySelector('[role="alert"]'), null);
});

test('controlled values emit without changing canonical preview; parent updates are reflected', () => {
  const value = { r: 0, g: 0, b: 0, a: 1 };
  let next;
  const props = {
    value,
    onChange: (color) => {
      next = color;
    },
  };
  const { container, render } = mount(props);
  act(() => container.querySelector('[aria-label="Use #ef4444"]').click());
  assert.equal(api.rgbToHex(next), '#ef4444ff');
  assert.match(container.querySelector('[aria-label="CSS color"]').textContent, /0, 0, 0/);
  assert.deepEqual(value, { r: 0, g: 0, b: 0, a: 1 });
  render({ ...props, value: next });
  assert.match(container.querySelector('[aria-label="CSS color"]').textContent, /239, 68, 68/);
});

test('disabled controls cannot emit changes', () => {
  let count = 0;
  const { container } = mount({ disabled: true, onChange: () => count++ });
  act(() => container.querySelector('[aria-label="Use #ef4444"]').click());
  input(labeled(container, 'Red'), 40);
  assert.equal(count, 0);
});

test('ESM and CJS expose identical public names', () => {
  const cjs = createRequire(import.meta.url)('../dist/cjs/index.js');
  assert.deepEqual(Object.keys(cjs).sort(), Object.keys(api).sort());
  assert.deepEqual(cjs.hexToRgb('#fff'), api.hexToRgb('#fff'));
});
