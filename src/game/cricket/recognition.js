// 新词识别：把没见过的词拆成“意象 / 词根 / 梗”，再给出可执行的
// 元素、形态、攻击方式与机制倾向。它不负责数值，数值仍由 compiler 决定。
import { clamp } from './hash.js'

// 每个组只描述“这个词像什么”，权重高的组会覆盖泛化元素。
const GROUPS = [
  {
    name: '赛博/量子/机械',
    re: /赛博|量子|电子|机械|纳米|超导|芯片|算法|代码|程序|服务器|网络|wifi|机器人|人工智能|ai|AI|bug|模型|数据|齿轮|电路|激光|核聚变/,
    element: 'machine',
    concepts: ['科技', '机械'],
    tags: ['机械', '数据'],
    attacks: { beam: 2, aoe: 1, projectile: 1 },
    mechanics: { silence: 2, clone: 2, gamble: 2, reflect: 1, echo: 1 },
    damage: 'wild',
    volatility: 0.42,
    weight: 1.35,
  },
  {
    name: '木鱼/佛系',
    re: /木鱼|佛|禅|敲|念经|超度/,
    element: 'sound',
    form: 'bell',
    concepts: ['声音', '禅意'],
    tags: ['声音', '木'],
    attacks: { beam: 2, aoe: 1 },
    mechanics: { silence: 4, echo: 3, charge: 2, cleanse: 1 },
    damage: 'light',
    volatility: 0.12,
    weight: 2.1,
  },
  {
    name: '火锅/食堂/外卖',
    re: /火锅|烧烤|奶茶|咖啡|泡面|外卖|食堂|饭|菜|肉|辣|烫|烤|炸|锅|灶|炉|炭|勺|厨/,
    element: 'fire',
    form: 'hammer',
    concepts: ['火', '烹饪', '校园'],
    tags: ['火', '烹饪'],
    attacks: { aoe: 2, projectile: 1, melee: 1 },
    mechanics: { zone: 3, steal: 2, taunt: 2, gamble: 1 },
    damage: 'heavy',
    volatility: 0.2,
    weight: 1.45,
  },
  {
    name: '高数/绩点/DDL',
    re: /高数|线代|概率|微积分|数学|方程|函数|绩点|考试|挂科|论文|答辩|报告|实验|组会|ddl|deadline|截止|选课|抢课|查寝|辅导员|导师|军训|早八|熬夜|实习|秋招|面试|内卷|躺平|摆烂|摸鱼|打工人|社畜|作业/,
    element: 'mind',
    form: 'fan',
    concepts: ['校园', '学业', '压力'],
    tags: ['学业', '压力'],
    attacks: { beam: 2, aoe: 1 },
    mechanics: { fear: 3, execute: 2, sleep: 1, silence: 1, charge: 1, steal: 1 },
    damage: 'light',
    volatility: 0.24,
    weight: 1.7,
  },
  {
    name: '图书馆/考场',
    re: /图书馆|自习|考场|静|默|禁|封|哑|噤|闭|消音/,
    element: 'sound',
    concepts: ['安静', '禁声'],
    tags: ['静', '禁'],
    attacks: { beam: 2, aoe: 1 },
    mechanics: { silence: 4, zone: 2, seal: 1 },
    damage: 'light',
    volatility: 0.1,
    weight: 1.6,
  },
  {
    name: '辅导员/点名',
    re: /辅导员|导师|教官|点名|查寝|口令|集合/,
    element: 'mind',
    concepts: ['校园', '权威'],
    tags: ['点名', '压力'],
    attacks: { beam: 1, melee: 1 },
    mechanics: { taunt: 3, fear: 3, seal: 2 },
    damage: 'light',
    volatility: 0.15,
    weight: 1.8,
  },
  {
    name: '床/睡眠/摆烂',
    re: /床|被子|枕头|宿舍|午睡|睡|困|眠|梦|晕|躺|摆烂|摸鱼|赖床/,
    element: 'mind',
    concepts: ['睡眠', '松弛'],
    tags: ['睡', '梦'],
    attacks: { aoe: 1, beam: 1, self: 1 },
    mechanics: { sleep: 4, cleanse: 2, fear: 1, shrink: 1 },
    damage: 'light',
    volatility: 0.16,
    weight: 1.7,
  },
  {
    name: '火',
    re: /火|焰|炎|燃|烧|烤|炸|烫|辣|焚|烟|热/,
    element: 'fire',
    concepts: ['火'],
    tags: ['火'],
    attacks: { aoe: 2, projectile: 1 },
    mechanics: { zone: 2, mark: 1, gamble: 1 },
    damage: 'heavy',
    volatility: 0.18,
    weight: 1,
  },
  {
    name: '冰',
    re: /冰|霜|寒|冻|雪|冷|凛|凝/,
    element: 'ice',
    concepts: ['冰'],
    tags: ['冰'],
    attacks: { projectile: 2, beam: 1, aoe: 1 },
    mechanics: { root: 2, zone: 1, echo: 1 },
    damage: 'light',
    volatility: 0.12,
    weight: 1,
  },
  {
    name: '雷',
    re: /雷|电|霆|闪|磁|弧/,
    element: 'lightning',
    concepts: ['雷'],
    tags: ['雷'],
    attacks: { beam: 2, chain: 1, aoe: 1 },
    mechanics: { chain: 2, execute: 1, echo: 1 },
    damage: 'heavy',
    volatility: 0.3,
    weight: 1,
  },
  {
    name: '风',
    re: /风|气|疾|飞|羽|轻|快|旋|飙/,
    element: 'wind',
    concepts: ['风'],
    tags: ['风'],
    attacks: { dash: 1, projectile: 2, melee: 1 },
    mechanics: { echo: 2, swap: 1, counter: 1 },
    damage: 'light',
    volatility: 0.16,
    weight: 1,
  },
  {
    name: '水',
    re: /水|雨|潮|浪|海|河|流|露|泉|波/,
    element: 'water',
    concepts: ['水'],
    tags: ['水'],
    attacks: { projectile: 1, beam: 1, aoe: 1 },
    mechanics: { zone: 2, cleanse: 2, echo: 1 },
    damage: 'light',
    volatility: 0.14,
    weight: 1,
  },
  {
    name: '土/山',
    re: /土|岩|山|石|沙|地|崩|震|岳|峰|壁/,
    element: 'earth',
    concepts: ['土', '山'],
    tags: ['土', '山'],
    attacks: { aoe: 2, melee: 1 },
    mechanics: { root: 2, zone: 2, execute: 1 },
    damage: 'heavy',
    volatility: 0.24,
    weight: 1,
  },
  {
    name: '光',
    re: /光|圣|阳|明|辉|日|昼|闪/,
    element: 'light',
    concepts: ['光'],
    tags: ['光'],
    attacks: { beam: 2, projectile: 1 },
    mechanics: { reflect: 2, cleanse: 1, execute: 1 },
    damage: 'light',
    volatility: 0.12,
    weight: 1,
  },
  {
    name: '暗/鬼',
    re: /暗|影|夜|阴|鬼|幽|冥|邪/,
    element: 'shadow',
    concepts: ['暗', '鬼'],
    tags: ['暗', '影'],
    attacks: { dash: 1, projectile: 1, summon: 1 },
    mechanics: { clone: 2, sleep: 1, fear: 2, steal: 1 },
    damage: 'light',
    volatility: 0.2,
    weight: 1,
  },
  {
    name: '毒',
    re: /毒|腐|疫|菌|瘴|酸|蚀/,
    element: 'poison',
    concepts: ['毒'],
    tags: ['毒'],
    attacks: { projectile: 1, aoe: 1 },
    mechanics: { mark: 3, zone: 2, steal: 1 },
    damage: 'light',
    volatility: 0.18,
    weight: 1,
  },
  {
    name: '血',
    re: /血|骨|肉|尸|噬|吸|祭|魂/,
    element: 'blood',
    concepts: ['血'],
    tags: ['血'],
    attacks: { melee: 2, aoe: 1 },
    mechanics: { steal: 2, execute: 2, mark: 1 },
    damage: 'heavy',
    volatility: 0.22,
    weight: 1,
  },
  {
    name: '木/自然',
    re: /木|花|草|藤|林|叶|根|芽|春|生|芽|枝/,
    element: 'nature',
    concepts: ['自然', '生长'],
    tags: ['木', '生'],
    attacks: { summon: 1, projectile: 1, aoe: 1 },
    mechanics: { root: 2, cleanse: 1, clone: 2 },
    damage: 'light',
    volatility: 0.12,
    weight: 1,
  },
  {
    name: '心/梦',
    re: /心|念|灵|魂|梦|幻|精|神|意|识|想|脑|记忆/,
    element: 'mind',
    concepts: ['心', '梦'],
    tags: ['心', '梦'],
    attacks: { beam: 2, aoe: 1 },
    mechanics: { sleep: 2, fear: 1, silence: 2, echo: 1 },
    damage: 'light',
    volatility: 0.18,
    weight: 1,
  },
  {
    name: '声音',
    re: /声|音|铃|钟|歌|噪|啸|笛|琴|鼓|响|鸣/,
    element: 'sound',
    concepts: ['声音'],
    tags: ['声'],
    attacks: { beam: 1, aoe: 2 },
    mechanics: { silence: 2, echo: 2, taunt: 2 },
    damage: 'light',
    volatility: 0.16,
    weight: 1,
  },
  {
    name: '术法',
    re: /魔|法|咒|符|术|玄|秘|奥|仙|神|妖|佛|道|经|阵/,
    element: 'arcane',
    concepts: ['术法'],
    tags: ['术'],
    attacks: { projectile: 1, beam: 1, aoe: 1 },
    mechanics: { seal: 2, echo: 2, zone: 1 },
    damage: 'light',
    volatility: 0.2,
    weight: 1,
  },
  {
    name: '时间',
    re: /时|秒|瞬|间|暂停|慢|迟|回|旧|未来/,
    element: 'time',
    concepts: ['时间'],
    tags: ['时'],
    attacks: { beam: 1, aoe: 1 },
    mechanics: { zone: 2, root: 2, echo: 2 },
    damage: 'light',
    volatility: 0.2,
    weight: 1.2,
  },
  {
    name: '空间',
    re: /空间|门|洞|折跃|传送|瞬移|虚空|宇宙|星|界/,
    element: 'space',
    concepts: ['空间'],
    tags: ['空'],
    attacks: { dash: 2, projectile: 1 },
    mechanics: { swap: 3, zone: 1, chain: 1 },
    damage: 'light',
    volatility: 0.18,
    weight: 1.2,
  },
  {
    name: '铁/盾',
    re: /铁|钢|甲|盾|壁|护|锁|壳|铠|不坏/,
    element: 'steel',
    form: 'shield',
    concepts: ['铁', '守'],
    tags: ['铁', '守'],
    attacks: { melee: 1, self: 1 },
    mechanics: { counter: 2, reflect: 2, charge: 1 },
    damage: 'heavy',
    volatility: 0.1,
    weight: 1,
  },
  {
    name: '书/纸/故事',
    re: /书|纸|页|笔|墨|字|文|章|诗|故事|卷|册|印|言/,
    element: 'mind',
    form: 'fan',
    concepts: ['书', '故事'],
    tags: ['书', '文'],
    attacks: { projectile: 2, beam: 1 },
    mechanics: { echo: 2, taunt: 2, seal: 1 },
    damage: 'light',
    volatility: 0.12,
    weight: 1.1,
  },
  {
    name: '日常物件',
    re: /手机|电脑|键盘|鼠标|耳机|充电宝|数据线|眼镜|口罩|雨伞|水杯|保温杯|饭卡|钥匙|箱|椅|桌|扫把|拖把|垃圾桶|书包|卡/,
    element: 'machine',
    concepts: ['物件', '日常'],
    tags: ['物', '日常'],
    attacks: { projectile: 1, melee: 1, self: 1 },
    mechanics: { taunt: 1, gamble: 1, steal: 1, reflect: 1 },
    damage: 'normal',
    volatility: 0.18,
    weight: 1.2,
  },
  {
    name: '兽群',
    re: /狼|虎|龙|蛇|鹰|猫|狗|鼠|蚁|蜂|鱼|鸟|兽|群|虫/,
    element: 'nature',
    concepts: ['兽', '群'],
    tags: ['兽'],
    attacks: { summon: 2, melee: 1, dash: 1 },
    mechanics: { clone: 2, chain: 1, mark: 2 },
    damage: 'heavy',
    volatility: 0.2,
    weight: 1.2,
  },
  {
    name: '拳脚',
    re: /拳|掌|指|爪|牙|头|撞|踢|踹|踩|跳|跑|滚|爬|摔|抱/,
    element: 'earth',
    form: 'gauntlet',
    concepts: ['身体', '搏斗'],
    tags: ['拳', '身'],
    attacks: { melee: 3, dash: 1 },
    mechanics: { charge: 2, chain: 1, execute: 1 },
    damage: 'heavy',
    volatility: 0.22,
    weight: 1.2,
  },
  {
    name: '偷/抢',
    re: /偷|抢|摸|顺|借|拿|夺|薅|抄/,
    element: 'shadow',
    form: 'dagger',
    concepts: ['偷', '顺手'],
    tags: ['偷'],
    attacks: { melee: 2, dash: 1 },
    mechanics: { steal: 4, taunt: 1, swap: 1 },
    damage: 'light',
    volatility: 0.16,
    weight: 1.6,
  },
  {
    name: '赌/抽',
    re: /赌|抽|随机|运气|骰|彩票|盲盒|梭哈|玄学|概率/,
    element: 'arcane',
    concepts: ['赌', '随机'],
    tags: ['赌'],
    attacks: { aoe: 1, projectile: 1, melee: 1 },
    mechanics: { gamble: 5 },
    damage: 'wild',
    volatility: 0.65,
    weight: 2,
  },
  {
    name: '净/愈',
    re: /净|洗|清|解|药|泉|露|沐|疗|愈|拂/,
    element: 'water',
    concepts: ['净化', '恢复'],
    tags: ['净'],
    attacks: { self: 2, beam: 1 },
    mechanics: { cleanse: 4, reflect: 1 },
    damage: 'light',
    volatility: 0.08,
    weight: 1.6,
  },
  {
    name: '缠/定',
    re: /缠|藤|根|钉|锁|定|胶|粘|桩|陷|缚|网/,
    element: 'nature',
    concepts: ['束缚'],
    tags: ['缠', '定'],
    attacks: { projectile: 1, aoe: 1 },
    mechanics: { root: 4, zone: 1, chain: 1 },
    damage: 'light',
    volatility: 0.1,
    weight: 1.5,
  },
  {
    name: '镜/反',
    re: /镜|反|弹|折返|回弹|映/,
    element: 'arcane',
    form: 'orb',
    concepts: ['镜', '反射'],
    tags: ['镜', '反'],
    attacks: { projectile: 1, beam: 1 },
    mechanics: { reflect: 4, clone: 1, swap: 1 },
    damage: 'light',
    volatility: 0.15,
    weight: 1.5,
  },
  {
    name: '分身',
    re: /分|影|复制|克隆|替身|人偶|傀儡|镜像/,
    element: 'shadow',
    concepts: ['分身', '复制'],
    tags: ['分', '影'],
    attacks: { summon: 2, melee: 1 },
    mechanics: { clone: 4, swap: 1, echo: 1 },
    damage: 'light',
    volatility: 0.16,
    weight: 1.5,
  },
  {
    name: '斩/杀',
    re: /斩|杀|决|断|终|灭|死|绝|葬/,
    element: 'steel',
    form: 'sword',
    concepts: ['斩杀'],
    tags: ['斩'],
    attacks: { melee: 2, beam: 1 },
    mechanics: { execute: 3, mark: 1 },
    damage: 'heavy',
    volatility: 0.22,
    weight: 1.3,
  },
  {
    name: '牵引',
    re: /牵|引|拉|吸|链|绳|丝|线/,
    element: 'steel',
    form: 'whip',
    concepts: ['牵引'],
    tags: ['牵'],
    attacks: { projectile: 1, melee: 1 },
    mechanics: { chain: 4, root: 1 },
    damage: 'light',
    volatility: 0.12,
    weight: 1.4,
  },
  {
    name: '领域',
    re: /场|阵|池|域|炉|领|圈|区|界/,
    element: 'arcane',
    concepts: ['领域'],
    tags: ['场'],
    attacks: { aoe: 3 },
    mechanics: { zone: 4 },
    damage: 'normal',
    volatility: 0.14,
    weight: 1.3,
  },
  {
    name: '回响',
    re: /回|响|残|音|余|复|重/,
    element: 'sound',
    concepts: ['回响'],
    tags: ['回'],
    attacks: { beam: 1, projectile: 1 },
    mechanics: { echo: 4 },
    damage: 'light',
    volatility: 0.12,
    weight: 1.4,
  },
  {
    name: '刻印',
    re: /印|痕|刻|标|记|裂/,
    element: 'arcane',
    concepts: ['刻印'],
    tags: ['印'],
    attacks: { melee: 1, projectile: 1 },
    mechanics: { mark: 4 },
    damage: 'normal',
    volatility: 0.12,
    weight: 1.4,
  },
  {
    name: '蓄势',
    re: /蓄|聚|凝|藏|势|酿/,
    element: 'mind',
    concepts: ['蓄势'],
    tags: ['蓄'],
    attacks: { beam: 1, self: 1 },
    mechanics: { charge: 4 },
    damage: 'light',
    volatility: 0.1,
    weight: 1.4,
  },
  {
    name: '巨大',
    re: /巨大|巨型|膨|胀|胖|肥|吨|气球/,
    element: 'earth',
    concepts: ['巨大'],
    tags: ['巨'],
    attacks: { melee: 2, aoe: 1 },
    mechanics: { inflate: 3, charge: 1 },
    damage: 'heavy',
    volatility: 0.2,
    weight: 1.5,
  },
  {
    name: '微小',
    re: /小|微|迷你|袖珍|细|针|尘|蚁/,
    element: 'wind',
    concepts: ['微小'],
    tags: ['微'],
    attacks: { projectile: 1, melee: 1 },
    mechanics: { shrink: 3, echo: 1 },
    damage: 'light',
    volatility: 0.15,
    weight: 1.4,
  },
  {
    name: '抽象',
    re: /命运|因果|意义|虚无|存在|孤独|希望|绝望|不可名状|未知|混沌|真理/,
    element: 'mind',
    concepts: ['抽象'],
    tags: ['玄'],
    attacks: { beam: 1, aoe: 1 },
    mechanics: { fear: 2, silence: 2, echo: 2, zone: 1 },
    damage: 'normal',
    volatility: 0.3,
    weight: 1.2,
  },
  {
    name: '英文梗',
    re: /ddl|deadline|bug|code|exam|test|paper|lab|offer|intern|kpi|ppt|due|gpa|ai|wifi/,
    element: 'mind',
    concepts: ['校园', '英文梗'],
    tags: ['梗', '学业'],
    attacks: { beam: 1, aoe: 1 },
    mechanics: { fear: 2, charge: 1, execute: 2, silence: 1 },
    damage: 'light',
    volatility: 0.2,
    weight: 1.8,
  },
]

const MECHANIC_LABELS = {
  mark: '刻印', echo: '残响', counter: '反击', zone: '留场领域', swap: '换位',
  seal: '封招', chain: '牵引', charge: '蓄势', execute: '斩杀', taunt: '点名',
  fear: '吓退', sleep: '催眠', shrink: '缩小', inflate: '膨胀', steal: '顺手牵羊',
  cleanse: '净手', gamble: '梭哈', root: '定身', silence: '封麦', clone: '分身', reflect: '镜返',
}

const ATTACK_KEYS = ['melee', 'projectile', 'beam', 'aoe', 'dash', 'self', 'summon']
const FORM_KEYS = ['sword', 'spear', 'bow', 'staff', 'orb', 'hammer', 'shield', 'claws', 'whip', 'scythe', 'dagger', 'fan', 'bell', 'cannon', 'gauntlet', 'none']

function pickWeighted(map, fallback = null) {
  let best = fallback
  let score = fallback ? 0.01 : -1
  for (const [key, value] of Object.entries(map || {})) {
    if (value > score) {
      best = key
      score = value
    }
  }
  return best
}

function unique(list, limit = 8) {
  return Array.from(new Set(list.filter(Boolean))).slice(0, limit)
}

function confidenceLevel(confidence) {
  if (confidence >= 0.72) return 'high'
  if (confidence >= 0.46) return 'medium'
  return 'low'
}

/**
 * @param {string} compact 已归一化的紧凑词条
 * @param {{ knownElement?: string, knownForm?: string, knownAttack?: string, recognized?: boolean, hasRecipe?: boolean, locked?: boolean }} context
 */
export function analyzeNewWord(compact, context = {}) {
  const text = String(compact || '')
  const elementScores = {}
  const formScores = {}
  const attackScores = {}
  const mechanicScores = {}
  const tags = []
  const concepts = []
  const matched = []
  const matchedGroups = []
  const damageScores = { heavy: 0, light: 0, wild: 0, normal: 0 }
  let volatility = 0.08
  let weightSum = 0

  const addScore = (map, key, value) => {
    if (!key || !value) return
    map[key] = (map[key] || 0) + value
  }

  for (const group of GROUPS) {
    const match = text.match(group.re)
    if (!match) continue
    const termWeight = (group.weight || 1) * (1 + Math.min(2, match[0].length * 0.22))
    weightSum += termWeight
    matched.push(match[0])
    matchedGroups.push(group)
    if (group.element) addScore(elementScores, group.element, termWeight)
    if (group.form && FORM_KEYS.includes(group.form)) addScore(formScores, group.form, termWeight)
    for (const [key, value] of Object.entries(group.attacks || {})) {
      if (ATTACK_KEYS.includes(key)) addScore(attackScores, key, value * termWeight)
    }
    for (const [key, value] of Object.entries(group.mechanics || {})) {
      addScore(mechanicScores, key, value * termWeight)
    }
    if (group.damage && damageScores[group.damage] !== undefined) damageScores[group.damage] += termWeight
    if (group.volatility) volatility = Math.max(volatility, group.volatility)
    tags.push(...(group.tags || []))
    concepts.push(...(group.concepts || []))
  }

  // 已有词根/形态作为弱证据，避免新词把原本的剑/火读丢。
  if (context.recognized && context.knownElement && matchedGroups.length === 0) {
    addScore(elementScores, context.knownElement, 1.2)
  }
  if (context.recognized && context.knownForm && FORM_KEYS.includes(context.knownForm)) addScore(formScores, context.knownForm, 1.4)
  if (context.recognized && context.knownAttack && ATTACK_KEYS.includes(context.knownAttack)) addScore(attackScores, context.knownAttack, 1.2)

  const hasSignal = matchedGroups.length > 0
  let kind = 'fallback'
  if (context.hasRecipe) kind = 'recipe'
  else if (context.locked || context.recognized) kind = 'lexicon'
  else if (hasSignal) kind = 'semantic'

  const matchedChars = new Set()
  for (const term of matched) {
    for (const char of term) matchedChars.add(char)
  }
  const coverage = text.length ? matchedChars.size / text.length : 0
  let confidence = 0.24 + Math.min(0.34, weightSum * 0.035) + coverage * 0.28
  if (matchedGroups.length >= 2) confidence += 0.06
  if (context.recognized) confidence += 0.12
  if (context.hasRecipe) confidence = 0.97
  if (context.locked && !context.hasRecipe) confidence = Math.max(confidence, 0.78)
  if (kind === 'fallback') confidence = Math.min(confidence, 0.3)
  confidence = clamp(Number(confidence.toFixed(2)), 0.18, 0.98)

  const element = context.hasRecipe || context.locked
    ? (context.knownElement || pickWeighted(elementScores, 'arcane'))
    : (pickWeighted(elementScores, context.knownElement || 'arcane'))
  const form = context.hasRecipe
    ? (context.knownForm || pickWeighted(formScores, null))
    : (context.knownForm || pickWeighted(formScores, null))
  const attack = context.hasRecipe || context.locked
    ? (context.knownAttack || pickWeighted(attackScores, 'projectile'))
    : (pickWeighted(attackScores, context.knownAttack || 'projectile'))

  const damage = pickWeighted(damageScores, 'normal')
  const suggestedMechanics = Object.entries(mechanicScores)
    .sort((a, b) => b[1] - a[1])
    .map(([type]) => type)
    .filter((type) => type !== 'absolute' && type !== 'antiAbsolute')
    .slice(0, 3)

  const labels = unique(matchedGroups.map((group) => group.name))
  const topConcepts = unique(concepts, 4)
  const topTags = unique(tags, 6)
  const rationale = context.hasRecipe
    ? `命中「${text}」的专属配方，按 ${topConcepts.join(' / ') || '词根'} 解释。`
    : hasSignal
      ? `拆词：${labels.join(' + ')}；判为${topConcepts.join(' / ') || '自由意象'}，主机制：${suggestedMechanics.slice(0, 2).map((type) => MECHANIC_LABELS[type] || type).join('、') || '按招式兜底'}。`
      : context.recognized
        ? `只认出了${context.knownElement || context.knownForm || context.knownAttack || '招式'}词根，按旧词处理。`
        : '没有稳定词根，只能自由解释；建议换一个更具体的词。'

  return {
    isNew: !context.hasRecipe && !context.locked && !context.recognized,
    kind,
    confidence,
    level: confidenceLevel(confidence),
    element,
    form,
    attack,
    damage,
    volatility,
    concepts: topConcepts,
    tags: topTags,
    matched: unique(matched, 6),
    mechanics: suggestedMechanics,
    rationale,
  }
}
