// Memory fixtures only: no real accounts, inquiries, payments or storage writes.
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), Module = require('node:module');
const root = path.resolve(__dirname, '..'), ts = require('typescript'), React = require('react'), { renderToStaticMarkup } = require('react-dom/server');
const original = Module._load, slots = []; let cursor = 0;
const selectRoot = () => null;
let events = [], inquiries = [], items = [];
Module._load = function(id, parent, main) {
  if (id === 'next/link') return ({ children, ...props }) => React.createElement('a', props, children);
  if (id === '@radix-ui/react-select') return new Proxy({}, { get: (_, name) => name === 'Root' ? selectRoot : () => null });
  if (id === '@/components/ui/icons') return new Proxy({}, { get: () => ({ weight, ...props }) => React.createElement('svg', props) });
  if (id === '@/lib/planner-events') return { ...original.call(this, path.join(root, 'src/lib/planner-events.ts'), parent, main), usePlannerEvents: () => events };
  if (id === '@/lib/planner-business') return { usePlannerInquiries: () => inquiries };
  if (id === '@/lib/planner-budget') return { ...original.call(this, path.join(root, 'src/lib/planner-budget.ts'), parent, main), useBudgetStore: () => ({ items, groups: [] }), legacyBudgetItems: () => [] };
  if (id === '@/lib/planner-dashboard') { const real = original.call(this, path.join(root, 'src/lib/planner-dashboard.ts'), parent, main); return { ...real, dashboardPeriod: preset => real.dashboardPeriod(preset, new Date('2026-10-26T12:00:00Z')) }; }
  if (id.startsWith('@/')) id = path.join(root, 'src', id.slice(2));
  return original.call(this, id, parent, main);
};
for (const extension of ['.ts', '.tsx']) Module._extensions[extension] = (mod, file) => mod._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: 1, target: 9, jsx: 4, esModuleInterop: true } }).outputText, file);
React.useState = initial => { const i = cursor++; if (!(i in slots)) slots[i] = typeof initial === 'function' ? initial() : initial; return [slots[i], value => { slots[i] = typeof value === 'function' ? value(slots[i]) : value; }]; };
const { WorkSnapshot } = require('../src/components/planner/work-snapshot.tsx');
const { OverviewMetricCard } = require('../src/components/planner/overview-metric-card.tsx');
const walk = node => !node || typeof node !== 'object' ? [] : [node, ...[node.props?.children].flat(Infinity).flatMap(walk)];
const draw = () => { cursor = 0; return walk(WorkSnapshot()); };
const cards = () => draw().filter(n => n.type === OverviewMetricCard);
const counts = () => Object.fromEntries(cards().map(n => [n.props.label, n.props.value]));
const task = (id, dueDate, status = 'todo') => ({ id, title: id, dueDate, status });
events = [{ id: 'a', name: 'Event A', date: '2026-10-30', sections: { tasks: [task('past', '2026-10-03'), task('future', '2026-10-29'), task('later', '2026-11-07'), task('complete', '2026-10-01', 'completed')], expenses: [] } }, { id: 'b', date: '2026-11-07', sections: { tasks: [], expenses: [] } }, { id: 'cancelled', date: '2026-10-01', cancelledAt: '2026-09-01', sections: { tasks: [task('ignore', '2026-10-01')], expenses: [] } }];
const payment = (id, date, change = {}) => ({ id, eventId: 'a', name: id, vendor: 'Vendor', currency: 'NGN', vendorStatus: 'booked', status: 'upcoming', budgeted: 1000, invoiced: 1000, paid: 0, installments: [], paymentDate: date, ...change });
items = [payment('past', '2026-10-03'), payment('future', '2026-10-29'), payment('later', '2026-11-07'), payment('paid', '2026-10-01', { paid: 1000 }), payment('cancelled-event', '2026-10-01', { eventId: 'cancelled' })];
inquiries = [{ id: 'old-client', senderType: 'client', createdAt: '2020-01-01T10:00:00Z', status: 'open' }, { id: 'old-vendor', senderType: 'vendor', createdAt: '2024-01-01T10:00:00Z', status: 'open' }, { id: 'legacy', createdAt: '2026-10-26T10:00:00Z', status: 'open' }, { id: 'closed', createdAt: '2026-10-26T10:00:00Z', status: 'closed' }];
const snapshot = JSON.stringify({ events, inquiries, items });
assert.deepEqual(counts(), { Events: 1, 'Open tasks': 2, 'Vendor payments due': 2, 'Open inquiries': 3 });
const expected = ['/planner/events', '/planner/tasks', '/planner/budget/payments', '/planner/inquiries'];
cards().forEach((node, i) => {
  assert.equal(node.props.href, expected[i]);
  const html = renderToStaticMarkup(React.createElement(OverviewMetricCard, { ...node.props, animate: false }));
  assert(html.startsWith(`<a href="${expected[i]}"`), 'The whole card is a native link');
  assert.equal((html.match(/<a /g) || []).length, 1, 'No nested interactive elements');
  assert(html.includes('focus-visible:outline')); assert(html.includes('hover:border'));
});
const inquiry = cards().find(n => n.props.label === 'Open inquiries');
assert.equal(inquiry.props.badge, 'All open'); assert.equal(inquiry.props.detail, 'Active client and vendor inquiries'); assert.equal(inquiry.props.supportingText, undefined);
assert(!renderToStaticMarkup(React.createElement(OverviewMetricCard, { ...inquiry.props, animate: false })).includes('Not affected by the date range'));
assert.equal(cards().find(n => n.props.label === 'Vendor payments due').props.detail, 'Due in this period');
for (const preset of ['week', 'year', 'all', 'custom']) {
  draw().find(n => n.type === selectRoot).props.onValueChange(preset);
  assert.equal(counts()['Open inquiries'], 3, 'All open inquiries ignore every date preset');
}
const dates = draw().filter(n => n.type === 'input');
dates[0].props.onChange({ target: { value: '2026-11-01' } }); dates[1].props.onChange({ target: { value: '2026-11-30' } });
assert.deepEqual(counts(), { Events: 1, 'Open tasks': 1, 'Vendor payments due': 1, 'Open inquiries': 3 });
draw().find(n => n.props?.['aria-label'] === 'Overview start date').props.onChange({ target: { value: '2026-12-31' } });
assert.deepEqual(counts(), { Events: '—', 'Open tasks': '—', 'Vendor payments due': '—', 'Open inquiries': 3 });
assert.equal(JSON.stringify({ events, inquiries, items }), snapshot, 'Navigation and counts never mutate source records');
const plain = renderToStaticMarkup(React.createElement(OverviewMetricCard, { label: 'Other metric', value: 1, detail: 'Unchanged', icon: () => null, animate: false }));
assert(plain.startsWith('<div')); assert(!plain.includes('<a '));
for (const file of ['src/app/planner/inquiries/page.tsx', 'src/app/planner/budget/payments/page.tsx']) assert(fs.existsSync(path.join(root, file)), 'Card has a real page destination');
console.log('PASS: full-card links, real destinations, future/outstanding period payments, all-open client/vendor/legacy inquiries independent of every preset and invalid custom dates, focus styles and untouched metric consumers. Memory fixtures only.');
