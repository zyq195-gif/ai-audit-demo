<template>
  <div class="dashboard organization-issues">
    <section class="metrics-grid" aria-label="监管概览">
      <article v-for="metric in metrics" :key="metric.label" class="metric-card surface" :class="metric.tone">
        <div class="metric-top"><span>{{ metric.label }}</span><span class="metric-icon" :class="metric.tone"><component :is="metric.icon" :size="18" /></span></div>
        <div class="metric-value">{{ metric.value }}<small>{{ metric.unit }}</small></div>
        <div class="metric-note"><span class="metric-mini-dot" :class="metric.tone"></span>{{ metric.note }}</div>
      </article>
    </section>

    <section class="surface org-flow-card"><div class="card-heading"><div><span class="section-kicker">01 / 提交与审核</span><h2>报告流转概览</h2></div><span class="history-count">房屋与幕墙合计 {{ ownRecords.length }} 份</span></div><div class="org-flow-grid"><div v-for="item in flow" :key="item.label" class="org-flow-item"><span>{{ item.label }}</span><strong>{{ item.value }} <small>份</small></strong><div class="org-flow-track"><i :style="{ width: `${ownRecords.length ? item.value / ownRecords.length * 100 : 0}%`, background: item.color }"></i></div></div></div></section>

    <div class="issue-chart-grid">
      <section v-for="section in sections" :key="section.kind" class="insights-card surface issue-chart-card">
        <div class="card-heading compact"><div><span class="section-kicker">{{ section.kind === 'house' ? '02' : '03' }} / 问题洞察</span><h2>{{ section.title }}</h2></div><span class="card-corner-icon"><ChartNoAxesCombined :size="17" /></span></div>
        <div class="chart-wrap"><v-chart :option="chartOption(section)" autoresize /></div>
        <div class="chart-legend"><span v-for="(item, index) in section.distribution" :key="item.group"><i :style="{ background: chartColors[index] }"></i>{{ item.name }} <b>{{ item.value }}</b></span></div>
        <div class="issue-chart-foot"><span>{{ section.records.length ? `来自 ${section.records.length} 份已下发报告` : '暂无已下发报告' }}</span><router-link :to="section.path">查看鉴定记录 <ArrowRight :size="14" /></router-link></div>
      </section>
    </div>
    <section class="surface org-recent-card"><div class="card-heading"><div><span class="section-kicker">04 / 业务动态</span><h2>最近报告</h2></div><router-link class="org-ledger-link" to="/records">查看台账 <ArrowRight :size="15" /></router-link></div><div v-if="!ownRecords.length" class="empty-state">暂无本机构提交记录</div><div v-else class="org-recent-list"><div v-for="record in ownRecords.slice(0, 6)" :key="record.id" class="org-recent-row"><span class="table-file-icon"><ClipboardCheck :size="17" /></span><div><strong :title="record.name">{{ record.name }}</strong><small>{{ record.organization }} · {{ record.time }}</small></div><span class="table-status" :class="reportStatusClass(record)"><span></span>{{ statusText(record.status) }}</span></div></div></section>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { ArrowRight, ChartNoAxesCombined, ClipboardCheck, House, ScanLine, TriangleAlert } from 'lucide-vue-next'
import { auditStore } from '../state/auditStore'
import { provincialState } from '../state/provincialState'
import { reportStatusClass, reportStatusRank } from '../utils/reportRecords'

const chartColors = ['#235FD6', '#78A2EA', '#B5CDF3', '#DBE7FA']
const ownRecords = computed(() => [...auditStore.records.house, ...auditStore.records.curtain].filter(record => record.source === 'organization' && record.organization === provincialState.user?.org).sort((a, b) => reportStatusRank(a) - reportStatusRank(b) || String(b.time).localeCompare(String(a.time))))
const flow = computed(() => [
  { label: '待审核', value: ownRecords.value.filter(record => ['pending', 'reviewing'].includes(record.status)).length, color: '#78a2ea' },
  { label: '待下发', value: ownRecords.value.filter(record => record.status === 'reviewed').length, color: '#7968d9' },
  { label: '已下发', value: ownRecords.value.filter(record => record.status === 'issued').length, color: '#8768df' },
  { label: '已完成', value: ownRecords.value.filter(record => record.status === 'completed').length, color: '#258faf' }
])
function statusText(status) { return status === 'completed' ? '已完成' : status === 'issued' ? '已下发' : status === 'reviewed' ? '待下发' : status === 'withdrawn' ? '已撤回' : '待审核' }
const groups = [
  { group: 'content', name: '内容完整性' },
  { group: 'basis', name: '依据与参数' },
  { group: 'data', name: '数据一致性' },
  { group: 'form', name: '形式与结论' }
]
const sections = computed(() => [
  { kind: 'house', title: '房屋安全鉴定 · 问题分布', path: '/org-house-audit' },
  { kind: 'curtain', title: '幕墙安全鉴定 · 问题分布', path: '/org-field-inspection' }
].map(section => {
  const records = auditStore.records[section.kind].filter(record => record.source === 'organization' && record.organization === provincialState.user?.org && ['issued', 'completed'].includes(record.status))
  const issues = records.flatMap(record => record.issues || [])
  return { ...section, records, issues, distribution: groups.map(group => ({ ...group, value: issues.filter(issue => issue.group === group.group).length })) }
}))
const metrics = computed(() => [
  { label: '提交报告', value: ownRecords.value.length, unit: '份', note: '本机构房屋与幕墙报告合计', tone: 'indigo', icon: ClipboardCheck },
  { label: '房屋鉴定问题', value: sections.value[0].issues.length, unit: '项', note: `来自 ${sections.value[0].records.length} 份已下发报告`, tone: 'teal', icon: House },
  { label: '幕墙鉴定问题', value: sections.value[1].issues.length, unit: '项', note: `来自 ${sections.value[1].records.length} 份已下发报告`, tone: 'cyan', icon: ScanLine },
  { label: '重点关注', value: sections.value.reduce((sum, section) => sum + section.issues.filter(issue => issue.level === 'high').length, 0), unit: '项', note: '已下发问题中需优先复核', tone: 'amber', icon: TriangleAlert }
])
function chartOption(section) {
  const total = section.distribution.reduce((sum, item) => sum + item.value, 0)
  const data = total ? section.distribution.map((item, index) => ({ name: item.name, value: item.value, itemStyle: { color: chartColors[index], borderColor: '#fff', borderWidth: 4, borderRadius: 8 } })) : [{ name: '暂无问题', value: 1, itemStyle: { color: '#eaf0fb' } }]
  return {
    animationDuration: 650,
    tooltip: { trigger: 'item', formatter: total ? '{b}：{c}' : '暂无已下发报告', backgroundColor: '#fff', borderColor: '#e5eaf2', textStyle: { color: '#243248', fontSize: 12 } },
    series: [{ type: 'pie', radius: ['63%', '82%'], center: ['50%', '49%'], label: { show: false }, data }],
    graphic: [
      { type: 'text', left: 'center', top: '43%', style: { text: String(total), fill: '#243248', fontSize: 29, fontWeight: 700, textAlign: 'center' } },
      { type: 'text', left: 'center', top: '59%', style: { text: '问题总数', fill: '#68788f', fontSize: 11, textAlign: 'center' } }
    ]
  }
}
</script>

<style scoped>
.issue-chart-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:24px}.issue-chart-card{min-width:0}.issue-chart-card .chart-wrap{height:245px}.issue-chart-card .chart-legend{margin-top:8px}.issue-chart-foot{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:24px;padding-top:15px;border-top:1px solid #eaf0ff;color:#8b98aa;font-size:11px}.issue-chart-foot a{display:inline-flex;align-items:center;gap:5px;color:#235fd6;font-weight:700;text-decoration:none;white-space:nowrap}.issue-chart-foot a:hover{text-decoration:underline}@media(max-width:850px){.issue-chart-grid{grid-template-columns:1fr;gap:16px}}
.org-flow-card,.org-recent-card{padding:24px}.org-flow-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px;margin-top:18px}.org-flow-item{padding:17px 18px;border:1px solid #e6edf8;border-radius:13px;background:#f9fbff;display:grid;gap:10px;color:#68788f;font-size:12px}.org-flow-item strong{font-size:24px;color:#253650}.org-flow-item small{font-size:12px;color:#8b98aa}.org-flow-track{height:7px;border-radius:8px;background:#eaf0fa;overflow:hidden}.org-flow-track i{display:block;height:100%;border-radius:8px}.org-recent-list{display:grid}.org-recent-row{display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid #edf2f9}.org-recent-row:last-child{border:0}.org-recent-row>div{min-width:0;flex:1;display:grid;gap:5px}.org-recent-row strong{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px;color:#30415a}.org-recent-row small{font-size:11px;color:#91a0b4}@media(max-width:850px){.issue-chart-grid,.org-flow-grid{grid-template-columns:1fr;gap:16px}}
.org-ledger-link{display:inline-flex;align-items:center;gap:5px;color:#235fd6;font-size:11px;font-weight:700;text-decoration:none}.org-ledger-link:hover{text-decoration:underline}
</style>
