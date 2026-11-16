import { collegeContactCampuses } from './colleges.js'

export const facultyDirectorySource = 'https://faculty.scut.edu.cn/main.htm'
export const facultyDirectoryLastVerified = '2026-11-14'

export const teacherContactFields = [
  'id',
  'college',
  'name',
  'researchDirection',
  'phone',
  'email',
  'profileUrl',
  'sourceUrl',
  'lastVerified',
  'validity',
]

const officialColleges = [
  '机械与汽车工程学院',
  '建筑学院',
  '土木与交通学院',
  '电子与信息学院',
  '材料科学与工程学院',
  '化学与化工学院',
  '轻工科学与工程学院',
  '食品科学与工程学院',
  '数学学院',
  '物理与光电学院',
  '经济与金融学院',
  '旅游管理系',
  '电子商务系',
  '自动化科学与工程学院',
  '计算机科学与工程学院',
  '电力学院',
  '生物科学与工程学院',
  '环境与能源学院',
  '软件学院',
  '工商管理学院（创业教育学院）',
  '公共管理学院',
  '马克思主义学院',
  '外国语学院',
  '法学院（知识产权学院）',
  '新闻与传播学院',
  '艺术学院',
  '体育学院',
  '设计学院',
  '医学院（生命科学研究院）',
  '国际教育学院',
  '峻德书院',
  '铭诚书院',
  '生物医学科学与工程学院',
  '吴贤铭智能工程学院',
  '前沿软物质学院（华南软物质科学与技术高等研究院 先进材料国际化示范学院 自旋科技研究院）',
  '微电子学院',
  '未来技术学院',
  '海洋科学与工程学院',
]

const campusByCollege = new Map(
  collegeContactCampuses.flatMap((campus) =>
    campus.colleges.map((college) => [college.college, { campus: campus.campus, source: campus.source }]),
  ),
)
const campusAliases = new Map([
  ['工商管理学院（创业教育学院）', '工商管理学院'],
  ['医学院（生命科学研究院）', '医学院'],
  ['前沿软物质学院（华南软物质科学与技术高等研究院 先进材料国际化示范学院 自旋科技研究院）', '前沿软物质学院'],
])

const officialDirectory = officialColleges.map((college, index) => {
  const campusInfo = campusByCollege.get(campusAliases.get(college) ?? college)
  return {
    id: `scut-college-${index + 1}`,
    college,
    campus: campusInfo?.campus ?? '待核实',
    source: facultyDirectorySource,
    campusSource: campusInfo?.source ?? null,
    lastVerified: facultyDirectoryLastVerified,
    validity: campusInfo
      ? '院系名称来自官方教师目录；校区归属来自用户提供的学院联系方式截图。'
      : '院系名称来自官方教师目录；校区归属及个人教师资料待核实。',
  }
})

const teacherDirectoryNames = new Set([
  ...officialColleges,
  ...campusAliases.keys(),
  ...campusAliases.values(),
])
const imageOnlyColleges = collegeContactCampuses.flatMap((campus) =>
  campus.colleges
    .filter((college) => !teacherDirectoryNames.has(college.college))
    .map((college) => ({
      id: `scut-college-image-${college.id}`,
      college: college.college,
      campus: campus.campus,
      source: facultyDirectorySource,
      campusSource: campus.source,
      lastVerified: null,
      validity: '学院名称和校区来自用户提供的联系方式截图；教师名录归属待核实。',
    })),
)

export const collegeDirectory = [...officialDirectory, ...imageOnlyColleges]

export const teachers = []
