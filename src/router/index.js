import { createRouter, createWebHashHistory, createWebHistory } from 'vue-router'
import ProvincialPlatform from '../views/ProvincialPlatform.vue'
import Login from '../views/Login.vue'
import { provincialRoutes, provincialState, visibleMenus } from '../state/provincialState'

const router = createRouter({
  history: import.meta.env.PROD
    ? createWebHashHistory(import.meta.env.BASE_URL)
    : createWebHistory(),
  scrollBehavior() { return { left: 0, top: 0 } },
  routes: [
    { path: '/login', name: 'Login', component: Login },
    {
      path: '/',
      redirect: '/dashboard'
    },
    {
      path: '/dashboard',
      name: 'Dashboard',
      component: ProvincialPlatform
    },
    {
      path: '/data-collection',
      name: 'DataCollection',
      component: ProvincialPlatform
    },
    { path: '/org-issues', name: 'OrganizationIssues', component: ProvincialPlatform },
    { path: '/records', name: 'RecordLedger', component: ProvincialPlatform },
    { path: '/org-house-audit', name: 'OrganizationHouseAudit', component: ProvincialPlatform },
    { path: '/org-field-inspection', name: 'OrganizationFieldInspection', component: ProvincialPlatform },
    { path: '/ai-check', redirect: '/org-house-audit' },
    {
      path: '/rule-config',
      name: 'RuleConfig',
      component: ProvincialPlatform
    },
    {
      path: '/system-management',
      name: 'SystemManagement',
      component: ProvincialPlatform
    },
    { path: '/house-audit', redirect: '/org-house-audit' },
    { path: '/curtain-wall-audit', redirect: '/org-field-inspection' },
    { path: '/knowledge-base', redirect: '/rule-config?tab=knowledge' },
    { path: '/personnel', redirect: '/system-management?tab=personnel' }
  ]
})

router.beforeEach(to => {
  if (to.path === '/login') {
    if (!provincialState.authenticated) return
    const firstAllowed = visibleMenus()[0]
    return firstAllowed ? provincialRoutes[firstAllowed.view] : undefined
  }
  if (!provincialState.authenticated) return '/login'
  const view = Object.keys(provincialRoutes).find(key => provincialRoutes[key] === to.path)
  if (view && !provincialState.user?.perms.includes(view)) {
    const firstAllowed = visibleMenus()[0]
    return firstAllowed ? provincialRoutes[firstAllowed.view] : false
  }
})

export default router
