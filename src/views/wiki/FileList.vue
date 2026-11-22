<script setup>
import '../../assets/pages.css'

import Title from '../../components/Title.vue'
import SummaryTabs from '../../components/SummaryTabs.vue'
import { useContentStats, formatDate } from '../../composables/useContentStats'

const { files } = useContentStats()

function humanSize(bytes) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}
</script>

<template>
  <Title />

  <main class="pg">
    <div class="pg-wrap">
      <header class="pg-hero">
        <span class="pg-eyebrow">FILES / 文件</span>
        <h1>文件汇总</h1>
        <p class="pg-lead">
          共 {{ files.length }} 个文件，按更新时间排序。只有在词条 front-matter 的
          <code>files:</code> 里登记、且确实存在的文件才会出现在这里。
        </p>
      </header>

      <SummaryTabs />

      <section class="pg-section">
        <ul v-if="files.length" class="pg-doc-list">
          <li v-for="file in files" :key="file.path">
            <a class="pg-row" :href="file.url" target="_blank" rel="noopener">
              <b>{{ file.title }}</b>
              <span class="pg-row-meta">
                {{ file.ext.toUpperCase() }}
                <template v-if="humanSize(file.size)"> · {{ humanSize(file.size) }}</template>
                <template v-if="file.updatedAt"> · {{ formatDate(file.updatedAt) }}</template>
                · 打开 ↗
              </span>
            </a>
          </li>
        </ul>
        <p v-else class="pg-note">还没有登记任何文件。</p>
      </section>
    </div>
  </main>
</template>
