<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  ClipboardList,
  Clock,
  AlertTriangle,
  CalendarCheck,
  CalendarX,
  CheckCircle2,
  RefreshCw,
  Search,
  SlidersHorizontal,
  X,
  Filter,
  PackageOpen,
  Plus,
  ChevronRight,
  Building2,
  User,
  Calendar,
  AlertCircle,
  Play,
  Pause,
  Undo2,
  CheckCircle,
} from 'lucide-vue-next'
import StatCard from '../components/StatCard.vue'
import OrderCard from '../components/OrderCard.vue'
import StatusBadge from '../components/StatusBadge.vue'
import PriorityBadge from '../components/PriorityBadge.vue'
import StageTimeline from '../components/StageTimeline.vue'
import type {
  Order,
  OrderStatus,
  OrderPriority,
  ProcessingStage,
} from '../types'
import {
  OrderStatusLabels,
  PriorityLabels,
  ProcessingStages,
  RestorationTypeLabels,
  MaterialTypeLabels,
} from '../types'
import { useOrders } from '../composables/useOrders'
import { cn } from '../lib/utils'

const router = useRouter()
const { orders: allOrders, getClinics } = useOrders()
const MockClinics = getClinics()

const searchQuery = ref('')
const showFilters = ref(false)
const statusFilter = ref<OrderStatus | 'all'>('all')
const priorityFilter = ref<OrderPriority | 'all'>('all')
const clinicFilter = ref<string>('all')
const stageFilter = ref<ProcessingStage | 'all'>('all')
const viewMode = ref<'kanban' | 'list'>('kanban')

const today = new Date()

const stats = computed(() => {
  const total = allOrders.value.length
  const inProgress = allOrders.value.filter(
    (o) => o.status === 'in-progress' || o.status === 'pending'
  ).length
  const urgent = allOrders.value.filter(
    (o) =>
      (o.priority === 'urgent' || o.priority === 'stat') &&
      o.status !== 'completed'
  ).length
  const dueToday = allOrders.value.filter((o) => {
    const d = new Date(o.deliveryDate)
    return (
      d.toDateString() === today.toDateString() && o.status !== 'completed'
    )
  }).length
  const overdue = allOrders.value.filter((o) => {
    const d = new Date(o.deliveryDate)
    return d < today && o.status !== 'completed'
  }).length
  const completedToday = allOrders.value.filter((o) => {
    const delivered = o.stageHistory.find((s) => s.stage === 'delivered')
    if (!delivered?.completedAt) return false
    const d = new Date(delivered.completedAt)
    return d.toDateString() === today.toDateString()
  }).length
  const returned = allOrders.value.filter((o) => o.returnRecords.length > 0).length

  return {
    total,
    inProgress,
    urgent,
    dueToday,
    overdue,
    completedToday,
    returned,
  }
})

const filteredOrders = computed(() => {
  return allOrders.value.filter((order) => {
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase()
      const match =
        order.orderNumber.toLowerCase().includes(q) ||
        order.patient.anonymousCode.toLowerCase().includes(q) ||
        order.clinic.name.toLowerCase().includes(q) ||
        order.doctorName.toLowerCase().includes(q)
      if (!match) return false
    }

    if (statusFilter.value !== 'all' && order.status !== statusFilter.value)
      return false
    if (priorityFilter.value !== 'all' && order.priority !== priorityFilter.value)
      return false
    if (clinicFilter.value !== 'all' && order.clinicId !== clinicFilter.value)
      return false
    if (stageFilter.value !== 'all' && order.currentStage !== stageFilter.value)
      return false

    return true
  }).sort((a, b) => {
    const priorityOrder = { stat: 0, urgent: 1, standard: 2 }
    const prioDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
    if (prioDiff !== 0) return prioDiff
    return new Date(a.deliveryDate).getTime() - new Date(b.deliveryDate).getTime()
  })
})

interface KanbanColumn {
  key: OrderStatus
  label: string
  icon: any
  toneClass: string
  headerClass: string
  badgeClass: string
}

const kanbanColumns: KanbanColumn[] = [
  {
    key: 'pending',
    label: '待开工',
    icon: Clock,
    toneClass: 'bg-slate-50 border-slate-200',
    headerClass: 'text-slate-700 bg-slate-100/70 border-slate-200',
    badgeClass: 'bg-slate-500',
  },
  {
    key: 'in-progress',
    label: '进行中',
    icon: Play,
    toneClass: 'bg-blue-50/50 border-blue-200',
    headerClass: 'text-blue-700 bg-blue-100/70 border-blue-200',
    badgeClass: 'bg-blue-500',
  },
  {
    key: 'on-hold',
    label: '已暂停',
    icon: Pause,
    toneClass: 'bg-amber-50/50 border-amber-200',
    headerClass: 'text-amber-700 bg-amber-100/70 border-amber-200',
    badgeClass: 'bg-amber-500',
  },
  {
    key: 'returned',
    label: '已返工',
    icon: Undo2,
    toneClass: 'bg-rose-50/50 border-rose-200',
    headerClass: 'text-rose-700 bg-rose-100/70 border-rose-200',
    badgeClass: 'bg-rose-500',
  },
  {
    key: 'completed',
    label: '已完成',
    icon: CheckCircle,
    toneClass: 'bg-emerald-50/50 border-emerald-200',
    headerClass: 'text-emerald-700 bg-emerald-100/70 border-emerald-200',
    badgeClass: 'bg-emerald-500',
  },
]

function getOrdersByStatus(status: OrderStatus): Order[] {
  return filteredOrders.value.filter((o) => o.status === status)
}

function isDelayed(order: Order): boolean {
  const delivery = new Date(order.deliveryDate)
  const daysToDelivery = Math.ceil(
    (delivery.getTime() - new Date(today.toDateString()).getTime()) / 86400000
  )
  return (
    daysToDelivery < 0 &&
    order.status !== 'completed' &&
    order.currentStage !== 'delivered'
  )
}

function isDueSoon(order: Order): boolean {
  const delivery = new Date(order.deliveryDate)
  const daysToDelivery = Math.ceil(
    (delivery.getTime() - new Date(today.toDateString()).getTime()) / 86400000
  )
  return (
    daysToDelivery >= 0 &&
    daysToDelivery <= 2 &&
    order.status !== 'completed'
  )
}

function daysToDelivery(order: Order): number {
  const delivery = new Date(order.deliveryDate)
  return Math.ceil(
    (delivery.getTime() - new Date(today.toDateString()).getTime()) / 86400000
  )
}

function getCardHighlightClass(order: Order): string {
  if (order.returnRecords.length > 0) {
    return 'ring-2 ring-rose-300 border-rose-300 bg-rose-50/30'
  }
  if (order.priority === 'stat') {
    return 'ring-2 ring-rose-300 border-rose-300'
  }
  if (isDelayed(order)) {
    return 'ring-2 ring-rose-300 border-rose-300'
  }
  if (order.priority === 'urgent' || isDueSoon(order)) {
    return 'ring-2 ring-amber-300 border-amber-300'
  }
  return ''
}

function getWorkSummary(order: Order): string {
  return order.workItems
    .filter((w) => w.toothNumber !== 'all')
    .map((w) => w.toothNumber)
    .join(', ')
}

function getMaterials(order: Order): string {
  return Array.from(
    new Set(order.workItems.map((w) => MaterialTypeLabels[w.material]))
  ).join('、')
}

function getRestorationTypes(order: Order): string {
  return Array.from(
    new Set(
      order.workItems.map((w) => RestorationTypeLabels[w.restorationType])
    )
  ).join('、')
}

const hasActiveFilters = computed(() => {
  return (
    statusFilter.value !== 'all' ||
    priorityFilter.value !== 'all' ||
    clinicFilter.value !== 'all' ||
    stageFilter.value !== 'all'
  )
})

function clearFilters() {
  statusFilter.value = 'all'
  priorityFilter.value = 'all'
  clinicFilter.value = 'all'
  stageFilter.value = 'all'
}

function goToDetail(order: Order) {
  router.push(`/order/${order.id}`)
}

function goToNewOrder() {
  router.push('/order/new')
}

function refreshData() {
  searchQuery.value = ''
  clearFilters()
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
  })
}
</script>

<template>
  <div class="min-h-full">
    <div class="mb-8">
      <div class="flex items-start justify-between mb-2">
        <div>
          <h1 class="text-2xl font-bold text-slate-900 tracking-tight">
            订单看板
          </h1>
          <p class="mt-1 text-sm text-slate-500">
            监控全部加工订单进度，确保按时交付
          </p>
        </div>
        <div class="flex items-center gap-2">
          <div class="inline-flex items-center p-1 bg-slate-100 rounded-lg mr-2">
            <button
              class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors"
              :class="viewMode === 'kanban' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-600 hover:text-slate-800'"
              @click="viewMode = 'kanban'"
            >
              看板
            </button>
            <button
              class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors"
              :class="viewMode === 'list' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-600 hover:text-slate-800'"
              @click="viewMode = 'list'"
            >
              列表
            </button>
          </div>
          <button
            class="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            @click="goToNewOrder"
          >
            <Plus class="w-4 h-4" />
            新建订单
          </button>
          <button
            class="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            @click="refreshData"
          >
            <RefreshCw class="w-4 h-4" />
            刷新
          </button>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <StatCard
        title="在制订单"
        :value="stats.inProgress"
        :icon="PackageOpen"
        tone="primary"
        description="总数 "
        :trend="'+' + stats.total"
      />
      <StatCard
        title="加急订单"
        :value="stats.urgent"
        :icon="AlertTriangle"
        tone="warning"
        description="需优先处理"
      />
      <StatCard
        title="今日交付"
        :value="stats.dueToday"
        :icon="CalendarCheck"
        tone="primary"
        :description="'逾期: ' + stats.overdue + ' 单'"
      />
      <StatCard
        title="返工订单"
        :value="stats.returned"
        :icon="RefreshCw"
        tone="danger"
        description="质量问题追踪"
      />
    </div>

    <div
      class="bg-white rounded-xl border border-slate-200 p-4 mb-6 sticky top-0 z-20"
    >
      <div class="flex flex-col md:flex-row gap-3">
        <div class="flex-1 relative">
          <Search
            class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
          />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索订单号、患者编号、诊所、医生..."
            class="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-400"
          />
          <button
            v-if="searchQuery"
            class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            @click="searchQuery = ''"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <button
          class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          :class="{
            'bg-slate-100 border-slate-300': showFilters,
          }"
          @click="showFilters = !showFilters"
        >
          <SlidersHorizontal class="w-4 h-4" />
          筛选
          <span
            v-if="hasActiveFilters"
            class="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 text-xs font-bold bg-blue-600 text-white rounded-full"
          >
            {{
              [
                statusFilter !== 'all',
                priorityFilter !== 'all',
                clinicFilter !== 'all',
                stageFilter !== 'all',
              ].filter(Boolean).length
            }}
          </span>
        </button>
      </div>

      <div
        v-if="showFilters"
        class="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <div>
          <label class="block text-xs font-medium text-slate-600 mb-1.5">
            订单状态
          </label>
          <select
            v-model="statusFilter"
            class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">全部状态</option>
            <option
              v-for="(label, key) in OrderStatusLabels"
              :key="key"
              :value="key"
            >
              {{ label }}
            </option>
          </select>
        </div>

        <div>
          <label class="block text-xs font-medium text-slate-600 mb-1.5">
            优先级
          </label>
          <select
            v-model="priorityFilter"
            class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">全部优先级</option>
            <option
              v-for="(label, key) in PriorityLabels"
              :key="key"
              :value="key"
            >
              {{ label }}
            </option>
          </select>
        </div>

        <div>
          <label class="block text-xs font-medium text-slate-600 mb-1.5">
            合作诊所
          </label>
          <select
            v-model="clinicFilter"
            class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">全部诊所</option>
            <option
              v-for="clinic in MockClinics"
              :key="clinic.id"
              :value="clinic.id"
            >
              {{ clinic.name }}
            </option>
          </select>
        </div>

        <div>
          <label class="block text-xs font-medium text-slate-600 mb-1.5">
            加工阶段
          </label>
          <select
            v-model="stageFilter"
            class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">全部阶段</option>
            <option
              v-for="stage in ProcessingStages"
              :key="stage.stage"
              :value="stage.stage"
            >
              {{ stage.label }}
            </option>
          </select>
        </div>

        <div
          v-if="hasActiveFilters"
          class="lg:col-span-4 flex justify-end"
        >
          <button
            class="text-sm text-slate-500 hover:text-slate-700 underline underline-offset-2"
            @click="clearFilters"
          >
            清除全部筛选条件
          </button>
        </div>
      </div>
    </div>

    <template v-if="viewMode === 'kanban'">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <div
          v-for="col in kanbanColumns"
          :key="col.key"
          class="rounded-xl border overflow-hidden flex flex-col max-h-[calc(100vh-380px)]"
          :class="col.toneClass"
        >
          <div
            class="px-4 py-3 border-b flex items-center justify-between"
            :class="col.headerClass"
          >
            <div class="flex items-center gap-2">
              <component :is="col.icon" class="w-4 h-4" />
              <span class="text-sm font-semibold">{{ col.label }}</span>
            </div>
            <span
              class="inline-flex items-center justify-center min-w-[1.5rem] h-5 px-1.5 text-xs font-bold text-white rounded-full"
              :class="col.badgeClass"
            >
              {{ getOrdersByStatus(col.key).length }}
            </span>
          </div>
          <div class="p-3 space-y-3 overflow-y-auto flex-1">
            <div
              v-for="order in getOrdersByStatus(col.key)"
              :key="order.id"
              class="group bg-white rounded-lg border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer p-3"
              :class="getCardHighlightClass(order)"
              @click="goToDetail(order)"
            >
              <div class="flex items-start justify-between gap-2 mb-2">
                <div class="flex items-center gap-1.5 min-w-0 flex-wrap">
                  <span
                    class="text-xs font-bold tracking-tight text-slate-800 font-mono"
                  >
                    {{ order.orderNumber }}
                  </span>
                </div>
                <ChevronRight
                  class="w-4 h-4 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all flex-shrink-0"
                />
              </div>

              <div class="flex items-center gap-1.5 mb-2 flex-wrap">
                <PriorityBadge :priority="order.priority" />
                <StatusBadge :status="order.status" />
                <div
                  v-if="order.returnRecords.length > 0"
                  class="inline-flex items-center gap-1 px-1.5 py-0.5 bg-rose-50 rounded text-[10px] text-rose-600 font-medium border border-rose-200"
                >
                  <Undo2 class="w-2.5 h-2.5" />
                  返工x{{ order.returnRecords.length }}
                </div>
              </div>

              <div class="flex items-center gap-2 text-[11px] text-slate-500 mb-2">
                <span class="flex items-center gap-1 truncate">
                  <Building2 class="w-3 h-3 flex-shrink-0" />
                  <span class="truncate">{{ order.clinic.name }}</span>
                </span>
              </div>

              <div class="grid grid-cols-2 gap-2 text-[11px] mb-2">
                <div>
                  <div class="text-slate-400 mb-0.5">修复类型</div>
                  <div class="font-medium text-slate-700 truncate">{{ getRestorationTypes(order) }}</div>
                </div>
                <div>
                  <div class="text-slate-400 mb-0.5">牙位</div>
                  <div class="font-medium text-slate-700 truncate">
                    {{ getWorkSummary(order) || '全口' }}
                  </div>
                </div>
              </div>

              <div class="mb-2">
                <StageTimeline :current-stage="order.currentStage" compact />
              </div>

              <div
                class="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]"
              >
                <div
                  class="flex items-center gap-1"
                  :class="[
                    isDelayed(order)
                      ? 'text-rose-600'
                      : isDueSoon(order)
                      ? 'text-amber-600'
                      : 'text-slate-500',
                  ]"
                >
                  <Calendar class="w-3 h-3" />
                  <span>{{ formatDate(order.deliveryDate) }}</span>
                  <template v-if="isDelayed(order)">
                    <AlertCircle class="w-3 h-3" />
                    <span class="font-medium">逾期{{ Math.abs(daysToDelivery(order)) }}天</span>
                  </template>
                  <template v-else-if="isDueSoon(order) && daysToDelivery(order) === 0">
                    <AlertCircle class="w-3 h-3" />
                    <span class="font-medium">今日</span>
                  </template>
                  <template v-else-if="isDueSoon(order)">
                    <AlertCircle class="w-3 h-3" />
                    <span class="font-medium">{{ daysToDelivery(order) }}天</span>
                  </template>
                </div>
              </div>
            </div>

            <div
              v-if="getOrdersByStatus(col.key).length === 0"
              class="py-8 text-center text-xs text-slate-400"
            >
              暂无订单
            </div>
          </div>
        </div>
      </div>
    </template>

    <template v-else>
      <div class="mb-4 flex items-center justify-between">
        <div class="text-sm text-slate-600">
          共
          <span class="font-semibold text-slate-800">
            {{ filteredOrders.length }}
          </span>
          条订单
        </div>
      </div>

      <div
        v-if="filteredOrders.length > 0"
        class="grid grid-cols-1 lg:grid-cols-2 gap-5"
      >
        <OrderCard
          v-for="order in filteredOrders"
          :key="order.id"
          :order="order"
          @view-detail="goToDetail(order)"
        />
      </div>

      <div
        v-else
        class="bg-white rounded-xl border border-slate-200 border-dashed p-12 text-center"
      >
        <div
          class="w-14 h-14 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center"
        >
          <Filter class="w-7 h-7 text-slate-400" />
        </div>
        <h3 class="text-base font-medium text-slate-700 mb-1">暂无匹配订单</h3>
        <p class="text-sm text-slate-500 mb-4">
          试试调整搜索条件或清除筛选器
        </p>
        <button
          v-if="searchQuery || hasActiveFilters"
          class="text-sm font-medium text-blue-600 hover:text-blue-700"
          @click="refreshData"
        >
          重置所有条件
        </button>
      </div>
    </template>
  </div>
</template>
