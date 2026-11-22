<script setup>
import { onBeforeUnmount, ref, watch } from 'vue'

const STORAGE_KEY = 'opensource-theme'

// 本页独立的深色模式：不跟站点全局主题联动，只影响 /opensource
const dark = ref(false)

if (typeof window !== 'undefined') {
  dark.value = localStorage.getItem(STORAGE_KEY) === 'dark'
}

watch(dark, (value) => {
  localStorage.setItem(STORAGE_KEY, value ? 'dark' : 'light')
})

// 拉绳动画：切换主题的同时让绳子坠一下再回弹
const pulling = ref(false)
let pullTimer = null

function pullCord() {
  dark.value = !dark.value
  pulling.value = true
  clearTimeout(pullTimer)
  pullTimer = setTimeout(() => {
    pulling.value = false
  }, 240)
}

onBeforeUnmount(() => clearTimeout(pullTimer))
</script>

<template>
  <div class="opensource-page" :class="{ 'is-dark': dark }">

    <div class="top">
      <RouterLink class="logo" to="/" title="返回首页">SCUT<span>wiki</span></RouterLink>

      <nav class="top-nav">
        <RouterLink to="/" title="返回首页">首页</RouterLink>
        <a href="">指南</a>
        <a href="">学习</a>
        <a href="">生活</a>
        <a href="">发展</a>
        <a href="">社交</a>
        <a href="">资料库</a>
        <a class="on" href="">开源社区</a>
      </nav>

      <!-- 床头台灯拉绳：拉一下开灯（深色），再拉一下关灯（浅色） -->
      <div class="tools">
        <button
          class="lamp-btn"
          :class="{ 'is-on': dark, 'is-pulling': pulling }"
          type="button"
          :aria-pressed="dark"
          :aria-label="dark ? '关灯：切换到浅色模式' : '开灯：切换到深色模式'"
          :title="dark ? '拉一下，关灯' : '拉一下，开灯'"
          @click="pullCord"
        >
          <span class="lamp-halo" aria-hidden="true"></span>
          <span class="lamp-bulb" aria-hidden="true"></span>
          <span class="lamp-shade" aria-hidden="true"></span>
          <span class="lamp-pull" aria-hidden="true">
            <span class="lamp-cord"></span>
            <span class="lamp-bead"></span>
          </span>
        </button>
      </div>
    </div>

    <div class="page">

      <div class="left">
        <RouterLink to="/">首页</RouterLink>
        <a href="">新生必看</a>
        <a href="">校园生活</a>
        <a href="">学习与发展</a>
        <a href="">社团与社交</a>
        <a href="">资料库</a>
        <a href="">开源社区</a>
        <a class="sub" href="">关于本项目</a>
        <a class="sub" href="">贡献指南</a>
        <a class="sub" href="">代码仓库</a>
        <a class="sub" href="">项目架构</a>
        <a class="sub" href="">贡献者</a>
        <a class="sub" href="">行为准则</a>
      </div>

      <div class="main">

        <div class="hero">
          <h1>开源社区</h1>
          <p>由 SCUTer 共建、面向全体华工人的校园百科开源项目</p>
        </div>

        <div class="search-wrap">
          <div class="search">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7"></circle>
              <path d="m20 20-3.5-3.5"></path>
            </svg>
            <input type="text" placeholder="搜索 开源社区内容...">
            <kbd>Ctrl K</kbd>
          </div>
        </div>

        <div class="cards">
          <a class="card blue" href="">贡献指南<p>如何参与 / 第一次提交</p></a>
          <a class="card purple" href="">代码仓库<p>GitHub 链接 / 本地运行</p></a>
          <a class="card yellow" href="">项目架构<p>技术栈 / 目录结构</p></a>
          <a class="card green" href="">贡献者墙<p>贡献者 / 贡献排行</p></a>
          <a class="card sky" href="">开发规范<p>风格指南 / PR 模板</p></a>
          <a class="card pink" href="">讨论区<p>Issue / 微信群 / 反馈</p></a>
        </div>

        <div class="bottom">
          <div class="panel">
            <h2>项目动态 <a class="more" href="">查看更多</a></h2>
            <a class="step" href="">01-10&nbsp;&nbsp;新增快递站位置信息</a>
            <a class="step" href="">01-08&nbsp;&nbsp;重构宿舍页面组件</a>
            <a class="step" href="">01-05&nbsp;&nbsp;补充秋季学期校历及重要日期</a>
          </div>

          <div class="panel">
            <h2>新贡献者入门</h2>
            <a class="step" href="">1. Fork 本仓库</a>
            <a class="step" href="">2. 创建特性分支</a>
            <a class="step" href="">3. 提交更改</a>
            <a class="step" href="">4. 发起 Pull Request</a>
            <a class="step" href="">5. 等待审核并合并</a>
          </div>
        </div>

      </div>

      <div class="right">
        <div class="panel">
          <h2>公告与动态 <a class="more" href="">查看更多</a></h2>
          <a class="step" href="">SCUTwiki 正式开源</a>
          <a class="step" href="">新增开源社区相关文档</a>
          <a class="step" href="">欢迎贡献你的第一份代码</a>
        </div>

        <div class="panel">
          <h2>快速入口</h2>
          <a class="step" href="https://github.com/SCUTWiki/SCUTWiki">GitHub 仓库</a>
          <a class="step" href="">贡献指南</a>
          <a class="step" href="">Issue 反馈</a>
          <a class="step" href="">开发文档</a>
        </div>

        <div class="panel">
          <h2>网站信息</h2>
          <p>Star 数 1.2k</p>
          <p>贡献者数 72</p>
          <p>最后更新 2026-11-21</p>
          <a class="github" href="https://github.com/SCUTWiki/SCUTWiki">在 GitHub 上贡献</a>
        </div>
      </div>

    </div>

  </div>
</template>

<style scoped>
  .opensource-page {
    min-height: 100vh;
    background: #f6f8fa;
    color: #0f172a;
    font-family: -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif;
    font-size: 14px;
    line-height: 1.6;

    /* 入口卡片配色（浅色模式）：只改这一组就影响浅色 */
    --card-blue: #e6eefc;
    --card-purple: #f1e9fd;
    --card-yellow: #fdf3da;
    --card-green: #e3f4e8;
    --card-sky: #e6edfb;
    --card-pink: #fde7ea;
  }

  .top {
    display: flex;
    align-items: center;
    gap: 18px;
    height: 54px;
    padding: 0 20px;
    background: #fff;
    border-bottom: 1px solid #e5e7eb;
    overflow: hidden;
    white-space: nowrap;
  }

  .top-nav {
    display: flex;
    align-items: center;
    gap: 18px;
    flex: 1;
    min-width: 0;
    overflow-x: auto;
    white-space: nowrap;
    scrollbar-width: none;
  }

  .top-nav::-webkit-scrollbar {
    display: none;
  }

  .top a {
    flex: none;
    color: #475569;
    font-size: 13px;
  }

  .logo {
    font-size: 18px;
    font-weight: 800;
  }

  .logo span {
    color: #1d4ed8;
  }

  .top .on {
    color: #1d4ed8;
    font-weight: 600;
  }

  .page {
    display: flex;
    gap: 16px;
    align-items: flex-start;
    padding: 16px 20px;
  }

  .left {
    width: 140px;
    flex: none;
    font-size: 13px;
  }

  .left a {
    display: block;
    padding: 6px 0;
    color: #475569;
  }

  .left .sub {
    padding-left: 10px;
    color: #64748b;
  }

  .main {
    flex: 1;
    min-width: 0;
  }

  .right {
    width: 190px;
    flex: none;
    font-size: 13px;
  }

  .hero {
    padding: 28px 30px;
    border-radius: 14px;
    background: #0d1a2f;
    color: #fff;
  }

  .hero h1 {
    margin: 0;
    font-size: 34px;
    font-weight: 700;
  }

  .hero p {
    margin: 8px 0 0;
    color: #c7d2e0;
  }

  .search-wrap {
    display: flex;
    justify-content: center;
    margin: 16px 0;
  }

  .search {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    max-width: 480px;
    height: 48px;
    padding: 0 18px;
    border: 1px solid #e2e8f0;
    border-radius: 999px;
    background: #fff;
  }

  .search svg {
    width: 20px;
    height: 20px;
    flex: none;
    color: #94a3b8;
  }

  .search input {
    flex: 1;
    min-width: 0;
    width: 100%;
    height: 100%;
    border: 0;
    outline: 0;
    background: transparent;
    font: inherit;
  }

  .search kbd {
    flex: none;
    padding: 3px 7px;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    background: #f8fafc;
    color: #64748b;
    font-family: inherit;
    font-size: 11px;
  }

  .search:focus-within {
    border-color: #0f9d76;
  }

  .cards {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }

  .card {
    display: block;
    padding: 22px;
    border-radius: 12px;
    font-size: 15px;
    font-weight: 600;
  }

  .card p {
    margin: 6px 0 0;
    color: #5b6b82;
    font-size: 12px;
    font-weight: 400;
  }

  .blue {
    background: var(--card-blue);
  }

  .purple {
    background: var(--card-purple);
  }

  .yellow {
    background: var(--card-yellow);
  }

  .green {
    background: var(--card-green);
  }

  .sky {
    background: var(--card-sky);
  }

  .pink {
    background: var(--card-pink);
  }

  .bottom {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 12px;
    margin-top: 12px;
  }

  .panel {
    padding: 16px;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    background: #fff;
  }

  .panel h2 {
    margin: 0 0 10px;
    font-size: 14px;
    font-weight: 700;
  }

  .panel p {
    margin: 6px 0;
    color: #334155;
  }

  .more {
    float: right;
    color: #1d4ed8;
    font-size: 12px;
    font-weight: 400;
  }

  .step {
    display: block;
    margin: 6px 0;
    color: #334155;
  }

  .github {
    display: block;
    margin-top: 10px;
    color: #1d4ed8;
  }

  /* ===== 深色模式开关 ===== */
  .tools {
    flex: none;
    margin-left: auto;
    display: flex;
    align-items: center;
  }

  .lamp-btn {
    position: relative;
    display: block;
    width: 34px;
    height: 46px;
    padding: 0;
    border: 0;
    background: none;
    color: #94a3b8;
    cursor: pointer;
  }

  .lamp-btn:focus-visible {
    outline: 2px solid #2fa06b;
    outline-offset: 2px;
    border-radius: 8px;
  }

  /* 灯罩上方那一小段吊线，让它看起来是挂在顶栏上的 */
  .lamp-btn::before {
    content: "";
    position: absolute;
    top: -4px;
    left: 50%;
    width: 1px;
    height: 6px;
    transform: translateX(-50%);
    background: currentColor;
    opacity: 0.55;
  }

  .lamp-halo {
    position: absolute;
    top: -8px;
    left: 50%;
    width: 48px;
    height: 48px;
    transform: translateX(-50%);
    border-radius: 50%;
    background: radial-gradient(circle, rgba(255, 217, 138, 0.42) 0%, rgba(255, 217, 138, 0) 70%);
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: none;
  }

  .lamp-bulb {
    position: absolute;
    top: 13px;
    left: 50%;
    width: 10px;
    height: 10px;
    transform: translateX(-50%);
    border-radius: 50%;
    background: #e2e8f0;
    transition: background 0.3s ease, box-shadow 0.3s ease;
  }

  .lamp-shade {
    position: absolute;
    top: 2px;
    left: 50%;
    width: 26px;
    height: 13px;
    transform: translateX(-50%);
    background: linear-gradient(180deg, #dbe2ea 0%, #98a5b3 100%);
    clip-path: polygon(24% 0, 76% 0, 100% 100%, 0 100%);
    transition: background 0.3s ease;
  }

  .lamp-pull {
    position: absolute;
    top: 23px;
    left: 50%;
    display: flex;
    flex-direction: column;
    align-items: center;
    transform: translateX(-50%);
  }

  .lamp-cord {
    width: 1px;
    height: 12px;
    background: currentColor;
    transform-origin: top center;
    transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .lamp-bead {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: currentColor;
    transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .lamp-btn:hover .lamp-bead,
  .lamp-btn:focus-visible .lamp-bead {
    transform: scale(1.18);
  }

  /* 拉绳：绳子被拉长，拉珠跟着往下坠，松手回弹 */
  .lamp-btn.is-pulling .lamp-cord {
    transform: scaleY(1.5);
  }

  .lamp-btn.is-pulling .lamp-bead {
    transform: translateY(6px);
  }

  @media (prefers-reduced-motion: reduce) {
    .lamp-cord,
    .lamp-bead {
      transition: none;
    }
  }

  /* 开灯（深色模式） */
  .lamp-btn.is-on {
    color: #b9c4d0;
  }

  .lamp-btn.is-on .lamp-shade {
    background: linear-gradient(180deg, #5cd6a0 0%, #1f7a52 100%);
  }

  .lamp-btn.is-on .lamp-bulb {
    background: #ffdc8a;
    box-shadow: 0 0 10px 3px rgba(255, 220, 138, 0.6);
  }

  .lamp-btn.is-on .lamp-halo {
    opacity: 1;
  }

  /* ===== 本页深色模式：黑底白字，开源社区头图由深蓝黑换成绿色 ===== */
  .opensource-page.is-dark {
    background: #000;
    color: #f2f5f8;

    /* 入口卡片配色（深色模式）：高饱和，黑底上更跳 */
    --card-blue: #2563eb;
    --card-purple: #7c3aed;
    --card-yellow: #b45309;
    --card-green: #15803d;
    --card-sky: #0369a1;
    --card-pink: #be123c;
  }

  .is-dark .top {
    background: #050607;
    border-bottom-color: #1e2329;
  }

  .is-dark .top a {
    color: #b9c4d0;
  }

  .is-dark .logo {
    color: #f2f5f8;
  }

  .is-dark .logo span,
  .is-dark .top .on {
    color: #5fd39b;
  }

  .is-dark .left a {
    color: #b9c4d0;
  }

  .is-dark .left .sub {
    color: #8b97a6;
  }

  .is-dark .hero {
    background: linear-gradient(135deg, #2fa06b 0%, #136b45 100%);
    color: #fff;
  }

  .is-dark .hero p {
    color: #d8f2e4;
  }

  .is-dark .search {
    background: #0d1117;
    border-color: #23282f;
  }

  .is-dark .search svg,
  .is-dark .search input::placeholder {
    color: #6b7684;
  }

  .is-dark .search input {
    color: #f2f5f8;
  }

  .is-dark .search kbd {
    background: #161b22;
    border-color: #23282f;
    color: #9aa7b5;
  }

  .is-dark .search:focus-within {
    border-color: #2fa06b;
  }

  .is-dark .card {
    color: #f2f5f8;
  }

  .is-dark .card p {
    color: #f8fafc;
  }

  .is-dark .panel {
    background: #0d1117;
    border-color: #23282f;
  }

  .is-dark .panel h2 {
    color: #f2f5f8;
  }

  .is-dark .panel p,
  .is-dark .step {
    color: #c3cedb;
  }

  @media (max-width: 860px) {
    .is-dark .left {
      border-bottom-color: #1e2329;
    }
  }

  .is-dark .more,
  .is-dark .github {
    color: #5fd39b;
  }

  /* 窄屏：侧栏改为顶部横向导航，卡片和面板单列显示 */
  @media (max-width: 860px) {
    .page {
      flex-direction: column;
      padding: 16px;
    }

    .left,
    .right {
      width: 100%;
    }

    .left {
      display: flex;
      flex-wrap: wrap;
      gap: 0 14px;
      padding-bottom: 8px;
      border-bottom: 1px solid #e5e7eb;
    }

    .left a {
      padding: 4px 0;
    }

    .left .sub {
      padding-left: 0;
    }

    .main {
      width: 100%;
    }

    .right {
      display: grid;
      grid-template-columns: 1fr;
      gap: 12px;
    }

    .cards {
      grid-template-columns: repeat(2, 1fr);
    }

    .bottom {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 520px) {
    .hero {
      padding: 22px 20px;
    }

    .hero h1 {
      font-size: 28px;
    }

    .cards {
      grid-template-columns: 1fr;
    }
  }
</style>

<!-- 让本页占满整个窗口宽度：抵消 assets/main.css 里 #app 的最大宽度和内边距 -->
<style>
  #app:has(.opensource-page) {
    max-width: none;
    padding: 0;
  }
</style>
