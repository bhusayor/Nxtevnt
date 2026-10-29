const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const root = path.resolve(__dirname, '..');
const ts = require(path.join(root, 'node_modules/typescript'));
for (const extension of ['.ts', '.tsx']) Module._extensions[extension] = (mod, file) => mod._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: 1, target: 9, jsx: 4, esModuleInterop: true } }).outputText, file);
const { vendorQuoteBudgetChange } = require('../src/lib/vendor-quote-budget.ts');

const event = { id: 'event-1', name: 'Celebration', currency: 'NGN' };
const otherEvent = { id: 'event-2', name: 'Other event', currency: 'USD' };
const group = { id: 'group-1', eventId: event.id, currency: 'NGN', name: 'Decor & Styling', createdAt: '2026-10-01T00:00:00Z' };
const attachment = { id: 'quote-pdf', name: 'Bloomhouse-floral-quote.pdf', type: 'application/pdf', size: 1752, sourceUrl: '/quotes/bloomhouse-floral-quote.pdf' };
const reply = { id: 'reply-1', eventId: event.id, vendor: 'Bloomhouse NG', subject: 'Floral package', message: 'Available', createdAt: '2026-10-28T00:00:00Z', status: 'unread', attachments: [attachment] };
const now = '2026-10-29T00:00:00Z';
const destination = { groupId: group.id, groupName: '', itemId: 'new', itemName: 'Reception florals', amount: 2500000 };

const created = vendorQuoteBudgetChange(reply, event, [group], [], destination, now);
assert.deepEqual(created.groups, []);
assert.equal(created.items.length, 1);
assert.deepEqual({ vendor: created.items[0].vendor, vendorStatus: created.items[0].vendorStatus, status: created.items[0].status, currency: created.items[0].currency, budgeted: created.items[0].budgeted, invoiced: created.items[0].invoiced, paid: created.items[0].paid }, { vendor: 'Bloomhouse NG', vendorStatus: 'sourcing', status: 'unpaid', currency: 'NGN', budgeted: 2500000, invoiced: 0, paid: 0 });
assert.deepEqual(created.items[0].attachments, [attachment]);
assert.deepEqual(created.items[0].payments, []);
assert.equal(created.items[0].id, 'vendor-quote:reply-1');

const existing = { ...created.items[0], id: 'existing-1', vendor: '', vendorStatus: 'not-sourced', pricedAs: 'per-guest', quantity: 100, unitPrice: 1000, budgeted: 100000, invoiced: 50000, paid: 10000, status: 'partially-paid', payments: [{ id: 'payment-1', amount: 10000 }], attachments: [{ id: 'older', name: 'old.pdf', type: 'application/pdf', size: 100 }] };
const updated = vendorQuoteBudgetChange(reply, event, [group], [existing], { ...destination, itemId: existing.id, itemName: '', amount: 250000.25 }, now).items[0];
assert.equal(updated.id, existing.id);
assert.equal(updated.vendorStatus, 'sourcing');
assert.equal(updated.pricedAs, 'flat-fee');
assert.equal(updated.quantity, 1);
assert.equal(updated.unitPrice, 250000.25);
assert.equal(updated.invoiced, existing.invoiced);
assert.equal(updated.paid, existing.paid);
assert.equal(updated.status, existing.status);
assert.deepEqual(updated.payments, existing.payments);
assert.equal(updated.attachments.length, 2);
assert.equal(existing.vendor, '', 'source item remains unchanged');

const newGroup = vendorQuoteBudgetChange(reply, event, [group], [], { ...destination, groupId: 'new', groupName: 'Flowers' }, now);
assert.equal(newGroup.groups.length, 1);
assert.equal(newGroup.groups[0].name, 'Flowers');
assert.equal(newGroup.items[0].groupId, newGroup.groups[0].id);

assert.throws(() => vendorQuoteBudgetChange(reply, otherEvent, [group], [], destination), /different event/);
assert.throws(() => vendorQuoteBudgetChange(reply, event, [group], [], { ...destination, amount: 0 }), /quoted amount/);
assert.throws(() => vendorQuoteBudgetChange(reply, event, [group], [], { ...destination, amount: 1.001 }), /decimal places/);
assert.throws(() => vendorQuoteBudgetChange(reply, event, [group], [existing], { ...destination, itemId: existing.id, amount: 1000 }), /already invoiced or paid/);
assert.throws(() => vendorQuoteBudgetChange(reply, event, [group], [], { ...destination, groupId: 'missing' }), /budget group/);

const pdf = fs.readFileSync(path.join(root, 'public/quotes/bloomhouse-floral-quote.pdf'));
assert.equal(pdf.subarray(0, 5).toString(), '%PDF-');
assert(pdf.includes(Buffer.from('2,500,000')));
console.log('PASS: vendor quote creates or updates a Sourcing budget item, keeps payments intact, locks event currency, and retains its PDF.');
