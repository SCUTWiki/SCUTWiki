<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import '../../assets/pages.css'

import Title from '../../components/Title.vue'
import WikiLayout from '../../components/WikiLayout.vue'
import { useContentStats, formatDate } from '../../composables/useContentStats'

const route = useRoute()
const { entries } = useContentStats()

// 分模块清单：key 对应 src/content/more/<key>/ 目录
const submodules = [
  { key: 'dangers', label: '常见风险', desc: '诈骗、安全等新生最容易踩的坑' },
  { key: 'maxims', label: '箴言', desc: '一句话经验，短平快' },
  { key: 'misc', label: '杂文', desc: '杂谈、随笔和测试内容' },
]

const moreEntries = computed(() => entries.filter((entry) => entry.module === 'more'))

// 目录里出现、但没在上面登记过的新板块，自动补一张卡片
const discovered = computed(() => {
  const known = new Set(submodules.map((item) => item.key))
  const keys = [...new Set(moreEntries.value.map((entry) => entry.submodule).filter(Boolean))]
  return keys.filter((key) => !known.has(key)).map((key) => ({ key, label: key, desc: '' }))
})

const allSubmodules = computed(() => [...submodules, ...discovered.value])

const currentKey = computed(() => route.params.sub || null)
const current = computed(() => allSubmodules.value.find((item) => item.key === currentKey.value))

const cards = computed(() =>
  allSubmodules.value.map((item) => ({
    ...item,
    count: moreEntries.value.filter((entry) => entry.submodule === item.key).length,
  })),
)

const list = computed(() =>
  moreEntries.value
    .filter((entry) => entry.submodule === currentKey.value)
    .sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || ''))),
)

const navItems = computed(() => list.value.map((entry) => ({ id: entry.slug, label: entry.title })))
</script>

<template>
  <Title />

  <!-- 第一层：选板块 -->
  <main v-if="!currentKey" class="pg">
    <div class="pg-wrap">
      <header class="pg-hero">
        <span class="pg-eyebrow">MORE / 其他模块</span>
        <h1>其他模块</h1>
        <p class="pg-lead">杂文、群分享、兴趣爱好、箴言等等。先选一个板块，进去后左侧会出现该板块的目录。</p>
      </header>

      <section class="pg-section">
        <h2>板块</h2>
        <div class="pg-grid three">
          <RouterLink
            v-for="card in cards"
            :key="card.key"
            class="pg-card more-card"
            :to="`/more/${card.key}`"
          >
            <span class="pg-tag">{{ card.count }} 篇</span>
            <h3>{{ card.label }}</h3>
            <p>{{ card.desc }}</p>
            <span class="more-card-go">进入 →</span>
          </RouterLink>
        </div>
      </section>
    </div>
  </main>

  <!-- 第二层：某个板块，左侧导航 + 右侧正文 -->
  <main v-else class="pg">
    <div class="pg-wrap">
      <RouterLink class="pg-back" to="/more">← 全部板块</RouterLink>

      <header class="pg-hero">
        <span class="pg-eyebrow">MORE / {{ current?.label || currentKey }}</span>
        <h1>{{ current?.label || currentKey }}</h1>
        <p class="pg-lead">{{ current?.desc }}</p>
      </header>

      <WikiLayout v-if="list.length" :items="navItems" :single="true">
        <section v-for="entry in list" :key="entry.slug" :id="entry.slug" mode="switch">
          <h2>{{ entry.title }}</h2>
          <p class="pg-meta">更新于 {{ formatDate(entry.updatedAt) }}</p>
          <article class="pg-doc" v-html="entry.html" />
        </section>
      </WikiLayout>

      <p v-else class="pg-note">这个板块还没有词条，往 src/content/more/{{ currentKey }}/ 里加 .md 即可。</p>
    </div>
  </main>
</template>

<style scoped>
.more-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  text-decoration: none;
  color: #241c12;
  transition: transform 0.2s, box-shadow 0.2s;
}
.more-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 20px 34px rgba(0, 0, 0, 0.3);
}
.more-card h3 {
  margin: 0;
  font-size: 16px;
}
.more-card p {
  margin: 0;
  font-size: 12px;
  line-height: 1.7;
  opacity: 0.65;
}
.more-card-go {
  margin-top: 10px;
  font-size: 11px;
  letter-spacing: 1px;
  color: #1d5b45;
}
</style>
