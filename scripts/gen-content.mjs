/**
 * 扫描 src/content/** 下的 Markdown 词条，生成 src/data/content.json
 *
 * 词条元信息全部来自 front-matter：
 *   title / slug / section / updatedAt / summary / links / files
 *
 * 统计口径：
 *   doc  —— Markdown 词条数量
 *   file —— front-matter 里 files 引用的文件（去重，且必须真实存在）
 *   link —— front-matter 里 links 的外链（去重）
 *
 * 更新时间优先用 front-matter 的 updatedAt，缺省时用 git 提交时间，
 * 再退到文件 mtime。
 *
 * 用法：node scripts/gen-content.mjs（npm run build 前自动执行）
 */
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import { marked } from 'marked'

const ROOT = process.cwd()
const CONTENT_DIR = path.join(ROOT, 'src/content')
const OUT_FILE = path.join(ROOT, 'src/data/content.json')

const BINARY_EXT = new Set([
  'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'ico',
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
  'zip', 'rar', '7z', 'md', 'txt', 'csv', 'mp4', 'webm',
])

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full, out)
    else out.push(full)
  }
  return out
}

function rel(p) {
  return path.relative(ROOT, p).split(path.sep).join('/')
}

function gitTime(relPath) {
  try {
    const out = execSync(`git log -1 --format=%cI -- "${relPath}"`, {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
    if (out) return out
  } catch {
    /* fallthrough */
  }
  try {
    return new Date(fs.statSync(path.join(ROOT, relPath)).mtimeMs).toISOString()
  } catch {
    return null
  }
}

function toISOString(value, fallbackRel) {
  if (value) {
    const d = new Date(value)
    if (!Number.isNaN(d.getTime())) return d.toISOString()
  }
  return gitTime(fallbackRel)
}

function firstHeading(md) {
  const m = md.match(/^#\s+(.+)$/m)
  return m ? m[1].trim() : null
}

function excerptOf(md, max = 80) {
  const text = md
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/^#+\s+/gm, '')
    .replace(/[*_>`~-]/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
  return text.length > max ? text.slice(0, max) + '…' : text
}

const mdFiles = walk(CONTENT_DIR).filter((f) => f.toLowerCase().endsWith('.md'))
const entries = []
const fileRefs = new Map()
const linkRefs = new Map()

for (const abs of mdFiles) {
  const relPath = rel(abs)
  const raw = fs.readFileSync(abs, 'utf8')
  const { data, content } = matter(raw)

  const slug = String(data.slug || path.basename(abs, '.md')).trim()
  const title = String(data.title || firstHeading(content) || slug)
  const section = String(data.section || '未分类')
  const updatedAt = toISOString(data.updatedAt, relPath)

  const links = [...new Set((Array.isArray(data.links) ? data.links : []).map(String))]
  const files = [...new Set((Array.isArray(data.files) ? data.files : []).map(String))]

  for (const file of files) {
    const absFile = path.resolve(ROOT, file)
    if (!fs.existsSync(absFile)) {
      console.warn(`[content] 引用的文件不存在，已跳过：${file}（来自 ${relPath}）`)
      continue
    }
    const prev = fileRefs.get(file)
    // 同一个文件被多篇文章引用时，取最新的那篇的时间
    if (!prev || String(updatedAt || '') > String(prev.updatedAt || '')) {
      fileRefs.set(file, { path: file, from: slug, updatedAt })
    }
  }

  for (const url of links) {
    const prev = linkRefs.get(url)
    if (!prev || String(updatedAt || '') > String(prev.updatedAt || '')) {
      linkRefs.set(url, { url, from: slug, updatedAt })
    }
  }

  entries.push({
    type: 'doc',
    slug,
    title,
    section,
    summary: String(data.summary || excerptOf(content)),
    updatedAt,
    links,
    files,
    path: relPath,
    href: `/wiki/${slug}`,
    html: marked.parse(content, { async: false }),
  })
}

// src/content 下直接放着的二进制附件也算文件
for (const abs of walk(CONTENT_DIR)) {
  const relPath = rel(abs)
  const ext = path.extname(relPath).slice(1).toLowerCase()
  if (!BINARY_EXT.has(ext) || ext === 'md') continue
  if (!fileRefs.has(relPath)) fileRefs.set(relPath, { path: relPath, from: 'content', updatedAt: null })
}

const files = [...fileRefs.values()].map((item) => ({
  type: 'file',
  title: path.basename(item.path),
  path: item.path,
  ext: path.extname(item.path).slice(1).toLowerCase(),
  size: fs.existsSync(path.join(ROOT, item.path)) ? fs.statSync(path.join(ROOT, item.path)).size : 0,
  from: item.from,
  updatedAt: gitTime(item.path) || item.updatedAt || null,
}))

const links = [...linkRefs.values()].map((item) => ({
  type: 'link',
  title: item.url,
  url: item.url,
  host: (() => {
    try {
      return new URL(item.url).hostname.replace(/^www\./, '')
    } catch {
      return ''
    }
  })(),
  path: `content:${item.from}`,
  from: item.from,
  updatedAt: item.updatedAt || null,
}))

const fileTypes = {}
for (const f of files) fileTypes[f.ext] = (fileTypes[f.ext] || 0) + 1

const byTime = (a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || ''))
const sortedEntries = [...entries].sort(byTime)

const payload = {
  generatedAt: new Date().toISOString(),
  counts: { doc: entries.length, file: files.length, link: links.length },
  fileTypes,
  entries: sortedEntries,
  files: files.sort(byTime),
  links: links.sort(byTime),
  recent: [...sortedEntries, ...files, ...links].sort(byTime).slice(0, 10),
}

fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true })
fs.writeFileSync(OUT_FILE, JSON.stringify(payload, null, 2) + '\n', 'utf8')

console.log(
  `[content] docs=${payload.counts.doc} files=${payload.counts.file} links=${payload.counts.link} -> src/data/content.json`,
)
