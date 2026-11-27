<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

import Title from '../components/Title.vue'
import ModuleCard from '../components/home/ModuleCard.vue'
import QuickFolder from '../components/home/QuickFolder.vue'
import StatsLedger from '../components/home/StatsLedger.vue'
import BottomBand from '../components/home/BottomBand.vue'
import HomeRail from '../components/home/HomeRail.vue'
import { useContentStats, fileTypeSummary, formatDate, typeLabel } from '../composables/useContentStats'

// 六个模块的固定信息；目录与代表内容优先取实际词条，没有词条时用页面里真实存在的结构
const moduleDefs = [
  {
    module: 'college',
    index: '01',
    name: '大学主模块',
    glyph: 'hall',
    href: '/college',
    desc: '报到、选课、考试与绩点，<br>新生最常走的那条路',
    fallbackToc: ['校园', '学习', '生活'],
    fallbackFeatured: '校园 / 学习 / 生活 三个板块',
  },
  {
    module: 'faculty',
    index: '02',
    name: '学院模块',
    glyph: 'academy',
    href: '/faculty',
    desc: '按学院划分的课程、<br>导师与实验室信息',
    fallbackToc: ['学院图鉴'],
    fallbackFeatured: '学院图鉴 · 6 个学院',
  },
  {
    module: 'organization',
    index: '03',
    name: '组织模块',
    glyph: 'org',
    href: '/club',
    desc: '校级与院级组织、<br>社团的招新与活动',
    fallbackToc: ['校级组织', '院级组织', '社团'],
    fallbackFeatured: '校级组织名录已收录',
  },
  {
    module: 'opensource',
    index: '04',
    name: '开源模块',
    glyph: 'branch',
    href: '/opensource',
    desc: '同学做的小工具、<br>脚本与开源项目',
    fallbackToc: ['项目动态', '新贡献者入门', '公告与动态', '快速入口'],
    fallbackFeatured: '项目动态与新贡献者入门',
  },
  {
    module: 'contact',
    index: '05',
    name: '联系模块',
    glyph: 'phone',
    href: '/contact',
    desc: '老师、学长与合作者<br>的联系方式',
    fallbackToc: ['学院导师联系方式', '校园交流群', '学院与辅导员联系方式', '校园生活服务'],
    fallbackFeatured: '导师 / 交流群 / 辅导员 / 生活服务',
  },
  {
    module: 'more',
    index: '06',
    name: '其他模块',
    glyph: 'person',
    href: '/more',
    desc: '杂文、群分享、<br>兴趣与随手记',
    fallbackToc: ['常见风险', '箴言', '杂文'],
    fallbackFeatured: '常见风险、箴言与杂文',
  },
]

const modules = computed(() =>
  moduleDefs.map((def) => {
    const list = entries.filter((entry) => entry.module === def.module)
    const latest = list[0]
    return {
      ...def,
      toc: list.length ? list.slice(0, 4).map((entry) => entry.title) : def.fallbackToc,
      featured: latest
        ? `《${latest.title}》 · ${formatDate(latest.updatedAt)}`
        : def.fallbackFeatured,
    }
  }),
)

const quickLinks = [
  // 课程中心（百步梯）——如果学校换了入口，改这里的地址即可
  { label: '课程中心', href: 'https://course.scut.edu.cn' },
  { label: '交流群', to: '/contact?board=groups' },
]

const { counts, fileTypes, entries } = useContentStats()

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

// 推送：取最近的几篇词条轮播
const pushItems = computed(() => entries.filter((item) => item.type === 'doc').slice(0, 5))

const pushIndex = ref(0)
const pushPaused = ref(false)
let pushTimer = null

const currentPush = computed(() => pushItems.value[pushIndex.value] || null)

function startPushTimer() {
  stopPushTimer()
  pushTimer = setInterval(() => {
    if (pushPaused.value || pushItems.value.length < 2) return
    pushIndex.value = (pushIndex.value + 1) % pushItems.value.length
  }, 6000)
}

function stopPushTimer() {
  if (pushTimer) clearInterval(pushTimer)
  pushTimer = null
}

function goToPush(index) {
  pushIndex.value = index
  startPushTimer()
}

onMounted(startPushTimer)
onBeforeUnmount(stopPushTimer)

const footerLinks = [
  { label: '关于我们', index: '01', href: '/about' },
  { label: '联系我们 / 投稿', index: '02', href: '/contact-us' },
  { label: '支持 / 赞助我们', index: '03', href: '/support' },
]

const railItems = [
  { id: 'home-mods', label: '模块' },
  { id: 'home-quick', label: '学生常用' },
  { id: 'home-total', label: '汇总' },
  { id: 'home-push', label: '推送' },
  { id: 'home-foot', label: '底栏' },
]
</script>

<template>
  <Title variant="home" :compact="false" />

  <div class="hp">
    <main class="hp-main">
      <div class="hp-wrap">
        <div class="hp-grid">
          <!-- 左侧页面索引：快速定位各区块 -->
          <div class="hp-gutter">
            <span class="hp-gutter-label">页面索引</span>
            <div class="hp-gutter-line" />
            <HomeRail :items="railItems" />
          </div>

          <div>
            <section id="home-mods" class="hp-mods" aria-label="模块入口">
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

            <section id="home-push" class="hp-push" aria-label="最新推送">
              <div class="hp-push-head">
                <h2>推送</h2>
                <span class="hp-line" />
              </div>
              <div
                class="hp-push-card"
                @mouseenter="pushPaused = true"
                @mouseleave="pushPaused = false"
              >
                <Transition name="hp-swap" mode="out-in">
                  <RouterLink
                    v-if="currentPush"
                    :key="currentPush.slug"
                    class="hp-push-link"
                    :to="currentPush.href"
                  >
                    <div class="hp-thumb">
                      <span class="hp-thumb-num">{{ String(pushIndex + 1).padStart(2, '0') }}</span>
                      <span class="hp-thumb-total">/ {{ String(pushItems.length).padStart(2, '0') }}</span>
                    </div>
                    <div class="hp-push-text">
                      <h3>{{ currentPush.title }}</h3>
                      <p>{{ currentPush.summary }}</p>
                      <p class="hp-push-meta">
                        更新于 {{ formatDate(currentPush.updatedAt) }} · {{ currentPush.section }}
                      </p>
                    </div>
                  </RouterLink>
                  <div v-else key="empty" class="hp-push-link">
                    <div class="hp-thumb">暂无</div>
                    <div class="hp-push-text"><h3>还没有可展示的内容</h3></div>
                  </div>
                </Transition>

                <div v-if="pushItems.length > 1" class="hp-push-dots">
                  <button
                    v-for="(item, i) in pushItems"
                    :key="item.slug"
                    type="button"
                    :class="{ on: i === pushIndex }"
                    :aria-label="`第 ${i + 1} 篇：${item.title}`"
                    @click="goToPush(i)"
                  />
                </div>
              </div>
            </section>
          </div>

          <aside class="hp-side">
            <div id="home-quick"><QuickFolder :links="quickLinks" /></div>
            <div id="home-total"><StatsLedger :rows="stats" /></div>
          </aside>
        </div>
      </div>
    </main>

    <BottomBand id="home-foot" :links="footerLinks" />
  </div>
</template>
