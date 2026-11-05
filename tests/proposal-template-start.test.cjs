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

const { proposalStartingTemplates, proposalGroupsFromTemplate } = require('../src/lib/proposal-templates.ts');
const { budgetTemplates, estimateBudget } = require('../src/lib/event-setup-templates.ts');

assert.equal(proposalStartingTemplates.length, budgetTemplates.length + 3);
assert.equal(proposalStartingTemplates.filter((entry) => entry.premium).length, 3);
assert.equal(new Set(proposalStartingTemplates.map((entry) => entry.template.id)).size, proposalStartingTemplates.length);

const wedding = budgetTemplates[0];
const ngn = proposalGroupsFromTemplate(wedding, '200', 'NGN');
assert.equal(ngn.reduce((sum, group) => sum + group.items.length, 0), wedding.items.length);
assert.equal(ngn.flatMap((group) => group.items).reduce((sum, item) => sum + item.unitPrice, 0), estimateBudget(wedding, 200).reduce((sum, item) => sum + item.amount, 0));
assert.equal(ngn.flatMap((group) => group.items).every((item) => item.quantity === 1 && item.pricedAs === 'flat-fee'), true);
assert.equal(proposalGroupsFromTemplate(wedding, undefined, 'NGN').flatMap((group) => group.items).reduce((sum, item) => sum + item.unitPrice, 0), estimateBudget(wedding, wedding.baselineGuests).reduce((sum, item) => sum + item.amount, 0));
assert.equal(proposalGroupsFromTemplate(wedding, '200', 'USD').flatMap((group) => group.items).every((item) => item.unitPrice === 0), true, 'NGN estimates must not be presented as another currency');
assert.equal(wedding.items.length, 5, 'Starting a proposal leaves the shared template untouched');

console.log('PASS: proposal catalog, guest-based estimates, baseline fallback, and currency safety.');
