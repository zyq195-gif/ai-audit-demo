import { createRouter, createWebHashHistory, createWebHistory } from 'vue-router'
import HouseAudit from '../views/HouseAudit.vue'
import CurtainWallAudit from '../views/CurtainWallAudit.vue'
import KnowledgeBase from '../views/KnowledgeBase.vue'
import Personnel from '../views/Personnel.vue'

const router = createRouter({
  history: import.meta.env.PROD
    ? createWebHashHistory(import.meta.env.BASE_URL)
    : createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/house-audit'
    },
    {
      path: '/house-audit',
      name: 'HouseAudit',
      component: HouseAudit
    },
    {
      path: '/curtain-wall-audit',
      name: 'CurtainWallAudit',
      component: CurtainWallAudit
    },
    {
      path: '/knowledge-base',
      name: 'KnowledgeBase',
      component: KnowledgeBase
    },
    {
      path: '/personnel',
      name: 'Personnel',
      component: Personnel
    }
  ]
})

export default router
