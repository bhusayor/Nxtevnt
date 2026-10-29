// Synthetic calendar records and hook state only; no storage or network writes.
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), Module = require('node:module'), ts = require('typescript'), React = require('react');
const root = path.resolve(__dirname, '..'), original = Module._load;
let events = [], slots = [], cursor = 0, effects = [];
function DayEvents() { return null; }
function Select() { return null; }
function Tooltip() { return null; }
Module._load = function(id, parent, main) {
  if (id === '@/components/ui/icons') return new Proxy({}, { get: (_, name) => props => React.createElement('svg', { ...props, 'data-icon': String(name) }) });
  if (id === '@/components/planner/lineup-day-events') return { LineupDayEvents: DayEvents };
  if (id === '@/components/ui/select') return { Select };
  if (id === '@/components/ui/tooltip') return { Tooltip };
  if (id === '@/lib/event-weather') return { localEventToday: () => '2026-10-26' };
  if (id === '@/lib/planner-events') return { ...original.call(this, path.join(root, 'src/lib/planner-events.ts'), parent, main), usePlannerEvents: () => events };
  if (id.startsWith('@/')) id = path.join(root, 'src', id.slice(2));
  return original.call(this, id, parent, main);
};
for (const ext of ['.ts', '.tsx']) Module._extensions[ext] = (mod, file) => mod._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: 1, target: 9, jsx: 4, esModuleInterop: true } }).outputText, file);
const { lineupYear } = require('../src/lib/event-lineup.ts');
const { EventLineup } = require('../src/components/planner/event-lineup.tsx');
const record = (id, date, type = 'Wedding') => ({ id, name: id, date, type, startTime: '12:00' });
events = [record('jan', '2026-01-01'), record('oct1', '2026-10-26'), record('oct2', '2026-10-26', 'Corporate'), record('oct3', '2026-10-26', 'Party'), record('oct4', '2026-10-26', 'Mixed'), record('dec', '2026-12-31', 'Custom celebration'), record('next', '2027-01-01'), record('last', '2025-12-31'), record('leap', '2024-02-29'), record('invalid', '2026-02-30'), { ...record('cancelled', '2026-10-26'), cancelledAt: '2026-01-01' }];
const snapshot = JSON.stringify(events), data = lineupYear(events, 2026);
assert.equal(data.months.length, 12);
assert.deepEqual([data.months[0].month, data.months[11].month], ['2026-01', '2026-12']);
assert.equal(data.events.length, 6);
assert.equal(data.max, 4);
assert.deepEqual(data.months[9].values, [1, 1, 1, 1]);
assert.deepEqual(data.months[11].values, [0, 0, 0, 1]);
for (const month of data.months) assert.equal(month.values.reduce((a, b) => a + b, 0), month.entries.length);
assert.equal(lineupYear(events, 2024).months[1].entries.length, 1);
assert.equal(lineupYear(events, 2028).max, 1);
assert.equal(JSON.stringify(events), snapshot);
React.useState = initial => { const i = cursor++; if (!(i in slots)) slots[i] = typeof initial === 'function' ? initial() : initial; return [slots[i], value => { slots[i] = typeof value === 'function' ? value(slots[i]) : value; }]; };
React.useRef = initial => { const i = cursor++; if (!(i in slots)) slots[i] = { current: initial }; return slots[i]; };
React.useEffect = effect => { effects.push(effect); };
const walk = node => !node || typeof node !== 'object' ? [] : [node, ...[node.props?.children].flat(Infinity).flatMap(walk)];
const text = node => node == null || typeof node === 'boolean' ? '' : typeof node !== 'object' ? String(node) : [node.props?.children].flat(Infinity).map(text).join(' ');
function draw() { cursor = 0; effects = []; const nodes = walk(EventLineup()); effects.forEach(effect => effect()); return nodes; }
function find(label) { const node = draw().find(node => (node.props['aria-label'] || node.props.ariaLabel) === label); assert(node, label); return node; }
function click(label) { const node = find(label); assert(!node.props.disabled, label + ' enabled'); node.props.onClick(); }
function monthButtons() { return draw().filter(node => node.type === 'button' && node.props['aria-label']?.endsWith('Open calendar.')); }
function assertLegend() { const legend = find('Event type legend'); assert.deepEqual(walk(legend).filter(node => node.props.className === 'inline-flex items-center gap-1.5').map(text).map(value => value.trim()), ['Wedding', 'Corporate', 'Party', 'Other']); }
assert.equal(monthButtons().length, 12);
assertLegend();
assert(!draw().some(node => node.type === 'input' && node.props.type === 'month'));
assert(!draw().some(node => node.props.role === 'tab'));
function viewButton(label) { const button = walk(find('Lineup view')).find(node => node.type === 'button' && text(node).trim() === label); assert(button, label); return button; }
assert.equal(viewButton('Chart').props['aria-pressed'], true);
viewButton('Calendar').props.onClick();
assert.equal(viewButton('Calendar').props['aria-pressed'], true);
assert.equal(find('Calendar month').props.value, '2026-10', 'Calendar starts at the current month');
find('Calendar month').props.onValueChange('2026-12');
viewButton('Chart').props.onClick();
assert.equal(monthButtons().length, 12);
viewButton('Calendar').props.onClick();
assert.equal(find('Calendar month').props.value, '2026-12', 'View switching preserves the selected month');
viewButton('Chart').props.onClick();
click('October 2026: 4 events. Open calendar.');
assert.equal(find('Calendar month').props.value, '2026-10');
assertLegend();
assert.equal(draw().find(node => node.type === DayEvents).props.events.length, 4);
const day = draw().find(node => node.type === 'button' && node.props['aria-current'] === 'date');
assert(day.props['aria-label'].includes('4 events'));
assert.equal(walk(day).filter(node => node.props.style?.backgroundColor).length, 3, 'At most three dots, one per event');
const dotColors = walk(day).filter(node => node.props.style?.backgroundColor).map(node => node.props.style.backgroundColor);
assert.deepEqual(dotColors, ['#10b981', '#2dbcf0', '#ff8b2d']);
const originalEvents = events;
events = events.map(event => event.date === '2026-10-26' ? { ...event, type: 'Wedding' } : event);
const sameTypeDay = find('26 October 2026, 4 events');
assert.deepEqual(walk(sameTypeDay).filter(node => node.props.style?.backgroundColor).map(node => node.props.style.backgroundColor), ['#10b981', '#10b981', '#10b981'], 'Dots represent events, including multiple events of the same type');
events = originalEvents;
click('1 October 2026, 0 events');
assert.equal(draw().find(node => node.type === DayEvents).props.events.length, 0);
click('26 October 2026, 4 events');
assert.deepEqual(draw().find(node => node.type === DayEvents).props.events.map(event => event.id), ['oct1', 'oct2', 'oct3', 'oct4'], 'Selecting a date shows all events, even beyond the dot limit');
click('Next calendar month');
assert.equal(find('Calendar month').props.value, '2026-11');
assert.equal(draw().find(node => node.type === DayEvents).props.events.length, 0);
find('Calendar month').props.onValueChange('2026-12');
assert(find('Next calendar month').props.disabled);
click('Back to 2026 year chart');
assert.equal(monthButtons().length, 12);
let focused = false;
const december = find('December 2026: 1 event. Open calendar.');
december.props.ref({ focus(options) { focused = options.preventScroll; } });
december.props.onClick(); click('Back to 2026 year chart'); draw(); assert(focused, 'Back returns keyboard focus to the month bar');
click('Next lineup year');
assert.equal(monthButtons().length, 12);
assert(find('January 2027: 1 event. Open calendar.'));
draw().find(node => node.type === 'button' && text(node).trim() === 'This year').props.onClick();
assert(find('January 2026: 1 event. Open calendar.'));
click('Previous lineup year'); click('Previous lineup year');
click('February 2024: 1 event. Open calendar.');
assert.equal(draw().filter(node => node.type === 'button' && node.props['aria-label']?.includes('February 2024,')).length, 29);
find('Calendar month').props.onValueChange('2024-01'); assert(find('Previous calendar month').props.disabled);
click('Next lineup year'); assert(find('2025 event chart, all twelve months'));
slots[0] = 1900; assert(find('Previous lineup year').props.disabled);
slots[0] = 2200; assert(find('Next lineup year').props.disabled);
events = []; slots = []; assert.equal(monthButtons().length, 12); assert(/No events in\s+2026/.test(text(draw()[0])));
assert.equal(JSON.stringify(data.events), JSON.stringify(JSON.parse(snapshot).filter(event => ['jan', 'oct1', 'oct2', 'oct3', 'oct4', 'dec'].includes(event.id))));
console.log('PASS: twelve-month year chart, four exclusive types, legacy mapping, year/month navigation, leap days, dot limit, quick look, back focus and empty years. Synthetic records only.');
