<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const email = ref('jk.jung@pleanb.com')
const password = ref('')
const isSubmitting = ref(false)
const errorMessage = ref('')

async function onSubmit() {
  isSubmitting.value = true
  errorMessage.value = ''
  try {
    await authStore.login(email.value, password.value)
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
    router.push(redirect)
  } catch {
    errorMessage.value = '이메일 또는 비밀번호가 올바르지 않습니다.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-background px-4">
    <div class="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-card">
      <div class="mb-8 flex flex-col items-center gap-3">
        <div class="grid size-11 place-items-center rounded-xl bg-primary text-lg font-bold text-primary-foreground">
          d
        </div>
        <div class="text-center">
          <div class="text-lg font-bold">den</div>
          <div class="text-sm text-muted-foreground">pleanb 사내 프로젝트 관리</div>
        </div>
      </div>

      <form class="flex flex-col gap-3" @submit.prevent="onSubmit">
        <Input v-model="email" type="email" placeholder="이메일" required />
        <Input v-model="password" type="password" placeholder="비밀번호" required />
        <p v-if="errorMessage" class="text-sm text-destructive">{{ errorMessage }}</p>
        <Button type="submit" class="mt-1 w-full" :disabled="isSubmitting">
          {{ isSubmitting ? '로그인 중...' : '로그인' }}
        </Button>
      </form>
    </div>
  </div>
</template>
