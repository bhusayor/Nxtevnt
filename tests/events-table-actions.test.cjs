// All records, storage, hooks and attachment calls are synthetic/in-memory.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const root = path.resolve(__dirname, '..');
const memory = new Map();
global.window = { localStorage: { getItem: key => memory.get(key) ?? null, setItem: (key, value) => memory.set(key, value) }, dispatchEvent() {} };
const slots = []; let cursor = 0;
const fakeReact = { ...React, useSyncExternalStore: (_, snapshot) => snapshot(), useState: initial => { const i = cursor++; if (!(i in slots)) slots[i] = typeof initial === 'function' ? initial() : initial; return [slots[i], value => { slots[i] = value; }]; } };
const cleanup = [];
const noop = () => null;
const componentStubs = new Proxy({}, { get: () => noop });
const modules = {
  react: fakeReact,
  '@/lib/event-setup-templates': { guestCommunicationsMilestone: { title: 'Test milestone' } },
  './budget-attachments': { deleteBudgetAttachments: async ids => cleanup.push(['attachments', ids]) },
  './planner-budget': { deleteBudgetForEvent: id => cleanup.push(['budget', id]) },
  './moodboard-images': { deleteMoodboardImage: async image => cleanup.push(['image', image]) },
  '@/lib/planner-budget': { useBudgetStore: () => ({ items: [] }) },
  '@/components/ui/delete-confirmation': { DeleteConfirmation: noop, matchesDeleteConfirmation: (text, name) => text === name || text === 'DELETE' },
  'next/link': { __esModule: true, default: ({ children, ...props }) => React.createElement('a', props, children) },
  'next/image': { __esModule: true, default: ({ fill, unoptimized, ...props }) => React.createElement('img', props) },
};
const cache = new Map();
function load(file) {
  const filename = path.resolve(root, file);
  if (cache.has(filename)) return cache.get(filename);
  const api = {}; cache.set(filename, api);
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
  new Function('exports', 'require', code)(api, name => {
    if (name in modules) return modules[name];
    if (name.startsWith('@/components/') || name.startsWith('./event-')) return componentStubs;
    if (name.startsWith('@/')) return load(`src/${name.slice(2)}.ts`);
    if (name.startsWith('.')) return load(path.relative(root, path.resolve(path.dirname(filename), `${name}.ts`)));
    return require(name);
  });
  return api;
}

async function run() {
  const events = load('src/lib/planner-events.ts');
  const { browseEvents, EMPTY_EVENT_FILTERS, eventExpiryDate, validateEventExpiry } = load('src/lib/event-browsing.ts');
  const { deleteEventWithContents } = load('src/lib/delete-event.ts');
  const { eventLeaveDescription } = load('src/lib/event-removal.ts');
  const fixture = { name: 'Test wedding', type: 'Wedding', date: '2026-11-20', startTime: '12:00', endTime: '18:00', location: 'Venue', city: 'Lagos', clientName: '', guestCount: '10', budget: '100', description: '', image: '/test.jpg' };
  const owner = events.createPlannerEvent(fixture, 'owner-event');
  const invited = events.createPlannerEvent({ ...fixture, name: 'Invited event', date: '2026-12-01', clientName: 'Test Client' }, 'invited-event');
  events.updatePlannerEvent(invited.id, event => ({ ...event, accessRole: 'invited', expiresAt: '2027-01-01' }));
  assert.equal(owner.accessRole, 'owner');
  const records = events.usePlannerEvents();
  assert.deepEqual(browseEvents(records, '', EMPTY_EVENT_FILTERS, 'asc').map(event => event.id), ['owner-event', 'invited-event']);
  assert.deepEqual(browseEvents(records, '', EMPTY_EVENT_FILTERS, 'desc').map(event => event.id), ['invited-event', 'owner-event']);
  assert.equal(browseEvents(records, 'LAGOS', { type: 'Wedding', client: 'Test Client', priority: 'standard' }, 'asc').length, 1);
  assert.equal(browseEvents(records, '', { ...EMPTY_EVENT_FILTERS, type: 'Corporate' }, 'asc').length, 0);
  assert.equal(owner.date, '2026-11-20', 'Sorting cannot mutate source records');
  assert.equal(eventExpiryDate(owner), null);
  assert.equal(eventExpiryDate({ expiresAt: '2026-02-30' }), null);
  assert(validateEventExpiry({}, '2026-11-02', '2026-11-02'));
  assert(validateEventExpiry({ expiresAt: '2027-01-01' }, '2027-01-01', '2026-11-02'));
  assert.equal(validateEventExpiry({ expiresAt: '2027-01-01' }, '2027-02-01', '2026-11-02'), null);
  events.updatePlannerEvent(owner.id, event => ({ ...event, expiresAt: '2027-03-01' }));
  assert.equal(events.getPlannerEventById(owner.id).expiresAt, '2027-03-01');
  const { EventListView } = load('src/components/planner/event-list-view.tsx');
  const table = renderToStaticMarkup(React.createElement(EventListView, { events: [{ ...owner, date: '2020-01-01', expiresAt: '2027-03-01' }, { ...invited, id: 'no-expiry' }], today: '2026-11-02' }));
  assert(table.includes('Event expiration'));
  assert(table.includes('2027-03-01'));
  assert(table.includes('Not set'));
  assert(table.includes('Completed') && !table.includes('>Past<'));

  const { EventRowActions } = load('src/components/planner/event-row-actions.tsx');
  function menu(event) { cursor = 0; slots.length = 0; return EventRowActions({ event }).props.children[0].props.items; }
  const ownMenu = menu(owner);
  assert.deepEqual(ownMenu.map(item => item.label), ['Open', 'Edit', 'Extend expiry', 'Cancel event', 'Delete event']);
  assert.equal(ownMenu[0].href, '/planner/events/owner-event');
  assert(menu(events.getPlannerEventById(invited.id)).some(item => item.label === 'Leave event'));
  assert(!menu(events.getPlannerEventById(invited.id)).some(item => item.label === 'Delete event'));
  events.cancelPlannerEvent(owner.id, 'Test cancellation');
  assert(menu(events.getPlannerEventById(owner.id)).some(item => item.label === 'Reopen event'));
  events.reopenPlannerEvent(owner.id);
  assert.equal(events.isEventCancelled(events.getPlannerEventById(owner.id)), false);

  const attached = events.createPlannerEvent({ ...fixture, name: 'Client event', clientName: 'Ada Okoye' }, 'client-event');
  assert(menu(attached).some(item => item.label === 'Leave event'));
  assert(!menu(attached).some(item => item.label === 'Delete event'));
  assert.match(eventLeaveDescription(attached), /Ada keeps the event and everything in it/);
  assert.throws(() => events.leavePlannerEvent(owner.id), /attached client/);
  assert.throws(() => events.deletePlannerEvent(attached.id), /cannot be deleted/);
  await assert.rejects(() => deleteEventWithContents(attached, []), /cannot be deleted/);
  assert.throws(() => events.deletePlannerEvent(invited.id), /cannot be deleted/);
  await assert.rejects(() => deleteEventWithContents(events.getPlannerEventById(invited.id), []), /cannot be deleted/);
  assert.equal(cleanup.length, 0, 'A client-owned event cannot lose shared files or budget data');
  events.leavePlannerEvent(attached.id);
  assert.equal(events.getPlannerEventById(attached.id), undefined);
  assert(JSON.parse(memory.get('nxtevnt.planner.events.v1')).some(event => event.id === attached.id), 'Leaving preserves the client-owned record');
  events.leavePlannerEvent(invited.id);
  assert.equal(events.getPlannerEventById(invited.id), undefined);
  const visible = events.usePlannerEvents();
  assert.equal(events.usePlannerEvents(), visible, 'External-store snapshots remain referentially stable');
  assert.deepEqual(visible.map(event => event.id), [owner.id]);
  assert(JSON.parse(memory.get('nxtevnt.planner.events.v1')).some(event => event.id === invited.id), 'Leaving preserves the shared record');
  await deleteEventWithContents(events.getPlannerEventById(owner.id), []);
  assert.equal(events.getPlannerEventById(owner.id), undefined);
  assert(cleanup.some(([kind, id]) => kind === 'budget' && id === owner.id));
  assert(JSON.parse(memory.get('nxtevnt.planner.events.v1')).some(event => event.id === invited.id), 'Deleting an owned event cannot delete a separate invitation');
  console.log('PASS: filtering, date sorting, expiry validation/persistence, menu actions, creator/invited permissions, leave without deletion, stable snapshots and owned-event cleanup.');
}
run().catch(error => { console.error(error); process.exitCode = 1; });
