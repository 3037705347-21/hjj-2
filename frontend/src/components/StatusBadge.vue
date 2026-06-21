<script setup lang="ts">
import { computed } from 'vue'
import type { OrderStatus } from '../types'
import { useDictionaries } from '../composables/useDictionaries'
import { cn } from '../lib/utils'

const props = defineProps<{
  status: OrderStatus
}>()

const { orderStatusLabels, orderStatusColors } = useDictionaries()

const statusLabel = computed(() => orderStatusLabels.value[props.status] || props.status)
const statusClass = computed(() => orderStatusColors.value[props.status] || 'bg-slate-100 text-slate-700 border-slate-200')

const dotClass: Record<OrderStatus, string> = {
  'pending': 'bg-slate-400',
  'in-progress': 'bg-blue-500',
  'completed': 'bg-emerald-500',
  'on-hold': 'bg-amber-500',
  'returned': 'bg-rose-500',
}
</script>

<template>
  <span
    class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium border"
    :class="statusClass"
  >
    <span
      class="w-1.5 h-1.5 rounded-full"
      :class="dotClass[status]"
    ></span>
    {{ statusLabel }}
  </span>
</template>
