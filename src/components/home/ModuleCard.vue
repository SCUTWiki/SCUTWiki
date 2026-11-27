<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import ModuleGlyph from './ModuleGlyph.vue'

const props = defineProps({
  href: { type: String, default: '#' },
  index: { type: String, default: '' },
  name: { type: String, required: true },
  desc: { type: String, default: '' },
  glyph: { type: String, required: true },
  toc: { type: Array, default: () => [] },
  featured: { type: String, default: '代表内容待补充' },
})

const router = useRouter()

const peek = ref(false)
const flipped = ref(false)
const touch = ref(false)
let timer = null

onMounted(() => {
  touch.value = window.matchMedia('(hover: none), (max-width: 560px)').matches
})

function startPeek() {
  if (touch.value) return
  clearTimeout(timer)
  // 悬停满 1 秒才弹出代表内容
  timer = setTimeout(() => { peek.value = true }, 1000)
}

function stopPeek() {
  clearTimeout(timer)
  peek.value = false
}

/**
 * 手机上第一次点卡片先翻到背面看目录，
 * 背面有「进入模块」按钮；再点卡片其它地方翻回正面。
 */
function onCardClick(event) {
  if (!touch.value) {
    enter()
    return
  }

  if (!flipped.value) {
    event.preventDefault()
    flipped.value = true
    return
  }

  if (event.target.closest?.('[data-enter]')) return

  event.preventDefault()
  flipped.value = false
}

function enter() {
  router.push(props.href)
}

onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <div
    class="hp-mod"
    :class="{ 'is-flipped': flipped }"
    role="link"
    tabindex="0"
    @click="onCardClick"
    @keydown.enter.prevent="enter"
    @mouseenter="startPeek"
    @mouseleave="stopPeek"
    @focus="startPeek"
    @blur="stopPeek"
  >
    <div class="hp-mod-inner">
      <!-- 正面 -->
      <div class="hp-mod-face hp-mod-front">
        <span class="hp-idx">{{ index }}</span>
        <ModuleGlyph :name="glyph" />
        <h3 class="hp-name">{{ name }}</h3>
        <p v-if="desc" class="hp-desc" v-html="desc" />
      </div>

      <!-- 背面：该模块的主要目录 -->
      <div class="hp-mod-face hp-mod-back">
        <span class="hp-idx">{{ index }}</span>
        <h3 class="hp-name">{{ name }}</h3>
        <ul class="hp-toc">
          <li v-for="item in toc" :key="item">{{ item }}</li>
        </ul>
        <button class="hp-mod-enter" type="button" data-enter @click.stop="enter">
          进入模块 →
        </button>
      </div>
    </div>

    <transition name="hp-peek">
      <div v-if="peek" class="hp-peek" role="tooltip">
        <strong>{{ name }} · 代表内容</strong>
        <p>{{ featured }}</p>
      </div>
    </transition>
  </div>
</template>
