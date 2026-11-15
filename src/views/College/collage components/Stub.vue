<script setup>
/** 空内容占位：虚线框 + 填写提示 + ……，内容留空待后续填补 */
defineProps({
  kind: { type: String, default: '' },
  hint: { type: String, default: '' },
})
</script>

<template>
  <div class="stub" :data-kind="kind || undefined">
    <p v-if="hint" class="stub-hint">{{ hint }}</p>
    <p class="placeholder">……</p>
  </div>
</template>

<style scoped>
.stub { --line: #e2e2e2; --bg-soft: #fafafa; --brand: #1a7f4b;
  --gray: #555; --faint: #888;
  border: 1px dashed var(--line); border-radius: 4px;
  padding: .7rem .9rem; background: var(--bg-soft); }
.stub[data-kind='quote'] { border-left: 3px solid var(--brand); background: #fff; }
.stub[data-kind='warning'] { border-left: 3px solid #111; background: #fff; }
.stub-hint { margin: 0 0 .35rem; font-size: .78rem; color: var(--gray); line-height: 1.6; }
.stub-hint::before { content: '✎ 填写提示 · '; color: var(--brand); }
.placeholder { margin: 0; min-height: 1.5em; color: var(--faint);
  letter-spacing: .3em; user-select: none; }
</style>
