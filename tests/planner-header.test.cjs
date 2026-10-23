// Render-only fixtures: no account changes, navigation, storage writes or purchases.
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), Module = require('node:module');
const root = path.resolve(__dirname, '..'), ts = require(path.join(root, 'node_modules/typescript'));
const React = require(path.join(root, 'node_modules/react')), { renderToStaticMarkup } = require(path.join(root, 'node_modules/react-dom/server'));
const load = Module._load;
let balance = 0;
Module._load = function(id, parent, main) {
  if (id === 'next/link') return ({ children, ...props }) => React.createElement('a', props, children);
  if (id === 'next/navigation') return { usePathname: () => '/planner', useRouter: () => ({ push() { throw Error('Must not navigate during render'); } }) };
  if (id === '@/lib/planner-credits') return { useCreditBalance: () => balance };
  if (id === '@/lib/planner-events') return { addGuestMilestoneToExistingEvents() { throw Error('Must not mutate events during render'); } };
  if (id === '@/components/nextevnt/brand-logo') return { BrandMark: () => null };
  if (id === '@/components/ui/icons') return new Proxy({}, { get: (_, icon) => ({ weight, ...props }) => React.createElement('svg', { ...props, 'data-icon': String(icon) }) });
  if (id.startsWith('@/')) id = path.join(root, 'src', id.slice(2));
  return load.call(this, id, parent, main);
};
for (const extension of ['.ts', '.tsx']) Module._extensions[extension] = (mod, file) => mod._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: 1, target: 9, jsx: 4, esModuleInterop: true } }).outputText, file);
const { PlannerShell } = require('../src/components/planner/planner-shell.tsx');
const { WorkspaceSwitcher } = require('../src/components/planner/workspace-switcher.tsx');
const { Button, buttonVariants } = require('../src/components/ui/button.tsx');
for (const [value, label] of [[0, '0.00'], [1, '1.00'], [10, '10.00'], [1234, '1,234.00']]) {
  balance = value;
  const html = renderToStaticMarkup(React.createElement(PlannerShell, null, React.createElement('p', null, 'Workspace content')));
  const header = html.match(/<header[^>]*>[\s\S]*?<\/header>/)[0];
  assert(header.includes(`View credits, ${label} available`)); assert(header.includes(`<span>${label}</span>`));
  assert(header.includes('data-workspace-header-pill')); assert(header.includes('rounded-full')); assert(header.includes('bg-white/75')); assert(header.includes('backdrop-blur-xl'));
  assert(header.includes('data-icon="Wallet"')); assert(!header.includes('data-icon="CreditCard"')); assert(header.includes('text-[var(--credit-gold)]'));
  assert(header.includes('Notifications')); assert(header.includes('Switch workspace, Planner')); assert(header.includes('view your profile'));
  assert(!/Beta|Leave feedback|Your feedback/.test(header)); assert(header.includes('h-16'), 'Preserve 64px sticky offsets');
  const creditLink = header.match(/<a[^>]*aria-label="View credits[^>]*>/)[0]; assert(!creditLink.includes('hidden'), 'Credits stay visible on mobile');
}
for (const role of ['planner', 'vendor', 'client']) {
  const html = renderToStaticMarkup(React.createElement(WorkspaceSwitcher, { role }));
  assert(html.includes(`Switch workspace, ${role[0].toUpperCase() + role.slice(1)}`)); assert(html.includes('sr-only sm:not-sr-only')); assert(html.includes('rounded-full'));
}
const primary = buttonVariants({ variant: 'primary' });
assert(primary.includes('bg-[image:var(--action-primary-gradient)]')); assert(primary.includes('hover:bg-[image:var(--action-primary-gradient-hover)]')); assert(primary.includes('active:bg-[image:var(--action-primary-gradient-active)]'));
for (const variant of ['outline', 'secondary', 'ghost', 'soft', 'destructive']) assert(!buttonVariants({ variant }).includes('gradient'));
for (const file of ['auth/reset-password-form.tsx', 'planner/attention-queue.tsx', 'planner/credit-pack-picker.tsx', 'planner/credits-page.tsx', 'planner/event-date-time-fields.tsx', 'planner/note-composer.tsx', 'planner/questionnaire-builder.tsx']) {
  assert(fs.readFileSync(path.join(root, 'src/components', file), 'utf8').includes('bg-[image:var(--action-primary-gradient)]'), `${file} uses the shared primary gradient`);
}
const disabled = renderToStaticMarkup(React.createElement(Button, { disabled: true }, 'Save')); assert(disabled.includes('disabled=""'));
const loading = renderToStaticMarkup(React.createElement(Button, { loading: true }, 'Saving')); assert(loading.includes('aria-busy="true"')); assert(loading.includes('disabled=""'));
const tokens = fs.readFileSync(path.join(root, 'src/styles/tokens.css'), 'utf8');
const luminance = hex => hex.slice(1).match(/../g).map(part => parseInt(part, 16) / 255).map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4).reduce((sum, value, i) => sum + value * [.2126, .7152, .0722][i], 0);
for (const color of [tokens.match(/--credit-gold: (#[0-9a-f]+);/)[1], ...tokens.match(/--action-primary-gradient: ([^;]+);/)[1].match(/#[0-9a-f]{6}/g)]) assert(1.05 / (luminance(color) + .05) >= 4.5, `${color} must maintain readable white/gold contrast`);
console.log('PASS: two-decimal credits; gold wallet; glass pill; mobile visibility and accessible roles; no Beta/feedback; stable sticky offsets; shared green gradient states and text contrast. Render fixtures only.');
