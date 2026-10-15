import { markRaw, reactive } from 'vue'

const issueTemplates = {
  house: [
    { id: 'H-01', title: '鉴定内容完整性需复核', description: '报告中安全性鉴定与抗震鉴定两项工作的覆盖情况需进一步确认。', suggestion: '对照委托范围与结论章节，核实两项鉴定工作的记录。', page: 3, level: 'high', group: 'content' },
    { id: 'H-02', title: '引用标准的现行有效性待确认', description: '检测与鉴定依据中有规范版本需要人工核实。', suggestion: '逐项核对标准编号、版本和现行状态。', page: 6, level: 'medium', group: 'basis' },
    { id: 'H-03', title: '检测数据与结论引用需比对', description: '混凝土强度检测数据与结论中的引用值需人工比对。', suggestion: '核对原始记录、计算书与正文数据的一致性。', page: 12, level: 'medium', group: 'data' },
    { id: 'H-04', title: '签章信息完整性需复核', description: '审核、批准签名及相关执业印章位置需检查。', suggestion: '核实签字人员和鉴定机构公章是否齐全。', page: 23, level: 'medium', group: 'form' },
    { id: 'H-05', title: '结构体系与使用现状描述需核对', description: '报告中的结构体系与现场使用现状需进一步核对。', suggestion: '比对现场勘查记录与报告中的结构概况。', page: 5, level: 'medium', group: 'content' }
  ],
  curtain: [
    { id: 'C-01', title: '幕墙构件与节点检查范围需复核', description: '构件、支撑系统和连接节点的检查覆盖情况需确认。', suggestion: '对照现场检测清单及鉴定范围逐项核实。', page: 4, level: 'high', group: 'content' },
    { id: 'C-02', title: '风荷载参数与计算书需比对', description: '报告中的风荷载取值与计算书主要参数需人工比对。', suggestion: '核对荷载取值、结构重要性系数及相关计算依据。', page: 9, level: 'medium', group: 'basis' },
    { id: 'C-03', title: '检测记录与报告数据需核实', description: '现场检测记录与正文汇总数据之间需做一致性检查。', suggestion: '回查原始记录及图表中的检测数值。', page: 18, level: 'medium', group: 'data' },
    { id: 'C-04', title: '结论及签章形式需复核', description: '结论层级和审核批准签章的完整性需确认。', suggestion: '核对结论表述及签章页的完整性。', page: 36, level: 'medium', group: 'form' },
    { id: 'C-05', title: '连接节点荷载组合需复核', description: '幕墙连接节点的荷载组合与验算书取值需核对。', suggestion: '比对节点验算工况与现场连接方式。', page: 11, level: 'high', group: 'basis' },
    { id: 'C-06', title: '面板检测记录与汇总表需比对', description: '面板检测原始记录与报告汇总表存在待核对项目。', suggestion: '逐项比对检测位置、数量及测量值。', page: 21, level: 'medium', group: 'data' }
  ]
}

const sampleRecords = {
  house: [
    { id: 'house-sample-1', name: '市政综合楼房屋安全鉴定报告.pdf', time: '2026-10-08 15:42', organization: '泉州市建科院', source: 'sample', demo: true, status: 'completed', reviewScope: 'general', reviewReportName: '市政综合楼审核报告.docx', attachments: { calculation: ['市政综合楼结构计算书.pdf'], original: ['市政综合楼现场检测原始记录.pdf'] }, issues: issueTemplates.house },
    { id: 'house-sample-2', name: '既有办公楼结构安全鉴定报告.pdf', time: '2026-10-06 10:18', organization: '厦门市检测院', source: 'sample', demo: true, status: 'completed', reviewScope: 'general', reviewReportName: '既有办公楼审核报告.docx', attachments: { calculation: ['既有办公楼结构验算书.pdf'], original: ['既有办公楼现场检测记录.pdf'] }, issues: issueTemplates.house.slice(0, 3) }
  ],
  curtain: [
    { id: 'curtain-sample-1', name: '滨海商务楼幕墙安全鉴定报告.pdf', time: '2026-10-08 11:26', organization: '泉州市建科院', source: 'sample', demo: true, status: 'completed', reviewScope: 'general', reviewReportName: '滨海商务楼幕墙审核报告.docx', attachments: { calculation: ['滨海商务楼幕墙计算书.pdf'], original: ['滨海商务楼幕墙现场检测记录.pdf'] }, issues: issueTemplates.curtain },
    { id: 'curtain-sample-2', name: '既有建筑玻璃幕墙安全鉴定报告.pdf', time: '2026-10-05 16:05', organization: '厦门市检测院', source: 'sample', demo: true, status: 'completed', reviewScope: 'general', reviewReportName: '既有建筑玻璃幕墙审核报告.docx', attachments: { calculation: ['既有建筑玻璃幕墙计算书.pdf'], original: ['既有建筑玻璃幕墙检测原始文件.pdf'] }, issues: issueTemplates.curtain.slice(0, 3) }
  ]
}

const demoPendingRecords = {
  house: [
    { id: 'house-demo-pending-1', name: '榕城综合楼房屋安全鉴定报告_初稿.pdf', time: '2026-10-14 09:30', organization: '福州市检测中心', attachments: { calculation: ['榕城综合楼结构计算书.pdf', '榕城综合楼承载力复核计算书.pdf'], original: ['榕城综合楼现场检测原始文件.pdf'] } },
    { id: 'house-demo-pending-2', name: '海滨花园住宅楼鉴定报告_送审稿.pdf', time: '2026-10-13 16:20', organization: '厦门市检测院', attachments: { calculation: ['海滨花园住宅楼结构计算书.pdf'], original: ['海滨花园现场记录.pdf', '海滨花园构件检测原始文件.pdf'] } },
    { id: 'house-demo-pending-3', name: '东湖商住楼房屋安全鉴定报告.pdf', time: '2026-10-12 11:45', organization: '福州市检测中心', attachments: { calculation: ['东湖商住楼承载力计算书.pdf'], original: ['东湖商住楼现场勘查记录.pdf'] } },
    { id: 'house-demo-pending-4', name: '文昌路办公楼结构安全鉴定报告.pdf', time: '2026-10-11 15:10', organization: '泉州市建科院', attachments: { calculation: ['文昌路办公楼结构验算书.pdf', '文昌路办公楼抗震验算书.pdf'], original: ['文昌路办公楼检测原始文件.pdf'] } },
    { id: 'house-demo-pending-5', name: '滨海花园一号楼鉴定报告_初稿.pdf', time: '2026-10-10 09:25', organization: '厦门市检测院', attachments: { calculation: ['滨海花园一号楼计算书.pdf'], original: ['滨海花园一号楼现场记录.pdf', '滨海花园一号楼材料检测记录.pdf'] } },
    { id: 'house-demo-pending-6', name: '南山学校教学楼房屋安全鉴定报告.pdf', time: '2026-10-09 14:35', organization: '漳州市质检所', attachments: { calculation: ['南山学校教学楼结构计算书.pdf'], original: ['南山学校教学楼检测原始文件.pdf'] } }
  ],
  curtain: [
    { id: 'curtain-demo-pending-1', name: '营迹路项目幕墙安全鉴定报告_初稿.pdf', time: '2026-10-14 10:05', organization: '福州市检测中心', attachments: { calculation: ['营迹路幕墙结构计算书.pdf'], original: ['营迹路幕墙现场检测原始文件.pdf', '营迹路幕墙节点记录.pdf'] } },
    { id: 'curtain-demo-pending-2', name: '金融中心玻璃幕墙鉴定报告_送审稿.pdf', time: '2026-10-12 14:40', organization: '泉州市建科院', attachments: { calculation: ['金融中心幕墙验算计算书.pdf'], original: ['金融中心幕墙检查原始文件.pdf'] } },
    { id: 'curtain-demo-pending-3', name: '海峡商务中心幕墙安全鉴定报告.pdf', time: '2026-10-12 08:50', organization: '厦门市检测院', attachments: { calculation: ['海峡商务中心幕墙结构计算书.pdf'], original: ['海峡商务中心现场检查记录.pdf'] } },
    { id: 'curtain-demo-pending-4', name: '滨江酒店玻璃幕墙鉴定报告.pdf', time: '2026-10-11 13:15', organization: '福州市检测中心', attachments: { calculation: ['滨江酒店玻璃幕墙验算书.pdf'], original: ['滨江酒店幕墙节点记录.pdf', '滨江酒店现场检测记录.pdf'] } },
    { id: 'curtain-demo-pending-5', name: '科技园研发楼幕墙安全鉴定报告.pdf', time: '2026-10-10 16:30', organization: '泉州市建科院', attachments: { calculation: ['科技园研发楼幕墙计算书.pdf'], original: ['科技园研发楼幕墙原始记录.pdf'] } },
    { id: 'curtain-demo-pending-6', name: '人民广场综合体幕墙鉴定报告_初稿.pdf', time: '2026-10-09 10:20', organization: '漳州市质检所', attachments: { calculation: ['人民广场综合体幕墙验算书.pdf'], original: ['人民广场综合体现场检查记录.pdf'] } }
  ]
}

const additionalDemoNames = {
  house: ['鼓楼商业中心', '晋安综合办公楼', '仓山社区服务中心', '台江文化活动中心', '长乐产业园厂房', '福清实验学校', '连江医院门诊楼', '闽侯科研办公楼', '罗源滨海公寓'],
  curtain: ['海丝国际中心', '东街商务大厦', '滨海会展中心', '金山科技大楼', '长乐航站配套楼', '福清金融广场', '连江文化中心', '闽侯行政服务楼', '罗源商业综合体']
}
for (const kind of ['house', 'curtain']) {
  additionalDemoNames[kind].forEach((project, index) => {
    const report = `${project}${kind === 'house' ? '房屋安全鉴定报告' : '幕墙安全鉴定报告'}_送审稿.pdf`
    demoPendingRecords[kind].push({
      id: `${kind}-demo-pending-${index + 7}`, name: report,
      time: `2026-10-${String(8 - Math.floor(index / 3)).padStart(2, '0')} ${String(16 - index % 3).padStart(2, '0')}:20`,
      organization: ['福州市检测中心', '厦门市检测院', '泉州市建科院', '漳州市质检所'][index % 4],
      attachments: { calculation: [`${project}结构计算书.pdf`], original: [`${project}现场检测原始记录.pdf`] }
    })
  })
}

const demoProgressRecords = {
  house: [
    { id: 'house-demo-reviewed-fuzhou', name: '福州东街办公楼房屋安全鉴定报告.pdf', time: '2026-10-13 10:20', status: 'reviewed', project: '福州东街办公楼' },
    { id: 'house-demo-returned-fuzhou', name: '福州金山服务中心房屋安全鉴定报告.pdf', time: '2026-10-11 09:40', status: 'returned', project: '福州金山服务中心' },
    { id: 'house-demo-issued-fuzhou', name: '三坊七巷配套楼房屋安全鉴定报告.pdf', time: '2026-10-09 15:30', status: 'issued', project: '三坊七巷配套楼' }
  ],
  curtain: [
    { id: 'curtain-demo-reviewed-fuzhou', name: '福州滨海商务楼幕墙安全鉴定报告.pdf', time: '2026-10-12 09:40', status: 'reviewed', project: '福州滨海商务楼' },
    { id: 'curtain-demo-returned-fuzhou', name: '福州东街商厦幕墙安全鉴定报告.pdf', time: '2026-10-10 10:20', status: 'returned', project: '福州东街商厦' },
    { id: 'curtain-demo-issued-fuzhou', name: '鼓楼金融中心幕墙安全鉴定报告.pdf', time: '2026-10-08 14:15', status: 'issued', project: '鼓楼金融中心' }
  ]
}

function initialRecords(kind, recoverInterrupted = true, resetDemoOnLoad = false) {
  const saved = savedRecords(kind, recoverInterrupted).filter(item => !resetDemoOnLoad || !item.demo)
  const ids = new Set(saved.map(item => item.id))
  let deletedDemos = []
  try { deletedDemos = JSON.parse(localStorage.getItem('report-audit-deleted-demos') || '[]') } catch { /* unavailable */ }
  const demos = [...demoPendingRecords[kind], ...demoProgressRecords[kind]].filter(item => !ids.has(item.id) && !deletedDemos.includes(item.id)).map(item => ({
    ...item, organization: item.organization || '福州市检测中心', source: 'organization', demo: true,
    status: item.status === 'returned' ? 'issued' : item.status === 'issued' ? 'completed' : item.status || 'pending', reviewScope: item.status ? 'general' : '',
    issues: item.status ? issueTemplates[kind].map(issue => ({ ...issue })) : [],
    reviewedAt: item.status ? item.time : '',
    reviewReportName: ['issued', 'returned'].includes(item.status) ? `${item.project}审核报告.docx` : '',
    deliveryOutcome: item.status === 'issued' ? 'approved' : item.status === 'returned' ? 'revise' : '',
    attachments: item.attachments || { calculation: [`${item.project}结构计算书.pdf`], original: [`${item.project}现场检测原始记录.pdf`] },
    versions: [{ number: 1, name: item.name, time: item.time, note: '首次提交', status: item.status === 'returned' ? 'issued' : item.status === 'issued' ? 'completed' : item.status || 'pending', reviewScope: item.status ? 'general' : '', issues: item.status ? issueTemplates[kind].map(issue => ({ ...issue })) : [] }]
  }))
  return [...saved, ...demos, ...sampleRecords[kind].filter(item => !deletedDemos.includes(item.id))]
}

function savedRecords(kind, recoverInterrupted = true) {
  try {
    const storageKey = `report-audit-demo-${kind}`
    const value = JSON.parse(localStorage.getItem(storageKey) || '[]')
    const cleanupKey = `report-audit-legacy-records-removed-v1-${kind}`
    let records = Array.isArray(value) ? value : []
    if (!localStorage.getItem(cleanupKey)) {
      const removed = records.filter(item => ['支付记录.pdf', '997.89.pdf'].includes(item?.name))
      if (removed.length) {
        records = records.filter(item => !removed.includes(item))
        localStorage.setItem(storageKey, JSON.stringify(records))
        void purgeStoredReportFiles(kind, removed.map(item => item.id))
      }
      localStorage.setItem(cleanupKey, '1')
    }
    return records.filter(item => item && Array.isArray(item.issues)).map(item => {
      if (item.source !== 'organization') return item
      if (item.status === 'issued' && item.deliveryOutcome !== 'revise') { item.status = 'completed'; item.deliveryOutcome = 'approved'; if (item.versions?.length) item.versions.at(-1).status = 'completed' }
      if (!item.versions?.length) return { ...item, versions: [{ number: 1, name: item.name, time: item.time, note: '首次提交', status: item.status || 'pending', reviewScope: item.reviewScope || '', issues: item.issues || [] }], status: item.status }
      if (recoverInterrupted && item.status === 'reviewing') {
        item.status = 'pending'
        item.versions.at(-1).status = 'pending'
      }
      return item
    })
  } catch { return [] }
}

async function purgeStoredReportFiles(kind, ids) {
  try {
    const db = await submissionDb()
    await new Promise((resolve, reject) => {
      const tx = db.transaction('files', 'readwrite')
      const cursor = tx.objectStore('files').openCursor()
      cursor.onsuccess = () => {
        const row = cursor.result
        if (!row) return
        if (ids.some(id => String(row.key).startsWith(`${kind}:${id}:`))) row.delete()
        row.continue()
      }
      tx.oncomplete = resolve
      tx.onerror = () => reject(tx.error)
    })
    db.close()
  } catch { /* demo records can still be removed when browser file storage is unavailable */ }
}

function persistRecords(kind) {
  try { localStorage.setItem(`report-audit-demo-${kind}`, JSON.stringify(auditStore.records[kind].filter(item => item.source !== 'sample').slice(0, 50))) } catch { /* private mode or quota */ }
}

function submissionDb() {
  return new Promise((resolve, reject) => {
    if (!globalThis.indexedDB) return reject(new Error('当前浏览器不支持本地文件存储'))
    const request = indexedDB.open('report-audit-submissions', 1)
    request.onupgradeneeded = () => request.result.createObjectStore('files')
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function saveSubmissionFiles(kind, recordId, session) {
  const db = await submissionDb()
  try {
    await new Promise((resolve, reject) => {
      const transaction = db.transaction('files', 'readwrite')
      const store = transaction.objectStore('files')
      store.put(session.file, `${kind}:${recordId}:report`)
      store.put(session.file, `${kind}:${recordId}:report:v1`)
      for (const category of ['calculation', 'original']) {
        session.organizationFiles[category].forEach((file, index) => store.put(file, `${kind}:${recordId}:${category}:${index}`))
      }
      transaction.oncomplete = resolve
      transaction.onerror = () => reject(transaction.error)
      transaction.onabort = () => reject(transaction.error)
    })
  } finally { db.close() }
}

export async function loadSubmissionFile(kind, recordId, category, version, index = 0) {
  const db = await submissionDb()
  try {
    return await new Promise((resolve, reject) => {
      const store = db.transaction('files', 'readonly').objectStore('files')
      const request = store.get(`${kind}:${recordId}:${category}${category === 'report' && version ? `:v${version}` : category === 'report' ? '' : `:${index}`}`)
      request.onsuccess = () => {
        if (request.result) return resolve(request.result)
        if (category === 'report' && version !== 1 || category !== 'report' && index !== 0) return resolve(null)
        const fallbackKey = category === 'report' ? `${kind}:${recordId}:report` : `${kind}:${recordId}:${category === 'calculation' ? 'video' : category}`
        const fallback = store.get(fallbackKey)
        fallback.onsuccess = () => resolve(fallback.result || null)
        fallback.onerror = () => reject(fallback.error)
      }
      request.onerror = () => reject(request.error)
    })
  } finally { db.close() }
}

export async function saveReviewReportFile(kind, record, file) {
  if (record?.source !== 'organization' || record.status !== 'reviewed' || !file) return false
  const db = await submissionDb()
  try {
    await new Promise((resolve, reject) => {
      const transaction = db.transaction('files', 'readwrite')
      transaction.objectStore('files').put(file, `${kind}:${record.id}:review-report:v${record.versions?.at(-1)?.number || 1}`)
      transaction.oncomplete = resolve
      transaction.onerror = () => reject(transaction.error)
      transaction.onabort = () => reject(transaction.error)
    })
  } finally { db.close() }
  record.reviewReportName = file.name
  record.reviewReportUploadedAt = stamp()
  const version = record.versions?.at(-1)
  if (version) { version.reviewReportName = file.name; version.reviewReportUploadedAt = record.reviewReportUploadedAt }
  persistRecords(kind)
  return true
}

export async function loadReviewReportFile(kind, record) {
  if (!record?.id) return null
  const db = await submissionDb()
  try {
    return await new Promise((resolve, reject) => {
      const request = db.transaction('files', 'readonly').objectStore('files').get(`${kind}:${record.id}:review-report:v${record.versions?.at(-1)?.number || 1}`)
      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => reject(request.error)
    })
  } finally { db.close() }
}

async function saveReportVersion(kind, recordId, version, file) {
  const db = await submissionDb()
  try {
    await new Promise((resolve, reject) => {
      const transaction = db.transaction('files', 'readwrite')
      transaction.objectStore('files').put(file, `${kind}:${recordId}:report:v${version}`)
      transaction.oncomplete = resolve
      transaction.onerror = () => reject(transaction.error)
      transaction.onabort = () => reject(transaction.error)
    })
  } finally { db.close() }
}

function stamp() { return new Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date()).replaceAll('/', '-') }

export const auditStore = reactive({
  previewRequest: null,
  reviewCacheIds: { house: [], curtain: [] },
  sessions: {
    house: { file: null, supportFiles: { calculation: null, original: null }, organizationFiles: { calculation: [], original: [] }, reviewScope: '', url: null, status: 'idle', progress: 0, selectedRecord: null },
    curtain: { file: null, supportFiles: { calculation: null, original: null }, organizationFiles: { calculation: [], original: [] }, reviewScope: '', url: null, status: 'idle', progress: 0, selectedRecord: null }
  },
  records: {
    house: initialRecords('house', true, true),
    curtain: initialRecords('curtain', true, true)
  }
})

if (typeof window !== 'undefined') window.addEventListener('storage', event => {
  const kind = event.key === 'report-audit-demo-house' ? 'house' : event.key === 'report-audit-demo-curtain' ? 'curtain' : null
  if (!kind) return
  const previous = new Map(auditStore.records[kind].filter(item => item.source !== 'sample').map(item => [item.id, item]))
  const synced = initialRecords(kind, false).filter(item => item.source !== 'sample').map(item => {
    const existing = previous.get(item.id)
    return existing ? Object.assign(existing, item) : item
  })
  auditStore.records[kind] = [...synced, ...initialRecords(kind, false).filter(item => item.source === 'sample')]
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

export function addOrganizationMaterials(kind, type, files) {
  const session = auditStore.sessions[kind]
  if (type === 'report') {
    if (files[0]) uploadMaterial(kind, 'report', files[0])
    return
  }
  if (!['calculation', 'original'].includes(type)) return
  const existing = session.organizationFiles[type]
  for (const file of files) {
    if (!existing.some(item => item.name === file.name && item.size === file.size && item.lastModified === file.lastModified)) existing.push(markRaw(file))
  }
  session.selectedRecord = null
}

export function removeOrganizationMaterial(kind, type, index) {
  if (!['calculation', 'original'].includes(type)) return
  auditStore.sessions[kind].organizationFiles[type].splice(index, 1)
}

export function removeUploadedReport(kind) {
  const session = auditStore.sessions[kind]
  if (session.url) URL.revokeObjectURL(session.url)
  session.file = null
  session.url = null
  session.status = 'idle'
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
  session.organizationFiles = { calculation: [], original: [] }
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
      persistRecords(kind)
    }
  }, 180)
}

export async function submitOrganizationAudit(kind, organization) {
  const session = auditStore.sessions[kind]
  if (!organization || !session.file || !session.organizationFiles.calculation.length || !session.organizationFiles.original.length) return false
  const time = stamp()
  const record = {
    id: `${kind}-org-${Date.now()}`, name: session.file.name, time, source: 'organization', organization,
    status: 'pending', reviewScope: '',
    attachments: { calculation: session.organizationFiles.calculation.map(file => file.name), original: session.organizationFiles.original.map(file => file.name) }, issues: [],
    versions: [{ number: 1, name: session.file.name, time, note: '首次提交', status: 'pending', reviewScope: '', issues: [] }]
  }
  await saveSubmissionFiles(kind, record.id, session)
  auditStore.records[kind].unshift(record)
  session.selectedRecord = record
  session.status = 'submitted'
  persistRecords(kind)
  return true
}

export function withdrawOrganizationAudit(kind, record) {
  if (record?.source !== 'organization' || record.status !== 'pending') return false
  record.status = 'withdrawn'
  const version = record.versions?.at(-1)
  if (version) { version.status = 'withdrawn'; version.withdrawnAt = stamp() }
  persistRecords(kind)
  return true
}

export async function submitOrganizationRevision(kind, record, entries, note) {
  if (record?.source !== 'organization' || !['withdrawn', 'issued'].includes(record.status)) return false
  if (!entries?.report?.length || !entries?.calculation?.length || !entries?.original?.length) return false
  const previousNumber = record.versions?.at(-1)?.number || 1
  const number = previousNumber + 1
  const resolved = {}
  const references = {}
  for (const category of ['report', 'calculation', 'original']) {
    resolved[category] = []
    references[category] = []
    for (const entry of entries[category]) {
      const file = entry.file || await loadSubmissionFile(kind, record.id, category, category === 'report' ? previousNumber : undefined, entry.existingIndex || 0)
      if (!file && !record.demo) throw new Error(`缺少已上传的${category}文件，请重新选择`)
      resolved[category].push(file)
      references[category].push(!file)
    }
  }
  const db = await submissionDb()
  try {
    await new Promise((resolve, reject) => {
      const transaction = db.transaction('files', 'readwrite')
      const store = transaction.objectStore('files')
      if (resolved.report[0]) { store.put(resolved.report[0], `${kind}:${record.id}:report:v${number}`); store.put(resolved.report[0], `${kind}:${record.id}:report`) }
      for (const category of ['calculation', 'original']) {
        for (let index = 0; index < (record.attachments?.[category]?.length || 0); index++) store.delete(`${kind}:${record.id}:${category}:${index}`)
        resolved[category].forEach((file, index) => { if (file) store.put(file, `${kind}:${record.id}:${category}:${index}`) })
      }
      transaction.oncomplete = resolve
      transaction.onerror = () => reject(transaction.error)
      transaction.onabort = () => reject(transaction.error)
    })
  } finally { db.close() }
  const time = stamp()
  const previousVersion = record.versions?.at(-1)
  if (previousVersion && !previousVersion.attachments) previousVersion.attachments = { calculation: [...(record.attachments?.calculation || [])], original: [...(record.attachments?.original || [])] }
  const nextAttachments = { calculation: entries.calculation.map(item => item.name), original: entries.original.map(item => item.name) }
  record.versions ||= []
  record.versions.push({ number, name: entries.report[0].name, time, note: String(note || '').trim() || '提交修正版本', status: 'pending', reviewScope: '', issues: [], attachments: nextAttachments })
  record.name = entries.report[0].name
  record.attachments = nextAttachments
  record.referenceFiles = { calculation: references.calculation, original: references.original }
  record.demoReportReference = references.report[0]
  record.time = time
  record.status = 'pending'
  record.reviewScope = ''
  record.issues = []
  record.reviewedAt = ''
  record.reviewReportName = ''
  record.reviewReportUploadedAt = ''
  record.deliveryOutcome = ''
  record.issuedAt = ''
  persistRecords(kind)
  return true
}

export function reviewOrganizationAudit(kind, record, scope) {
  if (record?.source !== 'organization' || record.status !== 'pending' || !scope) return false
  record.status = 'reviewing'
  record.reviewScope = scope
  const version = record.versions?.at(-1)
  if (version) { version.status = 'reviewing'; version.reviewScope = scope }
  persistRecords(kind)
  setTimeout(() => {
    record.issues = issueTemplates[kind].map(issue => ({ ...issue }))
    record.status = 'reviewed'
    record.reviewedAt = stamp()
    if (version) { version.status = 'reviewed'; version.issues = record.issues.map(issue => ({ ...issue })); version.reviewedAt = record.reviewedAt }
    persistRecords(kind)
  }, 3200)
  return true
}

export function issueOrganizationAudit(kind, record, outcome = 'approved') {
  if (record?.source !== 'organization' || record.status !== 'reviewed') return false
  if (!['approved', 'revise'].includes(outcome)) return false
  record.status = outcome === 'revise' ? 'issued' : 'completed'
  record.deliveryOutcome = outcome
  record.issuedAt = stamp()
  const version = record.versions?.at(-1)
  if (version) { version.status = record.status; version.deliveryOutcome = outcome; version.issuedAt = record.issuedAt }
  persistRecords(kind)
  return true
}

export function reopenOrganizationAudit(kind, record) {
  if (record?.source !== 'organization' || record.status !== 'reviewed') return false
  record.status = 'pending'
  record.reviewScope = ''
  record.issues = []
  record.reviewedAt = ''
  record.reviewReportName = ''
  record.reviewReportUploadedAt = ''
  const version = record.versions?.at(-1)
  if (version) { version.status = 'pending'; version.reviewScope = ''; version.issues = []; version.reviewReportName = '' }
  persistRecords(kind)
  return true
}

export async function deleteAuditRecord(kind, record) {
  const list = auditStore.records[kind]
  const index = list.findIndex(item => item.id === record?.id)
  if (index < 0) return false
  if (record.demo || record.source === 'sample') {
    try {
      const deleted = JSON.parse(localStorage.getItem('report-audit-deleted-demos') || '[]')
      localStorage.setItem('report-audit-deleted-demos', JSON.stringify([...new Set([...deleted, record.id])]))
    } catch { /* unavailable */ }
  }
  if (record.source === 'organization' && !record.demo) {
    const db = await submissionDb()
    try {
      await new Promise((resolve, reject) => {
        const tx = db.transaction('files', 'readwrite')
        const cursor = tx.objectStore('files').openCursor()
        cursor.onsuccess = () => {
          const row = cursor.result
          if (!row) return
          if (String(row.key).startsWith(`${kind}:${record.id}:`)) row.delete()
          row.continue()
        }
        tx.oncomplete = resolve
        tx.onerror = () => reject(tx.error)
      })
    } finally { db.close() }
  }
  list.splice(index, 1)
  if (auditStore.sessions[kind].selectedRecord?.id === record.id) resetIntake(kind)
  persistRecords(kind)
  return true
}

export function updateOrganizationAuditReport(kind, record, note, issues) {
  if (record?.source !== 'organization' || record.status !== 'reviewed' || !Array.isArray(issues)) return false
  const cleaned = issues.map(issue => ({
    ...issue,
    title: String(issue.title || '').trim(),
    description: String(issue.description || '').trim(),
    suggestion: String(issue.suggestion || '').trim(),
    page: Math.max(1, Number.parseInt(issue.page, 10) || 1)
  }))
  if (cleaned.some(issue => !issue.title || !issue.description || !issue.suggestion)) return false
  record.reviewNote = String(note || '').trim()
  record.issues = cleaned
  const version = record.versions?.at(-1)
  if (version) { version.issues = cleaned.map(issue => ({ ...issue })); version.reviewNote = record.reviewNote }
  persistRecords(kind)
  return true
}

export function selectRecord(kind, record) {
  const session = auditStore.sessions[kind]
  if (session.selectedRecord?.id === record.id && session.url) return
  clearInterval(timers[kind])
  if (session.url) URL.revokeObjectURL(session.url)
  session.file = null
  session.supportFiles = { calculation: null, original: null }
  session.organizationFiles = { calculation: [], original: [] }
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
