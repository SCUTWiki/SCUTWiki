<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ContactCard from '../../components/ContactCard.vue'
import Title from '../../components/Title.vue'
import {
  collegeDirectory,
  facultyDirectorySource,
  teachers,
} from '../../data/teachers.js'
import { collegeContactCampuses } from '../../data/colleges.js'
import { counselorSource, counselorSourceUrl, counselors } from '../../data/counselors.js'
import { groupCategories } from '../../data/groups.js'
import { expressServices, graduationShipping } from '../../data/express.js'
import {
  utilityCampuses,
  utilityHistoricalNotice,
  utilitySource,
  utilitySourceUrl,
  utilitySupportContacts,
} from '../../data/utilities.js'

const route = useRoute()
const router = useRouter()

const boards = [
  {
    id: 'teachers',
    title: '学院导师联系方式',
    description: '按学院浏览教师名录；仅展示已核实的官方公开联系方式。',
    icon: '1',
  },
  {
    id: 'groups',
    title: '校园交流群',
    description: '查找校园交流群并快速复制群号。',
    icon: '3',
  },
  {
    id: 'colleges',
    title: '学院与辅导员联系方式',
    description: '汇总学院咨询方式与新生辅导员信息。',
    icon: '2',
  },
  {
    id: 'services',
    title: '校园生活服务',
    description: '查看快递运输、毕业生托运及水电缴费指南。',
    icon: '4',
  },
]

const activeBoard = computed(() => boards.find((board) => board.id === route.query.board) ?? null)
const isFavorites = computed(() => route.query.view === 'favorites')
const searchQuery = ref('')
const selectedCampus = ref('全部校区')
const collegeSection = ref('colleges')
const serviceSection = ref('express')
const activeGroupCategory = ref(groupCategories[0]?.id ?? '')
const notice = ref('')
const storageError = ref('')
const favoriteIds = ref(new Set())

try {
  const saved = localStorage.getItem('scutwiki-contact-favorites')
  if (saved) {
    const parsed = JSON.parse(saved)
    if (Array.isArray(parsed) && parsed.every((id) => typeof id === 'string')) {
      favoriteIds.value = new Set(parsed)
    } else {
      storageError.value = '收藏数据格式异常，本次暂不加载旧记录。'
    }
  }
} catch {
  storageError.value = '无法读取本地收藏记录，请检查浏览器存储权限。'
}

const normalizedSearch = computed(() => searchQuery.value.trim().toLocaleLowerCase())
const filteredColleges = computed(() => {
  if (!normalizedSearch.value) return collegeDirectory
  return collegeDirectory.filter((college) =>
    college.college.toLocaleLowerCase().includes(normalizedSearch.value),
  )
})

const filteredTeachers = computed(() => {
  if (!normalizedSearch.value) return teachers
  return teachers.filter((teacher) =>
    [
      teacher.name,
      teacher.college,
      teacher.researchDirection,
    ].some((value) => value?.toLocaleLowerCase().includes(normalizedSearch.value)),
  )
})

const visibleCollegeContacts = computed(() =>
  collegeContactCampuses
    .map((campus) => {
      const colleges = campus.colleges.filter(
        (college) =>
          !normalizedSearch.value ||
          college.college.toLocaleLowerCase().includes(normalizedSearch.value),
      )
      return { ...campus, colleges }
    })
    .filter((campus) => {
      const matchesCampus =
        selectedCampus.value === '全部校区' || selectedCampus.value === campus.campus
      return matchesCampus && (!normalizedSearch.value || campus.colleges.length > 0)
    }),
)

const filteredCounselors = computed(() =>
  counselors.filter((counselor) =>
    !normalizedSearch.value ||
    [
      counselor.name,
      ...(counselor.names ?? []),
      counselor.college,
      counselor.email,
      counselor.officePhone,
      ...counselor.qqGroups.flatMap((group) =>
        typeof group === 'string' ? [group] : [group.label, group.number],
      ),
    ]
      .some((value) => value?.toLocaleLowerCase().includes(normalizedSearch.value)),
  ),
)

const currentGroups = computed(
  () => {
    const groups = groupCategories.find((category) => category.id === activeGroupCategory.value)?.groups ?? []
    if (!normalizedSearch.value) return groups
    return groups.filter((group) =>
      [group.name, group.number].some((value) => value.toLocaleLowerCase().includes(normalizedSearch.value)),
    )
  },
)

const favoriteContacts = computed(() => {
  const collegeContacts = collegeContactCampuses.flatMap((campus) =>
    campus.colleges.map((college) => ({ ...college, category: 'college' })),
  )
  return [...teachers, ...counselors, ...collegeContacts].filter((contact) =>
    favoriteIds.value.has(contact.id),
  )
})
const favoriteGroups = computed(() =>
  groupCategories.flatMap((category) =>
    category.groups
      .filter((group) => favoriteIds.value.has(group.id))
      .map((group) => ({ ...group, category: category.label, categoryId: category.id })),
  ),
)
const favoriteExpressServices = computed(() =>
  expressServices.filter((service) => favoriteIds.value.has(`express:${service.id}`)),
)
const favoriteUtilityCampuses = computed(() =>
  utilityCampuses.filter((campus) => favoriteIds.value.has(`utilities:${campus.id}`)),
)
const hasFavorites = computed(
  () =>
    favoriteContacts.value.length > 0 ||
    favoriteGroups.value.length > 0 ||
    favoriteExpressServices.value.length > 0 ||
    favoriteUtilityCampuses.value.length > 0,
)

function openBoard(boardId) {
  searchQuery.value = ''
  router.push({ path: '/contact', query: { board: boardId } })
}

function openFavorites() {
  searchQuery.value = ''
  router.push({ path: '/contact', query: { view: 'favorites' } })
}

function openFavoriteContact(contact) {
  if (contact.category === 'college') {
    selectedCampus.value = contact.campus
    collegeSection.value = 'colleges'
    searchQuery.value = contact.college
    router.push({ path: '/contact', query: { board: 'colleges' } })
    return
  }

  if (contact.category === 'counselors') {
    collegeSection.value = 'counselors'
    searchQuery.value = contact.college
    router.push({ path: '/contact', query: { board: 'colleges' } })
    return
  }

  searchQuery.value = contact.college
  router.push({ path: '/contact', query: { board: 'teachers' } })
}

function openFavoriteGroup(group) {
  activeGroupCategory.value = group.categoryId
  openBoard('groups')
}

function openFavoriteExpressService() {
  serviceSection.value = 'express'
  openBoard('services')
}

function openFavoriteUtilityCampus() {
  serviceSection.value = 'utilities'
  openBoard('services')
}

function utilityDetailParts(detail) {
  const separator = detail.indexOf('：')
  if (separator <= 0 || separator > 13) return { label: '', content: detail }

  return {
    label: detail.slice(0, separator),
    content: detail.slice(separator + 1),
  }
}

function goHome() {
  router.push('/')
}

function returnHome() {
  searchQuery.value = ''
  router.push('/contact')
}

function toggleFavorite(contact, type) {
  const favoriteId =
    type === 'express' || type === 'utilities' ? `${type}:${contact.id}` : contact.id
  const next = new Set(favoriteIds.value)
  if (next.has(favoriteId)) next.delete(favoriteId)
  else next.add(favoriteId)

  try {
    localStorage.setItem('scutwiki-contact-favorites', JSON.stringify([...next]))
    favoriteIds.value = next
    storageError.value = ''
    notice.value = next.has(favoriteId) ? '已加入收藏。' : '已取消收藏。'
  } catch {
    storageError.value = '保存收藏失败，请检查浏览器存储权限后重试。'
  }
}

function copyWithFallback(value) {
  const input = document.createElement('textarea')
  input.value = String(value)
  input.setAttribute('readonly', '')
  input.style.position = 'fixed'
  input.style.top = '-1000px'
  document.body.appendChild(input)
  input.select()

  const copied = document.execCommand('copy')
  input.remove()
  return copied
}

async function copyText(value, label) {
  if (!value) return
  try {
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(String(value))
      } catch {
        if (!copyWithFallback(value)) throw new Error('浏览器拒绝剪贴板访问')
      }
    } else if (!copyWithFallback(value)) {
      throw new Error('浏览器不支持剪贴板访问')
    }

    notice.value = `${label}已复制。`
    storageError.value = ''
  } catch {
    notice.value = ''
    storageError.value = `复制${label}失败，请检查浏览器剪贴板权限。`
  }
}

const officialSource = facultyDirectorySource
</script>

<template>
  <Title />
  <div class="contact-page">
    <button class="home-button" type="button" @click="goHome">
      <span aria-hidden="true">←</span>
      返回首页
    </button>
    <header class="page-heading">
      <div>
        <p class="eyebrow">SCUT WIKI · CONTACT</p>
        <h1>联系模块</h1>
        <p class="intro">查找校园公开联系信息与生活服务指南。</p>
      </div>
      <button class="favorite-entry" type="button" @click="openFavorites">
        <span aria-hidden="true">★</span>
        我的收藏
      </button>
    </header>

    <p v-if="storageError" class="message error" role="alert">{{ storageError }}</p>
    <p v-else-if="notice" class="message success" role="status">{{ notice }}</p>

    <template v-if="!activeBoard && !isFavorites">
      <section class="board-grid" aria-label="联系模块分类">
        <button
          v-for="board in boards"
          :key="board.id"
          class="board-card"
          type="button"
          @click="openBoard(board.id)"
        >
          <span class="board-icon" aria-hidden="true">{{ board.icon }}</span>
          <span class="board-title">{{ board.title }}</span>
          <span class="board-description">{{ board.description }}</span>
          <span class="board-action">进入板块 <span aria-hidden="true">→</span></span>
        </button>
      </section>
      <p class="source-note">
        联系信息仅展示已提供或可核验的资料；尚未核实的内容会明确标记为待补充。
      </p>
    </template>

    <template v-else>
      <div class="toolbar">
        <button class="back-button" type="button" @click="returnHome">
          <span aria-hidden="true">←</span> 联系模块首页
        </button>
        <h2>{{ isFavorites ? '我的收藏' : activeBoard?.title }}</h2>
      </div>

      <section v-if="isFavorites" class="content-section">
        <div v-if="hasFavorites">
          <h3 v-if="favoriteContacts.length" class="subheading">联系人</h3>
          <div v-if="favoriteContacts.length" class="contact-grid">
            <ContactCard
              v-for="contact in favoriteContacts"
              :key="contact.id"
              :contact="contact"
              :favorited="true"
              @toggle-favorite="toggleFavorite"
              @copy="copyText"
            >
              <template #footer>
                <button class="text-action" type="button" @click="openFavoriteContact(contact)">
                  查看所属分类
                </button>
              </template>
            </ContactCard>
          </div>
          <h3 v-if="favoriteGroups.length" class="subheading">QQ群</h3>
          <div v-if="favoriteGroups.length" class="group-grid favorites-groups">
            <article v-for="group in favoriteGroups" :key="group.id" class="group-card">
              <span class="group-icon" aria-hidden="true">群</span>
              <div class="group-info">
                <h3>{{ group.name }}</h3>
                <p>{{ group.category }} · QQ群号：<strong>{{ group.number }}</strong></p>
              </div>
              <button
                class="favorite-toggle"
                type="button"
                :aria-label="`取消收藏${group.name} ${group.number}`"
                @click="toggleFavorite(group, 'group')"
              >★</button>
              <button class="primary-button" type="button" @click="copyText(group.number, 'QQ群号')">
                复制群号
              </button>
              <button class="text-action" type="button" @click="openFavoriteGroup(group)">
                查看所属分类
              </button>
            </article>
          </div>
          <h3 v-if="favoriteExpressServices.length" class="subheading">快递服务</h3>
          <div v-if="favoriteExpressServices.length" class="campus-grid favorites-services">
            <article
              v-for="service in favoriteExpressServices"
              :key="service.id"
              class="info-card"
            >
              <div class="info-card-heading">
                <h3>{{ service.campus }}快递服务</h3>
                <button
                  class="favorite-toggle"
                  type="button"
                  :aria-label="`取消收藏${service.campus}快递服务`"
                  :aria-pressed="true"
                  @click="toggleFavorite(service, 'express')"
                >★</button>
              </div>
              <ul>
                <li v-for="place in service.locations" :key="place">{{ place }}</li>
              </ul>
              <p class="source-note">{{ service.validity }}</p>
              <button class="text-action" type="button" @click="openFavoriteExpressService">
                查看快递服务
              </button>
            </article>
          </div>
          <h3 v-if="favoriteUtilityCampuses.length" class="subheading">水电指南</h3>
          <div v-if="favoriteUtilityCampuses.length" class="campus-grid favorites-services utility-guide-grid">
            <article
              v-for="campus in favoriteUtilityCampuses"
              :key="campus.id"
              class="info-card service-card utility-guide-card"
            >
              <div class="info-card-heading">
                <h3>{{ campus.campus }}水电指南</h3>
                <button
                  class="favorite-toggle"
                  type="button"
                  :aria-label="`取消收藏${campus.campus}水电指南`"
                  :aria-pressed="true"
                  @click="toggleFavorite(campus, 'utilities')"
                >★</button>
              </div>
              <section v-for="service in campus.services" :key="service.id" class="details-row utility-service">
                <h4>{{ service.title }}</h4>
                <p
                  v-for="(detail, index) in service.details.map(utilityDetailParts)"
                  :key="index"
                  class="utility-detail"
                >
                  <strong v-if="detail.label" class="utility-detail-label">{{ detail.label }}：</strong>
                  {{ detail.content }}
                </p>
                <div v-if="service.actions?.length" class="action-list">
                  <template v-for="action in service.actions" :key="action.label">
                    <a
                      v-if="action.href"
                      :href="action.href"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {{ action.label }} ↗
                    </a>
                    <span v-else>{{ action.label }}</span>
                  </template>
                </div>
              </section>
              <p class="source-note">{{ campus.validity }}</p>
              <button class="text-action" type="button" @click="openFavoriteUtilityCampus">
                查看完整指南
              </button>
            </article>
          </div>
        </div>
        <div v-else class="empty-state">
          <span class="empty-icon" aria-hidden="true">☆</span>
          <h3>还没有收藏内容</h3>
          <p>在联系人卡片上点击星号，即可在这里查看收藏。</p>
        </div>
      </section>

      <section v-else-if="activeBoard?.id === 'teachers'" class="content-section">
        <p class="section-intro">
          教师目录来源：
          <a :href="officialSource" target="_blank" rel="noopener noreferrer">华南理工大学教师主页</a>。
          当前按官方院系列出分类；教师联系方式须逐条核验后再展示。
        </p>
        <div class="notice-banner historical">
          <strong>教师资料待补充</strong>
          <span>当前尚无通过官方资料核验的教师个人记录；不展示虚构姓名或联系方式。</span>
        </div>
        <label class="search-field">
          <span class="sr-only">搜索教师或学院</span>
          <span aria-hidden="true">⌕</span>
          <input v-model="searchQuery" type="search" placeholder="搜索教师姓名、学院或研究方向" />
        </label>

        <div v-if="filteredTeachers.length" class="contact-grid">
          <ContactCard
            v-for="teacher in filteredTeachers"
            :key="teacher.id"
            :contact="teacher"
            :favorited="favoriteIds.has(teacher.id)"
            @toggle-favorite="toggleFavorite"
            @copy="copyText"
          />
        </div>
        <div v-else-if="normalizedSearch" class="empty-state compact">
          <h3>{{ filteredColleges.length ? '没有找到匹配的教师' : '没有找到匹配的教师或学院' }}</h3>
          <p>
            {{
              filteredColleges.length
                ? '下方显示匹配的学院目录；教师个人资料仍待补充。'
                : '试试其他姓名、学院或研究方向。'
            }}
          </p>
        </div>

        <h3 class="subheading">学院目录与资料状态</h3>
        <div v-if="filteredColleges.length" class="college-grid">
          <article v-for="college in filteredColleges" :key="college.id" class="info-card">
            <div class="info-card-heading">
              <h4>{{ college.college }}</h4>
              <span class="status-pill">教师资料待补充</span>
            </div>
            <p>校区：{{ college.campus }}</p>
            <p>教师公开联系方式待核验。</p>
            <a :href="college.source" target="_blank" rel="noopener noreferrer">查看官方教师目录 ↗</a>
            <button class="copy-inline" type="button" @click="copyText(college.source, '来源网址')">复制来源网址</button>
          </article>
        </div>
        <div v-else-if="!normalizedSearch" class="empty-state compact">
          <h3>没有找到匹配的学院</h3>
          <p>请检查搜索关键词。</p>
        </div>
        <p class="source-note">
          教师资料按官方名录展示顺序补录，每学院最多五位；未核实姓名及联系方式前不会展示个人信息。
        </p>
      </section>

      <section v-else-if="activeBoard?.id === 'groups'" class="content-section">
        <div class="segment-control" aria-label="交流群分类">
          <button
            v-for="category in groupCategories"
            :key="category.id"
            type="button"
            :class="{ selected: activeGroupCategory === category.id }"
            :aria-pressed="activeGroupCategory === category.id"
            @click="activeGroupCategory = category.id"
          >
            {{ category.label }}
          </button>
        </div>
        <label class="search-field">
          <span class="sr-only">搜索交流群</span>
          <span aria-hidden="true">⌕</span>
          <input v-model="searchQuery" type="search" placeholder="搜索群名称或QQ群号" />
        </label>
        <div v-if="currentGroups.length" class="group-grid">
          <article v-for="group in currentGroups" :key="group.id" class="group-card">
            <span class="group-icon" aria-hidden="true">群</span>
            <div class="group-info">
              <h3>{{ group.name }}</h3>
              <p>QQ群号：<strong>{{ group.number }}</strong></p>
            </div>
            <button
              class="favorite-toggle"
              type="button"
              :aria-label="favoriteIds.has(group.id) ? `取消收藏${group.name} ${group.number}` : `收藏${group.name} ${group.number}`"
              :aria-pressed="favoriteIds.has(group.id)"
              @click="toggleFavorite(group, 'group')"
            >
              {{ favoriteIds.has(group.id) ? '★' : '☆' }}
            </button>
            <button class="primary-button" type="button" @click="copyText(group.number, 'QQ群号')">
              复制群号
            </button>
          </article>
        </div>
        <div v-else class="empty-state">
          <span class="empty-icon" aria-hidden="true">＋</span>
          <h3>
            {{
              normalizedSearch
                ? '没有找到匹配的交流群'
                : `${groupCategories.find((category) => category.id === activeGroupCategory)?.label}待补充`
            }}
          </h3>
          <p>{{ normalizedSearch ? '请尝试其他群名称或群号。' : '目前没有已核实并公开的群号。' }}</p>
        </div>
      </section>

      <section v-else-if="activeBoard?.id === 'colleges'" class="content-section">
        <div class="segment-control" aria-label="学院与辅导员分类">
          <button
            type="button"
            :class="{ selected: collegeSection === 'colleges' }"
            :aria-pressed="collegeSection === 'colleges'"
            @click="collegeSection = 'colleges'; searchQuery = ''"
          >
            学院官方联系方式
          </button>
          <button
            type="button"
            :class="{ selected: collegeSection === 'counselors' }"
            :aria-pressed="collegeSection === 'counselors'"
            @click="collegeSection = 'counselors'; searchQuery = ''"
          >
            新生辅导员
          </button>
        </div>
        <label class="search-field">
          <span class="sr-only">搜索学院或辅导员</span>
          <span aria-hidden="true">⌕</span>
          <input
            v-model="searchQuery"
            type="search"
            :placeholder="collegeSection === 'colleges' ? '搜索学院名称' : '搜索学院、辅导员姓名或邮箱'"
          />
        </label>

        <template v-if="collegeSection === 'colleges'">
          <div class="campus-select" aria-label="选择校区">
            <button
              v-for="campus in ['全部校区', ...collegeContactCampuses.map((item) => item.campus)]"
              :key="campus"
              type="button"
              :class="{ selected: selectedCampus === campus }"
              :aria-pressed="selectedCampus === campus"
              @click="selectedCampus = campus"
            >
              {{ campus }}
            </button>
          </div>
          <div class="campus-grid">
            <article v-for="campus in visibleCollegeContacts" :key="campus.campus" class="info-card campus-card">
              <div class="info-card-heading">
                <h3>{{ campus.campus }}</h3>
                <span class="status-pill">截图资料待核验</span>
              </div>
              <template v-if="campus.colleges.length">
                <div v-for="college in campus.colleges" :key="college.id" class="details-row">
                    <div class="college-row-heading">
                      <h4>{{ college.college }}</h4>
                      <span class="status-pill">
                        {{
                          college.qqGroups.length && college.website
                            ? '已录入，待核验'
                            : '已录入，部分字段暂无公开信息，待核验'
                        }}
                      </span>
                      <button
                        class="favorite-toggle"
                        type="button"
                        :aria-label="favoriteIds.has(college.id) ? `取消收藏${college.college}` : `收藏${college.college}`"
                        :aria-pressed="favoriteIds.has(college.id)"
                        @click="toggleFavorite(college, 'college')"
                      >
                        {{ favoriteIds.has(college.id) ? '★' : '☆' }}
                      </button>
                    </div>
                  <p>
                    咨询电话：
                    <template v-if="college.phones.length">
                      <span v-for="phone in college.phones" :key="phone" class="inline-contact">
                        <a :href="`tel:${phone}`">{{ phone }}</a>
                        <button class="copy-inline" type="button" @click="copyText(phone, '电话号码')">复制</button>
                      </span>
                    </template>
                    <span v-else>暂无公开信息</span>
                  </p>
                  <p>
                    咨询QQ群：
                    <template v-if="college.qqGroups.length">
                      <span v-for="group in college.qqGroups" :key="group" class="inline-contact">
                        {{ group }}
                        <button class="copy-inline" type="button" @click="copyText(group, 'QQ群号')">复制</button>
                      </span>
                    </template>
                    <span v-else>暂无公开信息</span>
                  </p>
                  <p v-if="college.website">
                    官方网站：
                    <a :href="college.website" target="_blank" rel="noopener noreferrer">{{ college.website }}</a>
                    <button class="copy-inline" type="button" @click="copyText(college.website, '网址')">复制</button>
                  </p>
                  <p v-else>官方网站：暂无公开信息</p>
                </div>
              </template>
              <p v-else>该校区学院资料待补充。</p>
              <p class="source-note">{{ campus.source }}</p>
            </article>
          </div>
          <div v-if="!visibleCollegeContacts.length" class="empty-state compact">
            <h3>没有找到匹配的学院</h3>
            <p>请检查搜索关键词或校区筛选。</p>
          </div>
        </template>

        <template v-else>
          <div v-if="filteredCounselors.length" class="contact-grid">
            <ContactCard
              v-for="counselor in filteredCounselors"
              :key="counselor.id"
              :contact="counselor"
              :favorited="favoriteIds.has(counselor.id)"
              @toggle-favorite="toggleFavorite"
              @copy="copyText"
            />
          </div>
          <div v-else class="empty-state">
            <span class="empty-icon" aria-hidden="true">…</span>
            <h3>{{ normalizedSearch ? '没有找到匹配的辅导员' : '辅导员资料待补充' }}</h3>
            <p>
              {{
                normalizedSearch
                  ? '请更换搜索关键词。'
                  : '已提供资料链接，但当前无法读取；需根据辅导员联系方式图片核对后整理。'
              }}
            </p>
            <a v-if="!normalizedSearch" :href="counselorSourceUrl" target="_blank" rel="noopener noreferrer">
              打开辅导员资料来源 ↗
            </a>
            <button
              v-if="!normalizedSearch"
              class="copy-inline"
              type="button"
              @click="copyText(counselorSourceUrl, '来源网址')"
            >
              复制来源网址
            </button>
          </div>
          <p class="source-note">{{ counselorSource }}</p>
        </template>
      </section>

      <section v-else-if="activeBoard?.id === 'services'" class="content-section">
        <div class="segment-control" aria-label="校园生活服务分类">
          <button
            type="button"
            :class="{ selected: serviceSection === 'express' }"
            :aria-pressed="serviceSection === 'express'"
            @click="serviceSection = 'express'"
          >
            快递运输
          </button>
          <button
            type="button"
            :class="{ selected: serviceSection === 'utilities' }"
            :aria-pressed="serviceSection === 'utilities'"
            @click="serviceSection = 'utilities'"
          >
            水电缴费
          </button>
        </div>

        <template v-if="serviceSection === 'express'">
          <h3 class="subheading">日常快递服务</h3>
          <div class="campus-grid">
            <article v-for="service in expressServices" :key="service.campus" class="info-card">
              <div class="info-card-heading">
                <h4>{{ service.campus }}</h4>
                <button
                  class="favorite-toggle"
                  type="button"
                  :aria-label="favoriteIds.has(`express:${service.id}`) ? `取消收藏${service.campus}快递服务` : `收藏${service.campus}快递服务`"
                  :aria-pressed="favoriteIds.has(`express:${service.id}`)"
                  @click="toggleFavorite(service, 'express')"
                >
                  {{ favoriteIds.has(`express:${service.id}`) ? '★' : '☆' }}
                </button>
              </div>
              <ul>
                <li v-for="place in service.locations" :key="place">{{ place }}</li>
              </ul>
            </article>
          </div>

          <div class="notice-banner">
            <strong>毕业季历史通知 · 活动时间已结束</strong>
            <span>以下仅供查阅2026届毕业季历史安排，目前不可据此办理托运；不属于全年固定营业时间。</span>
          </div>
          <div class="campus-grid">
            <article v-for="campus in graduationShipping" :key="campus.campus" class="info-card service-card">
              <div class="info-card-heading">
                <h3>{{ campus.campus }}</h3>
                <span class="status-pill seasonal">历史安排 · 已结束</span>
              </div>
              <p><strong>托运地点：</strong>{{ campus.locations.join('、') }}</p>
              <p><strong>托运时间：</strong>{{ campus.time }}</p>
              <ul v-if="campus.providers.length">
                <li v-for="provider in campus.providers" :key="provider.contact + provider.phone">
                  {{ provider.company }}：{{ provider.contact }} ·
                  <a :href="`tel:${provider.phone}`">{{ provider.phone }}</a>
                  <button class="copy-inline" type="button" @click="copyText(provider.phone, '电话号码')">复制</button>
                </li>
              </ul>
              <ul v-else>
                <li v-for="provider in campus.providersWithPhones" :key="provider.company">
                  {{ provider.company }}：<a :href="`tel:${provider.phone}`">{{ provider.phone }}</a>
                  <button class="copy-inline" type="button" @click="copyText(provider.phone, '电话号码')">复制</button>
                </li>
              </ul>
              <p class="source-note">{{ campus.contactDisclosureStatus }}</p>
              <div class="safety-notes">
                <strong>行李安全注意事项</strong>
                <p>{{ campus.safetyNotes || '原通知中的注意事项待原文核实，暂不补写。' }}</p>
              </div>
              <p class="source-note">
                {{ campus.source }}
                <a :href="campus.sourceUrl" target="_blank" rel="noopener noreferrer">查看原通知 ↗</a>
                <button class="copy-inline" type="button" @click="copyText(campus.sourceUrl, '来源网址')">复制来源网址</button>
              </p>
            </article>
          </div>
        </template>

        <template v-else>
          <p class="section-intro">
            {{ utilitySource }}
            <a :href="utilitySourceUrl" target="_blank" rel="noopener noreferrer">查看原文 ↗</a>
            <button class="copy-inline" type="button" @click="copyText(utilitySourceUrl, '来源网址')">复制原文链接</button>
          </p>
          <div class="campus-grid utility-guide-grid">
            <article
              v-for="campus in utilityCampuses"
              :key="campus.campus"
              class="info-card service-card utility-guide-card"
            >
              <div class="info-card-heading">
                <h3>{{ campus.campus }}</h3>
                <button
                  class="favorite-toggle"
                  type="button"
                  :aria-label="favoriteIds.has(`utilities:${campus.id}`) ? `取消收藏${campus.campus}水电指南` : `收藏${campus.campus}水电指南`"
                  :aria-pressed="favoriteIds.has(`utilities:${campus.id}`)"
                  @click="toggleFavorite(campus, 'utilities')"
                >
                  {{ favoriteIds.has(`utilities:${campus.id}`) ? '★' : '☆' }}
                </button>
              </div>
              <section v-for="service in campus.services" :key="service.title" class="details-row utility-service">
                <h4>{{ service.title }}</h4>
                <p
                  v-for="(detail, index) in service.details.map(utilityDetailParts)"
                  :key="index"
                  class="utility-detail"
                >
                  <strong v-if="detail.label" class="utility-detail-label">{{ detail.label }}：</strong>
                  {{ detail.content }}
                </p>
                <div v-if="service.actions?.length" class="action-list">
                  <template v-for="action in service.actions" :key="action.label">
                    <a
                      v-if="action.href"
                      :href="action.href"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {{ action.label }} ↗
                    </a>
                    <span v-else>{{ action.label }}</span>
                  </template>
                </div>
              </section>
              <p class="source-note">{{ campus.validity }}</p>
            </article>
          </div>
          <aside
            v-for="contact in utilitySupportContacts"
            :key="contact.id"
            class="notice-banner historical"
          >
            <strong>后勤服务电话（{{ contact.campus }}）</strong>
            <span>
              <a :href="`tel:${contact.phone}`">{{ contact.phone }}</a>
              <button class="copy-inline" type="button" @click="copyText(contact.phone, '电话号码')">复制</button>
            </span>
            <span>{{ contact.validity }}</span>
            <span>{{ contact.source }}</span>
          </aside>
          <aside class="notice-banner historical">
            <strong>历史通知说明</strong>
            <span>{{ utilityHistoricalNotice }}</span>
          </aside>
        </template>
      </section>
    </template>
  </div>
</template>

<style scoped>
.contact-page {
  --accent: hsla(160, 100%, 37%, 1);
  max-width: 1100px;
  margin: 0 auto 3rem;
  color: var(--color-text);
}

.page-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 1.5rem;
  margin: 0.5rem 0 2rem;
}

.eyebrow {
  margin-bottom: 0.35rem;
  color: var(--accent);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.12em;
}

h1,
h2,
h3,
h4 {
  color: var(--color-heading);
}

h1 {
  font-size: clamp(1.7rem, 4vw, 2.25rem);
  font-weight: 700;
}

.intro,
.section-intro {
  margin-top: 0.45rem;
  color: var(--color-text);
  opacity: 0.78;
  line-height: 1.75;
}

.favorite-entry,
.home-button,
.back-button,
.primary-button,
.text-action,
.copy-inline {
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-background);
  color: var(--color-heading);
  font: inherit;
  cursor: pointer;
  transition: border-color 0.2s, color 0.2s, background 0.2s;
}

.action-list {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  margin-top: 0.75rem;
  color: var(--color-text);
  font-size: 0.9rem;
}

.action-list span {
  padding-left: 0.75rem;
  border-left: 2px solid var(--color-border);
}

.favorite-entry {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 0.9rem;
  white-space: nowrap;
}

.home-button {
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  gap: 0.45rem;
  margin-bottom: 0.75rem;
  padding: 0.55rem 0.85rem;
}

.favorite-entry span {
  color: #d3a62d;
}

.home-button:hover,
.favorite-entry:hover,
.back-button:hover,
.text-action:hover,
.copy-inline:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.home-button:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.home-button:active {
  background: color-mix(in srgb, var(--accent) 10%, var(--color-background));
  transform: translateY(1px);
}

.board-grid,
.contact-grid,
.college-grid,
.campus-grid,
.group-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.board-card,
.info-card,
.group-card {
  min-width: 0;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-background);
  box-shadow: 0 4px 16px rgba(20, 40, 35, 0.035);
}

.board-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-height: 220px;
  padding: 1.35rem;
  text-align: left;
  font: inherit;
  cursor: pointer;
  transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s;
}

.board-card:hover {
  transform: translateY(-2px);
  border-color: var(--accent);
  box-shadow: 0 8px 22px rgba(20, 40, 35, 0.08);
}

.board-icon,
.group-icon {
  display: grid;
  width: 2.7rem;
  height: 2.7rem;
  place-items: center;
  border-radius: 10px;
  background: color-mix(in srgb, var(--accent) 10%, var(--color-background));
  color: var(--accent);
  font-size: 1.15rem;
  font-weight: 700;
}

.board-title {
  margin-top: 1.2rem;
  color: var(--color-heading);
  font-size: 1.1rem;
  font-weight: 650;
}

.board-description {
  margin-top: 0.5rem;
  color: var(--color-text);
  opacity: 0.75;
  line-height: 1.65;
}

.board-action {
  margin-top: auto;
  padding-top: 1rem;
  color: var(--accent);
  font-size: 0.9rem;
  font-weight: 600;
}

.source-note {
  margin-top: 1rem;
  color: var(--color-text);
  font-size: 0.85rem;
  line-height: 1.7;
  opacity: 0.68;
}

.toolbar {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 1rem;
  margin: 0.5rem 0 1.5rem;
}

.toolbar h2 {
  font-size: 1.45rem;
  font-weight: 650;
}

.back-button {
  padding: 0.5rem 0.75rem;
  white-space: nowrap;
}

.content-section {
  min-width: 0;
}

.search-field {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  width: 100%;
  max-width: 560px;
  margin: 1.15rem 0;
  padding: 0 0.85rem;
  border: 1px solid var(--color-border);
  border-radius: 9px;
  color: var(--color-text);
}

.search-field:focus-within {
  border-color: var(--accent);
}

.search-field > span:not(.sr-only) {
  font-size: 1.35rem;
  opacity: 0.6;
}

.search-field input {
  width: 100%;
  min-height: 2.75rem;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--color-text);
  font: inherit;
}

.segment-control,
.campus-select {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  margin: 0.5rem 0 1rem;
}

.segment-control button,
.campus-select button {
  padding: 0.5rem 0.8rem;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: transparent;
  color: var(--color-text);
  font: inherit;
  cursor: pointer;
}

.segment-control button.selected,
.campus-select button.selected {
  border-color: var(--accent);
  background: color-mix(in srgb, var(--accent) 10%, var(--color-background));
  color: var(--accent);
}

.subheading {
  margin: 1.8rem 0 0.8rem;
  font-size: 1.1rem;
  font-weight: 650;
}

.info-card {
  padding: 1.15rem;
  line-height: 1.75;
}

.utility-guide-grid {
  gap: 0.8rem;
}

.utility-guide-card {
  padding: clamp(0.9rem, 1.6vw, 1.15rem);
}

.utility-guide-card > .info-card-heading h3 {
  min-width: 0;
  font-size: 1.2rem;
  line-height: 1.4;
  overflow-wrap: anywhere;
}

.info-card h3,
.info-card h4,
.group-card h3 {
  font-weight: 650;
}

.info-card p,
.info-card li {
  margin-top: 0.4rem;
  line-height: 1.7;
  overflow-wrap: anywhere;
}

.info-card a,
.section-intro a,
.group-card a {
  color: var(--accent);
  text-decoration: underline;
  text-underline-offset: 0.16em;
}

.info-card ul {
  margin: 0.55rem 0 0;
  padding-left: 1.2rem;
}

.info-card-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.6rem;
}

.status-pill {
  flex-shrink: 0;
  padding: 0.16rem 0.48rem;
  border-radius: 999px;
  background: var(--color-background-mute);
  color: var(--color-text);
  font-size: 0.74rem;
}

.status-pill.seasonal {
  background: #fff4dc;
  color: #815c12;
}

.group-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.15rem;
}

.group-info {
  flex: 1;
  min-width: 0;
}

.group-info p {
  margin-top: 0.35rem;
  opacity: 0.8;
}

.favorite-toggle {
  border: 0;
  background: transparent;
  color: #d3a62d;
  font-size: 1.3rem;
  cursor: pointer;
}

.inline-contact {
  display: inline-flex;
  align-items: baseline;
  gap: 0.15rem;
  margin-right: 0.45rem;
}

.favorites-groups {
  margin-top: 1rem;
}

.primary-button {
  padding: 0.55rem 0.8rem;
  border-color: var(--accent);
  background: var(--accent);
  color: white;
  white-space: nowrap;
}

.primary-button:hover {
  background: color-mix(in srgb, var(--accent) 85%, black);
  color: white;
}

.details-row {
  margin-top: 1rem;
  padding-top: 0.85rem;
  border-top: 1px solid var(--color-border);
}

.utility-service {
  min-width: 0;
  margin-top: 0.85rem;
  padding-top: 0.7rem;
}

.utility-service h4 {
  font-size: 1rem;
  line-height: 1.5;
  overflow-wrap: anywhere;
}

.utility-detail {
  font-size: 0.9375rem;
  line-height: 1.75;
  overflow-wrap: anywhere;
  word-break: normal;
}

.utility-detail-label {
  color: var(--color-heading);
  font-weight: 600;
}

.utility-guide-card .action-list,
.utility-guide-card .action-list span {
  min-width: 0;
  overflow-wrap: anywhere;
  word-break: normal;
}

.college-row-heading {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.5rem;
}

.college-row-heading h4 {
  flex: 1 1 12rem;
  min-width: 0;
  overflow-wrap: anywhere;
}

.college-row-heading .status-pill {
  flex: 0 1 auto;
  max-width: 100%;
  white-space: normal;
  line-height: 1.4;
  overflow-wrap: anywhere;
}

.college-row-heading .favorite-toggle {
  flex-shrink: 0;
  margin-left: auto;
}

.copy-inline {
  margin-left: 0.35rem;
  padding: 0.15rem 0.4rem;
  font-size: 0.8rem;
}

.notice-banner {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin: 1.4rem 0 0.9rem;
  padding: 0.9rem 1rem;
  border-left: 3px solid #d3a62d;
  border-radius: 6px;
  background: color-mix(in srgb, #f3c75e 12%, var(--color-background));
  line-height: 1.65;
}

.notice-banner.historical {
  margin-top: 1rem;
  border-left-color: var(--color-border-hover);
  background: var(--color-background-mute);
}

.safety-notes {
  margin-top: 1rem;
  padding: 0.8rem;
  border-radius: 8px;
  background: var(--color-background-mute);
}

.safety-notes ul {
  margin-top: 0.35rem;
}

.support-phone {
  margin-top: 1rem !important;
  padding-top: 0.8rem;
  border-top: 1px solid var(--color-border);
}

.empty-state {
  display: flex;
  min-height: 220px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  border: 1px dashed var(--color-border);
  border-radius: 12px;
  text-align: center;
}

.empty-state.compact {
  min-height: 140px;
}

.empty-state h3 {
  margin-top: 0.6rem;
  font-weight: 650;
}

.empty-state p {
  margin-top: 0.4rem;
  opacity: 0.72;
}

.empty-icon {
  color: var(--accent);
  font-size: 2rem;
}

.message {
  margin: 0 0 1rem;
  padding: 0.7rem 0.9rem;
  border-radius: 8px;
}

.message.error {
  background: #fff1f0;
  color: #a12622;
}

.message.success {
  background: color-mix(in srgb, var(--accent) 10%, var(--color-background));
  color: var(--accent);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  clip-path: inset(50%);
}

@media (max-width: 700px) {
  .page-heading {
    align-items: flex-start;
    flex-direction: column;
    margin-bottom: 1.25rem;
  }

  .board-grid,
  .contact-grid,
  .college-grid,
  .campus-grid,
  .group-grid {
    grid-template-columns: 1fr;
  }

  .board-card {
    min-height: 190px;
  }

  .toolbar {
    grid-template-columns: 1fr;
    gap: 0.8rem;
  }

  .toolbar h2 {
    grid-row: 1;
  }

  .back-button {
    justify-self: start;
  }

  .group-card {
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .group-card .primary-button {
    margin-left: 3.7rem;
  }
}
</style>
