// Isolated memory fixtures only. Never changes real milestones, comments or browser storage.
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), Module = require('node:module');
const ts = require('typescript'), React = require('react'), root = path.resolve(__dirname, '..'), originalLoad = Module._load;
const stubs = {}, storage = new Map(), state = new Map(); let active, cursor = 0, fail = false;
const stub = name => stubs[name] ||= Object.assign(() => null, { displayName: name });
Module._load = function(id, parent, main) {
  if (id === '@/components/ui/icons') return new Proxy({}, { get: (_, name) => stub(`Icon.${name}`) });
  if (id === '@radix-ui/react-dialog') return new Proxy({}, { get: (_, name) => stub(`Dialog.${name}`) });
  if (id.startsWith('@/components/ui/')) return new Proxy({}, { get: (_, name) => name === '__esModule' ? true : stub(name) });
  if (id === '@/lib/planner-team') return { usePlannerTeam: () => [] };
  if (id === './use-task-plan-drag') return { useTaskPlanDrag: () => ({ drop: () => ({}), highlight: () => '', drag: null }) };
  if (id.startsWith('@/')) id = path.join(root, 'src', id.slice(2));
  return originalLoad.call(this, id, parent, main);
};
for (const ext of ['.ts', '.tsx']) Module._extensions[ext] = (mod, file) => mod._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: 1, target: 9, jsx: 4, esModuleInterop: true } }).outputText, file);
global.window = { localStorage: { getItem: key => storage.get(key) || null, setItem: (key, value) => { if (fail) throw Error('Storage full'); storage.set(key, value); } }, dispatchEvent() {} };
const hooks = Object.fromEntries(['useState', 'useRef', 'useEffect', 'useMemo', 'useCallback', 'useId'].map(key => [key, React[key]]));
React.useState = initial => { const owner = active, index = cursor++; if (!(index in owner)) owner[index] = typeof initial === 'function' ? initial() : initial; return [owner[index], value => { owner[index] = typeof value === 'function' ? value(owner[index]) : value; }]; };
React.useRef = initial => ({ current: initial }); React.useEffect = () => {}; React.useMemo = fn => fn(); React.useCallback = fn => fn; React.useId = () => 'destination-fixture';
const walk = node => !node || typeof node !== 'object' ? [] : Array.isArray(node) ? node.flatMap(walk) : [node, ...walk(node.props?.children)];
const text = node => node == null || typeof node === 'boolean' ? '' : typeof node === 'string' || typeof node === 'number' ? String(node) : Array.isArray(node) ? node.map(text).join(' ') : text(node.props?.children);
const render = (component, props) => { if (!state.has(component)) state.set(component, []); active = state.get(component); cursor = 0; return walk(component(props)); };
const { TaskWorkspace } = require('../src/components/planner/task-workspace.tsx');
const { TaskMoveDialog } = require('../src/components/planner/task-move-dialog.tsx');
const { TaskDetailDialog } = require('../src/components/planner/task-detail-dialog.tsx');
const { TaskKanbanBoard } = require('../src/components/planner/task-kanban-board.tsx');
const { moveTaskInPlan } = require('../src/lib/planner-task-moves.ts');
const key = 'nxtevnt.planner.events.v1';
const fixture = { id: 'e', name: 'Fixture celebration', date: '2026-12-31', timeZone: 'Africa/Lagos', taskGroups: [{ id: 'venue', title: 'Venue' }, { id: 'design', title: 'Design', description: 'Style the celebration' }, { id: 'day', title: 'Event day' }], sections: { tasks: [
  { id: 't1', title: 'Confirm venue', groupId: 'venue', detail: 'Keep this detail', status: 'blocked', priority: 'high', dueDate: '2026-11-01', assignee: 'Planner A', clientVisible: true, comments: [{ id: 'c1', body: 'Waiting on quote', author: 'Planner A', createdAt: '2026-10-23T08:00:00Z' }] },
  { id: 't2', title: 'Choose flowers', groupId: 'design', status: 'todo' }, { id: 't3', title: 'Unassigned task', status: 'todo' },
], expenses: [], decisions: [], moodboard: [] } };
const read = () => JSON.parse(storage.get(key))[0];
const seed = () => { fail = false; state.clear(); storage.set(key, JSON.stringify([fixture, { ...fixture, id: 'other-event' }])); };
const draw = () => render(TaskWorkspace, { event: read() });
const button = (nodes, label) => { const node = nodes.find(n => n.props?.['aria-label'] === label); assert(node, `Missing ${label}`); return node; };
const openMove = (taskId = 't1') => {
  const row = draw().find(n => n.type?.name === 'TaskRow' && n.props.task.id === taskId); assert(row);
  button(render(row.type, row.props), `Move ${row.props.task.title} to another milestone`).props.onClick();
  const modal = draw().find(n => n.type === TaskMoveDialog); assert(modal); state.delete(TaskMoveDialog); return modal.props;
};
const choose = (props, value) => { const radio = render(TaskMoveDialog, props).find(n => n.type === 'input' && n.props.value === value); assert(radio); assert(!radio.props.disabled); radio.props.onChange(); };
const submit = props => render(TaskMoveDialog, props).find(n => n.type === 'form').props.onSubmit({ preventDefault() {} });

try {
  seed();
  const linkedTaskProps = { event: read(), initialTaskId: 't1' };
  let linkedNodes = render(TaskWorkspace, linkedTaskProps);
  const linkedDetail = linkedNodes.find(n => n.type === TaskDetailDialog);
  assert.equal(linkedDetail.props.task.id, 't1', 'Task links open details first');
  assert(!linkedNodes.some(n => n.type === stubs['Dialog.Root'] && n.props.open), 'The edit form remains closed');
  linkedDetail.props.onEdit(); linkedNodes = render(TaskWorkspace, linkedTaskProps);
  assert(!linkedNodes.some(n => n.type === TaskDetailDialog));
  assert(linkedNodes.some(n => n.type === stubs['Dialog.Root'] && n.props.open), 'Edit remains available from details');
  seed(); linkedNodes = render(TaskWorkspace, { event: read(), initialTaskId: 'missing' });
  assert(!linkedNodes.some(n => n.type === TaskDetailDialog));
  seed(); linkedNodes = render(TaskWorkspace, { event: read(), initialAction: 'add-task' });
  assert(linkedNodes.some(n => n.type === stubs['Dialog.Root'] && n.props.open), 'Add task still opens the composer');
  // Milestone row colours use every active task, independent of filters/collapse.
  const row = nodes => nodes.find(n => n.props?.['data-milestone-state'] && n.props['aria-label'] === 'Venue');
  const colourFixture = taskItems => {
    seed(); const record = read(); record.taskGroups[0].dueDate = '2000-01-01';
    record.sections.tasks = taskItems.map((task, index) => ({ id: `colour-${index}`, title: `Colour task ${index}`, groupId: 'venue', ...task }));
    storage.set(key, JSON.stringify([record])); return draw();
  };
  let colourNodes = colourFixture([{ status: 'blocked', dueDate: '2000-01-01' }, { status: 'completed', dueDate: '2000-01-01' }]);
  assert.equal(row(colourNodes).props['data-milestone-state'], 'overdue');
  assert(row(colourNodes).props.className.includes('border-[#efc1ca]')); assert(!row(colourNodes).props.className.includes('border-l-')); assert(/1\s+overdue/.test(text(row(colourNodes))));
  const colourSnapshot = storage.get(key);
  colourNodes.find(n => n.type === stubs.Select && n.props.ariaLabel === 'Filter tasks by status').props.onValueChange('completed');
  colourNodes = draw(); assert.equal(row(colourNodes).props['data-milestone-state'], 'overdue', 'A filter hiding the overdue task must not change the row colour');
  button(colourNodes, 'Collapse Venue').props.onClick(); colourNodes = draw();
  assert.equal(row(colourNodes).props['data-milestone-state'], 'overdue');
  const collapsedActions = colourNodes.find(n => n.props?.['aria-label'] === 'Actions for Venue milestone');
  assert.deepEqual(walk(collapsedActions).filter(n => n.type === stubs.Button).map(text), ['Add task', 'Edit', 'Delete']);
  assert.equal(storage.get(key), colourSnapshot, 'Filtering/collapsing and derived colours never rewrite tasks');
  colourNodes = colourFixture([{ status: 'completed', dueDate: '2000-01-01' }, { done: true, dueDate: '2000-01-01' }, { status: 'archived', dueDate: '2000-01-01' }]);
  assert.equal(row(colourNodes).props['data-milestone-state'], 'completed'); assert(row(colourNodes).props.className.includes('border-[#c5dfcd]')); assert(!row(colourNodes).props.className.includes('border-l-')); assert(text(row(colourNodes)).includes('All done'));
  for (const taskItems of [[], [{ status: 'todo', dueDate: '2999-01-01' }], [{ status: 'todo', dueDate: '2000-02-30' }], [{ status: 'archived', dueDate: '2000-01-01' }, { status: 'canceled', dueDate: '2000-01-01' }]]) {
    assert.equal(row(colourFixture(taskItems)).props['data-milestone-state'], 'open', 'Empty/inactive/invalid-date milestones stay neutral; a target date alone does not make the row red');
  }
  colourNodes = colourFixture([{ status: 'todo', dueDate: '2000-01-01' }]);
  let colourTask = colourNodes.find(n => n.type?.name === 'TaskRow');
  button(render(colourTask.type, colourTask.props), 'Mark complete: Colour task 0').props.onClick();
  colourNodes = draw(); assert.equal(row(colourNodes).props['data-milestone-state'], 'completed', 'Checking off the last task turns the row green immediately');
  colourTask = colourNodes.find(n => n.type?.name === 'TaskRow');
  button(render(colourTask.type, colourTask.props), 'Mark incomplete: Colour task 0').props.onClick();
  assert.equal(row(draw()).props['data-milestone-state'], 'overdue', 'Reopening a past-due task restores red');

  seed(); let nodes = draw();
  const actions = nodes.find(n => n.props?.['aria-label'] === 'Actions for Venue milestone'); assert(actions);
  assert.deepEqual(walk(actions).filter(n => n.type === stubs.Button).map(n => text(n).trim()), ['Add task', 'Edit', 'Delete']);
  assert(!nodes.some(n => n.type === stubs.ActionMenu && n.props.label === 'More actions for Venue'));
  button(nodes, 'Add task to Venue').props.onClick(); nodes = draw();
  assert.equal(nodes.find(n => n.type === stubs.Select && n.props.label === 'Milestone').props.value, 'venue');
  assert(nodes.some(n => n.type === stubs.Input && n.props.label === 'Task title'));
  seed(); button(draw(), 'Edit milestone: Venue').props.onClick();
  assert.equal(draw().find(n => n.type === stubs.Input && n.props.label === 'Milestone name').props.value, 'Venue');
  seed(); const beforeDelete = storage.get(key); button(draw(), 'Delete milestone: Venue').props.onClick();
  const confirmation = draw().find(n => n.type === stubs.DeleteConfirmation); assert(confirmation.props.open); assert.equal(storage.get(key), beforeDelete);
  confirmation.props.onOpenChange(false); assert.equal(storage.get(key), beforeDelete);
  button(draw(), 'Delete milestone: Venue').props.onClick(); assert(draw().find(n => n.type === stubs.DeleteConfirmation).props.onConfirm());
  assert(!read().taskGroups.some(group => group.id === 'venue')); assert.equal(read().sections.tasks.length, 3); assert.equal(read().sections.tasks.find(task => task.id === 't1').groupId, undefined);

  seed(); const before = storage.get(key); let props = openMove(); nodes = render(TaskMoveDialog, props);
  assert.equal(nodes.filter(n => n.type === 'input' && n.props.type === 'radio').length, 4);
  assert(nodes.find(n => n.type === 'input' && n.props.value === 'venue').props.disabled);
  assert(nodes.find(n => n.type === stubs.Button && n.props.type === 'submit').props.disabled);
  choose(props, 'design'); assert.equal(storage.get(key), before, 'Choosing is only a draft');
  nodes = render(TaskMoveDialog, props); nodes.find(n => n.type === stubs.Button && text(n) === 'Cancel').props.onClick();
  assert(!draw().some(n => n.type === TaskMoveDialog)); assert.equal(storage.get(key), before);
  props = openMove(); choose(props, 'design'); submit(props);
  const moved = read().sections.tasks.find(task => task.id === 't1'); assert.deepEqual(moved, { ...fixture.sections.tasks[0], groupId: 'design' });
  assert.equal(read().sections.tasks.length, 3); assert.equal(new Set(read().sections.tasks.map(task => task.id)).size, 3);
  assert.deepEqual(JSON.parse(storage.get(key))[1], { ...fixture, id: 'other-event' });
  assert(!draw().some(n => n.type === TaskMoveDialog));
  props = openMove(); choose(props, 'other'); submit(props); assert.equal(read().sections.tasks.find(task => task.id === 't1').groupId, undefined);
  props = openMove('t3'); choose(props, 'day'); submit(props); assert.equal(read().sections.tasks.find(task => task.id === 't3').groupId, 'day');

  seed(); props = openMove(); choose(props, 'design'); fail = true; submit(props); fail = false;
  assert.equal(storage.get(key), before); assert(draw().some(n => n.type === TaskMoveDialog));
  assert(render(TaskMoveDialog, props).some(n => n.props?.role === 'alert'));
  seed(); props = openMove(); choose(props, 'design');
  storage.set(key, JSON.stringify([{ ...fixture, taskGroups: fixture.taskGroups.filter(group => group.id !== 'design') }]));
  const stale = storage.get(key); submit(props); assert.equal(storage.get(key), stale); assert(render(TaskMoveDialog, props).some(n => n.props?.role === 'alert'));
  assert.throws(() => moveTaskInPlan(fixture, 'missing', { groupId: 'design' }), /no longer exists/);
  assert.throws(() => moveTaskInPlan({ ...fixture, cancelledAt: '2026-10-23' }, 't1', { groupId: 'design' }), /cancelled/);

  seed(); button(draw(), 'Kanban board view').props.onClick(); let board = draw().find(n => n.type === TaskKanbanBoard); assert(board.props.onMoveMilestone);
  board.props.onMoveMilestone(fixture.sections.tasks[0]); assert(draw().some(n => n.type === TaskMoveDialog));
  let movedFromDetails = false;
  const detailProps = { task: fixture.sections.tasks[0], groups: fixture.taskGroups, eventName: fixture.name, onClose() {}, onEdit() {}, onMove() { movedFromDetails = true; return true; }, onStatus: () => true, onComment: () => true };
  nodes = render(TaskDetailDialog, detailProps); nodes.find(n => n.type === 'textarea').props.onChange({ target: { value: 'Unsent comment' } });
  button(render(TaskDetailDialog, detailProps), 'Move Confirm venue to another milestone').props.onClick();
  const detailMove = render(TaskDetailDialog, detailProps).find(n => n.type === TaskMoveDialog); assert(detailMove);
  state.delete(TaskMoveDialog); choose(detailMove.props, 'design'); submit(detailMove.props); assert(movedFromDetails);
  assert.equal(render(TaskDetailDialog, detailProps).find(n => n.type === 'textarea').props.value, 'Unsent comment');

  const source = fs.readFileSync(path.join(root, 'src/components/planner/task-workspace.tsx'), 'utf8');
  assert(!/duplicateMilestone|label: "Duplicate"|label: "Move up"|label: "Move down"/.test(source));
  assert(source.includes('useTaskPlanDrag')); assert(source.includes('reorderMilestone(current, source.id'));
  console.log('PASS: red overdue and green all-complete milestone rows, neutral empty/invalid/inactive states, full-plan colours through filters/collapse and immediate completion/reopen updates; direct Add/Edit/Delete and confirmation; milestone picker/move preservation, failure guards and drag controls. Memory fixtures only.');
} finally { Object.assign(React, hooks); Module._load = originalLoad; }
