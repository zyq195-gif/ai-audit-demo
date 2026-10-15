<template>
  <div class="dashboard">
    <section class="metrics-grid" aria-label="监管概览">
      <article v-for="metric in metrics" :key="metric.label" class="metric-card surface" :class="metric.tone">
        <div class="metric-top"><span>{{ metric.label }}</span><span class="metric-icon" :class="metric.tone"><component :is="metric.icon" :size="18" /></span></div>
        <div class="metric-value">{{ metric.value.toLocaleString() }}<small>{{ metric.unit }}</small></div>
        <div class="metric-note"><span class="metric-mini-dot" :class="metric.tone"></span>{{ metric.note }}</div>
      </article>
    </section>
    <div class="content-grid">
      <section class="surface overview-card">
        <div class="card-heading"><div><span class="section-kicker">01 / 区域概览</span><h2>各市鉴定报告提交量</h2></div><span class="history-count">福建九市 · 单位：份</span></div>
        <div class="city-summary"><div><span>省内提交</span><strong>{{ cityTotal }} <small>份</small></strong></div><div><span>有提交城市</span><strong>{{ activeCityCount }} <small>/ 9 市</small></strong></div><div><span>提交最多</span><strong class="city-leader">{{ cityCounts[0]?.[1] ? cityCounts[0][0] : '暂无' }}</strong></div></div>
        <div class="city-list"><div v-for="([name, count], index) in cityCounts" :key="name" class="city-row" :title="`${name}提交 ${count} 份，占省内提交量 ${cityShare(count)}%`"><span class="city-rank">{{ String(index + 1).padStart(2, '0') }}</span><span class="city-name">{{ name }}</span><div class="city-track"><i :style="{ width: count / maxCity * 100 + '%' }"></i></div><strong>{{ count }} <small>份</small></strong><span class="city-share">{{ cityShare(count) }}%</span></div></div>
        <p class="city-footnote">按检测机构所在城市汇总；无提交记录的城市显示为 0。</p>
      </section>
      <div class="side-stack">
        <section class="surface overview-card compact-card distribution-card"><div class="card-heading"><div><span class="section-kicker">02 / 问题洞察</span><h2>已下发问题分布</h2></div><span class="card-corner-icon"><ChartNoAxesCombined :size="17" /></span></div><div class="chart-wrap"><v-chart :option="distributionOption" autoresize /></div><div class="chart-legend"><span v-for="(item, index) in distribution" :key="item.name"><i :style="{ background: chartColors[index] }"></i>{{ item.name }} <b>{{ item.value }}</b></span></div></section>
        <section class="surface overview-card compact-card"><div class="card-heading"><div><span class="section-kicker">03 / 机构提交</span><h2>检测机构报告量</h2></div></div><ol class="rank-list"><li v-for="([name, score], index) in orgCounts.slice(0, 5)" :key="name"><span>{{ index + 1 }}</span><strong>{{ name }}</strong><b>{{ score }} 份</b></li></ol></section>
      </div>
    </div>
    <section class="surface overview-card trend-card"><div class="card-heading"><div><span class="section-kicker">04 / 提交趋势</span><h2>鉴定报告提交（近 7 日）</h2></div></div><div class="trend-chart"><div v-for="item in trend" :key="item.day" class="trend-column"><strong>{{ item.count }}</strong><div class="trend-track"><i :style="{ height: item.count / maxTrend * 100 + '%' }"></i></div><span>{{ item.day }}</span></div></div></section>
    <section class="history-card surface"><div class="card-heading history-heading"><div><span class="section-kicker">05 / 最近核查</span><h2>近期鉴定报告</h2></div><router-link class="standard-more" to="/records">查看台账 <ArrowRight :size="14" /></router-link></div><DashboardActivity :records="recent" /></section>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { ArrowRight, Building2, ChartNoAxesCombined, ClipboardCheck, Database, TriangleAlert } from 'lucide-vue-next'
import DashboardActivity from '../components/DashboardActivity.vue'
import { provincialState } from '../state/provincialState'
import { auditStore } from '../state/auditStore'
import { reportStatusRank } from '../utils/reportRecords'

const metrics = computed(() => [
  { label: '接入检测机构', value: provincialState.organizations.filter(item => item[2] === '启用').length, unit: '家', note: `已启用 / 共登记 ${provincialState.organizations.length} 家`, tone: 'indigo', icon: Building2 },
  { label: '待审报告', value: organizationReports.value.filter(record => ['pending', 'reviewing'].includes(record.status)).length, unit: '份', note: '机构提交后等待监管审查', tone: 'teal', icon: Database },
  { label: '已完成报告', value: organizationReports.value.filter(record => record.status === 'completed').length, unit: '份', note: '审核结果已确认并下发', tone: 'cyan', icon: ClipboardCheck },
  { label: '待下发报告', value: organizationReports.value.filter(record => record.status === 'reviewed').length, unit: '份', note: '需上传或确认审核报告', tone: 'amber', icon: TriangleAlert }
])
const organizationReports = computed(() => [...auditStore.records.house, ...auditStore.records.curtain].filter(record => record.source === 'organization'))
const chartColors = ['#235FD6', '#78A2EA', '#B5CDF3', '#DBE7FA']
const issueRecords = computed(() => {
  const all = [...auditStore.records.house, ...auditStore.records.curtain]
  const issued = all.filter(record => record.source === 'organization' && ['issued', 'completed'].includes(record.status))
  return issued.length ? issued : all.filter(record => record.source === 'sample')
})
const distribution = computed(() => [
  { name: '内容完整性', group: 'content' },
  { name: '依据与参数', group: 'basis' },
  { name: '数据一致性', group: 'data' },
  { name: '形式与结论', group: 'form' }
].map(item => ({ name: item.name, value: issueRecords.value.reduce((sum, record) => sum + (record.issues || []).filter(issue => issue.group === item.group).length, 0) })))
const distributionOption = computed(() => ({
  tooltip: { trigger: 'item', formatter: '{b}：{c}', backgroundColor: '#fff', borderColor: '#E5EAF2', textStyle: { color: '#243248', fontSize: 12 } },
  series: [{ type: 'pie', radius: ['62%', '80%'], center: ['50%', '48%'], label: { show: false }, data: distribution.value.map((item, index) => ({ ...item, itemStyle: { color: chartColors[index], borderColor: '#fff', borderWidth: 4, borderRadius: 8 } })) }],
  graphic: [{ type: 'text', left: 'center', top: '42%', style: { text: String(distribution.value.reduce((sum, item) => sum + item.value, 0)), fill: '#243248', fontSize: 28, fontWeight: 700, textAlign: 'center' } }, { type: 'text', left: 'center', top: '58%', style: { text: issuedChartLabel.value, fill: '#68788F', fontSize: 11, textAlign: 'center' } }]
}))
const issuedChartLabel = computed(() => issueRecords.value.some(record => record.source === 'organization') ? '已下发问题' : '样例分布')
const recent = computed(() => ['house', 'curtain'].flatMap(kind => auditStore.records[kind].filter(record => record.source === 'organization').map(record => ({ ...record, kind }))).sort((a, b) => reportStatusRank(a) - reportStatusRank(b) || String(b.time).localeCompare(String(a.time))).slice(0, 12))
const orgCounts = computed(() => Object.entries(organizationReports.value.reduce((sum, record) => { const name = record.organization || '未标记机构'; sum[name] = (sum[name] || 0) + 1; return sum }, {})).sort((a, b) => b[1] - a[1]))
const fujianCities = ['福州', '厦门', '泉州', '漳州', '莆田', '三明', '南平', '龙岩', '宁德']
const cityCounts = computed(() => {
  const counts = Object.fromEntries(fujianCities.map(name => [name, 0]))
  for (const record of organizationReports.value) {
    const city = fujianCities.find(name => String(record.organization || '').startsWith(name))
    if (city) counts[city] += 1
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1])
})
const maxCity = computed(() => Math.max(1, ...cityCounts.value.map(item => item[1])))
const cityTotal = computed(() => cityCounts.value.reduce((sum, [, count]) => sum + count, 0))
const activeCityCount = computed(() => cityCounts.value.filter(([, count]) => count > 0).length)
function cityShare(count) { return cityTotal.value ? Math.round(count / cityTotal.value * 100) : 0 }
const trend = computed(() => Array.from({ length: 7 }, (_, index) => { const date = new Date(); date.setDate(date.getDate() - 6 + index); const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; return { day: `${date.getMonth() + 1}/${date.getDate()}`, count: organizationReports.value.filter(record => String(record.time).startsWith(key)).length } }))
const maxTrend = computed(() => Math.max(1, ...trend.value.map(item => item.count)))
</script>

<style scoped>
.severity-list strong{margin-left:auto;color:#243248}.severity-dot{width:9px;height:9px;border-radius:50%}.severity-dot.high{background:#d5768a}.severity-dot.mid{background:#7968d9}.severity-dot.low{background:#258faf}.rank-list{list-style:none;margin:20px 0 0;padding:0;display:grid;gap:12px}.rank-list li{display:flex;align-items:center;gap:10px;font-size:11px}.rank-list li span{width:21px;height:21px;border-radius:7px;background:#eaf0ff;color:#235fd6;display:grid;place-items:center;font-weight:700}.rank-list li strong{color:#40516b;font-weight:650;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.overview-card{padding:24px;min-width:0}.city-list{display:grid;gap:15px;margin-top:28px}.city-row{display:grid;grid-template-columns:38px 1fr 36px;align-items:center;gap:12px;font-size:11px;color:#68788f}.city-row strong{text-align:right;color:#40516b}.city-track{height:12px;border-radius:20px;background:#eef3fc;overflow:hidden}.city-track i{display:block;height:100%;border-radius:20px;background:linear-gradient(90deg,#258faf,#235fd6)}.compact-card{min-height:220px}.severity-list{display:grid;gap:13px;margin-top:24px}.severity-list>div{display:flex;align-items:center;gap:10px;font-size:12px;color:#68788f}.severity-list strong{color:#40516b;font-weight:650;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.rank-list li b{margin-left:auto;color:#235fd6}.history-card{margin-top:0;padding-bottom:24px}.trend-chart{height:190px;display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:18px;align-items:end;margin-top:22px}.trend-column{height:100%;display:flex;flex-direction:column;align-items:center;gap:6px;font-size:10px;color:#8b98aa}.trend-column strong{font-size:10px;color:#40516b}.trend-track{width:min(65%,78px);height:145px;display:flex;align-items:flex-end;background:#f5f7fb;border-radius:8px;overflow:hidden}.trend-track i{display:block;width:100%;border-radius:8px 8px 0 0;background:linear-gradient(#79a4e8,#235fd6)}
.distribution-card{min-height:354px}.distribution-card .chart-wrap{height:195px}.distribution-card .chart-legend{margin-top:3px}
.city-list{gap:11px;margin-top:20px}.city-row{grid-template-columns:38px 1fr 36px}.city-track{height:10px}
.province-flow{padding:24px}.province-flow-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;margin-top:18px}.province-flow-item{display:grid;gap:10px;padding:18px;border:1px solid #e4ebf8;border-radius:13px;background:#f9fbff;color:#68788f;font-size:12px}.province-flow-item strong{color:#253650;font-size:25px}.province-flow-item small{font-size:12px;color:#8b98aa}.province-flow-track{height:7px;border-radius:8px;background:#eaf0fa;overflow:hidden}.province-flow-track i{display:block;height:100%;border-radius:8px}.province-kind-grid{display:flex;gap:20px;margin-top:20px;border-top:1px solid #edf2f9;padding-top:18px}.province-kind-grid>div{display:flex;gap:10px;align-items:center;color:#68788f;font-size:12px}.province-kind-grid strong{color:#235fd6}@media(max-width:850px){.province-flow-grid{grid-template-columns:1fr}.province-kind-grid{flex-wrap:wrap}}
.overview-card:has(.city-list){display:flex;flex-direction:column}
.city-summary{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:20px}
.city-summary>div{display:grid;gap:7px;padding:12px 15px;border:1px solid #e4ebf8;border-radius:11px;background:#f8faff}
.city-summary span{font-size:10px;color:#8290a5}.city-summary strong{font-size:19px;line-height:1.2;color:#235fd6}.city-summary strong small{font-size:10px;font-weight:500;color:#8290a5}.city-summary .city-leader{font-size:15px}
.city-list{flex:1;align-content:space-around;gap:8px;margin-top:13px}
.city-row{grid-template-columns:24px 38px minmax(0,1fr) 48px 36px;gap:10px;min-height:32px}
.city-rank{font-size:10px;color:#a1aec0}.city-name{font-weight:700;color:#40516b}.city-row strong{color:#235fd6;font-size:12px}.city-row strong small{font-size:9px;font-weight:500;color:#96a3b6}.city-share{text-align:right;color:#8b98aa;font-size:10px}
.city-track{height:11px}.city-footnote{margin:12px 0 0;padding-top:10px;border-top:1px solid #edf2f9;color:#91a0b3;font-size:10px}
@media(max-width:600px){.city-summary{grid-template-columns:repeat(3,minmax(0,1fr))}.city-summary>div{padding:10px}.city-row{grid-template-columns:20px 32px minmax(0,1fr) 42px 32px;gap:5px}}
.severity-list strong{margin-left:auto;color:#243248}
</style>

