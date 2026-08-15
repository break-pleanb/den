<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'
import { fetchProjects } from '@/mock/api'

const { data: projects, isLoading } = useQuery({ queryKey: ['projects'], queryFn: fetchProjects })
</script>

<template>
  <div>
    <div class="mb-5">
      <div class="text-xl font-bold tracking-tight">전체 프로젝트</div>
      <div class="mt-1 text-sm text-muted-foreground">
        {{ isLoading ? '불러오는 중...' : `총 ${projects?.length ?? 0}개 프로젝트` }}
      </div>
    </div>

    <div class="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-3.5">
      <router-link
        v-for="project in projects"
        :key="project.id"
        :to="{ name: 'tasks', params: { projectKey: project.key } }"
        class="rounded-lg border border-border bg-card p-4 shadow-card transition-shadow hover:shadow-[0_2px_8px_rgba(16,24,40,.08)]"
      >
        <div class="flex items-center gap-2.5">
          <span class="size-2.5 shrink-0 rounded-full" :style="{ background: project.color }" />
          <div class="truncate font-semibold">{{ project.name }}</div>
        </div>
        <div class="mt-1.5 text-xs text-subtle">{{ project.key }}</div>
      </router-link>
    </div>
  </div>
</template>
