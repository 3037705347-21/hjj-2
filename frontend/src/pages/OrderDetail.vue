<script setup lang="ts">
import { ref, computed } from 'vue'
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
  Play,
  CheckCheck,
  Undo2,
  Pause,
  PlayCircle,
  Truck,
  PackageCheck,
  X,
  AlertTriangle,
  Eye,
  ThumbsUp,
  ThumbsDown,
  ArrowRight,
  FileSearch,
  Users,
  UserCog,
  ClipboardList,
  ExternalLink,
  Package,
  Send,
} from 'lucide-vue-next'
import StatusBadge from '../components/StatusBadge.vue'
import ToothChart from '../components/ToothChart.vue'
import StageTimeline from '../components/StageTimeline.vue'
import AttachmentCard from '../components/AttachmentCard.vue'
import CommunicationCard from '../components/CommunicationCard.vue'
import ReworkFormDialog from '../components/ReworkFormDialog.vue'
import ReworkDetailPanel from '../components/ReworkDetailPanel.vue'
import TaskAssignDialog from '../components/TaskAssignDialog.vue'
import PriorityBadge from '../components/PriorityBadge.vue'
import { useOrders } from '../composables/useOrders'
import { useRoles } from '../composables/useRoles'
import { useTechnicians } from '../composables/useTechnicians'
import { useLogistics } from '../composables/useLogistics'
import type { StageHistoryEntry, ProcessingStage, ReturnRecord, ReworkStatus, ReworkSourceStage, ReworkProblemType, ReworkRootCause, ReworkResponsibility, TaskAssignment, TaskPriority } from '../types'
import {
  ProcessingStages,
  RestorationTypeLabels,
  MaterialTypeLabels,
  ImpressionMethodLabels,
  ReworkStatusLabels,
  ReworkStatusColors,
  ReworkSourceStageLabels,
  ReworkProblemTypeLabels,
  ReworkRootCauseLabels,
  ReworkResponsibilityLabels,
  TaskStatusLabels,
  TaskStatusColors,
  TaskPriorityLabels,
  TaskPriorityColors,
  TechnicianSkillLabels,
  ShippingMethodLabels,
  SignStatusLabels,
  SignStatusColors,
  type LogisticsRecord,
  type LogisticsTimelineEntry,
} from '../types'

const route = useRoute()
const router = useRouter()
const {
  getOrderById,
  copyOrder,
  startStage,
  completeStage,
  returnToPreviousStage,
  pauseOrder,
  resumeOrder,
  markAsShipped,
  markAsDelivered,
  initiateRework,
  acceptRework,
  startRectification,
  submitForRecheck,
  closeRework,
} = useOrders()

const order = computed(() => getOrderById(String(route.params.id)))

const {
  currentRole,
  currentTechnicianName,
  canViewField,
  canEditField,
  canPerformAction,
} = useRoles()

const {
  getTasksByOrder,
  getTaskHandovers,
  getTechnician,
  assignTask,
  updateTaskTechnician,
  technicians,
  acceptTask,
  startTask,
  completeTask,
  syncTaskWithStageHistory,
} = useTechnicians()

const { getLogisticsByOrderId } = useLogistics()

const orderLogistics = computed<LogisticsRecord[]>(() => {
  if (!order.value) return []
  return getLogisticsByOrderId(order.value.id)
})

const hasLogistics = computed(() => orderLogistics.value.length > 0)

function goToLogisticsDetail(id: string) {
  router.push(`/logistics/detail/${id}`)
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

const orderTasks = computed<TaskAssignment[]>(() => {
  if (!order.value) return []
  return getTasksByOrder(order.value.id)
})

const showTaskAssignDialog = ref(false)
const selectedStageForAssign = ref<ProcessingStage | null>(null)
const assignMode = ref<'assign' | 'transfer'>('assign')
const existingTaskForAssign = computed<TaskAssignment | undefined>(() => {
  if (!selectedStageForAssign.value || !order.value) return undefined
  return orderTasks.value.find((t) => t.stage === selectedStageForAssign.value)
})

function getTaskForStage(stage: ProcessingStage): TaskAssignment | undefined {
  return orderTasks.value.find((t) => t.stage === stage)
}

function getHandoversForStage(stage: ProcessingStage) {
  const task = getTaskForStage(stage)
  if (!task) return []
  return getTaskHandovers(task.id)
}

function openAssignDialogForStage(stage: ProcessingStage) {
  selectedStageForAssign.value = stage
  const task = getTaskForStage(stage)
  assignMode.value = task && task.technicianId ? 'transfer' : 'assign'
  showTaskAssignDialog.value = true
}

function handleTaskAssignSubmit(params: {
  technicianId: string
  technicianName: string
  priority: TaskPriority
  estimatedCompletionTime: string
  notes: string
  assignedBy: string
}) {
  if (!selectedStageForAssign.value || !order.value) return

  const stage = selectedStageForAssign.value
  const existingTask = getTaskForStage(stage)

  if (existingTask && existingTask.technicianId) {
    updateTaskTechnician(
      existingTask.id,
      params.technicianId,
      params.technicianName,
      params.notes || '订单内转派',
      params.assignedBy
    )
    if (existingTask.id) {
      const idx = orderTasks.value.findIndex((t) => t.id === existingTask.id)
      if (idx >= 0) {
        orderTasks.value[idx].priority = params.priority
        orderTasks.value[idx].estimatedCompletionTime = params.estimatedCompletionTime
      }
    }
  } else {
    assignTask({
      orderId: order.value.id,
      orderNumber: order.value.orderNumber,
      stage,
      technicianId: params.technicianId,
      technicianName: params.technicianName,
      priority: params.priority,
      estimatedCompletionTime: params.estimatedCompletionTime,
      notes: params.notes,
      assignedBy: params.assignedBy,
      workItemsCount: order.value.workItems.filter((w) => w.toothNumber !== 'all').length,
      clinicName: order.value.clinic.name,
      deliveryDate: order.value.deliveryDate,
      orderPriority: order.value.priority,
    })
  }

  showTaskAssignDialog.value = false
  selectedStageForAssign.value = null
}

function goToTechnicianDetail(technicianId?: string) {
  if (!technicianId) return
  router.push(`/technician/${technicianId}`)
}

const canViewClinicInfo = computed(() => canViewField('clinicInfo'))
const canEditClinicInfo = computed(() => canEditField('clinicInfo'))
const canViewPriority = computed(() => canViewField('priority'))
const canEditPriority = computed(() => canEditField('priority'))
const canViewTotalAmount = computed(() => canViewField('totalAmount'))
const canEditInternalCost = computed(() => canEditField('internalCost'))
const canViewResponsibleTechnician = computed(() => canViewField('responsibleTechnician'))
const canEditResponsibleTechnician = computed(() => canEditField('responsibleTechnician'))

const canCreateOrder = computed(() => canPerformAction('create'))
const canEditOrder = computed(() => canPerformAction('edit'))
const canCopyOrder = computed(() => canPerformAction('copy'))
const canStartStageAction = computed(() => canPerformAction('startStage'))
const canCompleteStageAction = computed(() => canPerformAction('completeStage'))
const canInitiateReworkAction = computed(() => canPerformAction('initiateRework'))
const canPauseAction = computed(() => canPerformAction('pause'))
const canResumeAction = computed(() => canPerformAction('resume'))
const canShipAction = computed(() => canPerformAction('ship'))
const canDeliverAction = computed(() => canPerformAction('deliver'))
const canEditPriorityAction = computed(() => canPerformAction('editPriority'))
const canEditClinicInfoAction = computed(() => canPerformAction('editClinicInfo'))
const canEditInternalCostAction = computed(() => canPerformAction('editInternalCost'))
const canEditResponsibleTechnicianAction = computed(() => canPerformAction('editResponsibleTechnician'))

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

const currentStageIndex = computed(() => {
  if (!order.value) return -1
  return ProcessingStages.findIndex((s) => s.stage === order.value!.currentStage)
})

const currentStageEntry = computed(() => {
  if (!order.value) return undefined
  return order.value.stageHistory.find(
    (e) => e.stage === order.value!.currentStage && !e.completedAt
  )
})

const isCurrentStageAssignedToMe = computed(() => {
  if (!currentStageEntry.value) return false
  if (currentRole.value !== 'technician') return true
  const entryTech = currentStageEntry.value.technician
  if (!entryTech) return true
  return entryTech === currentTechnicianName.value
})

const canStart = computed(() => {
  if (!order.value) return false
  if (!canStartStageAction.value) return false
  if (order.value.status === 'completed' || order.value.status === 'on-hold') return false
  if (!currentStageEntry.value) return false
  if (currentStageEntry.value.startedAt) return false
  if (!isCurrentStageAssignedToMe.value) return false
  return true
})

const canComplete = computed(() => {
  if (!order.value) return false
  if (!canCompleteStageAction.value) return false
  if (order.value.status === 'completed' || order.value.status === 'on-hold') return false
  if (!currentStageEntry.value) return false
  if (!currentStageEntry.value.startedAt) return false
  if (currentStageEntry.value.completedAt) return false
  if (!isCurrentStageAssignedToMe.value) return false
  return currentStageIndex.value < ProcessingStages.length - 1
})

const canReturn = computed(() => {
  if (!order.value) return false
  if (!canInitiateReworkAction.value) return false
  if (order.value.status === 'completed') return false
  if (!isCurrentStageAssignedToMe.value) return false
  return currentStageIndex.value > 0
})

const canPause = computed(() => {
  if (!order.value) return false
  if (!canPauseAction.value) return false
  if (order.value.status === 'completed' || order.value.status === 'on-hold') return false
  if (!isCurrentStageAssignedToMe.value) return false
  return true
})

const canResume = computed(() => {
  if (!order.value) return false
  if (!canResumeAction.value) return false
  return order.value.status === 'on-hold'
})

const canShip = computed(() => {
  if (!order.value) return false
  if (!canShipAction.value) return false
  return (
    order.value.currentStage === 'quality-check' &&
    order.value.status !== 'completed'
  ) || (order.value.currentStage === 'shipped' && !order.value.stageHistory.find(e => e.stage === 'shipped' && e.completedAt))
})

const canDeliver = computed(() => {
  if (!order.value) return false
  if (!canDeliverAction.value) return false
  return (
    order.value.currentStage === 'shipped' &&
    order.value.status !== 'completed'
  )
})

type DialogMode =
  | 'start'
  | 'complete'
  | 'pause'
  | 'resume'
  | 'ship'
  | 'deliver'
  | null

const showDialog = ref(false)
const dialogMode = ref<DialogMode>(null)
const formTechnician = ref('')
const formNotes = ref('')
const formErrorReason = ref('')
const formCorrectiveAction = ref('')

const showReworkForm = ref(false)
const showReworkDetail = ref(false)
const selectedRework = ref<ReturnRecord | undefined>(undefined)

function openDialog(mode: DialogMode) {
  dialogMode.value = mode
  formTechnician.value = ''
  formNotes.value = ''
  formErrorReason.value = ''
  formCorrectiveAction.value = ''
  showDialog.value = true
}

function closeDialog() {
  showDialog.value = false
  dialogMode.value = null
}

function openReworkForm() {
  showReworkForm.value = true
}

function closeReworkForm() {
  showReworkForm.value = false
}

function openReworkDetail(rework: ReturnRecord) {
  selectedRework.value = rework
  showReworkDetail.value = true
}

function closeReworkDetail() {
  showReworkDetail.value = false
  selectedRework.value = undefined
}

function handleInitiateRework(params: {
  sourceStage: ReworkSourceStage
  problemType: ReworkProblemType
  rootCause: ReworkRootCause
  responsibility: ReworkResponsibility
  reason: string
  correctiveAction: string
  relatedTeeth: string[]
  responsibleTechnician: string
  chargeable: boolean
  chargeAmount?: number
  deadline: string
  targetStage?: ProcessingStage
  operator: string
}) {
  if (!order.value) return
  initiateRework(order.value.id, params)
  closeReworkForm()
}

function handleAcceptRework(params: { operator: string; note?: string }) {
  if (!order.value || !selectedRework.value) return
  acceptRework(order.value.id, selectedRework.value.id, params.operator, params.note)
  closeReworkDetail()
}

function handleStartRectification(params: { operator: string; note?: string }) {
  if (!order.value || !selectedRework.value) return
  startRectification(order.value.id, selectedRework.value.id, params.operator, params.note)
  closeReworkDetail()
}

function handleSubmitForRecheck(params: { operator: string; note?: string }) {
  if (!order.value || !selectedRework.value) return
  submitForRecheck(order.value.id, selectedRework.value.id, params.operator, params.note)
  closeReworkDetail()
}

function handleCloseRework(params: {
  operator: string
  recheckResult: 'pass' | 'fail'
  closureNote?: string
  recheckNote?: string
  chargeAmount?: number
}) {
  if (!order.value || !selectedRework.value) return
  closeRework(
    order.value.id,
    selectedRework.value.id,
    params.operator,
    params.recheckResult,
    params.closureNote,
    params.recheckNote,
    params.chargeAmount
  )
  closeReworkDetail()
}

function confirmAction() {
  if (!order.value) return
  const id = order.value.id

  switch (dialogMode.value) {
    case 'start':
      startStage(id, {
        technician: formTechnician.value,
        notes: formNotes.value,
      })
      break
    case 'complete':
      completeStage(id, {
        technician: formTechnician.value,
        notes: formNotes.value,
        errorReason: formErrorReason.value || undefined,
      })
      break
    case 'pause':
      pauseOrder(id, {
        technician: formTechnician.value,
        notes: formNotes.value,
      })
      break
    case 'resume':
      resumeOrder(id, {
        technician: formTechnician.value,
        notes: formNotes.value,
      })
      break
    case 'ship':
      markAsShipped(id, {
        technician: formTechnician.value,
        notes: formNotes.value,
      })
      break
    case 'deliver':
      markAsDelivered(id, {
        technician: formTechnician.value,
        notes: formNotes.value,
      })
      break
  }

  closeDialog()
}

const dialogTitle = computed(() => {
  switch (dialogMode.value) {
    case 'start':
      return `开始阶段：${ProcessingStages[currentStageIndex.value]?.label}`
    case 'complete':
      return `完成阶段：${ProcessingStages[currentStageIndex.value]?.label}`
    case 'pause':
      return '暂停处理'
    case 'resume':
      return '恢复处理'
    case 'ship':
      return '标记已发货'
    case 'deliver':
      return '标记已送达'
    default:
      return ''
  }
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
            <PriorityBadge v-if="canViewPriority" :priority="order.priority" />
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

          <div v-if="currentRole === 'clinic' && order.currentStage === 'delivered'" class="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
            <div class="flex items-center gap-2">
              <PackageCheck class="w-5 h-5 text-emerald-600" />
              <span class="text-sm font-medium text-emerald-800">交付完成：订单已送达，请检查确认</span>
            </div>
          </div>

          <div v-if="currentRole === 'technician'" class="mt-3">
            <div
              v-for="(entry, idx) in order.stageHistory"
              :key="idx"
            >
              <div
                v-if="isCurrentStage(entry) && entry.notes"
                class="p-3 bg-orange-50 border border-orange-200 rounded-lg"
              >
                <div class="flex items-center gap-2 mb-1">
                  <FileText class="w-4 h-4 text-orange-600" />
                  <span class="text-sm font-medium text-orange-800">当前阶段工艺备注</span>
                </div>
                <p class="text-sm text-orange-700">{{ entry.notes }}</p>
              </div>
            </div>
          </div>
        </div>

        <div class="flex flex-col items-stretch lg:items-end gap-4 w-full lg:w-auto">
          <div class="flex items-center gap-2 flex-wrap">
            <button
              v-if="canCreateOrder"
              class="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              @click="goToNewOrder"
            >
              <Plus class="w-4 h-4" />
              新建
            </button>
            <button
              v-if="canCopyOrder"
              class="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-violet-700 bg-violet-50 border border-violet-200 rounded-lg hover:bg-violet-100 transition-colors"
              @click="handleCopyOrder"
            >
              <RefreshCw class="w-4 h-4" />
              复制
            </button>
            <button
              v-if="canEditOrder"
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

    <div
        v-if="order.status !== 'completed' && (canStart || canComplete || canReturn || canPause || canResume || canShip || canDeliver)"
        class="bg-white rounded-xl border border-slate-200 overflow-hidden mb-6"
      >
        <div
          class="px-5 py-4 border-b border-slate-100 flex items-center justify-between"
        >
          <div class="flex items-center gap-2">
            <div
              class="w-8 h-8 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center"
            >
              <Wrench class="w-4 h-4 text-orange-600" />
            </div>
            <h2 class="text-base font-semibold text-slate-800">
              操作区
            </h2>
          </div>
          <span class="text-xs text-slate-500">
            当前阶段：{{ getStageInfo(order.currentStage)?.label }}
          </span>
        </div>
        <div class="p-5">
          <div class="flex flex-wrap gap-3">
            <button
              v-if="canStart"
              class="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              @click="openDialog('start')"
            >
              <Play class="w-4 h-4" />
              开始阶段
            </button>
            <button
              v-if="canComplete"
              class="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
              @click="openDialog('complete')"
            >
              <CheckCheck class="w-4 h-4" />
              完成阶段
            </button>
            <button
              v-if="canReturn"
              class="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-rose-600 rounded-lg hover:bg-rose-700 transition-colors shadow-sm"
              @click="openReworkForm"
            >
              <AlertTriangle class="w-4 h-4" />
              发起返工
            </button>
            <button
              v-if="canPause"
              class="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition-colors shadow-sm"
              @click="openDialog('pause')"
            >
              <Pause class="w-4 h-4" />
              暂停处理
            </button>
            <button
              v-if="canResume"
              class="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-sky-600 rounded-lg hover:bg-sky-700 transition-colors shadow-sm"
              @click="openDialog('resume')"
            >
              <PlayCircle class="w-4 h-4" />
              恢复处理
            </button>
            <button
              v-if="canShip"
              class="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-violet-600 rounded-lg hover:bg-violet-700 transition-colors shadow-sm"
              @click="openDialog('ship')"
            >
              <Truck class="w-4 h-4" />
              标记已发货
            </button>
            <button
              v-if="canDeliver"
              class="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors shadow-sm"
              @click="openDialog('deliver')"
            >
              <PackageCheck class="w-4 h-4" />
              标记已送达
            </button>
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
                      v-if="canViewResponsibleTechnician && entry.technician"
                      class="flex items-center gap-1"
                    >
                      <Wrench class="w-3 h-3" />
                      {{ entry.technician }}
                    </span>
                    <template v-if="canViewResponsibleTechnician && getTaskForStage(entry.stage)">
                      <span
                        class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border"
                        :class="TaskStatusColors[getTaskForStage(entry.stage)!.status]"
                      >
                        {{ TaskStatusLabels[getTaskForStage(entry.stage)!.status] }}
                      </span>
                      <span
                        class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border"
                        :class="TaskPriorityColors[getTaskForStage(entry.stage)!.priority]"
                      >
                        {{ TaskPriorityLabels[getTaskForStage(entry.stage)!.priority] }}优先级
                      </span>
                      <span
                        v-if="(getTaskForStage(entry.stage)!.reworkCount || 0) > 0"
                        class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 border border-rose-200"
                      >
                        <RefreshCw class="w-2.5 h-2.5" />
                        返工{{ getTaskForStage(entry.stage)!.reworkCount }}次
                      </span>
                      <span
                        v-if="getTaskForStage(entry.stage)!.estimatedCompletionTime"
                        class="inline-flex items-center gap-1"
                      >
                        <Clock class="w-3 h-3" />
                        预计{{ formatShortDate(getTaskForStage(entry.stage)!.estimatedCompletionTime!) }}
                      </span>
                    </template>
                  </div>

                  <div
                    v-if="canViewResponsibleTechnician && getTaskForStage(entry.stage) && getHandoversForStage(entry.stage).length > 0"
                    class="mb-2 p-2.5 bg-violet-50/60 border border-violet-100 rounded-lg"
                  >
                    <div class="text-[10px] font-semibold text-violet-700 mb-1.5 flex items-center gap-1">
                      <ArrowRight class="w-3 h-3" />
                      接手记录（{{ getHandoversForStage(entry.stage).length }}次转派）
                    </div>
                    <div class="space-y-1.5">
                      <div
                        v-for="handover in getHandoversForStage(entry.stage)"
                        :key="handover.id"
                        class="flex items-center gap-2 text-[11px]"
                      >
                        <span class="text-slate-500">{{ formatDate(handover.handedAt) }}</span>
                        <span class="font-medium text-slate-700">{{ handover.fromTechnicianName }}</span>
                        <ArrowRight class="w-3 h-3 text-violet-400" />
                        <span class="font-medium text-violet-700">{{ handover.toTechnicianName }}</span>
                        <span class="text-slate-400">|</span>
                        <span class="text-slate-500 truncate">{{ handover.reason }}</span>
                        <span class="text-slate-400">操作：{{ handover.handedBy }}</span>
                      </div>
                    </div>
                  </div>

                  <div
                    v-if="canEditResponsibleTechnicianAction && !['received', 'shipped', 'delivered'].includes(entry.stage)"
                    class="mb-2 flex items-center justify-end"
                  >
                    <button
                      class="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-violet-700 bg-violet-50 border border-violet-200 rounded-md hover:bg-violet-100 transition-colors"
                      @click="openAssignDialogForStage(entry.stage)"
                    >
                      <Users class="w-3 h-3" />
                      {{ getTaskForStage(entry.stage)?.technicianId ? '转派任务' : '分配技师' }}
                    </button>
                  </div>

                  <p
                    v-if="entry.errorReason"
                    class="text-sm text-rose-700 bg-rose-50 rounded-md px-3 py-2 border border-rose-100 mb-2"
                  >
                    <span class="inline-flex items-center gap-1 font-medium">
                      <AlertTriangle class="w-3.5 h-3.5" />
                      异常原因：
                    </span>
                    {{ entry.errorReason }}
                  </p>

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
          class="bg-white rounded-xl border border-slate-200 overflow-hidden"
        >
          <div
            class="px-5 py-4 border-b border-slate-100 flex items-center justify-between"
          >
            <div class="flex items-center gap-2">
              <div
                class="w-8 h-8 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center"
              >
                <Truck class="w-4 h-4 text-teal-600" />
              </div>
              <div>
                <h2 class="text-base font-semibold text-slate-800">
                  物流追踪
                </h2>
                <p class="text-xs text-slate-500">
                  模型收件与成品发货全流程记录
                </p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <button
                class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-teal-700 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 transition-colors"
                @click="router.push('/logistics/receive')"
              >
                <Package class="w-3.5 h-3.5" />
                收件登记
              </button>
              <button
                class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                @click="router.push('/logistics/ship')"
              >
                <Send class="w-3.5 h-3.5" />
                发货管理
              </button>
            </div>
          </div>
          <div v-if="hasLogistics" class="p-5 space-y-5">
            <div
              v-for="logistic in orderLogistics"
              :key="logistic.id"
              class="border border-slate-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow"
            >
              <div
                class="px-4 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between flex-wrap gap-2"
              >
                <div class="flex items-center gap-3 flex-wrap">
                  <span
                    class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium"
                    :class="SignStatusColors[logistic.signStatus]"
                  >
                    {{ SignStatusLabels[logistic.signStatus] }}
                  </span>
                  <span
                    class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700"
                  >
                    {{ logistic.type === 'receive' ? '模型收件' : '成品发货' }}
                  </span>
                  <span class="text-sm font-mono font-medium text-slate-800">
                    {{ logistic.trackingNumber }}
                  </span>
                  <span class="text-xs text-slate-500">
                    {{ ShippingMethodLabels[logistic.shippingMethod] }}
                  </span>
                </div>
                <button
                  class="text-xs text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1"
                  @click="goToLogisticsDetail(logistic.id)"
                >
                  查看详情
                  <ExternalLink class="w-3 h-3" />
                </button>
              </div>
              <div class="p-4">
                <div
                  v-if="logistic.timeline.length > 0"
                  class="space-y-0"
                >
                  <div
                    v-for="(entry, idx) in logistic.timeline"
                    :key="entry.id"
                    class="relative pl-10 pb-5 last:pb-0"
                  >
                    <div
                      v-if="idx < logistic.timeline.length - 1"
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
                      class="bg-white border border-slate-200 rounded-lg p-3 ml-2"
                      :class="{
                        'border-rose-200 bg-rose-50/50': entry.isException,
                        'ring-2 ring-emerald-100 border-emerald-200': idx === 0 && !entry.isException,
                      }"
                    >
                      <div
                        class="flex items-center justify-between mb-1.5 flex-wrap gap-2"
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
                        </div>
                        <span class="text-xs text-slate-500">
                          {{ formatDate(entry.timestamp) }}
                        </span>
                      </div>

                      <p class="text-xs text-slate-600">
                        {{ entry.description }}
                      </p>
                    </div>
                  </div>
                </div>
                <div v-else class="p-6 text-center">
                  <div class="w-10 h-10 mx-auto mb-2 rounded-full bg-slate-100 flex items-center justify-center">
                    <Clock class="w-5 h-5 text-slate-300" />
                  </div>
                  <p class="text-xs text-slate-500">暂无物流轨迹</p>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="p-10 text-center">
            <div class="w-16 h-16 mx-auto mb-3 rounded-full bg-slate-100 flex items-center justify-center">
              <Truck class="w-8 h-8 text-slate-300" />
            </div>
            <p class="text-sm font-medium text-slate-600 mb-1">暂无物流记录</p>
            <p class="text-xs text-slate-400 mb-4">
              订单的模型收件和成品发货记录将显示在这里
            </p>
            <div class="flex items-center justify-center gap-2">
              <button
                class="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-teal-700 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 transition-colors"
                @click="router.push('/logistics/receive')"
              >
                <Package class="w-3.5 h-3.5" />
                去登记收件
              </button>
              <button
                class="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                @click="router.push('/logistics/ship')"
              >
                <Send class="w-3.5 h-3.5" />
                去创建发货
              </button>
            </div>
          </div>
        </div>

        <div
          class="bg-white rounded-xl border overflow-hidden"
          :class="order.returnRecords.length > 0 ? 'border-rose-200' : 'border-slate-200'"
        >
          <div
            class="px-5 py-4 border-b border-slate-100 flex items-center justify-between"
            :class="order.returnRecords.length > 0 ? 'bg-rose-50/50 border-rose-100' : 'bg-slate-50/50'"
          >
            <div class="flex items-center gap-2">
              <div
                class="w-8 h-8 rounded-lg flex items-center justify-center border"
                :class="order.returnRecords.length > 0 ? 'bg-rose-100 border-rose-200' : 'bg-slate-100 border-slate-200'"
              >
                <AlertCircle class="w-4 h-4" :class="order.returnRecords.length > 0 ? 'text-rose-600' : 'text-slate-500'" />
              </div>
              <div>
                <h2 class="text-base font-semibold text-slate-800">
                  返工记录
                </h2>
                <p class="text-xs text-slate-500">
                  共 {{ order.returnRecords.length }} 次返工，
                  进行中 {{ order.returnRecords.filter(r => r.status !== 'closed').length }} 次
                </p>
              </div>
            </div>
            <button
              v-if="canReturn"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-rose-600 rounded-lg hover:bg-rose-700 transition-colors shadow-sm"
              @click="openReworkForm"
            >
              <Plus class="w-3.5 h-3.5" />
              发起返工
            </button>
          </div>
          <div v-if="order.returnRecords.length > 0" class="p-5 space-y-4">
            <div
              v-for="(record, idx) in order.returnRecords"
              :key="record.id"
              class="border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md"
              :class="record.status === 'closed' ? 'border-slate-200 bg-slate-50/30' : 'border-rose-200 bg-rose-50/30 hover:bg-rose-50/50'"
              @click="openReworkDetail(record)"
            >
              <div
                class="flex items-start justify-between mb-3 flex-wrap gap-2"
              >
                <div class="flex items-center gap-2 flex-wrap">
                  <span
                    class="inline-flex items-center justify-center w-6 h-6 rounded-full text-white text-xs font-bold"
                    :class="record.status === 'closed' ? 'bg-slate-500' : 'bg-rose-600'"
                  >
                    #{{ idx + 1 }}
                  </span>
                  <span class="font-medium text-slate-800 text-sm">
                    {{ ReworkSourceStageLabels[record.sourceStage] }}
                    来源
                  </span>
                  <span
                    class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border"
                    :class="ReworkStatusColors[record.status]"
                  >
                    {{ ReworkStatusLabels[record.status] }}
                  </span>
                  <span
                    v-if="record.recheckResult"
                    class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium border"
                    :class="record.recheckResult === 'pass' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'"
                  >
                    <ThumbsUp v-if="record.recheckResult === 'pass'" class="w-2.5 h-2.5" />
                    <ThumbsDown v-else class="w-2.5 h-2.5" />
                    {{ record.recheckResult === 'pass' ? '复检通过' : '复检不通过' }}
                  </span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-xs text-slate-500">
                    {{ formatDate(record.returnedAt) }}
                  </span>
                  <FileSearch class="w-3.5 h-3.5 text-slate-400" />
                </div>
              </div>

              <div class="flex flex-wrap gap-1.5 mb-3">
                <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                  {{ ReworkProblemTypeLabels[record.problemType] }}
                </span>
                <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                  {{ ReworkRootCauseLabels[record.rootCause] }}
                </span>
                <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                  {{ ReworkResponsibilityLabels[record.responsibility] }}
                </span>
                <span
                  v-for="tooth in record.relatedTeeth.slice(0, 5)"
                  :key="tooth"
                  class="inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-50 border border-rose-200 text-rose-700"
                >
                  {{ tooth }}
                </span>
                <span
                  v-if="record.relatedTeeth.length > 5"
                  class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200"
                >
                  +{{ record.relatedTeeth.length - 5 }}
                </span>
                <span
                  v-if="canViewTotalAmount && record.chargeable"
                  class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200"
                >
                  ¥{{ record.chargeAmount?.toLocaleString() || '0' }}
                </span>
              </div>

              <div class="space-y-2 text-sm">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div
                    class="p-2.5 bg-white rounded-lg border border-slate-200"
                  >
                    <div class="flex items-center gap-1 text-[11px] font-medium text-rose-600 mb-0.5">
                      <XCircle class="w-3 h-3" />
                      问题描述
                    </div>
                    <p class="text-slate-700 text-xs line-clamp-2">{{ record.reason }}</p>
                  </div>
                  <div
                    class="p-2.5 bg-white rounded-lg border border-slate-200"
                  >
                    <div class="flex items-center gap-1 text-[11px] font-medium text-emerald-600 mb-0.5">
                      <Wrench class="w-3 h-3" />
                      整改措施
                    </div>
                    <p class="text-slate-700 text-xs line-clamp-2">
                      {{ record.correctiveAction }}
                    </p>
                  </div>
                </div>

                <div
                  class="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t"
                  :class="record.status === 'closed' ? 'border-slate-200' : 'border-rose-100'"
                >
                  <div class="flex items-center gap-4 flex-wrap">
                    <span v-if="canViewResponsibleTechnician && record.responsibleTechnician" class="inline-flex items-center gap-1">
                      <User class="w-3 h-3" />
                      责任技师：{{ record.responsibleTechnician }}
                    </span>
                    <span class="inline-flex items-center gap-1">
                      <ArrowRight class="w-3 h-3" />
                      {{ getStageInfo(record.stageBeforeRework)?.label }} → {{ getStageInfo(record.stageReturnedFrom)?.label }}
                    </span>
                  </div>
                  <div class="flex items-center gap-3">
                    <span class="inline-flex items-center gap-1">
                      <Clock class="w-3 h-3" />
                      截止：{{ formatShortDate(record.deadline) }}
                    </span>
                    <span
                      v-if="record.status === 'closed'"
                      class="inline-flex items-center gap-1 text-emerald-600 font-medium"
                    >
                      <CheckCircle2 class="w-3.5 h-3.5" />
                      {{ formatShortDate(record.closedAt || record.completedAt || '') }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="p-10 text-center">
            <div class="w-16 h-16 mx-auto mb-3 rounded-full bg-slate-100 flex items-center justify-center">
              <CheckCircle2 class="w-8 h-8 text-slate-300" />
            </div>
            <p class="text-sm font-medium text-slate-600 mb-1">暂无返工记录</p>
            <p class="text-xs text-slate-400 mb-4">保持良好质量，订单加工顺利</p>
            <button
              v-if="canReturn"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-600 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 transition-colors"
              @click="openReworkForm"
            >
              <AlertTriangle class="w-3.5 h-3.5" />
              发起首次返工
            </button>
          </div>
        </div>

        <div
          v-if="canViewResponsibleTechnician"
          class="bg-white rounded-xl border border-slate-200 overflow-hidden"
        >
          <div
            class="px-5 py-4 border-b border-slate-100 flex items-center justify-between"
          >
            <div class="flex items-center gap-2">
              <div
                class="w-8 h-8 rounded-lg bg-violet-50 border border-violet-100 flex items-center justify-center"
              >
                <Users class="w-4 h-4 text-violet-600" />
              </div>
              <div>
                <h2 class="text-base font-semibold text-slate-800">
                  技师排程与责任分配
                </h2>
                <p class="text-xs text-slate-500">
                  各阶段任务分配、接手记录和进度状态
                </p>
              </div>
            </div>
            <span class="text-xs text-slate-500">
              共 {{ ProcessingStages.filter((s) => !['received', 'shipped', 'delivered'].includes(s.stage)).length }} 个加工阶段
            </span>
          </div>
          <div class="divide-y divide-slate-100">
            <div
              v-for="stage in ProcessingStages.filter((s) => !['received', 'shipped', 'delivered'].includes(s.stage))"
              :key="stage.stage"
              class="px-5 py-3 hover:bg-slate-50/50 transition-colors"
            >
              <div class="flex items-start justify-between gap-4">
                <div class="flex items-start gap-3 min-w-0 flex-1">
                  <div
                    class="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                    :class="
                      order.currentStage === stage.stage
                        ? 'bg-blue-100 border border-blue-200'
                        : ProcessingStages.findIndex((s) => s.stage === order.currentStage) >
                          ProcessingStages.findIndex((s) => s.stage === stage.stage)
                        ? 'bg-emerald-100 border border-emerald-200'
                        : 'bg-slate-100 border border-slate-200'
                    "
                  >
                    <CheckCircle2
                      v-if="ProcessingStages.findIndex((s) => s.stage === order.currentStage) > ProcessingStages.findIndex((s) => s.stage === stage.stage)"
                      class="w-4 h-4 text-emerald-600"
                    />
                    <div
                      v-else-if="order.currentStage === stage.stage"
                      class="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"
                    ></div>
                    <div v-else class="w-2.5 h-2.5 rounded-full bg-slate-400"></div>
                  </div>
                  <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-2 flex-wrap mb-1">
                      <span class="font-semibold text-sm text-slate-800">{{ stage.label }}</span>
                      <span
                        v-if="order.currentStage === stage.stage"
                        class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-700"
                      >
                        当前阶段
                      </span>
                    </div>
                    <div class="text-[11px] text-slate-500 mb-2">{{ stage.description }}</div>

                    <template v-if="getTaskForStage(stage.stage)">
                      <div class="flex items-center gap-2 flex-wrap">
                        <div
                          class="flex items-center gap-1.5 p-1.5 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer hover:border-violet-300 hover:bg-violet-50/50 transition-colors"
                          @click="goToTechnicianDetail(getTaskForStage(stage.stage)!.technicianId)"
                        >
                          <div
                            v-if="getTaskForStage(stage.stage)!.technicianId"
                            class="w-6 h-6 rounded-md flex items-center justify-center text-white text-[10px] font-bold"
                            :class="`bg-gradient-to-br ${technicians.find((t) => t.id === getTaskForStage(stage.stage)!.technicianId)?.avatarColor || 'from-slate-400 to-slate-600'}`"
                          >
                            {{ getTaskForStage(stage.stage)!.technicianName.charAt(0) }}
                          </div>
                          <div
                            v-else
                            class="w-6 h-6 rounded-md flex items-center justify-center bg-slate-200"
                          >
                            <User class="w-3.5 h-3.5 text-slate-500" />
                          </div>
                          <span class="text-xs font-medium text-slate-700">
                            {{ getTaskForStage(stage.stage)!.technicianName || '待分配' }}
                          </span>
                        </div>

                        <span
                          class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium border"
                          :class="TaskStatusColors[getTaskForStage(stage.stage)!.status]"
                        >
                          {{ TaskStatusLabels[getTaskForStage(stage.stage)!.status] }}
                        </span>
                        <span
                          class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium border"
                          :class="TaskPriorityColors[getTaskForStage(stage.stage)!.priority]"
                        >
                          {{ TaskPriorityLabels[getTaskForStage(stage.stage)!.priority] }}
                        </span>
                        <span
                          v-if="(getTaskForStage(stage.stage)!.reworkCount || 0) > 0"
                          class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] bg-rose-50 text-rose-700 border border-rose-200"
                        >
                          <RefreshCw class="w-2.5 h-2.5" />
                          返工{{ getTaskForStage(stage.stage)!.reworkCount }}次
                        </span>
                      </div>

                      <div
                        v-if="getTaskForStage(stage.stage)!.estimatedCompletionTime"
                        class="mt-1.5 text-[10px] text-slate-500 flex items-center gap-1"
                      >
                        <Clock class="w-3 h-3" />
                        预计完成：{{ formatShortDate(getTaskForStage(stage.stage)!.estimatedCompletionTime!) }}
                      </div>

                      <div
                        v-if="getHandoversForStage(stage.stage).length > 0"
                        class="mt-2 text-[10px] text-violet-600 flex items-center gap-1 cursor-pointer hover:text-violet-700"
                      >
                        <ArrowRight class="w-3 h-3" />
                        包含 {{ getHandoversForStage(stage.stage).length }} 次转派接手记录
                      </div>
                    </template>
                    <template v-else>
                      <div class="flex items-center gap-2">
                        <span class="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] bg-slate-100 text-slate-500 border border-slate-200">
                          <Clock class="w-3 h-3" />
                          待分配技师
                        </span>
                        <span class="text-[10px] text-slate-400">
                          预计处理：{{ stage.estimatedDurationDays }} 天
                        </span>
                      </div>
                    </template>
                  </div>
                </div>

                <div class="flex-shrink-0">
                  <button
                    v-if="canEditResponsibleTechnicianAction"
                    class="p-1.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                    title="分配/转派"
                    @click="openAssignDialogForStage(stage.stage)"
                  >
                    <UserCog class="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div
            v-if="canEditResponsibleTechnicianAction"
            class="px-5 py-3 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between"
          >
            <span class="text-[11px] text-slate-500">
              提示：点击「分配」按钮可为各阶段指定责任技师，支持转派和异常处理
            </span>
            <button
              class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-violet-700 bg-violet-50 border border-violet-200 rounded-lg hover:bg-violet-100 transition-colors"
              @click="router.push('/technician-tasks')"
            >
              <ClipboardList class="w-3.5 h-3.5" />
              查看全部任务
            </button>
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

        <AttachmentCard :attachments="order.attachments" />

        <CommunicationCard :communications="order.communications" />
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

        <div v-if="canViewClinicInfo" class="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div
            class="px-5 py-4 border-b border-slate-100 flex items-center justify-between"
          >
            <div class="flex items-center gap-2">
              <div
                class="w-8 h-8 rounded-lg bg-sky-50 border border-sky-100 flex items-center justify-center"
              >
                <Building2 class="w-4 h-4 text-sky-600" />
              </div>
              <h2 class="text-base font-semibold text-slate-800">
                诊所信息
              </h2>
            </div>
            <span v-if="!canEditClinicInfo" class="text-[10px] text-slate-400">
              <Eye class="w-3 h-3 inline mr-1" />
              仅查看
            </span>
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
            class="px-5 py-4 border-b border-slate-100 flex items-center justify-between"
          >
            <div class="flex items-center gap-2">
              <div
                class="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center"
              >
                <Mail class="w-4 h-4 text-slate-600" />
              </div>
              <h2 class="text-base font-semibold text-slate-800">
                取模与费用
              </h2>
            </div>
            <span v-if="!canEditInternalCost" class="text-[10px] text-slate-400">
              <Eye class="w-3 h-3 inline mr-1" />
              仅查看
            </span>
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
              v-if="canViewTotalAmount && order.totalAmount"
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

  <Teleport to="body">
    <div
      v-if="showDialog"
      class="fixed inset-0 z-50 flex items-center justify-center"
    >
      <div
        class="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        @click="closeDialog"
      ></div>
      <div
        class="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
      >
        <div
          class="px-5 py-4 border-b border-slate-100 flex items-center justify-between"
        >
          <h3 class="text-base font-semibold text-slate-800">
            {{ dialogTitle }}
          </h3>
          <button
            class="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            @click="closeDialog"
          >
            <X class="w-4 h-4" />
          </button>
        </div>
        <div class="p-5 space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">
              操作人
            </label>
            <input
              v-model="formTechnician"
              type="text"
              placeholder="请输入操作人姓名"
              class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-400"
            />
          </div>

          <div v-if="dialogMode === 'complete'">
            <label class="block text-sm font-medium text-slate-700 mb-1.5">
              异常原因（可选）
            </label>
            <textarea
              v-model="formErrorReason"
              rows="2"
              placeholder="若本阶段存在异常情况请填写，正常完成可留空"
              class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-400 resize-none"
            ></textarea>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">
              备注（可选）
            </label>
            <textarea
              v-model="formNotes"
              rows="2"
              placeholder="请输入操作备注"
              class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-400 resize-none"
            ></textarea>
          </div>
        </div>
        <div
          class="px-5 py-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50"
        >
          <button
            class="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            @click="closeDialog"
          >
            取消
          </button>
          <button
            class="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            @click="confirmAction"
          >
            确认
          </button>
        </div>
      </div>
    </div>
  </Teleport>

  <ReworkFormDialog
    :show="showReworkForm"
    :order="order"
    @close="closeReworkForm"
    @submit="handleInitiateRework"
  />

  <ReworkDetailPanel
    :show="showReworkDetail"
    :order="order"
    :rework="selectedRework"
    @close="closeReworkDetail"
    @accept="handleAcceptRework"
    @start-rectification="handleStartRectification"
    @submit-for-recheck="handleSubmitForRecheck"
    @close-rework="handleCloseRework"
  />

  <TaskAssignDialog
    :show="showTaskAssignDialog"
    :is-transfer="assignMode === 'transfer'"
    :order-id="order?.id"
    :order-number="order?.orderNumber"
    :stage="selectedStageForAssign || undefined"
    :work-items-count="order?.workItems.filter((w) => w.toothNumber !== 'all').length"
    :clinic-name="order?.clinic.name"
    :delivery-date="order?.deliveryDate"
    :order-priority="order?.priority"
    :existing-technician-id="existingTaskForAssign?.technicianId"
    :existing-technician-name="existingTaskForAssign?.technicianName"
    @close="showTaskAssignDialog = false"
    @submit="handleTaskAssignSubmit"
  />
</template>
