<template>
  <div class="provincial-page">
    <div v-if="tabs.length" class="integration-tabs" role="tablist" :aria-label="tabLabel">
      <button v-for="tab in tabs" :key="tab.id" type="button" class="integration-tab" :class="{ active: activeTab === tab.id }" :aria-selected="activeTab === tab.id" role="tab" @click="selectTab(tab.id)">{{ tab.label }}</button>
    </div>
    <component :is="activeComponent" :key="route.path" v-bind="auditRoute ? { kind: route.path === '/org-field-inspection' ? 'curtain' : 'house', organizationMode: provincialState.user?.role === 'org', reviewMode: provincialState.user?.role === 'prov' } : {}" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ProvincialDashboard from './ProvincialDashboard.vue'
import OrganizationIssueDashboard from './OrganizationIssueDashboard.vue'
import DataCollection from './DataCollection.vue'
import AuditDashboard from '../components/AuditDashboard.vue'
import AiCheck from './AiCheck.vue'
import RuleConfig from './RuleConfig.vue'
import SystemManagement from './SystemManagement.vue'
import HouseAudit from './HouseAudit.vue'
import CurtainWallAudit from './CurtainWallAudit.vue'
import KnowledgeBase from './KnowledgeBase.vue'
import Personnel from './Personnel.vue'
import RecordLedger from './RecordLedger.vue'
import { provincialState } from '../state/provincialState'

const route = useRoute(), router = useRouter()
const auditRoute = computed(() => route.path === '/org-house-audit' || route.path === '/org-field-inspection')
const tabs = computed(() => {
  if (route.path === '/ai-check') return [
    { id: 'platform', label: '平台 AI 核查' },
    { id: 'house', label: '房屋安全鉴定报告' },
    { id: 'curtain', label: '幕墙安全鉴定报告' }
  ]
  if (route.path === '/rule-config') return [
    { id: 'platform', label: '规则配置' },
    { id: 'knowledge', label: '知识库' }
  ]
  if (route.path === '/system-management') return [
    { id: 'personnel', label: '人员档案' },
    { id: 'platform', label: '系统配置' }
  ]
  return []
})
const tabLabel = computed(() => route.path === '/ai-check' ? 'AI 核查功能' : route.path === '/rule-config' ? '知识库及规则配置' : '系统管理功能')
const activeTab = computed(() => tabs.value.some(item => item.id === route.query.tab) ? route.query.tab : route.path === '/system-management' ? 'personnel' : 'platform')
const activeComponent = computed(() => {
  if (activeTab.value === 'house') return HouseAudit
  if (activeTab.value === 'curtain') return CurtainWallAudit
  if (activeTab.value === 'knowledge') return KnowledgeBase
  if (activeTab.value === 'personnel') return Personnel
  if (auditRoute.value) return AuditDashboard
  return ({ '/dashboard': ProvincialDashboard, '/org-issues': OrganizationIssueDashboard, '/records': RecordLedger, '/data-collection': DataCollection, '/ai-check': AiCheck, '/rule-config': RuleConfig, '/system-management': SystemManagement })[route.path] || ProvincialDashboard
})
function selectTab(id) { router.replace({ path: route.path, query: route.path === '/system-management' || id !== 'platform' ? { tab: id } : {} }) }
</script>

<style scoped>
.provincial-page{min-width:0}
.integration-tabs{display:flex;gap:24px;flex-wrap:wrap;margin:0 0 20px;padding:0 18px;border:1px solid #e4eaf5;border-radius:13px;background:#fff;box-shadow:0 5px 16px rgba(30,41,59,.035)}
.integration-tab{position:relative;border:0;padding:16px 3px;background:transparent;color:#7888a0;font-size:12px;font-weight:700;cursor:pointer}
.integration-tab:hover{color:#235fd6}
.integration-tab.active{color:#235fd6}
.integration-tab.active::after{content:"";position:absolute;right:0;bottom:0;left:0;height:3px;border-radius:3px 3px 0 0;background:#235fd6}
@media(max-width:670px){.integration-tab{padding:9px 11px}}
</style>
