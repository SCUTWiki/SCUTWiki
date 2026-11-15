<script setup>
import { ref } from 'vue'

defineProps({
  links: { type: Array, required: true },
})

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
              <a v-for="item in links" :key="item.label" :href="item.href || '#'">{{ item.label }}</a>
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
