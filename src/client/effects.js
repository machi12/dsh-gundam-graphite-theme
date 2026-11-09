import { particleVelocity, stepSpring } from './physics.js'

export function createEffects(layer, initial, art) {
  let settings = initial, width = 1, height = 1, raf = 0, last = 0, time = 0, networkTime = 0, disposed = false
  let particles = [], sparks = [], sparkDelay = 0, nodes = [], columns = 0, density = 0
  const pointer = { x: 0, y: 0, active: false }
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
  const coarse = window.matchMedia('(pointer: coarse)')
  const canvases = ['fluid', 'particles', 'network'].map(name => {
    const canvas = document.createElement('canvas')
    canvas.className = `gg-${name}`
    canvas.setAttribute('aria-hidden', 'true')
    layer.appendChild(canvas)
    return canvas
  })
  const contexts = canvases.map(canvas => canvas.getContext('2d'))
  const [haze, trail, grid] = contexts
  const clear = () => contexts.forEach(ctx => ctx?.clearRect(0, 0, width, height))
  const fluidOn = () => settings.fluidEnabled && settings.fluidIntensity > 0
  const gridOn = () => settings.gridEnabled && !coarse.matches
  const active = () => !disposed && contexts.every(Boolean) && settings.themeEnabled
    && settings.motionEnabled && !reduced.matches && !document.hidden && (fluidOn() || gridOn())
  const parallaxOn = () => !disposed && settings.themeEnabled && settings.motionEnabled && settings.parallaxEnabled && !reduced.matches && !document.hidden

  function syncParallax() {
    const enabled = parallaxOn()
    layer.dataset.parallax = enabled ? 'running' : 'paused'
    const x = pointer.active && enabled ? Math.max(-1, Math.min(1, pointer.x / width * 2 - 1)) : 0
    const y = pointer.active && enabled ? Math.max(-1, Math.min(1, pointer.y / height * 2 - 1)) : 0
    layer.style.setProperty('--gg-far-x', `${(-x * 3).toFixed(1)}px`)
    layer.style.setProperty('--gg-far-y', `${(-y * 2).toFixed(1)}px`)
    layer.style.setProperty('--gg-near-x', `${(x * 3).toFixed(1)}px`)
    layer.style.setProperty('--gg-near-y', `${(y * 2).toFixed(1)}px`)
  }

  function seed() {
    density = Math.max(12, Math.round(settings.particleDensity * Math.min(1.5, width * height / 1100000)))
    particles = Array.from({ length: density }, () => ({ x: Math.random() * width, y: Math.random() * height, age: Math.random() * 12, size: 0.5 + Math.random() }))
  }
  function resize() {
    width = Math.max(1, window.innerWidth)
    height = Math.max(1, window.innerHeight)
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5, 4096 / Math.max(width, height))
    canvases.forEach((canvas, i) => {
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      contexts[i]?.setTransform(dpr, 0, 0, dpr, 0, 0)
    })
    // Bound the mesh to roughly 600 nodes, including ultrawide desktops.
    const spacing = Math.max(68, Math.sqrt(width * height / 600))
    columns = Math.ceil(width / spacing) + 1
    const rows = Math.ceil(height / spacing) + 1
    nodes = Array.from({ length: columns * rows }, (_, i) => {
      const x = (i % columns) * spacing, y = Math.floor(i / columns) * spacing
      return { ax: x, ay: y, x, y, vx: 0, vy: 0 }
    })
    seed(); sparks = []; sparkDelay = 0; syncParallax()
  }
  function drawSparks(dt) {
    sparkDelay -= dt
    if (sparkDelay <= 0) {
      const rect = art.getBoundingClientRect()
      const source = [[0.645, 0.32], [0.798, 0.604], [0.666, 0.755]][Math.floor(Math.random() * 3)]
      for (let i = 0; i < 2; i++) sparks.push({
        x: rect.left + rect.width * source[0] + (Math.random() - 0.5) * 18,
        y: rect.top + rect.height * source[1] + (Math.random() - 0.5) * 18,
        vx: -12 - Math.random() * 18, vy: -16 - Math.random() * 30,
        life: 0.8 + Math.random() * 0.6, age: 0, size: 0.5 + Math.random(),
      })
      sparkDelay = 2 + Math.random() * 2
    }
    sparks = sparks.filter(spark => spark.age + dt < spark.life)
    for (const spark of sparks) {
      const x = spark.x, y = spark.y
      spark.x += spark.vx * dt; spark.y += spark.vy * dt; spark.age += dt
      const alpha = Math.min(1, spark.age * 5, (spark.life - spark.age) * 3) * settings.fluidIntensity * 0.75
      trail.strokeStyle = `rgba(255,77,65,${alpha * 0.5})`
      trail.beginPath(); trail.moveTo(x, y); trail.lineTo(spark.x, spark.y); trail.stroke()
      trail.fillStyle = `rgba(255,104,83,${alpha})`
      trail.beginPath(); trail.arc(spark.x, spark.y, spark.size, 0, Math.PI * 2); trail.fill()
    }
  }
  function drawFluid(dt) {
    haze.clearRect(0, 0, width, height)
    if (!fluidOn()) { trail.clearRect(0, 0, width, height); return }
    const intensity = settings.fluidIntensity
    for (let i = 0; i < 3; i++) {
      const x = width * (0.2 + i * 0.27) + Math.sin(time * 0.13 + i * 2) * width * 0.12
      const y = height * (0.5 + Math.cos(time * 0.12 + i * 2) * 0.25)
      const radius = Math.max(width, height) * 0.33
      const gradient = haze.createRadialGradient(x, y, 0, x, y, radius)
      gradient.addColorStop(0, `rgba(158,170,184,${intensity * 0.10})`)
      gradient.addColorStop(0.45, `rgba(110,121,138,${intensity * 0.04})`)
      gradient.addColorStop(1, 'rgba(110,121,138,0)')
      haze.fillStyle = gradient
      haze.fillRect(0, 0, width, height)
    }
    trail.globalCompositeOperation = 'destination-out'
    trail.fillStyle = `rgba(0,0,0,${1 - Math.exp(-dt * 4)})`
    trail.fillRect(0, 0, width, height)
    trail.globalCompositeOperation = 'source-over'
    trail.lineWidth = 0.7
    for (const p of particles) {
      const previousX = p.x, previousY = p.y
      const velocity = particleVelocity(p.x, p.y, time, settings.particleMode, width, height)
      p.x += velocity.x * dt * settings.flowSpeed
      p.y += velocity.y * dt * settings.flowSpeed
      p.age += dt
      if (p.x < -10 || p.x > width + 10 || p.y < -10 || p.y > height + 10 || p.age > 18) {
        p.x = Math.random() * width; p.y = Math.random() * height; p.age = 0
        continue
      }
      const fade = Math.min(1, p.age, 18 - p.age)
      trail.strokeStyle = `rgba(187,196,208,${0.55 * intensity * fade})`
      trail.beginPath(); trail.moveTo(previousX, previousY); trail.lineTo(p.x, p.y); trail.stroke()
      trail.fillStyle = `rgba(224,230,238,${0.42 * intensity * fade})`
      trail.beginPath(); trail.arc(p.x, p.y, p.size, 0, Math.PI * 2); trail.fill()
    }
    drawSparks(dt)
  }
  function drawGrid(dt) {
    grid.clearRect(0, 0, width, height)
    if (!gridOn()) return
    nodes.forEach(node => stepSpring(node, pointer, settings.gridRadius, settings.gridStrength, dt, settings.gridMode, networkTime))
    grid.lineWidth = 0.65
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i]
      const proximity = pointer.active ? Math.max(0, 1 - Math.hypot(n.ax - pointer.x, n.ay - pointer.y) / (settings.gridRadius * 1.5)) : 0
      const stretch = Math.min(1, Math.hypot(n.x - n.ax, n.y - n.ay) / 20)
      const alpha = 0.018 + Math.max(proximity, stretch) * 0.19
      grid.strokeStyle = `rgba(197,206,217,${alpha})`
      grid.beginPath()
      if (i % columns < columns - 1) { const next = nodes[i + 1]; grid.moveTo(n.x, n.y); grid.lineTo(next.x, next.y) }
      if (i + columns < nodes.length) { const next = nodes[i + columns]; grid.moveTo(n.x, n.y); grid.lineTo(next.x, next.y) }
      grid.stroke()
      if (proximity > 0.15 || stretch > 0.1) {
        grid.fillStyle = `rgba(225,231,238,${alpha * 1.7})`
        grid.fillRect(n.x - 1, n.y - 1, 2, 2)
      }
    }
  }
  function frame(now) {
    raf = 0
    if (!active()) return
    if (!last) last = now - 1000 / settings.fps
    const elapsed = now - last
    if (elapsed + 0.5 >= 1000 / settings.fps) {
      const dt = Math.min(elapsed / 1000, 0.05)
      last = now; time += dt * settings.flowSpeed; networkTime += dt
      drawFluid(dt); drawGrid(dt)
    }
    raf = window.requestAnimationFrame(frame)
  }
  function sync() {
    if (raf) window.cancelAnimationFrame(raf)
    raf = 0; last = 0
    clear()
    if (!active() || !fluidOn()) { sparks = []; sparkDelay = 0 }
    syncParallax()
    layer.dataset.motion = active() ? 'running' : 'paused'
    if (active()) raf = window.requestAnimationFrame(frame)
  }
  const move = event => {
    if (event.pointerType === 'touch') return
    pointer.x = event.clientX; pointer.y = event.clientY; pointer.active = true
    syncParallax()
  }
  const leave = () => { pointer.active = false; syncParallax() }
  const visibility = () => { leave(); sync() }
  window.addEventListener('pointermove', move, { passive: true })
  document.documentElement.addEventListener('pointerleave', leave, { passive: true })
  window.addEventListener('blur', leave)
  window.addEventListener('resize', resize)
  document.addEventListener('visibilitychange', visibility)
  reduced.addEventListener('change', sync)
  coarse.addEventListener('change', sync)
  resize(); sync()
  return {
    update(next) {
      const reseed = next.particleDensity !== settings.particleDensity
      settings = next
      if (reseed) seed()
      sync()
    },
    destroy() {
      disposed = true
      if (raf) window.cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', move)
      document.documentElement.removeEventListener('pointerleave', leave)
      window.removeEventListener('blur', leave)
      window.removeEventListener('resize', resize)
      document.removeEventListener('visibilitychange', visibility)
      reduced.removeEventListener('change', sync)
      coarse.removeEventListener('change', sync)
      canvases.forEach(canvas => { canvas.width = 1; canvas.height = 1; canvas.remove() })
      for (const name of ['--gg-far-x', '--gg-far-y', '--gg-near-x', '--gg-near-y']) layer.style.removeProperty(name)
      nodes = []; particles = []; sparks = []
    },
  }
}
