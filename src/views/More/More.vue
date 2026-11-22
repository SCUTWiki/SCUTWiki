<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import '../../assets/pages.css'

import Title from '../../components/Title.vue'
import EntryList from '../../components/entries/EntryList.vue'
import { useContentStats } from '../../composables/useContentStats'

const route = useRoute()
const { entries } = useContentStats()

// 分模块清单：key 对应 src/content/more/<key>/ 目录
const submodules = [
  { key: 'dangers', label: '常见风险', desc: '诈骗、安全等新生最容易踩的坑' },
  { key: 'maxims', label: '箴言', desc: '一句话经验，短平快' },
  { key: 'misc', label: '杂文', desc: '杂谈、随笔和测试内容' },
]

const moreEntries = computed(() => entries.filter((entry) => entry.module === 'more'))

// 目录里出现、但没在上面登记过的新板块，自动补一项
const discovered = computed(() => {
  const known = new Set(submodules.map((item) => item.key))
  const keys = [...new Set(moreEntries.value.map((entry) => entry.submodule).filter(Boolean))]
  return keys.filter((key) => !known.has(key)).map((key) => ({ key, label: key, desc: '' }))
})

const allSubmodules = computed(() => [...submodules, ...discovered.value])

const currentKey = computed(() => route.params.sub || null)
const current = computed(() => allSubmodules.value.find((item) => item.key === currentKey.value))

const sideItems = computed(() =>
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
</script>

<template>
  <Title />

  <!-- 第一层：选板块 -->
  <main v-if="!currentKey" class="pg">
    <div class="pg-wrap">
      <header class="pg-hero">
        <span class="pg-eyebrow">MORE / 其他模块</span>
        <h1>其他模块</h1>
        <p class="pg-lead">杂文、群分享、兴趣爱好、箴言等等。先选一个板块，进去后左侧可以随时切换板块。</p>
      </header>

      <section class="pg-section">
        <h2>板块</h2>
        <div class="pg-grid three">
          <RouterLink
            v-for="item in sideItems"
            :key="item.key"
            class="pg-card more-card"
            :to="`/more/${item.key}`"
          >
            <span class="pg-tag">{{ item.count }} 篇</span>
            <h3>{{ item.label }}</h3>
            <p>{{ item.desc }}</p>
            <span class="more-card-go">进入 →</span>
          </RouterLink>
        </div>
      </section>
    </div>
  </main>

  <!-- 第二层：左侧分模块切换 + 右侧文章列表 -->
  <main v-else class="pg">
    <div class="pg-wrap">
      <div class="more-shell">
        <aside class="more-side" aria-label="分模块">
          <RouterLink class="more-side-back" to="/more">← 全部板块</RouterLink>
          <RouterLink
            v-for="item in sideItems"
            :key="item.key"
            class="more-side-item"
            :class="{ active: item.key === currentKey }"
            :to="`/more/${item.key}`"
          >
            <span>{{ item.label }}</span>
            <em>{{ item.count }}</em>
          </RouterLink>
        </aside>

        <div class="more-main">
          <header class="pg-hero">
            <span class="pg-eyebrow">MORE / {{ current?.label || currentKey }}</span>
            <h1>{{ current?.label || currentKey }}</h1>
            <p class="pg-lead">{{ current?.desc }}</p>
          </header>

          <section class="pg-section">
            <h2 v-if="list.length">相关文章 · {{ list.length }}</h2>
            <EntryList :entries="list" empty-text="这个板块还没有文章。" />
          </section>
        </div>
      </div>
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

.more-shell {
  display: grid;
  grid-template-columns: 200px minmax(0, 1fr);
  gap: 40px;
  align-items: start;
}
.more-side {
  position: sticky;
  top: 24px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 18px 16px 18px 0;
  border-right: 1px solid rgba(242, 239, 228, 0.12);
}
html[data-theme='light'] .more-side {
  border-color: rgba(19, 34, 27, 0.12);
}
.more-side-back {
  margin-bottom: 14px;
  font-size: 11px;
  letter-spacing: 2px;
  color: inherit;
  opacity: 0.5;
  text-decoration: none;
}
.more-side-back:hover,
.more-side-item:hover {
  color: var(--hp-green-soft);
}
.more-side-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 10px;
  border-left: 2px solid transparent;
  border-radius: 6px;
  font-size: 13px;
  color: inherit;
  text-decoration: none;
  opacity: 0.75;
  transition: background 0.2s, color 0.2s, border-color 0.2s, opacity 0.2s;
}
.more-side-item em {
  font-style: normal;
  font-size: 11px;
  opacity: 0.45;
}
.more-side-item.active {
  background: rgba(242, 239, 228, 0.06);
  border-left-color: var(--hp-green);
  color: var(--hp-green-soft);
  opacity: 1;
}
.more-main {
  min-width: 0;
}

@media (max-width: 860px) {
  .more-shell {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  .more-side {
    position: static;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 8px;
    padding: 0 0 12px;
    border-right: 0;
    border-bottom: 1px solid rgba(242, 239, 228, 0.12);
  }
  .more-side-back {
    width: 100%;
    margin-bottom: 4px;
  }
}
</style>
