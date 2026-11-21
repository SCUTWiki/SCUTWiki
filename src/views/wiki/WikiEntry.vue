<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import '../../assets/pages.css'

import Title from '../../components/Title.vue'
import { useContentStats, formatDate } from '../../composables/useContentStats'

const route = useRoute()
const { entries } = useContentStats()

const entry = computed(() => entries.find((item) => item.slug === route.params.slug))
</script>

<template>
  <Title />

  <main class="pg">
    <div class="pg-wrap">
      <header class="pg-hero">
        <RouterLink class="pg-back" to="/wiki">← 全部词条</RouterLink>
        <span class="pg-eyebrow">{{ entry?.section || 'WIKI' }}</span>
        <h1>{{ entry?.title || '词条不存在' }}</h1>
        <p v-if="entry" class="pg-meta">
          更新于 {{ formatDate(entry.updatedAt) }} · {{ entry.links.length }} 条链接 ·
          <code>{{ entry.path }}</code>
        </p>
      </header>

      <article v-if="entry" class="pg-doc" v-html="entry.html" />

      <template v-else>
        <p class="pg-lead">没有找到这个词条，可能已经被移动或删除。</p>
        <div class="pg-link-row">
          <RouterLink class="pg-link" to="/wiki">回到列表 →</RouterLink>
        </div>
      </template>
    </div>
  </main>
</template>
