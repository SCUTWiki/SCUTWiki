import { compileKeyword, isBroadWord } from './compiler.js'
import { compileWithAI } from './ai.js'
import { lookupWord, rememberContract, resolveEquivalent, findNearby } from './library.js'
import { validateWords, validateWord } from './text.js'

function labelFor(source) {
  if (source === 'ai') return 'AI 编译'
  if (source === 'library') return '词库复用'
  if (source === 'fallback') return '本地兜底'
  if (source === 'locked') return '泛词锁定'
  return '本地编译'
}

function labelForContract(contract, source) {
  const kind = contract?.recognition?.kind
  if (kind === 'ai') return 'AI 语义识别'
  if (kind === 'semantic') return source === 'ai' ? 'AI 语义识别' : '语义识别'
  if (kind === 'fallback') return source === 'ai' ? 'AI 自由解释' : '自由解释'
  return labelFor(source)
}

async function compileOne(rawWord, { aiConfig, signal, onProgress, index, contextWords = [] }) {
  const validation = validateWord(rawWord)
  if (!validation.ok) {
    return { error: validation, contract: null, source: 'error', label: '词条无效' }
  }
  const word = validation.raw
  const broad = isBroadWord(word)
  const progress = (status, extra = {}) => {
    onProgress?.({ index, word, status, ...extra })
  }
  progress('lookup')

  const cached = lookupWord(word, { fuzzy: !broad })
  if (cached) {
    const source = broad ? 'locked' : 'library'
    progress('done', { source, label: labelFor(source), contract: cached })
    return {
      contract: cached,
      source,
      label: labelFor(source),
      message: broad ? `泛词锁定为「${cached.skill}」` : `命中词库「${cached.skill}」`,
    }
  }

  const base = compileKeyword(word)
  if (broad) {
    const contract = rememberContract(base, { source: 'local' })
    progress('done', { source: 'locked', label: '泛词锁定', contract })
    return {
      contract,
      source: 'locked',
      label: '泛词锁定',
      message: `太泛，锁定为「${base.skill}」`,
    }
  }

  if (aiConfig?.enabled && aiConfig.apiKey) {
    progress('ai')
    try {
      const nearby = findNearby(word, 5)
      const result = await compileWithAI(word, base, nearby, aiConfig, signal, contextWords)
      let contract
      if (result.type === 'equivalent') {
        contract = resolveEquivalent(result.key, word)
        if (!contract) throw new Error('等价目标已被词库清理。')
        progress('done', { source: 'library', label: '词库复用', contract })
        return {
          contract,
          source: 'library',
          label: '词库复用',
          message: `AI 判定等价于「${contract.skill}」`,
        }
      }
      const stored = rememberContract(result.contract, { source: 'ai' })
      contract = stored
      const label = labelForContract(contract, 'ai')
      progress('done', { source: 'ai', label, contract })
      return { contract, source: 'ai', label, message: result.contract.aiNotes || 'AI 编译完成' }
    } catch (error) {
      if (signal?.aborted) throw error
      const contract = rememberContract(base, { source: 'local' })
      const label = labelForContract(contract, 'fallback')
      progress('done', { source: 'fallback', label, contract, error: error.message })
      return {
        contract,
        source: 'fallback',
        label,
        message: `AI 未完成：${error.message}`,
      }
    }
  }

  const contract = rememberContract(base, { source: 'local' })
  const label = labelForContract(contract, 'local')
  progress('done', { source: 'local', label, contract })
  return { contract, source: 'local', label, message: '本地机制编译完成' }
}

/**
 * 编译五个词。最多两个 AI 请求并发，避免把接口打爆；
 * 任一词失败都会退回确定性的本地编译器，保证斗兽场能开门。
 */
export async function compileBuild(words, options = {}) {
  const validation = validateWords(words)
  if (!validation.ok) {
    const error = new Error(validation.errors[0]?.message || '词条无效。')
    error.code = 'INVALID_WORDS'
    error.details = validation.errors
    throw error
  }
  const list = validation.parsed.map((item) => item.raw)
  const results = new Array(list.length)
  let cursor = 0
  const concurrency = Math.max(1, Math.min(2, options.concurrency || 2))

  async function worker() {
    while (cursor < list.length) {
      const index = cursor
      cursor += 1
      try {
        results[index] = await compileOne(list[index], {
          ...options,
          index,
          contextWords: list.filter((_, i) => i !== index),
        })
      } catch (error) {
        if (options.signal?.aborted) throw error
        const base = compileKeyword(list[index])
        const contract = rememberContract(base, { source: 'local' })
        results[index] = {
          contract,
          source: 'fallback',
          label: '本地兜底',
          message: error.message,
        }
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, worker))
  return {
    contracts: results.map((item) => item.contract),
    results,
    words: list,
  }
}

export function compileBuildLocal(words) {
  const validation = validateWords(words)
  if (!validation.ok) {
    const error = new Error(validation.errors[0]?.message || '词条无效。')
    error.code = 'INVALID_WORDS'
    error.details = validation.errors
    throw error
  }
  return validation.parsed.map((item) => {
    const cached = lookupWord(item.raw, { fuzzy: !isBroadWord(item.raw) })
    if (cached) return cached
    return rememberContract(compileKeyword(item.raw), { source: 'local' })
  })
}

const CHECK_FIELDS = [
  'key', 'skill', 'concept', 'form', 'attack', 'range', 'cooldown', 'damage', 'hits',
  'aoeRadius', 'projectileSpeed', 'effects', 'passive', 'desc',
]

export function consistencyCheck(words = ['烈焰', '青锋', '荆棘', '影步', '雷引', '火', '剑', '食堂']) {
  const rows = []
  let ok = true
  for (const word of words) {
    try {
      const first = compileKeyword(word)
      const second = compileKeyword(word)
      const differences = CHECK_FIELDS.filter(
        (field) => JSON.stringify(first[field]) !== JSON.stringify(second[field]),
      )
      if (differences.length) ok = false
      rows.push({
        word,
        ok: differences.length === 0,
        skill: first.skill,
        differences,
      })
    } catch (error) {
      rows.push({ word, ok: false, skill: '—', differences: [error.message] })
      ok = false
    }
  }
  return { ok, rows }
}
