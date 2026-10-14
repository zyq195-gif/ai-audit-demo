<template>
  <header class="topbar">
    <div class="topbar-left"><span class="eyebrow-dot" aria-hidden="true"></span><span>智能监管工作台</span><ChevronRight :size="15" /><strong>{{ currentTitle }}</strong></div>
    <div class="topbar-right"><ReportSearch /><span class="topbar-date">{{ today }}</span><span class="topbar-divider"></span><div class="account-wrap"><button class="topbar-account" type="button" aria-label="账号菜单" :aria-expanded="menuOpen" @click="menuOpen = !menuOpen"><span class="avatar">{{ avatarLetter }}</span><span class="topbar-user"><strong>{{ provincialState.user?.name }}</strong><small>{{ provincialState.user?.roleName }}</small></span><ChevronDown :size="14" class="account-chevron" /></button><div v-if="menuOpen" class="account-menu"><div class="account-menu-header"><strong>{{ provincialState.user?.name }}</strong><small>{{ provincialState.user?.org }} · {{ provincialState.user?.account }}</small></div><button type="button" @click="openInfo"><UserRound :size="16" />查看账号信息</button><button type="button" @click="leaveAccount"><RefreshCw :size="16" />切换账号</button><button type="button" @click="leaveAccount"><LogOut :size="16" />退出登录</button></div></div></div>
  </header>
  <div v-if="menuOpen" class="account-menu-dismiss" @click="menuOpen = false"></div>
  <div v-if="showInfo" class="modal-backdrop" @click.self="showInfo = false"><section class="management-modal" role="dialog" aria-modal="true" aria-label="账号信息"><div class="management-modal-head"><div><span class="section-kicker">当前登录账号</span><h2>账号信息</h2></div><button class="icon-button" type="button" aria-label="关闭" @click="showInfo = false"><X :size="18" /></button></div><div class="management-detail"><dl><div><dt>账号 ID</dt><dd>{{ provincialState.user?.account }}</dd></div><div><dt>姓名</dt><dd>{{ provincialState.user?.name }}</dd></div><div><dt>所属机构</dt><dd>{{ provincialState.user?.org }}</dd></div><div><dt>角色</dt><dd>{{ provincialState.user?.roleName }}</dd></div><div><dt>数据范围</dt><dd>{{ provincialState.user?.scope }}</dd></div></dl><div class="management-modal-foot"><button class="button button-secondary" type="button" @click="showInfo = false">关闭</button></div></div></section></div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ChevronDown, ChevronRight, LogOut, RefreshCw, UserRound, X } from 'lucide-vue-next'
import ReportSearch from './ReportSearch.vue'
import { logout, provincialState, provincialRoutes, visibleMenus } from '../state/provincialState'

const route = useRoute()
const router = useRouter()
const currentTitle = computed(() => visibleMenus().find(menu => provincialRoutes[menu.view] === route.path)?.name || '工作空间')
const avatarLetter = computed(() => provincialState.user?.name?.slice(0, 1) || '账')
const today = new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Shanghai' }).format(new Date())
const menuOpen = ref(false)
const showInfo = ref(false)
function openInfo() { menuOpen.value = false; showInfo.value = true }
function leaveAccount() { menuOpen.value = false; showInfo.value = false; logout(); router.replace('/login') }
</script>

<style scoped>
.account-wrap{position:relative}.topbar-account{display:flex;align-items:center;gap:12px;padding:0;border:0;background:transparent;text-align:left}.topbar-account:hover .topbar-user strong{color:#235fd6}.account-chevron{color:#8b98aa}.account-menu-dismiss{position:fixed;inset:0;z-index:18}.account-menu{position:absolute;top:calc(100% + 17px);right:0;z-index:22;width:224px;padding:7px;border:1px solid #e5eaf2;border-radius:13px;background:#fff;box-shadow:0 16px 35px rgba(23,36,64,.13)}.account-menu-header{display:grid;gap:4px;padding:10px 12px 12px;margin-bottom:4px;border-bottom:1px solid #eaf0ff}.account-menu-header strong{color:#243248;font-size:12px}.account-menu-header small{color:#8b98aa;font-size:10px}.account-menu>button{display:flex;align-items:center;gap:10px;width:100%;padding:10px 12px;border:0;border-radius:8px;background:transparent;text-align:left;color:#40516b;font-size:11px}.account-menu>button:hover{background:#f3f7ff;color:#235fd6}
</style>
