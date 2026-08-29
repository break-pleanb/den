<script setup lang="ts">
import { ref } from 'vue'
import { Folder as FolderIcon, MoreHorizontal, Star } from '@lucide/vue'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { confirm } from '@/lib/confirm'
import type { Folder, Project } from '@/mock/types'

const props = defineProps<{
  project: Project
  folders: Folder[]
  isFavorite: boolean
  triggerClass?: string
}>()

const emit = defineEmits<{
  'move-to-folder': [project: Project, folderId: string | null]
  'toggle-favorite': [project: Project]
}>()

const open = ref(false)

function onSelectFolder(folderId: string | null) {
  if (folderId === props.project.folderId) return
  emit('move-to-folder', props.project, folderId)
}

async function onToggleFavorite() {
  if (props.isFavorite) {
    const ok = await confirm({
      description: `'${props.project.name}'을(를) 즐겨찾기에서 해제할까요?`,
      confirmLabel: '해제',
      destructive: true,
    })
    if (!ok) return
  }
  emit('toggle-favorite', props.project)
}
</script>

<template>
  <DropdownMenu v-model:open="open">
    <DropdownMenuTrigger as-child>
      <button
        type="button"
        class="grid size-6 shrink-0 place-items-center rounded-md text-subtle opacity-0 transition-opacity hover:bg-[#f4f5f7] hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100 data-[state=open]:opacity-100"
        :class="[{ '!opacity-100': open }, triggerClass]"
        aria-label="프로젝트 옵션"
        @click.stop.prevent
        @mousedown.stop
      >
        <MoreHorizontal class="size-4" :stroke-width="2" />
      </button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" class="w-48" @click.stop>
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          <FolderIcon class="size-4" :stroke-width="2" />
          폴더로 이동
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          <DropdownMenuItem
            :class="project.folderId === null ? 'font-semibold text-primary' : ''"
            @click="onSelectFolder(null)"
          >
            미분류
          </DropdownMenuItem>
          <DropdownMenuSeparator v-if="folders.length" />
          <DropdownMenuItem
            v-for="folder in folders"
            :key="folder.id"
            :class="project.folderId === folder.id ? 'font-semibold text-primary' : ''"
            @click="onSelectFolder(folder.id)"
          >
            {{ folder.name }}
          </DropdownMenuItem>
        </DropdownMenuSubContent>
      </DropdownMenuSub>
      <DropdownMenuItem @click="onToggleFavorite">
        <Star class="size-4" :stroke-width="2" :class="isFavorite ? 'fill-[#f5b800] text-[#f5b800]' : ''" />
        {{ isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가' }}
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
