<script setup>
import Title from '../../components/Title.vue'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

// 搜索框：目前只过滤下面的入口卡片，等各子页做好后再扩展
const keyword = ref('')
const searchInput = ref(null)

const cards = [
  { title: '贡献指南', desc: '如何参与 / 第一次提交', tone: 'blue' },
  { title: '代码仓库', desc: 'GitHub 链接 / 本地运行', tone: 'purple' },
  { title: '项目架构', desc: '技术栈 / 目录结构', tone: 'yellow' },
  { title: '贡献者墙', desc: '贡献者 / 贡献排行', tone: 'green' },
  { title: '开发规范', desc: '风格指南 / PR 模板', tone: 'sky' },
  { title: '讨论区', desc: 'Issue / 微信群 / 反馈', tone: 'pink' },
]

const filteredCards = computed(() => {
  const text = keyword.value.trim().toLowerCase()
  if (!text) return cards
  return cards.filter(
    (card) =>
      card.title.toLowerCase().includes(text) || card.desc.toLowerCase().includes(text),
  )
})

function onKeydown(event) {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault()
    searchInput.value?.focus()
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div class="opensource">
    <!-- 顶部导航：logo 回首页，其余条目等对应模块做好后再接入路由 -->
    <header class="top">
      <RouterLink class="logo" to="/" title="返回首页">SCUT<span>wiki</span></RouterLink>
      <a>首页</a>
      <a>指南</a>
      <a>学习</a>
      <a>生活</a>
      <a>发展</a>
      <a>社交</a>
      <a>资料库</a>
      <a class="on">开源社区</a>
    </header>

    <div class="page">
      <!-- 左侧站点导航（目录占位） -->
      <nav class="left" aria-label="站点导航">
        <a>首页</a>
        <a>新生必看</a>
        <a>校园生活</a>
        <a>学习与发展</a>
        <a>社团与社交</a>
        <a>资料库</a>
        <a class="on">开源社区</a>
        <a class="sub">关于本项目</a>
        <a class="sub">贡献指南</a>
        <a class="sub">代码仓库</a>
        <a class="sub">项目架构</a>
        <a class="sub">贡献者</a>
        <a class="sub">行为准则</a>
      </nav>

      <div class="main">
        <section class="hero">
          <h1>开源社区</h1>
          <p>由 SCUTer 共建、面向全体华工人的校园百科开源项目</p>
        </section>

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
            <input
              ref="searchInput"
              v-model="keyword"
              type="text"
              placeholder="搜索 开源社区内容..."
              aria-label="搜索开源社区内容"
            >
            <kbd>Ctrl K</kbd>
          </div>
        </div>

        <div v-if="filteredCards.length" class="cards">
          <a v-for="card in filteredCards" :key="card.title" class="card" :class="card.tone">
            {{ card.title }}<p>{{ card.desc }}</p>
          </a>
        </div>
        <p v-else class="empty">没有找到与“{{ keyword.trim() }}”相关的入口</p>

        <div class="bottom">
          <section class="panel">
            <h2>项目动态 <a class="more">查看更多</a></h2>
            <a>01-10&nbsp;&nbsp;新增快递站位置信息</a>
            <a>01-08&nbsp;&nbsp;重构宿舍页面组件</a>
            <a>01-05&nbsp;&nbsp;补充秋季学期校历及重要日期</a>
          </section>

          <section class="panel">
            <h2>新贡献者入门</h2>
            <a class="step">1. Fork 本仓库</a>
            <a class="step">2. 创建特性分支</a>
            <a class="step">3. 提交更改</a>
            <a class="step">4. 发起 Pull Request</a>
            <a class="step">5. 等待审核并合并</a>
          </section>
        </div>
      </div>

      <aside class="right" aria-label="侧边信息">
        <section class="panel">
          <h2>公告与动态 <a class="more">查看更多</a></h2>
          <a class="step">SCUTwiki 正式开源</a>
          <a class="step">新增开源社区相关文档</a>
          <a class="step">欢迎贡献你的第一份代码</a>
        </section>

        <section class="panel">
          <h2>快速入口</h2>
          <a class="step">GitHub 仓库</a>
          <a class="step">贡献指南</a>
          <a class="step">Issue 反馈</a>
          <a class="step">开发文档</a>
        </section>

        <section class="panel">
          <h2>网站信息</h2>
          <p>Star 数 1.2k</p>
          <p>贡献者数 72</p>
          <p>最后更新 2025-01-10</p>
          <a class="github">在 GitHub 上贡献</a>
        </section>
      </aside>
    </div>
  </div>
</template>

<style scoped>
/* 颜色收进变量，浅色/深色各一套，避免深色模式下白底白字 */
.opensource {
  --os-surface: #ffffff;
  --os-heading: #0f172a;
  --os-text: #334155;
  --os-text-soft: #475569;
  --os-text-mute: #64748b;
  --os-border: #e5e7eb;
  --os-border-soft: #e2e8f0;
  --os-accent: #1d4ed8;
  --os-hero-bg: #0d1a2f;
  --os-hero-text: #ffffff;
  --os-hero-soft: #c7d2e0;
  --os-input-bg: #ffffff;
  --os-kbd-bg: #f8fafc;
  --os-card-desc: #5b6b82;
  --os-card-blue: #e6eefc;
  --os-card-purple: #f1e9fd;
  --os-card-yellow: #fdf3da;
  --os-card-green: #e3f4e8;
  --os-card-sky: #e6edfb;
  --os-card-pink: #fde7ea;

  color: var(--os-heading);
  font-size: 14px;
}

@media (prefers-color-scheme: dark) {
  .opensource {
    --os-surface: #1f242d;
    --os-heading: #f1f5f9;
    --os-text: #cbd5e1;
    --os-text-soft: #a8b3c4;
    --os-text-mute: #94a3b8;
    --os-border: #2c3340;
    --os-border-soft: #2c3340;
    --os-accent: #8ab4ff;
    --os-hero-soft: #9fb0c7;
    --os-input-bg: #1a1f27;
    --os-kbd-bg: #262c36;
    --os-card-desc: #a9b6c9;
    --os-card-blue: #1a2740;
    --os-card-purple: #241d38;
    --os-card-yellow: #332b16;
    --os-card-green: #16301f;
    --os-card-sky: #1a2740;
    --os-card-pink: #331c22;
  }
}

a {
  cursor: pointer;
}

/* ---------------- 顶部导航 ---------------- */
.top {
  display: flex;
  align-items: center;
  gap: 18px;
  height: 54px;
  padding: 0 20px;
  background: var(--os-surface);
  border-bottom: 1px solid var(--os-border);
}

.logo {
  font-size: 18px;
  font-weight: 800;
  color: var(--os-heading);
}

.logo span {
  color: var(--os-accent);
}

.top a {
  color: var(--os-text-soft);
  font-size: 13px;
}

.top .on {
  color: var(--os-accent);
  font-weight: 600;
}

/* ---------------- 三栏布局 ---------------- */
.page {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  padding: 16px 0;
}

.left {
  width: 140px;
  flex: none;
  font-size: 13px;
}

.left a {
  display: block;
  padding: 6px 0;
  color: var(--os-text-soft);
}

.left .on {
  color: var(--os-accent);
  font-weight: 600;
}

.left .sub {
  padding-left: 10px;
  color: var(--os-text-mute);
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

/* ---------------- 头图 ---------------- */
.hero {
  padding: 28px 30px;
  border-radius: 14px;
  background: var(--os-hero-bg);
  color: var(--os-hero-text);
}

.hero h1 {
  margin: 0;
  font-size: 34px;
}

.hero p {
  margin: 8px 0 0;
  color: var(--os-hero-soft);
}

/* ---------------- 搜索 ---------------- */
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
  border: 1px solid var(--os-border-soft);
  border-radius: 999px;
  background: var(--os-input-bg);
}

.search svg {
  width: 20px;
  height: 20px;
  flex: none;
  color: var(--os-text-mute);
}

.search input {
  flex: 1;
  min-width: 0;
  width: 100%;
  height: 100%;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--os-heading);
  font: inherit;
}

.search input::placeholder {
  color: var(--os-text-mute);
}

.search kbd {
  flex: none;
  padding: 3px 7px;
  border: 1px solid var(--os-border-soft);
  border-radius: 6px;
  background: var(--os-kbd-bg);
  color: var(--os-text-mute);
  font-family: inherit;
  font-size: 11px;
}

.search:focus-within {
  border-color: #0f9d76;
}

/* ---------------- 入口卡片 ---------------- */
.cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.card {
  display: block;
  padding: 22px;
  border-radius: 12px;
  color: var(--os-heading);
  font-size: 15px;
  font-weight: 600;
}

.card p {
  margin: 6px 0 0;
  color: var(--os-card-desc);
  font-size: 12px;
  font-weight: 400;
}

.blue {
  background: var(--os-card-blue);
}

.purple {
  background: var(--os-card-purple);
}

.yellow {
  background: var(--os-card-yellow);
}

.green {
  background: var(--os-card-green);
}

.sky {
  background: var(--os-card-sky);
}

.pink {
  background: var(--os-card-pink);
}

.empty {
  margin: 0;
  padding: 18px;
  border: 1px dashed var(--os-border);
  border-radius: 12px;
  color: var(--os-text-mute);
  text-align: center;
}

/* ---------------- 底部 / 侧边面板 ---------------- */
.bottom {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 12px;
  margin-top: 12px;
}

.panel {
  padding: 16px;
  border: 1px solid var(--os-border);
  border-radius: 12px;
  background: var(--os-surface);
}

.right .panel + .panel {
  margin-top: 12px;
}

.panel h2 {
  margin: 0 0 10px;
  color: var(--os-heading);
  font-size: 14px;
  font-weight: 600;
}

.panel p {
  margin: 6px 0;
  color: var(--os-text);
}

.panel a {
  color: var(--os-text);
}

/* 用 a.more / a.github 提高权重，压过上面的 .panel a */
.panel a.more {
  float: right;
  color: var(--os-accent);
  font-size: 12px;
  font-weight: 400;
}

.step {
  display: block;
  margin: 6px 0;
  color: var(--os-text);
}

.panel a.github {
  display: block;
  margin-top: 10px;
  color: var(--os-accent);
}

/* ---------------- 窄屏 ---------------- */
@media (max-width: 960px) {
  .page {
    flex-wrap: wrap;
  }

  .left {
    display: flex;
    flex-wrap: wrap;
    gap: 0 14px;
    width: 100%;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--os-border);
  }

  .left a {
    padding: 4px 0;
  }

  .right {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 12px;
    width: 100%;
  }

  .right .panel + .panel {
    margin-top: 0;
  }
}

@media (max-width: 720px) {
  .top {
    height: auto;
    flex-wrap: wrap;
    gap: 8px 14px;
    padding: 10px 0;
  }

  .cards {
    grid-template-columns: repeat(2, 1fr);
  }

  .bottom {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .hero {
    padding: 20px;
  }

  .hero h1 {
    font-size: 26px;
  }

  .cards {
    grid-template-columns: 1fr;
  }
}
</style>
