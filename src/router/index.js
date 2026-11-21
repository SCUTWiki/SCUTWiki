import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import College from '../views/College/WikiHome.vue'
import Faculty from '../views/Faculty/Faculty.vue'
import Club from '../views/Club/Club.vue'
import Opensource from '../views/OpenSource/Opensource.vue'
import Contact from '../views/Contact/Contact.vue'
import More from '../views/More/More.vue'
import About from '../views/aboutUs/About.vue'
import TeamContact from '../views/ContactUs/TeamContact.vue'
import Support from '../views/SupportUs/Support.vue'
import WikiList from '../views/wiki/WikiList.vue'
import WikiEntry from '../views/wiki/WikiEntry.vue'
import FileList from '../views/wiki/FileList.vue'
import LinkList from '../views/wiki/LinkList.vue'

const routes = [
  { path: '/', name: 'home', component: Home },
  { path: '/college', name: 'college', component: College },
  { path: '/faculty', name: 'faculty', component: Faculty },
  { path: '/club', name: 'club', component: Club },
  { path: '/opensource', name: 'opensource', component: Opensource },
  { path: '/contact', name: 'contact', component: Contact },
  { path: '/more', name: 'more', component: More },
  { path: '/about', name: 'about', component: About },
  { path: '/contact-us', name: 'team-contact', component: TeamContact },
  { path: '/support', name: 'support', component: Support },
  { path: '/wiki', name: 'wiki', component: WikiList },
  { path: '/wiki/:slug', name: 'wiki-entry', component: WikiEntry },
  { path: '/files', name: 'files', component: FileList },
  { path: '/links', name: 'links', component: LinkList },
]

export default createRouter({
  history: createWebHistory(),
  routes,
  // 切换页面回到顶部；后退/前进恢复原来的位置；带 #锚点 的交给页面自己处理
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.hash) return false
    return { top: 0 }
  },
})
