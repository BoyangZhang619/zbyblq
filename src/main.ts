import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from '@/app/router'
import { initTheme } from '@/shared/composables/useTheme'
import '@/design/index.css'
import App from './App.vue'

// 挂载前应用主题，避免首屏闪回默认配色
initTheme()

const app = createApp(App)
app.use(createPinia())
app.use(router)

app.mount('#app')
