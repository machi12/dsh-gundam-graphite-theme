import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const image = await readFile(resolve(root, 'assets/wallpaper.png'))
const files = ['config.js', 'client/physics.js', 'client/effects.js', 'client/theme.js', 'client/settings.js', 'client/index.js']
const modules = await Promise.all(files.map(async file => {
  let source = await readFile(resolve(root, 'src', file), 'utf8')
  if (file === 'client/theme.js') source = source.replace('__WALLPAPER__', `data:image/png;base64,${image.toString('base64')}`)
  return `// ${file}\n` + source.replace(/^import .* from '[^']+'\r?\n/gm, '').replace(/^export (const|function) /gm, '$1 ')
}))
const client = `// Includes MIT-licensed settings transport adapted from JohnnyTing; see THIRD_PARTY_NOTICES.md.\nwindow.__ModuleLoader__.load({ id: 'dsh-gundam-graphite-theme', factory: (require) => {\n${modules.join('\n')}\nreturn { apply, inject };\n} });\n`
await mkdir(resolve(root, 'lib'), { recursive: true })
await writeFile(resolve(root, 'lib/client.js'), client)
for (const file of ['index.js', 'config.js']) await copyFile(resolve(root, 'src', file), resolve(root, 'lib', file))
console.log(`Built Desktop plugin (${(Buffer.byteLength(client) / 1024 / 1024).toFixed(2)} MiB, wallpaper embedded).`)
