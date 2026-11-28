<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import '../../assets/pages.css'

import Title from '../../components/Title.vue'
import { useContentStats, formatDate } from '../../composables/useContentStats'

const route = useRoute()
const router = useRouter()
const { entries, files } = useContentStats()

const entry = computed(() => entries.find((item) => item.slug === route.params.slug))

// 这篇词条引用的附件（public/files 下的文件可直接打开）
const attachments = computed(() =>
  (entry.value?.files || [])
    .map((path) => files.find((item) => item.path === path))
    .filter(Boolean),
)

// 有来源页就返回上一页；直接打开链接时回词条列表
function goBack() {
  if (window.history.state?.back) router.back()
  else router.push('/wiki')
}
</script>

<template>
  <Title />

  <main class="pg">
    <div class="pg-wrap">
      <header class="pg-hero">
        <a class="pg-back" href="#" @click.prevent="goBack">← 返回上一页</a>
        <span class="pg-eyebrow">{{ entry?.section || 'WIKI' }}</span>
        <h1>{{ entry?.title || '词条不存在' }}</h1>
        <p v-if="entry" class="pg-meta">
          更新于 {{ formatDate(entry.updatedAt) }} · {{ entry.links.length }} 条链接
        </p>
      </header>

      <article v-if="entry" class="pg-doc" v-html="entry.html" />

      <section v-if="attachments.length" class="pg-section">
        <h2>附件 · {{ attachments.length }}</h2>
        <ul class="pg-doc-list">
          <li v-for="file in attachments" :key="file.path">
            <a :href="file.url" target="_blank" rel="noopener">
              <b>{{ file.title }}</b>
              <span>{{ file.ext.toUpperCase() }} · 打开 ↗</span>
            </a>
          </li>
        </ul>
      </section>

      <template v-else>
        <p class="pg-lead">没有找到这个词条，可能已经被移动或删除。</p>
        <div class="pg-link-row">
          <RouterLink class="pg-link" to="/wiki">回到列表 →</RouterLink>
        </div>
      </template>
    </div>
  </main>
</template>
