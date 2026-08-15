<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { ShieldCheck, Users } from '@lucide/vue'

const props = defineProps<{ projectKey: string }>()

const route = useRoute()
const isMembersTab = computed(() => route.name === 'settings-members')
const isRolesTab = computed(() => route.name === 'settings-roles')
</script>

<template>
  <div class="mb-5 flex items-center gap-1 border-b border-border pb-3">
    <router-link
      :to="{ name: 'settings-members', params: { projectKey: props.projectKey } }"
      class="inline-flex items-center gap-1.5 rounded-[9px] px-3.5 py-[7px] text-[13px] font-medium text-muted-foreground hover:bg-background hover:text-foreground"
      :class="{ '!bg-primary-soft !text-primary font-semibold': isMembersTab }"
    >
      <Users class="size-[15px]" :stroke-width="2" />
      멤버
    </router-link>
    <router-link
      :to="{ name: 'settings-roles', params: { projectKey: props.projectKey } }"
      class="inline-flex items-center gap-1.5 rounded-[9px] px-3.5 py-[7px] text-[13px] font-medium text-muted-foreground hover:bg-background hover:text-foreground"
      :class="{ '!bg-primary-soft !text-primary font-semibold': isRolesTab }"
    >
      <ShieldCheck class="size-[15px]" :stroke-width="2" />
      역할·권한
    </router-link>
  </div>
</template>
