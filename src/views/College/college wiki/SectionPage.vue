<script setup>
/**
 * 板块页（Campus / Study / Life 共用）：
 *  · 所有切换通过 emit('navigate', id) 交给父组件 WikiHome（router hash）统一处理
 *  · 目录点击：让全局 WikiLayout 自己 go()（高亮 + switch 显隐），本地只同步 activeId
 *  · 深链 / 上一篇下一篇：父组件传来的 itemId 变化时，模拟点击对应目录链接完成定位
 *  · 内容：有 md 词条（gen-content 产物）渲染 html，否则显示填写提示
 */
import { computed, ref, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import WikiLayout from '../../../components/WikiLayout.vue'
import FavoriteButton from '../college components/FavoriteButton.vue'
import { useFavorites } from '../college components/useFavorites.js'
import { findPage, pageToc, findItem, neighbors } from './toc.js'
import content from '../../../data/content.json'

const props = defineProps({
  pageId: { type: String, required: true },
  itemId: { type: String, default: '' },
})
const emit = defineEmits(['navigate'])

const page = computed(() => findPage(props.pageId))
const toc = computed(() => pageToc(props.pageId))
const activeId = ref(props.itemId || page.value?.items[0]?.id || '')
const { has, toggle } = useFavorites()

/** 目录点击：WikiLayout 自己 preventDefault + 显隐，这里只同步本地高亮状态 */
function onTocClick(e) {
  const a = e.target.closest('.toc-link')
  if (!a) return
  const id = (a.getAttribute('href') || '').replace(/^#/, '')
  if (page.value?.items.some(i => i.id === id)) activeId.value = id
}
onMounted(() => document.addEventListener('click', onTocClick))
onBeforeUnmount(() => document.removeEventListener('click', onTocClick))

/** 外部 itemId 变化 → 点击对应目录项定位（不直接 go，避免首项触发取消隔离） */
watch(() => props.itemId, async id => {
  if (!id || !page.value?.items.some(i => i.id === id)) return
  activeId.value = id
  // 首项：WikiLayout 挂载时已默认显示，再点会触发「取消隔离」导致空白
  if (id !== page.value.items[0].id) {
    await nextTick()
    document.querySelector(`.wiki .toc-link[href="#${id}"]`)?.click()
  }
}, { immediate: true })

const docBySlug = computed(() => {
  const map = {}
  for (const e of (content.entries || [])) map[e.slug] = e
  return map
})
const currentItem = computed(() => findItem(activeId.value))
const pn = computed(() => neighbors(activeId.value))
</script>

<template>
  <div v-if="page" class="college-section">
    <div class="cs-head">
      <a href="#/" class="cs-back" @click.prevent="emit('navigate', 'home')">← 大学主模块首页</a>
      <span class="cs-crumb">{{ page.label }}</span>
      <h1 class="cs-title">{{ currentItem?.label || page.label }}</h1>
      <FavoriteButton class="cs-fav" :active="has(activeId)" @toggle="toggle(activeId)" />
    </div>

    <WikiLayout :items="toc" label="本页目录" mode="switch" :single="true">
      <section v-for="s in page.items" :key="s.id" :id="s.id" class="cs-doc">
        <div v-if="docBySlug[s.id]" class="cs-md" v-html="docBySlug[s.id].html" />
        <template v-else>
          <div class="cs-stub" :data-kind="s.kind || undefined">
            <p v-if="s.hint" class="cs-hint">{{ s.hint }}</p>
            <p class="cs-empty">……</p>
          </div>
          <div v-if="s.columns?.length" class="cs-cols">
            <article v-for="c in s.columns" :key="c.id" :id="c.id" class="cs-col">
              <h3>{{ c.label }}</h3>
              <div class="cs-stub">
                <p v-if="c.hint" class="cs-hint">{{ c.hint }}</p>
                <p class="cs-empty">……</p>
              </div>
            </article>
          </div>
        </template>
      </section>
    </WikiLayout>

    <nav class="cs-pn" aria-label="上一篇 / 下一篇">
      <a v-if="pn.prev" class="cs-pn-link" :href="`#${pn.prev.id}`" @click.prevent="emit('navigate', pn.prev.id)">
        <small>← 上一篇</small><b>{{ pn.prev.label }}</b>
      </a>
      <span v-else class="cs-pn-gap" />
      <a v-if="pn.next" class="cs-pn-link right" :href="`#${pn.next.id}`" @click.prevent="emit('navigate', pn.next.id)">
        <small>下一篇 →</small><b>{{ pn.next.label }}</b>
      </a>
      <span v-else class="cs-pn-gap" />
    </nav>
  </div>
</template>

<style scoped>
.college-section { --hp-green: #43b581; color: var(--color-text);
  font-family: 'Noto Serif SC', 'Songti SC', Georgia, serif; }
.cs-head { display: flex; align-items: baseline; gap: .8rem; flex-wrap: wrap;
  margin: 1.2rem 0 1.6rem; padding-bottom: .8rem; border-bottom: 1px solid var(--color-border); }
.cs-back { font-size: .84rem; color: var(--hp-green); text-decoration: none; }
.cs-back:hover { text-decoration: underline; }
.cs-crumb { font-size: .84rem; color: var(--color-text); opacity: .7; }
.cs-title { margin: 0; font-size: 1.9rem; font-weight: 700; line-height: 1.2;
  color: var(--color-heading); letter-spacing: .02em; }
.cs-fav { margin-left: auto; }
.cs-doc { margin: 0 0 1.4rem; }
.cs-stub { border: 1px dashed var(--color-border); border-radius: 8px;
  padding: .8rem 1rem; background: var(--color-background-soft); }
.cs-stub[data-kind='quote'] { border-left: 3px solid var(--hp-green); background: var(--color-background); }
.cs-hint { margin: 0 0 .35rem; font-size: .82rem; color: var(--color-text); opacity: .85; }
.cs-hint::before { content: '✎ 填写提示 · '; color: var(--hp-green); }
.cs-empty { margin: 0; min-height: 1.4em; color: var(--color-text); opacity: .45; letter-spacing: .3em; }
.cs-cols { margin: 1rem 0 0 .8rem; padding-left: 1rem; border-left: 2px solid var(--color-border); display: grid; gap: .8rem; }
.cs-col h3 { font-size: .95rem; color: var(--color-heading); }
.cs-col h3::before { content: '▸ '; color: var(--hp-green); }
.cs-md :deep(h1), .cs-md :deep(h2) { color: var(--color-heading); }
.cs-md :deep(a) { color: var(--hp-green); }
.cs-pn { display: grid; grid-template-columns: 1fr 1fr; gap: .8rem;
  margin: 2.4rem 0 0; padding-top: 1.2rem; border-top: 1px solid var(--color-border); }
.cs-pn-link { display: flex; flex-direction: column; gap: .15rem; padding: .7rem .9rem;
  border: 1px solid var(--color-border); border-radius: 8px; text-decoration: none;
  color: var(--color-heading); background: var(--color-background-soft); }
.cs-pn-link:hover { border-color: var(--hp-green); text-decoration: none; }
.cs-pn-link small { font-size: .74rem; color: var(--color-text); opacity: .7; }
.cs-pn-link b { font-size: .92rem; }
.cs-pn-link.right { text-align: right; }
:focus-visible { outline: 2px solid var(--hp-green); outline-offset: 2px; }
@media (max-width: 640px) {
  .cs-pn { grid-template-columns: 1fr; }
  .cs-title { font-size: 1.5rem; }
}
@media (prefers-reduced-motion: reduce) { * { transition: none !important; } }
</style>
