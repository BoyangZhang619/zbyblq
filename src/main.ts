import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from '@/app/router'
import { initTheme } from '@/shared/composables/useTheme'
import { initI18n } from '@/shared/i18n'
import '@/design/index.css'
import App from './App.vue'

// 挂载前应用主题与语言，避免首屏闪回默认配色与文案
initTheme()
initI18n()

const app = createApp(App)
app.use(createPinia())
app.use(router)

app.mount('#app')
