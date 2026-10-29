// Isolated UI and in-memory storage fixtures. No real contacts or events are changed.
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), Module = require('node:module');
const root = path.resolve(__dirname, '..'), ts = require('typescript'), React = require('react');
const load = Module._load, stubs = {}, slots = [];
let cursor = 0, raw = '[]', writes = 0, failEventSave = false, clients = [];
const completedTasks = [];
const stub = name => stubs[name] ||= Object.assign(() => null, { displayName: name });
let current = { id: 'fixture', name: 'Fixture celebration', image: 'old-cover', description: 'Keep this description' };
Module._load = function(id, parent, main) {
  if (id === 'next/image') return stub('Image');
  if (id === '@radix-ui/react-dialog') return new Proxy({}, { get: (_, name) => stub(`Dialog.${name}`) });
  if (id === '@/components/ui/icons') return new Proxy({}, { get: (_, name) => stub(`Icon.${name}`) });
  if (id === '@/lib/planner-budget') return { useBudgetStore: () => ({ items: [] }), formatBudgetMoney: value => String(value) };
  if (id === '@/lib/event-decisions') return { currentEventDecisions: () => [] };
  if (id === '@/lib/planner-events') return {
    usePlannerEvents: () => [], isTaskActive: task => !task.archived, isTaskComplete: task => task.done, taskStatus: task => task.status,
    isEventCancelled: event => !!event.cancelledAt, formatEventDate: date => date, formatEventPlace: event => event.location, isCustomCover: () => false,
    completePlannerTask: (eventId, taskId) => { if (failEventSave) throw Error('Storage unavailable'); completedTasks.push([eventId, taskId]); },
    updatePlannerEvent: (id, change) => { assert.equal(id, 'fixture'); if (failEventSave) throw Error('Storage unavailable'); current = change(current); writes++; },
  };
  if (id.startsWith('@/components/') && !/event-(client-details|cover-editor)$/.test(id)) return new Proxy({}, { get: (_, name) => name === '__esModule' ? true : stub(name) });
  if (id.startsWith('@/')) id = path.join(root, 'src', id.slice(2));
  return load.call(this, id, parent, main);
};
for (const extension of ['.ts', '.tsx']) Module._extensions[extension] = (mod, file) => mod._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: 1, target: 9, jsx: 4, esModuleInterop: true } }).outputText, file);
global.window = { localStorage: { getItem: () => raw, setItem: (_, value) => { raw = value; } }, dispatchEvent() {} };
const clientStore = require('../src/lib/planner-clients.ts');
clientStore.usePlannerClients = () => clients;
const { EventClientDetails } = require('../src/components/planner/event-client-details.tsx');
const { EventCoverEditor } = require('../src/components/planner/event-cover-editor.tsx');
const { EventOverviewPanel } = require('../src/components/planner/event-overview-panel.tsx');
const walk = node => !node || typeof node !== 'object' ? [] : Array.isArray(node) ? node.flatMap(walk) : [node, ...walk(node.props?.children)];
const text = node => node == null ? '' : typeof node === 'string' || typeof node === 'number' ? String(node) : Array.isArray(node) ? node.map(text).join(' ') : text(node.props?.children);
const originalState = React.useState, originalEffect = React.useEffect;
React.useState = initial => { const i = cursor++; if (!(i in slots)) slots[i] = typeof initial === 'function' ? initial() : initial; return [slots[i], value => { slots[i] = typeof value === 'function' ? value(slots[i]) : value; }]; };
React.useEffect = () => {};
const render = (component, props) => { cursor = 0; return walk(component(props)); };
const reset = () => { slots.length = 0; };
const client = { id: 'client-1', name: 'Fixture client', email: 'client@example.com', phone: '+234 801 234 5678', createdAt: '2026-10-01' };
try {
  raw = JSON.stringify([client, { ...client, id: 'client-2', name: 'Another client' }]);
  assert.throws(() => clientStore.updatePlannerClientContact(client, { email: 'invalid', phone: '' }), /valid email/);
  assert.throws(() => clientStore.updatePlannerClientContact(client, { email: '', phone: 'abc' }), /phone number/);
  const contactProps = { client, name: client.name };
  let nodes = render(EventClientDetails, contactProps);
  assert(nodes.some(n => n.props?.href === 'tel:+2348012345678'));
  assert(nodes.some(n => n.props?.href === 'mailto:client@example.com'));
  nodes.find(n => n.type === stubs['Dialog.Root']).props.onOpenChange(true);
  nodes = render(EventClientDetails, contactProps);
  nodes.find(n => n.props?.label === 'Contact number').props.onChange({ target: { value: '+234 809 876 5432' } });
  nodes.find(n => n.props?.label === 'Email address').props.onChange({ target: { value: ' updated@example.com ' } });
  render(EventClientDetails, contactProps).find(n => n.type === 'form').props.onSubmit({ preventDefault() {} });
  assert.equal(JSON.parse(raw)[0].phone, '+234 809 876 5432'); assert.equal(JSON.parse(raw)[0].email, 'updated@example.com'); assert.deepEqual(JSON.parse(raw)[1], { ...client, id: 'client-2', name: 'Another client' });
  clientStore.updatePlannerClientContact({ id: 'event-client:legacy', name: 'Legacy client', createdAt: '2026-10-01' }, { email: '', phone: '+2348012345678' });
  assert.equal(JSON.parse(raw).length, 3, 'Derived legacy clients can save contact details without creating an event');
  reset(); nodes = render(EventClientDetails, { name: '' });
  assert(text(nodes[0]).includes('Not added yet')); assert(!nodes.some(n => n.type === stubs['Dialog.Root']));
  reset(); const coverProps = { event: current };
  nodes = render(EventCoverEditor, coverProps);
  assert(nodes.some(n => n.props?.['aria-label'] === 'Change event cover photo'));
  nodes[0].props.onOpenChange(true);
  render(EventCoverEditor, coverProps).find(n => n.type === stubs.CoverPicker).props.onChange('new-cover');
  assert.equal(writes, 0, 'Picking a cover does not save before confirmation');
  render(EventCoverEditor, coverProps).find(n => n.type === stubs.Button && n.props.children === 'Save cover').props.onClick();
  assert.equal(current.image, 'new-cover'); assert.equal(current.description, 'Keep this description'); assert.equal(writes, 1);
  failEventSave = true;
  render(EventCoverEditor, coverProps).find(n => n.type === stubs.Button && n.props.children === 'Save cover').props.onClick();
  assert(render(EventCoverEditor, coverProps).some(n => n.props?.role === 'alert'));
  reset(); clients = [{ ...client, id: 'wrong-id' }, client];
  const event = { ...current, date: '2026-11-27', timeZone: 'Africa/Lagos', type: 'Wedding', location: 'Lagos', clientId: client.id, clientName: client.name, guestCount: '150', sections: { tasks: [] } };
  const props = { event, onOpenTasks() {}, onOpenMoodboard() {} };
  render(EventOverviewPanel, props); slots[2] = new Date('2026-10-22T12:00:00Z');
  nodes = render(EventOverviewPanel, props);
  assert.equal(nodes.find(n => n.type === EventClientDetails).props.client.id, client.id, 'Client ID takes precedence over same-name records');
  const coverSection = nodes.find(n => n.props?.['aria-label'] === 'Event details');
  assert(!walk(coverSection).some(n => n.type === 'h1'), 'Event title belongs above the tabs, not inside the overview card');
  assert(walk(coverSection.props.children[0]).some(n => n.props?.['aria-label'] === `Open full photo for ${event.name}`), 'Cover is first on desktop and mobile');
  assert(!text(coverSection).includes('Africa/Lagos'), 'Time-zone setting is not displayed on the overview card');
  const countdown = walk(coverSection).find(n => n.props?.['aria-label'] === 'Event countdown');
  assert(text(countdown).includes('36')); assert(text(countdown).includes('days')); assert(countdown.props.className.includes('absolute'));
  assert(walk(coverSection).some(n => n.type === EventCoverEditor));
  const planning = nodes.find(n => n.props?.['aria-labelledby'] === 'planning-at-a-glance');
  for (const rowName of ['tasks-mood-board', 'decisions-payments']) {
    const row = nodes.find(n => n.props?.['data-overview-row'] === rowName);
    assert(row.props.className.includes('lg:grid-cols-2'), `${rowName} uses two equal-width columns`);
    assert(row.props.className.includes('auto-rows-fr') && row.props.className.includes('items-stretch'), `${rowName} keeps paired cards equal height`);
  }
  const decisionPaymentRow = nodes.find(n => n.props?.['data-overview-row'] === 'decisions-payments');
  assert.equal(decisionPaymentRow.props.children[0].type, stubs.EventOverviewDecisions);
  assert.equal(decisionPaymentRow.props.children[1].type, stubs.EventUpcomingPayments);
  const planningNodes = walk(planning);
  assert.equal(planningNodes.filter(n => n.type === stubs.OverviewMetricCard).length, 4);
  assert.deepEqual(planningNodes.filter(n => n.type === stubs.OverviewMetricCard).map(n => [n.props.label, n.props.href]), [
    ['Tasks complete', '/planner/events/fixture?section=tasks'],
    ['Estimated budget', '/planner/events/fixture?section=budget'],
    ['Vendor bookings', '/planner/events/fixture?section=budget&tab=bookings'],
    ['Open decisions', '/planner/events/fixture?section=decisions'],
  ]);
  assert(planningNodes.findIndex(n => n.type === 'h2') < planningNodes.findIndex(n => n.type === stubs.OverviewMetricCard));
  assert(text(planning).includes('Your planning at a glance'));
  for (const [date, expected] of [['2026-10-22', 'It’s event day'], ['2026-10-21', 'Event day passed']]) {
    const next = render(EventOverviewPanel, { ...props, event: { ...event, date } });
    assert(text(next.find(n => n.props?.['aria-label'] === 'Event countdown')).includes(expected));
  }
  assert(text(render(EventOverviewPanel, { ...props, event: { ...event, cancelledAt: '2026-10-22' } }).find(n => n.props?.['aria-label'] === 'Event countdown')).includes('Plans paused'));
  const taskProps = { ...props, event: { ...event, sections: { tasks: [{ id: 'fixture-task', title: 'Confirm venue', dueDate: '2026-01-01' }] } } };
  failEventSave = false;
  render(EventOverviewPanel, taskProps).find(n => n.props?.['aria-label'] === 'Mark complete: Confirm venue').props.onChange();
  assert.deepEqual(completedTasks, [['fixture', 'fixture-task']]);
  failEventSave = true;
  render(EventOverviewPanel, taskProps).find(n => n.props?.['aria-label'] === 'Mark complete: Confirm venue').props.onChange();
  assert(render(EventOverviewPanel, taskProps).some(n => n.props?.role === 'alert'));
  assert(render(EventOverviewPanel, { ...taskProps, event: { ...taskProps.event, cancelledAt: '2026-10-22' } }).find(n => n.props?.['aria-label'] === 'Mark complete: Confirm venue').props.disabled);
  const openedTasks = [];
  const manyTasks = Array.from({ length: 5 }, (_, index) => ({ id: `next-${index}`, title: `Next task ${index}`, dueDate: `2099-01-0${index + 1}`, status: 'todo' }));
  const listProps = { ...props, onOpenTasks: id => openedTasks.push(id), event: { ...event, sections: { tasks: [...manyTasks, { id: 'done', title: 'Already done', done: true }] } } };
  nodes = render(EventOverviewPanel, listProps);
  assert(nodes.some(n => n.type === 'h2' && text(n) === 'Next 3 tasks'));
  const taskRows = nodes.filter(n => n.type === 'button' && n.props['aria-label']?.startsWith('Open task:'));
  assert.equal(taskRows.length, 3);
  taskRows.forEach(n => n.props.onClick());
  assert.deepEqual(openedTasks, ['next-0', 'next-1', 'next-2']);
  assert.equal(completedTasks.length, 1, 'Opening task rows never completes them');
} finally { React.useState = originalState; React.useEffect = originalEffect; Module._load = load; }
console.log('PASS: cover countdown and date states; camera editor draft/save/error; client phone/email display and validation; legacy contact persistence; linked-client precedence; planning heading above all four cards. Isolated fixtures only.');
