<script setup>
import '../../assets/pages.css'

import Title from '../../components/Title.vue'
import TeamTabs from '../../components/TeamTabs.vue'
</script>

<template>
  <Title />

  <main class="pg">
    <div class="pg-wrap">
      <header class="pg-hero">
        <span class="pg-eyebrow">ABOUT / 关于</span>
        <h1>关于 SCUTWiki</h1>
        <p class="pg-lead">
          SCUTWiki 是一个由学生自发维护的校园知识库：把散落在群聊、通知和口口相传里的信息，整理成随时能查的一页。
        </p>
      </header>

      <TeamTabs />

      <section class="pg-section">
        <h2>我们在做什么</h2>
        <div class="pg-grid three">
          <article class="pg-card">
            <span class="pg-tag">01 / 整理</span>
            <h3>把高频问题写成条目</h3>
            <p>培养方案、选课经验、办事流程——这些每年都要被问一遍的事，写成能搜索的页面。</p>
          </article>
          <article class="pg-card">
            <span class="pg-tag">02 / 共建</span>
            <h3>任何人都能补充和纠错</h3>
            <p>词条不设门槛，改动都留在 Git 记录里。发现过时的信息，直接提 PR 就行。</p>
          </article>
          <article class="pg-card">
            <span class="pg-tag">03 / 开源</span>
            <h3>代码和小工具都开放</h3>
            <p>站点本身开源，欢迎 fork 成你自己学校的版本，或者把常用脚本放进开源模块。</p>
          </article>
        </div>
      </section>

      <section class="pg-section">
        <h2>现在的规模</h2>
        <div class="pg-stats">
          <div class="pg-stat"><b>128</b><span>篇词条</span></div>
          <div class="pg-stat"><b>46</b><span>个文件</span></div>
          <div class="pg-stat"><b>87</b><span>条外链</span></div>
        </div>
      </section>

      <section class="pg-section">
        <h2>怎么走到这里</h2>
        <ul class="pg-list">
          <li><span class="k">2025.09</span><span class="v">从一份共享文档开始，先把新生最常问的问题整理成清单。</span></li>
          <li><span class="k">2026.03</span><span class="v">迁移到 Vue + Vite，页面从静态文件变成可维护的组件。</span></li>
          <li><span class="k">2026.11</span><span class="v">首页改版，加入模块目录、深浅色主题与学生常用入口。</span></li>
        </ul>
      </section>

      <section class="pg-section">
        <h2>一起参与</h2>
        <p class="pg-lead">
          不需要会写代码：指出错误、补充信息、提供图片，都是贡献。想投稿或合作，从下面两个入口找我们。
        </p>
        <div class="pg-link-row">
          <RouterLink class="pg-link" to="/contact-us">联系我们 / 投稿 →</RouterLink>
          <a class="pg-link" href="https://github.com/SCUTWiki/SCUTWiki" target="_blank" rel="noopener">
            GitHub 仓库 →
          </a>
        </div>
      </section>
    </div>
  </main>
</template>
