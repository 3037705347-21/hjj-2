<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  Search,
  Filter,
  SlidersHorizontal,
  X,
  ChevronRight,
  Wrench,
  User,
  Clock,
  Calendar,
  AlertTriangle,
  Play,
  Pause,
  CheckCheck,
  RefreshCw,
  ArrowRight,
  Eye,
  Users,
  Zap,
  Target,
  Package,
  MoreHorizontal,
  ArrowUpDown,
  Download,
  Plus,
  ChevronDown,
  PlayCircle,
  CheckCircle,
  AlertCircle,
  FileText,
} from 'lucide-vue-next'
import StatusBadge from '../components/StatusBadge.vue'
import PriorityBadge from '../components/PriorityBadge.vue'
import TaskAssignDialog from '../components/TaskAssignDialog.vue'
import { useTechnicians } from '../composables/useTechnicians'
import { useRoles } from '../composables/useRoles'
import type {
  TaskAssignment,
  TaskStatus,
  TaskPriority,
  ProcessingStage,
  ExceptionType,
  OrderPriority,
} from '../types'
import {
  ProcessingStages,
  TaskStatusLabels,
  TaskStatusColors,
  TaskPriorityLabels,
  TaskPriorityColors,
  ExceptionTypeLabels,
  TechnicianStatusLabels,
  TechnicianSkillLabels,
  PriorityLabels,
} from '../types'
import { cn } from '../lib/utils'

const router = useRouter()
const {
  tasks: allTasks,
  technicians,
  acceptTask,
  startTask,
  pauseTask,
  resumeTask,
  completeTask,
  reportException,
  assignTask,
  updateTaskTechnician,
  setTaskPriority,
  resolveException,
} = useTechnicians()

const {
  currentRole,
  currentTechnicianName,
  canPerformAction,
} = useRoles()

const searchQuery = ref('')
const showFilters = ref(false)

const statusFilter = ref<TaskStatus | 'all'>('all')
const stageFilter = ref<ProcessingStage | 'all'>('all')
const technicianFilter = ref<string>('all')
const priorityFilter = ref<TaskPriority | 'all'>('all')
const orderPriorityFilter = ref<OrderPriority | 'all'>('all')
const deliveryDateRange = ref<'all' | 'today' | 'overdue' | 'week'>('all')
const reworkFilter = ref<'all' | 'has' | 'none'>('all')
const exceptionFilter = ref<'all' | 'has' | 'none'>('all')

type SortField = 'priority' | 'deliveryDate' | 'assignedAt' | 'stage'
type SortOrder = 'asc' | 'desc'
const sortField = ref<SortField>('priority')
const sortOrder = ref<SortOrder>('asc')
const showSortDropdown = ref(false)

const showAssignDialog = ref(false)
const selectedTaskForAssign = ref<TaskAssignment | null>(null)
const assignMode = ref<'assign' | 'transfer'>('assign')

const showExceptionDialog = ref(false)
const selectedTaskForException = ref<TaskAssignment | null>(null)
const exceptionType = ref<ExceptionType>('other')
const exceptionReason = ref('')

const showOperationConfirm = ref(false)
const selectedTaskForOperation = ref<TaskAssignment | null>(null)
const operationType = ref<'accept' | 'start' | 'pause' | 'resume' | 'complete'>('accept')
const operationNote = ref('')

const statusTab = ref<TaskStatus | 'all' | 'active'>('active')

const filteredTasks = computed(() => {
  let result = [...allTasks.value]

  if (statusTab.value === 'active') {
    result = result.filter((t) =>
      ['pending', 'assigned', 'accepted', 'in-progress', 'paused', 'exception'].includes(t.status)
    )
  } else if (statusTab.value !== 'all') {
    result = result.filter((t) => t.status === statusTab.value)
  }

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(
      (t) =>
        t.orderNumber.toLowerCase().includes(q) ||
        t.technicianName.toLowerCase().includes(q) ||
        (t.clinicName && t.clinicName.toLowerCase().includes(q))
    )
  }

  if (statusFilter.value !== 'all') {
    result = result.filter((t) => t.status === statusFilter.value)
  }

  if (stageFilter.value !== 'all') {
    result = result.filter((t) => t.stage === stageFilter.value)
  }

  if (technicianFilter.value !== 'all') {
    result = result.filter((t) => t.technicianId === technicianFilter.value)
  }

  if (priorityFilter.value !== 'all') {
    result = result.filter((t) => t.priority === priorityFilter.value)
  }

  if (orderPriorityFilter.value !== 'all') {
    result = result.filter((t) => t.orderPriority === orderPriorityFilter.value)
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const weekEnd = new Date(today.getTime() + 7 * 86400000)

  if (deliveryDateRange.value === 'today') {
    result = result.filter((t) => {
      if (!t.deliveryDate) return false
      const d = new Date(t.deliveryDate)
      d.setHours(0, 0, 0, 0)
      return d.getTime() === today.getTime()
    })
  } else if (deliveryDateRange.value === 'overdue') {
    result = result.filter((t) => {
      if (!t.deliveryDate) return false
      const d = new Date(t.deliveryDate)
      d.setHours(0, 0, 0, 0)
      return d.getTime() < today.getTime() && !['completed'].includes(t.status)
    })
  } else if (deliveryDateRange.value === 'week') {
    result = result.filter((t) => {
      if (!t.deliveryDate) return false
      const d = new Date(t.deliveryDate)
      return d >= today && d <= weekEnd
    })
  }

  if (reworkFilter.value === 'has') {
    result = result.filter((t) => (t.reworkCount || 0) > 0)
  } else if (reworkFilter.value === 'none') {
    result = result.filter((t) => (t.reworkCount || 0) === 0)
  }

  if (exceptionFilter.value === 'has') {
    result = result.filter((t) => t.status === 'exception')
  } else if (exceptionFilter.value === 'none') {
    result = result.filter((t) => t.status !== 'exception')
  }

  result.sort((a, b) => {
    let diff = 0
    switch (sortField.value) {
      case 'priority':
        const pOrder = { urgent: 0, high: 1, normal: 2, low: 3 }
        diff = pOrder[a.priority] - pOrder[b.priority]
        break
      case 'deliveryDate':
        diff = new Date(a.deliveryDate || '').getTime() - new Date(b.deliveryDate || '').getTime()
        break
      case 'assignedAt':
        diff = new Date(a.assignedAt || 0).getTime() - new Date(b.assignedAt || 0).getTime()
        break
      case 'stage':
        const sIdx = (s: ProcessingStage) =>
          ProcessingStages.findIndex((ps) => ps.stage === s)
        diff = sIdx(a.stage) - sIdx(b.stage)
        break
    }
    return sortOrder.value === 'asc' ? diff : -diff
  })

  return result
})

const taskStats = computed(() => {
  const tasks = allTasks.value
  return {
    total: tasks.length,
    pending: tasks.filter((t) => t.status === 'pending').length,
    assigned: tasks.filter((t) => ['assigned', 'accepted'].includes(t.status)).length,
    inProgress: tasks.filter((t) => t.status === 'in-progress').length,
    exception: tasks.filter((t) => t.status === 'exception').length,
    completedToday: tasks.filter((t) => {
      if (!t.completedAt) return false
      return new Date(t.completedAt).toDateString() === new Date().toDateString()
    }).length,
  }
})

const canAssignTask = computed(() => canPerformAction('editResponsibleTechnician') || currentRole.value === 'dispatcher')
const canTransferTask = computed(() => canPerformAction('editResponsibleTechnician') || currentRole.value === 'dispatcher')
const myTechnicianName = currentTechnicianName

function isMyTask(task: TaskAssignment): boolean {
  if (currentRole.value !== 'technician') return true
  if (!myTechnicianName.value) return false
  return task.technicianName === myTechnicianName.value
}

function formatDateTime(dateStr?: string) {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return d.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDate(dateStr?: string) {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

function getDaysToDelivery(dateStr?: string) {
  if (!dateStr) return 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const d = new Date(dateStr)
  d.setHours(0, 0, 0, 0)
  return Math.ceil((d.getTime() - today.getTime()) / 86400000)
}

function getDeliveryClass(days: number, status: string) {
  if (['completed', 'transferred'].includes(status)) return 'text-slate-500'
  if (days < 0) return 'text-rose-600 font-semibold'
  if (days === 0) return 'text-amber-600 font-semibold'
  if (days <= 2) return 'text-orange-600'
  return 'text-slate-600'
}

function getStageInfo(stage: ProcessingStage) {
  return ProcessingStages.find((s) => s.stage === stage)
}

function clearFilters() {
  searchQuery.value = ''
  statusFilter.value = 'all'
  stageFilter.value = 'all'
  technicianFilter.value = 'all'
  priorityFilter.value = 'all'
  orderPriorityFilter.value = 'all'
  deliveryDateRange.value = 'all'
  reworkFilter.value = 'all'
  exceptionFilter.value = 'all'
}

function toggleSort(field: SortField) {
  if (sortField.value === field) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortField.value = field
    sortOrder.value = 'asc'
  }
  showSortDropdown.value = false
}

function openAssignDialog(task: TaskAssignment) {
  selectedTaskForAssign.value = task
  assignMode.value = task.status === 'pending' || !task.technicianId ? 'assign' : 'transfer'
  showAssignDialog.value = true
}

function handleAssignSubmit(params: {
  technicianId: string
  technicianName: string
  priority: TaskPriority
  estimatedCompletionTime: string
  notes: string
  assignedBy: string
}) {
  if (!selectedTaskForAssign.value) return
  const task = selectedTaskForAssign.value

  if (assignMode.value === 'assign' && task.status === 'pending') {
    const idx = allTasks.value.findIndex((t) => t.id === task.id)
    if (idx >= 0) {
      const now = new Date().toISOString().split('T')[0] + 'T' + new Date().toTimeString().split(' ')[0]
      allTasks.value[idx] = {
        ...task,
        technicianId: params.technicianId,
        technicianName: params.technicianName,
        status: 'assigned',
        priority: params.priority,
        assignedAt: now,
        estimatedCompletionTime: params.estimatedCompletionTime,
        notes: params.notes || task.notes,
        assignedBy: params.assignedBy,
      }
    }
  } else {
    updateTaskTechnician(
      task.id,
      params.technicianId,
      params.technicianName,
      params.notes || '调度转派',
      params.assignedBy
    )
    const idx = allTasks.value.findIndex((t) => t.id === task.id)
    if (idx >= 0) {
      allTasks.value[idx].priority = params.priority
      allTasks.value[idx].estimatedCompletionTime = params.estimatedCompletionTime
    }
  }

  showAssignDialog.value = false
  selectedTaskForAssign.value = null
}

function openExceptionDialog(task: TaskAssignment) {
  selectedTaskForException.value = task
  exceptionType.value = 'other'
  exceptionReason.value = ''
  showExceptionDialog.value = true
}

function handleExceptionSubmit() {
  if (!selectedTaskForException.value) return
  reportException(
    selectedTaskForException.value.id,
    exceptionType.value,
    exceptionReason.value,
    myTechnicianName.value || '系统'
  )
  showExceptionDialog.value = false
  selectedTaskForException.value = null
}

function openOperation(task: TaskAssignment, op: typeof operationType.value) {
  selectedTaskForOperation.value = task
  operationType.value = op
  operationNote.value = ''
  showOperationConfirm.value = true
}

function handleOperationConfirm() {
  if (!selectedTaskForOperation.value) return
  const task = selectedTaskForOperation.value
  const operator = myTechnicianName.value || '系统'

  switch (operationType.value) {
    case 'accept':
      acceptTask(task.id, operator, operationNote.value)
      break
    case 'start':
      startTask(task.id, operator, operationNote.value)
      break
    case 'pause':
      pauseTask(task.id, operator, operationNote.value)
      break
    case 'resume':
      resumeTask(task.id, operator, operationNote.value)
      break
    case 'complete':
      completeTask(task.id, operator, operationNote.value)
      break
  }

  showOperationConfirm.value = false
  selectedTaskForOperation.value = null
}

function handleResolveException(task: TaskAssignment) {
  resolveException(task.id, myTechnicianName.value || '系统', '异常已处理')
}

function goToOrderDetail(orderId: string) {
  router.push(`/order/${orderId}`)
}

function goToTechnicianDetail(technicianId: string) {
  if (!technicianId) return
  router.push(`/technician/${technicianId}`)
}

onMounted(() => {
  // 刷新技师统计
})

const operationTitle = computed(() => {
  const titles = {
    accept: '接单确认',
    start: '开始处理',
    pause: '暂停任务',
    resume: '恢复任务',
    complete: '完成提交',
  }
  return titles[operationType.value]
})
</script>

<template>
  <div class="space-y-6">
    <div>
      <div class="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h1 class="text-2xl font-bold text-slate-900 tracking-tight">
            技师任务列表
          </h1>
          <p class="text-sm text-slate-500 mt-1">
            管理所有阶段任务分配、接单处理和进度跟踪
          </p>
        </div>
        <div class="flex items-center gap-2">
          <button
            class="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <Download class="w-4 h-4" />
            导出
          </button>
          <button
            v-if="canAssignTask"
            class="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus class="w-4 h-4" />
            批量分配
          </button>
        </div>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div
          class="p-4 bg-white rounded-xl border border-slate-200 cursor-pointer transition-all hover:shadow-md"
          :class="statusTab === 'all' ? 'ring-2 ring-blue-500 border-blue-500' : ''"
          @click="statusTab = 'all'"
        >
          <div class="text-xs text-slate-500 mb-1">全部任务</div>
          <div class="text-2xl font-bold text-slate-800">{{ taskStats.total }}</div>
        </div>
        <div
          class="p-4 bg-white rounded-xl border border-slate-200 cursor-pointer transition-all hover:shadow-md"
          :class="statusTab === 'active' ? 'ring-2 ring-blue-500 border-blue-500' : ''"
          @click="statusTab = 'active'"
        >
          <div class="text-xs text-slate-500 mb-1">进行中</div>
          <div class="text-2xl font-bold text-indigo-600">{{ taskStats.assigned + taskStats.inProgress }}</div>
        </div>
        <div
          class="p-4 bg-white rounded-xl border border-slate-200 cursor-pointer transition-all hover:shadow-md"
          :class="statusTab === 'pending' ? 'ring-2 ring-blue-500 border-blue-500' : ''"
          @click="statusTab = 'pending'"
        >
          <div class="text-xs text-slate-500 mb-1 flex items-center gap-1">
            <Clock class="w-3 h-3" />
            待分配
          </div>
          <div class="text-2xl font-bold text-slate-600">{{ taskStats.pending }}</div>
        </div>
        <div
          class="p-4 bg-white rounded-xl border border-slate-200 cursor-pointer transition-all hover:shadow-md"
          :class="statusTab === 'in-progress' ? 'ring-2 ring-blue-500 border-blue-500' : ''"
          @click="statusTab = 'in-progress'"
        >
          <div class="text-xs text-slate-500 mb-1 flex items-center gap-1">
            <PlayCircle class="w-3 h-3" />
            处理中
          </div>
          <div class="text-2xl font-bold text-blue-600">{{ taskStats.inProgress }}</div>
        </div>
        <div
          class="p-4 bg-white rounded-xl border border-slate-200 cursor-pointer transition-all hover:shadow-md"
          :class="statusTab === 'exception' ? 'ring-2 ring-blue-500 border-blue-500' : ''"
          @click="statusTab = 'exception'"
        >
          <div class="text-xs text-slate-500 mb-1 flex items-center gap-1">
            <AlertCircle class="w-3 h-3" />
            异常
          </div>
          <div class="text-2xl font-bold text-rose-600">{{ taskStats.exception }}</div>
        </div>
        <div
          class="p-4 bg-white rounded-xl border border-slate-200 cursor-pointer transition-all hover:shadow-md"
          @click="statusTab = 'completed'"
        >
          <div class="text-xs text-slate-500 mb-1 flex items-center gap-1">
            <CheckCircle class="w-3 h-3" />
            今日完成
          </div>
          <div class="text-2xl font-bold text-emerald-600">{{ taskStats.completedToday }}</div>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div
        class="px-5 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3"
      >
        <div class="flex items-center gap-3 flex-1 min-w-0">
          <div class="relative flex-1 max-w-md">
            <Search
              class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
            />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="搜索订单号、技师、诊所..."
              class="w-full pl-10 pr-10 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-transparent placeholder:text-slate-400 transition-all"
            />
            <button
              v-if="searchQuery"
              class="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
              @click="searchQuery = ''"
            >
              <X class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <div class="relative">
            <button
              class="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
              @click="showSortDropdown = !showSortDropdown"
            >
              <ArrowUpDown class="w-4 h-4" />
              排序
              <ChevronDown class="w-3.5 h-3.5" />
            </button>
            <div
              v-if="showSortDropdown"
              class="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg border border-slate-200 shadow-lg z-20 py-1"
            >
              <button
                v-for="(label, key) in { priority: '优先级', deliveryDate: '交期', assignedAt: '分配时间', stage: '加工阶段' }"
                :key="key"
                class="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 flex items-center justify-between"
                @click="toggleSort(key as SortField)"
              >
                <span :class="sortField === key ? 'text-blue-600 font-medium' : 'text-slate-700'">{{ label }}</span>
                <span
                  v-if="sortField === key"
                  class="text-xs text-blue-600"
                >
                  {{ sortOrder === 'asc' ? '↑' : '↓' }}
                </span>
              </button>
            </div>
          </div>
          <button
            class="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
            :class="showFilters ? 'bg-blue-50 border-blue-200 text-blue-700' : ''"
            @click="showFilters = !showFilters"
          >
            <SlidersHorizontal class="w-4 h-4" />
            高级筛选
            <template
              v-if="[statusFilter, stageFilter, technicianFilter, priorityFilter, orderPriorityFilter, deliveryDateRange, reworkFilter, exceptionFilter].some(
                (f) => f !== 'all'
              )"
            >
              <span
                class="w-1.5 h-1.5 rounded-full bg-blue-500"
              ></span>
            </template>
          </button>
        </div>
      </div>

      <div
        v-if="showFilters"
        class="px-5 py-4 border-b border-slate-100 bg-slate-50/50 grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <div>
          <label class="block text-xs font-medium text-slate-600 mb-1.5">加工阶段</label>
          <select
            v-model="stageFilter"
            class="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            <option value="all">全部阶段</option>
            <option
              v-for="s in ProcessingStages.filter((s) => !['received', 'shipped', 'delivered'].includes(s.stage))"
              :key="s.stage"
              :value="s.stage"
            >
              {{ s.label }}
            </option>
          </select>
        </div>

        <div>
          <label class="block text-xs font-medium text-slate-600 mb-1.5">负责技师</label>
          <select
            v-model="technicianFilter"
            class="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            <option value="all">全部技师</option>
            <option
              v-for="tech in technicians"
              :key="tech.id"
              :value="tech.id"
            >
              {{ tech.name }}
            </option>
          </select>
        </div>

        <div>
          <label class="block text-xs font-medium text-slate-600 mb-1.5">任务优先级</label>
          <select
            v-model="priorityFilter"
            class="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            <option value="all">全部优先级</option>
            <option
              v-for="(label, key) in TaskPriorityLabels"
              :key="key"
              :value="key"
            >
              {{ label }}
            </option>
          </select>
        </div>

        <div>
          <label class="block text-xs font-medium text-slate-600 mb-1.5">订单加急</label>
          <select
            v-model="orderPriorityFilter"
            class="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            <option value="all">全部</option>
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
          <label class="block text-xs font-medium text-slate-600 mb-1.5">交期范围</label>
          <select
            v-model="deliveryDateRange"
            class="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            <option value="all">全部</option>
            <option value="today">今日交付</option>
            <option value="overdue">已逾期</option>
            <option value="week">本周内</option>
          </select>
        </div>

        <div>
          <label class="block text-xs font-medium text-slate-600 mb-1.5">返工状态</label>
          <select
            v-model="reworkFilter"
            class="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            <option value="all">全部</option>
            <option value="has">有返工</option>
            <option value="none">无返工</option>
          </select>
        </div>

        <div>
          <label class="block text-xs font-medium text-slate-600 mb-1.5">异常状态</label>
          <select
            v-model="exceptionFilter"
            class="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            <option value="all">全部</option>
            <option value="has">有异常</option>
            <option value="none">无异常</option>
          </select>
        </div>

        <div class="flex items-end">
          <button
            class="w-full px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            @click="clearFilters"
          >
            清除筛选
          </button>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-slate-50/80 border-b border-slate-200">
            <tr>
              <th class="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                订单 / 诊所
              </th>
              <th class="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                阶段
              </th>
              <th class="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                技师
              </th>
              <th class="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                状态
              </th>
              <th class="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                优先级
              </th>
              <th class="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                交期
              </th>
              <th class="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                预计完成
              </th>
              <th class="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                返工
              </th>
              <th class="px-5 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr
              v-for="task in filteredTasks"
              :key="task.id"
              class="hover:bg-slate-50/50 transition-colors group"
            >
              <td class="px-5 py-4">
                <div
                  class="cursor-pointer"
                  @click="goToOrderDetail(task.orderId)"
                >
                  <div class="font-mono text-sm font-semibold text-slate-800 hover:text-blue-600 transition-colors">
                    {{ task.orderNumber }}
                  </div>
                  <div class="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                    <Package class="w-3 h-3" />
                    {{ task.clinicName || '-' }} · {{ task.workItemsCount || 0 }}件
                  </div>
                  <div v-if="task.orderPriority && task.orderPriority !== 'standard'" class="mt-1">
                    <PriorityBadge :priority="task.orderPriority" size="sm" />
                  </div>
                </div>
              </td>
              <td class="px-5 py-4">
                <span
                  class="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200"
                >
                  <Wrench class="w-3 h-3" />
                  {{ getStageInfo(task.stage)?.label || task.stage }}
                </span>
              </td>
              <td class="px-5 py-4">
                <div
                  v-if="task.technicianName"
                  class="cursor-pointer hover:text-blue-600"
                  @click="goToTechnicianDetail(task.technicianId)"
                >
                  <div class="flex items-center gap-2">
                    <div
                      class="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                      :class="`bg-gradient-to-br ${technicians.find((t) => t.id === task.technicianId)?.avatarColor || 'from-slate-400 to-slate-600'}`"
                    >
                      {{ task.technicianName.charAt(0) }}
                    </div>
                    <span class="text-sm font-medium text-slate-700">
                      {{ task.technicianName }}
                    </span>
                  </div>
                  <div
                    v-if="task.transferredFrom"
                    class="text-[10px] text-slate-400 mt-1 flex items-center gap-1"
                  >
                    <RefreshCw class="w-2.5 h-2.5" />
                    由 {{ task.transferredFrom }} 转派
                  </div>
                </div>
                <div
                  v-else
                  class="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs bg-slate-100 text-slate-500 border border-slate-200"
                >
                  <Users class="w-3 h-3" />
                  待分配
                </div>
              </td>
              <td class="px-5 py-4">
                <span
                  class="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border"
                  :class="TaskStatusColors[task.status]"
                >
                  {{ TaskStatusLabels[task.status] }}
                </span>
                <div
                  v-if="task.status === 'exception' && task.exceptionType"
                  class="mt-1 text-[10px] text-rose-600"
                >
                  {{ ExceptionTypeLabels[task.exceptionType] }}
                </div>
              </td>
              <td class="px-5 py-4">
                <span
                  class="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border"
                  :class="TaskPriorityColors[task.priority]"
                >
                  <Zap v-if="task.priority === 'urgent'" class="w-3 h-3" />
                  {{ TaskPriorityLabels[task.priority] }}
                </span>
              </td>
              <td class="px-5 py-4">
                <div class="text-sm" :class="getDeliveryClass(getDaysToDelivery(task.deliveryDate), task.status)">
                  {{ formatDate(task.deliveryDate) }}
                </div>
                <div class="text-[10px] text-slate-400 mt-0.5">
                  <template v-if="['completed', 'transferred'].includes(task.status)">
                    已完成
                  </template>
                  <template v-else-if="getDaysToDelivery(task.deliveryDate) < 0">
                    逾期 {{ Math.abs(getDaysToDelivery(task.deliveryDate)) }} 天
                  </template>
                  <template v-else-if="getDaysToDelivery(task.deliveryDate) === 0">
                    今日需交付
                  </template>
                  <template v-else>
                    剩 {{ getDaysToDelivery(task.deliveryDate) }} 天
                  </template>
                </div>
              </td>
              <td class="px-5 py-4">
                <div class="text-sm text-slate-600">
                  {{ formatDateTime(task.estimatedCompletionTime) }}
                </div>
                <div class="text-[10px] text-slate-400 mt-0.5">
                  {{ task.assignedAt ? `分配: ${formatDateTime(task.assignedAt)}` : '-' }}
                </div>
              </td>
              <td class="px-5 py-4">
                <template v-if="task.reworkCount > 0">
                  <span
                    class="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200"
                  >
                    <RefreshCw class="w-3 h-3" />
                    {{ task.reworkCount }} 次
                  </span>
                </template>
                <span v-else class="text-xs text-slate-400">-</span>
              </td>
              <td class="px-5 py-4">
                <div class="flex items-center justify-end gap-1.5">
                  <button
                    class="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="查看订单"
                    @click="goToOrderDetail(task.orderId)"
                  >
                    <Eye class="w-4 h-4" />
                  </button>

                  <template v-if="canAssignTask && (task.status === 'pending' || !task.technicianId)">
                    <button
                      class="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="分配任务"
                      @click="openAssignDialog(task)"
                    >
                      <Users class="w-4 h-4" />
                    </button>
                  </template>
                  <template v-else-if="canTransferTask && task.technicianId">
                    <button
                      class="p-1.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                      title="转派任务"
                      @click="openAssignDialog(task)"
                    >
                      <ArrowRight class="w-4 h-4" />
                    </button>
                  </template>

                  <template v-if="isMyTask(task)">
                    <template v-if="task.status === 'assigned'">
                      <button
                        class="p-1.5 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"
                        title="接单"
                        @click="openOperation(task, 'accept')"
                      >
                        <CheckCircle class="w-4 h-4" />
                      </button>
                    </template>
                    <template v-if="task.status === 'accepted'">
                      <button
                        class="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="开始处理"
                        @click="openOperation(task, 'start')"
                      >
                        <Play class="w-4 h-4" />
                      </button>
                    </template>
                    <template v-if="task.status === 'in-progress'">
                      <button
                        class="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        title="暂停"
                        @click="openOperation(task, 'pause')"
                      >
                        <Pause class="w-4 h-4" />
                      </button>
                      <button
                        class="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="完成提交"
                        @click="openOperation(task, 'complete')"
                      >
                        <CheckCheck class="w-4 h-4" />
                      </button>
                    </template>
                    <template v-if="task.status === 'paused'">
                      <button
                        class="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                        title="恢复"
                        @click="openOperation(task, 'resume')"
                      >
                        <PlayCircle class="w-4 h-4" />
                      </button>
                    </template>
                    <template v-if="task.status === 'in-progress' || task.status === 'paused' || task.status === 'accepted'">
                      <button
                        class="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="上报异常"
                        @click="openExceptionDialog(task)"
                      >
                        <AlertTriangle class="w-4 h-4" />
                      </button>
                    </template>
                  </template>

                  <template v-if="task.status === 'exception' && canAssignTask">
                    <button
                      class="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                      title="处理异常"
                      @click="handleResolveException(task)"
                    >
                      <AlertCircle class="w-4 h-4" />
                    </button>
                  </template>
                </div>
              </td>
            </tr>
            <tr v-if="filteredTasks.length === 0">
              <td colspan="9" class="px-5 py-16 text-center">
                <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                  <FileText class="w-8 h-8 text-slate-300" />
                </div>
                <p class="text-sm font-medium text-slate-600 mb-1">暂无符合条件的任务</p>
                <p class="text-xs text-slate-400">请尝试调整筛选条件或分配新任务</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div
        class="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500"
      >
        <span>共 {{ filteredTasks.length }} 条任务记录</span>
        <span>显示排序：{{ sortField === 'priority' ? '优先级' : sortField === 'deliveryDate' ? '交期' : sortField === 'assignedAt' ? '分配时间' : '阶段' }} {{ sortOrder === 'asc' ? '升序' : '降序' }}</span>
      </div>
    </div>

    <TaskAssignDialog
      :show="showAssignDialog"
      :order-id="selectedTaskForAssign?.orderId"
      :order-number="selectedTaskForAssign?.orderNumber"
      :stage="selectedTaskForAssign?.stage"
      :work-items-count="selectedTaskForAssign?.workItemsCount"
      :clinic-name="selectedTaskForAssign?.clinicName"
      :delivery-date="selectedTaskForAssign?.deliveryDate"
      :order-priority="selectedTaskForAssign?.orderPriority"
      :existing-technician-id="selectedTaskForAssign?.technicianId"
      :existing-technician-name="selectedTaskForAssign?.technicianName"
      :is-transfer="assignMode === 'transfer'"
      @close="showAssignDialog = false; selectedTaskForAssign = null"
      @submit="handleAssignSubmit"
    />

    <Teleport to="body">
      <div
        v-if="showExceptionDialog"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div
          class="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
          @click="showExceptionDialog = false"
        ></div>
        <div class="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
          <div class="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 class="text-base font-semibold text-slate-800 flex items-center gap-2">
              <AlertTriangle class="w-5 h-5 text-rose-500" />
              上报异常
            </h3>
            <button
              class="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              @click="showExceptionDialog = false"
            >
              <X class="w-4 h-4" />
            </button>
          </div>
          <div class="p-5 space-y-4">
            <div
              v-if="selectedTaskForException"
              class="p-3 bg-rose-50/50 border border-rose-100 rounded-lg text-xs"
            >
              <div class="font-mono font-semibold text-rose-700">{{ selectedTaskForException.orderNumber }}</div>
              <div class="text-rose-600 mt-0.5">{{ getStageInfo(selectedTaskForException.stage)?.label }} · {{ selectedTaskForException.technicianName }}</div>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1.5">异常类型</label>
              <select
                v-model="exceptionType"
                class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent bg-white"
              >
                <option
                  v-for="(label, key) in ExceptionTypeLabels"
                  :key="key"
                  :value="key"
                >
                  {{ label }}
                </option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1.5">异常描述</label>
              <textarea
                v-model="exceptionReason"
                rows="3"
                placeholder="请详细描述异常情况，便于后续处理"
                class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent placeholder:text-slate-400 resize-none"
              ></textarea>
            </div>
          </div>
          <div class="px-5 py-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50">
            <button
              class="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              @click="showExceptionDialog = false"
            >
              取消
            </button>
            <button
              :disabled="!exceptionReason.trim()"
              class="px-4 py-2 text-sm font-semibold text-white bg-rose-600 rounded-lg hover:bg-rose-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              @click="handleExceptionSubmit"
            >
              确认上报
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div
        v-if="showOperationConfirm"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div
          class="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
          @click="showOperationConfirm = false"
        ></div>
        <div class="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
          <div class="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 class="text-base font-semibold text-slate-800">{{ operationTitle }}</h3>
            <button
              class="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              @click="showOperationConfirm = false"
            >
              <X class="w-4 h-4" />
            </button>
          </div>
          <div class="p-5 space-y-4">
            <div
              v-if="selectedTaskForOperation"
              class="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            >
              <div class="font-mono font-semibold text-slate-700">{{ selectedTaskForOperation.orderNumber }}</div>
              <div class="text-slate-600 mt-0.5">{{ getStageInfo(selectedTaskForOperation.stage)?.label }} · {{ selectedTaskForOperation.technicianName }}</div>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1.5">操作备注（可选）</label>
              <textarea
                v-model="operationNote"
                rows="2"
                placeholder="请输入操作备注信息"
                class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-400 resize-none"
              ></textarea>
            </div>
          </div>
          <div class="px-5 py-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50">
            <button
              class="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              @click="showOperationConfirm = false"
            >
              取消
            </button>
            <button
              class="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              @click="handleOperationConfirm"
            >
              确认
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
