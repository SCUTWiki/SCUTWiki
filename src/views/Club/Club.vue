<script setup>
import { computed } from 'vue'
import '../../assets/pages.css'

import Title from '../../components/Title.vue'
import { useContentStats } from '../../composables/useContentStats'

const { entries } = useContentStats()

const orgEntries = computed(() =>
  entries
    .filter((entry) => entry.module === 'organization')
    .sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || ''))),
)
</script>

<template>
  <Title />

  <main class="pg">
    <div class="pg-wrap">
      <header class="pg-hero">
        <span class="pg-eyebrow">ORGANIZATION / 组织模块</span>
        <h1>组织模块</h1>
        <p class="pg-lead">部门、社团的内容介绍与交流。</p>
      </header>

      <section
        v-for="entry in orgEntries"
        :key="entry.slug"
        class="org-article"
      >
        <h2 class="org-title">{{ entry.title }}</h2>
        <p class="pg-meta">{{ entry.summary }}</p>
        <article class="pg-doc" v-html="entry.html" />
      </section>

      <p v-if="!orgEntries.length" class="pg-lead">组织模块还没有内容，等待投稿。</p>

      <div style="margin-top: 2.5rem">
        <RouterLink class="pg-link" to="/wiki">查看全部词条 →</RouterLink>
      </div>
    </div>
  </main>
</template>

<style scoped>
/* 文章标题：字号大、加粗、用衬线体，跟页面 h1 一个调性 */
.org-title {
  margin: 0 0 8px;
  font-family: var(--hp-serif);
  font-size: clamp(24px, 3vw, 32px);
  font-weight: 700;
  letter-spacing: 1px;
  line-height: 1.3;
}

/* 和上面内容拉开距离 */
.org-article {
  margin-top: 44px;
  padding-top: 32px;
  border-top: 1px solid rgba(242, 239, 228, 0.14);
}

/* 浅色主题下的分隔线 */
:global(html[data-theme='light']) .org-article {
  border-color: rgba(19, 34, 27, 0.14);
}
</style>