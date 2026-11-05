const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const original = Module._load;
Module._load = function(id, parent, main) {
  if (id.startsWith('@/')) id = path.join(root, 'src', id.slice(2));
  return original.call(this, id, parent, main);
};
for (const extension of ['.ts', '.tsx']) Module._extensions[extension] = (mod, file) => mod._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: 1, target: 9, jsx: 4, esModuleInterop: true } }).outputText, file);

const storage = new Map();
global.window = { localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) }, dispatchEvent() {} };
const budgetKey = 'nxtevnt.planner.budget.v1';
const { replaceEventBudgetWithProposal } = require('../src/lib/planner-budget.ts');
const { chooseEventProposal, comparisonRows, compactComparisonRowDiffers } = require('../src/lib/budget-proposals.ts');
const { saveProposalAsTemplate } = require('../src/lib/proposal-saved-templates.ts');

const line = { id: 'line', name: 'Reception flowers', vendor: 'Bloomhouse', pricedAs: 'per-quantity', quantity: 2, unitPrice: 150, description: '' };
const proposal = { id: 'p1', name: 'Garden plan', currency: 'NGN', status: 'draft', description: '', groups: [{ id: 'pg', name: 'Decor', items: [line] }], createdAt: '2026-10-01', updatedAt: '2026-10-01' };
const other = { ...proposal, id: 'p2', name: 'Hall plan' };
const sameVisibleItems = { ...proposal, id: 'p3', groups: [{ ...proposal.groups[0], items: [{ ...line, vendor: 'Another vendor', description: 'Different internal detail' }] }] };
const visibleRow = comparisonRows([proposal, sameVisibleItems])[0];
assert.equal(compactComparisonRowDiffers(visibleRow), false, 'Hidden vendor and description changes do not appear in Differences only');
const changedVisibleItems = { ...sameVisibleItems, groups: [{ ...sameVisibleItems.groups[0], items: [{ ...line, unitPrice: 200 }] }] };
assert.equal(compactComparisonRowDiffers(comparisonRows([proposal, changedVisibleItems])[0]), true, 'Visible amount changes appear in Differences only');
const oldGroup = { id: 'old', eventId: 'event', currency: 'NGN', name: 'Old plan', createdAt: '2026-10-01' };
const oldItem = { id: 'old-item', groupId: 'old', eventId: 'event', currency: 'NGN', name: 'Old item', vendor: '', vendorStatus: 'not-sourced', budgeted: 100, invoiced: 0, paid: 0, status: 'unpaid', paymentDate: '', notes: '', installments: [], attachments: [], payments: [], createdAt: '2026-10-01' };
const otherGroup = { ...oldGroup, id: 'other-group', eventId: 'another-event' };
const otherItem = { ...oldItem, id: 'other-item', groupId: 'other-group', eventId: 'another-event' };
const seed = (item) => storage.set(budgetKey, JSON.stringify({ groups: [oldGroup, otherGroup], items: [item, otherItem], deletedLegacyIds: [] }));

seed({ ...oldItem, invoiced: 25 });
const withInvoice = storage.get(budgetKey);
assert.throws(() => replaceEventBudgetWithProposal('event', 'NGN', proposal.groups), /invoices, payments or attachments/i);
assert.equal(storage.get(budgetKey), withInvoice, 'An invoiced budget must stay intact');

seed(oldItem);
const before = storage.get(budgetKey);
const undo = replaceEventBudgetWithProposal('event', 'NGN', proposal.groups);
const replaced = JSON.parse(storage.get(budgetKey));
assert.equal(replaced.groups.filter(group => group.eventId === 'event').length, 1);
assert.equal(replaced.items.filter(item => item.eventId === 'event').length, 1);
assert.equal(replaced.items.find(item => item.eventId === 'event').budgeted, 300);
assert.equal(replaced.items.find(item => item.eventId === 'event').vendorStatus, 'sourcing');
assert.equal(replaced.items.find(item => item.id === 'other-item').budgeted, 100, 'Other events are unaffected');
undo();
assert.equal(storage.get(budgetKey), before, 'The replacement can roll back if saving the event fails');

const event = { id: 'event', tier: 'premium', currency: 'NGN', budgetProposals: [proposal, other], sections: { proposal: [] } };
const chosen = chooseEventProposal(event, 'p1');
assert(chosen.budgetProposals[0].chosenAt);
assert.equal(chosen.budgetProposals[1].chosenAt, undefined);
const changed = chooseEventProposal(chosen, 'p2');
assert.equal(changed.budgetProposals[0].chosenAt, undefined);
assert(changed.budgetProposals[1].chosenAt);

const saved = saveProposalAsTemplate(proposal);
assert.equal(saved.name, proposal.name);
assert.notEqual(saved.groups[0].id, proposal.groups[0].id, 'Saved templates have independent group IDs');
assert.equal(JSON.parse(storage.get('nxtevnt.planner.proposal-templates.v1')).length, 1);

console.log('PASS: safe budget replacement and rollback, chosen proposal, and reusable template storage.');
