<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useTheme } from '../../composables/useTheme'
import { validateWords, fingerprintWords } from '../../game/cricket/text.js'
import { compileBuild, compileBuildLocal, consistencyCheck } from '../../game/cricket/compileService.js'
import { testAIConfig } from '../../game/cricket/ai.js'
import {
  SITE_PRESETS,
  funPool,
  playerRank,
  topTenBoard,
  topLadder,
  topRankOf,
  isTopTenId,
  advanceTopLadder,
  styleForContracts,
  powerForRating,
  makeFunSnapshot,
} from '../../game/cricket/roster.js'
import {
  applyBuildToProfile,
  loadAIConfig,
  loadFunPool,
  loadProfile,
  pushHistory,
  saveAIConfig,
  saveFunPool,
  saveProfile,
} from '../../game/cricket/storage.js'
import { applyMatchResult } from '../../game/cricket/scoring.js'
import { clearLibrary, libraryStats, listLibrary } from '../../game/cricket/library.js'
import KeywordForge from './KeywordForge.vue'
import CompileStrip from './CompileStrip.vue'
import OpponentBoard from './OpponentBoard.vue'
import BattleStage from './BattleStage.vue'
import '../../assets/cricket.css'

const { theme, toggle: toggleTheme } = useTheme()

const EXAMPLES = [
  ['青锋', '疾风', '荆棘', '影步', '雷引'],
  ['烈焰', '寒霜', '雷引', '疾风', '静心'],
  ['狼群', '陷阱', '雷池', '焦土', '回响'],
  ['铁壁', '回春', '荆棘', '金钟', '静心'],
  ['食堂', '校园网', '早八', '体测', '绩点'],
  ['拳', '爪', '匕', '影步', '血刃'],
  ['镜面', '逆影', '回响', '裂痕', '空相'],
  ['熔炉', '铁壁', '蒸汽', '锻打', '余烬'],
  ['无敌', '反绝对', '青锋', '疾风', '静心'],
]

const profile = reactive(loadProfile())
const nameDraft = ref(profile.name || '无名氏')
const words = ref(normalizeWords(profile))
const aiConfig = reactive(loadAIConfig())
const aiDraft = reactive({ ...aiConfig })
const contracts = ref([])
const compileResults = ref([])
const compileProgress = ref([])
const compiling = ref(false)
const compileError = ref('')
const compiledFingerprint = ref(profile.buildKey || '')
const phase = ref('setup')
const battleConfig = ref(null)
const battleKey = ref(0)
const matchResult = ref(null)
const tab = ref('preset')
const funSaved = ref(loadFunPool() || [])
const librarySummary = ref(libraryStats())
const libraryRows = ref([])
const librarySearch = ref('')
const libraryOpen = ref(false)
const consistency = ref(null)
const aiOpen = ref(false)
const aiTesting = ref(false)
const aiTestMessage = ref('')
const renameOpen = ref(false)
const renameDraft = ref(profile.name || '')
const resetOpen = ref(false)
const pendingChallenge = ref(null)
const toast = ref('')
const opponentsEl = ref(null)
const forgeRef = ref(null)
const exampleIndex = ref(0)
let toastTimer = 0
let settledBattleSeed = null

const validation = computed(() => validateWords(words.value))
const wordErrors = computed(() => validation.value.errors)
const fingerprint = computed(() => fingerprintWords(words.value))
const stale = computed(() => contracts.value.length > 0 && fingerprint.value !== compiledFingerprint.value)
const hasCompiled = computed(() => contracts.value.length === 5 && !stale.value)
const aiEnabled = computed(() => Boolean(aiConfig.enabled && aiConfig.apiKey))
const aiLabel = computed(() => (aiEnabled.value ? `AI 编译 · ${aiConfig.model}` : '本地语义编译 · 可离线'))
const topRows = computed(() => topTenBoard(profile))
const rank = computed(() => playerRank(profile))
const ladder = computed(() => topLadder(profile))
const nextTop = computed(() => ladder.value.next)
const funRows = computed(() => funPool(funSaved.value))
const libraryFiltered = computed(() => {
  const query = librarySearch.value.trim().toLowerCase()
  const rows = libraryRows.value
  if (!query) return rows.slice(0, 60)
  return rows
    .filter((row) => `${row.key} ${row.contract?.skill} ${row.aliases?.join(' ')}`.toLowerCase().includes(query))
    .slice(0, 60)
})
const currentOpponent = computed(() => battleConfig.value?.opponent || null)
const score = computed(() => profile.score || 0)

function normalizeWords(source) {
  const list = Array.from({ length: 5 }, (_, i) => String(source?.keywords?.[i] ?? ''))
  return list.some((word) => word.trim()) ? list : [...EXAMPLES[0]]
}

function showToast(message) {
  toast.value = message
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toast.value = ''
  }, 2600)
}

function saveName() {
  const next = String(nameDraft.value || '').trim().slice(0, 12) || '无名氏'
  profile.name = next
  nameDraft.value = next
  saveProfile(profile)
}

function syncName() {
  const next = String(nameDraft.value || '').trim().slice(0, 12) || '无名氏'
  if (next !== profile.name) {
    profile.name = next
    nameDraft.value = next
    saveProfile(profile)
  }
  return next
}

function openRename() {
  renameDraft.value = profile.name || nameDraft.value || ''
  renameOpen.value = true
}

function applyRename() {
  const next = renameDraft.value.trim().slice(0, 12) || '无名氏'
  profile.name = next
  nameDraft.value = next
  saveProfile(profile)
  renameOpen.value = false
  showToast(`名字改为「${next}」。积分和词条都没有动。`)
}

function onWordsUpdate(next) {
  words.value = next
  compileError.value = ''
}

function useExample() {
  exampleIndex.value = (exampleIndex.value + 1) % EXAMPLES.length
  words.value = [...EXAMPLES[exampleIndex.value]]
  compileError.value = ''
  showToast('已换一组示例。编译后才会生效。')
}

async function compileCurrent({ confirmed = false } = {}) {
  syncName()
  compileError.value = ''
  if (!validation.value.ok) {
    compileError.value = validation.value.errors[0]?.message || '词条还不完整。'
    forgeRef.value?.focusFirstEmpty?.()
    return { ok: false }
  }
  if (!confirmed && score.value > 0 && fingerprint.value !== profile.buildKey) {
    resetOpen.value = true
    return { ok: false, needsConfirm: true }
  }

  compiling.value = true
  compileProgress.value = Array.from({ length: 5 }, () => ({ status: 'queued' }))
  try {
    const result = await compileBuild(words.value, {
      aiConfig: aiEnabled.value ? { ...aiConfig } : null,
      onProgress(progress) {
        const next = [...compileProgress.value]
        next[progress.index] = progress
        compileProgress.value = next
      },
    })
    contracts.value = result.contracts
    compileResults.value = result.results
    compiledFingerprint.value = fingerprintWords(words.value)
    if (compiledFingerprint.value !== profile.buildKey) {
      Object.assign(profile, applyBuildToProfile(profile, words.value, { resetScore: true }))
    } else {
      profile.keywords = [...words.value]
    }
    saveProfile(profile)
    refreshLibrary()
    const fallback = result.results.find((item) => item.source === 'fallback')
    if (fallback) showToast('AI 没有完成，已自动回退到本地编译器；游戏不会卡住。')
    else showToast(aiEnabled.value ? '五词已由 AI 编译。' : '五词已在本地编译完成。')
    await nextTick()
    opponentsEl.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    return { ok: true }
  } catch (error) {
    compileError.value = error?.message || '编译失败。'
    return { ok: false }
  } finally {
    compiling.value = false
  }
}

async function challenge(opponent) {
  if (compiling.value) return
  syncName()
  if (isTopTenId(opponent.id) && opponent.id !== nextTop.value?.id) {
    showToast(
      nextTop.value
        ? `前十必须从第 ${topRankOf(nextTop.value.id)} 位开始，按低到高挑战。`
        : '前十已经全部击败。',
    )
    return
  }
  if (!profile.name || !String(profile.name).trim()) {
    pendingChallenge.value = opponent
    openRename()
    return
  }
  if (!hasCompiled.value) {
    const result = await compileCurrent()
    if (result.needsConfirm) {
      pendingChallenge.value = opponent
      return
    }
    if (!result.ok) return
  }
  startBattle(opponent)
}

function startBattle(opponent) {
  syncName()
  settledBattleSeed = null
  if (isTopTenId(opponent.id) && opponent.id !== nextTop.value?.id) {
    showToast(
      nextTop.value
        ? `前十必须从第 ${topRankOf(nextTop.value.id)} 位开始，按低到高挑战。`
        : '前十已经全部击败。',
    )
    return
  }
  if (!contracts.value.length || stale.value) {
    showToast('词条还没编译，先编译再开打。')
    return
  }
  let opponentContracts
  try {
    opponentContracts = compileBuildLocal(opponent.words)
  } catch (error) {
    showToast(`对手词条编译失败：${error.message}`)
    return
  }
  const opponentBuild = {
    ...opponent,
    contracts: opponentContracts,
    style: opponent.style || styleForContracts(opponentContracts),
    power: opponent.power ?? powerForRating(opponent.rating),
    topRank: isTopTenId(opponent.id) ? topRankOf(opponent.id) : 0,
    tier: isTopTenId(opponent.id) ? 'top' : opponent.tier || 'other',
  }
  const playerBuild = {
    id: 'player',
    name: profile.name || '无名氏',
    words: [...profile.keywords],
    contracts: contracts.value,
    style: styleForContracts(contracts.value),
    power: 1,
    accent: '#2f6b53',
    seal: '我',
    rating: profile.score,
  }
  battleConfig.value = {
    player: playerBuild,
    opponent: opponentBuild,
    seed: Date.now() ^ Math.floor(Math.random() * 100000),
  }
  battleKey.value += 1
  matchResult.value = null
  phase.value = 'battle'
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function finishBattle(payload) {
  const opponent = battleConfig.value?.opponent
  if (!opponent) return
  const seed = payload.seed ?? battleKey.value
  if (settledBattleSeed === seed) return
  settledBattleSeed = seed
  const scoreBefore = profile.score || 0
  const ladderBefore = topLadder(profile)
  const wasTopLadderMatch = isTopTenId(opponent.id) && opponent.id === ladderBefore.next?.id
  const result = applyMatchResult(profile, {
    winner: payload.winner,
    reason: payload.reason,
    opponent,
    duration: payload.duration,
  })
  Object.assign(profile, result.profile)

  const ladderAdvance = advanceTopLadder(profile, opponent.id, payload.winner === 'player')
  Object.assign(profile, ladderAdvance.profile)
  let opponentDelta = 0
  if (isTopTenId(opponent.id)) {
    // 输的一方掉分：玩家输时由 applyMatchResult 扣玩家；玩家赢时对手也掉一点。
    opponentDelta = payload.winner === 'player'
      ? -Math.max(4, Math.round(6 + (Number(opponent.rating) || 0) * 0.01))
      : 0
    if (opponentDelta) {
      profile.botScores = {
        ...(profile.botScores || {}),
        [opponent.id]: (Number(profile.botScores?.[opponent.id]) || 0) + opponentDelta,
      }
    }
  }
  const topAdvanced = wasTopLadderMatch && ladderAdvance.advanced
  saveProfile(profile)

  let note = ''
  if (payload.winner === 'player') {
    if ((payload.hpRatio ?? 1) <= 0.22) note = '丝血反杀'
    else if (opponent.rating - scoreBefore >= 260) note = '越级挑战'
    else if ((profile.streak || 0) >= 3) note = '三连胜'
    else if (payload.duration <= 14) note = '速胜'
  }
  if (note) {
    const snapshot = makeFunSnapshot(profile, opponent, note)
    if (snapshot) {
      const key = fingerprintWords(snapshot.words)
      funSaved.value = [
        snapshot,
        ...funSaved.value.filter((item) => fingerprintWords(item.words) !== key),
      ].slice(0, 8)
      saveFunPool(funSaved.value)
    }
  }

  const historyEntry = {
    id: `match-${Date.now()}`,
    at: Date.now(),
    name: profile.name,
    opponent: opponent.name,
    winner: payload.winner,
    reason: payload.reason,
    delta: result.delta,
    score: profile.score,
    duration: payload.duration,
    seed: payload.seed,
    note,
    words: [...profile.keywords],
  }
  pushHistory(historyEntry)

  const ladderAfter = topLadder(profile)
  matchResult.value = {
    ...payload,
    ...result.summary,
    ...result,
    note,
    opponent,
    topAdvanced,
    ladderRank: opponent.topRank || 0,
    ladderNext: ladderAfter.next?.name || '',
    ladderDone: ladderAfter.done,
    opponentDelta,
    scoreBefore: result.scoreBefore,
    scoreAfter: result.scoreAfter,
  }
  refreshLibrary()
}

function rematch() {
  if (!currentOpponent.value) return
  let opponent = currentOpponent.value
  if (isTopTenId(opponent.id)) {
    // 赢下当前位后，“再打一场”自然指向下一位；输了仍是同一位。
    opponent = nextTop.value
    if (!opponent) {
      showToast('前十已经全部击败，去挑战网站预定或有趣保留吧。')
      rebuild()
      return
    }
  }
  matchResult.value = null
  startBattle(opponent)
}

function rebuild() {
  phase.value = 'setup'
  matchResult.value = null
  nextTick(() => {
    document.querySelector('.ck-forge')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    forgeRef.value?.focusFirstEmpty?.()
  })
}

function exitBattle() {
  phase.value = 'setup'
  matchResult.value = null
  saveProfile(profile)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function confirmReset() {
  resetOpen.value = false
  const opponent = pendingChallenge.value
  pendingChallenge.value = null
  compileCurrent({ confirmed: true }).then((result) => {
    if (result.ok && opponent) startBattle(opponent)
  })
}

function cancelReset() {
  resetOpen.value = false
  pendingChallenge.value = null
}

function refreshLibrary() {
  librarySummary.value = libraryStats()
  libraryRows.value = listLibrary()
}

function openLibrary() {
  refreshLibrary()
  consistency.value = null
  librarySearch.value = ''
  libraryOpen.value = true
}

function runConsistency() {
  consistency.value = consistencyCheck()
}

function openAI() {
  Object.assign(aiDraft, aiConfig)
  aiTestMessage.value = ''
  aiOpen.value = true
}

async function testAI() {
  aiTesting.value = true
  aiTestMessage.value = '正在连接…'
  try {
    await testAIConfig({ ...aiDraft })
    aiTestMessage.value = '连接成功。可以保存并启用。'
  } catch (error) {
    aiTestMessage.value = error?.message || '连接失败。'
  } finally {
    aiTesting.value = false
  }
}

function saveAI() {
  Object.assign(aiConfig, aiDraft)
  saveAIConfig(aiConfig)
  aiOpen.value = false
  showToast(
    aiEnabled.value
      ? 'AI 编译已启用；失败时会自动回退本地编译器。'
      : '已关闭 AI，使用本地语义编译器。',
  )
}

function clearAllLibrary() {
  if (typeof window !== 'undefined' && !window.confirm('清空本地能力库？积分与词条不会变，但下次编译会重新生成合约。')) return
  clearLibrary()
  refreshLibrary()
  consistency.value = null
  showToast('本地能力库已清空。预设对手会重新写入。')
}

function scrollToOpponents() {
  opponentsEl.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function openAIFromForge() {
  openAI()
}

onMounted(() => {
  document.title = '限定词斗蛐蛐 · SCUTWiki'
  refreshLibrary()
  if (profile.buildKey && profile.keywords?.some((word) => word?.trim())) {
    try {
      const restored = compileBuildLocal(profile.keywords)
      contracts.value = restored
      compiledFingerprint.value = profile.buildKey
      compileResults.value = restored.map((contract) => ({
        source: contract.source || 'library',
        label: contract.source === 'ai' ? '词库 · AI' : '词库复用',
        message: '从本地能力库恢复',
      }))
    } catch {
      // 恢复失败时不阻塞，重新编译即可。
    }
  }
})

onBeforeUnmount(() => {
  document.title = 'SCUTWiki · 华南理工大学校园百科'
  clearTimeout(toastTimer)
})
</script>

<template>
  <div class="ck">
    <header v-if="phase === 'setup'" class="ck-top">
      <RouterLink to="/" class="ck-brand">
        <span class="ck-brand-mark">斗</span>
        <span>
          <strong>SCUT<em>Wiki</em></strong>
          <small>互动实验 001 · 限定词斗蛐蛐</small>
        </span>
      </RouterLink>

      <div class="ck-top-right">
        <div class="ck-score-chip">
          <span>积分</span>
          <strong>{{ String(score).padStart(3, '0') }}</strong>
          <small>第 {{ rank }} 位</small>
        </div>
        <button type="button" class="ck-top-btn" @click="openLibrary">
          词库 <b>{{ librarySummary.total }}</b>
        </button>
        <button type="button" class="ck-top-btn" :class="{ 'is-on': aiEnabled }" @click="openAI">
          引擎 <b>{{ aiEnabled ? 'AI' : '本地' }}</b>
        </button>
        <button type="button" class="ck-theme-btn" :aria-label="theme === 'dark' ? '切换到浅色' : '切换到深色'" @click="toggleTheme">
          {{ theme === 'dark' ? '日' : '夜' }}
        </button>
      </div>
    </header>

    <main v-if="phase === 'setup'" class="ck-main">
      <section class="ck-hero">
        <div class="ck-hero-copy">
          <div class="ck-hero-eyebrow">
            <span class="ck-kicker">INTERACTION 001 / 试行</span>
            <span class="ck-stamp">五词</span>
          </div>
          <h1>限定词<br /><em>斗蛐蛐</em></h1>
          <p class="ck-hero-lede">
            五个词，两个小人，一场自动发生的胜负。<br />
            你只负责输入想象力，剩下的交给它们自己。
          </p>

          <ul class="ck-rules">
            <li><b>五个方向性概念词</b><span>太泛会锁定；绝对词会成立，但会留下破绽</span></li>
            <li><b>小人自行决策</b><span>移动、出招、闪避、认输都不需要你操作</span></li>
            <li><b>词条决定打法</b><span>赤手空拳是基线，词条会换来武器、术法与身法</span></li>
            <li><b>AI 只编译，不判胜负</b><span>战斗与积分由确定性代码跑完</span></li>
          </ul>

          <div class="ck-hero-stats">
            <div><span>当前积分</span><strong>{{ score }}</strong></div>
            <div><span>能力库</span><strong>{{ librarySummary.total }}<small> 条</small></strong></div>
            <div><span>胜 / 负</span><strong>{{ profile.wins || 0 }}<small> / </small>{{ profile.losses || 0 }}</strong></div>
          </div>

          <button type="button" class="ck-hero-arrow" @click="scrollToOpponents">
            <span>直接看对手</span>
            <span>↓</span>
          </button>
        </div>

        <KeywordForge
          ref="forgeRef"
          :words="words"
          :name="nameDraft"
          :errors="wordErrors"
          :compiling="compiling"
          :error="compileError"
          :ai-enabled="aiEnabled"
          :ai-label="aiLabel"
          :score="score"
          :has-compiled="hasCompiled"
          :stale="stale"
          @update:words="onWordsUpdate"
          @update:name="nameDraft = $event"
          @save-name="saveName"
          @compile="compileCurrent()"
          @example="useExample"
          @open-ai="openAIFromForge"
          @focus-opponents="scrollToOpponents"
        />
      </section>

      <CompileStrip
        v-if="contracts.length || compiling || compileError"
        :contracts="contracts"
        :results="compileResults"
        :progress="compileProgress"
        :compiling="compiling"
        :error="compileError"
        :words="words"
      />

      <div ref="opponentsEl">
        <OpponentBoard
          :presets="SITE_PRESETS"
          :top-rows="topRows"
          :fun-rows="funRows"
          :profile="profile"
          :tab="tab"
          :rank="rank"
          :disabled="compiling"
          :player-name="profile.name"
          :next-top-id="nextTop?.id || ''"
          :cleared-top-ids="ladder.clearedIds"
          @update:tab="tab = $event"
          @challenge="challenge"
        />
      </div>

      <section class="ck-how">
        <div class="ck-section-head">
          <div>
            <span class="ck-kicker">HOW IT WORKS</span>
            <h2>它不是“谁词多谁赢”</h2>
          </div>
        </div>
        <div class="ck-how-grid">
          <article>
            <span>01</span>
            <h3>查词库</h3>
            <p>相同的词直接复用已有机制；相近的词会命中同一条能力记录，避免同一个词今天一种打法、明天另一种。</p>
          </article>
          <article>
            <span>02</span>
            <h3>编译合约</h3>
            <p>词条被拆成攻击类型、射程、冷却、效果与装备。AI 只负责这一步，失败就回退本地编译器。</p>
          </article>
          <article>
            <span>03</span>
            <h3>自动开打</h3>
            <p>小人按血量、距离、招式收益与对手行为自行选择移动、出招和认输。你输入的词，会长成它的判断。</p>
          </article>
          <article>
            <span>04</span>
            <h3>留下痕迹</h3>
            <p>赢高分对手得更多积分；丝血反杀、越级挑战、连胜会被写入“有趣保留”，供下一位挑战者再打一次。</p>
          </article>
        </div>
      </section>

      <footer class="ck-footer">
        <div>
          <strong>SCUTWiki · 互动实验</strong>
          <span>本地榜 · 词条能力库 v{{ librarySummary.total ? '1' : '0' }} · 试行版</span>
        </div>
        <div class="ck-footer-links">
          <RouterLink to="/">返回首页</RouterLink>
          <button type="button" @click="openLibrary">查看能力库</button>
          <button type="button" @click="openAI">编译引擎设置</button>
        </div>
      </footer>
    </main>

    <BattleStage
      v-else
      :key="battleKey"
      :config="battleConfig"
      :player-name="profile.name"
      :match-result="matchResult"
      :modal-open="renameOpen"
      @finish="finishBattle"
      @rematch="rematch"
      @rebuild="rebuild"
      @exit="exitBattle"
      @rename="openRename"
      @toast="showToast"
    />

    <Teleport to="body">
      <div v-if="aiOpen" class="ck-modal-backdrop" @click.self="aiOpen = false">
        <section class="ck-modal" role="dialog" aria-modal="true" aria-label="编译引擎设置">
          <header class="ck-modal-head">
            <div>
              <span class="ck-kicker">COMPILER</span>
              <h2>编译引擎</h2>
            </div>
            <button type="button" class="ck-modal-close" aria-label="关闭" @click="aiOpen = false">×</button>
          </header>

          <p class="ck-modal-lede">
            默认使用本地语义编译器，不联网、可离线。填一个 OpenAI 兼容接口后，词条会先交给 AI 拆解；AI 失败、超时或输出越界时会自动回退本地，不会卡住斗兽场。
          </p>

          <label class="ck-check">
            <input v-model="aiDraft.enabled" type="checkbox" />
            <span>启用 AI 编译</span>
          </label>

          <div class="ck-field-grid">
            <label class="ck-field">
              <span>接口地址</span>
              <input v-model="aiDraft.baseURL" placeholder="https://api.deepseek.com/v1" spellcheck="false" />
            </label>
            <label class="ck-field">
              <span>模型名</span>
              <input v-model="aiDraft.model" placeholder="deepseek-chat" spellcheck="false" />
            </label>
            <label class="ck-field ck-field-full">
              <span>API Key</span>
              <input v-model="aiDraft.apiKey" type="password" placeholder="sk-..." autocomplete="off" spellcheck="false" />
            </label>
          </div>

          <div class="ck-ai-test">
            <button type="button" class="ck-btn ck-btn-ghost ck-btn-small" :disabled="aiTesting" @click="testAI">
              {{ aiTesting ? '测试中…' : '测试连接' }}
            </button>
            <span v-if="aiTestMessage">{{ aiTestMessage }}</span>
          </div>

          <p class="ck-fine">
            Key 只保存在本机 localStorage，不会上传到本仓库。生产环境建议改成服务端代理，避免在前端暴露密钥。
          </p>

          <footer class="ck-modal-actions">
            <button type="button" class="ck-btn ck-btn-ghost" @click="aiOpen = false">取消</button>
            <button type="button" class="ck-btn ck-btn-primary" @click="saveAI">保存设置</button>
          </footer>
        </section>
      </div>

      <div v-if="libraryOpen" class="ck-modal-backdrop" @click.self="libraryOpen = false">
        <section class="ck-modal ck-modal-wide" role="dialog" aria-modal="true" aria-label="能力库">
          <header class="ck-modal-head">
            <div>
              <span class="ck-kicker">ABILITY LIBRARY</span>
              <h2>词条能力库</h2>
            </div>
            <button type="button" class="ck-modal-close" aria-label="关闭" @click="libraryOpen = false">×</button>
          </header>

          <div class="ck-lib-stats">
            <div><span>总记录</span><strong>{{ librarySummary.total }}</strong></div>
            <div><span>AI 编译</span><strong>{{ librarySummary.ai }}</strong></div>
            <div><span>本地编译</span><strong>{{ librarySummary.local }}</strong></div>
            <div><span>命中次数</span><strong>{{ librarySummary.hits }}</strong></div>
            <div><span>泛词锁定</span><strong>{{ librarySummary.locked }}</strong></div>
          </div>

          <p class="ck-modal-lede">
            同一词条永远返回同一份机制合约；相近词条会合并到同一条记录。词条改动会重置积分，但能力库不会重置。
          </p>

          <div class="ck-lib-tools">
            <input v-model="librarySearch" class="ck-lib-search" placeholder="搜索词条、招式或别名…" />
            <button type="button" class="ck-btn ck-btn-ghost ck-btn-small" @click="runConsistency">一致性自检</button>
            <button type="button" class="ck-btn ck-btn-ghost ck-btn-small is-danger" @click="clearAllLibrary">清空词库</button>
          </div>

          <div v-if="consistency" class="ck-consistency" :class="{ 'is-ok': consistency.ok }">
            <strong>{{ consistency.ok ? '通过：同词条重复编译结果一致' : '发现不一致，请查看下列词条' }}</strong>
            <span v-for="row in consistency.rows.slice(0, 8)" :key="row.word">
              {{ row.word }} {{ row.ok ? '✓' : `× ${row.differences.join(' / ')}` }}
            </span>
          </div>

          <div class="ck-lib-list">
            <article v-for="row in libraryFiltered" :key="row.key" class="ck-lib-row">
              <span class="ck-lib-glyph" :style="{ color: row.contract.color, borderColor: row.contract.color }">
                {{ row.contract.gear?.glyph || '技' }}
              </span>
              <div class="ck-lib-main">
                <div class="ck-lib-title">
                  <strong>{{ row.contract.skill }}</strong>
                  <span>{{ row.key }}</span>
                  <em :class="`is-${row.source}`">{{ row.source === 'ai' ? 'AI' : '本地' }}</em>
                </div>
                <p>{{ row.contract.attackLabel }} · {{ row.contract.desc }}</p>
                <div class="ck-lib-tags">
                  <span v-for="tag in row.contract.tags?.slice(0, 4)" :key="tag">{{ tag }}</span>
                  <span v-if="row.aliases?.length > 1">别名 {{ row.aliases.slice(0, 3).join(' / ') }}</span>
                </div>
              </div>
              <span class="ck-lib-hits">命中 {{ row.hits }}</span>
            </article>
            <p v-if="!libraryFiltered.length" class="ck-empty">词库还是空的。编译五个词之后，这里会长出记录。</p>
          </div>

          <footer class="ck-modal-actions">
            <button type="button" class="ck-btn ck-btn-primary" @click="libraryOpen = false">关闭</button>
          </footer>
        </section>
      </div>

      <div v-if="renameOpen" class="ck-modal-backdrop" @click.self="renameOpen = false">
        <section class="ck-modal ck-modal-small" role="dialog" aria-modal="true" aria-label="改名">
          <header class="ck-modal-head">
            <div>
              <span class="ck-kicker">RENAME</span>
              <h2>改个名字</h2>
            </div>
            <button type="button" class="ck-modal-close" aria-label="关闭" @click="renameOpen = false">×</button>
          </header>
          <p class="ck-modal-lede">改名不会改变积分、词条或战绩。斗兽场只认这五个词。</p>
          <label class="ck-field">
            <span>斗士名</span>
            <input v-model="renameDraft" maxlength="12" autofocus @keydown.enter.prevent="applyRename" />
          </label>
          <footer class="ck-modal-actions">
            <button type="button" class="ck-btn ck-btn-ghost" @click="renameOpen = false">取消</button>
            <button type="button" class="ck-btn ck-btn-primary" @click="applyRename">确认改名</button>
          </footer>
        </section>
      </div>

      <div v-if="resetOpen" class="ck-modal-backdrop" @click.self="cancelReset">
        <section class="ck-modal ck-modal-small" role="dialog" aria-modal="true" aria-label="确认重置积分">
          <header class="ck-modal-head">
            <div>
              <span class="ck-kicker">RESET SCORE</span>
              <h2>改词条会重置积分</h2>
            </div>
            <button type="button" class="ck-modal-close" aria-label="关闭" @click="cancelReset">×</button>
          </header>
          <p class="ck-modal-lede">
            新词条是另一套构筑。编译后，当前积分 <b>{{ score }}</b> 会清零，改名不受影响，能力库也不会被清空。
          </p>
          <div class="ck-reset-preview">
            <span v-for="word in words" :key="word">{{ word || '空' }}</span>
          </div>
          <footer class="ck-modal-actions">
            <button type="button" class="ck-btn ck-btn-ghost" @click="cancelReset">先不改</button>
            <button type="button" class="ck-btn ck-btn-primary" @click="confirmReset">确认编译并清零</button>
          </footer>
        </section>
      </div>
    </Teleport>

    <div v-if="toast" class="ck-toast">{{ toast }}</div>
  </div>
</template>
