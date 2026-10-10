<template>
  <header class="topbar">
    <div class="topbar-left"><span class="eyebrow-dot" aria-hidden="true"></span><span>{{ isAuditPage ? '智能审核工作台' : '平台管理' }}</span><ChevronRight :size="15" /><strong>{{ currentTitle }}</strong></div>
    <div class="topbar-right"><ReportSearch /><span class="topbar-date">{{ today }}</span><span class="topbar-divider"></span><span class="avatar">RA</span><div class="topbar-user"><strong>演示工作台</strong><small>Demo Workspace</small></div></div>
  </header>
</template>
<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { ChevronRight } from 'lucide-vue-next'
import ReportSearch from './ReportSearch.vue'
const route = useRoute()
const isAuditPage = computed(() => ['/house-audit', '/curtain-wall-audit'].includes(route.path))
const currentTitle = computed(() => ({ '/house-audit': '房屋安全鉴定', '/curtain-wall-audit': '幕墙安全鉴定', '/knowledge-base': '知识库管理', '/personnel': '人员管理' })[route.path] || '工作空间')
const today = new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Shanghai' }).format(new Date())
</script>
