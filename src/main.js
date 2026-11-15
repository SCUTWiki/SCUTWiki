import './assets/main.css'
import './assets/theme.css'

import { createApp } from 'vue'
import router from './router'
import App from './App.vue'
// 提前应用已保存的主题，避免刷新时闪一下
import './composables/useTheme'

const app = createApp(App)
app.use(router)
app.mount('#app')
