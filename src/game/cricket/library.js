import { textSimilarity, rawToCompact } from './text.js'
import { loadLibraryRaw, saveLibraryRaw } from './storage.js'

const LIBRARY_VERSION = 3
const MAX_ENTRIES = 420
const FUZZY_THRESHOLD = 0.8

let store = null

function normalizeEntry(entry) {
  if (!entry || typeof entry !== 'object' || !entry.key || !entry.contract) return null
  return {
    key: String(entry.key),
    aliases: Array.from(new Set((entry.aliases || []).map((a) => String(a)).filter(Boolean))),
    contract: entry.contract,
    source: entry.source || entry.contract.source || 'local',
    hits: Math.max(0, Number(entry.hits) || 0),
    createdAt: Number(entry.createdAt) || Date.now(),
    updatedAt: Number(entry.updatedAt) || Date.now(),
    libraryVersion: Number(entry.libraryVersion) || LIBRARY_VERSION,
  }
}

function ensure() {
  if (store) return store
  const raw = loadLibraryRaw()
  const list = raw?.version === LIBRARY_VERSION ? raw.entries : null
  store = {
    version: LIBRARY_VERSION,
    entries: Array.isArray(list) ? list.map(normalizeEntry).filter(Boolean) : [],
  }
  return store
}

function persist() {
  const data = ensure()
  if (data.entries.length > MAX_ENTRIES) {
    data.entries.sort((a, b) => b.hits - a.hits || b.updatedAt - a.updatedAt)
    data.entries = data.entries.slice(0, MAX_ENTRIES)
  }
  const ok = saveLibraryRaw({ version: LIBRARY_VERSION, entries: data.entries })
  if (!ok && data.entries.length > 80) {
    data.entries = data.entries.slice(0, Math.floor(data.entries.length * 0.7))
    saveLibraryRaw({ version: LIBRARY_VERSION, entries: data.entries })
  }
}

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

export function materialize(entry, rawWord) {
  if (!entry) return null
  const contract = clone(entry.contract)
  contract.word = rawWord || entry.contract.word
  contract.aliasOf = entry.key
  contract.libraryHit = true
  contract.libraryHits = entry.hits
  return contract
}

function addAlias(entry, rawWord) {
  const compact = rawToCompact(rawWord)
  const canonical = entry.contract.key
  for (const value of [rawWord, compact, canonical]) {
    const normalized = String(value || '').trim()
    if (normalized && !entry.aliases.includes(normalized)) entry.aliases.push(normalized)
  }
  if (entry.aliases.length > 16) entry.aliases = entry.aliases.slice(-16)
}

export function lookupWord(rawWord, { fuzzy = true } = {}) {
  const data = ensure()
  const compact = rawToCompact(rawWord)
  if (!compact) return null
  const exact = data.entries.find(
    (entry) => entry.key === compact || entry.aliases.includes(compact) || entry.aliases.includes(rawWord),
  )
  if (exact) {
    exact.hits += 1
    exact.updatedAt = Date.now()
    addAlias(exact, rawWord)
    persist()
    return materialize(exact, rawWord)
  }
  if (!fuzzy) return null

  let best = null
  let bestScore = 0
  for (const entry of data.entries) {
    // 泛词锁定出来的能力不参与模糊合并，否则“剑”会被“火剑”吃掉。
    if (entry.contract.locked) continue
    let score = textSimilarity(entry.key, rawWord)
    if (score < 0.5) continue
    if (score >= FUZZY_THRESHOLD) {
      if (score > bestScore) {
        best = entry
        bestScore = score
      }
    }
  }
  if (!best) return null
  best.hits += 1
  best.updatedAt = Date.now()
  addAlias(best, rawWord)
  persist()
  return materialize(best, rawWord)
}

export function rememberContract(contract, { source } = {}) {
  const data = ensure()
  if (!contract?.key) return null
  const existing = data.entries.find((entry) => entry.key === contract.key)
  if (existing) {
    existing.hits += 1
    existing.updatedAt = Date.now()
    addAlias(existing, contract.word)
    persist()
    return materialize(existing, contract.word)
  }
  const entry = {
    key: contract.key,
    aliases: [contract.word, contract.key, rawToCompact(contract.word)].filter(Boolean),
    contract: clone(contract),
    source: source || contract.source || 'local',
    hits: 1,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    libraryVersion: LIBRARY_VERSION,
  }
  data.entries.push(entry)
  persist()
  return materialize(entry, contract.word)
}

export function resolveEquivalent(key, rawWord) {
  const data = ensure()
  const compact = rawToCompact(key || '')
  const entry = data.entries.find(
    (item) => item.key === key || item.key === compact || item.aliases.includes(compact),
  )
  if (!entry) return null
  entry.hits += 1
  entry.updatedAt = Date.now()
  addAlias(entry, rawWord)
  persist()
  return materialize(entry, rawWord)
}

export function findNearby(rawWord, limit = 5) {
  const data = ensure()
  const scored = data.entries
    .map((entry) => ({
      key: entry.key,
      skill: entry.contract.skill,
      attack: entry.contract.attack,
      attackLabel: entry.contract.attackLabel,
      concept: entry.contract.concept,
      desc: entry.contract.desc,
      locked: Boolean(entry.contract.locked),
      score: Number(textSimilarity(entry.key, rawWord).toFixed(3)),
    }))
    .filter((item) => item.score >= 0.3)
    .sort((a, b) => b.score - a.score)
  return scored.slice(0, limit)
}

export function libraryStats() {
  const data = ensure()
  let ai = 0
  let local = 0
  let hits = 0
  let locked = 0
  for (const entry of data.entries) {
    if (entry.source === 'ai') ai += 1
    else local += 1
    hits += entry.hits
    if (entry.contract.locked) locked += 1
  }
  return {
    total: data.entries.length,
    ai,
    local,
    hits,
    locked,
    lastUpdated: data.entries.reduce((max, entry) => Math.max(max, entry.updatedAt), 0),
  }
}

export function listLibrary() {
  const data = ensure()
  return data.entries
    .slice()
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .map((entry) => ({
      key: entry.key,
      aliases: entry.aliases.slice(),
      contract: clone(entry.contract),
      source: entry.source,
      hits: entry.hits,
      updatedAt: entry.updatedAt,
    }))
}

export function clearLibrary() {
  store = { version: LIBRARY_VERSION, entries: [] }
  persist()
}

export function libraryVersion() {
  return LIBRARY_VERSION
}
