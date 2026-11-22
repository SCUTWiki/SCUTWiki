import {
  ATTACK_LABELS,
  BROAD_CONCEPTS,
  CAMPUS_WORDS,
  ELEMENTS,
  ELEMENT_KEYS,
  FORMS,
  detectAttack,
  detectElement,
  detectForm,
  hasAttackWord,
} from './lexicon.js'
import { KeywordError, canonicalize, rawToCompact, validateWord, wordLength } from './text.js'
import { clamp, hashString, makeRng, round1 } from './hash.js'
import { analyzeNewWord } from './recognition.js'

const ATTACK_BASE = {
  melee: { rangeMin: 46, rangeMax: 104, cd: 2.5, windup: 0.22, dps: 14.5, speed: 0 },
  projectile: { rangeMin: 300, rangeMax: 470, cd: 3.0, windup: 0.28, dps: 10.2, speed: 610 },
  beam: { rangeMin: 300, rangeMax: 500, cd: 3.6, windup: 0.4, dps: 11.8, speed: 0 },
  aoe: { rangeMin: 260, rangeMax: 440, cd: 4.5, windup: 0.5, dps: 9.4, radius: 92 },
  dash: { rangeMin: 170, rangeMax: 300, cd: 3.4, windup: 0.18, dps: 9.5, speed: 0 },
  self: { rangeMin: 0, rangeMax: 0, cd: 6.8, windup: 0.24, dps: 0, speed: 0 },
  summon: { rangeMin: 280, rangeMax: 450, cd: 8.6, windup: 0.46, dps: 8.6, speed: 540 },
}

const EFFECT_TAGS = {
  burn: '灼烧',
  bleed: '流血',
  poison: '中毒',
  slow: '迟滞',
  stun: '震僵',
  knockback: '击退',
  lifesteal: '汲取',
  heal: '回复',
  shield: '护盾',
  haste: '疾行',
  regen: '生息',
  thorns: '反伤',
  focus: '凝神',
  weaken: '削弱',
  sunder: '破甲',
  vulnerable: '易伤',
  pull: '牵引',
}

const RARE_ELEMENTS = new Set(['time', 'space', 'mind', 'machine', 'sound', 'arcane', 'blood'])

const MAGIC_WORDS = /法术|魔法|术|咒|符|阵|杖|珠|镜|印|铃|琴|笛|扇|符箓|玄|秘|奥/
const HEAVY_WORDS = /巨|重|大|山|岳|锤|崩|钝|沉|铁|岩|轰|猛|狂/
const SWIFT_WORDS = /疾|快|迅|轻|风|闪|掠|飞|燕|影|瞬|速/
const MULTI_WORDS = /连|多|双|三|千|万|百|分|裂|碎|乱|群/
const PIERCE_WORDS = /穿|贯|透|破|长|远|射|狙/
const EXPLODE_WORDS = /爆|炸|裂|轰|陨|焚|燃|灼|雷|震|崩/
const ARMOR_WORDS = /甲|盾|壁|护|御|守|铁|钢|岩|山|壳|铠|宿|锁/
const LIFESTEAL_WORDS = /血|噬|吸|饮|汲|暗|影|邪|祭/
const THORN_WORDS = /刺|棘|针|反|荆/
const FOCUS_WORDS = /眼|心|念|静|定|识|观|凝|聚|悟/
const HEAL_WORDS = /治|疗|愈|春|生|泉|露|光|辉|圣|药|回|续命|咖啡/
const HASTE_WORDS = /疾|快|速|风|轻|闪|跃|步|奔|狂|咖啡|熬夜/
const SHIELD_WORDS = /盾|壁|甲|护|御|守|壳|铁|钢|岩|山|宿|锁|不动|扎根/
const BURN_WORDS = /火|炎|焰|焚|燃|灼|熔|炉|烬|阳|赤|朱|丹|彤/
const SLOW_WORDS = /冰|霜|寒|冻|雪|凝|滞|泥|沼|缠|藤|锁|阱|重/
const POISON_WORDS = /毒|腐|疫|瘟|蚀|瘴/
const STUN_WORDS = /雷|电|霆|麻|震|晕|钟|鸣|吼|惊|口令|断网/
const WEAKEN_WORDS = /弱|衰|锈|疲|困|乏|迷|梦|幻|诅|挂科/
const VULNERABLE_WORDS = /奥|秘|星|晶|砂|虚|空|裂|隙/

// 机制词根：不是“再加一个状态”，而是换一种打法。
const ANTI_ABSOLUTE_WORDS = /反绝对|破绝对|反无敌|破无敌|逆反|反制|否定|归零|无效|解构|破法|以彼之道|解咒|破妄/
const MARK_WORDS = /印|刻|记|符|咒|契|名|签|烙印|标记/
const ECHO_WORDS = /回|响|余|复|再|重|回声|残响|绕梁/
const ZONE_WORDS = /阵|域|场|池|界|林|雨|雾|云|海|花海|焦土/
const COUNTER_WORDS = /反|架|势|守|镜|逆|借|还|报/
const SWAP_WORDS = /换|移|折|跃|门|隙|镜/
const SEAL_WORDS = /禁|封|锁|哑|噤|闭|默/
const CHAIN_WORDS = /链|牵|引|拉|缚|捆|锁/
const CHARGE_WORDS = /蓄|聚|凝|藏|势|酿/
const EXECUTE_WORDS = /斩|杀|决|断|终|灭/
const LIGHT_WORDS = /轻|细|小|微|羽|风|影|雨|针|丝|闪|快|流|雪|烟|雾|纸|线|点/
const WILD_WORDS = /赌|乱|狂|疯|炸|核|陨|终|灭|[?！？]/
const TAUNT_WORDS = /嘲|讽|挑衅|嘴|骂|吼|喊|点名|排队|食堂|阿姨|说书|醒木|社交|吹|夸|牛|逼/
const FEAR_WORDS = /恐|惧|吓|鬼|阴|夜|挂科|早八|考试|压|迫|凶|军训|教官|处分|点名/
const SLEEP_WORDS = /睡|困|眠|梦|昏迷|晕|倒|躺|午觉|熬夜|醒/
const SHRINK_WORDS = /小|微|缩|袖珍|细|短|矮|蚁|针|尘|迷你/
const INFLATE_WORDS = /大|巨|膨|胀|胖|肥|吹大|膨胀|巨型|巨大|吨|气球/
const STEAL_WORDS = /偷|抢|借|拿|夺|摸|顺手|外卖|快递|钱|金|钞|饭/
const CLEANSE_WORDS = /净|洗|清|解|醒|愈|药|泉|露|沐|拂/
const GAMBLE_WORDS = /赌|运气|随机|抽|骰|概率|彩票|抽卡|盲盒|梭哈|玄学/
const ROOT_WORDS = /缠|藤|根|钉|锁|定|胶|粘|桩|扎根|陷阱|缚/
const SILENCE_WORDS = /禁|封|哑|默|静|噤|闭|图书馆|考场|消音/
const CLONE_WORDS = /分身|影分身|复制|镜像|克隆|替身|人偶|傀儡|镜/
const REFLECT_WORDS = /反射|镜|回弹|弹反|折返/

const MECHANIC_TYPES = [
  'mark', 'echo', 'counter', 'zone', 'swap', 'seal', 'chain', 'charge', 'execute', 'absolute', 'antiAbsolute',
  'taunt', 'fear', 'sleep', 'shrink', 'inflate', 'steal', 'cleanse', 'gamble', 'root', 'silence', 'clone', 'reflect',
]

// 少数一眼就知道该怎么打的词，直接给专属机制，避免落到随机兜底。
const MECHANIC_RECIPES = {
  青锋: ['mark'],
  疾风: ['echo'],
  荆棘: ['root', 'counter'],
  影步: ['swap', 'echo'],
  雷引: ['chain'],
  静心: ['cleanse', 'charge'],
  镜面: ['reflect', 'clone'],
  时滞: ['zone', 'root'],
  食堂: ['steal', 'taunt'],
  校园网: ['silence', 'root'],
  早八: ['sleep', 'fear'],
  体测: ['gamble', 'charge'],
  绩点: ['fear', 'execute'],
  狼群: ['clone'],
  陷阱: ['root', 'zone'],
  猎弓: ['mark'],
  铁壁: ['reflect'],
  回春: ['cleanse'],
  熔炉: ['zone'],
  过载: ['charge'],
  暴雨: ['echo', 'zone'],
  阴影: ['clone', 'swap'],
  醒木: ['taunt', 'seal'],
  折扇: ['reflect', 'echo'],
  挂科: ['fear', 'execute'],
  军训: ['fear', 'root'],
  食堂阿姨: ['steal', 'taunt'],
  抽卡: ['gamble'],
  摸鱼: ['sleep', 'cleanse'],
  翘课: ['swap', 'echo'],
  熬夜: ['sleep', 'shrink'],
  图书馆: ['silence', 'zone'],
  崩山: ['execute', 'mark'],
  山崩: ['execute', 'zone'],
  核爆: ['gamble', 'zone'],
  风刃: ['echo'],
  细雨: ['zone', 'cleanse'],
  故事: ['taunt', 'echo'],
  回响: ['echo'],
  焦土: ['zone'],
  雷池: ['zone'],
  针: ['shrink'],
}

const ARMOR_GEAR = /甲|衣|袍|披风|盔|冠|靴|盾|壁|壳/
const RELIC_GEAR = /戒|镯|符|铃|印|珠|镜|心|晶|砂|卷|简|符箓/

function hashPick(list, seedText) {
  return list[hashString(seedText) % list.length]
}

function pushEffect(list, effect) {
  if (!effect || !effect.type) return
  const existing = list.find((item) => item.type === effect.type)
  if (!existing) {
    list.push(effect)
    return
  }
  // 同一效果叠加时取更强的那一个，避免一条词条塞进无限层数。
  for (const key of ['amount', 'power', 'ratio', 'factor', 'duration', 'chance', 'crit']) {
    if (typeof effect[key] === 'number') {
      if (key === 'factor' && effect.type === 'weaken') {
        existing[key] = Math.min(existing[key] ?? 1, effect[key])
      } else if (key === 'factor' && effect.type === 'slow') {
        existing[key] = Math.min(existing[key] ?? 1, effect[key])
      } else {
        existing[key] = Math.max(existing[key] ?? 0, effect[key])
      }
    }
  }
}

function detectBroad(compact, canonical) {
  return BROAD_CONCEPTS[compact] || BROAD_CONCEPTS[canonical] || null
}

export function isBroadWord(input) {
  const compact = rawToCompact(input)
  return Boolean(detectBroad(compact, canonicalize(input)))
}

function defaultElement(seed, locked) {
  if (locked) return locked.element || 'arcane'
  return ELEMENT_KEYS[hashString(seed) % ELEMENT_KEYS.length]
}

function defaultForm(seed, attack, element, locked) {
  if (locked?.form) return locked.form
  const detected = detectForm(seed)
  if (detected) return detected
  if (attack === 'self') return hashPick(['none', 'shield', 'orb'], seed)
  if (attack === 'summon') return 'none'
  if (attack === 'dash') return 'none'
  if (attack === 'melee') return hashPick(['sword', 'gauntlet', 'claws', 'spear'], seed)
  if (element === 'steel' || element === 'blood') return hashPick(['dagger', 'sword'], seed)
  return hashPick(['staff', 'orb', 'fan', 'bow'], seed)
}

function fallbackAttack(seed) {
  const pool = ['projectile', 'projectile', 'melee', 'aoe', 'beam', 'dash', 'self', 'projectile', 'melee', 'aoe']
  return pool[hashString(seed) % pool.length]
}

function baseEffectsFor(attack, element, text, rng, damage, locked) {
  const effects = []
  const elementInfo = ELEMENTS[element]
  if (attack === 'self') {
    const wantsShield = SHIELD_WORDS.test(text) || ['steel', 'earth'].includes(element)
    const wantsHeal = HEAL_WORDS.test(text)
      || element === 'light'
      || (element === 'nature' && /春|生|芽|花|叶|藤|泉|露/.test(text))
    const wantsHaste = HASTE_WORDS.test(text) || ['wind', 'time'].includes(element)
    const wantsFocus = FOCUS_WORDS.test(text) || element === 'mind'
    const wantsThorns = THORN_WORDS.test(text)
    if (wantsHeal) pushEffect(effects, { type: 'heal', amount: Math.round(88 + rng.next() * 38) })
    if (wantsShield) {
      pushEffect(effects, {
        type: 'shield',
        amount: Math.round(82 + rng.next() * 34),
        duration: 7,
      })
    }
    if (wantsHaste) pushEffect(effects, { type: 'haste', factor: 1.35, duration: 4 })
    if (wantsFocus) pushEffect(effects, { type: 'focus', duration: 5, crit: 0.28, damage: 1.22 })
    if (wantsThorns) pushEffect(effects, { type: 'thorns', ratio: 0.2, duration: 6 })
    if (!effects.length) {
      if (rng.chance(0.5)) pushEffect(effects, { type: 'heal', amount: Math.round(82 + rng.next() * 32) })
      else pushEffect(effects, { type: 'shield', amount: Math.round(78 + rng.next() * 30), duration: 7 })
    }
    if (element === 'poison') pushEffect(effects, { type: 'regen', amount: 3, duration: 5 })
    return effects
  }

  if (element === 'fire' || BURN_WORDS.test(text)) {
    pushEffect(effects, { type: 'burn', duration: 3, amount: round1(Math.max(4, damage * 0.1)) })
  }
  if (element === 'ice' || (SLOW_WORDS.test(text) && !BURN_WORDS.test(text))) {
    pushEffect(effects, { type: 'slow', duration: 2.2, factor: 0.68 })
  }
  if (element === 'lightning') {
    pushEffect(effects, { type: 'stun', duration: 0.42, chance: 0.22 })
  }
  if (element === 'poison') {
    pushEffect(effects, { type: 'poison', duration: 4, amount: round1(Math.max(3, damage * 0.075)) })
  }
  if (element === 'blood' || element === 'shadow' || LIFESTEAL_WORDS.test(text)) {
    pushEffect(effects, { type: 'lifesteal', ratio: element === 'blood' ? 0.2 : 0.14 })
  }
  if (element === 'steel') {
    pushEffect(effects, { type: 'bleed', duration: 3, amount: round1(Math.max(3, damage * 0.07)) })
  }
  if (element === 'nature') {
    pushEffect(effects, { type: 'regen', amount: 1.6, duration: 4 })
  }
  if (element === 'water') {
    pushEffect(effects, { type: 'slow', duration: 1.8, factor: 0.74 })
  }
  if (element === 'light') {
    pushEffect(effects, { type: 'heal', amount: Math.round(Math.max(12, damage * 0.18)) })
  }
  if (element === 'sound') {
    pushEffect(effects, { type: 'stun', duration: 0.38, chance: 0.2 })
  }
  if (element === 'mind') {
    pushEffect(effects, { type: 'weaken', duration: 3, factor: 0.8 })
  }
  if (element === 'time') {
    pushEffect(effects, { type: 'slow', duration: 1.6, factor: 0.6 })
  }
  if (element === 'space') {
    pushEffect(effects, { type: 'pull', power: 54 })
  }
  if (element === 'earth') {
    pushEffect(effects, { type: 'knockback', power: 42 })
    pushEffect(effects, { type: 'stun', duration: 0.2, chance: 0.14 })
  }
  if (element === 'machine') {
    pushEffect(effects, { type: 'sunder', duration: 4, amount: 0.1 })
  }
  if (element === 'arcane') {
    pushEffect(effects, { type: 'vulnerable', duration: 3, amount: 0.14 })
  }
  if (element === 'wind') {
    pushEffect(effects, { type: 'knockback', power: 34 })
  }

  // 文字里额外的方向只补一到两种，避免五词堆成效果表。
  if (STUN_WORDS.test(text) && !effects.some((e) => e.type === 'stun')) {
    pushEffect(effects, { type: 'stun', duration: 0.38, chance: 0.18 })
  }
  if (THORN_WORDS.test(text)) {
    pushEffect(effects, { type: 'thorns', ratio: 0.12, duration: 4 })
  }
  if (FOCUS_WORDS.test(text)) {
    pushEffect(effects, { type: 'focus', duration: 3.4, crit: 0.15 })
  }
  if (WEAKEN_WORDS.test(text) && !effects.some((e) => e.type === 'weaken')) {
    pushEffect(effects, { type: 'weaken', duration: 2.6, factor: 0.84 })
  }
  if (VULNERABLE_WORDS.test(text) && element !== 'arcane') {
    pushEffect(effects, { type: 'vulnerable', duration: 2.6, amount: 0.1 })
  }

  return effects.slice(0, 3)
}

function computePassive(element, text, rng) {
  const passive = {
    moveSpeed: 1,
    armor: 0,
    lifesteal: 0,
    thorns: 0,
    crit: 0,
    regen: 0,
  }
  if (['steel', 'earth', 'machine'].includes(element)) passive.armor += 0.025 + rng.next() * 0.015
  if (element === 'wind') passive.moveSpeed += 0.045
  if (element === 'time') passive.moveSpeed += 0.03
  if (['blood', 'shadow'].includes(element)) passive.lifesteal += 0.035
  if (['nature', 'light'].includes(element)) passive.regen += 0.55
  if (['sound', 'mind'].includes(element)) passive.crit += 0.018
  if (HEAVY_WORDS.test(text)) {
    passive.moveSpeed -= 0.025
    passive.armor += 0.015
  }
  if (SWIFT_WORDS.test(text)) passive.moveSpeed += 0.035
  if (ARMOR_WORDS.test(text)) passive.armor += 0.03
  if (LIFESTEAL_WORDS.test(text)) passive.lifesteal += 0.03
  if (THORN_WORDS.test(text)) passive.thorns += 0.03
  if (FOCUS_WORDS.test(text)) passive.crit += 0.03
  if (HEAL_WORDS.test(text)) passive.regen += 0.5
  return passive
}

function effectDescription(effects) {
  if (!effects.length) return '造成一次干净利落的伤害'
  const bits = effects.map((effect) => {
    switch (effect.type) {
      case 'burn':
        return `附加 ${effect.duration} 秒灼烧`
      case 'bleed':
        return `造成 ${effect.duration} 秒流血`
      case 'poison':
        return `施加 ${effect.duration} 秒中毒`
      case 'slow':
        return `使目标迟滞 ${effect.duration} 秒`
      case 'stun':
        return `${Math.round((effect.chance ?? 1) * 100)}% 概率震僵 ${effect.duration} 秒`
      case 'knockback':
        return '将目标击退'
      case 'pull':
        return '将目标牵引'
      case 'lifesteal':
        return `汲取 ${Math.round(effect.ratio * 100)}% 伤害`
      case 'heal':
        return `回复 ${Math.round(effect.amount)} 生命`
      case 'shield':
        return `架起 ${Math.round(effect.amount)} 点护盾`
      case 'haste':
        return '短暂加速'
      case 'regen':
        return `获得 ${effect.duration} 秒生息`
      case 'thorns':
        return '反弹近身伤害'
      case 'focus':
        return `凝神 ${effect.duration} 秒`
      case 'weaken':
        return '削弱目标攻势'
      case 'sunder':
        return '削减目标护甲'
      case 'vulnerable':
        return '使目标易伤'
      default:
        return '留下余韵'
    }
  })
  return bits.slice(0, 3).join('，')
}

function mechanicName(type) {
  return {
    mark: '刻印', echo: '残响', counter: '反击架势', zone: '留场领域', swap: '换位',
    seal: '封招', chain: '牵引', charge: '蓄势', execute: '斩杀', absolute: '绝对',
    antiAbsolute: '反绝对', taunt: '点名', fear: '吓退', sleep: '催眠', shrink: '缩小',
    inflate: '膨胀', steal: '顺手牵羊', cleanse: '净手', gamble: '梭哈', root: '定身',
    silence: '封麦', clone: '分身', reflect: '镜返',
  }[type] || type
}

function makeMark(rng) {
  return {
    type: 'mark',
    name: '刻印',
    desc: '命中刻下印记；下一次命中引爆，追加伤害。',
    stacks: 1 + (rng.chance(0.35) ? 1 : 0),
    duration: 5 + rng.next() * 2,
    bonus: 0.3 + rng.next() * 0.15,
  }
}

function makeEcho(rng) {
  return {
    type: 'echo',
    name: '残响',
    desc: '施放后短暂延迟，在原地再响一次。',
    delay: 0.65 + rng.next() * 0.3,
    ratio: 0.28 + rng.next() * 0.14,
  }
}

function makeCounter(rng) {
  return {
    type: 'counter',
    name: '反击架势',
    desc: '摆出架势；短时间内受击则反打。',
    duration: 1.8 + rng.next() * 0.7,
    ratio: 0.4 + rng.next() * 0.2,
    charges: 1,
  }
}

function makeZone(rng, element) {
  return {
    type: 'zone',
    name: '留场领域',
    desc: '留下一片持续领域，迟滞并侵蚀进入的对手。',
    duration: 3.4 + rng.next() * 1.4,
    radius: 74 + rng.next() * 38,
    slow: 0.68 + rng.next() * 0.12,
    tickDamage: 2.5 + rng.next() * 3,
    color: ELEMENTS[element]?.color || '#7d6fa8',
  }
}

function makeSwap(rng) {
  return {
    type: 'swap',
    name: '换位',
    desc: '与对手交换位置，并让它短暂失衡。',
    stun: 0.25 + rng.next() * 0.2,
  }
}

function makeSeal(rng) {
  return {
    type: 'seal',
    name: '封招',
    desc: '封住对手随机一个招式，短时间无法使用。',
    duration: 2.6 + rng.next() * 1.2,
  }
}

function makeChain(rng, element) {
  return {
    type: 'chain',
    name: '牵引',
    desc: '把对手拉近，并附上一瞬迟滞。',
    distance: 54 + rng.next() * 38,
    slow: 0.8,
    color: ELEMENTS[element]?.color || '#6f7fa4',
  }
}

function makeCharge(rng) {
  return {
    type: 'charge',
    name: '蓄势',
    desc: '把下一击的势能蓄起来。',
    bonus: 0.32 + rng.next() * 0.16,
    duration: 5.5,
  }
}

function makeExecute(rng) {
  return {
    type: 'execute',
    name: '斩杀',
    desc: '目标生命越低，这一击越重。',
    threshold: 0.22 + rng.next() * 0.08,
    bonus: 0.5 + rng.next() * 0.3,
  }
}

function makeAbsolute(term, rng) {
  const text = String(term || '')
  let mode = 'inevitable'
  if (/不死|永生/.test(text)) mode = 'undying'
  else if (/无敌|免疫|不败/.test(text)) mode = 'invulnerable'
  else if (/秒杀|必杀|一击必杀|瞬间获胜|直接胜利/.test(text)) mode = 'execute'
  else if (/无限|无穷|全能|全知/.test(text)) mode = 'overload'
  const names = {
    invulnerable: '绝对·不坏', undying: '绝对·不死', execute: '绝对·斩杀',
    overload: '绝对·无限', inevitable: '绝对·必中',
  }
  const descriptions = {
    invulnerable: '绝对成立：短暂不受伤害，结束后露出破绽。',
    undying: '绝对成立：致命伤被压到最后一口气，结束后露出破绽。',
    execute: '绝对成立：对残血目标执行斩杀，结束后露出破绽。',
    overload: '绝对成立：短时间内伤害与速度暴涨，结束后露出破绽。',
    inevitable: '绝对成立：下一击必中且更重，结束后露出破绽。',
  }
  return {
    type: 'absolute',
    mode,
    name: names[mode],
    desc: descriptions[mode],
    duration: mode === 'execute' ? 1.4 : 1 + rng.next() * 0.35,
    breakDuration: 2 + rng.next() * 0.8,
    breakAmp: 0.3 + rng.next() * 0.12,
    damageMul: 1.25 + rng.next() * 0.15,
    threshold: mode === 'execute' ? 0.24 + rng.next() * 0.06 : 0,
  }
}

function makeAntiAbsolute(rng) {
  return {
    type: 'antiAbsolute',
    name: '反绝对',
    desc: '抵消一次绝对机制，并把它的余势转成自己的逆反。',
    charges: 1,
    duration: 8,
    reflect: 0.35 + rng.next() * 0.15,
  }
}

function hasMechanicRecipe(compact) {
  const collapsed = String(compact || '').replace(/(.)\1+/g, '$1')
  return Boolean(MECHANIC_RECIPES[compact] || MECHANIC_RECIPES[collapsed])
}

function makeTaunt(rng) {
  return {
    type: 'taunt',
    name: '点名',
    desc: '点名对手，强迫它靠近并先打你。',
    duration: 1.3 + rng.next() * 0.6,
  }
}

function makeFear(rng) {
  return {
    type: 'fear',
    name: '吓破胆',
    desc: '让对手短暂后退，不敢贴脸。',
    duration: 1.5 + rng.next() * 0.7,
  }
}

function makeSleep(rng) {
  return {
    type: 'sleep',
    name: '催眠',
    desc: '让对手睡着；受到伤害会惊醒。',
    duration: 1.2 + rng.next() * 0.6,
  }
}

function makeShrink(rng) {
  return {
    type: 'shrink',
    name: '缩小',
    desc: '把对手缩小，攻势变轻。',
    duration: 2.4 + rng.next() * 1.2,
    factor: 0.58 + rng.next() * 0.16,
  }
}

function makeInflate(rng) {
  return {
    type: 'inflate',
    name: '膨胀',
    desc: '把对手吹大，变慢也更容易吃伤害。',
    duration: 2.4 + rng.next() * 1.2,
    speed: 0.72 + rng.next() * 0.12,
    damageTaken: 0.12 + rng.next() * 0.1,
  }
}

function makeSteal(rng) {
  return {
    type: 'steal',
    name: '顺手牵羊',
    desc: '抢走对手的护盾或一个正面状态。',
    amount: 36 + rng.next() * 34,
  }
}

function makeCleanse(rng) {
  return {
    type: 'cleanse',
    name: '净手',
    desc: '洗掉自身负面状态，并回一点血。',
    heal: 28 + rng.next() * 28,
  }
}

function makeGamble(rng) {
  return {
    type: 'gamble',
    name: '梭哈',
    desc: '这一击的伤害全看运气，可能很轻也可能很重。',
    low: 0.25 + rng.next() * 0.2,
    high: 1.9 + rng.next() * 0.9,
    selfDamage: 4 + rng.next() * 8,
  }
}

function makeRoot(rng) {
  return {
    type: 'root',
    name: '定身',
    desc: '把对手钉在原地一小会儿。',
    duration: 1.1 + rng.next() * 0.6,
  }
}

function makeSilence(rng) {
  return {
    type: 'silence',
    name: '封麦',
    desc: '暂时封住对手所有招式，只能赤手。',
    duration: 1.3 + rng.next() * 0.7,
  }
}

function makeClone(rng) {
  return {
    type: 'clone',
    name: '分身',
    desc: '留下一个会替你出手的分身。',
    duration: 4.5 + rng.next() * 1.5,
    interval: 1.3 + rng.next() * 0.5,
    ratio: 0.3 + rng.next() * 0.14,
  }
}

function makeReflect(rng) {
  return {
    type: 'reflect',
    name: '镜返',
    desc: '架起镜面，短时间反射接下来的伤害。',
    duration: 1.6 + rng.next() * 0.8,
    ratio: 0.35 + rng.next() * 0.2,
    charges: 1,
  }
}

const MECHANIC_MAKERS = {
  mark: (rng) => makeMark(rng),
  echo: (rng) => makeEcho(rng),
  counter: (rng) => makeCounter(rng),
  zone: (rng, element) => makeZone(rng, element),
  swap: (rng) => makeSwap(rng),
  seal: (rng) => makeSeal(rng),
  chain: (rng, element) => makeChain(rng, element),
  charge: (rng) => makeCharge(rng),
  execute: (rng) => makeExecute(rng),
  taunt: (rng) => makeTaunt(rng),
  fear: (rng) => makeFear(rng),
  sleep: (rng) => makeSleep(rng),
  shrink: (rng) => makeShrink(rng),
  inflate: (rng) => makeInflate(rng),
  steal: (rng) => makeSteal(rng),
  cleanse: (rng) => makeCleanse(rng),
  gamble: (rng) => makeGamble(rng),
  root: (rng) => makeRoot(rng),
  silence: (rng) => makeSilence(rng),
  clone: (rng) => makeClone(rng),
  reflect: (rng) => makeReflect(rng),
}

function mechanicFromType(type, rng, element) {
  const maker = MECHANIC_MAKERS[type]
  return maker ? maker(rng, element) : null
}

function detectMechanics(compact, { absolute, attack, element, rng, recognition = null }) {
  if (absolute) {
    const mechanic = makeAbsolute(absolute.term, rng)
    const mechanics = [mechanic]
    if (['invulnerable', 'undying', 'inevitable', 'overload'].includes(mechanic.mode)) {
      mechanics.push({ type: 'counter', name: '绝对余威', desc: '破绽期前仍保留一点反扑能力。', duration: 1.2, ratio: 0.25, charges: 1 })
    }
    return mechanics
  }

  const candidates = []
  const heavy = HEAVY_WORDS.test(compact)
  const light = LIGHT_WORDS.test(compact)
  const wild = WILD_WORDS.test(compact) || GAMBLE_WORDS.test(compact)
  const add = (mechanic) => {
    if (mechanic && !candidates.some((item) => item.type === mechanic.type)) candidates.push(mechanic)
  }

  const recipe = MECHANIC_RECIPES[compact] || MECHANIC_RECIPES[compact.replace(/(.)\1+/g, '$1')]
  if (ANTI_ABSOLUTE_WORDS.test(compact)) {
    add(makeAntiAbsolute(rng))
    add(makeCounter(rng))
  } else if (recipe?.length) {
    for (const type of recipe.slice(0, 2)) add(mechanicFromType(type, rng, element))
  } else {
    if (CLONE_WORDS.test(compact)) add(makeClone(rng))
    if (REFLECT_WORDS.test(compact)) add(makeReflect(rng))
    if (TAUNT_WORDS.test(compact)) add(makeTaunt(rng))
    if (FEAR_WORDS.test(compact)) add(makeFear(rng))
    if (SLEEP_WORDS.test(compact)) add(makeSleep(rng))
    if (SHRINK_WORDS.test(compact)) add(makeShrink(rng))
    if (INFLATE_WORDS.test(compact)) add(makeInflate(rng))
    if (STEAL_WORDS.test(compact)) add(makeSteal(rng))
    if (CLEANSE_WORDS.test(compact)) add(makeCleanse(rng))
    if (GAMBLE_WORDS.test(compact)) add(makeGamble(rng))
    if (ROOT_WORDS.test(compact)) add(makeRoot(rng))
    if (SILENCE_WORDS.test(compact)) add(makeSilence(rng))
    if (MARK_WORDS.test(compact)) add(makeMark(rng))
    if (ECHO_WORDS.test(compact)) add(makeEcho(rng))
    if (ZONE_WORDS.test(compact)) add(makeZone(rng, element))
    if (COUNTER_WORDS.test(compact)) add(makeCounter(rng))
    if (SWAP_WORDS.test(compact)) add(makeSwap(rng))
    if (SEAL_WORDS.test(compact)) add(makeSeal(rng))
    if (CHAIN_WORDS.test(compact)) add(makeChain(rng, element))
    if (CHARGE_WORDS.test(compact)) add(makeCharge(rng))
    if (EXECUTE_WORDS.test(compact)) add(makeExecute(rng))
  }

  if (recognition?.mechanics?.length) {
    for (const type of recognition.mechanics.slice(0, 3)) {
      if (candidates.length >= 2) break
      add(mechanicFromType(type, rng, element))
    }
  }

  if (!candidates.length) {
    if (wild) add(makeGamble(rng))
    else if (heavy) add(rng.chance(0.55) ? makeExecute(rng) : makeMark(rng))
    else if (light) add(rng.chance(0.55) ? makeEcho(rng) : makeMark(rng))
  }

  if (!candidates.length) {
    const fallback = {
      melee: [makeMark, makeCounter, makeExecute],
      projectile: [makeEcho, makeMark, makeSeal],
      beam: [makeEcho, makeMark, makeSeal],
      aoe: [makeZone, makeEcho, makeMark],
      dash: [makeSwap, makeCounter, makeMark],
      self: [makeCounter, makeCharge, makeZone],
      summon: [makeMark, makeZone, makeEcho],
    }[attack] || [makeMark, makeEcho, makeCounter]
    add(fallback[hashString(compact) % fallback.length](rng, element))
  }

  if (attack === 'self') {
    const selfTypes = ['counter', 'charge', 'zone', 'echo', 'cleanse', 'reflect', 'gamble']
    const allowed = candidates.filter((item) => selfTypes.includes(item.type))
    if (allowed.length) candidates.splice(0, candidates.length, ...allowed)
    else add(makeCounter(rng))
  }

  const mechanics = [candidates[0]]
  if (candidates.length > 1 && (recipe?.length > 1 || (recognition?.mechanics?.length || 0) >= 2 || rng.chance(0.55))) {
    mechanics.push(candidates[1])
  }
  return mechanics.filter(Boolean).slice(0, 2)
}

function makeDesc(attack, skill, effects, element) {
  const info = ELEMENTS[element]
  const tail = effectDescription(effects)
  switch (attack) {
    case 'melee':
      return `近身一式「${skill}」，${tail}。`
    case 'projectile':
      return `掷出「${skill}」，命中${tail}。`
    case 'beam':
      return `凝出一道「${skill}」光束，贯穿前方并${tail}。`
    case 'aoe':
      return `在对手脚下展开「${skill}」，稍作蓄势后${tail}。`
    case 'dash':
      return `以「${skill}」欺身突进，擦身即${tail}。`
    case 'self':
      return `运转「${skill}」，${tail}。`
    case 'summon':
      return `唤出「${skill}」助战，持续 8 秒。`
    default:
      return `「${skill}」：${info.verb}。`
  }
}

function makeGear(element, form, attack, text) {
  const info = ELEMENTS[element]
  const slot = attack === 'self' || ARMOR_GEAR.test(text)
    ? 'armor'
    : RELIC_GEAR.test(text) && !FORM_PATTERNS_FALLBACK.test(text)
      ? 'relic'
      : 'weapon'
  const formInfo = FORMS[form] || FORMS.none
  const suffix = slot === 'weapon' ? formInfo.gear || '' : slot === 'armor' ? '甲' : '佩'
  return {
    slot,
    name: `${info.gear}${suffix}`,
    form,
    glyph: formInfo.glyph,
  }
}

const FORM_PATTERNS_FALLBACK = /剑|刀|枪|弓|锤|盾|鞭|镰|匕|扇|铃|杖|珠|镜|炮|拳/

function makeTags(attack, element, effects, locked, form) {
  const tags = [ATTACK_LABELS[attack], ELEMENTS[element].tag]
  for (const effect of effects) {
    if (EFFECT_TAGS[effect.type]) tags.push(EFFECT_TAGS[effect.type])
  }
  if (!locked && form && FORMS[form]?.label && FORMS[form].label !== '手') tags.push(FORMS[form].label)
  if (locked) tags.push('泛词锁定')
  return Array.from(new Set(tags)).slice(0, 5)
}

export function compileKeyword(input, options = {}) {
  const word = validateWord(input)
  if (!word.ok) {
    throw new KeywordError(word.code, word.message, word.meta || {})
  }

  const raw = word.raw
  const compact = word.compact
  const canonical = word.canonical
  // “反绝对”本身也含“绝对”，但它是拆绝对的那一边。
  const antiWord = ANTI_ABSOLUTE_WORDS.test(compact)
  const absolute = antiWord ? null : word.absolute || null
  const locked = detectBroad(compact, canonical)
  const seed = `${canonical}|v3`
  const rng = makeRng(hashString(seed))

  let element = locked?.element || detectElement(compact) || defaultElement(seed, locked)
  let attack = locked?.attack || detectAttack(compact, detectForm(compact), element)
  const knownForm = locked?.form || detectForm(compact)
  let form = knownForm || defaultForm(compact, attack, element, locked)

  let recognized = Boolean(locked || detectElement(compact) || knownForm || detectForm(compact) || hasAttackWord(compact))
  const hasRecipe = hasMechanicRecipe(compact)
  const recognition = analyzeNewWord(compact, {
    knownElement: element,
    knownForm,
    knownAttack: attack,
    recognized,
    hasRecipe,
    locked: Boolean(locked),
  })
  const compoundNewWord = !locked
    && !hasRecipe
    && recognition.matched.length > 0
    && (Array.from(compact).length >= 3 || recognition.matched.length >= 2)
    && recognition.confidence >= 0.5
  const semanticNewWord = !locked
    && !hasRecipe
    && (recognition.kind === 'semantic' || compoundNewWord)
    && recognition.confidence >= 0.46
  if (semanticNewWord) {
    element = recognition.element || element
    if (!knownForm && recognition.form) form = recognition.form
    if (recognition.attack) attack = recognition.attack
    if (knownForm && FORMS[knownForm]?.melee && attack !== 'self') attack = 'melee'
    if (!knownForm) form = recognition.form || defaultForm(compact, attack, element, locked)
    recognized = true
  }
  if (!recognized && attack === 'projectile' && !knownForm && !MAGIC_WORDS.test(compact)) {
    attack = fallbackAttack(seed)
    form = defaultForm(compact, attack, element, locked)
  }

  if (attack === 'self' && !knownForm) form = defaultForm(compact, attack, element, locked)

  const mechanics = detectMechanics(compact, {
    absolute,
    attack,
    element,
    rng,
    recognition: semanticNewWord ? recognition : null,
  })
  const absoluteMechanic = mechanics.find((item) => item.type === 'absolute')
  if (absoluteMechanic && ['invulnerable', 'undying', 'inevitable', 'overload'].includes(absoluteMechanic.mode)) {
    attack = 'self'
    form = 'shield'
  }

  const base = ATTACK_BASE[attack] || ATTACK_BASE.projectile
  const semanticDamage = semanticNewWord ? recognition.damage : null
  const heavy = HEAVY_WORDS.test(compact) || semanticDamage === 'heavy'
  const light = LIGHT_WORDS.test(compact) || semanticDamage === 'light'
  const wild = WILD_WORDS.test(compact) || GAMBLE_WORDS.test(compact) || semanticDamage === 'wild'
  const swift = SWIFT_WORDS.test(compact)
  const multi = MULTI_WORDS.test(compact) && ['melee', 'projectile', 'beam'].includes(attack)
  const pierce = PIERCE_WORDS.test(compact) && ['projectile', 'beam'].includes(attack)
  const explode = EXPLODE_WORDS.test(compact) && ['projectile', 'aoe', 'melee'].includes(attack)

  let range = Math.round(base.rangeMin + (base.rangeMax - base.rangeMin) * (0.25 + rng.next() * 0.55))
  if (attack === 'self') range = 0
  if (PIERCE_WORDS.test(compact) && attack !== 'melee') range = Math.round(range * 1.12)
  if (HEAVY_WORDS.test(compact) && attack === 'melee') range += 8
  if (attack !== 'self') range = clamp(range, attack === 'melee' ? 42 : 150, 560)

  let cooldown = base.cd
  if (swift) cooldown *= 0.82
  if (heavy) cooldown *= 1.28
  if (wild) cooldown *= 1.18
  if (multi) cooldown *= 1.08
  if (explode) cooldown *= 1.05
  cooldown = clamp(round1(cooldown), 0.9, 13)

  // 不再把所有伤害压进同一个窄区间：
  // 轻/细/风类可以只打几点但很快，重/巨/爆类可以一拳几十上百但更慢。
  let damageWeight = 1
  if (heavy) damageWeight *= 1.55 + rng.next() * 0.75
  if (light) damageWeight *= 0.38 + rng.next() * 0.26
  if (wild) damageWeight *= 0.65 + rng.next() * 1.35
  if (multi) damageWeight *= 1.06
  if (explode) damageWeight *= 0.92
  if (swift) damageWeight *= 0.9

  const effectPenalty = attack === 'self' ? 0 : 0.9
  let damage = 0
  if (attack !== 'self') {
    damage = base.dps * cooldown * effectPenalty * damageWeight
    if (attack === 'summon') {
      // 召唤物的每一次攻击单独结算，本体只负责把门打开。
      damage = (12 + rng.next() * 8) * (heavy ? 1.35 : 1)
    }
    damage = clamp(damage, 3, 210)
  }

  const hits = multi
    ? 2 + (rng.chance(0.35) ? 1 : 0)
    : (light && ['melee', 'projectile', 'beam'].includes(attack) && rng.chance(0.45) ? 2 : 1)
  if (hits > 1) damage = damage / hits

  const volatility = clamp(
    0.08
      + (heavy ? 0.2 : 0)
      + (light ? 0.12 : 0)
      + (wild ? 0.48 : 0)
      + (GAMBLE_WORDS.test(compact) ? 0.28 : 0)
      + (semanticNewWord ? (recognition.volatility || 0) : 0) * 0.5,
    0.05,
    0.9,
  )

  let aoeRadius = 0
  if (attack === 'aoe') aoeRadius = Math.round(base.radius + (explode ? 28 : 10) + rng.next() * 26)
  if (explode && attack === 'projectile') aoeRadius = 48 + Math.round(rng.next() * 28)
  if (explode && attack === 'melee') aoeRadius = 34 + Math.round(rng.next() * 18)

  const effects = baseEffectsFor(attack, element, compact, rng, damage * Math.max(1, hits), locked)
  const passive = computePassive(element, compact, rng)

  let skill = locked?.skill || raw
  if (Array.from(skill).length > 10) skill = Array.from(skill).slice(0, 10).join('')
  if (!locked && Array.from(skill).length === 1) skill += attack === 'melee' ? '击' : '术'

  const attackLabel = ATTACK_LABELS[attack]
  const preferredRange = attack === 'melee'
    ? Math.max(46, Math.round(range * 0.56))
    : attack === 'self'
      ? 180
      : attack === 'dash'
        ? 220
        : attack === 'summon'
          ? 300
          : Math.round(range * 0.8)

  let novelty = 0.22
  if (Array.from(compact).length >= 3) novelty += 0.06
  if (RARE_ELEMENTS.has(element)) novelty += 0.1
  if (CAMPUS_WORDS.test(compact)) novelty += 0.18
  if (!recognized) novelty += 0.22
  if (semanticNewWord) novelty += 0.08
  if (locked) novelty -= 0.1
  novelty = clamp(round1(novelty), 0.05, 0.98)

  let complexity = 1
  if (effects.length) complexity += 1
  if (aoeRadius > 0) complexity += 1
  if (hits > 1) complexity += 0.5
  if (attack === 'summon' || attack === 'self') complexity += 0.5
  complexity = clamp(Math.round(complexity + mechanics.length * 0.5), 1, 5)

  if (absolute) novelty = Math.max(novelty, 0.7)
  if (mechanics.some((item) => item.type === 'antiAbsolute')) novelty = Math.max(novelty, 0.62)

  const tags = makeTags(attack, element, effects, locked, form)
  if (absolute) tags.push('绝对')
  if (mechanics.some((item) => item.type === 'antiAbsolute')) tags.push('反绝对')
  for (const concept of (recognition.concepts || []).slice(0, 2)) tags.push(concept)
  for (const mechanic of mechanics) tags.push(mechanic.name)
  const uniqueTags = Array.from(new Set(tags)).slice(0, 6)
  const gear = makeGear(element, form, attack, compact)

  const recognitionOut = {
    ...recognition,
    kind: absolute ? 'absolute' : antiWord ? 'antiAbsolute' : semanticNewWord ? 'semantic' : recognition.kind,
    isNew: Boolean((semanticNewWord || recognition.isNew) && !absolute && !antiWord),
    confidence: absolute || antiWord ? 0.98 : recognition.confidence,
    level: absolute || antiWord ? 'high' : recognition.level,
  }
  if (absolute || antiWord) {
    recognitionOut.concepts = absolute ? ['绝对'] : ['反绝对']
    recognitionOut.rationale = absolute
      ? `识别为绝对词「${absolute.term}」，会带破绽和反绝对窗口。`
      : '识别为反绝对词，会获得可消耗的抵消次数。'
  }

  const contract = {
    version: 3,
    key: canonical,
    normalized: canonical,
    word: raw,
    skill,
    concept: element,
    conceptLabel: ELEMENTS[element].label,
    color: ELEMENTS[element].color,
    attack,
    attackLabel,
    form,
    weapon: FORM_LABELS(form),
    gear,
    range,
    preferredRange,
    cooldown,
    windup: clamp(round1(base.windup + (rng.next() * 0.1 - 0.05) + (heavy ? 0.22 : 0) + (wild ? 0.18 : 0)), 0.12, 1.1),
    damage: round1(damage),
    hits,
    volatility,
    projectileSpeed: base.speed ? Math.round(base.speed + rng.next() * 130 + (pierce ? 80 : 0)) : 0,
    projectileRadius: attack === 'projectile' ? (explode ? 9 : 6 + Math.round(rng.next() * 2)) : 0,
    aoeRadius,
    pierce,
    effects,
    passive,
    mechanics,
    recognition: recognitionOut,
    tags: uniqueTags,
    novelty,
    complexity,
    absolute: Boolean(absolute),
    absoluteTerm: absolute?.term || '',
    antiAbsolute: mechanics.some((item) => item.type === 'antiAbsolute'),
    desc: '',
    locked: Boolean(locked),
    lockedFrom: locked ? raw : '',
    lockNote: locked?.note || '',
    source: options.source || 'local',
  }
  contract.desc = makeDesc(attack, skill, effects, element)
  if (mechanics.length) {
    contract.desc = `${contract.desc} 机制：${mechanics.map((item) => item.name).join('、')}。`
  }
  if (absoluteMechanic) {
    contract.desc = `${absoluteMechanic.desc}${contract.attack === 'self' ? '' : ' 命中后仍会留下破绽。'}`
  }
  if (contract.attack === 'summon') {
    contract.summon = {
      duration: 8,
      interval: 1.4 + rng.next() * 0.4,
      range: 420,
      speed: 560,
      skill: skill,
    }
  }
  return contract
}

function FORM_LABELS(form) {
  return FORMS[form]?.label || '手'
}

export function compileWords(words, options = {}) {
  return words.map((word) => compileKeyword(word, options))
}

export function totalPassive(contracts) {
  const total = { moveSpeed: 1, armor: 0, lifesteal: 0, thorns: 0, crit: 0.04, regen: 0 }
  for (const contract of contracts || []) {
    const passive = contract?.passive || {}
    total.moveSpeed += (passive.moveSpeed ?? 1) - 1
    total.armor += passive.armor || 0
    total.lifesteal += passive.lifesteal || 0
    total.thorns += passive.thorns || 0
    total.crit += passive.crit || 0
    total.regen += passive.regen || 0
  }
  total.moveSpeed = clamp(total.moveSpeed, 0.78, 1.42)
  total.armor = clamp(total.armor, 0, 0.34)
  total.lifesteal = clamp(total.lifesteal, 0, 0.24)
  total.thorns = clamp(total.thorns, 0, 0.32)
  total.crit = clamp(total.crit, 0.04, 0.42)
  total.regen = clamp(total.regen, 0, 2.6)
  return total
}

export function makeBarehandContract() {
  return {
    version: 3,
    key: '__barehand__',
    normalized: '__barehand__',
    word: '赤手',
    skill: '赤手',
    concept: 'none',
    conceptLabel: '无',
    color: '#5f5b50',
    attack: 'melee',
    attackLabel: '近战',
    form: 'none',
    weapon: '手',
    gear: { slot: 'none', name: '空手', form: 'none', glyph: '手' },
    range: 48,
    preferredRange: 44,
    cooldown: 0.74,
    windup: 0.16,
    damage: 16,
    hits: 1,
    volatility: 0.08,
    projectileSpeed: 0,
    projectileRadius: 0,
    aoeRadius: 0,
    pierce: false,
    effects: [],
    passive: { moveSpeed: 1, armor: 0, lifesteal: 0, thorns: 0, crit: 0, regen: 0 },
    mechanics: [],
    absolute: false,
    absoluteTerm: '',
    antiAbsolute: false,
    tags: ['赤手', '基础'],
    novelty: 0,
    complexity: 1,
    desc: '没有词条时，只能赤手空拳地贴近对手。',
    locked: false,
    source: 'base',
  }
}

// AI 输出只能“换皮”，不能越界。所有数值都重新夹到本地编译器的平衡区间里。
export function sanitizeAIContract(input, base) {
  const source = input && typeof input === 'object' ? input : {}
  const contract = JSON.parse(JSON.stringify(base))
  const conceptByLabel = Object.entries(ELEMENTS).find(([, value]) => value.label === source.concept)?.[0]
  const formByLabel = Object.entries(FORMS).find(([, value]) => value.label === source.form)?.[0]
  const element = ELEMENTS[source.concept] ? source.concept : conceptByLabel || contract.concept
  const attack = ATTACK_BASE[source.attack] ? source.attack : contract.attack
  const form = FORMS[source.form] ? source.form : formByLabel || contract.form
  const info = ELEMENTS[element]
  const attackBase = ATTACK_BASE[attack]

  contract.concept = element
  contract.conceptLabel = info.label
  contract.color = info.color
  contract.attack = attack
  contract.attackLabel = ATTACK_LABELS[attack]
  contract.form = form
  contract.weapon = FORM_LABELS(form)
  contract.source = 'ai'

  const skill = String(source.skill || contract.skill || '').replace(/[<>]/g, '').trim()
  if (skill) contract.skill = Array.from(skill).slice(0, 12).join('')

  let range = Number(source.range)
  if (!Number.isFinite(range)) range = contract.range
  if (attack === 'self') range = 0
  const rangeFloor = attack === 'melee' ? 40 : attack === 'dash' ? 150 : 180
  contract.range = Math.round(clamp(range, rangeFloor, 560))

  let cooldown = Number(source.cooldown)
  if (!Number.isFinite(cooldown)) cooldown = contract.cooldown
  contract.cooldown = clamp(round1(cooldown), 0.9, 13)

  let damage = Number(source.damage)
  if (!Number.isFinite(damage)) damage = contract.damage
  if (attack === 'self') damage = 0
  damage = clamp(damage, 0, 240)
  let hits = Number(source.hits)
  if (!Number.isFinite(hits)) hits = contract.hits
  hits = Math.round(clamp(hits, 1, 4))
  if (attack === 'self') hits = 1
  // 单技能 DPS 上限：允许大起大落，但不允许无限循环。
  const maxDamage = attack === 'self' ? 0 : Math.max(8, (32 * contract.cooldown) / Math.max(1, hits))
  damage = Math.min(damage, maxDamage)
  contract.damage = round1(damage)
  contract.hits = hits
  contract.volatility = clamp(Number(source.volatility) || contract.volatility || 0.08, 0.02, 1)

  let windup = Number(source.windup)
  if (!Number.isFinite(windup)) windup = contract.windup
  contract.windup = clamp(round1(windup), 0.1, 1.1)

  let speed = Number(source.projectileSpeed)
  if (!Number.isFinite(speed)) speed = contract.projectileSpeed
  contract.projectileSpeed = attack === 'projectile' || attack === 'summon'
    ? Math.round(clamp(speed, 360, 920))
    : 0

  let aoe = Number(source.aoeRadius)
  if (!Number.isFinite(aoe)) aoe = contract.aoeRadius
  contract.aoeRadius = ['aoe', 'projectile', 'melee'].includes(attack)
    ? Math.round(clamp(aoe, 0, attack === 'aoe' ? 170 : 110))
    : 0

  let preferred = Number(source.preferredRange)
  if (!Number.isFinite(preferred)) preferred = contract.preferredRange
  contract.preferredRange = Math.round(clamp(preferred, 36, 500))

  const allowedEffects = new Set(Object.keys(EFFECT_TAGS))
  const effects = Array.isArray(source.effects)
    ? source.effects.filter((e) => e && allowedEffects.has(e.type))
    : []
  if (effects.length) {
    contract.effects = effects.slice(0, 3).map((effect) => {
      const out = { type: effect.type }
      if (effect.duration != null) out.duration = clamp(Number(effect.duration) || 1, 0.2, 8)
      if (effect.amount != null) out.amount = clamp(Number(effect.amount) || 0, 0, 90)
      if (effect.power != null) out.power = clamp(Number(effect.power) || 0, 0, 100)
      if (effect.ratio != null) out.ratio = clamp(Number(effect.ratio) || 0, 0, 0.35)
      if (effect.factor != null) out.factor = clamp(Number(effect.factor) || 1, 0.45, 1.6)
      if (effect.chance != null) out.chance = clamp(Number(effect.chance) || 0.3, 0.1, 0.8)
      if (effect.crit != null) out.crit = clamp(Number(effect.crit) || 0, 0, 0.3)
      if (effect.damage != null) out.damage = clamp(Number(effect.damage) || 1, 1, 1.3)
      return out
    })
  }
  if (attack === 'self' && !contract.effects.some((e) => ['heal', 'shield', 'haste', 'regen', 'thorns', 'focus'].includes(e.type))) {
    contract.effects = [{ type: 'shield', amount: 88, duration: 7 }]
  }

  const mechanics = []
  if (Array.isArray(source.mechanics)) {
    for (const rawMechanic of source.mechanics.slice(0, 3)) {
      if (!rawMechanic || !MECHANIC_TYPES.includes(rawMechanic.type)) continue
      if (attack === 'self' && ['mark', 'chain', 'seal', 'execute', 'taunt', 'fear', 'sleep', 'steal', 'root', 'silence'].includes(rawMechanic.type)) continue
      const type = rawMechanic.type
      const mechanic = {
        type,
        name: String(rawMechanic.name || mechanicName(type)).replace(/[<>]/g, '').trim().slice(0, 10),
        desc: String(rawMechanic.desc || '').replace(/[<>]/g, '').trim().slice(0, 52),
      }
      if (type === 'mark') {
        mechanic.stacks = Math.round(clamp(Number(rawMechanic.stacks) || 1, 1, 3))
        mechanic.duration = clamp(Number(rawMechanic.duration) || 5, 1, 8)
        mechanic.bonus = clamp(Number(rawMechanic.bonus) || 0.35, 0.1, 0.6)
      } else if (type === 'echo') {
        mechanic.delay = clamp(Number(rawMechanic.delay) || 0.8, 0.2, 2)
        mechanic.ratio = clamp(Number(rawMechanic.ratio) || 0.35, 0.08, 0.5)
      } else if (type === 'counter') {
        mechanic.duration = clamp(Number(rawMechanic.duration) || 2, 0.5, 4)
        mechanic.ratio = clamp(Number(rawMechanic.ratio) || 0.5, 0.1, 0.7)
        mechanic.charges = Math.round(clamp(Number(rawMechanic.charges) || 1, 1, 2))
      } else if (type === 'zone') {
        mechanic.duration = clamp(Number(rawMechanic.duration) || 4, 1.5, 6)
        mechanic.radius = clamp(Number(rawMechanic.radius) || 96, 50, 140)
        mechanic.slow = clamp(Number(rawMechanic.slow) || 0.75, 0.5, 0.9)
        mechanic.tickDamage = clamp(Number(rawMechanic.tickDamage) || 4, 1, 8)
        mechanic.color = info.color
      } else if (type === 'swap') {
        mechanic.stun = clamp(Number(rawMechanic.stun) || 0.3, 0.1, 0.7)
      } else if (type === 'seal') {
        mechanic.duration = clamp(Number(rawMechanic.duration) || 3, 1, 4.5)
      } else if (type === 'chain') {
        mechanic.distance = clamp(Number(rawMechanic.distance) || 70, 30, 120)
        mechanic.slow = clamp(Number(rawMechanic.slow) || 0.8, 0.6, 0.95)
        mechanic.color = info.color
      } else if (type === 'charge') {
        mechanic.bonus = clamp(Number(rawMechanic.bonus) || 0.4, 0.1, 0.6)
        mechanic.duration = clamp(Number(rawMechanic.duration) || 5, 2, 8)
      } else if (type === 'execute') {
        mechanic.threshold = clamp(Number(rawMechanic.threshold) || 0.25, 0.1, 0.4)
        mechanic.bonus = clamp(Number(rawMechanic.bonus) || 0.6, 0.2, 1)
      } else if (type === 'absolute') {
        const allowedModes = ['invulnerable', 'undying', 'execute', 'overload', 'inevitable']
        mechanic.mode = allowedModes.includes(rawMechanic.mode) ? rawMechanic.mode : 'inevitable'
        mechanic.duration = clamp(Number(rawMechanic.duration) || 1.1, 0.5, 2)
        mechanic.breakDuration = clamp(Number(rawMechanic.breakDuration) || 2.2, 1, 3.5)
        mechanic.breakAmp = clamp(Number(rawMechanic.breakAmp) || 0.35, 0.2, 0.5)
        mechanic.damageMul = clamp(Number(rawMechanic.damageMul) || 1.3, 1.1, 1.5)
        mechanic.threshold = clamp(Number(rawMechanic.threshold) || 0.25, 0.1, 0.4)
      } else if (type === 'antiAbsolute') {
        mechanic.charges = Math.round(clamp(Number(rawMechanic.charges) || 1, 1, 2))
        mechanic.duration = clamp(Number(rawMechanic.duration) || 8, 2, 12)
        mechanic.reflect = clamp(Number(rawMechanic.reflect) || 0.4, 0.1, 0.5)
      } else if (type === 'taunt' || type === 'fear' || type === 'sleep' || type === 'root' || type === 'silence') {
        mechanic.duration = clamp(Number(rawMechanic.duration) || 1.5, 0.4, 4)
      } else if (type === 'shrink' || type === 'inflate') {
        mechanic.duration = clamp(Number(rawMechanic.duration) || 3, 1, 6)
        mechanic.factor = clamp(Number(rawMechanic.factor) || (type === 'shrink' ? 0.65 : 0.8), 0.4, 1.2)
        mechanic.speed = clamp(Number(rawMechanic.speed) || 0.8, 0.5, 1.2)
        mechanic.damageTaken = clamp(Number(rawMechanic.damageTaken) || 0.15, 0, 0.4)
      } else if (type === 'steal') {
        mechanic.amount = clamp(Number(rawMechanic.amount) || 50, 10, 120)
      } else if (type === 'cleanse') {
        mechanic.heal = clamp(Number(rawMechanic.heal) || 40, 0, 100)
      } else if (type === 'gamble') {
        mechanic.low = clamp(Number(rawMechanic.low) || 0.35, 0.1, 0.7)
        mechanic.high = clamp(Number(rawMechanic.high) || 2.4, 1.3, 3.5)
        mechanic.selfDamage = clamp(Number(rawMechanic.selfDamage) || 8, 0, 30)
      } else if (type === 'clone') {
        mechanic.duration = clamp(Number(rawMechanic.duration) || 5, 2, 8)
        mechanic.interval = clamp(Number(rawMechanic.interval) || 1.5, 0.7, 2.6)
        mechanic.ratio = clamp(Number(rawMechanic.ratio) || 0.35, 0.15, 0.6)
      } else if (type === 'reflect') {
        mechanic.duration = clamp(Number(rawMechanic.duration) || 2, 0.5, 4)
        mechanic.ratio = clamp(Number(rawMechanic.ratio) || 0.5, 0.1, 0.7)
        mechanic.charges = Math.round(clamp(Number(rawMechanic.charges) || 1, 1, 2))
      }
      mechanics.push(mechanic)
    }
  }
  if (mechanics.length) {
    contract.mechanics = mechanics
    contract.absolute = mechanics.some((item) => item.type === 'absolute')
    contract.absoluteTerm = contract.absoluteTerm || base.absoluteTerm || ''
    contract.antiAbsolute = mechanics.some((item) => item.type === 'antiAbsolute')
    if (contract.absolute && !contract.mechanics.some((item) => item.type === 'absolute' && item.breakDuration > 0)) {
      contract.mechanics[0].breakDuration = 2.2
    }
  }

  if (source.passive && typeof source.passive === 'object') {
    contract.passive = {
      moveSpeed: clamp(Number(source.passive.moveSpeed) || 1, 0.86, 1.22),
      armor: clamp(Number(source.passive.armor) || 0, 0, 0.12),
      lifesteal: clamp(Number(source.passive.lifesteal) || 0, 0, 0.12),
      thorns: clamp(Number(source.passive.thorns) || 0, 0, 0.12),
      crit: clamp(Number(source.passive.crit) || 0, 0, 0.12),
      regen: clamp(Number(source.passive.regen) || 0, 0, 1.2),
    }
  }

  if (source.gear && typeof source.gear === 'object' && source.gear.name) {
    contract.gear = {
      ...contract.gear,
      name: String(source.gear.name).replace(/[<>]/g, '').trim().slice(0, 12),
    }
  }
  const desc = String(source.desc || '').replace(/[<>]/g, '').trim()
  contract.desc = desc ? desc.slice(0, 96) : makeDesc(attack, contract.skill, contract.effects, element)
  contract.tags = Array.from(
    new Set([
      ATTACK_LABELS[attack],
      info.tag,
      ...contract.effects.map((e) => EFFECT_TAGS[e.type]).filter(Boolean),
      ...(contract.absolute ? ['绝对'] : []),
      ...(contract.antiAbsolute ? ['反绝对'] : []),
      ...(contract.mechanics || []).map((item) => item.name).filter(Boolean),
      ...(Array.isArray(source.tags) ? source.tags.slice(0, 3).map((t) => String(t).slice(0, 6)) : []),
    ]),
  ).slice(0, 6)
  contract.complexity = clamp((base.complexity || 1) + Math.min(2, (contract.mechanics || []).length), 1, 5)
  contract.locked = base.locked
  contract.lockedFrom = base.lockedFrom
  contract.lockNote = base.lockNote
  contract.novelty = clamp(round1(base.novelty + 0.04), 0.05, 0.98)
  if (contract.absolute) contract.novelty = Math.max(contract.novelty, 0.7)
  if (contract.antiAbsolute) contract.novelty = Math.max(contract.novelty, 0.62)
  if (attack === 'summon') {
    contract.summon = base.summon || {
      duration: 8,
      interval: 1.5,
      range: 420,
      speed: 560,
      skill: contract.skill,
    }
  } else {
    delete contract.summon
  }
  const aiRecognition = source.recognition && typeof source.recognition === 'object' ? source.recognition : {}
  const baseRecognition = base.recognition || {}
  const aiConfidence = clamp(Number(aiRecognition.confidence) || Number(baseRecognition.confidence) || 0.72, 0.1, 0.98)
  const aiConcepts = Array.isArray(aiRecognition.concepts)
    ? aiRecognition.concepts.map((item) => String(item).replace(/[<>]/g, '').trim()).filter(Boolean).slice(0, 5)
    : (baseRecognition.concepts || [])
  contract.recognition = {
    kind: 'ai',
    confidence: aiConfidence,
    level: aiConfidence >= 0.72 ? 'high' : aiConfidence >= 0.46 ? 'medium' : 'low',
    concepts: aiConcepts.length ? aiConcepts : ['AI 拆解'],
    tags: Array.isArray(aiRecognition.tags)
      ? aiRecognition.tags.map((item) => String(item).slice(0, 8)).slice(0, 6)
      : (baseRecognition.tags || []),
    matched: baseRecognition.matched || [],
    isNew: Boolean(baseRecognition.isNew ?? true),
    rationale: String(aiRecognition.rationale || aiRecognition.reason || source.notes || baseRecognition.rationale || '')
      .replace(/[<>]/g, '')
      .trim()
      .slice(0, 120),
  }
  contract.aiNotes = String(source.notes || source.reason || '').replace(/[<>]/g, '').slice(0, 80)
  return contract
}

export function describeContract(contract) {
  return `${contract.skill} · ${contract.attackLabel} · ${contract.range ? `${contract.range} 射程` : '自身'} · ${contract.cooldown}s 冷却`
}
