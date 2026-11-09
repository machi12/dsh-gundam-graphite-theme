import test from 'node:test'
import assert from 'node:assert/strict'
import { stepSpring, flowAt, particleVelocity } from '../src/client/physics.js'
import { createEffects } from '../src/client/effects.js'
import { DEFAULT_SETTINGS } from '../src/config.js'

test('spring pushes away from pointer then settles, independently of frame cap', () => {
  for (const fps of [20, 30, 60]) {
    const node = { ax: 100, ay: 100, x: 100, y: 100, vx: 0, vy: 0 }
    for (let i = 0; i < fps; i++) stepSpring(node, { active: true, x: 90, y: 100 }, 180, 0.5, 1 / fps)
    assert.ok(node.x > 120 && node.x < 140)
    for (let i = 0; i < fps * 3; i++) stepSpring(node, { active: false }, 180, 0.5, 1 / fps)
    assert.ok(Math.abs(node.x - 100) < 0.01)
    assert.ok(Math.abs(node.vx) < 0.01)
  }
})

test('network modes attract, ripple, swirl and pulse in distinct directions', () => {
  const move = (mode, time = 0) => {
    const node = { ax: 100, ay: 100, x: 100, y: 100, vx: 0, vy: 0 }
    stepSpring(node, { active: true, x: 90, y: 100 }, 180, 0.5, 1 / 30, mode, time)
    return node
  }
  assert.ok(move('repel').x > 100)
  assert.ok(move('attract').x < 100)
  assert.ok(move('swirl').y > 100)
  assert.ok(move('ripple', 0).x > 100)
  assert.ok(move('ripple', 0.5).x < 100)
  assert.ok(move('pulse', Math.PI / 10).x > 100)
  assert.ok(move('pulse', 3 * Math.PI / 10).x < 100)
})
test('flow field is smooth and finite across canvas coordinates', () => {
  for (const time of [0, 100, 10000]) {
    const a = flowAt(100, 100, time), b = flowAt(100.1, 100, time)
    assert.ok(Math.hypot(a.x - b.x, a.y - b.y) < 0.1)
    assert.ok(Math.hypot(a.x, a.y) < 50)
  }
})
test('particle modes produce distinct flow, vortex and diagonal shower paths', () => {
  assert.deepEqual(particleVelocity(900, 450, 1, 'flow', 1600, 900), flowAt(900, 450, 1))
  const vortex = particleVelocity(900, 450, 1, 'vortex', 1600, 900)
  assert.ok(vortex.x > 0 && vortex.y > vortex.x)
  const shower = particleVelocity(900, 450, 1, 'shower', 1600, 900)
  assert.ok(shower.x < 0 && shower.y > 0)
})
function surface() {
  const listeners = new Map()
  return { listeners,
    addEventListener(name, fn) { if (!listeners.has(name)) listeners.set(name, new Set()); listeners.get(name).add(fn) },
    removeEventListener(name, fn) { listeners.get(name)?.delete(fn) },
    emit(name, event = {}) { listeners.get(name)?.forEach(fn => fn(event)) },
    count() { return [...listeners.values()].reduce((n, set) => n + set.size, 0) },
  }
}
test('effects stop for toggles, hidden page and reduced motion; dispose releases all listeners/frames', () => {
  const originalWindow = global.window, originalDocument = global.document
  const win = surface(), doc = surface(), root = surface(), reduced = surface(), coarse = surface()
  const frames = new Map(), canvases = [], strokes = [0, 0, 0], styles = new Map(); let next = 0, redPaints = 0
  reduced.matches = false; coarse.matches = false
  const context = i => new Proxy({}, { get: (_, prop) => prop === 'createRadialGradient' ? () => ({ addColorStop() {} })
    : prop === 'lineTo' ? () => { strokes[i]++ } : () => {}, set: (_, prop, value) => {
      if (prop === 'fillStyle' && String(value).startsWith('rgba(255,104,83,')) redPaints++
      return true
    } })
  Object.assign(win, { innerWidth: 1600, innerHeight: 900, devicePixelRatio: 2,
    matchMedia: query => query.includes('reduced') ? reduced : coarse,
    requestAnimationFrame: fn => { frames.set(++next, fn); return next }, cancelAnimationFrame: id => frames.delete(id),
  })
  Object.assign(doc, { hidden: false, documentElement: root, createElement: () => {
    const index = canvases.length
    const canvas = { setAttribute() {}, getContext: () => context(index), remove() { canvases.splice(canvases.indexOf(canvas), 1) } }
    canvases.push(canvas); return canvas
  } })
  global.window = win; global.document = doc
  try {
    const layer = { dataset: {}, appendChild() {}, style: {
      setProperty(name, value) { styles.set(name, value) }, removeProperty(name) { styles.delete(name) },
    } }
    const art = { getBoundingClientRect: () => ({ left: 0, top: 0, width: 1600, height: 900 }) }
    const effect = createEffects(layer, DEFAULT_SETTINGS, art)
    assert.equal(canvases.length, 3)
    assert.equal(canvases[0].width, 2400)
    assert.equal(frames.size, 1)
    const drawFrame = () => { const [id, draw] = frames.entries().next().value; frames.delete(id); draw(1000) }
    win.emit('pointermove', { pointerType: 'mouse', clientX: 1600, clientY: 900 })
    assert.equal(styles.get('--gg-far-x'), '-3.0px')
    assert.equal(styles.get('--gg-near-x'), '3.0px')
    effect.update({ ...DEFAULT_SETTINGS, parallaxEnabled: false })
    assert.equal(styles.get('--gg-near-x'), '0.0px')
    assert.equal(layer.dataset.parallax, 'paused')
    assert.equal(frames.size, 1)
    effect.update(DEFAULT_SETTINGS)
    assert.equal(styles.get('--gg-near-x'), '3.0px')
    effect.update({ ...DEFAULT_SETTINGS, fluidEnabled: false })
    drawFrame()
    assert.equal(strokes[1], 0)
    assert.ok(strokes[2] > 0)
    assert.equal(redPaints, 0)
    strokes.fill(0)
    effect.update({ ...DEFAULT_SETTINGS, gridEnabled: false })
    drawFrame()
    assert.ok(strokes[1] > 0)
    assert.equal(strokes[2], 0)
    assert.ok(redPaints > 0)
    effect.update({ ...DEFAULT_SETTINGS, fluidEnabled: false, gridEnabled: false }); assert.equal(frames.size, 0)
    effect.update({ ...DEFAULT_SETTINGS, motionEnabled: false }); assert.equal(frames.size, 0)
    assert.equal(styles.get('--gg-near-x'), '0.0px')
    assert.equal(layer.dataset.parallax, 'paused')
    effect.update(DEFAULT_SETTINGS); assert.equal(frames.size, 1)
    doc.hidden = true; doc.emit('visibilitychange'); assert.equal(frames.size, 0)
    doc.hidden = false; doc.emit('visibilitychange'); assert.equal(frames.size, 1)
    reduced.matches = true; reduced.emit('change'); assert.equal(frames.size, 0)
    assert.equal(styles.get('--gg-near-x'), '0.0px')
    assert.equal(layer.dataset.parallax, 'paused')
    reduced.matches = false; reduced.emit('change'); assert.equal(frames.size, 1)
    effect.update({ ...DEFAULT_SETTINGS, themeEnabled: false }); assert.equal(frames.size, 0)
    effect.destroy()
    assert.equal(canvases.length, 0)
    assert.equal(styles.size, 0)
    for (const source of [win, doc, root, reduced, coarse]) assert.equal(source.count(), 0)
  } finally { global.window = originalWindow; global.document = originalDocument }
})
