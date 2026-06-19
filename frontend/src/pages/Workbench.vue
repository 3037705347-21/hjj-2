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
  User,
  Building2,
  Play,
  Pause,
  CheckCircle,
  Gauge,
  Timer,
  Target,
  Award,
  Activity,
  StickyNote,
  X,
  FileText,
  Wrench,
  AlertOctagon,
  PlayCircle,
  PauseCircle,
  CircleCheckBig,
  CircleDollarSign,
  Sparkles,
  ChevronDown,
  ListTodo,
} from 'lucide-vue-next'
import StatCard from '../components/StatCard.vue'
import { useRoles } from '../composables/useRoles'
import { useTechnicians } from '../composables/useTechnicians'
import type {
  Technician,
  TaskAssignment,
  ExceptionType,
  TechnicianWorkbenchStats,
} from '../types'
import {
  ProcessingStages,
  TaskStatusLabels,
  TaskStatusColors,
  TaskPriorityLabels,
  TaskPriorityColors,
  TechnicianStatusLabels,
  TechnicianLevelLabels,
  TechnicianLevelColors,
  ExceptionTypeLabels,
} from '../types'

const router = useRouter()
const { currentRole, currentTechnicianName, setTechnicianName } = useRoles()
const {
  technicians,
  onDutyTechnicians,
  getTechnicianByName,
  getActiveTasksByTechnician,
  getTodayTasksByTechnician,
  getCompletedTodayTasks,
  getTechnicianWorkbenchStats,
  getTasksByTechnician,
  acceptTask,
  startTask,
  pauseTask,
  resumeTask,
  completeTask,
  reportException,
  refreshTechnicianStats,
} = useTechnicians()

const selectedTechnicianName = ref('')
const selectedTechnician = ref<Technician | null>(null)
const showTechDropdown = ref(false)
const today = new Date()

watch(currentTechnicianName, (name) => {
  if (name) {
    selectedTechnicianName.value = name
    const tech = getTechnicianByName(name)
    if (tech) {
      selectedTechnician.value = tech
    }
  }
}, { immediate: true })

watch([currentRole, technicians], () => {
  initTechnician()
}, { immediate: true })

function initTechnician() {
  if (currentRole.value === 'technician' && currentTechnicianName.value) {
    selectedTechnicianName.value = currentTechnicianName.value
    const tech = getTechnicianByName(currentTechnicianName.value)
    if (tech) {
      selectedTechnician.value = tech
      return
    }
  }
  if (!selectedTechnicianName.value && onDutyTechnicians.value.length > 0) {
    const firstTech = onDutyTechnicians.value[0]
    selectedTechnicianName.value = firstTech.name
    selectedTechnician.value = firstTech
  }
}

function selectTechnician(tech: Technician) {
  selectedTechnicianName.value = tech.name
  selectedTechnician.value = tech
  if (currentRole.value === 'technician') {
    setTechnicianName(tech.name)
  }
  showTechDropdown.value = false
}

const workbenchStats = computed<TechnicianWorkbenchStats | null>(() => {
  if (!selectedTechnician.value) return null
  return getTechnicianWorkbenchStats(selectedTechnician.value.id)
})

const allTasks = computed<TaskAssignment[]>(() => {
  if (!selectedTechnician.value) return []
  return getTasksByTechnician(selectedTechnician.value.id)
})

const assignedTasks = computed(() =>
  allTasks.value.filter((t) => t.status === 'assigned')
)

const acceptedTasks = computed(() =>
  allTasks.value.filter((t) => t.status === 'accepted')
)

const inProgressTasks = computed(() =>
  allTasks.value.filter((t) => t.status === 'in-progress' || t.status === 'paused')
)

const completedTodayTasks = computed(() => {
  const todayStr = today.toDateString()
  return allTasks.value.filter(
    (t) => t.status === 'completed' && t.completedAt && new Date(t.completedAt).toDateString() === todayStr
  )
})

const todayCompletedTimeline = computed(() => {
  return [...completedTodayTasks.value]
    .filter((t) => t.completedAt)
    .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())
})

const inProgressWithNotes = computed(() => {
  return allTasks.value.filter(
    (t) => (t.status === 'in-progress' || t.status === 'paused') && t.notes && t.notes.trim().length > 0
  )
})

function getStageLabel(stage: string): string {
  const stageInfo = ProcessingStages.find((s) => s.stage === stage)
  return stageInfo?.label || stage
}

function isOverdue(task: TaskAssignment): boolean {
  if (!task.deliveryDate || task.status === 'completed') return false
  return new Date(task.deliveryDate) < new Date(today.toDateString())
}

function formatDateTime(dateStr?: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

function formatTime(dateStr?: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

function goToOrderDetail(task: TaskAssignment) {
  router.push(`/order/${task.orderId}`)
}

interface ActionDialogState {
  show: boolean
  task: TaskAssignment | null
  action: 'accept' | 'start' | 'pause' | 'resume' | 'complete' | 'exception' | null
  title: string
}

const actionDialog = ref<ActionDialogState>({
  show: false,
  task: null,
  action: null,
  title: '',
})

const actionNote = ref('')
const exceptionType = ref<ExceptionType>('material-shortage')
const exceptionReason = ref('')

function openActionDialog(task: TaskAssignment, action: ActionDialogState['action']) {
  const titles: Record<string, string> = {
    accept: '确认接单',
    start: '开始处理',
    pause: '暂停任务',
    resume: '恢复任务',
    complete: '完成任务',
    exception: '上报异常',
  }
  actionDialog.value = {
    show: true,
    task,
    action,
    title: titles[action || ''] || '',
  }
  actionNote.value = ''
  exceptionType.value = 'material-shortage'
  exceptionReason.value = ''
}

function closeActionDialog() {
  actionDialog.value = {
    show: false,
    task: null,
    action: null,
    title: '',
  }
  actionNote.value = ''
  exceptionType.value = 'material-shortage'
  exceptionReason.value = ''
}

function confirmAction() {
  if (!actionDialog.value.task || !actionDialog.value.action) return

  const task = actionDialog.value.task
  const operator = selectedTechnicianName.value || '系统'
  const action = actionDialog.value.action

  switch (action) {
    case 'accept':
      acceptTask(task.id, operator, actionNote.value || undefined)
      break
    case 'start':
      startTask(task.id, operator, actionNote.value || undefined)
      break
    case 'pause':
      pauseTask(task.id, operator, actionNote.value || undefined)
      break
    case 'resume':
      resumeTask(task.id, operator, actionNote.value || undefined)
      break
    case 'complete':
      completeTask(task.id, operator, actionNote.value || undefined)
      break
    case 'exception':
      if (exceptionReason.value.trim()) {
        reportException(task.id, exceptionType.value, exceptionReason.value, operator)
      }
      break
  }

  refreshTechnicianStats()
  closeActionDialog()
}

const avatarGradients = [
  'bg-gradient-to-br from-emerald-400 to-teal-500',
  'bg-gradient-to-br from-cyan-400 to-blue-500',
  'bg-gradient-to-br from-violet-400 to-purple-500',
  'bg-gradient-to-br from-amber-400 to-orange-500',
  'bg-gradient-to-br from-pink-400 to-rose-500',
  'bg-gradient-to-br from-indigo-400 to-blue-500',
]

function getAvatarGradient(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return avatarGradients[Math.abs(hash) % avatarGradients.length]
}

function getInitial(name: string): string {
  return name.charAt(0).toUpperCase()
}

onMounted(() => {
  initTechnician()
})
</script>

<template>
  <div class="min-h-full p-6">
    <div class="max-w-[1800px] mx-auto">
      <div class="mb-6 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div class="flex items-center gap-5">
            <div
              class="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-emerald-200/50 shrink-0"
              :class="selectedTechnician ? getAvatarGradient(selectedTechnician.name) : avatarGradients[0]"
            >
              <span v-if="selectedTechnician">{{ getInitial(selectedTechnician.name) }}</span>
              <User v-else class="w-10 h-10" />
            </div>

            <div class="min-w-0">
              <div class="flex items-center gap-3 flex-wrap">
                <h1 class="text-2xl font-bold text-slate-900 tracking-tight">
                  {{ selectedTechnician ? `${selectedTechnician.name}技师，您好！` : '请选择技师' }}
                </h1>
                <span
                  v-if="selectedTechnician"
                  class="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border"
                  :class="selectedTechnician.status === 'on-duty' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : selectedTechnician.status === 'busy' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-slate-50 text-slate-600 border-slate-200'"
                >
                  <span
                    class="w-2 h-2 rounded-full"
                    :class="selectedTechnician.status === 'on-duty' ? 'bg-emerald-500' : selectedTechnician.status === 'busy' ? 'bg-rose-500' : 'bg-slate-400'"
                  ></span>
                  {{ TechnicianStatusLabels[selectedTechnician.status] }}
                </span>
                <span
                  v-if="selectedTechnician?.level"
                  class="inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold border"
                  :class="TechnicianLevelColors[selectedTechnician.level]"
                >
                  {{ TechnicianLevelLabels[selectedTechnician.level] }}
                </span>
              </div>
              <div class="mt-2 flex items-center gap-4 text-sm text-slate-500 flex-wrap">
                <span v-if="selectedTechnician?.department" class="inline-flex items-center gap-1.5">
                  <Building2 class="w-4 h-4" />
                  {{ selectedTechnician.department }}
                </span>
                <span v-if="selectedTechnician" class="inline-flex items-center gap-1.5">
                  <Wrench class="w-4 h-4" />
                  {{ selectedTechnician.skills.slice(0, 3).map(s => ProcessingStages.find(p => p.stage === s)?.label || s).join('、') || '暂无技能' }}
                </span>
                <span v-if="selectedTechnician?.employeeCode" class="inline-flex items-center gap-1.5">
                  <FileText class="w-4 h-4" />
                  工号: {{ selectedTechnician.employeeCode }}
                </span>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <div v-if="currentRole !== 'technician'" class="relative">
              <button
                class="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border-2 border-slate-200 rounded-xl hover:border-emerald-300 hover:bg-emerald-50/50 transition-all"
                @click="showTechDropdown = !showTechDropdown"
              >
                <ListTodo class="w-4 h-4 text-emerald-600" />
                选择技师
                <ChevronDown class="w-4 h-4" :class="{ 'rotate-180': showTechDropdown }" />
              </button>
              <div
                v-if="showTechDropdown"
                class="absolute top-full right-0 mt-2 w-64 bg-white rounded-xl border border-slate-200 shadow-xl z-50 overflow-hidden"
              >
                <div class="p-2">
                  <div class="text-xs font-semibold text-slate-500 px-3 py-2">在岗技师</div>
                  <button
                    v-for="tech in onDutyTechnicians"
                    :key="tech.id"
                    class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-emerald-50 transition-colors text-left"
                    :class="{ 'bg-emerald-50 border-2 border-emerald-200': selectedTechnician?.id === tech.id }"
                    @click="selectTechnician(tech)"
                  >
                    <div
                      class="w-9 h-9 rounded-lg flex items-center justify-center text-white text-sm font-bold shrink-0"
                      :class="getAvatarGradient(tech.name)"
                    >
                      {{ getInitial(tech.name) }}
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="text-sm font-medium text-slate-800 truncate">{{ tech.name }}</div>
                      <div class="text-xs text-slate-500 truncate">
                        {{ TechnicianStatusLabels[tech.status] }}
                        <span v-if="tech.level" class="ml-1">· {{ TechnicianLevelLabels[tech.level] }}</span>
                      </div>
                    </div>
                    <CheckCircle2
                      v-if="selectedTechnician?.id === tech.id"
                      class="w-4 h-4 text-emerald-600 shrink-0"
                    />
                  </button>
                </div>
              </div>
            </div>
            <button
              class="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors"
              @click="refreshTechnicianStats"
            >
              <RefreshCw class="w-4 h-4" />
              刷新
            </button>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <StatCard
          title="待处理"
          :value="workbenchStats?.pendingCount ?? 0"
          :icon="ClipboardList"
          tone="primary"
          description="已分配+已接单"
        />
        <StatCard
          title="处理中"
          :value="workbenchStats?.inProgressCount ?? 0"
          :icon="Play"
          tone="warning"
          description="进行中任务"
        />
        <StatCard
          title="今日完成"
          :value="workbenchStats?.completedTodayCount ?? 0"
          :icon="CalendarCheck"
          tone="success"
          description="按时完成"
        />
        <StatCard
          title="异常任务"
          :value="workbenchStats?.exceptionCount ?? 0"
          :icon="AlertTriangle"
          tone="danger"
          description="需处理异常"
        />
        <StatCard
          title="逾期任务"
          :value="workbenchStats?.overdueCount ?? 0"
          :icon="CalendarX"
          tone="danger"
          description="交期已过"
        />
        <StatCard
          title="返工任务"
          :value="workbenchStats?.reworkCount ?? 0"
          :icon="RefreshCw"
          tone="warning"
          description="含返工次数"
        />
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
        <div class="lg:col-span-1 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div class="flex items-center gap-2 mb-6">
            <div class="p-2 bg-emerald-100 rounded-xl">
              <Gauge class="w-5 h-5 text-emerald-600" />
            </div>
            <h3 class="text-base font-semibold text-slate-800">产能仪表盘</h3>
          </div>

          <div class="flex flex-col items-center">
            <div class="relative w-44 h-44">
              <svg class="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#f1f5f9"
                  stroke-width="12"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="url(#capacityGradient)"
                  stroke-width="12"
                  stroke-linecap="round"
                  :stroke-dasharray="251.2"
                  :stroke-dashoffset="251.2 * (1 - (workbenchStats?.capacityUsedPercent ?? 0) / 100)"
                  class="transition-all duration-700 ease-out"
                />
                <defs>
                  <linearGradient id="capacityGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stop-color="#10b981" />
                    <stop offset="100%" stop-color="#06b6d4" />
                  </linearGradient>
                </defs>
              </svg>
              <div class="absolute inset-0 flex flex-col items-center justify-center">
                <span class="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent">
                  {{ workbenchStats?.capacityUsedPercent ?? 0 }}%
                </span>
                <span class="text-xs text-slate-500 mt-1">产能使用率</span>
              </div>
            </div>

            <div class="w-full mt-6 space-y-4">
              <div class="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div class="flex items-center gap-2">
                  <Target class="w-4 h-4 text-slate-500" />
                  <span class="text-sm text-slate-600">当前在制</span>
                </div>
                <span class="text-lg font-bold text-slate-800">
                  {{ selectedTechnician?.currentTasksCount ?? 0 }}
                </span>
              </div>
              <div class="flex items-center justify-between p-3 bg-emerald-50/70 rounded-xl">
                <div class="flex items-center gap-2">
                  <Award class="w-4 h-4 text-emerald-600" />
                  <span class="text-sm text-slate-600">产能上限</span>
                </div>
                <span class="text-lg font-bold text-emerald-700">
                  {{ selectedTechnician?.capacityLimit ?? 0 }}
                </span>
              </div>
              <div class="flex items-center justify-between p-3 bg-cyan-50/70 rounded-xl">
                <div class="flex items-center gap-2">
                  <Timer class="w-4 h-4 text-cyan-600" />
                  <span class="text-sm text-slate-600">平均处理时长</span>
                </div>
                <span class="text-lg font-bold text-cyan-700">
                  {{ workbenchStats?.avgProcessingMinutes ?? 0 }}<span class="text-sm font-normal ml-1">分钟</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="lg:col-span-3">
          <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm h-full">
            <div class="flex items-center justify-between mb-6">
              <div class="flex items-center gap-2">
                <div class="p-2 bg-teal-100 rounded-xl">
                  <ListTodo class="w-5 h-5 text-teal-600" />
                </div>
                <h3 class="text-base font-semibold text-slate-800">我的任务看板</h3>
              </div>
              <div class="text-xs text-slate-500">
                共 {{ allTasks.length }} 条任务
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <div class="bg-slate-50/70 rounded-2xl border border-slate-200 p-4 min-h-[500px] flex flex-col">
                <div class="flex items-center justify-between mb-4">
                  <div class="flex items-center gap-2">
                    <div class="p-1.5 bg-blue-100 rounded-lg">
                      <ClipboardList class="w-4 h-4 text-blue-600" />
                    </div>
                    <h4 class="text-sm font-semibold text-slate-700">待接取</h4>
                  </div>
                  <span class="inline-flex items-center justify-center min-w-7 h-7 px-2.5 rounded-full bg-blue-500 text-white text-xs font-bold">
                    {{ assignedTasks.length }}
                  </span>
                </div>
                <div class="space-y-3 flex-1">
                  <div
                    v-for="task in assignedTasks"
                    :key="task.id"
                    class="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md hover:border-blue-200 transition-all"
                  >
                    <div class="flex items-start justify-between mb-3">
                      <button
                        class="font-mono text-sm font-bold text-slate-800 hover:text-blue-600 transition-colors"
                        @click="goToOrderDetail(task)"
                      >
                        {{ task.orderNumber }}
                      </button>
                      <span
                        class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border"
                        :class="TaskPriorityColors[task.priority]"
                      >
                        {{ TaskPriorityLabels[task.priority] }}
                      </span>
                    </div>
                    <div class="flex items-center gap-2 mb-3 flex-wrap">
                      <span class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
                        {{ getStageLabel(task.stage) }}
                      </span>
                      <span
                        v-if="task.orderPriority"
                        class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium"
                        :class="task.orderPriority === 'stat' ? 'bg-rose-50 text-rose-700' : task.orderPriority === 'urgent' ? 'bg-orange-50 text-orange-700' : 'bg-slate-50 text-slate-600'"
                      >
                        {{ task.orderPriority === 'stat' ? '特急' : task.orderPriority === 'urgent' ? '加急' : '常规' }}
                      </span>
                    </div>
                    <div class="space-y-1.5 text-xs text-slate-600 mb-4">
                      <div v-if="task.clinicName" class="flex items-center gap-1.5">
                        <Building2 class="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span class="truncate">{{ task.clinicName }}</span>
                      </div>
                      <div v-if="task.workItemsCount" class="flex items-center gap-1.5">
                        <Sparkles class="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{{ task.workItemsCount }} 件修复体</span>
                      </div>
                      <div
                        v-if="task.estimatedCompletionTime"
                        class="flex items-center gap-1.5"
                        :class="{ 'text-rose-600 font-medium': isOverdue(task) }"
                      >
                        <Clock class="w-3.5 h-3.5 shrink-0" :class="{ 'text-rose-500': isOverdue(task), 'text-slate-400': !isOverdue(task) }" />
                        <span>{{ formatDateTime(task.estimatedCompletionTime) }}</span>
                        <span v-if="isOverdue(task)" class="text-rose-600 font-medium">(逾期)</span>
                      </div>
                    </div>
                    <div>
                      <button
                        class="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 active:bg-emerald-800 transition-colors shadow-sm shadow-emerald-200"
                        @click="openActionDialog(task, 'accept')"
                      >
                        <CheckCircle2 class="w-4 h-4" />
                        接单
                      </button>
                    </div>
                  </div>
                  <div v-if="assignedTasks.length === 0" class="flex flex-col items-center justify-center py-12 text-slate-400">
                    <ClipboardList class="w-12 h-12 mb-2 opacity-40" />
                    <span class="text-sm">暂无待接取任务</span>
                  </div>
                </div>
              </div>

              <div class="bg-cyan-50/50 rounded-2xl border border-cyan-200 p-4 min-h-[500px] flex flex-col">
                <div class="flex items-center justify-between mb-4">
                  <div class="flex items-center gap-2">
                    <div class="p-1.5 bg-cyan-100 rounded-lg">
                      <CircleDollarSign class="w-4 h-4 text-cyan-600" />
                    </div>
                    <h4 class="text-sm font-semibold text-slate-700">已接单</h4>
                  </div>
                  <span class="inline-flex items-center justify-center min-w-7 h-7 px-2.5 rounded-full bg-cyan-500 text-white text-xs font-bold">
                    {{ acceptedTasks.length }}
                  </span>
                </div>
                <div class="space-y-3 flex-1">
                  <div
                    v-for="task in acceptedTasks"
                    :key="task.id"
                    class="bg-white rounded-xl border border-cyan-100 p-4 hover:shadow-md hover:border-cyan-300 transition-all"
                  >
                    <div class="flex items-start justify-between mb-3">
                      <button
                        class="font-mono text-sm font-bold text-slate-800 hover:text-cyan-600 transition-colors"
                        @click="goToOrderDetail(task)"
                      >
                        {{ task.orderNumber }}
                      </button>
                      <span
                        class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border"
                        :class="TaskPriorityColors[task.priority]"
                      >
                        {{ TaskPriorityLabels[task.priority] }}
                      </span>
                    </div>
                    <div class="flex items-center gap-2 mb-3 flex-wrap">
                      <span class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-cyan-100 text-cyan-700">
                        {{ getStageLabel(task.stage) }}
                      </span>
                      <span
                        v-if="task.reworkCount > 0"
                        class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200"
                      >
                        <RefreshCw class="w-3 h-3" />
                        返工 {{ task.reworkCount }} 次
                      </span>
                    </div>
                    <div class="space-y-1.5 text-xs text-slate-600 mb-4">
                      <div v-if="task.clinicName" class="flex items-center gap-1.5">
                        <Building2 class="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span class="truncate">{{ task.clinicName }}</span>
                      </div>
                      <div v-if="task.workItemsCount" class="flex items-center gap-1.5">
                        <Sparkles class="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{{ task.workItemsCount }} 件修复体</span>
                      </div>
                      <div
                        v-if="task.estimatedCompletionTime"
                        class="flex items-center gap-1.5"
                        :class="{ 'text-rose-600 font-medium': isOverdue(task) }"
                      >
                        <Clock class="w-3.5 h-3.5 shrink-0" :class="{ 'text-rose-500': isOverdue(task), 'text-slate-400': !isOverdue(task) }" />
                        <span>{{ formatDateTime(task.estimatedCompletionTime) }}</span>
                        <span v-if="isOverdue(task)" class="text-rose-600 font-medium">(逾期)</span>
                      </div>
                    </div>
                    <div>
                      <button
                        class="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-sm shadow-blue-200"
                        @click="openActionDialog(task, 'start')"
                      >
                        <PlayCircle class="w-4 h-4" />
                        开始处理
                      </button>
                    </div>
                  </div>
                  <div v-if="acceptedTasks.length === 0" class="flex flex-col items-center justify-center py-12 text-slate-400">
                    <CircleDollarSign class="w-12 h-12 mb-2 opacity-40" />
                    <span class="text-sm">暂无已接单任务</span>
                  </div>
                </div>
              </div>

              <div class="bg-indigo-50/50 rounded-2xl border border-indigo-200 p-4 min-h-[500px] flex flex-col">
                <div class="flex items-center justify-between mb-4">
                  <div class="flex items-center gap-2">
                    <div class="p-1.5 bg-indigo-100 rounded-lg">
                      <Activity class="w-4 h-4 text-indigo-600" />
                    </div>
                    <h4 class="text-sm font-semibold text-slate-700">处理中</h4>
                  </div>
                  <span class="inline-flex items-center justify-center min-w-7 h-7 px-2.5 rounded-full bg-indigo-500 text-white text-xs font-bold">
                    {{ inProgressTasks.length }}
                  </span>
                </div>
                <div class="space-y-3 flex-1">
                  <div
                    v-for="task in inProgressTasks"
                    :key="task.id"
                    class="bg-white rounded-xl border border-indigo-100 p-4 hover:shadow-md hover:border-indigo-300 transition-all"
                    :class="{ 'ring-2 ring-amber-200 border-amber-300': task.status === 'paused' }"
                  >
                    <div class="flex items-start justify-between mb-3">
                      <button
                        class="font-mono text-sm font-bold text-slate-800 hover:text-indigo-600 transition-colors"
                        @click="goToOrderDetail(task)"
                      >
                        {{ task.orderNumber }}
                      </button>
                      <div class="flex items-center gap-1.5">
                        <span
                          v-if="task.status === 'paused'"
                          class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200"
                        >
                          <PauseCircle class="w-3 h-3" />
                          暂停
                        </span>
                        <span
                          class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border"
                          :class="TaskPriorityColors[task.priority]"
                        >
                          {{ TaskPriorityLabels[task.priority] }}
                        </span>
                      </div>
                    </div>
                    <div class="flex items-center gap-2 mb-3 flex-wrap">
                      <span class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-indigo-100 text-indigo-700">
                        {{ getStageLabel(task.stage) }}
                      </span>
                      <span
                        v-if="task.reworkCount > 0"
                        class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200"
                      >
                        <RefreshCw class="w-3 h-3" />
                        返工 {{ task.reworkCount }} 次
                      </span>
                    </div>
                    <div class="space-y-1.5 text-xs text-slate-600 mb-4">
                      <div v-if="task.clinicName" class="flex items-center gap-1.5">
                        <Building2 class="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span class="truncate">{{ task.clinicName }}</span>
                      </div>
                      <div v-if="task.workItemsCount" class="flex items-center gap-1.5">
                        <Sparkles class="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{{ task.workItemsCount }} 件修复体</span>
                      </div>
                      <div
                        v-if="task.estimatedCompletionTime"
                        class="flex items-center gap-1.5"
                        :class="{ 'text-rose-600 font-medium': isOverdue(task) }"
                      >
                        <Clock class="w-3.5 h-3.5 shrink-0" :class="{ 'text-rose-500': isOverdue(task), 'text-slate-400': !isOverdue(task) }" />
                        <span>{{ formatDateTime(task.estimatedCompletionTime) }}</span>
                        <span v-if="isOverdue(task)" class="text-rose-600 font-medium">(逾期)</span>
                      </div>
                      <div
                        v-if="task.status === 'paused' && task.pausedAt"
                        class="flex items-center gap-1.5 text-amber-600"
                      >
                        <PauseCircle class="w-3.5 h-3.5 shrink-0" />
                        <span>暂停于 {{ formatDateTime(task.pausedAt) }}</span>
                      </div>
                    </div>
                    <div class="grid grid-cols-3 gap-2" v-if="task.status === 'in-progress'">
                      <button
                        class="inline-flex items-center justify-center gap-1 px-2 py-2 text-xs font-semibold text-amber-700 bg-amber-50 rounded-xl hover:bg-amber-100 border border-amber-200 transition-colors"
                        @click="openActionDialog(task, 'pause')"
                      >
                        <PauseCircle class="w-3.5 h-3.5" />
                        暂停
                      </button>
                      <button
                        class="inline-flex items-center justify-center gap-1 px-2 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-xl hover:bg-emerald-100 border border-emerald-200 transition-colors"
                        @click="openActionDialog(task, 'complete')"
                      >
                        <CircleCheckBig class="w-3.5 h-3.5" />
                        完成
                      </button>
                      <button
                        class="inline-flex items-center justify-center gap-1 px-2 py-2 text-xs font-semibold text-rose-700 bg-rose-50 rounded-xl hover:bg-rose-100 border border-rose-200 transition-colors"
                        @click="openActionDialog(task, 'exception')"
                      >
                        <AlertOctagon class="w-3.5 h-3.5" />
                        异常
                      </button>
                    </div>
                    <div v-else-if="task.status === 'paused'">
                      <button
                        class="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 active:bg-emerald-800 transition-colors shadow-sm shadow-emerald-200"
                        @click="openActionDialog(task, 'resume')"
                      >
                        <PlayCircle class="w-4 h-4" />
                        恢复处理
                      </button>
                    </div>
                  </div>
                  <div v-if="inProgressTasks.length === 0" class="flex flex-col items-center justify-center py-12 text-slate-400">
                    <Activity class="w-12 h-12 mb-2 opacity-40" />
                    <span class="text-sm">暂无处理中任务</span>
                  </div>
                </div>
              </div>

              <div class="bg-emerald-50/50 rounded-2xl border border-emerald-200 p-4 min-h-[500px] flex flex-col">
                <div class="flex items-center justify-between mb-4">
                  <div class="flex items-center gap-2">
                    <div class="p-1.5 bg-emerald-100 rounded-lg">
                      <CheckCircle2 class="w-4 h-4 text-emerald-600" />
                    </div>
                    <h4 class="text-sm font-semibold text-slate-700">今日完成</h4>
                  </div>
                  <span class="inline-flex items-center justify-center min-w-7 h-7 px-2.5 rounded-full bg-emerald-500 text-white text-xs font-bold">
                    {{ completedTodayTasks.length }}
                  </span>
                </div>
                <div class="space-y-3 flex-1">
                  <div
                    v-for="task in completedTodayTasks"
                    :key="task.id"
                    class="bg-white rounded-xl border border-emerald-100 p-4 hover:shadow-md hover:border-emerald-300 transition-all"
                  >
                    <div class="flex items-start justify-between mb-3">
                      <button
                        class="font-mono text-sm font-bold text-slate-800 hover:text-emerald-600 transition-colors"
                        @click="goToOrderDetail(task)"
                      >
                        {{ task.orderNumber }}
                      </button>
                      <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 class="w-3 h-3" />
                        已完成
                      </span>
                    </div>
                    <div class="flex items-center gap-2 mb-3 flex-wrap">
                      <span class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-100 text-emerald-700">
                        {{ getStageLabel(task.stage) }}
                      </span>
                      <span
                        v-if="task.reworkCount > 0"
                        class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200"
                      >
                        <RefreshCw class="w-3 h-3" />
                        返工 {{ task.reworkCount }} 次
                      </span>
                    </div>
                    <div class="space-y-1.5 text-xs text-slate-600">
                      <div v-if="task.clinicName" class="flex items-center gap-1.5">
                        <Building2 class="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span class="truncate">{{ task.clinicName }}</span>
                      </div>
                      <div v-if="task.completedAt" class="flex items-center gap-1.5 text-emerald-600 font-medium">
                        <CheckCircle2 class="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>完成于 {{ formatTime(task.completedAt) }}</span>
                      </div>
                    </div>
                  </div>
                  <div v-if="completedTodayTasks.length === 0" class="flex flex-col items-center justify-center py-12 text-slate-400">
                    <CheckCircle2 class="w-12 h-12 mb-2 opacity-40" />
                    <span class="text-sm">暂无完成任务</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div class="flex items-center gap-2 mb-6">
            <div class="p-2 bg-teal-100 rounded-xl">
              <Activity class="w-5 h-5 text-teal-600" />
            </div>
            <h3 class="text-base font-semibold text-slate-800">今日工作时间轴</h3>
          </div>

          <div v-if="todayCompletedTimeline.length > 0" class="relative">
            <div class="absolute left-5 top-2 bottom-2 w-0.5 bg-gradient-to-b from-teal-200 via-cyan-200 to-emerald-200"></div>
            <div class="space-y-4">
              <div
                v-for="(task, index) in todayCompletedTimeline"
                :key="task.id"
                class="relative pl-14"
              >
                <div
                  class="absolute left-3.5 w-4 h-4 rounded-full bg-emerald-500 border-4 border-white shadow-sm ring-2 ring-emerald-200"
                  :style="{ top: '4px' }"
                ></div>
                <div class="bg-gradient-to-r from-emerald-50/80 to-teal-50/50 rounded-xl border border-emerald-100 p-4 hover:shadow-sm transition-shadow">
                  <div class="flex items-start justify-between gap-3 mb-2">
                    <div class="flex items-center gap-2">
                      <span class="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-lg">
                        {{ formatTime(task.completedAt) }}
                      </span>
                      <button
                        class="font-mono text-sm font-bold text-slate-800 hover:text-emerald-600 transition-colors"
                        @click="goToOrderDetail(task)"
                      >
                        {{ task.orderNumber }}
                      </button>
                    </div>
                    <span class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-teal-100 text-teal-700">
                      {{ getStageLabel(task.stage) }}
                    </span>
                  </div>
                  <div class="flex items-center gap-4 text-xs text-slate-500">
                    <span v-if="task.clinicName" class="inline-flex items-center gap-1">
                      <Building2 class="w-3.5 h-3.5" />
                      {{ task.clinicName }}
                    </span>
                    <span v-if="task.workItemsCount" class="inline-flex items-center gap-1">
                      <Sparkles class="w-3.5 h-3.5" />
                      {{ task.workItemsCount }} 件
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="flex flex-col items-center justify-center py-16 text-slate-400">
            <Activity class="w-16 h-16 mb-3 opacity-30" />
            <span class="text-sm font-medium">今日暂无完成记录</span>
            <span class="text-xs mt-1">完成任务后将在此显示时间线</span>
          </div>
        </div>

        <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div class="flex items-center gap-2 mb-6">
            <div class="p-2 bg-amber-100 rounded-xl">
              <StickyNote class="w-5 h-5 text-amber-600" />
            </div>
            <h3 class="text-base font-semibold text-slate-800">工艺备注</h3>
            <span class="text-xs text-slate-500 ml-auto">
              共 {{ inProgressWithNotes.length }} 条
            </span>
          </div>

          <div v-if="inProgressWithNotes.length > 0" class="space-y-4">
            <div
              v-for="task in inProgressWithNotes"
              :key="task.id"
              class="relative bg-gradient-to-r from-amber-50/70 to-orange-50/50 rounded-xl border border-amber-100 p-4 hover:shadow-sm transition-shadow"
            >
              <div class="absolute top-3 right-3">
                <StickyNote class="w-4 h-4 text-amber-400" />
              </div>
              <div class="flex items-start gap-3 mb-3 pr-6">
                <div class="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0">
                  <FileText class="w-4 h-4 text-white" />
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 flex-wrap mb-1">
                    <button
                      class="font-mono text-sm font-bold text-slate-800 hover:text-amber-600 transition-colors"
                      @click="goToOrderDetail(task)"
                    >
                      {{ task.orderNumber }}
                    </button>
                    <span class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-amber-100 text-amber-700">
                      {{ getStageLabel(task.stage) }}
                    </span>
                    <span
                      v-if="task.status === 'paused'"
                      class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200"
                    >
                      <Pause class="w-3 h-3" />
                      暂停
                    </span>
                  </div>
                  <div v-if="task.clinicName" class="text-xs text-slate-500">
                    {{ task.clinicName }}
                  </div>
                </div>
              </div>
              <div class="ml-12 bg-white/80 rounded-lg p-3 border border-amber-100">
                <p class="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {{ task.notes }}
                </p>
              </div>
            </div>
          </div>

          <div v-else class="flex flex-col items-center justify-center py-16 text-slate-400">
            <StickyNote class="w-16 h-16 mb-3 opacity-30" />
            <span class="text-sm font-medium">暂无工艺备注</span>
            <span class="text-xs mt-1">进行中的任务如有备注将在此显示</span>
          </div>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div
        v-if="actionDialog.show"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div
          class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          @click="closeActionDialog"
        ></div>
        <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div class="bg-gradient-to-r from-teal-500 to-emerald-500 px-6 py-4">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-bold text-white">{{ actionDialog.title }}</h3>
              <button
                class="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
                @click="closeActionDialog"
              >
                <X class="w-5 h-5" />
              </button>
            </div>
          </div>

          <div v-if="actionDialog.task" class="p-6">
            <div class="bg-slate-50 rounded-xl p-4 mb-5 border border-slate-100">
              <div class="flex items-center justify-between mb-2">
                <span class="font-mono text-base font-bold text-slate-800">
                  {{ actionDialog.task.orderNumber }}
                </span>
                <span class="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium" :class="TaskStatusColors[actionDialog.task.status]">
                  {{ TaskStatusLabels[actionDialog.task.status] }}
                </span>
              </div>
              <div class="flex items-center gap-2 text-sm text-slate-600">
                <span class="bg-white px-2.5 py-1 rounded-md border border-slate-200">
                  {{ getStageLabel(actionDialog.task.stage) }}
                </span>
                <span v-if="actionDialog.task.clinicName" class="text-slate-500 truncate">
                  · {{ actionDialog.task.clinicName }}
                </span>
              </div>
            </div>

            <div v-if="actionDialog.action !== 'exception'">
              <label class="block text-sm font-semibold text-slate-700 mb-2">
                操作备注 <span class="text-slate-400 font-normal">(可选)</span>
              </label>
              <textarea
                v-model="actionNote"
                rows="3"
                class="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all resize-none text-sm"
                placeholder="请输入操作备注..."
              ></textarea>
            </div>

            <div v-else class="space-y-4">
              <div>
                <label class="block text-sm font-semibold text-slate-700 mb-2">
                  异常类型 <span class="text-rose-500">*</span>
                </label>
                <select
                  v-model="exceptionType"
                  class="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition-all text-sm bg-white"
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
                <label class="block text-sm font-semibold text-slate-700 mb-2">
                  异常原因 <span class="text-rose-500">*</span>
                </label>
                <textarea
                  v-model="exceptionReason"
                  rows="4"
                  class="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition-all resize-none text-sm"
                  placeholder="请详细描述异常情况及原因..."
                ></textarea>
              </div>
            </div>

            <div class="flex gap-3 mt-6">
              <button
                class="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
                @click="closeActionDialog"
              >
                取消
              </button>
              <button
                class="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-white rounded-xl transition-colors shadow-sm"
                :class="actionDialog.action === 'exception'
                  ? 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 shadow-rose-200'
                  : actionDialog.action === 'accept'
                  ? 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 shadow-emerald-200'
                  : actionDialog.action === 'start' || actionDialog.action === 'resume'
                  ? 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-blue-200'
                  : actionDialog.action === 'pause'
                  ? 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800 shadow-amber-200'
                  : 'bg-teal-600 hover:bg-teal-700 active:bg-teal-800 shadow-teal-200'"
                :disabled="actionDialog.action === 'exception' && !exceptionReason.trim()"
                @click="confirmAction"
              >
                <CheckCircle v-if="actionDialog.action === 'accept' || actionDialog.action === 'complete'" class="w-4 h-4" />
                <PlayCircle v-else-if="actionDialog.action === 'start' || actionDialog.action === 'resume'" class="w-4 h-4" />
                <PauseCircle v-else-if="actionDialog.action === 'pause'" class="w-4 h-4" />
                <AlertOctagon v-else-if="actionDialog.action === 'exception'" class="w-4 h-4" />
                确认
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
