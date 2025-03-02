import { createMemoryHistory, createRouter } from 'vue-router'

import Chat from '@/pages/chat.vue'
import Discover from '@/pages/discover.vue'
import Setting from '@/pages/setting.vue'
// import AboutView from './AboutView.vue'

const routes = [
  { path: '/', component: Chat },
  { path: '/discover', component: Discover },
  { path: '/setting', component: Setting },
  // { path: '/about', component: AboutView },
]

const router = createRouter({
  history: createMemoryHistory(),
  routes,
})

export default router
