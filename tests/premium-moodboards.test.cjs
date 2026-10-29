// In-memory event fixtures only. No browser files or live event data.
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

const { archiveMoodboard, createMoodboard, eventMoodboards, moodboardLimitForEvent } = require('../src/lib/planner-moodboards.ts');
const activity = { id: 'activity', kind: 'created', body: 'Created board', author: 'Planner', createdAt: '2026-10-29T00:00:00.000Z' };
const input = id => ({ id, title: `Board ${id}`, source: 'planner' });
const base = { id: 'event', name: 'Fixture event', date: '2026-12-31', createdAt: activity.createdAt, tier: 'standard', moodboardBoards: [], sections: { moodboard: [], decisions: [] } };

assert.equal(moodboardLimitForEvent(base), 2);
assert.equal(moodboardLimitForEvent({}), 2, 'Older events without a tier are standard');
const first = createMoodboard(base, input('one'), activity);
const second = createMoodboard(first, input('two'), activity);
assert.equal(eventMoodboards(second).length, 2);
assert.throws(() => createMoodboard(second, input('three'), activity), /Standard events include 2 active boards/);
assert.equal(eventMoodboards(second).length, 2, 'A blocked save leaves both boards intact');

const archived = archiveMoodboard(second, 'one', true, activity);
const replacement = createMoodboard(archived, input('three'), activity);
assert.throws(() => archiveMoodboard(replacement, 'one', false, activity), /Standard events include 2 active boards/);
const upgraded = { ...replacement, tier: 'premium' };
assert.equal(moodboardLimitForEvent(upgraded), 6);
const restored = archiveMoodboard(upgraded, 'one', false, activity);
const filled = ['four', 'five', 'six'].reduce((event, id) => createMoodboard(event, input(id), activity), restored);
assert.equal(eventMoodboards(filled).filter(board => !board.archivedAt).length, 6);
assert.throws(() => createMoodboard(filled, input('seven'), activity), /6 active boards/);
console.log('PASS: standard two-board limit, Premium six-board limit, archive capacity, and restore checks.');
