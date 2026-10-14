import { reactive } from 'vue'

const standardSeeds = [
  { id: 'std-house-demo', name: '福建省房屋建筑可靠性鉴定技术导则', code: 'KB-H-001', edition: '示例条目', scope: 'house', status: 'active', fileName: '', updatedAt: '2026-10-09', source: 'demo' },
  { id: 'std-curtain-demo', name: '既有建筑幕墙安全性鉴定及加固标准', code: 'KB-C-001', edition: '示例条目', scope: 'curtain', status: 'active', fileName: '', updatedAt: '2026-10-09', source: 'demo' },
  { id: 'std-general-demo', name: '福建省房屋安全鉴定活动管理办法', code: 'KB-G-001', edition: '2025 年局部修订版', scope: 'general', status: 'active', fileName: '', updatedAt: '2026-10-09', source: 'demo' },
  { id: 'std-house-check-demo', name: '房屋鉴定报告结构与签章核查清单', code: 'KB-H-002', edition: '核查规则 · 2026', scope: 'house', status: 'active', fileName: '', updatedAt: '2026-10-08', source: 'demo' },
  { id: 'std-curtain-node-demo', name: '幕墙连接节点与支承构件复核要点', code: 'KB-C-002', edition: '核查规则 · 2026', scope: 'curtain', status: 'active', fileName: '', updatedAt: '2026-10-07', source: 'demo' },
  { id: 'std-general-data-demo', name: '鉴定报告数据一致性检查规则', code: 'KB-G-002', edition: '核查规则 · 2026', scope: 'general', status: 'active', fileName: '', updatedAt: '2026-10-06', source: 'demo' },
  { id: 'std-house-conclusion-demo', name: '房屋安全鉴定结论表述核查要点', code: 'KB-H-003', edition: '核查规则 · 2026', scope: 'house', status: 'active', fileName: '', updatedAt: '2026-10-05', source: 'demo' },
  { id: 'std-curtain-material-demo', name: '幕墙材料与检测记录核对清单', code: 'KB-C-003', edition: '待完善规则', scope: 'curtain', status: 'inactive', fileName: '', updatedAt: '2026-10-03', source: 'demo' },
  { id: 'std-general-archive-demo', name: '现场检查资料归档字段示例', code: 'KB-G-003', edition: '核查规则 · 2026', scope: 'general', status: 'active', fileName: '', updatedAt: '2026-10-02', source: 'demo' }
]
const peopleSeeds = [
  { id: 'person-demo-1', name: '张工', department: '鉴定业务部', role: '鉴定工程师', phone: '138****1001', status: 'active', updatedAt: '2026-10-09' },
  { id: 'person-demo-2', name: '李工', department: '报告审核部', role: '审核人员', phone: '138****1002', status: 'active', updatedAt: '2026-10-09' },
  { id: 'person-demo-3', name: '王工', department: '技术管理部', role: '技术负责人', phone: '138****1003', status: 'active', updatedAt: '2026-10-09' },
  { id: 'person-demo-4', name: '陈工', department: '鉴定业务部', role: '结构工程师', phone: '138****1004', status: 'active', updatedAt: '2026-10-08' },
  { id: 'person-demo-5', name: '林工', department: '幕墙检测部', role: '幕墙检测员', phone: '138****1005', status: 'active', updatedAt: '2026-10-08' },
  { id: 'person-demo-6', name: '赵工', department: '报告审核部', role: '质量审核员', phone: '138****1006', status: 'active', updatedAt: '2026-10-07' },
  { id: 'person-demo-7', name: '周工', department: '现场检测部', role: '现场检测员', phone: '138****1007', status: 'active', updatedAt: '2026-10-06' },
  { id: 'person-demo-8', name: '黄工', department: '技术管理部', role: '技术复核员', phone: '138****1008', status: 'inactive', updatedAt: '2026-10-05' },
  { id: 'person-demo-9', name: '吴工', department: '幕墙检测部', role: '检测工程师', phone: '138****1009', status: 'active', updatedAt: '2026-10-03' }
]
function load(key, defaults, expansionIds = []) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return defaults.map(item => ({ ...item }))
    const rows = JSON.parse(raw)
    if (!Array.isArray(rows)) return defaults.map(item => ({ ...item }))
    const expansionKey = `${key}-seed-expansion-v2`
    if (expansionIds.length && !localStorage.getItem(expansionKey)) {
      const additions = defaults.filter(item => expansionIds.includes(item.id) && !rows.some(row => row.id === item.id))
      rows.push(...additions.map(item => ({ ...item })))
      localStorage.setItem(key, JSON.stringify(rows))
      localStorage.setItem(expansionKey, '1')
    }
    return rows
  } catch { return defaults.map(item => ({ ...item })) }
}
function save(key, rows) {
  localStorage.setItem(key, JSON.stringify(rows))
}
function newId() { return globalThis.crypto?.randomUUID?.() || String(Date.now()) + '-' + Math.random().toString(36).slice(2) }
function today() { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()) }

export const managementStore = reactive({
  standards: load('report-audit-standards-v1', standardSeeds, ['std-house-check-demo', 'std-curtain-node-demo', 'std-general-data-demo', 'std-house-conclusion-demo', 'std-curtain-material-demo', 'std-general-archive-demo']),
  people: load('report-audit-people-v1', peopleSeeds, ['person-demo-4', 'person-demo-5', 'person-demo-6', 'person-demo-7', 'person-demo-8', 'person-demo-9'])
})

export const scopeLabel = { house: '房屋安全鉴定', curtain: '幕墙安全鉴定', general: '通用' }
export function availableStandards(kind) {
  return managementStore.standards.filter(item => item.status === 'active' && (item.scope === kind || item.scope === 'general'))
}

function openFileDb() {
  return new Promise((resolve, reject) => {
    if (!globalThis.indexedDB) return reject(new Error('当前浏览器不支持文件存储'))
    const request = indexedDB.open('report-audit-demo-files', 1)
    request.onupgradeneeded = () => request.result.createObjectStore('standards')
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}
async function fileOperation(mode, action) {
  const db = await openFileDb()
  try {
    await new Promise((resolve, reject) => {
      const tx = db.transaction('standards', mode)
      action(tx.objectStore('standards'))
      tx.oncomplete = resolve
      tx.onerror = () => reject(tx.error)
      tx.onabort = () => reject(tx.error)
    })
  } finally { db.close() }
}
export async function readStandardFile(id) {
  const db = await openFileDb()
  try {
    return await new Promise((resolve, reject) => {
      const request = db.transaction('standards', 'readonly').objectStore('standards').get(id)
      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => reject(request.error)
    })
  } finally { db.close() }
}

export async function saveStandard(form, file = null) {
  const id = form.id || newId()
  if (file) await fileOperation('readwrite', store => store.put(file, id))
  const existing = managementStore.standards.find(item => item.id === id)
  const row = {
    id,
    name: form.name.trim(),
    code: form.code.trim(),
    edition: form.edition.trim() || '未标注',
    scope: form.scope,
    status: form.status,
    fileName: file?.name || existing?.fileName || '',
    updatedAt: today(),
    source: existing?.source || 'upload'
  }
  if (existing) Object.assign(existing, row)
  else managementStore.standards.unshift(row)
  save('report-audit-standards-v1', managementStore.standards)
  return row
}
export async function deleteStandard(id) {
  if (managementStore.standards.find(item => item.id === id)?.fileName) await fileOperation('readwrite', store => store.delete(id))
  const index = managementStore.standards.findIndex(item => item.id === id)
  if (index >= 0) managementStore.standards.splice(index, 1)
  save('report-audit-standards-v1', managementStore.standards)
}

export function savePerson(form) {
  const id = form.id || newId()
  const row = {
    id,
    name: form.name.trim(),
    department: form.department.trim(),
    role: form.role.trim(),
    phone: form.phone.trim(),
    status: form.status,
    updatedAt: today()
  }
  const existing = managementStore.people.find(item => item.id === id)
  if (existing) Object.assign(existing, row)
  else managementStore.people.unshift(row)
  save('report-audit-people-v1', managementStore.people)
  return row
}
export function deletePerson(id) {
  const index = managementStore.people.findIndex(item => item.id === id)
  if (index >= 0) managementStore.people.splice(index, 1)
  save('report-audit-people-v1', managementStore.people)
}
