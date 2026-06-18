<script setup lang="ts">
import { computed, type Component } from 'vue'
import { cn } from '../lib/utils'
import type { LucideIcon } from 'lucide-vue-next'

interface Props {
  title: string
  value: string | number
  icon: Component
  trend?: string
  tone?: 'default' | 'primary' | 'success' | 'warning' | 'danger'
  description?: string
}

const props = withDefaults(defineProps<Props>(), {
  tone: 'default',
})

const iconClasses = computed(() => {
  const tones: Record<string, string> = {
    default: 'bg-slate-100 text-slate-600',
    primary: 'bg-blue-100 text-blue-600',
    success: 'bg-emerald-100 text-emerald-600',
    warning: 'bg-amber-100 text-amber-600',
    danger: 'bg-rose-100 text-rose-600',
  }
  return tones[props.tone]
})

const trendClasses = computed(() => {
  if (!props.trend) return ''
  if (props.trend.startsWith('+')) return 'text-emerald-600'
  if (props.trend.startsWith('-')) return 'text-rose-600'
  return 'text-slate-500'
})
</script>

<template>
  <div
    class="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow"
  >
    <div class="flex items-start justify-between">
      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium text-slate-500 truncate">{{ title }}</p>
        <p class="mt-2 text-2xl font-bold text-slate-900 tracking-tight">
          {{ value }}
        </p>
        <div class="mt-2 flex items-center gap-2 text-xs">
          <span v-if="trend" :class="trendClasses" class="font-medium">
            {{ trend }}
          </span>
          <span v-if="description" class="text-slate-500">{{ description }}</span>
        </div>
      </div>
      <div
        class="flex-shrink-0 p-2.5 rounded-lg transition-all"
        :class="iconClasses"
      >
        <component :is="icon" class="w-5 h-5" />
      </div>
    </div>
  </div>
</template>
