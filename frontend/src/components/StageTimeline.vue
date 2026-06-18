<script setup lang="ts">
import type { ProcessingStage } from '../types'
import { ProcessingStages } from '../types'
import { cn } from '../lib/utils'
import { Check, Circle, ChevronRight } from 'lucide-vue-next'

const props = defineProps<{
  currentStage: ProcessingStage
  compact?: boolean
}>()

const currentIndex = ProcessingStages.findIndex((s) => s.stage === props.currentStage)

function getStageClass(index: number) {
  if (index < currentIndex) {
    return {
      outer: 'bg-emerald-600 border-emerald-600',
      icon: 'text-white',
      label: 'text-emerald-700 font-medium',
      dot: 'bg-emerald-600',
    }
  }
  if (index === currentIndex) {
    return {
      outer: 'bg-white border-blue-600 ring-4 ring-blue-100',
      icon: 'text-blue-600',
      label: 'text-blue-700 font-semibold',
      dot: 'bg-blue-600',
    }
  }
  return {
    outer: 'bg-white border-slate-200',
    icon: 'text-slate-300',
    label: 'text-slate-400',
    dot: 'bg-slate-200',
  }
}
</script>

<template>
  <div class="w-full">
    <div class="flex items-start justify-between gap-1">
      <template v-for="(stage, index) in ProcessingStages" :key="stage.stage">
        <div class="flex flex-col items-center flex-1 min-w-0">
          <div
            class="relative flex items-center justify-center w-8 h-8 rounded-full border-2 flex-shrink-0 transition-all duration-200"
            :class="getStageClass(index).outer"
          >
            <Check v-if="index < currentIndex" class="w-4 h-4" :class="getStageClass(index).icon" />
            <Circle v-else class="w-3 h-3 fill-current" :class="getStageClass(index).icon" />
          </div>
          <div
            class="mt-2 text-center text-xs leading-tight px-1 truncate w-full"
            :class="getStageClass(index).label"
          >
            {{ stage.label }}
          </div>
        </div>
        <div
          v-if="index < ProcessingStages.length - 1"
          class="flex-shrink-0 flex items-center mt-4 mx-0.5"
        >
          <div
            class="h-0.5 w-full rounded transition-all"
            :class="index < currentIndex ? 'bg-emerald-500' : 'bg-slate-200'"
            :style="{ width: compact ? '16px' : '24px' }"
          ></div>
        </div>
      </template>
    </div>
  </div>
</template>
