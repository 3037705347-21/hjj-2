<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
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
  Download,
  Save,
  FolderOpen,
  Trash2,
  ArrowUpDown,
  RotateCcw,
  Zap,
  Flame,
  Wrench,
  Eye,
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
  RestorationType,
  MaterialType,
  ImpressionMethod,
} from '../types'
import {
  OrderStatusLabels,
  PriorityLabels,
  ProcessingStages,
  RestorationTypeLabels,
  MaterialTypeLabels,
  ImpressionMethodLabels,
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

const createdAtStart = ref<string>('')
const createdAtEnd = ref<string>('')
const deliveryDateStart = ref<string>('')
const deliveryDateEnd = ref<string>('')
const returnStatusFilter = ref<'all' | 'none' | 'returned' | 'processing'>('all')
const restorationTypeFilter = ref<RestorationType | 'all'>('all')
const materialFilter = ref<MaterialType | 'all'>('all')
const impressionMethodFilter = ref<ImpressionMethod | 'all'>('all')
const amountMin = ref<string>('')
const amountMax = ref<string>('')
const doctorFilter = ref<string>('')
const technicianFilter = ref<string>('')

type SortField = 'priority' | 'deliveryDate' | 'createdAt' | 'amount' | 'clinic'
type SortOrder = 'asc' | 'desc'
const sortField = ref<SortField>('priority')
const sortOrder = ref<SortOrder>('asc')
const showSortDropdown = ref(false)

interface SavedFilterScheme {
  id: string
  name: string
  createdAt: string
  filters: {
    searchQuery: string
    statusFilter: OrderStatus | 'all'
    priorityFilter: OrderPriority | 'all'
    clinicFilter: string
    stageFilter: ProcessingStage | 'all'
    createdAtStart: string
    createdAtEnd: string
    deliveryDateStart: string
    deliveryDateEnd: string
    returnStatusFilter: 'all' | 'none' | 'returned' | 'processing'
    restorationTypeFilter: RestorationType | 'all'
    materialFilter: MaterialType | 'all'
    impressionMethodFilter: ImpressionMethod | 'all'
    amountMin: string
    amountMax: string
    doctorFilter: string
    technicianFilter: string
  }
}

const FILTER_SCHEMES_STORAGE_KEY = 'denture-lab-filter-schemes'
const MY_TASKS_TECHNICIAN_KEY = 'denture-lab-my-technician-name'
const savedSchemes = ref<SavedFilterScheme[]>([])
const showSchemeDialog = ref(false)
const showSaveSchemeDialog = ref(false)
const schemeNameInput = ref('')
const myTechnicianName = ref<string>('')
const showMyTasksConfig = ref(false)
const myTasksTechnicianInput = ref('')

type QuickViewKey = 'all' | 'today' | 'overdue' | 'returning' | 'urgent' | 'mytasks'
const activeQuickView = ref<QuickViewKey>('all')

const showAdvancedFilters = ref(false)

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

    if (createdAtStart.value) {
      const d = new Date(order.createdAt)
      const start = new Date(createdAtStart.value)
      start.setHours(0, 0, 0, 0)
      if (d < start) return false
    }
    if (createdAtEnd.value) {
      const d = new Date(order.createdAt)
      const end = new Date(createdAtEnd.value)
      end.setHours(23, 59, 59, 999)
      if (d > end) return false
    }

    if (deliveryDateStart.value) {
      const d = new Date(order.deliveryDate)
      const start = new Date(deliveryDateStart.value)
      start.setHours(0, 0, 0, 0)
      if (d < start) return false
    }
    if (deliveryDateEnd.value) {
      const d = new Date(order.deliveryDate)
      const end = new Date(deliveryDateEnd.value)
      end.setHours(23, 59, 59, 999)
      if (d > end) return false
    }

    if (returnStatusFilter.value === 'none' && order.returnRecords.length > 0)
      return false
    if (returnStatusFilter.value === 'returned' && order.returnRecords.length === 0)
      return false
    if (returnStatusFilter.value === 'processing') {
      if (order.returnRecords.length === 0) return false
      const lastReturn = order.returnRecords[order.returnRecords.length - 1]
      if (lastReturn.completedAt) return false
    }

    if (restorationTypeFilter.value !== 'all') {
      const hasType = order.workItems.some(
        (w) => w.restorationType === restorationTypeFilter.value
      )
      if (!hasType) return false
    }

    if (materialFilter.value !== 'all') {
      const hasMaterial = order.workItems.some(
        (w) => w.material === materialFilter.value
      )
      if (!hasMaterial) return false
    }

    if (impressionMethodFilter.value !== 'all' && order.impressionMethod !== impressionMethodFilter.value)
      return false

    if (amountMin.value && order.totalAmount !== undefined) {
      if (order.totalAmount < parseFloat(amountMin.value)) return false
    }
    if (amountMax.value && order.totalAmount !== undefined) {
      if (order.totalAmount > parseFloat(amountMax.value)) return false
    }

    if (doctorFilter.value.trim()) {
      const q = doctorFilter.value.toLowerCase()
      if (!order.doctorName.toLowerCase().includes(q)) return false
    }

    if (technicianFilter.value.trim()) {
      const q = technicianFilter.value.toLowerCase()
      const hasTechnician = order.stageHistory.some(
        (s) => s.technician && s.technician.toLowerCase().includes(q)
      )
      if (!hasTechnician) return false
    }

    if (activeQuickView.value !== 'all') {
      const todayDate = new Date()
      todayDate.setHours(0, 0, 0, 0)
      const tomorrow = new Date(todayDate)
      tomorrow.setDate(tomorrow.getDate() + 1)
      const dayAfterTomorrow = new Date(todayDate)
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 3)

      if (activeQuickView.value === 'today') {
        const delivery = new Date(order.deliveryDate)
        delivery.setHours(0, 0, 0, 0)
        if (delivery.getTime() !== todayDate.getTime()) return false
        if (order.status === 'completed') return false
      }
      if (activeQuickView.value === 'overdue') {
        const delivery = new Date(order.deliveryDate)
        delivery.setHours(0, 0, 0, 0)
        if (delivery >= todayDate) return false
        if (order.status === 'completed') return false
      }
      if (activeQuickView.value === 'returning') {
        if (order.returnRecords.length === 0) return false
        const lastReturn = order.returnRecords[order.returnRecords.length - 1]
        if (lastReturn.completedAt) return false
      }
      if (activeQuickView.value === 'urgent') {
        if (order.priority === 'standard') return false
      }
      if (activeQuickView.value === 'mytasks') {
        if (!myTechnicianName.value.trim()) return false
        const q = myTechnicianName.value.toLowerCase()
        const currentEntry = order.stageHistory.find(
          (s) => s.stage === order.currentStage && !s.completedAt
        )
        if (!currentEntry || !currentEntry.technician) return false
        if (!currentEntry.technician.toLowerCase().includes(q)) return false
      }
    }

    return true
  }).sort((a, b) => {
    let result = 0
    const sf = sortField.value
    const so = sortOrder.value
    const multiplier = so === 'asc' ? 1 : -1

    if (sf === 'priority') {
      const priorityOrder: Record<string, number> = { stat: 0, urgent: 1, standard: 2 }
      result = priorityOrder[a.priority] - priorityOrder[b.priority]
      if (result === 0) {
        result = new Date(a.deliveryDate).getTime() - new Date(b.deliveryDate).getTime()
      }
      return result * multiplier
    }

    if (sf === 'deliveryDate') {
      result = new Date(a.deliveryDate).getTime() - new Date(b.deliveryDate).getTime()
      return result * multiplier
    }

    if (sf === 'createdAt') {
      result = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      return result * multiplier
    }

    if (sf === 'amount') {
      const aVal = a.totalAmount ?? 0
      const bVal = b.totalAmount ?? 0
      result = aVal - bVal
      return result * multiplier
    }

    if (sf === 'clinic') {
      result = a.clinic.name.localeCompare(b.clinic.name, 'zh-CN')
      return result * multiplier
    }

    return 0
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
    stageFilter.value !== 'all' ||
    createdAtStart.value !== '' ||
    createdAtEnd.value !== '' ||
    deliveryDateStart.value !== '' ||
    deliveryDateEnd.value !== '' ||
    returnStatusFilter.value !== 'all' ||
    restorationTypeFilter.value !== 'all' ||
    materialFilter.value !== 'all' ||
    impressionMethodFilter.value !== 'all' ||
    amountMin.value !== '' ||
    amountMax.value !== '' ||
    doctorFilter.value.trim() !== '' ||
    technicianFilter.value.trim() !== '' ||
    activeQuickView.value !== 'all'
  )
})

const activeFiltersCount = computed(() => {
  return [
    statusFilter.value !== 'all',
    priorityFilter.value !== 'all',
    clinicFilter.value !== 'all',
    stageFilter.value !== 'all',
    createdAtStart.value !== '',
    createdAtEnd.value !== '',
    deliveryDateStart.value !== '',
    deliveryDateEnd.value !== '',
    returnStatusFilter.value !== 'all',
    restorationTypeFilter.value !== 'all',
    materialFilter.value !== 'all',
    impressionMethodFilter.value !== 'all',
    amountMin.value !== '',
    amountMax.value !== '',
    doctorFilter.value.trim() !== '',
    technicianFilter.value.trim() !== '',
    activeQuickView.value !== 'all',
  ].filter(Boolean).length
})

function clearFilters() {
  statusFilter.value = 'all'
  priorityFilter.value = 'all'
  clinicFilter.value = 'all'
  stageFilter.value = 'all'
  createdAtStart.value = ''
  createdAtEnd.value = ''
  deliveryDateStart.value = ''
  deliveryDateEnd.value = ''
  returnStatusFilter.value = 'all'
  restorationTypeFilter.value = 'all'
  materialFilter.value = 'all'
  impressionMethodFilter.value = 'all'
  amountMin.value = ''
  amountMax.value = ''
  doctorFilter.value = ''
  technicianFilter.value = ''
  activeQuickView.value = 'all'
}

function setQuickView(view: QuickViewKey) {
  activeQuickView.value = view
  if (view === 'mytasks' && !myTechnicianName.value.trim()) {
    showMyTasksConfig.value = true
  }
}

function toggleSortOrder() {
  sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
}

function setSortField(field: SortField) {
  sortField.value = field
  showSortDropdown.value = false
}

function loadSavedSchemes() {
  try {
    const raw = localStorage.getItem(FILTER_SCHEMES_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        savedSchemes.value = parsed
      }
    }
  } catch (e) {
    console.warn('Failed to load filter schemes:', e)
  }
}

function persistSchemes() {
  try {
    localStorage.setItem(
      FILTER_SCHEMES_STORAGE_KEY,
      JSON.stringify(savedSchemes.value)
    )
  } catch (e) {
    console.warn('Failed to save filter schemes:', e)
  }
}

function openSaveSchemeDialog() {
  schemeNameInput.value = ''
  showSaveSchemeDialog.value = true
}

function saveCurrentScheme() {
  if (!schemeNameInput.value.trim()) return
  const now = new Date().toISOString()
  const newScheme: SavedFilterScheme = {
    id: `FS-${Date.now()}`,
    name: schemeNameInput.value.trim(),
    createdAt: now,
    filters: {
      searchQuery: searchQuery.value,
      statusFilter: statusFilter.value,
      priorityFilter: priorityFilter.value,
      clinicFilter: clinicFilter.value,
      stageFilter: stageFilter.value,
      createdAtStart: createdAtStart.value,
      createdAtEnd: createdAtEnd.value,
      deliveryDateStart: deliveryDateStart.value,
      deliveryDateEnd: deliveryDateEnd.value,
      returnStatusFilter: returnStatusFilter.value,
      restorationTypeFilter: restorationTypeFilter.value,
      materialFilter: materialFilter.value,
      impressionMethodFilter: impressionMethodFilter.value,
      amountMin: amountMin.value,
      amountMax: amountMax.value,
      doctorFilter: doctorFilter.value,
      technicianFilter: technicianFilter.value,
    },
  }
  savedSchemes.value.unshift(newScheme)
  persistSchemes()
  showSaveSchemeDialog.value = false
}

function loadScheme(scheme: SavedFilterScheme) {
  searchQuery.value = scheme.filters.searchQuery
  statusFilter.value = scheme.filters.statusFilter
  priorityFilter.value = scheme.filters.priorityFilter
  clinicFilter.value = scheme.filters.clinicFilter
  stageFilter.value = scheme.filters.stageFilter
  createdAtStart.value = scheme.filters.createdAtStart
  createdAtEnd.value = scheme.filters.createdAtEnd
  deliveryDateStart.value = scheme.filters.deliveryDateStart
  deliveryDateEnd.value = scheme.filters.deliveryDateEnd
  returnStatusFilter.value = scheme.filters.returnStatusFilter
  restorationTypeFilter.value = scheme.filters.restorationTypeFilter
  materialFilter.value = scheme.filters.materialFilter
  impressionMethodFilter.value = scheme.filters.impressionMethodFilter
  amountMin.value = scheme.filters.amountMin
  amountMax.value = scheme.filters.amountMax
  doctorFilter.value = scheme.filters.doctorFilter
  technicianFilter.value = scheme.filters.technicianFilter
  activeQuickView.value = 'all'
  showSchemeDialog.value = false
}

function deleteScheme(id: string) {
  savedSchemes.value = savedSchemes.value.filter((s) => s.id !== id)
  persistSchemes()
}

function loadMyTechnicianName() {
  try {
    const name = localStorage.getItem(MY_TASKS_TECHNICIAN_KEY)
    if (name) {
      myTechnicianName.value = name
    }
  } catch (e) {
    console.warn('Failed to load technician name:', e)
  }
}

function saveMyTechnicianName() {
  if (!myTasksTechnicianInput.value.trim()) return
  myTechnicianName.value = myTasksTechnicianInput.value.trim()
  try {
    localStorage.setItem(MY_TASKS_TECHNICIAN_KEY, myTechnicianName.value)
  } catch (e) {
    console.warn('Failed to save technician name:', e)
  }
  showMyTasksConfig.value = false
}

function exportToCSV() {
  if (filteredOrders.value.length === 0) return

  const headers = [
    '订单号',
    '创建日期',
    '诊所',
    '医生',
    '患者匿名码',
    '优先级',
    '状态',
    '当前阶段',
    '修复类型',
    '材料',
    '取模方式',
    '交付日期',
    '金额(元)',
    '返工次数',
    '分配技师',
  ]

  const rows = filteredOrders.value.map((order) => {
    const restorationTypes = Array.from(
      new Set(order.workItems.map((w) => RestorationTypeLabels[w.restorationType]))
    ).join('、')
    const materials = Array.from(
      new Set(order.workItems.map((w) => MaterialTypeLabels[w.material]))
    ).join('、')
    const currentTech = order.stageHistory.find(
      (s) => s.stage === order.currentStage && !s.completedAt
    )?.technician || ''

    return [
      order.orderNumber,
      new Date(order.createdAt).toLocaleDateString('zh-CN'),
      order.clinic.name,
      order.doctorName,
      order.patient.anonymousCode,
      PriorityLabels[order.priority],
      OrderStatusLabels[order.status],
      ProcessingStages.find((s) => s.stage === order.currentStage)?.label || '',
      restorationTypes,
      materials,
      ImpressionMethodLabels[order.impressionMethod],
      new Date(order.deliveryDate).toLocaleDateString('zh-CN'),
      order.totalAmount !== undefined ? order.totalAmount.toFixed(2) : '',
      order.returnRecords.length.toString(),
      currentTech,
    ]
  })

  const escapeCSV = (val: string | number) => {
    const str = String(val ?? '')
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  const csvContent =
    '\uFEFF' +
    [headers, ...rows]
      .map((row) => row.map(escapeCSV).join(','))
      .join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  const now = new Date()
  const timestamp = `${now.getFullYear()}${(now.getMonth() + 1)
    .toString()
    .padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}_${now
    .getHours()
    .toString()
    .padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`
  link.setAttribute('download', `订单导出_${timestamp}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

const sortFieldLabels: Record<SortField, string> = {
  priority: '优先级',
  deliveryDate: '交付日期',
  createdAt: '创建时间',
  amount: '订单金额',
  clinic: '诊所名称',
}

onMounted(() => {
  loadSavedSchemes()
  loadMyTechnicianName()
})

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

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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

    <div class="mb-4 flex flex-wrap gap-2">
      <button
        class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all"
        :class="activeQuickView === 'all'
          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'"
        @click="setQuickView('all')"
      >
        <ClipboardList class="w-3.5 h-3.5" />
        全部订单
      </button>
      <button
        class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all"
        :class="activeQuickView === 'today'
          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'"
        @click="setQuickView('today')"
      >
        <CalendarCheck class="w-3.5 h-3.5" />
        今日交付
        <span class="ml-0.5 px-1 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[10px] font-bold"
          :class="activeQuickView === 'today' ? 'bg-white/20 text-white' : ''">
          {{ stats.dueToday }}
        </span>
      </button>
      <button
        class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all"
        :class="activeQuickView === 'overdue'
          ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'"
        @click="setQuickView('overdue')"
      >
        <AlertTriangle class="w-3.5 h-3.5" />
        即将逾期
        <span class="ml-0.5 px-1 py-0.5 rounded text-[10px] font-bold"
          :class="activeQuickView === 'overdue' ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-700'">
          {{ stats.overdue }}
        </span>
      </button>
      <button
        class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all"
        :class="activeQuickView === 'returning'
          ? 'bg-orange-600 text-white border-orange-600 shadow-sm'
          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'"
        @click="setQuickView('returning')"
      >
        <Wrench class="w-3.5 h-3.5" />
        返工处理中
      </button>
      <button
        class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all"
        :class="activeQuickView === 'urgent'
          ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'"
        @click="setQuickView('urgent')"
      >
        <Flame class="w-3.5 h-3.5" />
        仅看加急单
      </button>
      <button
        class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all"
        :class="activeQuickView === 'mytasks'
          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'"
        @click="setQuickView('mytasks')"
      >
        <Eye class="w-3.5 h-3.5" />
        仅看我的任务
        <template v-if="myTechnicianName">
          <span class="ml-0.5 text-[10px] opacity-80 truncate max-w-[60px]">
            ({{ myTechnicianName }})
          </span>
        </template>
      </button>
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

        <div class="relative inline-block">
          <button
            class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            @click="showSortDropdown = !showSortDropdown"
          >
            <ArrowUpDown class="w-4 h-4" />
            {{ sortFieldLabels[sortField] }}
            <span class="text-xs text-slate-400">
              ({{ sortOrder === 'asc' ? '升序' : '降序' }})
            </span>
          </button>
          <div
            v-if="showSortDropdown"
            class="absolute right-0 top-full mt-1 w-56 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-30"
          >
            <button
              v-for="(label, key) in sortFieldLabels"
              :key="key"
              class="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-slate-50 transition-colors"
              :class="sortField === key ? 'text-blue-600 bg-blue-50/50' : 'text-slate-700'"
              @click="setSortField(key as SortField)"
            >
              <span>{{ label }}</span>
              <div class="flex items-center gap-1">
                <button
                  v-if="sortField === key"
                  class="p-0.5 rounded hover:bg-slate-200 transition-colors"
                  @click.stop="toggleSortOrder()"
                >
                  <ArrowUpDown class="w-3.5 h-3.5 text-blue-600" />
                </button>
              </div>
            </button>
          </div>
        </div>

        <button
          class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          @click="showSchemeDialog = true"
        >
          <FolderOpen class="w-4 h-4" />
          方案
          <span
            v-if="savedSchemes.length > 0"
            class="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 text-xs font-bold bg-slate-100 text-slate-600 rounded-full"
          >
            {{ savedSchemes.length }}
          </span>
        </button>

        <button
          class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          :disabled="filteredOrders.length === 0"
          :class="{ 'opacity-50 cursor-not-allowed': filteredOrders.length === 0 }"
          @click="exportToCSV"
        >
          <Download class="w-4 h-4" />
          导出
        </button>

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
            v-if="activeFiltersCount > 0"
            class="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 text-xs font-bold bg-blue-600 text-white rounded-full"
          >
            {{ activeFiltersCount }}
          </span>
        </button>
      </div>

      <div
        v-if="showFilters"
        class="mt-4 pt-4 border-t border-slate-100 space-y-4"
      >
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1.5">
              返工状态
            </label>
            <select
              v-model="returnStatusFilter"
              class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">全部</option>
              <option value="none">无返工</option>
              <option value="returned">有返工记录</option>
              <option value="processing">返工处理中</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1.5">
              修复类型
            </label>
            <select
              v-model="restorationTypeFilter"
              class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">全部类型</option>
              <option
                v-for="(label, key) in RestorationTypeLabels"
                :key="key"
                :value="key"
              >
                {{ label }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1.5">
              材料
            </label>
            <select
              v-model="materialFilter"
              class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">全部材料</option>
              <option
                v-for="(label, key) in MaterialTypeLabels"
                :key="key"
                :value="key"
              >
                {{ label }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1.5">
              取模方式
            </label>
            <select
              v-model="impressionMethodFilter"
              class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">全部方式</option>
              <option
                v-for="(label, key) in ImpressionMethodLabels"
                :key="key"
                :value="key"
              >
                {{ label }}
              </option>
            </select>
          </div>
        </div>

        <button
          class="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
          @click="showAdvancedFilters = !showAdvancedFilters"
        >
          {{ showAdvancedFilters ? '收起' : '展开' }}高级筛选
          <ChevronRight
            class="w-3.5 h-3.5 transition-transform"
            :class="{ 'rotate-90': showAdvancedFilters }"
          />
        </button>

        <div
          v-if="showAdvancedFilters"
          class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2 border-t border-slate-100"
        >
          <div class="lg:col-span-2">
            <label class="block text-xs font-medium text-slate-600 mb-1.5">
              创建时间区间
            </label>
            <div class="flex items-center gap-2">
              <input
                v-model="createdAtStart"
                type="date"
                class="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <span class="text-slate-400 text-xs">至</span>
              <input
                v-model="createdAtEnd"
                type="date"
                class="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div class="lg:col-span-2">
            <label class="block text-xs font-medium text-slate-600 mb-1.5">
              交付日期区间
            </label>
            <div class="flex items-center gap-2">
              <input
                v-model="deliveryDateStart"
                type="date"
                class="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <span class="text-slate-400 text-xs">至</span>
              <input
                v-model="deliveryDateEnd"
                type="date"
                class="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1.5">
              医生姓名
            </label>
            <input
              v-model="doctorFilter"
              type="text"
              placeholder="输入医生姓名搜索"
              class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-400"
            />
          </div>

          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1.5">
              技师姓名
            </label>
            <input
              v-model="technicianFilter"
              type="text"
              placeholder="输入技师姓名搜索"
              class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-400"
            />
          </div>

          <div class="lg:col-span-2">
            <label class="block text-xs font-medium text-slate-600 mb-1.5">
              金额区间（元）
            </label>
            <div class="flex items-center gap-2">
              <input
                v-model="amountMin"
                type="number"
                min="0"
                step="0.01"
                placeholder="最低金额"
                class="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-400"
              />
              <span class="text-slate-400 text-xs">至</span>
              <input
                v-model="amountMax"
                type="number"
                min="0"
                step="0.01"
                placeholder="最高金额"
                class="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-400"
              />
            </div>
          </div>
        </div>

        <div class="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div class="flex items-center gap-2">
            <button
              class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
              @click="openSaveSchemeDialog"
            >
              <Save class="w-3.5 h-3.5" />
              保存当前方案
            </button>
            <button
              v-if="hasActiveFilters"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              @click="clearFilters"
            >
              <RotateCcw class="w-3.5 h-3.5" />
              清除全部条件
            </button>
          </div>
          <div
            class="text-xs text-slate-500"
          >
            已激活 <span class="font-semibold text-slate-700">{{ activeFiltersCount }}</span> 个筛选条件
          </div>
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
      <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div class="text-sm text-slate-600 flex items-center gap-2">
          共
          <span class="font-semibold text-slate-800 text-lg">
            {{ filteredOrders.length }}
          </span>
          条订单
          <span v-if="allOrders.length !== filteredOrders.length" class="text-xs text-slate-400">
            / 总 {{ allOrders.length }} 条
          </span>
        </div>
        <div class="flex items-center gap-2">
          <div class="relative inline-block">
            <button
              class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              @click="showSortDropdown = !showSortDropdown"
            >
              <ArrowUpDown class="w-3.5 h-3.5" />
              排序：{{ sortFieldLabels[sortField] }}
              <span class="text-slate-400">
                ({{ sortOrder === 'asc' ? '升' : '降' }})
              </span>
            </button>
            <div
              v-if="showSortDropdown"
              class="absolute right-0 top-full mt-1 w-52 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-30"
            >
              <button
                v-for="(label, key) in sortFieldLabels"
                :key="key"
                class="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-slate-50 transition-colors"
                :class="sortField === key ? 'text-blue-600 bg-blue-50/50' : 'text-slate-700'"
                @click="setSortField(key as SortField)"
              >
                <span>{{ label }}</span>
                <button
                  v-if="sortField === key"
                  class="p-0.5 rounded hover:bg-slate-200 transition-colors"
                  @click.stop="toggleSortOrder()"
                >
                  <ArrowUpDown class="w-3.5 h-3.5 text-blue-600" />
                </button>
              </button>
            </div>
          </div>
          <button
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            :disabled="filteredOrders.length === 0"
            :class="{ 'opacity-50 cursor-not-allowed': filteredOrders.length === 0 }"
            @click="exportToCSV"
          >
            <Download class="w-3.5 h-3.5" />
            导出
          </button>
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
        <div class="flex items-center justify-center gap-3">
          <button
            v-if="searchQuery || hasActiveFilters"
            class="text-sm font-medium text-blue-600 hover:text-blue-700"
            @click="refreshData"
          >
            重置所有条件
          </button>
        </div>
      </div>
    </template>

    <Teleport to="body">
      <div
        v-if="showSchemeDialog"
        class="fixed inset-0 z-50 flex items-center justify-center"
      >
        <div
          class="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
          @click="showSchemeDialog = false"
        ></div>
        <div class="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
          <div class="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 class="text-base font-semibold text-slate-800">
              筛选方案管理
            </h3>
            <button
              class="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              @click="showSchemeDialog = false"
            >
              <X class="w-4 h-4" />
            </button>
          </div>
          <div class="p-5 max-h-[60vh] overflow-y-auto">
            <div v-if="savedSchemes.length === 0" class="py-8 text-center">
              <div class="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-100 flex items-center justify-center">
                <FolderOpen class="w-6 h-6 text-slate-400" />
              </div>
              <p class="text-sm text-slate-500">暂无保存的筛选方案</p>
              <p class="text-xs text-slate-400 mt-1">在筛选面板中可将当前条件保存为方案</p>
            </div>
            <div v-else class="space-y-2">
              <div
                v-for="scheme in savedSchemes"
                :key="scheme.id"
                class="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-100/50 transition-all group"
              >
                <div class="flex-1 min-w-0 cursor-pointer" @click="loadScheme(scheme)">
                  <div class="text-sm font-medium text-slate-800 truncate">
                    {{ scheme.name }}
                  </div>
                  <div class="text-xs text-slate-500 mt-0.5">
                    创建于 {{ new Date(scheme.createdAt).toLocaleDateString('zh-CN') }}
                  </div>
                </div>
                <div class="flex items-center gap-1 ml-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    class="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                    title="删除方案"
                    @click="deleteScheme(scheme.id)"
                  >
                    <Trash2 class="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div class="px-5 py-3 border-t border-slate-100 flex items-center justify-end gap-2 bg-slate-50">
            <button
              class="px-4 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              @click="showSchemeDialog = false"
            >
              关闭
            </button>
            <button
              class="inline-flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              @click="showSchemeDialog = false; openSaveSchemeDialog()"
            >
              <Save class="w-3.5 h-3.5" />
              保存新方案
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div
        v-if="showSaveSchemeDialog"
        class="fixed inset-0 z-50 flex items-center justify-center"
      >
        <div
          class="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
          @click="showSaveSchemeDialog = false"
        ></div>
        <div class="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
          <div class="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 class="text-base font-semibold text-slate-800">
              保存筛选方案
            </h3>
            <button
              class="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              @click="showSaveSchemeDialog = false"
            >
              <X class="w-4 h-4" />
            </button>
          </div>
          <div class="p-5 space-y-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1.5">
                方案名称
              </label>
              <input
                v-model="schemeNameInput"
                type="text"
                placeholder="例如：本周加急氧化锆订单"
                class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-400"
                @keyup.enter="saveCurrentScheme"
              />
            </div>
            <div class="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs text-slate-500 space-y-1">
              <div>将保存以下条件：</div>
              <div class="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 font-mono">
                <div v-if="searchQuery">搜索: {{ searchQuery }}</div>
                <div v-if="statusFilter !== 'all'">状态: {{ OrderStatusLabels[statusFilter as OrderStatus] }}</div>
                <div v-if="priorityFilter !== 'all'">优先级: {{ PriorityLabels[priorityFilter as OrderPriority] }}</div>
                <div v-if="clinicFilter !== 'all'">诊所: {{ MockClinics.find(c => c.id === clinicFilter)?.name }}</div>
                <div v-if="stageFilter !== 'all'">阶段: {{ ProcessingStages.find(s => s.stage === stageFilter)?.label }}</div>
                <div v-if="activeFiltersCount > 4">...及其他 {{ activeFiltersCount - 4 }} 项</div>
              </div>
              <div v-if="activeFiltersCount === 0" class="text-amber-600">
                当前无任何激活的筛选条件
              </div>
            </div>
          </div>
          <div class="px-5 py-3 border-t border-slate-100 flex items-center justify-end gap-2 bg-slate-50">
            <button
              class="px-4 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              @click="showSaveSchemeDialog = false"
            >
              取消
            </button>
            <button
              class="px-4 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
              :disabled="!schemeNameInput.trim() || activeFiltersCount === 0"
              @click="saveCurrentScheme"
            >
              保存
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div
        v-if="showMyTasksConfig"
        class="fixed inset-0 z-50 flex items-center justify-center"
      >
        <div
          class="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
          @click="showMyTasksConfig = false"
        ></div>
        <div class="relative bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
          <div class="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 class="text-base font-semibold text-slate-800">
              配置"我的任务"
            </h3>
            <button
              class="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              @click="showMyTasksConfig = false"
            >
              <X class="w-4 h-4" />
            </button>
          </div>
          <div class="p-5 space-y-3">
            <div class="p-3 bg-indigo-50 rounded-lg border border-indigo-100">
              <p class="text-xs text-indigo-700">
                "仅看我的任务"视图将按当前加工阶段的技师姓名过滤订单。请输入您的姓名以启用。
              </p>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1.5">
                技师姓名
              </label>
              <input
                v-model="myTasksTechnicianInput"
                type="text"
                :placeholder="myTechnicianName || '例如：张师傅'"
                class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-slate-400"
                @keyup.enter="saveMyTechnicianName"
              />
            </div>
          </div>
          <div class="px-5 py-3 border-t border-slate-100 flex items-center justify-end gap-2 bg-slate-50">
            <button
              class="px-4 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              @click="showMyTasksConfig = false"
            >
              取消
            </button>
            <button
              class="px-4 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
              :disabled="!myTasksTechnicianInput.trim()"
              @click="saveMyTechnicianName"
            >
              保存并应用
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
