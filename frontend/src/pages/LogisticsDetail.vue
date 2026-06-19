<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft,
  Package,
  Truck,
  MapPin,
  User,
  Phone,
  Calendar,
  Building2,
  Clock,
  AlertTriangle,
  Send,
  PackageCheck,
  DollarSign,
  ExternalLink,
  Copy,
  CheckCircle2,
  MapPinned,
  UserCheck,
  FileText,
  Scale,
  History,
  X,
} from 'lucide-vue-next'
import { useLogistics } from '../composables/useLogistics'
import { useOrders } from '../composables/useOrders'
import { useRoles } from '../composables/useRoles'
import {
  ShippingMethodLabels,
  SignStatusLabels,
  SignStatusColors,
  ExceptionTypeLabels,
  LogisticsTypeLabels,
  type LogisticsRecord,
  type LogisticsTimelineEntry,
} from '../types'

const route = useRoute()
const router = useRouter()
const { getLogisticsById, confirmShipment, confirmDelivery, reportException } = useLogistics()
const { getOrderById } = useOrders()
const { currentTechnicianName } = useRoles()

const record = computed<LogisticsRecord | undefined>(() =>
  getLogisticsById(String(route.params.id))
)

const order = computed(() => {
  if (!record.value?.orderId) return undefined
  return getOrderById(record.value.orderId)
})

const showExceptionDialog = ref(false)
const exceptionType = ref('')
const exceptionDescription = ref('')
const copied = ref(false)

function goBack() {
  router.back()
}

function goToOrder() {
  if (record.value?.orderId) {
    router.push(`/order/${record.value.orderId}`)
  }
}

function goToException() {
  router.push(`/logistics/exception/${record.value?.id}`)
}

function handleCopyTrackingNumber() {
  if (record.value) {
    navigator.clipboard.writeText(record.value.trackingNumber)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  }
}

function handleConfirmShip() {
  if (!record.value) return
  if (!confirm(`确认发货：${record.value.orderNumber}？`)) return

  confirmShipment(
    record.value.id,
    currentTechnicianName.value || '调度员',
    record.value.trackingNumber
  )

  alert('发货确认成功！订单状态已更新为已发货')
}

function handleConfirmDelivery() {
  if (!record.value) return
  if (!confirm(`确认签收：${record.value.orderNumber}？`)) return

  confirmDelivery(record.value.id, currentTechnicianName.value || '调度员')

  alert('签收确认成功！订单状态已更新为已送达')
}

function handleReportException() {
  if (!record.value) return
  if (!exceptionType.value) {
    alert('请选择异常类型')
    return
  }
  if (!exceptionDescription.value.trim()) {
    alert('请填写异常描述')
    return
  }

  reportException(
    record.value.id,
    exceptionType.value as any,
    exceptionDescription.value,
    currentTechnicianName.value || '调度员'
  )

  alert('异常已上报！')
  showExceptionDialog.value = false
  exceptionType.value = ''
  exceptionDescription.value = ''
}

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

function getDaysInTransit() {
  if (!record.value?.shipTime) return 0
  const shipDate = new Date(record.value.shipTime)
  const now = new Date()
  return Math.ceil((now.getTime() - shipDate.getTime()) / 86400000)
}

function getTimelineIcon(entry: LogisticsTimelineEntry) {
  if (entry.isException) return AlertTriangle
  if (entry.status.includes('签收')) return PackageCheck
  if (entry.status.includes('发货') || entry.status.includes('揽收')) return Send
  if (entry.status.includes('运输') || entry.status.includes('派送')) return Truck
  if (entry.status.includes('验收') || entry.status.includes('到件')) return Package
  if (entry.status.includes('订单') || entry.status.includes('关联')) return FileText
  return Clock
}
</script>

<template>
  <div v-if="record" class="min-h-full pb-12">
    <div class="mb-6">
      <button
        class="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 mb-4 transition-colors"
        @click="goBack"
      >
        <ArrowLeft class="w-4 h-4" />
        返回
      </button>

      <div class="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-4">
        <div>
          <div class="flex items-center gap-3 mb-2 flex-wrap">
            <h1 class="text-2xl font-bold text-slate-900 tracking-tight">
              物流详情
            </h1>
            <span
              class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium"
              :class="SignStatusColors[record.signStatus]"
            >
              {{ SignStatusLabels[record.signStatus] }}
            </span>
            <span
              class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-600"
            >
              {{ LogisticsTypeLabels[record.type] }}
            </span>
          </div>
          <p class="text-sm text-slate-500">
            {{ record.clinicName }}
            <span class="mx-1">·</span>
            <span class="font-mono">{{ record.orderNumber || '未关联订单' }}</span>
          </p>
        </div>
        <div class="flex items-center gap-2">
          <button
            v-if="record.orderId"
            class="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            @click="goToOrder"
          >
            <ExternalLink class="w-4 h-4" />
            查看订单
          </button>
          <button
            v-if="record.signStatus === 'pending'"
            class="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-violet-600 rounded-lg hover:bg-violet-700 transition-colors shadow-sm"
            @click="handleConfirmShip"
          >
            <Send class="w-4 h-4" />
            确认发货
          </button>
          <button
            v-if="record.signStatus === 'in-transit'"
            class="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
            @click="handleConfirmDelivery"
          >
            <PackageCheck class="w-4 h-4" />
            确认签收
          </button>
          <button
            v-if="record.signStatus !== 'exception' && record.signStatus !== 'signed'"
            class="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-rose-600 rounded-lg hover:bg-rose-700 transition-colors shadow-sm"
            @click="showExceptionDialog = true"
          >
            <AlertTriangle class="w-4 h-4" />
            上报异常
          </button>
          <button
            v-if="record.signStatus === 'exception' && !record.exceptionHandled"
            class="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-rose-600 rounded-lg hover:bg-rose-700 transition-colors shadow-sm"
            @click="goToException"
          >
            <AlertTriangle class="w-4 h-4" />
            处理异常
          </button>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <div class="xl:col-span-2 space-y-6">
        <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div class="px-5 py-4 border-b border-slate-100">
            <div class="flex items-center gap-2">
              <div
                class="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center"
              >
                <Truck class="w-4 h-4 text-blue-600" />
              </div>
              <h2 class="text-base font-semibold text-slate-800">
                物流信息
              </h2>
            </div>
          </div>
          <div class="p-5">
            <div class="flex items-center justify-between mb-4 p-4 bg-slate-50 rounded-lg">
              <div>
                <div class="text-xs text-slate-500 mb-1">快递单号</div>
                <div class="flex items-center gap-2">
                  <span class="text-lg font-mono font-bold text-slate-900">
                    {{ record.trackingNumber }}
                  </span>
                  <button
                    class="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded transition-colors"
                    @click="handleCopyTrackingNumber"
                  >
                    <CheckCircle2 v-if="copied" class="w-4 h-4 text-emerald-500" />
                    <Copy v-else class="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div class="text-right">
                <div class="text-xs text-slate-500 mb-1">寄件方式</div>
                <span class="text-sm font-medium text-slate-700">
                  {{ ShippingMethodLabels[record.shippingMethod] }}
                </span>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-3">
                <div v-if="record.receiveTime">
                  <div class="text-xs text-slate-500 mb-1">收件时间</div>
                  <div class="flex items-center gap-2">
                    <Calendar class="w-4 h-4 text-slate-400" />
                    <span class="text-sm text-slate-700">
                      {{ formatDate(record.receiveTime) }}
                    </span>
                  </div>
                </div>
                <div v-if="record.shipTime">
                  <div class="text-xs text-slate-500 mb-1">发货时间</div>
                  <div class="flex items-center gap-2">
                    <Send class="w-4 h-4 text-slate-400" />
                    <span class="text-sm text-slate-700">
                      {{ formatDate(record.shipTime) }}
                    </span>
                  </div>
                </div>
                <div v-if="record.signTime">
                  <div class="text-xs text-slate-500 mb-1">签收时间</div>
                  <div class="flex items-center gap-2">
                    <PackageCheck class="w-4 h-4 text-slate-400" />
                    <span class="text-sm text-slate-700">
                      {{ formatDate(record.signTime) }}
                    </span>
                  </div>
                </div>
                <div v-if="record.signStatus === 'in-transit'">
                  <div class="text-xs text-slate-500 mb-1">运输时长</div>
                  <div class="flex items-center gap-2">
                    <Clock class="w-4 h-4 text-slate-400" />
                    <span class="text-sm text-slate-700">
                      {{ getDaysInTransit() }} 天
                    </span>
                  </div>
                </div>
              </div>
              <div class="space-y-3">
                <div v-if="record.weight">
                  <div class="text-xs text-slate-500 mb-1">重量</div>
                  <div class="flex items-center gap-2">
                    <Scale class="w-4 h-4 text-slate-400" />
                    <span class="text-sm text-slate-700">
                      {{ record.weight }} kg
                    </span>
                  </div>
                </div>
                <div v-if="record.cost">
                  <div class="text-xs text-slate-500 mb-1">运费</div>
                  <div class="flex items-center gap-2">
                    <DollarSign class="w-4 h-4 text-slate-400" />
                    <span class="text-sm text-slate-700">
                      ¥{{ record.cost.toFixed(2) }}
                    </span>
                  </div>
                </div>
                <div>
                  <div class="text-xs text-slate-500 mb-1">操作人</div>
                  <div class="flex items-center gap-2">
                    <User class="w-4 h-4 text-slate-400" />
                    <span class="text-sm text-slate-700">
                      {{ record.operator }}
                    </span>
                  </div>
                </div>
                <div>
                  <div class="text-xs text-slate-500 mb-1">创建时间</div>
                  <div class="flex items-center gap-2">
                    <History class="w-4 h-4 text-slate-400" />
                    <span class="text-sm text-slate-700">
                      {{ formatDate(record.createdAt) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="record.exceptionType" class="mt-4 p-4 bg-rose-50 border border-rose-200 rounded-lg">
              <div class="flex items-start gap-3">
                <AlertTriangle class="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
                <div class="flex-1">
                  <div class="flex items-center gap-2 mb-1">
                    <span class="text-sm font-semibold text-rose-700">
                      {{ ExceptionTypeLabels[record.exceptionType] }}
                    </span>
                    <span
                      v-if="record.exceptionHandled"
                      class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-700"
                    >
                      <CheckCircle2 class="w-3 h-3" />
                      已处理
                    </span>
                    <span
                      v-else
                      class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700"
                    >
                      <Clock class="w-3 h-3 animate-pulse" />
                      待处理
                    </span>
                  </div>
                  <p class="text-sm text-rose-600">
                    {{ record.exceptionDescription }}
                  </p>
                  <p v-if="record.exceptionResolution" class="mt-2 text-sm text-slate-600">
                    <span class="font-medium">处理方案：</span>
                    {{ record.exceptionResolution }}
                  </p>
                  <p v-if="record.exceptionHandledAt" class="mt-1 text-xs text-slate-500">
                    处理时间：{{ formatDate(record.exceptionHandledAt) }}
                    · 处理人：{{ record.exceptionHandledBy }}
                  </p>
                </div>
              </div>
            </div>

            <div v-if="record.items && record.items.length > 0" class="mt-4">
              <div class="text-xs text-slate-500 mb-2">物品清单</div>
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="(item, idx) in record.items"
                  :key="idx"
                  class="inline-flex items-center px-2.5 py-1 rounded-md text-xs bg-slate-100 text-slate-700"
                >
                  {{ item }}
                </span>
              </div>
            </div>

            <div v-if="record.notes" class="mt-4">
              <div class="text-xs text-slate-500 mb-2">备注</div>
              <p class="text-sm text-slate-600 p-3 bg-slate-50 rounded-lg">
                {{ record.notes }}
              </p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div class="px-5 py-4 border-b border-slate-100">
            <div class="flex items-center gap-2">
              <div
                class="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center"
              >
                <History class="w-4 h-4 text-emerald-600" />
              </div>
              <h2 class="text-base font-semibold text-slate-800">
                物流时间线
              </h2>
            </div>
          </div>
          <div class="p-5">
            <div v-if="record.timeline.length > 0" class="space-y-0">
              <div
                v-for="(entry, idx) in record.timeline"
                :key="entry.id"
                class="relative pl-10 pb-6 last:pb-0"
              >
                <div
                  v-if="idx < record.timeline.length - 1"
                  class="absolute left-3.5 top-5 w-px h-full bg-slate-200"
                ></div>
                <div
                  class="absolute left-0 top-0 w-7 h-7 rounded-full flex items-center justify-center transition-all"
                  :class="[
                    entry.isException
                      ? 'bg-rose-100 border-2 border-rose-500'
                      : idx === 0
                      ? 'bg-emerald-100 border-2 border-emerald-500'
                      : 'bg-slate-100 border-2 border-slate-300',
                  ]"
                >
                  <component
                    :is="getTimelineIcon(entry)"
                    class="w-3.5 h-3.5"
                    :class="
                      entry.isException
                        ? 'text-rose-600'
                        : idx === 0
                        ? 'text-emerald-600'
                        : 'text-slate-600'
                    "
                  />
                </div>

                <div
                  class="bg-white border border-slate-200 rounded-lg p-4 ml-2"
                  :class="{
                    'border-rose-200 bg-rose-50/50': entry.isException,
                    'ring-2 ring-emerald-100 border-emerald-200': idx === 0 && !entry.isException,
                  }"
                >
                  <div
                    class="flex items-center justify-between mb-2 flex-wrap gap-2"
                  >
                    <div class="flex items-center gap-2">
                      <span
                        class="font-semibold text-sm"
                        :class="[
                          entry.isException
                            ? 'text-rose-700'
                            : idx === 0
                            ? 'text-emerald-700'
                            : 'text-slate-800',
                        ]"
                      >
                        {{ entry.status }}
                      </span>
                      <span
                        v-if="entry.location"
                        class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600"
                      >
                        <MapPinned class="w-3 h-3" />
                        {{ entry.location }}
                      </span>
                    </div>
                    <span class="text-xs text-slate-500">
                      {{ formatDate(entry.timestamp) }}
                    </span>
                  </div>

                  <p class="text-sm text-slate-600 mb-2">
                    {{ entry.description }}
                  </p>

                  <div
                    v-if="entry.operator"
                    class="flex items-center gap-1 text-xs text-slate-500"
                  >
                    <UserCheck class="w-3 h-3" />
                    操作人：{{ entry.operator }}
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="p-8 text-center">
              <div class="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-100 flex items-center justify-center">
                <Clock class="w-6 h-6 text-slate-300" />
              </div>
              <p class="text-sm font-medium text-slate-600 mb-1">暂无物流轨迹</p>
              <p class="text-xs text-slate-400">物流信息更新中...</p>
            </div>
          </div>
        </div>
      </div>

      <div class="space-y-6">
        <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div class="px-5 py-4 border-b border-slate-100">
            <div class="flex items-center gap-2">
              <div
                class="w-8 h-8 rounded-lg bg-violet-50 border border-violet-100 flex items-center justify-center"
              >
                <User class="w-4 h-4 text-violet-600" />
              </div>
              <h2 class="text-base font-semibold text-slate-800">
                收件人信息
              </h2>
            </div>
          </div>
          <div class="p-5 space-y-3">
            <div>
              <div class="text-xs text-slate-500 mb-1">收件人</div>
              <div class="flex items-center gap-2">
                <User class="w-4 h-4 text-slate-400" />
                <span class="text-sm text-slate-700 font-medium">
                  {{ record.receiverName }}
                </span>
              </div>
            </div>
            <div>
              <div class="text-xs text-slate-500 mb-1">联系电话</div>
              <div class="flex items-center gap-2">
                <Phone class="w-4 h-4 text-slate-400" />
                <span class="text-sm text-slate-700">
                  {{ record.receiverPhone }}
                </span>
              </div>
            </div>
            <div>
              <div class="text-xs text-slate-500 mb-1">收件地址</div>
              <div class="flex items-start gap-2">
                <MapPin class="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                <span class="text-sm text-slate-700">
                  {{ record.receiverAddress }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div v-if="order" class="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div class="px-5 py-4 border-b border-slate-100">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <div
                  class="w-8 h-8 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center"
                >
                  <FileText class="w-4 h-4 text-amber-600" />
                </div>
                <h2 class="text-base font-semibold text-slate-800">
                  关联订单
                </h2>
              </div>
              <button
                class="text-xs text-blue-600 hover:text-blue-700 font-medium"
                @click="goToOrder"
              >
                查看详情
              </button>
            </div>
          </div>
          <div class="p-5">
            <div class="text-lg font-mono font-bold text-slate-900 mb-2">
              {{ order.orderNumber }}
            </div>
            <div class="text-xs text-slate-500 mb-3">
              {{ order.clinic.name }}
            </div>
            <div class="flex flex-wrap gap-1.5">
              <span
                v-for="(item, idx) in order.workItems.slice(0, 3)"
                :key="idx"
                class="inline-flex items-center px-2 py-0.5 rounded text-[11px] bg-slate-100 text-slate-700"
              >
                {{ item.toothNumber }}
                {{
                  item.restorationType === 'full-denture'
                    ? '全口义齿'
                    : item.restorationType === 'partial-denture'
                    ? '活动义齿'
                    : item.restorationType === 'bridge'
                    ? '桥体'
                    : item.restorationType === 'crown'
                    ? '单冠'
                    : item.restorationType === 'veneer'
                    ? '贴面'
                    : item.restorationType === 'implant-crown'
                    ? '种植冠'
                    : item.restorationType === 'inlay'
                    ? '嵌体'
                    : item.restorationType === 'onlay'
                    ? '高嵌体'
                    : item.restorationType
                }}
              </span>
            </div>
            <div class="mt-3 pt-3 border-t border-slate-100">
              <div class="flex items-center justify-between text-sm">
                <span class="text-slate-500">交付日期</span>
                <span class="font-medium text-slate-700">
                  {{ order.deliveryDate }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div class="px-5 py-4 border-b border-slate-100">
            <div class="flex items-center gap-2">
              <div
                class="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center"
              >
                <Building2 class="w-4 h-4 text-slate-600" />
              </div>
              <h2 class="text-base font-semibold text-slate-800">
                诊所信息
              </h2>
            </div>
          </div>
          <div class="p-5">
            <div class="font-semibold text-slate-800 mb-2">
              {{ record.clinicName }}
            </div>
            <div class="text-xs text-slate-500">
              诊所编码：{{ record.clinicId }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="showExceptionDialog"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      @click.self="showExceptionDialog = false"
    >
      <div class="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div class="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-slate-800">
            上报物流异常
          </h3>
          <button
            class="p-1 text-slate-400 hover:text-slate-600 rounded"
            @click="showExceptionDialog = false"
          >
            <X class="w-5 h-5" />
          </button>
        </div>
        <div class="p-5 space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">
              <span class="text-rose-500">*</span> 异常类型
            </label>
            <select
              v-model="exceptionType"
              class="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="">请选择异常类型</option>
              <option
                v-for="(label, value) in ExceptionTypeLabels"
                :key="value"
                :value="value"
              >
                {{ label }}
              </option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">
              <span class="text-rose-500">*</span> 异常描述
            </label>
            <textarea
              v-model="exceptionDescription"
              rows="3"
              placeholder="请详细描述异常情况"
              class="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent resize-none"
            ></textarea>
          </div>
        </div>
        <div class="px-5 py-4 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            class="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            @click="showExceptionDialog = false"
          >
            取消
          </button>
          <button
            class="px-4 py-2 text-sm font-semibold text-white bg-rose-600 rounded-lg hover:bg-rose-700 transition-colors"
            @click="handleReportException"
          >
            确认上报
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
