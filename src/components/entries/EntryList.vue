<script setup>
import { formatDate } from '../../composables/useContentStats'

defineProps({
  entries: { type: Array, default: () => [] },
  emptyText: { type: String, default: '本模块还没有词条。' },
})
</script>

<template>
  <ul v-if="entries.length" class="entry-list">
    <li v-for="entry in entries" :key="entry.slug">
      <RouterLink class="entry-row" :to="entry.href">
        <b>{{ entry.title }}</b>
        <span class="entry-date">{{ formatDate(entry.updatedAt) }}</span>
      </RouterLink>
      <p class="entry-sum">{{ entry.summary }}</p>
      <p class="entry-meta">{{ entry.section }} · {{ entry.path }}</p>
    </li>
  </ul>
  <p v-else class="entry-empty">{{ emptyText }}</p>
</template>

<style scoped>
.entry-list {
  list-style: none;
  margin: 1rem 0 0;
  padding: 0;
}
.entry-list li {
  padding: 0.9rem 0;
  border-bottom: 1px dashed var(--color-border);
}
.entry-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  color: var(--color-heading);
  text-decoration: none;
}
.entry-row b {
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: 0.3px;
}
.entry-row:hover b {
  color: hsla(160, 100%, 37%, 1);
}
.entry-date {
  flex: none;
  font-size: 0.75rem;
  opacity: 0.45;
}
.entry-sum {
  margin: 0.3rem 0 0;
  font-size: 0.85rem;
  line-height: 1.7;
  color: var(--color-text);
  opacity: 0.7;
}
.entry-meta {
  margin: 0.25rem 0 0;
  font-size: 0.7rem;
  opacity: 0.35;
}
.entry-empty {
  margin-top: 1rem;
  font-size: 0.85rem;
  opacity: 0.55;
}
</style>
