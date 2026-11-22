/**
 * SCUTwiki · 大学主模块 · 站点数据（唯一信息架构来源）
 *
 * 首页     #/                  三张卡片 + 完整目录
 * 板块页   #<itemId>           用全局 WikiLayout 的 switch 模式只显示该小节
 *
 * 派生：cards / toc / pageToc(id) / flatSections / findItem / firstItemId / neighbors
 */
export const pages = [
  {
    id: 'campus', label: '校园', icon: '🏫',
    desc: '学校简介 · 校区 · 角落与开放时间 · 入学办理 · App与公众号',
    lead: '进入学校后最先需要的一切：简介、空间、时间、办理与避坑。',
    items: [
      { id: 'campus-intro', label: '学校简介', kind: 'quote',
        hint: 'blockquote 引用学校官网简介 + 官方链接；学校定位、校区数、院系数等。' },
      { id: 'campus-tour', label: '各个校区', kind: '',
        hint: '按校区分卡片：位置、教学楼命名规则、地图、常见找不到教室的提示。' },
      { id: 'campus-corners', label: '校园角落与开放时间', kind: 'table',
        hint: '表格骨架：场所 / 开放时段 / 适用日 / 备注 / 官方链接；时间以官网为准。下面专栏承载专题内容。',
        columns: [
          { id: 'campus-library', label: '专栏 · 图书馆与自习空间',
            hint: '各馆位置与自习区、预约方式；开放时间指向图书馆官网「当期通知」，不写死。' },
        ] },
      { id: 'campus-transit', label: '校区通勤', kind: '',
        hint: '校车时刻、地铁公交换乘；给出后勤/班车官方链接。' },
      { id: 'campus-enroll', label: '入学准备与办理', kind: 'list',
        hint: '报到流程、空调/饮水/校园网办理、材料清单。' },
      { id: 'campus-essentials', label: '必备App与公众号', kind: 'cards',
        hint: '合并清单：必备 APP（课堂/生活/办事）与校园公众号（官方号、校内媒体号），含下载或关注入口。' },
    ],
  },
  {
    id: 'study', label: '学习', icon: '📚',
    desc: '课程 · 成绩绩点 · 考试学习 · 竞赛',
    lead: '课内学业、考试与课外发展。',
    items: [
      { id: 'study-curriculum', label: '课程安排', kind: 'table',
        hint: '课表查询、选课轮次、教室编号规则；表格占位。' },
      { id: 'study-grades', label: '学业成绩与绩点', kind: '',
        hint: '成绩查询、绩点/综测/评优保研规则说明。' },
      { id: 'study-exam', label: '考试学习', kind: 'list',
        hint: '考试周安排 / 复习方法与资料 / 历年题 / 考场规则与缓考补考 / 成绩复核。' },
      { id: 'study-contest', label: '竞赛与证书', kind: '',
        hint: '竞赛资讯、证书考试、实验室/兴趣小组入口。' },
    ],
  },
  {
    id: 'life', label: '生活', icon: '🏠',
    desc: '住宿 · 美食 · 快递 · 周边 · 活动',
    lead: '吃住行与近期动态。',
    items: [
      { id: 'life-dorm', label: '住宿生活', kind: 'list',
        hint: '宿舍配置、环境、缴费、报修。' },
      { id: 'life-food', label: '美食推荐', kind: '',
        hint: '食堂窗口与周边小店。' },
      { id: 'life-delivery', label: '快递与外卖', kind: '',
        hint: '各校区收货地址与驿站位置（易变，建议给模板而非写死）。' },
      { id: 'life-nearby', label: '周边去处', kind: '',
        hint: '商圈、医院、交通与周末去处。' },
      { id: 'life-events', label: '近期活动', kind: 'cards',
        hint: '活动卡片 + 状态筛选；日期推导「报名中/进行中/已结束」。' },
    ],
  },
]

/** 首页三张卡片 = 全部页面 */
export const cards = pages.map(p => ({ id: p.id, label: p.label, icon: p.icon, desc: p.desc }))

/** 首页完整目录 */
export const toc = pages.map(p => ({
  id: p.id, label: p.label,
  children: p.items.map(i => ({ id: i.id, label: i.label })),
}))

export const findPage = id => pages.find(p => p.id === id) || null

/**
 * 板块页目录：扁平一级列表。
 * 全局 WikiLayout 的 groupOf() 把子项归到父项；传「父+子」结构时
 * isolateId 指向父项 id 而正文无该元素 → 判空白屏。扁平后每项自成一组。
 */
export const pageToc = id => {
  const p = findPage(id)
  return p ? p.items.map(i => ({ id: i.id, label: i.label })) : []
}

/** 全局篇序 */
export const flatSections = pages.flatMap(p => p.items.map(i => ({
  id: i.id, label: i.label, pageId: p.id,
})))

/** 按小节 id 找到它及所属页面 */
export const findItem = id => {
  for (const p of pages) {
    const item = p.items.find(i => i.id === id)
    if (item) return { ...item, pageId: p.id }
  }
  return null
}

/** 某页面首个小节（卡片入口用） */
export const firstItemId = id => findPage(id)?.items[0]?.id || ''

/** 上一篇 / 下一篇 */
export const neighbors = id => {
  const i = flatSections.findIndex(s => s.id === id)
  if (i < 0) return { prev: null, next: null }
  return {
    prev: i > 0 ? flatSections[i - 1] : null,
    next: i < flatSections.length - 1 ? flatSections[i + 1] : null,
  }
}

export default { pages, cards, toc, findPage, pageToc, flatSections, findItem, firstItemId, neighbors }