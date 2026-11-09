import z from '@deepseek-ai/schemastery'
import { FIELDS, PLUGIN_ID } from './config.js'

function schema(volatile) {
  return z.object(Object.fromEntries(Object.entries(FIELDS).map(([key, field]) => {
    let item = typeof field.default === 'boolean' ? z.boolean()
      : field.options ? z.union(Object.keys(field.options))
        : z.number().min(field.min).max(field.max).step(field.step)
    item = item.default(field.default).description(field.label)
    return [key, volatile ? item.volatile() : item]
  })))
}
export const Config = schema(true)
export function apply(ctx) {
  ctx.inject(['settings'], child => {
    if (typeof child.settings.register === 'function') child.settings.register(PLUGIN_ID, schema(false))
    else child.effect(() => child.settings.configure({ auto: false }, ctx.fiber))
  })
}
