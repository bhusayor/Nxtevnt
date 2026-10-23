// Synthetic fixtures only. No external messages, real account checks or persistent writes.
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), Module = require('node:module');
const root = path.resolve(__dirname, '..'), ts = require(path.join(root, 'node_modules/typescript')), React = require(path.join(root, 'node_modules/react'));
const { renderToStaticMarkup } = require(path.join(root, 'node_modules/react-dom/server')), original = Module._load;
Module._load = function(id, parent, main) { if (id === '@/components/ui/icons') return new Proxy({}, { get: () => () => null }); if (id.startsWith('@/')) id = path.join(root, 'src', id.slice(2)); return original.call(this, id, parent, main); };
for (const extension of ['.ts', '.tsx']) Module._extensions[extension] = (mod, file) => mod._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: 1, target: 9, jsx: 4, esModuleInterop: true } }).outputText, file);
global.window = { localStorage: { setItem() { throw Error('No persistent writes allowed'); } } };
global.fetch = async () => { throw Error('No external requests allowed'); };
const model = require('../src/lib/verification-model.ts'), { verificationService } = require('../src/lib/verification-service.ts');
const { createVerificationWalkthrough } = require('../src/lib/verification-walkthrough.ts');
const { VerificationDashboard } = require('../src/components/planner/verification/verification-dashboard.tsx');
const { VerificationInstagram } = require('../src/components/planner/verification/verification-instagram.tsx');
const { VerificationReviewFields } = require('../src/components/planner/verification/verification-review.tsx');
const at = new Date().toISOString(), base = model.createVerificationDraft();
const proof = { handle: 'example.events', proofToken: 'server-ig-proof', verifiedAt: at };
const ready = { ...base, instagram: '@example.events', instagramProof: proof, email: 'planner@example.test', emailProof: { channel: 'email', target: 'planner@example.test', proofToken: 'email', verifiedAt: at }, phone: '+2348000000000', phoneProof: { channel: 'phone', target: '+2348000000000', proofToken: 'phone', verifiedAt: at }, documentType: 'nin', identityDocument: { purpose: 'identity', reference: 'server-id', name: 'id.pdf' }, identityProof: { proofToken: 'identity', documentType: 'nin', country: base.country, legalName: base.legalName }, kind: 'independent', brand: 'Example Events', location: 'Lagos', accurate: true };
const html = draft => renderToStaticMarkup(React.createElement(VerificationDashboard, { draft, errors: {}, update() {}, service: verificationService, application: null, onBusiness() {}, onReview() {} }));
for (const title of ['Business verification', 'Phone/WhatsApp', 'Business email', 'Instagram account']) assert(html(base).includes(title));
assert(html(base).includes('0 of 4 checks prepared')); assert(html(base).includes('Pending verification')); assert(!html(base).includes('Failed'));
assert(html(base).includes('CAC certificate')); assert(html(base).includes('NIN slip')); assert(html(base).includes('premium boosted listings'));
assert(html(base).includes('not configured')); assert(!html(base).includes('instagram.com/nxtevnt'), 'Do not invent an official recipient');
assert(model.businessVerificationReady(ready)); assert(html(ready).includes('4 of 4 checks prepared')); assert(html(ready).includes('Ready for review')); assert(html(ready).includes('Pending verification'));
const registered = { ...ready, kind: 'registered', registeredName: 'Example Events Limited', registrationNumber: 'RC123456' };
assert(!model.businessVerificationReady(registered)); assert(model.businessVerificationReady({ ...registered, registrationDocument: { purpose: 'registration', reference: 'cac', name: 'cac.pdf' } }));
assert(!model.businessVerificationReady({ ...registered, registrationDocument: { purpose: 'registration', reference: 'cac', name: 'cac.pdf' }, capacity: 'representative' }));
assert(model.pendingVerificationChecks({ ...ready, instagram: 'changed.account' }).some(item => item.key === 'instagram'));
assert.throws(() => model.assertVerificationReady({ ...ready, instagramProof: undefined }), /instagram/i);
model.assertVerificationReady(ready);
for (const [input, expected] of [['@Example.Events', 'example.events'], ['https://www.instagram.com/example.events/', 'example.events'], ['www.instagram.com/example.events', 'example.events'], ['https://evil.test/example.events', ''], ['https://instagram.com/p/post', ''], ['https://instagram.com@evil.test/example', ''], ['not a username', ''], ['a..b', '']]) assert.equal(model.normalizeInstagramHandle(input), expected);
assert(!model.hasInstagramProof('@other.account', proof)); assert(!model.hasInstagramProof('@example.events', { ...proof, verifiedAt: 'invalid' }));
const check = model.verificationCheckpoint(ready, 3, at); assert(!JSON.stringify(check).includes('example.events')); assert(!JSON.stringify(check).includes(proof.proofToken));
const application = { id: 'server-app', status: 'needs-info', reason: 'The certificate is cropped. Upload a complete page.', revision: 2, submittedAt: at, updatedAt: at };
const needsInfo = renderToStaticMarkup(React.createElement(VerificationDashboard, { draft: ready, errors: {}, update() {}, service: verificationService, application, onBusiness() {}, onReview() {} }));
assert(needsInfo.includes('Action needed')); assert(needsInfo.includes(application.reason)); assert(!needsInfo.includes('Verified profile'));
const identityOnly = renderToStaticMarkup(React.createElement(VerificationDashboard, { draft: registered, errors: {}, update() {}, service: verificationService, application: { ...application, status: 'approved', badgeScope: 'identity' }, onBusiness() {}, onReview() {} }));
assert(identityOnly.includes('Identity verified')); assert(!identityOnly.includes('Verified profile'), 'Identity approval alone does not verify business registration');

let states = [], cursor = 0;
React.useState = initial => { const i = cursor++; if (!(i in states)) states[i] = typeof initial === 'function' ? initial() : initial; return [states[i], value => { states[i] = typeof value === 'function' ? value(states[i]) : value; }]; };
React.useRef = initial => { const i = cursor++; if (!(i in states)) states[i] = { current: initial }; return states[i]; };
React.useEffect = () => {};
const walk = node => !node || typeof node !== 'object' ? [] : [node, ...[node.props?.children].flat(Infinity).flatMap(walk)];
const text = node => (node == null || typeof node === 'boolean' ? '' : typeof node !== 'object' ? String(node) : [node.props?.children].flat(Infinity).map(text).join(' ')).replace(/\s+/g, ' ').trim();
const flush = () => new Promise(resolve => setImmediate(resolve));
let draft, service, updates;
function draw() { cursor = 0; return walk(VerificationInstagram({ draft, errors: {}, update(patch) { updates.push(patch); draft = { ...draft, ...patch }; }, service })); }
function click(label) { const button = draw().find(node => text(node) === label && node.props.onClick); assert(button, label); button.props.onClick(); }
function reset(nextService = verificationService) { states = []; cursor = 0; updates = []; draft = { ...base, instagram: '@example.events' }; service = nextService; }
async function run() {
  let retried = false;
  const retry = walk(VerificationDashboard({ draft: ready, errors: {}, update() {}, service: verificationService, application, onBusiness() {}, onReview() {}, onRetry() { retried = true; } }));
  retry.find(node => node.props.onClick && text(node) === 'Try again').props.onClick(); assert.equal(retried, true); assert.equal(application.status, 'needs-info');
  await assert.rejects(() => verificationService.requestInstagramCode('example.events'), /not configured/);
  reset(); click('Verify Instagram'); await flush(); assert(draw().some(node => node.props.role === 'alert' && /not configured/.test(text(node)))); assert.equal(updates.length, 0);
  let now = Date.now(), id = 0; const local = createVerificationWalkthrough({ now: () => now, id: () => String(++id) });
  reset(local); click('Verify Instagram'); await flush(); assert(draw().some(node => node.props.label === 'Your verification code')); assert(!draw().some(node => node.type === 'a'), 'No recipient link without configuration');
  click('Check confirmation'); await flush(); assert(draw().some(node => node.props.role === 'status' && /not verified yet/.test(text(node)))); assert.equal(updates.length, 0);
  click('Complete test confirmation'); await flush(); assert.equal(draft.instagramProof.mode, 'walkthrough'); assert(draw().some(node => /complete in test mode/.test(text(node))));
  const first = await local.requestInstagramCode('renew.account'), replacement = await local.requestInstagramCode('renew.account'); await assert.rejects(() => local.checkInstagram(first), /expired or changed/);
  await assert.rejects(() => local.checkInstagram({ ...replacement, handle: 'spoofed.account' }), /expired or changed/);
  assert.equal((await local.checkInstagram(replacement)).status, 'pending'); now += 11 * 60_000; await assert.rejects(() => local.confirmInstagramWalkthrough(replacement), /expired or changed/);
  reset({ ...verificationService, requestInstagramCode: local.requestInstagramCode }); click('Verify Instagram'); await flush(); assert(!draw().some(node => text(node) === 'Complete test confirmation'), 'Test completion is absent from live mode');
  let resolve; reset({ ...verificationService, requestInstagramCode: () => new Promise(done => { resolve = done; }) }); click('Verify Instagram'); draft = { ...draft, instagram: '@changed.account' }; draw(); resolve({ id: 'late', handle: 'example.events', code: 'NX-12345678', expiresAt: new Date(Date.now() + 600000).toISOString() }); await flush(); assert(!draw().some(node => node.props.label === 'Your verification code')); assert.equal(updates.length, 0);
  const review = walk(VerificationReviewFields({ draft: ready, errors: {}, update() {}, onEdit() {} })); assert(review.some(node => text(node) === 'Instagram account')); assert(review.some(node => text(node) === '@example.events'));
  console.log('PASS: four verification checks; honest readiness vs approval; CAC/ID routes; Instagram normalization, pending/expiry/stale guards, session proof and explicit test-only confirmation; no recipient invented; private data excluded from storage. Synthetic fixtures only.');
}
run().catch(error => { console.error(error); process.exitCode = 1; });
