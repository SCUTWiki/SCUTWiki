<script setup>
defineProps({
  updateText: { type: String, default: '2026 秋季选课攻略 已更新 · 新增 3 篇学院介绍 · 绩点计算器上线' },
})
</script>

<template>
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
          M300,0
          C 336,90 348,170 380,240
          L900,240
          C 950,170 1000,90 1040,0
          Z" />
        <path fill="#174a38" d="
          M1040,0
          C 1000,90 950,170 900,240
          L1512,240
          L1512,0
          Z" />
        <path fill="none" stroke="rgba(255,255,255,.16)" stroke-width="1.2" d="
          M1040,0
          C 1000,90 950,170 900,240" />
        <path fill="none" stroke="rgba(255,255,255,.09)" stroke-width="1" d="
          M300,0
          C 336,90 348,170 380,240" />
      </g>
    </svg>
  </div>

  <!-- Logo（保持原样，只是位置从 Title 挪到顶部带里） -->
  <div class="hp-brand">
    <div class="hp-logo-mark">
      <svg width="27" height="27" viewBox="0 0 32 32" fill="none" stroke="#16221c" stroke-width="1.7">
        <rect x="9" y="11" width="14" height="10" rx="3" />
        <circle cx="13.5" cy="16" r="1.2" fill="#16221c" stroke="none" />
        <circle cx="18.5" cy="16" r="1.2" fill="#16221c" stroke="none" />
        <path d="M16 11V7M16 7h4" />
        <path d="M12 21v3M20 21v3" />
      </svg>
    </div>
    <div>
      <h1>SCUT<em>Wiki</em></h1>
      <p>welcome, students of SCUT!</p>
    </div>
  </div>

  <!-- 最新更新 -->
  <div class="hp-tool hp-update">
    <i class="hp-dot" />
    <span class="hp-tag">最新</span>
    <span class="hp-txt">{{ updateText }}</span>
  </div>

  <!-- 搜索 -->
  <div class="hp-tool hp-search">
    <span class="hp-ph">搜索课程、老师、词条…</span>
    <span class="hp-key">⌘K</span>
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#22352b" stroke-width="1.8">
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l5 5" />
    </svg>
  </div>

  <!-- 仓库 + 主题 -->
  <div class="hp-tool hp-tools">
    <a class="hp-ic" href="https://github.com/genshiniubi/SCUTWiki" target="_blank" rel="noopener" title="GitHub 仓库">
      <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.1-1.47-1.1-1.47-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.88 1.52 2.32 1.08 2.88.82.09-.64.35-1.08.63-1.33-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02a9.5 9.5 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2z" />
      </svg>
    </a>
    <span class="hp-div" />
    <button class="hp-ic" type="button" title="切换颜色模式">
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" />
      </svg>
    </button>
  </div>

  <!-- 倒挂三角旗 -->
  <button class="hp-flag" type="button" title="展开菜单">
    <i class="hp-flag-pin" />
    <svg class="hp-flag-cloth" viewBox="0 0 44 54" aria-hidden="true">
      <path d="M2 2H42L22 52Z" fill="#f7f2e4" />
      <path d="M25 15a9 9 0 1 0 0 18 11.5 11.5 0 0 1 0-18z" fill="#1d5b45" />
    </svg>
    <small>MENU</small>
  </button>
</template>
