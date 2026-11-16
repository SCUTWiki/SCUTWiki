export const utilitySourceUrl = 'https://mp.weixin.qq.com/s/J6Vd0t213zQ_6A3-KHyAVg'
export const utilitySource =
  '依据《华工水电费缴纳，新生必看！》整理；原文由“口袋华园”于2025-09-06发布，政策可能调整。'

export const utilityGuideFields = [
  'id',
  'campus',
  'category',
  'title',
  'details',
  'actions',
  'source',
  'lastVerified',
  'validity',
]

export const utilitySupportContacts = [
  {
    id: 'utility-support-87110228',
    phone: '87110228',
    campus: '适用校区待核验',
    source: '该号码此前仅在联系模块页面中统一展示，未找到可确认其适用校区的来源资料。',
    sourceUrl: null,
    lastVerified: null,
    validity: '适用校区待核验；确认前不要据此判断该号码适用于任何特定校区。',
  },
]

const commonSource = {
  source: utilitySource,
  sourceUrl: utilitySourceUrl,
  lastVerified: '2026-11-14',
  validity: '来源文章发表于2025-09-06；缴费政策及操作可能调整，请以学校后勤部门最新通知为准。',
}

export const utilityCampuses = [
  {
    id: 'utilities-wushan',
    campus: '五山校区',
    ...commonSource,
    services: [
      {
        id: 'wushan-electricity',
        category: 'electricity',
        title: '电费（预付费）',
        details: [
          '连接校园网后，进入「华南理工后勤微服务」公众号 → 水电缴费 → 门户认证；系统识别宿舍后按提示充值，来源文章称约3-5分钟到账并有短信提醒。',
          '校园一卡通：进入“华南理工大学”企业号 → 校园一卡通 → 五山校区专属 → 学生宿舍用电。来源文章称当时支持研一至研五、西一、西五、西十等指定楼栋。',
        ],
        actions: [
          { label: '线上充值：华南理工后勤微服务公众号 → 水电缴费', href: null },
          { label: '校园一卡通充值：华南理工大学企业号 → 校园一卡通 → 五山校区专属 → 学生宿舍用电', href: null },
        ],
      },
      {
        id: 'wushan-cold-water',
        category: 'water',
        title: '冷水费',
        details: ['每三个月推送一次账单，采用后付费；来源文章给出的入口为“华南理工后勤微服务”公众号 → 水电费记录。'],
      },
      {
        id: 'wushan-air-conditioning',
        category: 'air-conditioning',
        title: '空调费',
        details: ['西二、西三、西四多联机空调需单独充值，来源文章给出的入口为“华南理工大学”企业号 → 校园一卡通 → 五山校区专属 → 空调缴费；其他宿舍空调费包含在日常用电中。'],
      },
      {
        id: 'wushan-support',
        category: 'support',
        title: '线下水电服务',
        details: ['水电中心位于32号楼西南侧、发电所餐厅旁。'],
      },
    ],
  },
  {
    id: 'utilities-university-town',
    campus: '大学城校区',
    ...commonSource,
    services: [
      {
        id: 'university-town-water-electricity',
        category: 'water-electricity',
        title: '水费与电费',
        details: [
          '水费和电费一起线下缴纳，请携带电卡和水表读数照片。',
          '地点：生活区教师公寓D3栋一楼水电充值中心。',
          '工作时间：周一至周三、周五 9:00-15:30；周四 9:00-11:00、13:40-16:00；节假日不开放。',
        ],
      },
      {
        id: 'university-town-air-conditioning',
        category: 'air-conditioning',
        title: '空调费',
        details: ['通过「华南理工大学」企业号 → 校园一卡通 → 大学城校区专属 → 空调缴费单独充值。'],
      },
    ],
  },
  {
    id: 'utilities-international',
    campus: '广州国际校区',
    ...commonSource,
    services: [
      {
        id: 'international-water-electricity',
        category: 'water-electricity',
        title: '线上水电缴费',
        details: [
          '使用「智慧华园」微信公众号：校园生活 → 校园一卡通 → 国际校区专属。',
          '电费选择“电控缴费”，冷水费选择“冷水水控充值”；按提示核对姓名、学号、楼栋、楼层和房间号。',
        ],
      },
      {
        id: 'international-air-conditioning',
        category: 'air-conditioning',
        title: '空调费',
        details: [
          'D5区域中央空调需单独缴费，线上选择“空调缴费”；A4区域为分体空调，不需要单独缴费。',
        ],
      },
      {
        id: 'international-offline-support',
        category: 'support',
        title: '线下缴费与咨询',
        details: [
          '可使用校园卡在圈存机自助缴费：插卡 → 自助缴费 → 选择冷水、电控或D5空调 → 输入校园卡查询密码并选择房间 → 输入金额确认。',
          '咨询地点：A4d栋、D5b栋一楼水电充值中心。',
        ],
      },
    ],
  },
]

export const utilityHistoricalNotice =
  'A4区域9月3日至10月7日试运行免收费政策未注明年份，仅为历史通知中的临时政策，不可视作当前有效政策。'
