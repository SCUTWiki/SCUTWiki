<script setup>
/**
 * 站点头（基于用户提供的 Downloads/Title.vue，做最小改造）
 *   · 去掉 vue-router 与 logo.svg 依赖，改为 emit('home') 由外层容器处理
 *   · 品牌名 SCUTWiki，绿色 accent 与全站一致
 */
defineEmits(['home'])
</script>

<template>
  <header class="hero">
    <h1 class="brand" @click="$emit('home')">
      <span>SCUT<span class="accent">Wiki</span></span>
    </h1>
    <p class="tagline">welcome, students of SCUT!</p>
  </header>
</template>

<style scoped>
.hero { padding: 1.5rem 0 1.2rem; border-bottom: 1px solid #e2e2e2; }
.brand {
  display: inline-flex; align-items: center; gap: .55rem;
  font-size: clamp(1.8rem, 5vw, 2.6rem); font-weight: 800;
  letter-spacing: -.02em; line-height: 1.1; color: #111; cursor: pointer;
  margin: 0;
}
.accent { color: #1a7f4b; }
.tagline { margin: .5rem 0 0; font-size: .95rem; color: #555; opacity: .75; }
</style>
