<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Hash, MessageCircle } from '@lucide/vue'
import { createChannel, createDmChannel } from '@/api/messenger'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { Channel, User } from '@/mock/types'

const props = defineProps<{ open: boolean; projectKey: string; users: User[]; currentUserId?: string }>()
const emit = defineEmits<{ 'update:open': [boolean]; created: [Channel] }>()

const mode = ref<'group' | 'dm'>('group')
const groupName = ref('')
const memberIds = ref<string[]>([])
const submitting = ref(false)
const errorMessage = ref('')

const otherUsers = computed(() => props.users.filter((u) => u.id !== props.currentUserId))

watch(
  () => props.open,
  (open) => {
    if (!open) return
    mode.value = 'group'
    groupName.value = ''
    memberIds.value = []
    errorMessage.value = ''
  },
)

function toggleMember(id: string, checked: boolean) {
  memberIds.value = checked ? [...memberIds.value, id] : memberIds.value.filter((v) => v !== id)
}

const canCreateGroup = computed(() => groupName.value.trim().length > 0)

async function onCreateGroup() {
  if (!canCreateGroup.value) return
  submitting.value = true
  errorMessage.value = ''
  try {
    const channel = await createChannel(props.projectKey, groupName.value.trim(), memberIds.value)
    emit('created', channel)
    emit('update:open', false)
  } catch {
    errorMessage.value = '채널 생성에 실패했습니다.'
  } finally {
    submitting.value = false
  }
}

async function onStartDm(user: User) {
  submitting.value = true
  errorMessage.value = ''
  try {
    const channel = await createDmChannel(props.projectKey, user.id)
    emit('created', channel)
    emit('update:open', false)
  } catch {
    errorMessage.value = 'DM 시작에 실패했습니다.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <Dialog :open="open" @update:open="(v) => emit('update:open', v)">
    <DialogContent class="sm:max-w-sm">
      <DialogHeader>
        <DialogTitle>새 대화 시작</DialogTitle>
      </DialogHeader>

      <Tabs v-model="mode">
        <TabsList class="grid w-full grid-cols-2">
          <TabsTrigger value="group">
            <Hash class="size-3.5" :stroke-width="2" />
            그룹 채널
          </TabsTrigger>
          <TabsTrigger value="dm">
            <MessageCircle class="size-3.5" :stroke-width="2" />
            다이렉트 메시지
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <form v-if="mode === 'group'" class="flex flex-col gap-3" @submit.prevent="onCreateGroup">
        <Input v-model="groupName" placeholder="채널 이름" autofocus />
        <div class="max-h-52 overflow-y-auto rounded-md border border-border p-2">
          <label
            v-for="user in otherUsers"
            :key="user.id"
            class="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 hover:bg-accent"
          >
            <Checkbox
              :model-value="memberIds.includes(user.id)"
              @update:model-value="(checked) => toggleMember(user.id, checked as boolean)"
            />
            <div
              class="grid size-6 shrink-0 place-items-center rounded-full text-[9px] font-semibold text-white"
              :style="{ background: user.avatarGradient }"
            >
              {{ user.initials }}
            </div>
            <span class="truncate text-[13px]">{{ user.name }}</span>
          </label>
          <p v-if="!otherUsers.length" class="px-2 py-1.5 text-xs text-subtle">초대할 멤버가 없습니다.</p>
        </div>
        <p v-if="errorMessage" class="text-[13px] text-destructive">{{ errorMessage }}</p>
        <DialogFooter class="mt-1">
          <Button type="button" variant="outline" @click="emit('update:open', false)">취소</Button>
          <Button type="submit" :disabled="!canCreateGroup || submitting">
            {{ submitting ? '만드는 중...' : '채널 만들기' }}
          </Button>
        </DialogFooter>
      </form>

      <div v-else class="flex flex-col gap-1">
        <div class="max-h-64 overflow-y-auto rounded-md border border-border p-1">
          <button
            v-for="user in otherUsers"
            :key="user.id"
            type="button"
            class="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left hover:bg-accent disabled:pointer-events-none disabled:opacity-50"
            :disabled="submitting"
            @click="onStartDm(user)"
          >
            <div
              class="grid size-7 shrink-0 place-items-center rounded-full text-[10px] font-semibold text-white"
              :style="{ background: user.avatarGradient }"
            >
              {{ user.initials }}
            </div>
            <div class="min-w-0">
              <div class="truncate text-[13px] font-semibold">{{ user.name }}</div>
              <div class="truncate text-xs text-muted-foreground">{{ user.title ?? user.email }}</div>
            </div>
          </button>
          <p v-if="!otherUsers.length" class="px-2.5 py-2 text-xs text-subtle">대화할 수 있는 멤버가 없습니다.</p>
        </div>
        <p v-if="errorMessage" class="mt-2 text-[13px] text-destructive">{{ errorMessage }}</p>
      </div>
    </DialogContent>
  </Dialog>
</template>
