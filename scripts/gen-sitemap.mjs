/**
 * 生成 public/sitemap.xml（构建前执行）
 * 收录固定页面和全部 Markdown 词条。
 */
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const SITE = (process.env.SITE_URL || process.env.VITE_SITE_URL || 'https://scutwiki.com').replace(/\/$/, '')

const STATIC_ROUTES = [
  '/',
  '/college',
  '/faculty',
  '/club',
  '/opensource',
  '/contact',
  '/more',
  '/wiki',
  '/files',
  '/links',
  '/about',
  '/contact-us',
  '/support',
]

const contentFile = path.join(ROOT, 'src/data/content.json')
const content = fs.existsSync(contentFile)
  ? JSON.parse(fs.readFileSync(contentFile, 'utf8'))
  : { entries: [] }

const today = new Date().toISOString().slice(0, 10)

const urls = [
  ...STATIC_ROUTES.map((route) => ({
    loc: `${SITE}${route === '/' ? '/' : route}`,
    lastmod: today,
    priority: route === '/' ? '1.0' : '0.8',
  })),
  ...(content.entries || []).map((entry) => ({
    loc: `${SITE}/wiki/${entry.slug}`,
    lastmod: String(entry.updatedAt || today).slice(0, 10),
    priority: '0.6',
  })),
]

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (item) => `  <url>
    <loc>${item.loc}</loc>
    <lastmod>${item.lastmod}</lastmod>
    <priority>${item.priority}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>
`

fs.writeFileSync(path.join(ROOT, 'public/sitemap.xml'), xml, 'utf8')
console.log(`[sitemap] ${urls.length} 个地址 -> public/sitemap.xml`)
