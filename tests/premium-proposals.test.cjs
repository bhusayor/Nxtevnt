// Proposal limits use in-memory records only; no browser storage or real events.
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

const { eventProposals, proposalLimitForEvent, saveEventProposal } = require('../src/lib/budget-proposals.ts');
const event = { id: 'fixture', name: 'Fixture event', tier: 'standard', currency: 'NGN', sections: { proposal: [] }, budgetProposals: [] };
const draft = (id) => ({ id, name: `Proposal ${id}`, currency: 'NGN', description: '', status: 'draft', groups: [], createdAt: '2026-10-29T00:00:00.000Z', updatedAt: '2026-10-29T00:00:00.000Z' });

assert.equal(proposalLimitForEvent(event), 1);
assert.equal(proposalLimitForEvent({}), 1, 'Older events without a tier are standard');
const one = saveEventProposal(event, draft('one'));
assert.equal(eventProposals(one).length, 1);
assert.throws(() => saveEventProposal(one, draft('two')), /Upgrade this event to Premium/);
assert.equal(eventProposals(one).length, 1, 'A rejected proposal leaves the existing one alone');
const edited = saveEventProposal(one, { ...eventProposals(one)[0], description: 'Updated' });
assert.equal(eventProposals(edited)[0].description, 'Updated', 'A standard proposal stays editable');

const premium = { ...one, tier: 'premium' };
assert.equal(proposalLimitForEvent(premium), 3);
const two = saveEventProposal(premium, draft('two'));
const three = saveEventProposal(two, draft('three'));
assert.equal(eventProposals(three).length, 3);
assert.throws(() => saveEventProposal(three, draft('four')), /up to three proposals/);
console.log('PASS: standard proposal limit, legacy tier default, existing proposal editing, and premium three-proposal limit.');
