import test from 'node:test'
import assert from 'node:assert/strict'
import { DEFAULT_SETTINGS, normalizeSettings } from '../src/config.js'
import { Config } from '../src/index.js'
import { GraphiteSettings } from '../src/client/index.js'
import { createSettingsController } from '../src/client/settings.js'

function form() {
  let snapshot = { status: 'ready', mode: 'host', writable: true, value: { ...DEFAULT_SETTINGS } }
  const listeners = new Set()
  return {
    getSnapshot: () => snapshot,
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn) },
    publish(patch) { snapshot = { ...snapshot, ...patch }; listeners.forEach(fn => fn()) },
    async mutate(ops) { this.publish({ value: { ...snapshot.value, ...Object.fromEntries(ops.map(op => [op.path[0], op.value])) } }); return true },
    listeners,
  }
}
test('host defaults agree with client; invalid numeric values stay bounded', () => {
  assert.deepEqual(Object.fromEntries(Object.entries(Config({})).map(([key, value]) => [key, value.get()])), DEFAULT_SETTINGS)
  assert.deepEqual(normalizeSettings({ fps: NaN, particleDensity: 999, wallpaperDim: -1, wallpaperBlur: 99, gridEnabled: 'false', parallaxEnabled: 'false' }),
    { ...DEFAULT_SETTINGS, particleDensity: 240, wallpaperDim: 0, wallpaperBlur: 16 })
  assert.equal(normalizeSettings({ particleMode: 'vortex' }).particleMode, 'vortex')
  assert.equal(normalizeSettings({ particleMode: 'invalid' }).particleMode, 'flow')
  assert.equal(normalizeSettings({ gridMode: 'swirl' }).gridMode, 'swirl')
  assert.equal(normalizeSettings({ gridMode: 'invalid' }).gridMode, 'repel')
  assert.throws(() => Config({ fps: 600 }))
  assert.throws(() => Config({ wallpaperBlur: 17 }))
  assert.throws(() => Config({ particleMode: 'invalid' }))
  assert.throws(() => Config({ gridMode: 'invalid' }))
})
test('startup never overwrites host values; edits persist through host mutations', async () => {
  const host = form()
  host.publish({ value: { ...DEFAULT_SETTINGS, flowSpeed: 1.2, gridEnabled: false } })
  let writes = 0
  const mutate = host.mutate.bind(host)
  host.mutate = ops => { writes++; return mutate(ops) }
  const state = createSettingsController(host)
  assert.equal(writes, 0)
  assert.equal(state.get().value.flowSpeed, 1.2)
  assert.equal(await state.set({ themeEnabled: false }), true)
  assert.equal(host.getSnapshot().value.themeEnabled, false)
  assert.equal(await state.set({ wallpaperDim: 0.5, wallpaperBlur: 8 }), true)
  assert.equal(host.getSnapshot().value.wallpaperDim, 0.5)
  assert.equal(host.getSnapshot().value.wallpaperBlur, 8)
  assert.equal(await state.set({ particleMode: 'shower' }), true)
  assert.equal(host.getSnapshot().value.particleMode, 'shower')
  assert.equal(await state.set({ gridMode: 'pulse' }), true)
  assert.equal(host.getSnapshot().value.gridMode, 'pulse')
  assert.equal(await state.set({ parallaxEnabled: false }), true)
  assert.equal(host.getSnapshot().value.parallaxEnabled, false)
  state.destroy()
  assert.equal(host.listeners.size, 0)
})
test('ready writable configForms snapshots without mode remain editable', async () => {
  const host = form()
  delete host.getSnapshot().mode
  const state = createSettingsController(host)
  assert.equal(state.get().editable, true)
  assert.equal(await state.set({ gridMode: 'ripple' }), true)
  assert.equal(host.getSnapshot().value.gridMode, 'ripple')
  state.destroy()

  const legacy = form()
  legacy.publish({ mode: 'local' })
  const readonly = createSettingsController(legacy)
  assert.equal(readonly.get().editable, false)
  readonly.destroy()
})
test('Desktop settings expose both wallpaper controls as editable sliders', () => {
  const previousRequire = globalThis.require, updates = []
  globalThis.require = () => ({
    createElement: (type, props, ...children) => ({ type, props, children }),
    useSyncExternalStore: (_, get) => get(),
  })
  try {
    const view = GraphiteSettings({ controller: {
      subscribe() {},
      get: () => ({ value: DEFAULT_SETTINGS, editable: true, saving: false, loading: false, error: '' }),
      set: update => { updates.push(update) },
    } })
    const nodes = [view], sliders = new Map()
    while (nodes.length) {
      const node = nodes.pop()
      if (!node || typeof node !== 'object') continue
      if (Array.isArray(node)) { nodes.push(...node); continue }
      if (node.type === 'input' && node.props.type === 'range') sliders.set(node.props['aria-label'], node)
      nodes.push(...(node.children ?? []))
    }
    assert.equal(sliders.get('壁纸遮罩').props.disabled, false)
    assert.equal(sliders.get('壁纸虚化').props.disabled, false)
    sliders.get('壁纸遮罩').props.onChange({ target: { value: '0.5' } })
    sliders.get('壁纸虚化').props.onChange({ target: { value: '8' } })
    assert.deepEqual(updates, [{ wallpaperDim: 0.5 }, { wallpaperBlur: 8 }])
  } finally {
    if (previousRequire === undefined) delete globalThis.require
    else globalThis.require = previousRequire
  }
})
test('settings expose particle and network modes with independent effect switches', () => {
  const previousRequire = globalThis.require, updates = []
  globalThis.require = () => ({
    createElement: (type, props, ...children) => ({ type, props, children }),
    useSyncExternalStore: (_, get) => get(),
  })
  try {
    const controls = value => {
      const nodes = [GraphiteSettings({ controller: {
        subscribe() {},
        get: () => ({ value, editable: true, saving: false, loading: false, error: '' }),
        set: update => { updates.push(update) },
      } })]
      const found = new Map()
      while (nodes.length) {
        const node = nodes.pop()
        if (!node || typeof node !== 'object') continue
        if (Array.isArray(node)) { nodes.push(...node); continue }
        if (node.props?.['aria-label']) found.set(node.props['aria-label'], node)
        nodes.push(...(node.children ?? []))
      }
      return found
    }
    const active = controls(DEFAULT_SETTINGS)
    const mode = active.get('粒子流动类型')
    assert.equal(mode.type, 'select')
    assert.deepEqual(mode.children[0].map(option => option.props.value), ['flow', 'vortex', 'shower'])
    const gridMode = active.get('网络交互模式')
    assert.equal(gridMode.type, 'select')
    assert.deepEqual(gridMode.children[0].map(option => option.props.value), ['repel', 'attract', 'ripple', 'swirl', 'pulse'])
    mode.props.onChange({ target: { value: 'vortex' } })
    gridMode.props.onChange({ target: { value: 'ripple' } })
    active.get('流体与粒子').props.onChange({ target: { checked: false } })
    active.get('鼠标弹性网络').props.onChange({ target: { checked: false } })
    const parallax = active.get('壁纸景深视差')
    assert.equal(parallax.props.checked, true)
    parallax.props.onChange({ target: { checked: false } })
    assert.deepEqual(updates, [{ particleMode: 'vortex' }, { gridMode: 'ripple' }, { fluidEnabled: false }, { gridEnabled: false }, { parallaxEnabled: false }])
    const particleOff = controls({ ...DEFAULT_SETTINGS, fluidEnabled: false })
    assert.equal(particleOff.get('粒子流动类型').props.disabled, true)
    assert.equal(particleOff.get('网络交互模式').props.disabled, false)
    assert.equal(particleOff.get('鼠标弹性网络').props.disabled, false)
    assert.equal(particleOff.get('壁纸景深视差').props.disabled, false)
    const networkOff = controls({ ...DEFAULT_SETTINGS, gridEnabled: false })
    assert.equal(networkOff.get('粒子流动类型').props.disabled, false)
    assert.equal(networkOff.get('网络交互模式').props.disabled, true)
    assert.equal(networkOff.get('网络弹性强度').props.disabled, true)
  } finally {
    if (previousRequire === undefined) delete globalThis.require
    else globalThis.require = previousRequire
  }
})
test('unavailable host disables writes; rejected save rolls back and reports error', async () => {
  const host = form(), state = createSettingsController(host)
  host.publish({ writable: false })
  assert.equal(await state.set({ gridEnabled: false }), false)
  host.publish({ writable: true })
  host.mutate = async () => false
  assert.equal(await state.set({ gridEnabled: false }), false)
  assert.equal(state.get().value.gridEnabled, true)
  assert.match(state.get().error, /保存失败/)
  state.destroy()
})
test('rapid slider changes retain the latest preview across queued host responses', async () => {
  const host = form(), state = createSettingsController(host), pending = []
  const mutate = host.mutate.bind(host)
  host.mutate = ops => new Promise(resolve => pending.push(async () => resolve(await mutate(ops))))
  const first = state.set({ flowSpeed: 0.3 }), last = state.set({ flowSpeed: 1.6 })
  await pending[0](); await first
  assert.equal(state.get().value.flowSpeed, 1.6)
  assert.equal(state.get().saving, true)
  await pending[1](); await last
  assert.equal(state.get().value.flowSpeed, 1.6)
  assert.equal(state.get().saving, false)
  state.destroy()
})
