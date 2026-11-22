/**
 * 我的收藏（参考联系模块 Contact.vue 的实现，精简版）
 * localStorage 持久化 + Set 去重，跨 College 首页 / 板块页共享同一份状态。
 */
import { ref, watch } from 'vue'

const KEY = 'scutwiki-college-favorites'
const favoriteIds = ref(new Set())

try {
  const saved = localStorage.getItem(KEY)
  if (saved) {
    const parsed = JSON.parse(saved)
    if (Array.isArray(parsed) && parsed.every(id => typeof id === 'string')) {
      favoriteIds.value = new Set(parsed)
    }
  }
} catch { /* 存储不可用时使用空收藏 */ }

watch(favoriteIds, set => {
  try { localStorage.setItem(KEY, JSON.stringify([...set])) } catch { /* 忽略 */ }
}, { deep: true })

export function useFavorites() {
  const has = id => favoriteIds.value.has(id)
  const toggle = id => {
    const next = new Set(favoriteIds.value)
    next.has(id) ? next.delete(id) : next.add(id)
    favoriteIds.value = next
  }
  return { favoriteIds, has, toggle }
}