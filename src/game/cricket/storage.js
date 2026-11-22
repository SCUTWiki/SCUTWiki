import { fingerprintWords } from './text.js'

const PREFIX = 'scutwiki.cricket'
const PROFILE_KEY = `${PREFIX}.profile.v1`
const FUN_KEY = `${PREFIX}.fun.v1`
const HISTORY_KEY = `${PREFIX}.history.v1`
const AI_KEY = `${PREFIX}.ai.v1`

export const STORAGE_KEYS = {
  profile: PROFILE_KEY,
  fun: FUN_KEY,
  history: HISTORY_KEY,
  ai: AI_KEY,
  library: `${PREFIX}.library.v3`,
}

function hasStorage() {
  try {
    return typeof window !== 'undefined' && Boolean(window.localStorage)
  } catch {
    return false
  }
}

export function readJSON(key, fallback) {
  if (!hasStorage()) return fallback
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

export function writeJSON(key, value) {
  if (!hasStorage()) return false
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

export function removeKey(key) {
  if (!hasStorage()) return
  try {
    window.localStorage.removeItem(key)
  } catch {
    // ignore
  }
}

export function defaultProfile() {
  return {
    version: 1,
    name: '无名氏',
    score: 0,
    buildKey: '',
    keywords: ['', '', '', '', ''],
    wins: 0,
    losses: 0,
    streak: 0,
    bestStreak: 0,
    matches: 0,
    topProgress: 0,
    topCleared: [],
    botScores: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}

export function loadProfile() {
  const saved = readJSON(PROFILE_KEY, null)
  if (!saved || typeof saved !== 'object') return defaultProfile()
  const base = defaultProfile()
  return {
    ...base,
    ...saved,
    keywords: Array.from({ length: 5 }, (_, i) => String(saved.keywords?.[i] ?? '')),
    score: Math.max(0, Number(saved.score) || 0),
    topProgress: Math.min(10, Math.max(0, Number(saved.topProgress) || 0)),
    topCleared: Array.isArray(saved.topCleared) ? saved.topCleared.map(String).slice(0, 10) : [],
    botScores: saved.botScores && typeof saved.botScores === 'object' ? saved.botScores : {},
  }
}

export function saveProfile(profile) {
  const next = { ...profile, updatedAt: Date.now() }
  writeJSON(PROFILE_KEY, next)
  return next
}

export function applyBuildToProfile(profile, keywords, { resetScore = false } = {}) {
  const buildKey = fingerprintWords(keywords)
  const changed = buildKey !== profile.buildKey
  return {
    ...profile,
    buildKey,
    keywords: [...keywords],
    score: resetScore && changed ? 0 : profile.score,
    streak: resetScore && changed ? 0 : profile.streak,
    topProgress: resetScore && changed ? 0 : profile.topProgress,
    topCleared: resetScore && changed ? [] : profile.topCleared,
    botScores: resetScore && changed ? {} : profile.botScores,
    updatedAt: Date.now(),
  }
}

export function defaultAIConfig() {
  return {
    enabled: false,
    baseURL: 'https://api.deepseek.com/v1',
    model: 'deepseek-chat',
    apiKey: '',
    timeout: 18000,
    lastTest: null,
  }
}

export function loadAIConfig() {
  const saved = readJSON(AI_KEY, null)
  if (!saved || typeof saved !== 'object') return defaultAIConfig()
  return { ...defaultAIConfig(), ...saved, apiKey: String(saved.apiKey || '') }
}

export function saveAIConfig(config) {
  const next = { ...defaultAIConfig(), ...config }
  writeJSON(AI_KEY, next)
  return next
}

export function loadFunPool() {
  const saved = readJSON(FUN_KEY, null)
  return Array.isArray(saved) ? saved : null
}

export function saveFunPool(list) {
  writeJSON(FUN_KEY, list)
}

export function loadHistory() {
  const saved = readJSON(HISTORY_KEY, null)
  return Array.isArray(saved) ? saved : []
}

export function pushHistory(entry) {
  const list = loadHistory()
  list.unshift(entry)
  writeJSON(HISTORY_KEY, list.slice(0, 20))
}

export function loadLibraryRaw() {
  return readJSON(STORAGE_KEYS.library, null)
}

export function saveLibraryRaw(value) {
  return writeJSON(STORAGE_KEYS.library, value)
}
