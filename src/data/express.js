const noticeSourceUrl = 'https://mp.weixin.qq.com/s/H3Tz0U8u00lK-SzpCIMbAw'
const noticeSource = '毕业生行李托运资料及2026年份由用户提供；原通知页面暂无法读取。'
const expiredGraduationValidity =
  '2026届毕业季历史安排，活动时间已结束；此信息不能用于当前托运办理。'
const contactDisclosureStatus =
  '原有联系人及电话资料予以保留；公开授权状态待确认，不代表已确认授权。'

export const expressServiceFields = [
  'id',
  'campus',
  'company',
  'contact',
  'phone',
  'locations',
  'time',
  'notes',
  'source',
  'sourceUrl',
  'lastVerified',
  'validity',
]

export const expressServices = [
  {
    id: 'daily-express-university-town',
    campus: '大学城校区',
    locations: ['二饭顺丰快递服务中心', 'E区快递服务中心', 'C10负一层快递取件点'],
    source: '日常快递服务地点由用户提供；具体营业时间及业务范围待核验。',
    sourceUrl: null,
    lastVerified: null,
    validity: '地点信息待核验。',
  },
]

export const graduationShipping = [
  {
    id: 'graduation-shipping-wushan',
    campus: '五山校区',
    locations: ['东八', '西三', '西十', '研五', '北九', '北十二', '北十六', '网院大楼'],
    time: '2026年6月21日至7月1日，10:00-18:00（仅该届毕业季安排）',
    providers: [],
    providersWithPhones: [
      { company: '邮政校园快递服务中心西区', phone: '18620228222' },
      { company: '邮政校园快递服务中心北区', phone: '13430077920' },
    ],
    contactDisclosureStatus,
    safetyNotes: '',
    source: noticeSource,
    sourceUrl: noticeSourceUrl,
    lastVerified: null,
    validity: expiredGraduationValidity,
  },
  {
    id: 'graduation-shipping-university-town',
    campus: '大学城校区',
    locations: ['C8-C9间羽毛球场'],
    time: '2026年毕业季，9:00-18:00（具体日期以原通知为准）',
    providers: [
      { company: '顺丰', contact: '杨仕佳', phone: '18702046611' },
      { company: '邮政', contact: '侯长久', phone: '13418083606' },
      { company: '韵达', contact: '徐文媳', phone: '13226230262' },
      { company: '中通', contact: '黄梓幸', phone: '13360261809' },
      { company: '申通', contact: '陆虎', phone: '13286151707' },
      { company: '京东', contact: '罗文进', phone: '17665015706' },
    ],
    providersWithPhones: [],
    contactDisclosureStatus,
    safetyNotes: '',
    source: noticeSource,
    sourceUrl: noticeSourceUrl,
    lastVerified: null,
    validity: expiredGraduationValidity,
  },
  {
    id: 'graduation-shipping-international',
    campus: '广州国际校区',
    locations: ['D5g邮政收发室', 'F5d菜鸟驿站'],
    time: '2026年毕业季，9:00-19:00（具体日期以原通知为准）',
    providers: [],
    providersWithPhones: [
      { company: 'D5g邮政收发室', phone: '16675015512' },
      { company: 'F5d菜鸟驿站', phone: '17620326093' },
    ],
    contactDisclosureStatus,
    safetyNotes: '',
    source: noticeSource,
    sourceUrl: noticeSourceUrl,
    lastVerified: null,
    validity: expiredGraduationValidity,
  },
]
