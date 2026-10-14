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
          <div class="workspace-head-actions"><span class="state-pill" :class="reviewMode ? 'idle' : session.status">{{ statusLabel }}</span><button v-if="(reviewMode && selectedReviewRecord) || (organizationMode && currentRecord?.source === 'organization')" class="icon-button workspace-close-button" type="button" aria-label="关闭当前报告" title="关闭当前报告" @click="closeWorkspace"><X :size="19" :stroke-width="2.7" /></button></div>
        </div>
        <div class="stepper" aria-label="审核步骤">
          <div v-for="(step, index) in steps" :key="step" class="step" :class="{ done: stepIndex > index, active: stepIndex === index }">
            <span class="step-number"><Check v-if="stepIndex > index" :size="13" />{{ stepIndex > index ? '' : String(index + 1).padStart(2, '0') }}</span><span>{{ step }}</span>
          </div>
        </div>

        <div v-if="reviewMode" class="intake-panel review-workspace">
          <div class="intake-heading"><div><strong>鉴定资料</strong><span>{{ selectedReviewRecord ? `${selectedReviewRecord.organization} · 第 ${selectedReviewRecord.versions?.at(-1)?.number || 1} 版` : '从右侧选择待审报告，材料将显示在下方' }}</span><span v-if="selectedReviewRecord?.reviewScope" class="review-scope-hint">审查范围：{{ scopeName(selectedReviewRecord.reviewScope) }}</span></div><span class="intake-count">{{ selectedReviewRecord ? '3/3 已提交' : '等待选择' }}</span></div>
          <div v-if="reviewHasResult" class="review-attachment-list" aria-label="已提交资料">
            <div v-for="material in auditMaterials" :key="material.key" class="review-attachment-group">
              <span class="review-attachment-label"><component :is="material.icon" :size="16" />{{ material.label }}<small>{{ recordAttachmentNames(selectedReviewRecord, material.key).length }} 份</small></span>
              <div class="review-attachment-files"><button v-for="(name, index) in recordAttachmentNames(selectedReviewRecord, material.key)" :key="`${name}-${index}`" type="button" :title="name" @click="openSubmissionFile(material.key, undefined, selectedReviewRecord, index)"><FileText :size="14" /><span>{{ name }}</span><ArrowUpRight :size="13" /></button></div>
            </div>
          </div>
          <div v-else class="materials-grid"><div v-for="material in auditMaterials" :key="material.key" class="material-card review-material-card" :class="{ uploaded: selectedReviewRecord }"><span class="material-icon"><component :is="material.icon" :size="21" /></span><span class="material-title">{{ material.label }} <em>{{ selectedReviewRecord ? `${recordAttachmentNames(selectedReviewRecord, material.key).length} 份` : '待选择' }}</em></span><div class="review-material-files"><button v-for="(name, index) in recordAttachmentNames(selectedReviewRecord, material.key)" :key="`${name}-${index}`" type="button" :title="name" @click="openSubmissionFile(material.key, undefined, selectedReviewRecord, index)"><FileText :size="13" />{{ name }}</button><button v-if="!selectedReviewRecord" type="button" disabled><FileText :size="13" />选择待审报告后查看</button></div></div></div>
          <div v-if="selectedPendingIds.length && !reviewHasResult" class="review-selected-list" aria-label="已选待审报告"><div v-for="(record, index) in workspaceRecords" :key="record.id" class="review-selected-item" :class="{ active: record.id === selectedReviewRecord?.id }"><button class="review-selected-focus" type="button" :aria-pressed="record.id === selectedReviewRecord?.id" @click="focusReviewRecord(record)"><span class="review-selected-number">{{ String(index + 1).padStart(2, '0') }}</span><span class="review-selected-copy"><strong :title="record.name">{{ record.name }}</strong><small>{{ record.organization }} · {{ record.time }}</small></span><span class="review-selected-state">{{ record.id === selectedReviewRecord?.id ? '当前查看' : '点击查看' }}</span></button><button class="review-selected-remove" type="button" :aria-label="`取消选择 ${record.name}`" title="取消选择" @click="removeSelectedPending(record)"><X :size="15" /></button></div></div>
          <div v-if="reviewBatchIds.length && selectedReviewRecord" class="review-page-nav"><span>审核结果 {{ reviewBatchIds.indexOf(selectedReviewRecord.id) + 1 }} / {{ reviewBatchIds.length }}</span><div><button type="button" :disabled="reviewBatchIds.indexOf(selectedReviewRecord.id) <= 0" @click="turnReviewPage(-1)">上一份</button><button type="button" :disabled="reviewBatchIds.indexOf(selectedReviewRecord.id) >= reviewBatchIds.length - 1" @click="turnReviewPage(1)">下一份</button></div></div>
          <div v-if="!selectedReviewRecord || selectedReviewRecord.status === 'pending'" class="review-start-row"><label class="review-scope province-review-scope"><span><strong>审查范围</strong><small>{{ selectedPendingIds.length ? `已选 ${selectedPendingIds.length} 份` : '选择待审报告' }}</small></span><select v-model="provinceScope" aria-label="审查范围" :disabled="!selectedPendingIds.length"><option value="" disabled>请选择审查范围</option><option v-for="scope in reviewScopes" :key="scope.value" :value="scope.value">{{ scope.label }}</option></select></label><button class="button button-primary" type="button" :disabled="!canBeginReview" @click="beginReview"><Play :size="16" fill="currentColor" /> 开始审查</button></div>
          <div v-if="selectedReviewRecord?.status === 'reviewing'" class="review-audit-status"><ScanSearch :size="22" /><span>正在审查鉴定报告并生成审核结果…</span><span class="review-audit-progress" aria-hidden="true"></span></div>
          <div v-if="selectedReviewRecord && ['reviewed', 'issued', 'completed'].includes(selectedReviewRecord.status)" class="result-panel review-result-panel"><div class="result-banner"><div class="result-check"><Check :size="23" /></div><div><span>{{ selectedReviewRecord.status === 'completed' ? '审核流程已完成' : selectedReviewRecord.status === 'issued' ? '审核意见已下发' : '审核已完成 · 待确认下发' }}</span><strong>发现 {{ activeIssues.length }} 项问题</strong></div><span class="result-time">{{ selectedReviewRecord.reviewedAt }}</span></div><div class="issue-snapshot"><div class="issue-snapshot-head"><span>主要问题摘要</span><button type="button" @click="previewReview">查看全部 <ArrowRight :size="14" /></button></div><div v-for="issue in activeIssues.slice(0, 2)" :key="issue.id" class="snapshot-row"><span class="issue-dot" :class="issue.level"></span><span>{{ issue.title }}</span><small>第 {{ issue.page }} 页</small></div></div></div>
          <input ref="reviewReportInput" class="visually-hidden" type="file" accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" @change="chooseReviewReport" />
          <div v-if="selectedReviewRecord && selectedReviewRecord.status !== 'pending'" class="review-workspace-actions"><span v-if="selectedReviewRecord.status === 'reviewing'" class="review-progress">正在生成审核结果…</span><template v-else-if="selectedReviewRecord.status === 'reviewed'"><button v-if="selectedReviewRecord.reviewReportName" class="review-dispatch-note review-word-link" type="button" :title="`查看 ${selectedReviewRecord.reviewReportName}`" @click="openReviewWord(selectedReviewRecord)">已上传审核报告：{{ selectedReviewRecord.reviewReportName }} <Eye :size="14" /></button><div class="review-action-buttons" :class="{ 'ready-to-issue': selectedReviewRecord.reviewReportName }"><button class="button button-secondary" type="button" @click="previewReview"><Eye :size="16" /> {{ selectedReviewRecord.reviewReportName ? '智能审核结果' : '预览结果' }}</button><button v-if="!selectedReviewRecord.reviewReportName" class="button button-secondary" type="button" @click="downloadReport"><Download :size="16" /> 下载审核报告</button><button v-if="!selectedReviewRecord.reviewReportName" class="button review-save-button" type="button" @click="saveReviewForLater">暂存</button><div v-if="!selectedReviewRecord.reviewReportName" ref="dispatchMenu" class="dispatch-combo"><button class="button button-primary" type="button" @click="issueReview">确认并下发 <small>{{ dispatchOutcome === 'revise' ? '需修改' : '审核无误' }}</small></button><button class="dispatch-trigger" type="button" aria-label="选择下发结论" aria-haspopup="listbox" :aria-expanded="dispatchMenuOpen" @click="dispatchMenuOpen = !dispatchMenuOpen"><ChevronDown :size="15" /></button><div v-if="dispatchMenuOpen" class="dispatch-popover" role="listbox" aria-label="下发结论"><span class="dispatch-popover-title">选择下发结论</span><button type="button" role="option" :aria-selected="dispatchOutcome === 'revise'" :class="{ selected: dispatchOutcome === 'revise' }" @click="chooseDispatchOutcome('revise')"><span class="dispatch-option-icon revise"><ArrowRight :size="16" /></span><span class="dispatch-option-copy"><strong>需机构修改</strong><small>下发意见，等待机构重新上传</small></span><Check v-if="dispatchOutcome === 'revise'" :size="16" class="dispatch-option-check" /></button><button type="button" role="option" :aria-selected="dispatchOutcome === 'approved'" :class="{ selected: dispatchOutcome === 'approved' }" @click="chooseDispatchOutcome('approved')"><span class="dispatch-option-icon approved"><Check :size="16" /></span><span class="dispatch-option-copy"><strong>审核无误</strong><small>下发结果，完成审核流程</small></span><Check v-if="dispatchOutcome === 'approved'" :size="16" class="dispatch-option-check" /></button></div></div><button v-else class="button button-primary" type="button" @click="issueReview">确认并下发</button></div></template><button v-else-if="['issued', 'completed'].includes(selectedReviewRecord.status)" class="button button-secondary" type="button" @click="showPreview = true"><Eye :size="16" /> 查看已下发结果</button></div>
        </div>

        <div v-else-if="revisionMode || session.status === 'idle' || session.status === 'ready'" class="intake-panel">
          <div class="intake-heading"><div><strong>{{ revisionMode ? '重新上传鉴定资料' : '上传鉴定资料' }}</strong><span>{{ revisionMode ? '已填充上一版资料，可逐份移除或替换后提交新版本' : '请上传鉴定报告、计算书和原始文件' }}</span></div><span class="intake-count">{{ uploadedCount }}/3 类已上传</span></div>
          <div class="materials-grid">
            <button v-for="material in materials" :key="material.key" class="material-card" :class="{ uploaded: materialCount(material.key), dragging: draggingMaterial === material.key }" type="button" @click="openPicker(material.key)" @dragover.prevent="draggingMaterial = material.key" @dragleave.prevent="draggingMaterial = ''" @drop.prevent="handleDrop($event, material.key)">
              <span class="material-icon"><component :is="material.icon" :size="21" /></span>
              <span class="material-title">{{ material.label }} <em>必传</em><span v-if="material.key === 'report' && materialCount('report')" class="material-remove" role="button" tabindex="0" aria-label="移除已上传报告" @click.stop="removeDraftReport" @keydown.enter.stop.prevent="removeDraftReport" @keydown.space.stop.prevent="removeDraftReport"><X :size="14" /></span></span>
              <span class="material-name" :title="materialNames(material.key).join('、')">{{ materialCount(material.key) ? organizationMode && material.key !== 'report' ? `${materialCount(material.key)} 份 · ${materialNames(material.key).join('、')}` : materialNames(material.key)[0] : material.hint }}</span>
              <span class="material-action">{{ materialCount(material.key) ? organizationMode && material.key !== 'report' ? '继续添加 PDF' : '更换文件' : '选择 PDF' }} <ArrowUpRight :size="14" /></span>
            </button>
          </div>
          <div v-if="organizationMode && (revisionMode || session.organizationFiles.calculation.length || session.organizationFiles.original.length)" class="organization-file-list"><div v-for="type in ['calculation', 'original']" :key="type"><template v-for="(file, index) in revisionMode ? revisionEntries[type] : session.organizationFiles[type]" :key="`${type}-${index}`"><span>{{ type === 'calculation' ? '计算书' : '原始文件' }} · {{ file.name }}</span><button type="button" :aria-label="`移除 ${file.name}`" @click="revisionMode ? removeRevisionEntry(type, index) : removeOrganizationMaterial(props.kind, type, index)"><X :size="13" /></button></template></div></div>
          <textarea v-if="revisionMode" v-model="revisionNote" class="revision-note" placeholder="本版修改内容（可选）" aria-label="本版修改内容"></textarea><div class="intake-limit"><ShieldCheck :size="14" /> 支持 PDF；鉴定报告每次 1 份，计算书与原始文件可上传多份，单文件不超过 100 MB</div>
          <div class="intake-footer"><label v-if="!organizationMode" class="review-scope"><span><strong>审查范围</strong><small>可提前选择</small></span><select v-model="selectedScope" aria-label="审查范围"><option value="" disabled>请选择审查范围</option><option v-for="scope in reviewScopes" :key="scope.value" :value="scope.value">{{ scope.label }}</option></select></label><span v-else class="org-upload-note">三类材料齐全后可提交省站审核</span><button class="button button-primary" type="button" :disabled="organizationMode ? !allMaterialsUploaded || submitting : session.status !== 'ready'" @click="beginAudit"><Play :size="16" fill="currentColor" /> {{ revisionMode ? '重新提交省站' : organizationMode ? '提交待审报告' : '开始智能审核' }}</button></div>
        </div>

        <div v-else class="work-body">
          <div class="file-summary"><div class="file-icon"><FileText :size="23" /></div><div class="file-copy"><strong :title="currentName">{{ currentName }}</strong><span>{{ fileSubtitle }}</span></div></div>
          <div v-if="organizationMode && currentRecord?.source === 'organization'" class="review-attachment-list" aria-label="已上传资料详情"><div v-for="material in auditMaterials" :key="material.key" class="review-attachment-group"><span class="review-attachment-label"><component :is="material.icon" :size="16" />{{ material.label }}<small>{{ recordAttachmentNames(currentRecord, material.key).length }} 份</small></span><div class="review-attachment-files"><button v-for="(name, index) in recordAttachmentNames(currentRecord, material.key)" :key="`${name}-${index}`" type="button" :title="name" @click="openSubmissionFile(material.key, undefined, currentRecord, index)"><FileText :size="14" /><span>{{ name }}</span><ArrowUpRight :size="13" /></button></div></div></div>
          <div v-if="organizationMode && currentRecord?.source === 'organization' && currentRecord.status !== 'completed'" class="result-panel"><div class="result-banner"><div class="result-check"><Check :size="23" /></div><div><span>报告进度</span><strong>{{ recordStatus(currentRecord) }}</strong></div><span class="result-time">{{ currentRecord.time }}</span></div><div class="result-actions"><button v-if="currentRecord.status === 'pending'" class="button button-primary" type="button" @click="withdrawCurrent">撤回提交</button></div></div>
          <div v-else-if="session.status === 'auditing'" class="audit-panel" aria-live="polite">
            <div class="scan-visual"><div class="scan-circle scan-circle-one"></div><div class="scan-circle scan-circle-two"></div><ScanSearch :size="45" :stroke-width="1.2" /></div>
            <div class="audit-copy"><span class="section-kicker">AI AUDITING</span><h3>{{ currentStage }}</h3><p>正在审查鉴定资料并生成结果，请稍候。</p></div>
            <div class="progress-head"><span>审核进度</span><strong>{{ session.progress }}%</strong></div>
            <div class="progress-track" role="progressbar" :aria-valuenow="session.progress" aria-valuemin="0" aria-valuemax="100"><span :style="{ width: session.progress + '%' }"></span></div>
            <div class="progress-steps"><span v-for="(item, index) in auditStages" :key="item" :class="{ reached: session.progress >= index * 25 }">{{ item }}</span></div>
          </div>
          <div v-else class="result-panel">
            <div class="result-banner"><div class="result-check"><Check :size="23" /></div><div><span>审核已完成</span><strong>发现 {{ activeIssues.length }} 项问题</strong></div><span class="result-time">{{ currentRecord?.reviewedAt || currentRecord?.time || '' }}</span></div>
            <div class="result-actions"><button class="button button-secondary" @click="showPreview = true"><Eye :size="16" /> 预览问题</button><button class="button button-primary" @click="downloadReport"><Download :size="16" /> 导出 Word 报告</button></div>
            <div class="issue-snapshot"><div class="issue-snapshot-head"><span>主要问题摘要</span><button @click="showPreview = true">查看全部 <ArrowRight :size="14" /></button></div><div v-for="issue in activeIssues.slice(0, 2)" :key="issue.id" class="snapshot-row"><span class="issue-dot" :class="issue.level"></span><span>{{ issue.title }}</span><small>第 {{ issue.page }} 页</small></div></div>
          </div>

        </div>
      </section>

      <div class="side-stack" :class="{ 'queue-only': reviewMode || organizationMode }">
        <section v-if="reviewMode" class="insights-card surface pending-side-card"><div class="standards-card-head pending-side-head"><span class="focus-icon"><ClipboardList :size="19" /></span><div><span class="section-kicker">待审队列 / 当前待审</span><h3>{{ pendingRecords.length }} 份待审报告</h3></div><span class="history-count pending-selected-count">{{ selectedPendingIds.length }} 已选</span></div><label class="queue-search search-box"><Search :size="15" /><input v-model="queueKeyword" type="search" placeholder="搜索报告、机构、时间等" /></label><div class="pending-side-list"><button v-for="record in filteredPendingRecords" :key="record.id" type="button" class="pending-side-item" :class="{ active: selectedPendingIds.includes(record.id) }" :aria-pressed="selectedPendingIds.includes(record.id)" @click="selectReviewRecord(record)"><span class="pending-check" aria-hidden="true"><Check v-if="selectedPendingIds.includes(record.id)" :size="14" /></span><span class="table-file-icon"><FileText :size="18" /></span><span class="pending-side-copy"><strong :title="record.name">{{ record.name }}</strong><small>{{ record.organization }} · 第 {{ record.versions?.at(-1)?.number || 1 }} 版</small><small>{{ record.time }}</small></span><em>{{ recordStatus(record) }}</em></button><p v-if="!filteredPendingRecords.length" class="pending-side-empty">暂无符合条件的待审报告。</p></div></section>
        <section v-else-if="organizationMode" class="insights-card surface pending-side-card org-pending-card"><div class="standards-card-head pending-side-head"><span class="focus-icon"><ClipboardList :size="19" /></span><div><span class="section-kicker">待审队列 / 本机构</span><h3>{{ organizationUnreviewedRecords.length }} 份待审报告</h3></div></div><label class="queue-search search-box"><Search :size="15" /><input v-model="queueKeyword" type="search" placeholder="搜索报告、时间等" /></label><div class="pending-side-list"><button v-for="record in filteredOrganizationPending" :key="record.id" type="button" class="pending-side-item org-pending-item" :class="{ active: session.selectedRecord?.id === record.id }" @click="selectHistory(record)"><span class="table-file-icon"><FileText :size="18" /></span><span class="pending-side-copy"><strong :title="record.name">{{ record.name }}</strong><small>第 {{ record.versions?.at(-1)?.number || 1 }} 版 · {{ record.time }}</small></span><em>{{ recordStatus(record) }}</em></button><p v-if="!filteredOrganizationPending.length" class="pending-side-empty">暂无符合条件的待审报告。</p></div></section>
        <section v-else class="insights-card surface"><div class="card-heading compact"><div><span class="section-kicker">02 / 数据洞察</span><h2>问题分布</h2></div><span class="card-corner-icon"><ChartNoAxesCombined :size="17" /></span></div><div class="chart-wrap"><v-chart :option="chartOption" autoresize /></div><div class="chart-legend"><span v-for="(item, index) in distribution" :key="item.name"><i :style="{ background: chartColors[index] }"></i>{{ item.name }} <b>{{ item.value }}</b></span></div></section>
      </div>
    </div>

    <section class="history-card surface" :class="{ 'review-history-card': reviewMode }">
      <div class="card-heading history-heading"><div><span class="section-kicker">03 / 历史记录</span><h2>近期审核记录</h2></div><div class="history-head-actions"><span class="history-count">共 {{ historyRecords.length }} 份报告</span><router-link class="standard-more" to="/records">查看台账 <ArrowRight :size="14" /></router-link></div></div>
      <div class="history-filter-row"><label class="search-box"><Search :size="16" /><input v-model="historyKeyword" type="search" placeholder="搜索报告、机构、文件、问题及时间" /></label><select v-model="historyStateFilter" aria-label="筛选记录状态"><option value="all">全部状态</option><option value="待下发">待下发</option><option value="已下发">已下发</option><option value="已完成">已完成</option></select><label class="history-date">从 <input v-model="historyStartDate" type="date" aria-label="开始日期" /></label><label class="history-date">至 <input v-model="historyEndDate" type="date" aria-label="结束日期" /></label></div>
      <div class="history-table-wrap"><table class="history-table"><thead><tr><th>报告文件</th><th>提交时间</th><th>问题</th><th>状态</th><th>操作</th></tr></thead><tbody><tr v-for="record in historyRecords" :key="record.id"><td><div class="table-file"><span class="table-file-icon"><FileText :size="18" /></span><div><strong :title="record.name">{{ record.name }}</strong><small>{{ record.organization || '未标记机构' }}</small></div></div></td><td>{{ record.time }}</td><td><span v-if="isReviewed(record)"><span class="count-dot"></span>{{ detailIssues(record).length }} 项</span><span v-else>—</span></td><td><span class="table-status" :class="reportStatusClass(record)"><span></span>{{ historyStatus(record) }}</span></td><td><div class="history-actions"><button class="text-action" @click="detailRecord = record">查看详情 <ArrowUpRight :size="14" /></button><button v-if="reviewMode && record.status === 'reviewed'" class="text-action" @click="reReview(record)">重新审核</button><button v-if="reviewMode && record.status === 'reviewed'" class="text-action" @click="openHistoryReviewUpload(record)">上传审核报告</button><button v-if="organizationMode && record.status === 'issued'" class="text-action" @click="reuploadRecord(record)">重新上传</button></div></td></tr></tbody></table></div>
    </section>

    <input ref="fileInput" class="visually-hidden" type="file" :accept="selectedAccept" :multiple="organizationMode && selectedMaterialType !== 'report'" @change="handleFileChange" />
    <div v-if="notice" class="toast" role="status"><CircleAlert :size="16" />{{ notice }}</div>

    <div v-if="submissionPreview" class="modal-backdrop" @click.self="closeSubmissionPreview"><section ref="submissionPanel" class="management-modal review-file-modal" role="dialog" aria-modal="true" aria-label="查看提交材料"><div class="management-modal-head"><div><span class="section-kicker">机构提交材料</span><h2>{{ submissionPreview.name }}</h2></div><div class="pdf-head-actions"><button v-if="submissionPreview.type === 'pdf'" class="button button-secondary" type="button" @click="togglePdfFullscreen(submissionPanel)"><Maximize2 :size="15" /> 全屏查看</button><button class="icon-button" type="button" aria-label="关闭" @click="closeSubmissionPreview"><X :size="18" /></button></div></div><div class="review-file-body"><div v-if="submissionPreview.reference" class="demo-reference-note">同类型参考 PDF：{{ submissionPreview.referenceName }}。参考文件与当前报告名称及机构不一一对应。</div><iframe v-if="submissionPreview.type === 'pdf'" :src="submissionPreview.url" title="鉴定资料 PDF 预览"></iframe><video v-else-if="submissionPreview.type === 'video'" :src="submissionPreview.url" controls></video><div v-else-if="submissionPreview.type === 'demo'" class="demo-material-preview"><FileText :size="38" /><strong>{{ submissionPreview.name }}</strong><span>当前材料未配备可预览的 PDF。</span></div><p v-else>此格式请下载后查看。</p><div class="review-file-actions"><a v-if="submissionPreview.url" class="button button-secondary" :href="submissionPreview.url" :download="submissionPreview.referenceName || submissionPreview.name"><Download :size="15" /> 下载文件</a><button class="button button-primary" type="button" @click="closeSubmissionPreview">关闭</button></div></div></section></div>

    <div v-if="wordPreview" class="modal-backdrop word-preview-backdrop" @click.self="closeReviewWord"><section class="management-modal word-preview-modal" role="dialog" aria-modal="true" aria-label="审核报告 Word 附件"><div class="management-modal-head"><div><span class="section-kicker">已上传审核报告 / Word 附件</span><h2>{{ wordPreview.name }}</h2></div><button class="icon-button" type="button" aria-label="关闭" @click="closeReviewWord"><X :size="18" /></button></div><div class="word-preview-body"><p class="word-preview-meta">{{ wordPreview.size }} · 上传时间 {{ wordPreview.time }}</p><div v-if="wordPreview.loading" class="word-preview-empty">正在读取文档内容…</div><div v-else-if="wordPreview.paragraphs.length" class="word-preview-content"><p v-for="(paragraph, index) in wordPreview.paragraphs" :key="index">{{ paragraph }}</p></div><div v-else class="word-preview-empty"><FileText :size="34" /><strong>当前格式无法在浏览器内完整显示</strong><span>可以打开原文件，或下载后使用 Word 查看完整排版与内容。</span></div></div><div class="word-preview-footer"><a class="button button-secondary" :href="wordPreview.url" target="_blank" rel="noopener">打开原文件</a><a class="button button-primary" :href="wordPreview.url" :download="wordPreview.name"><Download :size="15" /> 下载附件</a></div></section></div>
    <div v-if="detailRecord" class="modal-backdrop" @click.self="detailRecord = null">
      <section class="management-modal audit-detail-modal" role="dialog" aria-modal="true" aria-label="审核记录详情">
        <div class="management-modal-head"><div><span class="section-kicker">审核记录详情 / {{ config.title }}</span><h2>{{ detailRecord.name }}</h2></div><button class="icon-button" type="button" aria-label="关闭" @click="detailRecord = null"><X :size="18" /></button></div>
        <div class="management-detail audit-detail-body">
          <dl><div><dt>报告编号</dt><dd>{{ detailRecord.id }}</dd></div><div><dt>鉴定类型</dt><dd>{{ config.title }}</dd></div><div><dt>检测机构</dt><dd>{{ detailRecord.organization || '未标记机构' }}</dd></div><div><dt>当前版本</dt><dd>第 {{ detailRecord.versions?.at(-1)?.number || 1 }} 版</dd></div><div><dt>提交时间</dt><dd>{{ detailRecord.time }}</dd></div><div><dt>审核状态</dt><dd>{{ historyStatus(detailRecord) }}</dd></div><div><dt>核查范围</dt><dd>{{ scopeName(detailRecord.reviewScope) }}</dd></div><div><dt>审核完成时间</dt><dd>{{ detailRecord.reviewedAt || '未记录' }}</dd></div><div><dt>下发时间</dt><dd>{{ detailRecord.issuedAt || '未记录' }}</dd></div><div><dt>上传资料</dt><dd>{{ recordAttachmentNames(detailRecord, 'report').length + recordAttachmentNames(detailRecord, 'calculation').length + recordAttachmentNames(detailRecord, 'original').length }} 份</dd></div><div v-if="!organizationMode || detailRecord.status !== 'reviewed'"><dt>审核问题</dt><dd>{{ detailIssues(detailRecord).length }} 项</dd></div><div v-if="!organizationMode || detailRecord.status !== 'reviewed'"><dt>审核报告</dt><dd>{{ reviewReportLabel(detailRecord) }}</dd></div></dl>
          <h3>上传资料</h3>
          <div class="audit-detail-files"><div v-for="material in auditMaterials" :key="material.key" class="audit-detail-file-row"><strong>{{ material.label }}</strong><div><button v-for="(name, index) in recordAttachmentNames(detailRecord, material.key)" :key="`${name}-${index}`" type="button" @click="openSubmissionFile(material.key, undefined, detailRecord, index)"><FileText :size="15" /><span>{{ name }}</span><Eye :size="15" /></button><span v-if="!recordAttachmentNames(detailRecord, material.key).length">暂无文件</span></div></div><div v-if="(!organizationMode || detailRecord.status !== 'reviewed') && reviewReportLabel(detailRecord) !== '未生成'" class="audit-detail-file-row"><strong>审核报告</strong><div><button type="button" @click="downloadUploadedReviewReport(detailRecord)"><FileText :size="15" /><span>{{ reviewReportLabel(detailRecord) }}</span><Download :size="15" /></button></div></div></div>
          <h3 v-if="!organizationMode || detailRecord.status !== 'reviewed'">问题记录 <small>{{ detailIssues(detailRecord).length }} 项</small></h3><p v-if="(!organizationMode || detailRecord.status !== 'reviewed') && !detailIssues(detailRecord).length">暂无审核问题</p><div v-for="issue in visibleDetailIssues(detailRecord)" :key="issue.id" class="record-detail-issue"><strong>{{ issue.title }}</strong><span>第 {{ issue.page }} 页 · {{ issue.level === 'high' ? '重点关注' : '建议复核' }}</span><p v-if="issue.description">{{ issue.description }}</p><p v-if="issue.suggestion">处理建议：{{ issue.suggestion }}</p></div><div v-if="(!organizationMode || detailRecord.status !== 'reviewed') && detailRecord.reviewNote" class="record-detail-note"><strong>审核备注</strong><p>{{ detailRecord.reviewNote }}</p></div>
          <div class="management-modal-foot"><button class="button button-primary" type="button" @click="detailRecord = null">关闭</button></div>
        </div>
      </section>
    </div>


    <div v-if="showPreview && currentRecord && isReviewed(currentRecord)" class="modal-backdrop" @click.self="showPreview = false">
      <section class="preview-modal" role="dialog" aria-modal="true" aria-labelledby="preview-title">
        <div class="modal-head"><div><span class="section-kicker">审核结果预览</span><h2 id="preview-title">{{ currentRecord.name }}</h2></div><button class="icon-button" aria-label="关闭预览" @click="showPreview = false"><X :size="19" /></button></div>
        <div class="modal-body"><div ref="documentPreviewPanel" class="document-preview"><div class="preview-toolbar"><span><FileText :size="15" /> 原始报告预览</span><span v-if="previewableReport">{{ currentRecord.demo ? '同类型参考 PDF' : '本地 PDF' }} · <button class="pdf-fullscreen-link" type="button" @click="togglePdfFullscreen(documentPreviewPanel)">全屏查看</button></span><span v-else>暂无可预览的 PDF 原文件</span></div><div v-if="currentRecord.demo && previewableReport" class="demo-reference-note">参考样例仅用于展示 PDF，问题和页码不对应样例正文。</div><iframe v-if="previewableReport" :key="previewPage" :src="reportPreviewUrl + '#page=' + previewPage + '&toolbar=0'" title="鉴定报告 PDF 预览"></iframe><div v-else class="mock-page"><div class="mock-page-head">报告预览</div><div class="mock-page-line wide"></div><div class="mock-page-line"></div><div class="mock-page-box"><FileText :size="34" /><p>当前记录的原 PDF 不可预览。</p></div><div class="mock-page-line wide"></div><div class="mock-page-line"></div></div></div><div class="issue-list"><div class="issue-list-top"><h3>问题 <span>{{ activeIssues.length }}</span></h3><p>请结合原始报告核对问题和对应页码。</p><p v-if="currentRecord.reviewNote" class="review-preview-note">{{ currentRecord.reviewNote }}</p></div><button v-for="issue in activeIssues" :key="issue.id" class="issue-item" :class="[issue.level, { selected: previewPage === issue.page }]" @click="previewPage = issue.page"><div class="issue-item-top"><span class="issue-tag" :class="issue.level">{{ issue.level === 'high' ? '重点关注' : '建议复核' }}</span><span>第 {{ issue.page }} 页 <ChevronRight :size="13" /></span></div><strong>{{ issue.title }}</strong><p>{{ issue.description }}</p><small>建议：{{ issue.suggestion }}</small></button></div></div>
        <div class="modal-foot"><span><Info :size="15" /> 审核结果请结合原始资料进行人工复核。</span><button class="button button-primary" @click="downloadReport"><Download :size="16" /> 导出 Word 报告</button></div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { ArrowRight, ArrowUpRight, BookOpen, Calculator, ChartNoAxesCombined, Check, ChevronDown, ChevronRight, CircleAlert, ClipboardList, Download, Eye, FileText, Info, Maximize2, Play, ScanSearch, Search, ShieldCheck, X } from 'lucide-vue-next'
import { addOrganizationMaterials, auditStore, chooseReviewScope, issueOrganizationAudit, loadReviewReportFile, loadSubmissionFile, removeOrganizationMaterial, removeUploadedReport, reopenOrganizationAudit, resetIntake, reviewOrganizationAudit, saveReviewReportFile, startAudit, submitOrganizationAudit, submitOrganizationRevision, uploadMaterial, withdrawOrganizationAudit, selectRecord } from '../state/auditStore'
import { provincialState } from '../state/provincialState'
import { availableStandards, scopeLabel } from '../state/managementStore'
import { createAuditWord } from '../utils/exportWord'
import { readDocxParagraphs } from '../utils/readDocx'
import { reportSearchText, reportStatusClass, reportStatusRank } from '../utils/reportRecords'

const props = defineProps({ kind: { type: String, required: true }, organizationMode: { type: Boolean, default: false }, reviewMode: { type: Boolean, default: false } })
const configs = {
  house: { title: '房屋安全鉴定' },
  curtain: { title: '幕墙安全鉴定' }
}
const demoReferenceFiles = {
  house: { report: 'house-report.pdf', calculation: 'house-calculation.pdf', original: 'house-original.pdf' },
  curtain: { report: 'curtain-report.pdf', calculation: 'curtain-calculation.pdf', original: 'curtain-original.pdf' }
}
const demoReferenceNames = {
  house: { report: '房屋安全鉴定报告（公开样例）.pdf', calculation: '房屋结构计算书（公开样例）.pdf', original: '房屋现场原始记录（公开样例）.pdf' },
  curtain: { report: '幕墙安全鉴定报告（公开样例）.pdf', calculation: '幕墙结构计算书（公开样例）.pdf', original: '幕墙现场原始记录（公开样例）.pdf' }
}
function demoPdfUrl(kind, category) {
  const name = demoReferenceFiles[kind]?.[category]
  return name ? `${import.meta.env.BASE_URL}demo-pdfs/${name}` : ''
}
const config = computed(() => configs[props.kind])
const session = computed(() => auditStore.sessions[props.kind])
const records = computed(() => props.organizationMode ? auditStore.records[props.kind].filter(record => record.source === 'organization' && record.organization === provincialState.user?.org) : auditStore.records[props.kind])
const historyKeyword = ref('')
const historyStateFilter = ref('all')
const historyStartDate = ref('')
const historyEndDate = ref('')
const queueKeyword = ref('')
const historyRecords = computed(() => {
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000
  return records.value.filter(record => {
    if (record.status === 'withdrawn' || props.reviewMode && record.status === 'pending' || props.organizationMode && !['reviewed', 'issued', 'completed'].includes(record.status)) return false
    if (record.status !== 'reviewed' && Date.parse(String(record.time || '').replace(' ', 'T')) < cutoff) return false
    if (historyStateFilter.value !== 'all' && historyStatus(record) !== historyStateFilter.value) return false
    if (historyStartDate.value && String(record.time).slice(0, 10) < historyStartDate.value) return false
    if (historyEndDate.value && String(record.time).slice(0, 10) > historyEndDate.value) return false
    return !historyKeyword.value || reportSearchText(record).includes(historyKeyword.value.trim().toLocaleLowerCase())
  }).sort((a, b) => reportStatusRank(a) - reportStatusRank(b) || String(b.time).localeCompare(String(a.time)))
})
const selectedReviewRecord = ref(null)
const selectedPendingIds = ref([])
const reviewBatchIds = ref([])
const handledBatchIds = ref([])
const submissionPreview = ref(null)
const wordPreview = ref(null)
const detailRecord = ref(null)
const storedReportPreviewUrl = ref('')
const submissionPanel = ref(null)
const documentPreviewPanel = ref(null)
const reviewQueue = computed(() => records.value.filter(record => record.source === 'organization' && record.status !== 'withdrawn'))
const pendingRecords = computed(() => reviewQueue.value.filter(record => record.status === 'pending'))
const organizationUnreviewedRecords = computed(() => props.organizationMode ? records.value.filter(record => record.source === 'organization' && ['pending', 'reviewing'].includes(record.status)) : [])
const filteredPendingRecords = computed(() => pendingRecords.value.filter(record => !queueKeyword.value || reportSearchText(record).includes(queueKeyword.value.trim().toLocaleLowerCase())))
const filteredOrganizationPending = computed(() => organizationUnreviewedRecords.value.filter(record => !queueKeyword.value || reportSearchText(record).includes(queueKeyword.value.trim().toLocaleLowerCase())))
const workspaceRecords = computed(() => {
  if (reviewBatchIds.value.length) return reviewBatchIds.value.map(id => records.value.find(record => record.id === id)).filter(Boolean)
  if (!selectedPendingIds.value.length) return selectedReviewRecord.value ? [selectedReviewRecord.value] : []
  const pendingById = new Map(pendingRecords.value.map(record => [record.id, record]))
  return selectedPendingIds.value.map(id => pendingById.get(id)).filter(Boolean)
})
const canBeginReview = computed(() => !!provinceScope.value && pendingRecords.value.some(record => selectedPendingIds.value.includes(record.id)))
const provinceScope = ref('')
const submitting = ref(false)
const revisionEntries = ref({ report: [], calculation: [], original: [] })
const revisionNote = ref('')
const revisionMode = ref(false)
const dispatchOutcome = ref('revise')
const dispatchMenuOpen = ref(false)
const dispatchMenu = ref(null)
const previewedVersion = ref(null)
const reviewReportInput = ref(null)
const openedFromHistory = ref(false)
const currentRecord = computed(() => props.reviewMode ? selectedReviewRecord.value : session.value.selectedRecord)
const reviewHasResult = computed(() => props.reviewMode && ['reviewed', 'issued', 'completed'].includes(selectedReviewRecord.value?.status))
const activeIssues = computed(() => currentRecord.value?.issues || [])
const available = computed(() => availableStandards(props.kind))
const fileInput = ref(null)
const selectedMaterialType = ref('report')
const draggingMaterial = ref('')
const showPreview = ref(false)
const previewPage = ref(1)
const notice = ref('')
let noticeTimer

const auditMaterials = [
  { key: 'report', label: '鉴定报告', hint: '选择待审核的报告', icon: FileText },
  { key: 'calculation', label: '计算书', hint: '选择结构计算书', icon: Calculator },
  { key: 'original', label: '原始文件', hint: '选择原始记录或方案', icon: ClipboardList }
]
const materials = computed(() => auditMaterials)
const selectedAccept = computed(() => '.pdf,application/pdf')
const reviewScopes = [
  { value: 'all', label: '全部' },
  { value: 'general', label: '一般性审查' },
  { value: 'structure', label: '结构承载能力验算与分析智能核查' },
  { value: 'procedure', label: '程序及结论智能核查' }
]
const materialFiles = type => revisionMode.value ? revisionEntries.value[type] : type === 'report' ? session.value.file ? [session.value.file] : [] : props.organizationMode ? session.value.organizationFiles[type] : session.value.supportFiles[type] ? [session.value.supportFiles[type]] : []
const materialCount = type => materialFiles(type).length
const materialNames = type => materialFiles(type).map(file => file.name)
const uploadedCount = computed(() => materials.value.filter(material => materialCount(material.key)).length)
const allMaterialsUploaded = computed(() => uploadedCount.value === materials.value.length)
const selectedScope = computed({ get: () => session.value.reviewScope, set: value => chooseReviewScope(props.kind, value) })
const steps = computed(() => props.reviewMode ? ['选择报告', '选择范围', '生成审核', '确认下发'] : props.organizationMode ? ['上传资料', '提交省站', '等待审核', '查看结果'] : ['上传资料', '选择范围', '智能审核', '预览与导出'])
const auditStages = ['解析文档', '提取信息', '规则核验', '生成结果']
const chartColors = ['#235FD6', '#78A2EA', '#B5CDF3', '#DBE7FA']
const statusLabel = computed(() => props.reviewMode ? `${pendingRecords.value.length} 份待审核` : props.organizationMode && currentRecord.value?.source === 'organization' ? recordStatus(currentRecord.value) : ({ idle: allMaterialsUploaded.value ? '等待提交' : '等待上传', ready: '等待审核', submitted: '已提交', auditing: '正在审核', completed: '审核完成' })[session.value.status])
const stepIndex = computed(() => props.reviewMode ? !selectedReviewRecord.value ? 0 : ['issued', 'completed'].includes(selectedReviewRecord.value.status) ? 3 : selectedReviewRecord.value.status === 'reviewed' ? 3 : selectedReviewRecord.value.status === 'reviewing' ? 2 : 1 : props.organizationMode ? !currentRecord.value || currentRecord.value.source !== 'organization' ? allMaterialsUploaded.value ? 1 : 0 : ['issued', 'completed'].includes(currentRecord.value.status) ? 3 : currentRecord.value.status === 'reviewing' || currentRecord.value.status === 'reviewed' ? 2 : 1 : session.value.status === 'idle' ? (allMaterialsUploaded.value ? 1 : 0) : ({ ready: 2, submitted: 2, auditing: 2, completed: 3 })[session.value.status])
const currentName = computed(() => session.value.selectedRecord?.name || session.value.file?.name || '')
const fileSubtitle = computed(() => session.value.file ? (session.value.file.size / 1024 / 1024).toFixed(2) + ` MB · ${session.value.file.name.split('.').pop().toUpperCase()} 文档 · 本地上传` : currentRecord.value?.source === 'organization' ? `${currentRecord.value.organization} · ${currentRecord.value.time}` : '历史记录')
const reportPreviewUrl = computed(() => {
  if (currentRecord.value?.demo && (currentRecord.value.versions?.at(-1)?.number || 1) === 1) return demoPdfUrl(props.kind, 'report')
  if (storedReportPreviewUrl.value) return storedReportPreviewUrl.value
  return !props.reviewMode && session.value.url && /\.pdf$/i.test(session.value.file?.name || '') && currentRecord.value?.id === session.value.selectedRecord?.id ? session.value.url : ''
})
const previewableReport = computed(() => !!reportPreviewUrl.value)
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
  graphic: [{ type: 'text', left: 'center', top: '43%', style: { text: String(distribution.value.reduce((sum, item) => sum + item.value, 0)), fill: '#243248', fontSize: 29, fontWeight: 700, textAlign: 'center' } }, { type: 'text', left: 'center', top: '59%', style: { text: activeIssues.value.length ? '问题' : '样例分布', fill: '#68788F', fontSize: 11, textAlign: 'center' } }]
}))
const metrics = computed(() => {
  const reviewed = records.value.filter(isReviewed).length
  if (props.reviewMode) return [
    { label: '已收报告', value: records.value.length, unit: '份', note: '当前可见报告', icon: FileText, tone: 'indigo' },
    { label: '待审核报告', value: pendingRecords.value.length, unit: '份', note: '检测机构已提交', icon: BookOpen, tone: 'teal' },
    { label: '已审核报告', value: reviewed, unit: '份', note: '省站审核结果', icon: ShieldCheck, tone: 'cyan' },
    { label: '可用标准', value: available.value.length, unit: '项', note: '当前鉴定类型可引用', icon: ScanSearch, tone: 'amber' }
  ]
  if (props.organizationMode) return [
    { label: '已提交报告', value: records.value.filter(record => record.source === 'organization').length, unit: '份', note: '本机构提交记录', icon: FileText, tone: 'indigo' },
    { label: '待审核报告', value: pendingRecords.value.length, unit: '份', note: '等待省站审核', icon: BookOpen, tone: 'teal' },
    { label: '已审核报告', value: reviewed, unit: '份', note: '省站已下发结果', icon: ShieldCheck, tone: 'cyan' },
    { label: '可用标准', value: available.value.length, unit: '项', note: '当前鉴定类型可引用', icon: ScanSearch, tone: 'amber' }
  ]
  return [
    { label: '已审核报告', value: reviewed, unit: '份', note: '当前可见报告', icon: FileText, tone: 'indigo' },
    { label: '可用标准', value: available.value.length, unit: '项', note: '当前鉴定类型可引用', icon: BookOpen, tone: 'teal' },
    { label: '报告完成率', value: '100', unit: '%', note: '当前历史记录', icon: ShieldCheck, tone: 'cyan' },
    { label: '平均审核耗时', value: '05', unit: '秒', note: '当前审核流程', icon: ScanSearch, tone: 'amber' }
  ]
})
function flash(message) { notice.value = message; clearTimeout(noticeTimer); noticeTimer = setTimeout(() => { notice.value = '' }, 4200) }
function closeWorkspace() {
  showPreview.value = false
  revisionMode.value = false
  revisionEntries.value = { report: [], calculation: [], original: [] }
  if (props.reviewMode) {
    selectedReviewRecord.value = null
    selectedPendingIds.value = []
    reviewBatchIds.value = []
    handledBatchIds.value = []
    provinceScope.value = ''
    openedFromHistory.value = false
    previewedVersion.value = null
  } else resetIntake(props.kind)
}
function removeDraftReport() { if (revisionMode.value) revisionEntries.value.report = []; else removeUploadedReport(props.kind); flash('已移除报告，其他待上传材料仍保留。') }
function removeRevisionEntry(type, index) { revisionEntries.value[type].splice(index, 1) }
function withdrawHistory(record) {
  if (!withdrawOrganizationAudit(props.kind, record)) return
  if (currentRecord.value?.id === record.id) closeWorkspace()
  flash('已撤回提交。')
}
function reReview(record) {
  if (!reopenOrganizationAudit(props.kind, record)) return
  closeWorkspace()
  selectedPendingIds.value = [record.id]
  selectedReviewRecord.value = record
  flash('已同步到报告工作区，请选择审查范围后重新审核。')
  document.querySelector('.review-workspace')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
function openPicker(type = 'report') { selectedMaterialType.value = type; if (fileInput.value) { fileInput.value.multiple = props.organizationMode && type !== 'report'; fileInput.value.click() } }
function acceptFiles(files, type) {
  const selected = Array.from(files || [])
  if (!selected.length) return
  if (selected.some(file => !/\.pdf$/i.test(file.name))) return flash('请选择 PDF 格式的文件。')
  if (selected.some(file => file.size > 100 * 1024 * 1024)) return flash('文件超过 100 MB，请选择较小的文件。')
  if (revisionMode.value) {
    const entries = selected.map(file => ({ name: file.name, file }))
    if (type === 'report') revisionEntries.value.report = entries.slice(0, 1)
    else revisionEntries.value[type].push(...entries)
  } else if (props.organizationMode) addOrganizationMaterials(props.kind, type, type === 'report' ? selected.slice(0, 1) : selected)
  else uploadMaterial(props.kind, type, selected[0])
  showPreview.value = false
  flash(`${materials.value.find(item => item.key === type)?.label || '文件'}已选择。`)
}
function handleFileChange(event) { acceptFiles(event.target.files, selectedMaterialType.value); event.target.value = '' }
function handleDrop(event, type) { draggingMaterial.value = ''; acceptFiles(event.dataTransfer.files, type) }
async function beginAudit() {
  if (props.organizationMode) {
    if (revisionMode.value) return submitRevision()
    if (submitting.value) return
    submitting.value = true
    try {
      if (await submitOrganizationAudit(props.kind, provincialState.user?.org)) flash('报告已提交省站，等待审核。')
    } catch { flash('文件保存失败，请检查浏览器存储空间后重试。') }
    finally { submitting.value = false }
    return
  }
  startAudit(props.kind)
}
function selectReviewRecord(record) {
  dispatchOutcome.value = 'revise'
  openedFromHistory.value = false
  if (record.status === 'pending') {
    reviewBatchIds.value = []
    handledBatchIds.value = []
    const ids = selectedPendingIds.value
    selectedPendingIds.value = ids.includes(record.id) ? ids.filter(id => id !== record.id) : [...ids, record.id]
    const lastId = selectedPendingIds.value.at(-1)
    selectedReviewRecord.value = lastId ? pendingRecords.value.find(item => item.id === lastId) || null : null
    if (!lastId) provinceScope.value = ''
  } else {
    reviewBatchIds.value = []
    handledBatchIds.value = []
    selectedPendingIds.value = []
    selectedReviewRecord.value = record
    provinceScope.value = record.reviewScope || ''
  }
  previewedVersion.value = null
  showPreview.value = false
}
function focusReviewRecord(record) {
  dispatchOutcome.value = 'revise'
  selectedReviewRecord.value = record
  openedFromHistory.value = false
  previewedVersion.value = null
  showPreview.value = false
}
function removeSelectedPending(record) {
  selectedPendingIds.value = selectedPendingIds.value.filter(id => id !== record.id)
  if (selectedReviewRecord.value?.id === record.id) {
    const nextId = selectedPendingIds.value.at(-1)
    selectedReviewRecord.value = nextId ? pendingRecords.value.find(item => item.id === nextId) || null : null
  }
  if (!selectedPendingIds.value.length) provinceScope.value = ''
}
function beginReview() {
  if (!canBeginReview.value) return
  dispatchOutcome.value = 'revise'
  const selected = pendingRecords.value.filter(record => selectedPendingIds.value.includes(record.id))
  const started = selected.filter(record => reviewOrganizationAudit(props.kind, record, provinceScope.value))
  if (!started.length) return
  reviewBatchIds.value = started.map(record => record.id)
  handledBatchIds.value = []
  selectedReviewRecord.value = started[0]
  openedFromHistory.value = false
  selectedPendingIds.value = []
  flash(`已开始审查 ${started.length} 份报告。`)
}
function turnReviewPage(direction) {
  const index = reviewBatchIds.value.indexOf(selectedReviewRecord.value?.id)
  const record = records.value.find(item => item.id === reviewBatchIds.value[index + direction])
  if (record) focusReviewRecord(record)
}
function advanceReviewResult() {
  const index = reviewBatchIds.value.indexOf(selectedReviewRecord.value?.id)
  if (selectedReviewRecord.value && index >= 0) handledBatchIds.value = [...handledBatchIds.value, selectedReviewRecord.value.id]
  const remaining = [...reviewBatchIds.value.slice(index + 1), ...reviewBatchIds.value.slice(0, index)]
  const next = remaining.filter(id => !handledBatchIds.value.includes(id)).map(id => records.value.find(record => record.id === id)).find(Boolean)
  showPreview.value = false
  previewedVersion.value = null
  if (next) selectedReviewRecord.value = next
  else {
    selectedReviewRecord.value = null
    reviewBatchIds.value = []
    handledBatchIds.value = []
    selectedPendingIds.value = []
    provinceScope.value = ''
  }
  openedFromHistory.value = false
}
function previewReview() { previewedVersion.value = selectedReviewRecord.value?.versions?.at(-1)?.number; showPreview.value = true }
async function openReviewWord(record) {
  if (!record?.reviewReportName) return
  try {
    const file = await loadReviewReportFile(props.kind, record)
    if (!file) return flash('当前浏览器中找不到已上传的 Word 附件。')
    closeReviewWord()
    const preview = { name: file.name, size: `${(file.size / 1024).toFixed(1)} KB`, time: record.reviewReportUploadedAt || '未记录', url: URL.createObjectURL(file), loading: /\.docx$/i.test(file.name), paragraphs: [] }
    wordPreview.value = preview
    if (preview.loading) {
      try { preview.paragraphs = await readDocxParagraphs(file) }
      catch { preview.paragraphs = [] }
      finally { preview.loading = false }
    }
  } catch { flash('读取 Word 附件失败，请重试。') }
}
function closeReviewWord() {
  if (wordPreview.value?.url) URL.revokeObjectURL(wordPreview.value.url)
  wordPreview.value = null
}
async function chooseReviewReport(event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return
  if (!/\.docx?$/i.test(file.name)) return flash('请选择 Word 格式的审核报告。')
  if (file.size > 100 * 1024 * 1024) return flash('文件超过 100 MB。')
  try {
    if (await saveReviewReportFile(props.kind, selectedReviewRecord.value, file)) {
      previewedVersion.value = null
      flash('审核报告已上传，可以确认并下发。')
    }
  } catch { flash('审核报告保存失败，请重试。') }
}
async function downloadUploadedReviewReport(record = selectedReviewRecord.value) {
  if (record?.demo || record?.source !== 'organization') { createAuditWord({ ...record, reviewScopeLabel: scopeName(record.reviewScope) }, config.value.title); return }
  try {
    const file = await loadReviewReportFile(props.kind, record)
    if (!file && ['reviewed', 'issued', 'completed'].includes(record?.status) && !record.reviewReportName) { createAuditWord({ ...record, reviewScopeLabel: scopeName(record.reviewScope) }, config.value.title); return }
    if (!file) return flash('当前浏览器中找不到已上传的审核报告。')
    const url = URL.createObjectURL(file)
    const link = document.createElement('a')
    link.href = url
    link.download = file.name
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  } catch { flash('读取审核报告失败，请重试。') }
}
function saveReviewForLater() { flash('已暂存，审核结果保留在待下发记录中。'); advanceReviewResult() }
function chooseDispatchOutcome(outcome) { dispatchOutcome.value = outcome; dispatchMenuOpen.value = false }
function closeDispatchMenuOnOutside(event) { if (dispatchMenuOpen.value && !dispatchMenu.value?.contains(event.target)) dispatchMenuOpen.value = false }
function issueReview() {
  dispatchMenuOpen.value = false
  const outcome = selectedReviewRecord.value?.reviewReportName ? 'revise' : dispatchOutcome.value
  if (!issueOrganizationAudit(props.kind, selectedReviewRecord.value, outcome)) return flash('下发失败，请重新选择待下发记录。')
  flash(outcome === 'revise' ? '已下发修改意见，机构可重新上传。' : '审核无误，流程已完成。')
  advanceReviewResult()
}
function withdrawCurrent() { if (withdrawOrganizationAudit(props.kind, currentRecord.value)) flash('已撤回，省站将无法审核这一版报告。') }
function reuploadRecord(record) {
  selectRecord(props.kind, record)
  revisionEntries.value = Object.fromEntries(['report', 'calculation', 'original'].map(category => [category, recordAttachmentNames(record, category).map((name, existingIndex) => ({ name, existingIndex }))]))
  revisionMode.value = true
  revisionNote.value = ''
  showPreview.value = false
  nextTick(() => document.querySelector('.work-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
}
async function submitRevision() {
  if (!allMaterialsUploaded.value || submitting.value) return
  submitting.value = true
  try {
    if (!await submitOrganizationRevision(props.kind, currentRecord.value, revisionEntries.value, revisionNote.value.trim())) return
    revisionMode.value = false
    revisionEntries.value = { report: [], calculation: [], original: [] }
    revisionNote.value = ''
    flash('新版本已提交省站，等待审核。')
  } catch (error) { flash(error?.message || '新版本保存失败，请重试。') }
  finally { submitting.value = false }
}

function isReviewed(record) { return !!record && (record.source !== 'organization' || ['reviewed', 'issued', 'completed'].includes(record.status)) }
function recordStatus(record) { return record?.source !== 'organization' ? '已完成' : ({ pending: '待审核', reviewing: '审核中', reviewed: '待下发', issued: '已下发', completed: '已完成', withdrawn: '已撤回' })[record.status] || '待审核' }
function historyStatus(record) { return record?.source !== 'organization' || record.status === 'completed' ? '已完成' : record.status === 'issued' ? '已下发' : record.status === 'reviewed' ? '待下发' : '待审核' }
function scopeName(value) { return reviewScopes.find(scope => scope.value === value)?.label || value || '未选择' }
function recordAttachmentNames(record, category) {
  if (!record) return []
  if (category === 'report') return [record.name]
  const saved = record.attachments?.[category]
  return Array.isArray(saved) ? saved : saved ? [saved] : []
}
function visibleDetailIssues(record) { return props.organizationMode && record?.status === 'reviewed' ? [] : detailIssues(record) }
function detailIssues(record) {
  if (record?.issues?.length) return record.issues
  return record?.versions?.at(-1)?.issues || []
}
function reviewReportLabel(record) { return record?.reviewReportName || (['reviewed', 'issued', 'completed'].includes(record?.status) || record?.source !== 'organization' ? `${record.name.replace(/\.pdf$/i, '')}_审核报告.docx` : '未生成') }
async function openSubmissionFile(category, version, record = selectedReviewRecord.value, index = 0) {
  if (!record) return
  if (record.source !== 'organization' || record.demo && (category === 'report' ? version === 1 || record.demoReportReference !== false : record.referenceFiles?.[category]?.[index] !== false)) {
    closeSubmissionPreview()
    const referenceFile = demoReferenceFiles[props.kind]?.[category]
    submissionPreview.value = {
      name: category === 'report' && version ? record.versions?.find(item => item.number === version)?.name || record.name : recordAttachmentNames(record, category)[index] || record.name,
      url: demoPdfUrl(props.kind, category), type: referenceFile ? 'pdf' : 'demo', reference: !!referenceFile, referenceName: demoReferenceNames[props.kind]?.[category] || ''
    }
    return
  }
  try {
    const file = await loadSubmissionFile(props.kind, record.id, category, category === 'report' ? version || record.versions?.at(-1)?.number || 1 : undefined, index)
    if (!file) return flash('原文件未保存在当前浏览器中。')
    closeSubmissionPreview()
    submissionPreview.value = { name: file.name, url: URL.createObjectURL(file), objectUrl: true, type: /\.pdf$/i.test(file.name) ? 'pdf' : /\.(mp4|mov|avi)$/i.test(file.name) ? 'video' : 'download' }
  } catch { flash('读取文件失败，请重试。') }
}
function closeSubmissionPreview() { if (submissionPreview.value?.objectUrl) URL.revokeObjectURL(submissionPreview.value.url); submissionPreview.value = null }
async function togglePdfFullscreen(element) {
  try {
    if (document.fullscreenElement) await document.exitFullscreen()
    else await element?.requestFullscreen?.()
  } catch { flash('当前浏览器无法进入全屏，可在新标签中查看 PDF。') }
}
function selectHistory(record) {
  revisionMode.value = false
  revisionEntries.value = { report: [], calculation: [], original: [] }
  if (props.reviewMode) selectReviewRecord(record)
  else selectRecord(props.kind, record)
  openedFromHistory.value = props.reviewMode && record.status === 'reviewed'
  if (props.organizationMode && !isReviewed(record)) session.value.status = 'submitted'
  previewPage.value = record.issues[0]?.page || 1
  showPreview.value = (!props.reviewMode || record.source === 'sample') && isReviewed(record)
  if (props.reviewMode) document.querySelector('.review-workspace')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
async function openHistoryReviewUpload(record) {
  selectHistory(record)
  await nextTick()
  reviewReportInput.value?.click()
}
function downloadReport() {
  if (!currentRecord.value || !isReviewed(currentRecord.value)) return
  try { createAuditWord({ ...currentRecord.value, reviewScopeLabel: scopeName(currentRecord.value.reviewScope) }, config.value.title); flash('Word 审核报告已下载到本地。') }
  catch (error) { console.error(error); flash('Word 生成失败，请重试。') }
}
watch(() => session.value.selectedRecord, (record) => { previewPage.value = record?.issues[0]?.page || 1 })
watch(() => [showPreview.value, props.kind, currentRecord.value?.id, currentRecord.value?.versions?.at(-1)?.number], async ([visible, kind, id, version], _, onCleanup) => {
  if (storedReportPreviewUrl.value) { URL.revokeObjectURL(storedReportPreviewUrl.value); storedReportPreviewUrl.value = '' }
  if (!visible || !id || currentRecord.value?.source !== 'organization' || currentRecord.value.demo) return
  let cancelled = false
  onCleanup(() => { cancelled = true })
  try {
    const file = await loadSubmissionFile(kind, id, 'report', version || 1)
    if (!file) return
    const url = URL.createObjectURL(file)
    if (cancelled) URL.revokeObjectURL(url)
    else storedReportPreviewUrl.value = url
  } catch { /* report may no longer be stored in this browser */ }
})
watch(() => props.kind, () => { dispatchMenuOpen.value = false; revisionMode.value = false; revisionEntries.value = { report: [], calculation: [], original: [] }; selectedReviewRecord.value = null; selectedPendingIds.value = []; reviewBatchIds.value = []; handledBatchIds.value = []; provinceScope.value = ''; openedFromHistory.value = false; previewedVersion.value = null; showPreview.value = false; closeSubmissionPreview(); closeReviewWord() })
watch(() => selectedReviewRecord.value?.id, () => { dispatchMenuOpen.value = false })
watch(() => auditStore.previewRequest, (request) => {
  if (request?.kind !== props.kind) return
  const record = records.value.find(item => item.id === request.recordId)
  if (record) selectHistory(record)
  auditStore.previewRequest = null
}, { immediate: true })
onMounted(() => document.addEventListener('pointerdown', closeDispatchMenuOnOutside))
onBeforeUnmount(() => { document.removeEventListener('pointerdown', closeDispatchMenuOnOutside); clearTimeout(noticeTimer); closeSubmissionPreview(); closeReviewWord(); if (storedReportPreviewUrl.value) URL.revokeObjectURL(storedReportPreviewUrl.value) })
</script>

<style scoped>
.review-workspace{gap:16px}.review-queue{display:grid;gap:9px;max-height:270px;overflow:auto}.review-queue-item{display:flex;align-items:center;gap:11px;width:100%;padding:12px;border:1px solid #e4eaf5;border-radius:12px;background:#fff;text-align:left;color:#40516b;cursor:pointer}.review-queue-item:hover,.review-queue-item.active{border-color:#9bbaf5;background:#f6f9ff}.review-queue-item>span:nth-child(2){display:grid;gap:4px;flex:1;min-width:0}.review-queue-item strong{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px}.review-queue-item small{color:#8b98aa;font-size:10px}.review-queue-item em{font-style:normal;font-size:10px;color:#235fd6;white-space:nowrap}.review-empty{padding:30px 16px;text-align:center;color:#8b98aa;border:1px dashed #d9e5f7;border-radius:12px;font-size:12px}.review-selection{display:grid;gap:7px;padding:16px;border:1px solid #e4eaf5;border-radius:12px;background:#f8faff;color:#68788f;font-size:11px}.review-selection strong{color:#243248;font-size:13px}.review-workspace-actions{display:flex;justify-content:flex-end;margin-top:auto}.review-workspace-actions .button{min-width:150px}
.review-files{display:flex;gap:8px;flex-wrap:wrap;margin-top:5px}.review-files button{display:inline-flex;align-items:center;gap:6px;padding:8px 10px;border:1px solid #ceddf7;border-radius:8px;background:#fff;color:#235fd6;font-size:11px;font-weight:700;cursor:pointer}.review-files button:hover{background:#edf4ff}.review-file-modal{width:min(850px,96vw)}.review-file-body{padding:20px}.review-file-body iframe,.review-file-body video{width:100%;height:min(60vh,540px);border:1px solid #e4eaf5;border-radius:10px;background:#f8faff}.demo-material-preview{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;min-height:280px;padding:28px;border:1px dashed #bdd0f4;border-radius:12px;background:#f8faff;color:#6c7e9a;text-align:center}.demo-material-preview svg{color:#2866d9}.demo-material-preview strong{max-width:100%;overflow-wrap:anywhere;color:#243248;font-size:16px}.demo-material-preview span{font-size:12px}.review-file-body p{padding:55px 15px;text-align:center;color:#68788f}.review-file-actions{display:flex;justify-content:flex-end;gap:10px;margin-top:15px}.review-file-actions a{display:inline-flex;align-items:center;gap:7px;text-decoration:none}
.review-workspace-actions{gap:10px;align-items:center;flex-wrap:wrap}.review-progress{font-size:12px;color:#235fd6;font-weight:700}.province-review-scope{margin-top:8px;width:100%;max-width:590px}.org-upload-note{color:#8b98aa;font-size:11px}.history-actions{display:flex;align-items:center;justify-content:center;gap:10px;flex-wrap:wrap}.history-actions .text-action{white-space:nowrap}.version-link{align-self:flex-start;margin-top:12px}.revision-panel{display:grid;gap:10px;margin-top:18px;padding:17px;border:1px solid #d9e5f7;border-radius:13px;background:#f8faff}.revision-panel>strong{font-size:14px;color:#243248}.revision-panel>span{font-size:11px;color:#68788f}.revision-panel textarea{width:100%;resize:vertical;min-height:56px;padding:10px;border:1px solid #ceddf7;border-radius:9px;color:#40516b;font:inherit;font-size:12px}.revision-panel>.button{justify-self:end}.revision-picker{display:inline-flex;align-items:center;justify-content:center;width:max-content;padding:10px 14px;border:1px solid #a9c4f4;border-radius:9px;background:#fff;color:#235fd6;font-size:12px;font-weight:700;cursor:pointer}.revision-picker input{position:absolute;width:1px;height:1px;opacity:0}.version-modal{width:min(650px,96vw)}.version-list{display:grid;gap:12px;padding:20px 24px;max-height:65vh;overflow:auto}.version-item{display:grid;gap:8px;padding:16px;border:1px solid #e4eaf5;border-radius:12px;background:#f9fbff;color:#68788f;font-size:12px}.version-top{display:flex;align-items:center;justify-content:space-between}.version-top strong{color:#235fd6;font-size:13px}.version-top span{padding:5px 9px;border-radius:20px;background:#eaf1ff;color:#235fd6;font-size:11px}.version-name{display:flex;align-items:center;gap:7px;color:#243248;font-weight:700;overflow-wrap:anywhere}.version-item p{margin:0}.version-item small{font-size:11px;color:#8b98aa}.version-actions{display:flex;justify-content:flex-end}
.version-issues{padding:9px 11px;border-radius:8px;background:#fff;color:#40516b}.version-issues summary{cursor:pointer;color:#235fd6;font-weight:700}.version-issues p{padding-top:7px;color:#68788f;font-size:11px}
.pending-side-card{display:flex;flex-direction:column;min-height:354px}.pending-side-list{display:grid;align-content:start;gap:9px;max-height:330px;overflow:auto;padding-right:2px}.pending-side-item{display:flex;align-items:center;gap:9px;width:100%;padding:11px 9px;border:1px solid #e4eaf5;border-radius:11px;background:#fff;text-align:left;cursor:pointer}.pending-side-item:hover,.pending-side-item.active{border-color:#9bbaf5;background:#f6f9ff}.pending-side-copy{display:grid;gap:4px;flex:1;min-width:0}.pending-side-copy strong{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#40516b;font-size:12px}.pending-side-copy small{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#8b98aa;font-size:10px}.pending-side-item em{font-style:normal;white-space:nowrap;color:#235fd6;font-size:10px}.pending-side-empty{display:grid;place-items:center;min-height:190px;padding:16px;border:1px dashed #d9e5f7;border-radius:11px;color:#8b98aa;text-align:center;font-size:12px}.review-workspace-empty{display:grid;place-items:center;flex:1;min-height:260px;margin-top:8px}
.review-material-card{cursor:default;min-height:190px}.review-material-card:hover{box-shadow:none;border-color:#d6e2f8;background:linear-gradient(180deg,#fafbfd,#fff)}.review-material-card.uploaded:hover{border-color:#b9cff6;background:#f9fbff}.review-material-files{display:grid;gap:6px;width:100%;max-height:94px;overflow:auto}.review-material-files button{display:flex;align-items:center;gap:5px;width:100%;border:0;background:none;padding:2px 0;color:#235fd6;text-align:left;font-size:10px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;cursor:pointer}.review-material-files button:hover{text-decoration:underline}.review-material-files span{color:#8b98aa;font-size:10px}.review-record-meta{display:flex;align-items:center;gap:8px;min-width:0;padding:11px 13px;border:1px solid #eaf0ff;border-radius:10px;background:#fafbfd;font-size:10px;color:#8b98aa}.review-record-meta strong{max-width:45%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#243248;font-size:11px}.review-record-meta span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.review-record-meta button{margin-left:auto;white-space:nowrap}.organization-file-list{display:grid;gap:5px;max-height:115px;overflow:auto}.organization-file-list>div{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:5px 8px}.organization-file-list span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#68788f;font-size:10px}.organization-file-list button{display:grid;place-items:center;width:20px;height:20px;border:0;border-radius:6px;background:#f5f7fb;color:#8b98aa;cursor:pointer}.organization-file-list button:hover{color:#b84462;background:#fff0f2}
.review-audit-status{display:flex;align-items:center;justify-content:center;gap:10px;padding:18px;border:1px solid #d9e5f7;border-radius:12px;background:#f8faff;color:#235fd6;font-size:12px;font-weight:700}.review-result-panel{flex:none;padding-top:0}.review-result-panel .issue-snapshot{margin-top:12px}.review-workspace .review-scope{margin-top:0}
.review-start-row{display:flex;align-items:center;gap:12px;margin-top:auto}.review-start-row .province-review-scope{flex:1;min-width:0;max-width:none;margin:0}.review-start-row>.button{flex:none;min-width:0}.review-start-row select:disabled{color:#a3b1c7;background:#f3f6fb;cursor:not-allowed}.pending-check{display:grid;place-items:center;flex:none;width:18px;height:18px;border:1px solid #b8c9e5;border-radius:5px;background:#fff;color:#fff}.pending-side-item.active .pending-check{border-color:#235fd6;background:#235fd6}.review-material-files button:disabled{color:#a3b1c7;cursor:not-allowed;text-decoration:none}@media(max-width:680px){.review-start-row{flex-wrap:wrap}.review-start-row>.button{align-self:flex-end}}
.review-start-row>.button:disabled,.review-start-row>.button:disabled:hover{background:#e4ebf7;color:#235fd6;box-shadow:none;cursor:not-allowed;transform:none}
.pending-side-head>div{min-width:0;flex:1}.pending-selected-count{white-space:nowrap}.pending-side-card{min-width:0;overflow:hidden}.pending-side-list{flex:1;height:0;min-height:246px;max-height:none;margin-top:15px;overflow-y:auto;overflow-x:hidden;scrollbar-width:thin;scrollbar-color:#b7c9e7 transparent}
.review-record-list{display:grid;align-content:start;gap:6px;max-height:120px;min-height:50px;overflow-y:auto;overflow-x:hidden;padding:2px 5px 2px 2px;scrollbar-width:thin;scrollbar-color:#b7c9e7 transparent}
.review-record-row{display:flex;align-items:center;gap:10px;min-height:50px;width:100%;padding:7px 11px;border:1px solid #e5ecf8;border-radius:10px;background:#fbfcff;text-align:left;cursor:pointer;transition:border-color .18s,background .18s}
.review-record-row:hover,.review-record-row.active{border-color:#b7cef8;background:#f4f8ff}
.review-record-index{display:grid;place-items:center;flex:none;width:28px;height:28px;border-radius:8px;background:#eaf1ff;color:#235fd6;font-size:11px;font-weight:700}
.review-record-copy{display:grid;gap:3px;flex:1;min-width:0}.review-record-copy strong,.review-record-copy small{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.review-record-copy strong{color:#243248;font-size:11px}.review-record-copy small{color:#8b98aa;font-size:10px}
.review-record-state{flex:none;padding:5px 7px;border-radius:999px;background:#edf3ff;color:#235fd6;font-size:10px;white-space:nowrap}
.pending-side-list{margin-right:-18px;padding-right:18px;padding-bottom:2px;gap:8px}.pending-side-item{height:76px;min-height:76px}
.pending-side-item{position:relative;min-height:76px;padding:11px 10px;border-color:#e2eaf6;border-radius:12px;background:linear-gradient(180deg,#fff 0%,#fbfcff 100%);box-shadow:0 2px 8px rgba(30,73,139,.025);transition:border-color .18s,background .18s,box-shadow .18s}
.pending-side-item:hover{border-color:#b4caf2;background:#f8fbff;box-shadow:0 4px 12px rgba(35,95,214,.07)}
.pending-side-item.active{border-color:#9fbcf4;background:#f4f8ff;box-shadow:inset 3px 0 0 #235fd6,0 3px 10px rgba(35,95,214,.05)}
.pending-side-copy strong{color:#30425c;font-size:12px}.pending-side-copy small{line-height:1.35}
.pending-side-item em{flex:none;padding:5px 7px;border-radius:999px;background:#f5f7fb;color:#8b98aa;font-size:10px}
.review-attachment-list{display:grid;gap:8px;max-height:178px;overflow-y:auto;overflow-x:hidden;padding-right:5px;scrollbar-width:thin;scrollbar-color:#b7c9e7 transparent}
.review-attachment-group{display:grid;grid-template-columns:112px minmax(0,1fr);align-items:start;gap:8px;padding:10px 12px;border:1px solid #e3eaf6;border-radius:10px;background:#fbfcff}
.review-attachment-label{display:flex;align-items:center;gap:6px;min-height:27px;color:#40516b;font-size:11px;font-weight:700;white-space:nowrap}.review-attachment-label svg{flex:none;color:#235fd6}.review-attachment-label small{color:#8b98aa;font-size:10px;font-weight:500}
.review-attachment-files{display:flex;flex-wrap:wrap;gap:6px;min-width:0}.review-attachment-files button{display:inline-flex;align-items:center;gap:5px;max-width:100%;min-height:27px;padding:4px 8px;border:1px solid #dce7fa;border-radius:7px;background:#fff;color:#235fd6;font-size:10px;cursor:pointer}.review-attachment-files button:hover{border-color:#a9c4f4;background:#f4f8ff}.review-attachment-files button span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.review-attachment-files button svg{flex:none}
@media(max-width:680px){.review-attachment-group{grid-template-columns:1fr}.review-attachment-files{width:100%}}
.review-audit-status{flex-wrap:wrap;overflow:hidden}.review-audit-status>svg{animation:reviewScan 1s ease-in-out infinite alternate}.review-audit-progress{position:relative;display:block;flex-basis:100%;height:5px;margin-top:7px;overflow:hidden;border-radius:999px;background:#dce8fb}.review-audit-progress::after{content:"";position:absolute;inset:0 auto 0 0;width:35%;border-radius:inherit;background:#235fd6;animation:reviewProgress 1.2s ease-in-out infinite alternate}@keyframes reviewScan{from{transform:scale(.9);opacity:.55}to{transform:scale(1.1);opacity:1}}@keyframes reviewProgress{from{transform:translateX(-100%)}to{transform:translateX(290%)}}
.demo-reference-note{padding:9px 12px;margin-bottom:10px;border:1px solid #d8e5fa;border-radius:8px;background:#f5f8ff;color:#58729d;font-size:11px;line-height:1.5}.document-preview .demo-reference-note{flex:none;margin:0;border-width:0 0 1px;border-radius:0}
.table-status.awaiting{background:#f1edff;color:#7554d1}.table-status.awaiting span{background:#8768df}
.review-scope-hint{display:inline-flex;width:max-content;max-width:100%;margin-top:7px;padding:4px 8px;border-radius:7px;background:#edf3ff;color:#235fd6;font-size:10px;font-weight:700}.review-page-nav{display:flex;align-items:center;justify-content:space-between;gap:10px;color:#68788f;font-size:11px;font-weight:700}.review-page-nav>div{display:flex;gap:6px}.review-page-nav button{padding:6px 10px;border:1px solid #d7e3f7;border-radius:8px;background:#fff;color:#235fd6;font-size:11px;font-weight:700;cursor:pointer}.review-page-nav button:disabled{color:#a7b3c6;background:#f5f7fb;cursor:not-allowed}.review-report-upload{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 12px;border:1px dashed #b7cef8;border-radius:10px;background:#f8fbff}.review-report-upload>div{display:grid;gap:4px;min-width:0}.review-report-upload strong{color:#30425c;font-size:12px}.review-report-upload small{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#7b8aa2;font-size:10px}.review-report-upload .button{min-width:0;white-space:nowrap}.review-save-button{border:1px solid #b8c9e5;background:#f5f8fd;color:#405c8b}.review-save-button:hover{background:#eaf1fc;color:#235fd6}
.review-dispatch-note{margin-right:auto;color:#8b98aa;font-size:10px}
.workspace-head-actions,.pdf-head-actions{display:flex;align-items:center;gap:9px}.material-title{display:flex;align-items:center;gap:6px}.material-remove{display:grid;place-items:center;margin-left:auto;width:23px;height:23px;border-radius:7px;color:#8b98aa;background:#edf2fb;cursor:pointer}.material-remove:hover{color:#bb4962;background:#fff0f3}.history-filter-row{display:flex;gap:10px;margin:14px 0}.history-filter-row .search-box{width:min(100%,390px)}.history-filter-row select{min-width:130px;padding:0 12px;border:1px solid #e2eaf6;border-radius:10px;background:#fff;color:#40516b;font-size:11px}.queue-only{grid-template-rows:minmax(0,1fr)}.pending-side-card .queue-search{width:100%;max-width:none;min-width:0;flex:0 0 39px;min-height:39px;align-self:stretch;margin-top:14px}.queue-search input{min-width:0}.org-pending-card .pending-side-list{flex:none;height:246px;max-height:246px}.review-selected-list{display:grid;align-content:start;gap:8px;max-height:158px;overflow-y:auto;margin-top:12px;padding-right:4px}.review-selected-item{display:flex;align-items:center;gap:10px;min-width:0;padding:9px 11px;border:1px solid #dce8fb;border-radius:10px;background:#f8fbff}.review-selected-number{display:grid;place-items:center;flex:none;width:28px;height:28px;border-radius:8px;background:#eaf1ff;color:#235fd6;font-size:11px;font-weight:700}.review-selected-item>div{display:grid;gap:3px;flex:1;min-width:0}.review-selected-item strong{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#30425c;font-size:11px}.review-selected-item small{color:#8b98aa;font-size:10px}.review-selected-current,.review-selected-view{flex:none;border:0;background:none;color:#235fd6;font-size:10px;font-weight:700}.review-selected-view{cursor:pointer}.pdf-head-actions .button{min-width:0;padding:0 10px}.pdf-fullscreen-link{padding:0;border:0;background:none;color:#235fd6;font:inherit;font-weight:700;cursor:pointer}.review-file-modal:fullscreen{display:flex;flex-direction:column;width:100vw;max-width:none;height:100vh;max-height:none;border-radius:0;background:#fff}.review-file-modal:fullscreen .review-file-body{display:flex;flex:1;min-height:0;flex-direction:column}.review-file-modal:fullscreen iframe{flex:1;min-height:0;max-height:none;height:auto}.document-preview:fullscreen{display:flex;flex-direction:column;width:100vw;height:100vh;background:#fff}.document-preview:fullscreen iframe{flex:1;min-height:0;height:auto}@media(max-width:680px){.history-filter-row{flex-wrap:wrap}.history-filter-row .search-box{width:100%}.history-filter-row select{min-height:38px}}
.review-preview-note{margin-top:8px;padding:9px 10px;border-radius:8px;background:#f5f8ff;color:#40516b;line-height:1.5}
.report-editor-modal{width:min(760px,100%);display:flex;flex-direction:column;overflow:hidden}.report-editor-body{display:grid;gap:16px;min-height:0;padding:20px 25px;overflow-y:auto}.report-editor-body label{display:grid;gap:7px;color:#40516b;font-size:12px;font-weight:700}.report-editor-body input,.report-editor-body textarea{width:100%;padding:10px 12px;border:1px solid #dce6f5;border-radius:9px;background:#fbfcff;color:#243248;font:inherit;font-size:12px;font-weight:400;resize:vertical}.report-editor-body input:focus,.report-editor-body textarea:focus{outline:2px solid #abc5f6;border-color:#8cafed}.report-editor-issue{display:grid;gap:12px;padding:16px;border:1px solid #e4eaf5;border-radius:12px;background:#fff}.report-editor-issue>strong{color:#235fd6;font-size:13px}.report-editor-fields{display:grid;grid-template-columns:minmax(0,1fr) 90px;gap:12px}.report-editor-foot{display:flex;align-items:center;justify-content:flex-end;gap:10px;padding:15px 25px;border-top:1px solid #eaf0ff}.report-editor-foot span{margin-right:auto;color:#8b98aa;font-size:11px}@media(max-width:680px){.report-editor-body{padding:15px}.report-editor-foot{flex-wrap:wrap;padding:12px 15px}.report-editor-foot span{flex-basis:100%}}
.review-selected-item{cursor:pointer;font:inherit;text-align:left;transition:border-color .18s,background .18s,box-shadow .18s}
.review-selected-item:hover{border-color:#b8cdf4;background:#f3f7ff}
.review-selected-item.active{border-color:#90b2f5;background:#eef4ff;box-shadow:inset 3px 0 0 #235fd6}
.review-selected-copy{display:grid;gap:3px;flex:1;min-width:0}
.review-selected-copy strong,.review-selected-copy small{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.review-selected-state{flex:none;color:#235fd6;font-size:10px;font-weight:700}
.review-selected-focus{display:flex;align-items:center;gap:10px;flex:1;min-width:0;padding:0;border:0;background:transparent;text-align:left;cursor:pointer}
.review-selected-remove{display:grid;place-items:center;flex:none;width:27px;height:27px;margin-left:auto;border:1px solid #dce8fb;border-radius:8px;background:#fff;color:#8191aa;cursor:pointer}
.review-selected-remove:hover{border-color:#f3c3cb;background:#fff3f5;color:#c44759}
.side-stack.queue-only{height:0;min-height:100%;min-width:0}
.side-stack.queue-only .pending-side-card{height:100%;min-height:0}
.pending-side-card .pending-side-list{min-height:0;margin-right:-19px;padding-right:19px;scrollbar-width:thin;scrollbar-color:#aac0e2 transparent}
.review-workspace-actions:has(.review-action-buttons){align-items:stretch;justify-content:flex-start;flex-direction:column}
.review-action-buttons{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;width:100%}
.review-action-buttons .button{min-width:0;white-space:nowrap;padding-inline:8px}
.review-action-buttons.ready-to-issue{display:flex;justify-content:flex-end}
.review-action-buttons.ready-to-issue .button{width:190px;max-width:calc(50% - 5px)}
.review-workspace-actions .review-dispatch-note{margin:0}
.review-word-link{display:inline-flex;align-items:center;gap:7px;max-width:100%;padding:0;border:0;background:none;text-align:left;color:#235fd6!important;cursor:pointer;overflow-wrap:anywhere}.review-word-link:hover{text-decoration:underline}.word-preview-backdrop{z-index:135}.word-preview-modal{display:flex;flex-direction:column;width:min(850px,96vw);height:min(82vh,820px);max-height:none}.word-preview-body{flex:1;min-height:0;overflow:auto;padding:18px 24px;background:#f8faff}.word-preview-meta{margin:0 0 14px;color:#8b98aa;font-size:11px}.word-preview-content{min-height:100%;padding:32px 40px;background:#fff;border:1px solid #e5ecf8;box-shadow:0 5px 22px rgba(35,55,95,.07);color:#30425c;font-size:13px;line-height:1.8}.word-preview-content p{margin:0 0 12px;white-space:pre-wrap}.word-preview-empty{display:grid;justify-items:center;align-content:center;gap:12px;min-height:260px;color:#7d8da6;text-align:center;font-size:12px}.word-preview-empty strong{color:#30425c;font-size:14px}.word-preview-footer{display:flex;justify-content:flex-end;gap:10px;padding:14px 24px;border-top:1px solid #eaf0ff}.word-preview-footer .button{min-width:120px;text-decoration:none}
.org-pending-card .pending-side-list{flex:1 1 auto;height:0;min-height:0;max-height:none}
@media(max-width:900px){.review-action-buttons{grid-template-columns:repeat(2,minmax(0,1fr))}}
.audit-detail-modal{width:min(780px,96vw)}.audit-detail-body{max-height:70vh;overflow:auto}.audit-detail-body h3{margin:20px 0 9px;font-size:13px;color:#30425c}.audit-detail-body p{margin:6px 0;color:#60728b;font-size:11px;line-height:1.6}.audit-detail-files{display:grid;gap:9px}.audit-detail-file-row{display:grid;grid-template-columns:90px minmax(0,1fr);align-items:start;gap:10px;padding:11px 13px;border:1px solid #e5ecf8;border-radius:10px;background:#f9fbff}.audit-detail-file-row>strong{padding-top:8px;color:#425671;font-size:11px}.audit-detail-file-row>div{display:flex;gap:7px;flex-wrap:wrap}.audit-detail-file-row button{display:inline-flex;align-items:center;gap:6px;max-width:100%;padding:7px 9px;border:1px solid #d5e2f8;border-radius:8px;background:#fff;color:#235fd6;font-size:11px;cursor:pointer}.audit-detail-file-row button span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.audit-detail-file-row>div>span{color:#9ba9bc;font-size:11px}.modal-backdrop:has(.review-file-modal){z-index:130}
.history-head-actions{display:inline-flex;align-items:center;gap:14px;flex-wrap:nowrap}.history-head-actions .history-count{display:inline-flex;align-items:center;white-space:nowrap}.history-head-actions .standard-more{margin-top:0;align-self:center;white-space:nowrap}.history-filter-row{flex-wrap:wrap}.history-date{display:inline-flex;align-items:center;gap:5px;min-height:40px;padding:0 10px;border:1px solid #e2eaf6;border-radius:9px;background:#fff;color:#40516b;font-size:11px}.history-date input{min-width:0;border:0;background:transparent;color:inherit;font:inherit}.review-history-card .history-table{min-width:900px}.review-history-card .history-table th:first-child{width:27%}.review-history-card .history-table th:nth-child(2){width:17%}.review-history-card .history-table th:nth-child(3){width:10%}.review-history-card .history-table th:nth-child(4){width:13%}.review-history-card .history-table th:last-child{width:33%}.review-history-card .history-actions{gap:8px;flex-wrap:nowrap;white-space:nowrap}
@media(max-width:980px){.side-stack.queue-only{height:auto;min-height:355px;grid-template-columns:1fr}.side-stack.queue-only .pending-side-card{height:auto;min-height:355px;max-height:500px}}
.dispatch-choice{display:flex;align-items:center;gap:10px;align-self:flex-end;color:#40516b;font-size:11px;font-weight:700}.dispatch-choice select{min-height:36px;padding:0 12px;border:1px solid #ceddf7;border-radius:9px;background:#fff;color:#235fd6;font:inherit}.revision-panel .revision-picker{max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.revision-panel textarea{min-height:65px}
.revision-note{width:100%;min-height:64px;padding:10px 12px;border:1px solid #ceddf7;border-radius:9px;background:#fff;color:#40516b;font:inherit;font-size:11px;resize:vertical}
.dispatch-combo{position:relative;display:flex;min-width:0;z-index:5}.dispatch-combo>.button{min-width:0;flex:1;border-radius:9px 0 0 9px;white-space:nowrap}.dispatch-combo small{font-size:10px;font-weight:500;opacity:.85}.dispatch-trigger{display:grid;place-items:center;flex:none;width:32px;border:0;border-left:1px solid rgba(255,255,255,.35);border-radius:0 9px 9px 0;background:#235fd6;color:#fff;cursor:pointer}.dispatch-trigger:hover,.dispatch-trigger[aria-expanded="true"]{background:#174cb6}.dispatch-popover{position:absolute;right:0;bottom:calc(100% + 10px);display:grid;gap:3px;width:270px;padding:8px;border:1px solid #dce7f8;border-radius:13px;background:#fff;box-shadow:0 14px 36px rgba(27,53,102,.18);text-align:left}.dispatch-popover::after{position:absolute;right:12px;bottom:-6px;width:10px;height:10px;border-right:1px solid #dce7f8;border-bottom:1px solid #dce7f8;background:#fff;content:"";transform:rotate(45deg)}.dispatch-popover-title{padding:5px 9px 7px;color:#8b98aa;font-size:11px;font-weight:700}.dispatch-popover button{display:flex;align-items:center;gap:9px;min-width:0;padding:9px;border:1px solid transparent;border-radius:9px;background:#fff;color:#30425c;text-align:left;cursor:pointer}.dispatch-popover button:hover,.dispatch-popover button.selected{border-color:#d7e5fb;background:#f4f8ff}.dispatch-option-icon{display:grid;place-items:center;flex:none;width:30px;height:30px;border-radius:9px}.dispatch-option-icon.revise{background:#f0ecff;color:#7d5fce}.dispatch-option-icon.approved{background:#e7f8f3;color:#16a489}.dispatch-option-copy{display:grid;gap:2px;flex:1;min-width:0}.dispatch-option-copy strong{font-size:12px}.dispatch-option-copy small{color:#8b98aa;font-size:10px;font-weight:400;white-space:nowrap}.dispatch-option-check{flex:none;color:#235fd6}.review-action-buttons.ready-to-issue .dispatch-combo{width:190px;max-width:calc(50% - 5px)}
.workspace-close-button{width:39px;height:39px;border:1px solid #a9c4f4;border-radius:10px;background:#eaf1ff;color:#235fd6;box-shadow:0 2px 8px rgba(35,95,214,.12);cursor:pointer;transition:background .15s,border-color .15s,box-shadow .15s}.workspace-close-button:hover{border-color:#235fd6;background:#dce9ff;color:#174cb6;box-shadow:0 3px 11px rgba(35,95,214,.2)}.workspace-close-button:focus-visible{outline:3px solid #93b7f6;outline-offset:2px}
</style>

