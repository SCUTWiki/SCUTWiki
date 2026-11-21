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
        <span class="pg-eyebrow">SUPPORT / 支持</span>
        <h1>支持 / 赞助我们</h1>
        <p class="pg-lead">
          SCUTWiki 一直靠同学用爱发电。如果它帮你少踩过一次坑，下面这些方式都能让它多活一阵。
        </p>
      </header>

      <TeamTabs />

      <section class="pg-section">
        <h2>赞助方式</h2>
        <div class="pg-grid three">
          <article class="pg-card">
            <span class="pg-tag">01 / 爱发电</span>
            <h3>按月支持</h3>
            <p>适合长期支持，金额随意，可以随时停。</p>
            <div class="pg-qr">二维码待放</div>
          </article>
          <article class="pg-card">
            <span class="pg-tag">02 / 微信</span>
            <h3>赞赏码</h3>
            <p>一次性小额赞助，用来补贴域名和存储。</p>
            <div class="pg-qr">二维码待放</div>
          </article>
          <article class="pg-card">
            <span class="pg-tag">03 / 支付宝</span>
            <h3>转账</h3>
            <p>大额或需要开发票的合作，请先邮件联系我们。</p>
            <div class="pg-qr">二维码待放</div>
          </article>
        </div>
      </section>

      <section class="pg-section">
        <h2>钱会花在哪</h2>
        <ul class="pg-list">
          <li><span class="k">域名与托管</span><span class="v">scutwiki.com / .net 的续费，以及 Netlify 的构建额度。</span></li>
          <li><span class="k">素材存储</span><span class="v">图片、扫描件和附件，尽量用国内可访问的对象存储。</span></li>
          <li><span class="k">线下</span><span class="v">打印指南、社团招新时的海报与摊位物料。</span></li>
        </ul>
        <p class="pg-note">所有支出会按季度在仓库的 docs/ 里记一笔，金额和用途都会公开。</p>
      </section>

      <section class="pg-section">
        <h2>不一定用钱</h2>
        <div class="pg-grid two">
          <article class="pg-card">
            <h3>帮忙补充内容</h3>
            <p>你写的一段课程体验，可能比一笔赞助更有用。投稿入口在「联系我们」。</p>
          </article>
          <article class="pg-card">
            <h3>把站点告诉别人</h3>
            <p>转给刚入学的新生，或者在班级群里提一句，就是最直接的宣传。</p>
          </article>
        </div>
        <div class="pg-link-row">
          <RouterLink class="pg-link" to="/contact-us">去投稿 →</RouterLink>
          <RouterLink class="pg-link" to="/about">了解我们 →</RouterLink>
        </div>
      </section>
    </div>
  </main>
</template>
