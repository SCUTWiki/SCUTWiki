<script setup>
import Title from '../components/Title.vue'
import ModuleCard from '../components/home/ModuleCard.vue'
import QuickFolder from '../components/home/QuickFolder.vue'
import StatsLedger from '../components/home/StatsLedger.vue'
import BottomBand from '../components/home/BottomBand.vue'

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

const stats = [
  { label: '文章汇总', count: 128, href: '/more' },
  {
    label: '文件汇总',
    count: 46,
    href: '/more',
    sub: 'PDF 12 · 图片 20 · 表格 8 · 其他 6',
  },
  { label: '链接汇总', count: 87, href: '/more' },
]

const footerLinks = [
  { label: '关于我们', index: '01' },
  { label: '联系我们 / 投稿', index: '02' },
  { label: '支持 / 赞助我们', index: '03' },
]
</script>

<template>
  <Title variant="home" />

  <div class="hp">
    <main class="hp-main">
      <div class="hp-wrap">
        <div class="hp-grid">
          <!-- 左侧留空：以后放互动 -->
          <div class="hp-gutter">
            <span class="hp-gutter-label">互动区 / SOON</span>
            <div class="hp-gutter-line" />
            <div class="hp-gutter-box">预留</div>
          </div>

          <div>
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
              <div class="hp-push-card">
                <div class="hp-thumb">封面图</div>
                <div class="hp-push-text">
                  <h3>新生入学指南 · 2026 版</h3>
                  <p>报到流程、宿舍分配、选课时间线一页看完。附各学院见面会时间表。</p>
                </div>
                <div class="hp-dots">
                  <i class="on" /><i /><i /><i /><i />
                </div>
              </div>
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
