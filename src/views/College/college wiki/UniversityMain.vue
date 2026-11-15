<script setup>
/**
 * 大学主模块 · 路由容器
 *
 *   #/                    首页（Title + 三张卡片 + 完整目录）
 *   #/campus              校园（Campus.vue，仅按目录切换）
 *   #/study               学习（Study.vue）
 *   #/life                生活（Life.vue）
 *   #/<page>/<item>       直达某页某小节
 *
 * 三个板块各自是独立 .vue，共用 SectionPage 通用壳。
 * Title.vue 放在全局，点品牌回首页。
 */
import { ref, computed, onMounted, onUnmounted } from 'vue'
import Title from '../college components/Title.vue'
import WikiHome from './WikiHome.vue'
import Campus from './Campus.vue'
import Study from './Study.vue'
import Life from './Life.vue'

function parseHash() {
  const parts = decodeURIComponent(location.hash.replace(/^#/, '')).split('/').filter(Boolean)
  if (!parts.length) return { view: 'home', pageId: '', itemId: '' }
  return { view: ['campus', 'study', 'life'].includes(parts[0]) ? 'section' : 'home',
           pageId: parts[0], itemId: parts[1] || '' }
}

const route = ref(parseHash())
const isHome = computed(() => route.value.view === 'home')
const current = computed(() => {
  switch (route.value.pageId) {
    case 'campus': return Campus
    case 'study': return Study
    case 'life': return Life
    default: return null
  }
})

function onHashChange() {
  route.value = parseHash()
  window.scrollTo({ top: 0, behavior: 'auto' })
}
onMounted(() => window.addEventListener('hashchange', onHashChange))
onUnmounted(() => window.removeEventListener('hashchange', onHashChange))

function navigate(path) {
  const target = '#' + (path.startsWith('/') ? path : '/' + path)
  if (location.hash === target) window.scrollTo({ top: 0, behavior: 'smooth' })
  else location.hash = target
}
const goHome = () => navigate('/')
</script>

<template>
  <div class="wiki-app">
    <!-- 首页自带 Title；板块页在这里统一放一个 -->
    <Title v-if="!isHome" @home="goHome" />
    <WikiHome v-if="isHome" :navigate="navigate" @home="goHome" />
    <component
      v-else-if="current"
      :is="current"
      :key="route.pageId"
      :item-id="route.itemId"
      :navigate="navigate"
    />
  </div>
</template>

<style scoped>
.wiki-app {
  max-width: 1080px; margin: 0 auto; padding: 0 1.25rem 4rem;
  font-family: system-ui, "Microsoft YaHei", "PingFang SC", sans-serif;
  line-height: 1.7; color: #111; background: #fff;
  -webkit-font-smoothing: antialiased;
}
</style>
