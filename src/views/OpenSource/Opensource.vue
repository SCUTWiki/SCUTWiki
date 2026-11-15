<template>
  <div class="opensource-page">

    <div class="top">
      <RouterLink class="logo" to="/" title="返回首页">SCUT<span>wiki</span></RouterLink>
      <RouterLink to="/" title="返回首页">首页</RouterLink>
      <a href="">指南</a>
      <a href="">学习</a>
      <a href="">生活</a>
      <a href="">发展</a>
      <a href="">社交</a>
      <a href="">资料库</a>
      <a class="on" href="">开源社区</a>
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
          <a class="step" href="">GitHub 仓库</a>
          <a class="step" href="">贡献指南</a>
          <a class="step" href="">Issue 反馈</a>
          <a class="step" href="">开发文档</a>
        </div>

        <div class="panel">
          <h2>网站信息</h2>
          <p>Star 数 1.2k</p>
          <p>贡献者数 72</p>
          <p>最后更新 2025-01-10</p>
          <a class="github" href="">在 GitHub 上贡献</a>
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
  }

  .top {
    display: flex;
    align-items: center;
    gap: 18px;
    height: 54px;
    padding: 0 20px;
    background: #fff;
    border-bottom: 1px solid #e5e7eb;
    overflow-x: auto;
    white-space: nowrap;
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
    background: #e6eefc;
  }

  .purple {
    background: #f1e9fd;
  }

  .yellow {
    background: #fdf3da;
  }

  .green {
    background: #e3f4e8;
  }

  .sky {
    background: #e6edfb;
  }

  .pink {
    background: #fde7ea;
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
