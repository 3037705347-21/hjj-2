<script setup lang="ts">
import type { OrderStatus } from '../types'
import { OrderStatusLabels } from '../types'
import { cn } from '../lib/utils'

defineProps<{
  status: OrderStatus
}>()

const statusClasses: Record<OrderStatus, string> = {
  'pending': 'bg-slate-100 text-slate-700 border-slate-200',
  'in-progress': 'bg-blue-50 text-blue-700 border-blue-200',
  'completed': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'on-hold': 'bg-amber-50 text-amber-700 border-amber-200',
  'returned': 'bg-rose-50 text-rose-700 border-rose-200',
}
</script>

<template>
  <span
    class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium border"
    :class="statusClasses[status]"
  >
    <span
      class="w-1.5 h-1.5 rounded-full"
      :class="{
        'bg-slate-400': status === 'pending',
        'bg-blue-500': status === 'in-progress',
        'bg-emerald-500': status === 'completed',
        'bg-amber-500': status === 'on-hold',
        'bg-rose-500': status === 'returned',
      }"
    ></span>
    {{ OrderStatusLabels[status] }}
  </span>
</template>
