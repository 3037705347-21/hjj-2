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
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Trophy,
  Gauge,
  Target,
  Award,
  Users,
  Activity,
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
  ReworkProblemType,
  ReworkRootCause,
  ReworkResponsibility,
  ReworkSourceStage,
  ReworkStatus,
} from '../types'
import {
  OrderStatusLabels,
  PriorityLabels,
  ProcessingStages,
  RestorationTypeLabels,
  MaterialTypeLabels,
  ImpressionMethodLabels,
  ReworkProblemTypeLabels,
  ReworkRootCauseLabels,
  ReworkResponsibilityLabels,
  ReworkSourceStageLabels,
  ReworkStatusLabels,
} from '../types'
import { useOrders } from '../composables/useOrders'
import { useRoles, ROLE_STORAGE_KEY } from '../composables/useRoles'
import { cn } from '../lib/utils'

const router = useRouter()
const { orders: allOrders, getClinics } = useOrders()
const MockClinics = getClinics()

const {
  currentRole,
  filterOrdersByRole,
  canPerformAction,
  canViewField,
  getDashboardConfig,
  currentTechnicianName,
  setTechnicianName,
} = useRoles()

const dashboardConfig = computed(() => getDashboardConfig())

const roleFilteredOrders = computed(() => filterOrdersByRole(allOrders.value))

function handleRoleChange() {
  clearFilters()
  if (currentRole.value === 'technician') {
    activeQuickView.value = 'mytasks'
    if (!currentTechnicianName.value.trim()) {
      showMyTasksConfig.value = true
    }
  } else if (currentRole.value === 'clinic') {
    activeQuickView.value = 'all'
  }
}

watch(currentRole, handleRoleChange)

function loadInitialViewMode(): 'kanban' | 'list' {
  try {
    const saved = localStorage.getItem(ROLE_STORAGE_KEY)
    if (saved === 'clinic') return 'list'
    if (saved === 'technician') return 'kanban'
  } catch (e) {}
  return 'kanban'
}

const viewMode = ref<'kanban' | 'list'>(loadInitialViewMode())

const searchQuery = ref('')
const showFilters = ref(false)
const statusFilter = ref<OrderStatus | 'all'>('all')
const priorityFilter = ref<OrderPriority | 'all'>('all')
const clinicFilter = ref<string>('all')
const stageFilter = ref<ProcessingStage | 'all'>('all')

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
const reworkProblemTypeFilter = ref<ReworkProblemType | 'all'>('all')
const reworkRootCauseFilter = ref<ReworkRootCause | 'all'>('all')
const reworkResponsibilityFilter = ref<ReworkResponsibility | 'all'>('all')
const reworkSourceStageFilter = ref<ReworkSourceStage | 'all'>('all')
const reworkStatusFilter = ref<ReworkStatus | 'all'>('all')
const reworkCompletedFilter = ref<'all' | 'completed' | 'incomplete'>('all')
const reworkTechnicianFilter = ref<string>('')
const reworkChargeableFilter = ref<'all' | 'yes' | 'no'>('all')

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
    reworkProblemTypeFilter: ReworkProblemType | 'all'
    reworkRootCauseFilter: ReworkRootCause | 'all'
    reworkResponsibilityFilter: ReworkResponsibility | 'all'
    reworkSourceStageFilter: ReworkSourceStage | 'all'
    reworkStatusFilter: ReworkStatus | 'all'
    reworkCompletedFilter: 'all' | 'completed' | 'incomplete'
    reworkTechnicianFilter: string
    reworkChargeableFilter: 'all' | 'yes' | 'no'
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
  const sourceOrders = roleFilteredOrders.value
  const total = sourceOrders.length
  const inProgress = sourceOrders.filter(
    (o) => o.status === 'in-progress' || o.status === 'pending'
  ).length
  const urgent = sourceOrders.filter(
    (o) =>
      (o.priority === 'urgent' || o.priority === 'stat') &&
      o.status !== 'completed'
  ).length
  const dueToday = sourceOrders.filter((o) => {
    const d = new Date(o.deliveryDate)
    return (
      d.toDateString() === today.toDateString() && o.status !== 'completed'
    )
  }).length
  const overdue = sourceOrders.filter((o) => {
    const d = new Date(o.deliveryDate)
    return d < today && o.status !== 'completed'
  }).length
  const completedToday = sourceOrders.filter((o) => {
    const delivered = o.stageHistory.find((s) => s.stage === 'delivered')
    if (!delivered?.completedAt) return false
    const d = new Date(delivered.completedAt)
    return d.toDateString() === today.toDateString()
  }).length
  const returned = sourceOrders.filter((o) => o.returnRecords.length > 0).length

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

type TimeRangeView = 'today' | 'week' | 'month'
const activeTimeView = ref<TimeRangeView>('week')

function getDateRange(view: TimeRangeView): { start: Date; end: Date } {
  const now = new Date()
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
  let start: Date

  if (view === 'today') {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
  } else if (view === 'week') {
    const day = now.getDay()
    const diff = now.getDate() - day + (day === 0 ? -6 : 1)
    start = new Date(now.getFullYear(), now.getMonth(), diff, 0, 0, 0, 0)
  } else {
    start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
  }

  return { start, end }
}

function isInRange(dateStr: string, range: { start: Date; end: Date }): boolean {
  const d = new Date(dateStr)
  return d >= range.start && d <= range.end
}

const timeRange = computed(() => getDateRange(activeTimeView.value))

const rangeOrders = computed(() => {
  return roleFilteredOrders.value.filter((o) =>
    isInRange(o.createdAt, timeRange.value)
  )
})

interface DailyTrendPoint {
  date: string
  label: string
  count: number
  completed: number
}

const orderTrendData = computed<DailyTrendPoint[]>(() => {
  const result: DailyTrendPoint[] = []
  const days = 7
  const now = new Date()

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    const label = `${d.getMonth() + 1}/${d.getDate()}`

    const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0)
    const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999)

    const count = roleFilteredOrders.value.filter((o) => {
      const created = new Date(o.createdAt)
      return created >= dayStart && created <= dayEnd
    }).length

    const completed = roleFilteredOrders.value.filter((o) => {
      const delivered = o.stageHistory.find((s) => s.stage === 'delivered')
      if (!delivered?.completedAt) return false
      const cd = new Date(delivered.completedAt)
      return cd >= dayStart && cd <= dayEnd
    }).length

    result.push({ date: dateStr, label, count, completed })
  }

  return result
})

const maxTrendValue = computed(() => {
  const max = orderTrendData.value.reduce(
    (acc, d) => Math.max(acc, d.count, d.completed),
    0
  )
  return max === 0 ? 1 : max
})

interface StageCountItem {
  stage: string
  label: string
  count: number
  colorClass: string
}

const stageInProgressData = computed<StageCountItem[]>(() => {
  const stageColors: Record<string, string> = {
    'received': 'bg-slate-500',
    'model-scanning': 'bg-cyan-500',
    'wax-up': 'bg-violet-500',
    'casting': 'bg-amber-500',
    'porcelain': 'bg-pink-500',
    'glazing': 'bg-teal-500',
    'finishing': 'bg-indigo-500',
    'quality-check': 'bg-rose-500',
    'shipped': 'bg-blue-500',
    'delivered': 'bg-emerald-500',
  }

  const counts: Record<string, number> = {}
  ProcessingStages.forEach((s) => (counts[s.stage] = 0))

  rangeOrders.value
    .filter((o) => o.status !== 'completed')
    .forEach((o) => {
      if (counts[o.currentStage] !== undefined) {
        counts[o.currentStage]++
      }
    })

  return ProcessingStages.map((s) => ({
    stage: s.stage,
    label: s.label,
    count: counts[s.stage] || 0,
    colorClass: stageColors[s.stage] || 'bg-slate-500',
  })).filter((s) => s.count > 0 || ['received', 'model-scanning', 'wax-up', 'casting', 'porcelain', 'quality-check'].includes(s.stage))
})

const maxStageCount = computed(() => {
  const max = stageInProgressData.value.reduce((acc, s) => Math.max(acc, s.count), 0)
  return max === 0 ? 1 : max
})

interface ReworkCauseItem {
  cause: string
  label: string
  count: number
  percentage: number
}

const reworkCauseData = computed<ReworkCauseItem[]>(() => {
  const reworkOrders = rangeOrders.value.filter((o) => o.returnRecords.length > 0)
  const totalReworks = reworkOrders.reduce(
    (acc, o) => acc + o.returnRecords.length,
    0
  )

  const causeCounts: Record<string, number> = {}
  Object.keys(ReworkRootCauseLabels).forEach((k) => (causeCounts[k] = 0))

  reworkOrders.forEach((o) => {
    o.returnRecords.forEach((r) => {
      if (causeCounts[r.rootCause] !== undefined) {
        causeCounts[r.rootCause]++
      }
    })
  })

  return Object.entries(causeCounts)
    .filter(([, count]) => count > 0)
    .map(([cause, count]) => ({
      cause,
      label: ReworkRootCauseLabels[cause as keyof typeof ReworkRootCauseLabels],
      count,
      percentage: totalReworks === 0 ? 0 : Math.round((count / totalReworks) * 100),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)
})

const reworkCausePalette = [
  'bg-rose-500',
  'bg-amber-500',
  'bg-cyan-500',
  'bg-violet-500',
  'bg-teal-500',
  'bg-pink-500',
]

interface ClinicRankingItem {
  clinicId: string
  clinicName: string
  count: number
  amount: number
  percentage: number
}

const clinicRankingData = computed<ClinicRankingItem[]>(() => {
  const map = new Map<string, ClinicRankingItem>()
  const total = rangeOrders.value.length

  rangeOrders.value.forEach((o) => {
    const existing = map.get(o.clinicId)
    if (existing) {
      existing.count++
      existing.amount += o.totalAmount || 0
    } else {
      map.set(o.clinicId, {
        clinicId: o.clinicId,
        clinicName: o.clinic.name,
        count: 1,
        amount: o.totalAmount || 0,
        percentage: 0,
      })
    }
  })

  const result = Array.from(map.values())
    .map((item) => ({
      ...item,
      percentage: total === 0 ? 0 : Math.round((item.count / total) * 100),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)

  return result
})

const maxClinicCount = computed(() => {
  const max = clinicRankingData.value.reduce((acc, c) => Math.max(acc, c.count), 0)
  return max === 0 ? 1 : max
})

interface TechnicianEfficiencyItem {
  name: string
  completedCount: number
  avgHours: number
  reworkRate: number
}

const technicianRankingData = computed<TechnicianEfficiencyItem[]>(() => {
  const techStats = new Map<
    string,
    { completed: number; totalHours: number; reworkCount: number; totalCount: number }
  >()

  rangeOrders.value.forEach((o) => {
    const seenTechs = new Set<string>()
    o.stageHistory.forEach((s) => {
      if (s.technician && s.completedAt) {
        const start = new Date(s.startedAt).getTime()
        const end = new Date(s.completedAt).getTime()
        const hours = Math.max(1, Math.round((end - start) / 3600000))

        const existing = techStats.get(s.technician)
        if (existing) {
          existing.completed++
          existing.totalHours += hours
          if (!seenTechs.has(s.technician)) {
            existing.totalCount++
            seenTechs.add(s.technician)
          }
        } else {
          techStats.set(s.technician, {
            completed: 1,
            totalHours: hours,
            reworkCount: 0,
            totalCount: 1,
          })
          seenTechs.add(s.technician)
        }
      }
    })

    if (o.returnRecords.length > 0) {
      o.returnRecords.forEach((r) => {
        if (r.responsibleTechnician) {
          const tech = techStats.get(r.responsibleTechnician)
          if (tech) {
            tech.reworkCount++
          } else {
            techStats.set(r.responsibleTechnician, {
              completed: 0,
              totalHours: 0,
              reworkCount: 1,
              totalCount: 1,
            })
          }
        }
      })
    }
  })

  return Array.from(techStats.entries())
    .map(([name, stats]) => ({
      name,
      completedCount: stats.completed,
      avgHours: stats.completed === 0 ? 0 : Math.round((stats.totalHours / stats.completed) * 10) / 10,
      reworkRate: stats.totalCount === 0 ? 0 : Math.round((stats.reworkCount / stats.totalCount) * 100),
    }))
    .filter((t) => t.completedCount > 0)
    .sort((a, b) => b.completedCount - a.completedCount)
    .slice(0, 6)
})

const maxTechCompleted = computed(() => {
  const max = technicianRankingData.value.reduce((acc, t) => Math.max(acc, t.completedCount), 0)
  return max === 0 ? 1 : max
})

interface DeliveryRateData {
  onTime: number
  late: number
  pending: number
  total: number
  rate: number
}

const deliveryRateData = computed<DeliveryRateData>(() => {
  const source = rangeOrders.value
  const total = source.length

  let onTime = 0
  let late = 0
  let pending = 0

  source.forEach((o) => {
    const delivered = o.stageHistory.find((s) => s.stage === 'delivered')
    if (delivered?.completedAt) {
      const completed = new Date(delivered.completedAt)
      const delivery = new Date(o.deliveryDate)
      delivery.setHours(23, 59, 59, 999)
      if (completed <= delivery) {
        onTime++
      } else {
        late++
      }
    } else if (o.status === 'completed') {
      const delivery = new Date(o.deliveryDate)
      delivery.setHours(23, 59, 59, 999)
      if (new Date() <= delivery) {
        onTime++
      } else {
        late++
      }
    } else {
      pending++
    }
  })

  const evaluated = onTime + late
  const rate = evaluated === 0 ? (total === 0 ? 0 : 100) : Math.round((onTime / evaluated) * 100)

  return { onTime, late, pending, total, rate }
})

const totalReworkCount = computed(() => {
  return rangeOrders.value.reduce(
    (acc, o) => acc + o.returnRecords.length,
    0
  )
})

const averageTurnaroundHours = computed(() => {
  const completed = rangeOrders.value.filter((o) => {
    const delivered = o.stageHistory.find((s) => s.stage === 'delivered')
    return delivered?.completedAt
  })

  if (completed.length === 0) return 0

  const totalHours = completed.reduce((acc, o) => {
    const start = new Date(o.createdAt).getTime()
    const delivered = o.stageHistory.find((s) => s.stage === 'delivered')!
    const end = new Date(delivered.completedAt!).getTime()
    return acc + (end - start) / 3600000
  }, 0)

  return Math.round((totalHours / completed.length) * 10) / 10
})

function setTimeView(view: TimeRangeView) {
  activeTimeView.value = view
}

function scrollToFilters() {
  const el = document.querySelector('[data-filter-section]')
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

function applyStatFilter(type: string, payload?: any) {
  clearFilters()

  switch (type) {
    case 'in-progress':
      statusFilter.value = 'in-progress'
      break
    case 'urgent':
      priorityFilter.value = 'urgent'
      break
    case 'due-today':
      activeQuickView.value = 'today'
      break
    case 'overdue':
      activeQuickView.value = 'overdue'
      break
    case 'returned':
      activeQuickView.value = 'returning'
      break
    case 'completed-today':
      statusFilter.value = 'completed'
      deliveryDateStart.value = today.toISOString().split('T')[0]
      deliveryDateEnd.value = today.toISOString().split('T')[0]
      break
    case 'stage':
      stageFilter.value = payload as ProcessingStage
      break
    case 'clinic':
      clinicFilter.value = payload as string
      break
    case 'rework-cause':
      reworkRootCauseFilter.value = payload as ReworkRootCause
      break
    case 'technician':
      technicianFilter.value = payload as string
      break
    case 'late-delivery':
      deliveryDateEnd.value = today.toISOString().split('T')[0]
      statusFilter.value = 'completed'
      break
    case 'on-time-delivery':
      statusFilter.value = 'completed'
      break
  }

  showFilters.value = true
  scrollToFilters()
}

const filteredOrders = computed(() => {
  return roleFilteredOrders.value.filter((order) => {
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

    if (reworkProblemTypeFilter.value !== 'all') {
      if (order.returnRecords.length === 0) return false
      const hasMatch = order.returnRecords.some(
        (r) => r.problemType === reworkProblemTypeFilter.value
      )
      if (!hasMatch) return false
    }

    if (reworkRootCauseFilter.value !== 'all') {
      if (order.returnRecords.length === 0) return false
      const hasMatch = order.returnRecords.some(
        (r) => r.rootCause === reworkRootCauseFilter.value
      )
      if (!hasMatch) return false
    }

    if (reworkResponsibilityFilter.value !== 'all') {
      if (order.returnRecords.length === 0) return false
      const hasMatch = order.returnRecords.some(
        (r) => r.responsibility === reworkResponsibilityFilter.value
      )
      if (!hasMatch) return false
    }

    if (reworkSourceStageFilter.value !== 'all') {
      if (order.returnRecords.length === 0) return false
      const hasMatch = order.returnRecords.some(
        (r) => r.sourceStage === reworkSourceStageFilter.value
      )
      if (!hasMatch) return false
    }

    if (reworkStatusFilter.value !== 'all') {
      if (order.returnRecords.length === 0) return false
      const hasMatch = order.returnRecords.some(
        (r) => r.status === reworkStatusFilter.value
      )
      if (!hasMatch) return false
    }

    if (reworkCompletedFilter.value === 'completed') {
      if (order.returnRecords.length === 0) return false
      const allClosed = order.returnRecords.every((r) => r.status === 'closed')
      if (!allClosed) return false
    }
    if (reworkCompletedFilter.value === 'incomplete') {
      if (order.returnRecords.length === 0) return false
      const hasActive = order.returnRecords.some((r) => r.status !== 'closed')
      if (!hasActive) return false
    }

    if (reworkTechnicianFilter.value.trim()) {
      if (order.returnRecords.length === 0) return false
      const q = reworkTechnicianFilter.value.toLowerCase()
      const hasMatch = order.returnRecords.some(
        (r) =>
          (r.responsibleTechnician && r.responsibleTechnician.toLowerCase().includes(q)) ||
          (r.acceptedBy && r.acceptedBy.toLowerCase().includes(q)) ||
          (r.rectifiedBy && r.rectifiedBy.toLowerCase().includes(q)) ||
          (r.recheckedBy && r.recheckedBy.toLowerCase().includes(q)) ||
          (r.closedBy && r.closedBy.toLowerCase().includes(q))
      )
      if (!hasMatch) return false
    }

    if (reworkChargeableFilter.value === 'yes') {
      if (order.returnRecords.length === 0) return false
      const hasChargeable = order.returnRecords.some((r) => r.chargeable)
      if (!hasChargeable) return false
    }
    if (reworkChargeableFilter.value === 'no') {
      if (order.returnRecords.length === 0) return false
      const allFree = order.returnRecords.every((r) => !r.chargeable)
      if (!allFree) return false
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
        if (!currentTechnicianName.value.trim()) return false
        const q = currentTechnicianName.value.toLowerCase()
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
    reworkProblemTypeFilter.value !== 'all' ||
    reworkRootCauseFilter.value !== 'all' ||
    reworkResponsibilityFilter.value !== 'all' ||
    reworkSourceStageFilter.value !== 'all' ||
    reworkStatusFilter.value !== 'all' ||
    reworkCompletedFilter.value !== 'all' ||
    reworkTechnicianFilter.value.trim() !== '' ||
    reworkChargeableFilter.value !== 'all' ||
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
    reworkProblemTypeFilter.value !== 'all',
    reworkRootCauseFilter.value !== 'all',
    reworkResponsibilityFilter.value !== 'all',
    reworkSourceStageFilter.value !== 'all',
    reworkStatusFilter.value !== 'all',
    reworkCompletedFilter.value !== 'all',
    reworkTechnicianFilter.value.trim() !== '',
    reworkChargeableFilter.value !== 'all',
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
  reworkProblemTypeFilter.value = 'all'
  reworkRootCauseFilter.value = 'all'
  reworkResponsibilityFilter.value = 'all'
  reworkSourceStageFilter.value = 'all'
  reworkStatusFilter.value = 'all'
  reworkCompletedFilter.value = 'all'
  reworkTechnicianFilter.value = ''
  reworkChargeableFilter.value = 'all'
  activeQuickView.value = 'all'
}

handleRoleChange()

function setQuickView(view: QuickViewKey) {
  activeQuickView.value = view
  if (view === 'mytasks' && !currentTechnicianName.value.trim()) {
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
      reworkProblemTypeFilter: reworkProblemTypeFilter.value,
      reworkRootCauseFilter: reworkRootCauseFilter.value,
      reworkResponsibilityFilter: reworkResponsibilityFilter.value,
      reworkSourceStageFilter: reworkSourceStageFilter.value,
      reworkStatusFilter: reworkStatusFilter.value,
      reworkCompletedFilter: reworkCompletedFilter.value,
      reworkTechnicianFilter: reworkTechnicianFilter.value,
      reworkChargeableFilter: reworkChargeableFilter.value,
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
  reworkProblemTypeFilter.value = scheme.filters.reworkProblemTypeFilter ?? 'all'
  reworkRootCauseFilter.value = scheme.filters.reworkRootCauseFilter ?? 'all'
  reworkResponsibilityFilter.value = scheme.filters.reworkResponsibilityFilter ?? 'all'
  reworkSourceStageFilter.value = scheme.filters.reworkSourceStageFilter ?? 'all'
  reworkStatusFilter.value = scheme.filters.reworkStatusFilter ?? 'all'
  reworkCompletedFilter.value = scheme.filters.reworkCompletedFilter ?? 'all'
  reworkTechnicianFilter.value = scheme.filters.reworkTechnicianFilter ?? ''
  reworkChargeableFilter.value = scheme.filters.reworkChargeableFilter ?? 'all'
  activeQuickView.value = 'all'
  showSchemeDialog.value = false
}

function deleteScheme(id: string) {
  savedSchemes.value = savedSchemes.value.filter((s) => s.id !== id)
  persistSchemes()
}

function loadMyTechnicianName() {
  myTechnicianName.value = currentTechnicianName.value
}

function saveMyTechnicianName() {
  if (!myTasksTechnicianInput.value.trim()) return
  const name = myTasksTechnicianInput.value.trim()
  setTechnicianName(name)
  myTechnicianName.value = name
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
            {{ dashboardConfig.title }}
          </h1>
          <p class="mt-1 text-sm text-slate-500">
            {{ dashboardConfig.subtitle }}
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
            v-if="canPerformAction('create')"
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
      <template v-if="currentRole === 'clinic'">
        <div class="cursor-pointer hover:shadow-lg transition-all" @click="applyStatFilter('in-progress')">
          <StatCard
            title="进行中订单"
            :value="stats.inProgress"
            :icon="PackageOpen"
            tone="primary"
            description="加工中"
          />
        </div>
        <div class="cursor-pointer hover:shadow-lg transition-all" @click="applyStatFilter('due-today')">
          <StatCard
            title="今日交付"
            :value="stats.dueToday"
            :icon="CalendarCheck"
            tone="primary"
            :description="'逾期: ' + stats.overdue + ' 单'"
          />
        </div>
        <div class="cursor-pointer hover:shadow-lg transition-all" @click="applyStatFilter('completed-today')">
          <StatCard
            title="已完成"
            :value="stats.completedToday"
            :icon="CheckCircle2"
            tone="success"
            description="今日交付"
          />
        </div>
        <div class="cursor-pointer hover:shadow-lg transition-all" @click="applyStatFilter('returned')">
          <StatCard
            title="问题订单"
            :value="stats.returned"
            :icon="AlertTriangle"
            tone="danger"
            description="返工处理中"
          />
        </div>
      </template>

      <template v-else-if="currentRole === 'technician'">
        <div class="cursor-pointer hover:shadow-lg transition-all" @click="setQuickView('mytasks')">
          <StatCard
            title="我的任务"
            :value="stats.total"
            :icon="Wrench"
            tone="primary"
            description="分配给我"
          />
        </div>
        <div class="cursor-pointer hover:shadow-lg transition-all" @click="applyStatFilter('in-progress')">
          <StatCard
            title="待处理"
            :value="stats.inProgress"
            :icon="Clock"
            tone="warning"
            description="待开始/进行中"
          />
        </div>
        <div class="cursor-pointer hover:shadow-lg transition-all" @click="applyStatFilter('due-today')">
          <StatCard
            title="今日需完成"
            :value="stats.dueToday"
            :icon="CalendarCheck"
            tone="primary"
            :description="'逾期: ' + stats.overdue + ' 单'"
          />
        </div>
        <div class="cursor-pointer hover:shadow-lg transition-all" @click="applyStatFilter('returned')">
          <StatCard
            title="返工任务"
            :value="stats.returned"
            :icon="RefreshCw"
            tone="danger"
            description="需特别注意"
          />
        </div>
      </template>

      <template v-else>
        <div class="cursor-pointer hover:shadow-lg transition-all" @click="applyStatFilter('in-progress')">
          <StatCard
            title="在制订单"
            :value="stats.inProgress"
            :icon="PackageOpen"
            tone="primary"
            description="总数 "
            :trend="'+' + stats.total"
          />
        </div>
        <div class="cursor-pointer hover:shadow-lg transition-all" @click="applyStatFilter('urgent')">
          <StatCard
            title="加急订单"
            :value="stats.urgent"
            :icon="AlertTriangle"
            tone="warning"
            description="需优先处理"
          />
        </div>
        <div class="cursor-pointer hover:shadow-lg transition-all" @click="applyStatFilter('due-today')">
          <StatCard
            title="今日交付"
            :value="stats.dueToday"
            :icon="CalendarCheck"
            tone="primary"
            :description="'逾期: ' + stats.overdue + ' 单'"
          />
        </div>
        <div class="cursor-pointer hover:shadow-lg transition-all" @click="applyStatFilter('returned')">
          <StatCard
            title="返工订单"
            :value="stats.returned"
            :icon="RefreshCw"
            tone="danger"
            description="质量问题追踪"
          />
        </div>
      </template>
    </div>

    <div class="mb-6 bg-white rounded-xl border border-slate-200 p-4">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
        <div class="flex items-center gap-3">
          <div class="p-2 bg-indigo-100 rounded-lg">
            <BarChart3 class="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h3 class="text-sm font-semibold text-slate-800">经营统计与趋势分析</h3>
            <p class="text-xs text-slate-500">
              共 {{ rangeOrders.length }} 单 | 返工 {{ totalReworkCount }} 次 | 平均交期 {{ averageTurnaroundHours }}h
            </p>
          </div>
        </div>
        <div class="inline-flex items-center p-1 bg-slate-100 rounded-lg">
          <button
            class="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-md transition-colors"
            :class="activeTimeView === 'today' ? 'bg-white text-slate-800 shadow-sm ring-1 ring-slate-200' : 'text-slate-600 hover:text-slate-800'"
            @click="setTimeView('today')"
          >
            今日
          </button>
          <button
            class="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-md transition-colors"
            :class="activeTimeView === 'week' ? 'bg-white text-slate-800 shadow-sm ring-1 ring-slate-200' : 'text-slate-600 hover:text-slate-800'"
            @click="setTimeView('week')"
          >
            本周
          </button>
          <button
            class="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-md transition-colors"
            :class="activeTimeView === 'month' ? 'bg-white text-slate-800 shadow-sm ring-1 ring-slate-200' : 'text-slate-600 hover:text-slate-800'"
            @click="setTimeView('month')"
          >
            本月
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div class="bg-slate-50/60 rounded-xl border border-slate-200/70 p-4 hover:border-blue-200 transition-colors">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-2">
              <div class="p-1.5 bg-blue-100 rounded-md">
                <Activity class="w-4 h-4 text-blue-600" />
              </div>
              <h4 class="text-sm font-semibold text-slate-800">近 7 天订单趋势</h4>
            </div>
            <div class="flex items-center gap-3 text-xs">
              <span class="flex items-center gap-1.5">
                <span class="w-2.5 h-2.5 rounded-sm bg-blue-500"></span>
                新增
              </span>
              <span class="flex items-center gap-1.5">
                <span class="w-2.5 h-2.5 rounded-sm bg-emerald-500"></span>
                完成
              </span>
            </div>
          </div>
          <div class="h-48 flex items-end justify-between gap-1.5 px-1">
            <div
              v-for="(d, idx) in orderTrendData"
              :key="idx"
              class="flex-1 flex flex-col items-center justify-end gap-1 min-w-0"
            >
              <div class="w-full flex items-end justify-center gap-0.5 h-36">
                <div
                  class="w-1/2 bg-blue-500 rounded-t-sm hover:bg-blue-600 transition-colors cursor-pointer relative group"
                  :style="{ height: `${(d.count / maxTrendValue) * 100}%`, minHeight: d.count > 0 ? '4px' : '0' }"
                  @click="() => { createdAtStart = d.date; createdAtEnd = d.date; showFilters = true; scrollToFilters(); }"
                >
                  <div class="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    新增: {{ d.count }}
                  </div>
                </div>
                <div
                  class="w-1/2 bg-emerald-500 rounded-t-sm hover:bg-emerald-600 transition-colors cursor-pointer relative group"
                  :style="{ height: `${(d.completed / maxTrendValue) * 100}%`, minHeight: d.completed > 0 ? '4px' : '0' }"
                  @click="applyStatFilter('completed-today')"
                >
                  <div class="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    完成: {{ d.completed }}
                  </div>
                </div>
              </div>
              <span class="text-[10px] text-slate-500 font-medium">{{ d.label }}</span>
            </div>
          </div>
        </div>

        <div class="bg-slate-50/60 rounded-xl border border-slate-200/70 p-4 hover:border-cyan-200 transition-colors">
          <div class="flex items-center gap-2 mb-4">
            <div class="p-1.5 bg-cyan-100 rounded-md">
              <Gauge class="w-4 h-4 text-cyan-600" />
            </div>
            <h4 class="text-sm font-semibold text-slate-800">各阶段在制数量</h4>
          </div>
          <div class="space-y-2.5 max-h-48 overflow-y-auto pr-1">
            <div
              v-for="(s, idx) in stageInProgressData"
              :key="idx"
              class="group cursor-pointer"
              @click="applyStatFilter('stage', s.stage)"
            >
              <div class="flex items-center justify-between mb-1">
                <span class="text-xs font-medium text-slate-700 group-hover:text-slate-900">{{ s.label }}</span>
                <span class="text-xs font-bold text-slate-800">{{ s.count }}</span>
              </div>
              <div class="h-2 bg-slate-200/70 rounded-full overflow-hidden">
                <div
                  class="h-full rounded-full transition-all duration-500 group-hover:brightness-110"
                  :class="s.colorClass"
                  :style="{ width: `${(s.count / maxStageCount) * 100}%` }"
                ></div>
              </div>
            </div>
            <div v-if="stageInProgressData.length === 0" class="py-6 text-center text-xs text-slate-400">
              暂无在制订单
            </div>
          </div>
        </div>

        <div class="bg-slate-50/60 rounded-xl border border-slate-200/70 p-4 hover:border-rose-200 transition-colors">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-2">
              <div class="p-1.5 bg-rose-100 rounded-md">
                <PieChart class="w-4 h-4 text-rose-600" />
              </div>
              <h4 class="text-sm font-semibold text-slate-800">返工原因分布</h4>
            </div>
            <span class="text-xs text-slate-500">共 {{ totalReworkCount }} 次返工</span>
          </div>
          <div class="space-y-2.5 max-h-48 overflow-y-auto pr-1">
            <div
              v-for="(r, idx) in reworkCauseData"
              :key="idx"
              class="group cursor-pointer"
              @click="applyStatFilter('rework-cause', r.cause)"
            >
              <div class="flex items-center justify-between mb-1">
                <div class="flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-sm" :class="reworkCausePalette[idx % reworkCausePalette.length]"></span>
                  <span class="text-xs font-medium text-slate-700 group-hover:text-slate-900">{{ r.label }}</span>
                </div>
                <span class="text-xs font-bold text-slate-800">{{ r.count }} <span class="font-normal text-slate-500">({{ r.percentage }}%)</span></span>
              </div>
              <div class="h-2 bg-slate-200/70 rounded-full overflow-hidden">
                <div
                  class="h-full rounded-full transition-all duration-500 group-hover:brightness-110"
                  :class="reworkCausePalette[idx % reworkCausePalette.length]"
                  :style="{ width: `${r.percentage}%` }"
                ></div>
              </div>
            </div>
            <div v-if="reworkCauseData.length === 0" class="py-6 text-center text-xs text-slate-400">
              暂无返工记录
            </div>
          </div>
        </div>

        <div class="bg-slate-50/60 rounded-xl border border-slate-200/70 p-4 hover:border-indigo-200 transition-colors">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-2">
              <div class="p-1.5 bg-indigo-100 rounded-md">
                <Trophy class="w-4 h-4 text-indigo-600" />
              </div>
              <h4 class="text-sm font-semibold text-slate-800">诊所订单贡献排行</h4>
            </div>
            <span class="text-xs text-slate-500">Top {{ clinicRankingData.length }}</span>
          </div>
          <div class="space-y-2.5 max-h-48 overflow-y-auto pr-1">
            <div
              v-for="(c, idx) in clinicRankingData"
              :key="idx"
              class="group cursor-pointer"
              @click="applyStatFilter('clinic', c.clinicId)"
            >
              <div class="flex items-center justify-between mb-1">
                <div class="flex items-center gap-2 min-w-0">
                  <span
                    class="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                    :class="idx === 0 ? 'bg-amber-400 text-amber-900' : idx === 1 ? 'bg-slate-300 text-slate-700' : idx === 2 ? 'bg-orange-300 text-orange-800' : 'bg-slate-100 text-slate-500'"
                  >
                    {{ idx + 1 }}
                  </span>
                  <span class="text-xs font-medium text-slate-700 group-hover:text-slate-900 truncate">{{ c.clinicName }}</span>
                </div>
                <span class="text-xs font-bold text-slate-800 flex-shrink-0 ml-2">{{ c.count }} <span class="font-normal text-slate-500">({{ c.percentage }}%)</span></span>
              </div>
              <div class="h-2 bg-slate-200/70 rounded-full overflow-hidden">
                <div
                  class="h-full bg-indigo-500 rounded-full transition-all duration-500 group-hover:bg-indigo-600"
                  :style="{ width: `${(c.count / maxClinicCount) * 100}%` }"
                ></div>
              </div>
              <div v-if="c.amount > 0" class="mt-0.5 text-[10px] text-slate-400">
                金额: ¥{{ c.amount.toFixed(0) }}
              </div>
            </div>
            <div v-if="clinicRankingData.length === 0" class="py-6 text-center text-xs text-slate-400">
              暂无订单数据
            </div>
          </div>
        </div>

        <div class="bg-slate-50/60 rounded-xl border border-slate-200/70 p-4 hover:border-teal-200 transition-colors">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-2">
              <div class="p-1.5 bg-teal-100 rounded-md">
                <Award class="w-4 h-4 text-teal-600" />
              </div>
              <h4 class="text-sm font-semibold text-slate-800">技师处理效率排行</h4>
            </div>
            <span class="text-xs text-slate-500">按完成工序数</span>
          </div>
          <div class="space-y-2.5 max-h-48 overflow-y-auto pr-1">
            <div
              v-for="(t, idx) in technicianRankingData"
              :key="idx"
              class="group cursor-pointer"
              @click="applyStatFilter('technician', t.name)"
            >
              <div class="flex items-center justify-between mb-1">
                <div class="flex items-center gap-2 min-w-0">
                  <span
                    class="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                    :class="idx === 0 ? 'bg-amber-400 text-amber-900' : idx === 1 ? 'bg-slate-300 text-slate-700' : idx === 2 ? 'bg-orange-300 text-orange-800' : 'bg-slate-100 text-slate-500'"
                  >
                    {{ idx + 1 }}
                  </span>
                  <span class="text-xs font-medium text-slate-700 group-hover:text-slate-900 truncate">{{ t.name }}</span>
                </div>
                <span class="text-xs font-bold text-slate-800 flex-shrink-0 ml-2">{{ t.completedCount }} 工序</span>
              </div>
              <div class="h-2 bg-slate-200/70 rounded-full overflow-hidden mb-1">
                <div
                  class="h-full bg-teal-500 rounded-full transition-all duration-500 group-hover:bg-teal-600"
                  :style="{ width: `${(t.completedCount / maxTechCompleted) * 100}%` }"
                ></div>
              </div>
              <div class="flex items-center justify-between text-[10px]">
                <span class="text-slate-500">
                  均耗时: <span class="text-slate-700 font-medium">{{ t.avgHours }}h</span>
                </span>
                <span :class="t.reworkRate > 15 ? 'text-rose-600' : t.reworkRate > 8 ? 'text-amber-600' : 'text-emerald-600'">
                  返工率: {{ t.reworkRate }}%
                </span>
              </div>
            </div>
            <div v-if="technicianRankingData.length === 0" class="py-6 text-center text-xs text-slate-400">
              暂无技师数据
            </div>
          </div>
        </div>

        <div class="bg-slate-50/60 rounded-xl border border-slate-200/70 p-4 hover:border-emerald-200 transition-colors">
          <div class="flex items-center gap-2 mb-4">
            <div class="p-1.5 bg-emerald-100 rounded-md">
              <Target class="w-4 h-4 text-emerald-600" />
            </div>
            <h4 class="text-sm font-semibold text-slate-800">交期达成率</h4>
          </div>
          <div class="flex flex-col md:flex-row items-center gap-5">
            <div class="relative flex-shrink-0">
              <svg class="w-36 h-36" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="48" fill="none" stroke="#e2e8f0" stroke-width="10" />
                <circle
                  cx="60"
                  cy="60"
                  r="48"
                  fill="none"
                  :stroke="deliveryRateData.rate >= 90 ? '#10b981' : deliveryRateData.rate >= 75 ? '#f59e0b' : '#f43f5e'"
                  stroke-width="10"
                  stroke-linecap="round"
                  stroke-dasharray="301.6"
                  :stroke-dashoffset="301.6 - (301.6 * deliveryRateData.rate) / 100"
                  transform="rotate(-90 60 60)"
                />
              </svg>
              <div class="absolute inset-0 flex flex-col items-center justify-center">
                <span
                  class="text-2xl font-bold"
                  :class="deliveryRateData.rate >= 90 ? 'text-emerald-600' : deliveryRateData.rate >= 75 ? 'text-amber-600' : 'text-rose-600'"
                >
                  {{ deliveryRateData.rate }}%
                </span>
                <span class="text-[10px] text-slate-500 mt-0.5">达成率</span>
              </div>
            </div>
            <div class="flex-1 w-full space-y-3">
              <div class="cursor-pointer group" @click="applyStatFilter('on-time-delivery')">
                <div class="flex items-center justify-between mb-1">
                  <div class="flex items-center gap-2">
                    <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <span class="text-xs font-medium text-slate-700 group-hover:text-slate-900">按时交付</span>
                  </div>
                  <span class="text-xs font-bold text-emerald-600">{{ deliveryRateData.onTime }} 单</span>
                </div>
                <div class="h-1.5 bg-slate-200/70 rounded-full overflow-hidden">
                  <div
                    class="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    :style="{ width: deliveryRateData.total === 0 ? '0%' : `${(deliveryRateData.onTime / deliveryRateData.total) * 100}%` }"
                  ></div>
                </div>
              </div>
              <div class="cursor-pointer group" @click="applyStatFilter('late-delivery')">
                <div class="flex items-center justify-between mb-1">
                  <div class="flex items-center gap-2">
                    <span class="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                    <span class="text-xs font-medium text-slate-700 group-hover:text-slate-900">逾期交付</span>
                  </div>
                  <span class="text-xs font-bold text-rose-600">{{ deliveryRateData.late }} 单</span>
                </div>
                <div class="h-1.5 bg-slate-200/70 rounded-full overflow-hidden">
                  <div
                    class="h-full bg-rose-500 rounded-full transition-all duration-500"
                    :style="{ width: deliveryRateData.total === 0 ? '0%' : `${(deliveryRateData.late / deliveryRateData.total) * 100}%` }"
                  ></div>
                </div>
              </div>
              <div>
                <div class="flex items-center justify-between mb-1">
                  <div class="flex items-center gap-2">
                    <span class="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                    <span class="text-xs font-medium text-slate-600">进行中</span>
                  </div>
                  <span class="text-xs font-bold text-slate-600">{{ deliveryRateData.pending }} 单</span>
                </div>
                <div class="h-1.5 bg-slate-200/70 rounded-full overflow-hidden">
                  <div
                    class="h-full bg-slate-400 rounded-full transition-all duration-500"
                    :style="{ width: deliveryRateData.total === 0 ? '0%' : `${(deliveryRateData.pending / deliveryRateData.total) * 100}%` }"
                  ></div>
                </div>
              </div>
              <div class="pt-2 border-t border-slate-200/70 text-[11px] text-slate-500 flex items-center justify-between">
                <span>总计评估: <span class="font-semibold text-slate-700">{{ deliveryRateData.total }} 单</span></span>
                <span :class="deliveryRateData.rate >= 90 ? 'text-emerald-600 font-semibold' : deliveryRateData.rate >= 75 ? 'text-amber-600 font-semibold' : 'text-rose-600 font-semibold'">
                  {{ deliveryRateData.rate >= 90 ? '优秀 👍' : deliveryRateData.rate >= 75 ? '良好' : '需关注 ⚠️' }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="mb-4 flex flex-wrap gap-2">
      <button
        v-if="dashboardConfig.quickViews.includes('all')"
        class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all"
        :class="activeQuickView === 'all'
          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'"
        @click="setQuickView('all')"
      >
        <ClipboardList class="w-3.5 h-3.5" />
        {{ currentRole === 'clinic' ? '全部订单' : currentRole === 'technician' ? '全部任务' : '全部订单' }}
      </button>
      <button
        v-if="dashboardConfig.quickViews.includes('today')"
        class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all"
        :class="activeQuickView === 'today'
          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'"
        @click="setQuickView('today')"
      >
        <CalendarCheck class="w-3.5 h-3.5" />
        {{ currentRole === 'technician' ? '今日任务' : '今日交付' }}
        <span class="ml-0.5 px-1 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[10px] font-bold"
          :class="activeQuickView === 'today' ? 'bg-white/20 text-white' : ''">
          {{ stats.dueToday }}
        </span>
      </button>
      <button
        v-if="dashboardConfig.quickViews.includes('overdue')"
        class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all"
        :class="activeQuickView === 'overdue'
          ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'"
        @click="setQuickView('overdue')"
      >
        <AlertTriangle class="w-3.5 h-3.5" />
        {{ currentRole === 'technician' ? '逾期任务' : '即将逾期' }}
        <span class="ml-0.5 px-1 py-0.5 rounded text-[10px] font-bold"
          :class="activeQuickView === 'overdue' ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-700'">
          {{ stats.overdue }}
        </span>
      </button>
      <button
        v-if="dashboardConfig.quickViews.includes('returning')"
        class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all"
        :class="activeQuickView === 'returning'
          ? 'bg-orange-600 text-white border-orange-600 shadow-sm'
          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'"
        @click="setQuickView('returning')"
      >
        <Wrench class="w-3.5 h-3.5" />
        {{ currentRole === 'clinic' ? '问题订单' : '返工处理中' }}
      </button>
      <button
        v-if="dashboardConfig.quickViews.includes('urgent')"
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
        v-if="dashboardConfig.quickViews.includes('mytasks')"
        class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all"
        :class="activeQuickView === 'mytasks'
          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'"
        @click="setQuickView('mytasks')"
      >
        <Eye class="w-3.5 h-3.5" />
        {{ currentRole === 'technician' ? '我的任务' : '仅看我的任务' }}
        <template v-if="currentTechnicianName">
          <span class="ml-0.5 text-[10px] opacity-80 truncate max-w-[60px]">
            ({{ currentTechnicianName }})
          </span>
        </template>
      </button>
    </div>

    <div
      class="bg-white rounded-xl border border-slate-200 p-4 mb-6 sticky top-0 z-20"
      data-filter-section
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

          <div v-if="canViewField('priority')">
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

          <div v-if="canViewField('clinic') && currentRole === 'dispatcher'">
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

          <div v-if="canViewField('responsibleTechnician') || currentRole === 'dispatcher'">
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

          <div v-if="canViewField('totalAmount')" class="lg:col-span-2">
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

        <div class="pt-4 border-t border-slate-100">
          <div class="flex items-center gap-2 mb-3">
            <RefreshCw class="w-4 h-4 text-rose-500" />
            <span class="text-sm font-semibold text-slate-700">返工专属筛选</span>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1.5">
                返工问题类型
              </label>
              <select
                v-model="reworkProblemTypeFilter"
                class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
              >
                <option value="all">全部类型</option>
                <option
                  v-for="(label, key) in ReworkProblemTypeLabels"
                  :key="key"
                  :value="key"
                >
                  {{ label }}
                </option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1.5">
                返工问题根因
              </label>
              <select
                v-model="reworkRootCauseFilter"
                class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
              >
                <option value="all">全部根因</option>
                <option
                  v-for="(label, key) in ReworkRootCauseLabels"
                  :key="key"
                  :value="key"
                >
                  {{ label }}
                </option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1.5">
                责任归属
              </label>
              <select
                v-model="reworkResponsibilityFilter"
                class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
              >
                <option value="all">全部归属</option>
                <option
                  v-for="(label, key) in ReworkResponsibilityLabels"
                  :key="key"
                  :value="key"
                >
                  {{ label }}
                </option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1.5">
                来源阶段
              </label>
              <select
                v-model="reworkSourceStageFilter"
                class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
              >
                <option value="all">全部阶段</option>
                <option
                  v-for="(label, key) in ReworkSourceStageLabels"
                  :key="key"
                  :value="key"
                >
                  {{ label }}
                </option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1.5">
                返工状态
              </label>
              <select
                v-model="reworkStatusFilter"
                class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
              >
                <option value="all">全部状态</option>
                <option
                  v-for="(label, key) in ReworkStatusLabels"
                  :key="key"
                  :value="key"
                >
                  {{ label }}
                </option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1.5">
                完成状态
              </label>
              <select
                v-model="reworkCompletedFilter"
                class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
              >
                <option value="all">全部</option>
                <option value="completed">全部返工已关闭</option>
                <option value="incomplete">存在进行中返工</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1.5">
                返工责任人/操作人
              </label>
              <input
                v-model="reworkTechnicianFilter"
                type="text"
                placeholder="搜索责任人姓名"
                class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent placeholder:text-slate-400"
              />
            </div>

            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1.5">
                是否收费
              </label>
              <select
                v-model="reworkChargeableFilter"
                class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
              >
                <option value="all">全部</option>
                <option value="yes">收费返工</option>
                <option value="no">免费返工</option>
              </select>
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
