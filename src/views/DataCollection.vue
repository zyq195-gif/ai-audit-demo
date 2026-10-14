<template>
  <div class="management-page">
    <section class="management-stats">
      <article v-for="stat in stats" :key="stat.label" class="surface management-stat"><span class="metric-icon" :class="stat.tone"><component :is="stat.icon" :size="18" /></span><div :data-note="stat.note"><small>{{ stat.label }}</small><strong>{{ stat.value }} <em>项</em></strong></div></article>
    </section>
    <section class="surface management-list">
      <div class="card-heading collection-heading"><div><span class="section-kicker">01 / 数据采集</span><h2>采集任务列表</h2></div><span class="history-count">共 {{ filtered.length }} 条结果</span></div>
      <div class="management-toolbar"><div class="management-tools"><label class="search-box"><Search :size="16" /><input v-model="keyword" type="search" placeholder="搜索任务编号、报告、工程、机构或参数" /></label><select v-model="typeFilter" aria-label="检测类型"><option value="">全部类型</option><option>室内</option><option>现场</option></select><select v-model="statusFilter" aria-label="任务状态"><option value="">全部状态</option><option>待下发</option><option>已下发</option><option>已上传</option></select></div><div v-if="isProvince" class="management-list-actions"><button class="button button-secondary" @click="importModal = true"><FileUp :size="16" /> 导入任务</button><button class="button button-primary" @click="openTask"><Plus :size="17" /> 新增任务</button></div></div>
      <div class="management-table-wrap"><table class="management-table collection-table"><thead><tr><th>任务 / 报告编号</th><th>工程项目</th><th>检测机构</th><th>状态 / 初筛</th><th>操作</th></tr></thead><tbody><tr v-for="row in filtered" :key="row.no + row.report"><td><div class="management-name"><span class="table-file-icon"><ClipboardList :size="17" /></span><strong>{{ row.no }}<small>{{ row.report }}</small></strong></div></td><td class="truncate-cell" :title="row.project">{{ row.project }}</td><td class="truncate-cell" :title="row.org">{{ row.org }}</td><td><span class="table-status" :class="{ inactive: row.status === '待下发' }"><span></span>{{ row.status }}</span><small class="edition-line">{{ row.screening === 'pass' ? '初筛通过' : row.screening === 'warn' ? '初筛异常' : '未初筛' }}</small></td><td><div class="row-actions"><button @click="detailRow = row">查看详情</button><button v-if="isProvince && row.status === '待下发'" @click="dispatchTask(row.task)">下发</button><button v-if="!isProvince && row.status === '已下发'" @click="openUpload(row)">上传附件</button><button v-if="row.status === '已上传'" @click="openUpload(row)">查看附件</button></div></td></tr></tbody></table><div v-if="!filtered.length" class="empty-state"><ClipboardList :size="26" /><strong>暂无符合条件的任务</strong></div></div>
    </section>

    <div v-if="detailRow" class="modal-backdrop" @click.self="detailRow = null"><section class="management-modal" role="dialog" aria-modal="true" aria-label="采集任务详情"><div class="management-modal-head"><div><span class="section-kicker">{{ detailRow.no }} · {{ detailRow.report }}</span><h2>采集任务详情</h2></div><button class="icon-button" aria-label="关闭" @click="detailRow = null"><X :size="18" /></button></div><div class="management-detail"><dl><div><dt>工程项目</dt><dd>{{ detailRow.project }}</dd></div><div><dt>检测机构</dt><dd>{{ detailRow.org }}</dd></div><div><dt>检测类型</dt><dd>{{ detailRow.type }}</dd></div><div><dt>检测参数</dt><dd>{{ detailRow.param }}</dd></div><div><dt>任务状态</dt><dd>{{ detailRow.status }}</dd></div><div><dt>下发时间</dt><dd>{{ detailRow.sentAt || '—' }}</dd></div><div><dt>采集时间</dt><dd>{{ detailRow.collectedAt || '—' }}</dd></div><div><dt>初筛结果</dt><dd>{{ detailRow.screening === 'pass' ? '通过' : detailRow.screening === 'warn' ? '异常' : '未初筛' }}</dd></div><div v-if="detailRow.anomaly"><dt>异常说明</dt><dd>{{ detailRow.anomalyDetail }}</dd></div><div v-if="detailRow.task?.due"><dt>截止日期</dt><dd>{{ detailRow.task.due }}</dd></div><div v-if="detailRow.task?.memo"><dt>任务说明</dt><dd>{{ detailRow.task.memo }}</dd></div></dl><div class="management-modal-foot"><button v-if="detailRow.screening === 'warn'" class="button button-secondary" @click="anomalyRow = detailRow; detailRow = null">异常情况</button><button v-if="detailRow.status === '已上传'" class="button button-primary" @click="openUpload(detailRow); detailRow = null">查看附件</button><button class="button button-secondary" @click="detailRow = null">关闭</button></div></div></section></div>
    <div v-if="taskModal" class="modal-backdrop" @click.self="taskModal = false"><section class="management-modal" role="dialog" aria-modal="true" aria-label="新增采集任务"><div class="management-modal-head"><div><span class="section-kicker">数据采集</span><h2>新增采集任务</h2></div><button class="icon-button" aria-label="关闭" @click="taskModal = false"><X :size="18" /></button></div><form class="management-form" @submit.prevent="saveTask"><div class="form-grid"><label class="form-field"><span>工程项目 *</span><input v-model="taskForm.proj" required /></label><label class="form-field"><span>检测机构 *</span><select v-model="taskForm.org" required><option v-for="org in organizationNames" :key="org">{{ org }}</option></select></label><label class="form-field"><span>报告编号</span><input v-model="taskForm.rno" placeholder="留空自动生成" /></label><label class="form-field"><span>检测类型</span><select v-model="taskForm.type"><option>室内</option><option>现场</option></select></label><label class="form-field"><span>检测参数 *</span><select v-model="taskForm.param" required><option v-for="param in taskForm.type === '室内' ? ['混凝土抗压强度', '钢筋拉伸'] : ['桩基检测']" :key="param">{{ param }}</option></select></label><label class="form-field"><span>截止日期</span><input v-model="taskForm.due" type="date" /></label><label class="form-field wide"><span>任务说明</span><input v-model="taskForm.memo" /></label></div><div class="management-modal-foot"><button type="button" class="button button-secondary" @click="taskModal = false">取消</button><button class="button button-primary" type="submit">保存任务</button></div></form></section></div>

    <div v-if="importModal" class="modal-backdrop" @click.self="importModal = false"><section class="management-modal" role="dialog" aria-modal="true" aria-label="导入采集任务"><div class="management-modal-head"><div><span class="section-kicker">数据采集</span><h2>批量导入任务</h2></div><button class="icon-button" aria-label="关闭" @click="importModal = false"><X :size="18" /></button></div><div class="management-form"><p class="helper">支持 CSV、制表符或分号分隔的数据。列顺序：检测机构、检测类型、报告编号、工程/委托、检测参数、上报时限、备注。</p><input type="file" accept=".csv,text/csv,text/plain" @change="readImportFile" /><textarea v-model="importText" class="import-area" placeholder="检测机构,检测类型,报告编号,工程/委托,检测参数,上报时限,备注"></textarea><p v-if="importError" class="form-error">{{ importError }}</p><div class="management-modal-foot"><button class="button button-secondary" @click="downloadTemplate">下载模板</button><button class="button button-primary" @click="importTasks">导入任务</button></div></div></section></div>

    <div v-if="uploadRow" class="modal-backdrop" @click.self="uploadRow = null"><section class="management-modal upload-modal" role="dialog" aria-modal="true" aria-label="采集附件"><div class="management-modal-head"><div><span class="section-kicker">{{ uploadRow.report }}</span><h2>{{ uploadRow.project }} · 采集附件</h2></div><button class="icon-button" aria-label="关闭" @click="uploadRow = null"><X :size="18" /></button></div><div class="management-form"><div v-for="category in categories" :key="category.name" class="attachment-section"><div class="attachment-title"><strong>{{ category.name }}</strong><small>{{ category.hint }}</small></div><label v-if="canUpload" class="attachment-picker"><FileUp :size="17" /><span>选择{{ category.name }}文件</span><input type="file" multiple :accept="category.accept" @change="chooseAttachments($event, category.name)" /></label><ul><li v-for="(file, index) in attachments(category.name)" :key="file.name + index"><FileText :size="16" /><span>{{ file.name }}</span><small>{{ formatSize(file.size) }}</small><button v-if="canUpload" type="button" aria-label="移除附件" @click="removeAttachment(category.name, index)"><X :size="14" /></button></li></ul><p v-if="!attachments(category.name).length" class="helper">暂无{{ category.name }}附件</p></div><p v-if="uploadError" class="form-error">{{ uploadError }}</p><div class="management-modal-foot"><button class="button button-secondary" @click="uploadRow = null">关闭</button><button v-if="canUpload" class="button button-primary" @click="finishUpload">提交上报</button></div></div></section></div>

    <div v-if="anomalyRow" class="modal-backdrop" @click.self="anomalyRow = null"><section class="management-modal" role="dialog" aria-modal="true" aria-label="初筛异常情况"><div class="management-modal-head"><div><span class="section-kicker">{{ anomalyRow.report }}</span><h2>初筛异常情况</h2></div><button class="icon-button" aria-label="关闭" @click="anomalyRow = null"><X :size="18" /></button></div><div class="management-detail"><dl><div><dt>工程项目</dt><dd>{{ anomalyRow.project }}</dd></div><div><dt>检测机构</dt><dd>{{ anomalyRow.org }}</dd></div><div><dt>检测类型</dt><dd>{{ anomalyRow.type }} · {{ anomalyRow.param }}</dd></div><div><dt>异常类型</dt><dd>{{ anomalyNames[anomalyRow.anomaly] || '其他异常' }}</dd></div><div><dt>异常说明</dt><dd>{{ anomalyRow.anomalyDetail }}</dd></div></dl><div class="management-modal-foot"><button class="button button-secondary" @click="anomalyRow = null">关闭</button><button v-if="isProvince" class="button button-primary" @click="pushAnomaly">推送整改</button></div></div></section></div>
    <div v-if="notice" class="toast" role="status">{{ notice }}</div>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { ClipboardList, FileText, FileUp, Plus, Search, ShieldCheck, TriangleAlert, X } from 'lucide-vue-next'
import { activeOrganizationNames, addTask, anomalyNames, attachFiles, attachmentBucket, collectionRows, dispatchTask, provincialState, pushScreeningAnomaly, submitCollection } from '../state/provincialState'

const isProvince = computed(() => provincialState.user.role === 'prov')
const organizationNames = computed(activeOrganizationNames)
const rows = computed(collectionRows)
const keyword = ref(''), typeFilter = ref(''), statusFilter = ref('')
const filtered = computed(() => rows.value.filter(row => (!typeFilter.value || row.type === typeFilter.value) && (!statusFilter.value || row.status === statusFilter.value) && (!keyword.value || [row.no, row.report, row.project, row.org, row.param].join(' ').toLowerCase().includes(keyword.value.trim().toLowerCase()))))
const stats = computed(() => [
  { label: '室内采集任务', value: rows.value.filter(row => row.type === '室内').length, note: '室内检测类型任务', tone: 'indigo', icon: ClipboardList },
  { label: '现场采集任务', value: rows.value.filter(row => row.type === '现场').length, note: '现场检测类型任务', tone: 'teal', icon: ShieldCheck },
  { label: '初筛通过', value: rows.value.filter(row => row.screening === 'pass').length, note: '资料初筛结果为通过', tone: 'amber', icon: TriangleAlert }
])
const taskModal = ref(false), importModal = ref(false), uploadRow = ref(null), anomalyRow = ref(null), detailRow = ref(null), notice = ref(''), uploadError = ref(''), importError = ref(''), importText = ref('')
const taskForm = reactive({ proj: '', org: organizationNames.value[0] || '', rno: '', type: '室内', param: '混凝土抗压强度', due: '', memo: '' })
watch(() => taskForm.type, type => { taskForm.param = type === '现场' ? '桩基检测' : '混凝土抗压强度' })
const categories = [{ name: '视频', hint: 'MP4、AVI、MOV', accept: '.mp4,.avi,.mov,video/*' }, { name: '记录', hint: 'XLS、XLSX、PDF', accept: '.xls,.xlsx,.pdf' }, { name: '报告', hint: 'PDF、DOC、DOCX', accept: '.pdf,.doc,.docx' }]
const canUpload = computed(() => provincialState.user.role === 'org' && uploadRow.value?.status === '已下发')
function announce(message) { notice.value = message; setTimeout(() => { notice.value = '' }, 2500) }
function openTask() { Object.assign(taskForm, { proj: '', org: organizationNames.value[0] || '', rno: '', type: '室内', param: '混凝土抗压强度', due: '', memo: '' }); taskModal.value = true }
function saveTask() {
  if (!taskForm.proj.trim() || !taskForm.param.trim() || !taskForm.org) return
  const report = taskForm.rno.trim().toUpperCase()
  if (report && (provincialState.tasks.some(item => item.rno === report) || provincialState.collects.some(item => item[6] === report))) { announce('报告编号已存在，请更换编号'); return }
  addTask({ ...taskForm, rno: report }); taskModal.value = false; announce('任务已创建，可在列表中下发')
}
function openUpload(row) { uploadRow.value = row; uploadError.value = '' }
function attachments(category) { return uploadRow.value ? attachmentBucket(uploadRow.value)[category] || [] : [] }
function chooseAttachments(event, category) {
  const files = [...event.target.files]
  const valid = files.filter(file => file.size <= 100 * 1024 * 1024)
  if (valid.length !== files.length) uploadError.value = '单文件不能超过 100 MB'
  attachFiles(uploadRow.value, category, valid)
  event.target.value = ''
}
function removeAttachment(category, index) { provincialState.uploads[uploadRow.value.report] ||= JSON.parse(JSON.stringify(attachmentBucket(uploadRow.value))); provincialState.uploads[uploadRow.value.report][category].splice(index, 1) }
function finishUpload() { if (!submitCollection(uploadRow.value)) { uploadError.value = '请先上传至少 1 个文件'; return } uploadRow.value = null; announce('采集材料已上报并完成初筛') }
function pushAnomaly() { pushScreeningAnomaly(anomalyRow.value); const name = anomalyRow.value.project; anomalyRow.value = null; announce(`已将「${name}」的初筛异常推送至检测机构`) }
function formatSize(size) { return size >= 1048576 ? (size / 1048576).toFixed(1) + ' MB' : (size / 1024).toFixed(1) + ' KB' }
function readImportFile(event) { const file = event.target.files?.[0]; if (file) file.text().then(text => { importText.value = text }) }
function splitLine(line) {
  const separators = [',', '\t', ';'], separator = separators.sort((a, b) => line.split(b).length - line.split(a).length)[0]
  const cells = []; let cell = '', quoted = false
  for (let i = 0; i < line.length; i++) { const char = line[i]; if (char === '"') { if (quoted && line[i + 1] === '"') { cell += '"'; i++ } else quoted = !quoted } else if (char === separator && !quoted) { cells.push(cell.trim()); cell = '' } else cell += char }
  cells.push(cell.trim()); return cells
}
function parseCSV(text) { return text.replace(/^\ufeff/, '').split(/\r?\n/).map(line => line.trim()).filter(Boolean).map(splitLine) }
const aliases = { 混凝土抗压: '混凝土抗压强度', 抗压强度: '混凝土抗压强度', 混凝土抗压强度试验: '混凝土抗压强度', 砼抗压强度: '混凝土抗压强度', 钢筋及连接件拉伸: '钢筋拉伸', 钢筋及其连接件拉伸试验: '钢筋拉伸', 钢筋拉伸试验: '钢筋拉伸', 桩基静载: '桩基检测', 桩基低应变: '桩基检测', 低应变: '桩基检测', 静载试验: '桩基检测' }
function importTasks() {
  const records = parseCSV(importText.value).filter((row, index) => !(index === 0 && row[0].includes('检测机构')))
  if (!records.length) { importError.value = '没有可导入的记录'; return }
  const tasks = records.map(row => ({ org: row[0] || '', type: ({ 室内检测: '室内', 现场检测: '现场' })[row[1]] || row[1] || '', rno: (row[2] || '').toUpperCase(), proj: row[3] || '', param: aliases[row[4]] || row[4] || '', due: row[5] || '', memo: row[6] || '' }))
  const seen = new Set(), invalid = []
  tasks.forEach((task, index) => {
    const allowed = task.type === '现场' ? ['桩基检测'] : ['混凝土抗压强度', '钢筋拉伸']
    const key = task.rno + '|' + task.proj
    if (!organizationNames.value.includes(task.org) || !['室内', '现场'].includes(task.type) || !task.proj || !allowed.includes(task.param) || !/^[A-Z0-9_-]{4,}$/.test(task.rno) || (task.due && !/^\d{4}-\d{1,2}-\d{1,2}$/.test(task.due)) || seen.has(key) || provincialState.tasks.some(item => item.rno === task.rno && item.proj === task.proj)) invalid.push(index + 1)
    seen.add(key)
  })
  if (invalid.length) { importError.value = `第 ${invalid.join('、')} 行数据无效或重复，请核对机构、检测类型、编号和参数`; return }
  tasks.forEach(addTask)
  importModal.value = false; importText.value = ''; importError.value = ''; announce(`已导入 ${tasks.length} 条任务`)
}
function downloadTemplate() { const blob = new Blob(['\ufeff检测机构,检测类型,报告编号,工程/委托,检测参数,上报时限,备注\n'], { type: 'text/csv;charset=utf-8' }); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = '采集任务导入模板.csv'; link.click(); URL.revokeObjectURL(link.href) }
</script>

<style scoped>
.collection-heading{margin-bottom:21px}.management-name strong{display:flex;flex-direction:column;gap:5px}.management-name small{font-size:9px;color:#8b98aa;font-weight:500}.collection-table{min-width:0}.collection-table th:first-child{width:22%}.collection-table th:nth-child(2){width:22%}.collection-table th:nth-child(3){width:20%}.collection-table th:nth-child(4){width:16%}.collection-table th:last-child{width:20%}.collection-table td{height:78px}.truncate-cell{overflow:hidden;text-overflow:ellipsis}.row-actions{justify-content:center;flex-wrap:wrap}.upload-modal{width:min(680px,100%)}.attachment-section{padding:12px 0;border-bottom:1px solid #eaf0ff}.attachment-title{display:flex;justify-content:space-between;align-items:center;font-size:12px;color:#40516b}.attachment-title small,.helper{font-size:10px;color:#8b98aa}.attachment-picker{display:inline-flex;align-items:center;gap:7px;margin:12px 0;padding:10px 13px;border:1px dashed #b9cff6;border-radius:10px;color:#235fd6;background:#f9fbff;font-size:11px;font-weight:700;cursor:pointer}.attachment-picker input{display:none}.attachment-section ul{list-style:none;padding:0;margin:0}.attachment-section li{display:flex;align-items:center;gap:8px;padding:6px 0;font-size:10px;color:#40516b}.attachment-section li span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.attachment-section li small{margin-left:auto;color:#8b98aa}.attachment-section li button{background:none;border:0;color:#8b98aa}.import-area{width:100%;min-height:170px;padding:12px;border:1px solid #e4e9f0;border-radius:10px;resize:vertical;font:inherit;font-size:11px;color:#40516b}.management-form>input[type=file]{display:block;margin:12px 0;font-size:11px}
</style>
