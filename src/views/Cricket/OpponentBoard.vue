<script setup>
import { computed } from 'vue'
import { opponentGainHint, styleLabel, topRankOf } from '../../game/cricket/roster.js'
import { expectedLossDelta, expectedWinGain } from '../../game/cricket/scoring.js'

const props = defineProps({
  presets: { type: Array, default: () => [] },
  topRows: { type: Array, default: () => [] },
  funRows: { type: Array, default: () => [] },
  profile: { type: Object, required: true },
  tab: { type: String, default: 'preset' },
  rank: { type: Number, default: 0 },
  disabled: { type: Boolean, default: false },
  playerName: { type: String, default: '你' },
  nextTopId: { type: String, default: '' },
  clearedTopIds: { type: Array, default: () => [] },
})

const emit = defineEmits(['update:tab', 'challenge'])

const tabs = computed(() => [
  { id: 'preset', label: '网站预定', sub: '五个守擂人', count: props.presets.length },
  { id: 'top', label: '前十', sub: '按积分排位', count: 10 },
  { id: 'fun', label: '有趣保留', sub: '值得再打一次', count: props.funRows.length },
])

const list = computed(() => {
  if (props.tab === 'top') return props.topRows
  if (props.tab === 'fun') return props.funRows
  return props.presets
})

function gainFor(row) {
  if (!isTopRow(row)) return opponentGainHint(props.profile, row)
  return expectedWinGain({
    score: props.profile.score,
    rating: row.rating,
    streak: props.profile.streak,
    rank: topRankOf(row.id),
  })
}

function lossFor(row) {
  return Math.abs(expectedLossDelta({
    score: props.profile.score,
    rating: row.rating,
    rank: row.id?.startsWith('top-') ? topRankOf(row.id) : 0,
  }))
}

function isTopRow(row) {
  return String(row.id || '').startsWith('top-')
}

function rowState(row) {
  if (row.isPlayer) return 'player'
  if (!isTopRow(row)) return 'normal'
  if (props.clearedTopIds.includes(row.id)) return 'cleared'
  if (row.id === props.nextTopId) return 'current'
  return 'locked'
}

function challenge(row) {
  if (props.disabled || row.isPlayer) return
  if (isTopRow(row) && rowState(row) !== 'current') return
  emit('challenge', row)
}

function rankLabel(row, index) {
  if (row.isPlayer) return props.rank ? String(props.rank).padStart(2, '0') : '—'
  return String(index + 1).padStart(2, '0')
}

function topStatusLabel(row) {
  const state = rowState(row)
  if (state === 'cleared') return '已击败'
  if (state === 'current') return '当前目标'
  if (state === 'locked') return '未解锁'
  return ''
}

</script>

<template>
  <section id="opponents" class="ck-opponents" aria-label="选择对手">
    <div class="ck-section-head">
      <div>
        <span class="ck-kicker">CHOOSE A FIGHT</span>
        <h2>让谁进来挨打</h2>
      </div>
      <p class="ck-section-note">
        对手也走同一套词条编译。评分越高，赢下来的积分越多；输给低分对手会被扣分。
      </p>
    </div>

    <div class="ck-rank-banner">
      <div>
        <span class="ck-rank-label">你的当前排位</span>
        <strong>第 {{ rank || '—' }} 位</strong>
        <span class="ck-rank-score">{{ profile.score }} 分</span>
      </div>
      <p>改名不改变积分；改词条会把当前积分清零。</p>
    </div>

    <div class="ck-tabs" role="tablist">
      <button
        v-for="item in tabs"
        :key="item.id"
        type="button"
        class="ck-tab"
        :class="{ 'is-active': tab === item.id }"
        role="tab"
        :aria-selected="tab === item.id"
        @click="emit('update:tab', item.id)"
      >
        <span class="ck-tab-label">{{ item.label }}</span>
        <span class="ck-tab-sub">{{ item.sub }}</span>
        <span class="ck-tab-count">{{ String(item.count).padStart(2, '0') }}</span>
      </button>
    </div>

    <div v-if="tab === 'top'" class="ck-ladder-banner" :class="{ 'is-done': !nextTopId }">
      <template v-if="nextTopId">
        <span class="ck-kicker">LADDER / 低到高</span>
        <strong>当前挑战：第 {{ topRankOf(nextTopId) }} 位</strong>
        <p>无论胜负都会结算积分；必须先击败当前位才会解锁下一位。输了留在原位，按双方积分酌情扣分后可重试。</p>
      </template>
      <template v-else>
        <span class="ck-kicker">LADDER / CLEARED</span>
        <strong>前十已全部击败</strong>
        <p>换词条会重置积分与挑战进度；网站预定和有趣保留仍然可以继续打。</p>
      </template>
    </div>

    <div v-if="tab === 'top'" class="ck-top-board">
      <button
        v-for="(row, index) in list"
        :key="row.id"
        type="button"
        class="ck-top-row"
        :class="{
          'is-player': row.isPlayer,
          'is-current': rowState(row) === 'current',
          'is-cleared': rowState(row) === 'cleared',
          'is-locked': rowState(row) === 'locked',
        }"
        :disabled="disabled || row.isPlayer || (isTopRow(row) && rowState(row) !== 'current')"
        :title="row.isPlayer
          ? '这是你当前的词条'
          : rowState(row) === 'current'
            ? `挑战 ${row.name}，预计 +${gainFor(row)} / -${lossFor(row)}`
            : topStatusLabel(row)"
        @click="challenge(row)"
      >
        <span class="ck-top-rank">{{ rankLabel(row, index) }}</span>
        <span class="ck-top-seal" :style="{ color: row.accent, borderColor: row.accent }">{{ row.seal }}</span>
        <span class="ck-top-name">
          <strong>{{ row.isPlayer ? playerName : row.name }}</strong>
          <small>{{ row.isPlayer ? '你的当前词条' : row.epithet }}</small>
        </span>
        <span class="ck-top-words">
          <i v-for="word in row.words.slice(0, 5)" :key="word">{{ word }}</i>
        </span>
        <span class="ck-top-style">{{ styleLabel(row.style) }}</span>
        <span class="ck-top-score">{{ row.score }}</span>
        <span v-if="row.isPlayer" class="ck-top-you">你</span>
        <span v-else-if="rowState(row) === 'current'" class="ck-top-gain">
          挑战 +{{ gainFor(row) }} / -{{ lossFor(row) }}
        </span>
        <span v-else class="ck-top-lock">{{ topStatusLabel(row) }}</span>
      </button>
    </div>

    <div v-else class="ck-opp-grid">
      <article v-for="row in list" :key="row.id" class="ck-opp-card">
        <div class="ck-opp-top">
          <span class="ck-opp-seal" :style="{ color: row.accent, borderColor: row.accent }">{{ row.seal }}</span>
          <span class="ck-opp-rating">{{ row.rating }}<small>分</small></span>
        </div>
        <h3>{{ row.name }}</h3>
        <p class="ck-opp-epithet">{{ row.epithet }}</p>
        <p class="ck-opp-desc">{{ row.desc }}</p>
        <div class="ck-opp-words">
          <span v-for="word in row.words" :key="word">{{ word }}</span>
        </div>
        <div class="ck-opp-foot">
          <span class="ck-opp-style">{{ styleLabel(row.style) }} · 胜 +{{ gainFor(row) }} / 负 -{{ lossFor(row) }}</span>
          <button type="button" class="ck-btn ck-btn-small" :disabled="disabled" @click="challenge(row)">
            {{ disabled ? '编译中' : '挑战' }} <span>↗</span>
          </button>
        </div>
        <p v-if="row.note" class="ck-opp-note">{{ row.note }}<span v-if="row.from"> · {{ row.from }}</span></p>
      </article>
    </div>
  </section>
</template>
