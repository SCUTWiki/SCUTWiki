<script setup>
const tabs = [
  { to: '/wiki', label: '文章' },
  { to: '/files', label: '文件' },
  { to: '/links', label: '链接' },
]
</script>

<template>
  <nav class="pg-tabs" aria-label="内容汇总">
    <RouterLink v-for="tab in tabs" :key="tab.to" class="pg-tab" :to="tab.to">
      {{ tab.label }}
    </RouterLink>
  </nav>
</template>
