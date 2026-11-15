<script setup>
/**
 * 板块页通用壳（Campus / Study / Life 复用）
 *  · 仅采用「按目录切换」模式（WikiLayout mode="switch" single）
 *  · 切换到目录内后不显示「校园/学习/生活」大标题，只有小节标题
 *  · 底部「上一篇 / 下一篇」按全局篇序自动计算
 */
import { computed, ref, watch, nextTick, onMounted } from 'vue'
import WikiLayout from '../../collage components/WikiLayout.vue'
import Stub from '../../collage components/Stub.vue'
import PrevNext from '../../collage components/PrevNext.vue'
import { findPage, pageToc, neighbors } from './toc.js'

const props = defineProps({
  pageId: { type: String, required: true },
  itemId: { type: String, default: '' },
  navigate: { type: Function, required: true },
})

const page = computed(() => findPage(props.pageId))
const toc = computed(() => pageToc(props.pageId))
const activeId = ref(props.itemId || page.value?.items[0]?.id || '')
const onTocChange = (id) => { activeId.value = id }

/* 深链 #/<page>/<item>：布局挂载后主动跳到该小节 */
const layoutRef = ref(null)
async function focusItem(id) {
  if (!id || !page.value?.items.some(i => i.id === id)) return
  await nextTick()
  layoutRef.value?.go(id)
}
onMounted(() => focusItem(props.itemId))
watch(() => props.itemId, focusItem)

const pn = computed(() => neighbors(activeId.value))
const goHome = () => props.navigate('/')
</script>

<template>
  <div v-if="page" class="section-page">
    <nav class="breadcrumb" aria-label="面包屑">
      <a href="#/" @click.prevent="goHome">首页</a>
      <span aria-hidden="true">/</span>
      <span>{{ page.label }}</span>
      <button type="button" class="back-home" @click="goHome">← 返回首页</button>
    </nav>

    <!-- 仅 switch：点目录只显示对应小节；无板块大标题 -->
    <WikiLayout
      ref="layoutRef" :items="toc" label="本页目录"
      mode="switch" :single="true" @change="onTocChange"
    >
      <section v-for="item in page.items" :key="item.id" :id="item.id" class="wiki-section">
        <h2>{{ item.label }}</h2>
        <Stub :kind="item.kind" :hint="item.hint" />

        <div v-if="item.columns?.length" class="columns">
          <article v-for="col in item.columns" :key="col.id" :id="col.id" class="column">
            <h3>{{ col.label }}</h3>
            <Stub :hint="col.hint" />
          </article>
        </div>
      </section>
    </WikiLayout>

    <PrevNext :prev="pn.prev" :next="pn.next" :navigate="navigate" />
  </div>
</template>

<style scoped>
.section-page { --ink: #111; --gray: #555; --line: #e2e2e2;
  --brand: #1a7f4b; color: var(--ink); }

.breadcrumb { display: flex; align-items: center; gap: .5rem; flex-wrap: wrap;
  font-size: .82rem; color: var(--gray); margin: 1.5rem 0 1.8rem; }
.breadcrumb a { color: var(--brand); text-decoration: none; }
.breadcrumb a:hover { text-decoration: underline; }
.back-home { margin-left: auto; font: inherit; font-size: .8rem; cursor: pointer;
  color: var(--brand); background: #fff; border: 1px solid var(--line);
  border-radius: 4px; padding: .25rem .75rem; }
.back-home:hover { border-color: var(--brand); }

.wiki-section { margin: 0 0 1.5rem; }
.wiki-section h2 { margin: 0 0 .6rem; }
.columns { margin: 1rem 0 0; padding-left: 1rem; border-left: 2px solid var(--line);
  display: grid; gap: .8rem; }
.column h3 { margin: 0 0 .4rem; }
.column h3::before { content: '▸ '; color: var(--brand); }

:focus-visible { outline: 2px solid var(--brand); outline-offset: 2px; }
</style>
