<template>
  <div ref="searchRoot" class="report-search" :class="{ 'is-open': isOpen }">
    <button class="report-search-trigger" type="button" aria-label="搜索报告" @click="focusSearch">
      <Search :size="16" />
    </button>
    <input
      ref="searchInput"
      v-model="query"
      type="search"
      aria-label="搜索报告名称"
      placeholder="搜索报告名称"
      autocomplete="off"
      @focus="isOpen = true"
      @keydown.down.prevent="moveSelection(1)"
      @keydown.up.prevent="moveSelection(-1)"
      @keydown.enter.prevent="openSelected"
      @keydown.esc="isOpen = false"
    />
    <button v-if="query" class="report-search-clear" type="button" aria-label="清空搜索" @click="clearSearch">
      <X :size="14" />
    </button>

    <div v-if="isOpen" class="report-search-panel">
      <div class="report-search-caption">{{ query.trim() ? `搜索结果 · ${matches.length}` : '最近报告' }}</div>
      <div v-if="matches.length" class="report-search-results">
        <button
          v-for="(item, index) in matches"
          :key="`${item.kind}-${item.record.id}`"
          class="report-search-result"
          :class="{ active: selectedIndex === index }"
          type="button"
          @mouseenter="selectedIndex = index"
          @click="openReport(item)"
        >
          <span class="report-search-result-icon"><FileText :size="16" /></span>
          <span class="report-search-result-copy"><strong :title="item.record.name">{{ item.record.name }}</strong><small>{{ item.kind === 'house' ? '房屋安全鉴定' : '幕墙安全鉴定' }} · {{ item.record.time }}</small></span>
        </button>
      </div>
      <div v-else class="report-search-empty">未找到匹配的报告</div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { FileText, Search, X } from 'lucide-vue-next'
import { auditStore, requestReportPreview } from '../state/auditStore'
import { provincialState } from '../state/provincialState'

const router = useRouter()
const searchRoot = ref(null)
const searchInput = ref(null)
const query = ref('')
const isOpen = ref(false)
const selectedIndex = ref(0)

const allReports = computed(() => [
  ...auditStore.records.house.map(record => ({ kind: 'house', record })),
  ...auditStore.records.curtain.map(record => ({ kind: 'curtain', record }))
].filter(item => provincialState.user?.role !== 'org' || item.record.source !== 'organization' || item.record.organization === provincialState.user?.org).sort((a, b) => b.record.time.localeCompare(a.record.time)))

const matches = computed(() => {
  const term = query.value.trim().toLocaleLowerCase()
  const filtered = term
    ? allReports.value.filter(item => `${item.record.name} ${item.record.time} ${item.kind === 'house' ? '房屋安全鉴定' : '幕墙安全鉴定'}`.toLocaleLowerCase().includes(term))
    : allReports.value
  return filtered.slice(0, 6)
})

watch(query, () => { selectedIndex.value = 0 })

async function focusSearch() {
  isOpen.value = true
  await nextTick()
  searchInput.value?.focus()
}

function clearSearch() {
  query.value = ''
  focusSearch()
}

function moveSelection(direction) {
  if (!matches.value.length) return
  selectedIndex.value = (selectedIndex.value + direction + matches.value.length) % matches.value.length
  isOpen.value = true
}

function openSelected() {
  if (!isOpen.value) return focusSearch()
  const item = matches.value[selectedIndex.value]
  if (item) openReport(item)
}

async function openReport(item) {
  isOpen.value = false
  query.value = ''
  if (provincialState.user?.role === 'org') {
    await router.push(item.kind === 'curtain' ? '/org-field-inspection' : '/org-house-audit')
    requestReportPreview(item.kind, item.record)
    return
  }
  await router.push(item.kind === 'house' ? '/org-house-audit' : '/org-field-inspection')
  requestReportPreview(item.kind, item.record)
}

function closeOnOutside(event) {
  if (!searchRoot.value?.contains(event.target)) isOpen.value = false
}

onMounted(() => document.addEventListener('pointerdown', closeOnOutside))
onBeforeUnmount(() => document.removeEventListener('pointerdown', closeOnOutside))
</script>
