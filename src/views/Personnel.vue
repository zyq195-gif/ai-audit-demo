<template>
  <div class="management-page">
    <section class="management-stats">
      <article class="surface management-stat"><span class="metric-icon indigo"><Users :size="18" /></span><div><small>人员总数</small><strong>{{ people.length }} <em>人</em></strong></div></article>
      <article class="surface management-stat"><span class="metric-icon teal"><UserCheck :size="18" /></span><div><small>在岗人员</small><strong>{{ activeCount }} <em>人</em></strong></div></article>
      <article class="surface management-stat"><span class="metric-icon amber"><Building2 :size="18" /></span><div><small>所属部门</small><strong>{{ departmentCount }} <em>个</em></strong></div></article>
    </section>
    <section class="surface management-list">
      <div class="management-toolbar">
        <div class="management-tools">
          <label class="search-box"><Search :size="16" /><input v-model="query" type="search" placeholder="搜索姓名、部门或岗位" /></label>
          <select v-model="statusFilter" aria-label="人员状态"><option value="all">全部状态</option><option value="active">在岗</option><option value="inactive">停工</option></select>
          <span class="history-count">共 {{ filtered.length }} 条结果</span>
        </div>
        <div class="management-list-actions"><button class="button button-primary" @click="openForm()"><Plus :size="17" /> 新增人员</button></div>
      </div>
      <div class="management-table-wrap">
        <table class="management-table personnel-table"><thead><tr><th>姓名</th><th>所属部门</th><th>岗位</th><th>联系电话</th><th>状态</th><th>更新时间</th><th>操作</th></tr></thead>
          <tbody><tr v-for="item in filtered" :key="item.id"><td><div class="management-name"><span class="person-avatar">{{ item.name.slice(0, 1) }}</span><strong>{{ item.name }}</strong></div></td><td>{{ item.department }}</td><td>{{ item.role }}</td><td>{{ item.phone || '未填写' }}</td><td><span class="table-status" :class="{ inactive: item.status !== 'active' }"><span></span>{{ item.status === 'active' ? '在岗' : '停工' }}</span></td><td>{{ item.updatedAt }}</td><td><div class="row-actions"><button @click="openView(item)">查看</button><button @click="openForm(item)">编辑</button><button class="danger-text" @click="openDelete(item)">删除</button></div></td></tr></tbody>
        </table>
        <div v-if="!filtered.length" class="empty-state"><Users :size="26" /><strong>没有找到人员</strong><span>调整搜索词或筛选条件后重试。</span></div>
      </div>
    </section>

    <div v-if="modal" class="modal-backdrop" @click.self="modal = ''">
      <section class="management-modal" role="dialog" aria-modal="true" :aria-label="modalTitle">
        <div class="management-modal-head"><div><span class="section-kicker">人员管理</span><h2>{{ modalTitle }}</h2></div><button class="icon-button" aria-label="关闭" @click="modal = ''"><X :size="18" /></button></div>
        <form v-if="modal === 'form'" class="management-form" @submit.prevent="submit">
          <div class="form-grid"><label class="form-field"><span>姓名 <b>*</b></span><input v-model="form.name" required maxlength="30" placeholder="请输入姓名" /></label><label class="form-field"><span>所属部门 <b>*</b></span><input v-model="form.department" required maxlength="40" placeholder="请输入部门" /></label><label class="form-field"><span>岗位 <b>*</b></span><input v-model="form.role" required maxlength="40" placeholder="请输入岗位" /></label><label class="form-field"><span>联系电话</span><input v-model="form.phone" type="tel" maxlength="30" placeholder="选填" /></label><label class="form-field"><span>人员状态</span><select v-model="form.status"><option value="active">在岗</option><option value="inactive">停工</option></select></label></div>
          <p v-if="formError" class="form-error">{{ formError }}</p>
          <div class="management-modal-foot"><button type="button" class="button button-secondary" @click="modal = ''">取消</button><button class="button button-primary" type="submit">保存人员</button></div>
        </form>
        <div v-else-if="modal === 'view'" class="management-detail"><div class="detail-title"><span class="person-avatar">{{ selected.name.slice(0, 1) }}</span><h3>{{ selected.name }}</h3></div><dl><div><dt>所属部门</dt><dd>{{ selected.department }}</dd></div><div><dt>岗位</dt><dd>{{ selected.role }}</dd></div><div><dt>联系电话</dt><dd>{{ selected.phone || '未填写' }}</dd></div><div><dt>人员状态</dt><dd>{{ selected.status === 'active' ? '在岗' : '停工' }}</dd></div><div><dt>更新时间</dt><dd>{{ selected.updatedAt }}</dd></div></dl><div class="management-modal-foot"><button class="button button-primary" @click="openForm(selected)">编辑人员</button></div></div>
        <div v-else class="delete-confirm"><div class="delete-icon"><Trash2 :size="22" /></div><h3>删除这名人员？</h3><p>{{ selected.name }} · {{ selected.department }}</p><span>此操作会从当前浏览器的演示人员清单中移除该记录。</span><div class="management-modal-foot"><button class="button button-secondary" @click="modal = ''">取消</button><button class="button button-danger" @click="confirmDelete">确认删除</button></div></div>
      </section>
    </div>
    <div v-if="notice" class="toast" role="status">{{ notice }}</div>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { Building2, Plus, Search, Trash2, UserCheck, Users, X } from 'lucide-vue-next'
import { managementStore, savePerson, deletePerson } from '../state/managementStore'

const people = computed(() => managementStore.people)
const activeCount = computed(() => people.value.filter(item => item.status === 'active').length)
const departmentCount = computed(() => new Set(people.value.map(item => item.department)).size)
const query = ref('')
const statusFilter = ref('all')
const filtered = computed(() => people.value.filter(item => {
  const text = query.value.trim().toLowerCase()
  return (!text || [item.name, item.department, item.role].some(value => value.toLowerCase().includes(text)))
    && (statusFilter.value === 'all' || item.status === statusFilter.value)
}))
const modal = ref('')
const selected = ref(null)
const formError = ref('')
const notice = ref('')
const form = reactive({ id: '', name: '', department: '', role: '', phone: '', status: 'active' })
const modalTitle = computed(() => modal.value === 'form' ? (form.id ? '编辑人员' : '新增人员') : modal.value === 'view' ? '人员详情' : '删除人员')
let noticeTimer
function flash(text) { notice.value = text; clearTimeout(noticeTimer); noticeTimer = setTimeout(() => notice.value = '', 3800) }
function openForm(item = null) {
  Object.assign(form, { id: item?.id || '', name: item?.name || '', department: item?.department || '', role: item?.role || '', phone: item?.phone || '', status: item?.status || 'active' })
  formError.value = ''
  modal.value = 'form'
}
function openView(item) { selected.value = item; modal.value = 'view' }
function openDelete(item) { selected.value = item; modal.value = 'delete' }
function submit() {
  formError.value = ''
  if (!form.name.trim() || !form.department.trim() || !form.role.trim()) { formError.value = '请填写姓名、部门和岗位。'; return }
  try { savePerson(form); modal.value = ''; flash('人员信息已保存。') }
  catch (error) { console.error(error); formError.value = '保存失败，请检查浏览器存储设置。' }
}
function confirmDelete() {
  try { deletePerson(selected.value.id); modal.value = ''; flash('人员已删除。') }
  catch (error) { console.error(error); flash('删除失败，请重试。') }
}
</script>
