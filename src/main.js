import './assets/main.css'
import './assets/theme.css'
import './assets/home.css'
import './assets/transition.css'

import { createApp } from 'vue'
import router from './router'
import App from './App.vue'
// 提前应用已保存的主题，避免刷新时闪一下
import './composables/useTheme'
import { installPageTransition } from './composables/usePageTransition'

const app = createApp(App)
app.use(router)
app.mount('#app')

// 首页跳转时的圆形放大转场
installPageTransition(router)
