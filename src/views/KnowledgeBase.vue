<template>
  <div class="management-page">
    <section class="management-stats">
      <article class="surface management-stat"><span class="metric-icon indigo"><BookOpen :size="18" /></span><div><small>标准总数</small><strong>{{ standards.length }} <em>项</em></strong></div></article>
      <article class="surface management-stat"><span class="metric-icon teal"><CircleCheck :size="18" /></span><div><small>当前启用</small><strong>{{ activeCount }} <em>项</em></strong></div></article>
      <article class="surface management-stat"><span class="metric-icon amber"><Layers3 :size="18" /></span><div><small>覆盖类型</small><strong>{{ scopeCount }} <em>类</em></strong></div></article>
    </section>
    <section class="surface management-list">
      <div class="management-toolbar">
        <div class="management-tools">
          <label class="search-box"><Search :size="16" /><input v-model="query" type="search" placeholder="搜索标准名称或编号" /></label>
          <select v-model="scopeFilter" aria-label="适用范围"><option value="all">全部范围</option><option value="house">房屋安全鉴定</option><option value="curtain">幕墙安全鉴定</option><option value="general">通用</option></select>
          <select v-model="statusFilter" aria-label="标准状态"><option value="all">全部状态</option><option value="active">已启用</option><option value="inactive">已停用</option></select>
          <span class="history-count">共 {{ filtered.length }} 条结果</span>
        </div>
        <div class="management-list-actions"><button class="button button-primary" @click="openForm()"><Plus :size="17" /> 新增标准</button></div>
      </div>
      <div class="management-table-wrap">
        <table class="management-table"><thead><tr><th>标准名称</th><th>资料编号 / 版本</th><th>适用范围</th><th>状态</th><th>附件</th><th>更新时间</th><th>操作</th></tr></thead>
          <tbody><tr v-for="item in filtered" :key="item.id"><td><div class="management-name"><span class="table-file-icon"><BookOpen :size="17" /></span><strong :title="item.name">{{ item.name }}</strong></div></td><td><span class="code-line">{{ item.code }}</span><small class="edition-line">{{ item.edition }}</small></td><td>{{ scopeLabel[item.scope] }}</td><td><span class="table-status" :class="{ inactive: item.status !== 'active' }"><span></span>{{ item.status === 'active' ? '已启用' : '已停用' }}</span></td><td>{{ item.fileName ? 'PDF 附件' : '演示条目' }}</td><td>{{ item.updatedAt }}</td><td><div class="row-actions"><button @click="openView(item)">查看</button><button @click="openForm(item)">编辑</button><button class="danger-text" @click="openDelete(item)">删除</button></div></td></tr></tbody>
        </table>
        <div v-if="!filtered.length" class="empty-state"><BookOpen :size="26" /><strong>没有找到标准</strong><span>调整搜索词或筛选条件后重试。</span></div>
      </div>
    </section>

    <div v-if="modal" class="modal-backdrop" @click.self="modal = ''">
      <section class="management-modal" role="dialog" aria-modal="true" :aria-label="modalTitle">
        <div class="management-modal-head"><div><span class="section-kicker">知识库管理</span><h2>{{ modalTitle }}</h2></div><button class="icon-button" aria-label="关闭" @click="modal = ''"><X :size="18" /></button></div>
        <form v-if="modal === 'form'" class="management-form" @submit.prevent="submit">
          <div class="form-grid"><label class="form-field wide"><span>标准名称 <b>*</b></span><input v-model="form.name" required maxlength="80" placeholder="请输入标准或规范名称" /></label><label class="form-field"><span>资料编号 <b>*</b></span><input v-model="form.code" required maxlength="30" placeholder="例如 KB-H-004" /></label><label class="form-field"><span>版本信息</span><input v-model="form.edition" maxlength="40" placeholder="例如 2025 版" /></label><label class="form-field"><span>适用范围</span><select v-model="form.scope"><option value="house">房屋安全鉴定</option><option value="curtain">幕墙安全鉴定</option><option value="general">通用</option></select></label><label class="form-field"><span>使用状态</span><select v-model="form.status"><option value="active">启用</option><option value="inactive">停用</option></select></label></div>
          <label class="upload-field" :class="{ 'has-file': pendingFile || form.fileName }">
            <input class="upload-file-input" type="file" accept=".pdf,application/pdf" aria-label="上传标准 PDF" @change="chooseFile" />
            <span class="upload-file-icon"><FileUp :size="22" /></span>
            <span class="upload-file-copy"><strong :title="pendingFile?.name || form.fileName || ''">{{ pendingFile?.name || form.fileName || '上传标准 PDF' }}</strong><small>{{ pendingFile ? '已选择本地 PDF，保存后关联到此标准' : form.fileName ? '当前已关联 PDF，点击可替换文件' : '点击选择本地 PDF 文件' }}</small></span>
            <span class="upload-file-action">{{ pendingFile || form.fileName ? '更换文件' : '选择文件' }}</span>
          </label>
          <p class="upload-file-hint"><ShieldCheck :size="14" /> 单文件不超过 50 MB</p>
          <p v-if="formError" class="form-error">{{ formError }}</p>
          <div class="management-modal-foot"><button type="button" class="button button-secondary" @click="modal = ''">取消</button><button class="button button-primary" type="submit" :disabled="saving">{{ saving ? '保存中…' : '保存标准' }}</button></div>
        </form>
        <div v-else-if="modal === 'view'" class="management-detail"><div class="detail-title"><BookOpen :size="22" /><h3>{{ selected.name }}</h3></div><dl><div><dt>资料编号</dt><dd>{{ selected.code }}</dd></div><div><dt>版本信息</dt><dd>{{ selected.edition }}</dd></div><div><dt>适用范围</dt><dd>{{ scopeLabel[selected.scope] }}</dd></div><div><dt>使用状态</dt><dd>{{ selected.status === 'active' ? '已启用' : '已停用' }}</dd></div><div><dt>更新时间</dt><dd>{{ selected.updatedAt }}</dd></div><div><dt>PDF 附件</dt><dd>{{ selected.fileName || '无附件（演示条目）' }}</dd></div></dl><div class="management-modal-foot"><button v-if="selected.fileName" class="button button-secondary" @click="downloadAttachment"><Download :size="16" /> 下载附件</button><button class="button button-primary" @click="openForm(selected)">编辑标准</button></div></div>
        <div v-else class="delete-confirm"><div class="delete-icon"><Trash2 :size="22" /></div><h3>删除这条标准？</h3><p>{{ selected.name }}</p><span>删除后，此条目将从审核页的可用标准列表中移除。</span><div class="management-modal-foot"><button class="button button-secondary" @click="modal = ''">取消</button><button class="button button-danger" :disabled="saving" @click="confirmDelete">{{ saving ? '删除中…' : '确认删除' }}</button></div></div>
      </section>
    </div>
    <div v-if="notice" class="toast" role="status">{{ notice }}</div>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { BookOpen, CircleCheck, Download, FileUp, Layers3, Plus, Search, ShieldCheck, Trash2, X } from 'lucide-vue-next'
import { managementStore, scopeLabel, saveStandard, deleteStandard, readStandardFile } from '../state/managementStore'

const standards = computed(() => managementStore.standards)
const activeCount = computed(() => standards.value.filter(item => item.status === 'active').length)
const scopeCount = computed(() => new Set(standards.value.filter(item => item.status === 'active').map(item => item.scope)).size)
const query = ref('')
const scopeFilter = ref('all')
const statusFilter = ref('all')
const filtered = computed(() => standards.value.filter(item => {
  const text = query.value.trim().toLowerCase()
  return (!text || item.name.toLowerCase().includes(text) || item.code.toLowerCase().includes(text))
    && (scopeFilter.value === 'all' || item.scope === scopeFilter.value)
    && (statusFilter.value === 'all' || item.status === statusFilter.value)
}))
const modal = ref('')
const selected = ref(null)
const pendingFile = ref(null)
const saving = ref(false)
const formError = ref('')
const notice = ref('')
const form = reactive({ id: '', name: '', code: '', edition: '', scope: 'house', status: 'active', fileName: '' })
const modalTitle = computed(() => modal.value === 'form' ? (form.id ? '编辑标准' : '新增标准') : modal.value === 'view' ? '标准详情' : '删除标准')
let noticeTimer
function flash(text) { notice.value = text; clearTimeout(noticeTimer); noticeTimer = setTimeout(() => notice.value = '', 3800) }
function openForm(item = null) {
  Object.assign(form, { id: item?.id || '', name: item?.name || '', code: item?.code || '', edition: item?.edition || '', scope: item?.scope || 'house', status: item?.status || 'active', fileName: item?.fileName || '' })
  pendingFile.value = null
  formError.value = ''
  modal.value = 'form'
}
function openView(item) { selected.value = item; modal.value = 'view' }
function openDelete(item) { selected.value = item; modal.value = 'delete' }
function chooseFile(event) {
  const file = event.target.files?.[0]
  if (!file) return
  if ((!/\.pdf$/i.test(file.name) && file.type !== 'application/pdf') || file.size > 50 * 1024 * 1024) { formError.value = '请选择不超过 50 MB 的 PDF 文件。'; event.target.value = ''; return }
  pendingFile.value = file
  formError.value = ''
}
async function submit() {
  formError.value = ''
  if (standards.value.some(item => item.code.toLowerCase() === form.code.trim().toLowerCase() && item.id !== form.id)) { formError.value = '资料编号已存在，请更换编号。'; return }
  saving.value = true
  try { await saveStandard(form, pendingFile.value); modal.value = ''; flash('标准已保存。') }
  catch (error) { console.error(error); formError.value = '保存失败，请检查浏览器存储设置后重试。' }
  finally { saving.value = false }
}
async function confirmDelete() {
  saving.value = true
  try { await deleteStandard(selected.value.id); modal.value = ''; flash('标准已删除。') }
  catch (error) { console.error(error); flash('删除失败，请重试。') }
  finally { saving.value = false }
}
async function downloadAttachment() {
  try {
    const file = await readStandardFile(selected.value.id)
    if (!file) return flash('附件未找到，请重新上传。')
    const url = URL.createObjectURL(file)
    const link = document.createElement('a')
    link.href = url
    link.download = selected.value.fileName
    document.body.appendChild(link)
    link.click()
    link.remove()
    setTimeout(() => URL.revokeObjectURL(url), 60000)
  } catch (error) { console.error(error); flash('附件读取失败。') }
}
</script>
