export const counselorSourceUrl = 'https://mp.weixin.qq.com/s/JhLgPpBCZ4Jx9KkJEeheLQ'
export const counselorSource =
  '用户提供的图片：《华南理工大学各院（系）2026级本科新生辅导员联系方式》。'
export const counselorDataStatus = {
  source: counselorSource,
  sourceUrl: counselorSourceUrl,
  lastVerified: '2026-11-14',
  validity: '图片标题标明2026级本科新生；不是长期有效的通用联系方式。',
}

export const counselorContactFields = [
  'id',
  'category',
  'college',
  'name',
  'names',
  'officePhone',
  'email',
  'qqGroups',
  'source',
  'sourceUrl',
  'lastVerified',
  'validity',
]

const sourceDetails = {
  source: counselorSource,
  sourceUrl: counselorSourceUrl,
  lastVerified: '2026-11-14',
  validity:
    '适用于2026级本科新生；实际使用前请核实信息是否仍有效。公开授权状态待确认，不代表已确认授权。',
}

function counselor(id, college, name, officePhone, email, qqGroups, names) {
  return {
    id,
    category: 'counselors',
    college,
    name,
    ...(names ? { names } : {}),
    officePhone,
    email,
    qqGroups: qqGroups.map(({ label, number }) => ({ label, number })),
    ...sourceDetails,
  }
}

export const counselors = [
  counselor(
    'counselor-baibuti',
    '百步梯创新学院',
    '陈嘉熙、周俊耀',
    '020-81182784',
    'bbtci@scut.edu.cn',
    [
      { label: '工科试验班（骏璧班）', number: '1029898969' },
      { label: '工科试验班（AI先进技术拔尖班）', number: '247621825' },
      { label: '工科试验班（院士特色班）', number: '1042750021' },
      { label: '工科试验班（理工交叉创新班）', number: '1020814546' },
      { label: '工科试验班（卓越人才班）', number: '1016664262' },
    ],
    ['陈嘉熙', '周俊耀'],
  ),
  counselor('counselor-mechanical-leng', '机械与汽车工程学院', '冷金岩', '020-87111038', 'meljy@scut.edu.cn', [
    { label: '新生QQ群', number: '1043373487' },
  ]),
  counselor('counselor-mechanical-ali', '机械与汽车工程学院', '阿丽莎艾·努尔波拉特', '020-87111038', 'altnay@scut.edu.cn', [
    { label: '新生QQ群', number: '1043373487' },
  ]),
  counselor('counselor-architecture', '建筑学院', '向如玉', '020-87111335', 'xry20251072@scut.edu.cn', [
    { label: '新生QQ群', number: '960421538' },
  ]),
  counselor('counselor-civil', '土木与交通学院', '王嘉麟', '020-87112741', 'onejl@scut.edu.cn', [
    { label: '新生QQ群', number: '1042700581' },
  ]),
  counselor('counselor-electronic-information', '电子与信息学院', '金宇函', '020-87112821', '20261070@scut.edu.cn', [
    { label: '新生QQ群', number: '930562973' },
  ]),
  counselor('counselor-materials', '材料科学与工程学院', '潘祥', '020-81182639', 'panxiang@scut.edu.cn', [
    { label: '新生QQ群', number: '1018153212' },
  ]),
  counselor('counselor-chemistry', '化学与化工学院', '李文俊', '020-87112845', 'liwj0706@scut.edu.cn', [
    { label: '新生QQ群', number: '318571263' },
  ]),
  counselor('counselor-light-industry', '轻工科学与工程学院', '陈昊珊', '020-87113844', 'chenwuchong@scut.edu.cn', [
    { label: '新生QQ群', number: '300290777' },
  ]),
  counselor('counselor-food', '食品科学与工程学院', '崔蓉', '020-87113037', 'cuirong@scut.edu.cn', [
    { label: '新生QQ群', number: '955809007' },
  ]),
  counselor('counselor-mathematics', '数学学院', '陈志勇', '020-87110923', 'czy0105@scut.edu.cn', [
    { label: '新生QQ群', number: '723892148' },
  ]),
  counselor('counselor-physics', '物理与光电学院', '郑沛霖', '020-87114738', 'zhengpeilin@scut.edu.cn', [
    { label: '新生QQ群', number: '958341657' },
  ]),
  counselor('counselor-economics', '经济与金融学院', '蔡婉铭', '020-81182361', 'cwm1126@scut.edu.cn', [
    { label: '新生QQ群', number: '1043461121' },
  ]),
  counselor('counselor-tourism', '旅游管理系', '江鹏', '020-81182911', 'jiangpeng@scut.edu.cn', [
    { label: '新生QQ群', number: '832855008' },
  ]),
  counselor('counselor-ecommerce', '电子商务系', '徐皓伦', '020-81182593', 'xuhalun@scut.edu.cn', [
    { label: '新生QQ群', number: '1043181511' },
  ]),
  counselor('counselor-automation', '自动化科学与工程学院', '韦怡', '020-87111341', 'weiyi2022@scut.edu.cn', [
    { label: '新生QQ群', number: '546286641' },
  ]),
  counselor('counselor-computer', '计算机科学与工程学院', '陈健', '020-81182520', 'chenjian618@scut.edu.cn', [
    { label: '新生QQ群', number: '1046177462' },
  ]),
  counselor('counselor-electric-power', '电力学院', '梁宇', '020-87113233', 'yuliang@scut.edu.cn', [
    { label: '新生QQ群', number: '832392359' },
  ]),
  counselor('counselor-biology', '生物科学与工程学院', '张昊宇', '020-81182335', 'zhy2518@scut.edu.cn', [
    { label: '新生QQ群', number: '1022635726' },
  ]),
  counselor('counselor-environment', '环境与能源学院', '王健', '020-81182710', 'wangj2024@scut.edu.cn', [
    { label: '新生QQ群', number: '143405642' },
  ]),
  counselor('counselor-software', '软件学院', '翁俊鑫', '020-81182696', 'wjxin@scut.edu.cn', [
    { label: '新生QQ群', number: '208347259' },
  ]),
  counselor('counselor-business', '工商管理学院', '吴典泽', '020-87114864', 'wudz@scut.edu.cn', [
    { label: '新生QQ群', number: '1042689554' },
  ]),
  counselor('counselor-public-administration', '公共管理学院', '王景宇', '020-87111411', 'wjy20221085@scut.edu.cn', [
    { label: '新生QQ群', number: '938019983' },
  ]),
  counselor('counselor-foreign-languages', '外国语学院', '祝育培', '020-87110447', '3385056614@qq.com', [
    { label: '新生QQ群', number: '641343743' },
  ]),
  counselor('counselor-law', '法学院', '王礼恒', '020-81182667', 'wangliheng2024@scut.edu.cn', [
    { label: '新生QQ群', number: '538713711' },
  ]),
  counselor('counselor-journalism', '新闻与传播学院', '张佳文', '020-81182906', 'scutzjw0303@scut.edu.cn', [
    { label: '新生QQ群', number: '1041017737' },
  ]),
  counselor('counselor-arts', '艺术学院', '黄振洪', '020-81182393', 'hzhenhong@scut.edu.cn', [
    { label: '新生QQ群', number: '427232205' },
  ]),
  counselor('counselor-sports', '体育学院', '张鹏程', '020-87110046', 'zpc1082@scut.edu.cn', [
    { label: '新生QQ群', number: '906630208' },
  ]),
  counselor('counselor-design', '设计学院', '郭佩狄', '020-81182313', '814370508@scut.edu.cn', [
    { label: '新生QQ群', number: '177314028' },
  ]),
  counselor('counselor-medicine', '医学院', '梁钊源', '020-81182614', 'liangzhaoyuan@scut.edu.cn', [
    { label: '新生QQ群', number: '991446631' },
  ]),
  counselor('counselor-junde', '峻德书院', '黄易', '020-81181693', 'huangyiey@scut.edu.cn', [
    { label: '新生QQ群', number: '114085657' },
  ]),
  counselor('counselor-mingcheng', '铭诚书院', '陈浩强', '020-81181712', 'chq20211062@scut.edu.cn', [
    { label: '新生QQ群', number: '1040675401' },
  ]),
  counselor('counselor-energy', '能源学院', '刘聪', '020-87113233', 'liucong8888@scut.edu.cn', [
    { label: '新生QQ群', number: '1047799671' },
  ]),
]
