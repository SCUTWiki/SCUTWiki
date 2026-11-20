<script setup>
import '../assets/pages.css'

import Title from './Title.vue'
import BottomBand from './home/BottomBand.vue'

defineProps({
  eyebrow: { type: String, default: '' },
  title: { type: String, required: true },
  lead: { type: String, default: '' },
})

const links = [
  { label: '关于我们', index: '01', href: '/about' },
  { label: '联系我们 / 投稿', index: '02', href: '/contact-us' },
  { label: '支持 / 赞助我们', index: '03', href: '/support' },
]
</script>

<template>
  <Title />
  <main class="pg">
    <div class="pg-wrap">
      <header class="pg-hero">
        <span v-if="eyebrow" class="pg-eyebrow">{{ eyebrow }}</span>
        <h1>{{ title }}</h1>
        <p v-if="lead" class="pg-lead">{{ lead }}</p>
      </header>
      <slot />
    </div>
  </main>
  <BottomBand :links="links" />
</template>
