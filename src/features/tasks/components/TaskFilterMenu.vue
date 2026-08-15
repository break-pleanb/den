<script setup lang="ts">
import type { Component } from 'vue'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const props = defineProps<{
  label: string
  icon: Component
  options: { value: string; label: string; dotClass?: string }[]
  selected: string[]
}>()

const emit = defineEmits<{ 'update:selected': [string[]] }>()

function toggle(value: string, checked: boolean) {
  const next = checked ? [...props.selected, value] : props.selected.filter((v) => v !== value)
  emit('update:selected', next)
}
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <button
        type="button"
        class="inline-flex items-center gap-1.5 rounded-[9px] border border-border-strong bg-card px-3 py-[7px] text-[13px] font-medium text-muted-foreground hover:bg-background"
        :class="{ 'border-primary bg-primary-soft text-primary': selected.length > 0 }"
      >
        <component :is="icon" class="size-3.5" :stroke-width="2" />
        {{ label }}
        <span v-if="selected.length" class="font-semibold">· {{ selected.length }}</span>
      </button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="start" class="w-48">
      <DropdownMenuCheckboxItem
        v-for="opt in options"
        :key="opt.value"
        :model-value="selected.includes(opt.value)"
        @select.prevent
        @update:model-value="(checked) => toggle(opt.value, checked as boolean)"
      >
        <span class="flex items-center gap-2">
          <span v-if="opt.dotClass" class="size-[7px] shrink-0 rounded-full" :class="opt.dotClass" />
          {{ opt.label }}
        </span>
      </DropdownMenuCheckboxItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
