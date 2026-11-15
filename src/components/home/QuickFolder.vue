<script setup>
defineProps({
  links: { type: Array, required: true },
})
defineEmits(['flip'])
</script>

<template>
  <div class="hp-folder">
    <div class="hp-folder-tab">学生常用</div>
    <div class="hp-folder-body">
      <div class="hp-folder-paper">
        <div class="hp-quick">
          <a v-for="item in links" :key="item.label" :href="item.href || '#'">{{ item.label }}</a>
        </div>
      </div>
    </div>
    <button class="hp-pull" type="button" title="拉开 → 另一个板块" @click="$emit('flip')" />
  </div>
</template>
