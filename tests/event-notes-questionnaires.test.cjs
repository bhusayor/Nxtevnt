// Isolated storage and DOM fixtures only. No real notes/questionnaires or messages.
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), Module = require('node:module');
const root = path.resolve(__dirname, '..'), ts = require('typescript'), React = require('react'), originalLoad = Module._load;
const storage = new Map(), stubs = {}, slots = []; let cursor = 0, fail = false;
const stub = name => stubs[name] ||= Object.assign(() => null, { displayName: name });
Module._load = function(id, parent, main) {
  if (id === 'next/link' || id === 'next/image') return stub(id);
  if (id === '@radix-ui/react-dialog') return new Proxy({}, { get: (_, name) => stub(`Dialog.${name}`) });
  if (id === '@/components/ui/icons') return new Proxy({}, { get: (_, name) => stub(`Icon.${name}`) });
  if (id.startsWith('@/components/ui/')) return new Proxy({}, { get: (_, name) => name === '__esModule' ? true : stub(name) });
  if (id === '@/lib/planner-team') return { usePlannerTeam: () => [{ id: 'owner', name: 'Fixture planner', isOwner: true }] };
  if (id === '@/components/planner/questionnaire-builder') return { QuestionnaireBuilder: stub('QuestionnaireBuilder') };
  if (id === './note-actions-menu') return { NoteActionsMenu: stub('NoteActionsMenu') };
  if (id === './note-task-dialog') return { NoteTaskDialog: stub('NoteTaskDialog') };
  if (id.startsWith('@/')) id = path.join(root, 'src', id.slice(2));
  return originalLoad.call(this, id, parent, main);
};
for (const extension of ['.ts', '.tsx']) Module._extensions[extension] = (mod, file) => mod._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: 1, target: 9, jsx: 4, esModuleInterop: true } }).outputText, file);
const originalHooks = Object.fromEntries(['useState', 'useRef', 'useId', 'useCallback', 'useSyncExternalStore'].map(key => [key, React[key]]));
React.useState = initial => { const i = cursor++; if (!(i in slots)) slots[i] = typeof initial === 'function' ? initial() : initial; return [slots[i], value => { slots[i] = typeof value === 'function' ? value(slots[i]) : value; }]; };
React.useRef = initial => { const i = cursor++; if (!(i in slots)) slots[i] = { current: initial }; return slots[i]; };
React.useId = () => 'fixture-title'; React.useCallback = fn => fn; React.useSyncExternalStore = (_, read) => read();
global.window = { localStorage: { getItem: key => storage.get(key) || null, setItem: (key, value) => { if (fail) throw Error('Storage full'); storage.set(key, value); } }, dispatchEvent() {} };
const commands = [];
global.document = { execCommand: (command, _, value) => commands.push([command, value]) };
global.Node = { TEXT_NODE: 3 };
global.HTMLElement = class {
  constructor(tagName, childNodes = []) { this.tagName = tagName; this.childNodes = childNodes; this.style = { color: '', fontWeight: '', fontStyle: '', textDecoration: '' }; this.innerText = 'Fixture text'; }
  focus() {} getAttribute() { return null; }
};
const plain = value => ({ nodeType: 3, textContent: value });
const walk = node => !node || typeof node !== 'object' ? [] : Array.isArray(node) ? node.flatMap(walk) : [node, ...walk(node.props?.children)];
const text = node => node == null ? '' : typeof node === 'string' || typeof node === 'number' ? String(node) : Array.isArray(node) ? node.map(text).join(' ') : text(node.props?.children);
const draw = (component, props) => { cursor = 0; return walk(component(props)); }, reset = () => { slots.length = 0; };
const store = require('../src/lib/planner-events.ts');
const { InlineNoteComposer } = require('../src/components/planner/note-composer.tsx');
const { EventNotesTab } = require('../src/components/planner/event-notes-tab.tsx');
const { EventNotesBrief } = require('../src/components/planner/event-notes-brief.tsx');
const { EventQuestionnairesTab } = require('../src/components/planner/event-questionnaires-tab.tsx');
const { starterTemplates } = require('../src/lib/questionnaires.ts');
const { filterEventNotes, noteIsFromNimi } = require('../src/lib/event-notes.ts');
const eventKey = 'nxtevnt.planner.events.v1', getEvent = () => JSON.parse(storage.get(eventKey))[0];
const event = { id: 'event', name: 'Fixture event', type: 'Wedding', date: '2099-01-01', notes: '', description: 'An intimate celebration', sections: { tasks: [], decisions: [] }, noteEntries: [{ id: 'pinned', title: 'Essentials', body: 'Pinned thought', pinned: true, author: 'Planner', createdAt: '2026-10-01' }, { id: 'note', title: 'Meeting', body: 'Original thought', pinned: false, author: 'Planner', createdAt: '2026-10-02' }] };
const request = id => ({ id, templateId: 'fixture', title: `Questionnaire ${id}`, sections: [{ id: 'section', title: 'Details', questions: [{ id: 'question', label: 'Your preference?' }] }], answers: {}, status: 'pending', sentAt: '2026-10-01' });
try {
  let saved, saveResult = false;
  const props = { onSave: value => { saved = value; return saveResult; } };
  let nodes = draw(InlineNoteComposer, props);
  const editor = new HTMLElement('DIV', [new HTMLElement('STRONG', [plain('Flowers')])]);
  nodes.find(n => n.props?.role === 'textbox').props.ref(editor);
  nodes.find(n => n.type === 'input').props.onChange({ target: { value: '  Walkthrough  ' } });
  nodes.find(n => n.props?.role === 'textbox').props.onInput({ currentTarget: editor });
  nodes = draw(InlineNoteComposer, props);
  const bodyIndex = nodes.findIndex(n => n.props?.role === 'textbox');
  assert(bodyIndex < nodes.findIndex(n => n.props?.['aria-label'] === 'Note formatting tools'));
  assert(!nodes[bodyIndex].props.className.includes('overflow-y-auto'), 'Editor grows with content');
  assert(!nodes.some(n => n.type === stubs['Dialog.Root']), 'Writing is not in a modal');
  nodes.find(n => n.props?.['aria-label'] === 'Bold').props.onClick(); assert.equal(commands[0][0], 'bold');
  nodes.find(n => n.type === 'form').props.onSubmit({ preventDefault() {} });
  assert.deepEqual(saved, { title: 'Walkthrough', body: '**Flowers**' });
  assert.equal(draw(InlineNoteComposer, props).find(n => n.type === 'input').props.value, '  Walkthrough  ', 'Failed save preserves draft');
  saveResult = true; draw(InlineNoteComposer, props).find(n => n.type === 'form').props.onSubmit({ preventDefault() {} });
  assert.equal(draw(InlineNoteComposer, props).find(n => n.type === 'input').props.value, '');
  let requested = 0;
  draw(InlineNoteComposer, props).find(n => n.props?.role === 'textbox').props.onKeyDown({ key: 'Enter', ctrlKey: false, metaKey: false, nativeEvent: {}, preventDefault() { assert.fail('Plain Enter remains a newline'); } });
  draw(InlineNoteComposer, props).find(n => n.props?.role === 'textbox').props.onKeyDown({ key: 'Enter', ctrlKey: true, nativeEvent: {}, currentTarget: { closest: () => ({ requestSubmit: () => requested++ }) }, preventDefault() {} }); assert.equal(requested, 1);
  storage.set(eventKey, JSON.stringify([event])); reset();
  const nimiNote = { id: 'nimi-note', title: 'Assistant takeaway', body: 'Fixture only', pinned: false, author: 'Nimi', authorId: 'nimi', createdAt: '2026-10-03' };
  const filterFixture = [...event.noteEntries, nimiNote];
  assert.equal(filterEventNotes(filterFixture, 'all').length, 3);
  assert.equal(filterEventNotes(filterFixture, 'pinned').length, 1);
  assert.equal(filterEventNotes(filterFixture, 'team').length, 2);
  assert.deepEqual(filterEventNotes(filterFixture, 'nimi').map(note => note.id), ['nimi-note']);
  assert.equal(filterEventNotes(filterFixture, 'team', 'MEETING').length, 1);
  assert.equal(filterEventNotes(filterFixture, 'nimi', 'MEETING').length, 0);
  assert(noteIsFromNimi({ ...nimiNote, authorId: undefined }));
  assert(!noteIsFromNimi({ ...nimiNote, authorId: 'human-team-member' }));
  const filterEvent = { ...event, noteEntries: filterFixture };
  const feed = nodes => walk(nodes.find(n => n.type === 'div' && n.props.className === 'min-w-0 space-y-5'));
  nodes = draw(EventNotesTab, { event: filterEvent });
  const filters = nodes.find(n => n.props?.['aria-label'] === 'Note filters');
  assert.deepEqual(walk(filters).filter(n => n.type === 'button').map(n => text(n).trim()), ['All notes', 'Pinned', 'By the team', 'From Nimi']);
  for (const [label, count] of [['All notes', 3], ['Pinned', 1], ['By the team', 2], ['From Nimi', 1]]) {
    nodes.find(n => n.type === 'button' && text(n).trim() === label).props.onClick();
    nodes = draw(EventNotesTab, { event: filterEvent });
    assert(nodes.find(n => n.type === 'button' && text(n).trim() === label).props['aria-pressed']);
    assert.equal(feed(nodes).filter(n => n.type === 'article').length, count);
    assert(text(nodes.find(n => n.type === 'aside')).includes('Essentials'));
  }
  nodes = draw(EventNotesTab, { event }); assert(text(feed(nodes)).includes('No notes from Nimi yet'));
  reset();
  nodes = draw(EventNotesTab, { event: getEvent() });
  assert.equal(nodes.filter(n => n.type === InlineNoteComposer).length, 1, 'Composer is present immediately');
  assert(!nodes.some(n => n.type === stubs.Button && /Write.*note/.test(text(n))));
  const aside = nodes.find(n => n.type === 'aside'); assert.equal(walk(aside).filter(n => n.type === 'article').length, 1); assert(text(aside).includes('Essentials')); assert(walk(aside).some(n => n.type === EventNotesBrief));
  nodes.find(n => n.type === InlineNoteComposer).props.onSave({ title: 'New title', body: 'New body' }); assert.equal(getEvent().noteEntries.length, 3);
  nodes = draw(EventNotesTab, { event: getEvent() });
  nodes.find(n => n.type === stubs.NoteActionsMenu && n.props.title === 'Meeting').props.onEdit();
  nodes = draw(EventNotesTab, { event: getEvent() });
  assert.equal(nodes.filter(n => n.type === InlineNoteComposer).length, 2, 'Editing is inline without replacing the new-note draft');
  nodes.find(n => n.type === InlineNoteComposer && n.props.initialNote).props.onSave({ title: 'Edited title', body: 'Edited body' });
  assert.equal(getEvent().noteEntries.find(n => n.id === 'note').body, 'Edited body');
  nodes = draw(EventNotesTab, { event: getEvent() }); nodes.find(n => n.type === stubs.NoteActionsMenu && n.props.title === 'Edited title').props.onPin();
  assert(getEvent().noteEntries.find(n => n.id === 'note').pinned);
  reset(); nodes = draw(EventNotesBrief, { event: getEvent() }); nodes.find(n => n.props?.['aria-label'] === 'Edit event brief').props.onClick();
  draw(EventNotesBrief, { event: getEvent() }).find(n => n.type === 'textarea').props.onChange({ target: { value: 'Updated brief' } });
  draw(EventNotesBrief, { event: getEvent() }).find(n => n.type === 'form').props.onSubmit({ preventDefault() {} }); assert.equal(getEvent().description, 'Updated brief');
  for (let count = 0; count <= 4; count++) {
    reset(); const current = { ...getEvent(), questionnaires: Array.from({ length: count }, (_, i) => request(String(i))) };
    nodes = draw(EventQuestionnairesTab, { event: current });
    assert.equal(nodes.filter(n => n.props?.['data-questionnaire-slot'] === 'sent').length, count);
    assert.equal(nodes.filter(n => n.props?.['data-questionnaire-slot'] === 'empty').length, Math.max(0, 3 - count));
    assert.equal(nodes.filter(n => n.type === stubs.Button && /Create questionnaire|Choose a template/.test(text(n))).length, count < 3 ? 2 : 0);
    const cards = nodes.filter(n => n.props?.['data-questionnaire-slot']);
    for (const card of cards) {
      const fullCardAction = walk(card).find(n => n.type === 'button' && /^(Open questionnaire:|Add questionnaire, slot)/.test(n.props['aria-label'] || ''));
      assert(fullCardAction, 'Each slot has an accessible full-card action');
      assert(fullCardAction.props.className.includes('absolute inset-0'));
      assert(!walk(fullCardAction.props.children).some(n => n.type === 'button'), 'No nested buttons');
    }
    if (count > 1) {
      const open = nodes.filter(n => n.type === 'button' && (n.props['aria-label'] || '').startsWith('Open questionnaire:')).at(-1);
      open.props.onClick(); nodes = draw(EventQuestionnairesTab, { event: current });
      assert(nodes.find(n => n.props?.['aria-label'] === open.props['aria-label']).props['aria-pressed']);
      nodes.find(n => n.props?.['aria-label'] === `Delete ${current.questionnaires[0].title}`).props.onClick();
      nodes = draw(EventQuestionnairesTab, { event: current });
      assert(nodes.find(n => n.props?.['aria-label'] === open.props['aria-label']).props['aria-pressed'], 'Delete does not open/select a different card');
      assert(nodes.some(n => n.type === stubs.DeleteConfirmation && n.props.open));
    }
  }
  reset(); storage.set(eventKey, JSON.stringify([{ ...event, questionnaires: [request('one')] }]));
  nodes = draw(EventQuestionnairesTab, { event: getEvent() });
  nodes.find(n => n.type === 'button' && n.props['aria-label'] === 'Add questionnaire, slot 2 of 3').props.onClick();
  assert(draw(EventQuestionnairesTab, { event: getEvent() }).some(n => n.type === stubs.QuestionnaireBuilder));
  nodes = draw(EventQuestionnairesTab, { event: getEvent() });
  nodes.find(n => n.type === 'button' && text(n).includes(starterTemplates[0].title)).props.onClick();
  draw(EventQuestionnairesTab, { event: getEvent() }).find(n => n.type === stubs.Button && text(n) === 'Send to client').props.onClick();
  assert.equal(getEvent().questionnaires.length, 2);
  store.sendPlannerQuestionnaire('event', request('third')); const full = storage.get(eventKey);
  assert.throws(() => store.sendPlannerQuestionnaire('event', request('fourth')), /three.*slots/); assert.throws(() => store.assertPlannerQuestionnaireSlot('event'), /three.*slots/); assert.equal(storage.get(eventKey), full);
  store.sendPlannerQuestionnaire('event', request('third')); assert.equal(getEvent().questionnaires.length, 3, 'Duplicate sending is idempotent');
  store.updatePlannerEvent('event', e => ({ ...e, questionnaires: e.questionnaires.slice(1) })); assert.doesNotThrow(() => store.assertPlannerQuestionnaireSlot('event'));
  fail = true; assert.throws(() => store.sendPlannerQuestionnaire('event', request('retry')), /Storage full/); fail = false; assert.equal(getEvent().questionnaires.length, 2);
  store.updatePlannerEvent('event', e => ({ ...e, cancelledAt: '2026-10-01' })); assert.throws(() => store.sendPlannerQuestionnaire('event', request('cancelled')), /Reopen/);
  assert.throws(() => store.sendPlannerQuestionnaire('missing', request('missing')), /no longer exists/);
} finally { Object.assign(React, originalHooks); Module._load = originalLoad; }
console.log('PASS: inline title/body editor, growing layout and formatting order; draft retention, safe formatting and keyboard save; inline edits, sidebar brief/pins; three visible slots, template sending, capacity/idempotence/cancellation/failure guards and legacy record preservation. Fixtures only.');
