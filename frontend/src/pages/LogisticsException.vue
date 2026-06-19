<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft,
  AlertTriangle,
  Package,
  Truck,
  MapPin,
  User,
  Phone,
  Calendar,
  Building2,
  Clock,
  Send,
  PackageCheck,
  DollarSign,
  ExternalLink,
  Copy,
  CheckCircle2,
  FileText,
  Scale,
  History,
  X,
  RotateCcw,
  Truck as TruckIcon,
  MailWarning,
  FileCheck,
  RefreshCw,
  Lightbulb,
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
  type ExceptionType,
} from '../types'

const route = useRoute()
const router = useRouter()
const { getLogisticsById, handleException } = useLogistics()
const { getOrderById } = useOrders()
const { currentTechnicianName } = useRoles()

const record = computed<LogisticsRecord | undefined>(() =>
  getLogisticsById(String(route.params.id))
)

const order = computed(() => {
  if (!record.value?.orderId) return undefined
  return getOrderById(record.value.orderId)
})

const resolution = ref('')
const needReship = ref(false)
const newTrackingNumber = ref('')
const newShippingMethod = ref('')
const reshipCost = ref<number | null>(null)

function goBack() {
  router.back()
}

function goToOrder() {
  if (record.value?.orderId) {
    router.push(`/order/${record.value.orderId}`)
  }
}

function goToDetail() {
  router.push(`/logistics/detail/${record.value?.id}`)
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

function getExceptionIcon(type: ExceptionType | undefined) {
  if (!type) return AlertTriangle
  switch (type) {
    case 'returned':
      return RotateCcw
    case 'lost':
      return MailWarning
    case 'damaged':
      return Package
    case 'delayed':
      return Clock
    case 'address-error':
      return MapPin
    case 'refused':
      return X
    default:
      return AlertTriangle
  }
}

function getResolutionSuggestions() {
  if (!record.value?.exceptionType) return []
  const suggestions: string[] = []
  
  switch (record.value.exceptionType) {
    case 'returned':
      suggestions.push('与诊所沟通，确认是否需要重新发货')
      suggestions.push('检查退回物品是否完好，安排重新派送')
      suggestions.push('取消订单，退回款项')
      break
    case 'lost':
      suggestions.push('联系快递公司确认包裹位置')
      suggestions.push('申请快递公司理赔')
      suggestions.push('重新制作并安排发货')
      break
    case 'damaged':
      suggestions.push('检查损坏程度，判断是否可修复')
      suggestions.push('联系快递公司申请理赔')
      suggestions.push('重新制作并安排发货')
      break
    case 'delayed':
      suggestions.push('联系快递公司催件')
      suggestions.push('与诊所沟通，说明延误情况')
      suggestions.push('考虑更换快递公司')
      break
    case 'address-error':
      suggestions.push('与诊所确认正确的收件地址')
      suggestions.push('联系快递公司修改派送地址')
      suggestions.push('重新安排发货')
      break
    case 'refused':
      suggestions.push('与诊所沟通拒收原因')
      suggestions.push('协商解决方案')
      suggestions.push('取消订单')
      break
    default:
      suggestions.push('与诊所沟通确认异常详情')
      suggestions.push('联系快递公司核实情况')
      suggestions.push('根据沟通结果制定处理方案')
  }
  
  return suggestions
}

function selectSuggestion(text: string) {
  resolution.value = text
}

function handleSubmit() {
  if (!record.value) return
  if (!resolution.value.trim()) {
    alert('请填写处理方案')
    return
  }

  if (needReship.value && !newShippingMethod.value) {
    alert('请选择重新发货的寄件方式')
    return
  }

  handleException(
    record.value.id,
    resolution.value,
    currentTechnicianName.value || '调度员',
    needReship.value,
    needReship.value
      ? {
          trackingNumber: newTrackingNumber.value,
          shippingMethod: newShippingMethod.value as any,
          cost: reshipCost.value || undefined,
        }
      : undefined
  )

  alert('异常处理成功！')
  router.push(`/logistics/detail/${record.value.id}`)
}

function getReshippingMethods() {
  return Object.entries(ShippingMethodLabels).filter(
    ([key]) => key !== 'other'
  )
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
              物流异常处理
            </h1>
            <span
              class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium"
              :class="SignStatusColors[record.signStatus]"
            >
              <AlertTriangle class="w-3 h-3" />
              {{ SignStatusLabels[record.signStatus] }}
            </span>
            <span
              v-if="record.exceptionHandled"
              class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-100 text-emerald-700"
            >
              <CheckCircle2 class="w-3 h-3" />
              已处理
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
            class="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            @click="goToDetail"
          >
            <ExternalLink class="w-4 h-4" />
            查看物流详情
          </button>
          <button
            v-if="record.orderId"
            class="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            @click="goToOrder"
          >
            <FileText class="w-4 h-4" />
            查看订单
          </button>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <div class="xl:col-span-2 space-y-6">
        <div class="bg-white rounded-xl border border-rose-200 overflow-hidden shadow-sm">
          <div class="px-5 py-4 border-b border-rose-100 bg-rose-50/50">
            <div class="flex items-center gap-2">
              <div
                class="w-8 h-8 rounded-lg bg-rose-100 border border-rose-200 flex items-center justify-center"
              >
                <component
                  :is="getExceptionIcon(record.exceptionType)"
                  class="w-4 h-4 text-rose-600"
                />
              </div>
              <h2 class="text-base font-semibold text-slate-800">
                异常信息
              </h2>
            </div>
          </div>
          <div class="p-5">
            <div class="flex items-center gap-2 mb-3">
              <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-rose-100 text-rose-700">
                <component
                  :is="getExceptionIcon(record.exceptionType)"
                  class="w-4 h-4"
                />
                {{ ExceptionTypeLabels[record.exceptionType!] }}
              </span>
              <span class="text-xs text-slate-500">
                上报时间：{{ record.exceptionReportedAt ? formatDate(record.exceptionReportedAt) : formatDate(record.updatedAt) }}
              </span>
            </div>

            <div class="p-4 bg-slate-50 rounded-lg border border-slate-200 mb-4">
              <div class="text-xs text-slate-500 mb-1.5">异常描述</div>
              <p class="text-sm text-slate-700">
                {{ record.exceptionDescription || '暂无描述' }}
              </p>
            </div>

            <div v-if="record.exceptionHandled" class="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
              <div class="flex items-center gap-2 mb-2">
                <CheckCircle2 class="w-5 h-5 text-emerald-500" />
                <span class="text-sm font-semibold text-emerald-700">
                  已处理完成
                </span>
              </div>
              <div class="text-xs text-slate-500 mb-1.5">处理方案</div>
              <p class="text-sm text-slate-700 mb-2">
                {{ record.exceptionResolution }}
              </p>
              <div class="flex items-center gap-2 text-xs text-slate-500">
                <span>处理时间：{{ formatDate(record.exceptionHandledAt!) }}</span>
                <span>·</span>
                <span>处理人：{{ record.exceptionHandledBy }}</span>
              </div>
              <div v-if="record.needReship" class="mt-3 pt-3 border-t border-emerald-200">
                <div class="text-xs text-slate-500 mb-1.5">
                  <RefreshCw class="w-3.5 h-3.5 inline mr-1" />
                  重新发货信息
                </div>
                <div class="text-sm text-slate-700">
                  <span class="font-medium">{{ ShippingMethodLabels[record.newShippingMethod!] }}</span>
                  <span v-if="record.newTrackingNumber" class="ml-2 font-mono">
                    {{ record.newTrackingNumber }}
                  </span>
                  <span v-if="record.reshipCost !== undefined && record.reshipCost !== null" class="ml-2">
                    ¥{{ record.reshipCost.toFixed(2) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="!record.exceptionHandled" class="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div class="px-5 py-4 border-b border-slate-100">
            <div class="flex items-center gap-2">
              <div
                class="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center"
              >
                <FileCheck class="w-4 h-4 text-blue-600" />
              </div>
              <h2 class="text-base font-semibold text-slate-800">
                处理方案
              </h2>
            </div>
          </div>
          <div class="p-5 space-y-5">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-2">
                建议处理方案
              </label>
              <div class="space-y-2">
                <button
                  v-for="(suggestion, idx) in getResolutionSuggestions()"
                  :key="idx"
                  class="w-full text-left px-4 py-3 rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-colors text-sm text-slate-700"
                  @click="selectSuggestion(suggestion)"
                >
                  <span class="inline-flex items-center gap-2">
                    <Lightbulb class="w-4 h-4 text-amber-500" />
                    {{ suggestion }}
                  </span>
                </button>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1.5">
                <span class="text-rose-500">*</span> 最终处理方案
              </label>
              <textarea
                v-model="resolution"
                rows="4"
                placeholder="请填写最终的处理方案..."
                class="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              ></textarea>
            </div>

            <div class="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div class="flex items-center justify-between mb-4">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input
                    v-model="needReship"
                    type="checkbox"
                    class="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span class="text-sm font-medium text-slate-700">
                    需要重新发货
                  </span>
                </label>
                <TruckIcon class="w-5 h-5 text-slate-400" />
              </div>

              <div v-if="needReship" class="space-y-4 pt-4 border-t border-slate-200">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1.5">
                      <span class="text-rose-500">*</span> 寄件方式
                    </label>
                    <select
                      v-model="newShippingMethod"
                      class="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                    >
                      <option value="">请选择寄件方式</option>
                      <option
                        v-for="[value, label] in getReshippingMethods()"
                        :key="value"
                        :value="value"
                      >
                        {{ label }}
                      </option>
                      <option value="other">其他</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1.5">
                      快递单号
                    </label>
                    <input
                      v-model="newTrackingNumber"
                      type="text"
                      placeholder="如有单号请填写"
                      class="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1.5">
                    运费 (元)
                  </label>
                  <input
                    v-model.number="reshipCost"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="运费金额"
                    class="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div class="flex items-center justify-end gap-3 pt-2">
              <button
                class="px-5 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                @click="goBack"
              >
                取消
              </button>
              <button
                class="px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                @click="handleSubmit"
              >
                确认处理
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="space-y-6">
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
          <div class="p-5 space-y-3">
            <div>
              <div class="text-xs text-slate-500 mb-1">快递单号</div>
              <div class="text-sm font-mono font-semibold text-slate-800">
                {{ record.trackingNumber }}
              </div>
            </div>
            <div>
              <div class="text-xs text-slate-500 mb-1">寄件方式</div>
              <span class="text-sm text-slate-700">
                {{ ShippingMethodLabels[record.shippingMethod] }}
              </span>
            </div>
            <div>
              <div class="text-xs text-slate-500 mb-1">物流类型</div>
              <span class="text-sm text-slate-700">
                {{ LogisticsTypeLabels[record.type] }}
              </span>
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
          </div>
        </div>

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
  </div>
</template>
