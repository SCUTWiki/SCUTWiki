<script setup>
import ModuleGlyph from './ModuleGlyph.vue'

defineProps({
  href: { type: String, default: '#' },
  index: { type: String, default: '' },
  name: { type: String, required: true },
  desc: { type: String, default: '' },
  glyph: { type: String, required: true },
})
</script>

<template>
  <RouterLink class="hp-mod" :to="href">
    <span class="hp-idx">{{ index }}</span>
    <ModuleGlyph :name="glyph" />
    <h3 class="hp-name">{{ name }}</h3>
    <p v-if="desc" class="hp-desc" v-html="desc" />
  </RouterLink>
</template>
