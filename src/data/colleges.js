const source = '用户提供的学院联系方式截图（未标注发布日期）。'

function collegeContact(id, campus, college, phones, qqGroups, website) {
  return {
    id,
    campus,
    college,
    phones,
    qqGroups,
    website,
    source,
    lastVerified: null,
    validity: '按用户提供的截图录入，原图发布日期及信息时效未标注。',
  }
}

export const collegeContactCampuses = [
  {
    campus: '五山校区',
    source,
    lastVerified: null,
    validity: '按用户提供的截图录入。',
    colleges: [
      collegeContact('wushan-baibuti', '五山校区', '百步梯创新学院', ['020-81182784'], ['1092061410'], null),
      collegeContact('wushan-mechanical', '五山校区', '机械与汽车工程学院', ['020-87111038', '020-87111039'], ['619539253'], 'http://www2.scut.edu.cn/smae/'),
      collegeContact('wushan-architecture', '五山校区', '建筑学院', ['020-87112365', '020-87111335'], ['716744077'], 'http://www.scut.edu.cn/architecture/'),
      collegeContact('wushan-civil', '五山校区', '土木与交通学院', ['020-87112742'], ['866237213'], 'http://www2.scut.edu.cn/jtxy/'),
      collegeContact('wushan-electric-power', '五山校区', '电力学院', ['020-87111025', '020-87110613'], ['554788696'], 'http://www2.scut.edu.cn/ep/'),
      collegeContact('wushan-energy', '五山校区', '能源学院', ['020-87110877'], ['170857713'], null),
      collegeContact('wushan-electronic-information', '五山校区', '电子与信息学院', ['020-87110163'], ['797642107'], 'http://www.scut.edu.cn/ee/'),
      collegeContact('wushan-automation', '五山校区', '自动化科学与工程学院', ['020-87114612', '020-87114018'], ['532175810'], 'http://www2.scut.edu.cn/automation/'),
      collegeContact('wushan-materials', '五山校区', '材料科学与工程学院', ['020-87111907'], ['772613642'], 'http://www2.scut.edu.cn/materials/'),
      collegeContact('wushan-chemistry', '五山校区', '化学与化工学院', ['020-87113353'], ['740618796'], 'http://www2.scut.edu.cn/ce/'),
      collegeContact('wushan-light-industry', '五山校区', '轻工科学与工程学院', ['020-87113844'], ['1103270671'], 'http://www2.scut.edu.cn/qqkxygc/'),
      collegeContact('wushan-food', '五山校区', '食品科学与工程学院', ['020-87113039'], ['916505810'], 'http://www.scut.edu.cn/sp/'),
      collegeContact('wushan-mathematics', '五山校区', '数学学院', ['020-87110446', '020-87110923'], ['894209123'], 'http://www2.scut.edu.cn/math/'),
      collegeContact('wushan-physics', '五山校区', '物理与光电学院', ['020-87114738'], ['178513510'], 'http://www2.scut.edu.cn/physics/'),
      collegeContact('wushan-business', '五山校区', '工商管理学院', ['020-87112723', '020-87114864'], ['971973924'], 'http://cnsba.scut.edu.cn/'),
      collegeContact('wushan-public-administration', '五山校区', '公共管理学院', ['020-87112996'], ['1094736323'], 'http://www2.scut.edu.cn/spa'),
      collegeContact('wushan-foreign-languages', '五山校区', '外国语学院', ['020-87110447'], ['586640813'], 'http://www2.scut.edu.cn/sfl/'),
      collegeContact('wushan-sports', '五山校区', '体育学院', ['020-87113775'], [], 'http://www2.scut.edu.cn/spe/'),
    ],
  },
  {
    campus: '大学城校区',
    source,
    lastVerified: null,
    validity: '按用户提供的截图录入。',
    colleges: [
      collegeContact('university-town-computer', '大学城校区', '计算机科学与工程学院', ['020-81182588'], ['774082640'], 'http://www2.scut.edu.cn/cs/'),
      collegeContact('university-town-software', '大学城校区', '软件学院', ['020-81182607', '020-81182604'], ['1095586830'], 'http://www2.scut.edu.cn/sse/'),
      collegeContact('university-town-environment', '大学城校区', '环境与能源学院', ['020-81182709'], ['763909331'], 'http://www2.scut.edu.cn/cese/'),
      collegeContact('university-town-biology', '大学城校区', '生物科学与工程学院', ['020-81182333'], ['973402637'], 'http://www2.scut.edu.cn/biology/'),
      collegeContact('university-town-journalism', '大学城校区', '新闻与传播学院', ['020-81182906'], ['793430868'], 'http://www.scut.edu.cn/communication'),
      collegeContact('university-town-design', '大学城校区', '设计学院', ['020-81182304'], ['662611469'], 'http://www2.scut.edu.cn/design/'),
      collegeContact('university-town-law', '大学城校区', '法学院（知识产权学院）', ['020-81182667'], ['588415359'], 'http://www2.scut.edu.cn/law/'),
      collegeContact('university-town-economics', '大学城校区', '经济与金融学院', ['020-81182348'], ['462804564'], 'http://www2.scut.edu.cn/economy/'),
      collegeContact('university-town-ecommerce', '大学城校区', '电子商务系', ['020-81182591'], ['917479202'], 'http://www2.scut.edu.cn/e_business/'),
      collegeContact('university-town-tourism', '大学城校区', '旅游管理系', ['020-81182914'], ['213050079'], 'http://www2.scut.edu.cn/tourism/'),
      collegeContact('university-town-arts', '大学城校区', '艺术学院', ['020-81182338'], ['498197552'], 'http://www2.scut.edu.cn/art/'),
      collegeContact('university-town-medicine', '大学城校区', '医学院', ['020-81182621'], ['630564485'], 'http://www2.scut.edu.cn/med/'),
    ],
  },
  {
    campus: '广州国际校区',
    source,
    lastVerified: null,
    validity: '按用户提供的截图录入。',
    colleges: [
      collegeContact('international-biomedical', '广州国际校区', '生物医学科学与工程学院', ['020-81181695'], ['833788339'], 'http://www2.scut.edu.cn/bmse/'),
      collegeContact('international-wusie', '广州国际校区', '吴贤铭智能工程学院', ['020-81182104'], ['665409902'], 'http://www2.scut.edu.cn/wusie/'),
      collegeContact('international-frontier-soft-matter', '广州国际校区', '前沿软物质学院', ['020-81181707', '020-87111370'], ['374863759'], 'http://www2.scut.edu.cn/sesm/'),
      collegeContact('international-microelectronics', '广州国际校区', '微电子学院', ['020-81181622'], ['615433908'], 'http://www2.scut.edu.cn/microelectronics/'),
      collegeContact('international-future-technology', '广州国际校区', '未来技术学院', ['020-81181683'], ['610079523'], 'http://www2.scut.edu.cn/ft/'),
      collegeContact('international-marine', '广州国际校区', '海洋科学与工程学院', ['020-81182155'], ['702763151'], 'http://www2.scut.edu.cn/marine/'),
    ],
  },
]

export const collegeCampusContactFields = [
  'id',
  'campus',
  'college',
  'phones',
  'qqGroups',
  'website',
  'source',
  'lastVerified',
  'validity',
]
