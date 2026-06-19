<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  ClipboardList,
  CheckCircle2,
  Play,
  AlertTriangle,
  Clock,
  User,
  Calendar,
  ChevronRight,
  Wrench,
  Users,
  LayoutGrid,
  RotateCcw,
  Flame,
  ArrowUpRight,
  Gauge,
} from 'lucide-vue-next'
import TaskAssignDialog from '../components/TaskAssignDialog.vue'
import StatusBadge from '../components/StatusBadge.vue'
import PriorityBadge from '../components/PriorityBadge.vue'
import type {
  TaskAssignment,
  Technician,
  ScheduleBoardSlot,
  TaskPriority,
  OrderPriority,
  ProcessingStage,
} from '../types'
import {
  ProcessingStages,
  TaskStatusLabels,
  TaskStatusColors,
  TaskPriorityLabels,
  TaskPriorityColors,
  ExceptionTypeLabels,
  TechnicianStatusLabels,
  TechnicianStatusColors,
} from '../types'
import { useTechnicians } from '../composables/useTechnicians'
import { cn } from '../lib/utils'

const router = useRouter()

const {
  technicians,
  tasks,
  getTodayScheduleBoard,
  getCompletedTodayTasks,
  getExceptionTasks,
  getPendingTasks,
  getInProgressTasks,
  onDutyTechnicians,
  assignTask,
} = useTechnicians()

const today = new Date()

const dateText = computed(() => {
  const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
  const y = today.getFullYear()
  const m = String(today.getMonth() + 1).padStart(2, '0')
  const d = String(today.getDate()).padStart(2, '0')
  const w = weekdays[today.getDay()]
  return `今天是 ${y}年${m}月${d}日 ${w}`
})

const totalTasksCount = computed(() => tasks.value.length)

const completedTodayCount = computed(() => getCompletedTodayTasks().length)

const completedPercent = computed(() => {
  if (totalTasksCount.value === 0) return 0
  return Math.round((completedTodayCount.value / totalTasksCount.value) * 100)
})

const inProgressCount = computed(() => getInProgressTasks().length)

const exceptionCount = computed(() => getExceptionTasks().length)

const pendingCount = computed(() => getPendingTasks().length)

const scheduleBoard = computed<ScheduleBoardSlot[]>(() => getTodayScheduleBoard())

const pendingTasks = computed<TaskAssignment[]>(() => getPendingTasks())

const exceptionTasks = computed<TaskAssignment[]>(() => getExceptionTasks())

const showAssignDialog = ref(false)
const selectedPendingTask = ref<TaskAssignment | null>(null)

function openAssignDialog(task: TaskAssignment) {
  selectedPendingTask.value = task
  showAssignDialog.value = true
}

function closeAssignDialog() {
  showAssignDialog.value = false
  selectedPendingTask.value = null
}

function handleAssignSubmit(params: {
  technicianId: string
  technicianName: string
  priority: TaskPriority
  estimatedCompletionTime: string
  notes: string
  assignedBy: string
}) {
  if (!selectedPendingTask.value) return

  assignTask({
    orderId: selectedPendingTask.value.orderId,
    orderNumber: selectedPendingTask.value.orderNumber,
    stage: selectedPendingTask.value.stage,
    technicianId: params.technicianId,
    technicianName: params.technicianName,
    priority: params.priority,
    estimatedCompletionTime: params.estimatedCompletionTime,
    notes: params.notes,
    assignedBy: params.assignedBy,
    workItemsCount: selectedPendingTask.value.workItemsCount,
    clinicName: selectedPendingTask.value.clinicName,
    deliveryDate: selectedPendingTask.value.deliveryDate,
    orderPriority: selectedPendingTask.value.orderPriority,
  })

  closeAssignDialog()
}

function getCapacityColorClass(used: number, estimated: number): string {
  if (estimated === 0) return 'bg-slate-300'
  const pct = (used / estimated) * 100
  if (pct >= 90) return 'bg-rose-500'
  if (pct >= 70) return 'bg-amber-500'
  return 'bg-emerald-500'
}

function getCapacityTextClass(used: number, estimated: number): string {
  if (estimated === 0) return 'text-slate-600'
  const pct = (used / estimated) * 100
  if (pct >= 90) return 'text-rose-600'
  if (pct >= 70) return 'text-amber-600'
  return 'text-emerald-600'
}

function getCapacityBgClass(used: number, estimated: number): string {
  if (estimated === 0) return 'bg-slate-100'
  const pct = (used / estimated) * 100
  if (pct >= 90) return 'bg-rose-50'
  if (pct >= 70) return 'bg-amber-50'
  return 'bg-emerald-50'
}

function getCapacityPercent(used: number, estimated: number): number {
  if (estimated === 0) return 0
  return Math.min(100, Math.round((used / estimated) * 100))
}

function goToOrderDetail(orderId: string) {
  router.push(`/order/${orderId}`)
}

function getTechCapacityPercent(tech: Technician): number {
  if (tech.capacityLimit === 0) return 0
  return Math.min(100, Math.round((tech.currentTasksCount / tech.capacityLimit) * 100))
}

function getTechCapacityBarClass(tech: Technician): string {
  const pct = getTechCapacityPercent(tech)
  if (pct >= 90) return 'bg-rose-500'
  if (pct >= 70) return 'bg-amber-500'
  return 'bg-emerald-500'
}

function isOverdue(task: TaskAssignment): boolean {
  if (!task.estimatedCompletionTime) return false
  return new Date(task.estimatedCompletionTime) < today
}

function formatEstimatedTime(dateStr?: string): string {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const statCardGradients = [
  'from-blue-500 to-indigo-600',
  'from-emerald-500 to-teal-600',
  'from-indigo-500 to-violet-600',
  'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-600',
]
</script>

<template>
  <div class="min-h-full bg-slate-50/40">
    <div class="mb-6">
      <div class="flex items-start justify-between mb-2">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <div class="p-1.5 bg-indigo-100 rounded-lg">
              <LayoutGrid class="w-5 h-5 text-indigo-600" />
            </div>
            <h1 class="text-2xl font-bold text-slate-900 tracking-tight">
              今日排产看板
            </h1>
          </div>
          <div class="flex items-center gap-3 text-sm text-slate-500">
            <span class="flex items-center gap-1.5">
              <Calendar class="w-4 h-4" />
              {{ dateText }}
            </span>
            <span class="text-slate-300">|</span>
            <span class="flex items-center gap-1.5">
              <Users class="w-4 h-4" />
              在岗技师 {{ onDutyTechnicians.length }} 人
            </span>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button
            class="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <RotateCcw class="w-4 h-4" />
            刷新数据
          </button>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      <div class="relative overflow-hidden bg-white rounded-xl border border-slate-200 p-4 hover:shadow-lg transition-all">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-xs font-medium text-slate-500 mb-1">今日总任务</p>
            <p class="text-3xl font-bold text-slate-900 tracking-tight">{{ totalTasksCount }}</p>
            <p class="text-xs text-slate-400 mt-1">全部排产任务</p>
          </div>
          <div
            class="w-11 h-11 rounded-xl flex items-center justify-center bg-gradient-to-br shadow-md"
            :class="statCardGradients[0]"
          >
            <ClipboardList class="w-5 h-5 text-white" />
          </div>
        </div>
      </div>

      <div class="relative overflow-hidden bg-white rounded-xl border border-slate-200 p-4 hover:shadow-lg transition-all">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-xs font-medium text-slate-500 mb-1">已完成</p>
            <div class="flex items-baseline gap-2">
              <p class="text-3xl font-bold text-slate-900 tracking-tight">{{ completedTodayCount }}</p>
              <span class="text-sm font-semibold" :class="getCapacityTextClass(completedTodayCount, totalTasksCount)">
                {{ completedPercent }}%
              </span>
            </div>
            <div class="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                class="h-full rounded-full transition-all"
                :class="getCapacityColorClass(completedTodayCount, totalTasksCount)"
                :style="{ width: `${completedPercent}%` }"
              ></div>
            </div>
          </div>
          <div
            class="w-11 h-11 rounded-xl flex items-center justify-center bg-gradient-to-br shadow-md"
            :class="statCardGradients[1]"
          >
            <CheckCircle2 class="w-5 h-5 text-white" />
          </div>
        </div>
      </div>

      <div class="relative overflow-hidden bg-white rounded-xl border border-slate-200 p-4 hover:shadow-lg transition-all">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-xs font-medium text-slate-500 mb-1">处理中</p>
            <p class="text-3xl font-bold text-slate-900 tracking-tight">{{ inProgressCount }}</p>
            <p class="text-xs text-slate-400 mt-1">正在加工的任务</p>
          </div>
          <div
            class="w-11 h-11 rounded-xl flex items-center justify-center bg-gradient-to-br shadow-md"
            :class="statCardGradients[2]"
          >
            <Play class="w-5 h-5 text-white" />
          </div>
        </div>
      </div>

      <div class="relative overflow-hidden bg-white rounded-xl border border-slate-200 p-4 hover:shadow-lg transition-all">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-xs font-medium text-slate-500 mb-1">异常</p>
            <p
              class="text-3xl font-bold tracking-tight"
              :class="exceptionCount > 0 ? 'text-rose-600' : 'text-slate-900'"
            >
              {{ exceptionCount }}
            </p>
            <p
              class="text-xs mt-1"
              :class="exceptionCount > 0 ? 'text-rose-500' : 'text-slate-400'"
            >
              {{ exceptionCount > 0 ? '需要立即处理' : '暂无异常' }}
            </p>
          </div>
          <div
            class="w-11 h-11 rounded-xl flex items-center justify-center bg-gradient-to-br shadow-md"
            :class="statCardGradients[3]"
          >
            <AlertTriangle class="w-5 h-5 text-white" />
          </div>
        </div>
      </div>

      <div class="relative overflow-hidden bg-white rounded-xl border border-slate-200 p-4 hover:shadow-lg transition-all">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-xs font-medium text-slate-500 mb-1">待分配</p>
            <p
              class="text-3xl font-bold tracking-tight"
              :class="pendingCount > 0 ? 'text-amber-600' : 'text-slate-900'"
            >
              {{ pendingCount }}
            </p>
            <p
              class="text-xs mt-1"
              :class="pendingCount > 0 ? 'text-amber-500' : 'text-slate-400'"
            >
              {{ pendingCount > 0 ? '等待分配技师' : '全部已分配' }}
            </p>
          </div>
          <div
            class="w-11 h-11 rounded-xl flex items-center justify-center bg-gradient-to-br shadow-md"
            :class="statCardGradients[4]"
          >
            <Clock class="w-5 h-5 text-white" />
          </div>
        </div>
      </div>
    </div>

    <div class="mb-6 bg-white rounded-xl border border-slate-200 p-5">
      <div class="flex items-center gap-3 mb-4">
        <div class="p-2 bg-indigo-100 rounded-lg">
          <Users class="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <h3 class="text-base font-semibold text-slate-800">在岗技师概况</h3>
          <p class="text-xs text-slate-500">实时监控技师在岗状态与产能使用情况</p>
        </div>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
        <div
          v-for="tech in onDutyTechnicians"
          :key="tech.id"
          class="p-3 rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50/50 to-white hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer"
        >
          <div class="flex items-start gap-2.5 mb-2">
            <div
              class="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-base shadow-sm flex-shrink-0 bg-gradient-to-br"
              :class="tech.avatarColor || 'from-slate-400 to-slate-600'"
            >
              {{ tech.name.charAt(0) }}
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-1.5 mb-0.5">
                <span class="font-semibold text-slate-800 text-sm truncate">{{ tech.name }}</span>
              </div>
              <span
                class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border"
                :class="TechnicianStatusColors[tech.status]"
              >
                <span
                  class="w-1.5 h-1.5 rounded-full"
                  :class="{
                    'bg-emerald-500': tech.status === 'on-duty',
                    'bg-rose-500': tech.status === 'busy',
                  }"
                ></span>
                {{ TechnicianStatusLabels[tech.status] }}
              </span>
            </div>
          </div>

          <div class="space-y-1.5">
            <div class="flex items-center justify-between text-[11px]">
              <span class="text-slate-500">在制 / 产能</span>
              <span class="font-semibold text-slate-700">
                {{ tech.currentTasksCount }} / {{ tech.capacityLimit }}
              </span>
            </div>
            <div class="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                class="h-full rounded-full transition-all"
                :class="getTechCapacityBarClass(tech)"
                :style="{ width: `${getTechCapacityPercent(tech)}%` }"
              ></div>
            </div>
            <div class="flex items-center justify-between text-[10px]">
              <span class="text-emerald-600 font-medium">今日完成 {{ tech.todayCompleted }}</span>
              <span :class="getCapacityTextClass(tech.currentTasksCount, tech.capacityLimit)">
                {{ getTechCapacityPercent(tech) }}%
              </span>
            </div>
          </div>
        </div>

        <div
          v-if="onDutyTechnicians.length === 0"
          class="col-span-full p-8 text-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/30"
        >
          <Users class="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p class="text-sm font-medium text-slate-500">当前暂无在岗技师</p>
        </div>
      </div>
    </div>

    <div class="mb-6 bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div class="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50/80 to-white">
        <div class="flex items-center gap-3">
          <div class="p-2 bg-indigo-100 rounded-lg">
            <Gauge class="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h3 class="text-base font-semibold text-slate-800">排产看板</h3>
            <p class="text-xs text-slate-500">按加工阶段横向展示，拖拽分配任务</p>
          </div>
        </div>
        <div class="flex items-center gap-2 text-xs text-slate-500">
          <span class="inline-flex items-center gap-1">
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            正常 ({{ '<' }}70%)
          </span>
          <span class="inline-flex items-center gap-1">
            <span class="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            警戒 (70-90%)
          </span>
          <span class="inline-flex items-center gap-1">
            <span class="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            过载 ({{ '>' }}90%)
          </span>
        </div>
      </div>

      <div class="p-5">
        <div class="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1">
          <div
            v-for="slot in scheduleBoard"
            :key="slot.stage"
            class="flex-shrink-0 w-72 bg-slate-50/60 rounded-xl border border-slate-200 flex flex-col max-h-[600px]"
          >
            <div class="px-3.5 py-3 border-b border-slate-200/70 rounded-t-xl bg-white/60">
              <div class="flex items-start justify-between mb-1.5">
                <div>
                  <h4 class="text-sm font-semibold text-slate-800">{{ slot.stageLabel }}</h4>
                  <p class="text-[11px] text-slate-500 mt-0.5">
                    已用产能 <span class="font-semibold text-slate-700">{{ slot.usedCapacity }}</span>
                    / 预计 {{ slot.estimatedCapacity }}
                  </p>
                </div>
                <span
                  class="inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold"
                  :class="[
                    getCapacityTextClass(slot.usedCapacity, slot.estimatedCapacity),
                    getCapacityBgClass(slot.usedCapacity, slot.estimatedCapacity)
                  ]"
                >
                  {{ slot.tasks.length }}
                </span>
              </div>
              <div class="h-2 bg-slate-200/70 rounded-full overflow-hidden">
                <div
                  class="h-full rounded-full transition-all"
                  :class="getCapacityColorClass(slot.usedCapacity, slot.estimatedCapacity)"
                  :style="{ width: `${getCapacityPercent(slot.usedCapacity, slot.estimatedCapacity)}%` }"
                ></div>
              </div>
              <div class="flex items-center justify-between mt-1.5">
                <span
                  class="text-[10px] font-semibold"
                  :class="getCapacityTextClass(slot.usedCapacity, slot.estimatedCapacity)"
                >
                  使用率 {{ getCapacityPercent(slot.usedCapacity, slot.estimatedCapacity) }}%
                </span>
                <span v-if="slot.estimatedCapacity === 0" class="text-[10px] text-slate-400">
                  无产能配置
                </span>
              </div>
            </div>

            <div class="flex-1 overflow-y-auto p-2.5 space-y-2.5">
              <div
                v-for="task in slot.tasks"
                :key="task.id"
                class="group bg-white rounded-xl border border-slate-200 p-3 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer"
                @click="goToOrderDetail(task.orderId)"
              >
                <div class="flex items-start justify-between mb-2">
                  <div class="flex items-center gap-1.5 min-w-0 flex-1">
                    <span class="font-mono text-xs font-bold text-indigo-600 truncate">
                      {{ task.orderNumber }}
                    </span>
                    <ArrowUpRight class="w-3 h-3 text-slate-300 group-hover:text-indigo-500 flex-shrink-0" />
                  </div>
                  <span
                    class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border flex-shrink-0"
                    :class="TaskPriorityColors[task.priority]"
                  >
                    {{ TaskPriorityLabels[task.priority] }}
                  </span>
                </div>

                <div class="flex items-center gap-2 mb-2 flex-wrap">
                  <span class="text-xs text-slate-600 truncate max-w-[140px]">
                    {{ task.clinicName || '未命名诊所' }}
                  </span>
                  <span
                    v-if="task.workItemsCount"
                    class="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-medium"
                  >
                    {{ task.workItemsCount }} 件
                  </span>
                  <PriorityBadge
                    v-if="task.orderPriority && task.orderPriority !== 'standard'"
                    :priority="task.orderPriority"
                  />
                </div>

                <div class="flex items-center gap-2 mb-2.5">
                  <div
                    class="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 bg-gradient-to-br"
                    :class="technicians.find(t => t.id === task.technicianId)?.avatarColor || 'from-slate-400 to-slate-600'"
                    :title="task.technicianName"
                  >
                    {{ task.technicianName?.charAt(0) || '?' }}
                  </div>
                  <span class="text-xs text-slate-700 font-medium truncate flex-1">
                    {{ task.technicianName || '未分配' }}
                  </span>
                  <span
                    class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border"
                    :class="TaskStatusColors[task.status]"
                  >
                    {{ TaskStatusLabels[task.status] }}
                  </span>
                </div>

                <div class="flex items-center justify-between pt-2 border-t border-slate-100">
                  <div class="flex items-center gap-1.5 text-[11px]">
                    <Clock class="w-3 h-3 text-slate-400" />
                    <span :class="isOverdue(task) ? 'text-rose-600 font-semibold' : 'text-slate-500'">
                      {{ formatEstimatedTime(task.estimatedCompletionTime) }}
                    </span>
                    <span
                      v-if="isOverdue(task)"
                      class="inline-flex items-center px-1 py-0.5 rounded bg-rose-50 text-rose-600 text-[9px] font-bold border border-rose-100"
                    >
                      逾期
                    </span>
                  </div>
                  <span
                    v-if="task.reworkCount > 0"
                    class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 text-[10px] font-medium border border-amber-200"
                  >
                    <RotateCcw class="w-2.5 h-2.5" />
                    返工{{ task.reworkCount }}次
                  </span>
                </div>
              </div>

              <div
                v-if="slot.tasks.length === 0"
                class="p-6 text-center rounded-xl border-2 border-dashed border-slate-200/70 bg-white/40"
              >
                <div class="w-10 h-10 mx-auto mb-2 rounded-full bg-slate-100 flex items-center justify-center">
                  <Wrench class="w-5 h-5 text-slate-300" />
                </div>
                <p class="text-xs text-slate-400">暂无任务</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div class="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-amber-50/60 to-white">
          <div class="flex items-center gap-3">
            <div class="p-2 bg-amber-100 rounded-lg">
              <Clock class="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 class="text-base font-semibold text-slate-800">待分配任务</h3>
              <p class="text-xs text-slate-500">共 {{ pendingTasks.length }} 个任务等待分配技师</p>
            </div>
          </div>
          <span
            v-if="pendingTasks.length > 0"
            class="inline-flex items-center justify-center px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold"
          >
            {{ pendingTasks.length }}
          </span>
        </div>

        <div class="p-4 max-h-96 overflow-y-auto">
          <div v-if="pendingTasks.length === 0" class="p-8 text-center">
            <div class="w-14 h-14 mx-auto mb-3 rounded-full bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 class="w-7 h-7 text-emerald-500" />
            </div>
            <p class="text-sm font-semibold text-slate-700 mb-1">所有任务已分配</p>
            <p class="text-xs text-slate-400">暂无待分配的任务</p>
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="task in pendingTasks"
              :key="task.id"
              class="p-3.5 rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50/70 to-white hover:border-amber-300 hover:shadow-md transition-all"
            >
              <div class="flex items-start justify-between mb-2">
                <div class="flex items-center gap-2">
                  <span
                    class="font-mono text-sm font-bold text-indigo-600 cursor-pointer hover:underline"
                    @click="goToOrderDetail(task.orderId)"
                  >
                    {{ task.orderNumber }}
                  </span>
                  <PriorityBadge
                    v-if="task.orderPriority && task.orderPriority !== 'standard'"
                    :priority="task.orderPriority"
                  />
                  <span
                    class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border"
                    :class="TaskPriorityColors[task.priority]"
                  >
                    {{ TaskPriorityLabels[task.priority] }}
                  </span>
                </div>
                <button
                  class="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                  @click.stop="openAssignDialog(task)"
                >
                  <Users class="w-3 h-3" />
                  分配
                </button>
              </div>

              <div class="flex items-center gap-3 text-xs text-slate-600 flex-wrap">
                <span class="inline-flex items-center gap-1">
                  <User class="w-3 h-3 text-slate-400" />
                  {{ task.clinicName || '-' }}
                </span>
                <span class="inline-flex items-center gap-1">
                  <Wrench class="w-3 h-3 text-slate-400" />
                  {{ ProcessingStages.find(s => s.stage === task.stage)?.label || task.stage }}
                </span>
                <span
                  v-if="task.workItemsCount"
                  class="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium"
                >
                  {{ task.workItemsCount }} 件
                </span>
              </div>

              <div v-if="task.reworkCount > 0" class="mt-2">
                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 text-amber-700 text-[11px] font-medium border border-amber-200">
                  <RotateCcw class="w-3 h-3" />
                  返工任务 ({{ task.reworkCount }} 次)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div class="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-rose-50/60 to-white">
          <div class="flex items-center gap-3">
            <div class="p-2 bg-rose-100 rounded-lg">
              <Flame class="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <h3 class="text-base font-semibold text-slate-800">异常任务告警</h3>
              <p class="text-xs text-slate-500">共 {{ exceptionTasks.length }} 个异常任务需处理</p>
            </div>
          </div>
          <span
            v-if="exceptionTasks.length > 0"
            class="inline-flex items-center justify-center px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 text-xs font-bold"
          >
            {{ exceptionTasks.length }}
          </span>
        </div>

        <div class="p-4 max-h-96 overflow-y-auto">
          <div v-if="exceptionTasks.length === 0" class="p-8 text-center">
            <div class="w-14 h-14 mx-auto mb-3 rounded-full bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 class="w-7 h-7 text-emerald-500" />
            </div>
            <p class="text-sm font-semibold text-slate-700 mb-1">运行正常</p>
            <p class="text-xs text-slate-400">暂无异常任务</p>
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="task in exceptionTasks"
              :key="task.id"
              class="p-3.5 rounded-xl border border-rose-200 bg-gradient-to-br from-rose-50/50 to-white hover:border-rose-400 hover:shadow-md transition-all cursor-pointer"
              @click="goToOrderDetail(task.orderId)"
            >
              <div class="flex items-start justify-between mb-2">
                <div class="flex items-center gap-2">
                  <span class="font-mono text-sm font-bold text-indigo-600">
                    {{ task.orderNumber }}
                  </span>
                  <ArrowUpRight class="w-3.5 h-3.5 text-slate-400" />
                </div>
                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-rose-100 text-rose-700 border border-rose-200">
                  <AlertTriangle class="w-3 h-3" />
                  处理
                </span>
              </div>

              <div class="flex items-center gap-2 mb-2.5 flex-wrap">
                <span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 text-[11px] font-semibold border border-rose-200">
                  {{ task.exceptionType ? ExceptionTypeLabels[task.exceptionType] : '未知异常' }}
                </span>
                <span class="text-xs text-slate-600 truncate">
                  {{ task.clinicName || '-' }}
                </span>
              </div>

              <div class="p-2.5 bg-rose-50/80 rounded-lg border border-rose-100 mb-2.5">
                <p class="text-xs text-rose-800 leading-relaxed">
                  <span class="font-semibold">异常原因：</span>
                  {{ task.exceptionReason || '暂无详细说明，请联系相关技师了解详情' }}
                </p>
              </div>

              <div class="flex items-center justify-between text-xs">
                <div class="flex items-center gap-2">
                  <div
                    class="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold bg-gradient-to-br"
                    :class="technicians.find(t => t.id === task.technicianId)?.avatarColor || 'from-slate-400 to-slate-600'"
                  >
                    {{ task.technicianName?.charAt(0) || '?' }}
                  </div>
                  <span class="text-slate-600">{{ task.technicianName || '未分配' }}</span>
                  <span class="text-slate-300">·</span>
                  <span class="text-slate-500">
                    {{ ProcessingStages.find(s => s.stage === task.stage)?.label || task.stage }}
                  </span>
                </div>
                <span
                  v-if="task.reworkCount > 0"
                  class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-medium"
                >
                  <RotateCcw class="w-2.5 h-2.5" />
                  {{ task.reworkCount }}次
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <TaskAssignDialog
      :show="showAssignDialog"
      :order-id="selectedPendingTask?.orderId"
      :order-number="selectedPendingTask?.orderNumber"
      :stage="selectedPendingTask?.stage"
      :work-items-count="selectedPendingTask?.workItemsCount"
      :clinic-name="selectedPendingTask?.clinicName"
      :delivery-date="selectedPendingTask?.deliveryDate"
      :order-priority="selectedPendingTask?.orderPriority"
      @close="closeAssignDialog"
      @submit="handleAssignSubmit"
    />
  </div>
</template>
