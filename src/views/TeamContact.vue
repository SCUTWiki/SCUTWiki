<script setup>
import { ref } from 'vue'
import PageLayout from '../components/PageLayout.vue'

const name = ref('')
const contact = ref('')
const message = ref('')
const sent = ref(false)

function submit() {
  // 还没有接后端，先做个提交反馈
  sent.value = true
  name.value = ''
  contact.value = ''
  message.value = ''
}
</script>

<template>
  <PageLayout
    eyebrow="CONTACT / 联系"
    title="联系我们 / 投稿"
    lead="投稿、纠错、合作，或者只是想提个建议——都可以从这里找到我们。尽量把信息写具体，回复会快很多。"
  >
    <section class="pg-section">
      <h2>三个入口</h2>
      <div class="pg-grid three">
        <article class="pg-card">
          <span class="pg-tag">01 / 邮件</span>
          <h3>wiki@scut.example</h3>
          <p>适合较长的稿件、图片素材，或者需要附件说明的内容。</p>
        </article>
        <article class="pg-card">
          <span class="pg-tag">02 / GitHub</span>
          <h3>提 Issue 或 PR</h3>
          <p>发现错别字、过时信息，直接开 Issue；会写 Markdown 的话，PR 更快。</p>
        </article>
        <article class="pg-card">
          <span class="pg-tag">03 / 群聊</span>
          <h3>微信 / QQ 群</h3>
          <p>扫码进群（二维码待补），适合快速提问和临时讨论。</p>
        </article>
      </div>
    </section>

    <section class="pg-section">
      <h2>给我们留言</h2>
      <form class="pg-form" @submit.prevent="submit">
        <div class="pg-field">
          <label for="c-name">称呼</label>
          <input id="c-name" v-model="name" class="pg-input" type="text" placeholder="怎么称呼你" />
        </div>
        <div class="pg-field">
          <label for="c-contact">联系方式</label>
          <input id="c-contact" v-model="contact" class="pg-input" type="text" placeholder="邮箱 / 微信 / QQ，任选一个" />
        </div>
        <div class="pg-field">
          <label for="c-msg">想说的话</label>
          <textarea id="c-msg" v-model="message" class="pg-textarea" placeholder="投稿内容、发现的错误、合作意向……" />
        </div>
        <button class="pg-btn" type="submit">发送</button>
        <p v-if="sent" class="pg-note">已记录你的留言（表单还没接后端，正式上线前请先用邮件联系）。</p>
        <p v-else class="pg-note">当前表单只做前端演示，正式提交请先发邮件到上面的地址。</p>
      </form>
    </section>

    <section class="pg-section">
      <h2>其他方式</h2>
      <ul class="pg-list">
        <li><span class="k">仓库</span><span class="v">github.com/genshiniubi/SCUTWiki</span></li>
        <li><span class="k">响应时间</span><span class="v">工作日 1–2 天；期末周会慢一些。</span></li>
        <li><span class="k">投稿格式</span><span class="v">Markdown 或纯文本都行，图片单独附上，注明是否允许修改。</span></li>
      </ul>
    </section>
  </PageLayout>
</template>
