<script setup lang="ts">
import { useRoute } from 'vue-router'
import Sidebar from './Sidebar.vue'
import ContextBar from './ContextBar.vue'

const route = useRoute()
</script>

<template>
  <div class="flex h-screen overflow-hidden bg-background text-[14px] text-foreground">
    <Sidebar />
    <div class="flex flex-1 flex-col overflow-hidden">
      <ContextBar v-if="route.params.projectKey" />
      <div class="flex-1 overflow-y-auto p-[22px]">
        <router-view />
      </div>
    </div>
  </div>
</template>
