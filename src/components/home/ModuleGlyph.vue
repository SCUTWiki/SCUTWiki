<script setup>
defineProps({
  name: { type: String, required: true },
})

// 六个模块的填充图标（实心图形，不是描边）
const paths = {
  hall: '<path d="M6 42V19l7-8h22l7 8v23h-9V27H15v15H6z"/><rect x="19" y="33" width="10" height="9"/>',
  academy:
    '<path d="M10 14h28v24H10z"/><path d="M16 8h16v5H16z"/><path d="M17 21h14v3H17zM17 27h14v3H17zM17 33h9v3h-9z"/>',
  org: '<circle cx="18" cy="19" r="8"/><circle cx="31" cy="19" r="8"/><circle cx="24.5" cy="31" r="8"/>',
  branch:
    '<circle cx="17" cy="13" r="6"/><circle cx="34" cy="35" r="6"/><path d="M17 19v6a10 10 0 0 0 10 10h1v-6h-1a4 4 0 0 1-4-4v-6z"/>',
  phone:
    '<path d="M16.5 10.5c-4 .5-6.3 3.9-5.6 7.8 1.9 11.4 11.4 20.9 22.8 22.8 3.9.7 7.3-1.6 7.8-5.6v-4.6l-8.6-3.3-3.9 3.9c-4-2.1-7.1-5.2-9.2-9.2l3.9-3.9-3.3-8.6z"/>',
  person: '<circle cx="27" cy="11" r="5.5"/><path d="M24.5 18 22 30l9 11h-6l-8-10 2-8-7 10-3-4 8-11z"/>',
}
</script>

<template>
  <svg class="hp-icon" viewBox="0 0 48 48" aria-hidden="true" v-html="paths[name]" />
</template>
