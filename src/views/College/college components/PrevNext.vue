<script setup>
/**
 * 上一篇 / 下一篇：按「全局篇序」在条目间导航。
 * prev / next 为 null 时该侧不渲染（首篇无上一篇、末篇无下一篇）。
 */
defineProps({
  prev: { type: Object, default: null }, // { id, label, path }
  next: { type: Object, default: null },
  navigate: { type: Function, required: true },
})
</script>

<template>
  <nav class="prev-next" aria-label="上一篇 / 下一篇">
    <a v-if="prev" class="pn" :href="`#${prev.path}`" @click.prevent="navigate(prev.path)">
      <small>← 上一篇</small>
      <span>{{ prev.label }}</span>
    </a>
    <span v-else class="pn empty" aria-hidden="true" />

    <a v-if="next" class="pn right" :href="`#${next.path}`" @click.prevent="navigate(next.path)">
      <small>下一篇 →</small>
      <span>{{ next.label }}</span>
    </a>
    <span v-else class="pn empty" aria-hidden="true" />
  </nav>
</template>

<style scoped>
.prev-next {
  display: grid; grid-template-columns: 1fr 1fr; gap: .8rem;
  margin: 2.5rem 0 0; padding-top: 1.2rem; border-top: 1px solid #e2e2e2;
}
.pn {
  display: flex; flex-direction: column; gap: .15rem;
  padding: .7rem .9rem; border: 1px solid #e2e2e2; border-radius: 4px;
  text-decoration: none; color: #111; background: #fff;
  transition: border-color .15s, background .15s;
}
a.pn:hover { border-color: #1a7f4b; background: #fafafa; text-decoration: none; }
.pn small { font-size: .75rem; color: #888; }
.pn span { font-size: .92rem; font-weight: 650; }
.pn.right { text-align: right; }
.pn.empty { border: 0; background: none; }
:focus-visible { outline: 2px solid #1a7f4b; outline-offset: 2px; }
@media (max-width: 640px) { .prev-next { grid-template-columns: 1fr; } }
</style>
