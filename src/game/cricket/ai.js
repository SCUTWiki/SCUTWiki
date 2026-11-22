import { ELEMENTS, FORMS } from './lexicon.js'
import { sanitizeAIContract } from './compiler.js'

const ATTACKS = ['melee', 'projectile', 'beam', 'aoe', 'dash', 'self', 'summon']
const EFFECTS = [
  'burn', 'bleed', 'poison', 'slow', 'stun', 'knockback', 'lifesteal', 'heal',
  'shield', 'haste', 'regen', 'thorns', 'focus', 'weaken', 'sunder', 'vulnerable', 'pull',
]

export class AICompileError extends Error {
  constructor(message, code = 'AI_ERROR') {
    super(message)
    this.name = 'AICompileError'
    this.code = code
  }
}

function endpoint(baseURL, path) {
  return `${String(baseURL || '').replace(/\/+$/, '')}${path}`
}

function buildPrompt(word, base, nearby, contextWords = []) {
  const nearbyText = nearby.length
    ? nearby
      .map((entry) => `- key=${entry.key}｜技能=${entry.skill}｜类型=${entry.attackLabel}｜${entry.desc}`)
      .join('\n')
    : '（词库为空）'
  const contextText = contextWords.length
    ? `这套构筑里的其他词：${contextWords.join('、')}。可以适度呼应它们，但不要替它们生成能力。`
    : ''
  return `你是《限定词斗蛐蛐》的机制编译器。你的唯一职责是把玩家的一个概念词编译成可被确定性战斗引擎执行的“机制合约”，不判断胜负、不生成故事。

玩家词条：${word}
${contextText}
本地语义编译器已经给出一个保守基线（只作为数值参考）：
${JSON.stringify({
    skill: base.skill,
    concept: base.concept,
    form: base.form,
    attack: base.attack,
    range: base.range,
    cooldown: base.cooldown,
    damage: base.damage,
    effects: base.effects,
    mechanics: base.mechanics,
    absolute: base.absolute,
  })}

能力库中可能相近的已有能力（如果语义确实等价，必须复用，不能另造一套）：
${nearbyText}

规则：
1. 如果玩家词条与某个已有能力“语义等价”（只是同义词/写法不同），只输出 {"equivalentTo":"该能力的 key"}。
2. 否则输出一个 JSON 对象，字段如下：
{
  "skill": "招式名，2-10个汉字",
  "concept": "fire|ice|lightning|wind|earth|steel|nature|water|light|shadow|poison|blood|sound|mind|time|space|machine|arcane",
  "form": "sword|spear|bow|staff|orb|hammer|shield|claws|whip|scythe|dagger|fan|bell|cannon|gauntlet|none",
  "attack": "melee|projectile|beam|aoe|dash|self|summon",
  "range": 40到560的整数,
  "cooldown": 0.9到12.0,
  "damage": 3到210（self 为 0）,
  "hits": 1到4,
  "windup": 0.1到1.1,
  "projectileSpeed": 360到900（非远程为0）,
  "aoeRadius": 0到160,
  "preferredRange": 36到500,
  "effects": [{"type":"${EFFECTS.join('|')}","duration":1,"amount":8,"ratio":0.15,"factor":0.7,"chance":0.3}],
  "mechanics": [
    {"type":"mark|echo|counter|zone|swap|seal|chain|charge|execute|absolute|antiAbsolute|taunt|fear|sleep|shrink|inflate|steal|cleanse|gamble|root|silence|clone|reflect","name":"机制短名","desc":"机制描述","delay":0.8,"ratio":0.35,"duration":2,"threshold":0.25,"bonus":0.5,"radius":96}
  ],
  "passive": {"moveSpeed":1.0,"armor":0.03,"lifesteal":0.05,"thorns":0,"crit":0.04,"regen":0.4},
  "gear": {"name":"装备名，2-8个汉字"},
  "desc": "一句20-60字的作战描述",
  "tags": ["2-4个短标签"],
  "recognition": {"concepts":["2-4个意象/词根"],"confidence":0.75,"rationale":"怎么拆这个词的，一句话"},
  "notes": "为什么这样编译，一句话"
}
3. 每个技能至少要有 1 个 mechanics，最多 3 个。机制优先于数值：mark=刻印引爆，echo=延迟残响，counter=受击反击，zone=持续领域，swap=换位，seal=封招，chain=牵引，charge=蓄势，execute=残血斩杀，absolute=绝对，antiAbsolute=抵消绝对，taunt=点名逼进，fear=吓退，sleep=催眠，shrink=缩小，inflate=膨胀，steal=偷护盾/状态，cleanse=净化，gamble=随机大伤害，root=定身，silence=封招，clone=分身，reflect=镜返。
4. 单技能伤害允许大起大落：轻/细/雨/风可以只有 3-15，重/山/锤/爆/赌可以到 80-210，但要用冷却、蓄力、破绽或随机性买单；不要把一切都压成 20-30。范围越大、控制越强，单次伤害通常越低。
5. 绝对词不是禁止词：absolute 机制会成立，但必须给出 breakDuration / breakAmp，并且 antiAbsolute 可以抵消它；不要生成“永久无敌”“战斗开始即获胜”这类无法被破绽或反绝对拆掉的机制。
6. 遇到没见过的词，先拆词根/意象/梗（例如“量子火锅”=科技+火+烹饪+持续；“赛博木鱼”=机械+声音+禅意），再决定元素、形态和机制。不要把新词硬塞进旧模板。
7. 必须让这个能力体现出词条的具体意象，不要只给数值。允许把“装备/术法/身法”表达为 form、gear、effects、attack、mechanics 的组合。
8. 只输出 JSON，不要 Markdown 代码块。

可用概念：${Object.entries(ELEMENTS).map(([k, v]) => `${k}=${v.label}`).join('，')}
可用形态：${Object.entries(FORMS).map(([k, v]) => `${k}=${v.label}`).join('，')}
可用机制：mark=刻印，echo=残响，counter=反击架势，zone=领域，swap=换位，seal=封招，chain=牵引，charge=蓄势，execute=斩杀，absolute=绝对，antiAbsolute=反绝对`
}

function extractJSON(text) {
  const raw = String(text || '').trim()
  if (!raw) throw new AICompileError('模型返回了空内容。', 'EMPTY')
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const body = fenced ? fenced[1] : raw
  const start = body.indexOf('{')
  const end = body.lastIndexOf('}')
  if (start < 0 || end <= start) throw new AICompileError('模型没有返回 JSON。', 'BAD_JSON')
  try {
    return JSON.parse(body.slice(start, end + 1))
  } catch {
    throw new AICompileError('模型返回的 JSON 无法解析。', 'BAD_JSON')
  }
}

async function callChat(config, body, signal) {
  const response = await fetch(endpoint(config.baseURL, '/chat/completions'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(body),
    signal,
  })
  if (!response.ok) {
    const text = await response.text().catch(() => '')
    let detail = text.slice(0, 240)
    try {
      const parsed = JSON.parse(text)
      detail = parsed.error?.message || parsed.message || detail
    } catch {
      // keep raw
    }
    throw new AICompileError(`模型接口返回 ${response.status}：${detail || response.statusText}`, 'HTTP')
  }
  const data = await response.json()
  const content = data?.choices?.[0]?.message?.content
  if (!content) throw new AICompileError('模型响应里没有内容。', 'EMPTY_RESPONSE')
  return extractJSON(content)
}

/**
 * 用 OpenAI 兼容接口编译一个词条。
 * 返回 { type: 'contract'|'equivalent', contract?, key? }
 */
export async function compileWithAI(word, base, nearby, config, externalSignal, contextWords = []) {
  if (!config?.apiKey) throw new AICompileError('还没有填写 API Key。', 'NO_KEY')
  if (!config?.baseURL) throw new AICompileError('还没有填写接口地址。', 'NO_URL')
  if (!config?.model) throw new AICompileError('还没有填写模型名。', 'NO_MODEL')

  const controller = new AbortController()
  const timeout = Math.max(5000, Math.min(45000, Number(config.timeout) || 18000))
  const timer = setTimeout(() => controller.abort(), timeout)
  const abort = () => controller.abort()
  if (externalSignal) externalSignal.addEventListener('abort', abort, { once: true })

  const messages = [
    {
      role: 'system',
      content: '你是一个严谨的游戏机制编译器。只输出符合要求的 JSON，不输出解释性前后缀。',
    },
    { role: 'user', content: buildPrompt(word, base, nearby, contextWords) },
  ]
  const body = {
    model: config.model,
    temperature: 0.3,
    max_tokens: 1400,
    response_format: { type: 'json_object' },
    messages,
  }

  try {
    let payload
    try {
      payload = await callChat(config, body, controller.signal)
    } catch (error) {
      // 一部分兼容接口不支持 response_format，退回普通模式再试一次。
      if (error?.code === 'HTTP' && /response_format|json_object|400|422/i.test(error.message)) {
        const { response_format: _ignored, ...rest } = body
        payload = await callChat(config, rest, controller.signal)
      } else {
        throw error
      }
    }
    if (payload?.equivalentTo) {
      const key = String(payload.equivalentTo)
      const hit = nearby.find((entry) => entry.key === key)
      if (hit) return { type: 'equivalent', key }
      throw new AICompileError('模型声明等价，但目标不在相近词表中。', 'BAD_EQUIVALENT')
    }
    const candidate = payload?.contract && typeof payload.contract === 'object' ? payload.contract : payload
    const contract = sanitizeAIContract(candidate, base)
    return { type: 'contract', contract }
  } catch (error) {
    if (error?.name === 'AbortError') throw new AICompileError('模型编译超时，已回退本地编译器。', 'TIMEOUT')
    if (error instanceof AICompileError) throw error
    throw new AICompileError(error?.message || '模型编译失败。', 'NETWORK')
  } finally {
    clearTimeout(timer)
    if (externalSignal) externalSignal.removeEventListener('abort', abort)
  }
}

export async function testAIConfig(config) {
  if (!config?.apiKey) throw new AICompileError('请先填写 API Key。', 'NO_KEY')
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 12000)
  try {
    const response = await fetch(endpoint(config.baseURL, '/models'), {
      headers: { Authorization: `Bearer ${config.apiKey}` },
      signal: controller.signal,
    })
    if (!response.ok) {
      const text = await response.text().catch(() => '')
      throw new AICompileError(`连接失败 ${response.status}：${text.slice(0, 120)}`, 'HTTP')
    }
    return true
  } catch (error) {
    if (error?.name === 'AbortError') throw new AICompileError('连接超时。', 'TIMEOUT')
    throw error
  } finally {
    clearTimeout(timer)
  }
}
