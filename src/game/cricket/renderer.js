import { ARENA } from './engine.js'

const W = ARENA.width
const H = ARENA.height
const GROUND = ARENA.groundY

const SERIF = '"Songti SC", "Noto Serif SC", "Source Han Serif SC", "STSong", "SimSun", serif'
const SANS = '"PingFang SC", "Microsoft YaHei", "Noto Sans SC", system-ui, sans-serif'

function rgba(hex, alpha = 1) {
  if (!hex || typeof hex !== 'string') return `rgba(40,40,40,${alpha})`
  const clean = hex.replace('#', '')
  const value = clean.length === 3
    ? clean.split('').map((c) => c + c).join('')
    : clean.padEnd(6, '0')
  const r = parseInt(value.slice(0, 2), 16)
  const g = parseInt(value.slice(2, 4), 16)
  const b = parseInt(value.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function lerp(a, b, t) {
  return a + (b - a) * t
}

function easeOut(t) {
  return 1 - Math.pow(1 - clamp(t, 0, 1), 3)
}

export class CricketRenderer {
  constructor(canvas) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.dpr = 1
    this.dark = false
    this.bg = null
    this.time = 0
    this.particles = []
    this.floaters = []
    this.slashes = []
    this.beams = []
    this.rings = []
    this.ghosts = []
    this.shake = 0
    this.flash = 0
    this.sudden = 0
    this.resize()
  }

  resize() {
    const dpr = Math.min(2, Math.max(1, window.devicePixelRatio || 1))
    this.dpr = dpr
    this.canvas.width = Math.round(W * dpr)
    this.canvas.height = Math.round(H * dpr)
    const ctx = this.ctx
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    this.bg = null
  }

  setTheme(dark) {
    if (this.dark === dark) return
    this.dark = dark
    this.bg = null
  }

  ensureBackground() {
    if (this.bg) return
    const bg = document.createElement('canvas')
    bg.width = W
    bg.height = H
    const ctx = bg.getContext('2d')
    const paper = this.dark ? '#e9e1cf' : '#f4eee0'
    ctx.fillStyle = paper
    ctx.fillRect(0, 0, W, H)

    // 纸纹：稀疏的墨点，而不是噪点滤镜
    ctx.save()
    let seed = 1987
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0
      return seed / 4294967296
    }
    for (let i = 0; i < 1200; i += 1) {
      const x = rand() * W
      const y = rand() * H
      const a = 0.012 + rand() * 0.028
      ctx.fillStyle = this.dark ? `rgba(46,42,34,${a})` : `rgba(69,58,41,${a})`
      ctx.beginPath()
      ctx.arc(x, y, 0.4 + rand() * 1.1, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()

    // 场心的大圆：几笔不规则的墨线
    ctx.save()
    ctx.translate(W / 2, 356)
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath()
      ctx.ellipse(0, 0, 356 - i * 4, 206 - i * 3, -0.02, 0, Math.PI * 2)
      ctx.strokeStyle = `rgba(28,40,32,${0.06 - i * 0.012})`
      ctx.lineWidth = 1.2 + i * 1.8
      ctx.stroke()
    }
    ctx.restore()

    // 巨大而极淡的“斗”字水印
    ctx.save()
    ctx.translate(W / 2, 410)
    ctx.rotate(-0.025)
    ctx.font = `italic 360px ${SERIF}`
    ctx.textAlign = 'center'
    ctx.fillStyle = 'rgba(27,36,31,0.038)'
    ctx.fillText('斗', 0, 0)
    ctx.restore()

    // 地面
    const floor = ctx.createLinearGradient(0, GROUND, 0, H)
    floor.addColorStop(0, 'rgba(29,40,33,0.11)')
    floor.addColorStop(0.18, 'rgba(29,40,33,0.035)')
    floor.addColorStop(1, 'rgba(29,40,33,0)')
    ctx.fillStyle = floor
    ctx.fillRect(0, GROUND, W, H - GROUND)
    ctx.strokeStyle = 'rgba(24,35,28,0.36)'
    ctx.lineWidth = 1.1
    ctx.beginPath()
    ctx.moveTo(26, GROUND + 0.5)
    ctx.lineTo(W - 26, GROUND + 0.5)
    ctx.stroke()

    // 地面短刻线
    ctx.strokeStyle = 'rgba(24,35,28,0.15)'
    ctx.lineWidth = 1
    for (let x = 56; x < W - 40; x += 46) {
      const h = 3 + (Math.sin(x * 1.7) + 1) * 2
      ctx.beginPath()
      ctx.moveTo(x, GROUND + 8)
      ctx.lineTo(x + 5, GROUND + 8 + h)
      ctx.stroke()
    }

    // 边界
    for (const x of [ARENA.left - 28, ARENA.right + 28]) {
      ctx.save()
      ctx.setLineDash([5, 8])
      ctx.strokeStyle = 'rgba(30,45,35,0.22)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(x, 262)
      ctx.lineTo(x, GROUND)
      ctx.stroke()
      ctx.restore()
      ctx.fillStyle = 'rgba(30,45,35,0.38)'
      ctx.font = `13px ${SERIF}`
      ctx.textAlign = 'center'
      ctx.fillText('界', x, 250)
      ctx.beginPath()
      ctx.arc(x, GROUND, 3.5, 0, Math.PI * 2)
      ctx.fill()
    }

    // 中线与角标
    ctx.strokeStyle = 'rgba(30,45,35,0.07)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(W / 2, 226)
    ctx.lineTo(W / 2, GROUND + 14)
    ctx.stroke()

    ctx.fillStyle = 'rgba(24,35,28,0.32)'
    ctx.font = `11px ${SANS}`
    ctx.textAlign = 'left'
    ctx.fillText('限定词 · 斗兽场', 42, 40)
    ctx.textAlign = 'right'
    ctx.fillText('AUTO / 自动裁决', W - 42, 40)
    ctx.textAlign = 'center'
    ctx.fillText('SCUTWiki · INTERACTION 001', W / 2, 40)

    // 四角登记线
    ctx.strokeStyle = 'rgba(24,35,28,0.14)'
    ctx.lineWidth = 1
    for (const [x, y, sx, sy] of [
      [28, 26, 1, 1],
      [W - 28, 26, -1, 1],
      [28, H - 24, 1, -1],
      [W - 28, H - 24, -1, -1],
    ]) {
      ctx.beginPath()
      ctx.moveTo(x, y + sy * 16)
      ctx.lineTo(x, y)
      ctx.lineTo(x + sx * 16, y)
      ctx.stroke()
    }

    // 场边的印章
    ctx.save()
    ctx.translate(W - 66, 88)
    ctx.rotate(0.06)
    ctx.strokeStyle = 'rgba(150,58,42,0.55)'
    ctx.lineWidth = 2
    ctx.strokeRect(-34, -17, 68, 34)
    ctx.fillStyle = 'rgba(150,58,42,0.72)'
    ctx.font = `15px ${SERIF}`
    ctx.textAlign = 'center'
    ctx.fillText('试行', 0, 6)
    ctx.restore()

    this.bg = bg
  }

  processEvents(events, state) {
    for (const event of events) {
      switch (event.type) {
        case 'hit': {
          const crit = Boolean(event.crit)
          this.floaters.push({
            x: event.x + (Math.random() - 0.5) * 12,
            y: GROUND - (event.z || 42) - 18,
            text: `${crit ? '暴 ' : '-'}${event.amount}`,
            color: crit ? '#9d2f1d' : '#372a21',
            life: 0.9,
            maxLife: 0.9,
            size: crit ? 21 : 16,
            vy: -38,
          })
          this.spawnParticles(event.x, GROUND - (event.z || 42), event.color || '#b85a3a', crit ? 12 : 6, crit ? 120 : 76)
          this.shake = Math.max(this.shake, crit ? 7 : 3.5)
          this.flash = Math.max(this.flash, crit ? 0.08 : 0.03)
          break
        }
        case 'dot':
          this.spawnParticles(event.x, GROUND - (event.z || 50), event.color || '#b85a3a', 2, 28, 0.5)
          break
        case 'heal': {
          this.floaters.push({
            x: event.x,
            y: GROUND - (event.z || 0) - 70,
            text: `+${event.amount}`,
            color: '#3f7d57',
            life: 0.9,
            maxLife: 0.9,
            size: 15,
            vy: -30,
          })
          this.spawnParticles(event.x, GROUND - (event.z || 0) - 30, '#6f9b83', 5, 34, 0.35, -20)
          break
        }
        case 'shield':
          this.rings.push({
            type: 'shield',
            side: event.side,
            x: event.x,
            z: event.z || 0,
            life: 0.55,
            maxLife: 0.55,
            color: '#6f8f9b',
          })
          break
        case 'slash':
          this.slashes.push({ ...event, life: event.life || 0.26, maxLife: event.life || 0.26 })
          break
        case 'beam':
          this.beams.push({ ...event, life: event.life || 0.32, maxLife: event.life || 0.32 })
          break
        case 'explosion':
          this.rings.push({
            type: 'explosion',
            x: event.x,
            z: 0,
            radius: event.radius,
            life: event.life || 0.55,
            maxLife: event.life || 0.55,
            color: event.color,
          })
          this.spawnParticles(event.x, GROUND - 6, event.color || '#9a5b3f', 22, 180, 0.8, 200)
          this.shake = Math.max(this.shake, 10)
          break
        case 'cast':
          this.rings.push({
            type: 'cast',
            side: event.side,
            x: event.x,
            z: event.z || 0,
            life: 0.4,
            maxLife: 0.4,
            color: event.color,
          })
          break
        case 'dash':
        case 'dashTrail':
          if (event.type === 'dashTrail' && Math.random() > 0.3) break
          this.spawnParticles(
            event.x,
            GROUND - (event.z || 0) - 26,
            event.color || '#5a6a5c',
            2,
            26,
            0.28,
            -12,
          )
          break
        case 'aura':
          this.rings.push({
            type: 'aura',
            side: event.side,
            x: event.x,
            z: event.z || 0,
            life: 0.7,
            maxLife: 0.7,
            color: event.color,
          })
          break
        case 'summon':
          this.rings.push({
            type: 'summon',
            x: event.x,
            z: event.z || 80,
            life: 0.7,
            maxLife: 0.7,
            color: event.color,
          })
          break
        case 'summonShot':
          this.spawnParticles(event.x, GROUND - (event.z || 70), event.color || '#6f7fa0', 2, 24, 0.35)
          break
        case 'projectileHit':
          this.spawnParticles(event.x, GROUND - (event.z || 40), event.color || '#8a6a49', 5, 60, 0.4)
          break
        case 'text':
          this.floaters.push({
            x: event.x,
            y: GROUND - (event.z || 0),
            text: event.text,
            color: event.color || '#6b6658',
            life: event.life || 0.8,
            maxLife: event.life || 0.8,
            size: event.text?.length > 3 ? 12 : 14,
            vy: -18,
          })
          break
        case 'shake':
          this.shake = Math.max(this.shake, event.power || 5)
          break
        case 'sudden':
          this.sudden = 1
          this.shake = Math.max(this.shake, 8)
          break
        case 'arbitration':
          this.rings.push({
            type: 'arbitration',
            side: event.side,
            x: state.fighters[event.side]?.x || W / 2,
            z: 0,
            life: 1.4,
            maxLife: 1.4,
            color: '#c0a046',
          })
          this.spawnParticles(state.fighters[event.side]?.x || W / 2, GROUND - 40, '#c0a046', 24, 100, 1.1, -60)
          this.shake = Math.max(this.shake, 9)
          break
        case 'jump':
          this.spawnParticles(event.x, GROUND, '#8a806c', 4, 34, 0.35, -10)
          break
        case 'ko':
          this.spawnParticles(event.x, GROUND - 30, '#8b4b3b', 20, 120, 0.9, 90)
          this.shake = Math.max(this.shake, 12)
          break
        case 'surrender':
          this.floaters.push({
            x: event.x,
            y: GROUND - 110,
            text: '认输',
            color: '#6e6a5f',
            life: 1.4,
            maxLife: 1.4,
            size: 19,
            vy: -12,
          })
          break
        case 'absolute':
          this.rings.push({
            type: 'absolute',
            side: event.side,
            x: event.x,
            z: event.z || 0,
            life: 1.2,
            maxLife: 1.2,
            color: '#c0a046',
          })
          this.spawnParticles(event.x, GROUND - 40, '#c0a046', 18, 90, 1, -40)
          this.shake = Math.max(this.shake, 6)
          break
        case 'antiAbsolute':
          this.rings.push({
            type: 'antiAbsolute',
            x: event.x,
            z: event.z || 40,
            life: 1.1,
            maxLife: 1.1,
            color: '#c0a046',
          })
          this.spawnParticles(event.x, GROUND - 40, '#e6d39a', 20, 110, 0.9, -50)
          break
        case 'mark':
          this.rings.push({
            type: 'mark',
            x: event.x,
            z: event.z || 44,
            life: 0.8,
            maxLife: 0.8,
            color: event.color || '#b08a4f',
          })
          break
        case 'counter':
          this.rings.push({
            type: 'counter',
            x: event.x,
            z: event.z || 40,
            life: 0.7,
            maxLife: 0.7,
            color: '#7d6fa8',
          })
          break
        case 'chain':
          this.rings.push({
            type: 'chain',
            x: event.x,
            z: event.z || 40,
            life: 0.5,
            maxLife: 0.5,
            color: '#7d6fa8',
          })
          break
        case 'zone':
          this.rings.push({
            type: 'zone',
            x: event.x,
            z: 0,
            life: 0.8,
            maxLife: 0.8,
            color: event.color,
          })
          break
        case 'swap':
          this.spawnParticles(event.x, GROUND - 42, event.color || '#8a7fa0', 14, 90, 0.6, 40)
          this.shake = Math.max(this.shake, 4)
          break
        case 'seal':
          this.floaters.push({
            x: event.x,
            y: GROUND - (event.z || 50),
            text: '封',
            color: '#8a6a49',
            life: 0.9,
            maxLife: 0.9,
            size: 17,
            vy: -20,
          })
          break
        case 'echo':
          this.rings.push({
            type: 'echo',
            x: event.x,
            z: event.z || 40,
            life: 0.5,
            maxLife: 0.5,
            color: event.color,
          })
          break
        default:
          break
      }
    }
  }

  spawnParticles(x, y, color, count, speed = 80, life = 0.6, gravity = 160) {
    for (let i = 0; i < count; i += 1) {
      const angle = Math.random() * Math.PI * 2
      const velocity = speed * (0.35 + Math.random() * 0.75)
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity - speed * 0.3,
        life: life * (0.55 + Math.random() * 0.6),
        maxLife: life,
        size: 1.2 + Math.random() * 2.4,
        color,
        gravity,
        shape: Math.random() > 0.7 ? 'line' : 'dot',
      })
    }
    if (this.particles.length > 420) this.particles.splice(0, this.particles.length - 420)
  }

  render(state, dt, now) {
    if (!state) return
    this.time += Math.min(0.05, dt || 0.016)
    this.ensureBackground()
    const ctx = this.ctx
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
    ctx.clearRect(0, 0, W, H)

    this.updateEffects(Math.min(0.05, dt || 0.016))
    const sx = (Math.random() - 0.5) * this.shake
    const sy = (Math.random() - 0.5) * this.shake
    ctx.save()
    ctx.translate(sx, sy)

    ctx.drawImage(this.bg, 0, 0)

    this.drawAreas(state)
    const fighters = [...state.fighters].sort((a, b) => a.x - b.x)
    for (const fighter of fighters) this.drawFighter(fighter, state, now)
    for (const companion of state.companions) this.drawCompanion(companion, state)
    this.drawProjectiles(state)
    this.drawEchoes(state)
    this.drawEffects(state)
    this.drawParticles()
    this.drawFloaters()
    ctx.restore()

    // 终局与灵光
    if (state.suddenDeath) {
      const alpha = 0.012 + Math.sin(this.time * 3) * 0.008 + this.sudden * 0.06
      ctx.fillStyle = `rgba(145,58,42,${Math.max(0, alpha)})`
      ctx.fillRect(0, 0, W, H)
    }
    if (this.flash > 0) {
      ctx.fillStyle = `rgba(255,248,228,${this.flash})`
      ctx.fillRect(0, 0, W, H)
    }
    this.flash *= Math.exp(-9 * (dt || 0.016))
    this.sudden *= Math.exp(-1.2 * (dt || 0.016))
  }

  updateEffects(dt) {
    this.shake *= Math.exp(-11 * dt)
    if (this.shake < 0.15) this.shake = 0
    for (const particle of this.particles) {
      particle.life -= dt
      particle.vy += particle.gravity * dt
      particle.x += particle.vx * dt
      particle.y += particle.vy * dt
      particle.vx *= Math.exp(-1.4 * dt)
    }
    this.particles = this.particles.filter((p) => p.life > 0)
    for (const floater of this.floaters) {
      floater.life -= dt
      floater.y += floater.vy * dt
      floater.vy *= 0.96
    }
    this.floaters = this.floaters.filter((f) => f.life > 0)
    for (const list of [this.slashes, this.beams, this.rings, this.ghosts]) {
      for (const item of list) item.life -= dt
    }
    this.slashes = this.slashes.filter((item) => item.life > 0)
    this.beams = this.beams.filter((item) => item.life > 0)
    this.rings = this.rings.filter((item) => item.life > 0)
    this.ghosts = this.ghosts.filter((item) => item.life > 0)
  }

  drawAreas(state) {
    const ctx = this.ctx
    for (const area of state.areas) {
      const progress = area.persistent
        ? clamp(area.t / (area.duration || 4), 0, 1)
        : clamp(area.t / area.delay, 0, 1)
      const pulse = area.persistent
        ? 0.72 + Math.sin(this.time * 5) * 0.08
        : 0.6 + Math.sin(this.time * 14) * 0.15
      ctx.save()
      ctx.translate(area.x, GROUND)
      ctx.scale(1, 0.3)
      ctx.beginPath()
      ctx.arc(0, 0, area.radius, 0, Math.PI * 2)
      ctx.fillStyle = rgba(area.color || '#8a5a6e', 0.08 + progress * 0.08)
      ctx.fill()
      ctx.setLineDash([7, 7])
      ctx.lineWidth = 1.6
      ctx.strokeStyle = rgba(area.color || '#8a5a6e', 0.4 + progress * 0.35)
      ctx.stroke()
      ctx.setLineDash([])
      ctx.beginPath()
      ctx.arc(0, 0, area.radius * pulse, 0, Math.PI * 2)
      ctx.strokeStyle = rgba(area.color || '#8a5a6e', 0.22)
      ctx.stroke()
      ctx.restore()
      ctx.save()
      ctx.fillStyle = 'rgba(38,31,24,0.5)'
      ctx.font = `10px ${SANS}`
      ctx.textAlign = 'center'
      ctx.fillText(area.contract?.skill || '阵', area.x, GROUND + 52)
      ctx.restore()
    }
  }

  drawEchoes(state) {
    const ctx = this.ctx
    for (const echo of state.echoes || []) {
      const pulse = 0.5 + Math.sin(this.time * 12) * 0.2
      const y = GROUND - 44
      ctx.save()
      ctx.globalAlpha = 0.18 + pulse * 0.1
      ctx.strokeStyle = rgba(echo.color || '#8a7fa0', 0.8)
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.arc(echo.x, y, 10 + pulse * 4, 0, Math.PI * 2)
      ctx.stroke()
      ctx.fillStyle = rgba(echo.color || '#8a7fa0', 0.22)
      ctx.beginPath()
      ctx.arc(echo.x, y, 4, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }
  }

  drawProjectiles(state) {
    const ctx = this.ctx
    for (const projectile of state.projectiles) {
      const y = GROUND - projectile.z
      ctx.save()
      if (projectile.trail?.length) {
        for (let i = 0; i < projectile.trail.length; i += 1) {
          const point = projectile.trail[i]
          const alpha = (i / projectile.trail.length) * 0.18
          ctx.fillStyle = rgba(projectile.color, alpha)
          ctx.beginPath()
          ctx.arc(point.x, GROUND - point.z, projectile.radius * (0.35 + i / projectile.trail.length * 0.5), 0, Math.PI * 2)
          ctx.fill()
        }
      }
      const glow = ctx.createRadialGradient(projectile.x, y, 0, projectile.x, y, projectile.radius * 4.5)
      glow.addColorStop(0, rgba(projectile.color, 0.75))
      glow.addColorStop(0.35, rgba(projectile.color, 0.32))
      glow.addColorStop(1, rgba(projectile.color, 0))
      ctx.fillStyle = glow
      ctx.beginPath()
      ctx.arc(projectile.x, y, projectile.radius * 4.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.translate(projectile.x, y)
      ctx.rotate(projectile.vx >= 0 ? 0.1 : Math.PI - 0.1)
      ctx.fillStyle = rgba(projectile.color, 0.95)
      ctx.beginPath()
      ctx.moveTo(projectile.radius * 1.7, 0)
      ctx.lineTo(-projectile.radius * 0.6, projectile.radius)
      ctx.lineTo(-projectile.radius * 1.6, 0)
      ctx.lineTo(-projectile.radius * 0.6, -projectile.radius)
      ctx.closePath()
      ctx.fill()
      ctx.fillStyle = 'rgba(255,250,235,0.75)'
      ctx.beginPath()
      ctx.arc(projectile.radius * 0.3, 0, Math.max(1, projectile.radius * 0.28), 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }
  }

  drawCompanion(companion, state) {
    const ctx = this.ctx
    const owner = state.fighters[companion.side]
    const x = companion.x
    const y = GROUND - companion.z + Math.sin(this.time * 3 + companion.id) * 3
    ctx.save()
    ctx.setLineDash([2, 6])
    ctx.strokeStyle = rgba(companion.color, 0.18)
    ctx.beginPath()
    ctx.moveTo(owner.x, GROUND - owner.z - 40)
    ctx.lineTo(x, y)
    ctx.stroke()
    ctx.setLineDash([])

    const glow = ctx.createRadialGradient(x, y, 0, x, y, 30)
    glow.addColorStop(0, rgba(companion.color, 0.32))
    glow.addColorStop(1, rgba(companion.color, 0))
    ctx.fillStyle = glow
    ctx.beginPath()
    ctx.arc(x, y, 30, 0, Math.PI * 2)
    ctx.fill()

    ctx.translate(x, y)
    ctx.strokeStyle = rgba(companion.color, 0.9)
    ctx.fillStyle = rgba(companion.color, 0.22)
    ctx.lineWidth = 1.6
    ctx.beginPath()
    ctx.moveTo(-12, 0)
    ctx.quadraticCurveTo(-2, -14, 14, -4)
    ctx.quadraticCurveTo(0, 7, -12, 0)
    ctx.fill()
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(-5, -4)
    ctx.lineTo(-14, -13)
    ctx.moveTo(2, -5)
    ctx.lineTo(8, -16)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(14, -4, 2.2, 0, Math.PI * 2)
    ctx.fillStyle = rgba(companion.color, 0.95)
    ctx.fill()
    ctx.restore()

    ctx.save()
    ctx.fillStyle = 'rgba(34,38,33,0.42)'
    ctx.font = `9px ${SANS}`
    ctx.textAlign = 'center'
    ctx.fillText(companion.skill, x, y - 26)
    ctx.restore()
  }

  drawFighter(fighter, state, now) {
    const ctx = this.ctx
    const ground = GROUND
    const bob = fighter.state === 'idle' ? Math.sin(now * 2.2 + fighter.side * 2.1) * 1.4 : 0
    const feet = ground - fighter.z + bob
    const pal = this.fighterPalette(fighter)
    const action = fighter.action
    const windup = action ? clamp(action.elapsed / Math.max(0.01, action.windup), 0, 1) : 0
    const resolved = action?.resolved
    const attacking = Boolean(action)
    const isKo = fighter.state === 'ko'
    const isSurrender = Boolean(fighter.surrender)

    // 地面影子 + 阵营色脚环
    ctx.save()
    ctx.globalAlpha = 0.2 * clamp(1 - fighter.z / 220, 0.2, 1)
    ctx.fillStyle = '#1b241f'
    ctx.beginPath()
    ctx.ellipse(fighter.x, ground + 2, 24 + fighter.z * 0.08, 6, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
    ctx.save()
    ctx.strokeStyle = rgba(pal.accent, 0.26)
    ctx.lineWidth = 1.2
    ctx.beginPath()
    ctx.ellipse(fighter.x, ground + 3, 30, 7, 0, 0, Math.PI * 2)
    ctx.stroke()
    ctx.restore()

    ctx.save()
    ctx.translate(fighter.x, feet)
    if (isKo) {
      ctx.rotate(fighter.facing * 1.28)
      ctx.translate(0, -6)
    } else if (isSurrender) {
      ctx.scale(1, 0.8)
      ctx.translate(0, 4)
    } else if (fighter.state === 'dash') {
      ctx.scale(1, 1)
    }
    ctx.scale(fighter.facing, 1)
    const shrink = fighter.statuses?.find((status) => status.type === 'shrink' && status.until > state.t)
    const inflate = fighter.statuses?.find((status) => status.type === 'inflate' && status.until > state.t)
    const bodyScale = shrink ? (shrink.factor || 0.65) : inflate ? 1.18 : 1
    if (bodyScale !== 1) ctx.scale(bodyScale, bodyScale)

    const lean = isKo || isSurrender
      ? 0
      : attacking
        ? (resolved ? 0.16 : -0.12 + windup * 0.08)
        : Math.sin(now * 1.6 + fighter.side) * 0.012
    ctx.rotate(lean)

    const walk = fighter.state === 'move' ? Math.sin(fighter.walkPhase) : 0
    const air = fighter.z > 2
    const legSwing = air ? 0.55 : walk * 0.55
    const armSwing = air ? -0.35 : walk * 0.35

    // 腿
    ctx.lineCap = 'round'
    ctx.strokeStyle = pal.ink
    ctx.lineWidth = 4.2
    ctx.beginPath()
    ctx.moveTo(-3, -31)
    ctx.quadraticCurveTo(-10 - legSwing * 8, -15, -12 - legSwing * 10, -1)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(3, -31)
    ctx.quadraticCurveTo(10 + legSwing * 8, -15, 12 + legSwing * 10, -1)
    ctx.stroke()
    // 鞋
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(-14 - legSwing * 10, -1)
    ctx.lineTo(-7 - legSwing * 10, -1)
    ctx.moveTo(10 + legSwing * 10, -1)
    ctx.lineTo(17 + legSwing * 10, -1)
    ctx.stroke()

    // 披风：游侠/术士/唤灵的背影轮廓，和近战系分开
    if (['ranger', 'mage', 'summoner'].includes(fighter.persona)) {
      ctx.beginPath()
      ctx.moveTo(-13, -58)
      ctx.quadraticCurveTo(-31, -35, -25, -12)
      ctx.quadraticCurveTo(-8, -6, 0, -12)
      ctx.quadraticCurveTo(10, -6, 24, -13)
      ctx.quadraticCurveTo(30, -34, 13, -58)
      ctx.closePath()
      ctx.fillStyle = rgba(pal.accent, 0.11)
      ctx.fill()
      ctx.strokeStyle = rgba(pal.accent, 0.26)
      ctx.lineWidth = 1
      ctx.stroke()
    }

    // 袍身
    ctx.beginPath()
    ctx.moveTo(-15, -60)
    ctx.quadraticCurveTo(-25, -42, -19, -20)
    ctx.quadraticCurveTo(-8, -14, 0, -15)
    ctx.quadraticCurveTo(8, -14, 19, -20)
    ctx.quadraticCurveTo(25, -42, 15, -60)
    ctx.quadraticCurveTo(0, -66, -15, -60)
    ctx.closePath()
    ctx.fillStyle = pal.robe
    ctx.fill()
    ctx.strokeStyle = pal.ink
    ctx.lineWidth = 1.7
    ctx.stroke()

    // 衣襟 / 腰带
    ctx.beginPath()
    ctx.moveTo(-10, -58)
    ctx.quadraticCurveTo(0, -44, 5, -60)
    ctx.strokeStyle = rgba(pal.accent, 0.65)
    ctx.lineWidth = 2
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(-17, -32)
    ctx.lineTo(17, -32)
    ctx.strokeStyle = rgba(pal.accent, 0.8)
    ctx.lineWidth = 4
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(11, -31)
    ctx.lineTo(23, -23)
    ctx.strokeStyle = rgba(pal.accent, 0.55)
    ctx.lineWidth = 2
    ctx.stroke()

    // 肩甲
    if (pal.armor) {
      ctx.beginPath()
      ctx.ellipse(-14, -57, 8, 6, -0.3, 0, Math.PI * 2)
      ctx.fillStyle = rgba(pal.ink, 0.18)
      ctx.fill()
      ctx.strokeStyle = rgba(pal.ink, 0.45)
      ctx.lineWidth = 1
      ctx.stroke()
    }

    // 手臂
    const handForward = attacking && resolved ? 1 : 0.5
    const handY = -42 + (attacking ? -windup * 4 : 0)
    const handX = 10 + handForward * 14
    ctx.strokeStyle = pal.ink
    ctx.lineWidth = 3.5
    ctx.beginPath()
    ctx.moveTo(-12, -57)
    ctx.quadraticCurveTo(-22, -46, -20 + armSwing * 5, -34)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(12, -57)
    ctx.quadraticCurveTo(18, -48, handX, handY)
    ctx.stroke()

    // 头与发髻
    const headY = -78 + (isSurrender ? 4 : 0)
    ctx.beginPath()
    ctx.arc(0, headY, 12.5, 0, Math.PI * 2)
    ctx.fillStyle = pal.skin
    ctx.fill()
    ctx.strokeStyle = pal.ink
    ctx.lineWidth = 1.6
    ctx.stroke()
    // 发
    ctx.beginPath()
    ctx.arc(0, headY - 2.5, 12.5, Math.PI * 1.02, Math.PI * 1.98)
    ctx.strokeStyle = pal.ink
    ctx.lineWidth = 5.5
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(-2, headY - 15.5, 4.2, 0, Math.PI * 2)
    ctx.fillStyle = pal.ink
    ctx.fill()
    // 眼
    if (isKo) {
      ctx.strokeStyle = pal.ink
      ctx.lineWidth = 1.4
      ctx.beginPath()
      ctx.moveTo(4, headY - 4)
      ctx.lineTo(8, headY)
      ctx.moveTo(8, headY - 4)
      ctx.lineTo(4, headY)
      ctx.stroke()
    } else {
      ctx.fillStyle = pal.ink
      ctx.beginPath()
      ctx.arc(5.2, headY - 2, 1.3, 0, Math.PI * 2)
      ctx.fill()
    }

    this.drawPersona(ctx, fighter, pal, headY)

    // 武器 / 术法：正在施放时跟着施放物走；空闲时保留一件有形的招牌装备。
    const castContract = fighter.lastContract
    const visibleWeapon = fighter.contracts.find(
      (item) => item.gear?.slot === 'weapon' && item.form && item.form !== 'none',
    )
    const contract = (castContract && castContract.form && castContract.form !== 'none')
      ? castContract
      : visibleWeapon || castContract || fighter.contracts[0]
    this.drawWeapon(ctx, fighter, contract, {
      handX,
      handY,
      windup,
      resolved,
      attacking,
      pal,
      now,
    })

    ctx.restore()

    // 受击时只亮一圈朱砂色，不把整个人涂成红块。
    if (fighter.flash > 0) {
      ctx.save()
      ctx.globalAlpha = Math.min(0.42, fighter.flash * 2.2)
      ctx.fillStyle = pal.accent
      ctx.beginPath()
      ctx.ellipse(fighter.x, feet - 42, 28, 46, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }

    // 护盾
    if (fighter.shield > 0) {
      ctx.save()
      const ratio = clamp(fighter.shield / 120, 0.25, 1)
      const pulse = 0.85 + Math.sin(this.time * 4 + fighter.side) * 0.08
      ctx.strokeStyle = rgba('#6f8f9b', 0.2 + ratio * 0.35)
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.ellipse(fighter.x, ground - fighter.z - 42, 34 * pulse, 52 * pulse, 0, 0, Math.PI * 2)
      ctx.stroke()
      ctx.fillStyle = rgba('#6f8f9b', 0.035 + ratio * 0.03)
      ctx.fill()
      ctx.restore()
    }

    // 机制外显：绝对、反击架势、破绽
    if (fighter.absoluteUntil > state.t) {
      ctx.save()
      const pulse = 0.92 + Math.sin(this.time * 7) * 0.06
      ctx.strokeStyle = rgba('#c0a046', 0.65)
      ctx.lineWidth = 1.8
      ctx.beginPath()
      ctx.ellipse(fighter.x, ground - fighter.z - 44, 40 * pulse, 60 * pulse, 0, 0, Math.PI * 2)
      ctx.stroke()
      ctx.strokeStyle = 'rgba(255,246,207,0.5)'
      ctx.lineWidth = 0.8
      ctx.beginPath()
      ctx.ellipse(fighter.x, ground - fighter.z - 44, 46 * pulse, 66 * pulse, 0, 0, Math.PI * 2)
      ctx.stroke()
      ctx.restore()
    }
    if (fighter.counterUntil > state.t && fighter.counterCharges > 0) {
      ctx.save()
      ctx.strokeStyle = rgba('#7d6fa8', 0.4)
      ctx.lineWidth = 1
      ctx.setLineDash([3, 5])
      ctx.beginPath()
      ctx.ellipse(fighter.x, ground - fighter.z - 34, 34, 50, 0, 0, Math.PI * 2)
      ctx.stroke()
      ctx.restore()
    }
    if (fighter.reflectUntil > state.t && fighter.reflectCharges > 0) {
      ctx.save()
      const pulse = 0.9 + Math.sin(this.time * 8) * 0.08
      ctx.strokeStyle = rgba('#7d6fa8', 0.5)
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.ellipse(fighter.x, ground - fighter.z - 42, 36 * pulse, 54 * pulse, 0, 0, Math.PI * 2)
      ctx.stroke()
      ctx.strokeStyle = 'rgba(245,242,255,0.35)'
      ctx.lineWidth = 0.8
      ctx.beginPath()
      ctx.moveTo(fighter.x - 20, ground - fighter.z - 54)
      ctx.lineTo(fighter.x + 20, ground - fighter.z - 30)
      ctx.stroke()
      ctx.restore()
    }
    if (fighter.breakUntil > state.t) {
      ctx.save()
      ctx.strokeStyle = rgba('#a34b32', 0.55)
      ctx.lineWidth = 1.2
      for (let i = 0; i < 3; i += 1) {
        ctx.beginPath()
        ctx.moveTo(fighter.x - 18 + i * 14, ground - fighter.z - 72)
        ctx.lineTo(fighter.x - 8 + i * 14, ground - fighter.z - 48)
        ctx.lineTo(fighter.x - 16 + i * 14, ground - fighter.z - 24)
        ctx.stroke()
      }
      ctx.restore()
    }

    // 元素气息
    const primary = fighter.contracts.find((item) => item.attack !== 'self') || fighter.contracts[0]
    if (primary && !isKo) {
      ctx.save()
      for (let i = 0; i < 2; i += 1) {
        const angle = this.time * (1.2 + i * 0.3) + i * 2.2 + fighter.side
        const px = fighter.x + Math.cos(angle) * 26
        const py = ground - fighter.z - 52 + Math.sin(angle * 1.3) * 18
        ctx.fillStyle = rgba(primary.color, 0.28)
        ctx.beginPath()
        ctx.arc(px, py, 1.6, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.restore()
    }

    // 名字、血条、意图都交给上方 HUD，画布只保留人物与状态图标，避免贴脸时铭牌打架。
    this.drawStatusIcons(fighter, feet, state.t)

    // 认输的白旗
    if (isSurrender) {
      ctx.save()
      ctx.strokeStyle = 'rgba(50,48,42,0.7)'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(fighter.x + 20, ground - 26)
      ctx.lineTo(fighter.x + 20, ground - 92)
      ctx.stroke()
      ctx.fillStyle = 'rgba(248,244,232,0.92)'
      ctx.beginPath()
      ctx.moveTo(fighter.x + 20, ground - 92)
      ctx.lineTo(fighter.x + 54, ground - 85)
      ctx.lineTo(fighter.x + 20, ground - 76)
      ctx.closePath()
      ctx.fill()
      ctx.strokeStyle = 'rgba(50,48,42,0.4)'
      ctx.stroke()
      ctx.restore()
    }
  }

  fighterPalette(fighter) {
    const accent = fighter.accent || '#2f6b53'
    return {
      accent,
      ink: '#1b241f',
      robe: '#f8f3e6',
      skin: '#f3e6d0',
      armor: fighter.contracts.some((contract) => contract.gear?.slot === 'armor') || (fighter.passive.armor || 0) > 0.09,
    }
  }

  drawPersona(ctx, fighter, pal, headY) {
    const accent = pal.accent
    ctx.save()
    if (fighter.persona === 'ranger') {
      // 兜帽与羽饰：游侠始终在找退路。
      ctx.strokeStyle = rgba(accent, 0.75)
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(0, headY - 1, 14.5, Math.PI * 1.02, Math.PI * 2.02)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(8, headY - 16)
      ctx.quadraticCurveTo(20, headY - 30, 25, headY - 22)
      ctx.stroke()
    } else if (fighter.persona === 'mage') {
      // 高冠：术士把距离当成护甲。
      ctx.fillStyle = rgba(accent, 0.18)
      ctx.strokeStyle = rgba(accent, 0.8)
      ctx.lineWidth = 1.4
      ctx.beginPath()
      ctx.moveTo(-12, headY - 9)
      ctx.lineTo(0, headY - 35)
      ctx.lineTo(12, headY - 9)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
    } else if (fighter.persona === 'duelist') {
      // 飘带：剑客的进出场。
      ctx.strokeStyle = rgba(accent, 0.7)
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(-5, headY + 13)
      ctx.quadraticCurveTo(-25, headY + 22, -34, headY + 8)
      ctx.stroke()
    } else if (fighter.persona === 'guardian') {
      // 护心镜：守御把破绽压到最小。
      ctx.strokeStyle = rgba(accent, 0.7)
      ctx.lineWidth = 1.4
      ctx.beginPath()
      ctx.arc(0, -44, 7, 0, Math.PI * 2)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(0, -51)
      ctx.lineTo(0, -37)
      ctx.stroke()
    } else if (fighter.persona === 'summoner') {
      // 悬浮符牌：唤灵者不自己站在最前面。
      ctx.strokeStyle = rgba(accent, 0.65)
      ctx.lineWidth = 1
      ctx.strokeRect(-28, -58, 12, 20)
      ctx.beginPath()
      ctx.moveTo(-25, -52)
      ctx.lineTo(-19, -52)
      ctx.moveTo(-25, -47)
      ctx.lineTo(-19, -47)
      ctx.stroke()
    }
    ctx.restore()
  }

  drawWeapon(ctx, fighter, contract, opts) {
    const { handX, handY, windup, resolved, attacking, pal } = opts
    const form = contract?.form || 'none'
    const color = contract?.color || pal.accent
    if (!contract || form === 'none' || form === '手') {
      // 赤手：拳头上一点墨
      ctx.beginPath()
      ctx.arc(handX + 3, handY, 4.2, 0, Math.PI * 2)
      ctx.fillStyle = pal.skin
      ctx.fill()
      ctx.strokeStyle = pal.ink
      ctx.lineWidth = 1.2
      ctx.stroke()
      return
    }

    let swing = 0.35
    if (attacking) swing = resolved ? 0.8 : -0.55 + windup * 0.35
    if (fighter.state === 'surrender') swing = -1.1
    const glowX = handX
    const glowY = handY - 4
    const glow = ctx.createRadialGradient(glowX, glowY, 0, glowX, glowY, 36)
    glow.addColorStop(0, rgba(color, 0.3))
    glow.addColorStop(1, rgba(color, 0))
    ctx.fillStyle = glow
    ctx.beginPath()
    ctx.arc(glowX, glowY, 36, 0, Math.PI * 2)
    ctx.fill()

    ctx.save()
    ctx.translate(handX, handY)
    ctx.rotate(swing)
    ctx.strokeStyle = pal.ink
    ctx.fillStyle = rgba(color, 0.16)
    ctx.lineWidth = 2.4
    ctx.lineCap = 'round'

    switch (form) {
      case 'sword':
        ctx.beginPath()
        ctx.moveTo(-6, 0)
        ctx.lineTo(44, -2)
        ctx.strokeStyle = rgba(color, 0.95)
        ctx.lineWidth = 3
        ctx.stroke()
        ctx.strokeStyle = pal.ink
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(2, -1)
        ctx.lineTo(2, 8)
        ctx.stroke()
        ctx.beginPath()
        ctx.arc(46, -2, 2, 0, Math.PI * 2)
        ctx.fillStyle = rgba(color, 0.9)
        ctx.fill()
        break
      case 'spear':
        ctx.beginPath()
        ctx.moveTo(-10, 0)
        ctx.lineTo(58, -3)
        ctx.strokeStyle = pal.ink
        ctx.lineWidth = 2
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(58, -3)
        ctx.lineTo(70, 0)
        ctx.lineTo(58, 3)
        ctx.closePath()
        ctx.fillStyle = rgba(color, 0.85)
        ctx.fill()
        break
      case 'bow':
        ctx.beginPath()
        ctx.arc(8, 0, 17, -1.25, 1.25)
        ctx.strokeStyle = rgba(color, 0.9)
        ctx.lineWidth = 2.5
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(13, -16)
        ctx.lineTo(13, 16)
        ctx.strokeStyle = pal.ink
        ctx.lineWidth = 1
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(13, 0)
        ctx.lineTo(34, 0)
        ctx.strokeStyle = pal.ink
        ctx.lineWidth = 1.3
        ctx.stroke()
        break
      case 'staff':
        ctx.beginPath()
        ctx.moveTo(-12, 0)
        ctx.lineTo(62, -4)
        ctx.strokeStyle = pal.ink
        ctx.lineWidth = 2.2
        ctx.stroke()
        ctx.beginPath()
        ctx.arc(64, -4, 7, 0, Math.PI * 2)
        ctx.fillStyle = rgba(color, 0.3)
        ctx.fill()
        ctx.strokeStyle = rgba(color, 0.95)
        ctx.lineWidth = 2
        ctx.stroke()
        ctx.fillStyle = `rgba(255,248,230,${0.5 + Math.sin(this.time * 6) * 0.18})`
        ctx.beginPath()
        ctx.arc(64, -4, 2.4, 0, Math.PI * 2)
        ctx.fill()
        break
      case 'hammer':
        ctx.beginPath()
        ctx.moveTo(-8, 0)
        ctx.lineTo(38, -2)
        ctx.strokeStyle = pal.ink
        ctx.lineWidth = 3
        ctx.stroke()
        ctx.fillStyle = rgba(color, 0.75)
        ctx.fillRect(36, -12, 18, 20)
        ctx.strokeStyle = pal.ink
        ctx.lineWidth = 1
        ctx.strokeRect(36, -12, 18, 20)
        break
      case 'shield':
        ctx.beginPath()
        ctx.ellipse(14, 0, 16, 22, 0.1, 0, Math.PI * 2)
        ctx.fillStyle = rgba(color, 0.18)
        ctx.fill()
        ctx.strokeStyle = rgba(color, 0.85)
        ctx.lineWidth = 2
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(14, -14)
        ctx.lineTo(14, 14)
        ctx.strokeStyle = rgba(pal.ink, 0.4)
        ctx.lineWidth = 1
        ctx.stroke()
        break
      case 'claws':
        for (let i = -1; i <= 1; i += 1) {
          ctx.beginPath()
          ctx.moveTo(4, i * 4)
          ctx.quadraticCurveTo(22, i * 10 - 4, 30, i * 12)
          ctx.strokeStyle = rgba(color, 0.9)
          ctx.lineWidth = 1.6
          ctx.stroke()
        }
        break
      case 'whip':
        ctx.beginPath()
        ctx.moveTo(0, 0)
        ctx.bezierCurveTo(22, -20, 48, 18, 70, -6)
        ctx.strokeStyle = rgba(color, 0.85)
        ctx.lineWidth = 2
        ctx.stroke()
        break
      case 'scythe':
        ctx.beginPath()
        ctx.moveTo(-8, 0)
        ctx.lineTo(42, -2)
        ctx.strokeStyle = pal.ink
        ctx.lineWidth = 2
        ctx.stroke()
        ctx.beginPath()
        ctx.arc(42, -2, 20, -1.6, 0.35)
        ctx.strokeStyle = rgba(color, 0.9)
        ctx.lineWidth = 2.4
        ctx.stroke()
        break
      case 'dagger':
        ctx.beginPath()
        ctx.moveTo(-2, 0)
        ctx.lineTo(24, -2)
        ctx.strokeStyle = rgba(color, 0.95)
        ctx.lineWidth = 3
        ctx.stroke()
        break
      case 'fan':
        ctx.beginPath()
        ctx.moveTo(0, 0)
        ctx.arc(0, 0, 30, -0.65, 0.65)
        ctx.closePath()
        ctx.fillStyle = rgba(color, 0.2)
        ctx.fill()
        ctx.strokeStyle = rgba(color, 0.8)
        ctx.lineWidth = 1.3
        ctx.stroke()
        for (let i = -2; i <= 2; i += 1) {
          ctx.beginPath()
          ctx.moveTo(0, 0)
          ctx.lineTo(Math.cos(i * 0.27) * 30, Math.sin(i * 0.27) * 30)
          ctx.strokeStyle = rgba(pal.ink, 0.25)
          ctx.lineWidth = 0.8
          ctx.stroke()
        }
        break
      case 'bell':
        ctx.beginPath()
        ctx.arc(18, 0, 12, 0, Math.PI * 2)
        ctx.fillStyle = rgba(color, 0.2)
        ctx.fill()
        ctx.strokeStyle = rgba(color, 0.9)
        ctx.lineWidth = 2
        ctx.stroke()
        ctx.beginPath()
        ctx.arc(18, 14, 2.5, 0, Math.PI * 2)
        ctx.fillStyle = rgba(color, 0.9)
        ctx.fill()
        break
      case 'cannon':
        ctx.fillStyle = rgba(color, 0.22)
        ctx.fillRect(0, -8, 46, 16)
        ctx.strokeStyle = pal.ink
        ctx.lineWidth = 1.5
        ctx.strokeRect(0, -8, 46, 16)
        ctx.beginPath()
        ctx.arc(46, 0, 8, -Math.PI / 2, Math.PI / 2)
        ctx.strokeStyle = rgba(color, 0.9)
        ctx.lineWidth = 2
        ctx.stroke()
        break
      case 'orb':
        ctx.beginPath()
        ctx.arc(24, -10, 8, 0, Math.PI * 2)
        ctx.fillStyle = rgba(color, 0.45)
        ctx.fill()
        ctx.strokeStyle = rgba(color, 0.9)
        ctx.lineWidth = 1.4
        ctx.stroke()
        break
      case 'gauntlet':
        ctx.fillStyle = rgba(color, 0.28)
        ctx.fillRect(4, -8, 16, 16)
        ctx.strokeStyle = pal.ink
        ctx.lineWidth = 1.4
        ctx.strokeRect(4, -8, 16, 16)
        break
      default:
        ctx.beginPath()
        ctx.moveTo(-2, 0)
        ctx.lineTo(26, -4)
        ctx.strokeStyle = rgba(color, 0.8)
        ctx.lineWidth = 2
        ctx.stroke()
        break
    }
    ctx.restore()
  }

  drawFighterLabel(fighter, feet) {
    const ctx = this.ctx
    const top = feet - 128
    const accent = fighter.accent || '#2f6b53'
    ctx.save()
    ctx.textAlign = 'center'
    ctx.fillStyle = 'rgba(244,238,224,0.82)'
    ctx.fillRect(fighter.x - 46, top - 13, 92, 34)
    ctx.strokeStyle = rgba(accent, 0.22)
    ctx.lineWidth = 1
    ctx.strokeRect(fighter.x - 46, top - 13, 92, 34)

    ctx.fillStyle = 'rgba(27,36,31,0.82)'
    ctx.font = `600 11px ${SANS}`
    ctx.fillText(fighter.name, fighter.x, top)

    // 血条
    const width = 74
    const ratio = clamp(fighter.hp / fighter.maxHp, 0, 1)
    ctx.fillStyle = 'rgba(27,36,31,0.14)'
    ctx.fillRect(fighter.x - width / 2, top + 5, width, 3)
    ctx.fillStyle = rgba(accent, 0.85)
    ctx.fillRect(fighter.x - width / 2, top + 5, width * ratio, 3)
    if (fighter.shield > 0) {
      const shieldRatio = clamp(fighter.shield / fighter.maxHp, 0, 1)
      ctx.fillStyle = 'rgba(111,143,155,0.7)'
      ctx.fillRect(fighter.x - width / 2 + width * ratio, top + 5, Math.min(width * (1 - ratio), width * shieldRatio), 3)
    }

    ctx.fillStyle = 'rgba(27,36,31,0.48)'
    ctx.font = `9px ${SANS}`
    ctx.fillText(fighter.intent || '', fighter.x, top + 23)
    ctx.restore()
  }

  drawStatusIcons(fighter, feet, battleTime) {
    const ctx = this.ctx
    const active = fighter.statuses.filter((status) => status.until > battleTime)
    if (fighter.stunUntil > battleTime) active.push({ type: 'stun', until: fighter.stunUntil })
    if (fighter.marks?.some((mark) => mark.until > battleTime)) {
      active.push({ type: 'mark', until: Math.max(...fighter.marks.map((mark) => mark.until)) })
    }
    if (fighter.absoluteUntil > battleTime) active.push({ type: 'absolute', until: fighter.absoluteUntil })
    if (fighter.breakUntil > battleTime) active.push({ type: 'break', until: fighter.breakUntil })
    if (fighter.counterUntil > battleTime && fighter.counterCharges > 0) active.push({ type: 'counter', until: fighter.counterUntil })
    if (fighter.chargeStacks > 0) active.push({ type: 'charge', until: fighter.chargeUntil })
    if (Object.keys(fighter.sealed || {}).length) active.push({ type: 'seal', until: Math.max(...Object.values(fighter.sealed)) })
    if (fighter.antiAbsoluteCharges > 0) active.push({ type: 'antiAbsolute', until: battleTime + 99 })
    if (fighter.tauntUntil > battleTime) active.push({ type: 'taunt', until: fighter.tauntUntil })
    if (fighter.fearUntil > battleTime) active.push({ type: 'fear', until: fighter.fearUntil })
    if (fighter.sleepUntil > battleTime) active.push({ type: 'sleep', until: fighter.sleepUntil })
    if (fighter.silencedUntil > battleTime) active.push({ type: 'silence', until: fighter.silencedUntil })
    if (fighter.reflectUntil > battleTime && fighter.reflectCharges > 0) active.push({ type: 'reflect', until: fighter.reflectUntil })
    if (!active.length) return
    const shown = active.slice(0, 4)
    const start = fighter.x - (shown.length - 1) * 9
    ctx.save()
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    shown.forEach((status, index) => {
      const x = start + index * 18
      const y = feet - 98
      const colors = {
        burn: '#c55832', bleed: '#913f3b', poison: '#7b8a3c', slow: '#6d9bb8',
        weaken: '#8173a0', sunder: '#7b8288', vulnerable: '#a4768e', haste: '#6f9b83',
        regen: '#5d8954', thorns: '#8a6a49', focus: '#c0a046', inspiration: '#c0a046',
        mark: '#b08a4f', absolute: '#c0a046', break: '#a34b32', counter: '#7d6fa8',
        charge: '#b08a4f', seal: '#8a6a49', antiAbsolute: '#c0a046', taunt: '#c0a046',
        fear: '#7d6fa8', sleep: '#6d9bb8', silence: '#8a6a49', reflect: '#7d6fa8',
        shrink: '#6d9bb8', inflate: '#c55832', root: '#5d8954',
      }
      ctx.fillStyle = rgba(colors[status.type] || '#6b6658', 0.16)
      ctx.beginPath()
      ctx.arc(x, y, 7, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = rgba(colors[status.type] || '#6b6658', 0.92)
      ctx.font = `8px ${SANS}`
      ctx.fillText(this.statusGlyph(status.type), x, y + 0.5)
    })
    ctx.restore()
  }

  statusGlyph(type) {
    return {
      burn: '火', bleed: '血', poison: '毒', slow: '缓', weaken: '弱', sunder: '破',
      vulnerable: '易', haste: '疾', regen: '生', thorns: '棘', focus: '凝',
      inspiration: '灵', stun: '僵', mark: '印', absolute: '绝', break: '绽', counter: '反',
      charge: '蓄', seal: '封', antiAbsolute: '否', opening: '门', taunt: '点', fear: '惧',
      sleep: '眠', silence: '默', reflect: '镜', shrink: '缩', inflate: '胀', root: '定',
    }[type] || '·'
  }

  drawEffects() {
    const ctx = this.ctx
    for (const ability of this.slashes) {
      const alpha = clamp(ability.life / ability.maxLife, 0, 1)
      const radius = (ability.range || 70) * 0.85
      ctx.save()
      ctx.translate(ability.x, GROUND - (ability.z || 0) - 42)
      ctx.scale(ability.facing || 1, 1)
      ctx.beginPath()
      ctx.arc(0, 0, radius, -0.95, 0.95)
      ctx.strokeStyle = rgba(ability.color || '#8b5a3c', alpha * 0.32)
      ctx.lineWidth = 14 * alpha
      ctx.lineCap = 'round'
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(0, 0, radius, -0.95, 0.95)
      ctx.strokeStyle = `rgba(255,248,232,${alpha * 0.8})`
      ctx.lineWidth = 2.2
      ctx.stroke()
      ctx.restore()
    }

    for (const beam of this.beams) {
      const alpha = clamp(beam.life / beam.maxLife, 0, 1)
      const x1 = beam.x1
      const y1 = GROUND - (beam.z1 || 0)
      const x2 = beam.x2
      const y2 = GROUND - (beam.z2 || 0)
      ctx.save()
      ctx.lineCap = 'round'
      ctx.strokeStyle = rgba(beam.color || '#b08a35', alpha * 0.22)
      ctx.lineWidth = 20 * alpha
      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
      ctx.stroke()
      ctx.strokeStyle = rgba(beam.color || '#b08a35', alpha * 0.8)
      ctx.lineWidth = 6 * alpha
      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
      ctx.stroke()
      ctx.strokeStyle = `rgba(255,250,236,${alpha * 0.9})`
      ctx.lineWidth = 1.8
      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
      ctx.stroke()
      ctx.restore()
    }

    for (const ring of this.rings) {
      const progress = 1 - ring.life / ring.maxLife
      const alpha = clamp(ring.life / ring.maxLife, 0, 1)
      ctx.save()
      if (ring.type === 'explosion') {
        const radius = (ring.radius || 90) * easeOut(progress)
        ctx.translate(ring.x, GROUND)
        ctx.scale(1, 0.32)
        ctx.strokeStyle = rgba(ring.color || '#9a5b3f', alpha * 0.9)
        ctx.lineWidth = 3 * alpha + 1
        ctx.beginPath()
        ctx.arc(0, 0, radius, 0, Math.PI * 2)
        ctx.stroke()
        ctx.fillStyle = rgba(ring.color || '#9a5b3f', alpha * 0.08)
        ctx.fill()
      } else if (ring.type === 'shield') {
        const fighter = { x: ring.x, z: ring.z || 0 }
        ctx.translate(fighter.x, GROUND - fighter.z - 42)
        ctx.strokeStyle = rgba(ring.color || '#6f8f9b', alpha * 0.7)
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.ellipse(0, 0, 30 + progress * 8, 46 + progress * 10, 0, 0, Math.PI * 2)
        ctx.stroke()
      } else if (ring.type === 'cast' || ring.type === 'aura' || ring.type === 'summon' || ring.type === 'counter') {
        ctx.translate(ring.x, GROUND - (ring.z || 0) - 34)
        ctx.strokeStyle = rgba(ring.color || '#7d6fa8', alpha * 0.55)
        ctx.lineWidth = 1.6
        ctx.beginPath()
        ctx.ellipse(0, 0, 26 + progress * 24, 38 + progress * 30, 0, 0, Math.PI * 2)
        ctx.stroke()
      } else if (ring.type === 'absolute') {
        ctx.translate(ring.x, GROUND - (ring.z || 0) - 44)
        ctx.strokeStyle = rgba(ring.color || '#c0a046', alpha * 0.85)
        ctx.lineWidth = 2.2
        ctx.beginPath()
        ctx.ellipse(0, 0, 36 + progress * 18, 56 + progress * 24, 0, 0, Math.PI * 2)
        ctx.stroke()
        ctx.strokeStyle = `rgba(255,244,202,${alpha * 0.55})`
        ctx.lineWidth = 0.8
        ctx.beginPath()
        ctx.ellipse(0, 0, 42 + progress * 18, 62 + progress * 24, 0, 0, Math.PI * 2)
        ctx.stroke()
      } else if (ring.type === 'antiAbsolute') {
        ctx.translate(ring.x, GROUND - (ring.z || 0) - 44)
        ctx.strokeStyle = rgba(ring.color || '#c0a046', alpha * 0.8)
        ctx.lineWidth = 1.8
        for (let i = 0; i < 4; i += 1) {
          ctx.beginPath()
          ctx.arc(0, 0, 30 + i * 8 + progress * 20, i * 1.4, i * 1.4 + 1.2)
          ctx.stroke()
        }
      } else if (ring.type === 'mark' || ring.type === 'chain' || ring.type === 'zone' || ring.type === 'echo') {
        ctx.translate(ring.x, GROUND - (ring.z || 0))
        ctx.strokeStyle = rgba(ring.color || '#b08a4f', alpha * 0.8)
        ctx.lineWidth = 1.4
        ctx.beginPath()
        ctx.ellipse(0, 0, 16 + progress * 30, 8 + progress * 16, 0, 0, Math.PI * 2)
        ctx.stroke()
        if (ring.type === 'mark') {
          ctx.beginPath()
          ctx.moveTo(0, -12 - progress * 10)
          ctx.lineTo(7, 0)
          ctx.lineTo(0, 12 + progress * 10)
          ctx.lineTo(-7, 0)
          ctx.closePath()
          ctx.stroke()
        }
      } else if (ring.type === 'arbitration') {
        ctx.translate(ring.x, GROUND)
        ctx.strokeStyle = rgba(ring.color || '#c0a046', alpha * 0.7)
        ctx.lineWidth = 2
        for (let i = 0; i < 3; i += 1) {
          ctx.beginPath()
          ctx.ellipse(0, 0, (60 + i * 34) * (0.7 + progress * 0.5), (20 + i * 12) * (0.7 + progress * 0.5), 0, 0, Math.PI * 2)
          ctx.stroke()
        }
      }
      ctx.restore()
    }

    for (const ghost of this.ghosts) {
      const alpha = clamp(ghost.life / ghost.maxLife, 0, 1) * 0.1
      ctx.save()
      ctx.translate(ghost.x, GROUND - (ghost.z || 0))
      ctx.scale(ghost.facing || 1, 1)
      ctx.fillStyle = rgba(ghost.color || '#5a6a5c', alpha)
      ctx.beginPath()
      ctx.ellipse(0, -42, 20, 34, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(0, -78, 12, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }
  }

  drawParticles() {
    const ctx = this.ctx
    for (const particle of this.particles) {
      const alpha = clamp(particle.life / particle.maxLife, 0, 1)
      ctx.save()
      ctx.fillStyle = rgba(particle.color, alpha * 0.8)
      if (particle.shape === 'line') {
        ctx.strokeStyle = rgba(particle.color, alpha * 0.7)
        ctx.lineWidth = particle.size * 0.5
        ctx.beginPath()
        ctx.moveTo(particle.x, particle.y)
        ctx.lineTo(particle.x - particle.vx * 0.02, particle.y - particle.vy * 0.02)
        ctx.stroke()
      } else {
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size * alpha, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.restore()
    }
  }

  drawFloaters() {
    const ctx = this.ctx
    for (const floater of this.floaters) {
      const alpha = clamp(floater.life / floater.maxLife, 0, 1)
      ctx.save()
      ctx.textAlign = 'center'
      ctx.font = `700 ${floater.size}px ${SERIF}`
      ctx.fillStyle = rgba(floater.color, alpha)
      ctx.fillText(floater.text, floater.x, floater.y)
      ctx.restore()
    }
  }
}
