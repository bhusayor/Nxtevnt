// Navigation-only checks. No browser records or guest data are accessed.
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), Module = require('node:module');
const root = path.resolve(__dirname, '..'), ts = require('typescript');
const file = path.join(root, 'src/lib/event-workspace-navigation.ts');
const mod = new Module(file);
mod._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: 1, target: 9 } }).outputText, file);
const { workspaceSection, budgetWorkspaceTab } = mod.exports;
const sections = ['overview', 'notes', 'proposal', 'tasks', 'moodboard', 'agenda', 'control-room', 'files'];
for (const section of sections) assert.equal(workspaceSection(section), section);
for (const section of ['guests', 'guest', undefined, 'unknown']) assert.equal(workspaceSection(section), 'overview');
assert.equal(workspaceSection('decisions'), 'notes');
assert.equal(workspaceSection('budget'), 'proposal');
assert.equal(workspaceSection('budget-proposal'), 'proposal');
assert.equal(budgetWorkspaceTab('budget'), 'budget');
assert.equal(budgetWorkspaceTab('proposal'), 'proposals');
assert.equal(budgetWorkspaceTab('budget', 'bookings'), 'bookings');
assert.equal(budgetWorkspaceTab('budget', 'payments'), 'payments');
const source = fs.readFileSync(path.join(root, 'src/components/planner/event-workspace.tsx'), 'utf8');
const tabConfig = source.match(/const sections = \[([\s\S]*?)\] as const/)[1];
assert.deepEqual([...tabConfig.matchAll(/id: "([^"]+)"/g)].map(match => match[1]), sections);
assert(!source.includes('EventGuestSummary'));
assert(!source.includes('active === "guests"'));
const React = require('react'), load = Module._load, stubs = {};
const stub = name => stubs[name] ||= () => null;
let event = { id: 'fixture', name: 'A celebration with a long event title', sections: {} }, slots = [], cursor = 0;
Module._load = function(id, parent, main) {
  if (id === 'next/link') return stub('Link');
  if (id === 'next/navigation') return { useRouter: () => ({}) };
  if (id === '@radix-ui/react-dialog') return new Proxy({}, { get: (_, name) => stub('Dialog.' + name) });
  if (id === '@/lib/event-workspace-navigation') return mod.exports;
  if (id === '@/lib/planner-events') return { usePlannerEvents: () => [event], useBrowserReady: () => true, isEventCancelled: () => false };
  if (id === '@/lib/planner-budget') return { useBudgetStore: () => ({ items: [] }) };
  if (id.startsWith('@/components/') || id === './event-files-workspace') return new Proxy({}, { get: (_, name) => name === '__esModule' ? true : stub(name) });
  if (id.startsWith('@/lib/') && !id.endsWith('/utils/cn')) return {};
  if (id.startsWith('@/')) id = path.join(root, 'src', id.slice(2));
  return load.call(this, id, parent, main);
};
for (const ext of ['.ts', '.tsx']) Module._extensions[ext] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: 1, target: 9, jsx: 4, esModuleInterop: true } }).outputText, file);
React.useState = initial => { const i = cursor++; if (!(i in slots)) slots[i] = typeof initial === 'function' ? initial() : initial; return [slots[i], value => slots[i] = typeof value === 'function' ? value(slots[i]) : value]; };
const { EventWorkspace } = require('../src/components/planner/event-workspace.tsx');
const walk = node => !node || typeof node !== 'object' ? [] : [node, ...[node.props?.children].flat(Infinity).flatMap(walk)];
function draw() { cursor = 0; return walk(EventWorkspace({ id: event.id })); }
for (const section of sections) {
  draw().find(node => node.props.role === 'tab' && node.props.id === 'event-tab-' + section).props.onClick();
  const nodes = draw(), title = nodes.find(node => node.type === 'h1'), tabs = nodes.find(node => node.props.role === 'tablist');
  assert.equal(title.props.children, event.name, 'Event name stays visible on ' + section);
  assert(nodes.indexOf(title) < nodes.indexOf(tabs), 'Title precedes navigation');
  assert(nodes.find(node => node.props.id === 'event-tab-' + section).props['aria-selected']);
}
event = { ...event, name: 'Updated event name' };
assert.equal(draw().find(node => node.type === 'h1').props.children, event.name, 'Edited names update the shared heading');
Module._load = load;
console.log('PASS: event title above navigation on every tab, reactive event name, hidden Guest placeholder and preserved section/budget aliases. Read-only fixtures.');
