<template>
  <div class="dashboard organization-collection">
    <section class="metrics-grid" :aria-label="`${pageTitle}概览`">
      <article v-for="metric in metrics" :key="metric.label" class="metric-card surface" :class="metric.tone">
        <div class="metric-top"><span>{{ metric.label }}</span><span class="metric-icon" :class="metric.tone"><component :is="metric.icon" :size="18" /></span></div>
        <div class="metric-value">{{ metric.value }}<small>{{ metric.unit }}</small></div>
        <div class="metric-note"><span class="metric-mini-dot" :class="metric.tone"></span>{{ metric.note }}</div>
      </article>
    </section>

    <div class="content-grid">
      <section class="work-card surface">
        <div class="card-heading"><div><span class="section-kicker">01 / 审核流程</span><h2>报告工作区</h2></div><span class="state-pill" :class="activeRow?.status === '已上传' ? 'completed' : 'idle'">{{ activeRow?.status || '未上传' }}</span></div>
        <div class="stepper" aria-label="上报步骤"><div v-for="(step, index) in steps" :key="step" class="step" :class="{ done: stepIndex > index, active: stepIndex === index }"><span class="step-number"><Check v-if="stepIndex > index" :size="13" />{{ stepIndex > index ? '' : String(index + 1).padStart(2, '0') }}</span><span>{{ step }}</span></div></div>
        <label class="org-task-select"><span>选择{{ pageTitle }}任务</span><select v-model="selectedReport"><option value="">请选择已下发任务</option><option v-for="row in rows" :key="row.report" :value="row.report">{{ row.project }} · {{ row.report }}（{{ row.status }}）</option></select></label>

        <div class="intake-panel">
          <div class="intake-heading"><div><strong>{{ activeRow?.project || '上传鉴定资料' }}</strong><span>{{ activeRow ? `${activeRow.report} · ${activeRow.type}检测 · ${activeRow.param}` : '请选择任务，再上传检测视频、原始记录和检测报告' }}</span></div><span class="intake-count">{{ uploadedCount }}/3 类已选择</span></div>
          <div class="materials-grid">
            <button v-for="material in materials" :key="material.key" type="button" class="material-card" :class="{ uploaded: filesFor(material.key).length, dragging: dragging === material.key }" :disabled="!canUpload" @click="openPicker(material.key)" @dragover.prevent="dragging = material.key" @dragleave.prevent="dragging = ''" @drop.prevent="dropFiles($event, material.key)">
              <span class="material-icon"><component :is="material.icon" :size="21" /></span><span class="material-title">{{ material.label }} <em>{{ material.format }}</em></span><span class="material-name">{{ filesFor(material.key).length ? `${filesFor(material.key).length} 个文件 · ${filesFor(material.key)[0].name}` : material.hint }}</span><span class="material-action">{{ !activeRow ? '选择任务后上传' : canUpload ? filesFor(material.key).length ? '继续添加' : '选择文件' : '已上报' }} <ArrowUpRight :size="14" /></span>
            </button>
          </div>
          <div v-if="uploadedCount" class="uploaded-list"><div v-for="material in materials" :key="material.key"><div v-for="(file, index) in filesFor(material.key)" :key="file.name + index" class="uploaded-row"><FileText :size="15" /><span :title="file.name">{{ file.name }}</span><small>{{ material.label }} · {{ fileSize(file.size) }}</small><button v-if="canUpload" type="button" :aria-label="`移除${file.name}`" @click="removeFile(material.key, index)"><X :size="14" /></button></div></div></div>
          <p class="intake-limit"><ShieldCheck :size="14" /> 单文件不超过 100 MB；视频、原始记录与报告分别上传</p>
          <div class="intake-footer"><span>{{ !activeRow ? '选择任务后即可上传资料。' : canUpload ? '选择资料后提交上报，初筛结果将显示在记录中。' : activeRow.status === '已上传' ? `已于 ${activeRow.collectedAt} 上报` : '请选择已下发任务上传资料。' }}</span><button class="button button-primary" type="button" :disabled="!canUpload || !uploadedCount" @click="submit"><Send :size="15" /> 提交上报</button></div>
        </div>
      </section>

      <div class="side-stack">
        <section class="insights-card surface task-side-card"><div class="card-heading compact"><div><span class="section-kicker">02 / 数据洞察</span><h2>任务分布</h2></div><span class="card-corner-icon"><ClipboardList :size="17" /></span></div><div class="org-donut-wrap"><div class="org-donut" :style="donutStyle"><div><strong>{{ rows.length }}</strong><small>任务总数</small></div></div></div><div class="chart-legend org-legend"><span><i style="background:#235fd6"></i>已上报<b>{{ uploadedRows.length }}</b></span><span><i style="background:#a9c4f4"></i>待上传<b>{{ pendingRows.length }}</b></span></div></section>
        <section class="standards-card surface"><div class="standards-card-head"><span class="focus-icon"><Info :size="19" /></span><div><span class="section-kicker">当前任务</span><h3>{{ activeRow?.project || '请选择任务' }}</h3></div></div><dl class="task-facts"><div><dt>检测机构</dt><dd>{{ provincialState.user.org }}</dd></div><div><dt>检测参数</dt><dd>{{ activeRow?.param || '—' }}</dd></div><div><dt>下发时间</dt><dd>{{ activeRow?.sentAt || '—' }}</dd></div><div><dt>截止日期</dt><dd>{{ activeRow?.task?.due || '—' }}</dd></div><div><dt>初筛结果</dt><dd>{{ activeRow?.screening === 'pass' ? '通过' : activeRow?.screening === 'warn' ? '异常' : '未初筛' }}</dd></div></dl><p v-if="activeRow?.task?.memo" class="task-memo">{{ activeRow.task.memo }}</p><p v-if="activeRow?.screening === 'warn'" class="task-memo anomaly-note">{{ activeRow.anomalyDetail }}</p></section>
      </div>
    </div>

    <section class="history-card surface"><div class="card-heading history-heading"><div><span class="section-kicker">03 / 历史记录</span><h2>近期鉴定记录</h2></div><span class="history-count">共 {{ rows.length }} 条任务</span></div><div class="history-table-wrap"><table class="history-table org-history-table"><thead><tr><th>任务 / 报告编号</th><th>工程项目</th><th>状态</th><th>初筛结果</th><th>操作</th></tr></thead><tbody><tr v-for="row in rows" :key="row.no + row.report"><td><div class="table-file"><span class="table-file-icon"><FileText :size="17" /></span><div><strong>{{ row.no }}</strong><small>{{ row.report }}</small></div></div></td><td class="org-project" :title="row.project">{{ row.project }}</td><td><span class="table-status" :class="{ inactive: row.status !== '已上传' }"><span></span>{{ row.status }}</span></td><td>{{ row.screening === 'pass' ? '通过' : row.screening === 'warn' ? '异常' : '—' }}</td><td><button class="text-action" @click="selectRow(row)">{{ row.status === '已上传' ? '查看资料' : '上传资料' }} <ArrowUpRight :size="14" /></button></td></tr></tbody></table><div v-if="!rows.length" class="empty-state"><ClipboardList :size="26" /><strong>暂无鉴定记录</strong></div></div></section>
    <input ref="fileInput" class="visually-hidden" type="file" multiple :accept="fileAccept" @change="chooseFiles" />
    <div v-if="notice" class="toast" role="status">{{ notice }}</div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowUpRight, Calculator, Check, ClipboardList, FileText, Info, Send, ShieldCheck, Video, X } from 'lucide-vue-next'
import { attachFiles, attachmentBucket, collectionRows, provincialState, submitCollection } from '../state/provincialState'

const materials = [
  { key: '视频', label: '检测视频', hint: '上传检测过程影像', format: 'MP4 / AVI / MOV', accept: '.mp4,.avi,.mov', icon: Video },
  { key: '记录', label: '原始记录', hint: '上传试验记录文件', format: 'XLS / XLSX / PDF', accept: '.xls,.xlsx,.pdf', icon: Calculator },
  { key: '报告', label: '检测报告', hint: '上传正式检测报告', format: 'PDF / DOC / DOCX', accept: '.pdf,.doc,.docx', icon: FileText }
]
const props = defineProps({ kind: { type: String, default: 'house' } })
const route = useRoute()
const pageTitle = computed(() => props.kind === 'field' ? '幕墙安全鉴定' : '房屋安全鉴定')
const steps = ['选择任务', '上传资料', '提交上报']
const rows = computed(() => collectionRows().filter(row => row.type === (props.kind === 'field' ? '现场' : '室内')))
const selectedReport = ref('')
watch(() => route.query.report, report => { selectedReport.value = rows.value.some(row => row.report === report) ? report : '' }, { immediate: true })
const activeRow = computed(() => rows.value.find(row => row.report === selectedReport.value) || null)
const uploadedRows = computed(() => rows.value.filter(row => row.status === '已上传'))
const pendingRows = computed(() => rows.value.filter(row => row.status !== '已上传'))
const donutStyle = computed(() => ({ background: rows.value.length ? `conic-gradient(#235fd6 0 ${uploadedRows.value.length / rows.value.length * 100}%, #a9c4f4 0 100%)` : '#dce8fc' }))
const canUpload = computed(() => activeRow.value?.status === '已下发')
const uploadedCount = computed(() => materials.filter(item => filesFor(item.key).length).length)
const stepIndex = computed(() => !activeRow.value ? 0 : activeRow.value.status === '已上传' ? 3 : uploadedCount.value ? 2 : 1)
const metrics = computed(() => [
  { label: '采集任务', value: rows.value.length, unit: '项', note: '本机构任务总数', tone: 'indigo', icon: ClipboardList },
  { label: '待上传任务', value: rows.value.filter(row => row.status === '已下发').length, unit: '项', note: '已下发待采集', tone: 'teal', icon: Video },
  { label: '已上报资料', value: rows.value.filter(row => row.status === '已上传').length, unit: '项', note: '本机构采集记录', tone: 'cyan', icon: FileText },
  { label: '初筛异常', value: rows.value.filter(row => row.screening === 'warn').length, unit: '项', note: '需要关注的记录', tone: 'amber', icon: ShieldCheck }
])
const fileInput = ref(null), selectedCategory = ref('报告'), dragging = ref(''), notice = ref('')
const fileAccept = computed(() => materials.find(item => item.key === selectedCategory.value)?.accept || '')
function filesFor(category) { return activeRow.value ? attachmentBucket(activeRow.value)[category] || [] : [] }
function flash(text) { notice.value = text; setTimeout(() => { notice.value = '' }, 3000) }
function openPicker(category) { if (!canUpload.value) return; selectedCategory.value = category; fileInput.value?.click() }
function addFiles(files, category) {
  if (!canUpload.value || !files.length) return
  const material = materials.find(item => item.key === category)
  const extensions = material.accept.split(',')
  const valid = files.filter(file => file.size <= 100 * 1024 * 1024 && extensions.some(ext => file.name.toLowerCase().endsWith(ext)))
  if (valid.length !== files.length) flash('部分文件类型不符或超过 100 MB，未添加')
  if (valid.length) attachFiles(activeRow.value, category, valid)
}
function chooseFiles(event) { addFiles([...event.target.files], selectedCategory.value); event.target.value = '' }
function dropFiles(event, category) { dragging.value = ''; addFiles([...event.dataTransfer.files], category) }
function removeFile(category, index) {
  const row = activeRow.value
  provincialState.uploads[row.report] ||= JSON.parse(JSON.stringify(attachmentBucket(row)))
  provincialState.uploads[row.report][category].splice(index, 1)
}
function submit() { if (!activeRow.value || !submitCollection(activeRow.value)) return flash('请先选择资料'); flash('资料已上报，初筛结果已更新') }
function selectRow(row) { selectedReport.value = row.report; document.querySelector('.organization-collection .work-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }
function fileSize(size) { return size >= 1048576 ? `${(size / 1048576).toFixed(1)} MB` : `${(size / 1024).toFixed(1)} KB` }
</script>

<style scoped>
.organization-collection{min-width:0}.organization-collection .content-grid{margin-bottom:18px}.organization-collection .work-card{min-width:0}.organization-collection .intake-panel{padding-top:3px}.organization-collection .intake-limit{margin-top:5px}.organization-collection .material-card:disabled{cursor:default}.uploaded-list{border-top:1px solid #eaf0ff;padding-top:7px;max-height:155px;overflow-y:auto}.uploaded-row{display:flex;align-items:center;gap:8px;padding:7px 2px;color:#40516b;font-size:11px}.uploaded-row>span{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.uploaded-row small{color:#8b98aa;white-space:nowrap}.uploaded-row button{border:0;background:none;color:#8b98aa;cursor:pointer}.task-side-card{min-height:0}.org-task-list{margin-top:17px;max-height:330px;overflow-y:auto;display:grid;gap:8px}.org-task{width:100%;border:1px solid #eaf0ff;border-radius:10px;background:#fff;padding:10px 12px;display:flex;align-items:center;justify-content:space-between;gap:9px;text-align:left;color:#40516b}.org-task:hover,.org-task.selected{border-color:#a9c4f4;background:#f7faff}.org-task span{min-width:0;display:flex;flex-direction:column;gap:5px}.org-task strong{font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.org-task small{font-size:10px;color:#8b98aa}.org-task em{font-style:normal;font-size:10px;color:#235fd6;white-space:nowrap}.task-facts{margin:0;display:grid;gap:9px}.task-facts div{display:flex;justify-content:space-between;gap:10px;font-size:10px}.task-facts dt{color:#8b98aa}.task-facts dd{margin:0;color:#40516b;text-align:right;overflow-wrap:anywhere}.task-memo{margin:0;border-top:1px solid #eaf0ff;padding-top:10px;color:#68788f;font-size:10px;line-height:1.6}.anomaly-note{color:#b84462}.org-history-table{min-width:0}.org-history-table th:first-child{width:27%}.org-history-table th:nth-child(2){width:29%}.org-history-table th:nth-child(3){width:15%}.org-history-table th:nth-child(4){width:13%}.org-history-table th:last-child{width:16%}.org-project{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}@media(max-width:670px){.organization-collection .materials-grid{grid-template-columns:1fr}.organization-collection .material-card{min-height:125px}.organization-collection .intake-footer{align-items:stretch;flex-direction:column}.organization-collection .intake-footer .button{width:100%}.organization-collection .org-history-table{min-width:650px}}
.org-task-select{display:grid;gap:7px;margin:22px 0 16px;color:#40516b;font-size:12px;font-weight:700}.org-task-select select{width:100%;min-height:42px;padding:0 13px;border:1px solid #d9e5f7;border-radius:10px;background:#f9fbff;color:#263a5b;font:inherit}.org-task-select select:focus{outline:2px solid #a9c4f4;outline-offset:2px}.org-donut-wrap{display:flex;justify-content:center;align-items:center;min-height:245px}.org-donut{width:188px;height:188px;border-radius:50%;display:grid;place-items:center;transform:rotate(-90deg)}.org-donut>div{width:150px;height:150px;border-radius:50%;background:#fff;display:flex;flex-direction:column;justify-content:center;align-items:center;transform:rotate(90deg)}.org-donut strong{font-size:36px;color:#243248;line-height:1}.org-donut small{font-size:11px;color:#8b98aa;margin-top:5px}.org-legend{margin-top:2px}.organization-collection .history-table .text-action,.organization-collection .history-table td{font-size:12px}
</style>
