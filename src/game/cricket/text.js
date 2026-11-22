import { fnv1a } from './hash.js'

// 常见繁体 / 异体字归一。只处理会出现在词条里的字，避免引入大词典。
const TRADITIONAL = {
  劍: '剑', 槍: '枪', 術: '术', 靈: '灵', 闇: '暗', 電: '电', 風: '风',
  燄: '焰', 龍: '龙', 鷹: '鹰', 獸: '兽', 蟲: '虫', 籐: '藤', 荊: '荆',
  鎧: '铠', 鐵: '铁', 鋼: '钢', 銀: '银', 時: '时', 間: '间', 門: '门',
  夢: '梦', 鏡: '镜', 葉: '叶', 樹: '树', 雲: '云', 霧: '雾', 鐘: '钟',
  鳴: '鸣', 聲: '声', 書: '书', 頁: '页', 筆: '笔', 紙: '纸', 讀: '读',
  學: '学', 試: '试', 績: '绩', 點: '点', 數: '数', 體: '体', 測: '测',
  軍: '军', 訓: '训', 隊: '队', 團: '团', 圖: '图', 館: '馆', 靜: '静',
  默: '默', 網: '网', 斷: '断', 遲: '迟', 到: '到', 鍬: '锹', 鏟: '铲',
  錘: '锤', 斧: '斧', 鉤: '钩', 鏈: '链', 鎖: '锁', 繩: '绳', 絲: '丝',
  線: '线', 針: '针', 鏡: '镜', 珠: '珠', 鈴: '铃', 鼓: '鼓', 琴: '琴',
  笛: '笛', 簫: '箫', 扇: '扇', 筆: '笔', 硯: '砚', 墨: '墨', 印: '印',
  章: '章', 符: '符', 咒: '咒', 陣: '阵', 壇: '坛', 爐: '炉', 熔: '熔',
  燼: '烬', 餘: '余', 溫: '温', 熱: '热', 烈: '烈', 焰: '焰', 焚: '焚',
  燃: '燃', 燒: '烧', 灼: '灼', 霜: '霜', 凍: '冻', 雪: '雪', 寒: '寒',
  冰: '冰', 凝: '凝', 滯: '滞', 緩: '缓', 速: '速', 疾: '疾', 閃: '闪',
  躍: '跃', 衝: '冲', 鋒: '锋', 斬: '斩', 劈: '劈', 刺: '刺', 貫: '贯',
  穿: '穿', 破: '破', 碎: '碎', 裂: '裂', 爆: '爆', 轟: '轰', 震: '震',
  暈: '晕', 麻: '麻', 痺: '痹', 毒: '毒', 腐: '腐', 蝕: '蚀', 疫: '疫',
  瘟: '瘟', 血: '血', 噬: '噬', 吸: '吸', 飲: '饮', 邪: '邪', 聖: '圣',
  陽: '阳', 輝: '辉', 耀: '耀', 癒: '愈', 療: '疗', 藥: '药', 泉: '泉',
  露: '露', 春: '春', 芽: '芽', 藤: '藤', 棘: '棘', 刺: '刺', 盾: '盾',
  壁: '壁', 甲: '甲', 護: '护', 禦: '御', 守: '守', 殼: '壳', 岩: '岩',
  山: '山', 土: '土', 地: '地', 石: '石', 沙: '沙', 海: '海', 潮: '潮',
  浪: '浪', 雨: '雨', 星: '星', 月: '月', 日: '日', 光: '光', 夜: '夜',
  晨: '晨', 昏: '昏', 影: '影', 魂: '魂', 念: '念', 心: '心', 幻: '幻',
  識: '识', 觀: '观', 眼: '眼', 耳: '耳', 口: '口', 舌: '舌', 足: '足',
  步: '步', 靴: '靴', 袍: '袍', 衣: '衣', 冠: '冠', 盔: '盔', 戒: '戒',
  鐲: '镯', 環: '环', 玉: '玉', 晶: '晶', 砂: '砂', 珠: '珠', 核: '核',
  機: '机', 械: '械', 齒: '齿', 輪: '轮', 蒸: '蒸', 汽: '汽', 炮: '炮',
  銃: '铳', 彈: '弹', 藥: '药', 弩: '弩', 矢: '矢', 弓: '弓', 箭: '箭',
  鏢: '镖', 刀: '刀', 刃: '刃', 匕: '匕', 首: '首', 鞭: '鞭', 爪: '爪',
  拳: '拳', 掌: '掌', 指: '指', 牙: '牙', 角: '角', 翼: '翼', 羽: '羽',
  群: '群', 狼: '狼', 虎: '虎', 蛇: '蛇', 鶴: '鹤', 鳥: '鸟', 魚: '鱼',
  門: '门', 空: '空', 界: '界', 域: '域', 場: '场', 領: '领', 時: '时',
  暫: '暂', 停: '停', 緩: '缓', 逆: '逆', 轉: '转', 回: '回', 響: '响',
  共: '共', 鳴: '鸣', 震: '震', 盪: '荡', 湯: '汤', 粥: '粥', 飯: '饭',
  麵: '面', 鹹: '咸', 辣: '辣', 甜: '甜', 酸: '酸', 苦: '苦', 咖: '咖',
  啡: '啡', 鬧: '闹', 鐘: '钟', 遲: '迟', 點: '点', 名: '名', 早: '早',
  八: '八', 課: '课', 堂: '堂', 宿: '宿', 舍: '舍', 食: '食', 堂: '堂',
}

// 只收纳“语义确实相同”的短词，避免把不同招式误判为同一条能力。
const SYNONYMS = {
  火焰: '烈焰', 烈火: '烈焰', 火炎: '烈焰',
  寒冰: '寒霜', 冰霜: '寒霜', 霜冻: '寒霜',
  雷电: '雷霆', 雷電: '雷霆', 紫电: '雷霆',
  疾风: '疾风', 迅风: '疾风', 风步: '疾风', 疾步: '疾风',
  巨剑: '巨剑', 大剑: '巨剑',
  影步: '影步', 瞬步: '影步', 闪现: '影步', 瞬移: '影步',
  铁壁: '铁壁', 铜墙铁壁: '铁壁', 护盾: '铁壁', 屏障: '铁壁',
  治疗: '回春', 治愈: '回春', 回血: '回春',
  荆棘: '荆棘', 反伤: '荆棘', 反弹: '荆棘', 尖刺: '荆棘',
  长弓: '猎弓', 弓箭: '猎弓',
  重锤: '重锤', 巨锤: '重锤', 大锤: '重锤',
  飞刀: '飞刀', 暗器: '飞刀', 飞镖: '飞刀',
  唤灵: '唤灵', 召唤: '唤灵', 召唤术: '唤灵',
  时停: '时滞', 缓时: '时滞', 时间: '时滞',
  黑洞: '引力井', 重力: '引力井', 漩涡: '引力井',
}

// 绝对化不再是“拒绝”，而是“成立，但必须留下破绽”。
// 这些词会被编译成绝对机制，另一边的反绝对或绝对结束后的破绽可以拆掉它。
const ABSOLUTE_RULES = [
  /无敌/, /必胜/, /必赢/, /不败/, /不死/, /永生/, /秒杀/, /秒赢/, /必杀/, /必中/,
  /绝对/, /必定/, /百分百/, /百分之百/, /100\s*%/, /无限/, /无穷/, /全能/,
  /全知/, /免疫一切/, /免疫所有/, /无视一切/, /无视所有/, /永远/, /永恒/,
  /直接胜利/, /瞬间获胜/, /一击必杀/,
]

// 试图控制斗兽场本身、而不是描述能力的词；这类仍然拒绝。
const META_RULES = [
  /投降/, /认输/, /暂停/, /暂停键/, /改名/, /换人/, /跳过/, /重开/, /结束游戏/,
  /删除/, /清空/, /重启/, /关机/, /退出/, /卡死/, /死机/, /管理员/, /外挂/,
  /开挂/, /锁血/, /改血/, /修改血量/, /代码/, /系统漏洞/, /bug/i, /gm/i, /root/i,
]

export class KeywordError extends Error {
  constructor(code, message, meta = {}) {
    super(message)
    this.name = 'KeywordError'
    this.code = code
    this.meta = meta
  }
}

export function rawToCompact(input) {
  let text = String(input ?? '')
  try {
    text = text.normalize('NFKC')
  } catch {
    // 老浏览器忽略
  }
  text = text.replace(/[\u3000\s]+/g, '')
  text = text.replace(/[^\p{L}\p{N}]/gu, '')
  text = text.toLowerCase()
  let out = ''
  for (const ch of text) out += TRADITIONAL[ch] || ch
  return out
}

export function canonicalize(input) {
  const compact = rawToCompact(input)
  return SYNONYMS[compact] || compact
}

export function wordLength(input) {
  return Array.from(String(input ?? '').trim()).length
}

export function findAbsolute(input) {
  const compact = rawToCompact(input)
  if (/^(100|一百|百分之百|百分百)$/.test(compact)) {
    return { kind: 'absolute', term: compact }
  }
  for (const rule of ABSOLUTE_RULES) {
    const match = compact.match(rule)
    if (match) return { kind: 'absolute', term: match[0] }
  }
  return null
}

export function findMeta(input) {
  const compact = rawToCompact(input)
  for (const rule of META_RULES) {
    const match = compact.match(rule)
    if (match) return { kind: 'meta', term: match[0] }
  }
  return null
}

export function validateWord(input) {
  const raw = String(input ?? '').trim()
  if (!raw) {
    return { ok: false, code: 'EMPTY', message: '还空着一个词。' }
  }
  if (wordLength(raw) > 16) {
    return { ok: false, code: 'TOO_LONG', message: '词条最多 16 个字，太长的概念会糊成一团。' }
  }
  const compact = rawToCompact(raw)
  if (!compact) {
    return { ok: false, code: 'EMPTY', message: '这个词没有可读的字。' }
  }
  const meta = findMeta(raw)
  if (meta) {
    return {
      ok: false,
      code: 'META',
      message: `「${meta.term}」是斗兽场的动作，不是词条。`,
      meta,
    }
  }
  return {
    ok: true,
    raw,
    compact,
    canonical: canonicalize(raw),
    length: wordLength(raw),
    absolute: findAbsolute(raw),
  }
}

export function validateWords(words) {
  const list = Array.from({ length: 5 }, (_, i) => String(words?.[i] ?? '').trim())
  const errors = []
  const seen = new Map()
  const parsed = []
  list.forEach((raw, index) => {
    const result = validateWord(raw)
    if (!result.ok) {
      errors.push({ index, code: result.code, message: result.message })
      parsed.push(null)
      return
    }
    if (seen.has(result.canonical)) {
      errors.push({
        index,
        code: 'DUPLICATE',
        message: `与第 ${seen.get(result.canonical) + 1} 格是同一个概念，换一个方向。`,
      })
    } else {
      seen.set(result.canonical, index)
    }
    parsed.push(result)
  })
  return { ok: errors.length === 0, errors, parsed }
}

export function charBigrams(text) {
  const chars = Array.from(text)
  if (chars.length === 0) return []
  if (chars.length === 1) return [chars[0]]
  const out = []
  for (let i = 0; i < chars.length - 1; i += 1) out.push(chars[i] + chars[i + 1])
  return out
}

export function textSimilarity(a, b) {
  const left = canonicalize(a)
  const right = canonicalize(b)
  if (!left || !right) return 0
  if (left === right) return 1
  const la = charBigrams(left)
  const lb = charBigrams(right)
  const sa = new Set(la)
  const sb = new Set(lb)
  let inter = 0
  for (const item of sa) if (sb.has(item)) inter += 1
  const dice = (2 * inter) / (sa.size + sb.size)
  const ca = new Set(Array.from(left))
  const cb = new Set(Array.from(right))
  let cinter = 0
  for (const item of ca) if (cb.has(item)) cinter += 1
  const jaccard = cinter / (ca.size + cb.size - cinter)
  const containment = left.includes(right) || right.includes(left) ? 0.18 : 0
  return Math.min(1, dice * 0.62 + jaccard * 0.38 + containment)
}

export function fingerprintWords(words) {
  const key = Array.from({ length: 5 }, (_, i) => rawToCompact(words?.[i] ?? '')).join('|')
  return `b${fnv1a(key).toString(36)}`
}

export function shortHash(text, mod = 1000) {
  return fnv1a(String(text)) % mod
}

export function formatSeconds(value) {
  const total = Math.max(0, Math.floor(value || 0))
  const m = String(Math.floor(total / 60)).padStart(2, '0')
  const s = String(total % 60).padStart(2, '0')
  return `${m}:${s}`
}
