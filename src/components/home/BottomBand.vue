<script setup>
defineProps({
  links: { type: Array, required: true },
  gameHeight: { type: Number, default: 220 },
})

function isInternal(link) {
  return typeof link.href === 'string' && link.href.startsWith('/')
}
</script>

<template>
  <footer class="hp-foot">
    <div class="hp-foot-band">
      <div class="hp-foot-grid">
        <div class="hp-game">
          <div class="hp-label">GAME</div>
          <div class="hp-tag">小游戏 · 建设中</div>
        </div>

        <div class="hp-sep"><i /></div>

        <div class="hp-links">
          <template v-for="link in links" :key="link.label">
            <RouterLink v-if="isInternal(link)" :to="link.href">
              <span>{{ link.label }}</span>
              <span>{{ link.index }}</span>
            </RouterLink>
            <a v-else :href="link.href || '#'">
              <span>{{ link.label }}</span>
              <span>{{ link.index }}</span>
            </a>
          </template>
        </div>
      </div>
    </div>
    <div class="hp-note">SCUTWIKI · 学生共建 · 2026</div>
  </footer>
</template>
