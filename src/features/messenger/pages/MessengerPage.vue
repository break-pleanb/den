<script setup lang="ts">
import { computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { Hash } from '@lucide/vue'
import { fetchChannelsByProjectKey } from '@/mock/api'

const props = defineProps<{ projectKey: string; channelId?: string }>()
const projectKey = computed(() => props.projectKey)

const { data: channels } = useQuery({
  queryKey: ['channels', projectKey],
  queryFn: () => fetchChannelsByProjectKey(projectKey.value),
})

const activeChannel = computed(() => channels.value?.find((c) => c.id === props.channelId) ?? channels.value?.[0])
</script>

<template>
  <div class="flex h-full gap-4">
    <div class="w-56 shrink-0 rounded-lg border border-border bg-card p-2 shadow-card">
      <router-link
        v-for="channel in channels"
        :key="channel.id"
        :to="{ name: 'messenger', params: { projectKey, channelId: channel.id } }"
        class="flex items-center gap-2 rounded-[9px] px-2.5 py-2 text-sm font-medium text-muted-foreground hover:bg-[#f4f5f7] hover:text-foreground"
        :class="{ '!bg-primary-soft !text-primary font-semibold': activeChannel?.id === channel.id }"
      >
        <Hash class="size-3.5 shrink-0" :stroke-width="2" />
        <span class="truncate">{{ channel.name }}</span>
        <span
          v-if="channel.unreadCount > 0"
          class="ml-auto grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10.5px] font-bold text-primary-foreground"
        >
          {{ channel.unreadCount }}
        </span>
      </router-link>
    </div>

    <div class="flex-1 rounded-lg border border-border bg-card p-6 shadow-card">
      <div v-if="activeChannel" class="text-sm text-muted-foreground">
        <span class="font-semibold text-foreground">#{{ activeChannel.name }}</span>
        채팅 화면은 다음 단계(7. 메신저)에서 완성됩니다.
      </div>
    </div>
  </div>
</template>
