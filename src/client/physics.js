// Smooth time-varying vector field; particles integrate velocity through it.
export function flowAt(x, y, time) {
  const angle = Math.sin(x * 0.0032 + time * 0.18) * 1.7
    + Math.cos(y * 0.004 - time * 0.13) * 1.3
    + Math.sin((x + y) * 0.002 + time * 0.09)
  return { x: Math.cos(angle) * 23 + 9, y: Math.sin(angle) * 20 - 7 }
}

export function particleVelocity(x, y, time, mode, width, height) {
  if (mode === 'vortex') {
    const dx = x - width / 2, dy = y - height / 2
    const distance = Math.max(60, Math.hypot(dx, dy))
    return { x: (-dy * 34 + dx * 4) / distance, y: (dx * 34 + dy * 4) / distance }
  }
  if (mode === 'shower') return { x: -32 + Math.sin(y * 0.01 + time) * 4, y: 48 }
  return flowAt(x, y, time)
}

export function stepSpring(node, pointer, radius, strength, dt, mode = 'repel', time = 0) {
  let tx = node.ax, ty = node.ay
  if (pointer.active && strength > 0) {
    const dx = node.ax - pointer.x, dy = node.ay - pointer.y
    const distance = Math.hypot(dx, dy)
    if (distance < radius) {
      const ux = distance > 0.01 ? dx / distance : 1
      const uy = distance > 0.01 ? dy / distance : 0
      const falloff = 1 - distance / radius
      let offset = falloff ** 2 * 65 * strength
      if (mode === 'attract') offset *= -1
      if (mode === 'ripple') offset = Math.sin(distance / radius * Math.PI * 4 - time * 7) * falloff * 50 * strength
      if (mode === 'pulse') offset *= Math.sin(time * 5)
      if (mode === 'swirl') { tx -= uy * offset; ty += ux * offset }
      else { tx += ux * offset; ty += uy * offset }
    }
  }
  // Substeps make a 20 fps cap behave like a 60 fps spring, including on resume.
  const steps = Math.max(1, Math.ceil(dt / (1 / 120)))
  const h = Math.min(dt, 0.05) / steps
  for (let i = 0; i < steps; i++) {
    node.vx += ((tx - node.x) * 95 - node.vx * 12) * h
    node.vy += ((ty - node.y) * 95 - node.vy * 12) * h
    node.x += node.vx * h
    node.y += node.vy * h
  }
}
