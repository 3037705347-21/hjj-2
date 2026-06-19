<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  ArrowLeft,
  Truck,
  Package,
  MapPin,
  User,
  Phone,
  Calendar,
  Plus,
  CheckCircle2,
  Search,
  Building2,
  Clock,
  AlertTriangle,
  Send,
  PackageCheck,
  DollarSign,
  Trash2,
  X,
} from 'lucide-vue-next'
import { useLogistics } from '../composables/useLogistics'
import { useOrders } from '../composables/useOrders'
import { useRoles } from '../composables/useRoles'
import {
  ShippingMethodLabels,
  SignStatusLabels,
  SignStatusColors,
  type SignStatus,
  type ShippingMethod,
  type LogisticsRecord,
} from '../types'

const router = useRouter()
const {
  shipRecords,
  stats,
  pendingShipRecords,
  inTransitRecords,
  exceptionRecords,
  confirmShipment,
  confirmDelivery,
  createShipRecord,
  generateExpressNumber,
} = useLogistics()
const { getClinics, orders } = useOrders()
const { currentTechnicianName, canPerformAction } = useRoles()

const clinics = getClinics()

const showForm = ref(false)
const searchKeyword = ref('')
const filterStatus = ref<SignStatus | ''>('')
const filterClinic = ref('')
const activeTab = ref<'all' | 'pending' | 'in-transit' | 'exception'>('all')

const form = ref({
  orderId: '',
  clinicId: '',
  clinicName: '',
  shippingMethod: 'sf-express' as ShippingMethod,
  trackingNumber: '',
  receiverName: '',
  receiverPhone: '',
  receiverAddress: '',
  notes: '',
  items: [''] as string[],
  weight: undefined as number | undefined,
  cost: undefined as number | undefined,
})

const tabCounts = computed(() => ({
  all: shipRecords.value.length,
  pending: pendingShipRecords.value.length,
  'in-transit': inTransitRecords.value.length,
  exception: exceptionRecords.value.length,
}))

const filteredRecords = computed(() => {
  let result = shipRecords.value

  if (activeTab.value === 'pending') {
    result = pendingShipRecords.value
  } else if (activeTab.value === 'in-transit') {
    result = inTransitRecords.value
  } else if (activeTab.value === 'exception') {
    result = exceptionRecords.value
  }

  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(
      (r) =>
        r.trackingNumber.toLowerCase().includes(keyword) ||
        r.orderNumber.toLowerCase().includes(keyword) ||
        r.clinicName.toLowerCase().includes(keyword)
    )
  }

  if (filterStatus.value) {
    result = result.filter((r) => r.signStatus === filterStatus.value)
  }

  if (filterClinic.value) {
    result = result.filter((r) => r.clinicId === filterClinic.value)
  }

  return result
})

const selectedOrder = computed(() => {
  if (!form.value.orderId) return undefined
  return orders.value.find((o) => o.id === form.value.orderId)
})

const shippableOrders = computed(() => {
  return orders.value.filter(
    (o) => o.currentStage === 'quality-check' || o.currentStage === 'shipped'
  )
})

function onOrderChange() {
  if (selectedOrder.value) {
    form.value.clinicId = selectedOrder.value.clinicId
    form.value.clinicName = selectedOrder.value.clinic.name
    form.value.receiverAddress = selectedOrder.value.clinic.address
    form.value.receiverPhone = selectedOrder.value.clinic.phone
    form.value.receiverName = selectedOrder.value.doctorName
  }
}

function onClinicChange() {
  const clinic = clinics.find((c) => c.id === form.value.clinicId)
  if (clinic) {
    form.value.clinicName = clinic.name
    form.value.receiverAddress = clinic.address
    form.value.receiverPhone = clinic.phone
    form.value.receiverName = clinic.contactPerson
  }
}

function addItem() {
  form.value.items.push('')
}

function removeItem(index: number) {
  if (form.value.items.length > 1) {
    form.value.items.splice(index, 1)
  }
}

function resetForm() {
  form.value = {
    orderId: '',
    clinicId: '',
    clinicName: '',
    shippingMethod: 'sf-express',
    trackingNumber: '',
    receiverName: '',
    receiverPhone: '',
    receiverAddress: '',
    notes: '',
    items: [''],
    weight: undefined,
    cost: undefined,
  }
}

function handleCreateShip() {
  if (!form.value.orderId) {
    alert('请选择关联订单')
    return
  }
  if (!form.value.shippingMethod) {
    alert('请选择寄件方式')
    return
  }
  if (!form.value.receiverName) {
    alert('请填写收件人')
    return
  }
  if (!form.value.receiverPhone) {
    alert('请填写联系电话')
    return
  }
  if (!form.value.receiverAddress) {
    alert('请填写收件地址')
    return
  }

  const validItems = form.value.items.filter((i) => i.trim())

  createShipRecord({
    orderId: form.value.orderId,
    orderNumber: selectedOrder.value!.orderNumber,
    clinicId: form.value.clinicId,
    clinicName: form.value.clinicName,
    shippingMethod: form.value.shippingMethod,
    trackingNumber: form.value.trackingNumber || undefined,
    receiverName: form.value.receiverName,
    receiverPhone: form.value.receiverPhone,
    receiverAddress: form.value.receiverAddress,
    notes: form.value.notes || undefined,
    items: validItems.length > 0 ? validItems : undefined,
    weight: form.value.weight,
    cost: form.value.cost,
    operator: currentTechnicianName.value || '调度员',
  })

  alert('发货记录创建成功！')
  showForm.value = false
  resetForm()
}

function handleConfirmShip(record: LogisticsRecord) {
  if (!confirm(`确认发货：${record.orderNumber}？`)) return

  confirmShipment(
    record.id,
    currentTechnicianName.value || '调度员',
    record.trackingNumber
  )

  alert('发货确认成功！订单状态已更新为已发货')
}

function handleConfirmDelivery(record: LogisticsRecord) {
  if (!confirm(`确认签收：${record.orderNumber}？`)) return

  confirmDelivery(record.id, currentTechnicianName.value || '调度员')

  alert('签收确认成功！订单状态已更新为已送达')
}

function goBack() {
  router.back()
}

function goToDetail(id: string) {
  router.push(`/logistics/detail/${id}`)
}

function goToException(id: string) {
  router.push(`/logistics/exception/${id}`)
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

function formatShortDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
  })
}

function getDaysInTransit(record: LogisticsRecord) {
  if (!record.shipTime) return 0
  const shipDate = new Date(record.shipTime)
  const now = new Date()
  return Math.ceil((now.getTime() - shipDate.getTime()) / 86400000)
}

function generateTrackingNumber() {
  form.value.trackingNumber = generateExpressNumber(form.value.shippingMethod)
}
</script>

<template>
  <div class="min-h-full pb-12">
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
          <div class="flex items-center gap-3 mb-2">
            <h1 class="text-2xl font-bold text-slate-900 tracking-tight">
              发货管理
            </h1>
            <span class="text-sm text-slate-500">
              共 {{ shipRecords.length }} 条记录
            </span>
          </div>
          <p class="text-sm text-slate-500">
            成品发货出库与物流跟踪
          </p>
        </div>
        <button
          class="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-violet-600 rounded-lg hover:bg-violet-700 transition-colors shadow-sm"
          @click="showForm = !showForm"
        >
          <Plus v-if="!showForm" class="w-4 h-4" />
          {{ showForm ? '取消' : '新建发货单' }}
        </button>
      </div>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div class="bg-white rounded-xl border border-slate-200 p-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center">
            <Package class="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <div class="text-2xl font-bold text-slate-900">{{ stats.pendingShip }}</div>
            <div class="text-xs text-slate-500">待发货</div>
          </div>
        </div>
      </div>
      <div class="bg-white rounded-xl border border-slate-200 p-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center">
            <Truck class="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <div class="text-2xl font-bold text-slate-900">{{ stats.inTransit }}</div>
            <div class="text-xs text-slate-500">运输中</div>
          </div>
        </div>
      </div>
      <div class="bg-white rounded-xl border border-slate-200 p-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center">
            <PackageCheck class="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <div class="text-2xl font-bold text-slate-900">{{ stats.signedToday }}</div>
            <div class="text-xs text-slate-500">今日签收</div>
          </div>
        </div>
      </div>
      <div class="bg-white rounded-xl border border-slate-200 p-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center">
            <AlertTriangle class="w-5 h-5 text-rose-600" />
          </div>
          <div>
            <div class="text-2xl font-bold text-slate-900">{{ stats.exceptionCount }}</div>
            <div class="text-xs text-slate-500">待处理异常</div>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="showForm"
      class="bg-white rounded-xl border border-slate-200 overflow-hidden mb-6"
    >
      <div class="px-5 py-4 border-b border-slate-100 bg-violet-50/30">
        <h2 class="text-base font-semibold text-slate-800">
          新建发货单
        </h2>
      </div>
      <div class="p-5">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">
              <span class="text-rose-500">*</span> 关联订单
            </label>
            <select
              v-model="form.orderId"
              @change="onOrderChange"
              class="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="">请选择订单</option>
              <option v-for="order in shippableOrders" :key="order.id" :value="order.id">
                {{ order.orderNumber }} - {{ order.clinic.name }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">
              诊所
            </label>
            <div class="relative">
              <select
                v-model="form.clinicId"
                @change="onClinicChange"
                class="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent appearance-none bg-white pr-10"
              >
                <option value="">请选择诊所</option>
                <option v-for="clinic in clinics" :key="clinic.id" :value="clinic.id">
                  {{ clinic.name }}
                </option>
              </select>
              <Building2 class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">
              <span class="text-rose-500">*</span> 寄件方式
            </label>
            <select
              v-model="form.shippingMethod"
              class="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent appearance-none bg-white"
            >
              <option
                v-for="(label, value) in ShippingMethodLabels"
                :key="value"
                :value="value"
              >
                {{ label }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">
              快递单号
            </label>
            <div class="flex gap-2">
              <input
                v-model="form.trackingNumber"
                type="text"
                placeholder="点击右侧按钮自动生成"
                class="flex-1 px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent font-mono"
              />
              <button
                type="button"
                class="px-3 py-2.5 text-sm font-medium text-violet-600 bg-violet-50 border border-violet-200 rounded-lg hover:bg-violet-100 transition-colors whitespace-nowrap"
                @click="generateTrackingNumber"
              >
                生成
              </button>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">
              <span class="text-rose-500">*</span> 收件人
            </label>
            <div class="relative">
              <input
                v-model="form.receiverName"
                type="text"
                placeholder="请输入收件人姓名"
                class="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent pl-10"
              />
              <User class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">
              <span class="text-rose-500">*</span> 联系电话
            </label>
            <div class="relative">
              <input
                v-model="form.receiverPhone"
                type="tel"
                placeholder="请输入联系电话"
                class="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent pl-10"
              />
              <Phone class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>
          </div>

          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-slate-700 mb-1.5">
              <span class="text-rose-500">*</span> 收件地址
            </label>
            <div class="relative">
              <input
                v-model="form.receiverAddress"
                type="text"
                placeholder="请输入收件地址"
                class="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent pl-10"
              />
              <MapPin class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">
              重量 (kg)
            </label>
            <input
              v-model.number="form.weight"
              type="number"
              step="0.1"
              min="0"
              placeholder="请输入重量"
              class="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">
              运费 (元)
            </label>
            <div class="relative">
              <input
                v-model.number="form.cost"
                type="number"
                step="0.01"
                min="0"
                placeholder="请输入运费"
                class="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent pl-10"
              />
              <DollarSign class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>
          </div>
        </div>

        <div class="mb-4">
          <div class="flex items-center justify-between mb-1.5">
            <label class="block text-sm font-medium text-slate-700">
              物品清单
            </label>
            <button
              type="button"
              class="inline-flex items-center gap-1 text-xs font-medium text-violet-600 hover:text-violet-700"
              @click="addItem"
            >
              <Plus class="w-3 h-3" />
              添加物品
            </button>
          </div>
          <div class="space-y-2">
            <div
              v-for="(item, index) in form.items"
              :key="index"
              class="flex items-center gap-2"
            >
              <input
                v-model="form.items[index]"
                type="text"
                :placeholder="`物品 ${index + 1}，如：11#单冠`"
                class="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
              <button
                v-if="form.items.length > 1"
                type="button"
                class="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                @click="removeItem(index)"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div class="mb-6">
          <label class="block text-sm font-medium text-slate-700 mb-1.5">
            备注
          </label>
          <textarea
            v-model="form.notes"
            rows="2"
            placeholder="请输入备注信息"
            class="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
          ></textarea>
        </div>

        <div class="flex items-center justify-end gap-3">
          <button
            type="button"
            class="px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            @click="showForm = false; resetForm()"
          >
            取消
          </button>
          <button
            type="button"
            class="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-violet-600 rounded-lg hover:bg-violet-700 transition-colors shadow-sm"
            @click="handleCreateShip"
          >
            <CheckCircle2 class="w-4 h-4" />
            确认创建
          </button>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div class="px-5 py-4 border-b border-slate-100">
        <div class="flex flex-wrap gap-1 mb-4">
          <button
            v-for="tab in [
              { key: 'all', label: '全部' },
              { key: 'pending', label: '待发货' },
              { key: 'in-transit', label: '运输中' },
              { key: 'exception', label: '异常' },
            ]"
            :key="tab.key"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors"
            :class="
              activeTab === tab.key
                ? 'bg-violet-100 text-violet-700'
                : 'text-slate-600 hover:bg-slate-100'
            "
            @click="activeTab = tab.key as any"
          >
            {{ tab.label }}
            <span
              class="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-medium"
              :class="
                activeTab === tab.key
                  ? 'bg-violet-600 text-white'
                  : 'bg-slate-200 text-slate-600'
              "
            >
              {{ tabCounts[tab.key as keyof typeof tabCounts] }}
            </span>
          </button>
        </div>

        <div class="flex flex-col sm:flex-row sm:items-center gap-3">
          <div class="relative flex-1">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              v-model="searchKeyword"
              type="text"
              placeholder="搜索快递单号、订单号、诊所名称"
              class="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            />
          </div>
          <select
            v-model="filterClinic"
            class="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent appearance-none bg-white"
          >
            <option value="">全部诊所</option>
            <option v-for="clinic in clinics" :key="clinic.id" :value="clinic.id">
              {{ clinic.name }}
            </option>
          </select>
        </div>
      </div>

      <div class="divide-y divide-slate-100">
        <div
          v-for="record in filteredRecords"
          :key="record.id"
          class="p-5 hover:bg-slate-50/50 transition-colors"
        >
          <div class="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
            <div
              class="flex-1 min-w-0 cursor-pointer"
              @click="goToDetail(record.id)"
            >
              <div class="flex items-center gap-3 mb-2 flex-wrap">
                <div
                  class="w-10 h-10 rounded-lg border flex items-center justify-center flex-shrink-0"
                  :class="SignStatusColors[record.signStatus]"
                >
                  <Truck v-if="record.signStatus === 'in-transit'" class="w-5 h-5" />
                  <Package v-else-if="record.signStatus === 'pending'" class="w-5 h-5" />
                  <PackageCheck v-else-if="record.signStatus === 'signed'" class="w-5 h-5" />
                  <AlertTriangle v-else class="w-5 h-5" />
                </div>
                <div class="min-w-0">
                  <div class="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span class="font-mono font-semibold text-slate-900">
                      {{ record.trackingNumber }}
                    </span>
                    <span
                      class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium"
                      :class="SignStatusColors[record.signStatus]"
                    >
                      {{ SignStatusLabels[record.signStatus] }}
                    </span>
                    <span
                      class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600"
                    >
                      {{ ShippingMethodLabels[record.shippingMethod] }}
                    </span>
                  </div>
                  <p class="text-xs text-slate-500">
                    {{ record.clinicName }}
                    <span class="mx-1">·</span>
                    <span class="font-mono">{{ record.orderNumber }}</span>
                  </p>
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 text-sm text-slate-600 ml-13">
                <div class="flex items-center gap-1.5">
                  <User class="w-3.5 h-3.5 text-slate-400" />
                  {{ record.receiverName }}
                </div>
                <div class="flex items-center gap-1.5">
                  <Phone class="w-3.5 h-3.5 text-slate-400" />
                  {{ record.receiverPhone }}
                </div>
                <div class="flex items-center gap-1.5 sm:col-span-2">
                  <MapPin class="w-3.5 h-3.5 text-slate-400" />
                  <span class="truncate">{{ record.receiverAddress }}</span>
                </div>
                <div class="flex items-center gap-1.5">
                  <Calendar class="w-3.5 h-3.5 text-slate-400" />
                  {{ record.shipTime ? formatDate(record.shipTime) : '待发货' }}
                </div>
                <div v-if="record.signStatus === 'in-transit'" class="flex items-center gap-1.5">
                  <Clock class="w-3.5 h-3.5 text-slate-400" />
                  运输中 {{ getDaysInTransit(record) }} 天
                </div>
                <div v-if="record.cost" class="flex items-center gap-1.5">
                  <DollarSign class="w-3.5 h-3.5 text-slate-400" />
                  ¥{{ record.cost.toFixed(2) }}
                </div>
              </div>

              <div v-if="record.items && record.items.length > 0" class="mt-3 ml-13">
                <div class="flex flex-wrap gap-1.5">
                  <span
                    v-for="(item, idx) in record.items.slice(0, 3)"
                    :key="idx"
                    class="inline-flex items-center px-2 py-0.5 rounded text-[11px] bg-slate-100 text-slate-700"
                  >
                    {{ item }}
                  </span>
                  <span
                    v-if="record.items.length > 3"
                    class="inline-flex items-center px-2 py-0.5 rounded text-[11px] bg-slate-100 text-slate-600"
                  >
                    +{{ record.items.length - 3 }}
                  </span>
                </div>
              </div>
            </div>

            <div class="flex flex-col items-end gap-3 min-w-[120px]">
              <div v-if="record.signStatus === 'exception' && !record.exceptionHandled">
                <button
                  class="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-rose-600 rounded-lg hover:bg-rose-700 transition-colors shadow-sm"
                  @click.stop="goToException(record.id)"
                >
                  <AlertTriangle class="w-3.5 h-3.5" />
                  处理异常
                </button>
              </div>
              <div v-else-if="record.signStatus === 'pending'">
                <button
                  class="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-violet-600 rounded-lg hover:bg-violet-700 transition-colors shadow-sm"
                  @click.stop="handleConfirmShip(record)"
                >
                  <Send class="w-3.5 h-3.5" />
                  确认发货
                </button>
              </div>
              <div v-else-if="record.signStatus === 'in-transit'">
                <button
                  class="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
                  @click.stop="handleConfirmDelivery(record)"
                >
                  <PackageCheck class="w-3.5 h-3.5" />
                  确认签收
                </button>
              </div>
              <span class="text-xs text-slate-400">
                操作人：{{ record.operator }}
              </span>
            </div>
          </div>
        </div>

        <div v-if="filteredRecords.length === 0" class="p-12 text-center">
          <div class="w-16 h-16 mx-auto mb-3 rounded-full bg-slate-100 flex items-center justify-center">
            <Truck class="w-8 h-8 text-slate-300" />
          </div>
          <p class="text-sm font-medium text-slate-600 mb-1">暂无发货记录</p>
          <p class="text-xs text-slate-400">点击右上角按钮新建发货单</p>
        </div>
      </div>
    </div>
  </div>
</template>
