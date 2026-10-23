const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { test } = require('node:test');

function loadTheme(saved, blocked = false) {
  const listeners = {}, changes = [], storage = new Map([['origkfc-theme', saved]]);
  const inputs = ['dark', 'light'].map(value => ({ value, checked: false, addEventListener(type, fn) { this[type] = fn; } }));
  const styles = { media: 'all' }, meta = { setAttribute(key, value) { this[key] = value; } };
  const document = {
    documentElement: { dataset: {} },
    querySelector: selector => selector === '#darkThemeStyles' ? styles : meta,
    querySelectorAll: () => inputs,
    addEventListener: (type, fn) => { listeners[type] = fn; },
    dispatchEvent: event => { changes.push(event.detail); },
  };
  vm.runInNewContext(fs.readFileSync('theme.js', 'utf8'), {
    document,
    localStorage: {
      getItem(key) { if (blocked) throw new Error('Storage disabled'); return storage.get(key); },
      setItem(key, value) { if (blocked) throw new Error('Storage disabled'); storage.set(key, value); },
    },
    CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options.detail; } },
  });
  listeners.DOMContentLoaded();
  return { document, inputs, styles, meta, storage, changes };
}

test('new visitors get the approved dark theme', () => {
  const state = loadTheme(null);
  assert.equal(state.document.documentElement.dataset.theme, 'dark');
  assert.equal(state.styles.media, 'all');
  assert.equal(state.inputs[0].checked, true);
  assert.equal(state.meta.content, '#06131d');
});

test('stored light theme restores the original styling before page content', () => {
  const state = loadTheme('light');
  assert.equal(state.document.documentElement.dataset.theme, 'light');
  assert.equal(state.styles.media, 'not all');
  assert.equal(state.inputs[1].checked, true);
  assert.equal(state.meta.content, '#bac5ce');
});

test('selection persists and notifies the existing 3D world without reloading', () => {
  const state = loadTheme('dark');
  state.inputs[1].checked = true;
  state.inputs[1].change({ target: state.inputs[1] });
  assert.equal(state.storage.get('origkfc-theme'), 'light');
  assert.equal(state.styles.media, 'not all');
  assert.deepEqual(state.changes, ['light']);
  state.inputs[0].checked = true;
  state.inputs[0].change({ target: state.inputs[0] });
  assert.equal(state.styles.media, 'all');
  assert.deepEqual(state.changes, ['light', 'dark']);
});

test('invalid saved values and disabled storage cannot break switching', () => {
  assert.equal(loadTheme('invalid').document.documentElement.dataset.theme, 'dark');
  const state = loadTheme(null, true);
  state.inputs[1].checked = true;
  state.inputs[1].change({ target: state.inputs[1] });
  assert.equal(state.document.documentElement.dataset.theme, 'light');
});
