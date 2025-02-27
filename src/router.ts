import { createMemoryHistory, createRouter } from 'vue-router'

import Chat from '@/pages/chat.vue'
import Box from '@/pages/box.vue'
import Setting from '@/pages/setting.vue'
// import AboutView from './AboutView.vue'

const routes = [
  { path: '/', component: Chat },
  { path: '/box', component: Box },
  { path: '/setting', component: Setting },
  // { path: '/about', component: AboutView },
]

const router = createRouter({
  history: createMemoryHistory(),
  routes,
})

export default router
