import { PLUGIN_ID, FIELDS, DEFAULT_SETTINGS } from '../config.js'
import { THEME_CSS, graphiteTokens } from './theme.js'
import { createEffects } from './effects.js'
import { createSettingsController, createHostSettingsForm } from './settings.js'

export const inject = ['slots', 'theme']

export function GraphiteSettings({ controller }) {
  const React = require('react')
  const h = React.createElement
  const state = React.useSyncExternalStore(controller.subscribe, controller.get, controller.get)
  const settings = state.value
  const controls = Object.entries(FIELDS).map(([key, field]) => {
    const boolean = typeof field.default === 'boolean'
    const effectField = ['particleMode', 'gridMode', 'fluidIntensity', 'particleDensity', 'flowSpeed', 'gridStrength', 'gridRadius', 'fps'].includes(key)
    const disabled = !state.editable || (key !== 'themeEnabled' && !settings.themeEnabled)
      || (effectField && !settings.motionEnabled)
      || (['particleMode', 'fluidIntensity', 'particleDensity', 'flowSpeed'].includes(key) && !settings.fluidEnabled)
      || (['gridMode', 'gridStrength', 'gridRadius'].includes(key) && !settings.gridEnabled)
    if (field.options) return h('label', { key, className: 'gg-choice' },
      h('span', null, field.label),
      h('select', { 'aria-label': field.label, value: settings[key], disabled,
        onChange: event => { void controller.set({ [key]: event.target.value }) },
      }, Object.entries(field.options).map(([value, label]) => h('option', { key: value, value }, label))))
    const display = field.unit === '%' ? `${Math.round(settings[key] * 100)}%`
      : `${Number(settings[key].toFixed?.(2) ?? settings[key])}${field.unit || ''}`
    return h('label', { key, className: boolean ? 'gg-control' : 'gg-slider' },
      h('span', null, field.label),
      boolean ? null : h('output', null, display),
      h('input', {
        type: boolean ? 'checkbox' : 'range',
        'aria-label': field.label, disabled,
        ...(boolean ? { checked: settings[key] } : { value: settings[key], min: field.min, max: field.max, step: field.step }),
        onChange: event => { void controller.set({ [key]: boolean ? event.target.checked : Number(event.target.value) }) },
      })
    )
  })
  const message = state.error || (state.saving ? '正在保存…' : state.loading ? '正在读取设置…' : !state.editable ? '设置暂不可用，请等待 DSH 连接完成。' : '设置自动保存；系统减少动态效果开启时，动效暂停。')
  return h('section', { className: 'gg-settings', 'aria-label': '高达·石墨主题设置' },
    h('div', { className: 'gg-heading' }, h('strong', null, '高达 · 石墨'), h('span', null, 'GUNDAM / GRAPHITE')),
    h('p', { className: 'gg-description' }, '黑灰机甲壁纸，遮罩与虚化可调。动效关闭后保留静态壁纸。'),
    h('div', { className: 'gg-fields' }, controls),
    h('div', { className: 'gg-status', role: state.error ? 'alert' : 'status' }, message),
    h('button', { className: 'gg-reset', type: 'button', disabled: !state.editable, onClick: () => { void controller.set(DEFAULT_SETTINGS) } }, '恢复默认')
  )
}

export function apply(ctx) {
  if (typeof document === 'undefined' || typeof window === 'undefined') return
  ctx.effect(() => {
    const root = document.documentElement
    const style = document.createElement('style')
    style.dataset.plugin = PLUGIN_ID
    style.textContent = THEME_CSS
    document.head.appendChild(style)
    const layer = document.createElement('div')
    layer.className = 'gg-background'
    layer.setAttribute('aria-hidden', 'true')
    const wallpaper = document.createElement('div')
    wallpaper.className = 'gg-wallpaper'
    const art = document.createElement('div')
    art.className = 'gg-wallpaper-art'
    const glow = document.createElement('div')
    glow.className = 'gg-wallpaper-glow'
    art.appendChild(glow)
    wallpaper.appendChild(art)
    layer.appendChild(wallpaper)
    const shade = document.createElement('div')
    shade.className = 'gg-wallpaper-shade'
    layer.appendChild(shade)
    document.body.prepend(layer)
    const form = createHostSettingsForm(ctx, PLUGIN_ID)
    const controller = createSettingsController(form)
    const effects = createEffects(layer, controller.get().value, art)
    let stopTokens, enabled = false, lastOpacity, disposed = false
    const restorePalette = () => document.body.toggleAttribute('data-ds-dark-theme', ctx.theme.getTheme().active.colorScheme === 'dark')
    // Temporary presentation only: never persist a replacement Appearance preference.
    const stopThemeListener = ctx.on('theme/change', () => {
      if (enabled) queueMicrotask(() => { if (!disposed && enabled) document.body.setAttribute('data-ds-dark-theme', '') })
    })
    const syncGlow = () => {
      const value = controller.get().value
      layer.dataset.glow = value.themeEnabled && value.motionEnabled && !document.hidden ? 'running' : 'paused'
    }
    document.addEventListener('visibilitychange', syncGlow)
    const sync = () => {
      const value = controller.get().value
      enabled = value.themeEnabled
      root.toggleAttribute('data-gundam-graphite', enabled)
      layer.hidden = !enabled
      syncGlow()
      if (enabled) {
        root.style.setProperty('--gg-dim', String(value.wallpaperDim))
        root.style.setProperty('--gg-blur', `${value.wallpaperBlur}px`)
        root.style.setProperty('--gg-surface', String(value.surfaceOpacity))
        if (!stopTokens || lastOpacity !== value.surfaceOpacity) {
          stopTokens?.()
          stopTokens = ctx.theme.overrideTokens(PLUGIN_ID, graphiteTokens(value.surfaceOpacity))
          lastOpacity = value.surfaceOpacity
        }
        document.body.setAttribute('data-ds-dark-theme', '')
      } else {
        stopTokens?.(); stopTokens = undefined
        root.style.removeProperty('--gg-dim')
        root.style.removeProperty('--gg-blur')
        root.style.removeProperty('--gg-surface')
        restorePalette()
      }
      effects.update(value)
    }
    const unsubscribe = controller.subscribe(sync)
    sync()
    ctx.slots.inject('settings.general.item', () => ctx.slots.register({
      name: 'settings.general.item', id: 'gundam-graphite-settings', order: 30,
      inject: () => ({ controller }),
    }, GraphiteSettings))
    return () => {
      disposed = true; enabled = false
      document.removeEventListener('visibilitychange', syncGlow)
      unsubscribe(); controller.destroy(); form.destroy(); effects.destroy()
      stopThemeListener(); stopTokens?.(); restorePalette()
      layer.remove(); style.remove()
      root.removeAttribute('data-gundam-graphite')
      root.style.removeProperty('--gg-dim'); root.style.removeProperty('--gg-blur'); root.style.removeProperty('--gg-surface')
    }
  }, 'Gundam Graphite theme and effects')
}
