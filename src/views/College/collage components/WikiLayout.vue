<script setup>
/**
 * 目录布局（基于用户提供的 Downloads/WikiLayout.vue，做最小改造）
 *
 * 两种用法：
 *   <WikiLayout :items="toc"> … </WikiLayout>              → scroll：内容全显示，点目录滚动定位
 *   <WikiLayout :items="toc" mode="switch" :single="true"> → 只显示当前目录项那一块
 *
 * 本工程只采用 switch 模式。相比原版新增：
 *   · emit('change', id)      目录项变化时通知宿主
 *   · defineExpose({ go })    宿主可主动跳转到某个条目
 *   · CSS 变量改为黑白绿令牌；补齐原版依赖的 VitePress 变量
 */
import { computed, defineExpose, defineEmits, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps({
  // [{ id, label, children?: [...] }]；id 必须和正文里 <section id="..."> 一致
  items: { type: Array, required: true },
  label: { type: String, default: '本页目录' },
  mode: {
    type: String,
    default: 'scroll',
    validator: (value) => ['scroll', 'switch'].includes(value),
  },
  // 单选显示：点击任意条目都只显示它自己，其他块全部隐藏
  single: { type: Boolean, default: true },
  /** 是否把目录项同步到地址栏 hash（多页路由下由外层管 hash，设 false） */
  syncHash: { type: Boolean, default: false },
})

const emit = defineEmits(['change'])
const open = ref(false)
const contentRef = ref(null)

const flatItems = computed(() =>
  props.items.flatMap((item) => [item, ...(item.children ?? [])]),
)
const parentOf = computed(() => {
  const map = new Map()
  for (const item of props.items) {
    for (const child of item.children ?? []) map.set(child.id, item)
  }
  return map
})

const activeId = ref(flatItems.value[0]?.id ?? '')
const isolated = ref(props.mode === 'switch')
const isolateId = ref('')

function groupOf(item) {
  return parentOf.value.get(item.id) ?? item
}
const isActive = (item) => item.id === activeId.value
const hasActiveChild = (item) =>
  item.children?.some((child) => child.id === activeId.value) ?? false

function modeOf(item) {
  if (item.mode) return item.mode
  const el = document.getElementById(item.id)
  const attr = el?.getAttribute('data-mode') ?? el?.getAttribute('mode')
  if (attr === 'switch' || attr === 'scroll') return attr
  const parent = parentOf.value.get(item.id)
  if (parent) return modeOf(parent)
  return props.mode
}

/* ---------------- 滚动高亮（非 isolated 时才生效） ---------------- */
let ticking = false
let lockUntil = 0

function updateActive() {
  ticking = false
  if (isolated.value) return
  if (Date.now() < lockUntil) return
  const visible = visibleItems()
  if (!visible.length) return

  const doc = document.documentElement
  const canScroll = doc.scrollHeight > window.innerHeight + 4
  const atBottom = window.innerHeight + window.scrollY >= doc.scrollHeight - 4
  if (canScroll && atBottom) {
    activeId.value = visible[visible.length - 1].id
    return
  }
  const marker = window.scrollY + 100
  let current = visible[0].id
  for (const item of visible) {
    const el = document.getElementById(item.id)
    if (!el) continue
    if (el.getBoundingClientRect().top + window.scrollY <= marker) current = item.id
  }
  activeId.value = current
}

function visibleItems() {
  return flatItems.value.filter((item) => {
    const el = document.getElementById(item.id)
    return !!el && el.offsetParent !== null
  })
}
function onScroll() {
  if (ticking) return
  ticking = true
  requestAnimationFrame(updateActive)
}

/* ---------------- 显隐控制（不依赖标签名） ---------------- */
function syncVisibility() {
  const content = contentRef.value
  if (!content) return
  const targetId = isolated.value ? isolateId.value || activeId.value : activeId.value
  const activeEl = document.getElementById(targetId)
  if (isolated.value && !activeEl) isolated.value = false

  const ids = new Set(flatItems.value.map((item) => item.id))
  for (const el of content.querySelectorAll('[id]')) {
    if (!ids.has(el.id)) continue
    const item = flatItems.value.find((entry) => entry.id === el.id)
    const isSwitch = item ? modeOf(item) === 'switch' : false
    const inChain = !!activeEl &&
      (el === activeEl || el.contains(activeEl) || activeEl.contains(el))
    const show = isolated.value ? inChain : !isSwitch
    el.style.display = show ? '' : 'none'
  }
}

watch([activeId, isolated, isolateId], async () => {
  await nextTick()
  syncVisibility()
})
watch(activeId, (id) => emit('change', id))

/* ---------------- 初始化 / 销毁 ---------------- */
onMounted(() => {
  const hash = decodeURIComponent(window.location.hash.slice(1))
  const hashItem = flatItems.value.find((item) => item.id === hash)
  if (hashItem) activeId.value = hashItem.id

  // 纯 switch：默认只显示第一组（含其子项），与「仅按目录切换」一致
  if (props.mode === 'switch') {
    isolated.value = true
    isolateId.value = groupOf(hashItem ?? flatItems.value[0]).id
    syncVisibility()
    return
  }

  if (isolated.value || (hashItem && modeOf(hashItem) === 'switch')) {
    isolated.value = true
    isolateId.value = groupOf(hashItem ?? flatItems.value[0]).id
    syncVisibility()
    return
  }
  syncVisibility()
  if (!visibleItems().length) {
    isolated.value = true
    isolateId.value = groupOf(flatItems.value[0]).id
    syncVisibility()
    return
  }
  updateActive()
  const first = flatItems.value[0]
  const firstEl = first ? document.getElementById(first.id) : null
  if (first && (!firstEl || firstEl.offsetParent === null)) {
    isolated.value = true
    isolateId.value = groupOf(first).id
    activeId.value = first.id
    syncVisibility()
  }
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll, { passive: true })
  if (hashItem) requestAnimationFrame(() => document.getElementById(hashItem.id)?.scrollIntoView())
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('resize', onScroll)
})

/* ---------------- 点击目录 / 外部跳转 ---------------- */
async function go(item) {
  const target = typeof item === 'string'
    ? flatItems.value.find((entry) => entry.id === item)
    : item
  if (!target) return

  const group = groupOf(target)
  const wasActive = target.id === activeId.value && isolated.value && isolateId.value === group.id

  const changed = target.id !== activeId.value
  activeId.value = target.id // watch(activeId) 会 emit('change')
  lockUntil = Date.now() + 800
  open.value = false
  // id 未变化时 watch 不触发，这里兜底同步一次显隐（深链指向首项的情况）
  if (!changed) { await nextTick(); syncVisibility() }

  if (wasActive && props.single) {
    isolated.value = false
    isolateId.value = ''
    await nextTick()
    syncVisibility()
    lockUntil = 0
    updateActive()
    return
  }

  if (props.single || modeOf(target) === 'switch') {
    isolated.value = true
    isolateId.value = group.id
    await nextTick()
    syncVisibility()
    requestAnimationFrame(() => {
      document.getElementById(target.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
    return
  }

  isolated.value = false
  isolateId.value = ''
  await nextTick()
  syncVisibility()
  document.getElementById(target.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  if (props.syncHash) history.replaceState(null, '', `#${target.id}`)
}

defineExpose({ go, get activeId() { return activeId.value } })
</script>

<template>
  <div class="wiki">
    <aside class="side">
      <button class="toc-toggle" type="button" :aria-expanded="open" @click="open = !open">
        <span>{{ label }}</span>
        <span class="chev" :class="{ up: open }" aria-hidden="true">▾</span>
      </button>

      <nav class="toc" :class="{ open }" :aria-label="label">
        <template v-for="item in items" :key="item.id">
          <a
            :href="`#${item.id}`" class="toc-link"
            :class="{ active: isActive(item), parent: !!item.children, 'child-active': hasActiveChild(item) }"
            :aria-current="isActive(item) ? 'true' : undefined"
            @click.prevent="go(item)"
          >{{ item.label }}</a>

          <div v-if="item.children?.length" class="toc-children">
            <a
              v-for="child in item.children" :key="child.id"
              :href="`#${child.id}`" class="toc-link sub"
              :class="{ active: isActive(child) }"
              :aria-current="isActive(child) ? 'true' : undefined"
              @click.prevent="go(child)"
            >{{ child.label }}</a>
          </div>
        </template>
      </nav>
    </aside>

    <main ref="contentRef" class="content" :class="{ isolate: isolated }">
      <slot />
    </main>
  </div>
</template>

<style scoped>
/* 黑白绿 · 浅色 · 简洁（补齐原版依赖的 VitePress 变量） */
.wiki {
  --color-border: #e2e2e2; --color-background-mute: #fafafa;
  --color-background-soft: #fafafa; --color-text: #555;
  --color-heading: #111; --accent: #1a7f4b;
  display: grid; grid-template-columns: 210px minmax(0, 1fr);
  gap: 2.4rem; align-items: start; margin-top: 0;
  font-family: system-ui, "Microsoft YaHei", "PingFang SC", sans-serif;
}
.side {
  position: sticky; top: 1.5rem; align-self: start;
  max-height: calc(100vh - 3rem); overflow-y: auto;
  padding-right: .75rem; border-right: 1px solid var(--color-border);
}
.toc { display: flex; flex-direction: column; gap: .15rem; }
.toc-link {
  display: block; width: 100%; padding: .4rem .7rem; border: 0;
  border-left: 2px solid transparent; border-radius: 4px;
  background: none; font: inherit; font-size: .88rem; line-height: 1.5;
  text-align: left; color: var(--color-text); opacity: .9; cursor: pointer;
  text-decoration: none; transition: background .15s, color .15s, border-color .15s;
}
.toc-link:hover { background: var(--color-background-mute); color: var(--accent); opacity: 1; }
.toc-link.active {
  color: var(--accent); background: #edf7f0;
  border-left-color: var(--accent); opacity: 1; font-weight: 600;
}
.toc-link.parent { font-weight: 650; color: var(--color-heading); }
.toc-link.child-active { color: var(--color-heading); opacity: 1; }
.toc-link.sub { padding-left: .45rem; font-size: .82rem; }
.toc-children {
  display: flex; flex-direction: column; gap: .15rem;
  margin-left: .85rem; padding-left: .7rem; border-left: 1px solid var(--color-border);
}
.toc-toggle { display: none; }

/* 正文排版（:deep 作用于插槽内容） */
.content :deep([id]) { scroll-margin-top: 1.5rem; }
.content :deep(h2) {
  margin: 0 0 .75rem; font-size: 1.1rem; font-weight: 650;
  color: var(--color-heading); padding-left: .65rem; border-left: 3px solid var(--accent);
}
.content :deep(h3) { margin: 1.2rem 0 .4rem; font-size: .98rem; font-weight: 650; color: var(--color-heading); }
.content :deep(p) { margin: .6rem 0; line-height: 1.8; color: var(--color-text); }

@media (max-width: 860px) {
  .wiki { grid-template-columns: 1fr; gap: 1rem; }
  .side {
    position: static; max-height: none; overflow: visible; padding: 0;
    border-right: none; border-bottom: 1px solid var(--color-border);
  }
  .toc-toggle {
    display: flex; align-items: center; justify-content: space-between;
    width: 100%; padding: .7rem .9rem; font-size: .95rem;
    color: var(--color-heading); background: var(--color-background-soft);
    border: 1px solid var(--color-border); border-radius: 4px; cursor: pointer;
  }
  .chev { transition: transform .2s; }
  .chev.up { transform: rotate(180deg); }
  .toc { display: none; margin-top: .5rem; padding-bottom: .75rem; }
  .toc.open { display: flex; }
}
</style>
