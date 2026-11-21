<script setup>
import { computed } from 'vue'
import '../../assets/pages.css'

import Title from '../../components/Title.vue'
import { useContentStats, formatDate } from '../../composables/useContentStats'

const { entries } = useContentStats()

const groups = computed(() => {
  const map = new Map()
  for (const entry of entries) {
    if (!map.has(entry.section)) map.set(entry.section, [])
    map.get(entry.section).push(entry)
  }
  return [...map.entries()].map(([section, items]) => ({ section, items }))
})
</script>

<template>
  <Title />

  <main class="pg">
    <div class="pg-wrap">
      <header class="pg-hero">
        <span class="pg-eyebrow">WIKI / 词条</span>
        <h1>全部词条</h1>
        <p class="pg-lead">
          共 {{ entries.length }} 篇，按更新时间排序。内容都来自仓库里的 Markdown 文件，提交后自动出现在这里。
        </p>
      </header>

      <section v-for="group in groups" :key="group.section" class="pg-section">
        <h2>{{ group.section }} · {{ group.items.length }}</h2>
        <ul class="pg-doc-list">
          <li v-for="entry in group.items" :key="entry.slug">
            <RouterLink :to="`/wiki/${entry.slug}`">
              <b>{{ entry.title }}</b>
              <span>{{ formatDate(entry.updatedAt) }}</span>
            </RouterLink>
            <p>{{ entry.summary }}</p>
          </li>
        </ul>
      </section>
    </div>
  </main>
</template>
