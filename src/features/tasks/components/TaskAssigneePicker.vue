<script setup lang="ts">
import { Plus, X } from '@lucide/vue'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { User } from '@/mock/types'

const props = defineProps<{ options: User[]; modelValue: string[] }>()
const emit = defineEmits<{ 'update:modelValue': [string[]] }>()

function userById(id: string) {
  return props.options.find((u) => u.id === id)
}

function toggle(id: string, checked: boolean) {
  const next = checked ? [...props.modelValue, id] : props.modelValue.filter((v) => v !== id)
  emit('update:modelValue', next)
}
</script>

<template>
  <div class="flex flex-wrap items-center gap-1.5">
    <div
      v-for="id in modelValue"
      :key="id"
      class="inline-flex items-center gap-1.5 rounded-full bg-secondary py-1 pr-1.5 pl-1 text-xs font-medium text-foreground"
    >
      <span
        class="grid size-5 shrink-0 place-items-center rounded-full text-[9px] font-semibold text-white"
        :style="{ background: userById(id)?.avatarGradient }"
      >
        {{ userById(id)?.initials ?? '?' }}
      </span>
      {{ userById(id)?.name ?? id }}
      <button type="button" class="text-subtle hover:text-destructive" :aria-label="`${userById(id)?.name ?? id} 담당자 해제`" @click="toggle(id, false)">
        <X class="size-3" :stroke-width="2.4" />
      </button>
    </div>

    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <button
          type="button"
          class="grid size-7 shrink-0 place-items-center rounded-full border border-dashed border-border-strong text-muted-foreground hover:border-primary hover:text-primary"
          aria-label="담당자 추가"
        >
          <Plus class="size-3.5" :stroke-width="2.4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" class="w-52">
        <DropdownMenuLabel>담당자 선택</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem
          v-for="user in options"
          :key="user.id"
          :model-value="modelValue.includes(user.id)"
          @select.prevent
          @update:model-value="(checked) => toggle(user.id, checked as boolean)"
        >
          <span class="flex items-center gap-2">
            <span
              class="grid size-5 place-items-center rounded-full text-[9px] font-semibold text-white"
              :style="{ background: user.avatarGradient }"
            >
              {{ user.initials }}
            </span>
            {{ user.name }}
          </span>
        </DropdownMenuCheckboxItem>
        <p v-if="!options.length" class="px-2 py-1.5 text-xs text-subtle">이 프로젝트에 멤버가 없습니다.</p>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
</template>
