<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'

const props = defineProps({
  items: { type: Array, required: true },
})

const active = ref('')
const scrolled = ref(false)
let ticking = false

function update() {
  ticking = false
  scrolled.value = window.scrollY > 240

  // 用视口坐标判断，避免 offsetParent 不同导致的高亮错位
  let current = ''
  for (const item of props.items) {
    const el = document.getElementById(item.id)
    if (!el) continue
    if (el.getBoundingClientRect().top <= 180) current = item.id
  }
  const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4
  if (atBottom) current = props.items[props.items.length - 1]?.id || current

  active.value = current || props.items[0]?.id || ''
}

function onScroll() {
  if (ticking) return
  ticking = true
  requestAnimationFrame(update)
}

function go(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function toTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(() => {
  update()
  window.addEventListener('scroll', onScroll, { passive: true })
})

onBeforeUnmount(() => window.removeEventListener('scroll', onScroll))
</script>

<template>
  <nav class="hp-rail" aria-label="页面索引">
    <a
      v-for="item in items"
      :key="item.id"
      class="hp-rail-item"
      :class="{ on: active === item.id }"
      :href="`#${item.id}`"
      @click.prevent="go(item.id)"
    >
      <i />
      <span>{{ item.label }}</span>
    </a>

    <a class="hp-rail-top" :class="{ show: scrolled }" href="#" @click.prevent="toTop">↑ 顶部</a>
  </nav>
</template>
