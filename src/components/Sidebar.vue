<template>
  <aside class="sidebar">
    <div class="brand">
      <div class="brand-logo"><img :src="companyLogo" alt="公司标识" /></div>
      <div class="brand-copy"><strong>ReportAudit <em>AI</em></strong><span>报告智能审核平台</span></div>
    </div>
    <div class="sidebar-scroll">
      <nav class="side-nav" aria-label="主导航">
        <router-link v-for="menu in visibleMenus" :key="menu.id" :to="provincialRoutes[menu.view]" class="nav-link" active-class="active">
          <component :is="icons[menu.view] || LayoutGrid" :size="19" /><span>{{ menu.name }}</span><ChevronRight :size="15" class="nav-chevron" />
        </router-link>
      </nav>
      <div class="sidebar-overview">
        <div class="nav-label nav-label-secondary">平台概览</div>
        <div class="sidebar-mini-card"><div class="mini-card-icon"><Sparkles :size="17" /></div><strong>检测监管与智能核查</strong><p>房屋与幕墙鉴定、规则与知识库，在同一工作台完成。</p></div>
      </div>
    </div>
    <div class="sidebar-foot"><span class="online-dot"></span><div><strong>工作环境</strong><small>数据与配置 · 浏览器本地运行</small></div><span class="version">v1.0</span></div>
  </aside>
</template>
<script setup>
import { computed } from 'vue'
import { ChartNoAxesCombined, ChevronRight, ClipboardList, Database, House, LayoutGrid, ScanLine, Settings2, Sparkles } from 'lucide-vue-next'
import companyLogo from '../assets/company-logo.png'
import { provincialRoutes, visibleMenus as getVisibleMenus } from '../state/provincialState'

const icons = { dash: LayoutGrid, orgIssues: ChartNoAxesCombined, collect: Database, screen: ChartNoAxesCombined, rule: ClipboardList, ledger: ClipboardList, sys: Settings2, orgHouse: House, orgField: ScanLine }
const visibleMenus = computed(() => getVisibleMenus())
</script>
