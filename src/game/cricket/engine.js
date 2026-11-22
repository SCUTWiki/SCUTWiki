import { makeBarehandContract, totalPassive } from './compiler.js'
import { clamp, hashString, makeRng, round1 } from './hash.js'

export const ARENA = { width: 1000, height: 560, groundY: 474, left: 76, right: 924 }
const BASE_HP = 820
const BASE_SPEED = 124
const GRAVITY = 900
const JUMP_SPEED = 345
const BODY_CENTER = 42
const MIN_GAP = 90

const STYLE = {
  aggressive: { range: 0.88, jump: 0.35, surrender: 0.03, melee: 12, ranged: 0 },
  cautious: { range: 1.08, jump: 0.72, surrender: 0.09, melee: 0, ranged: 10 },
  trickster: { range: 1.02, jump: 0.6, surrender: 0.05, melee: 4, ranged: 4, aoe: 12 },
  balanced: { range: 1, jump: 0.48, surrender: 0.05, melee: 4, ranged: 4 },
}

const ATTACK_NAMES = {
  melee: '近战',
  projectile: '远程',
  beam: '光束',
  aoe: '范围',
  dash: '突进',
  self: '护体',
  summon: '召唤',
}

function otherSide(side) {
  return side === 0 ? 1 : 0
}

export const PERSONA_LABELS = {
  duelist: '剑客',
  ranger: '游侠',
  mage: '术士',
  guardian: '守御',
  summoner: '唤灵',
  wanderer: '游方',
}

function inferPersona(contracts) {
  if (!contracts.length) return 'wanderer'
  const attacks = contracts.map((contract) => contract.attack)
  const melee = attacks.filter((attack) => ['melee', 'dash'].includes(attack)).length
  const ranged = attacks.filter((attack) => ['projectile', 'beam'].includes(attack)).length
  const zones = attacks.filter((attack) => attack === 'aoe').length
  const self = attacks.filter((attack) => attack === 'self').length
  const summons = attacks.filter((attack) => attack === 'summon').length
  const maxRange = Math.max(...contracts.map((contract) => contract.range || 0))
  if (summons > 0) return 'summoner'
  if (self >= 2 && melee <= 1) return 'guardian'
  if (melee >= 2 && maxRange < 320) return 'duelist'
  if (zones >= 2 || attacks.includes('beam')) return 'mage'
  if (ranged >= 2 && maxRange >= 300) return 'ranger'
  if (self >= 2) return 'guardian'
  return 'wanderer'
}

function countAntiAbsolute(contracts) {
  let charges = 0
  for (const contract of contracts) {
    for (const mechanic of contract.mechanics || []) {
      if (mechanic.type === 'antiAbsolute') charges += Math.max(1, Number(mechanic.charges) || 1)
    }
  }
  return Math.min(2, charges)
}

function createFighter(state, side, build) {
  const contracts = Array.isArray(build.contracts) && build.contracts.length
    ? build.contracts
    : [makeBarehandContract()]
  const passive = totalPassive(contracts)
  const accent = build.accent || (side === 0 ? '#2f6b53' : '#9a4b34')
  const power = clamp(Number(build.power) || 1, 0.72, 1.3)
  const maxHp = Math.round(BASE_HP * power)
  const selfCount = contracts.filter((contract) => contract.attack === 'self').length
  const diversity = new Set(contracts.map((contract) => contract.attack)).size
  // “有攻有守”与“招式不重样”本身就是构筑优势，避免五个纯伤害词条无脑碾压。
  const synergyDamage = (selfCount > 0 ? 0.06 : 0) + Math.min(0.06, Math.max(0, diversity - 2) * 0.02)
  const synergyArmor = selfCount > 0 ? 0.03 : 0
  passive.armor = clamp((passive.armor || 0) + synergyArmor, 0, 0.38)
  const persona = build.persona || inferPersona(contracts)
  return {
    side,
    name: build.name || (side === 0 ? '挑战者' : '守擂者'),
    words: Array.isArray(build.words) ? [...build.words] : [],
    rating: build.rating || 0,
    style: build.style || 'balanced',
    persona,
    personaLabel: PERSONA_LABELS[persona] || PERSONA_LABELS.wanderer,
    accent,
    seal: build.seal || (side === 0 ? '我' : '敌'),
    contracts,
    passive,
    power,
    synergyDamage,
    maxHp,
    hp: maxHp,
    shield: 0,
    shieldUntil: 0,
    x: side === 0 ? 310 : 690,
    vx: 0,
    z: 0,
    vz: 0,
    kb: 0,
    facing: side === 0 ? 1 : -1,
    state: 'idle',
    stateTime: 0,
    action: null,
    dash: null,
    cooldowns: contracts.map(() => 0),
    basicCd: 0,
    gcdUntil: 0,
    statuses: [],
    marks: [],
    absoluteUntil: 0,
    absoluteMode: '',
    inevitableUntil: 0,
    breakUntil: 0,
    breakAmp: 0,
    counterUntil: 0,
    counterRatio: 0,
    counterCharges: 0,
    antiAbsoluteCharges: countAntiAbsolute(contracts),
    chargeStacks: 0,
    chargeBonus: 0,
    chargeUntil: 0,
    sealed: {},
    openingUntil: 0,
    repositionUntil: 0,
    repositionDir: 0,
    tauntUntil: 0,
    tauntSource: null,
    fearUntil: 0,
    sleepUntil: 0,
    silencedUntil: 0,
    reflectUntil: 0,
    reflectRatio: 0,
    reflectCharges: 0,
    stunUntil: 0,
    flash: 0,
    walkPhase: 0,
    intent: '观察',
    nextDecision: 0.25 + state.rng.next() * 0.45,
    nextJump: 0,
    nextSurrenderCheck: 0,
    gcdUntil: 0.9,
    damageDealt: 0,
    damageTaken: 0,
    skillsUsed: 0,
    hits: 0,
    regenCarry: 0,
    lastActionName: '',
    novelty: contracts.reduce((sum, contract) => sum + (contract.novelty || 0), 0),
  }
}

function getStatus(fighter, type) {
  let found = null
  for (const status of fighter.statuses) {
    if (status.type !== type || status.until <= 0) continue
    if (!found || (status.factor && status.factor < (found.factor ?? 1))) found = status
  }
  return found
}

function activeStatuses(fighter, now) {
  return fighter.statuses.filter((status) => status.until > now)
}

function pruneStatuses(state, fighter) {
  fighter.statuses = fighter.statuses.filter((status) => status.until > state.t)
}

function statusLabel(type) {
  return {
    burn: '灼烧', bleed: '流血', poison: '中毒', slow: '迟滞', weaken: '削弱',
    sunder: '破甲', vulnerable: '易伤', haste: '疾行', regen: '生息', thorns: '反伤',
    focus: '凝神', inspiration: '灵光', stun: '僵直', mark: '刻印', absolute: '绝对',
    break: '破绽', counter: '反击', charge: '蓄势', seal: '封招', antiAbsolute: '反绝对',
    opening: '破门', mirror: '映照', taunt: '点名', fear: '畏惧', sleep: '睡着', shrink: '缩小',
    inflate: '膨胀', root: '定身', silence: '封麦', reflect: '镜返',
  }[type] || type
}

function addStatus(state, fighter, status, sourceSide) {
  if (!status?.type) return
  const duration = Math.max(0.2, Number(status.duration) || 1)
  if (status.type === 'stun') {
    const focus = getStatus(fighter, 'focus')
    const realDuration = focus ? duration * 0.5 : duration
    fighter.stunUntil = Math.max(fighter.stunUntil, state.t + realDuration)
    fighter.openingUntil = Math.max(fighter.openingUntil, state.t + realDuration + 0.35)
    cancelAction(state, fighter)
    pushFx(state, { type: 'text', x: fighter.x, z: fighter.z + 96, text: '僵直', color: '#8c7a3f', life: 0.8 })
    return
  }
  const existing = fighter.statuses.find((item) => item.type === status.type)
  if (existing) {
    existing.until = Math.max(existing.until, state.t + duration)
    for (const key of ['amount', 'ratio', 'factor', 'crit', 'power', 'damage', 'speed', 'damageTaken']) {
      if (typeof status[key] === 'number') {
        if (key === 'factor') existing[key] = Math.min(existing[key] ?? 1, status[key])
        else existing[key] = Math.max(existing[key] ?? 0, status[key])
      }
    }
    if (status.type === 'burn' || status.type === 'bleed' || status.type === 'poison') {
      existing.sourceSide = sourceSide ?? existing.sourceSide
    }
    return
  }
  fighter.statuses.push({
    ...status,
    until: state.t + duration,
    tick: 0,
    sourceSide: sourceSide ?? fighter.side,
  })
  if (['burn', 'bleed', 'poison', 'slow', 'weaken', 'sunder', 'vulnerable', 'haste', 'regen', 'thorns', 'focus', 'inspiration', 'shrink', 'inflate', 'root'].includes(status.type)) {
    pushFx(state, {
      type: 'text',
      x: fighter.x,
      z: fighter.z + 98,
      text: statusLabel(status.type),
      color: {
        burn: '#c55832', bleed: '#913f3b', poison: '#7b8a3c', slow: '#6d9bb8',
        weaken: '#8173a0', sunder: '#7b8288', vulnerable: '#a4768e', haste: '#6f9b83',
        regen: '#5d8954', thorns: '#8a6a49', focus: '#c0a046', inspiration: '#c0a046',
        shrink: '#6d9bb8', inflate: '#c55832', root: '#5d8954',
      }[status.type] || '#5f5b50',
      life: 0.9,
    })
  }
}

function pushLog(state, text, tone = 'ink', meta = {}) {
  state.log.push({ id: state.nextId++, t: round1(state.t), text, tone, ...meta })
  if (state.log.length > 90) state.log.shift()
}

function pushFx(state, event) {
  state.fx.push({ id: state.nextId++, ...event })
  if (state.fx.length > 260) state.fx.splice(0, state.fx.length - 260)
}

function cancelAction(state, fighter) {
  if (fighter.action) {
    fighter.action = null
    fighter.state = 'idle'
  }
  fighter.dash = null
}

function mechanicsOf(contract) {
  return Array.isArray(contract?.mechanics) ? contract.mechanics : []
}

function hasMechanic(contract, type) {
  return mechanicsOf(contract).some((mechanic) => mechanic.type === type)
}

function activateAbsolute(state, fighter, enemy, mechanic, contract) {
  if (enemy.antiAbsoluteCharges > 0) {
    enemy.antiAbsoluteCharges -= 1
    addStatus(state, enemy, {
      type: 'inspiration',
      duration: 3.5,
      damage: 1.22,
      speed: 1.06,
    }, enemy.side)
    fighter.breakUntil = Math.max(fighter.breakUntil, state.t + 1.7)
    fighter.breakAmp = Math.max(fighter.breakAmp, 0.32)
    pushLog(state, `${enemy.name} 以「反绝对」拆掉了「${contract.skill}」，绝对没有成立。`, 'gold', {
      side: enemy.side,
      event: 'antiAbsolute',
    })
    pushFx(state, { type: 'antiAbsolute', x: enemy.x, z: enemy.z + 40, life: 1.1, color: '#c0a046' })
    pushFx(state, { type: 'text', x: fighter.x, z: fighter.z + 96, text: '绝对被抵消', color: '#a34b32', life: 1 })
    return false
  }
  fighter.absoluteUntil = Math.max(fighter.absoluteUntil, state.t + (mechanic.duration || 1.1))
  fighter.absoluteMode = mechanic.mode || 'inevitable'
  fighter.breakUntil = Math.max(
    fighter.breakUntil,
    state.t + (mechanic.duration || 1.1) + (mechanic.breakDuration || 2.2),
  )
  fighter.breakAmp = Math.max(fighter.breakAmp, mechanic.breakAmp || 0.35)
  if (fighter.absoluteMode === 'inevitable') {
    fighter.inevitableUntil = fighter.absoluteUntil
    fighter.chargeStacks = Math.max(fighter.chargeStacks, 1)
    fighter.chargeBonus = Math.max(fighter.chargeBonus, (mechanic.damageMul || 1.3) - 1)
    fighter.chargeUntil = fighter.absoluteUntil
  }
  if (fighter.absoluteMode === 'overload') {
    addStatus(state, fighter, {
      type: 'inspiration',
      duration: mechanic.duration || 1.1,
      damage: mechanic.damageMul || 1.3,
      speed: 1.18,
    }, fighter.side)
  }
  pushLog(state, `${fighter.name} 的「${contract.skill}」绝对成立，随后会露出破绽。`, 'gold', {
    side: fighter.side,
    event: 'absolute',
  })
  pushFx(state, {
    type: 'absolute',
    side: fighter.side,
    x: fighter.x,
    z: fighter.z,
    life: 1.2,
    color: '#c0a046',
  })
  return true
}

function applyCastMechanics(state, fighter, enemy, contract) {
  for (const mechanic of mechanicsOf(contract)) {
    if (mechanic.type === 'absolute') {
      activateAbsolute(state, fighter, enemy, mechanic, contract)
    } else if (mechanic.type === 'counter') {
      fighter.counterUntil = Math.max(fighter.counterUntil, state.t + (mechanic.duration || 2))
      fighter.counterRatio = Math.max(fighter.counterRatio, mechanic.ratio || 0.5)
      fighter.counterCharges = Math.max(fighter.counterCharges, mechanic.charges || 1)
      pushLog(state, `${fighter.name} 摆出「${mechanic.name}」。`, fighter.side === 0 ? 'green' : 'rust', {
        side: fighter.side,
        event: 'counter',
      })
    } else if (mechanic.type === 'charge') {
      fighter.chargeStacks = Math.min(2, fighter.chargeStacks + 1)
      fighter.chargeBonus = Math.max(fighter.chargeBonus, mechanic.bonus || 0.4)
      fighter.chargeUntil = state.t + (mechanic.duration || 5)
      pushLog(state, `${fighter.name} 把势蓄进下一击。`, fighter.side === 0 ? 'green' : 'rust', {
        side: fighter.side,
        event: 'charge',
      })
    } else if (mechanic.type === 'reflect') {
      fighter.reflectUntil = Math.max(fighter.reflectUntil, state.t + (mechanic.duration || 2))
      fighter.reflectRatio = Math.max(fighter.reflectRatio, mechanic.ratio || 0.5)
      fighter.reflectCharges = Math.max(fighter.reflectCharges, mechanic.charges || 1)
      pushLog(state, `${fighter.name} 架起「${mechanic.name}」。`, fighter.side === 0 ? 'green' : 'rust', {
        side: fighter.side,
        event: 'reflect',
      })
    } else if (mechanic.type === 'cleanse') {
      const negative = new Set(['burn', 'bleed', 'poison', 'slow', 'weaken', 'sunder', 'vulnerable', 'shrink', 'inflate', 'root'])
      fighter.statuses = fighter.statuses.filter((status) => !negative.has(status.type))
      fighter.sleepUntil = 0
      fighter.fearUntil = 0
      fighter.tauntUntil = 0
      fighter.silencedUntil = 0
      healFighter(state, fighter, mechanic.heal || 36)
      pushLog(state, `${fighter.name} 洗去身上的负面状态。`, fighter.side === 0 ? 'green' : 'rust', {
        side: fighter.side,
        event: 'cleanse',
      })
    }
  }
}

function applyHitMechanics(state, source, target, contract) {
  if (!target || target.hp <= 0 || state.over) return
  for (const mechanic of mechanicsOf(contract)) {
    if (mechanic.type === 'mark') {
      const existing = target.marks.find((mark) => mark.until > state.t)
      if (existing) {
        existing.stacks = Math.min(3, existing.stacks + (mechanic.stacks || 1))
        existing.until = Math.max(existing.until, state.t + (mechanic.duration || 5))
        existing.bonus = Math.max(existing.bonus, mechanic.bonus || 0.35)
      } else {
        target.marks.push({
          stacks: mechanic.stacks || 1,
          until: state.t + (mechanic.duration || 5),
          bonus: mechanic.bonus || 0.35,
          side: source.side,
        })
      }
      pushLog(state, `${source.name} 在 ${target.name} 身上刻下印记。`, source.side === 0 ? 'green' : 'rust', {
        side: source.side,
        event: 'mark',
      })
      pushFx(state, { type: 'mark', x: target.x, z: target.z + 44, life: 0.8, color: '#b08a4f' })
    } else if (mechanic.type === 'seal') {
      const available = target.contracts
        .map((item, index) => ({ item, index }))
        .filter(({ index }) => !(target.sealed[index] > state.t))
      if (available.length) {
        const chosen = available[Math.floor(state.rng.next() * available.length)]
        target.sealed[chosen.index] = state.t + (mechanic.duration || 3)
        pushLog(state, `${source.name} 封住了 ${target.name} 的「${chosen.item.skill}」。`, 'gold', {
          side: source.side,
          event: 'seal',
        })
        pushFx(state, { type: 'seal', x: target.x, z: target.z + 50, life: 0.9, color: '#8a6a49' })
      }
    } else if (mechanic.type === 'chain') {
      const dir = Math.sign(source.x - target.x) || 1
      target.x = clamp(target.x + dir * (mechanic.distance || 70), ARENA.left + 26, ARENA.right - 26)
      addStatus(state, target, { type: 'slow', duration: 1.2, factor: mechanic.slow || 0.8 }, source.side)
      pushLog(state, `${source.name} 把 ${target.name} 拽近。`, source.side === 0 ? 'green' : 'rust', {
        side: source.side,
        event: 'chain',
      })
      pushFx(state, { type: 'chain', x: target.x, z: target.z + 40, life: 0.45, color: '#7d6fa8' })
    } else if (mechanic.type === 'taunt') {
      target.tauntUntil = Math.max(target.tauntUntil, state.t + (mechanic.duration || 1.5))
      target.tauntSource = source.side
      pushLog(state, `${source.name} 点名 ${target.name}，逼它过来。`, 'gold', { side: source.side, event: 'taunt' })
      pushFx(state, { type: 'text', x: target.x, z: target.z + 96, text: '被点名', color: '#c0a046', life: 0.8 })
    } else if (mechanic.type === 'fear') {
      target.fearUntil = Math.max(target.fearUntil, state.t + (mechanic.duration || 1.5))
      pushLog(state, `${target.name} 被 ${source.name} 吓退了。`, 'gold', { side: source.side, event: 'fear' })
      pushFx(state, { type: 'text', x: target.x, z: target.z + 96, text: '畏惧', color: '#7d6fa8', life: 0.8 })
    } else if (mechanic.type === 'sleep') {
      target.sleepUntil = Math.max(target.sleepUntil, state.t + (mechanic.duration || 1.3))
      cancelAction(state, target)
      pushLog(state, `${target.name} 被「${mechanic.name}」放倒，睡着了。`, 'gold', { side: source.side, event: 'sleep' })
      pushFx(state, { type: 'text', x: target.x, z: target.z + 96, text: 'Zzz', color: '#6d9bb8', life: 1 })
    } else if (mechanic.type === 'shrink') {
      addStatus(state, target, {
        type: 'shrink',
        duration: mechanic.duration || 3,
        factor: mechanic.factor || 0.65,
      }, source.side)
      pushLog(state, `${source.name} 把 ${target.name} 缩小了。`, source.side === 0 ? 'green' : 'rust', {
        side: source.side,
        event: 'shrink',
      })
    } else if (mechanic.type === 'inflate') {
      addStatus(state, target, {
        type: 'inflate',
        duration: mechanic.duration || 3,
        speed: mechanic.speed || 0.8,
        damageTaken: mechanic.damageTaken || 0.15,
      }, source.side)
      pushLog(state, `${source.name} 把 ${target.name} 吹得很大。`, source.side === 0 ? 'green' : 'rust', {
        side: source.side,
        event: 'inflate',
      })
    } else if (mechanic.type === 'steal') {
      const amount = Math.min(target.shield, mechanic.amount || 50)
      target.shield -= amount
      source.shield += amount
      if (amount <= 0) healFighter(state, source, 8, false)
      const buff = target.statuses.find((status) => ['haste', 'focus', 'regen', 'thorns'].includes(status.type))
      if (buff) {
        buff.until = Math.max(buff.until, state.t + 3)
        source.statuses.push({ ...buff, until: state.t + 3 })
        target.statuses = target.statuses.filter((status) => status !== buff)
      }
      pushLog(state, `${source.name} 从 ${target.name} 身上顺走了 ${Math.round(amount)} 点护盾。`, 'gold', {
        side: source.side,
        event: 'steal',
      })
      pushFx(state, { type: 'text', x: source.x, z: source.z + 96, text: `顺走 ${Math.round(amount)}`, color: '#c0a046', life: 0.8 })
    } else if (mechanic.type === 'root') {
      addStatus(state, target, { type: 'root', duration: mechanic.duration || 1.4 }, source.side)
      pushLog(state, `${source.name} 把 ${target.name} 钉在原地。`, 'gold', { side: source.side, event: 'root' })
      pushFx(state, { type: 'text', x: target.x, z: target.z + 96, text: '定身', color: '#5d8954', life: 0.8 })
    } else if (mechanic.type === 'silence') {
      target.silencedUntil = Math.max(target.silencedUntil, state.t + (mechanic.duration || 1.6))
      cancelAction(state, target)
      pushLog(state, `${source.name} 封住了 ${target.name} 的嘴。`, 'gold', { side: source.side, event: 'silence' })
      pushFx(state, { type: 'text', x: target.x, z: target.z + 96, text: '封麦', color: '#8a6a49', life: 0.8 })
    }
  }
}

function applyAfterMechanics(state, fighter, enemy, contract) {
  if (state.over) return
  for (const mechanic of mechanicsOf(contract)) {
    if (mechanic.type === 'echo' && contract.attack !== 'self') {
      state.echoes.push({
        due: state.t + (mechanic.delay || 0.8),
        owner: fighter.side,
        x: enemy.x,
        damage: Math.max(2, (contract.damage || 10) * (mechanic.ratio || 0.35)),
        effects: [],
        contract: { color: contract.color, skill: `${contract.skill}·残响` },
        color: contract.color,
      })
      pushLog(state, `${fighter.name} 的「${contract.skill}」留下残响。`, fighter.side === 0 ? 'green' : 'rust', {
        side: fighter.side,
        event: 'echo',
      })
    } else if (mechanic.type === 'zone') {
      state.areas.push({
        id: state.nextId++,
        owner: fighter.side,
        x: enemy.x,
        z: 0,
        radius: mechanic.radius || 96,
        delay: 0.05,
        t: 0,
        damage: 0,
        effects: [],
        contract: { color: mechanic.color || contract.color, skill: mechanic.name },
        color: mechanic.color || contract.color,
        persistent: true,
        duration: mechanic.duration || 4,
        tick: 0,
        tickDamage: mechanic.tickDamage || 4,
        slow: mechanic.slow || 0.75,
      })
      pushLog(state, `${fighter.name} 留下「${mechanic.name}」。`, fighter.side === 0 ? 'green' : 'rust', {
        side: fighter.side,
        event: 'zone',
      })
      pushFx(state, { type: 'zone', x: enemy.x, z: 0, life: 0.8, color: mechanic.color || contract.color })
    } else if (mechanic.type === 'swap' && contract.attack !== 'self') {
      const ownX = fighter.x
      fighter.x = clamp(enemy.x, ARENA.left + 26, ARENA.right - 26)
      enemy.x = clamp(ownX, ARENA.left + 26, ARENA.right - 26)
      addStatus(state, enemy, { type: 'stun', duration: mechanic.stun || 0.3 }, fighter.side)
      pushLog(state, `${fighter.name} 与 ${enemy.name} 换了位置。`, 'gold', {
        side: fighter.side,
        event: 'swap',
      })
      pushFx(state, { type: 'swap', x: fighter.x, z: fighter.z, life: 0.6, color: contract.color })
    } else if (mechanic.type === 'clone') {
      const cloneContract = {
        ...contract,
        damage: Math.max(3, (contract.damage || 12) * (mechanic.ratio || 0.35)),
        effects: [],
        mechanics: [],
        summon: {
          duration: mechanic.duration || 5,
          interval: mechanic.interval || 1.5,
          range: 420,
          speed: 560,
          skill: `${contract.skill}·分身`,
        },
        skill: `${contract.skill}·分身`,
      }
      state.companions.push({
        id: state.nextId++,
        side: fighter.side,
        owner: fighter.side,
        x: clamp(fighter.x - fighter.facing * 46, ARENA.left + 10, ARENA.right - 10),
        z: 66,
        life: mechanic.duration || 5,
        interval: mechanic.interval || 1.5,
        timer: 0.35,
        contract: cloneContract,
        color: contract.color,
        skill: `${contract.skill}·分身`,
      })
      pushLog(state, `${fighter.name} 留下一个「${contract.skill}」分身。`, fighter.side === 0 ? 'green' : 'rust', {
        side: fighter.side,
        event: 'clone',
      })
      pushFx(state, { type: 'summon', side: fighter.side, x: fighter.x - fighter.facing * 46, z: 72, color: contract.color, life: 0.8 })
    }
  }
}

function updateEchoes(state, dt) {
  for (const echo of state.echoes) {
    if (echo.due > state.t) continue
    echo.done = true
    const source = state.fighters[echo.owner]
    const target = state.fighters[otherSide(echo.owner)]
    if (source.hp <= 0) continue
    if (target.hp > 0 && Math.abs(target.x - echo.x) < 110) {
      dealDamage(state, source, target, echo.damage, echo.contract, { isMelee: false })
      pushFx(state, { type: 'echo', x: echo.x, z: 40, life: 0.5, color: echo.color })
    } else {
      pushFx(state, { type: 'text', x: echo.x, z: 70, text: '残响落空', color: '#8a867a', life: 0.6 })
    }
  }
  state.echoes = state.echoes.filter((echo) => !echo.done)
}

function healFighter(state, fighter, amount, show = true) {
  if (state.over && state.result?.winnerSide !== fighter.side) return
  const before = fighter.hp
  fighter.hp = Math.min(fighter.maxHp, fighter.hp + Math.max(0, amount))
  const healed = fighter.hp - before
  if (healed >= 1 && show) {
    pushFx(state, { type: 'heal', side: fighter.side, x: fighter.x, z: fighter.z, amount: Math.round(healed), life: 0.8 })
  }
}

function computeOutgoing(source, base) {
  let damage = base * (source.power || 1) * (1 + (source.synergyDamage || 0))
  const weaken = getStatus(source, 'weaken')
  if (weaken?.factor) damage *= weaken.factor
  const shrink = getStatus(source, 'shrink')
  if (shrink?.factor) damage *= shrink.factor
  const inspiration = getStatus(source, 'inspiration')
  if (inspiration?.damage) damage *= inspiration.damage
  const focus = getStatus(source, 'focus')
  if (focus?.damage) damage *= focus.damage
  return damage
}

function damageRaw(state, sourceSide, target, amount, { reason = 'dot' } = {}) {
  if (state.over) return 0
  if (target.absoluteUntil > state.t && target.absoluteMode === 'invulnerable') {
    return { damage: 0, absorbed: 0, hpDamage: 0 }
  }
  if (target.absoluteUntil > state.t && target.absoluteMode === 'undying' && amount >= target.hp + target.shield) {
    target.hp = 1
    target.absoluteUntil = 0
    target.breakUntil = Math.max(target.breakUntil, state.t + 1.8)
    pushFx(state, { type: 'text', x: target.x, z: target.z + 96, text: '不死', color: '#c0a046', life: 0.9 })
    return { damage: 0, absorbed: 0, hpDamage: 0 }
  }
  const source = state.fighters[sourceSide]
  let damage = Math.max(1, Math.round(amount * state.damageScale))
  const absorbed = Math.min(target.shield, damage)
  target.shield = Math.max(0, target.shield - absorbed)
  const hpDamage = damage - absorbed
  target.hp = Math.max(0, target.hp - hpDamage)
  target.damageTaken += damage
  if (source) source.damageDealt += damage
  if (hpDamage > 0) {
    target.flash = Math.max(target.flash, 0.12)
  }
  if (target.hp <= 0) {
    endBattle(state, otherSide(target.side), 'ko')
  }
  return { damage, absorbed, hpDamage }
}

function dealDamage(state, source, target, base, contract, { isMelee = false, canCrit = true, isDot = false, canCounter = true } = {}) {
  if (state.over) return null

  if (target.absoluteUntil > state.t) {
    if (target.absoluteMode === 'invulnerable') {
      pushFx(state, { type: 'text', x: target.x, z: target.z + 96, text: '绝对', color: '#c0a046', life: 0.7 })
      return { damage: 0, crit: false, absorbed: 0 }
    }
    if (target.absoluteMode === 'undying') {
      const incoming = computeOutgoing(source, base) * state.damageScale
      if (incoming >= target.hp + target.shield) {
        target.hp = 1
        target.absoluteUntil = 0
        target.breakUntil = Math.max(target.breakUntil, state.t + 1.8)
        pushLog(state, `${target.name} 的「不死」把致命伤压到最后一口气。`, 'gold', { side: target.side })
        pushFx(state, { type: 'text', x: target.x, z: target.z + 96, text: '不死', color: '#c0a046', life: 0.9 })
        return { damage: 0, crit: false, absorbed: 0 }
      }
    }
  }

  let damage = isDot ? base : computeOutgoing(source, base)
  if (!isDot && contract?.volatility) {
    damage *= 1 + (state.rng.next() - 0.5) * contract.volatility * 1.5
  }
  const inflate = getStatus(target, 'inflate')
  if (!isDot && inflate?.damageTaken) damage *= 1 + inflate.damageTaken
  const gamble = mechanicsOf(contract).find((mechanic) => mechanic.type === 'gamble')
  if (!isDot && gamble) {
    const roll = state.rng.next()
    const multiplier = roll < 0.32
      ? (gamble.low || 0.35)
      : roll > 0.68
        ? (gamble.high || 2.4)
        : 1
    damage *= multiplier
    pushFx(state, {
      type: 'text',
      x: source.x,
      z: source.z + 100,
      text: multiplier > 1.5 ? '梭哈·大' : multiplier < 0.8 ? '梭哈·小' : '梭哈',
      color: multiplier > 1.5 ? '#c0a046' : '#8a6a49',
      life: 0.9,
    })
    if (multiplier < 0.8) {
      damageRaw(state, source.side, source, gamble.selfDamage || 6, { reason: 'gamble' })
    }
  }
  const targetSunder = getStatus(target, 'sunder')
  const armor = clamp((target.passive.armor || 0) - (targetSunder?.amount || 0), 0, 0.6)
  if (!isDot) damage *= 1 - armor
  if (!isDot) damage *= state.damageScale
  if (!isDot && target.breakUntil > state.t) damage *= 1 + (target.breakAmp || 0.35)
  if (!isDot && source.inevitableUntil > state.t) damage *= 1.12
  const vulnerable = getStatus(target, 'vulnerable')
  if (!isDot && vulnerable?.amount) damage *= 1 + vulnerable.amount

  if (!isDot) {
    const execute = mechanicsOf(contract).find((mechanic) => mechanic.type === 'execute')
      || (source.absoluteMode === 'execute' && source.absoluteUntil > state.t
        ? { threshold: 0.25, bonus: 0.8 }
        : null)
    if (execute && target.hp / target.maxHp <= (execute.threshold || 0.25)) {
      damage *= 1 + (execute.bonus || 0.6)
      pushFx(state, { type: 'text', x: target.x, z: target.z + 98, text: '斩杀', color: '#a34b32', life: 0.8 })
    }
    if (source.chargeStacks > 0 && source.chargeUntil > state.t) {
      damage *= 1 + (source.chargeBonus || 0.4)
      source.chargeStacks = 0
      pushFx(state, { type: 'text', x: source.x, z: source.z + 98, text: '蓄势', color: '#b08a4f', life: 0.7 })
    }
    const markIndex = target.marks.findIndex((mark) => mark.until > state.t && mark.stacks > 0)
    if (markIndex >= 0) {
      const mark = target.marks[markIndex]
      damage *= 1 + (mark.bonus || 0.35)
      mark.stacks -= 1
      if (mark.stacks <= 0) target.marks.splice(markIndex, 1)
      pushFx(state, { type: 'text', x: target.x, z: target.z + 104, text: '刻印引爆', color: '#b08a4f', life: 0.8 })
    }
  }

  let crit = false
  if (!isDot && canCrit) {
    const focus = getStatus(source, 'focus')
    const critChance = clamp((source.passive.crit || 0.04) + (focus?.crit || 0), 0, 0.75)
    if (state.rng.chance(critChance)) {
      crit = true
      damage *= 1.6
    }
  }
  if (!isDot) damage *= 0.94 + state.rng.next() * 0.12
  damage = Math.max(1, Math.round(damage))

  const absorbed = Math.min(target.shield, damage)
  target.shield = Math.max(0, target.shield - absorbed)
  const hpDamage = damage - absorbed
  target.hp = Math.max(0, target.hp - hpDamage)
  target.damageTaken += damage
  source.damageDealt += damage
  source.hits += 1
  target.flash = 0.16

  pushFx(state, {
    type: 'hit',
    x: target.x,
    z: target.z + BODY_CENTER,
    color: contract?.color || '#a44b34',
    amount: damage,
    crit,
    absorbed,
    life: 0.75,
  })
  if (crit) pushFx(state, { type: 'shake', power: 5, life: 0.2 })

  if (canCounter && target.counterUntil > state.t && target.counterCharges > 0 && !isDot && damage > 0) {
    target.counterCharges -= 1
    const counterDamage = Math.max(2, Math.round(damage * (target.counterRatio || 0.5)))
    damageRaw(state, target.side, source, counterDamage, { reason: 'counter' })
    pushLog(state, `${target.name} 的「反击架势」反打了 ${counterDamage}。`, 'gold', { side: target.side })
    pushFx(state, { type: 'counter', x: source.x, z: source.z + 44, life: 0.7, color: '#7d6fa8' })
  }
  if (canCounter && target.reflectUntil > state.t && target.reflectCharges > 0 && !isDot && damage > 0) {
    target.reflectCharges -= 1
    const reflected = Math.max(2, Math.round(damage * (target.reflectRatio || 0.5)))
    damageRaw(state, target.side, source, reflected, { reason: 'reflect' })
    pushLog(state, `${target.name} 的「镜返」弹回 ${reflected}。`, 'gold', { side: target.side })
    pushFx(state, { type: 'antiAbsolute', x: source.x, z: source.z + 44, life: 0.65, color: '#7d6fa8' })
  }
  if (target.sleepUntil > state.t && damage > 0) {
    target.sleepUntil = 0
    target.openingUntil = Math.max(target.openingUntil, state.t + 0.9)
    pushFx(state, { type: 'text', x: target.x, z: target.z + 98, text: '惊醒', color: '#8a6a49', life: 0.8 })
  }

  // 反伤只对近身攻击生效，避免远程也被莫名其妙地弹死。
  const thorns = clamp((target.passive.thorns || 0) + (getStatus(target, 'thorns')?.ratio || 0), 0, 0.5)
  if (isMelee && thorns > 0 && target.hp > 0) {
    const reflect = Math.max(1, Math.round(damage * thorns))
    damageRaw(state, target.side, source, reflect, { reason: 'thorns' })
    pushFx(state, { type: 'text', x: source.x, z: source.z + 88, text: `反伤 ${reflect}`, color: '#8a6a49', life: 0.7 })
  }

  const directLifesteal = (source.passive.lifesteal || 0)
    + (contract?.effects?.find((e) => e.type === 'lifesteal')?.ratio || 0)
  if (directLifesteal > 0 && source.hp > 0) {
    healFighter(state, source, damage * Math.min(0.3, directLifesteal), damage > 18)
  }

  if (contract?.effects?.length && target.hp > 0 && !state.over) {
    applyEffects(state, source, target, contract.effects, { isMelee, selfCast: false })
  }
  if (target.hp <= 0 && !state.over) {
    endBattle(state, otherSide(target.side), 'ko')
  }
  return { damage, crit, absorbed }
}

function applyEffects(state, source, target, effects, { isMelee = false, selfCast = false } = {}) {
  for (const effect of effects || []) {
    const chance = effect.chance == null ? 1 : effect.chance
    if (chance < 1 && !state.rng.chance(chance)) continue
    const duration = effect.duration || 3
    switch (effect.type) {
      case 'burn':
      case 'bleed':
      case 'poison':
        if (!selfCast) addStatus(state, target, { ...effect, type: effect.type, duration, amount: effect.amount || 5 }, source.side)
        break
      case 'slow':
        if (!selfCast) addStatus(state, target, { type: 'slow', duration, factor: effect.factor || 0.7 }, source.side)
        break
      case 'stun':
        if (!selfCast) addStatus(state, target, { type: 'stun', duration }, source.side)
        break
      case 'weaken':
        if (!selfCast) addStatus(state, target, { type: 'weaken', duration, factor: effect.factor || 0.82 }, source.side)
        break
      case 'sunder':
        if (!selfCast) addStatus(state, target, { type: 'sunder', duration, amount: effect.amount || 0.1 }, source.side)
        break
      case 'vulnerable':
        if (!selfCast) addStatus(state, target, { type: 'vulnerable', duration, amount: effect.amount || 0.12 }, source.side)
        break
      case 'knockback':
        if (!selfCast) {
          const dir = Math.sign(target.x - source.x) || 1
          target.kb += dir * (effect.power || 45)
        }
        break
      case 'pull':
        if (!selfCast) {
          const dir = Math.sign(source.x - target.x) || 1
          target.kb += dir * (effect.power || 50)
        }
        break
      case 'lifesteal':
        // 直接汲取在 dealDamage 里按实际伤害结算，这里不重复回血。
        break
      case 'heal':
        healFighter(state, source, effect.amount || 40)
        break
      case 'shield':
        source.shield += effect.amount || 45
        source.shieldUntil = Math.max(source.shieldUntil, state.t + duration)
        pushFx(state, { type: 'shield', side: source.side, life: 0.7 })
        break
      case 'haste':
        addStatus(state, source, { type: 'haste', duration, factor: effect.factor || 1.3 }, source.side)
        break
      case 'regen':
        addStatus(state, source, { type: 'regen', duration, amount: effect.amount || 2 }, source.side)
        break
      case 'thorns':
        addStatus(state, source, { type: 'thorns', duration, ratio: effect.ratio || 0.12 }, source.side)
        break
      case 'focus':
        addStatus(state, source, {
          type: 'focus',
          duration,
          crit: effect.crit || 0.18,
          damage: effect.damage || 1,
        }, source.side)
        break
      default:
        break
    }
  }
}

function styleOf(fighter) {
  return STYLE[fighter.style] || STYLE.balanced
}

function currentSpeed(state, fighter) {
  const slow = getStatus(fighter, 'slow')
  const haste = getStatus(fighter, 'haste')
  const inflate = getStatus(fighter, 'inflate')
  const root = getStatus(fighter, 'root')
  const inspiration = getStatus(fighter, 'inspiration')
  let speed = BASE_SPEED * (fighter.passive.moveSpeed || 1)
  if (slow?.factor) speed *= slow.factor
  if (haste?.factor) speed *= haste.factor
  if (inflate?.speed) speed *= inflate.speed
  if (root) speed *= 0.12
  if (inspiration?.speed) speed *= inspiration.speed
  return speed
}

function tryJump(state, fighter, forced = false) {
  if (fighter.z > 0 || state.t < fighter.nextJump || state.over) return false
  const style = styleOf(fighter)
  if (!forced && !state.rng.chance(style.jump)) return false
  fighter.vz = JUMP_SPEED
  fighter.z = 0.01
  fighter.nextJump = state.t + 2.4 + state.rng.next() * 1.8
  fighter.state = 'jump'
  fighter.intent = '跃起'
  pushFx(state, { type: 'jump', side: fighter.side, x: fighter.x, z: fighter.z, life: 0.35 })
  return true
}

function incomingThreat(state, fighter, enemy) {
  for (const projectile of state.projectiles) {
    if (projectile.owner !== enemy.side || projectile.hit) continue
    if ((fighter.x - projectile.x) * projectile.vx <= 0) continue
    if (Math.abs(projectile.x - fighter.x) > 190) continue
    if (Math.abs(projectile.z - (fighter.z + BODY_CENTER)) > 54) continue
    return 'projectile'
  }
  if (enemy.action && !enemy.action.resolved) {
    const contract = enemy.action.contract
    const dist = Math.abs(fighter.x - enemy.x)
    if (contract.attack === 'beam' && dist <= contract.range && fighter.z < 60) return 'beam'
    if (contract.attack === 'melee' && dist <= contract.range + 16) return 'melee'
  }
  for (const area of state.areas) {
    if (area.owner !== enemy.side) continue
    if (Math.abs(area.x - fighter.x) < area.radius + 12) return 'aoe'
  }
  return ''
}

function desiredRange(fighter) {
  const combat = fighter.contracts
    .map((contract, index) => ({ contract, index }))
    .filter(({ contract }) => contract.attack !== 'self')
  if (!combat.length) return 52
  const ready = combat.filter(({ index }) => fighter.cooldowns[index] <= 0)
  const list = ready.length ? ready : combat
  const nearest = Math.min(...list.map(({ contract }) => contract.preferredRange || 200))
  const farthest = Math.max(...list.map(({ contract }) => contract.preferredRange || 200))
  const hpRatio = fighter.hp / fighter.maxHp
  const persona = fighter.persona || 'wanderer'
  let desired
  if (persona === 'ranger') desired = farthest * (hpRatio < 0.4 ? 1.02 : 0.92)
  else if (persona === 'mage') desired = farthest * 0.86
  else if (persona === 'summoner') desired = farthest * 0.98
  else if (persona === 'duelist') desired = nearest * 0.84
  else if (persona === 'guardian') desired = nearest * 0.78
  else desired = (nearest + farthest) * 0.5
  // 场地只有 1000 宽；再远的“舒适距离”也会变成两边贴边罚站。
  return Math.min(310, Math.max(42, desired) * styleOf(fighter).range)
}

function skillScore(state, fighter, enemy, contract, index) {
  const distance = Math.abs(enemy.x - fighter.x)
  const style = styleOf(fighter)
  if (contract.attack === 'self') {
    const missing = 1 - fighter.hp / fighter.maxHp
    let utility = 0
    for (const effect of contract.effects || []) {
      if (effect.type === 'heal') utility += effect.amount * (missing > 0.25 ? 1.2 : 0.3)
      if (effect.type === 'shield') utility += (effect.amount || 40) * (fighter.shield < 10 ? 0.9 : 0.15)
      if (effect.type === 'haste') utility += fighter.statuses.some((s) => s.type === 'haste') ? 3 : 16
      if (effect.type === 'focus') utility += fighter.statuses.some((s) => s.type === 'focus') ? 3 : 14
      if (effect.type === 'thorns') utility += enemy.contracts.some((c) => c.attack === 'melee') ? 18 : 4
      if (effect.type === 'regen') utility += 10
    }
    if (missing < 0.12 && fighter.shield > 0) utility *= 0.25
    return utility
  }

  if (contract.attack === 'summon' && state.companions.some((c) => c.side === fighter.side)) {
    return 4
  }

  if (contract.attack === 'melee') {
    if (distance > contract.range + 24) return -1
  } else if (contract.attack === 'dash') {
    // 位移技允许从更远处起手，否则近战永远追不上放风筝的远程。
    if (distance > contract.range + 110) return -1
  } else if (contract.attack !== 'self' && distance > contract.range + 10) {
    return -1
  }

  let hitChance = 0.9
  if (contract.attack === 'melee') hitChance = distance <= contract.range ? 0.98 : 0.3
  else if (contract.attack === 'dash') hitChance = 0.72
  else if (contract.attack === 'projectile') {
    hitChance = clamp(1.05 - distance / Math.max(1, contract.range) * 0.25, 0.55, 0.98)
    if (enemy.z > 30) hitChance *= 0.55
  } else if (contract.attack === 'beam') {
    hitChance = enemy.z > 50 ? 0.45 : 0.96
  } else if (contract.attack === 'aoe') {
    hitChance = 0.72
  } else if (contract.attack === 'summon') {
    hitChance = 0.82
  }

  const expected = (contract.damage || 0) * (contract.hits || 1) * hitChance
  let score = expected
  for (const effect of contract.effects || []) {
    if (effect.type === 'stun') score += 12 * (effect.chance || 1)
    if (effect.type === 'slow') score += 6
    if (effect.type === 'burn' || effect.type === 'poison' || effect.type === 'bleed') score += 5
    if (effect.type === 'weaken' || effect.type === 'vulnerable' || effect.type === 'sunder') score += 5
    if (effect.type === 'heal' || effect.type === 'shield') score += 4
    if (effect.type === 'lifesteal') score += 3
  }
  if (contract.aoeRadius > 0) score += 5
  if (contract.attack === 'summon') score += 16
  if (contract.attack === 'melee' || contract.attack === 'dash') score += style.melee || 0
  if (['projectile', 'beam'].includes(contract.attack)) score += style.ranged || 0
  if (['aoe', 'summon'].includes(contract.attack)) score += style.aoe || 0
  const remaining = enemy.hp + enemy.shield
  if (expected >= remaining) score += 70
  for (const mechanic of contract.mechanics || []) {
    if (mechanic.type === 'absolute') score += enemy.antiAbsoluteCharges > 0 ? 7 : 24
    else if (mechanic.type === 'antiAbsolute') score += enemy.absoluteUntil > state.t ? 28 : 3
    else if (mechanic.type === 'execute' && enemy.hp / enemy.maxHp <= (mechanic.threshold || 0.25)) score += 24
    else if (mechanic.type === 'counter') score += enemy.contracts.some((item) => item.attack === 'melee') ? 10 : 4
    else if (mechanic.type === 'seal') score += 9
    else if (mechanic.type === 'swap') score += 8
    else if (mechanic.type === 'mark') score += 7
    else if (mechanic.type === 'zone') score += 7
    else if (mechanic.type === 'echo') score += 6
    else if (mechanic.type === 'chain') score += 5
    else if (mechanic.type === 'charge') score += fighter.chargeStacks > 0 ? 2 : 8
  }
  if (enemy.breakUntil > state.t) score += 18
  if (enemy.openingUntil > state.t) score += 14
  if (contract.attack === 'self') score *= 0.3
  return score
}

function chooseAction(state, fighter, enemy) {
  let best = null
  let bestScore = 11
  for (let index = 0; index < fighter.contracts.length; index += 1) {
    if (fighter.silencedUntil > state.t) break
    if (fighter.cooldowns[index] > 0) continue
    if (fighter.sealed[index] > state.t) continue
    const contract = fighter.contracts[index]
    const score = skillScore(state, fighter, enemy, contract, index)
    if (score > bestScore) {
      best = { contract, index, score }
      bestScore = score
    }
  }
  if (best) return best
  if (fighter.basicCd <= 0 && Math.abs(enemy.x - fighter.x) <= 54 && Math.abs(enemy.z - fighter.z) < 52) {
    return { contract: makeBarehandContract(), index: -1, score: 6 }
  }
  return null
}

function startAction(state, fighter, enemy, contract, index) {
  if (state.over) return
  fighter.action = {
    contract,
    index,
    elapsed: 0,
    windup: contract.windup || 0.2,
    resolved: false,
    recovery: contract.attack === 'summon' ? 0.28 : 0.18,
    targetX: enemy.x,
  }
  fighter.state = 'windup'
  fighter.intent = index >= 0 ? `起手·${contract.skill}` : '赤手'
  fighter.lastActionName = contract.skill
  if (index >= 0) fighter.lastContract = contract
  fighter.facing = enemy.x >= fighter.x ? 1 : -1
  fighter.gcdUntil = state.t + (contract.attack === 'self' ? 0.6 : index < 0 ? 0.55 : 0.85)
  if (index >= 0) {
    fighter.cooldowns[index] = contract.cooldown
    fighter.skillsUsed += 1
    pushLog(state, `${fighter.name} 起手「${contract.skill}」`, fighter.side === 0 ? 'green' : 'rust', {
      side: fighter.side,
      skill: contract.skill,
    })
  } else {
    fighter.basicCd = contract.cooldown
  }
  pushFx(state, {
    type: 'cast',
    side: fighter.side,
    x: fighter.x,
    z: fighter.z + 40,
    color: contract.color || '#6f6a5c',
    skill: contract.skill,
    life: 0.45,
  })
  if (index >= 0) applyCastMechanics(state, fighter, enemy, contract)
}

function spawnProjectile(state, fighter, contract, offsetZ = 0) {
  state.projectiles.push({
    id: state.nextId++,
    owner: fighter.side,
    x: fighter.x + fighter.facing * 24,
    z: fighter.z + 36 + offsetZ,
    vx: fighter.facing * (contract.projectileSpeed || 600),
    damage: contract.damage,
    effects: contract.effects || [],
    radius: contract.projectileRadius || 7,
    aoeRadius: contract.aoeRadius || 0,
    pierce: Boolean(contract.pierce),
    color: contract.color || '#6f6a5c',
    skill: contract.skill,
    attack: contract.attack,
    volatility: contract.volatility || 0,
    mechanics: contract.mechanics || [],
    contract,
    life: 1.8,
    hit: false,
    trail: [],
  })
}

function resolveAction(state, fighter, enemy) {
  const action = fighter.action
  if (!action || action.resolved) return
  action.resolved = true
  const contract = action.contract
  const distance = Math.abs(enemy.x - fighter.x)
  const facing = enemy.x >= fighter.x ? 1 : -1
  fighter.facing = facing

  switch (contract.attack) {
    case 'melee': {
      let inRange = distance <= contract.range + 22 && Math.abs(enemy.z - fighter.z) < 62
      // 近战自带半步垫步：不是瞬移，是把“够不着”变成“差一点够得着”。
      if (!inRange && distance <= contract.range + 92 && Math.abs(enemy.z - fighter.z) < 62) {
        const step = Math.min(62, distance - contract.range)
        fighter.x += facing * step
        pushFx(state, {
          type: 'dashTrail',
          side: fighter.side,
          x: fighter.x,
          z: fighter.z + 40,
          color: contract.color,
          life: 0.2,
        })
        inRange = true
      }
      pushFx(state, {
        type: 'slash',
        side: fighter.side,
        x: fighter.x,
        z: fighter.z,
        facing,
        range: contract.range,
        color: contract.color,
        life: 0.26,
      })
      if (!inRange) {
        pushFx(state, { type: 'text', x: enemy.x, z: enemy.z + 90, text: '落空', color: '#8a867a', life: 0.7 })
        fighter.openingUntil = Math.max(fighter.openingUntil, state.t + 0.9)
        break
      }
      for (let i = 0; i < (contract.hits || 1); i += 1) {
        dealDamage(state, fighter, enemy, contract.damage, contract, { isMelee: true })
        if (state.over) break
      }
      applyHitMechanics(state, fighter, enemy, contract)
      break
    }
    case 'projectile': {
      for (let i = 0; i < (contract.hits || 1); i += 1) {
        spawnProjectile(state, fighter, contract, (i - ((contract.hits || 1) - 1) / 2) * 16)
      }
      break
    }
    case 'beam': {
      const maxX = fighter.x + facing * contract.range
      const hit = distance <= contract.range + 24 && Math.abs(enemy.z - fighter.z) < 76
      pushFx(state, {
        type: 'beam',
        x1: fighter.x + facing * 18,
        z1: fighter.z + 40,
        x2: hit ? enemy.x : maxX,
        z2: hit ? enemy.z + 40 : 40,
        color: contract.color,
        life: 0.32,
      })
      if (!hit) {
        pushFx(state, { type: 'text', x: enemy.x, z: enemy.z + 90, text: '擦过', color: '#8a867a', life: 0.6 })
        fighter.openingUntil = Math.max(fighter.openingUntil, state.t + 0.9)
        break
      }
      for (let i = 0; i < (contract.hits || 1); i += 1) {
        dealDamage(state, fighter, enemy, contract.damage, contract, { isMelee: false })
        if (state.over) break
      }
      applyHitMechanics(state, fighter, enemy, contract)
      break
    }
    case 'aoe': {
      const targetX = clamp(enemy.x, ARENA.left + 30, ARENA.right - 30)
      state.areas.push({
        id: state.nextId++,
        owner: fighter.side,
        x: targetX,
        z: 0,
        radius: contract.aoeRadius || 85,
        delay: 0.52,
        t: 0,
        damage: contract.damage,
        effects: contract.effects || [],
        contract,
        mechanics: contract.mechanics || [],
        color: contract.color,
      })
      pushLog(state, `${fighter.name} 在场上布下「${contract.skill}」`, fighter.side === 0 ? 'green' : 'rust', {
        side: fighter.side,
        skill: contract.skill,
      })
      break
    }
    case 'dash': {
      fighter.dash = {
        time: 0.3,
        vx: facing * 760,
        contract,
        hit: false,
        startX: fighter.x,
      }
      fighter.state = 'dash'
      fighter.intent = `突进·${contract.skill}`
      pushFx(state, {
        type: 'dash',
        side: fighter.side,
        x: fighter.x,
        z: fighter.z,
        facing,
        color: contract.color,
        life: 0.3,
      })
      break
    }
    case 'self': {
      applyEffects(state, fighter, fighter, contract.effects || [], { selfCast: true })
      pushFx(state, {
        type: 'aura',
        side: fighter.side,
        x: fighter.x,
        z: fighter.z,
        color: contract.color,
        life: 0.75,
      })
      break
    }
    case 'summon': {
      const same = state.companions.filter((c) => c.side === fighter.side)
      if (same.length >= 2) {
        const oldest = same[0]
        state.companions = state.companions.filter((c) => c.id !== oldest.id)
      }
      state.companions.push({
        id: state.nextId++,
        side: fighter.side,
        owner: fighter.side,
        x: fighter.x - facing * 40,
        z: 74,
        life: contract.summon?.duration || 8,
        interval: contract.summon?.interval || 1.5,
        timer: 0.5,
        contract,
        color: contract.color,
        skill: contract.skill,
      })
      pushFx(state, {
        type: 'summon',
        side: fighter.side,
        x: fighter.x - facing * 40,
        z: 80,
        color: contract.color,
        life: 0.8,
      })
      pushLog(state, `${fighter.name} 唤出「${contract.skill}」助战`, fighter.side === 0 ? 'green' : 'rust', {
        side: fighter.side,
        skill: contract.skill,
      })
      break
    }
    default:
      break
  }
  if (['duelist', 'ranger', 'mage'].includes(fighter.persona) && contract.attack !== 'summon') {
    fighter.repositionUntil = state.t + (fighter.persona === 'duelist' ? 0.32 : 0.24)
    fighter.repositionDir = -facing
  }
  applyAfterMechanics(state, fighter, enemy, contract)
}

function updateAction(state, fighter, enemy, dt) {
  const action = fighter.action
  if (!action) return
  action.elapsed += dt
  if (!action.resolved && action.elapsed >= action.windup) {
    resolveAction(state, fighter, enemy)
  }
  if (action.resolved && action.elapsed >= action.windup + action.recovery) {
    fighter.action = null
    if (fighter.state !== 'dash') fighter.state = 'idle'
  }
}

function updateDash(state, fighter, enemy, dt) {
  const dash = fighter.dash
  if (!dash) return
  fighter.facing = Math.sign(dash.vx) || fighter.facing
  fighter.x += dash.vx * dt
  dash.time -= dt
  if (!dash.hit && Math.abs(fighter.x - enemy.x) <= 40 && Math.abs(fighter.z - enemy.z) < 60) {
    dash.hit = true
    for (let i = 0; i < (dash.contract.hits || 1); i += 1) {
      dealDamage(state, fighter, enemy, dash.contract.damage, dash.contract, { isMelee: true })
      if (state.over) break
    }
    if (!state.over) applyHitMechanics(state, fighter, enemy, dash.contract)
  }
  pushFx(state, {
    type: 'dashTrail',
    side: fighter.side,
    x: fighter.x,
    z: fighter.z + 40,
    color: dash.contract.color,
    life: 0.18,
  })
  if (dash.time <= 0) {
    if (!dash.hit) fighter.openingUntil = Math.max(fighter.openingUntil, state.t + 0.8)
    fighter.dash = null
    fighter.state = 'idle'
    fighter.action = null
  }
}

function moveFighter(state, fighter, enemy, dt) {
  if (fighter.surrender || fighter.state === 'ko') return
  const distance = Math.abs(enemy.x - fighter.x)
  const desired = desiredRange(fighter)
  const threat = incomingThreat(state, fighter, enemy)
  const style = styleOf(fighter)
  const persona = fighter.persona || 'wanderer'
  const canAct = !fighter.action && !fighter.dash
  const hpRatio = fighter.hp / fighter.maxHp
  const damageReady = fighter.contracts.some(
    (contract, index) => contract.attack !== 'self' && fighter.cooldowns[index] <= 0,
  )
  const enemyWinding = enemy.action && !enemy.action.resolved
  const enemyOpen = enemy.openingUntil > state.t || enemy.breakUntil > state.t
  const rangedPersona = ['ranger', 'mage', 'summoner'].includes(persona)
  const lowHp = hpRatio < 0.32
  const taunted = fighter.tauntUntil > state.t
  const feared = fighter.fearUntil > state.t

  if (threat && canAct && state.t > fighter.nextJump) {
    if (threat === 'aoe' && fighter.z === 0) {
      const area = state.areas.find((item) => item.owner === enemy.side && Math.abs(item.x - fighter.x) < item.radius + 10)
      if (area) {
        const dir = Math.sign(fighter.x - area.x) || (fighter.x < ARENA.width / 2 ? -1 : 1)
        fighter.vx = dir * currentSpeed(state, fighter) * 1.8
        fighter.x = clamp(fighter.x + fighter.vx * dt, ARENA.left + 26, ARENA.right - 26)
        fighter.intent = '闪避'
        fighter.kb *= Math.exp(-7 * dt)
        return
      }
    } else if (threat === 'melee' && rangedPersona && distance < 150) {
      const dir = Math.sign(fighter.x - enemy.x) || -1
      fighter.vx = dir * currentSpeed(state, fighter) * 1.55
      fighter.x = clamp(fighter.x + fighter.vx * dt, ARENA.left + 26, ARENA.right - 26)
      fighter.intent = '拉扯·后撤'
      fighter.kb *= Math.exp(-7 * dt)
      return
    } else if (state.rng.chance(style.jump)) {
      tryJump(state, fighter, true)
    }
  }

  if (fighter.z > 0) {
    fighter.z += fighter.vz * dt
    fighter.vz -= GRAVITY * dt
    if (fighter.z <= 0) {
      fighter.z = 0
      fighter.vz = 0
      if (fighter.state === 'jump') fighter.state = 'idle'
    }
    const airSpeed = currentSpeed(state, fighter) * 0.68
    if (distance > desired + 20) fighter.x += Math.sign(enemy.x - fighter.x) * airSpeed * dt
    else if (distance < desired - 20) fighter.x -= Math.sign(enemy.x - fighter.x) * airSpeed * dt
  } else if (canAct) {
    let direction = 0
    let speed = currentSpeed(state, fighter)

    if (taunted) {
      const source = fighter.tauntSource == null ? enemy : state.fighters[fighter.tauntSource]
      direction = Math.sign((source || enemy).x - fighter.x) || 0
      fighter.intent = '被点名'
      speed *= 1.18
    } else if (feared) {
      direction = -Math.sign(enemy.x - fighter.x) || 0
      fighter.intent = '被吓退'
      speed *= 1.12
    } else if (distance > 430) {
      direction = Math.sign(enemy.x - fighter.x)
      fighter.intent = '拉近距离'
      speed *= 1.1
    } else if (state.t < fighter.repositionUntil) {
      direction = fighter.repositionDir || -Math.sign(enemy.x - fighter.x)
      fighter.intent = '收招'
      speed *= 0.8
    } else if (enemyOpen && persona === 'duelist') {
      direction = Math.sign(enemy.x - fighter.x)
      fighter.intent = '抓破绽'
      speed *= 1.18
    } else if (lowHp && rangedPersona) {
      direction = -Math.sign(enemy.x - fighter.x)
      fighter.intent = '拉扯·保命'
      speed *= 1.12
    } else if (!damageReady && distance < desired + 36) {
      direction = -Math.sign(enemy.x - fighter.x)
      fighter.intent = '等CD'
      speed *= 1.08
    } else if (enemyWinding && rangedPersona && distance < 190) {
      direction = -Math.sign(enemy.x - fighter.x)
      fighter.intent = '拉扯·躲招'
      speed *= 1.22
    } else if (rangedPersona && distance < desired * 0.62) {
      direction = -Math.sign(enemy.x - fighter.x)
      fighter.intent = '拉扯·后撤'
      speed *= 1.2
    } else if (fighter.openingUntil > state.t && persona !== 'guardian') {
      direction = -Math.sign(enemy.x - fighter.x)
      fighter.intent = '脱离破绽'
      speed *= 1.16
    } else {
      if (distance > desired + 14) direction = Math.sign(enemy.x - fighter.x)
      else if (distance < desired - 14) direction = -Math.sign(enemy.x - fighter.x)
      fighter.intent = direction > 0
        ? (persona === 'duelist' ? '抢身位' : '逼近')
        : direction < 0
          ? '拉扯·后撤'
          : (state.t < 7 ? '试探' : '卡距离')
    }

    if (direction < 0 && fighter.x < ARENA.left + 46) direction = 0
    if (direction > 0 && fighter.x > ARENA.right - 46) direction = 0
    const meleeReady = fighter.contracts.some(
      (contract, index) => contract.attack === 'melee' && fighter.cooldowns[index] <= 0,
    )
    if (meleeReady && distance > desired + 20 && direction !== 0) speed *= 1.28
    if (meleeReady && distance > desired + 20 && direction !== 0) fighter.intent = '抢近身'
    fighter.vx += (direction * speed - fighter.vx) * Math.min(1, dt * 12)
    fighter.x += fighter.vx * dt
    if (direction !== 0) {
      fighter.walkPhase += dt * 9
      if (!fighter.action) fighter.state = 'move'
    } else if (!fighter.action) {
      fighter.state = 'idle'
    }
  } else if (fighter.state === 'dash') {
    fighter.x += fighter.vx * dt
  }
  if (canAct && fighter.z === 0) {
    fighter.x += fighter.kb * dt
  }
  fighter.kb *= Math.exp(-7 * dt)
  if (fighter.kb > -0.5 && fighter.kb < 0.5) fighter.kb = 0
  fighter.x = clamp(fighter.x, ARENA.left + 26, ARENA.right - 26)
}

function checkSurrender(state, fighter, enemy) {
  if (state.t < 12 || state.over || fighter.hp <= 0) return
  const ratio = fighter.hp / fighter.maxHp
  const enemyRatio = enemy.hp / enemy.maxHp
  const threshold = styleOf(fighter).surrender
  if (ratio > threshold || enemyRatio < 0.65) return
  if (enemy.hp - fighter.hp < fighter.maxHp * 0.45) return
  if (state.t < fighter.nextSurrenderCheck) return
  fighter.nextSurrenderCheck = state.t + 1.2
  if (!state.rng.chance(0.28)) return
  fighter.surrender = true
  fighter.state = 'surrender'
  cancelAction(state, fighter)
  pushLog(state, `${fighter.name} 放下手，认输了。`, 'muted', { side: fighter.side, event: 'surrender' })
  pushFx(state, { type: 'surrender', side: fighter.side, x: fighter.x, z: fighter.z, life: 1.2 })
  endBattle(state, otherSide(fighter.side), 'surrender')
}

function updateStatuses(state, fighter, dt) {
  pruneStatuses(state, fighter)
  fighter.marks = fighter.marks.filter((mark) => mark.until > state.t && mark.stacks > 0)
  for (const key of Object.keys(fighter.sealed)) {
    if (fighter.sealed[key] <= state.t) delete fighter.sealed[key]
  }
  if (fighter.chargeUntil <= state.t) {
    fighter.chargeStacks = 0
  }
  if (fighter.shield > 0 && fighter.shieldUntil > 0 && state.t > fighter.shieldUntil) {
    fighter.shield = 0
    fighter.shieldUntil = 0
  }
  for (const status of fighter.statuses) {
    if (status.type === 'burn' || status.type === 'bleed' || status.type === 'poison') {
      status.tick = (status.tick || 0) + dt
      while (status.tick >= 0.5) {
        status.tick -= 0.5
        if (fighter.hp > 0 && !state.over) {
          damageRaw(state, status.sourceSide, fighter, (status.amount || 4) * 0.5, { reason: status.type })
          pushFx(state, {
            type: 'dot',
            x: fighter.x,
            z: fighter.z + 50,
            color: status.type === 'burn' ? '#c55832' : status.type === 'poison' ? '#7b8a3c' : '#913f3b',
            life: 0.35,
          })
        }
      }
    }
    if (status.type === 'regen' && fighter.hp > 0) {
      fighter.regenCarry += (status.amount || 2) * dt
      if (fighter.regenCarry >= 2) {
        const amount = Math.floor(fighter.regenCarry)
        fighter.regenCarry -= amount
        healFighter(state, fighter, amount, false)
      }
    }
  }
  if (fighter.passive.regen > 0 && fighter.hp > 0) {
    fighter.regenCarry += fighter.passive.regen * dt
    if (fighter.regenCarry >= 2) {
      const amount = Math.floor(fighter.regenCarry)
      fighter.regenCarry -= amount
      healFighter(state, fighter, amount, false)
    }
  }
  if (fighter.stunUntil > state.t) {
    fighter.state = 'stunned'
    fighter.intent = '僵直'
  }
}

function decide(state, fighter, enemy) {
  if (state.over || fighter.action || fighter.dash || fighter.surrender) return
  if (state.t < fighter.nextDecision) return
  fighter.nextDecision = state.t + 0.1 + state.rng.next() * 0.08
  if (fighter.z > 6) return
  if (fighter.stunUntil > state.t) return
  if (state.t < fighter.gcdUntil) return

  checkSurrender(state, fighter, enemy)

  const choice = chooseAction(state, fighter, enemy)
  if (choice) {
    startAction(state, fighter, enemy, choice.contract, choice.index)
    return
  }

  // 没有可出的招时，维持自己的舒适距离；快贴脸时偶尔跳开。
  const distance = Math.abs(enemy.x - fighter.x)
  const desired = desiredRange(fighter)
  if (distance < desired - 14) fighter.intent = '拉开'
  else if (distance > desired + 14) fighter.intent = '逼近'
  else fighter.intent = state.t < 8 ? '试探' : '游走'
  if (distance < 70 && state.t > fighter.nextJump && state.rng.chance(0.18 * styleOf(fighter).jump)) {
    tryJump(state, fighter)
  }
}

function updateProjectiles(state, dt) {
  for (const projectile of state.projectiles) {
    if (projectile.hit) continue
    projectile.life -= dt
    projectile.x += projectile.vx * dt
    projectile.trail.push({ x: projectile.x, z: projectile.z, life: 0.2 })
    if (projectile.trail.length > 8) projectile.trail.shift()
    const target = state.fighters[otherSide(projectile.owner)]
    if (
      Math.abs(projectile.x - target.x) < 26 + projectile.radius
      && Math.abs(projectile.z - (target.z + BODY_CENTER)) < 46
      && target.hp > 0
    ) {
      const source = state.fighters[projectile.owner]
      const contract = {
        color: projectile.color,
        effects: projectile.effects,
        skill: projectile.skill,
        mechanics: projectile.mechanics || [],
        attack: projectile.attack,
        volatility: projectile.volatility || 0,
      }
      dealDamage(state, source, target, projectile.damage, contract, { isMelee: false })
      if (!state.over) applyHitMechanics(state, source, target, contract)
      projectile.hit = true
      if (projectile.aoeRadius > 0) {
        state.areas.push({
          id: state.nextId++,
          owner: projectile.owner,
          x: projectile.x,
          z: 0,
          radius: projectile.aoeRadius,
          delay: 0.01,
          t: 0,
          damage: projectile.damage * 0.7,
          effects: projectile.effects,
          contract,
          mechanics: projectile.mechanics || [],
          color: projectile.color,
          instant: true,
        })
      }
      pushFx(state, {
        type: 'projectileHit',
        x: projectile.x,
        z: projectile.z,
        color: projectile.color,
        life: 0.3,
      })
      continue
    }
    if (projectile.x < ARENA.left - 40 || projectile.x > ARENA.right + 40 || projectile.life <= 0) {
      if (projectile.aoeRadius > 0 && !projectile.hit) {
        state.areas.push({
          id: state.nextId++,
          owner: projectile.owner,
          x: projectile.x,
          z: 0,
          radius: projectile.aoeRadius,
          delay: 0.01,
          t: 0,
          damage: projectile.damage * 0.6,
          effects: projectile.effects,
          contract: { color: projectile.color, effects: projectile.effects, skill: projectile.skill },
          color: projectile.color,
          instant: true,
        })
      }
      state.fighters[projectile.owner].openingUntil = Math.max(
        state.fighters[projectile.owner].openingUntil,
        state.t + 0.8,
      )
      projectile.hit = true
    }
  }
  state.projectiles = state.projectiles.filter((projectile) => !projectile.hit)
}

function updateAreas(state, dt) {
  for (const area of state.areas) {
    area.t += dt
    if (area.persistent) {
      if (area.t >= area.duration) {
        area.done = true
        continue
      }
      area.tick = (area.tick || 0) + dt
      if (area.tick >= 0.5 && !state.over) {
        area.tick -= 0.5
        const target = state.fighters[otherSide(area.owner)]
        const source = state.fighters[area.owner]
        if (source.hp <= 0) {
          area.done = true
          continue
        }
        if (Math.abs(target.x - area.x) <= area.radius + 12 && target.z < 80) {
          addStatus(state, target, {
            type: 'slow',
            duration: 0.7,
            factor: area.slow || 0.75,
          }, area.owner)
          if (area.tickDamage > 0) {
            dealDamage(state, source, target, area.tickDamage, {
              color: area.color,
              skill: area.contract?.skill || '领域',
              effects: [],
            }, { isMelee: false, canCounter: false })
          }
          pushFx(state, {
            type: 'dot',
            x: target.x,
            z: target.z + 40,
            color: area.color,
            life: 0.35,
          })
        }
      }
      continue
    }
    if (area.t >= area.delay && !area.done) {
      area.done = true
      const target = state.fighters[otherSide(area.owner)]
      const source = state.fighters[area.owner]
      const inside = Math.abs(target.x - area.x) <= area.radius + 20 && target.z < 74
      pushFx(state, {
        type: 'explosion',
        x: area.x,
        z: 0,
        radius: area.radius,
        color: area.color,
        life: 0.55,
      })
      pushFx(state, { type: 'shake', power: 7, life: 0.2 })
      if (inside && !state.over) {
        dealDamage(state, source, target, area.damage, area.contract, { isMelee: false })
        if (!state.over && area.effects?.length) {
          applyEffects(state, source, target, area.effects, { isMelee: false })
        }
        if (!state.over && area.mechanics?.length) {
          applyHitMechanics(state, source, target, { mechanics: area.mechanics })
        }
      } else if (!state.over) {
        source.openingUntil = Math.max(source.openingUntil, state.t + 0.9)
        pushFx(state, { type: 'text', x: area.x, z: 80, text: '落空', color: '#8a867a', life: 0.6 })
      }
    }
  }
  state.areas = state.areas.filter((area) => (
    area.persistent
      ? !area.done
      : !area.done || area.t < area.delay + 0.65
  ))
}

function updateCompanions(state, dt) {
  for (const companion of state.companions) {
    companion.life -= dt
    const owner = state.fighters[companion.side]
    const enemy = state.fighters[otherSide(companion.side)]
    const targetX = owner.x - (enemy.x >= owner.x ? 1 : -1) * 46
    companion.x += (targetX - companion.x) * Math.min(1, dt * 3)
    companion.timer -= dt
    const distance = Math.abs(enemy.x - companion.x)
    if (companion.timer <= 0 && distance <= (companion.contract.summon?.range || 420) && companion.life > 0) {
      companion.timer = companion.interval
      const contract = companion.contract
      state.projectiles.push({
        id: state.nextId++,
        owner: companion.side,
        x: companion.x,
        z: companion.z,
        vx: Math.sign(enemy.x - companion.x) * (contract.summon?.speed || 560),
        damage: contract.damage,
        effects: contract.effects || [],
        radius: 6,
        aoeRadius: 0,
        pierce: false,
        color: contract.color,
        skill: contract.skill,
        attack: contract.attack,
        mechanics: contract.mechanics || [],
        contract,
        life: 1.8,
        hit: false,
        trail: [],
      })
      pushFx(state, {
        type: 'summonShot',
        x: companion.x,
        z: companion.z,
        color: contract.color,
        life: 0.3,
      })
    }
  }
  state.companions = state.companions.filter((companion) => companion.life > 0 && state.fighters[companion.side].hp > 0)
}

function separation(state) {
  const [a, b] = state.fighters
  const delta = b.x - a.x
  if (Math.abs(delta) < MIN_GAP) {
    const push = (MIN_GAP - Math.abs(delta)) / 2
    const dir = Math.sign(delta) || 1
    a.x = clamp(a.x - dir * push, ARENA.left + 26, ARENA.right - 26)
    b.x = clamp(b.x + dir * push, ARENA.left + 26, ARENA.right - 26)
  }
}

function checkSuddenDeath(state) {
  if (!state.suddenDeath && state.t >= 40) {
    state.suddenDeath = true
    pushLog(state, '终局：场地开始收束，双方伤害加深。', 'gold', { event: 'sudden' })
    pushFx(state, { type: 'sudden', life: 1.4 })
  }
  if (!state.arbitration && state.t >= 58) {
    const [a, b] = state.fighters
    const ratioA = a.hp / a.maxHp
    const ratioB = b.hp / b.maxHp
    if (Math.abs(ratioA - ratioB) < 0.07) {
      triggerArbitration(state)
    } else if (!state.judged) {
      state.judged = true
      const winner = ratioA > ratioB ? 0 : 1
      pushLog(state, `终局判定：${state.fighters[winner].name} 占据上风。`, 'gold', { event: 'judge' })
    }
  }
  if (state.t >= 72 && !state.over) {
    const [a, b] = state.fighters
    const ratioA = a.hp / a.maxHp
    const ratioB = b.hp / b.maxHp
    let winnerSide
    if (Math.abs(ratioA - ratioB) < 0.02) {
      winnerSide = state.arbitration?.side ?? (a.novelty >= b.novelty ? 0 : 1)
    } else {
      winnerSide = ratioA > ratioB ? 0 : 1
    }
    pushLog(state, '时间到，按残余生命判定。', 'gold', { event: 'timeout' })
    endBattle(state, winnerSide, 'timeout')
  }
}

function triggerArbitration(state) {
  const [a, b] = state.fighters
  let side = a.novelty === b.novelty ? (state.rng.chance(0.5) ? 0 : 1) : a.novelty > b.novelty ? 0 : 1
  if (state.arbitrationChoice === 0 || state.arbitrationChoice === 1) side = state.arbitrationChoice
  const fighter = state.fighters[side]
  state.arbitration = { side, novelty: fighter.novelty, t: state.t }
  addStatus(state, fighter, { type: 'inspiration', duration: 10, damage: 1.2, speed: 1.12 }, side)
  fighter.shield += Math.round(fighter.maxHp * 0.06)
  fighter.shieldUntil = state.t + 8
  pushLog(state, `平局逼近。想象力仲裁把「灵光」给了 ${fighter.name}。`, 'gold', {
    event: 'arbitration',
    side,
  })
  pushFx(state, { type: 'arbitration', side, x: fighter.x, z: 0, life: 1.6 })
}

function endBattle(state, winnerSide, reason) {
  if (state.over) return
  state.over = true
  const [a, b] = state.fighters
  const winner = winnerSide === 0 ? 'player' : winnerSide === 1 ? 'opponent' : 'draw'
  state.result = {
    winnerSide,
    winner,
    reason,
    seed: state.seed,
    duration: round1(state.t),
    hp: [Math.max(0, Math.ceil(a.hp)), Math.max(0, Math.ceil(b.hp))],
    maxHp: [a.maxHp, b.maxHp],
    damage: [Math.round(a.damageDealt), Math.round(b.damageDealt)],
    skills: [a.skillsUsed, b.skillsUsed],
    arbitration: state.arbitration,
  }
  if (reason === 'ko') {
    const loser = state.fighters[winnerSide === 0 ? 1 : 0]
    loser.state = 'ko'
    loser.intent = '倒地'
    pushFx(state, { type: 'ko', side: loser.side, x: loser.x, z: loser.z, life: 1.4 })
    pushLog(state, `${loser.name} 倒下了。${state.fighters[winnerSide].name} 留在场上。`, 'gold', { event: 'end' })
  } else if (reason === 'surrender') {
    pushLog(state, '认输生效，斗兽场关门。', 'muted', { event: 'end' })
  } else {
    pushLog(state, `${state.fighters[winnerSide]?.name || '无人'} 被判定为胜者。`, 'gold', { event: 'end' })
  }
  for (const fighter of state.fighters) {
    fighter.action = null
    fighter.dash = null
  }
}

export function createBattle({ player, opponent, seed } = {}) {
  const seedValue = hashString(
    `cricket|${player?.words?.join('|') || ''}|${opponent?.id || opponent?.name || ''}|${Number.isFinite(seed) ? seed : 0}`,
  )
  const state = {
    t: 0,
    seed: seedValue,
    rng: makeRng(seedValue),
    fighters: [],
    projectiles: [],
    areas: [],
    companions: [],
    echoes: [],
    fx: [],
    log: [],
    nextId: 1,
    over: false,
    result: null,
    suddenDeath: false,
    arbitration: null,
    arbitrationChoice: null,
    damageScale: 1,
  }
  const p = createFighter(state, 0, { ...player, isPlayer: true })
  const o = createFighter(state, 1, { ...opponent, isPlayer: false })
  state.fighters = [p, o]
  pushLog(state, `${p.name} 与 ${o.name} 入场。`, 'muted', { event: 'start' })
  pushLog(state, '两个小人会自行判断移动、出招与认输。', 'muted', { event: 'auto' })
  return {
    state,
    step(dt) {
      const clamped = Math.min(0.05, Math.max(0, dt || 0))
      if (state.over) {
        state.t += clamped
        return state
      }
      state.t += clamped
      if (state.t >= 40) state.damageScale = 1.35
      checkSuddenDeath(state)
      for (const fighter of state.fighters) {
        fighter.stateTime += clamped
        fighter.flash = Math.max(0, fighter.flash - clamped)
        for (let i = 0; i < fighter.cooldowns.length; i += 1) {
          fighter.cooldowns[i] = Math.max(0, fighter.cooldowns[i] - clamped)
        }
        fighter.basicCd = Math.max(0, fighter.basicCd - clamped)
        updateStatuses(state, fighter, clamped)
        if (fighter.stunUntil > state.t) {
          cancelAction(state, fighter)
        }
      }
      for (const fighter of state.fighters) {
        const enemy = state.fighters[otherSide(fighter.side)]
        if (fighter.hp <= 0) continue
        if (fighter.stunUntil > state.t) {
          fighter.state = 'stunned'
          fighter.intent = '僵直'
          continue
        }
        if (fighter.sleepUntil > state.t) {
          if (fighter.action) cancelAction(state, fighter)
          fighter.state = 'sleep'
          fighter.intent = '睡着'
          continue
        }
        if (fighter.dash) {
          updateDash(state, fighter, enemy, clamped)
          continue
        }
        if (fighter.action) {
          updateAction(state, fighter, enemy, clamped)
        }
        if (!fighter.action && !fighter.dash) {
          decide(state, fighter, enemy)
        }
        moveFighter(state, fighter, enemy, clamped)
        if (state.over) break
      }
      updateProjectiles(state, clamped)
      updateEchoes(state, clamped)
      updateAreas(state, clamped)
      updateCompanions(state, clamped)
      separation(state)
      for (const fighter of state.fighters) {
        fighter.facing = enemyFacing(state, fighter)
      }
      return state
    },
    drainFx() {
      const list = state.fx
      state.fx = []
      return list
    },
    hud() {
      return buildHud(state)
    },
    forceEnd(side, reason = 'timeout') {
      endBattle(state, side, reason)
    },
    setArbitrationChoice(side) {
      state.arbitrationChoice = side
    },
  }
}

function enemyFacing(state, fighter) {
  const enemy = state.fighters[otherSide(fighter.side)]
  if (!enemy || fighter.action || fighter.dash) return fighter.facing
  return enemy.x >= fighter.x ? 1 : -1
}

export function battleHud(state) {
  return buildHud(state)
}

export function buildHud(state) {
  return {
    t: round1(state.t),
    over: state.over,
    result: state.result,
    suddenDeath: state.suddenDeath,
    arbitration: state.arbitration,
    projectiles: state.projectiles.length,
    fighters: state.fighters.map((fighter) => ({
      side: fighter.side,
      name: fighter.name,
      persona: fighter.persona,
      personaLabel: fighter.personaLabel,
      hp: Math.max(0, Math.ceil(fighter.hp)),
      maxHp: fighter.maxHp,
      hpRatio: clamp(fighter.hp / fighter.maxHp, 0, 1),
      shield: Math.max(0, Math.ceil(fighter.shield)),
      statuses: [
        ...activeStatuses(fighter, state.t).map((status) => ({
          type: status.type,
          label: statusLabel(status.type),
          remain: Math.max(0, round1(status.until - state.t)),
        })),
        ...(fighter.marks.length
          ? [{
            type: 'mark',
            label: `刻印×${fighter.marks.reduce((sum, mark) => sum + mark.stacks, 0)}`,
            remain: Math.max(...fighter.marks.map((mark) => round1(mark.until - state.t))),
          }]
          : []),
        ...(fighter.absoluteUntil > state.t
          ? [{ type: 'absolute', label: '绝对', remain: round1(fighter.absoluteUntil - state.t) }]
          : []),
        ...(fighter.breakUntil > state.t
          ? [{ type: 'break', label: '破绽', remain: round1(fighter.breakUntil - state.t) }]
          : []),
        ...(fighter.counterUntil > state.t && fighter.counterCharges > 0
          ? [{ type: 'counter', label: '反击', remain: round1(fighter.counterUntil - state.t) }]
          : []),
        ...(fighter.chargeStacks > 0
          ? [{ type: 'charge', label: '蓄势', remain: round1(Math.max(0, fighter.chargeUntil - state.t)) }]
          : []),
        ...(Object.keys(fighter.sealed).length
          ? [{ type: 'seal', label: `封招×${Object.keys(fighter.sealed).length}`, remain: round1(Math.max(...Object.values(fighter.sealed)) - state.t) }]
          : []),
        ...(fighter.antiAbsoluteCharges > 0
          ? [{ type: 'antiAbsolute', label: `反绝对×${fighter.antiAbsoluteCharges}`, remain: 0 }]
          : []),
        ...(fighter.tauntUntil > state.t
          ? [{ type: 'taunt', label: '被点名', remain: round1(fighter.tauntUntil - state.t) }]
          : []),
        ...(fighter.fearUntil > state.t
          ? [{ type: 'fear', label: '畏惧', remain: round1(fighter.fearUntil - state.t) }]
          : []),
        ...(fighter.sleepUntil > state.t
          ? [{ type: 'sleep', label: '睡着', remain: round1(fighter.sleepUntil - state.t) }]
          : []),
        ...(fighter.silencedUntil > state.t
          ? [{ type: 'silence', label: '封麦', remain: round1(fighter.silencedUntil - state.t) }]
          : []),
        ...(fighter.reflectUntil > state.t && fighter.reflectCharges > 0
          ? [{ type: 'reflect', label: '镜返', remain: round1(fighter.reflectUntil - state.t) }]
          : []),
        ...(fighter.stunUntil > state.t
          ? [{ type: 'stun', label: '僵直', remain: round1(fighter.stunUntil - state.t) }]
          : []),
      ],
      mechanics: fighter.contracts.flatMap((contract) => (contract.mechanics || []).map((mechanic) => mechanic.name)),
      intent: fighter.intent,
      state: fighter.state,
      cooldowns: fighter.cooldowns.map((value) => Math.max(0, round1(value))),
      damageDealt: Math.round(fighter.damageDealt),
      skillsUsed: fighter.skillsUsed,
      hits: fighter.hits,
      novelty: round1(fighter.novelty),
      z: round1(fighter.z),
      x: Math.round(fighter.x),
    })),
    log: state.log.slice(-24),
  }
}
