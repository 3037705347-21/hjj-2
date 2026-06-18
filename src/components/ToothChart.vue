<script setup lang="ts">
import { computed } from 'vue'
import type { Tooth, ToothWorkItem } from '../types'
import { RestorationTypeLabels, MaterialTypeLabels } from '../types'
import { PermanentTeeth, PrimaryTeeth, getToothByNumber } from '../config/teeth'
import { cn } from '../lib/utils'

interface Props {
  workItems?: ToothWorkItem[]
  selectable?: boolean
  showPrimary?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  selectable: false,
  showPrimary: false,
})

const emit = defineEmits<{
  (e: 'select', tooth: Tooth): void
}>()

const teethSource = computed(() => (props.showPrimary ? PrimaryTeeth : PermanentTeeth))

const workMap = computed(() => {
  const map = new Map<string, ToothWorkItem>()
  props.workItems?.forEach((item) => map.set(item.toothNumber, item))
  return map
})

const isFullArch = computed(() =>
  props.workItems?.some((item) => item.toothNumber === 'all')
)

function getQuadrantTeeth(quadrant: Tooth['quadrant']) {
  return teethSource.value.filter((t) => t.quadrant === quadrant)
}

function isWorked(toothNumber: string) {
  return workMap.value.has(toothNumber)
}

function getWorkInfo(toothNumber: string) {
  return workMap.value.get(toothNumber)
}

function renderToothNumber(quadrant: Tooth['quadrant']): string {
  const map: Record<Tooth['quadrant'], string> = {
    'upper-right': '右上',
    'upper-left': '左上',
    'lower-left': '左下',
    'lower-right': '右下',
  }
  return map[quadrant]
}
</script>

<template>
  <div class="w-full">
    <div
      v-if="isFullArch"
      class="mb-4 p-3 rounded-lg bg-violet-50 border border-violet-200"
    >
      <div class="flex items-center gap-2 text-sm">
        <span class="inline-block w-3 h-3 rounded bg-violet-500"></span>
        <span class="font-medium text-violet-800">全口/半口修复</span>
        <span class="text-violet-600" v-if="workItems?.[0]">
          {{ RestorationTypeLabels[workItems[0].restorationType] }} /
          {{ MaterialTypeLabels[workItems[0].material] }}
        </span>
      </div>
    </div>

    <div class="space-y-3">
      <div
        class="text-center text-xs font-medium text-slate-500 tracking-widest"
      >
        上颌 MAXILLARY
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div class="flex justify-end">
          <div class="flex flex-col items-center">
            <div class="text-[10px] text-slate-400 mb-1">
              {{ renderToothNumber('upper-right') }}
            </div>
            <div class="flex">
              <div
                v-for="tooth in getQuadrantTeeth('upper-right')"
                :key="tooth.number"
                class="group relative w-8 h-10 mx-0.5 cursor-pointer"
                :class="{ 'cursor-pointer': selectable }"
                @click="selectable && emit('select', tooth)"
              >
                <div
                  class="absolute inset-0 rounded-t-2xl rounded-b-md border-2 transition-all flex items-end justify-center pb-1"
                  :class="[
                    isWorked(tooth.number)
                      ? 'bg-blue-500 border-blue-600 text-white'
                      : 'bg-white border-slate-300 text-slate-500 hover:border-slate-400 hover:bg-slate-50',
                  ]"
                >
                  <span
                    class="text-[10px] font-bold leading-none"
                  >
                    {{ tooth.number }}
                  </span>
                </div>

                <div
                  v-if="isWorked(tooth.number)"
                  class="absolute left-1/2 -translate-x-1/2 -bottom-10 w-24 z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <div
                    class="bg-slate-900 text-white rounded-md p-2 text-[10px] shadow-lg border border-slate-700"
                  >
                    <div class="font-semibold text-white mb-1">
                      {{ tooth.name }}
                    </div>
                    <div class="text-slate-300">
                      类型: {{ RestorationTypeLabels[getWorkInfo(tooth.number)!.restorationType] }}
                    </div>
                    <div class="text-slate-300">
                      材料: {{ MaterialTypeLabels[getWorkInfo(tooth.number)!.material] }}
                    </div>
                    <div class="text-slate-300">
                      色号: {{ getWorkInfo(tooth.number)!.shade }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="flex justify-start">
          <div class="flex flex-col items-center">
            <div class="text-[10px] text-slate-400 mb-1">
              {{ renderToothNumber('upper-left') }}
            </div>
            <div class="flex">
              <div
                v-for="tooth in getQuadrantTeeth('upper-left')"
                :key="tooth.number"
                class="group relative w-8 h-10 mx-0.5 cursor-pointer"
                :class="{ 'cursor-pointer': selectable }"
                @click="selectable && emit('select', tooth)"
              >
                <div
                  class="absolute inset-0 rounded-t-2xl rounded-b-md border-2 transition-all flex items-end justify-center pb-1"
                  :class="[
                    isWorked(tooth.number)
                      ? 'bg-blue-500 border-blue-600 text-white'
                      : 'bg-white border-slate-300 text-slate-500 hover:border-slate-400 hover:bg-slate-50',
                  ]"
                >
                  <span
                    class="text-[10px] font-bold leading-none"
                  >
                    {{ tooth.number }}
                  </span>
                </div>

                <div
                  v-if="isWorked(tooth.number)"
                  class="absolute left-1/2 -translate-x-1/2 -bottom-10 w-24 z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <div
                    class="bg-slate-900 text-white rounded-md p-2 text-[10px] shadow-lg border border-slate-700"
                  >
                    <div class="font-semibold text-white mb-1">
                      {{ tooth.name }}
                    </div>
                    <div class="text-slate-300">
                      类型: {{ RestorationTypeLabels[getWorkInfo(tooth.number)!.restorationType] }}
                    </div>
                    <div class="text-slate-300">
                      材料: {{ MaterialTypeLabels[getWorkInfo(tooth.number)!.material] }}
                    </div>
                    <div class="text-slate-300">
                      色号: {{ getWorkInfo(tooth.number)!.shade }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="flex items-center justify-center py-2">
        <div class="h-px w-full bg-gradient-to-r from-transparent via-slate-300 to-transparent max-w-xs"></div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div class="flex justify-start">
          <div class="flex flex-col items-center">
            <div class="flex">
              <div
                v-for="tooth in getQuadrantTeeth('lower-left')"
                :key="tooth.number"
                class="group relative w-8 h-10 mx-0.5 cursor-pointer"
                :class="{ 'cursor-pointer': selectable }"
                @click="selectable && emit('select', tooth)"
              >
                <div
                  class="absolute inset-0 rounded-b-2xl rounded-t-md border-2 transition-all flex items-start justify-center pt-1"
                  :class="[
                    isWorked(tooth.number)
                      ? 'bg-blue-500 border-blue-600 text-white'
                      : 'bg-white border-slate-300 text-slate-500 hover:border-slate-400 hover:bg-slate-50',
                  ]"
                >
                  <span
                    class="text-[10px] font-bold leading-none"
                  >
                    {{ tooth.number }}
                  </span>
                </div>

                <div
                  v-if="isWorked(tooth.number)"
                  class="absolute left-1/2 -translate-x-1/2 -top-24 w-24 z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <div
                    class="bg-slate-900 text-white rounded-md p-2 text-[10px] shadow-lg border border-slate-700"
                  >
                    <div class="font-semibold text-white mb-1">
                      {{ tooth.name }}
                    </div>
                    <div class="text-slate-300">
                      类型: {{ RestorationTypeLabels[getWorkInfo(tooth.number)!.restorationType] }}
                    </div>
                    <div class="text-slate-300">
                      材料: {{ MaterialTypeLabels[getWorkInfo(tooth.number)!.material] }}
                    </div>
                    <div class="text-slate-300">
                      色号: {{ getWorkInfo(tooth.number)!.shade }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="text-[10px] text-slate-400 mt-1">
              {{ renderToothNumber('lower-left') }}
            </div>
          </div>
        </div>

        <div class="flex justify-end">
          <div class="flex flex-col items-center">
            <div class="flex">
              <div
                v-for="tooth in getQuadrantTeeth('lower-right')"
                :key="tooth.number"
                class="group relative w-8 h-10 mx-0.5 cursor-pointer"
                :class="{ 'cursor-pointer': selectable }"
                @click="selectable && emit('select', tooth)"
              >
                <div
                  class="absolute inset-0 rounded-b-2xl rounded-t-md border-2 transition-all flex items-start justify-center pt-1"
                  :class="[
                    isWorked(tooth.number)
                      ? 'bg-blue-500 border-blue-600 text-white'
                      : 'bg-white border-slate-300 text-slate-500 hover:border-slate-400 hover:bg-slate-50',
                  ]"
                >
                  <span
                    class="text-[10px] font-bold leading-none"
                  >
                    {{ tooth.number }}
                  </span>
                </div>

                <div
                  v-if="isWorked(tooth.number)"
                  class="absolute left-1/2 -translate-x-1/2 -top-24 w-24 z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <div
                    class="bg-slate-900 text-white rounded-md p-2 text-[10px] shadow-lg border border-slate-700"
                  >
                    <div class="font-semibold text-white mb-1">
                      {{ tooth.name }}
                    </div>
                    <div class="text-slate-300">
                      类型: {{ RestorationTypeLabels[getWorkInfo(tooth.number)!.restorationType] }}
                    </div>
                    <div class="text-slate-300">
                      材料: {{ MaterialTypeLabels[getWorkInfo(tooth.number)!.material] }}
                    </div>
                    <div class="text-slate-300">
                      色号: {{ getWorkInfo(tooth.number)!.shade }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="text-[10px] text-slate-400 mt-1">
              {{ renderToothNumber('lower-right') }}
            </div>
          </div>
        </div>
      </div>

      <div
        class="text-center text-xs font-medium text-slate-500 tracking-widest mt-2"
      >
        下颌 MANDIBULAR
      </div>
    </div>

    <div
      v-if="workItems && workItems.length > 0"
      class="mt-6 pt-4 border-t border-slate-200"
    >
      <div class="text-sm font-semibold text-slate-700 mb-3">修复体明细</div>
      <div class="space-y-2">
        <div
          v-for="(item, idx) in workItems.filter(i => i.toothNumber !== 'all')"
          :key="idx"
          class="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-lg text-sm"
        >
          <div class="flex items-center gap-3">
            <span
              class="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100 text-blue-700 font-bold text-sm"
            >
              {{ item.toothNumber }}
            </span>
            <div>
              <div class="font-medium text-slate-800">
                {{ RestorationTypeLabels[item.restorationType] }}
              </div>
              <div class="text-xs text-slate-500">
                {{ getToothByNumber(item.toothNumber)?.name }}
              </div>
            </div>
          </div>
          <div class="text-right">
            <div class="text-sm text-slate-700">
              {{ MaterialTypeLabels[item.material] }}
            </div>
            <div class="text-xs text-slate-500">
              色号 {{ item.shade }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
