import { markRaw, reactive } from 'vue'

const issueTemplates = {
  house: [
    { id: 'H-01', title: '鉴定内容完整性需复核', description: '模拟标注：报告中安全性鉴定与抗震鉴定两项工作的覆盖情况需进一步确认。', suggestion: '对照委托范围与结论章节，核实两项鉴定工作的记录。', page: 3, level: 'high', group: 'content' },
    { id: 'H-02', title: '引用标准的现行有效性待确认', description: '模拟标注：检测与鉴定依据中有规范版本需要人工核实。', suggestion: '逐项核对标准编号、版本和现行状态。', page: 6, level: 'medium', group: 'basis' },
    { id: 'H-03', title: '检测数据与结论引用需比对', description: '模拟标注：混凝土强度检测数据与结论中的引用值需人工比对。', suggestion: '核对原始记录、计算书与正文数据的一致性。', page: 12, level: 'medium', group: 'data' },
    { id: 'H-04', title: '签章信息完整性需复核', description: '模拟标注：审核、批准签名及相关执业印章位置需检查。', suggestion: '核实签字人员和鉴定机构公章是否齐全。', page: 23, level: 'medium', group: 'form' }
  ],
  curtain: [
    { id: 'C-01', title: '幕墙构件与节点检查范围需复核', description: '模拟标注：构件、支撑系统和连接节点的检查覆盖情况需确认。', suggestion: '对照现场检测清单及鉴定范围逐项核实。', page: 4, level: 'high', group: 'content' },
    { id: 'C-02', title: '风荷载参数与计算书需比对', description: '模拟标注：报告中的风荷载取值与计算书主要参数需人工比对。', suggestion: '核对荷载取值、结构重要性系数及相关计算依据。', page: 9, level: 'medium', group: 'basis' },
    { id: 'C-03', title: '检测记录与报告数据需核实', description: '模拟标注：现场检测记录与正文汇总数据之间需做一致性检查。', suggestion: '回查原始记录及图表中的检测数值。', page: 18, level: 'medium', group: 'data' },
    { id: 'C-04', title: '结论及签章形式需复核', description: '模拟标注：结论层级和审核批准签章的完整性需确认。', suggestion: '核对结论表述及签章页的完整性。', page: 36, level: 'medium', group: 'form' }
  ]
}

const sampleRecords = {
  house: [
    { id: 'house-sample-1', name: '房屋安全鉴定报告_样例.pdf', time: '2026-10-08 15:42', source: 'sample', issues: issueTemplates.house },
    { id: 'house-sample-2', name: '既有房屋结构安全复核_演示.pdf', time: '2026-10-06 10:18', source: 'sample', issues: issueTemplates.house.slice(0, 3) }
  ],
  curtain: [
    { id: 'curtain-sample-1', name: '幕墙安全鉴定报告_样例.pdf', time: '2026-10-08 11:26', source: 'sample', issues: issueTemplates.curtain },
    { id: 'curtain-sample-2', name: '既有建筑幕墙检测报告_演示.pdf', time: '2026-10-05 16:05', source: 'sample', issues: issueTemplates.curtain.slice(0, 3) }
  ]
}

function savedRecords(kind) {
  try {
    const value = JSON.parse(localStorage.getItem(`report-audit-demo-${kind}`) || '[]')
    return Array.isArray(value) ? value.filter(item => item && Array.isArray(item.issues)) : []
  } catch { return [] }
}

export const auditStore = reactive({
  previewRequest: null,
  sessions: {
    house: { file: null, supportFiles: { calculation: null, original: null }, reviewScope: '', url: null, status: 'idle', progress: 0, selectedRecord: null },
    curtain: { file: null, supportFiles: { calculation: null, original: null }, reviewScope: '', url: null, status: 'idle', progress: 0, selectedRecord: null }
  },
  records: {
    house: [...savedRecords('house'), ...sampleRecords.house],
    curtain: [...savedRecords('curtain'), ...sampleRecords.curtain]
  }
})

const timers = {}

export function uploadMaterial(kind, type, file) {
  const session = auditStore.sessions[kind]
  clearInterval(timers[kind])
  if (type === 'report') {
    if (session.url) URL.revokeObjectURL(session.url)
    session.file = markRaw(file)
    session.url = URL.createObjectURL(file)
  } else if (type === 'calculation' || type === 'original') {
    session.supportFiles[type] = markRaw(file)
  } else return
  session.status = session.file && session.supportFiles.calculation && session.supportFiles.original && session.reviewScope ? 'ready' : 'idle'
  session.progress = 0
  session.selectedRecord = null
}

export function chooseReviewScope(kind, scope) {
  const session = auditStore.sessions[kind]
  session.reviewScope = scope
  session.status = session.file && session.supportFiles.calculation && session.supportFiles.original && scope ? 'ready' : 'idle'
}

export function resetIntake(kind) {
  const session = auditStore.sessions[kind]
  clearInterval(timers[kind])
  if (session.url) URL.revokeObjectURL(session.url)
  session.file = null
  session.supportFiles = { calculation: null, original: null }
  session.reviewScope = ''
  session.url = null
  session.status = 'idle'
  session.progress = 0
  session.selectedRecord = null
}

export function startAudit(kind) {
  const session = auditStore.sessions[kind]
  if (!session.file || !session.supportFiles.calculation || !session.supportFiles.original || !session.reviewScope || session.status !== 'ready') return
  session.status = 'auditing'
  session.progress = 0
  clearInterval(timers[kind])
  timers[kind] = setInterval(() => {
    session.progress = Math.min(100, session.progress + 4)
    if (session.progress === 100) {
      clearInterval(timers[kind])
      const time = new Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date()).replaceAll('/', '-')
      const record = { id: `${kind}-${Date.now()}`, name: session.file.name, time, source: 'upload', reviewScope: session.reviewScope, attachments: { calculation: session.supportFiles.calculation.name, original: session.supportFiles.original.name }, issues: issueTemplates[kind].map(issue => ({ ...issue })) }
      session.selectedRecord = record
      session.status = 'completed'
      auditStore.records[kind].unshift(record)
      try { localStorage.setItem(`report-audit-demo-${kind}`, JSON.stringify(auditStore.records[kind].filter(item => item.source === 'upload').slice(0, 20))) } catch { /* private mode or quota */ }
    }
  }, 180)
}

export function selectRecord(kind, record) {
  const session = auditStore.sessions[kind]
  if (session.selectedRecord?.id === record.id && session.url) return
  clearInterval(timers[kind])
  if (session.url) URL.revokeObjectURL(session.url)
  session.file = null
  session.supportFiles = { calculation: null, original: null }
  session.reviewScope = record.reviewScope || ''
  session.url = null
  session.status = 'completed'
  session.progress = 100
  session.selectedRecord = record
}

export function requestReportPreview(kind, record) {
  selectRecord(kind, record)
  auditStore.previewRequest = { kind, recordId: record.id }
}
