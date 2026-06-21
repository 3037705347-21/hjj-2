<script setup lang="ts">
import { computed } from 'vue'
import type { OrderPriority } from '../types'
import { useDictionaries } from '../composables/useDictionaries'

const props = defineProps<{
  priority: OrderPriority
}>()

const { priorityLabels, priorityColors } = useDictionaries()

const priorityLabel = computed(() => priorityLabels.value[props.priority] || props.priority)
const priorityClass = computed(() => priorityColors.value[props.priority] || 'bg-slate-50 text-slate-600 ring-1 ring-inset ring-slate-200')
</script>

<template>
  <span
    class="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold tracking-wide"
    :class="priorityClass"
  >
    {{ priorityLabel }}
  </span>
</template>
