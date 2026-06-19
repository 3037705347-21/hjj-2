<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  Building2,
  Calendar,
  Award,
  Clock,
  CheckCircle2,
  Gauge,
  Timer,
  AlertTriangle,
  Briefcase,
  Wrench,
  ChevronDown,
  ChevronUp,
  Eye,
  BarChart3,
  ArrowRight,
  ArrowLeftRight,
  Sparkles,
  Hash,
} from 'lucide-vue-next'
import StatusBadge from '../components/StatusBadge.vue'
import PriorityBadge from '../components/PriorityBadge.vue'
import { useTechnicians } from '../composables/useTechnicians'
import type {
  Technician,
  TaskAssignment,
  TaskHandoverRecord,
  TaskStatus,
} from '../types'
import {
  ProcessingStages,
  TechnicianSkillLabels,
  TechnicianSkillColors,
  TechnicianStatusLabels,
  TechnicianStatusColors,
  TechnicianLevelLabels,
  TechnicianLevelColors,
  TaskStatusLabels,
  TaskStatusColors,
} from '../types'

const route = useRoute()
const router = useRouter()
const {
  getTechnician,
  getTasksByTechnician,
  getTechnicianHandovers,
  getTechnicianWorkbenchStats,
  getTechnicianDailyStats,
} = useTechnicians()

const technician = computed<Technician | undefined>(() =>
  getTechnician(String(route.params.id))
)
const workbenchStats = computed(() =>
  technician.value
    ? getTechnicianWorkbenchStats(technician.value.id)
    : null
)
const tasks = computed<TaskAssignment[]>(() =>
  technician.value ? getTasksByTechnician(technician.value.id) : []
)
const handovers = computed<TaskHandoverRecord[]>(() =>
  technician.value ? getTechnicianHandovers(technician.value.id) : []
)

const inProgressTasks = computed(() =>
  tasks.value.filter((t) =>
    ['assigned', 'accepted', 'in-progress', 'paused'].includes(t.status)
  )
)
const completedTasks = computed(() =>
  tasks.value.filter((t) => t.status === 'completed')
)

const showCompletedTasks = ref(false)

const today = new Date()
const last7Days = computed(() => {
  const result: { date: Date; label: string; completed: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const stats = technician.value
      ? getTechnicianDailyStats(technician.value.id, d)
      : null
    result.push({
      date: d,
      label: `${d.getMonth() + 1}/${d.getDate()}`,
      completed: stats?.completedCount || 0,
    })
  }
  return result
})

const maxDailyCompleted = computed(() => {
  const max = last7Days.value.reduce((acc, d) => Math.max(acc, d.completed), 0)
  return max === 0 ? 1 : max
})

const workDays = computed(() => {
  if (!technician.value) return 0
  const joined = new Date(technician.value.joinedAt)
  return Math.ceil((today.getTime() - joined.getTime()) / 86400000)
})

const capacityPercent = computed(() => {
  if (!technician.value) return 0
  return Math.min(
    100,
    Math.round(
      (technician.value.currentTasksCount / technician.value.capacityLimit) * 100
    )
  )
})

const capacityColorClass = computed(() => {
  if (capacityPercent.value >= 90) return 'bg-rose-500'
  if (capacityPercent.value >= 70) return 'bg-amber-500'
  return 'bg-emerald-500'
})

function formatDateTime(dateStr: string) {
  if (!dateStr) return '-'
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
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} 分钟`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours} 小时 ${mins} 分` : `${hours} 小时`
}

function getStageLabel(stage: string) {
  return ProcessingStages.find((s) => s.stage === stage)?.label || stage
}

function goBack() {
  router.back()
}

function goToOrder(orderId: string) {
  router.push(`/order/${orderId}`)
}

function getInitials(name: string) {
  return name ? name.charAt(0) : '?'
}
</script>

<template>
  <div v-if="technician" class="min-h-full pb-12">
    <div class="mb-6">
      <button
        class="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 mb-4 transition-colors"
        @click="goBack"
      >
        <ArrowLeft class="w-4 h-4" />
        返回任务列表
      </button>

      <div class="bg-white rounded-xl border border-slate-200 overflow-hidden mb-6">
        <div class="px-6 py-5 border-b border-slate-100">
          <div class="flex flex-col lg:flex-row lg:items-center gap-5">
            <div
              class="w-20 h-20 rounded-2xl bg-gradient-to-br flex items-center justify-center text-white text-2xl font-bold shadow-lg flex-shrink-0"
              :class="technician.avatarColor || 'from-blue-400 to-blue-600'"
            >
              {{ getInitials(technician.name) }}
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex flex-wrap items-center gap-3 mb-2">
                <h1 class="text-2xl font-bold text-slate-900 tracking-tight">
                  {{ technician.name }}
                </h1>
                <span
                  v-if="technician.level"
                  class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium border"
                  :class="TechnicianLevelColors[technician.level]"
                >
                  <Award class="w-3 h-3" />
                  {{ TechnicianLevelLabels[technician.level] }}
                </span>
                <span
                  class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium border"
                  :class="TechnicianStatusColors[technician.status]"
                >
                  <span
                    class="w-1.5 h-1.5 rounded-full"
                    :class="{
                      'bg-emerald-500 animate-pulse': technician.status === 'on-duty',
                      'bg-rose-500 animate-pulse': technician.status === 'busy',
                      'bg-amber-500': technician.status === 'leave',
                      'bg-slate-400': technician.status === 'off-duty',
                    }"
                  ></span>
                  {{ TechnicianStatusLabels[technician.status] }}
                </span>
              </div>
              <div class="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-500">
                <span class="flex items-center gap-1.5">
                  <Hash class="w-3.5 h-3.5" />
                  工号：<span class="font-mono text-slate-700">{{ technician.employeeCode }}</span>
                </span>
                <span v-if="technician.department" class="flex items-center gap-1.5">
                  <Building2 class="w-3.5 h-3.5" />
                  {{ technician.department }}
                </span>
                <span class="flex items-center gap-1.5">
                  <Briefcase class="w-3.5 h-3.5" />
                  工龄：{{ workDays }} 天
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <div class="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
          <div class="flex items-start justify-between">
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-slate-500 truncate">当前在制</p>
              <p class="mt-2 text-2xl font-bold text-slate-900 tracking-tight">
                {{ technician.currentTasksCount }}<span class="text-sm font-normal text-slate-400 ml-1">/ {{ technician.capacityLimit }}</span>
              </p>
            </div>
            <div class="flex-shrink-0 p-2.5 rounded-lg bg-indigo-100 text-indigo-600">
              <Wrench class="w-5 h-5" />
            </div>
          </div>
        </div>
        <div class="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
          <div class="flex items-start justify-between">
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-slate-500 truncate">今日完成</p>
              <p class="mt-2 text-2xl font-bold text-slate-900 tracking-tight">
                {{ workbenchStats?.completedTodayCount || 0 }}
              </p>
            </div>
            <div class="flex-shrink-0 p-2.5 rounded-lg bg-emerald-100 text-emerald-600">
              <CheckCircle2 class="w-5 h-5" />
            </div>
          </div>
        </div>
        <div class="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
          <div class="flex items-start justify-between">
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-slate-500 truncate">产能使用率</p>
              <p class="mt-2 text-2xl font-bold text-slate-900 tracking-tight">
                {{ workbenchStats?.capacityUsedPercent || 0 }}<span class="text-sm font-normal text-slate-400 ml-1">%</span>
              </p>
            </div>
            <div class="flex-shrink-0 p-2.5 rounded-lg bg-amber-100 text-amber-600">
              <Gauge class="w-5 h-5" />
            </div>
          </div>
        </div>
        <div class="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
          <div class="flex items-start justify-between">
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-slate-500 truncate">平均处理时长</p>
              <p class="mt-2 text-xl font-bold text-slate-900 tracking-tight">
                {{ formatDuration(technician.avgTaskDurationMinutes) }}
              </p>
            </div>
            <div class="flex-shrink-0 p-2.5 rounded-lg bg-cyan-100 text-cyan-600">
              <Timer class="w-5 h-5" />
            </div>
          </div>
        </div>
        <div class="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
          <div class="flex items-start justify-between">
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-slate-500 truncate">历史返工</p>
              <p class="mt-2 text-2xl font-bold text-slate-900 tracking-tight">
                {{ technician.totalReworkCount }}<span class="text-sm font-normal text-slate-400 ml-1">次</span>
              </p>
            </div>
            <div class="flex-shrink-0 p-2.5 rounded-lg bg-rose-100 text-rose-600">
              <AlertTriangle class="w-5 h-5" />
            </div>
          </div>
        </div>
        <div class="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
          <div class="flex items-start justify-between">
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-slate-500 truncate">在岗工龄</p>
              <p class="mt-2 text-2xl font-bold text-slate-900 tracking-tight">
                {{ workDays }}<span class="text-sm font-normal text-slate-400 ml-1">天</span>
              </p>
            </div>
            <div class="flex-shrink-0 p-2.5 rounded-lg bg-violet-100 text-violet-600">
              <Briefcase class="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div class="xl:col-span-1 space-y-6">
          <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div
              class="px-5 py-4 border-b border-slate-100 flex items-center gap-2"
            >
              <div
                class="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center"
              >
                <User class="w-4 h-4 text-blue-600" />
              </div>
              <h2 class="text-base font-semibold text-slate-800">
                个人信息
              </h2>
            </div>
            <div class="p-5 space-y-4">
              <div
                class="flex items-center gap-3 p-3 bg-slate-50/50 rounded-lg border border-slate-100"
              >
                <div
                  class="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center"
                >
                  <Phone class="w-4 h-4 text-slate-500" />
                </div>
                <div>
                  <div class="text-[11px] text-slate-500 leading-tight mb-0.5">联系电话</div>
                  <div class="text-sm font-medium text-slate-800 font-mono">
                    {{ technician.phone || '-' }}
                  </div>
                </div>
              </div>
              <div
                class="flex items-center gap-3 p-3 bg-slate-50/50 rounded-lg border border-slate-100"
              >
                <div
                  class="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center"
                >
                  <Mail class="w-4 h-4 text-slate-500" />
                </div>
                <div>
                  <div class="text-[11px] text-slate-500 leading-tight mb-0.5">电子邮箱</div>
                  <div class="text-sm font-medium text-slate-800">
                    {{ technician.email || '-' }}
                  </div>
                </div>
              </div>
              <div
                class="flex items-center gap-3 p-3 bg-slate-50/50 rounded-lg border border-slate-100"
              >
                <div
                  class="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center"
                >
                  <Calendar class="w-4 h-4 text-slate-500" />
                </div>
                <div>
                  <div class="text-[11px] text-slate-500 leading-tight mb-0.5">入职日期</div>
                  <div class="text-sm font-medium text-slate-800">
                    {{ formatShortDate(technician.joinedAt) }}
                  </div>
                </div>
              </div>
              <div
                class="flex items-center gap-3 p-3 bg-slate-50/50 rounded-lg border border-slate-100"
              >
                <div
                  class="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center"
                >
                  <Sparkles class="w-4 h-4 text-slate-500" />
                </div>
                <div>
                  <div class="text-[11px] text-slate-500 leading-tight mb-0.5">主工种</div>
                  <div class="text-sm font-medium text-slate-800">
                    {{ technician.primarySkill ? TechnicianSkillLabels[technician.primarySkill] : '-' }}
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
                <Award class="w-4 h-4 text-violet-600" />
              </div>
              <h2 class="text-base font-semibold text-slate-800">
                技能标签
              </h2>
            </div>
            <div class="p-5">
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="skill in technician.skills"
                  :key="skill"
                  class="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border"
                  :class="TechnicianSkillColors[skill]"
                >
                  {{ TechnicianSkillLabels[skill] }}
                </span>
                <span
                  v-if="technician.skills.length === 0"
                  class="text-xs text-slate-400"
                >
                  暂无技能标签
                </span>
              </div>
              <div
                v-if="technician.certifications && technician.certifications.length > 0"
                class="mt-4 pt-4 border-t border-slate-100"
              >
                <div class="text-[11px] font-medium text-slate-500 mb-2">资质证书</div>
                <div class="space-y-1.5">
                  <div
                    v-for="(cert, idx) in technician.certifications"
                    :key="idx"
                    class="flex items-center gap-2 text-sm text-slate-700"
                  >
                    <CheckCircle2 class="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                    <span>{{ cert }}</span>
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
                  class="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center"
                >
                  <Gauge class="w-4 h-4 text-emerald-600" />
                </div>
                <h2 class="text-base font-semibold text-slate-800">
                  产能进度
                </h2>
              </div>
              <span class="text-xs text-slate-500 font-mono">
                {{ technician.currentTasksCount }} / {{ technician.capacityLimit }}
              </span>
            </div>
            <div class="p-5">
              <div class="mb-2 flex items-center justify-between">
                <span class="text-sm text-slate-600">当前占用</span>
                <span
                  class="text-sm font-bold"
                  :class="{
                    'text-rose-600': capacityPercent >= 90,
                    'text-amber-600': capacityPercent >= 70 && capacityPercent < 90,
                    'text-emerald-600': capacityPercent < 70,
                  }"
                >
                  {{ capacityPercent }}%
                </span>
              </div>
              <div class="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  class="h-full rounded-full transition-all duration-500"
                  :class="capacityColorClass"
                  :style="{ width: `${capacityPercent}%` }"
                ></div>
              </div>
              <div class="mt-3 grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                <div class="text-center">
                  <div class="text-xs text-slate-500 mb-0.5">剩余产能</div>
                  <div class="text-lg font-bold text-slate-800">
                    {{ Math.max(0, technician.capacityLimit - technician.currentTasksCount) }}
                  </div>
                </div>
                <div class="text-center">
                  <div class="text-xs text-slate-500 mb-0.5">日产能</div>
                  <div class="text-lg font-bold text-slate-800">
                    {{ technician.dailyCapacity }}
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
                class="w-8 h-8 rounded-lg bg-cyan-50 border border-cyan-100 flex items-center justify-center"
              >
                <BarChart3 class="w-4 h-4 text-cyan-600" />
              </div>
              <h2 class="text-base font-semibold text-slate-800">
                近7天产能
              </h2>
            </div>
            <div class="p-5">
              <div class="flex items-end justify-between gap-2 h-32 mb-3">
                <div
                  v-for="(day, idx) in last7Days"
                  :key="idx"
                  class="flex-1 flex flex-col items-center gap-1"
                >
                  <span class="text-[10px] font-mono text-slate-500">
                    {{ day.completed || '' }}
                  </span>
                  <div class="w-full flex-1 flex items-end">
                    <div
                      class="w-full rounded-t-md transition-all duration-300"
                      :class="{
                        'bg-gradient-to-t from-cyan-500 to-cyan-400': day.completed > 0,
                        'bg-slate-100': day.completed === 0,
                      }"
                      :style="{
                        height: `${Math.max(8, (day.completed / maxDailyCompleted) * 100)}%`,
                      }"
                    ></div>
                  </div>
                </div>
              </div>
              <div class="flex items-center justify-between gap-2">
                <span
                  v-for="(day, idx) in last7Days"
                  :key="idx"
                  class="flex-1 text-center text-[10px] text-slate-500 font-mono"
                >
                  {{ day.label }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="xl:col-span-2 space-y-6">
          <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div
              class="px-5 py-4 border-b border-slate-100 flex items-center justify-between"
            >
              <div class="flex items-center gap-2">
                <div
                  class="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center"
                >
                  <Clock class="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <h2 class="text-base font-semibold text-slate-800">
                    进行中任务
                  </h2>
                  <p class="text-xs text-slate-500">
                    共 {{ inProgressTasks.length }} 个任务处理中
                  </p>
                </div>
              </div>
            </div>
            <div v-if="inProgressTasks.length > 0" class="overflow-x-auto">
              <table class="w-full">
                <thead class="bg-slate-50/70 border-b border-slate-100">
                  <tr>
                    <th class="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">订单号</th>
                    <th class="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">阶段</th>
                    <th class="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">状态</th>
                    <th class="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">优先级</th>
                    <th class="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">分配时间</th>
                    <th class="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">预计完成</th>
                    <th class="px-5 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">返工</th>
                    <th class="px-5 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  <tr
                    v-for="task in inProgressTasks"
                    :key="task.id"
                    class="hover:bg-slate-50/50 transition-colors"
                  >
                    <td class="px-5 py-3.5">
                      <div>
                        <div class="text-sm font-medium text-slate-800 font-mono">
                          {{ task.orderNumber }}
                        </div>
                        <div v-if="task.clinicName" class="text-xs text-slate-500 mt-0.5">
                          {{ task.clinicName }}
                        </div>
                      </div>
                    </td>
                    <td class="px-5 py-3.5">
                      <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                        {{ getStageLabel(task.stage) }}
                      </span>
                    </td>
                    <td class="px-5 py-3.5">
                      <span
                        class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border"
                        :class="TaskStatusColors[task.status as TaskStatus]"
                      >
                        {{ TaskStatusLabels[task.status as TaskStatus] }}
                      </span>
                    </td>
                    <td class="px-5 py-3.5">
                      <PriorityBadge :priority="task.orderPriority || 'standard'" />
                    </td>
                    <td class="px-5 py-3.5 text-xs text-slate-600">
                      {{ formatDateTime(task.assignedAt) }}
                    </td>
                    <td class="px-5 py-3.5 text-xs text-slate-600">
                      <span
                        v-if="task.estimatedCompletionTime"
                        :class="{
                          'text-rose-600 font-medium': task.estimatedCompletionTime && new Date(task.estimatedCompletionTime) < today,
                        }"
                      >
                        {{ formatDateTime(task.estimatedCompletionTime) }}
                      </span>
                      <span v-else class="text-slate-400">-</span>
                    </td>
                    <td class="px-5 py-3.5 text-center">
                      <span
                        v-if="task.reworkCount > 0"
                        class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-rose-100 text-rose-700 text-xs font-bold"
                      >
                        {{ task.reworkCount }}
                      </span>
                      <span v-else class="text-xs text-slate-400">0</span>
                    </td>
                    <td class="px-5 py-3.5 text-right">
                      <button
                        class="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                        @click="goToOrder(task.orderId)"
                      >
                        <Eye class="w-3.5 h-3.5" />
                        查看
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-else class="p-10 text-center">
              <div class="w-16 h-16 mx-auto mb-3 rounded-full bg-slate-100 flex items-center justify-center">
                <CheckCircle2 class="w-8 h-8 text-slate-300" />
              </div>
              <p class="text-sm font-medium text-slate-600 mb-1">暂无进行中任务</p>
              <p class="text-xs text-slate-400">技师当前空闲，可分配新任务</p>
            </div>
          </div>

          <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div
              class="px-5 py-4 border-b border-slate-100 flex items-center justify-between cursor-pointer select-none hover:bg-slate-50/30 transition-colors"
              @click="showCompletedTasks = !showCompletedTasks"
            >
              <div class="flex items-center gap-2">
                <div
                  class="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center"
                >
                  <CheckCircle2 class="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <h2 class="text-base font-semibold text-slate-800">
                    已完成任务
                  </h2>
                  <p class="text-xs text-slate-500">
                    共 {{ completedTasks.length }} 个任务已完成
                  </p>
                </div>
              </div>
              <div
                class="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors"
              >
                <ChevronDown v-if="!showCompletedTasks" class="w-4 h-4" />
                <ChevronUp v-else class="w-4 h-4" />
              </div>
            </div>
            <div v-show="showCompletedTasks">
              <div v-if="completedTasks.length > 0" class="overflow-x-auto">
                <table class="w-full">
                  <thead class="bg-slate-50/70 border-b border-slate-100">
                    <tr>
                      <th class="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">订单号</th>
                      <th class="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">阶段</th>
                      <th class="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">分配时间</th>
                      <th class="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">完成时间</th>
                      <th class="px-5 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">返工</th>
                      <th class="px-5 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">操作</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100">
                    <tr
                      v-for="task in completedTasks"
                      :key="task.id"
                      class="hover:bg-slate-50/50 transition-colors"
                    >
                      <td class="px-5 py-3.5">
                        <div class="text-sm font-medium text-slate-700 font-mono">
                          {{ task.orderNumber }}
                        </div>
                      </td>
                      <td class="px-5 py-3.5">
                        <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                          {{ getStageLabel(task.stage) }}
                        </span>
                      </td>
                      <td class="px-5 py-3.5 text-xs text-slate-500">
                        {{ formatDateTime(task.assignedAt) }}
                      </td>
                      <td class="px-5 py-3.5 text-xs text-emerald-600 font-medium">
                        {{ formatDateTime(task.completedAt || '') }}
                      </td>
                      <td class="px-5 py-3.5 text-center">
                        <span
                          v-if="task.reworkCount > 0"
                          class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-rose-100 text-rose-700 text-xs font-bold"
                        >
                          {{ task.reworkCount }}
                        </span>
                        <span v-else class="text-xs text-slate-400">0</span>
                      </td>
                      <td class="px-5 py-3.5 text-right">
                        <button
                          class="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
                          @click="goToOrder(task.orderId)"
                        >
                          <Eye class="w-3.5 h-3.5" />
                          查看
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div v-else class="p-8 text-center">
                <p class="text-sm text-slate-500">暂无已完成任务</p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div
              class="px-5 py-4 border-b border-slate-100 flex items-center justify-between"
            >
              <div class="flex items-center gap-2">
                <div
                  class="w-8 h-8 rounded-lg bg-violet-50 border border-violet-100 flex items-center justify-center"
                >
                  <ArrowLeftRight class="w-4 h-4 text-violet-600" />
                </div>
                <div>
                  <h2 class="text-base font-semibold text-slate-800">
                    转派记录
                  </h2>
                  <p class="text-xs text-slate-500">
                    共 {{ handovers.length }} 条转派记录
                  </p>
                </div>
              </div>
            </div>
            <div v-if="handovers.length > 0" class="divide-y divide-slate-100">
              <div
                v-for="handover in handovers"
                :key="handover.id"
                class="px-5 py-4 hover:bg-slate-50/30 transition-colors"
              >
                <div class="flex items-start justify-between gap-4 flex-wrap">
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-2 flex-wrap">
                      <span
                        v-if="handover.fromTechnicianId === technician.id"
                        class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200"
                      >
                        <ArrowRight class="w-3 h-3" />
                        转出
                      </span>
                      <span
                        v-else
                        class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200"
                      >
                        <ArrowLeft class="w-3 h-3" />
                        接收
                      </span>
                      <span class="text-xs text-slate-500 font-mono">
                        {{ handover.orderId }}
                      </span>
                      <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                        {{ getStageLabel(handover.stage) }}
                      </span>
                    </div>
                    <div class="flex items-center gap-2 text-sm mb-2 flex-wrap">
                      <span class="text-slate-600">
                        <span class="font-medium text-slate-800">{{ handover.fromTechnicianName }}</span>
                      </span>
                      <ArrowRight class="w-4 h-4 text-slate-400" />
                      <span class="text-slate-600">
                        <span class="font-medium text-slate-800">{{ handover.toTechnicianName }}</span>
                      </span>
                    </div>
                    <p class="text-sm text-slate-600 bg-slate-50/70 rounded-lg px-3 py-2 border border-slate-100">
                      {{ handover.reason }}
                    </p>
                  </div>
                  <div class="text-right flex-shrink-0">
                    <div class="text-xs text-slate-400 mb-1">转派时间</div>
                    <div class="text-sm font-medium text-slate-700">
                      {{ formatDateTime(handover.handedAt) }}
                    </div>
                    <div class="text-xs text-slate-500 mt-1">
                      操作人：{{ handover.handedBy }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="p-10 text-center">
              <div class="w-16 h-16 mx-auto mb-3 rounded-full bg-slate-100 flex items-center justify-center">
                <ArrowLeftRight class="w-8 h-8 text-slate-300" />
              </div>
              <p class="text-sm font-medium text-slate-600 mb-1">暂无转派记录</p>
              <p class="text-xs text-slate-400">任务流转稳定，无转派情况</p>
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
      <User class="w-8 h-8 text-slate-400" />
    </div>
    <h3 class="text-lg font-semibold text-slate-700 mb-1">技师不存在</h3>
    <p class="text-sm text-slate-500 mb-4">未找到对应的技师记录</p>
    <button
      class="text-sm font-medium text-blue-600 hover:text-blue-700"
      @click="goBack"
    >
      返回列表
    </button>
  </div>
</template>
