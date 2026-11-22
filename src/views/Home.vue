<script setup>
import { computed } from 'vue'

import Title from '../components/Title.vue'
import ModuleCard from '../components/home/ModuleCard.vue'
import QuickFolder from '../components/home/QuickFolder.vue'
import StatsLedger from '../components/home/StatsLedger.vue'
import BottomBand from '../components/home/BottomBand.vue'
import { useContentStats, fileTypeSummary, formatDate, typeLabel } from '../composables/useContentStats'

const modules = [
  {
    index: '01',
    name: '大学主模块',
    glyph: 'hall',
    href: '/college',
    desc: '报到、选课、考试与绩点，<br>新生最常走的那条路',
    toc: ['新生报到', '选课', '考试与成绩', '绩点与保研'],
    featured: '《2026 新生入学指南》已更新',
  },
  {
    index: '02',
    name: '学院模块',
    glyph: 'academy',
    href: '/faculty',
    desc: '按学院划分的课程、<br>导师与实验室信息',
    toc: ['学院一览', '导师介绍', '实验室', '培养方案'],
    featured: '计算机学院 · 实验室开放日',
  },
  {
    index: '03',
    name: '组织模块',
    glyph: 'org',
    href: '/club',
    desc: '校级与院级组织、<br>社团的招新与活动',
    toc: ['校级组织', '院级组织', '社团招新'],
    featured: '社团招新周 · 9 月 12 日开始',
  },
  {
    index: '04',
    name: '开源模块',
    glyph: 'branch',
    href: '/opensource',
    desc: '同学做的小工具、<br>脚本与开源项目',
    toc: ['工具合集', '脚本仓库', '贡献指南'],
    featured: '绩点计算器 v2 已上线',
  },
  {
    index: '05',
    name: '联系模块',
    glyph: 'phone',
    href: '/contact',
    desc: '老师、学长与合作者<br>的联系方式',
    toc: ['学院办公室', '学长答疑', '投稿方式'],
    featured: '投稿邮箱：wiki@scut.example',
  },
  {
    index: '06',
    name: '其他模块',
    glyph: 'person',
    href: '/more',
    desc: '杂文、群分享、<br>兴趣与随手记',
    toc: ['二手交易', '常见风险', '杂文'],
    featured: '二手交易群信息已更新',
  },
]

const quickLinks = [
  { label: '教务系统' },
  { label: '成绩查询' },
  { label: '校历' },
  { label: '课程表' },
  { label: '图书馆' },
  { label: '校园卡' },
  { label: '校车时刻' },
  { label: '报修' },
  { label: '全部入口' },
]

const { counts, fileTypes, recent } = useContentStats()

const stats = computed(() => [
  { label: '文章汇总', count: counts.doc, href: '/wiki' },
  {
    label: '文件汇总',
    count: counts.file,
    href: '/files',
    sub: fileTypeSummary(fileTypes) || '暂无文件',
  },
  { label: '链接汇总', count: counts.link, href: '/links' },
])

const latest = computed(() => recent.find((item) => item.type === 'doc') || recent[0])

const footerLinks = [
  { label: '关于我们', index: '01', href: '/about' },
  { label: '联系我们 / 投稿', index: '02', href: '/contact-us' },
  { label: '支持 / 赞助我们', index: '03', href: '/support' },
]
</script>

<template>
  <Title variant="home" :compact="false" />

  <div class="hp">
    <main class="hp-main">
      <div class="hp-wrap">
        <div class="hp-grid">
          <!-- 互动实验入口：限定词斗蛐蛐 -->
          <div class="hp-gutter">
            <span class="hp-gutter-label">互动区 / PLAY</span>
            <div class="hp-gutter-line" />
            <RouterLink class="hp-gutter-play" to="/cricket" aria-label="进入限定词斗蛐蛐">
              <span class="hp-gutter-play-kicker">PLAY 001</span>
              <span class="hp-gutter-play-title">限定词斗蛐蛐</span>
              <span class="hp-gutter-play-foot">五词成阵 ↗</span>
            </RouterLink>
          </div>

          <div>
            <RouterLink class="hp-mobile-game" to="/cricket">
              <span class="hp-mobile-game-kicker">互动实验 001 · PLAY</span>
              <strong>限定词斗蛐蛐</strong>
              <span class="hp-mobile-game-foot">五词成阵 · 自动对决 ↗</span>
            </RouterLink>

            <section class="hp-mods" aria-label="模块入口">
              <ModuleCard
                v-for="item in modules"
                :key="item.index"
                :index="item.index"
                :name="item.name"
                :desc="item.desc"
                :glyph="item.glyph"
                :href="item.href"
                :toc="item.toc"
                :featured="item.featured"
              />
            </section>

            <section class="hp-push" aria-label="最新推送">
              <div class="hp-push-head">
                <h2>推送</h2>
                <span class="hp-line" />
              </div>
              <component
                :is="latest?.href ? 'RouterLink' : 'div'"
                class="hp-push-card"
                :to="latest?.href || undefined"
              >
                <div class="hp-thumb">最近更新</div>
                <div class="hp-push-text">
                  <h3>{{ latest?.title || '暂无更新' }}</h3>
                  <p v-if="latest">更新于 {{ formatDate(latest.updatedAt) }} · {{ typeLabel(latest.type) }}</p>
                  <p v-else>还没有可展示的内容。</p>
                </div>
              </component>
            </section>
          </div>

          <aside class="hp-side">
            <QuickFolder :links="quickLinks" />
            <StatsLedger :rows="stats" />
          </aside>
        </div>
      </div>
    </main>

    <BottomBand :links="footerLinks" />
  </div>
</template>
