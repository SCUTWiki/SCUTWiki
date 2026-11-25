<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  links: { type: Array, required: true },
})

// 固定 3×3 共 9 格，多余的留空
const slots = computed(() => [
  ...props.links,
  ...Array(Math.max(0, 9 - props.links.length)).fill(null),
])

const flipped = ref(false)
</script>

<template>
  <div class="hp-folder" :class="{ flipped }">
    <div class="hp-folder-inner">
      <!-- 正面：快捷入口 + 左侧拉手 -->
      <div class="hp-folder-face hp-folder-front">
        <div class="hp-folder-tab">学生常用</div>
        <div class="hp-folder-body">
          <div class="hp-folder-paper">
            <div class="hp-quick">
              <template v-for="(item, index) in slots" :key="index">
                <a v-if="item?.href" :href="item.href" target="_blank" rel="noopener">
                  {{ item.label }}
                </a>
                <RouterLink v-else-if="item?.to" :to="item.to">
                  {{ item.label }}
                </RouterLink>
                <span v-else class="hp-quick-empty" aria-hidden="true" />
              </template>
            </div>
          </div>
        </div>
        <button
          class="hp-pull"
          type="button"
          title="翻开外皮，看看有趣内容"
          @click="flipped = true"
        />
      </div>

      <!-- 背面：文件夹外皮 + 右侧拉手（翻过来后在右边） -->
      <div class="hp-folder-face hp-folder-back">
        <div class="hp-folder-cover">
          <span class="hp-folder-cover-tag">有趣内容</span>
          <h4>这里以后放点好玩的</h4>
          <p>彩蛋、投票、随机词条、同学投稿……内容待填写。</p>
          <span class="hp-folder-cover-hint">拉手再点一次翻回去</span>
        </div>
        <button
          class="hp-pull"
          type="button"
          title="翻回快捷入口"
          @click="flipped = false"
        />
      </div>
    </div>
  </div>
</template>
