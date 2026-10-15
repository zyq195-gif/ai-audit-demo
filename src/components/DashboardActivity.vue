<template>
  <div class="activity-board">
    <div class="activity-meta"><span class="live-dot"></span><strong>报告动态</strong><span class="activity-divider"></span><span>持续更新</span><span class="activity-total">{{ records.length }} 份记录</span></div>
    <div v-if="!records.length" class="activity-empty">暂无报告动态</div>
    <div v-else class="activity-window" aria-label="最近报告动态">
      <div class="activity-track" :class="{ moving: records.length > 3 }" :style="{ '--scroll-duration': `${Math.max(22, records.length * 4.5)}s` }">
        <div v-for="copy in records.length > 3 ? 2 : 1" :key="copy" class="activity-group" :aria-hidden="copy === 2 ? 'true' : undefined">
          <article v-for="(record, index) in records" :key="`${copy}-${record.id}`" class="activity-row" :class="statusClass(record)">
            <span class="activity-index">{{ String(index + 1).padStart(2, '0') }}</span>
            <div class="activity-report"><strong :title="record.name">{{ record.name }}</strong><small>{{ record.time }} <span class="meta-separator">/</span> {{ record.organization || '未标记机构' }}</small></div>
            <span class="activity-kind">{{ record.kind === 'curtain' ? '幕墙安全鉴定' : '房屋安全鉴定' }}</span>
            <span class="activity-issues"><b>{{ (record.issues || []).length }}</b><small>问题</small></span>
            <span class="activity-status"><i></i>{{ statusText(record.status) }}</span>
          </article>
        </div>
      </div>
    </div>
    <div class="activity-foot"><span>● 实时状态</span><span>悬停暂停滚动</span></div>
  </div>
</template>

<script setup>
import { reportStatusClass } from '../utils/reportRecords'

defineProps({ records: { type: Array, default: () => [] } })
function statusClass(record) { return reportStatusClass(record) }
function statusText(status) { return status === 'completed' ? '已完成' : status === 'issued' ? '已下发' : status === 'reviewed' ? '待下发' : status === 'withdrawn' ? '已撤回' : status === 'reviewing' ? '审查中' : '待审核' }
</script>

<style scoped>
.activity-board{position:relative;overflow:hidden;padding:18px;border:1px solid #254b75;border-radius:16px;background:radial-gradient(circle at 82% -20%,rgba(49,137,231,.28),transparent 42%),linear-gradient(145deg,#122b4b,#0b1d36 78%);box-shadow:inset 0 1px 0 rgba(196,229,255,.1),0 14px 30px rgba(20,53,98,.12);color:#d8ebff}
.activity-board::before{position:absolute;inset:0;pointer-events:none;opacity:.28;background-image:linear-gradient(rgba(95,170,233,.1) 1px,transparent 1px),linear-gradient(90deg,rgba(95,170,233,.1) 1px,transparent 1px);background-size:28px 28px;content:""}
.activity-meta,.activity-window,.activity-foot{position:relative}.activity-meta{display:flex;align-items:center;gap:9px;margin-bottom:14px;color:#8db5d9;font-size:11px}.activity-meta strong{color:#e8f5ff;font-size:13px;letter-spacing:.05em}.live-dot{width:8px;height:8px;border-radius:50%;background:#36d9c5;box-shadow:0 0 0 4px rgba(54,217,197,.12),0 0 12px #36d9c5}.activity-divider{height:13px;width:1px;background:#477194}.activity-total{margin-left:auto;padding:4px 9px;border:1px solid rgba(116,186,244,.25);border-radius:99px;color:#addbff}
.activity-window{height:244px;overflow:hidden;mask-image:linear-gradient(to bottom,transparent,#000 5%,#000 95%,transparent)}.activity-track.moving{animation:activity-scroll var(--scroll-duration) linear infinite}.activity-window:hover .activity-track{animation-play-state:paused}.activity-group{display:grid;gap:7px;padding-bottom:7px}.activity-row{display:grid;grid-template-columns:35px minmax(0,1.8fr) minmax(116px,.8fr) 62px 74px;align-items:center;gap:12px;min-height:72px;padding:10px 14px;border:1px solid rgba(110,176,232,.18);border-left:2px solid #63aff3;border-radius:10px;background:linear-gradient(90deg,rgba(52,109,166,.21),rgba(23,57,97,.33));transition:background .2s,border-color .2s}.activity-row:hover{border-color:rgba(111,195,255,.62);background:rgba(56,116,175,.34)}.activity-index{color:#5ebde9;font-size:16px;font-weight:800;font-variant-numeric:tabular-nums}.activity-report{display:grid;gap:6px;min-width:0}.activity-report strong,.activity-report small{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.activity-report strong{color:#f1f8ff;font-size:12px}.activity-report small{color:#83a7c7;font-size:10px}.meta-separator{padding:0 3px;color:#5081ae}.activity-kind{color:#a2cae7;font-size:11px}.activity-issues{display:flex;align-items:baseline;gap:4px;justify-content:center;color:#d6ebff}.activity-issues b{font-size:18px;font-variant-numeric:tabular-nums}.activity-issues small{font-size:10px;color:#83a7c7}.activity-status{display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:5px 7px;border-radius:99px;background:rgba(139,164,191,.17);color:#c4d0de;font-size:10px;white-space:nowrap}.activity-status i{width:5px;height:5px;border-radius:50%;background:currentColor}.audit-reviewed .activity-status{background:rgba(93,160,255,.19);color:#80baff}.audit-returned .activity-status{background:rgba(152,111,243,.2);color:#c4a8ff}.audit-issued .activity-status{background:rgba(44,204,170,.17);color:#6ae0c4}.activity-foot{display:flex;justify-content:space-between;margin-top:11px;color:#7299ba;font-size:10px}.activity-foot span:first-child{color:#53cdbf}
.activity-empty{display:grid;place-items:center;height:244px;border:1px dashed rgba(138,190,235,.24);border-radius:10px;color:#8dafcb;font-size:12px}
@keyframes activity-scroll{to{transform:translateY(-50%)}}
@media(max-width:760px){.activity-row{grid-template-columns:27px minmax(0,1fr) 62px;gap:8px;padding:9px 10px}.activity-kind,.activity-issues{display:none}.activity-window{height:244px}}
@media(prefers-reduced-motion:reduce){.activity-track.moving{animation:none}.activity-window{overflow:auto;mask-image:none}}
.activity-board{border-color:#e1eaf8;background:linear-gradient(135deg,#f8fbff 0%,#fff 55%,#f6f9ff 100%);box-shadow:inset 0 1px 0 #fff;color:#40516b}
.activity-board::before{opacity:.32;background-image:linear-gradient(rgba(84,132,204,.08) 1px,transparent 1px),linear-gradient(90deg,rgba(84,132,204,.08) 1px,transparent 1px)}
.activity-meta{color:#8b98aa}.activity-meta strong{color:#30425c}.live-dot{background:#2aa99d;box-shadow:0 0 0 4px rgba(42,169,157,.1)}.activity-divider{background:#d9e5f5}.activity-total{border-color:#dce8fb;background:#fff;color:#5276ac}
.activity-row{border-color:#e2eafa;border-left-color:#6e9de7;background:rgba(255,255,255,.86);box-shadow:0 3px 12px rgba(46,83,145,.04)}.activity-row:hover{border-color:#a7c2f2;background:#f3f7ff}.activity-index{color:#5687d8}.activity-report strong{color:#30425c}.activity-report small{color:#8b98aa}.meta-separator{color:#b3c2d6}.activity-kind{color:#687e9c}.activity-issues{color:#235fd6}.activity-issues small{color:#8b98aa}
.activity-status{background:#f2f5f9;color:#8796aa}.audit-reviewed .activity-status{background:#edf3ff;color:#4d7ed4}.audit-returned .activity-status{background:#f1edff;color:#8060cb}.audit-issued .activity-status{background:#e8f7f3;color:#198f7b}.activity-foot{color:#91a0b4}.activity-foot span:first-child{color:#259e93}.activity-empty{border-color:#dce8f8;color:#8b98aa}
</style>
