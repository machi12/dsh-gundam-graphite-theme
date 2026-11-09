export const PLUGIN_ID = 'dsh-gundam-graphite-theme'
export const FIELDS = Object.freeze({
  themeEnabled: { label: '启用石墨皮肤', default: true },
  motionEnabled: { label: '动效总开关', default: true },
  fluidEnabled: { label: '流体与粒子', default: true },
  gridEnabled: { label: '鼠标弹性网络', default: true },
  parallaxEnabled: { label: '壁纸景深视差', default: true },
  particleMode: { label: '粒子流动类型', default: 'flow', options: { flow: '流场', vortex: '涡旋', shower: '星雨' } },
  gridMode: { label: '网络交互模式', default: 'repel', options: { repel: '排斥回弹', attract: '吸引回弹', ripple: '涟漪扩散', swirl: '旋涡扭转', pulse: '呼吸脉冲' } },
  wallpaperDim: { label: '壁纸遮罩', default: 0.4, min: 0, max: 0.85, step: 0.01, unit: '%' },
  wallpaperBlur: { label: '壁纸虚化', default: 6, min: 0, max: 16, step: 1, unit: 'px' },
  surfaceOpacity: { label: '面板不透明度', default: 0.86, min: 0.6, max: 1, step: 0.01, unit: '%' },
  fluidIntensity: { label: '流体亮度', default: 0.4, min: 0, max: 1, step: 0.01, unit: '%' },
  particleDensity: { label: '粒子数量', default: 100, min: 20, max: 240, step: 10 },
  flowSpeed: { label: '流动速度', default: 0.65, min: 0.15, max: 2, step: 0.05, unit: '×' },
  gridStrength: { label: '网络弹性强度', default: 0.5, min: 0, max: 1, step: 0.05, unit: '%' },
  gridRadius: { label: '鼠标影响半径', default: 180, min: 80, max: 320, step: 10, unit: 'px' },
  fps: { label: '动效帧率上限', default: 30, min: 20, max: 60, step: 10, unit: 'fps' },
})
export const DEFAULT_SETTINGS = Object.freeze(Object.fromEntries(
  Object.entries(FIELDS).map(([key, field]) => [key, field.default])
))
export function normalizeSettings(value) {
  return Object.freeze(Object.fromEntries(Object.entries(FIELDS).map(([key, field]) => {
    const input = value?.[key]
    if (typeof field.default === 'boolean') return [key, typeof input === 'boolean' ? input : field.default]
    if (field.options) return [key, Object.hasOwn(field.options, input) ? input : field.default]
    return [key, typeof input === 'number' && Number.isFinite(input)
      ? Math.min(field.max, Math.max(field.min, input)) : field.default]
  })))
}
