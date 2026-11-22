/**
 * 页面级 SEO：标题、描述、Open Graph、canonical、结构化数据
 *
 * 路由切换后更新 <head>；词条页用词条自己的标题和摘要。
 * 站点域名可用 VITE_SITE_URL 覆盖（Netlify 里已配置）。
 */
import content from '../data/content.json'

const SITE_NAME = 'SCUTWiki'
const SITE_URL = (import.meta.env.VITE_SITE_URL || 'https://scutwiki.com').replace(/\/$/, '')
const DEFAULT_DESC = '面向华南理工大学学生的校园百科：报到、选课、绩点、社团、办事流程与生活服务。'

const PAGES = {
  '/': { title: 'SCUTWiki · 华南理工大学校园百科', desc: DEFAULT_DESC },
  '/college': { title: '大学主模块 · SCUTWiki', desc: '校区、课程、成绩与绩点、入学办理等大学阶段的基础信息。' },
  '/faculty': { title: '学院模块 · SCUTWiki', desc: '各学院与导师的公开联系方式与介绍。' },
  '/club': { title: '组织模块 · SCUTWiki', desc: '校级组织、院级组织与社团的介绍和加入方式。' },
  '/opensource': { title: '开源模块 · SCUTWiki', desc: '学生开源项目、工具与脚本。' },
  '/contact': { title: '联系模块 · SCUTWiki', desc: '校园公开联系信息与生活服务指南。' },
  '/more': { title: '其他模块 · SCUTWiki', desc: '箴言、常见风险、杂文等零散内容。' },
  '/about': { title: '关于我们 · SCUTWiki', desc: 'SCUTWiki 是谁在维护、为什么做、怎么参与。' },
  '/contact-us': { title: '联系我们 / 投稿 · SCUTWiki', desc: '投稿、纠错与合作的联系方式。' },
  '/support': { title: '支持 / 赞助我们 · SCUTWiki', desc: '赞助方式与资金用途说明。' },
  '/wiki': { title: '全部词条 · SCUTWiki', desc: '按更新时间排列的全部词条。' },
  '/files': { title: '文件汇总 · SCUTWiki', desc: '词条引用的全部附件。' },
  '/links': { title: '链接汇总 · SCUTWiki', desc: '词条引用的全部外链。' },
}

function setMeta(attr, key, value) {
  if (!value) return
  let el = document.head.querySelector(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', value)
}

function setLink(rel, href) {
  let el = document.head.querySelector(`link[rel="${rel}"]`)
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

function setJsonLd(data) {
  const id = 'scutwiki-jsonld'
  let el = document.getElementById(id)
  if (!data) {
    el?.remove()
    return
  }
  if (!el) {
    el = document.createElement('script')
    el.type = 'application/ld+json'
    el.id = id
    document.head.appendChild(el)
  }
  el.textContent = JSON.stringify(data)
}

function entryOf(route) {
  return (content.entries || []).find((item) => item.slug === route.params.slug)
}

export function installSeo(router) {
  function apply(route) {
    const meta = PAGES[route.path]
    let title = meta?.title || SITE_NAME
    let desc = meta?.desc || DEFAULT_DESC
    let jsonld = null

    if (route.path.startsWith('/wiki/')) {
      const entry = entryOf(route)
      if (entry) {
        title = `${entry.title} · ${SITE_NAME}`
        desc = entry.summary || DEFAULT_DESC
        jsonld = {
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: entry.title,
          description: desc,
          dateModified: entry.updatedAt,
          inLanguage: 'zh-CN',
          mainEntityOfPage: `${SITE_URL}/wiki/${entry.slug}`,
          publisher: { '@type': 'Organization', name: SITE_NAME },
        }
      } else {
        title = `词条不存在 · ${SITE_NAME}`
      }
    } else if (route.path === '/') {
      jsonld = {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: SITE_NAME,
        url: `${SITE_URL}/`,
        description: DEFAULT_DESC,
        inLanguage: 'zh-CN',
      }
    }

    document.title = title
    setMeta('name', 'description', desc)
    setMeta('property', 'og:title', title)
    setMeta('property', 'og:description', desc)
    setMeta('property', 'og:type', route.path.startsWith('/wiki/') ? 'article' : 'website')
    setMeta('property', 'og:url', `${SITE_URL}${route.path}`)
    setMeta('property', 'og:site_name', SITE_NAME)
    setMeta('name', 'twitter:card', 'summary')
    setMeta('name', 'twitter:title', title)
    setMeta('name', 'twitter:description', desc)
    setLink('canonical', `${SITE_URL}${route.path}`)
    setJsonLd(jsonld)
  }

  router.afterEach((to) => apply(to))
  apply(router.currentRoute.value)
}
