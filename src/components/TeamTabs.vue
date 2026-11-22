<script setup>
const tabs = [
  { to: '/about', label: '关于我们' },
  { to: '/contact-us', label: '联系我们 / 投稿' },
  { to: '/support', label: '支持 / 赞助我们' },
]
</script>

<template>
  <nav class="pg-tabs" aria-label="团队页面导航">
    <RouterLink v-for="tab in tabs" :key="tab.to" class="pg-tab" :to="tab.to">
      {{ tab.label }}
    </RouterLink>
  </nav>
</template>
