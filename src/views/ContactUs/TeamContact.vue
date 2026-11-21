<script setup>
import '../../assets/pages.css'

import Title from '../../components/Title.vue'
</script>

<template>
  <Title />

  <main class="pg">
    <div class="pg-wrap">
      <header class="pg-hero">
        <span class="pg-eyebrow">CONTACT / 联系</span>
        <h1>联系我们 / 投稿</h1>
        <p class="pg-lead">
          投稿、纠错、合作，或者只是想提个建议——都可以从这里找到我们。尽量把信息写具体，回复会快很多。
        </p>
      </header>

      <section class="pg-section">
        <h2>入口</h2>
        <div class="pg-grid two">
          <article class="pg-card">
            <span class="pg-tag">01 / 邮件</span>
            <h3>1291581212@qq.com</h3>
            <p>适合较长的稿件（markdown、txt、pdf、docx 等文件）、图片素材，或者需要附件说明的内容。</p>
          </article>
          <article class="pg-card">
            <span class="pg-tag">02 / 群聊</span>
            <h3>QQ 群</h3>
            <p>群号：1131296704</p>
            <p>凭邮箱作密码进群，适合提问、短内容补充和临时讨论。</p>
          </article>
        </div>
      </section>

      <section class="pg-section">
        <h2>其他</h2>
        <ul class="pg-list">
          <li><span class="k">仓库</span><span class="v">github.com/SCUTWiki/SCUTWiki</span></li>
          <li><span class="k">响应时间</span><span class="v">工作日 1–2 天；期末周会慢一些。</span></li>
          <li><span class="k">投稿格式</span><span class="v">Markdown 或纯文本都行，图片单独附上，注明是否允许修改。</span></li>
        </ul>
      </section>
    </div>
  </main>
</template>
