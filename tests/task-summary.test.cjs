// Read-only synthetic task fixtures. No user records, storage writes or network calls.
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), Module = require('node:module');
const ts = require('typescript'), React = require('react'), root = path.resolve(__dirname, '..'), originalLoad = Module._load;
const stub = () => null;
Module._load = function(id, parent, main) {
  if (id === '@/components/ui/icons') return new Proxy({}, { get: () => stub });
  if (id === '@/lib/planner-team') return { usePlannerTeam: () => [] };
  if (id === './use-task-plan-drag') return { useTaskPlanDrag: () => ({ drop: () => ({}), highlight: () => '', drag: null }) };
  if (id.startsWith('@/')) id = path.join(root, 'src', id.slice(2));
  return originalLoad.call(this, id, parent, main);
};
for (const ext of ['.ts', '.tsx']) Module._extensions[ext] = (mod, file) => mod._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: 1, target: 9, jsx: 4, esModuleInterop: true } }).outputText, file);
const { taskSummary, milestoneSummary } = require('../src/lib/task-summary.ts');
const { TaskSummary } = require('../src/components/planner/task-summary.tsx');
const { TaskPlanSummary } = require('../src/components/planner/task-plan-summary.tsx');
const { MilestoneSummary } = require('../src/components/planner/milestone-summary.tsx');
const { OverviewMetricCard } = require('../src/components/planner/overview-metric-card.tsx');
const { TaskWorkspace } = require('../src/components/planner/task-workspace.tsx');
const { TaskKanbanBoard } = require('../src/components/planner/task-kanban-board.tsx');
const { localEventToday } = require('../src/lib/event-weather.ts');
const { renderToStaticMarkup } = require('react-dom/server');
const today = '2026-10-23';
const tasks = [
  { id: 'todo-old', title: 'Confirm venue', status: 'todo', dueDate: '2026-10-22' },
  { id: 'todo-today', title: 'Send brief', status: 'todo', dueDate: today },
  { id: 'todo-no-date', title: 'Choose linens', status: 'todo' },
  { id: 'progress-old', title: 'Review menu', status: 'in-progress', dueDate: '2026-10-21' },
  { id: 'progress-future', title: 'Draft schedule', status: 'in-progress', dueDate: '2026-10-24' },
  { id: 'blocked-old', title: 'Await client decision', status: 'blocked', dueDate: '2026-10-20' },
  { id: 'done-old', title: 'Book photographer', status: 'completed', dueDate: '2026-10-19' },
];
const snapshot = JSON.stringify(tasks);
const summary = taskSummary(tasks, today);
assert.equal(summary.total, 7);
assert.deepEqual(summary.counts, { todo: 3, 'in-progress': 2, blocked: 1, completed: 1 });
assert.equal(Object.values(summary.counts).reduce((sum, count) => sum + count, 0), summary.total);
assert.equal(summary.overdue, 3); assert.deepEqual(summary.overdueByStatus, { todo: 1, 'in-progress': 1, blocked: 1, completed: 0 });
assert.equal(JSON.stringify(tasks), snapshot);
assert.equal(taskSummary([{ title: 'Due today', dueDate: today }], today).overdue, 0);
assert.equal(taskSummary([{ title: 'Invalid date', dueDate: '2026-02-30' }, { title: 'Bad date', dueDate: 'not-a-date' }], today).overdue, 0);
assert.deepEqual(taskSummary([{ title: 'Legacy ongoing', status: 'ongoing' }, { title: 'Legacy review', status: 'review' }, { title: 'Legacy done', done: true }, { title: 'Legacy to do' }], today).counts, { todo: 1, 'in-progress': 2, blocked: 0, completed: 1 });
assert.equal(taskSummary([{ title: 'Archived', status: 'archived' }, { title: 'Cancelled', status: 'canceled' }], today).total, 0);

const walk = node => !node || typeof node !== 'object' ? [] : Array.isArray(node) ? node.flatMap(walk) : [node, ...walk(node.props?.children)];
const text = node => node == null || typeof node === 'boolean' ? '' : typeof node === 'string' || typeof node === 'number' ? String(node) : Array.isArray(node) ? node.map(text).join(' ') : text(node.props?.children);
let nodes = walk(TaskSummary({ tasks, today }));
let cards = nodes.filter(n => n.type === OverviewMetricCard);
assert.equal(cards.length, 5); assert.deepEqual(cards.map(n => n.props.label), ['To do', 'In progress', 'Blocked', 'Completed', 'Overdue']);
assert.deepEqual(cards.map(n => n.props.value), [3, 2, 1, 1, 3]); assert(cards.every(n => n.props.readable));
assert(cards.every(n => n.props.animate === false), 'Summary counts and entry animations do not replay during panel swaps');
assert(!nodes.some(n => n.type === 'h2')); assert(!text(nodes).includes('Overdue tasks are also counted in their status.'));
assert.equal(text(cards[0].props.detail).replace(/\s+/g, ' '), '1 overdue'); assert.equal(text(cards[1].props.detail).replace(/\s+/g, ' '), '1 overdue');
assert.equal(cards[4].props.tone, 'rose'); assert(cards[4].props.className.includes('bg-[#fff8f7]'));
assert(cards.every(n => n.props.detail.props.className.includes('whitespace-nowrap') && !n.props.detail.props.className.includes('truncate') && !n.props.detail.props.title));
assert.deepEqual(cards.map(n => text(n.props.detail)), ['1 overdue', '1 overdue', 'Awaiting input', 'All done', 'Past due']);
assert(cards.every(n => text(n.props.detail).trim().split(/\s+/).length === 2));
const taskOverdueStyle = cards[4].props.detailClassName;
assert(cards[4].props.detailClassName.includes('bg-[#fbe5e8]')); assert(cards[4].props.detailClassName.includes('text-[#963e4e]'));
const luminance = hex => { const [r, g, b] = hex.match(/\w\w/g).map(part => parseInt(part, 16) / 255).map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4); return .2126 * r + .7152 * g + .0722 * b; };
assert((luminance('fbe5e8') + .05) / (luminance('963e4e') + .05) >= 4.5, 'Rose footer text has readable normal-text contrast');
assert(!cards.some(n => n.props.label === 'Total'));
for (const count of [0, 1, 16]) {
  const fixture = Array.from({ length: count }, (_, index) => ({ id: String(index), title: 'Task', status: 'todo' }));
  const html = renderToStaticMarkup(React.createElement(TaskSummary, { tasks: fixture, today }));
  assert(!html.includes('<h2')); assert(!html.includes('Overdue tasks are also counted')); assert(!html.includes('task-summary-heading'));
  assert(html.includes('Awaiting input')); assert(html.includes('All done')); assert(!html.includes('truncate')); assert(!html.includes('…')); assert(!html.includes('...'));
  assert(!html.includes('NaN')); assert(html.includes('text-sm leading-5')); assert(html.includes('@4xl:grid-cols-5'));
}
nodes = walk(TaskSummary({ tasks, today, compact: true }));
assert.equal(nodes.filter(n => n.type === 'dt').length, 5); assert(!nodes.some(n => n.type === OverviewMetricCard));
assert(!nodes.some(n => n.type === 'h2')); assert(!text(nodes).includes('Overdue is included in the statuses.'));
assert(text(nodes).includes('Overdue')); assert(!/\d+ overdue/.test(text(nodes)), 'Compact pills show the status count only, without an extra overdue annotation'); assert(!text(nodes).includes('Upcoming')); assert(!text(nodes).includes('Ongoing'));
assert.deepEqual(nodes.filter(n => n.type === 'dd').map(text), ['3', '2', '1', '1', '3']);
assert(!nodes.some(n => n.props?.role === 'progressbar'), 'The previous five-pill compact layout is restored without a completion bar');
assert.equal(nodes.filter(n => n.type === 'div' && n.props?.className?.includes('min-h-11') && n.props.className.includes('rounded-xl border')).length, 5);
const groups = [{ id: 'done', title: 'Done', dueDate: '2026-01-01' }, { id: 'late', title: 'Late' }, { id: 'open', title: 'Open', dueDate: '2026-12-01' }, { id: 'empty', title: 'Empty' }, { id: 'target', title: 'Past target', dueDate: '2026-10-22' }];
const milestoneTasks = [{ title: 'Finished', groupId: 'done', status: 'completed', dueDate: '2026-01-01' }, { title: 'Late task', groupId: 'late', status: 'blocked', dueDate: '2026-10-22' }, { title: 'Future', groupId: 'open', status: 'todo', dueDate: '2026-11-01' }, { title: 'Unassigned', status: 'todo', dueDate: '2026-01-01' }];
assert.deepEqual(milestoneSummary(groups, milestoneTasks, today), { total: 5, open: 4, completed: 1, overdue: 2 });
assert.deepEqual(milestoneSummary([], milestoneTasks, today), { total: 0, open: 0, completed: 0, overdue: 0 });
assert.deepEqual(milestoneSummary([{ id: 'bad', title: 'Invalid', dueDate: '2026-02-30' }], [], today), { total: 1, open: 1, completed: 0, overdue: 0 });
const milestoneNodes = walk(MilestoneSummary({ groups, tasks: milestoneTasks, today }));
assert(!milestoneNodes.some(n => n.type === 'h2')); assert(!text(milestoneNodes).includes('Your milestones')); assert(!text(milestoneNodes).includes('Overdue milestones are also counted as open.'));
cards = milestoneNodes.filter(n => n.type === OverviewMetricCard);
assert.deepEqual(cards.map(n => n.props.label), ['Total milestones', 'Open', 'Completed', 'Overdue']);
assert.deepEqual(cards.map(n => n.props.value), [5, 4, 1, 2]);
assert(cards.every(n => n.props.animate === false));
assert.deepEqual(cards.map(n => text(n.props.detail)), ['Event stages', 'Work remaining', 'All done', 'Past due']);
assert(cards.every(n => text(n.props.detail).trim().split(/\s+/).length === 2 && n.props.detail.props.className === 'whitespace-nowrap'));
assert.equal(cards[3].props.detailClassName, taskOverdueStyle, 'Milestone and Task overdue footers share the same palette');
const compactTaskOverdue = walk(TaskSummary({ tasks, today, compact: true })).find(n => n.type === 'dt' && text(n) === 'Overdue');
const compactMilestoneOverdue = walk(MilestoneSummary({ groups, tasks: milestoneTasks, today, compact: true })).find(n => n.type === 'dt' && text(n) === 'Overdue');
assert(compactTaskOverdue); assert(compactMilestoneOverdue);
for (const content of [TaskSummary({ tasks, today, compact: true }), MilestoneSummary({ groups, tasks: milestoneTasks, today, compact: true })]) {
  const overdueRow = walk(content).find(n => n.type === 'div' && walk(n).some(child => child.type === 'dt' && text(child) === 'Overdue'));
  assert(overdueRow.props.className.includes('bg-[#fbe5e8]')); assert(overdueRow.props.className.includes('text-[#963e4e]'));
}
assert.equal(walk(MilestoneSummary({ groups, tasks: milestoneTasks, today, compact: true })).filter(n => n.type === 'dt').length, 4);

// Integration: summary always receives the complete event plan, even when list/board filters change.
const hooks = Object.fromEntries(['useState', 'useRef', 'useEffect', 'useLayoutEffect', 'useMemo', 'useCallback'].map(key => [key, React[key]]));
const slots = []; let cursor = 0;
React.useState = initial => { const index = cursor++; if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial; return [slots[index], value => { slots[index] = typeof value === 'function' ? value(slots[index]) : value; }]; };
React.useRef = initial => ({ current: initial }); React.useEffect = () => {}; React.useLayoutEffect = () => {}; React.useMemo = fn => fn(); React.useCallback = fn => fn;
try {
  const event = { id: 'fixture-event', name: 'Fixture event', timeZone: 'Africa/Lagos', taskGroups: [], sections: { tasks } };
  const draw = () => { cursor = 0; return walk(TaskWorkspace({ event })); };
  nodes = draw();
  assert.equal(nodes.filter(n => n.type === TaskPlanSummary).length, 1);
  assert.strictEqual(nodes.find(n => n.type === TaskPlanSummary).props.tasks, tasks);
  assert.equal(nodes.find(n => n.type === TaskPlanSummary).props.today, localEventToday('Africa/Lagos'));
  nodes.find(n => n.props?.ariaLabel === 'Filter tasks by status').props.onValueChange('blocked');
  nodes = draw(); assert.strictEqual(nodes.find(n => n.type === TaskPlanSummary).props.tasks, tasks);
  nodes.find(n => n.props?.['aria-label'] === 'Kanban board view').props.onClick();
  nodes = draw(); assert.strictEqual(nodes.find(n => n.type === TaskPlanSummary).props.tasks, tasks);
  assert.equal(nodes.find(n => n.type === TaskKanbanBoard).props.tasks.length, 1);
  assert(nodes.some(n => n.props?.ariaLabel === 'Filter Kanban by milestone'));
  assert.equal(JSON.stringify(tasks), snapshot);

  slots.length = 0;
  const planProps = { groups, tasks, today };
  const planDraw = () => { cursor = 0; return walk(TaskPlanSummary(planProps)); };
  nodes = planDraw();
  assert.equal(nodes[0].props['data-expanded-summary'], 'tasks');
  assert.equal(walk(nodes.find(n => n.props?.['aria-label'] === 'Expand milestone summary')).filter(n => n.type === stub).length, 2, 'Compact Milestone retains its right arrow');
  assert.equal(walk(nodes.find(n => n.props?.['aria-label'] === 'Expand task summary')).filter(n => n.type === stub).length, 1, 'Expanded Task has no arrow');
  assert(nodes.find(n => n.props?.['data-summary-layout']).props.className.includes('motion-safe:transition-[grid-template-columns]'));
  assert(nodes[0].props.className.includes('motion-safe:transition-[height]'));
  assert.equal(nodes.find(n => n.type === MilestoneSummary).props.compact, true); assert.equal(nodes.find(n => n.type === TaskSummary).props.compact, false);
  nodes.find(n => n.props?.['aria-label'] === 'Expand milestone summary').props.onClick(); nodes = planDraw();
  assert.equal(nodes[0].props['data-expanded-summary'], 'milestones');
  assert.equal(walk(nodes.find(n => n.props?.['aria-label'] === 'Expand milestone summary')).filter(n => n.type === stub).length, 1, 'Expanded Milestone has no arrow');
  assert.equal(walk(nodes.find(n => n.props?.['aria-label'] === 'Expand task summary')).filter(n => n.type === stub).length, 2, 'Compact Task retains its right arrow');
  assert.equal(nodes.find(n => n.type === MilestoneSummary).props.compact, false); assert.equal(nodes.find(n => n.type === TaskSummary).props.compact, true);
  nodes.find(n => n.props?.['aria-label'] === 'Expand task summary').props.onClick(); nodes = planDraw();
  assert.equal(nodes[0].props['data-expanded-summary'], 'tasks');
  assert(nodes.find(n => n.props?.['aria-label'] === 'Expand task summary').props['aria-expanded']);
  assert.deepEqual(nodes.filter(n => n.type === 'button').map(n => n.props['aria-controls']), ['milestones-summary-panel', 'tasks-summary-panel']);
  assert.equal(JSON.stringify(tasks), snapshot);
  const css = fs.readFileSync(path.join(root, 'src/app/globals.css'), 'utf8'); assert(css.includes('prefers-reduced-motion: reduce')); assert(css.includes('transition-duration: 0.01ms'));
} finally { Object.assign(React, hooks); Module._load = originalLoad; }
console.log('PASS: correct task/milestone counts and overdue overlaps; two-word footers with no ellipses, truncation or hover dependency; shared rose Overdue palette in both views; readable contrast, expansion, empty states and filter-independent counts. Read-only fixtures.');
