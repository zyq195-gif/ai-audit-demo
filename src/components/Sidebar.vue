<template>
  <aside class="sidebar">
    <div class="brand">
      <div class="brand-logo"><img :src="companyLogo" alt="公司标识" /></div>
      <div class="brand-copy"><strong>ReportAudit <em>AI</em></strong><span>报告智能审核平台</span></div>
    </div>
    <div class="sidebar-scroll">
      <nav class="side-nav" aria-label="主导航">
        <router-link to="/house-audit" class="nav-link" active-class="active"><House :size="19" /><span>房屋安全鉴定</span><ChevronRight :size="15" class="nav-chevron" /></router-link>
        <router-link to="/curtain-wall-audit" class="nav-link" active-class="active"><PanelsTopLeft :size="19" /><span>幕墙安全鉴定</span><ChevronRight :size="15" class="nav-chevron" /></router-link>
        <router-link to="/knowledge-base" class="nav-link" active-class="active"><BookOpen :size="19" /><span>知识库管理</span><ChevronRight :size="15" class="nav-chevron" /></router-link>
        <router-link to="/personnel" class="nav-link" active-class="active"><Users :size="19" /><span>人员管理</span><ChevronRight :size="15" class="nav-chevron" /></router-link>
      </nav>
      <div class="sidebar-overview">
        <div class="nav-label nav-label-secondary">平台概览</div>
        <div class="sidebar-mini-card"><div class="mini-card-icon"><Sparkles :size="17" /></div><strong>让报告审核更清晰</strong><p>上传、审核、预览与导出，在一个工作台完成。</p></div>
      </div>
    </div>
    <div class="sidebar-foot"><span class="online-dot"></span><div><strong>演示环境</strong><small>本地文件 · 模拟审核</small></div><span class="version">v1.0</span></div>
  </aside>
</template>
<script setup>
import { BookOpen, ChevronRight, House, PanelsTopLeft, Sparkles, Users } from 'lucide-vue-next'
import companyLogo from '../assets/company-logo.png'
</script>
