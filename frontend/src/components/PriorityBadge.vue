<script setup lang="ts">
import type { OrderPriority } from '../types'
import { PriorityLabels } from '../types'

defineProps<{
  priority: OrderPriority
}>()

const priorityClasses: Record<OrderPriority, string> = {
  'standard': 'bg-slate-50 text-slate-600 ring-1 ring-inset ring-slate-200',
  'urgent': 'bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-200',
  'stat': 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200',
}
</script>

<template>
  <span
    class="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold tracking-wide"
    :class="priorityClasses[priority]"
  >
    {{ PriorityLabels[priority] }}
  </span>
</template>
