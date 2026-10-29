// In-memory wallet fixtures only. No purchases, payments or user storage.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
for (const extension of ['.ts', '.tsx']) Module._extensions[extension] = (mod, file) => mod._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: 1, target: 9, jsx: 4, esModuleInterop: true } }).outputText, file);
const storage = new Map();
global.window = { localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) }, dispatchEvent() {} };
const { getCreditBalance, spendCreditForEvent, refundCreditUse } = require('../src/lib/planner-credits.ts');
const walletKey = 'nxtevnt.planner.credit-wallet.v1';
const purchase = (id, remaining, expiresAt = '2099-01-01T00:00:00Z') => ({ id, packId: 'single', packName: 'Single Credit', count: 1, remaining, amount: 0, purchasedAt: '2026-01-01T00:00:00Z', expiresAt, reference: id });
const read = () => JSON.parse(storage.get(walletKey));
const seed = wallet => storage.set(walletKey, JSON.stringify(wallet));

seed({ legacyBalance: 1, purchases: [purchase('early', 1, '2098-01-01T00:00:00Z'), purchase('late', 1)], usages: [] });
assert.equal(getCreditBalance(), 3);
const two = spendCreditForEvent('event-1', ' Premium event ', 2);
assert.equal(two.count, 2);
assert.equal(two.eventName, 'Premium event');
assert.deepEqual(two.allocations, [{ purchaseId: 'early', count: 1 }, { purchaseId: 'late', count: 1 }]);
assert.equal(getCreditBalance(), 1);
assert.deepEqual(read().purchases.map(item => item.remaining), [0, 0]);
refundCreditUse(two.id);
assert.equal(getCreditBalance(), 3);
assert.equal(read().usages.length, 0);

seed({ legacyBalance: 1, purchases: [purchase('pack', 1)], usages: [] });
const mixed = spendCreditForEvent('event-2', 'Mixed balance', 2);
assert.deepEqual(mixed.allocations, [{ purchaseId: 'pack', count: 1 }, { purchaseId: null, count: 1 }]);
assert.equal(getCreditBalance(), 0);
refundCreditUse(mixed.id);
assert.equal(getCreditBalance(), 2);

seed({ legacyBalance: 1, purchases: [purchase('expired', 5, '2020-01-01T00:00:00Z')], usages: [] });
const before = storage.get(walletKey);
assert.equal(spendCreditForEvent('event-3', 'Insufficient', 2), null);
assert.equal(storage.get(walletKey), before, 'An insufficient balance cannot spend one of two credits');
assert.throws(() => spendCreditForEvent('event-3', 'Invalid', 0), /valid credit cost/);

const one = spendCreditForEvent('event-4', 'Standard event');
assert.equal(one.count, 1);
assert.equal(getCreditBalance(), 0);
refundCreditUse(one.id);
assert.equal(getCreditBalance(), 1);
delete global.window;
console.log('PASS: standard and premium costs, mixed-pack atomic spend, expiry, insufficient-balance safety and pre-create refunds.');
