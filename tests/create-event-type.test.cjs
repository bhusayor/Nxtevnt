// Isolated render/interaction fixtures. No browser storage, real credits or events.
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), Module = require('node:module');
const root = path.resolve(__dirname, '..'), ts = require('typescript'), React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const load = Module._load, components = {}, states = [];
let cursor = 0, saved, spent = 0, navigated;
const stub = name => components[name] ||= Object.assign(() => null, { displayName: name });
Module._load = function(id, parent, main) {
  if (id === 'next/link' || id === 'next/image') return stub(id);
  if (id === 'next/navigation') return { useRouter: () => ({ push: url => { navigated = url; } }) };
  if (id === '@/components/ui/icons') return new Proxy({}, { get: (_, name) => ({ ...props }) => React.createElement('svg', { ...props, 'data-icon': String(name) }) });
  if (id === '@/lib/planner-credits') return { getCreditBalance: () => 1, useCreditBalance: () => 1, spendCreditForEvent: () => { spent++; return { id: 'fixture-credit' }; }, refundCreditUse: () => assert.fail('Unexpected refund') };
  if (id === '@/lib/planner-events') return { useBrowserReady: () => true, eventCovers: [0, 1, 2, 3].map(n => ({ src: `cover-${n}` })), isCustomCover: src => src.startsWith('data:'), formatEventDate: date => date, createPlannerEvent: values => { saved = values; return { id: 'fixture-event' }; } };
  if (id === '@/lib/planner-clients') return { usePlannerClients: () => [] };
  if (id === '@/lib/planner-task-templates') return { useMilestoneTemplates: () => [] };
  if (id === '@/lib/event-setup-templates') return { budgetTemplates: [] };
  if (id === '@/lib/planner-budget') return { currencies: [{ label: 'NGN', code: 'NGN' }] };
  if (id.startsWith('@/components/') && !id.endsWith('/event-type-picker')) {
    return new Proxy({}, { get: (_, name) => name === '__esModule' ? true : stub(name) });
  }
  if (id.startsWith('@/')) id = path.join(root, 'src', id.slice(2));
  return load.call(this, id, parent, main);
};
for (const extension of ['.ts', '.tsx']) Module._extensions[extension] = (mod, file) => mod._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: 1, target: 9, jsx: 4, esModuleInterop: true } }).outputText, file);
const { EventTypePicker } = require('../src/components/planner/event-type-picker.tsx');
const { CreateEventForm } = require('../src/components/planner/create-event-form.tsx');
const walk = node => !node || typeof node !== 'object' ? [] : Array.isArray(node) ? node.flatMap(walk) : [node, ...walk(node.props?.children)];
for (const choice of ['', 'Wedding', 'Corporate', 'Party', 'Other event']) {
  let selected;
  const tree = EventTypePicker({ value: choice, onChange: value => { selected = value; } });
  const radios = walk(tree).filter(n => n.type === 'input');
  assert.equal(radios.length, 4);
  assert.equal(radios.filter(n => n.props.checked).length, choice ? 1 : 0);
  assert(radios.every(n => n.props.type === 'radio' && n.props.name === 'event-type' && n.props.required));
  radios[3].props.onChange(); assert.equal(selected, 'Other event');
  const html = renderToStaticMarkup(tree);
  for (const icon of ['Heart', 'BriefcaseBusiness', 'Music2', 'LayoutGrid']) assert(html.includes(`data-icon="${icon}"`));
  assert(html.includes('peer-focus-visible:outline-2')); assert(html.includes('grid-cols-2'));
}
const errorHtml = renderToStaticMarkup(EventTypePicker({ value: '', onChange() {}, error: 'Choose an event type.' }));
assert(errorHtml.includes('aria-invalid="true"')); assert(errorHtml.includes('id="event-type-error"'));
const originalUseState = React.useState;
React.useState = initial => {
  const index = cursor++;
  if (!(index in states)) states[index] = typeof initial === 'function' ? initial() : initial;
  return [states[index], value => { states[index] = typeof value === 'function' ? value(states[index]) : value; }];
};
global.window = { setTimeout: callback => callback(), scrollTo() {} };
global.document = { getElementById: () => ({ focus() {} }) };
const render = () => { cursor = 0; return walk(CreateEventForm()); };
const field = id => render().find(n => n.props?.id === id);
const picker = () => render().find(n => n.type === EventTypePicker);
const submit = () => render().find(n => n.type === 'form').props.onSubmit({ preventDefault() {} });
try {
  assert(!field('event-otherType'));
  assert(!render().some(n => n.type === components.Select && n.props.id === 'event-type'));
  picker().props.onChange('Other event');
  assert(field('event-otherType').props.required);
  submit(); assert.equal(field('event-otherType').props.error, 'Tell us what kind of event this is.');
  field('event-otherType').props.onChange({ target: { value: '  Product launch  ' } });
  assert(!field('event-otherType').props.error);
  assert(render().some(n => n.type === 'p' && n.props.children === 'Product launch'), 'Custom type updates live preview');
  picker().props.onChange('Wedding');
  assert(!field('event-otherType')); assert.equal(states[1].image, 'cover-1');
  picker().props.onChange('Corporate'); assert.equal(states[1].image, 'cover-2');
  picker().props.onChange('Party'); assert.equal(states[1].image, 'cover-3');
  states[1] = { ...states[1], image: 'data:custom-cover' };
  picker().props.onChange('Other event'); assert.equal(states[1].image, 'data:custom-cover');
  assert.equal(spent, 0); assert.equal(saved, undefined, 'Selection never creates an event');
  field('event-name').props.onChange({ target: { value: 'Fixture launch' } });
  field('event-city').props.onChange({ target: { value: 'Lagos' } });
  field('event-date').props.onChange('2099-12-31');
  submit(); assert.equal(states[0], 2); assert.equal(spent, 0);
  submit(); assert.equal(saved.type, 'Product launch'); assert.equal(spent, 1); assert.equal(navigated, '/planner/events/fixture-event');
} finally { React.useState = originalUseState; Module._load = load; }
console.log('PASS: four coloured icon cards, native radio selection, required custom Other, validation, live preview, cover preservation and isolated creation fixture.');
