<script setup lang="ts">
import { useRouter } from 'vue-router'
import type { Order } from '../types'
import { RestorationTypeLabels, MaterialTypeLabels, ImpressionMethodLabels } from '../types'
import StatusBadge from './StatusBadge.vue'
import PriorityBadge from './PriorityBadge.vue'
import StageTimeline from './StageTimeline.vue'
import {
  Calendar,
  Clock,
  Building2,
  User,
  ClipboardList,
  ChevronRight,
  AlertCircle,
  Pencil,
  RefreshCw,
} from 'lucide-vue-next'

const props = defineProps<{
  order: Order
}>()

const emit = defineEmits<{
  (e: 'view-detail'): void
}>()

const router = useRouter()

function goToEdit(e: MouseEvent) {
  e.stopPropagation()
  router.push(`/order/${props.order.id}/edit`)
}

function goToCopy(e: MouseEvent) {
  e.stopPropagation()
  router.push({ path: `/order/${props.order.id}/edit`, query: { mode: 'copy' } })
}

const today = new Date()
const delivery = new Date(props.order.deliveryDate)
const daysToDelivery = Math.ceil(
  (delivery.getTime() - new Date(today.toDateString()).getTime()) / 86400000
)

const isDelayed =
  daysToDelivery < 0 &&
  props.order.status !== 'completed' &&
  props.order.currentStage !== 'delivered'

const isDueSoon =
  daysToDelivery >= 0 &&
  daysToDelivery <= 2 &&
  props.order.status !== 'completed'

const workSummary = props.order.workItems
  .filter((w) => w.toothNumber !== 'all')
  .map((w) => w.toothNumber)
  .join(', ')

const materials = Array.from(
  new Set(props.order.workItems.map((w) => MaterialTypeLabels[w.material]))
).join('、')

const restorationTypes = Array.from(
  new Set(
    props.order.workItems.map((w) => RestorationTypeLabels[w.restorationType])
  )
).join('、')
</script>

<template>
  <div
    class="group bg-white rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all duration-200 overflow-hidden cursor-pointer"
    @click="emit('view-detail')"
  >
    <div
      class="px-4 py-3 border-b border-slate-100 bg-slate-50/50 flex items-start justify-between gap-3"
    >
      <div class="min-w-0 flex-1">
        <div class="flex items-start justify-between gap-2 mb-1">
          <div class="flex items-center gap-2 min-w-0 flex-wrap">
            <span
              class="text-sm font-bold tracking-tight text-slate-800 font-mono"
            >
              {{ order.orderNumber }}
            </span>
            <PriorityBadge :priority="order.priority" />
            <StatusBadge :status="order.status" />
          </div>
          <div class="flex items-center gap-0.5 flex-shrink-0">
            <button
              class="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
              title="编辑订单"
              @click="goToEdit"
            >
              <Pencil class="w-3.5 h-3.5" />
            </button>
            <button
              class="p-1.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded transition-colors"
              title="复制订单"
              @click="goToCopy"
            >
              <RefreshCw class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <div class="flex items-center gap-3 text-xs text-slate-500">
          <span class="flex items-center gap-1">
            <Building2 class="w-3 h-3" />
            {{ order.clinic.name }}
          </span>
          <span class="flex items-center gap-1">
            <User class="w-3 h-3" />
            {{ order.patient.anonymousCode }}
          </span>
        </div>
      </div>
      <ChevronRight
        class="w-5 h-5 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all flex-shrink-0"
      />
    </div>

    <div class="p-4">
      <div
        class="grid grid-cols-3 gap-3 mb-4 text-sm"
      >
        <div>
          <div class="text-xs text-slate-500 mb-1">修复类型</div>
          <div class="font-medium text-slate-700 truncate">{{ restorationTypes }}</div>
        </div>
        <div>
          <div class="text-xs text-slate-500 mb-1">牙位</div>
          <div class="font-medium text-slate-700 truncate">
            {{ workSummary || '全口/半口' }}
          </div>
        </div>
        <div>
          <div class="text-xs text-slate-500 mb-1">材料</div>
          <div class="font-medium text-slate-700 truncate">{{ materials }}</div>
        </div>
      </div>

      <div class="mb-4">
        <StageTimeline :current-stage="order.currentStage" compact />
      </div>

      <div
        class="flex items-center justify-between pt-3 border-t border-slate-100"
      >
        <div class="flex items-center gap-4 text-xs">
          <div
            class="flex items-center gap-1.5"
            :class="[
              isDelayed
                ? 'text-rose-600'
                : isDueSoon
                ? 'text-amber-600'
                : 'text-slate-500',
            ]"
          >
            <Calendar class="w-3.5 h-3.5" />
            <span>{{ order.deliveryDate }}</span>
            <template v-if="isDelayed">
              <AlertCircle class="w-3.5 h-3.5" />
              <span class="font-medium">已逾期{{ Math.abs(daysToDelivery) }}天</span>
            </template>
            <template v-else-if="isDueSoon && daysToDelivery === 0">
              <AlertCircle class="w-3.5 h-3.5" />
              <span class="font-medium">今日交付</span>
            </template>
            <template v-else-if="isDueSoon">
              <AlertCircle class="w-3.5 h-3.5" />
              <span class="font-medium">剩余{{ daysToDelivery }}天</span>
            </template>
          </div>

          <div class="flex items-center gap-1.5 text-slate-500">
            <ClipboardList class="w-3.5 h-3.5" />
            <span>{{ ImpressionMethodLabels[order.impressionMethod] }}</span>
          </div>
        </div>

        <div
          v-if="order.returnRecords.length > 0"
          class="flex items-center gap-1 px-2 py-0.5 bg-rose-50 rounded text-xs text-rose-600 font-medium"
        >
          <AlertCircle class="w-3 h-3" />
          返工 x{{ order.returnRecords.length }}
        </div>
      </div>
    </div>
  </div>
</template>
