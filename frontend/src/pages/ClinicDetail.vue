<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft,
  Pencil,
  Plus,
  Building2,
  Phone,
  MapPin,
  Users,
  Handshake,
  BadgeDollarSign,
  FileText,
  AlertTriangle,
  TrendingUp,
  Sparkles,
  Star,
  StarOff,
  Clock,
  ChevronRight,
  Calendar,
  Layers,
  Palette,
  AlertCircle,
  BarChart3,
  RotateCcw,
  Package,
  Wrench,
  Eye,
} from 'lucide-vue-next'
import { useClinics } from '../composables/useClinics'
import type { Clinic, Order, RestorationType, ReworkProblemType } from '../types'
import {
  CooperationStatusLabels,
  CooperationStatusColors,
  SettlementMethodLabels,
  RestorationTypeLabels,
  MaterialTypeLabels,
  ReworkProblemTypeLabels,
  ReworkStatusLabels,
  ReworkStatusColors,
  ProcessingStages,
  OrderStatusLabels,
} from '../types'
import StatCard from '../components/StatCard.vue'
import { cn } from '../lib/utils'

const route = useRoute()
const router = useRouter()
const {
  getClinicById,
  getClinicOrders,
  getCommonRestorationTypes,
  getRecentReworks,
  recalcClinicStats,
} = useClinics()

const clinic = ref<Clinic | null>(null)
const clinicOrders = ref<Order[]>([])
const commonRestorationTypes = ref<{ type: RestorationType; count: number }[]>([])
const recentReworks = ref<any[]>([])

const activeOrderTab = ref<'all' | 'in-progress' | 'completed' | 'returned'>('all')

const filteredOrders = computed(() => {
  const base = [...clinicOrders.value]
  switch (activeOrderTab.value) {
    case 'in-progress':
      return base.filter((o) => o.status === 'in-progress' || o.status === 'pending')
    case 'completed':
      return base.filter((o) => o.status === 'completed')
    case 'returned':
      return base.filter((o) => o.status === 'returned')
    default:
      return base
  }
})

const orderTabs = computed(() => {
  const all = clinicOrders.value.length
  const inProgress = clinicOrders.value.filter(
    (o) => o.status === 'in-progress' || o.status === 'pending'
  ).length
  const completed = clinicOrders.value.filter((o) => o.status === 'completed').length
  const returned = clinicOrders.value.filter((o) => o.status === 'returned').length
  return [
    { key: 'all' as const, label: '全部', count: all },
    { key: 'in-progress' as const, label: '进行中', count: inProgress },
    { key: 'completed' as const, label: '已完成', count: completed },
    { key: 'returned' as const, label: '返工中', count: returned },
  ]
})

const totalWorkItems = computed(() => {
  return clinicOrders.value.reduce((s, o) => s + o.workItems.length, 0)
})

const avgOrderAmount = computed(() => {
  const total = clinicOrders.value.reduce((s, o) => s + (o.totalAmount || 0), 0)
  return clinicOrders.value.length > 0 ? Math.round(total / clinicOrders.value.length) : 0
})

function formatCurrency(amount: number): string {
  if (amount >= 10000) {
    return `¥${(amount / 10000).toFixed(2)}万`
  }
  return `¥${amount.toLocaleString()}`
}

function formatDateStr(dt: string): string {
  return dt.split('T')[0]
}

function getCurrentStageLabel(order: Order): string {
  const stage = ProcessingStages.find((s) => s.stage === order.currentStage)
  return stage?.label || ''
}

function goBack() {
  router.push('/clinics')
}

function goToEdit() {
  if (clinic.value) {
    router.push(`/clinic/${clinic.value.id}/edit`)
  }
}

function goToCreateOrder() {
  if (clinic.value) {
    router.push(`/order/new?clinicId=${clinic.value.id}`)
  }
}

function goToOrderDetail(orderId: string) {
  router.push(`/order/${orderId}`)
}

function loadClinicData() {
  const id = route.params.id as string
  const c = getClinicById(id)
  if (!c) {
    router.push('/clinics')
    return
  }
  clinic.value = c
  clinicOrders.value = getClinicOrders(id)
  commonRestorationTypes.value = getCommonRestorationTypes(id)
  recentReworks.value = getRecentReworks(id, 5)
}

onMounted(() => {
  const id = route.params.id as string
  recalcClinicStats(id)
  loadClinicData()
})
</script>

<template>
  <div class="min-h-full pb-12" v-if="clinic">
    <div class="mb-6">
      <button
        class="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 mb-4 transition-colors"
        @click="goBack"
      >
        <ArrowLeft class="w-4 h-4" />
        返回诊所列表
      </button>

      <div class="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
        <div>
          <div class="flex flex-wrap items-center gap-3 mb-2">
            <h1 class="text-2xl font-bold text-slate-900 tracking-tight">
              {{ clinic.name }}
            </h1>
            <span
              class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium border"
              :class="CooperationStatusColors[clinic.cooperationStatus]"
            >
              <span class="w-1.5 h-1.5 rounded-full" :class="{
                'bg-emerald-500': clinic.cooperationStatus === 'active',
                'bg-slate-500': clinic.cooperationStatus === 'inactive',
                'bg-amber-500': clinic.cooperationStatus === 'pending',
                'bg-rose-500': clinic.cooperationStatus === 'suspended',
              }"></span>
              {{ CooperationStatusLabels[clinic.cooperationStatus] }}
            </span>
            <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200 font-mono">
              <Sparkles class="w-3 h-3" />
              {{ clinic.clinicCode }}
            </span>
          </div>
          <div class="flex flex-wrap items-center gap-4 text-sm text-slate-500">
            <span class="inline-flex items-center gap-1.5">
              <Users class="w-4 h-4" />
              联系人：<span class="font-medium text-slate-700">{{ clinic.contactPerson }}</span>
            </span>
            <span class="inline-flex items-center gap-1.5">
              <Phone class="w-4 h-4" />
              <span class="font-mono">{{ clinic.phone }}</span>
            </span>
            <span class="inline-flex items-center gap-1.5 max-w-md">
              <MapPin class="w-4 h-4 flex-shrink-0" />
              <span class="truncate">{{ clinic.address }}</span>
            </span>
          </div>
        </div>

        <div class="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            class="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors"
            @click="goToCreateOrder"
          >
            <Plus class="w-4 h-4" />
            创建订单
          </button>
          <button
            type="button"
            class="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            @click="loadClinicData"
          >
            <RotateCcw class="w-4 h-4" />
            刷新
          </button>
          <button
            type="button"
            class="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            @click="goToEdit"
          >
            <Pencil class="w-4 h-4" />
            编辑诊所
          </button>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-4 mb-6">
      <StatCard
        title="累计订单"
        :value="clinic.stats.totalOrders"
        :icon="FileText"
        tone="primary"
        description="总订单数"
      />
      <StatCard
        title="返工率"
        :value="`${clinic.stats.reworkRate}%`"
        :icon="AlertTriangle"
        :tone="clinic.stats.reworkRate < 2 ? 'success' : clinic.stats.reworkRate < 5 ? 'warning' : 'danger'"
        description="质量指标"
      />
      <StatCard
        title="累计金额"
        :value="formatCurrency(clinic.stats.totalAmount)"
        :icon="TrendingUp"
        tone="success"
        description="合作总额"
      />
      <StatCard
        title="修复体件数"
        :value="totalWorkItems"
        :icon="Package"
        tone="primary"
        description="累计制作"
      />
      <StatCard
        title="常用医生"
        :value="clinic.doctors.length"
        :icon="Users"
        tone="default"
        description="合作医生数"
      />
      <StatCard
        title="客单价"
        :value="formatCurrency(avgOrderAmount)"
        :icon="BadgeDollarSign"
        tone="warning"
        description="平均每单"
      />
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <div class="xl:col-span-1 space-y-6">
        <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div class="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-sky-50 border border-sky-100 flex items-center justify-center">
              <Building2 class="w-4 h-4 text-sky-600" />
            </div>
            <h2 class="text-base font-semibold text-slate-800">诊所信息</h2>
          </div>
          <div class="p-5 space-y-4">
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div class="text-xs text-slate-500 mb-1">诊所ID</div>
                <div class="font-mono font-medium text-slate-800">{{ clinic.id }}</div>
              </div>
              <div>
                <div class="text-xs text-slate-500 mb-1">诊所编码</div>
                <div class="font-mono font-medium text-slate-800">{{ clinic.clinicCode }}</div>
              </div>
            </div>
            <div class="space-y-1">
              <div class="text-xs text-slate-500">详细地址</div>
              <div class="text-sm font-medium text-slate-800">{{ clinic.address }}</div>
            </div>
            <div class="pt-4 border-t border-slate-100">
              <div class="text-xs font-semibold text-slate-700 mb-3">合作条款</div>
              <div class="space-y-3 text-sm">
                <div class="flex items-center justify-between">
                  <span class="text-slate-500 inline-flex items-center gap-1.5">
                    <Handshake class="w-3.5 h-3.5" />
                    合作状态
                  </span>
                  <span
                    class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border"
                    :class="CooperationStatusColors[clinic.cooperationStatus]"
                  >
                    {{ CooperationStatusLabels[clinic.cooperationStatus] }}
                  </span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-slate-500 inline-flex items-center gap-1.5">
                    <BadgeDollarSign class="w-3.5 h-3.5" />
                    结算方式
                  </span>
                  <span class="font-medium text-slate-800">
                    {{ SettlementMethodLabels[clinic.settlementMethod] }}
                  </span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-slate-500 inline-flex items-center gap-1.5">
                    <Clock class="w-3.5 h-3.5" />
                    账期
                  </span>
                  <span class="font-medium text-slate-800">{{ clinic.paymentTermDays }} 天</span>
                </div>
              </div>
            </div>
            <div
              v-if="clinic.remarks"
              class="pt-4 border-t border-slate-100"
            >
              <div class="text-xs font-semibold text-slate-700 mb-2">备注说明</div>
              <div class="text-sm text-slate-600 bg-amber-50 border border-amber-100 rounded-lg p-3 leading-relaxed">
                {{ clinic.remarks }}
              </div>
            </div>
            <div class="pt-4 border-t border-slate-100 grid grid-cols-2 gap-4 text-xs text-slate-500">
              <div>
                <div class="mb-1">创建时间</div>
                <div class="font-mono text-slate-600">{{ formatDateStr(clinic.createdAt) }}</div>
              </div>
              <div>
                <div class="mb-1">最近更新</div>
                <div class="font-mono text-slate-600">{{ formatDateStr(clinic.updatedAt) }}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div class="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                <Users class="w-4 h-4 text-emerald-600" />
              </div>
              <h2 class="text-base font-semibold text-slate-800">常用医生</h2>
            </div>
            <span class="text-xs text-slate-500">共 {{ clinic.doctors.length }} 位</span>
          </div>
          <div class="p-5">
            <div
              v-if="clinic.doctors.length === 0"
              class="py-8 text-center"
            >
              <div class="flex flex-col items-center gap-2">
                <div class="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                  <Users class="w-5 h-5 text-slate-400" />
                </div>
                <div class="text-xs text-slate-500">暂无医生档案</div>
              </div>
            </div>
            <div v-else class="space-y-3">
              <div
                v-for="doc in clinic.doctors"
                :key="doc.id"
                class="flex items-start gap-3 p-3 rounded-xl transition-colors"
                :class="doc.isPrimary ? 'bg-blue-50 border border-blue-100' : 'bg-slate-50 hover:bg-slate-100'"
              >
                <div
                  class="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                  :class="doc.isPrimary
                    ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-700'"
                >
                  {{ doc.name.charAt(0) }}
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="font-semibold text-slate-900 text-sm">{{ doc.name }}</span>
                    <span
                      v-if="doc.title"
                      class="text-[10px] px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600"
                    >
                      {{ doc.title }}
                    </span>
                    <span
                      v-if="doc.isPrimary"
                      class="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-600 text-white"
                    >
                      <Star class="w-2.5 h-2.5 fill-current" />
                      主联系人
                    </span>
                  </div>
                  <div class="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 text-xs text-slate-500">
                    <span v-if="doc.specialty">专长：{{ doc.specialty }}</span>
                    <span v-if="doc.phone" class="font-mono">
                      <Phone class="w-3 h-3 inline -mt-0.5" /> {{ doc.phone }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div class="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-violet-50 border border-violet-100 flex items-center justify-center">
              <BarChart3 class="w-4 h-4 text-violet-600" />
            </div>
            <h2 class="text-base font-semibold text-slate-800">常用修复类型</h2>
          </div>
          <div class="p-5">
            <div
              v-if="commonRestorationTypes.length === 0"
              class="py-8 text-center"
            >
              <div class="flex flex-col items-center gap-2">
                <div class="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                  <Layers class="w-5 h-5 text-slate-400" />
                </div>
                <div class="text-xs text-slate-500">暂无历史订单数据</div>
              </div>
            </div>
            <div v-else class="space-y-3">
              <div
                v-for="(item, idx) in commonRestorationTypes"
                :key="item.type"
                class="group"
              >
                <div class="flex items-center justify-between mb-1.5 text-xs">
                  <span class="font-medium text-slate-700 flex items-center gap-1.5">
                    <span
                      class="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold"
                      :class="{
                        'bg-blue-100 text-blue-700': idx === 0,
                        'bg-slate-100 text-slate-600': idx > 0,
                      }"
                    >
                      {{ idx + 1 }}
                    </span>
                    {{ RestorationTypeLabels[item.type] }}
                  </span>
                  <span class="text-slate-500 font-mono">{{ item.count }} 件</span>
                </div>
                <div class="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    class="h-full rounded-full transition-all"
                    :style="{
                      width: `${(item.count / Math.max(...commonRestorationTypes.map(t => t.count))) * 100}%`,
                      background: idx === 0
                        ? 'linear-gradient(to right, #3b82f6, #6366f1)'
                        : idx === 1
                        ? 'linear-gradient(to right, #6366f1, #8b5cf6)'
                        : idx === 2
                        ? 'linear-gradient(to right, #10b981, #14b8a6)'
                        : '#94a3b8',
                    }"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="xl:col-span-2 space-y-6">
        <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div class="px-5 py-4 border-b border-slate-100">
            <div class="flex items-center justify-between flex-wrap gap-3">
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
                  <FileText class="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h2 class="text-base font-semibold text-slate-800">历史订单</h2>
                  <p class="text-xs text-slate-500 mt-0.5">该诊所下的所有订单记录，支持按状态筛选</p>
                </div>
              </div>
              <button
                type="button"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
                @click="goToCreateOrder"
              >
                <Plus class="w-3.5 h-3.5" />
                新建订单
              </button>
            </div>
          </div>
          <div class="border-b border-slate-100 px-5">
            <div class="flex items-center gap-1">
              <button
                v-for="tab in orderTabs"
                :key="tab.key"
                type="button"
                class="relative px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap"
                :class="activeOrderTab === tab.key ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'"
                @click="activeOrderTab = tab.key"
              >
                {{ tab.label }}
                <span
                  class="ml-1.5 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-bold rounded-full"
                  :class="activeOrderTab === tab.key
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-slate-100 text-slate-600'"
                >
                  {{ tab.count }}
                </span>
                <div
                  v-if="activeOrderTab === tab.key"
                  class="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full"
                ></div>
              </button>
            </div>
          </div>
          <div class="divide-y divide-slate-100">
            <div
              v-if="filteredOrders.length === 0"
              class="px-5 py-16 text-center"
            >
              <div class="flex flex-col items-center gap-2">
                <div class="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
                  <FileText class="w-8 h-8 text-slate-400" />
                </div>
                <div class="text-sm font-medium text-slate-600">暂无该状态的订单</div>
                <div class="text-xs text-slate-400">
                  {{ activeOrderTab === 'all' ? '点击右上角「新建订单」开始创建' : '切换其他标签查看' }}
                </div>
              </div>
            </div>
            <div
              v-for="order in filteredOrders"
              :key="order.id"
              class="px-5 py-4 hover:bg-slate-50 transition-colors cursor-pointer group"
              @click="goToOrderDetail(order.id)"
            >
              <div class="flex items-start justify-between gap-4 flex-wrap">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 flex-wrap mb-1.5">
                    <span class="font-mono font-bold text-sm text-slate-800">
                      {{ order.orderNumber }}
                    </span>
                    <span
                      class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border"
                      :class="{
                        'bg-slate-100 text-slate-600 border-slate-200': order.status === 'pending',
                        'bg-blue-50 text-blue-700 border-blue-200': order.status === 'in-progress',
                        'bg-emerald-50 text-emerald-700 border-emerald-200': order.status === 'completed',
                        'bg-amber-50 text-amber-700 border-amber-200': order.status === 'on-hold',
                        'bg-rose-50 text-rose-700 border-rose-200': order.status === 'returned',
                      }"
                    >
                      {{ OrderStatusLabels[order.status] }}
                    </span>
                    <span
                      v-if="order.priority !== 'standard'"
                      class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium"
                      :class="order.priority === 'urgent'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'"
                    >
                      {{ order.priority === 'urgent' ? '加急' : '特急' }}
                    </span>
                    <span
                      v-if="order.returnRecords.length > 0"
                      class="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-medium bg-rose-50 text-rose-600 border border-rose-200"
                    >
                      <AlertCircle class="w-3 h-3" />
                      返工x{{ order.returnRecords.length }}
                    </span>
                  </div>
                  <div class="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                    <span class="inline-flex items-center gap-1">
                      <Calendar class="w-3 h-3" />
                      创建：{{ formatDateStr(order.createdAt) }}
                    </span>
                    <span class="inline-flex items-center gap-1">
                      <Clock class="w-3 h-3" />
                      交付：{{ order.deliveryDate }}
                    </span>
                    <span class="inline-flex items-center gap-1">
                      <Wrench class="w-3 h-3" />
                      {{ getCurrentStageLabel(order) }}
                    </span>
                    <span class="inline-flex items-center gap-1">
                      <Layers class="w-3 h-3" />
                      {{ order.workItems.length }} 件修复体
                    </span>
                    <span v-if="order.totalAmount" class="inline-flex items-center gap-1 font-medium text-slate-700">
                      <BadgeDollarSign class="w-3 h-3" />
                      ¥{{ order.totalAmount.toLocaleString() }}
                    </span>
                  </div>
                </div>
                <div class="flex items-center gap-1 flex-shrink-0">
                  <button
                    type="button"
                    class="p-1.5 text-slate-400 group-hover:text-blue-600 group-hover:bg-blue-50 rounded-md transition-colors"
                    title="查看详情"
                    @click.stop="goToOrderDetail(order.id)"
                  >
                    <Eye class="w-4 h-4" />
                  </button>
                  <ChevronRight class="w-4 h-4 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div class="px-5 py-4 border-b border-slate-100">
            <div class="flex items-center justify-between flex-wrap gap-2">
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center">
                  <AlertTriangle class="w-4 h-4 text-rose-600" />
                </div>
                <div>
                  <h2 class="text-base font-semibold text-slate-800">最近返工记录</h2>
                  <p class="text-xs text-slate-500 mt-0.5">最近的质量问题返工记录，用于追溯和改进</p>
                </div>
              </div>
              <span class="text-xs text-slate-500">最近 5 条</span>
            </div>
          </div>
          <div class="divide-y divide-slate-100">
            <div
              v-if="recentReworks.length === 0"
              class="px-5 py-12 text-center"
            >
              <div class="flex flex-col items-center gap-2">
                <div class="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
                  <AlertTriangle class="w-6 h-6 text-emerald-400" />
                </div>
                <div class="text-sm font-medium text-emerald-700">太棒了！暂无返工记录</div>
                <div class="text-xs text-slate-400">该诊所的订单质量表现良好</div>
              </div>
            </div>
            <div
              v-for="rw in recentReworks"
              :key="rw.reworkId"
              class="px-5 py-4 hover:bg-slate-50 transition-colors cursor-pointer"
              @click="goToOrderDetail(rw.orderId)"
            >
              <div class="flex items-start justify-between gap-4">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 flex-wrap mb-1.5">
                    <span class="font-mono text-xs font-semibold text-slate-700">
                      {{ rw.orderNumber }}
                    </span>
                    <span
                      class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border"
                      :class="ReworkStatusColors[rw.status as keyof typeof ReworkStatusColors]"
                    >
                      {{ ReworkStatusLabels[rw.status as keyof typeof ReworkStatusLabels] }}
                    </span>
                  </div>
                  <div class="text-sm text-slate-800 font-medium mb-1">
                    {{ rw.reason }}
                  </div>
                  <div class="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                    <span class="inline-flex items-center gap-1">
                      <Calendar class="w-3 h-3" />
                      {{ formatDateStr(rw.returnedAt) }}
                    </span>
                    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-50 text-rose-600 border border-rose-100">
                      <Palette class="w-3 h-3" />
                      {{ ReworkProblemTypeLabels[rw.problemType as ReworkProblemType] }}
                    </span>
                  </div>
                </div>
                <ChevronRight class="w-4 h-4 text-slate-300 flex-shrink-0 mt-1" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
