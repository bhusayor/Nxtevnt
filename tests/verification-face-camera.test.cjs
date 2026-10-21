// Isolated browser/media fixtures only. Never opens a real camera or writes photos.
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), Module = require('node:module');
const root = path.resolve(__dirname, '..'), ts = require(path.join(root, 'node_modules/typescript')), React = require(path.join(root, 'node_modules/react'));
Module._extensions['.ts'] = (mod, file) => mod._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: 1, target: 9, esModuleInterop: true } }).outputText, file);
const { useFaceCamera, faceCameraError } = require('../src/components/planner/verification/use-face-camera.ts');
let request, calls = [], canvas, drawCalls = 0, encode;
global.window = { isSecureContext: true };
Object.defineProperty(global, 'navigator', { configurable: true, value: { mediaDevices: { getUserMedia(options) { calls.push(options); return request(); } } } });
global.document = { createElement(tag) { assert.equal(tag, 'canvas'); return canvas = { width: 0, height: 0, getContext() { return { drawImage() { drawCalls++; } }; }, toBlob(callback, type, quality) { assert.equal(type, 'image/jpeg'); assert.equal(quality, 0.9); encode(callback); } }; } };
const deferred = () => { let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b; }); return { promise, resolve, reject }; };
function media() { const listeners = new Map(); const track = { stops: 0, stop() { this.stops++; }, addEventListener(name, fn) { listeners.set(name, fn); }, removeEventListener(name, fn) { if (listeners.get(name) === fn) listeners.delete(name); } }; return { stream: { getTracks: () => [track] }, track, listeners }; }
function harness() {
  let cursor = 0, slots = [], pending = [], result, alive = true;
  const photos = [], errors = [], video = { videoWidth: 1920, videoHeight: 1080, srcObject: null, play: () => Promise.resolve() };
  const render = () => {
    assert(alive); cursor = 0; pending = [];
    React.useState = initial => { const i = cursor++; if (!(i in slots)) slots[i] = { value: initial }; return [slots[i].value, value => { assert(alive, 'No state updates after unmount'); slots[i].value = typeof value === 'function' ? value(slots[i].value) : value; }]; };
    React.useRef = initial => { const i = cursor++; if (!(i in slots)) slots[i] = { current: initial }; return slots[i]; };
    React.useEffect = (effect, deps) => { const i = cursor++, old = slots[i]; if (!old || deps.some((value, j) => value !== old.deps[j])) { pending.push(() => { old?.cleanup?.(); slots[i] = { deps, cleanup: effect() }; }); } };
    result = useFaceCamera(file => photos.push(file), error => errors.push(error)); result.videoRef.current = video;
    pending.forEach(effect => effect()); return result;
  };
  return { render, photos, errors, video, unmount() { slots.forEach(slot => slot.cleanup?.()); alive = false; } };
}
async function open(h, m = media()) { request = async () => m.stream; await h.render().start(); h.render(); await Promise.resolve(); h.render().markReady(); h.render(); return m; }
async function run() {
  let h = harness(); h.render(); assert.equal(calls.length, 0, 'Never request the camera on mount');
  window.isSecureContext = false; await h.render().start(); assert.match(h.errors.at(-1), /HTTPS or localhost/); assert.equal(calls.length, 0); window.isSecureContext = true;
  for (const name of ['NotAllowedError', 'NotFoundError', 'NotReadableError']) { request = async () => { throw Object.assign(new Error(), { name }); }; await h.render().start(); assert.equal(h.render().state, 'idle'); assert.match(h.errors.at(-1), /upload a photo/i); }
  assert.match(faceCameraError(new Error()), /try again/);
  const delayed = deferred(), late = media(); request = () => delayed.promise;
  const opening = h.render().start(); assert.equal(h.render().state, 'opening'); h.render().stop(); delayed.resolve(late.stream); await opening; assert.equal(late.track.stops, 1); assert.equal(h.render().state, 'idle');
  const live = await open(h); assert.equal(h.video.srcObject, live.stream); assert.equal(h.render().ready, true); assert.equal(calls.at(-1).audio, false); assert.equal(calls.at(-1).video.facingMode, 'user');
  encode = callback => callback(new Blob(['captured pixels'], { type: 'image/jpeg' })); await h.render().capture();
  assert.equal(h.photos.length, 1); assert(h.photos[0] instanceof File); assert.equal(h.photos[0].name, 'face-photo.jpg'); assert.equal(h.photos[0].type, 'image/jpeg'); assert.equal(canvas.width, 1280); assert.equal(canvas.height, 720); assert.equal(drawCalls, 1); assert.equal(live.track.stops, 1); assert.equal(h.video.srcObject, null); assert.equal(h.render().state, 'idle');
  const retake = await open(h); assert.equal(h.render().state, 'live'); h.render().stop(); assert.equal(retake.track.stops, 1);
  const ended = await open(h); ended.listeners.get('ended')(); assert.equal(ended.track.stops, 1); assert.match(h.errors.at(-1), /camera stopped/);
  const badPlayback = media(); h.video.play = () => Promise.reject(new Error('blocked')); await open(h, badPlayback); await Promise.resolve(); assert.equal(badPlayback.track.stops, 1); assert.equal(h.render().state, 'idle'); h.video.play = () => Promise.resolve();
  const brokenCapture = await open(h); encode = callback => callback(null); await h.render().capture(); assert.equal(brokenCapture.track.stops, 1); assert.match(h.errors.at(-1), /could not be captured/);
  const pendingCapture = await open(h); let finish; encode = callback => { finish = callback; }; const capturing = h.render().capture(); h.render().stop(); finish(new Blob(['cancelled'])); await capturing; assert.equal(h.photos.length, 1); assert.equal(pendingCapture.track.stops, 1);
  const closing = await open(h); h.unmount(); assert.equal(closing.track.stops, 1); assert.equal(h.video.srcObject, null);
  h = harness(); const unmountDelay = deferred(), unmountLate = media(); request = () => unmountDelay.promise; const pendingPermission = h.render().start(); h.render(); h.unmount(); unmountDelay.resolve(unmountLate.stream); await pendingPermission; assert.equal(unmountLate.track.stops, 1);
  console.log('PASS: explicit camera permission; no audio; capture JPEG; retake; denial/device/playback errors; cancelled and late requests; unmount cleanup. Mock media only; no real camera used.');
}
run().catch(error => { console.error(error); process.exitCode = 1; });
