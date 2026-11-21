/**
 * 扫描仓库内容，生成 src/data/content.json
 *
 * 统计三类内容：
 *   doc  —— src/views 下的 .vue 页面（文档）
 *   file —— src/ 与 public/ 下的附件（图片、pdf、表格等）
 *   link —— 源码里出现的 http(s) 外链（去重）
 *
 * 更新时间取 `git log -1 --format=%cI -- <file>`，
 * 没有 git 记录时退回文件系统 mtime。
 *
 * 用法：node scripts/gen-content.mjs
 * 构建前自动执行（package.json 的 prebuild）。
 */
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const OUT_FILE = path.join(ROOT, 'src/data/content.json')

const FILE_EXT = new Set([
  'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'ico',
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
  'zip', 'rar', '7z', 'md', 'txt', 'csv', 'mp4', 'webm',
])

const SKIP_DIRS = new Set(['node_modules', 'dist', '.git', '.vscode'])

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full, out)
    else out.push(full)
  }
  return out
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
    /* 没有 git 或文件未提交，退回 mtime */
  }
  try {
    return new Date(fs.statSync(path.join(ROOT, relPath)).mtimeMs).toISOString()
  } catch {
    return null
  }
}

function readTitle(relPath, fallback) {
  try {
    const text = fs.readFileSync(path.join(ROOT, relPath), 'utf8')
    const m = text.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)
    if (m) {
      const title = m[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
      if (title) return title
    }
  } catch {
    /* ignore */
  }
  return fallback
}

/** 从 router 中解析 文件 -> 路由路径 */
function routeMap() {
  const routerFile = path.join(ROOT, 'src/router/index.js')
  if (!fs.existsSync(routerFile)) return {}

  const src = fs.readFileSync(routerFile, 'utf8')
  const imports = {}
  for (const m of src.matchAll(/import\s+(\w+)\s+from\s+'([^']+)'/g)) {
    const abs = path.resolve(path.dirname(routerFile), m[2])
    imports[m[1]] = path.relative(ROOT, abs).split(path.sep).join('/')
  }

  const map = {}
  for (const m of src.matchAll(/path:\s*'([^']+)'[\s\S]{0,80}?component:\s*(\w+)/g)) {
    const file = imports[m[2]]
    if (file) map[file] = m[1]
  }
  return map
}

const routes = routeMap()
const allFiles = walk(ROOT).map((f) => path.relative(ROOT, f).split(path.sep).join('/'))

const docs = []
const files = []
const linkSet = new Map()

for (const rel of allFiles) {
  const ext = path.extname(rel).slice(1).toLowerCase()

  if (rel.startsWith('src/views/') && ext === 'vue') {
    const href = routes[rel] || null
    if (!href) continue // 只统计有路由的真正页面
    docs.push({
      type: 'doc',
      title: readTitle(rel, path.basename(rel, '.vue')),
      path: rel,
      href,
      updatedAt: gitTime(rel),
    })
    continue
  }

  if (FILE_EXT.has(ext) && (rel.startsWith('src/') || rel.startsWith('public/'))) {
    if (rel === 'public/favicon.ico') continue
    files.push({
      type: 'file',
      title: path.basename(rel),
      path: rel,
      ext,
      updatedAt: gitTime(rel),
    })
    continue
  }

  // 只扫描源码里的外链
  if (/\.(vue|js|mjs|md)$/.test(rel) && !rel.startsWith('src/data/') && !/\.config\.(js|mjs)$/.test(rel)) {
    let text = ''
    try {
      text = fs.readFileSync(path.join(ROOT, rel), 'utf8')
    } catch {
      continue
    }
    for (const m of text.matchAll(/https?:\/\/[^\s"'<>)]+/g)) {
      const url = m[0].replace(/[.,;:]+$/, '')
      if (url.includes('localhost') || url.includes('127.0.0.1')) continue
      if (!linkSet.has(url)) {
        linkSet.set(url, {
          type: 'link',
          title: url,
          url,
          path: rel,
          updatedAt: gitTime(rel),
        })
      }
    }
  }
}

const links = [...linkSet.values()]
const all = [...docs, ...files, ...links]

const fileTypes = {}
for (const f of files) fileTypes[f.ext] = (fileTypes[f.ext] || 0) + 1

const byTime = (a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || ''))

const payload = {
  generatedAt: new Date().toISOString(),
  counts: { doc: docs.length, file: files.length, link: links.length },
  fileTypes,
  docs: docs.sort(byTime),
  files: files.sort(byTime),
  links: links.sort(byTime),
  recent: all.sort(byTime).slice(0, 10),
}

fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true })
fs.writeFileSync(OUT_FILE, JSON.stringify(payload, null, 2) + '\n', 'utf8')

console.log(
  `[content] docs=${payload.counts.doc} files=${payload.counts.file} links=${payload.counts.link} -> src/data/content.json`,
)
