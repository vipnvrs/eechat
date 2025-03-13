import { createWebHistory, createWebHashHistory, createRouter } from 'vue-router'

import Chat from '@/pages/chat.vue'
import Discover from '@/pages/discover.vue'
import Setting from '@/pages/setting.vue'
// import AboutView from './AboutView.vue'
// electron-google-analytics4
// import Analytics from 'electron-google-analytics4'
// const analytics = new Analytics('G-SX8YF600ZG', 'HM_cyI-lRxCqRAyqx3pv5Q')
// analytics.event('page_view')
import Analytics from 'analytics'
import googleAnalytics from '@analytics/google-analytics'

/* Initialize analytics */
const analytics = Analytics({
  app: 'ee-chat-app-name',
  version: 100,
  plugins: [
    googleAnalytics({
      measurementIds: ['G-SX8YF600ZG'],
    }),
  ],
})

const routes = [
  { path: '/', component: Chat },
  { path: '/discover', component: Discover },
  { path: '/setting', component: Setting },
  // { path: '/about', component: AboutView },
]

// Use hash mode for Electron production builds to avoid path issues
const isElectron = window.navigator.userAgent.includes('Electron');
const router = createRouter({
  history: isElectron ? createWebHashHistory() : createWebHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  next()
})

router.afterEach((to, from) => {
  analytics.page()
})
export default router
