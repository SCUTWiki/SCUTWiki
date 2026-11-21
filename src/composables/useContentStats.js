import content from '../data/content.json'

/**
 * 站点内容统计（由 scripts/gen-content.mjs 在构建前生成）
 * counts: { doc, file, link }
 * fileTypes: { png: 2, pdf: 1, ... }
 * recent: 按更新时间倒序的条目
 */
export function useContentStats() {
  return {
    counts: content.counts,
    fileTypes: content.fileTypes,
    recent: content.recent,
    generatedAt: content.generatedAt,
  }
}

const TYPE_LABEL = {
  png: '图片',
  jpg: '图片',
  jpeg: '图片',
  gif: '图片',
  webp: '图片',
  svg: '图片',
  ico: '图标',
  pdf: 'PDF',
  doc: 'Word',
  docx: 'Word',
  xls: '表格',
  xlsx: '表格',
  ppt: '演示',
  pptx: '演示',
  md: 'Markdown',
  txt: '文本',
  csv: 'CSV',
  zip: '压缩包',
  rar: '压缩包',
  '7z': '压缩包',
  mp4: '视频',
  webm: '视频',
}

export function fileTypeSummary(fileTypes) {
  const byLabel = new Map()
  for (const [ext, n] of Object.entries(fileTypes)) {
    const label = TYPE_LABEL[ext] || ext.toUpperCase()
    byLabel.set(label, (byLabel.get(label) || 0) + n)
  }
  return [...byLabel.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([label, n]) => `${label} ${n}`)
    .join(' · ')
}

const TYPE_TEXT = { doc: '页面', file: '文件', link: '链接' }

export function typeLabel(type) {
  return TYPE_TEXT[type] || type
}

export function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
