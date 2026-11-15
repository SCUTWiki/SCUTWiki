<script setup>
import { onBeforeUnmount, ref } from 'vue'
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

const peek = ref(false)
let timer = null

function startPeek() {
  clearTimeout(timer)
  // 悬停满 1 秒才弹出代表内容
  timer = setTimeout(() => { peek.value = true }, 1000)
}

function stopPeek() {
  clearTimeout(timer)
  peek.value = false
}

onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <RouterLink
    class="hp-mod"
    :to="href"
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
      </div>
    </div>

    <transition name="hp-peek">
      <div v-if="peek" class="hp-peek" role="tooltip">
        <strong>{{ name }} · 代表内容</strong>
        <p>{{ featured }}</p>
      </div>
    </transition>
  </RouterLink>
</template>
