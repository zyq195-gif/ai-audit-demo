<template>
  <main class="login-page">
    <aside class="login-visual" aria-label="报告智能审核平台">
      <div class="visual-top"><span class="visual-mark"><img :src="companyLogo" alt="" /></span><span>REPORTAUDIT <b>AI</b></span></div>
      <div class="visual-stage" aria-hidden="true">
        <svg class="audit-illustration" viewBox="0 0 600 510" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs><linearGradient id="doc" x1="161" y1="75" x2="445" y2="435" gradientUnits="userSpaceOnUse"><stop stop-color="white"/><stop offset="1" stop-color="#EAF2FF"/></linearGradient><linearGradient id="highlight" x1="343" y1="260" x2="460" y2="335" gradientUnits="userSpaceOnUse"><stop stop-color="#70C8F1"/><stop offset="1" stop-color="#4987ED"/></linearGradient><filter id="shadow" x="0" y="0" width="600" height="510"><feDropShadow dx="0" dy="20" stdDeviation="22" flood-color="#071E56" flood-opacity=".25"/></filter></defs>
          <circle cx="295" cy="245" r="218" stroke="white" stroke-opacity=".12"/><circle cx="295" cy="245" r="166" stroke="white" stroke-opacity=".1"/>
          <rect x="78" y="147" width="226" height="258" rx="19" fill="#8AB9FA" fill-opacity=".19" stroke="white" stroke-opacity=".35" transform="rotate(-11 78 147)"/>
          <rect x="255" y="113" width="226" height="258" rx="19" fill="#8AB9FA" fill-opacity=".21" stroke="white" stroke-opacity=".34" transform="rotate(10 255 113)"/>
          <g filter="url(#shadow)"><rect x="148" y="70" width="298" height="371" rx="23" fill="url(#doc)"/><path d="M148 93C148 80.3 158.3 70 171 70H423C435.7 70 446 80.3 446 93V137H148V93Z" fill="#E4EFFF"/><rect x="173" y="90" width="36" height="32" rx="8" fill="#1B55C1"/><path d="M183 100H199M183 106H199M183 112H194" stroke="white" stroke-width="2.5" stroke-linecap="round"/><rect x="221" y="96" width="94" height="8" rx="4" fill="#345885"/><rect x="221" y="111" width="64" height="6" rx="3" fill="#91ABC9"/>
          <rect x="178" y="165" width="129" height="9" rx="4.5" fill="#183F7C"/><rect x="178" y="185" width="220" height="6" rx="3" fill="#ADC2DD"/><rect x="178" y="201" width="197" height="6" rx="3" fill="#C4D3E7"/><rect x="178" y="230" width="229" height="45" rx="8" fill="#F5F9FF" stroke="#D7E7FA"/><rect x="192" y="242" width="80" height="6" rx="3" fill="#9EB8D8"/><rect x="192" y="256" width="160" height="6" rx="3" fill="#D2DEEE"/>
          <rect x="178" y="294" width="229" height="52" rx="8" fill="#E9F4FE" stroke="#93C8F4"/><circle cx="197" cy="320" r="9" fill="#2B90D5"/><path d="M194 320L197 323L201 317" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><rect x="214" y="308" width="103" height="7" rx="3.5" fill="#356698"/><rect x="214" y="323" width="166" height="5" rx="2.5" fill="#9CB8D5"/>
          <rect x="178" y="369" width="137" height="6" rx="3" fill="#B5C8DF"/><rect x="178" y="385" width="174" height="6" rx="3" fill="#D4DFED"/></g>
          <g filter="url(#shadow)"><rect x="356" y="331" width="130" height="103" rx="17" fill="url(#highlight)"/><circle cx="388" cy="362" r="14" fill="white" fill-opacity=".24"/><path d="M382 362L387 367L395 357" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><rect x="414" y="356" width="49" height="7" rx="3.5" fill="white" fill-opacity=".9"/><rect x="414" y="370" width="36" height="5" rx="2.5" fill="white" fill-opacity=".58"/><rect x="373" y="400" width="94" height="5" rx="2.5" fill="white" fill-opacity=".58"/></g>
          <circle cx="104" cy="93" r="7" fill="#8DD6FF"/><circle cx="500" cy="97" r="5" fill="white" fill-opacity=".65"/><path d="M96 344V366M85 355H107" stroke="#A4D8FF" stroke-width="3" stroke-linecap="round"/><path d="M502 205V225M492 215H512" stroke="white" stroke-opacity=".72" stroke-width="3" stroke-linecap="round"/>
        </svg>
      </div>
      <div class="visual-bottom"><span class="visual-eyebrow">SMART REPORT WORKSPACE</span><h2>让每一份报告，都有迹可循。</h2><p>从资料采集到智能核查，在清晰的流程里完成每一步。</p><div class="visual-progress"><span></span><span></span><span></span></div></div>
    </aside>

    <section class="login-panel" aria-labelledby="login-title"><div class="login-content">
      <div class="mobile-brand"><span class="mobile-logo"><img :src="companyLogo" alt="" /></span><strong>ReportAudit <em>AI</em></strong></div>
      <span class="login-kicker">欢迎使用 · 智能监管工作台</span><h1 id="login-title">登录系统</h1><p class="login-description">请选择工作权限，使用对应账号进入工作台。</p>
      <form class="login-form" @submit.prevent="submit">
        <fieldset class="role-picker"><legend>工作权限</legend><div class="role-options"><button type="button" class="role-option" :class="{ selected: role === '省站监管人员' }" :aria-pressed="role === '省站监管人员'" @click="chooseRole('省站监管人员')"><span class="role-icon"><Landmark :size="19" /></span><strong>省站监管人员</strong><small>省级监管 · 全量权限</small></button><button type="button" class="role-option" :class="{ selected: role === '检测机构人员' }" :aria-pressed="role === '检测机构人员'" @click="chooseRole('检测机构人员')"><span class="role-icon"><Building2 :size="19" /></span><strong>检测机构人员</strong><small>本机构 · 受限权限</small></button></div></fieldset>
        <label class="login-field"><span>账号 ID</span><input v-model.trim="account" autocomplete="username" placeholder="请输入账号 ID" required /></label>
        <label class="login-field"><span>密码</span><input v-model="password" type="password" autocomplete="current-password" placeholder="请输入密码" required /></label>
        <p v-if="error" class="login-error" role="alert">{{ error }}</p><button class="login-submit" type="submit">登录工作台 <ArrowRight :size="18" /></button>
      </form>
      <div class="login-demo"><span>预置账号</span><strong>{{ role === '省站监管人员' ? 'admin' : 'user' }}</strong><small>密码 123456</small><button type="button" @click="fillDemo">一键填入 <ArrowRight :size="13" /></button></div>
    </div></section>
  </main>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowRight, Building2, Landmark } from 'lucide-vue-next'
import companyLogo from '../assets/company-logo.png'
import { loginAccount, provincialRoutes, visibleMenus } from '../state/provincialState'

const router = useRouter()
const role = ref('省站监管人员')
const account = ref('')
const password = ref('')
const error = ref('')
function chooseRole(value) { role.value = value; account.value = ''; password.value = ''; error.value = '' }
function fillDemo() {
  account.value = role.value === '省站监管人员' ? 'admin' : 'user'
  password.value = '123456'
  error.value = ''
}
function submit() {
  error.value = ''
  const result = loginAccount(account.value, password.value, role.value)
  if (!result.ok) { error.value = result.message; return }
  const firstAllowed = visibleMenus()[0]
  router.replace(firstAllowed ? provincialRoutes[firstAllowed.view] : '/dashboard')
}
</script>

<style scoped>
.login-page{min-height:100vh;display:grid;grid-template-columns:minmax(0,1fr) minmax(490px,48%);background:#fff;color:#243248}
.login-visual{position:relative;min-height:100vh;display:flex;flex-direction:column;overflow:hidden;padding:42px clamp(34px,5vw,88px) 56px;background:radial-gradient(circle at 77% 27%,#3476cf 0%,transparent 31%),linear-gradient(147deg,#103675 0%,#174ca5 52%,#2469ca 100%);color:#fff}.login-visual:before{content:"";position:absolute;width:620px;height:620px;left:-310px;top:27%;border:1px solid rgba(255,255,255,.08);border-radius:50%;box-shadow:0 0 0 72px rgba(255,255,255,.025),0 0 0 144px rgba(255,255,255,.02)}.visual-top,.visual-bottom,.visual-stage{position:relative;z-index:1}.visual-top{display:flex;align-items:center;gap:11px;font-size:13px;font-weight:800;letter-spacing:.12em}.visual-top b{color:#9cceff}.visual-mark{width:37px;height:37px;display:grid;place-items:center;border-radius:10px;background:#fff}.visual-mark img{width:28px;height:28px;object-fit:contain}.visual-stage{flex:1;min-height:430px;display:grid;place-items:center}.audit-illustration{width:min(100%,600px);max-height:540px;filter:drop-shadow(0 20px 25px rgba(4,28,83,.1))}.visual-bottom{max-width:540px}.visual-eyebrow{font-size:10px;letter-spacing:.2em;font-weight:800;color:#a6d2ff}.visual-bottom h2{font-size:clamp(25px,2.25vw,37px);line-height:1.3;margin:11px 0 10px;letter-spacing:-.035em}.visual-bottom p{font-size:13px;line-height:1.8;color:#c7dcfc;margin:0}.visual-progress{display:flex;gap:7px;margin-top:29px}.visual-progress span{width:7px;height:4px;border-radius:4px;background:rgba(255,255,255,.38)}.visual-progress span:first-child{width:29px;background:#9ed2ff}
.login-panel{display:grid;place-items:center;padding:38px 36px;min-width:0}.login-content{width:min(510px,100%)}.mobile-brand{display:none}.login-kicker{display:block;color:#246ee9;font-size:12px;font-weight:800;letter-spacing:.06em}.login-content h1{font-size:34px;line-height:1.25;letter-spacing:-.04em;margin:13px 0 9px}.login-description{margin:0 0 31px;font-size:13px;color:#8b98aa;line-height:1.7}
.login-form{display:grid;gap:19px}.role-picker{margin:0;padding:0;border:0;min-width:0}.role-picker legend,.login-field>span{display:block;margin-bottom:9px;font-size:12px;font-weight:800;color:#40516b}.role-options{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.role-option{display:grid;grid-template-columns:34px minmax(0,1fr);column-gap:9px;align-items:center;text-align:left;min-height:94px;padding:15px 13px;border:1px solid #dee8f5;border-radius:13px;background:#fbfcff;color:#40516b;transition:border-color .18s,background .18s,box-shadow .18s}.role-option:hover{border-color:#86adea;background:#f6f9ff}.role-option.selected{border:1.5px solid #1b55c1;background:#edf4ff;box-shadow:0 0 0 3px rgba(35,95,214,.06)}.role-icon{grid-row:span 2;width:34px;height:34px;border-radius:9px;background:#eaf0ff;color:#246ee9;display:grid;place-items:center}.role-option.selected .role-icon{background:#dbe9ff;color:#1b55c1}.role-option strong{font-size:12px;color:#243248;white-space:nowrap}.role-option.selected strong{color:#123f90}.role-option small{font-size:10px;color:#8b98aa;white-space:nowrap}.role-option.selected small{color:#5d759a}
.login-field{display:block}.login-field input,.login-field select{width:100%;height:49px;border:1px solid #dfe7f5;border-radius:10px;padding:0 14px;background:#fafcff;color:#243248;font:inherit;font-size:13px;outline:none}.login-field input:focus,.login-field select:focus{border-color:#5484de;box-shadow:0 0 0 3px rgba(84,132,222,.1)}.login-field input::placeholder{color:#aeb8c7}.login-error{margin:0;padding:10px 12px;border-radius:9px;background:#fbf0f2;color:#9b5965;font-size:12px}.login-submit{height:50px;margin-top:3px;display:flex;align-items:center;justify-content:center;gap:10px;border:0;border-radius:10px;background:#235fd6;color:#fff;font-size:13px;font-weight:800;box-shadow:0 9px 19px rgba(35,95,214,.18)}.login-submit:hover{background:#1b4fae}.login-demo{display:flex;align-items:center;flex-wrap:wrap;gap:6px 12px;margin-top:27px;padding-top:18px;border-top:1px solid #eaf0ff;color:#8b98aa;font-size:11px}.login-demo strong{color:#40516b;font-weight:750}.login-demo small{color:#8b98aa;font-size:11px}.login-demo button{display:inline-flex;align-items:center;gap:3px;margin-left:auto;padding:4px 0;border:0;background:none;color:#235fd6;font-size:11px;font-weight:750}.login-demo button:hover{text-decoration:underline}
@media(max-width:1050px){.login-page{grid-template-columns:minmax(0,.85fr) minmax(450px,1fr)}.login-visual{padding:32px 35px 44px}.visual-stage{min-height:360px}}
@media(max-width:850px){.login-page{display:block}.login-visual{display:none}.login-panel{min-height:100vh;padding:32px 24px}.mobile-brand{display:flex;align-items:center;gap:10px;margin-bottom:62px}.mobile-logo{width:39px;height:39px;border-radius:10px;background:#f5f7fb;display:grid;place-items:center}.mobile-logo img{width:30px;height:30px}.mobile-brand strong{font-size:17px}.mobile-brand em{font-style:normal;color:#246ee9}}
@media(max-width:480px){.login-panel{display:block;padding:28px 19px}.login-content h1{font-size:30px}.mobile-brand{margin-bottom:52px}.role-options{gap:8px}.role-option{display:flex;flex-direction:column;align-items:flex-start;gap:5px;min-height:123px;padding:12px 10px}.role-icon{width:29px;height:29px}.role-option strong{font-size:11px}.role-option small{font-size:9px}}
</style>
