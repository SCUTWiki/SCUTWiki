<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useTheme } from '../composables/useTheme'
import { useContentStats, formatDate } from '../composables/useContentStats'

defineProps({
  variant: { type: String, default: 'home' },
  // 内页用窄带，首页传 :compact="false"
  compact: { type: Boolean, default: true },
})

const router = useRouter()
const { theme, toggle: toggleTheme } = useTheme()

const keyword = ref('')
const searchOpen = ref(false)
const flagOpen = ref(false)

const { entries, counts } = useContentStats()

// 最近更新的一篇词条
const latest = computed(() => entries[0] || null)
const updateText = computed(() =>
  latest.value
    ? `《${latest.value.title}》 更新于 ${formatDate(latest.value.updatedAt)} · 共 ${counts.doc} 篇词条`
    : '暂无更新',
)


function goHome() {
  router.push('/')
}

function submitSearch() {
  // 搜索页还没做，先留一个入口
  if (!keyword.value.trim()) return
  router.push({ path: '/more', query: { q: keyword.value.trim() } })
}
</script>

<template>
  <!-- 首页：整条绿色带 + 工具条 + 旗子 -->
  <header v-if="variant === 'home'" class="hp-head" :class="{ 'is-compact': compact }">
    <div class="hp-band" aria-hidden="true">
      <svg viewBox="0 0 1512 240" preserveAspectRatio="none">
        <defs>
          <linearGradient id="hp-band-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#36936d" />
            <stop offset="1" stop-color="#1d5b45" />
          </linearGradient>
          <clipPath id="hp-band-clip">
            <path d="
              M0,150
              C 70,150 120,146 168,140
              C 212,134 246,122 268,110
              C 284,102 294,96 308,98
              C 336,102 358,88 388,72
              C 438,46 482,14 532,4
              C 562,0 590,0 620,0
              L1512,0
              L1512,212
              C 1380,226 1250,204 1112,218
              C 976,232 848,208 712,222
              C 578,236 442,210 312,224
              C 196,236 92,218 0,226
              Z" />
          </clipPath>
        </defs>
        <g clip-path="url(#hp-band-clip)">
          <rect width="1512" height="240" fill="url(#hp-band-grad)" />
          <path fill="#46a87e" d="
            M300,0 C 336,90 348,170 380,240 L900,240 C 950,170 1000,90 1040,0 Z" />
          <path fill="#174a38" d="
            M1040,0 C 1000,90 950,170 900,240 L1512,240 L1512,0 Z" />
          <path fill="none" stroke="rgba(255,255,255,.16)" stroke-width="1.2" d="
            M1040,0 C 1000,90 950,170 900,240" />
          <path fill="none" stroke="rgba(255,255,255,.09)" stroke-width="1" d="
            M300,0 C 336,90 348,170 380,240" />
        </g>
      </svg>
    </div>

    <!-- Logo（沿用 assets/logo.svg） -->
    <a class="hp-brand" href="/" @click.prevent="goHome">
      <span class="hp-logo-mark">
        <img src="../assets/logo.svg" alt="SCUTWiki" />
      </span>
      <span class="hp-brand-text">
        <h1>SCUT<em>Wiki</em></h1>
        <p>welcome, students of SCUT!</p>
      </span>
    </a>

    <!-- 最新更新：取词条里最近更新的一篇 -->
    <RouterLink class="hp-tool hp-update" :to="latest?.href || '/wiki'">
      <i class="hp-dot" />
      <span class="hp-tag">最新</span>
      <span class="hp-txt">{{ updateText }}</span>
    </RouterLink>

    <!-- 搜索（手机端收成按钮） -->
    <form
      class="hp-tool hp-search"
      :class="{ 'is-open': searchOpen }"
      role="search"
      @submit.prevent="submitSearch"
    >
      <input
        v-model="keyword"
        class="hp-search-input"
        type="search"
        placeholder="搜索课程、老师、词条…"
        aria-label="搜索"
      />
      <span class="hp-key">⌘K</span>
      <button
        class="hp-search-toggle"
        type="button"
        aria-label="展开搜索"
        @click="searchOpen = !searchOpen"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9">
          <circle cx="11" cy="11" r="6.5" />
          <path d="M16 16l5 5" />
        </svg>
      </button>
    </form>

    <!-- 仓库 + 主题 -->
    <div class="hp-tool hp-tools">
      <a
        class="hp-ic"
        href="https://github.com/SCUTWiki/SCUTWiki"
        target="_blank"
        rel="noopener"
        title="GitHub 仓库"
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.1-1.47-1.1-1.47-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.88 1.52 2.32 1.08 2.88.82.09-.64.35-1.08.63-1.33-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02a9.5 9.5 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2z" />
        </svg>
      </a>
      <span class="hp-div" />
      <button class="hp-ic" type="button" :title="theme === 'dark' ? '切换到浅色' : '切换到深色'" @click="toggleTheme">
        <svg v-if="theme === 'dark'" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" />
        </svg>
        <svg v-else width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z" />
        </svg>
      </button>
    </div>

    <!-- 倒挂三角旗：点开拉出一条目录 -->
    <button
      class="hp-flag"
      type="button"
      :aria-expanded="flagOpen"
      aria-label="展开目录"
      @click="flagOpen = !flagOpen"
    >
      <i class="hp-flag-pin" />
      <svg class="hp-flag-cloth" viewBox="0 0 44 54" aria-hidden="true">
        <path d="M2 2H42L22 52Z" fill="#f7f2e4" stroke="rgba(19,34,27,.22)" stroke-width="1" />
        <path d="M25 15a9 9 0 1 0 0 18 11.5 11.5 0 0 1 0-18z" fill="#1d5b45" />
      </svg>
    </button>

    <transition name="hp-drop">
      <nav v-if="flagOpen" class="hp-flag-menu" aria-label="站点目录">
        <p class="hp-flag-menu-title">目录 · 待定</p>
        <ul>
          <li v-for="n in 6" :key="n" />
        </ul>
        <p class="hp-flag-menu-hint">这里以后放板块导航 / 互动入口</p>
      </nav>
    </transition>
  </header>

  <!-- 其它页面：保持原来的标题样式 -->
  <header v-else class="hero">
    <h1 class="brand" @click="goHome">
      <img class="logo" src="../assets/logo.svg" alt="" />
      <span>SCUT<span class="accent">Wiki</span></span>
    </h1>
    <p class="tagline">welcome, students of SCUT!</p>
  </header>
</template>

<style scoped>
.hero {
  padding: 3rem 0 2.5rem;
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  font-size: clamp(2rem, 6vw, 3.2rem);
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.1;
  color: var(--color-heading);
  cursor: pointer;
}

.accent {
  color: hsla(160, 100%, 37%, 1);
}

.tagline {
  margin-top: 0.75rem;
  font-size: 1.05rem;
  color: var(--color-text);
  opacity: 0.7;
}

.logo {
  width: 0.85em;
  height: 0.85em;
  flex-shrink: 0;
  display: block;
}
</style>
