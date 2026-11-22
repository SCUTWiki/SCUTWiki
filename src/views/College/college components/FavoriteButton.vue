<script setup>
/** 收藏切换按钮：实心星=已收藏，空心星=未收藏（参考联系模块的收藏交互） */
const props = defineProps({
  active: { type: Boolean, default: false },
  label: { type: String, default: '收藏' },
  iconOnly: { type: Boolean, default: false }, // 仅显示星星，不显示文字（用于目录项）
})
defineEmits(['toggle'])
</script>

<template>
  <button type="button" class="fav" :class="{ on: active, icon: iconOnly }"
          :aria-pressed="active" :title="(active ? '取消' : '') + '收藏'"
          @click="$emit('toggle')">
    <span aria-hidden="true">{{ active ? '★' : '☆' }}</span>
    <span v-if="!iconOnly" class="fav-text">{{ active ? '已收藏' : label }}</span>
  </button>
</template>

<style scoped>
.fav { display: inline-flex; align-items: center; gap: .25rem; font: inherit; font-size: .8rem;
  color: var(--color-text); background: var(--color-background-soft);
  border: 1px solid var(--color-border); border-radius: 999px;
  padding: .25rem .7rem; cursor: pointer; }
.fav.icon { padding: .15rem .35rem; border-color: transparent; background: transparent; }
.fav:hover { border-color: #43b581; }
.fav.on { color: #43b581; border-color: #43b581; }
.fav-text { opacity: .85; }
:focus-visible { outline: 2px solid #43b581; outline-offset: 2px; }
</style>