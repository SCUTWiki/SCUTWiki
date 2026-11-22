<script setup>
import { computed } from 'vue'

const props = defineProps({
  contracts: { type: Array, default: () => [] },
  results: { type: Array, default: () => [] },
  progress: { type: Array, default: () => [] },
  compiling: { type: Boolean, default: false },
  error: { type: String, default: '' },
  words: { type: Array, default: () => [] },
})

const labels = ['壹', '贰', '叁', '肆', '伍']

const showSkeleton = computed(() => props.compiling && props.contracts.length === 0)

function resultFor(index) {
  return props.results[index] || null
}

function progressFor(index) {
  return props.progress[index] || null
}

function sourceClass(result) {
  if (!result) return ''
  return `is-${result.source || 'local'}`
}

function statLine(contract) {
  const bits = []
  if (contract.damage > 0) bits.push(`伤害 ${contract.damage}${contract.hits > 1 ? ` ×${contract.hits}` : ''}`)
  if ((contract.volatility || 0) >= 0.2) bits.push(`波动 ${Math.round(contract.volatility * 100)}%`)
  bits.push(`冷却 ${contract.cooldown}s`)
  if (contract.range > 0) bits.push(`射程 ${contract.range}`)
  if (contract.aoeRadius > 0) bits.push(`范围 ${contract.aoeRadius}`)
  return bits.join(' · ')
}

const RECOGNITION_LABELS = {
  recipe: '专属配方',
  semantic: '新词识别',
  lexicon: '词根识别',
  fallback: '自由解释',
  ai: 'AI 语义识别',
  absolute: '绝对词',
  antiAbsolute: '反绝对',
}

function showRecognition(contract) {
  const kind = contract.recognition?.kind
  return ['recipe', 'semantic', 'fallback', 'ai', 'absolute', 'antiAbsolute'].includes(kind)
}

function recognitionLabel(contract) {
  return RECOGNITION_LABELS[contract.recognition?.kind] || '识别'
}

function recognitionConfidence(contract) {
  return Math.round((contract.recognition?.confidence || 0) * 100)
}

function progressText(index) {
  const item = progressFor(index)
  if (!item) return '排队中'
  if (item.status === 'lookup') return '查词库…'
  if (item.status === 'ai') return 'AI 拆解中…'
  if (item.status === 'done') return item.label || '完成'
  return '处理中'
}
</script>

<template>
  <section class="ck-codex-strip" aria-label="词条编译结果">
    <div class="ck-section-head ck-section-head-tight">
      <div>
        <span class="ck-kicker">MECHANISM CONTRACTS</span>
        <h2>词条被拆成了什么</h2>
      </div>
      <p class="ck-section-note">每个词只负责一件事；相同或相近的词会复用同一条能力记录。</p>
    </div>

    <p v-if="error" class="ck-form-error">{{ error }}</p>

    <div class="ck-contract-grid">
      <template v-if="showSkeleton">
        <div v-for="index in 5" :key="`skeleton-${index}`" class="ck-contract is-skeleton">
          <div class="ck-contract-top">
            <span class="ck-contract-no">{{ labels[index - 1] }}</span>
            <span class="ck-skeleton-line short" />
          </div>
          <span class="ck-skeleton-line" />
          <span class="ck-skeleton-line" />
          <span class="ck-skeleton-line tiny" />
          <p class="ck-contract-progress">{{ progressText(index - 1) }}</p>
        </div>
      </template>

      <template v-else>
        <article
          v-for="(contract, index) in contracts"
          :key="`${contract.key}-${index}`"
          class="ck-contract"
          :class="{ 'is-locked': contract.locked }"
        >
          <div class="ck-contract-top">
            <span class="ck-contract-no">{{ labels[index] }}</span>
            <span class="ck-contract-word">{{ contract.word }}</span>
            <span class="ck-source-badge" :class="sourceClass(resultFor(index))">
              {{ resultFor(index)?.label || (contract.source === 'ai' ? 'AI 编译' : '本地编译') }}
            </span>
          </div>

          <div class="ck-contract-skill">
            <span class="ck-contract-glyph" :style="{ color: contract.color, borderColor: contract.color }">
              {{ contract.gear?.glyph || '技' }}
            </span>
            <div>
              <h3>{{ contract.skill }}</h3>
              <p>{{ contract.attackLabel }} · {{ contract.conceptLabel }} · {{ contract.gear?.name }}</p>
            </div>
          </div>

          <p class="ck-contract-desc">{{ contract.desc }}</p>

          <p
            v-if="showRecognition(contract)"
            class="ck-contract-recognition"
            :class="`is-${contract.recognition.level || 'medium'}`"
            :title="contract.recognition.rationale"
          >
            <b>{{ recognitionLabel(contract) }}</b>
            <span v-if="contract.recognition.concepts?.length">{{ contract.recognition.concepts.slice(0, 3).join(' · ') }}</span>
            <em>{{ recognitionConfidence(contract) }}%</em>
          </p>

          <div class="ck-contract-stats">{{ statLine(contract) }}</div>

          <div class="ck-contract-tags">
            <span v-for="tag in contract.tags.slice(0, 7)" :key="tag">{{ tag }}</span>
          </div>

          <div v-if="contract.mechanics?.length" class="ck-contract-mechanics">
            <p v-for="mechanic in contract.mechanics" :key="mechanic.type">
              <b>{{ mechanic.name }}</b>{{ mechanic.desc }}
            </p>
          </div>

          <p v-if="contract.locked" class="ck-contract-lock">
            泛词锁定：{{ contract.lockNote || '按站内热度取了一个可玩方向' }}
          </p>
          <p
            v-else-if="resultFor(index)?.message && resultFor(index)?.source !== 'local'"
            class="ck-contract-note"
          >{{ resultFor(index).message }}</p>
        </article>
      </template>
    </div>

    <p v-if="compiling" class="ck-compile-status">
      <span class="ck-spinner" />
      正在把词条写成机制合约。AI 不可用时会自动回退到本地确定性编译器。
    </p>
  </section>
</template>
