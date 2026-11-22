// 斗蛐蛐核心回归测试
// 运行：node scripts/test-cricket.mjs
import assert from 'node:assert/strict'
import { compileKeyword, sanitizeAIContract, totalPassive } from '../src/game/cricket/compiler.js'
import { compileBuildLocal, consistencyCheck } from '../src/game/cricket/compileService.js'
import { validateWords } from '../src/game/cricket/text.js'
import {
  SITE_PRESETS,
  TOP_TEN,
  FUN_SEEDS,
  powerForRating,
  styleForContracts,
  topLadder,
  topTenBoard,
  advanceTopLadder,
} from '../src/game/cricket/roster.js'
import { createBattle } from '../src/game/cricket/engine.js'
import {
  applyMatchResult,
  expectedLossDelta,
  expectedSurrenderDelta,
  expectedWinGain,
} from '../src/game/cricket/scoring.js'

let passed = 0
function test(name, fn) {
  try {
    fn()
    passed += 1
    console.log(`  ok  ${name}`)
  } catch (error) {
    console.error(`  FAIL ${name}`)
    throw error
  }
}

function build(opponent, asPlayer = false) {
  const contracts = compileBuildLocal(opponent.words)
  return {
    ...opponent,
    contracts,
    style: opponent.style || styleForContracts(contracts),
    power: asPlayer ? 1 : opponent.power ?? powerForRating(opponent.rating),
  }
}

console.log('\n[词条编译]')
test('同一词条重复编译得到同一合约', () => {
  for (const word of ['烈焰', '青锋', '荆棘', '影步', '雷引', '食堂', '故事']) {
    const a = compileKeyword(word)
    const b = compileKeyword(word)
    assert.equal(JSON.stringify(a), JSON.stringify(b), word)
  }
})

test('泛词被锁定到具体方向', () => {
  for (const [word, skill] of [['火', '烈焰喷射'], ['剑', '青锋斩'], ['风', '风刃'], ['食堂', '食堂大勺']]) {
    const contract = compileKeyword(word)
    assert.equal(contract.locked, true, word)
    assert.equal(contract.skill, skill, word)
  }
})

test('绝对词被编译成带破绽的机制，控制类词仍被拒绝', () => {
  for (const word of ['无敌', '必胜', '秒杀', '100%', '不死']) {
    const contract = compileKeyword(word)
    assert.equal(contract.absolute, true, word)
    const absolute = contract.mechanics.find((mechanic) => mechanic.type === 'absolute')
    assert.ok(absolute, `${word} absolute mechanic`)
    assert.ok(absolute.breakDuration > 0 && absolute.breakAmp > 0, `${word} break window`)
  }
  for (const word of ['暂停', '退出', '管理员', '修改血量']) {
    assert.throws(() => compileKeyword(word), (error) => error.code === 'META', word)
  }
})

test('反绝对词带有可消耗的反制机制', () => {
  const contract = compileKeyword('反绝对')
  assert.equal(contract.antiAbsolute, true)
  assert.ok(contract.mechanics.some((mechanic) => mechanic.type === 'antiAbsolute'))
})

test('重复概念在五个槽位中被拒绝', () => {
  const result = validateWords(['火焰', '烈火', '剑', '风', '雷'])
  assert.equal(result.ok, false)
  assert.equal(result.errors[0].code, 'DUPLICATE')
})

test('合约数值都落在可玩的边界内', () => {
  const words = ['烈焰', '寒霜', '雷引', '疾风', '静心', '食堂', '校园网', '早八', '体测', '梦', '时间', '空间', '镜面', '狼群', '荆棘']
  for (const word of words) {
    const contract = compileKeyword(word)
    assert.ok(contract.damage >= 0 && contract.damage <= 210, `${word} damage`)
    assert.ok(contract.cooldown >= 0.9 && contract.cooldown <= 13, `${word} cd`)
    assert.ok(contract.range >= 0 && contract.range <= 560, `${word} range`)
    assert.ok(contract.volatility >= 0.02 && contract.volatility <= 1, `${word} volatility`)
    assert.ok(Array.isArray(contract.effects) && contract.effects.length <= 3, `${word} effects`)
    assert.ok(contract.skill && contract.desc, `${word} text`)
    assert.ok(['melee', 'projectile', 'beam', 'aoe', 'dash', 'self', 'summon'].includes(contract.attack))
  }
})

test('新词会被拆词根识别，而不是随机兜底', () => {
  const cases = [
    { word: '量子火锅', kind: 'semantic', element: 'fire', mechanics: ['zone', 'gamble'] },
    { word: '赛博木鱼', kind: 'semantic', element: 'sound', mechanics: ['silence', 'echo'] },
    { word: '高数', kind: 'semantic', element: 'mind', mechanics: ['fear', 'execute'] },
    { word: 'ddl', kind: 'semantic', element: 'mind', mechanics: ['fear', 'execute'] },
  ]
  for (const item of cases) {
    const contract = compileKeyword(item.word)
    const got = contract.mechanics.map((mechanic) => mechanic.type)
    assert.equal(contract.recognition.kind, item.kind, `${item.word} kind`)
    assert.equal(contract.concept, item.element, `${item.word} element`)
    for (const type of item.mechanics) assert.ok(got.includes(type), `${item.word} missing ${type}: ${got.join(',')}`)
    assert.ok(contract.recognition.confidence >= 0.46, `${item.word} confidence`)
    assert.ok(contract.recognition.rationale.includes('拆词'), `${item.word} rationale`)
  }
  assert.equal(compileKeyword('青锋').recognition.kind, 'recipe')
  assert.equal(compileKeyword('火焰剑').attack, 'melee')
  assert.ok(compileKeyword('咕噜噜').recognition.confidence < 0.46)
})

test('机制从名字来，而不是随机贴状态', () => {
  const expectations = [
    ['食堂', ['steal', 'taunt']],
    ['早八', ['sleep', 'fear']],
    ['镜面', ['reflect', 'clone']],
    ['抽卡', ['gamble']],
    ['图书馆', ['silence', 'zone']],
    ['陷阱', ['root', 'zone']],
  ]
  for (const [word, types] of expectations) {
    const contract = compileKeyword(word)
    const got = contract.mechanics.map((mechanic) => mechanic.type)
    for (const type of types) assert.ok(got.includes(type), `${word} missing ${type}: ${got.join(',')}`)
  }
})

test('伤害不再全部压进稳定区间', () => {
  const light = compileKeyword('风刃')
  const heavy = compileKeyword('崩山')
  assert.ok(heavy.damage > light.damage * 2.5, `${light.damage} vs ${heavy.damage}`)
  assert.ok(heavy.cooldown > light.cooldown, 'heavy should be slower')
  assert.ok(heavy.volatility > light.volatility, 'heavy should swing harder')
})

test('相近词条命中同一条能力', () => {
  const first = compileBuildLocal(['火焰', '疾风', '荆棘', '影步', '雷引'])
  const second = compileBuildLocal(['烈火', '疾风', '荆棘', '影步', '雷引'])
  assert.equal(first[0].key, second[0].key)
  assert.equal(first[0].skill, second[0].skill)
})

test('AI 输出越界时会被夹回平衡区间', () => {
  const base = compileKeyword('霜月')
  const contract = sanitizeAIContract({
    skill: '霜月裁决',
    concept: '冰',
    form: 'staff',
    attack: 'projectile',
    range: 9999,
    cooldown: 0.1,
    damage: 999,
    hits: 8,
    windup: 99,
    projectileSpeed: 9999,
    aoeRadius: 9999,
    preferredRange: 9999,
    effects: [{ type: 'stun', duration: 99, chance: 1 }],
    mechanics: [
      { type: 'absolute', mode: 'invulnerable', duration: 99, breakDuration: 99, breakAmp: 9 },
      { type: 'mark', stacks: 99, duration: 99, bonus: 9 },
    ],
    passive: { moveSpeed: 9, armor: 9, lifesteal: 9, thorns: 9, crit: 9, regen: 9 },
    gear: { name: '霜月法杖' },
    recognition: { concepts: ['霜', '月'], confidence: 0.91, rationale: '拆成霜与月。' },
    desc: '测试描述',
  }, base)
  assert.ok(contract.range <= 560)
  assert.ok(contract.cooldown >= 0.9)
  assert.ok(contract.damage <= 240)
  assert.ok(contract.hits <= 4)
  assert.ok(contract.aoeRadius <= 170)
  assert.ok(contract.effects[0].duration <= 8)
  assert.ok(contract.passive.armor <= 0.12)
  assert.ok(contract.passive.moveSpeed <= 1.22)
  assert.equal(contract.concept, 'ice')
  assert.equal(contract.source, 'ai')
  assert.equal(contract.absolute, true)
  assert.equal(contract.recognition.kind, 'ai')
  assert.deepEqual(contract.recognition.concepts, ['霜', '月'])
  const absolute = contract.mechanics.find((mechanic) => mechanic.type === 'absolute')
  assert.ok(absolute.duration <= 2 && absolute.breakDuration <= 3.5 && absolute.breakAmp <= 0.5)
  const mark = contract.mechanics.find((mechanic) => mechanic.type === 'mark')
  assert.ok(mark.stacks <= 3 && mark.bonus <= 0.6)
})

test('能力库一致性自检通过', () => {
  const result = consistencyCheck()
  assert.equal(result.ok, true, JSON.stringify(result.rows.filter((row) => !row.ok)))
})

console.log('\n[预设阵容]')
test('所有预设、前十、趣味保留的词条都能编译', () => {
  for (const opponent of [...SITE_PRESETS, ...TOP_TEN, ...FUN_SEEDS]) {
    const validation = validateWords(opponent.words)
    assert.equal(validation.ok, true, `${opponent.name}: ${validation.errors.map((e) => e.message).join('; ')}`)
    const contracts = compileBuildLocal(opponent.words)
    assert.equal(contracts.length, 5)
    for (const contract of contracts) assert.ok(contract && contract.skill)
  }
})

console.log('\n[自动战斗]')
test('预设对局都能在 75 秒内结束，且不产生 NaN', () => {
  const player = build(SITE_PRESETS[1], true)
  const outcomes = { player: 0, opponent: 0, draw: 0 }
  const reasons = new Set()
  for (let index = 0; index < 60; index += 1) {
    const opponent = build([...SITE_PRESETS, ...TOP_TEN][index % (SITE_PRESETS.length + TOP_TEN.length)])
    const battle = createBattle({ player, opponent, seed: index * 7919 + 3 })
    let steps = 0
    while (!battle.state.over && steps < 75 * 60) {
      battle.step(1 / 60)
      steps += 1
    }
    const result = battle.state.result
    assert.ok(result, `battle ${index} did not end`)
    assert.ok(result.duration <= 75)
    outcomes[result.winner] += 1
    reasons.add(result.reason)
    for (const fighter of battle.state.fighters) {
      assert.ok(Number.isFinite(fighter.hp), 'hp NaN')
      assert.ok(Number.isFinite(fighter.x), 'x NaN')
      assert.ok(fighter.hp >= 0)
    }
  }
  assert.ok(outcomes.player > 0 && outcomes.opponent > 0, JSON.stringify(outcomes))
  assert.ok(reasons.has('ko'))
})

test('前十必须从低到高挑战，前十榜始终完整', () => {
  assert.equal(topLadder({ topProgress: 0 }).next.id, 'top-10')
  assert.equal(topLadder({ topProgress: 1 }).next.id, 'top-09')
  assert.equal(topLadder({ topProgress: 9 }).next.id, 'top-01')
  assert.equal(topLadder({ topProgress: 10 }).next, null)
  const rows = topTenBoard({ score: 9999, keywords: [], name: '爆分玩家' })
  assert.equal(rows.filter((row) => row.id?.startsWith('top-')).length, 10)
  assert.equal(rows.length, 11)
  const first = advanceTopLadder({ topProgress: 0, topCleared: [] }, 'top-10', true)
  assert.equal(first.advanced, true)
  assert.equal(first.profile.topProgress, 1)
  const skipped = advanceTopLadder({ topProgress: 0, topCleared: [] }, 'top-09', true)
  assert.equal(skipped.advanced, false)
  const lost = advanceTopLadder({ topProgress: 0, topCleared: [] }, 'top-10', false)
  assert.equal(lost.advanced, false)
})

test('积分：前十越往上，赢得多也扣得多', () => {
  const low = expectedWinGain({ score: 100, rating: 210, rank: 10 })
  const high = expectedWinGain({ score: 100, rating: 920, rank: 1 })
  assert.ok(high > low)
  const lowLoss = Math.abs(expectedLossDelta({ score: 300, rating: 210, rank: 10 }))
  const highLoss = Math.abs(expectedLossDelta({ score: 300, rating: 920, rank: 1 }))
  assert.ok(highLoss > lowLoss)
})

test('积分：赢高分对手收益更高，认输比被击倒扣得少', () => {
  assert.ok(expectedWinGain({ score: 0, rating: 900 }) > expectedWinGain({ score: 0, rating: 120 }))
  assert.ok(expectedSurrenderDelta({ score: 300, rating: 900 }) > expectedLossDelta({ score: 300, rating: 900 }))
  // 对高难度对手认输扣得更少，对低难度对手认输扣得更多。
  assert.ok(expectedSurrenderDelta({ score: 300, rating: 100 }) < expectedSurrenderDelta({ score: 300, rating: 900 }))
})

test('胜负结算保持分数不为负，并正确累计连胜', () => {
  const profile = { score: 5, wins: 0, losses: 0, streak: 0, bestStreak: 0, matches: 0 }
  const win = applyMatchResult(profile, {
    winner: 'player',
    reason: 'ko',
    opponent: { rating: 300 },
    duration: 20,
  })
  assert.ok(win.profile.score > 5)
  assert.equal(win.profile.streak, 1)
  const loss = applyMatchResult({ ...win.profile, score: 3 }, {
    winner: 'opponent',
    reason: 'ko',
    opponent: { rating: 900 },
    duration: 20,
  })
  assert.ok(loss.profile.score >= 0)
  assert.equal(loss.profile.streak, 0)
})

console.log(`\n全部通过：${passed} 项\n`)
