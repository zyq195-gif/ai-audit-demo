import { reactive, watch } from 'vue'
import { auditRuleDefaults } from './auditRules'
import * as seed from './provincialSeed'
import { resetIntake } from './auditStore'

export const provincialRoutes = { dash: '/dashboard', collect: '/data-collection', screen: '/ai-check', rule: '/rule-config', sys: '/system-management', ledger: '/records', orgIssues: '/org-issues', orgHouse: '/org-house-audit', orgField: '/org-field-inspection' }
export const moduleNames = { dash: '监管驾驶舱', orgIssues: '监管驾驶舱', orgHouse: '房屋安全鉴定', orgField: '幕墙安全鉴定', screen: 'AI 核查', rule: '知识库及规则配置', ledger: '台账记录', sys: '系统管理' }
const auditMenus = [
  { id: 'org-issues', view: 'orgIssues', name: '监管驾驶舱', st: '启用' },
  { id: 'org-house', view: 'orgHouse', name: '房屋安全鉴定', st: '启用' },
  { id: 'org-field', view: 'orgField', name: '幕墙安全鉴定', st: '启用' },
  { id: 'ledger', view: 'ledger', name: '台账记录', st: '启用' }
]
export const organizationNames = seed.ORGS
export function activeOrganizationNames() {
  return provincialState.organizations.filter(item => item[2] === '启用').map(item => item[0])
}
export const anomalyNames = seed.EXC_LABEL

const clone = value => JSON.parse(JSON.stringify(value))
const storageKey = 'report-audit-provincial-native-v1'
let saved = {}
try { saved = JSON.parse(localStorage.getItem(storageKey) || '{}') } catch { /* private browsing */ }

const formerDemoAccounts = new Map([
  ['省总站:zhangsan', 'admin'], ['福州市检测中心:lisi', 'user'],
  ['厦门市检测院:wangwu', 'user2'], ['厦门市检测院:user', 'user2'],
  ['泉州市建科院:zhaoliu', 'user3'], ['泉州市建科院:user', 'user3'],
  ['漳州市质检所:sunqi', 'user4'], ['漳州市质检所:user', 'user4']
])
const formerAccountIds = new Map([['zhangsan', 'admin'], ['lisi', 'user'], ['wangwu', 'user2'], ['zhaoliu', 'user3'], ['sunqi', 'user4']])
function migrateDemoAccounts(rows) {
  return rows.map(row => {
    const replacement = formerDemoAccounts.get(`${row[2]}:${row[0]}`)
    return replacement && !rows.some(other => other !== row && other[2] === row[2] && other[0] === replacement)
      ? [replacement, ...row.slice(1)] : row
  })
}
const storedUser = saved.user?.account ? { ...saved.user, account: formerDemoAccounts.get(`${saved.user.org}:${saved.user.account}`) || saved.user.account, perms: [...new Set([...(saved.user.perms || []).filter(view => view !== 'collect'), 'ledger', ...(saved.user.role === 'org' ? ['orgIssues', 'orgHouse', 'orgField'] : [])])] } : null
function migrateOrganizationRoles(rows) {
  return rows.map(row => {
    const mods = row.mods?.includes('数据采集')
      ? [...row.mods.filter(name => name !== '数据采集'), '房屋安全鉴定', '幕墙安全鉴定']
      : row.mods?.map(name => name === '现场检测' ? '幕墙安全鉴定' : name)
    return { ...row, mods: [...new Set([...(mods || []).map(name => name === '问题驾驶舱' ? '监管驾驶舱' : name), '台账记录'])] }
  })
}
function migrateAuditMenus(rows) {
  const oldIndex = rows.findIndex(menu => menu.view === 'collect')
  const result = rows.filter(menu => !['collect', 'screen'].includes(menu.view))
  const additions = auditMenus.filter(template => template.view !== 'ledger' && !result.some(menu => menu.view === template.view)).map(template => ({ ...template, path: `#${template.view}`, builtin: true }))
  result.splice(oldIndex < 0 ? Math.min(1, result.length) : oldIndex, 0, ...additions)
  const existingLedger = result.find(menu => menu.view === 'ledger')
  if (existingLedger) result.splice(result.indexOf(existingLedger), 1)
  const ledger = existingLedger || { ...auditMenus.find(menu => menu.view === 'ledger'), path: '#ledger', builtin: true }
  result.splice(result.findIndex(menu => menu.view === 'sys') < 0 ? result.length : result.findIndex(menu => menu.view === 'sys'), 0, ledger)
  result.forEach(menu => { if (menu.view === 'orgIssues') menu.name = '监管驾驶舱' })
  return result
}
function migrateRuleConfig(savedRules) {
  if (!savedRules?.house || !savedRules?.curtain) return clone(auditRuleDefaults)
  const oldLabels = new Set(['房屋安全鉴定报告核查清单', '房屋结构安全核查要点', '房屋安全鉴定结论核查要点', '幕墙安全鉴定报告核查清单', '幕墙结构验算核查要点', '幕墙安全鉴定结论核查要点'])
  const result = clone(savedRules)
  for (const type of ['house', 'curtain']) for (const rule of result[type]) {
    const reference = auditRuleDefaults[type].find(item => item.param === rule.param)
    if (reference && oldLabels.has(rule.std)) rule.std = reference.std
  }
  return result
}

export const provincialState = reactive({
  authenticated: saved.authenticated === true && !!saved.user?.account,
  user: saved.authenticated === true && storedUser ? storedUser : null,
  menus: migrateAuditMenus(saved.menus || clone(seed.sysMenus)),
  projects: saved.projects || clone(seed.projs),
  collects: saved.collects || clone(seed.collects),
  tasks: saved.tasks || clone(seed.tasks),
  issues: saved.issues || clone(seed.ISSUES),
  submits: saved.submits || clone(seed.SUBMIT),
  uploads: saved.uploads || clone(seed.UP_SEED),
  ruleConfig: migrateRuleConfig(saved.ruleConfig),
  roles: migrateOrganizationRoles(saved.roles || clone(seed.sysRoles)),
  organizations: saved.organizations || clone(seed.sysOrgs),
  users: migrateDemoAccounts(saved.users || clone(seed.sysUsers)),
  cities: clone(seed.cities),
  ranks: clone(seed.ranks),
  trend: clone(seed.trend)
})

watch(provincialState, value => {
  try { localStorage.setItem(storageKey, JSON.stringify(value)) } catch { /* storage unavailable */ }
}, { deep: true })

export function loginAccount(account, password, selectedRole = '') {
  const rawAccountId = String(account || '').trim().split(/[·:：]/).pop().trim()
  const accountId = formerAccountIds.get(rawAccountId) || rawAccountId
  if (!accountId || !password) return { ok: false, message: '请输入账号和密码' }
  const matches = provincialState.users.filter(item => item[0] === accountId)
  if (matches.length > 1) return { ok: false, message: '账号 ID 重复，请联系管理员处理' }
  if (matches.length !== 1 || password !== '123456') return { ok: false, message: '账号或密码不正确' }
  const accountRow = matches[0]
  if (accountRow[2] !== '省总站' && !activeOrganizationNames().includes(accountRow[2])) return { ok: false, message: '所属机构不可用' }
  if (accountRow[4] !== '启用') return { ok: false, message: '该账号已停用' }
  const configured = provincialState.roles.find(item => item.name === accountRow[3] && item.st === '启用')
  if (!configured) return { ok: false, message: '该账号的角色不可用' }
  if (selectedRole && accountRow[3] !== selectedRole) return { ok: false, message: '所选权限与账号不匹配' }
  const role = configured.scope === '本机构' ? 'org' : 'prov'
  const allowed = [...new Set([...configured.mods, '台账记录'].map(label => role === 'org' && (label === '监管驾驶舱' || label === '问题驾驶舱') ? 'orgIssues' : Object.keys(moduleNames).find(key => moduleNames[key].replace(/\s/g, '') === label.replace(/\s/g, ''))).filter(view => view && provincialState.menus.some(menu => menu.view === view && menu.st === '启用') && (role === 'prov' || auditMenus.some(menu => menu.view === view))))]
  if (!allowed.length) return { ok: false, message: '该账号尚未配置可用功能' }
  if (role === 'org') { resetIntake('house'); resetIntake('curtain') }
  provincialState.user = { account: accountId, name: accountRow[1], role, roleName: accountRow[3], scope: configured.scope, org: accountRow[2], perms: allowed }
  provincialState.authenticated = true
  return { ok: true }
}

export function logout() {
  provincialState.authenticated = false
  provincialState.user = null
}

export function visibleMenus() {
  return provincialState.menus.filter(menu => menu.st === '启用' && !['collect', 'screen'].includes(menu.view) && provincialRoutes[menu.view] && provincialState.user?.perms?.includes(menu.view))
}

export function scopedProjects() {
  return provincialState.user?.scope === '全省' ? provincialState.projects : provincialState.projects.filter(item => item.org === provincialState.user?.org)
}
export function scopedCollects() {
  return provincialState.user?.scope === '全省' ? provincialState.collects : provincialState.collects.filter(item => item[1] === provincialState.user?.org)
}
export function scopedIssues() {
  return provincialState.user?.scope === '全省' ? provincialState.issues : provincialState.issues.filter(item => item[2] === provincialState.user?.org)
}

export function collectionRows() {
  const rows = provincialState.tasks.filter(task => provincialState.user?.scope === '全省' || (task.org === provincialState.user?.org && task.st !== '待下发')).map(task => {
    const collection = provincialState.collects.find(item => item[0] === task.proj && item[6] === task.rno)
    return { task, no: task.no, report: task.rno, project: task.proj, org: task.org, type: task.type, param: task.param,
      status: collection ? '已上传' : task.st, sentAt: task.sentAt || '', collectedAt: collection?.[4] || '', screening: collection?.[5] || '', anomaly: collection?.[7] || '', anomalyDetail: collection?.[8] || '' }
  })
  scopedCollects().forEach(item => {
    if (rows.some(row => row.report === item[6] && row.project === item[0])) return
    rows.push({ task: null, no: item[9] || '—', report: item[6], project: item[0], org: item[1], type: item[2], param: item[3], status: '已上传', sentAt: item[10], collectedAt: item[4], screening: item[5], anomaly: item[7], anomalyDetail: item[8] })
  })
  const order = { 待下发: 0, 已下发: 1, 已上传: 2 }
  return rows.sort((a, b) => order[a.status] - order[b.status] || String(b.collectedAt || b.sentAt).localeCompare(String(a.collectedAt || a.sentAt)))
}

export function addTask(data) {
  const next = Math.max(23, ...provincialState.tasks.map(item => Number(item.no.split('-').pop()) || 0)) + 1
  const nextReport = Math.max(23, ...provincialState.tasks.map(item => Number(item.rno.split('-').pop()) - 900 || 0)) + 1
  const date = new Date().toISOString().slice(0, 16).replace('T', ' ')
  const task = { ...data, no: `RW2026-${String(next).padStart(4, '0')}`, rno: data.rno || `BG2026-${String(900 + nextReport).padStart(4, '0')}`, st: '待下发', sentAt: '', at: date }
  provincialState.tasks.unshift(task)
  return task
}
export function dispatchTask(task) { task.st = '已下发'; task.sentAt = new Date().toISOString().slice(0, 16).replace('T', ' ') }
export function attachmentBucket(row) {
  return provincialState.uploads[row.report] || provincialState.uploads[row.project] || { 视频: [], 记录: [], 报告: [] }
}
export function attachFiles(row, category, files) {
  const bucket = provincialState.uploads[row.report] ||= clone(attachmentBucket(row))
  for (const file of files) {
    if (!bucket[category].some(item => item.name === file.name && item.size === file.size)) bucket[category].push({ name: file.name, size: file.size, at: new Date().toISOString().slice(0, 16).replace('T', ' ') })
  }
}
export function submitCollection(row) {
  const bucket = attachmentBucket(row)
  if (!['视频', '记录', '报告'].some(key => bucket[key]?.length)) return false
  const existing = provincialState.collects.find(item => item[0] === row.project && item[6] === row.report)
  const now = new Date().toISOString().slice(0, 16).replace('T', ' ')
  if (existing) { existing[4] = now; existing[5] = 'pass' }
  else provincialState.collects.push([row.project, row.org, row.type, row.param, now, 'pass', row.report, '', '', row.no, row.sentAt])
  if (!provincialState.projects.some(item => item.rno === row.report)) {
    const next = Math.max(0, ...provincialState.projects.map(item => Number(item.id.split('-').pop()) || 0)) + 1
    provincialState.projects.unshift({ id: `P2026-${String(next).padStart(4, '0')}`, name: row.project, org: row.org, type: row.type, param: row.param, rno: row.report, st: '未核查' })
  }
  return true
}

const keyOf = value => String(value || '').replace(/试验|检测|及其|连接件|的/g, '')
export function ruleFor(type, param) {
  const list = provincialState.ruleConfig[type] || []
  return list.find(item => item.param === param) || list.find(item => keyOf(item.param) === keyOf(param)) || list.find(item => param && (item.param.includes(param) || param.includes(item.param))) || null
}
export function checkRows(project) {
  const rule = ruleFor(project.type, project.param)
  const base = [], image = [], problems = []
  if (!rule) return { rule, base, image, problems }
  const pending = provincialState.issues.filter(item => item[0] === project.rno && item[3] === 'rule').map(item => [...item])
  rule.items.filter(item => item.on).forEach(item => {
    const isImage = /影像|视频|图像|图片/.test(item.t)
    const index = pending.findIndex(issue => item.t.includes(issue[4]))
    const match = index >= 0 ? pending.splice(index, 1)[0] : null
    const row = { text: item.t, status: project.st === '核查中' ? 'pending' : match ? 'warn' : 'pass', detail: project.st === '核查中' ? 'AI 核查进行中，结论待生成' : match?.[7] || (isImage ? '影像要素识别完整，本项未发现异常' : '未发现与本项核查要求不符的情形') }
    if (match && project.st !== '核查中') problems.push({ level: match[5], id: match[6], text: match[7], rule: item.t, keyword: match[4] })
    ;(isImage ? image : base).push(row)
  })
  return { rule, base, image, problems: problems.sort((a, b) => ({ 高: 0, 中: 1, 低: 2 })[a.level] - ({ 高: 0, 中: 1, 低: 2 })[b.level]) }
}
export function runChecks(ids) {
  const projects = provincialState.projects.filter(item => ids.includes(item.id) && item.st === '未核查')
  projects.forEach(item => { item.st = '核查中' })
  if (projects.length) setTimeout(() => projects.forEach(item => { item.st = '已核查' }), 1400)
  return projects.length
}
export function submitProblems(project) {
  if (project.st !== '已核查' || provincialState.submits[project.rno]) return false
  const total = checkRows(project).problems.length + provincialState.issues.filter(item => item[0] === project.rno && item[3] === 'pre').length
  if (!total) return false
  provincialState.submits[project.rno] = new Date().toISOString().slice(0, 16).replace('T', ' ')
  return true
}

export function pushScreeningAnomaly(row) {
  if (!row.anomaly) return false
  if (!provincialState.issues.some(item => item[0] === row.report && item[3] === 'pre')) {
    provincialState.issues.push([row.report, row.project, row.org, 'pre', row.anomaly, '中', `P${String(Date.now()).slice(-6)}`, row.anomalyDetail, 0])
  }
  provincialState.submits[row.report] ||= new Date().toISOString().slice(0, 16).replace('T', ' ')
  return true
}
