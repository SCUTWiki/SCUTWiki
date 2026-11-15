<script setup>
defineProps({
  rows: { type: Array, required: true },
})
</script>

<template>
  <div class="hp-total">
    <h3>TOTAL</h3>
    <ul class="hp-sums">
      <li v-for="row in rows" :key="row.label">
        <a :href="row.href || '#'">
          <span class="hp-k">{{ row.label }}</span>
          <span class="hp-n">{{ row.count }}</span>
          <span class="hp-a">→</span>
          <em v-if="row.sub" class="hp-sub">{{ row.sub }}</em>
        </a>
      </li>
    </ul>
  </div>
</template>
