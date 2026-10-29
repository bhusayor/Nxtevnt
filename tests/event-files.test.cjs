// Synthetic event metadata and in-memory payloads only; never touches user files or browser storage.
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), Module = require('node:module');
const React = require('react'), ts = require('typescript'), root = path.resolve(__dirname, '..'), originalLoad = Module._load;
const storage = new Map(), blobs = new Map(), stubs = {}, state = new Map();
let active, cursor = 0, failMetadata = false, failPayload = false, budgetItems = [];
const stub = name => stubs[name] ||= Object.assign(() => null, { displayName: name });
for (const ext of ['.ts', '.tsx']) Module._extensions[ext] = (mod, file) => mod._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: 1, target: 9, jsx: 4, esModuleInterop: true } }).outputText, file);
const realAttachments = require('../src/lib/budget-attachments.ts');
Module._load = function(id, parent, main) {
  if (id === '@/components/ui/icons') return new Proxy({}, { get: (_, name) => stub(`Icon.${name}`) });
  if (id.startsWith('@/components/ui/')) return new Proxy({}, { get: (_, name) => name === '__esModule' ? true : stub(name) });
  if (id === 'next/image') return stub('Image');
  if (id === '@radix-ui/react-dialog') return new Proxy({}, { get: (_, name) => stub(`Dialog.${name}`) });
  if (id === '@/lib/planner-budget') return { useBudgetStore: () => ({ items: budgetItems }) };
  if (id === './budget-attachments' || id === '@/lib/budget-attachments') return {
    ...realAttachments,
    saveBudgetAttachments: async entries => { if (failPayload) throw Error('Payload storage full'); for (const entry of entries) blobs.set(entry.attachment.id, entry.file); },
    deleteBudgetAttachments: async ids => { for (const id of ids) blobs.delete(id); },
    getBudgetAttachment: async id => blobs.get(id) || null,
  };
  if (id.startsWith('@/')) id = path.join(root, 'src', id.slice(2));
  return originalLoad.call(this, id, parent, main);
};
global.window = { localStorage: { getItem: key => storage.get(key) || null, setItem: (key, value) => { if (failMetadata) throw Error('Metadata storage full'); storage.set(key, value); } }, dispatchEvent() {} };
const hooks = Object.fromEntries(['useState', 'useRef', 'useEffect'].map(key => [key, React[key]]));
React.useState = initial => { const owner = active, i = cursor++; if (!(i in owner)) owner[i] = typeof initial === 'function' ? initial() : initial; return [owner[i], value => { owner[i] = typeof value === 'function' ? value(owner[i]) : value; }]; };
React.useRef = initial => { const i = cursor++; return active[i] ||= { current: initial }; };
React.useEffect = () => {};
const { eventFileFolders, systemFileFolders, visibleFileFolders, createEventFileFolder, deleteEventFileFolder, addEventFileRecords, renameEventFile, moveEventFile, safeFileLink, safeFileImage } = require('../src/lib/event-files.ts');
const { uploadEventFiles } = require('../src/lib/event-file-storage.ts');
const { eventStorageUsed, eventStorageLimit, assertEventStorageSpace } = require('../src/lib/event-storage.ts');
const { getEventNotes } = require('../src/lib/planner-events.ts');
const { EventFilesWorkspace } = require('../src/components/planner/event-files-workspace.tsx');
const { EventFileDialog, EventFilePreview, EventFileUploadDialog, eventFileAcceptForFolder } = require('../src/components/planner/event-file-dialogs.tsx');
const { NoteFileAttachments } = require('../src/components/planner/note-file-attachments.tsx');
const walk = node => !node || typeof node !== 'object' ? [] : Array.isArray(node) ? node.flatMap(walk) : [node, ...walk(node.props?.children)];
const text = node => node == null || typeof node === 'boolean' ? '' : typeof node === 'string' || typeof node === 'number' ? String(node) : Array.isArray(node) ? node.map(text).join(' ') : text(node.props?.children);
const render = (component, props) => { if (!state.has(component)) state.set(component, []); active = state.get(component); cursor = 0; return walk(component(props)); };
const button = (nodes, label) => { const result = nodes.find(node => ['button', stubs.Button].includes(node.type) && (node.props?.['aria-label'] === label || text(node).trim() === label)); assert(result, `Missing ${label}`); return result; };
const fixture = { id: 'e', name: 'Fixture event', date: '2026-12-01', createdAt: '2026-01-01', notes: '', image: '/images/auth/wedding-reception.jpg', noteEntries: [{ id: 'n', body: 'Notes', author: 'Planner', createdAt: '2026-01-01', pinned: false }], sections: { tasks: [], moodboard: [{ id: 'photo', title: 'Table styling', image: 'nxtevnt-moodboard:photo', imageAddedAt: '2026-10-01' }, { id: 'archived', title: 'Archived photo', image: 'nxtevnt-moodboard:old', imageArchivedAt: '2026-10-01' }], files: [{ id: 'old-link', title: 'Venue contract', url: 'https://example.com/contract.pdf' }, { id: 'bad-link', title: 'Unsafe legacy link', url: 'javascript:alert(1)' }] } };
const other = { ...fixture, id: 'other' }, key = 'nxtevnt.planner.events.v1';
const read = () => JSON.parse(storage.get(key))[0];
const seed = (event = fixture) => { state.clear(); failMetadata = false; failPayload = false; blobs.clear(); storage.set(key, JSON.stringify([event, other])); };
const draw = () => render(EventFilesWorkspace, { event: read() });
const file = (name = 'contract.pdf', type = 'application/pdf', size = 1024) => ({ name, type, size });
const record = { id: 'manual', storageId: 'event-file:manual', folderId: 'system:invoices', name: 'invoice.pdf', type: 'application/pdf', size: 1024, createdAt: '2026-10-20', sourceNoteId: 'n' };

(async () => {
  try {
    assert.deepEqual(systemFileFolders.map(folder => folder.name), ['Moodboard images', 'Event pictures', 'Receipts', 'Budget attachments', 'Invoices']);
    const snapshot = JSON.stringify(fixture);
    budgetItems = [{ id: 'b', eventId: 'e', name: 'Catering', createdAt: '2026-09-01', attachments: [{ id: 'doc', name: 'contract.pdf', type: 'application/pdf', size: 2048, sourceUrl: '/quotes/contract.pdf' }, { id: 'inv', name: 'invoice.pdf', category: 'invoice', type: 'application/pdf', size: 4096 }], payments: [{ id: 'p', createdAt: '2026-10-15', receipt: { id: 'receipt', name: 'receipt.png', type: 'image/png', size: 512 } }] }, { id: 'private', eventId: 'other', name: 'Other event', attachments: [{ id: 'private', name: 'private.pdf' }] }];
    const folders = eventFileFolders(fixture, budgetItems), folder = id => folders.find(entry => entry.id === id);
    assert.equal(folders.filter(entry => entry.system).length, 5); assert.equal(new Set(folders.map(entry => entry.id)).size, folders.length);
    assert.deepEqual(folder('system:moodboard-images').files.map(entry => entry.name), ['Table styling']);
    assert.equal(folder('system:event-pictures').files[0].name, 'Event cover');
    assert.equal(folder('system:receipts').files[0].location.value, 'receipt');
    assert.equal(folder('system:budget-attachments').files[0].location.value, 'doc');
    assert.equal(folder('system:budget-attachments').files[0].location.sourceUrl, '/quotes/contract.pdf');
    assert.equal(folder('system:invoices').files[0].location.value, 'inv');
    assert.equal(folder('legacy:linked-files').files.length, 2); assert.equal(folder('legacy:linked-files').files[1].location.value, '');
    assert(!JSON.stringify(folders).includes('private.pdf')); assert.equal(JSON.stringify(fixture), snapshot);
    assert.equal(eventFileFolders(fixture, []).find(entry => entry.id === 'system:receipts').files.length, 0, 'Source deletions are reflected without stale duplicate metadata');
    assert.equal(visibleFileFolders(folders, 'system', '', 'recent').length, 5);
    assert.deepEqual(visibleFileFolders(folders, 'yours', '', 'name').map(entry => entry.name), ['Linked files']);
    assert.deepEqual(visibleFileFolders(folders, 'all', 'moodboard', 'name').map(entry => entry.name), ['Moodboard images']);
    assert.equal(visibleFileFolders(folders, 'all', '', 'recent')[0].id, 'system:receipts');
    assert.deepEqual(visibleFileFolders(folders, 'all', '', 'name').map(entry => entry.name), [...folders.map(entry => entry.name)].sort((a,b) => a.localeCompare(b)));
    for (const url of ['javascript:alert(1)', 'data:text/html,x', 'file:///private/a', '//example.com/a']) assert.equal(safeFileLink(url), null);
    assert(safeFileLink('https://example.com/a')); assert.equal(safeFileImage('data:image/svg+xml;base64,abc'), null); assert.equal(safeFileImage('javascript:alert(1)'), null); assert(safeFileImage('data:image/png;base64,abc'));
    const created = createEventFileFolder(fixture, { id: 'custom', name: ' Venue contracts ', createdAt: '2026-10-22' });
    assert.equal(created.fileFolders[0].name, 'Venue contracts'); assert.equal(fixture.fileFolders, undefined);
    const filledFolder = addEventFileRecords(created, [{ ...record, folderId: 'custom' }]);
    const withoutFolder = deleteEventFileFolder(filledFolder, 'custom');
    assert.equal(withoutFolder.fileFolders.length, 0); assert.equal(withoutFolder.fileEntries.length, 0);
    assert.equal(filledFolder.fileEntries.length, 1, 'Deleting a folder leaves the input unchanged');
    assert.throws(() => deleteEventFileFolder(filledFolder, 'system:invoices'), /can’t be deleted/);
    assert.throws(() => deleteEventFileFolder({ ...filledFolder, cancelledAt: '2026-10-01' }, 'custom'), /Reopen/);
    for (const name of ['', '  ', 'a'.repeat(81), 'moodboard IMAGES']) assert.throws(() => createEventFileFolder(created, { id: 'new', name, createdAt: '' }));
    assert.throws(() => createEventFileFolder({ ...fixture, cancelledAt: '2026-10-01' }, { id: 'new', name: 'A' }), /Reopen/);
    assert.throws(() => createEventFileFolder(fixture, { id: 'system:x', name: 'A' }));
    const withRecord = addEventFileRecords(created, [record]); assert.equal(withRecord.fileEntries.length, 1); assert.equal(created.fileEntries, undefined);
    assert.equal(eventFileFolders(withRecord).find(entry => entry.id === 'system:invoices').files[0].sourceLabel, 'Notes');
    const renamed = renameEventFile(withRecord, 'manual', 'updated-invoice.pdf');
    assert.equal(renamed.fileEntries[0].name, 'updated-invoice.pdf'); assert.equal(withRecord.fileEntries[0].name, 'invoice.pdf');
    assert.throws(() => renameEventFile(withRecord, 'manual', '  '), /file name/);
    const moved = moveEventFile(renamed, 'manual', 'custom');
    assert.equal(moved.fileEntries[0].folderId, 'custom');
    assert.throws(() => moveEventFile(withRecord, 'manual', 'system:event-pictures'), /Only images/);
    const sourceRenamed = renameEventFile(fixture, 'moodboard:photo', 'New styling');
    assert.equal(eventFileFolders(sourceRenamed).find(entry => entry.id === 'system:moodboard-images').files[0].name, 'New styling');
    const sourceMoved = moveEventFile(sourceRenamed, 'moodboard:photo', 'system:event-pictures');
    assert(eventFileFolders(sourceMoved).find(entry => entry.id === 'system:event-pictures').files.some(entry => entry.name === 'New styling'));
    const budgetRenamed = renameEventFile(fixture, 'budget:doc', 'Renamed quote.pdf', budgetItems);
    assert.equal(eventFileFolders(budgetRenamed, budgetItems).find(entry => entry.id === 'system:budget-attachments').files[0].name, 'Renamed quote.pdf');
    const budgetMoved = moveEventFile(budgetRenamed, 'budget:doc', 'system:invoices', budgetItems);
    assert(eventFileFolders(budgetMoved, budgetItems).find(entry => entry.id === 'system:invoices').files.some(entry => entry.name === 'Renamed quote.pdf'));
    const previewNodes = render(EventFilePreview, { file: eventFileFolders(withRecord).find(entry => entry.id === 'system:invoices').files[0], folders: [{ id: 'system:invoices', name: 'Invoices' }], onClose() {}, async onRename() {}, async onMove() {}, async onDelete() {} });
    for (const label of ['Rename file', 'Move file', 'Delete file', 'Close preview']) assert(button(previewNodes, label), `Preview has ${label}`);
    assert(button(previewNodes, 'Delete file').props.className.includes('text-error'), 'Preview delete icon is red before hover');
    for (const extension of ['.png', '.jpg', '.pdf', '.csv', '.xlsx', '.xlsm', '.docx']) assert(eventFileAcceptForFolder('custom').includes(extension));
    assert(!eventFileAcceptForFolder('system:moodboard-images').includes('.pdf'));
    assert.throws(() => addEventFileRecords(withRecord, [record])); assert.throws(() => addEventFileRecords(created, [{ ...record, folderId: 'missing' }]), /folder/);
    assert.throws(() => addEventFileRecords(created, [{ ...record, sourceNoteId: 'missing' }]), /note/);
    assert.throws(() => addEventFileRecords(created, [{ ...record, folderId: 'system:event-pictures' }]), /image/);
    const legacyNote = { ...fixture, noteEntries: undefined, notes: 'Legacy note body' };
    assert.equal(addEventFileRecords(legacyNote, [{ ...record, sourceNoteId: getEventNotes(legacyNote)[0].id }]).fileEntries.length, 1);
    const sharedImage = 'data:image/jpeg;base64,YWJj';
    const storageFixture = { ...fixture, image: sharedImage, fileEntries: [{ ...record, size: 10 }], sections: { ...fixture.sections, moodboard: [{ id: 'one', image: sharedImage }, { id: 'two', image: sharedImage, imageArchivedAt: '2026-10-01' }] } };
    assert.equal(await eventStorageUsed(storageFixture, [{ eventId: 'e', attachments: [{ size: 20 }], payments: [{ receipt: { size: 5 } }] }]), 38, 'Storage includes event files, budget attachments, receipts and unique images');
    assert.equal(eventStorageLimit({ tier: 'standard' }), 500 * 1024 * 1024);
    assert.equal(eventStorageLimit({ tier: 'premium' }), 2 * 1024 * 1024 * 1024);
    await assert.rejects(assertEventStorageSpace({ ...storageFixture, fileEntries: [{ ...record, size: 499 * 1024 * 1024 }] }, [], 2 * 1024 * 1024), /500 MB storage limit/);

    seed(); const uploaded = await uploadEventFiles('e', 'system:budget-attachments', [file()], 'n');
    assert.equal(uploaded.length, 1); assert.equal(blobs.size, 1); assert.equal(read().fileEntries[0].sourceNoteId, 'n'); assert.deepEqual(JSON.parse(storage.get(key))[1], other);
    for (const extension of ['png', 'jpg', 'pdf', 'csv', 'xlsx', 'xlsm', 'docx']) {
      seed({ ...fixture, fileFolders: [{ id: 'custom', name: 'Documents', createdAt: '2026-10-22' }] });
      await uploadEventFiles('e', 'custom', [file(`document.${extension}`)]);
      assert.equal(read().fileEntries[0].name, `document.${extension}`, `${extension} uploads into an empty folder`);
    }
    seed(); await uploadEventFiles('e', 'system:budget-attachments', [file()], 'n');
    const saved = storage.get(key); const count = blobs.size;
    failMetadata = true; await assert.rejects(uploadEventFiles('e', 'system:invoices', [file('invoice.pdf')]), /Metadata/); failMetadata = false;
    assert.equal(storage.get(key), saved); assert.equal(blobs.size, count, 'Failed metadata commit cleans staged payloads');
    failPayload = true; await assert.rejects(uploadEventFiles('e', 'system:invoices', [file()]), /Payload/); failPayload = false; assert.equal(storage.get(key), saved);
    for (const [eventId, folderId, files, noteId, current] of [
      ['missing', 'system:invoices', [file()]], ['e', 'missing', [file()]], ['e', 'system:invoices', [file()], 'missing'], ['e', 'system:invoices', [file()], undefined, () => false],
      ['e', 'system:receipts', [file('receipt.docx', 'application/msword')]], ['e', 'system:event-pictures', [file()]], ['e', 'system:invoices', [file('payload.exe')]], ['e', 'system:invoices', [file('empty.pdf', 'application/pdf', 0)]], ['e', 'system:invoices', Array.from({length:21}, () => file())],
    ]) { await assert.rejects(uploadEventFiles(eventId, folderId, files, noteId, current)); assert.equal(storage.get(key), saved); assert.equal(blobs.size, count); }
    seed({ ...fixture, cancelledAt: '2026-10-01' }); await assert.rejects(uploadEventFiles('e', 'system:invoices', [file()]), /Reopen/); assert.equal(blobs.size, 0);
    const nearlyFull = { ...fixture, tier: 'standard', fileEntries: [{ ...record, size: 499 * 1024 * 1024 }] };
    seed(nearlyFull); await assert.rejects(uploadEventFiles('e', 'system:invoices', [file('large.pdf', 'application/pdf', 2 * 1024 * 1024)]), /500 MB storage limit/);
    assert.equal(blobs.size, 0, 'Over-limit uploads are blocked before payload storage');
    seed({ ...nearlyFull, tier: 'premium' }); await uploadEventFiles('e', 'system:invoices', [file('large.pdf', 'application/pdf', 2 * 1024 * 1024)]);
    assert.equal(blobs.size, 1, 'The same upload fits after Premium upgrade');

    seed(); let nodes = draw();
    assert(nodes.some(node => node.props?.['aria-label'] === 'Folder filters'));
    assert.equal(nodes.filter(node => node.type === 'button' && node.props?.['aria-label']?.startsWith('Open ')).length, 6);
    button(nodes, 'System').props.onClick(); nodes = draw(); assert.equal(nodes.filter(node => node.type === 'button' && node.props?.['aria-label']?.startsWith('Open ')).length, 5);
    button(nodes, 'Yours').props.onClick(); assert.equal(draw().filter(node => node.type === 'button' && node.props?.['aria-label']?.startsWith('Open ')).length, 1);
    nodes = draw(); nodes.find(node => node.type === stubs.SearchInput).props.onChange({ target: { value: 'missing' } }); assert(text(draw()).includes('No matching folders'));
    seed(); button(draw(), 'New folder').props.onClick(); nodes = draw();
    nodes.find(node => node.type === stubs.Input).props.onChange({ target: { value: 'Floor plans' } }); nodes = draw(); nodes.find(node => node.type === 'form').props.onSubmit({ preventDefault() {} });
    assert.equal(read().fileFolders[0].name, 'Floor plans'); assert(!draw().some(node => node.type === EventFileDialog));
    assert(draw().some(node => node.props?.['aria-label'] === 'Open Floor plans, 0 files'), 'New planner folder sits beside system folders');
    button(draw(), 'Open Floor plans, 0 files').props.onClick(); nodes = draw(); assert(text(nodes).includes('This folder is empty'));
    const emptyPicker = nodes.find(node => node.type === 'input' && node.props?.['aria-label'] === 'Choose files for empty folder');
    assert(emptyPicker); assert(emptyPicker.props.accept.includes('.xlsm'));
    const inlineUpload = emptyPicker.props.onChange({ target: { files: [file('plan.xlsx')], value: 'plan.xlsx' } });
    assert(/Uploading\s+1\s+file/.test(text(draw())), 'Empty folder shows upload animation before the file card');
    await inlineUpload; assert.equal(read().fileEntries[0].name, 'plan.xlsx');
    button(draw(), 'Upload files').props.onClick();
    assert.equal(draw().find(node => node.type === EventFileUploadDialog).props.folderId, read().fileFolders[0].id);
    seed(); button(draw(), 'New folder').props.onClick(); const beforeCancel = storage.get(key); draw().find(node => node.type === EventFileDialog).props.onClose(); assert.equal(storage.get(key), beforeCancel);
    seed(); button(draw(), 'Open Receipts, 1 file').props.onClick(); assert(text(draw()).includes('receipt.png')); button(draw(), 'All folders').props.onClick(); assert(draw().some(node => node.props?.['aria-label'] === 'Folder filters'));
    seed({ ...fixture, fileFolders: [{ id: 'custom', name: 'My files', createdAt: '2026-10-22' }], fileEntries: [{ ...record, folderId: 'custom' }] });
    blobs.set(record.storageId, file());
    button(draw(), 'Open My files, 1 file').props.onClick();
    nodes = draw(); assert(button(nodes, 'Delete folder')); assert(text(nodes).includes('My files')); assert(button(nodes, 'Delete folder').props.className.includes('text-error'));
    assert(button(nodes, 'Grid view').props['aria-pressed']); button(nodes, 'List view').props.onClick(); assert(button(draw(), 'List view').props['aria-pressed']);
    nodes.find(node => node.type === 'button' && text(node).includes('invoice.pdf')).props.onClick();
    const filePreview = draw().find(node => node.type === EventFilePreview);
    assert(filePreview); await filePreview.props.onRename('renamed.pdf'); assert.equal(read().fileEntries[0].name, 'renamed.pdf');
    button(nodes, 'Delete folder').props.onClick();
    let confirmation = draw().find(node => node.type === stubs.DeleteConfirmation);
    assert(confirmation.props.open);
    failMetadata = true; assert.equal(await confirmation.props.onConfirm(), false);
    failMetadata = false; assert.equal(read().fileFolders.length, 1); assert(blobs.has(record.storageId), 'Failed folder deletion preserves stored files');
    confirmation = draw().find(node => node.type === stubs.DeleteConfirmation);
    assert.equal(await confirmation.props.onConfirm(), true);
    assert.equal(read().fileFolders.length, 0); assert.equal(read().fileEntries.length, 0); assert.equal(blobs.size, 0);
    assert(!draw().some(node => node.props?.['aria-label'] === 'Open My files, 1 file'));
    seed({ ...fixture, fileFolders: [{ id: 'custom', name: 'My files', createdAt: '2026-10-22' }], fileEntries: [{ ...record, folderId: 'custom' }] });
    blobs.set(record.storageId, file()); button(draw(), 'Open My files, 1 file').props.onClick();
    draw().find(node => node.type === 'button' && text(node).includes('invoice.pdf')).props.onClick();
    await draw().find(node => node.type === EventFilePreview).props.onMove('system:invoices');
    assert.equal(read().fileEntries[0].folderId, 'system:invoices');
    button(draw(), 'All folders').props.onClick(); draw().find(node => node.type === 'button' && node.props?.['aria-label']?.startsWith('Open Invoices,')).props.onClick();
    draw().find(node => node.type === 'button' && text(node).includes('invoice.pdf')).props.onClick();
    await draw().find(node => node.type === EventFilePreview).props.onDelete();
    assert.equal(read().fileEntries.length, 0); assert.equal(blobs.size, 0, 'Deleting a file clears its stored payload');
    seed(); button(draw(), 'Open Receipts, 1 file').props.onClick(); assert(!draw().some(node => node.type === stubs.Button && text(node) === 'Delete folder'), 'System folders have no delete action');
    seed(); let closed = 0; const uploadProps = { event: read(), folderId: 'system:invoices', onClose: () => closed++ };
    nodes = render(EventFileUploadDialog, uploadProps); nodes.find(node => node.type === 'input' && node.props.type === 'file').props.onChange({ target: { files: [file('vendor-invoice.pdf')] } });
    const pendingUpload = render(EventFileUploadDialog, uploadProps).find(node => node.type === 'form').props.onSubmit({ preventDefault() {} });
    assert(/Uploading\s+1\s+file/.test(text(render(EventFileUploadDialog, uploadProps))), 'Upload animation appears while the file is being saved');
    await pendingUpload; assert.equal(closed, 1); assert.equal(read().fileEntries[0].folderId, 'system:invoices');
    state.delete(NoteFileAttachments); nodes = render(NoteFileAttachments, { event: read(), noteId: 'n' }); button(nodes, 'Attach files to note').props.onClick();
    assert.equal(render(NoteFileAttachments, { event: read(), noteId: 'n' }).find(node => node.type === EventFileUploadDialog).props.sourceNoteId, 'n');
    const source = fs.readFileSync(path.join(root, 'src/components/planner/event-workspace.tsx'), 'utf8'); assert(source.includes('<EventFilesWorkspace')); assert(!source.includes('<CollectionPanel event={event} section="files"'));
    assert(fs.readFileSync(path.join(root, 'src/components/planner/budget/budget-item-dialog.tsx'), 'utf8').includes('File folder for'));
    console.log('PASS: five event-scoped system folders and own/legacy folders; all three filters/search/sort; source-indexed cover, Mood board, budget documents/invoices/receipts; Notes upload routing; preserved links; safe URLs; create/open/upload/delete controls; folder payload cleanup and metadata failure preservation; validation, upload cleanup, stale/cancelled/missing-event guards and event isolation. In-memory fixtures only.');
  } finally { Object.assign(React, hooks); Module._load = originalLoad; delete global.window; }
})().catch(error => { console.error(error); process.exitCode = 1; });
