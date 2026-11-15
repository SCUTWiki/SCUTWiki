<script setup>
/**
 * 第一页（首页）：三张板块卡片 + 完整目录。
 * 卡片与目录里的每一项都是链接，跳到对应大页面 / 页面内条目。
 * 导航地址统一走 navigate(path)：hash 路由由 UniversityMain.vue 渲染。
 */
import Title from '../../collage components/Title.vue'
import { cards, toc } from './toc.js'

defineProps({
  navigate: { type: Function, required: true },
})
const emit = defineEmits(['home'])
</script>

<template>
  <div class="home">
    <Title @home="emit('home')" />
    <header class="home-head">
      <p class="home-title">SCUT · 大学主模块</p>
      <p class="home-lead">校园 / 学习 / 生活 · 按目录切换浏览</p>
    </header>

    <section class="home-block" aria-labelledby="cards-title">
      <h2 id="cards-title" class="home-h2">快速进入</h2>
      <nav class="cards" aria-label="板块页面">
        <a
          v-for="c in cards" :key="c.id"
          :href="`#/${c.id}`" class="card-link"
          @click.prevent="navigate(`/${c.id}`)"
        >
          <span class="card-icon" aria-hidden="true">{{ c.icon }}</span>
          <strong>{{ c.label }}</strong>
          <small>{{ c.desc }}</small>
          <span class="card-go" aria-hidden="true">进入 →</span>
        </a>
      </nav>
    </section>

    <section class="home-block" aria-labelledby="toc-title">
      <h2 id="toc-title" class="home-h2">全部目录</h2>
      <p class="home-hint">点击任意条目可跳到对应页面并定位到该小节。</p>
      <div class="toc-grid">
        <section v-for="group in toc" :key="group.id" class="toc-group">
          <h3 class="toc-group-title">
            <a :href="`#/${group.id}`" @click.prevent="navigate(`/${group.id}`)">
              {{ group.label }} <span aria-hidden="true">↗</span>
            </a>
          </h3>
          <ul>
            <li v-for="item in group.children" :key="item.id">
              <a
                :href="`#/${group.id}/${item.id}`"
                @click.prevent="navigate(`/${group.id}/${item.id}`)"
              >{{ item.label }}</a>
            </li>
          </ul>
        </section>
      </div>
    </section>

    <footer class="home-foot">
      <a href="#/" @click.prevent="navigate('/')">回到首页</a>
    </footer>
  </div>
</template>

<style scoped>
/* 简洁黑白绿 · 浅色（与 preview.html 一致） */
.home { --ink: #111; --gray: #555; --faint: #888; --line: #e2e2e2;
  --bg-soft: #fafafa; --brand: #1a7f4b; --brand-soft: #edf7f0; --radius: 4px;
  max-width: 900px; color: var(--ink); }
.home-head { margin: 1.8rem 0 2.2rem; }
.home-title { font-size: 1.35rem; font-weight: 650; color: var(--ink);
  margin: 0 0 .25rem; letter-spacing: .01em; }
.home-lead { color: var(--gray); margin: 0; font-size: .9rem; }

.home-block { margin: 0 0 2.4rem; }
.home-h2 { font-size: 1.05rem; font-weight: 650; margin: 0 0 .8rem;
           padding-left: .65rem; border-left: 3px solid var(--brand); }
.home-hint { font-size: .82rem; color: var(--faint); margin: -.4rem 0 1rem; }

.cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0;
         border: 1px solid var(--line); border-radius: var(--radius); }
.card-link {
  display: flex; flex-direction: column; gap: .25rem; position: relative;
  padding: 1.1rem 1.1rem 1.4rem; border-right: 1px solid var(--line);
  background: #fff; text-decoration: none; color: var(--ink);
  transition: background .15s;
}
.card-link:last-child { border-right: 0; }
.card-link:hover { background: var(--bg-soft); text-decoration: none; }
.card-icon { font-size: 1.35rem; line-height: 1; filter: grayscale(1); opacity: .65; }
.card-link strong { font-size: 1rem; font-weight: 650; }
.card-link small { color: var(--gray); font-size: .78rem; line-height: 1.55; }
.card-go { position: absolute; right: 1rem; bottom: .9rem; font-size: .75rem; color: var(--brand); }

.toc-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 1.4rem; }
.toc-group { border-top: 2px solid var(--ink); padding: .6rem 0 0; }
.toc-group-title { margin: 0 0 .5rem; font-size: .95rem; font-weight: 650; }
.toc-group-title a { color: var(--ink); text-decoration: none; }
.toc-group-title a:hover { color: var(--brand); }
.toc-group ul { list-style: none; margin: 0; padding: 0; display: grid; gap: .2rem; }
.toc-group li a { font-size: .84rem; color: var(--gray); text-decoration: none; }
.toc-group li a:hover { color: var(--brand); }

.home-foot { display: flex; flex-wrap: wrap; gap: .4rem 1.2rem; align-items: center;
  border-top: 1px solid var(--line); padding-top: 1rem; font-size: .8rem; color: var(--faint); }
:focus-visible { outline: 2px solid var(--brand); outline-offset: 2px; }
@media (max-width: 860px) {
  .cards { grid-template-columns: 1fr; }
  .card-link { border-right: 0; border-bottom: 1px solid var(--line); }
  .card-link:last-child { border-bottom: 0; }
}
@media (prefers-reduced-motion: reduce) { * { transition: none !important; } }
</style>
