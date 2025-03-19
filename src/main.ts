import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'
import i18n from './i18n'
import './assets/index.css'
import {init} from './lib/init.js'
import './demos/ipc'
// If you want use Node.js, the`nodeIntegration` needs to be enabled in the Main process.
// import './demos/node'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.use(i18n) // 添加 i18n
app.mount('#app').$nextTick(() => {
  postMessage({ payload: 'removeLoading' }, '*')
  init()
})
