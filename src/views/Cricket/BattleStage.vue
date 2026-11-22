<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { createBattle, buildHud } from '../../game/cricket/engine.js'
import { CricketRenderer } from '../../game/cricket/renderer.js'
import { styleLabel } from '../../game/cricket/roster.js'
import { formatSeconds } from '../../game/cricket/text.js'

const props = defineProps({
  config: { type: Object, required: true },
  playerName: { type: String, default: '' },
  matchResult: { type: Object, default: null },
  modalOpen: { type: Boolean, default: false },
})

const emit = defineEmits(['finish', 'rematch', 'rebuild', 'exit', 'rename', 'toast'])

const canvas = ref(null)
const logEl = ref(null)
const hud = reactive({
  t: 0,
  over: false,
  result: null,
  suddenDeath: false,
  arbitration: null,
  fighters: [],
  log: [],
})
const speed = ref(1)
const paused = ref(false)
const finished = ref(false)
const showOverlay = ref(false)

let battle = null
let renderer = null
let raf = 0
let observer = null
let lastTime = 0
let accumulator = 0
let overlayTimer = 0
let fallbackTimer = 0
const pausedByModal = ref(false)

const player = computed(() => props.config?.player || {})
const opponent = computed(() => props.config?.opponent || {})
const playerHud = computed(() => hud.fighters.find((fighter) => fighter.side === 0) || {})
const opponentHud = computed(() => hud.fighters.find((fighter) => fighter.side === 1) || {})
const timerText = computed(() => formatSeconds(hud.t))
const canShowResult = computed(() => Boolean(props.matchResult))

const resultTitle = computed(() => {
  if (!props.matchResult) return '结算中'
  if (props.matchResult.winner === 'player') return '胜'
  if (props.matchResult.winner === 'draw') return '平'
  return props.matchResult.reason === 'surrender' ? '认输' : '负'
})

const resultTone = computed(() => {
  if (!props.matchResult) return 'pending'
  if (props.matchResult.winner === 'player') return 'win'
  if (props.matchResult.winner === 'draw') return 'draw'
  return 'lose'
})

const resultReason = computed(() => {
  const result = props.matchResult
  if (!result) return '正在核对词条与积分…'
  if (result.reason === 'ko') return result.winner === 'player' ? '对手倒下，斗兽场留下你的名字。' : '你倒下了。词条还在，下一场可以换一种活法。'
  if (result.reason === 'surrender') return result.winner === 'player' ? '对手认输。它判断这一局已经没有必要继续。' : '小人判断局势已去，替你认了输。认输扣分比被击倒更轻。'
  if (result.reason === 'timeout') return '时间到，按残余生命判定。拖到最后不一定赢。'
  return '终局判定。'
})

function hpWidth(fighter) {
  return `${Math.max(0, Math.min(100, (fighter.hpRatio || 0) * 100))}%`
}

function shieldWidth(fighter) {
  const max = fighter.maxHp || 820
  return `${Math.max(0, Math.min(100, ((fighter.shield || 0) / max) * 100))}%`
}

function statusList(fighter) {
  return fighter.statuses || []
}

function cooldownPercent(index, side) {
  const fighter = side === 0 ? playerHud.value : opponentHud.value
  const contract = (side === 0 ? player.value : opponent.value)?.contracts?.[index]
  if (!contract) return 100
  const remain = fighter.cooldowns?.[index] || 0
  return `${Math.max(0, Math.min(100, (1 - remain / contract.cooldown) * 100))}%`
}

function cooldownText(index, side) {
  const fighter = side === 0 ? playerHud.value : opponentHud.value
  const remain = fighter.cooldowns?.[index] || 0
  return remain > 0 ? `${remain.toFixed(1)}s` : '就绪'
}

function togglePause() {
  if (hud.over) return
  paused.value = !paused.value
}

function cycleSpeed() {
  speed.value = speed.value === 1 ? 2 : speed.value === 2 ? 3 : 1
}

function scheduleOverlay() {
  if (showOverlay.value) return
  clearTimeout(overlayTimer)
  clearTimeout(fallbackTimer)
  overlayTimer = setTimeout(() => {
    if (canShowResult.value) showOverlay.value = true
  }, 950)
  fallbackTimer = setTimeout(() => {
    showOverlay.value = true
  }, 3200)
}

function emitFinish() {
  if (!battle?.state?.result) return
  const result = battle.state.result
  const playerState = battle.state.fighters[0]
  const opponentState = battle.state.fighters[1]
  emit('finish', {
    ...result,
    seed: battle.state.seed,
    hpRatio: playerState.maxHp ? playerState.hp / playerState.maxHp : 0,
    opponentHpRatio: opponentState.maxHp ? opponentState.hp / opponentState.maxHp : 0,
    playerName: playerState.name,
    opponentName: opponentState.name,
    playerDamage: Math.round(playerState.damageDealt),
    opponentDamage: Math.round(opponentState.damageDealt),
    playerSkills: playerState.skillsUsed,
    opponentSkills: opponentState.skillsUsed,
    playerHits: playerState.hits,
    opponentHits: opponentState.hits,
  })
  scheduleOverlay()
}

function updateHud() {
  if (!battle) return
  const next = buildHud(battle.state)
  Object.assign(hud, next)
  hud.fighters = next.fighters
  hud.log = next.log
}

function frame(now) {
  const dt = Math.min(0.06, Math.max(0, (now - lastTime) / 1000 || 0.016))
  lastTime = now
  if (battle && !paused.value && !battle.state.over) {
    accumulator += dt * speed.value
    let steps = 0
    while (accumulator >= 1 / 60 && steps < 16) {
      battle.step(1 / 60)
      accumulator -= 1 / 60
      steps += 1
    }
  }
  if (battle && renderer) {
    renderer.processEvents(battle.drainFx(), battle.state)
    renderer.render(battle.state, dt, now / 1000)
    updateHud()
    if (battle.state.over && !finished.value) {
      finished.value = true
      emitFinish()
    }
  }
  raf = requestAnimationFrame(frame)
}

function onResize() {
  renderer?.resize()
}

function onKeydown(event) {
  if (event.code === 'Space' && !event.target.matches('input, textarea, button')) {
    event.preventDefault()
    togglePause()
  }
}

watch(
  () => hud.log.length,
  async () => {
    await nextTick()
    if (logEl.value) logEl.value.scrollTop = logEl.value.scrollHeight
  },
)

watch(
  () => props.playerName,
  (value) => {
    if (battle && value) battle.state.fighters[0].name = value
  },
)

watch(
  () => props.modalOpen,
  (open) => {
    if (open && !paused.value && !hud.over) {
      paused.value = true
      pausedByModal.value = true
    } else if (!open && pausedByModal.value) {
      paused.value = false
      pausedByModal.value = false
    }
  },
)

watch(
  () => props.matchResult,
  (value) => {
    if (value) scheduleOverlay()
  },
  { deep: true },
)

onMounted(() => {
  if (!props.config) return
  battle = createBattle({
    player: props.config.player,
    opponent: props.config.opponent,
    seed: props.config.seed,
  })
  renderer = new CricketRenderer(canvas.value)
  renderer.setTheme(document.documentElement.dataset.theme === 'dark')
  observer = new ResizeObserver(onResize)
  observer.observe(canvas.value.parentElement || canvas.value)
  updateHud()
  lastTime = performance.now()
  raf = requestAnimationFrame(frame)
  window.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  observer?.disconnect()
  clearTimeout(overlayTimer)
  clearTimeout(fallbackTimer)
  window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <div class="ck-battle">
    <header class="ck-battle-head">
      <button type="button" class="ck-back" @click="emit('exit')">← 离开斗兽场</button>
      <div class="ck-battle-title">
        <span class="ck-kicker">CRICKET / AUTO BATTLE</span>
        <h1>{{ playerName || player.name }} <em>对</em> {{ opponent.name }}</h1>
      </div>
      <div class="ck-battle-tools">
        <button type="button" class="ck-icon-btn" :aria-label="paused ? '继续' : '暂停'" @click="togglePause">
          {{ paused ? '▶' : 'Ⅱ' }}
        </button>
        <button type="button" class="ck-btn ck-btn-ghost ck-btn-small" @click="emit('exit')">退出</button>
      </div>
    </header>

    <div class="ck-hud">
      <section class="ck-hud-side is-left">
        <div class="ck-hud-name-row">
          <button type="button" class="ck-hud-name" title="改名不扣分" @click="emit('rename')">
            {{ playerHud.name || playerName }} <span class="ck-hud-edit">改</span>
          </button>
          <span class="ck-hud-persona">{{ playerHud.personaLabel }}</span>
          <span class="ck-hud-score">{{ player.rating || 0 }} 分</span>
        </div>
        <div class="ck-hp" :class="{ 'is-low': (playerHud.hpRatio || 0) < 0.3 }">
          <span class="ck-hp-fill is-player" :style="{ width: hpWidth(playerHud) }" />
          <span class="ck-hp-shield" :style="{ width: shieldWidth(playerHud) }" />
          <span class="ck-hp-ticks" />
        </div>
        <div class="ck-hud-meta">
          <span>{{ playerHud.hp || 0 }} / {{ playerHud.maxHp || 0 }}</span>
          <span v-if="playerHud.shield">护盾 {{ playerHud.shield }}</span>
          <span class="ck-intent">{{ playerHud.intent || '观察' }}</span>
        </div>
        <div class="ck-status-row">
          <span v-for="status in statusList(playerHud).slice(0, 5)" :key="status.type" class="ck-status">
            {{ status.label }} <small v-if="status.remain > 0">{{ status.remain }}s</small>
          </span>
        </div>
      </section>

      <div class="ck-hud-center">
        <span class="ck-round-label">ROUND</span>
        <strong>{{ timerText }}</strong>
        <span v-if="hud.suddenDeath" class="ck-sudden">终局</span>
        <span v-else class="ck-auto-mark">AUTO</span>
      </div>

      <section class="ck-hud-side is-right">
        <div class="ck-hud-name-row">
          <span class="ck-hud-score">{{ opponent.rating || 0 }} 分</span>
          <span class="ck-hud-persona">{{ opponentHud.personaLabel }}</span>
          <span class="ck-hud-name is-static">{{ opponentHud.name || opponent.name }}</span>
        </div>
        <div class="ck-hp is-right" :class="{ 'is-low': (opponentHud.hpRatio || 0) < 0.3 }">
          <span class="ck-hp-fill is-opponent" :style="{ width: hpWidth(opponentHud) }" />
          <span class="ck-hp-shield" :style="{ width: shieldWidth(opponentHud) }" />
          <span class="ck-hp-ticks" />
        </div>
        <div class="ck-hud-meta is-right">
          <span class="ck-intent">{{ opponentHud.intent || '观察' }}</span>
          <span v-if="opponentHud.shield">护盾 {{ opponentHud.shield }}</span>
          <span>{{ opponentHud.hp || 0 }} / {{ opponentHud.maxHp || 0 }}</span>
        </div>
        <div class="ck-status-row is-right">
          <span v-for="status in statusList(opponentHud).slice(0, 5)" :key="status.type" class="ck-status">
            {{ status.label }} <small v-if="status.remain > 0">{{ status.remain }}s</small>
          </span>
        </div>
      </section>
    </div>

    <div class="ck-stage">
      <canvas ref="canvas" class="ck-canvas" aria-label="自动战斗场地" />
      <div class="ck-stage-controls">
        <button type="button" class="ck-stage-btn" @click="togglePause">{{ paused ? '继续' : '暂停' }}</button>
        <button type="button" class="ck-stage-btn" @click="cycleSpeed">{{ speed }}×</button>
      </div>
      <div class="ck-stage-caption">
        <span class="ck-live-dot" /> 两个小人正在自行判断移动、出招与认输
      </div>
      <div v-if="paused && !hud.over" class="ck-pause-mask">
        <span>暂停</span>
        <small>按空格继续</small>
      </div>
      <div v-if="hud.arbitration" class="ck-arbitration">
        想象力仲裁 · {{ hud.fighters[hud.arbitration.side]?.name }} 获得「灵光」
      </div>
    </div>

    <div class="ck-battle-below">
      <section class="ck-log-panel">
        <div class="ck-log-head">
          <div>
            <span class="ck-kicker">LIVE FEED</span>
            <h2>战报</h2>
          </div>
          <span class="ck-log-count">{{ hud.log.length }} 条</span>
        </div>
        <div ref="logEl" class="ck-log">
          <p v-for="item in hud.log" :key="item.id" class="ck-log-line" :class="`is-${item.tone}`">
            <span class="ck-log-time">{{ formatSeconds(item.t) }}</span>
            <span>{{ item.text }}</span>
          </p>
        </div>
      </section>

      <aside class="ck-battle-codex">
        <div class="ck-codex-head">
          <div>
            <span class="ck-kicker">YOUR CONTRACTS</span>
            <h2>词条机制</h2>
          </div>
          <span class="ck-codex-style">你的心法 · {{ styleLabel(player.style) }}</span>
        </div>
        <div class="ck-battle-skill" v-for="(contract, index) in player.contracts || []" :key="`p-${index}`">
          <div class="ck-battle-skill-top">
            <span class="ck-battle-skill-name">{{ contract.skill }}</span>
            <span class="ck-battle-skill-cd">{{ cooldownText(index, 0) }}</span>
          </div>
          <p>{{ contract.attackLabel }} · {{ contract.gear?.name }} · {{ contract.damage > 0 ? `${contract.damage} 伤害` : '护体' }}</p>
          <p v-if="contract.mechanics?.length" class="ck-battle-mechanics">
            {{ contract.mechanics.map((mechanic) => mechanic.name).join(' / ') }}
          </p>
          <div class="ck-cd-track"><span :style="{ width: cooldownPercent(index, 0) }" /></div>
        </div>
        <p class="ck-battle-rule">
          赤手空拳是基线；每个词条在此基础上新增或替换攻击方式。AI 只负责编译词条，胜负由确定性引擎跑完。
        </p>
      </aside>
    </div>

    <div v-if="showOverlay" class="ck-result-overlay">
      <div class="ck-result-card" :class="`is-${resultTone}`">
        <span class="ck-kicker">RESULT / 结算</span>
        <h2>{{ resultTitle }}</h2>
        <p class="ck-result-reason">{{ resultReason }}</p>
        <p v-if="matchResult?.ladderRank" class="ck-result-ladder">
          <template v-if="matchResult.winner === 'player'">
            已击败前十第 {{ matchResult.ladderRank }} 位<template v-if="matchResult.ladderDone">，前十通关。</template><template v-else>，下一位：{{ matchResult.ladderNext }}。</template>
            <template v-if="matchResult.opponentDelta"> 对手积分 {{ matchResult.opponentDelta }}。</template>
          </template>
          <template v-else>
            第 {{ matchResult.ladderRank }} 位挑战失败，积分已按差距扣除；留在原位可重试。
          </template>
        </p>

        <div class="ck-result-score">
          <span class="ck-result-before">{{ matchResult?.scoreBefore ?? player.rating ?? 0 }}</span>
          <strong :class="{ 'is-negative': (matchResult?.delta || 0) < 0 }">
            {{ (matchResult?.delta || 0) > 0 ? '+' : '' }}{{ matchResult?.delta ?? 0 }}
          </strong>
          <span class="ck-result-after">{{ matchResult?.scoreAfter ?? player.rating ?? 0 }}</span>
        </div>
        <div class="ck-result-score-label">
          <span>赛前积分</span><span>本局变化</span><span>当前积分</span>
        </div>

        <div class="ck-result-stats">
          <div><span>时长</span><strong>{{ formatSeconds(matchResult?.duration || hud.t) }}</strong></div>
          <div><span>你的伤害</span><strong>{{ matchResult?.playerDamage ?? '—' }}</strong></div>
          <div><span>对手伤害</span><strong>{{ matchResult?.opponentDamage ?? '—' }}</strong></div>
          <div><span>技能次数</span><strong>{{ matchResult?.playerSkills ?? '—' }} / {{ matchResult?.opponentSkills ?? '—' }}</strong></div>
        </div>

        <p v-if="matchResult?.note" class="ck-result-note">已收入「有趣保留」：{{ matchResult.note }}</p>
        <p v-else-if="matchResult?.winner === 'player' && matchResult?.scoreAfter > matchResult?.scoreBefore" class="ck-result-note">
          打赢高分对手的收益更高；下一场可以继续用这套词条。
        </p>

        <div class="ck-result-actions">
          <button type="button" class="ck-btn ck-btn-primary" @click="emit('rematch')">再打一场</button>
          <button type="button" class="ck-btn ck-btn-ghost" @click="emit('rebuild')">换词条</button>
          <button type="button" class="ck-btn ck-btn-ghost" @click="emit('rename')">改名字</button>
          <button type="button" class="ck-btn ck-btn-ghost" @click="emit('exit')">离开</button>
        </div>
        <p class="ck-result-fine">改名不扣分；换词条会重置积分，能力库不会重置。</p>
      </div>
    </div>
  </div>
</template>
