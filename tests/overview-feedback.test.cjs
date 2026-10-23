// Isolated synthetic records only. Does not access user storage, clipboard or external services.
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), Module = require('node:module');
const root = path.resolve(__dirname, '..'), ts = require(path.join(root, 'node_modules/typescript')), React = require(path.join(root, 'node_modules/react'));
const { renderToStaticMarkup } = require(path.join(root, 'node_modules/react-dom/server')), original = Module._load;
let events = [], replies = [], inquiries = [], readIds = [], profile;
Module._load = function(id, parent, main) {
  if (id === 'next/link') return ({ children, ...props }) => React.createElement('a', props, children);
  if (id === 'next/image') return ({ fill, unoptimized, preload, priority, ...props }) => React.createElement('img', props);
  if (id === '@/components/ui/icons') return new Proxy({}, { get: (_, icon) => ({ weight, ...props }) => React.createElement('svg', { ...props, 'data-icon': String(icon) }) });
  if (id === '@/components/planner/profile/profile-editor') return { ProfileEditor: () => null };
  if (id === '@/lib/planner-business') return { usePlannerProfile: () => profile, usePlannerVerified: () => false, usePlannerInquiries: () => inquiries, savePlannerInquiry() { throw Error('Do not change inquiries'); } };
  if (id === '@/lib/planner-vendor-replies') return { usePlannerVendorReplies: () => replies, markVendorReplyRead: id => readIds.push(id) };
  if (id === '@/lib/planner-events') return { ...original.call(this, path.join(root, 'src/lib/planner-events.ts'), parent, main), usePlannerEvents: () => events };
  if (id === '@/lib/planner-budget') return { ...original.call(this, path.join(root, 'src/lib/planner-budget.ts'), parent, main), useBudgetStore: () => ({ items: [], groups: [] }), legacyBudgetItems: () => [] };
  if (id.startsWith('@/')) id = path.join(root, 'src', id.slice(2));
  return original.call(this, id, parent, main);
};
for (const extension of ['.ts', '.tsx']) Module._extensions[extension] = (mod, file) => mod._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: 1, target: 9, jsx: 4, esModuleInterop: true } }).outputText, file);
const { localEventToday } = require('../src/lib/event-weather.ts'), { overviewEventType, overviewEventTypes } = require('../src/lib/overview-event-types.ts');
const { samplePlannerProfile } = require('../src/lib/planner-profile-types.ts');
const { DashboardEventCard, asDashboardEvent } = require('../src/components/planner/upcoming-events.tsx');
const { PlannerProfileCard } = require('../src/components/planner/planner-profile.tsx');
const { AttentionQueue } = require('../src/components/planner/attention-queue.tsx');
const { AttentionActionRow } = require('../src/components/planner/attention-action-row.tsx');
const { attentionExamples } = require('../src/components/planner/attention-queue-items.ts');
const { AttentionListDialog, VendorReplyDialog } = require('../src/components/planner/attention-list-dialog.tsx');
const today = localEventToday(), day = offset => { const date = new Date(`${today}T12:00:00Z`); date.setUTCDate(date.getUTCDate() + offset); return date.toISOString().slice(0, 10); };
const event = (id, count = 6) => ({ id, name: `Event ${id}`, type: 'Wedding', date: day(3), startTime: '12:00', endTime: '16:00', timeZone: 'Africa/Lagos', city: 'Example City', location: 'Private venue name', image: '/example.jpg', clientName: '', currency: 'NGN', budget: '', description: '', guestCount: '', createdAt: new Date().toISOString(), notes: '', sections: { tasks: Array.from({ length: count }, (_, i) => ({ id: `${id}-task-${i}`, title: `Task ${i}`, status: 'todo', dueDate: day(i - 1) })), expenses: [], proposal: [], moodboard: [], agenda: [], decisions: [], files: [] } });
events = [event('a'), event('b', 2), { ...event('cancelled'), cancelledAt: new Date().toISOString() }];
const snapshot = JSON.stringify(events[0]), card = asDashboardEvent(events[0]);
assert.equal(card.nextTaskId, 'a-task-0'); assert.equal(card.nextTaskOverdue, true); assert.equal(card.dateISO, day(3)); assert.equal(card.weatherCity, 'Example City'); assert(!card.weatherCity.includes('Private venue')); assert.equal(JSON.stringify(events[0]), snapshot);
const markup = renderToStaticMarkup(React.createElement(DashboardEventCard, { event: card }));
assert(markup.includes('Open event')); assert(markup.includes('section=tasks&amp;action=add-task')); assert(markup.includes('section=notes&amp;action=write')); assert(markup.includes('Overdue')); assert(markup.includes('text-error')); assert(markup.indexOf('Next task') < markup.indexOf('Actions for'));
const complete = asDashboardEvent({ ...events[0], sections: { ...events[0].sections, tasks: [{ id: 'done', title: 'Done', status: 'completed' }] } }); assert.equal(complete.tasksComplete, true); assert(!complete.nextTaskId);
const cancelledCard = renderToStaticMarkup(React.createElement(DashboardEventCard, { event: asDashboardEvent(events[2]) })); assert(!cancelledCard.includes('section=tasks&amp;action=add-task'));
assert.deepEqual(overviewEventTypes.map(type => type.label), ['Wedding', 'Corporate', 'Party', 'Mixed', 'Other']); assert.deepEqual(overviewEventTypes.map(type => type.color), ['#10b981', '#2dbcf0', '#ff8b2d', '#7c3aed', '#9ca3af']);
for (const [value, key] of [['White wedding', 'wedding'], ['Conference', 'corporate'], ['Private party', 'party'], ['Corporate & Wedding', 'mixed'], ['Mixed', 'mixed'], ['Unrecognized', 'other']]) assert.equal(overviewEventType(value).key, key);
profile = { ...samplePlannerProfile, slug: 'example-events', reviews: [] };
assert(renderToStaticMarkup(React.createElement(PlannerProfileCard)).includes('No reviews yet'));
profile = { ...profile, reviews: [{ id: '1', rating: 5 }, { id: '2', rating: 4 }, { id: 'bad', rating: NaN }] };
const profileHtml = renderToStaticMarkup(React.createElement(PlannerProfileCard)); assert(profileHtml.includes('4.5')); assert(profileHtml.includes('2')); assert(profileHtml.includes('reviews')); assert(profileHtml.includes('Copy profile link'));

let slots = [], cursor = 0;
React.useState = initial => { const i = cursor++; if (!(i in slots)) slots[i] = typeof initial === 'function' ? initial() : initial; return [slots[i], value => { slots[i] = typeof value === 'function' ? value(slots[i]) : value; }]; };
React.useRef = initial => { const i = cursor++; if (!(i in slots)) slots[i] = { current: initial }; return slots[i]; };
React.useEffect = () => {}; React.useSyncExternalStore = (_, read) => read();
const walk = node => !node || typeof node !== 'object' ? [] : [node, ...[node.props?.children].flat(Infinity).flatMap(walk)];
const text = node => (node == null || typeof node === 'boolean' ? '' : typeof node !== 'object' ? String(node) : [node.props?.children].flat(Infinity).map(text).join(' ')).replace(/\s+/g, ' ').trim();
const draw = () => { cursor = 0; return walk(AttentionQueue()); };
const flush = () => new Promise(resolve => setImmediate(resolve));
const reply = (id, eventId, status = 'unread') => ({ id, eventId, status, vendor: 'Synthetic vendor', subject: `Reply ${id}`, message: 'A fixture response.', createdAt: new Date().toISOString() });
replies = [reply('one', 'a'), reply('two', 'b'), reply('cancelled', 'cancelled'), reply('old', 'a', 'read')];
async function run() {
  assert.equal(draw().filter(node => node.props.role === 'tab').length, 4); assert.equal(draw().filter(node => node.type === AttentionActionRow).length, 8, 'All tasks are available inside the card');
  const panel = draw().find(node => node.props.role === 'tabpanel');
  assert(panel.props.className.includes('overflow-y-auto')); assert(panel.props.className.includes('overscroll-contain')); assert.equal(panel.props.tabIndex, 0, 'List can be scrolled with the keyboard');
  assert(draw().find(node => node.type === 'section').props.className.includes('h-[680px]'), 'Card stays bounded instead of growing with the full list');
  assert(draw().find(node => node.type === 'section').props.className.includes('min-h-0'), 'Grid content cannot force the card taller than its height');
  assert(!/Showing 4|next four/.test(text(draw())));
  for (const node of draw().filter(node => node.type === AttentionActionRow)) {
    const html = renderToStaticMarkup(React.createElement(AttentionActionRow, node.props));
    assert(html.includes('View task')); assert(!html.includes('type="checkbox"')); assert(!html.includes('Mark complete:')); assert(!/>Complete</.test(html));
  }
  draw().find(node => node.props['aria-label'] === 'See all upcoming tasks').props.onClick(); assert.equal(draw().find(node => node.type === AttentionListDialog).props.items.length, 8); draw().find(node => node.type === AttentionListDialog).props.onClose();
  const allTasks = draw().find(node => node.type === AttentionListDialog);
  const dialogRows = walk(AttentionListDialog({ ...allTasks.props, open: true })).filter(node => node.type === AttentionActionRow);
  assert.equal(dialogRows.length, 8);
  for (const node of dialogRows) {
    const html = renderToStaticMarkup(React.createElement(AttentionActionRow, node.props));
    assert(!html.includes('type="checkbox"')); assert(!/>Complete</.test(html)); assert(html.includes('View task'));
  }
  draw().find(node => node.props.ariaLabel === 'Filter attention by event').props.onValueChange('a'); assert.equal(draw().find(node => node.type === AttentionListDialog).props.items.length, 6);
  for (const tab of ['payments', 'inquiries', 'vendors', 'tasks']) { draw().find(node => node.props.id === `attention-${tab}`).props.onClick(); assert(draw().some(node => node.type === 'button' && /^See all /.test(node.props['aria-label'] || ''))); }
  draw().find(node => node.props.id === 'attention-vendors').props.onClick(); const vendorRows = draw().filter(node => node.type === AttentionActionRow); assert.equal(vendorRows.length, 1); assert.equal(vendorRows[0].props.item.id, 'one'); vendorRows[0].props.onOpen(vendorRows[0].props.item); draw().find(node => node.type === VendorReplyDialog).props.onRead(); assert.deepEqual(readIds, ['one']);
  draw().find(node => node.props.ariaLabel === 'Filter attention by event').props.onValueChange('all'); assert.equal(draw().filter(node => node.type === AttentionActionRow).length, 2); assert(!draw().some(node => node.type === 'input' && ['date', 'month'].includes(node.props.type)));
  replies = []; assert.equal(draw().filter(node => node.type === AttentionActionRow).length, 0); assert(draw().some(node => text(node).includes('messaging feed is connected')));
  for (const tab of ['payments', 'inquiries']) {
    draw().find(node => node.props.id === `attention-${tab}`).props.onClick();
    assert(!/sample|demo|examples only|preview only/i.test(text(draw())));
    for (const item of attentionExamples(today)[tab]) assert(!/sample|demo/i.test(`${item.title} ${item.context} ${item.detail}`));
  }
  let copied; global.window = { location: { origin: 'https://example.test' }, localStorage: { getItem() { return null; } } }; Object.defineProperty(global, 'navigator', { configurable: true, value: { clipboard: { writeText: async value => { copied = value; } } } });
  slots = []; const profileDraw = () => { cursor = 0; return walk(PlannerProfileCard()); };
  await profileDraw().find(node => text(node) === 'Copy profile link' && node.props.onClick).props.onClick(); await flush(); assert.equal(copied, 'https://example.test/planners/example-events'); assert(profileDraw().some(node => text(node) === 'Profile link copied'));
  slots = []; navigator.clipboard.writeText = async () => { throw Error('Blocked'); }; await profileDraw().find(node => text(node) === 'Copy profile link' && node.props.onClick).props.onClick(); await flush(); assert(profileDraw().some(node => node.props.role === 'alert'));
  const taskSource = fs.readFileSync(path.join(root, 'src/components/planner/task-workspace.tsx'), 'utf8'); assert(taskSource.includes('initialAction === "add-task"')); assert(taskSource.includes('onActionConsumed'));
  const storage = new Map(); let fail = false; window.localStorage = { getItem: key => storage.get(key) || null, setItem(key, value) { if (fail) throw Error('Storage full'); storage.set(key, value); } }; window.dispatchEvent = () => {};
  const store = require('../src/lib/planner-vendor-replies.ts'); storage.set(store.vendorReplyStorageKey, JSON.stringify([reply('record', 'a'), { id: 'invalid' }])); assert.equal(store.usePlannerVendorReplies().length, 1); const originalData = storage.get(store.vendorReplyStorageKey); fail = true; assert.throws(() => store.markVendorReplyRead('record'), /Storage full/); assert.equal(storage.get(store.vendorReplyStorageKey), originalData); fail = false; store.markVendorReplyRead('record'); assert.equal(store.usePlannerVendorReplies()[0].status, 'read');
  console.log('PASS: overdue next-task strip and quick actions; four attention tabs; filtered See all lists; no date-range control; cancelled-event isolation; honest vendor empty state and read action; real review averages; profile clipboard success/failure; five event colours and immutable source records. Fixtures only.');
}
run().catch(error => { console.error(error); process.exitCode = 1; });
