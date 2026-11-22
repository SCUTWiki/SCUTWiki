import { fingerprintWords } from './text.js'

export const STYLE_LABELS = {
  aggressive: '抢攻',
  cautious: '游斗',
  trickster: '诡变',
  balanced: '均衡',
}

const PRESET_ACCENTS = ['#7b6a4b', '#3f6378', '#6f7a42', '#6a5a8c', '#8a4b30']
const TOP_ACCENTS = ['#4b4a60', '#6a5a8c', '#3d4d5c', '#7a5a2d', '#4f6b3d', '#5b5b5b', '#7b5b47', '#8a4b3a', '#6b6140', '#5c6b3f']

export const SITE_PRESETS = [
  {
    id: 'preset-wood',
    name: '试炼·木人',
    epithet: '第一关 · 不会还手',
    tier: 'preset',
    rating: 60,
    power: 0.7,
    words: ['木人', '站桩', '钝拳', '踏步', '朽木'],
    style: 'balanced',
    accent: PRESET_ACCENTS[0],
    seal: '木',
    desc: '一段会走路的木头。动作很慢，适合第一次进门。',
  },
  {
    id: 'preset-rain',
    name: '雨巷剑客',
    epithet: '第二关 · 听雨',
    tier: 'preset',
    rating: 300,
    words: ['青锋', '烟雨', '疾步', '落叶', '静心'],
    style: 'aggressive',
    accent: PRESET_ACCENTS[1],
    seal: '雨',
    desc: '巷子很窄，剑很快。它不会等你把词条念完。',
  },
  {
    id: 'preset-hunter',
    name: '荒原猎手',
    epithet: '第三关 · 放风筝',
    tier: 'preset',
    rating: 470,
    words: ['猎弓', '鹰眼', '狼群', '陷阱', '疾风'],
    style: 'cautious',
    accent: PRESET_ACCENTS[2],
    seal: '猎',
    desc: '你追它，它就退；你退，它就放狼。',
  },
  {
    id: 'preset-thunder',
    name: '雷渊术士',
    epithet: '第四关 · 引雷',
    tier: 'preset',
    rating: 650,
    words: ['雷渊', '电幕', '引雷', '焦土', '余响'],
    style: 'trickster',
    accent: PRESET_ACCENTS[3],
    seal: '渊',
    desc: '它把整个场地写成一张雷符，只等你站进去。',
  },
  {
    id: 'preset-forge',
    name: '不熄炉心',
    epithet: '第五关 · 过载',
    tier: 'preset',
    rating: 820,
    words: ['熔炉', '铁壁', '蒸汽', '过载', '余烬'],
    style: 'aggressive',
    accent: PRESET_ACCENTS[4],
    seal: '炉',
    desc: '一座会走路的炉子。靠近它，或者被它靠近。',
  },
]

export const TOP_TEN = [
  {
    id: 'top-01', name: '断章', epithet: 'TOP 01 · 未写完的最后一页', rating: 920,
    words: ['空白', '断句', '残页', '遗忘', '印刷体'], style: 'balanced', accent: TOP_ACCENTS[0], seal: '斷',
    desc: '它的招式都没有下半句，命中时却总是完整的。',
  },
  {
    id: 'top-02', name: '镜中我', epithet: 'TOP 02 · 你退它也退', rating: 860,
    words: ['镜面', '逆影', '回响', '裂痕', '反绝对'], style: 'trickster', accent: TOP_ACCENTS[1], seal: '镜',
    desc: '它学你，但总比你多半步。',
  },
  {
    id: 'top-03', name: '长夜行者', epithet: 'TOP 03 · 灯灭之后', rating: 790,
    words: ['熄灯', '夜行', '低语', '影子', '黎明'], style: 'cautious', accent: TOP_ACCENTS[2], seal: '夜',
    desc: '你看见它的时候，它已经在你的影子里。',
  },
  {
    id: 'top-04', name: '雷池', epithet: 'TOP 04 · 一步一雷', rating: 710,
    words: ['紫电', '雷池', '引雷', '焦土', '回响'], style: 'aggressive', accent: TOP_ACCENTS[3], seal: '雷',
    desc: '整块场地都是它的引线。',
  },
  {
    id: 'top-05', name: '春分', epithet: 'TOP 05 · 万物生长', rating: 640,
    words: ['新芽', '细雨', '藤蔓', '花信', '回春'], style: 'cautious', accent: TOP_ACCENTS[4], seal: '春',
    desc: '它不急着赢，它只是让场地慢慢长满。',
  },
  {
    id: 'top-06', name: '铁匠', epithet: 'TOP 06 · 一锤定音', rating: 560,
    words: ['铁砧', '锻打', '淬火', '锁子甲', '余温'], style: 'aggressive', accent: TOP_ACCENTS[5], seal: '铁',
    desc: '每一锤都比上一锤更热。',
  },
  {
    id: 'top-07', name: '说书人', epithet: 'TOP 07 · 醒木一拍', rating: 480,
    words: ['醒木', '折扇', '口舌', '故事', '高潮'], style: 'trickster', accent: TOP_ACCENTS[6], seal: '书',
    desc: '它先讲故事，再把你写进故事里。',
  },
  {
    id: 'top-08', name: '早八人', epithet: 'TOP 08 · 没睡醒，但很凶', rating: 390,
    words: ['闹钟', '咖啡', '狂奔', '困意', '迟到'], style: 'aggressive', accent: TOP_ACCENTS[7], seal: '八',
    desc: '它跑得很快，因为还有三分钟上课。',
  },
  {
    id: 'top-09', name: '食堂阿姨', epithet: 'TOP 09 · 手不抖', rating: 300,
    words: ['铁勺', '抖手', '红烧肉', '排队', '加饭'], style: 'balanced', accent: TOP_ACCENTS[8], seal: '勺',
    desc: '铁勺是武器，抖手是假动作。',
  },
  {
    id: 'top-10', name: '军训教官', epithet: 'TOP 10 · 站好，别动', rating: 210,
    words: ['口令', '正步', '哨声', '烈日', '解散'], style: 'aggressive', accent: TOP_ACCENTS[9], seal: '训',
    desc: '它喊“解散”的时候，你最好别真的解散。',
  },
]

export const FUN_SEEDS = [
  {
    id: 'fun-net',
    name: '断网少年',
    epithet: '民间存档 · 连接已断开',
    tier: 'fun',
    rating: 260,
    words: ['校园网', '断网', '延迟', '重连', '丢包'],
    style: 'trickster',
    accent: '#4f6372',
    seal: '网',
    desc: '你永远不知道它的下一招会不会连上。',
    note: '校园网受害者',
    from: '站点存档',
    at: 0,
  },
  {
    id: 'fun-run',
    name: '体测噩梦',
    epithet: '民间存档 · 最后一圈',
    tier: 'fun',
    rating: 380,
    words: ['体测', '一千米', '抢跑', '岔气', '终点'],
    style: 'aggressive',
    accent: '#7a5a3d',
    seal: '测',
    desc: '它会在你岔气的时候超过你。',
    note: '跑完就倒下',
    from: '站点存档',
    at: 0,
  },
  {
    id: 'fun-final',
    name: '期末周',
    epithet: '民间存档 · 最后一夜',
    tier: 'fun',
    rating: 520,
    words: ['通宵', '咖啡', '重点', '押题', '挂科'],
    style: 'cautious',
    accent: '#5e536e',
    seal: '末',
    desc: '它不复习，它只押题。押中了就很强。',
    note: '最后一夜',
    from: '站点存档',
    at: 0,
  },
]

export function isTopTenId(id) {
  return String(id || '').startsWith('top-')
}

export function topRankOf(id) {
  const index = TOP_TEN.findIndex((item) => item.id === id)
  return index >= 0 ? index + 1 : 0
}

export function topLadder(profile) {
  const progress = Math.min(10, Math.max(0, Number(profile?.topProgress) || 0))
  // TOP_TEN 是 #1 -> #10；前十必须从 #10 开始往上打。
  const nextIndex = 9 - progress
  const clearedIds = new Set(Array.isArray(profile?.topCleared) ? profile.topCleared : [])
  for (let i = 0; i < progress; i += 1) clearedIds.add(TOP_TEN[9 - i].id)
  return {
    progress,
    done: progress >= 10,
    next: progress >= 10 ? null : TOP_TEN[nextIndex],
    nextRank: progress >= 10 ? 0 : nextIndex + 1,
    clearedIds: Array.from(clearedIds),
  }
}

export function nextTopOpponent(profile) {
  return topLadder(profile).next
}

export function advanceTopLadder(profile, opponentId, won) {
  const ladder = topLadder(profile)
  if (!won || !ladder.next || ladder.next.id !== opponentId) {
    return { profile, advanced: false, done: ladder.done }
  }
  const topProgress = Math.min(10, ladder.progress + 1)
  return {
    profile: {
      ...profile,
      topProgress,
      topCleared: Array.from(new Set([...(profile.topCleared || []), opponentId])),
    },
    advanced: true,
    done: topProgress >= 10,
  }
}

export function powerForRating(rating) {
  // 难度刻度只做轻微修正；胜负主要由词条组合与自动决策决定。
  return Math.min(1.08, Math.max(0.88, 0.88 + (Number(rating) || 0) / 1200 * 0.24))
}

export function styleForContracts(contracts) {
  if (!contracts?.length) return 'balanced'
  const melee = contracts.filter((contract) => ['melee', 'dash'].includes(contract.attack)).length
  const avgRange = contracts.reduce((sum, contract) => sum + (contract.preferredRange || 0), 0) / contracts.length
  const avgNovelty = contracts.reduce((sum, contract) => sum + (contract.novelty || 0), 0) / contracts.length
  if (melee >= 3) return 'aggressive'
  if (avgRange > 270) return 'cautious'
  if (avgNovelty > 0.52) return 'trickster'
  return 'balanced'
}

export function styleLabel(style) {
  return STYLE_LABELS[style] || STYLE_LABELS.balanced
}

export function getOpponentById(id) {
  return [...SITE_PRESETS, ...TOP_TEN, ...FUN_SEEDS].find((item) => item.id === id) || null
}

export function leaderboardRows(profile) {
  const bots = TOP_TEN.map((item) => ({
    ...item,
    score: Math.max(0, item.rating + (Number(profile?.botScores?.[item.id]) || 0)),
    kind: 'bot',
    isPlayer: false,
  }))
  const player = {
    id: 'player',
    name: profile?.name || '无名氏',
    epithet: '当前词条 · 本机记录',
    tier: 'player',
    rating: profile?.score || 0,
    score: profile?.score || 0,
    words: profile?.keywords || [],
    style: profile?.style || 'balanced',
    accent: '#2f6b53',
    seal: '我',
    desc: '你。',
    kind: 'player',
    isPlayer: true,
  }
  return [...bots, player].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    if (a.isPlayer !== b.isPlayer) return a.isPlayer ? 1 : -1
    return a.name.localeCompare(b.name, 'zh')
  })
}

export function playerRank(profile) {
  const rows = leaderboardRows(profile)
  return rows.findIndex((row) => row.isPlayer) + 1
}

export function topTenBoard(profile) {
  // 前十是固定榜单，不因玩家分数插入而挤掉 #10；玩家单独挂在最后一行。
  const bots = TOP_TEN.map((item) => ({
    ...item,
    score: Math.max(0, item.rating + (Number(profile?.botScores?.[item.id]) || 0)),
    kind: 'bot',
    isPlayer: false,
  }))
  return [
    ...bots,
    {
      id: 'player',
      name: profile?.name || '无名氏',
      epithet: '当前词条 · 本机记录',
      tier: 'player',
      rating: profile?.score || 0,
      score: profile?.score || 0,
      words: profile?.keywords || [],
      style: profile?.style || 'balanced',
      accent: '#2f6b53',
      seal: '我',
      desc: '你。',
      kind: 'player',
      isPlayer: true,
    },
  ]
}

export function funPool(saved) {
  const list = [...(Array.isArray(saved) ? saved : []), ...FUN_SEEDS]
  const seen = new Set()
  const out = []
  for (const item of list) {
    const key = fingerprintWords(item.words)
    if (seen.has(key)) continue
    seen.add(key)
    out.push({ ...item, tier: 'fun', kind: 'fun' })
  }
  return out.slice(0, 12)
}

export function makeFunSnapshot(profile, opponent, note) {
  if (!note) return null
  return {
    id: `fun-${Date.now().toString(36)}`,
    name: profile.name || '无名氏',
    epithet: `玩家留存 · ${note}`,
    tier: 'fun',
    rating: Math.max(120, opponent?.rating || 200),
    words: [...(profile.keywords || [])],
    style: profile.style || 'balanced',
    accent: '#2f6b53',
    seal: '存',
    desc: `留下这套词条，是因为它${note}。`,
    note,
    from: profile.name || '无名氏',
    at: Date.now(),
  }
}

export function opponentGainHint(profile, opponent) {
  const score = profile?.score || 0
  const rating = opponent?.rating || 100
  return Math.min(320, 14 + Math.round(rating * 0.16) + Math.round(Math.max(0, rating - score) * 0.12))
}
