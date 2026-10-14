<template>
  <router-view v-if="route.path === '/login'" />
  <div v-else class="app-shell">
    <Sidebar />
    <div class="app-main">
      <Topbar />
      <main class="page-main">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<script setup>
import Sidebar from './components/Sidebar.vue'
import Topbar from './components/Topbar.vue'
import { useRoute } from 'vue-router'
import { nextTick, onMounted, watch } from 'vue'
const route = useRoute()
onMounted(() => {
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
  window.scrollTo(0, 0)
})
watch(() => route.fullPath, async () => {
  await nextTick()
  window.scrollTo(0, 0)
})
</script>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
