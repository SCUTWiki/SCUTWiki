<script setup>
/** 学习板块（单列页面）：复用通用板块壳，固定 pageId */
import SectionPage from './SectionPage.vue'
defineProps({
  itemId: { type: String, default: '' },
  navigate: { type: Function, required: true },
})
</script>

<template>
  <SectionPage page-id="study" :item-id="itemId" :navigate="navigate" />
</template>
