<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { resolveConfirm, useConfirmDialogState } from '@/lib/confirm'

const state = useConfirmDialogState()

function onOpenChange(open: boolean) {
  if (!open) resolveConfirm(false)
}
</script>

<template>
  <Dialog :open="state.open" @update:open="onOpenChange">
    <DialogContent class="sm:max-w-sm">
      <DialogHeader>
        <DialogTitle>{{ state.title ?? '확인' }}</DialogTitle>
        <DialogDescription>{{ state.description }}</DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button variant="outline" @click="resolveConfirm(false)">{{ state.cancelLabel }}</Button>
        <Button :variant="state.destructive ? 'destructive' : 'default'" @click="resolveConfirm(true)">
          {{ state.confirmLabel }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
