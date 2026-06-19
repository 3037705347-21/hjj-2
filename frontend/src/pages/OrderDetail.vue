<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft,
  Calendar,
  Building2,
  User,
  Phone,
  MapPin,
  Mail,
  AlertCircle,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Wrench,
  Palette,
  Layers,
  Stethoscope,
  BadgeDollarSign,
  ChevronRight,
  RefreshCw,
  Pencil,
  Plus,
} from 'lucide-vue-next'
import StatusBadge from '../components/StatusBadge.vue'
import PriorityBadge from '../components/PriorityBadge.vue'
import ToothChart from '../components/ToothChart.vue'
import StageTimeline from '../components/StageTimeline.vue'
import { useOrders } from '../composables/useOrders'
import type { StageHistoryEntry } from '../types'
import {
  ProcessingStages,
  RestorationTypeLabels,
  MaterialTypeLabels,
  ImpressionMethodLabels,
} from '../types'

const route = useRoute()
const router = useRouter()
const { getOrderById, copyOrder } = useOrders()

const order = computed(() => getOrderById(String(route.params.id)))

const today = new Date()

const daysToDelivery = computed(() => {
  if (!order.value) return 0
  const delivery = new Date(order.value.deliveryDate)
  return Math.ceil(
    (delivery.getTime() - new Date(today.toDateString()).getTime()) / 86400000
  )
})

const deliveryStatusClass = computed(() => {
  if (!order.value) return 'text-slate-600 bg-slate-50 border-slate-200'
  if (
    order.value.status === 'completed' ||
    order.value.currentStage === 'delivered'
  )
    return 'text-emerald-700 bg-emerald-50 border-emerald-200'
  if (daysToDelivery.value < 0)
    return 'text-rose-700 bg-rose-50 border-rose-200'
  if (daysToDelivery.value <= 2)
    return 'text-amber-700 bg-amber-50 border-amber-200'
  return 'text-slate-600 bg-slate-50 border-slate-200'
})

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatShortDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

function getStageInfo(stage: string) {
  return ProcessingStages.find((s) => s.stage === stage)
}

function isCurrentStage(entry: StageHistoryEntry) {
  return (
    order.value?.currentStage === entry.stage && !entry.completedAt
  )
}

function goBack() {
  router.back()
}

function goToEdit() {
  if (!order.value) return
  router.push(`/order/${order.value.id}/edit`)
}

function handleCopyOrder() {
  if (!order.value) return
  const newOrder = copyOrder(order.value.id)
  if (newOrder) {
    router.push(`/order/${newOrder.id}`)
  }
}

function goToNewOrder() {
  router.push('/order/new')
}
</script>

<template>
  <div v-if="order" class="min-h-full pb-12">
    <div class="mb-6">
      <button
        class="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 mb-4 transition-colors"
        @click="goBack"
      >
        <ArrowLeft class="w-4 h-4" />
        返回订单看板
      </button>

      <div
        class="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-4"
      >
        <div>
          <div class="flex flex-wrap items-center gap-3 mb-2">
            <h1
              class="text-2xl font-bold text-slate-900 tracking-tight font-mono"
            >
              {{ order.orderNumber }}
            </h1>
            <PriorityBadge :priority="order.priority" />
            <StatusBadge :status="order.status" />
            <span
              v-if="order.returnRecords.length > 0"
              class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200"
            >
              <RefreshCw class="w-3 h-3" />
              返工 {{ order.returnRecords.length }} 次
            </span>
          </div>
          <p class="text-sm text-slate-500">
            下单时间：{{ formatDate(order.createdAt) }}
          </p>
        </div>

        <div class="flex flex-col items-stretch lg:items-end gap-4 w-full lg:w-auto">
          <div class="flex items-center gap-2 flex-wrap">
            <button
              class="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              @click="goToNewOrder"
            >
              <Plus class="w-4 h-4" />
              新建
            </button>
            <button
              class="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-violet-700 bg-violet-50 border border-violet-200 rounded-lg hover:bg-violet-100 transition-colors"
              @click="handleCopyOrder"
            >
              <RefreshCw class="w-4 h-4" />
              复制
            </button>
            <button
              class="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
              @click="goToEdit"
            >
              <Pencil class="w-4 h-4" />
              编辑
            </button>
          </div>

          <div
            class="px-4 py-3 rounded-xl border w-full lg:w-56"
            :class="deliveryStatusClass"
          >
            <div class="flex items-center gap-2 text-xs font-medium mb-1">
              <Calendar class="w-3.5 h-3.5" />
              交付日期
            </div>
            <div class="text-lg font-bold tracking-tight">
              {{ formatShortDate(order.deliveryDate) }}
            </div>
            <div
              v-if="order.status !== 'completed' && order.currentStage !== 'delivered'"
              class="text-xs mt-0.5"
            >
              <template v-if="daysToDelivery < 0">
                已逾期 {{ Math.abs(daysToDelivery) }} 天
              </template>
              <template v-else-if="daysToDelivery === 0">
                今日需交付
              </template>
              <template v-else>
                剩余 {{ daysToDelivery }} 天
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <div class="xl:col-span-2 space-y-6">
        <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div
            class="px-5 py-4 border-b border-slate-100 flex items-center justify-between"
          >
            <div class="flex items-center gap-2">
              <div
                class="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center"
              >
                <Clock class="w-4 h-4 text-blue-600" />
              </div>
              <h2 class="text-base font-semibold text-slate-800">
                加工进度
              </h2>
            </div>
            <span class="text-xs text-slate-500">
              {{
                ProcessingStages.findIndex(
                  (s) => s.stage === order.currentStage
                ) + 1
              }}
              / {{ ProcessingStages.length }}
            </span>
          </div>
          <div class="p-5">
            <StageTimeline :current-stage="order.currentStage" />
          </div>

          <div
            class="border-t border-slate-100 bg-slate-50/50 px-5 py-4"
          >
            <div class="text-sm font-semibold text-slate-700 mb-3">
              详细日志
            </div>
            <div class="space-y-0">
              <div
                v-for="(entry, idx) in order.stageHistory"
                :key="idx"
                class="relative pl-8 pb-4 last:pb-0"
              >
                <div
                  v-if="idx < order.stageHistory.length - 1"
                  class="absolute left-3.5 top-5 w-px h-full bg-slate-200"
                ></div>
                <div
                  class="absolute left-0 top-0 w-7 h-7 rounded-full flex items-center justify-center transition-all"
                  :class="[
                    entry.completedAt
                      ? 'bg-emerald-100 border-2 border-emerald-500'
                      : isCurrentStage(entry)
                      ? 'bg-blue-50 border-2 border-blue-500 ring-4 ring-blue-100'
                      : 'bg-white border-2 border-slate-300',
                  ]"
                >
                  <CheckCircle2
                    v-if="entry.completedAt"
                    class="w-3.5 h-3.5 text-emerald-600"
                  />
                  <div
                    v-else-if="isCurrentStage(entry)"
                    class="w-2 h-2 rounded-full bg-blue-500 animate-pulse"
                  ></div>
                  <div v-else class="w-2 h-2 rounded-full bg-slate-300"></div>
                </div>

                <div
                  class="bg-white border border-slate-200 rounded-lg p-4 ml-2"
                  :class="{
                    'ring-2 ring-blue-100 border-blue-200': isCurrentStage(
                      entry
                    ),
                  }"
                >
                  <div
                    class="flex items-center justify-between mb-2 flex-wrap gap-2"
                  >
                    <div class="flex items-center gap-2">
                      <span
                        class="font-semibold text-sm"
                        :class="[
                          entry.completedAt
                            ? 'text-slate-800'
                            : isCurrentStage(entry)
                            ? 'text-blue-700'
                            : 'text-slate-500',
                        ]"
                      >
                        {{ getStageInfo(entry.stage)?.label }}
                      </span>
                      <span
                        v-if="isCurrentStage(entry)"
                        class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700"
                      >
                        <span class="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                        进行中
                      </span>
                    </div>
                    <div class="flex items-center gap-3 text-xs text-slate-500">
                      <span>开始：{{ formatDate(entry.startedAt) }}</span>
                      <template v-if="entry.completedAt">
                        <ChevronRight class="w-3 h-3 text-slate-300" />
                        <span class="text-emerald-600 font-medium">
                          完成：{{ formatDate(entry.completedAt) }}
                        </span>
                      </template>
                    </div>
                  </div>

                  <div
                    class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 mb-2"
                  >
                    <span
                      v-if="entry.technician"
                      class="flex items-center gap-1"
                    >
                      <Wrench class="w-3 h-3" />
                      {{ entry.technician }}
                    </span>
                  </div>

                  <p
                    v-if="entry.notes"
                    class="text-sm text-slate-600 bg-slate-50 rounded-md px-3 py-2 border border-slate-100"
                  >
                    {{ entry.notes }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          v-if="order.returnRecords.length > 0"
          class="bg-white rounded-xl border border-rose-200 overflow-hidden"
        >
          <div
            class="px-5 py-4 border-b border-rose-100 bg-rose-50/50 flex items-center gap-2"
          >
            <div
              class="w-8 h-8 rounded-lg bg-rose-100 border border-rose-200 flex items-center justify-center"
            >
              <AlertCircle class="w-4 h-4 text-rose-600" />
            </div>
            <div>
              <h2 class="text-base font-semibold text-slate-800">
                返工记录
              </h2>
              <p class="text-xs text-slate-500">
                共 {{ order.returnRecords.length }} 次返工
              </p>
            </div>
          </div>
          <div class="p-5 space-y-4">
            <div
              v-for="(record, idx) in order.returnRecords"
              :key="record.id"
              class="border border-rose-100 bg-rose-50/30 rounded-lg p-4"
            >
              <div
                class="flex items-start justify-between mb-3 flex-wrap gap-2"
              >
                <div class="flex items-center gap-2">
                  <span
                    class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-rose-600 text-white text-xs font-bold"
                  >
                    #{{ idx + 1 }}
                  </span>
                  <span class="font-medium text-slate-800 text-sm">
                    {{ getStageInfo(record.stageReturnedFrom)?.label }}
                    阶段退回
                  </span>
                </div>
                <span class="text-xs text-slate-500">
                  {{ formatDate(record.returnedAt) }}
                </span>
              </div>

              <div class="space-y-3 text-sm">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div
                    class="p-3 bg-white rounded-lg border border-slate-200"
                  >
                    <div class="flex items-center gap-1.5 text-xs font-medium text-rose-600 mb-1">
                      <XCircle class="w-3.5 h-3.5" />
                      问题原因
                    </div>
                    <p class="text-slate-700">{{ record.reason }}</p>
                  </div>
                  <div
                    class="p-3 bg-white rounded-lg border border-slate-200"
                  >
                    <div class="flex items-center gap-1.5 text-xs font-medium text-emerald-600 mb-1">
                      <Wrench class="w-3.5 h-3.5" />
                      整改措施
                    </div>
                    <p class="text-slate-700">
                      {{ record.correctiveAction }}
                    </p>
                  </div>
                </div>

                <div
                  class="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-rose-100"
                >
                  <div class="flex items-center gap-4">
                    <span v-if="record.responsibleTechnician">
                      责任人：{{ record.responsibleTechnician }}
                    </span>
                  </div>
                  <span
                    v-if="record.completedAt"
                    class="inline-flex items-center gap-1 text-emerald-600 font-medium"
                  >
                    <CheckCircle2 class="w-3.5 h-3.5" />
                    已解决 {{ formatShortDate(record.completedAt) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          v-if="order.specialInstructions"
          class="bg-white rounded-xl border border-slate-200 overflow-hidden"
        >
          <div
            class="px-5 py-4 border-b border-slate-100 flex items-center gap-2"
          >
            <div
              class="w-8 h-8 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center"
            >
              <FileText class="w-4 h-4 text-amber-600" />
            </div>
            <h2 class="text-base font-semibold text-slate-800">
              特殊说明
            </h2>
          </div>
          <div class="p-5">
            <div
              class="p-4 bg-amber-50 rounded-lg border border-amber-100 text-sm text-slate-700 leading-relaxed"
            >
              {{ order.specialInstructions }}
            </div>
          </div>
        </div>
      </div>

      <div class="space-y-6">
        <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div
            class="px-5 py-4 border-b border-slate-100 flex items-center gap-2"
          >
            <div
              class="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center"
            >
              <Layers class="w-4 h-4 text-indigo-600" />
            </div>
            <h2 class="text-base font-semibold text-slate-800">
              牙位图
            </h2>
          </div>
          <div class="p-5">
            <ToothChart :work-items="order.workItems" />
          </div>
        </div>

        <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div
            class="px-5 py-4 border-b border-slate-100 flex items-center gap-2"
          >
            <div
              class="w-8 h-8 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center"
            >
              <Palette class="w-4 h-4 text-teal-600" />
            </div>
            <h2 class="text-base font-semibold text-slate-800">
              修复体清单
            </h2>
          </div>
          <div class="divide-y divide-slate-100">
            <div
              v-for="(item, idx) in order.workItems"
              :key="idx"
              class="p-5"
            >
              <div
                class="flex items-start justify-between mb-3 flex-wrap gap-2"
              >
                <div class="flex items-center gap-3">
                  <span
                    v-if="item.toothNumber !== 'all'"
                    class="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100 text-blue-700 font-bold"
                  >
                    {{ item.toothNumber }}
                  </span>
                  <span
                    v-else
                    class="inline-flex items-center justify-center h-10 px-3 rounded-lg bg-violet-100 text-violet-700 font-bold"
                  >
                    全口
                  </span>
                  <div>
                    <div class="font-semibold text-slate-800 text-sm">
                      {{ RestorationTypeLabels[item.restorationType] }}
                    </div>
                    <div class="text-xs text-slate-500">
                      {{ MaterialTypeLabels[item.material] }}
                    </div>
                  </div>
                </div>
                <div
                  class="px-3 py-1.5 bg-slate-100 rounded-lg text-center"
                >
                  <div class="text-[10px] text-slate-500 leading-tight">
                    比色号
                  </div>
                  <div class="font-bold text-slate-800 tracking-wide">
                    {{ item.shade }}
                  </div>
                </div>
              </div>
              <p
                v-if="item.notes"
                class="text-xs text-slate-600 bg-slate-50 rounded-md px-3 py-2 border border-slate-100"
              >
                备注：{{ item.notes }}
              </p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div
            class="px-5 py-4 border-b border-slate-100 flex items-center gap-2"
          >
            <div
              class="w-8 h-8 rounded-lg bg-sky-50 border border-sky-100 flex items-center justify-center"
            >
              <Building2 class="w-4 h-4 text-sky-600" />
            </div>
            <h2 class="text-base font-semibold text-slate-800">
              诊所信息
            </h2>
          </div>
          <div class="p-5 space-y-4">
            <div>
              <div class="font-semibold text-slate-800 mb-0.5">
                {{ order.clinic.name }}
              </div>
              <div class="text-xs text-slate-500 font-mono">
                {{ order.clinic.clinicCode }}
              </div>
            </div>

            <div class="space-y-2.5 text-sm">
              <div class="flex items-start gap-2 text-slate-600">
                <User class="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <div class="text-xs text-slate-500">医生</div>
                  <div>{{ order.doctorName }}</div>
                </div>
              </div>
              <div class="flex items-start gap-2 text-slate-600">
                <Phone class="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <div class="text-xs text-slate-500">联系电话</div>
                  <div>{{ order.clinic.phone }}</div>
                </div>
              </div>
              <div class="flex items-start gap-2 text-slate-600">
                <MapPin class="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <div class="text-xs text-slate-500">地址</div>
                  <div>{{ order.clinic.address }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div
            class="px-5 py-4 border-b border-slate-100 flex items-center gap-2"
          >
            <div
              class="w-8 h-8 rounded-lg bg-violet-50 border border-violet-100 flex items-center justify-center"
            >
              <Stethoscope class="w-4 h-4 text-violet-600" />
            </div>
            <h2 class="text-base font-semibold text-slate-800">
              患者信息
            </h2>
          </div>
          <div class="p-5 space-y-4">
            <div
              class="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100"
            >
              <div
                class="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center"
              >
                <User
                  class="w-5 h-5 text-slate-500"
                  :class="
                    order.patient.gender === 'female'
                      ? 'text-rose-500'
                      : 'text-blue-500'
                  "
                />
              </div>
              <div>
                <div class="font-bold text-slate-800 font-mono">
                  {{ order.patient.anonymousCode }}
                </div>
                <div class="text-xs text-slate-500">
                  匿名编号 · 内部使用
                </div>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3 text-sm">
              <div
                v-if="order.patient.gender"
                class="p-3 bg-slate-50 rounded-lg border border-slate-100 text-center"
              >
                <div class="text-xs text-slate-500 mb-0.5">性别</div>
                <div class="font-medium text-slate-700">
                  {{ order.patient.gender === 'female' ? '女' : '男' }}
                </div>
              </div>
              <div
                v-if="order.patient.age"
                class="p-3 bg-slate-50 rounded-lg border border-slate-100 text-center"
              >
                <div class="text-xs text-slate-500 mb-0.5">年龄</div>
                <div class="font-medium text-slate-700">
                  {{ order.patient.age }} 岁
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div
            class="px-5 py-4 border-b border-slate-100 flex items-center gap-2"
          >
            <div
              class="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center"
            >
              <Mail class="w-4 h-4 text-slate-600" />
            </div>
            <h2 class="text-base font-semibold text-slate-800">
              取模与费用
            </h2>
          </div>
          <div class="p-5 space-y-4">
            <div
              class="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100"
            >
              <span class="text-sm text-slate-600">取模方式</span>
              <span class="text-sm font-medium text-slate-800">
                {{ ImpressionMethodLabels[order.impressionMethod] }}
              </span>
            </div>
            <div
              class="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100"
            >
              <span class="text-sm text-slate-600">修复体数量</span>
              <span class="text-sm font-medium text-slate-800">
                {{ order.workItems.filter((w) => w.toothNumber !== 'all').length }} 件
              </span>
            </div>
            <div
              v-if="order.totalAmount"
              class="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-100"
            >
              <div class="flex items-center gap-2 text-slate-700">
                <BadgeDollarSign class="w-4 h-4 text-blue-600" />
                <span class="font-medium">订单总金额</span>
              </div>
              <span
                class="text-xl font-bold text-blue-700 tracking-tight"
              >
                ¥{{ order.totalAmount.toLocaleString() }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div
    v-else
    class="flex flex-col items-center justify-center py-20 text-center"
  >
    <div
      class="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4"
    >
      <FileText class="w-8 h-8 text-slate-400" />
    </div>
    <h3 class="text-lg font-semibold text-slate-700 mb-1">订单不存在</h3>
    <p class="text-sm text-slate-500 mb-4">未找到对应的订单记录</p>
    <button
      class="text-sm font-medium text-blue-600 hover:text-blue-700"
      @click="goBack"
    >
      返回看板
    </button>
  </div>
</template>
