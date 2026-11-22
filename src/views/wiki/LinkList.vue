<script setup>
import '../../assets/pages.css'

import Title from '../../components/Title.vue'
import SummaryTabs from '../../components/SummaryTabs.vue'
import { useContentStats, formatDate } from '../../composables/useContentStats'

const { links } = useContentStats()
</script>

<template>
  <Title />

  <main class="pg">
    <div class="pg-wrap">
      <header class="pg-hero">
        <span class="pg-eyebrow">LINKS / 链接</span>
        <h1>链接汇总</h1>
        <p class="pg-lead">
          共 {{ links.length }} 条外链，按更新时间排序。词条 front-matter 的
          <code>links:</code> 会自动去重汇总到这里。
        </p>
      </header>

      <SummaryTabs />

      <section class="pg-section">
        <ul v-if="links.length" class="pg-doc-list">
          <li v-for="link in links" :key="link.url">
            <a :href="link.url" target="_blank" rel="noopener">
              <b>{{ link.host || link.url }}</b>
              <span>{{ formatDate(link.updatedAt) }}</span>
            </a>
          </li>
        </ul>
        <p v-else class="pg-note">还没有登记任何外链。</p>
      </section>
    </div>
  </main>
</template>
