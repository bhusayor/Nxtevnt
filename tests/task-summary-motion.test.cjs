// Deterministic hook/DOM-measurement fixtures; no browser automation or real task data.
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), Module = require('node:module');
const React = require('react'), ts = require('typescript'), root = path.resolve(__dirname, '..');
Module._extensions['.ts'] = (mod, file) => mod._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: 1, target: 9 } }).outputText, file);
const hooks = Object.fromEntries(['useState', 'useRef', 'useEffect', 'useLayoutEffect'].map(key => [key, React[key]]));
let slots, effects, layoutEffects, cursor, pending, dirty, timers, timerId, reduced, desktop, listeners, mediaListeners;
function registerEffect(kind, fn, deps) {
  const index = cursor++, store = kind === 'layout' ? layoutEffects : effects;
  const old = store.get(index);
  if (!old || !deps || deps.some((value, i) => value !== old.deps?.[i])) {
    pending.push(() => { old?.cleanup?.(); const cleanup = fn(); store.set(index, { deps, cleanup }); });
  }
}
React.useState = initial => { const index = cursor++; if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial; return [slots[index], value => { const next = typeof value === 'function' ? value(slots[index]) : value; if (!Object.is(next, slots[index])) { slots[index] = next; dirty = true; } }]; };
React.useRef = initial => { const index = cursor++; return slots[index] ||= { current: initial }; };
React.useEffect = (fn, deps) => registerEffect('effect', fn, deps);
React.useLayoutEffect = (fn, deps) => registerEffect('layout', fn, deps);
const { useSummaryMotion } = require('../src/components/planner/use-summary-motion.ts');
function reset() {
  slots = []; effects = new Map(); layoutEffects = new Map(); cursor = 0; pending = []; dirty = false; timers = new Map(); timerId = 0; reduced = false; desktop = true; listeners = new Map(); mediaListeners = new Set();
  global.window = {
    setTimeout(fn, delay) { timers.set(++timerId, { fn, delay }); return timerId; }, clearTimeout(id) { timers.delete(id); },
    matchMedia(query) { return query.includes('reduced-motion') ? { get matches() { return reduced; }, addEventListener(_, fn) { mediaListeners.add(fn); }, removeEventListener(_, fn) { mediaListeners.delete(fn); } } : { matches: desktop }; },
    addEventListener(name, fn) { listeners.set(name, fn); }, removeEventListener(name, fn) { if (listeners.get(name) === fn) listeners.delete(name); },
    getComputedStyle(element) { return element.styleFixture || { columnGap: '16px' }; },
  };
}
let model;
function draw() {
  for (let pass = 0; pass < 10; pass++) {
    dirty = false; cursor = 0; pending = []; model = useSummaryMotion();
    for (const effect of pending) effect();
    if (!dirty) return model;
  }
  throw Error('Unexpected effect loop');
}
const measure = (frameHeight = 352, gridHeight = 300, gridWidth = 1400) => {
  model.frame.current = { getBoundingClientRect: () => ({ height: frameHeight }) };
  model.grid.current = {
    getBoundingClientRect: () => ({ height: gridHeight, width: gridWidth }),
    querySelectorAll: selector => {
      assert.equal(selector, '[data-summary-content]');
      return ['milestones', 'tasks'].map(id => ({ dataset: { summaryContent: id }, parentElement: { styleFixture: { paddingLeft: '20px', paddingRight: '20px', borderLeftWidth: '1px', borderRightWidth: '1px' } } }));
    },
  };
};
function fire(delay) { const entry = [...timers].find(([, timer]) => timer.delay === delay); assert(entry, `Missing ${delay}ms timer`); timers.delete(entry[0]); entry[1].fn(); return draw(); }
const transition = propertyName => { const target = {}; return { propertyName, target, currentTarget: target }; };
const cleanup = () => { for (const entry of [...effects.values(), ...layoutEffects.values()]) entry.cleanup?.(); };
try {
  reset(); draw(); assert.equal(model.expanded, 'tasks', 'Task is expanded on arrival'); measure();
  model.select('milestones'); draw(); fire(360); fire(260); measure();
  model.select('tasks'); draw();
  assert.equal(model.phase, 'sliding'); assert.equal(model.height, 352); assert.equal(model.layout, 'tasks'); assert.equal(model.expanded, 'tasks', 'Destination cards render immediately, with no temporary stretched-pill state'); assert(model.isResizing);
  assert(Math.abs(model.contentWidths.milestones - ((1400 - 16) * 1.15 / 4.15 - 42)) < 0.001);
  assert(Math.abs(model.contentWidths.tasks - ((1400 - 16) * 3 / 4.15 - 42)) < 0.001, 'Content is locked to final width, accounting for gap, padding and borders');
  assert.equal(timers.size, 1); assert(![...timers.values()].some(timer => timer.delay === 120), 'Width motion begins immediately without a fade-out delay');
  model.onGridTransitionEnd({ ...transition('grid-template-columns'), target: {} }); draw(); assert.equal(model.phase, 'sliding', 'Ignore child transition events');
  model.onGridTransitionEnd(transition('opacity')); draw(); assert.equal(model.phase, 'sliding');
  model.onGridTransitionEnd(transition('grid-template-columns')); draw();
  assert.equal(model.contentWidths, null); assert.equal(model.phase, 'settling'); assert.equal(model.height, 300, 'Animate to the final natural content height, not intermediate stacked heights'); assert(!model.isResizing);
  model.onFrameTransitionEnd(transition('height')); draw(); assert.equal(model.phase, 'idle'); assert.equal(model.height, null); assert.equal(timers.size, 0);
  measure(300, 352); model.select('milestones'); draw();
  assert(Math.abs(model.contentWidths.milestones - ((1400 - 16) * 3.25 / 4.25 - 42)) < 0.001);
  assert(Math.abs(model.contentWidths.tasks - ((1400 - 16) / 4.25 - 42)) < 0.001, 'Reverse transition pins Task pills at their compact destination width from the first frame');
  fire(360); assert.equal(model.height, 352); fire(260); assert.equal(model.expanded, 'milestones'); assert.equal(model.height, null, 'Fallback releases the frame if transition events are absent');

  measure(); model.select('tasks'); draw(); model.select('milestones'); draw();
  assert.equal(model.phase, 'sliding'); assert.equal(model.expanded, 'milestones'); assert.equal(timers.size, 1, 'Rapid reversal cancels the previous scheduled completion');
  fire(360); fire(260); assert.equal(model.expanded, 'milestones'); assert.equal(model.contentWidths, null);
  model.select('tasks'); draw(); reduced = true; for (const listener of [...mediaListeners]) listener(); draw();
  assert.equal(model.phase, 'idle'); assert.equal(model.expanded, 'tasks'); assert.equal(model.contentWidths, null); assert.equal(model.height, null); assert.equal(timers.size, 0);
  cleanup(); assert.equal(timers.size, 0); assert.equal(mediaListeners.size, 0); assert.equal(listeners.size, 0);

  reset(); reduced = true; draw(); measure(); model.select('milestones'); draw(); assert.equal(model.phase, 'idle'); assert.equal(model.layout, 'milestones'); assert.equal(timers.size, 0); cleanup();
  reset(); desktop = false; draw(); measure(); model.select('milestones'); draw(); assert.equal(model.phase, 'idle'); assert.equal(model.expanded, 'milestones'); assert.equal(timers.size, 0); cleanup();
  reset(); draw(); measure(); model.select('milestones'); draw(); listeners.get('resize')(); draw(); assert.equal(model.phase, 'idle'); assert.equal(model.layout, 'milestones'); assert.equal(model.height, null); assert.equal(timers.size, 0); cleanup();
  reset(); draw(); measure(); model.select('milestones'); draw(); cleanup(); assert.equal(timers.size, 0, 'Unmount cancels timers');
  reset(); draw(); measure(); model.grid.current.querySelectorAll = () => []; model.select('milestones'); draw(); assert.equal(model.phase, 'idle'); assert.equal(model.contentWidths, null, 'Unavailable geometry falls back to the destination without a blank stage'); cleanup();

  const source = fs.readFileSync(path.join(root, 'src/components/planner/task-plan-summary.tsx'), 'utf8');
  assert(!source.includes('key={active ?')); assert(source.includes('compact={!active}')); assert(source.includes('width: motion.contentWidths?.[id]')); assert(source.includes('data-summary-content={id}')); assert(!/opacity-0|transition-opacity|contentHidden/.test(source), 'Information must stay visible throughout the transition'); assert(source.includes('overflow-hidden'));
  assert(source.includes('minmax(0,3.25fr)_minmax(0,1fr)')); assert(source.includes('minmax(0,1.15fr)_minmax(0,3fr)'), 'Milestone has a little more width in both views');
  console.log('PASS: immediate destination layout with final content widths, no stretched-pill stage or blank fade; wider Milestone panel; stable height; exact gap/inset accounting in both directions; transition ends/fallbacks, rapid reversal, resize, reduced-motion and cleanup. Synthetic hook fixtures only.');
} finally { Object.assign(React, hooks); delete global.window; }
