<template>
  <div class="management-page ledger-page">
    <section class="management-stats">
      <article v-for="metric in metrics" :key="metric.label" class="surface management-stat"><span class="metric-icon" :class="metric.tone"><component :is="metric.icon" :size="18" /></span><div :data-note="metric.note"><small>{{ metric.label }}</small><strong>{{ metric.value }} <em>份</em></strong></div></article>
    </section>
    <section class="surface management-list">
      <div class="card-heading"><div><span class="section-kicker">报告与资料 / 台账</span><h2>台账记录</h2></div><span class="history-count">{{ filtered.length }} / {{ records.length }} 份</span></div>
      <div class="ledger-filters">
        <label class="search-box"><Search :size="16" /><input v-model="keyword" type="search" placeholder="搜索报告、机构、文件、问题及时间" /></label>
        <select v-model="kind" aria-label="鉴定类型"><option value="all">全部类型</option><option value="house">房屋安全鉴定</option><option value="curtain">幕墙安全鉴定</option></select>
        <select v-model="organization" aria-label="检测机构"><option value="all">全部机构</option><option v-for="name in organizations" :key="name" :value="name">{{ name }}</option></select>
        <select v-model="status" aria-label="记录状态"><option value="all">全部状态</option><option value="pending">待审核</option><option value="reviewing">审核中</option><option value="reviewed">待下发</option><option value="issued">已下发</option><option value="completed">已完成</option><option value="withdrawn">已撤回</option></select>
        <label class="ledger-date">从 <input v-model="startDate" type="date" aria-label="开始日期" /></label><label class="ledger-date">至 <input v-model="endDate" type="date" aria-label="结束日期" /></label>
      </div>
      <div class="management-table-wrap"><table class="management-table ledger-table"><thead><tr><th>报告文件</th><th>鉴定类型</th><th>检测机构</th><th>提交时间</th><th>状态</th><th>操作</th></tr></thead><tbody><tr v-for="entry in filtered" :key="entry.record.id"><td><strong :title="entry.record.name">{{ entry.record.name }}</strong><small>{{ attachmentCount(entry.record) }} 份材料 · {{ recordIssues(entry.record).length }} 项问题</small></td><td>{{ entry.kind === 'house' ? '房屋安全鉴定' : '幕墙安全鉴定' }}</td><td>{{ entry.record.organization || '未标记机构' }}</td><td>{{ entry.record.time }}</td><td><span class="table-status" :class="reportStatusClass(entry.record)"><span></span>{{ statusName(entry.record) }}</span></td><td><div class="row-actions"><button @click="selected = entry">查看详情</button><button class="danger-text" @click="removeEntry(entry)">删除</button></div></td></tr></tbody></table><div v-if="!filtered.length" class="empty-state"><ClipboardList :size="26" /><strong>没有符合条件的记录</strong></div></div>
    </section>
    <div v-if="selected" class="modal-backdrop" @click.self="selected = null">
      <section class="management-modal ledger-modal" role="dialog" aria-modal="true" aria-label="台账详情">
        <div class="management-modal-head"><div><span class="section-kicker">台账详情 / {{ selected.kind === 'house' ? '房屋安全鉴定' : '幕墙安全鉴定' }}</span><h2>{{ selected.record.name }}</h2></div><button class="icon-button" type="button" aria-label="关闭" @click="selected = null"><X :size="18" /></button></div>
        <div class="management-detail ledger-detail">
          <dl><div><dt>报告编号</dt><dd>{{ selected.record.id }}</dd></div><div><dt>鉴定类型</dt><dd>{{ selected.kind === 'house' ? '房屋安全鉴定' : '幕墙安全鉴定' }}</dd></div><div><dt>检测机构</dt><dd>{{ selected.record.organization || '未标记机构' }}</dd></div><div><dt>当前版本</dt><dd>第 {{ selected.record.versions?.at(-1)?.number || 1 }} 版</dd></div><div><dt>提交时间</dt><dd>{{ selected.record.time }}</dd></div><div><dt>审核状态</dt><dd>{{ statusName(selected.record) }}</dd></div><div><dt>核查范围</dt><dd>{{ scopeName(selected.record.reviewScope) }}</dd></div><div><dt>审核完成时间</dt><dd>{{ selected.record.reviewedAt || '未记录' }}</dd></div><div><dt>下发时间</dt><dd>{{ selected.record.issuedAt || '未记录' }}</dd></div><div><dt>上传资料</dt><dd>{{ attachmentCount(selected.record) }} 份</dd></div><div v-if="provincialState.user?.role !== 'org' || selected.record.status !== 'reviewed'"><dt>审核问题</dt><dd>{{ recordIssues(selected.record).length }} 项</dd></div><div v-if="provincialState.user?.role !== 'org' || selected.record.status !== 'reviewed'"><dt>审核报告</dt><dd>{{ reviewReportLabel(selected.record) }}</dd></div></dl>
          <h3>上传资料</h3><div class="ledger-attachments"><div v-for="category in materialTypes" :key="category.key" class="ledger-attachment-group"><strong>{{ category.label }}</strong><div><button v-for="(name, index) in materialNames(selected.record, category.key)" :key="`${name}-${index}`" type="button" @click="openMaterial(category.key, index)"><FileText :size="15" /><span>{{ name }}</span><Eye :size="15" /></button><span v-if="!materialNames(selected.record, category.key).length">暂无文件</span></div></div><div v-if="(provincialState.user?.role !== 'org' || selected.record.status !== 'reviewed') && reviewReportLabel(selected.record) !== '未生成'" class="ledger-attachment-group"><strong>审核报告</strong><div><button type="button" @click="downloadReviewReport"><FileText :size="15" /><span>{{ reviewReportLabel(selected.record) }}</span><Download :size="15" /></button></div></div></div>
          <h3 v-if="provincialState.user?.role !== 'org' || selected.record.status !== 'reviewed'">问题记录 <small>{{ recordIssues(selected.record).length }} 项</small></h3><p v-if="(provincialState.user?.role !== 'org' || selected.record.status !== 'reviewed') && !recordIssues(selected.record).length">暂无审核问题</p><div v-for="issue in visibleRecordIssues(selected.record)" :key="issue.id" class="record-detail-issue"><strong>{{ issue.title }}</strong><span>第 {{ issue.page }} 页 · {{ issue.level === 'high' ? '重点关注' : '建议复核' }}</span><p v-if="issue.description">{{ issue.description }}</p><p v-if="issue.suggestion">处理建议：{{ issue.suggestion }}</p></div><div v-if="(provincialState.user?.role !== 'org' || selected.record.status !== 'reviewed') && selected.record.reviewNote" class="record-detail-note"><strong>审核备注</strong><p>{{ selected.record.reviewNote }}</p></div>
          <div class="management-modal-foot"><button class="button button-primary" type="button" @click="selected = null">关闭</button></div>
        </div>
      </section>
    </div>
    <div v-if="preview" class="modal-backdrop ledger-preview-backdrop" @click.self="closePreview"><section ref="previewPanel" class="management-modal ledger-preview-modal" role="dialog" aria-modal="true" aria-label="附件预览"><div class="management-modal-head"><div><span class="section-kicker">附件预览</span><h2>{{ preview.name }}</h2></div><div class="ledger-preview-actions"><button class="button button-secondary" type="button" @click="toggleFullscreen"><Maximize2 :size="15" /> 全屏查看</button><button class="icon-button" type="button" aria-label="关闭预览" @click="closePreview"><X :size="18" /></button></div></div><p v-if="preview.reference" class="ledger-reference-note">此 PDF 是同鉴定类型的展示参考文件，文件名与当前台账记录不一一对应。</p><iframe :src="preview.url" :title="preview.name"></iframe></section></div>
    <div v-if="notice" class="toast" role="status">{{ notice }}</div>
  </div>
</template>
<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import { CheckCircle2, ClipboardList, Download, Eye, FileText, Maximize2, Search, X } from 'lucide-vue-next'
import { auditStore, deleteAuditRecord, loadReviewReportFile, loadSubmissionFile } from '../state/auditStore'
import { provincialState } from '../state/provincialState'
import { createAuditWord } from '../utils/exportWord'
import { reportSearchText, reportStatusClass, reportStatusRank } from '../utils/reportRecords'
const keyword = ref(''), kind = ref('all'), organization = ref('all'), status = ref('all'), startDate = ref(''), endDate = ref(''), selected = ref(null), notice = ref(''), preview = ref(null), previewPanel = ref(null)
const materialTypes = [{ key: 'report', label: '鉴定报告' }, { key: 'calculation', label: '计算书' }, { key: 'original', label: '原始文件' }]
const referencePdfs = { house: { report: 'house-report.pdf', calculation: 'house-calculation.pdf', original: 'house-original.pdf' }, curtain: { report: 'curtain-report.pdf', calculation: 'curtain-calculation.pdf', original: 'curtain-original.pdf' } }
const records = computed(() => ['house', 'curtain'].flatMap(type => auditStore.records[type].filter(record => provincialState.user?.role !== 'org' || record.source === 'organization' && record.organization === provincialState.user?.org).map(record => ({ kind: type, record }))))
const organizations = computed(() => [...new Set(records.value.map(entry => entry.record.organization).filter(Boolean))].sort())
const filtered = computed(() => records.value.filter(({ kind: type, record }) => (kind.value === 'all' || kind.value === type) && (organization.value === 'all' || record.organization === organization.value) && (status.value === 'all' || (record.status || 'issued') === status.value) && (!startDate.value || record.time.slice(0, 10) >= startDate.value) && (!endDate.value || record.time.slice(0, 10) <= endDate.value) && (!keyword.value || reportSearchText(record).includes(keyword.value.trim().toLocaleLowerCase()))).sort((a, b) => reportStatusRank(a.record) - reportStatusRank(b.record) || String(b.record.time).localeCompare(String(a.record.time))))
const metrics = computed(() => [
  { label: '报告总数', value: records.value.length, note: '当前权限可见的全部记录', tone: 'indigo', icon: FileText },
  { label: '待审核', value: records.value.filter(entry => entry.record.status === 'pending').length, note: '已提交，等待省站审查', tone: 'teal', icon: ClipboardList },
  { label: '待下发', value: records.value.filter(entry => entry.record.status === 'reviewed').length, note: '审核完成，等待结果下发', tone: 'cyan', icon: ClipboardList },
  { label: '已下发', value: records.value.filter(entry => entry.record.status === 'issued' && entry.record.source === 'organization').length, note: '审核意见已送达机构，等待修正', tone: 'amber', icon: ClipboardList },
  { label: '已完成', value: records.value.filter(entry => entry.record.status === 'completed' || entry.record.source !== 'organization').length, note: '审核无误，流程结束', tone: 'cyan', icon: CheckCircle2 }
])
function attachments(record, type) { const value = record.attachments?.[type]; return Array.isArray(value) ? value : value ? [value] : [] }
function materialNames(record, type) { return type === 'report' ? [record.name] : attachments(record, type) }
function visibleRecordIssues(record) { return provincialState.user?.role === 'org' && record.status === 'reviewed' ? [] : recordIssues(record) }
function recordIssues(record) { return record.issues?.length ? record.issues : record.versions?.at(-1)?.issues || [] }
function reviewReportLabel(record) { return record.reviewReportName || (['reviewed', 'issued', 'completed'].includes(record.status) || record.source !== 'organization' ? `${record.name.replace(/\.pdf$/i, '')}_审核报告.docx` : '未生成') }
function scopeName(value) { return ({ all: '全部', general: '一般性审查', structure: '结构承载能力验算与分析智能核查', procedure: '程序及结论智能核查' })[value] || value || '未选择' }
async function openMaterial(type, index) {
  const entry = selected.value
  if (!entry) return
  closePreview()
  const name = materialNames(entry.record, type)[index]
  if (!name) return
  if (entry.record.source !== 'organization' || entry.record.demo && (type === 'report' ? entry.record.demoReportReference !== false : entry.record.referenceFiles?.[type]?.[index] !== false)) {
    preview.value = { name, url: `${import.meta.env.BASE_URL}demo-pdfs/${referencePdfs[entry.kind][type]}`, reference: true }
    return
  }
  try {
    const file = await loadSubmissionFile(entry.kind, entry.record.id, type, type === 'report' ? entry.record.versions?.at(-1)?.number || 1 : undefined, index)
    if (!file) { notice.value = '当前浏览器中找不到该附件'; return }
    preview.value = { name, url: URL.createObjectURL(file), objectUrl: true }
  } catch { notice.value = '附件读取失败' }
}
function closePreview() { if (preview.value?.objectUrl) URL.revokeObjectURL(preview.value.url); preview.value = null }
async function toggleFullscreen() { try { if (document.fullscreenElement) await document.exitFullscreen(); else await previewPanel.value?.requestFullscreen() } catch { notice.value = '当前浏览器无法进入全屏' } }
async function downloadReviewReport() {
  if (!selected.value) return
  if (selected.value.record.demo || selected.value.record.source !== 'organization') { createAuditWord({ ...selected.value.record, reviewScopeLabel: scopeName(selected.value.record.reviewScope) }, selected.value.kind === 'house' ? '房屋安全鉴定' : '幕墙安全鉴定'); return }
  try {
    const file = await loadReviewReportFile(selected.value.kind, selected.value.record)
    if (!file && ['reviewed', 'issued', 'completed'].includes(selected.value.record.status) && !selected.value.record.reviewReportName) { createAuditWord({ ...selected.value.record, reviewScopeLabel: scopeName(selected.value.record.reviewScope) }, selected.value.kind === 'house' ? '房屋安全鉴定' : '幕墙安全鉴定'); return }
    if (!file) { notice.value = '当前浏览器中找不到审核报告'; return }
    const url = URL.createObjectURL(file), link = document.createElement('a')
    link.href = url; link.download = file.name; link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  } catch { notice.value = '审核报告读取失败' }
}
onBeforeUnmount(closePreview)
function attachmentCount(record) { return 1 + attachments(record, 'calculation').length + attachments(record, 'original').length }
function statusName(record) { return record.source !== 'organization' || record.status === 'completed' ? '已完成' : ({ pending: '待审核', reviewing: '审核中', reviewed: '待下发', issued: '已下发', withdrawn: '已撤回' })[record.status] || '待审核' }
async function removeEntry(entry) {
  if (!window.confirm(`删除“${entry.record.name}”及关联资料？`)) return
  try { if (await deleteAuditRecord(entry.kind, entry.record)) { selected.value = null; notice.value = '记录及关联资料已删除'; setTimeout(() => { notice.value = '' }, 3000) } }
  catch { notice.value = '删除失败，请重试' }
}
</script>
<style scoped>
.ledger-page .management-stats{grid-template-columns:repeat(5,minmax(0,1fr))}.ledger-filters{display:flex;align-items:center;gap:9px;flex-wrap:wrap;margin:20px 0}.ledger-filters .search-box{width:min(100%,360px)}.ledger-filters select,.ledger-date{min-height:40px;padding:0 10px;border:1px solid #e2eaf6;border-radius:9px;background:#fff;color:#40516b;font-size:11px}.ledger-date{display:flex;align-items:center;gap:5px}.ledger-date input{border:0;color:#40516b;font:inherit}.ledger-table{min-width:760px}.ledger-table td:first-child{max-width:230px}.ledger-table td:first-child strong{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#30425c}.ledger-table td:first-child small{display:block;margin-top:4px;color:#8b98aa}.ledger-modal{width:min(780px,96vw)}.ledger-detail{max-height:70vh;overflow:auto}.ledger-detail h3{margin:20px 0 9px;font-size:13px;color:#30425c}.ledger-detail p{margin:6px 0;color:#60728b;font-size:11px;line-height:1.6}.ledger-attachments{display:grid;gap:9px}.ledger-attachment-group{display:grid;grid-template-columns:90px minmax(0,1fr);align-items:start;gap:10px;padding:11px 13px;border:1px solid #e5ecf8;border-radius:10px;background:#f9fbff}.ledger-attachment-group>strong{padding-top:8px;color:#425671;font-size:11px}.ledger-attachment-group>div{display:flex;gap:7px;flex-wrap:wrap}.ledger-attachment-group button{display:inline-flex;align-items:center;gap:6px;max-width:100%;padding:7px 9px;border:1px solid #d5e2f8;border-radius:8px;background:#fff;color:#235fd6;font-size:11px;cursor:pointer}.ledger-attachment-group button span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.ledger-attachment-group>div>span{color:#9ba9bc;font-size:11px}.ledger-preview-backdrop{z-index:120}.ledger-preview-modal{display:flex;flex-direction:column;width:min(1040px,96vw);height:min(85vh,850px);max-height:none}.ledger-preview-modal iframe{flex:1;min-height:0;width:100%;border:0;background:#f8faff}.ledger-preview-actions{display:flex;align-items:center;gap:8px}.ledger-preview-actions .button{min-width:0}.ledger-reference-note{padding:9px 20px;color:#8090a8;font-size:11px}.ledger-preview-modal:fullscreen{width:100vw;height:100vh;max-width:none;border-radius:0;background:#fff}@media(max-width:900px){.ledger-page .management-stats{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:560px){.ledger-page .management-stats{grid-template-columns:1fr 1fr}.ledger-attachment-group{grid-template-columns:1fr}}
</style>
