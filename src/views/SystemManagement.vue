<template>
  <div class="management-page">
    <section class="management-stats"><article v-for="stat in stats" :key="stat.label" class="surface management-stat"><span class="metric-icon" :class="stat.tone"><component :is="stat.icon" :size="18" /></span><div :data-note="stat.note"><small>{{ stat.label }}</small><strong>{{ stat.value }} <em>{{ stat.unit }}</em></strong></div></article></section>
    <section class="surface management-list"><div class="management-toolbar"><div class="management-tools"><div class="admin-tabs"><button v-for="tab in tabs" :key="tab.key" class="button" :class="activeTab === tab.key ? 'button-primary' : 'button-secondary'" @click="activeTab = tab.key">{{ tab.label }}</button></div><label class="search-box"><Search :size="16" /><input v-model="keyword" type="search" :placeholder="`搜索${currentLabel}`" /></label></div><button class="button button-primary" @click="openForm()"><Plus :size="16" /> 新增{{ currentLabel.replace('管理', '') }}</button></div>
      <div class="management-table-wrap"><table class="management-table admin-table"><thead><tr><th>{{ activeTab === 'users' ? '账号 / 姓名' : activeTab === 'organizations' ? '机构名称' : activeTab === 'menus' ? '菜单名称' : '角色名称' }}</th><th>{{ activeTab === 'roles' ? '数据范围' : activeTab === 'organizations' ? '所属地市' : activeTab === 'users' ? '所属机构' : '关联视图' }}</th><th>状态</th><th>操作</th></tr></thead><tbody><tr v-for="(item, index) in filtered" :key="rowKey(item, index)"><td><strong>{{ displayName(item) }}</strong><small v-if="activeTab === 'users'" class="edition-line">{{ item[1] }}</small><small v-else-if="item.builtin" class="edition-line">系统内置</small></td><td class="admin-summary" :title="summaryOf(item)">{{ summaryOf(item) }}</td><td><span class="table-status" :class="{ inactive: statusOf(item) !== '启用' }"><span></span>{{ statusOf(item) }}</span></td><td><div class="row-actions"><button @click="detailItem = item">查看详情</button><button @click="openForm(item)">编辑</button><button v-if="activeTab === 'menus'" @click="move(item, -1)">上移</button><button v-if="activeTab === 'menus'" @click="move(item, 1)">下移</button><button @click="toggle(item)">{{ statusOf(item) === '启用' ? '停用' : '启用' }}</button><button class="danger-text" :disabled="item.builtin" @click="remove(item)">删除</button></div></td></tr></tbody></table><div v-if="!filtered.length" class="empty-state"><Settings2 :size="26" /><strong>暂无符合条件的记录</strong></div></div>
    </section>
    <div v-if="detailItem" class="modal-backdrop" @click.self="detailItem = null"><section class="management-modal" role="dialog" aria-modal="true" :aria-label="`${currentLabel}详情`"><div class="management-modal-head"><div><span class="section-kicker">系统管理 · {{ currentLabel }}</span><h2>{{ displayName(detailItem) }}</h2></div><button class="icon-button" aria-label="关闭" @click="detailItem = null"><X :size="18" /></button></div><div class="management-detail"><dl><div v-for="field in detailFields(detailItem)" :key="field.label"><dt>{{ field.label }}</dt><dd>{{ field.value || '—' }}</dd></div></dl><div class="management-modal-foot"><button class="button button-secondary" @click="detailItem = null">关闭</button><button class="button button-primary" @click="openForm(detailItem); detailItem = null">编辑</button></div></div></section></div>
    <div v-if="modal" class="modal-backdrop" @click.self="modal = false"><section class="management-modal" role="dialog" aria-modal="true" :aria-label="`编辑${currentLabel}`"><div class="management-modal-head"><div><span class="section-kicker">系统管理</span><h2>{{ editing ? '编辑' : '新增' }}{{ currentLabel.replace('管理', '') }}</h2></div><button class="icon-button" aria-label="关闭" @click="modal = false"><X :size="18" /></button></div><form class="management-form" @submit.prevent="save"><div v-if="activeTab === 'roles'" class="form-grid"><label class="form-field"><span>角色名称 *</span><input v-model="form.name" required /></label><label class="form-field"><span>数据范围</span><select v-model="form.scope"><option>全省</option><option>本机构</option></select></label><label class="form-field"><span>状态</span><select v-model="form.st"><option>启用</option><option>停用</option></select></label><label class="form-field wide"><span>说明</span><input v-model="form.desc" /></label><fieldset class="form-field wide permissions"><legend>权限模块</legend><label v-for="module in moduleLabels" :key="module"><input v-model="form.mods" type="checkbox" :value="module" />{{ module }}</label></fieldset></div>
          <div v-else-if="activeTab === 'organizations'" class="form-grid"><label class="form-field wide"><span>机构名称 *</span><input v-model="form.name" required /></label><label class="form-field"><span>所属地市 *</span><input v-model="form.city" required /></label><label class="form-field"><span>联系人</span><input v-model="form.contact" /></label><label class="form-field wide"><span>地址</span><input v-model="form.address" /></label><label class="form-field"><span>状态</span><select v-model="form.st"><option>启用</option><option>停用</option></select></label></div>
          <div v-else-if="activeTab === 'users'" class="form-grid"><label class="form-field"><span>账号 ID *</span><input v-model="form.account" :readonly="!!editing" required /></label><label class="form-field"><span>姓名 *</span><input v-model="form.name" required /></label><label class="form-field"><span>所属机构</span><select v-model="form.org"><option>省总站</option><option v-for="org in provincialState.organizations" :key="org[0]">{{ org[0] }}</option></select></label><label class="form-field"><span>角色</span><select v-model="form.role"><option v-for="role in provincialState.roles" :key="role.name">{{ role.name }}</option></select></label><label class="form-field"><span>状态</span><select v-model="form.st"><option>启用</option><option>停用</option></select></label></div>
          <div v-else class="form-grid"><label class="form-field"><span>菜单名称 *</span><input v-model="form.name" required /></label><label class="form-field"><span>关联视图</span><select v-model="form.view"><option v-for="(name, view) in moduleNames" :key="view" :value="view">{{ name }}</option></select></label><label class="form-field"><span>状态</span><select v-model="form.st"><option>启用</option><option>停用</option></select></label></div><p v-if="error" class="form-error">{{ error }}</p><div class="management-modal-foot"><button type="button" class="button button-secondary" @click="modal = false">取消</button><button class="button button-primary" type="submit">保存</button></div></form></section></div>
    <div v-if="notice" class="toast" role="status">{{ notice }}</div>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { Building2, Plus, Search, Settings2, Users, X } from 'lucide-vue-next'
import { moduleNames, provincialState } from '../state/provincialState'

const tabs = [{ key: 'roles', label: '角色管理' }, { key: 'organizations', label: '机构管理' }, { key: 'users', label: '用户管理' }]
const moduleLabels = [...new Set(Object.values(moduleNames).filter(label => label !== 'AI 核查'))]
const activeTab = ref('roles'), keyword = ref(''), modal = ref(false), editing = ref(null), detailItem = ref(null), error = ref(''), notice = ref('')
const form = reactive({})
const currentLabel = computed(() => tabs.find(tab => tab.key === activeTab.value).label)
const rows = computed(() => provincialState[activeTab.value])
const filtered = computed(() => rows.value.filter(item => !keyword.value || JSON.stringify(item).toLowerCase().includes(keyword.value.toLowerCase())))
const stats = computed(() => [
  { label: '系统角色', value: provincialState.roles.length, unit: '个', note: '可配置的数据权限角色', tone: 'indigo', icon: Settings2 },
  { label: '接入机构', value: provincialState.organizations.filter(item => item[2] === '启用').length, unit: '家', note: '当前启用的检测机构', tone: 'teal', icon: Building2 },
  { label: '用户账号', value: provincialState.users.length, unit: '个', note: '省站与机构账号合计', tone: 'amber', icon: Users }
])
function rowKey(item, index) { return activeTab.value === 'users' ? `${item[2]}:${item[0]}` : item.id || item.name || item[0] || index }
function displayName(item) { return Array.isArray(item) ? item[0] : item.name }
function summaryOf(item) { if (activeTab.value === 'roles') return item.scope; if (activeTab.value === 'organizations') return item[1]; if (activeTab.value === 'users') return item[2]; return moduleNames[item.view] || item.view }
function detailFields(item) {
  if (activeTab.value === 'roles') return [{ label: '角色名称', value: item.name }, { label: '数据范围', value: item.scope }, { label: '状态', value: item.st }, { label: '权限模块', value: item.mods.join('、') }, { label: '说明', value: item.desc }]
  if (activeTab.value === 'organizations') return [{ label: '机构名称', value: item[0] }, { label: '所属地市', value: item[1] }, { label: '状态', value: item[2] }, { label: '接入时间', value: item[3] }, { label: '联系人', value: item[4] }, { label: '地址', value: item[5] }]
  if (activeTab.value === 'users') return [{ label: '账号 ID', value: item[0] }, { label: '姓名', value: item[1] }, { label: '所属机构', value: item[2] }, { label: '角色', value: item[3] }, { label: '状态', value: item[4] }]
  return [{ label: '菜单名称', value: item.name }, { label: '关联视图', value: moduleNames[item.view] }, { label: '状态', value: item.st }, { label: '顺序', value: provincialState.menus.indexOf(item) + 1 }]
}
function statusOf(item) { return Array.isArray(item) ? item[activeTab.value === 'organizations' ? 2 : 4] : item.st }
function setStatus(item, status) { if (Array.isArray(item)) item[activeTab.value === 'organizations' ? 2 : 4] = status; else item.st = status }
function announce(text) { notice.value = text; setTimeout(() => { notice.value = '' }, 2400) }
function openForm(item = null) {
  editing.value = item; error.value = ''
  if (activeTab.value === 'roles') Object.assign(form, { name: item?.name || '', scope: item?.scope || '全省', st: item?.st || '启用', desc: item?.desc || '', mods: (item?.mods || []).map(label => moduleLabels.find(name => name.replace(/\s/g, '') === label.replace(/\s/g, '')) || label) })
  if (activeTab.value === 'organizations') Object.assign(form, { name: item?.[0] || '', city: item?.[1] || '', st: item?.[2] || '启用', contact: item?.[4] || '', address: item?.[5] || '' })
  if (activeTab.value === 'users') Object.assign(form, { account: item?.[0] || '', name: item?.[1] || '', org: item?.[2] || '省总站', role: item?.[3] || provincialState.roles[0]?.name || '', st: item?.[4] || '启用' })
  if (activeTab.value === 'menus') Object.assign(form, { name: item?.name || '', view: item?.view || 'dash', st: item?.st || '启用' })
  modal.value = true
}
function save() {
  const list = rows.value
  if (activeTab.value === 'roles') { if (!form.name.trim()) return; const data = { name: form.name.trim(), scope: form.scope, st: form.st, mods: [...form.mods], desc: form.desc, builtin: editing.value?.builtin || false }; if (editing.value) Object.assign(editing.value, data); else list.push(data) }
  if (activeTab.value === 'organizations') { if (!form.name.trim() || !form.city.trim()) return; const data = [form.name.trim(), form.city.trim(), form.st, editing.value?.[3] || new Date().toISOString().slice(0, 10), form.contact, form.address]; if (editing.value) data.forEach((value, index) => { editing.value[index] = value }); else list.push(data) }
  if (activeTab.value === 'users') { if (!form.account.trim() || !form.name.trim()) return; if (list.some(item => item !== editing.value && item[0] === form.account.trim())) { error.value = '账号 ID 已存在，请使用唯一账号'; return } const data = [form.account.trim(), form.name.trim(), form.org, form.role, form.st]; if (editing.value) data.forEach((value, index) => { editing.value[index] = value }); else list.push(data) }
  if (activeTab.value === 'menus') { if (!form.name.trim()) return; const data = { id: editing.value?.id || `m${Date.now()}`, name: form.name.trim(), view: form.view, path: `#${form.view}`, st: form.st, builtin: editing.value?.builtin || false }; if (editing.value) Object.assign(editing.value, data); else list.push(data) }
  modal.value = false; announce('配置已保存')
}
function toggle(item) { setStatus(item, statusOf(item) === '启用' ? '停用' : '启用') }
function remove(item) { if (item.builtin) return; if (window.confirm('删除这条记录？')) rows.value.splice(rows.value.indexOf(item), 1) }
function move(item, offset) { const list = provincialState.menus; const index = list.indexOf(item), next = index + offset; if (next < 0 || next >= list.length) return; list.splice(index, 1); list.splice(next, 0, item) }
</script>

<style scoped>
.admin-tabs{display:flex;flex-wrap:wrap;gap:8px}.admin-table{min-width:0}.admin-table th:first-child{width:34%}.admin-table th:nth-child(2){width:16%}.admin-table th:last-child{width:50%}.admin-table td{height:71px}.admin-table td strong{color:#40516b}.admin-table .row-actions{flex-wrap:wrap}.edition-line{display:block;margin-top:5px;color:#8b98aa;font-size:9px}.permissions{border:1px solid #e4e9f0;border-radius:10px;padding:12px;display:flex;gap:11px;flex-wrap:wrap}.permissions legend{font-size:11px;color:#40516b;font-weight:700}.permissions label{display:flex;align-items:center;gap:5px;font-size:10px;color:#68788f}
.admin-table th:first-child{width:25%}.admin-table th:nth-child(2){width:24%}.admin-table th:nth-child(3){width:14%}.admin-table th:last-child{width:37%}.admin-summary{overflow:hidden;text-overflow:ellipsis}.management-modal:has(.permissions){width:min(720px,calc(100vw - 32px))}.management-modal:has(.permissions) .form-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}.management-modal:has(.permissions) .form-grid>.form-field:first-child{grid-column:span 1}.management-modal:has(.permissions) .permissions{grid-column:1/-1;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;padding:16px}.management-modal:has(.permissions) .permissions label{min-height:38px;padding:8px 10px;border:1px solid #e6edf8;border-radius:9px;background:#f8faff;font-size:12px;color:#40516b}.management-modal:has(.permissions) .permissions input{width:16px;height:16px;accent-color:#235fd6}@media(max-width:600px){.management-modal:has(.permissions) .form-grid,.management-modal:has(.permissions) .permissions{grid-template-columns:1fr}}
</style>


