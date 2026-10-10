<template>
  <div class="dashboard">
    <section class="metrics-grid" aria-label="审核概览">
      <article v-for="metric in metrics" :key="metric.label" class="metric-card surface" :class="metric.tone">
        <div class="metric-top"><span>{{ metric.label }}</span><span class="metric-icon" :class="metric.tone"><component :is="metric.icon" :size="18" /></span></div>
        <div class="metric-value">{{ metric.value }}<small>{{ metric.unit }}</small></div>
        <div class="metric-note"><span class="metric-mini-dot" :class="metric.tone"></span>{{ metric.note }}</div>
      </article>
    </section>

    <div class="content-grid">
      <section class="work-card surface">
        <div class="card-heading">
          <div><span class="section-kicker">01 / 审核流程</span><h2>报告工作区</h2></div>
          <span class="state-pill" :class="session.status">{{ statusLabel }}</span>
        </div>
        <div class="stepper" aria-label="审核步骤">
          <div v-for="(step, index) in steps" :key="step" class="step" :class="{ done: stepIndex > index, active: stepIndex === index }">
            <span class="step-number"><Check v-if="stepIndex > index" :size="13" />{{ stepIndex > index ? '' : String(index + 1).padStart(2, '0') }}</span><span>{{ step }}</span>
          </div>
        </div>

        <div v-if="session.status === 'idle' || session.status === 'ready'" class="intake-panel">
          <div class="intake-heading"><div><strong>上传鉴定资料</strong><span>请分别上传三类材料；模拟检测仅针对鉴定报告</span></div><span class="intake-count">{{ uploadedCount }}/3 已上传</span></div>
          <div class="materials-grid">
            <button v-for="material in materials" :key="material.key" class="material-card" :class="{ uploaded: materialFile(material.key), dragging: draggingMaterial === material.key }" type="button" @click="openPicker(material.key)" @dragover.prevent="draggingMaterial = material.key" @dragleave.prevent="draggingMaterial = ''" @drop.prevent="handleDrop($event, material.key)">
              <span class="material-icon"><component :is="material.icon" :size="21" /></span>
              <span class="material-title">{{ material.label }} <em>必传</em></span>
              <span class="material-name" :title="materialFile(material.key)?.name || ''">{{ materialFile(material.key)?.name || material.hint }}</span>
              <span class="material-action">{{ materialFile(material.key) ? '更换文件' : '选择 PDF' }} <ArrowUpRight :size="14" /></span>
            </button>
          </div>
          <div class="intake-limit"><ShieldCheck :size="14" /> 支持 PDF，单文件不超过 100 MB</div>
          <div class="intake-footer"><label class="review-scope"><span><strong>审查范围</strong><small>可提前选择</small></span><select v-model="selectedScope" aria-label="审查范围"><option value="" disabled>请选择审查范围</option><option v-for="scope in reviewScopes" :key="scope.value" :value="scope.value">{{ scope.label }}</option></select></label><button class="button button-primary" type="button" :disabled="session.status !== 'ready'" @click="beginAudit"><Play :size="16" fill="currentColor" /> 开始智能审核</button></div>
        </div>

        <div v-else class="work-body">
          <div class="file-summary"><div class="file-icon"><FileText :size="23" /></div><div class="file-copy"><strong :title="currentName">{{ currentName }}</strong><span>{{ fileSubtitle }}</span></div><button class="icon-button" aria-label="重新上传资料" title="重新上传资料" @click="resetIntake(props.kind)"><RotateCcw :size="16" /></button></div>
          <div v-if="session.status === 'auditing'" class="audit-panel" aria-live="polite">
            <div class="scan-visual"><div class="scan-circle scan-circle-one"></div><div class="scan-circle scan-circle-two"></div><ScanSearch :size="45" :stroke-width="1.2" /></div>
            <div class="audit-copy"><span class="section-kicker">AI AUDITING</span><h3>{{ currentStage }}</h3><p>正在进行演示审核，预计几秒后完成。</p></div>
            <div class="progress-head"><span>审核进度</span><strong>{{ session.progress }}%</strong></div>
            <div class="progress-track" role="progressbar" :aria-valuenow="session.progress" aria-valuemin="0" aria-valuemax="100"><span :style="{ width: session.progress + '%' }"></span></div>
            <div class="progress-steps"><span v-for="(item, index) in auditStages" :key="item" :class="{ reached: session.progress >= index * 25 }">{{ item }}</span></div>
          </div>
          <div v-else class="result-panel">
            <div class="result-banner"><div class="result-check"><Check :size="23" /></div><div><span>审核已完成</span><strong>发现 {{ activeIssues.length }} 项模拟问题</strong></div><span class="result-time">{{ session.selectedRecord?.time || '' }}</span></div>
            <div class="result-actions"><button class="button button-secondary" @click="showPreview = true"><Eye :size="16" /> 预览问题</button><button class="button button-primary" @click="downloadReport"><Download :size="16" /> 导出 PDF 报告</button></div>
            <div class="issue-snapshot"><div class="issue-snapshot-head"><span>主要问题摘要</span><button @click="showPreview = true">查看全部 <ArrowRight :size="14" /></button></div><div v-for="issue in activeIssues.slice(0, 2)" :key="issue.id" class="snapshot-row"><span class="issue-dot" :class="issue.level"></span><span>{{ issue.title }}</span><small>第 {{ issue.page }} 页</small></div></div>
          </div>
        </div>
      </section>

      <div class="side-stack">
        <section class="insights-card surface"><div class="card-heading compact"><div><span class="section-kicker">02 / 数据洞察</span><h2>问题分布</h2></div><span class="card-corner-icon"><ChartNoAxesCombined :size="17" /></span></div><div class="chart-wrap"><v-chart :option="chartOption" autoresize /></div><div class="chart-legend"><span v-for="(item, index) in distribution" :key="item.name"><i :style="{ background: chartColors[index] }"></i>{{ item.name }} <b>{{ item.value }}</b></span></div></section>
        <section class="standards-card surface"><div class="standards-card-head"><span class="focus-icon"><BookOpen :size="19" /></span><div><span class="section-kicker">知识库 / 当前可用</span><h3>{{ available.length }} 项可用标准</h3></div></div><div class="standard-preview-list"><div v-for="item in available.slice(0, 2)" :key="item.id" class="standard-preview-item"><span class="standard-bullet"></span><div><strong :title="item.name">{{ item.name }}</strong><small>{{ item.edition }} · {{ scopeLabel[item.scope] }}</small></div></div><p v-if="!available.length" class="standard-empty">暂无可用标准，可前往知识库启用。</p></div><router-link class="standard-more" to="/knowledge-base">管理标准资料 <ArrowRight :size="14" /></router-link></section>
      </div>
    </div>

    <section class="history-card surface">
      <div class="card-heading history-heading"><div><span class="section-kicker">03 / 历史记录</span><h2>近期审核记录</h2></div><span class="history-count">共 {{ records.length }} 份报告</span></div>
      <div class="history-table-wrap"><table class="history-table"><thead><tr><th>报告文件</th><th>审核时间</th><th>模拟问题</th><th>状态</th><th>操作</th></tr></thead><tbody><tr v-for="record in records" :key="record.id"><td><div class="table-file"><span class="table-file-icon"><FileText :size="18" /></span><div><strong :title="record.name">{{ record.name }}</strong><small>{{ record.source === 'sample' ? '演示样例' : '本地上传' }}</small></div></div></td><td>{{ record.time }}</td><td><span class="count-dot"></span>{{ record.issues.length }} 项</td><td><span class="table-status"><span></span>已完成</span></td><td><button class="text-action" @click="selectHistory(record)">查看结果 <ArrowUpRight :size="14" /></button></td></tr></tbody></table></div>
    </section>

    <input ref="fileInput" class="visually-hidden" type="file" accept=".pdf,application/pdf" @change="handleFileChange" />
    <div v-if="notice" class="toast" role="status"><CircleAlert :size="16" />{{ notice }}</div>

    <div v-if="showPreview && session.selectedRecord" class="modal-backdrop" @click.self="showPreview = false">
      <section class="preview-modal" role="dialog" aria-modal="true" aria-labelledby="preview-title">
        <div class="modal-head"><div><span class="section-kicker">审核结果预览 · 模拟数据</span><h2 id="preview-title">{{ session.selectedRecord.name }}</h2></div><button class="icon-button" aria-label="关闭预览" @click="showPreview = false"><X :size="19" /></button></div>
        <div class="modal-body"><div class="document-preview"><div class="preview-toolbar"><span><FileText :size="15" /> 原始报告预览</span><span v-if="session.url">本地 PDF · <a :href="session.url" target="_blank" rel="noopener noreferrer">新标签打开</a></span><span v-else>历史记录，无原文件</span></div><iframe v-if="session.url" :key="previewPage" :src="session.url + '#page=' + previewPage + '&toolbar=0'" title="上传的原始 PDF 报告"></iframe><div v-else class="mock-page"><div class="mock-page-head">报告预览</div><div class="mock-page-line wide"></div><div class="mock-page-line"></div><div class="mock-page-box"><FileText :size="34" /><p>此历史记录只保存了演示审核结果，原 PDF 未保留。</p></div><div class="mock-page-line wide"></div><div class="mock-page-line"></div></div></div><div class="issue-list"><div class="issue-list-top"><h3>模拟问题 <span>{{ activeIssues.length }}</span></h3><p>问题与页码为演示标注，请人工核对原始报告。</p></div><button v-for="issue in activeIssues" :key="issue.id" class="issue-item" :class="[issue.level, { selected: previewPage === issue.page }]" @click="previewPage = issue.page"><div class="issue-item-top"><span class="issue-tag" :class="issue.level">{{ issue.level === 'high' ? '重点关注' : '建议复核' }}</span><span>第 {{ issue.page }} 页 <ChevronRight :size="13" /></span></div><strong>{{ issue.title }}</strong><p>{{ issue.description }}</p><small>建议：{{ issue.suggestion }}</small></button></div></div>
        <div class="modal-foot"><span><Info :size="15" /> 本页面为交互演示，未进行真实 AI 识别或合规判定。</span><button class="button button-primary" @click="downloadReport"><Download :size="16" /> 导出模拟审核报告</button></div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { ArrowRight, ArrowUpRight, BookOpen, Calculator, ChartNoAxesCombined, Check, ChevronRight, CircleAlert, ClipboardList, Download, Eye, FileText, Info, Play, RotateCcw, ScanSearch, ShieldCheck, X } from 'lucide-vue-next'
import { auditStore, chooseReviewScope, resetIntake, startAudit, uploadMaterial, selectRecord } from '../state/auditStore'
import { availableStandards, scopeLabel } from '../state/managementStore'
import { createAuditPdf } from '../utils/exportPdf'

const props = defineProps({ kind: { type: String, required: true } })
const configs = {
  house: { title: '房屋安全鉴定' },
  curtain: { title: '幕墙安全鉴定' }
}
const config = computed(() => configs[props.kind])
const session = computed(() => auditStore.sessions[props.kind])
const records = computed(() => auditStore.records[props.kind])
const activeIssues = computed(() => session.value.selectedRecord?.issues || [])
const available = computed(() => availableStandards(props.kind))
const fileInput = ref(null)
const selectedMaterialType = ref('report')
const draggingMaterial = ref('')
const showPreview = ref(false)
const previewPage = ref(1)
const notice = ref('')
let noticeTimer

const materials = [
  { key: 'report', label: '鉴定报告', hint: '选择待审核的报告', icon: FileText },
  { key: 'calculation', label: '计算书', hint: '选择结构计算书', icon: Calculator },
  { key: 'original', label: '原始文件', hint: '选择原始记录或方案', icon: ClipboardList }
]
const reviewScopes = [
  { value: 'all', label: '全部' },
  { value: 'general', label: '一般性审查' },
  { value: 'structure', label: '结构承载能力验算与分析智能核查' },
  { value: 'procedure', label: '程序及结论智能核查' }
]
const materialFile = type => type === 'report' ? session.value.file : session.value.supportFiles[type]
const uploadedCount = computed(() => materials.filter(material => materialFile(material.key)).length)
const allMaterialsUploaded = computed(() => uploadedCount.value === materials.length)
const selectedScope = computed({ get: () => session.value.reviewScope, set: value => chooseReviewScope(props.kind, value) })
const steps = ['上传资料', '选择范围', '智能审核', '预览与导出']
const auditStages = ['解析文档', '提取信息', '规则核验', '生成结果']
const chartColors = ['#235FD6', '#78A2EA', '#B5CDF3', '#DBE7FA']
const statusLabel = computed(() => ({ idle: allMaterialsUploaded.value ? '选择范围' : '等待上传', ready: '等待审核', auditing: '正在审核', completed: '审核完成' })[session.value.status])
const stepIndex = computed(() => session.value.status === 'idle' ? (allMaterialsUploaded.value ? 1 : 0) : ({ ready: 2, auditing: 2, completed: 3 })[session.value.status])
const currentName = computed(() => session.value.selectedRecord?.name || session.value.file?.name || '')
const fileSubtitle = computed(() => session.value.file ? (session.value.file.size / 1024 / 1024).toFixed(2) + ' MB · PDF 文档 · 本地上传' : '历史演示记录 · 原始 PDF 不保留')
const currentStage = computed(() => auditStages[Math.min(3, Math.floor(session.value.progress / 25))] + '中…')
const distribution = computed(() => {
  const issues = activeIssues.value
  if (issues.length) return [
    { name: '内容完整性', value: issues.filter(i => i.group === 'content').length },
    { name: '依据与参数', value: issues.filter(i => i.group === 'basis').length },
    { name: '数据一致性', value: issues.filter(i => i.group === 'data').length },
    { name: '形式与结论', value: issues.filter(i => i.group === 'form').length }
  ]
  return props.kind === 'house'
    ? [{ name: '内容完整性', value: 32 }, { name: '依据与参数', value: 27 }, { name: '数据一致性', value: 23 }, { name: '形式与结论', value: 18 }]
    : [{ name: '内容完整性', value: 25 }, { name: '依据与参数', value: 35 }, { name: '数据一致性', value: 22 }, { name: '形式与结论', value: 18 }]
})
const chartOption = computed(() => ({
  animationDuration: 650,
  tooltip: { trigger: 'item', formatter: '{b}：{c}', backgroundColor: '#fff', borderColor: '#E5EAF2', textStyle: { color: '#243248', fontSize: 12 } },
  series: [{ type: 'pie', radius: ['63%', '82%'], center: ['50%', '49%'], avoidLabelOverlap: true, label: { show: false }, data: distribution.value.map((item, index) => ({ ...item, itemStyle: { color: chartColors[index], borderColor: '#fff', borderWidth: 4, borderRadius: 8 } })) }],
  graphic: [{ type: 'text', left: 'center', top: '43%', style: { text: String(distribution.value.reduce((sum, item) => sum + item.value, 0)), fill: '#243248', fontSize: 29, fontWeight: 700, textAlign: 'center' } }, { type: 'text', left: 'center', top: '59%', style: { text: activeIssues.value.length ? '模拟问题' : '样例分布', fill: '#68788F', fontSize: 11, textAlign: 'center' } }]
}))
const metrics = computed(() => {
  const reviewed = records.value.length
  return [
    { label: '已审核报告', value: reviewed, unit: '份', note: '包含演示样例', icon: FileText, tone: 'indigo' },
    { label: '可用标准', value: available.value.length, unit: '项', note: '当前鉴定类型可引用', icon: BookOpen, tone: 'teal' },
    { label: '报告完成率', value: '100', unit: '%', note: '当前历史记录', icon: ShieldCheck, tone: 'cyan' },
    { label: '平均审核耗时', value: '05', unit: '秒', note: '演示流程时长', icon: ScanSearch, tone: 'amber' }
  ]
})
function flash(message) { notice.value = message; clearTimeout(noticeTimer); noticeTimer = setTimeout(() => { notice.value = '' }, 4200) }
function openPicker(type = 'report') { selectedMaterialType.value = type; fileInput.value?.click() }
function acceptFile(file, type) {
  if (!file) return
  if (!/\.pdf$/i.test(file.name) && file.type !== 'application/pdf') return flash('请选择 PDF 格式的文件。')
  if (file.size > 100 * 1024 * 1024) return flash('文件超过 100 MB，请选择较小的 PDF 文件。')
  uploadMaterial(props.kind, type, file)
  showPreview.value = false
  flash(`${materials.find(item => item.key === type)?.label || '文件'}已上传。`)
}
function handleFileChange(event) { acceptFile(event.target.files?.[0], selectedMaterialType.value); event.target.value = '' }
function handleDrop(event, type) { draggingMaterial.value = ''; acceptFile(event.dataTransfer.files?.[0], type) }
function beginAudit() { startAudit(props.kind) }
function selectHistory(record) { selectRecord(props.kind, record); previewPage.value = record.issues[0]?.page || 1; showPreview.value = true }
function downloadReport() {
  if (!session.value.selectedRecord) return
  try { createAuditPdf(session.value.selectedRecord, config.value.title); flash('模拟审核报告已下载到本地。') }
  catch (error) { console.error(error); flash('PDF 生成失败，请重试。') }
}
watch(() => session.value.selectedRecord, (record) => { previewPage.value = record?.issues[0]?.page || 1 })
watch(() => auditStore.previewRequest, (request) => {
  if (request?.kind !== props.kind) return
  const record = records.value.find(item => item.id === request.recordId)
  if (record) selectHistory(record)
  auditStore.previewRequest = null
}, { immediate: true })
onBeforeUnmount(() => clearTimeout(noticeTimer))
</script>
