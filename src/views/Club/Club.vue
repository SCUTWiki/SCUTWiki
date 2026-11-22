<script setup>
import { computed } from 'vue'
import '../../assets/pages.css'

import Title from '../../components/Title.vue'
import { useContentStats } from '../../composables/useContentStats'

const { entries } = useContentStats()

// 指定展示顺序：校级组织在前，社团在后
const ORDER = ['school-orgs', 'clubs']

const orgEntries = computed(() => {
  const list = entries.filter((entry) => entry.module === 'organization')
  return list.sort((a, b) => {
    const ia = ORDER.indexOf(a.slug)
    const ib = ORDER.indexOf(b.slug)
    // 在 ORDER 里的按顺序排，不在的排最后
    if (ia !== -1 && ib !== -1) return ia - ib
    if (ia !== -1) return -1
    if (ib !== -1) return 1
    return String(b.updatedAt || '').localeCompare(String(a.updatedAt || ''))
  })
})

// 从 html 里抽取 h2 标题，生成目录
function tocOf(html) {
  const items = []
  const re = /<h2[^>]*>([\s\S]*?)<\/h2>/g
  let m
  while ((m = re.exec(html))) {
    const text = m[1].replace(/<[^>]+>/g, '').trim()
    if (text) items.push({ id: `h-${items.length}`, text })
  }
  return items
}

// 给 html 里的每个 h2 加上 id，供跳转使用
function withAnchors(html) {
  let i = 0
  return html.replace(/<h2(\s[^>]*)?>/g, (all, attr) => {
    const id = `h-${i++}`
    return `<h2 id="${id}"${attr || ''}>`
  })
}

const articles = computed(() =>
  orgEntries.value.map((entry) => ({
    ...entry,
    toc: tocOf(entry.html),
    html: withAnchors(entry.html),
  })),
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

      <div class="org-shell">
        <!-- 左侧目录：跟随滚动 -->
        <aside v-if="articles.length" class="org-side">
          <p class="org-toc-title">本页目录</p>
          <ul class="org-toc-list">
            <li v-for="art in articles" :key="art.slug">
              <a class="org-toc-h1" :href="`#${art.slug}`">{{ art.title }}</a>
              <ul v-if="art.toc.length" class="org-toc-sub">
                <li v-for="item in art.toc" :key="item.id">
                  <a :href="`#${item.id}`">{{ item.text }}</a>
                </li>
              </ul>
            </li>
          </ul>
        </aside>

        <!-- 右侧正文 -->
        <div class="org-main">
          <section
            v-for="art in articles"
            :key="art.slug"
            :id="art.slug"
            class="org-article"
          >
            <h2 class="org-title">{{ art.title }}</h2>
            <p class="pg-meta">{{ art.summary }}</p>
            <article class="pg-doc" v-html="art.html" />
          </section>

          <p v-if="!articles.length" class="pg-lead">组织模块还没有内容，等待投稿。</p>

          <div style="margin-top: 2.5rem">
            <RouterLink class="pg-link" to="/wiki">查看全部词条 →</RouterLink>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
/* ===== 两栏布局 ===== */
.org-shell {
  display: grid;
  grid-template-columns: 200px minmax(0, 1fr);
  gap: 48px;
  align-items: start;
  margin-top: 40px;
}

/* ===== 左侧固定目录 ===== */
.org-side {
  position: sticky;
  top: 24px;
  align-self: start;
  max-height: calc(100vh - 48px);
  overflow-y: auto;
  padding-right: 16px;
  border-right: 1px solid rgba(242, 239, 228, 0.14);
}
:global(html[data-theme='light']) .org-side {
  border-color: rgba(19, 34, 27, 0.14);
}

.org-toc-title {
  margin: 0 0 14px;
  font-size: 10px;
  letter-spacing: 3px;
  opacity: 0.45;
}

.org-toc-list,
.org-toc-sub {
  list-style: none;
  margin: 0;
  padding: 0;
}

.org-toc-list > li {
  margin-bottom: 18px;
}

.org-toc-h1 {
  display: block;
  margin-bottom: 6px;
  font-size: 14px;
  font-weight: 600;
  color: inherit;
  text-decoration: none;
  opacity: 0.95;
}

.org-toc-sub {
  margin-left: 2px;
  padding-left: 12px;
  border-left: 1px solid rgba(242, 239, 228, 0.14);
}
:global(html[data-theme='light']) .org-toc-sub {
  border-color: rgba(19, 34, 27, 0.14);
}

.org-toc-sub a {
  display: block;
  padding: 4px 0;
  font-size: 12.5px;
  line-height: 1.5;
  color: inherit;
  text-decoration: none;
  opacity: 0.62;
  transition: opacity 0.2s, color 0.2s;
}
.org-toc-sub a:hover,
.org-toc-h1:hover {
  color: var(--hp-green-soft);
  opacity: 1;
}

/* ===== 右侧正文 ===== */
.org-main {
  min-width: 0;
}

.org-title {
  margin: 0 0 8px;
  font-family: var(--hp-serif);
  font-size: clamp(24px, 3vw, 32px);
  font-weight: 700;
  letter-spacing: 1px;
  line-height: 1.3;
}

.org-article {
  scroll-margin-top: 24px;
}
.org-article + .org-article {
  margin-top: 56px;
  padding-top: 40px;
  border-top: 1px solid rgba(242, 239, 228, 0.14);
}
:global(html[data-theme='light']) .org-article + .org-article {
  border-color: rgba(19, 34, 27, 0.14);
}

/* 正文 h2 跳转留距离 */
:deep(.pg-doc h2) {
  scroll-margin-top: 24px;
}

/* ===== 窄屏：变回上下堆叠 ===== */
@media (max-width: 860px) {
  .org-shell {
    grid-template-columns: 1fr;
    gap: 16px;
    margin-top: 28px;
  }
  .org-side {
    position: static;
    max-height: none;
    padding: 16px;
    border-right: 0;
    border: 1px solid rgba(242, 239, 228, 0.14);
    border-radius: 8px;
  }
}
</style>