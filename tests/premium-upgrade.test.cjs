// In-memory event and credit fixtures only. No real event or wallet changes.
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
let failEventWrite = false;
const eventKey = 'nxtevnt.planner.events.v1';
const walletKey = 'nxtevnt.planner.credit-wallet.v1';
global.window = {
  localStorage: {
    getItem: key => storage.get(key) ?? null,
    setItem(key, value) {
      if (failEventWrite && key === eventKey) throw Error('Event storage unavailable');
      storage.set(key, value);
    },
  },
  dispatchEvent() {},
};
const credits = require('../src/lib/planner-credits.ts');
const { upgradePlannerEvent } = require('../src/lib/planner-event-tier.ts');
const event = { id: 'standard-event', name: 'Standard event', date: '2026-12-31', tier: 'standard', sections: { tasks: [], expenses: [], proposal: [], moodboard: [], agenda: [], decisions: [], files: [] } };
storage.set(eventKey, JSON.stringify([event]));
storage.set(walletKey, JSON.stringify({ legacyBalance: 1, purchases: [], usages: [] }));

failEventWrite = true;
assert.throws(() => upgradePlannerEvent(event.id, event.name), /Event storage unavailable/);
assert.equal(credits.getCreditBalance(), 1, 'A failed event save returns the credit');
assert.equal(JSON.parse(storage.get(walletKey)).usages.length, 0);
assert.equal(JSON.parse(storage.get(eventKey))[0].tier, 'standard');

failEventWrite = false;
upgradePlannerEvent(event.id, event.name);
assert.equal(credits.getCreditBalance(), 0);
assert.equal(JSON.parse(storage.get(eventKey))[0].tier, 'premium');
assert.equal(JSON.parse(storage.get(walletKey)).usages[0].kind, 'upgrade');
assert.throws(() => upgradePlannerEvent(event.id, event.name), /1 credit/);
assert.equal(JSON.parse(storage.get(walletKey)).usages.length, 1, 'A second click cannot spend again');

storage.set(walletKey, JSON.stringify({ legacyBalance: 1, purchases: [], usages: [] }));
assert.throws(() => upgradePlannerEvent(event.id, event.name), /already premium/);
assert.equal(credits.getCreditBalance(), 1, 'An already-premium event cannot spend another credit');
assert.throws(() => upgradePlannerEvent('missing-event', 'Missing event'), /no longer exists/);
assert.equal(credits.getCreditBalance(), 1, 'A missing event cannot spend a credit');

delete global.window;
console.log('PASS: premium upgrades spend one credit once and refund on event-save, duplicate, or missing-event failures.');
