<script setup>
import { computed, nextTick, ref } from 'vue'

const props = defineProps({
  words: { type: Array, default: () => ['', '', '', '', ''] },
  name: { type: String, default: '' },
  errors: { type: Array, default: () => [] },
  compiling: { type: Boolean, default: false },
  error: { type: String, default: '' },
  aiEnabled: { type: Boolean, default: false },
  aiLabel: { type: String, default: '本地语义编译' },
  score: { type: Number, default: 0 },
  hasCompiled: { type: Boolean, default: false },
  stale: { type: Boolean, default: false },
})

const emit = defineEmits(['update:words', 'update:name', 'compile', 'example', 'save-name', 'open-ai', 'focus-opponents'])

const inputs = ref([])
const numerals = ['壹', '贰', '叁', '肆', '伍']

function setWord(index, value) {
  const next = [...props.words]
  next[index] = value.slice(0, 32)
  emit('update:words', next)
}

function errorFor(index) {
  return props.errors.find((item) => item.index === index)
}

function onEnter() {
  emit('compile')
}

async function focusFirstEmpty() {
  await nextTick()
  const idx = props.words.findIndex((word) => !String(word || '').trim())
  if (idx >= 0) inputs.value[idx]?.focus()
}

defineExpose({ focusFirstEmpty })

const filled = computed(() => props.words.filter((word) => String(word || '').trim()).length)
</script>

<template>
  <section class="ck-forge" aria-label="词条输入">
    <div class="ck-forge-head">
      <div>
        <span class="ck-kicker">YOUR FIVE WORDS</span>
        <h2>先起名，再喂它五个词</h2>
      </div>
      <span class="ck-forge-count">{{ filled }} / 5</span>
    </div>

    <label class="ck-name-field">
      <span class="ck-name-label">斗士名</span>
      <input
        :value="name"
        maxlength="12"
        placeholder="无名氏"
        autocomplete="off"
        spellcheck="false"
        @input="emit('update:name', $event.target.value)"
        @change="emit('save-name')"
      />
      <span class="ck-name-hint">改名不扣分</span>
    </label>

    <div class="ck-slots">
      <label
        v-for="(word, index) in words"
        :key="index"
        class="ck-slot"
        :class="{ 'is-error': errorFor(index), 'is-filled': String(word || '').trim() }"
      >
        <span class="ck-slot-no">{{ numerals[index] }}</span>
        <input
          ref="inputs"
          :value="word"
          maxlength="16"
          placeholder="输入一个方向性概念"
          autocomplete="off"
          spellcheck="false"
          @input="setWord(index, $event.target.value)"
          @keydown.enter.prevent="onEnter"
        />
        <span class="ck-slot-len">{{ Array.from(String(word || '')).length }}/16</span>
        <span v-if="errorFor(index)" class="ck-slot-error">{{ errorFor(index).message }}</span>
      </label>
    </div>

    <p v-if="error" class="ck-form-error">{{ error }}</p>

    <div class="ck-forge-tools">
      <button type="button" class="ck-btn ck-btn-ghost" @click="emit('example')">换一组示例</button>
      <button type="button" class="ck-btn ck-btn-ghost" @click="emit('open-ai')">
        {{ aiEnabled ? 'AI 编译已开' : '编译引擎' }}
      </button>
      <span class="ck-engine-dot" :class="{ 'is-ai': aiEnabled }" />
      <span class="ck-engine-label">{{ aiLabel }}</span>
    </div>

    <button type="button" class="ck-btn ck-btn-primary ck-compile-btn" :disabled="compiling" @click="emit('compile')">
      <span>{{ compiling ? '正在拆解词条…' : hasCompiled ? '重新编译五词' : '编译五词' }}</span>
      <span class="ck-btn-arrow">→</span>
    </button>

    <p class="ck-forge-note">
      词条越像“一个方向”，小人越知道怎么打。新词会先拆词根、意象和校园梗，再决定招式与机制；认不出来时会标成低置信的“自由解释”。太泛的词会被锁定到一个具体招式；绝对词会成立，但会留下破绽，也能被「反绝对」拆掉；作弊/控制类词仍会被拒绝。
      <template v-if="score > 0">改词条会把当前积分清零，改名不受影响。</template>
      <template v-else>改名不扣分，改词条会重置当前词条积分。</template>
    </p>

    <div v-if="stale && hasCompiled" class="ck-stale-hint">
      词条改动还未编译，点“重新编译”后才会生效。
      <button type="button" class="ck-inline-link" @click="emit('focus-opponents')">先去选对手</button>
    </div>
  </section>
</template>
