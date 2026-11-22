// 词条语义词典：把玩家的自由词映射到一套稳定的“机制合约”枚举。
// 这里刻意不追求覆盖所有中文，只保证方向性词条有可解释的结果，
// 其余词条走确定性兜底，不会卡死。

export const ELEMENTS = {
  fire: {
    label: '火', glyph: '焰', color: '#c55832', soft: '#efc3a9', ink: '#7d2f17',
    status: 'burn', verb: '灼烧', gear: '焰纹', tag: '火',
  },
  ice: {
    label: '冰', glyph: '霜', color: '#6d9bb8', soft: '#c9dfe8', ink: '#315b70',
    status: 'slow', verb: '冻缓', gear: '霜骨', tag: '冰',
  },
  lightning: {
    label: '雷', glyph: '电', color: '#b28d2c', soft: '#ecdb9d', ink: '#6b5212',
    status: 'stun', verb: '感电', gear: '雷篆', tag: '雷',
  },
  wind: {
    label: '风', glyph: '风', color: '#6f9b83', soft: '#cfe0d4', ink: '#365c49',
    status: 'haste', verb: '推进', gear: '风翎', tag: '风',
  },
  earth: {
    label: '土', glyph: '岳', color: '#8a6a49', soft: '#ddcbb4', ink: '#513a24',
    status: 'stagger', verb: '镇压', gear: '岩脊', tag: '土',
  },
  steel: {
    label: '金', glyph: '锋', color: '#7b8288', soft: '#d5d8d6', ink: '#424a4e',
    status: 'bleed', verb: '破甲', gear: '玄铁', tag: '金',
  },
  nature: {
    label: '木', glyph: '藤', color: '#5d8954', soft: '#cfdcc4', ink: '#2f5229',
    status: 'regen', verb: '生长', gear: '青藤', tag: '木',
  },
  water: {
    label: '水', glyph: '潮', color: '#507f9a', soft: '#c5d9e2', ink: '#2b4f61',
    status: 'slow', verb: '浸湿', gear: '潮生', tag: '水',
  },
  light: {
    label: '光', glyph: '曜', color: '#c0a046', soft: '#eee1b6', ink: '#73601f',
    status: 'heal', verb: '辉映', gear: '曦光', tag: '光',
  },
  shadow: {
    label: '影', glyph: '夜', color: '#625a70', soft: '#d3cedb', ink: '#342f3d',
    status: 'lifesteal', verb: '侵蚀', gear: '夜行', tag: '影',
  },
  poison: {
    label: '毒', glyph: '瘴', color: '#7b8a3c', soft: '#d9dfb8', ink: '#46501e',
    status: 'poison', verb: '腐蚀', gear: '瘴色', tag: '毒',
  },
  blood: {
    label: '血', glyph: '噬', color: '#913f3b', soft: '#e2c1bd', ink: '#55201d',
    status: 'lifesteal', verb: '汲血', gear: '赤髓', tag: '血',
  },
  sound: {
    label: '声', glyph: '律', color: '#a4768e', soft: '#e4ced9', ink: '#603f50',
    status: 'stun', verb: '震魂', gear: '清商', tag: '声',
  },
  mind: {
    label: '心', glyph: '念', color: '#8173a0', soft: '#d8d0e5', ink: '#493d64',
    status: 'weaken', verb: '迷惑', gear: '镜心', tag: '心',
  },
  time: {
    label: '时', glyph: '瞬', color: '#9a8e74', soft: '#e1d8c5', ink: '#5c523e',
    status: 'slow', verb: '迟滞', gear: '刻痕', tag: '时',
  },
  space: {
    label: '空', glyph: '界', color: '#6e7fa4', soft: '#ccd4e4', ink: '#3a4968',
    status: 'pull', verb: '折叠', gear: '界隙', tag: '空',
  },
  machine: {
    label: '机', glyph: '枢', color: '#92784e', soft: '#dfd0b5', ink: '#584628',
    status: 'sunder', verb: '过载', gear: '铜枢', tag: '机',
  },
  arcane: {
    label: '奥', glyph: '秘', color: '#7d6fa8', soft: '#d7d0e7', ink: '#463c6b',
    status: 'echo', verb: '奥能', gear: '星砂', tag: '奥',
  },
}

export const ELEMENT_KEYS = Object.keys(ELEMENTS)

// 顺序很重要：越靠前的词根越具体。
const ELEMENT_PATTERNS = [
  ['machine', /机|械|齿|轮|蒸|汽|炮|铳|弹|弩|枢|铜|铁匠|锻|炉心/],
  ['lightning', /雷|电|霆|霹雳|紫电/],
  ['poison', /毒|腐|瘴|疫|瘟|蚀/],
  ['ice', /冰|霜|寒|冻|雪|凝|凛|冬/],
  ['fire', /火|炎|焰|焚|燃|灼|熔|炉|烬|阳|赤|朱|丹|彤/],
  ['blood', /血|噬|汲|祭/],
  ['shadow', /影|暗|夜|幽|冥|黑|暮|暮色/],
  ['light', /光|明|曜|辉|圣|曦|晨/],
  ['nature', /木|林|藤|花|草|叶|芽|春|生|森|苔|根|荆|棘|狼|虎|鹿|鹰|隼|鸟|兽|虫/],
  ['water', /水|雨|潮|浪|海|雾|云|露|泉|渊/],
  ['wind', /风|岚|气|羽|翼|疾|迅|飘|飓/],
  ['earth', /土|地|山|岩|石|沙|尘|岳|峰|壁|坝|阱|陷/],
  ['steel', /金|铁|钢|银|铜|刃|锋|剑|刀|枪|甲|盾/],
  ['sound', /声|音|歌|琴|钟|鼓|鸣|笛|箫|铃|唱|吼|律/],
  ['mind', /心|念|梦|幻|魂|灵|识|意|神|境|忆/],
  ['time', /时|瞬|刻|秒|缓|滞|久|古|轮转/],
  ['space', /空|界|域|门|阵|星|宇|宙|折|跃|隙/],
  ['arcane', /魔|奥|秘|符|咒|术|法|巫|晶|砂/],
]

export const FORMS = {
  sword: { label: '剑', gear: '剑', glyph: '剑', melee: true },
  spear: { label: '枪', gear: '枪', glyph: '枪', melee: true },
  bow: { label: '弓', gear: '弓', glyph: '弓', melee: false },
  staff: { label: '杖', gear: '杖', glyph: '杖', melee: false },
  orb: { label: '珠', gear: '珠', glyph: '珠', melee: false },
  hammer: { label: '锤', gear: '锤', glyph: '锤', melee: true },
  shield: { label: '盾', gear: '盾', glyph: '盾', melee: true },
  claws: { label: '爪', gear: '爪', glyph: '爪', melee: true },
  whip: { label: '鞭', gear: '鞭', glyph: '鞭', melee: true },
  scythe: { label: '镰', gear: '镰', glyph: '镰', melee: true },
  dagger: { label: '匕', gear: '匕', glyph: '匕', melee: true },
  fan: { label: '扇', gear: '扇', glyph: '扇', melee: false },
  bell: { label: '铃', gear: '铃', glyph: '铃', melee: false },
  cannon: { label: '铳', gear: '铳', glyph: '铳', melee: false },
  gauntlet: { label: '拳', gear: '拳套', glyph: '拳', melee: true },
  none: { label: '手', gear: '', glyph: '手', melee: true },
}

// 兵器优先于法术：写“火剑”时，玩家想要的是带火的剑，不是一根法杖。
const FORM_PATTERNS = [
  ['cannon', /炮|铳|筒|榴弹|火器/],
  ['bow', /弓|箭|弩|矢|弦/],
  ['spear', /枪|矛|戟|棍|棒|杵/],
  ['hammer', /锤|斧|钺|砧|锭|勺|铲|崩山|山崩|开山/],
  ['shield', /盾|壁|甲|壳|铠|护心镜/],
  ['whip', /鞭|链|锁|绳|丝|线|缠/],
  ['scythe', /镰|勾|钩/],
  ['dagger', /匕|短刃|短刀|牙|刺/],
  ['claws', /爪|拳|掌|指|拳套|护手|臂铠/],
  ['fan', /扇|羽/],
  ['bell', /铃|钟|鼓|琴|笛|箫|号|角/],
  ['orb', /珠|球|晶|核|镜|心|印|符|石|星|丹/],
  ['staff', /杖|笔|旗|幡|简|卷/],
  ['sword', /剑|刀|刃|锋|斩|劈/],
]

const SUMMON_PATTERNS = /召唤|唤灵|唤|傀儡|分身|狼群|群狼|猎鹰|鹰犬|机关兽|虫群|蜂群|蛇群|鸦群|式神|灵兽|仆从|小兵|影子分身|人偶/
const SELF_PATTERNS = /护盾|铁壁|屏障|守护|护体|金钟|治疗|治愈|回春|再生|恢复|静心|冥想|调息|凝神|聚气|荆棘|反伤|御守|护甲|铁甲|铠甲|战甲|心法|轻身|加速|狂暴|蓄力|过载|淬火|咖啡|续命|鹰眼|心眼|扎根|不动|站桩|打坐|深呼吸/
const DASH_PATTERNS = /步|闪|瞬|跃|突进|冲锋|折跃|位移|遁|穿梭|疾行|飞扑|突袭|掠|疾风|追风|御风|乘风|奔/
const BEAM_PATTERNS = /射线|激光|光束|落雷|雷击|审判|圣光|死光|镭射|贯穿|一线|目光|凝视|极光|剑光|剑气|光柱|脉冲|雷霆/
const AOE_PATTERNS = /爆|炸|裂|轰|陨|地震|领域|阵|雾|云|雨|风暴|潮|漩涡|黑洞|引力|池|场|焦土|瘴|毒云|花海|落叶|回响|共鸣|歌声|钟声|余烬|火星|火种|雷池|花开|藤蔓|缠绕|结界|陷阱|地雷|埋伏|阱/
const PROJECTILE_PATTERNS = /弓|箭|矢|镖|弹|炮|飞|射|投|掷|球|锥|针|符|珠|气|波|月|星|钉|梭|镖|风刃|风刀|风切/

export const ATTACK_LABELS = {
  melee: '近战',
  projectile: '远程',
  beam: '光束',
  aoe: '范围',
  dash: '位移',
  self: '护体',
  summon: '召唤',
}

export const ATTACK_COLORS = {
  melee: '#8e4a35',
  projectile: '#4b6d7d',
  beam: '#b08a35',
  aoe: '#8a5a6e',
  dash: '#4d6b58',
  self: '#8d7b4f',
  summon: '#5d6e8a',
}

// 泛词“热度锁定表”：一个太泛的词，会被锁定到站内最有辨识度的那一个方向。
// 这张表可以直接替换成线上热度接口的结果，结构保持不变。
export const BROAD_CONCEPTS = {
  强: { skill: '崩山拳', element: 'earth', form: 'gauntlet', attack: 'melee', note: '力量类泛词' },
  强强: { skill: '崩山拳', element: 'earth', form: 'gauntlet', attack: 'melee', note: '力量类泛词' },
  厉害: { skill: '崩山拳', element: 'earth', form: 'gauntlet', attack: 'melee', note: '力量类泛词' },
  牛: { skill: '崩山拳', element: 'earth', form: 'gauntlet', attack: 'melee', note: '力量类泛词' },
  强大: { skill: '崩山拳', element: 'earth', form: 'gauntlet', attack: 'melee', note: '力量类泛词' },
  力量: { skill: '巨力锤', element: 'earth', form: 'hammer', attack: 'melee', note: '力量类泛词' },
  大力: { skill: '巨力锤', element: 'earth', form: 'hammer', attack: 'melee', note: '力量类泛词' },
  快: { skill: '疾风步', element: 'wind', form: 'none', attack: 'dash', note: '速度类泛词' },
  速度: { skill: '疾风步', element: 'wind', form: 'none', attack: 'dash', note: '速度类泛词' },
  敏捷: { skill: '疾风步', element: 'wind', form: 'none', attack: 'dash', note: '速度类泛词' },
  迅捷: { skill: '疾风步', element: 'wind', form: 'none', attack: 'dash', note: '速度类泛词' },
  火: { skill: '烈焰喷射', element: 'fire', form: 'staff', attack: 'projectile', note: '元素类泛词' },
  水: { skill: '高压水刃', element: 'water', form: 'staff', attack: 'beam', note: '元素类泛词' },
  风: { skill: '风刃', element: 'wind', form: 'fan', attack: 'projectile', note: '元素类泛词' },
  雷: { skill: '落雷', element: 'lightning', form: 'staff', attack: 'beam', note: '元素类泛词' },
  电: { skill: '落雷', element: 'lightning', form: 'staff', attack: 'beam', note: '元素类泛词' },
  冰: { skill: '寒霜锥', element: 'ice', form: 'orb', attack: 'projectile', note: '元素类泛词' },
  寒: { skill: '寒霜锥', element: 'ice', form: 'orb', attack: 'projectile', note: '元素类泛词' },
  冷: { skill: '寒霜锥', element: 'ice', form: 'orb', attack: 'projectile', note: '元素类泛词' },
  光: { skill: '裁决光刃', element: 'light', form: 'sword', attack: 'beam', note: '元素类泛词' },
  暗: { skill: '暗影突袭', element: 'shadow', form: 'dagger', attack: 'dash', note: '元素类泛词' },
  黑暗: { skill: '暗影突袭', element: 'shadow', form: 'dagger', attack: 'dash', note: '元素类泛词' },
  土: { skill: '地隆刺', element: 'earth', form: 'spear', attack: 'aoe', note: '元素类泛词' },
  地: { skill: '地隆刺', element: 'earth', form: 'spear', attack: 'aoe', note: '元素类泛词' },
  防御: { skill: '不动铁壁', element: 'steel', form: 'shield', attack: 'self', note: '防御类泛词' },
  防守: { skill: '不动铁壁', element: 'steel', form: 'shield', attack: 'self', note: '防御类泛词' },
  铁壁: { skill: '不动铁壁', element: 'steel', form: 'shield', attack: 'self', note: '防御类泛词' },
  攻击: { skill: '破甲击', element: 'steel', form: 'sword', attack: 'melee', note: '攻击类泛词' },
  伤害: { skill: '破甲击', element: 'steel', form: 'sword', attack: 'melee', note: '攻击类泛词' },
  输出: { skill: '破甲击', element: 'steel', form: 'sword', attack: 'melee', note: '攻击类泛词' },
  治疗: { skill: '回春术', element: 'nature', form: 'staff', attack: 'self', note: '恢复类泛词' },
  回春: { skill: '回春术', element: 'nature', form: 'staff', attack: 'self', note: '恢复类泛词' },
  回复: { skill: '回春术', element: 'nature', form: 'staff', attack: 'self', note: '恢复类泛词' },
  召唤: { skill: '唤灵', element: 'mind', form: 'none', attack: 'summon', note: '召唤类泛词' },
  唤灵: { skill: '唤灵', element: 'mind', form: 'none', attack: 'summon', note: '召唤类泛词' },
  魔法: { skill: '奥术飞弹', element: 'arcane', form: 'orb', attack: 'projectile', note: '法术类泛词' },
  法术: { skill: '奥术飞弹', element: 'arcane', form: 'orb', attack: 'projectile', note: '法术类泛词' },
  术法: { skill: '奥术飞弹', element: 'arcane', form: 'orb', attack: 'projectile', note: '法术类泛词' },
  剑: { skill: '青锋斩', element: 'steel', form: 'sword', attack: 'melee', note: '兵器类泛词' },
  刀: { skill: '断水刀', element: 'steel', form: 'sword', attack: 'melee', note: '兵器类泛词' },
  弓: { skill: '穿杨箭', element: 'steel', form: 'bow', attack: 'projectile', note: '兵器类泛词' },
  拳: { skill: '崩拳', element: 'steel', form: 'gauntlet', attack: 'melee', note: '兵器类泛词' },
  毒: { skill: '腐毒云', element: 'poison', form: 'staff', attack: 'aoe', note: '元素类泛词' },
  血: { skill: '血刃', element: 'blood', form: 'dagger', attack: 'melee', note: '元素类泛词' },
  时滞: { skill: '时滞领域', element: 'time', form: 'orb', attack: 'aoe', note: '时间类泛词' },
  时间: { skill: '时滞领域', element: 'time', form: 'orb', attack: 'aoe', note: '时间类泛词' },
  空间: { skill: '折跃', element: 'space', form: 'none', attack: 'dash', note: '空间类泛词' },
  音乐: { skill: '震魂钟', element: 'sound', form: 'bell', attack: 'aoe', note: '声音类泛词' },
  声音: { skill: '震魂钟', element: 'sound', form: 'bell', attack: 'aoe', note: '声音类泛词' },
  声: { skill: '震魂钟', element: 'sound', form: 'bell', attack: 'aoe', note: '声音类泛词' },
  梦: { skill: '迷梦', element: 'mind', form: 'fan', attack: 'aoe', note: '心灵类泛词' },
  机械: { skill: '机关连弩', element: 'machine', form: 'cannon', attack: 'summon', note: '机关类泛词' },
  自然: { skill: '荆棘缠绕', element: 'nature', form: 'whip', attack: 'aoe', note: '自然类泛词' },
  植物: { skill: '荆棘缠绕', element: 'nature', form: 'whip', attack: 'aoe', note: '自然类泛词' },
  动物: { skill: '狼群召唤', element: 'nature', form: 'none', attack: 'summon', note: '召唤类泛词' },
  钱: { skill: '金元攻势', element: 'machine', form: 'cannon', attack: 'projectile', note: '校园类泛词' },
  金钱: { skill: '金元攻势', element: 'machine', form: 'cannon', attack: 'projectile', note: '校园类泛词' },
  钞能力: { skill: '金元攻势', element: 'machine', form: 'cannon', attack: 'projectile', note: '校园类泛词' },
  学习: { skill: '绩点压制', element: 'mind', form: 'staff', attack: 'beam', note: '校园类泛词' },
  考试: { skill: '绩点压制', element: 'mind', form: 'staff', attack: 'beam', note: '校园类泛词' },
  绩点: { skill: '绩点压制', element: 'mind', form: 'staff', attack: 'beam', note: '校园类泛词' },
  早八: { skill: '早八怨气', element: 'shadow', form: 'none', attack: 'aoe', note: '校园类泛词' },
  食堂: { skill: '食堂大勺', element: 'machine', form: 'hammer', attack: 'melee', note: '校园类泛词' },
  校园网: { skill: '断网术', element: 'machine', form: 'bell', attack: 'beam', note: '校园类泛词' },
  体测: { skill: '千米冲刺', element: 'wind', form: 'none', attack: 'dash', note: '校园类泛词' },
  外卖: { skill: '投掷外卖', element: 'machine', form: 'cannon', attack: 'projectile', note: '校园类泛词' },
  熬夜: { skill: '熬夜续命', element: 'blood', form: 'none', attack: 'self', note: '校园类泛词' },
  挂科: { skill: '挂科诅咒', element: 'mind', form: 'staff', attack: 'projectile', note: '校园类泛词' },
  军训: { skill: '烈日口令', element: 'light', form: 'bell', attack: 'beam', note: '校园类泛词' },
  图书馆: { skill: '静默领域', element: 'sound', form: 'bell', attack: 'aoe', note: '校园类泛词' },
  宿舍: { skill: '宿舍锁门', element: 'earth', form: 'shield', attack: 'self', note: '校园类泛词' },
}

export const CAMPUS_WORDS = /早八|食堂|校园网|体测|外卖|熬夜|挂科|军训|图书馆|宿舍|绩点|考试|高数|选课|抢课|查寝|辅导员|校车|快递|四六级|论文|答辩|实习|秋招/

export function detectElement(text) {
  for (const [key, re] of ELEMENT_PATTERNS) {
    if (re.test(text)) return key
  }
  return null
}

export function detectForm(text) {
  for (const [key, re] of FORM_PATTERNS) {
    if (re.test(text)) return key
  }
  return null
}

export function hasAttackWord(text) {
  return SUMMON_PATTERNS.test(text)
    || SELF_PATTERNS.test(text)
    || BEAM_PATTERNS.test(text)
    || DASH_PATTERNS.test(text)
    || AOE_PATTERNS.test(text)
    || PROJECTILE_PATTERNS.test(text)
}

export function detectAttack(text, form, element) {
  if (SUMMON_PATTERNS.test(text)) return 'summon'
  if (SELF_PATTERNS.test(text)) return 'self'
  if (BEAM_PATTERNS.test(text)) return 'beam'
  if (DASH_PATTERNS.test(text)) return 'dash'
  if (AOE_PATTERNS.test(text)) return 'aoe'
  if (PROJECTILE_PATTERNS.test(text)) return 'projectile'
  if (form && FORMS[form] && FORMS[form].melee) return 'melee'
  if (form === 'bow') return 'projectile'
  if (form && !FORMS[form]?.melee) return 'projectile'
  if (element === 'steel' || element === 'blood') return 'melee'
  return 'projectile'
}

export function elementForAttack(element) {
  return ELEMENTS[element] || ELEMENTS.arcane
}
