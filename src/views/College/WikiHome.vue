<script setup>
/**
 * 大学主模块入口（vue-router 的 /college 指向本文件）：
 *   /college              首页：三张卡片 + 完整目录 + 我的收藏
 *   /college#<itemId>     板块页：SectionPage（仅按目录切换）
 *
 * 跳转用 vue-router 的 route.hash 做唯一状态源（history 模式下直接改 location.hash 不可靠）。
 * 视觉：全局 Title.vue（Home.vue 同款），字体/进入动画参考学院模块。
 */
import { ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import Title from '../../components/Title.vue'
import SectionPage from './college wiki/SectionPage.vue'
import FavoriteButton from './college components/FavoriteButton.vue'
import { useFavorites } from './college components/useFavorites.js'
import { cards, toc, findItem, firstItemId, flatSections } from './college wiki/toc.js'

const router = useRouter()
const route = useRoute()
const { has, toggle } = useFavorites()

// route.hash 是唯一数据源（含 #），浏览器前进/后退、外部深链都会同步到这里
const itemId = ref(route.hash.replace(/^#/, ''))
watch(() => route.hash, h => { itemId.value = h.replace(/^#/, '') })

const current = computed(() => findItem(itemId.value))
const isHome = computed(() => !current.value)

/** 卡片 / 目录项 / 收藏跳转：先更新状态，再用 router 同步 URL */
function go(id) {
  const next = id === 'home' ? '' : (findItem(id) ? id : firstItemId(id))
  itemId.value = next
  const hash = next ? `#${next}` : ''
  if (route.hash !== hash) router.replace({ path: '/college', hash })
  else window.scrollTo({ top: 0, behavior: 'smooth' })
}
const goSiteHome = () => router.push('/')
const favorites = computed(() => flatSections.filter(s => has(s.id)))
</script>

<template>
  <div class="college-app">
    <Title variant="home" :compact="true" />

    
      <!-- ============ 首页 ============ -->
      <div v-if="isHome" key="home" class="cl-wrap">
        <header class="cl-bar">
          <button type="button" class="cl-site-home" @click="goSiteHome">← 返回 Home 首页</button>
          <span class="cl-brand">SCUT · 大学主模块</span>
        </header>
        <header class="cl-intro">
          <h2 class="cl-title">SCUT · 大学主模块</h2>
          <p class="cl-lead">报到、选课、考试与绩点，新生最常走的那条路。</p>
        </header>

        <!-- 我的收藏（参考联系模块） -->
        <section v-if="favorites.length" class="cl-block cl-fav-block">
          <h3 class="cl-h3">我的收藏</h3>
          <div class="cl-fav-list">
            <a v-for="s in favorites" :key="s.id" class="cl-fav-item"
               :href="`#${s.id}`" @click.prevent="go(s.id)">
              <span>★</span>{{ s.label }}
            </a>
          </div>
        </section>

        <section class="cl-block">
          <h3 class="cl-h3">快速进入</h3>
          <nav class="cl-cards" aria-label="板块入口">
            <a v-for="c in cards" :key="c.id" class="cl-card" :href="`#${firstItemId(c.id)}`"
               @click.prevent="go(c.id)">
              <span class="cl-icon" aria-hidden="true">{{ c.icon }}</span>
              <strong>{{ c.label }}</strong>
              <small>{{ c.desc }}</small>
              <span class="cl-arrow" aria-hidden="true">进入 →</span>
            </a>
          </nav>
        </section>

        <section class="cl-block">
          <h3 class="cl-h3">全部目录</h3>
          <div class="cl-grid">
            <div v-for="g in toc" :key="g.id" class="cl-group">
              <h4><a :href="`#${firstItemId(g.id)}`" @click.prevent="go(g.id)">{{ g.label }} ↗</a></h4>
              <ul>
                <li v-for="i in g.children" :key="i.id">
                  <a :href="`#${i.id}`" @click.prevent="go(i.id)">
                    {{ i.label }}
                    <FavoriteButton :active="has(i.id)" icon-only @toggle="toggle(i.id)" />
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </section>
      </div>

      <!-- ============ 板块页 ============ -->
      <div v-else :key="current.pageId" class="cl-wrap">
        <SectionPage :page-id="current.pageId" :item-id="itemId" @navigate="go" />
      </div>
    
  </div>
</template>

<style scoped>
/* 字体参考学院模块；配色用全站变量 */
.college-app { --hp-green: #43b581; color: var(--color-text); }
.cl-wrap { max-width: 1080px; margin: 0 auto; padding: 1.2rem 1.25rem 4rem;
  font-family: 'Noto Serif SC', 'Songti SC', Georgia, serif; }
.cl-bar { display: flex; align-items: center; justify-content: space-between; gap: .8rem; margin-bottom: 1rem; }
.cl-site-home { font: inherit; font-size: .84rem; cursor: pointer; color: var(--hp-green);
  background: var(--color-background-soft); border: 1px solid var(--color-border);
  border-radius: 999px; padding: .3rem .8rem; }
.cl-site-home:hover { border-color: var(--hp-green); }
.cl-brand { font-size: .84rem; color: var(--color-text); opacity: .7; }
.cl-intro { margin: 0 0 2rem; padding-bottom: 1rem; border-bottom: 1px solid var(--color-border); }
.cl-title { font-size: 1.9rem; font-weight: 700; color: var(--color-heading); margin: 0 0 .3rem; letter-spacing: .02em; }
.cl-lead { margin: 0; color: var(--color-text); opacity: .8; }
.cl-block { margin: 0 0 2.4rem; }
.cl-h3 { font-size: 1.05rem; font-weight: 650; color: var(--color-heading);
  margin: 0 0 .9rem; padding-left: .65rem; border-left: 3px solid var(--hp-green); }
.cl-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 0;
  border: 1px solid var(--color-border); border-radius: 8px; overflow: hidden; }
.cl-card { display: flex; flex-direction: column; gap: .25rem; position: relative;
  padding: 1.1rem 1.1rem 1.4rem; border-right: 1px solid var(--color-border);
  background: var(--color-background-soft); color: var(--color-heading); text-decoration: none;
  transition: background .2s, transform .2s; }
.cl-card:last-child { border-right: 0; }
.cl-card:hover { background: var(--color-background-mute); text-decoration: none; transform: translateY(-2px); }
.cl-icon { font-size: 1.4rem; line-height: 1; filter: grayscale(1); opacity: .7; }
.cl-card strong { font-size: 1rem; }
.cl-card small { color: var(--color-text); opacity: .8; font-size: .78rem; line-height: 1.55; }
.cl-arrow { position: absolute; right: 1rem; bottom: .9rem; font-size: .75rem; color: var(--hp-green); }
.cl-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 1.4rem; }
.cl-group { border-top: 2px solid var(--color-heading); padding: .6rem 0 0; }
.cl-group h4 { margin: 0 0 .5rem; font-size: .95rem; }
.cl-group h4 a { color: var(--color-heading); text-decoration: none; }
.cl-group h4 a:hover { color: var(--hp-green); }
.cl-group ul { list-style: none; margin: 0; padding: 0; display: grid; gap: .3rem; }
.cl-group li a { display: flex; align-items: center; justify-content: space-between; gap: .4rem;
  font-size: .84rem; color: var(--color-text); text-decoration: none; }
.cl-group li a:hover { color: var(--hp-green); }
.cl-fav-list { display: flex; flex-wrap: wrap; gap: .5rem; }
.cl-fav-item { display: inline-flex; align-items: center; gap: .3rem; padding: .3rem .7rem;
  border: 1px solid var(--color-border); border-radius: 999px; font-size: .84rem;
  color: var(--color-heading); background: var(--color-background-soft); text-decoration: none; }
.cl-fav-item span { color: var(--hp-green); }
.cl-fav-item:hover { border-color: var(--hp-green); text-decoration: none; }

/* 进入效果：参考学院模块的过渡 */
.cl-page-enter-active { transition: opacity .35s ease, transform .35s ease; }
.cl-page-leave-active { transition: opacity .15s ease; }
.cl-page-enter-from { opacity: 0; transform: translateY(10px); }
.cl-page-leave-to { opacity: 0; }
:focus-visible { outline: 2px solid var(--hp-green); outline-offset: 2px; }
@media (max-width: 860px) {
  .cl-cards { grid-template-columns: 1fr; }
  .cl-card { border-right: 0; border-bottom: 1px solid var(--color-border); }
  .cl-card:last-child { border-bottom: 0; }
}
@media (prefers-reduced-motion: reduce) {
  .cl-page-enter-active, .cl-page-leave-active, .cl-card { transition: none; }
}
</style>