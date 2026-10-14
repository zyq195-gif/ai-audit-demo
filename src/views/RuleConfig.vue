<template>
  <div class="management-page">
    <section class="management-stats">
      <article v-for="stat in stats" :key="stat.label" class="surface management-stat"><span class="metric-icon" :class="stat.tone"><component :is="stat.icon" :size="18" /></span><div :data-note="stat.note"><small>{{ stat.label }}</small><strong>{{ stat.value }} <em>项</em></strong></div></article>
    </section>
    <div class="management-toolbar rule-toolbar"><div class="rule-filters"><label class="search-box rule-search"><Search :size="16" /><input v-model="keyword" type="search" placeholder="搜索规则名称、核查依据或核查内容" /></label><select v-model="activeType" class="rule-type-select" aria-label="鉴定类型筛选"><option value="all">全部范围</option><option value="house">房屋安全鉴定</option><option value="curtain">幕墙安全鉴定</option></select><select v-model="statusFilter" class="rule-type-select" aria-label="规则状态筛选"><option value="all">全部状态</option><option value="enabled">已启用</option><option value="disabled">已停用</option></select><span class="history-count">共 {{ filteredParameters.length }} 条结果</span></div><button class="button button-primary" @click="openParameter()"><Plus :size="16" /> 新增规则</button></div>
    <section v-for="parameter in filteredParameters" :key="`${parameterType(parameter)}-${parameter.param}`" class="surface management-list rule-card"><div class="card-heading"><div class="rule-heading-copy"><span class="section-kicker">{{ parameterType(parameter) === 'house' ? '房屋安全鉴定' : '幕墙安全鉴定' }}</span><div class="rule-title-line"><h2>{{ parameter.param }}</h2><span class="rule-standard" :title="parameter.std">依据：{{ parameter.std }}</span></div></div><div class="rule-actions"><span class="history-count">{{ parameter.items.filter(item => item.on).length }} / {{ parameter.items.length }} 项启用</span><button class="button button-secondary" @click="openParameter(parameter)">编辑规则</button><button class="button button-primary" @click="openItem(parameter)"><Plus :size="15" /> 新增核查项</button></div></div><div class="management-table-wrap"><table class="management-table rule-table"><thead><tr><th>序号</th><th>核查内容</th><th>状态</th><th>操作</th></tr></thead><tbody><tr v-for="item in visibleItems(parameter)" :key="parameter.items.indexOf(item)"><td>{{ parameter.items.indexOf(item) + 1 }}</td><td class="rule-content">{{ item.t }}</td><td><span class="table-status" :class="{ inactive: !item.on }"><span></span>{{ item.on ? '已启用' : '已停用' }}</span></td><td><div class="row-actions"><button @click="item.on = !item.on">{{ item.on ? '停用' : '启用' }}</button><button @click="openItem(parameter, item)">编辑</button><button class="danger-text" @click="removeItem(parameter, parameter.items.indexOf(item))">删除</button></div></td></tr></tbody></table><div v-if="!visibleItems(parameter).length" class="empty-state"><ClipboardList :size="25" /><strong>暂无符合条件的核查项</strong></div></div></section>
    <section v-if="!filteredParameters.length" class="surface management-list empty-state"><ClipboardList :size="26" /><strong>没有找到核查规则</strong></section>
    <div v-if="modal" class="modal-backdrop" @click.self="modal = ''"><section class="management-modal" role="dialog" aria-modal="true" :aria-label="modal === 'parameter' ? '配置规则' : '配置核查项'"><div class="management-modal-head"><div><span class="section-kicker">知识库及规则配置</span><h2>{{ modal === 'parameter' ? (editingParameter ? '编辑规则' : '新增规则') : (editingItem ? '编辑核查项' : '新增核查项') }}</h2></div><button class="icon-button" aria-label="关闭" @click="modal = ''"><X :size="18" /></button></div><form class="management-form" @submit.prevent="save"><div v-if="modal === 'parameter'" class="form-grid"><label class="form-field"><span>鉴定类型 *</span><select v-model="parameterForm.type" required><option value="house">房屋安全鉴定</option><option value="curtain">幕墙安全鉴定</option></select></label><label class="form-field"><span>规则名称 *</span><input v-model="parameterForm.param" required /></label><label class="form-field wide"><span>核查依据 *</span><input v-model="parameterForm.std" required placeholder="填写标准名称及编号" /></label></div><div v-else class="form-grid"><label class="form-field wide"><span>核查内容 *</span><input v-model="itemForm.t" required /></label><label class="form-field"><span>使用状态</span><select v-model="itemForm.on"><option :value="true">启用</option><option :value="false">停用</option></select></label></div><p v-if="error" class="form-error">{{ error }}</p><div class="management-modal-foot"><button type="button" class="button button-secondary" @click="modal = ''">取消</button><button class="button button-primary" type="submit">保存</button></div></form></section></div>
    <div v-if="notice" class="toast" role="status">{{ notice }}</div>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { CircleCheck, ClipboardList, Layers3, Plus, Search, X } from 'lucide-vue-next'
import { provincialState } from '../state/provincialState'

const activeType = ref('all'), statusFilter = ref('all'), keyword = ref(''), modal = ref(''), notice = ref(''), error = ref('')
const editingParameter = ref(null), editingItem = ref(null), owner = ref(null)
const parameterForm = reactive({ type: 'house', param: '', std: '' }), itemForm = reactive({ t: '', on: true })
const parameters = computed(() => activeType.value === 'all' ? [...provincialState.ruleConfig.house, ...provincialState.ruleConfig.curtain] : provincialState.ruleConfig[activeType.value])
const filteredParameters = computed(() => parameters.value.filter(parameter => {
  const query = keyword.value.trim().toLowerCase()
  const matchesText = !query || [parameter.param, parameter.std, ...parameter.items.map(item => item.t)].some(value => String(value).toLowerCase().includes(query))
  const matchesStatus = statusFilter.value === 'all' || parameter.items.some(item => item.on === (statusFilter.value === 'enabled'))
  return matchesText && matchesStatus
}))
function visibleItems(parameter) { return statusFilter.value === 'all' ? parameter.items : parameter.items.filter(item => item.on === (statusFilter.value === 'enabled')) }
function parameterType(parameter) { return provincialState.ruleConfig.house.includes(parameter) ? 'house' : 'curtain' }
const allParameters = computed(() => Object.values(provincialState.ruleConfig).flat())
const allItems = computed(() => allParameters.value.flatMap(parameter => parameter.items))
const stats = computed(() => [
  { label: '鉴定项目', value: allParameters.value.length, note: '房屋与幕墙规则合计', tone: 'indigo', icon: Layers3 },
  { label: '已启用核查项', value: allItems.value.filter(item => item.on).length, note: '参与当前审核的核查项', tone: 'teal', icon: CircleCheck },
  { label: '核查项总数', value: allItems.value.length, note: '含已停用的核查项', tone: 'amber', icon: ClipboardList }
])
function announce(text) { notice.value = text; setTimeout(() => { notice.value = '' }, 2400) }
function openParameter(parameter = null) { editingParameter.value = parameter; Object.assign(parameterForm, { type: parameter ? parameterType(parameter) : activeType.value === 'curtain' ? 'curtain' : 'house', param: parameter?.param || '', std: parameter?.std || '' }); error.value = ''; modal.value = 'parameter' }
function openItem(parameter, item = null) { owner.value = parameter; editingItem.value = item; Object.assign(itemForm, { t: item?.t || '', on: item?.on ?? true }); error.value = ''; modal.value = 'item' }
function save() {
  if (modal.value === 'parameter') {
    const name = parameterForm.param.trim(), standard = parameterForm.std.trim()
    if (!name || !standard) return
    const target = provincialState.ruleConfig[parameterForm.type]
    if (target.some(item => item !== editingParameter.value && item.param === name)) { error.value = '该类型下的规则名称已存在'; return }
    if (editingParameter.value) {
      const source = provincialState.ruleConfig[parameterType(editingParameter.value)]
      if (source !== target) { source.splice(source.indexOf(editingParameter.value), 1); target.push(editingParameter.value) }
      Object.assign(editingParameter.value, { param: name, std: standard })
    } else target.push({ param: name, std: standard, items: [] })
  } else {
    const text = itemForm.t.trim()
    if (!text) return
    if (editingItem.value) Object.assign(editingItem.value, { t: text, on: itemForm.on })
    else owner.value.items.push({ t: text, on: itemForm.on })
  }
  modal.value = ''; announce('配置已保存')
}
function removeItem(parameter, index) { if (window.confirm('删除这条核查项？')) { parameter.items.splice(index, 1); announce('核查项已删除') } }
</script>

<style scoped>
.management-page{gap:14px}.rule-card{padding-top:20px}.rule-card .card-heading{margin-bottom:14px}.rule-actions{display:flex;align-items:center;gap:9px;flex-wrap:wrap}.rule-table{min-width:0}.rule-table th:first-child{width:8%}.rule-table th:nth-child(2){width:56%}.rule-table th:nth-child(3){width:14%}.rule-table th:last-child{width:22%}.rule-table .row-actions{justify-content:center;flex-wrap:wrap}.rule-content{text-align:center!important;white-space:normal!important;line-height:1.6}.rule-toolbar{display:flex;align-items:center;gap:12px;margin:0 0 2px;padding:0}.rule-type-select{flex:none;min-width:174px;height:39px;padding:0 12px;border:1px solid #dce7f8;border-radius:10px;background:#fff;color:#40516b;font-size:12px}.rule-search{margin-left:auto;width:320px;max-width:320px;flex:0 1 320px}.rule-heading-copy{min-width:0;flex:1}.rule-title-line{display:flex;align-items:center;gap:14px;flex-wrap:wrap}.rule-title-line h2{margin:5px 0 0}.rule-standard{max-width:480px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:5px;padding:5px 9px;border-radius:7px;background:#f2f6fd;color:#607797;font-size:11px}.rule-actions .button{min-height:34px;font-size:10px;padding:0 10px}@media(max-width:780px){.rule-toolbar{flex-wrap:wrap}.rule-search{order:2;flex:1 1 100%;max-width:none;width:100%;margin:0}.rule-title-line{align-items:flex-start}.rule-standard{max-width:100%;white-space:normal}}
.rule-toolbar{justify-content:space-between}.rule-filters{display:flex;align-items:center;gap:10px;min-width:0;flex:1}.rule-filters .rule-search{width:min(100%,390px);max-width:390px;flex:1 1 280px;margin:0}.rule-filters .rule-type-select{min-width:130px}.rule-filters .history-count{white-space:nowrap}.rule-toolbar>.button{flex:none}@media(max-width:950px){.rule-toolbar,.rule-filters{flex-wrap:wrap}.rule-filters .rule-search{order:0;flex:1 1 260px;max-width:none}.rule-toolbar>.button{margin-left:auto}}
.rule-filters .rule-search{background:#fff;border-color:#dce7f8}.rule-filters .rule-search:focus-within{border-color:#9bbaf5;box-shadow:0 0 0 3px rgba(35,95,214,.08)}
</style>

