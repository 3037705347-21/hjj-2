<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  X,
  User,
  Clock,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Star,
  Zap,
  Users,
  Calendar,
  Target,
  Package,
} from 'lucide-vue-next'
import type {
  ProcessingStage,
  Technician,
  TaskPriority,
  OrderPriority,
} from '../types'
import {
  ProcessingStages,
  TechnicianSkillLabels,
  TechnicianStatusLabels,
  TechnicianStatusColors,
  TechnicianLevelLabels,
  TechnicianLevelColors,
  TaskPriorityLabels,
  TaskPriorityColors,
  PriorityLabels,
} from '../types'
import { useTechnicians } from '../composables/useTechnicians'

const props = defineProps<{
  show: boolean
  orderId?: string
  orderNumber?: string
  stage?: ProcessingStage
  workItemsCount?: number
  clinicName?: string
  deliveryDate?: string
  orderPriority?: OrderPriority
  existingTechnicianId?: string
  existingTechnicianName?: string
  isTransfer?: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'submit', params: {
    technicianId: string
    technicianName: string
    priority: TaskPriority
    estimatedCompletionTime: string
    notes: string
    assignedBy: string
  }): void
}>()

const { findSuitableTechniciansSorted, getTechnician } = useTechnicians()

const selectedTechnicianId = ref('')
const formPriority = ref<TaskPriority>('normal')
const formEstimatedTime = ref('')
const formNotes = ref('')
const formAssignedBy = ref('陈调度员')
const transferReason = ref('')

const stageInfo = computed(() => {
  if (!props.stage) return null
  return ProcessingStages.find((s) => s.stage === props.stage)
})

const suitableTechnicians = computed<Technician[]>(() => {
  if (!props.stage) return []
  return findSuitableTechniciansSorted(props.stage)
})

const selectedTechnician = computed<Technician | undefined>(() => {
  if (!selectedTechnicianId.value) return undefined
  return getTechnician(selectedTechnicianId.value)
})

const capacityBarClass = computed(() => {
  if (!selectedTechnician.value) return 'bg-slate-200'
  const used = selectedTechnician.value.currentTasksCount
  const limit = selectedTechnician.value.capacityLimit
  const pct = (used / limit) * 100
  if (pct >= 90) return 'bg-rose-500'
  if (pct >= 70) return 'bg-amber-500'
  return 'bg-emerald-500'
})

const estimatedDurationHours = computed(() => {
  if (!selectedTechnician.value || !stageInfo.value) return 0
  const baseMinutes = stageInfo.value.estimatedDurationDays * 480
  const avgMinutes = selectedTechnician.value.avgTaskDurationMinutes
  return Math.round(Math.max(avgMinutes, baseMinutes * 0.5) / 60 * 10) / 10
})

watch(
  () => props.show,
  (newVal) => {
    if (newVal) {
      selectedTechnicianId.value = props.existingTechnicianId || ''
      if (!selectedTechnicianId.value && suitableTechnicians.value.length > 0) {
        selectedTechnicianId.value = suitableTechnicians.value[0].id
      }
      formPriority.value = props.orderPriority === 'stat'
        ? 'urgent'
        : props.orderPriority === 'urgent'
        ? 'high'
        : 'normal'
      formEstimatedTime.value = ''
      formNotes.value = ''
      transferReason.value = ''
    }
  }
)

watch(
  [selectedTechnicianId, () => props.show],
  () => {
    if (props.show && selectedTechnician.value && !formEstimatedTime.value) {
      const hours = estimatedDurationHours.value || 2
      const estDate = new Date()
      estDate.setTime(estDate.getTime() + hours * 3600000)
      const y = estDate.getFullYear()
      const m = String(estDate.getMonth() + 1).padStart(2, '0')
      const d = String(estDate.getDate()).padStart(2, '0')
      const hh = String(estDate.getHours()).padStart(2, '0')
      const mm = String(estDate.getMinutes()).padStart(2, '0')
      formEstimatedTime.value = `${y}-${m}-${d}T${hh}:${mm}`
    }
  }
)

function getSkillLabel(skill: string) {
  return TechnicianSkillLabels[skill as keyof typeof TechnicianSkillLabels] || skill
}

function isFormValid(): boolean {
  if (!selectedTechnicianId.value) return false
  if (!formEstimatedTime.value) return false
  if (props.isTransfer && !transferReason.value.trim()) return false
  return true
}

function handleSubmit() {
  if (!isFormValid() || !selectedTechnician.value) return

  const notes = props.isTransfer && transferReason.value.trim()
    ? `[转派原因] ${transferReason.value}\n${formNotes.value}`.trim()
    : formNotes.value

  emit('submit', {
    technicianId: selectedTechnician.value.id,
    technicianName: selectedTechnician.value.name,
    priority: formPriority.value,
    estimatedCompletionTime: formEstimatedTime.value,
    notes,
    assignedBy: formAssignedBy.value,
  })
}

function formatDateTimeLocal(dateStr?: string) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="show"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        class="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        @click="$emit('close')"
      ></div>
      <div
        class="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        <div
          class="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50/50 to-indigo-50/50"
        >
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-xl bg-blue-100 border border-blue-200 flex items-center justify-center"
            >
              <Users class="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 class="text-base font-semibold text-slate-800">
                {{ isTransfer ? '转派任务' : '任务分配' }}
              </h3>
              <p class="text-xs text-slate-500 mt-0.5">
                {{ stageInfo ? `${stageInfo.label}阶段` : '选择阶段' }}
              </p>
            </div>
          </div>
          <button
            class="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            @click="$emit('close')"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <div
          v-if="orderNumber"
          class="px-6 py-3 bg-slate-50/80 border-b border-slate-100"
        >
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div class="flex items-center gap-1.5">
              <Package class="w-3.5 h-3.5 text-slate-400" />
              <span class="text-slate-500">订单号：</span>
              <span class="font-semibold text-slate-700 font-mono">{{ orderNumber }}</span>
            </div>
            <div class="flex items-center gap-1.5">
              <Wrench class="w-3.5 h-3.5 text-slate-400" />
              <span class="text-slate-500">修复体：</span>
              <span class="font-semibold text-slate-700">{{ workItemsCount || 0 }} 件</span>
            </div>
            <div class="flex items-center gap-1.5">
              <Calendar class="w-3.5 h-3.5 text-slate-400" />
              <span class="text-slate-500">交期：</span>
              <span class="font-semibold text-slate-700">{{ deliveryDate || '-' }}</span>
            </div>
            <div class="flex items-center gap-1.5">
              <Target class="w-3.5 h-3.5 text-slate-400" />
              <span class="text-slate-500">诊所：</span>
              <span class="font-semibold text-slate-700 truncate">{{ clinicName || '-' }}</span>
            </div>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto p-6">
          <div class="space-y-6">
            <div>
              <div class="flex items-center justify-between mb-3">
                <label class="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                  <User class="w-4 h-4 text-slate-500" />
                  选择技师
                </label>
                <span class="text-xs text-slate-500">
                  共 {{ suitableTechnicians.length }} 名合适技师
                </span>
              </div>

              <div class="space-y-2 max-h-72 overflow-y-auto pr-1">
                <div
                  v-for="tech in suitableTechnicians"
                  :key="tech.id"
                  class="group relative p-4 rounded-xl border-2 cursor-pointer transition-all"
                  :class="[
                    selectedTechnicianId === tech.id
                      ? 'border-blue-500 bg-blue-50/50 shadow-sm ring-2 ring-blue-100'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50',
                  ]"
                  @click="selectedTechnicianId = tech.id"
                >
                  <div class="flex items-start gap-4">
                    <div
                      class="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm flex-shrink-0"
                      :class="`bg-gradient-to-br ${tech.avatarColor || 'from-slate-400 to-slate-600'}`"
                    >
                      {{ tech.name.charAt(0) }}
                    </div>

                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2 flex-wrap mb-1">
                        <span class="font-semibold text-slate-800">{{ tech.name }}</span>
                        <span
                          v-if="tech.level"
                          class="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium border"
                          :class="TechnicianLevelColors[tech.level]"
                        >
                          {{ TechnicianLevelLabels[tech.level] }}
                        </span>
                        <span
                          class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium border"
                          :class="TechnicianStatusColors[tech.status]"
                        >
                          {{ TechnicianStatusLabels[tech.status] }}
                        </span>
                        <span
                          v-if="tech.primarySkill && stageInfo && TechnicianSkillLabels[tech.primarySkill] === stageInfo.label"
                          class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200"
                        >
                          <Star class="w-2.5 h-2.5 fill-amber-500" />
                          主工种
                        </span>
                      </div>

                      <div class="flex items-center gap-1.5 flex-wrap mb-2">
                        <span
                          v-for="skill in tech.skills.slice(0, 4)"
                          :key="skill"
                          class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600 border border-slate-200"
                        >
                          {{ getSkillLabel(skill) }}
                        </span>
                        <span
                          v-if="tech.skills.length > 4"
                          class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-slate-50 text-slate-500"
                        >
                          +{{ tech.skills.length - 4 }}
                        </span>
                      </div>

                      <div class="grid grid-cols-3 gap-3 text-xs">
                        <div>
                          <div class="text-slate-500 mb-0.5">当前在制</div>
                          <div class="font-semibold" :class="tech.currentTasksCount >= tech.capacityLimit ? 'text-rose-600' : 'text-slate-700'">
                            {{ tech.currentTasksCount }} / {{ tech.capacityLimit }}
                          </div>
                        </div>
                        <div>
                          <div class="text-slate-500 mb-0.5">今日完成</div>
                          <div class="font-semibold text-emerald-600">{{ tech.todayCompleted }}</div>
                        </div>
                        <div>
                          <div class="text-slate-500 mb-0.5">平均用时</div>
                          <div class="font-semibold text-slate-700">{{ tech.avgTaskDurationMinutes }} 分钟</div>
                        </div>
                      </div>

                      <div class="mt-2">
                        <div class="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                          <span>产能使用率</span>
                          <span>{{ Math.round((tech.currentTasksCount / tech.capacityLimit) * 100) }}%</span>
                        </div>
                        <div class="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            class="h-full rounded-full transition-all"
                            :class="[
                              (tech.currentTasksCount / tech.capacityLimit) >= 0.9
                                ? 'bg-rose-500'
                                : (tech.currentTasksCount / tech.capacityLimit) >= 0.7
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            ]"
                            :style="{ width: `${Math.min(100, (tech.currentTasksCount / tech.capacityLimit) * 100)}%` }"
                          ></div>
                        </div>
                      </div>
                    </div>

                    <div
                      class="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1"
                      :class="selectedTechnicianId === tech.id ? 'border-blue-500 bg-blue-500' : 'border-slate-300'"
                    >
                      <CheckCircle2
                        v-if="selectedTechnicianId === tech.id"
                        class="w-3.5 h-3.5 text-white"
                      />
                    </div>
                  </div>
                </div>

                <div
                  v-if="suitableTechnicians.length === 0"
                  class="p-8 text-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50"
                >
                  <Users class="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p class="text-sm font-medium text-slate-600 mb-1">暂无合适技师</p>
                  <p class="text-xs text-slate-400">该阶段技能的技师当前不在岗，请稍后再试</p>
                </div>
              </div>
            </div>

            <div v-if="selectedTechnician" class="p-4 rounded-xl bg-gradient-to-br from-blue-50/60 to-indigo-50/60 border border-blue-100">
              <div class="text-xs font-semibold text-blue-700 mb-2 flex items-center gap-1">
                <Zap class="w-3.5 h-3.5" />
                智能推荐
              </div>
              <div class="grid grid-cols-2 gap-3 text-xs">
                <div class="flex items-center justify-between p-2 bg-white/70 rounded-lg">
                  <span class="text-slate-500">预计处理时长</span>
                  <span class="font-semibold text-blue-700">{{ estimatedDurationHours }} 小时</span>
                </div>
                <div class="flex items-center justify-between p-2 bg-white/70 rounded-lg">
                  <span class="text-slate-500">分配后剩余产能</span>
                  <span class="font-semibold" :class="selectedTechnician.capacityLimit - selectedTechnician.currentTasksCount - 1 <= 1 ? 'text-amber-600' : 'text-emerald-600'">
                    {{ Math.max(0, selectedTechnician.capacityLimit - selectedTechnician.currentTasksCount - 1) }} 个
                  </span>
                </div>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Target class="w-4 h-4 text-slate-500" />
                  任务优先级
                </label>
                <div class="grid grid-cols-4 gap-2">
                  <button
                    v-for="(label, key) in TaskPriorityLabels"
                    :key="key"
                    type="button"
                    class="px-2 py-2 text-xs font-medium rounded-lg border transition-all"
                    :class="[
                      formPriority === key
                        ? TaskPriorityColors[key as TaskPriority] + ' ring-2 ring-offset-1'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    ]"
                    @click="formPriority = key as TaskPriority"
                  >
                    {{ label }}
                  </button>
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Clock class="w-4 h-4 text-slate-500" />
                  预计完成时间
                </label>
                <input
                  v-model="formEstimatedTime"
                  type="datetime-local"
                  class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div v-if="isTransfer">
              <label class="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
                <AlertTriangle class="w-4 h-4 text-amber-500" />
                转派原因 <span class="text-rose-500">*</span>
              </label>
              <textarea
                v-model="transferReason"
                rows="2"
                placeholder="请说明转派原因，例如：原技师请假、产能已满、技能不匹配等"
                class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-400 resize-none"
              ></textarea>
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Wrench class="w-4 h-4 text-slate-500" />
                工艺备注（可选）
              </label>
              <textarea
                v-model="formNotes"
                rows="2"
                placeholder="请输入工艺要求、特殊说明、注意事项等"
                class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-400 resize-none"
              ></textarea>
            </div>
          </div>
        </div>

        <div
          class="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/50"
        >
          <button
            type="button"
            class="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            @click="$emit('close')"
          >
            取消
          </button>
          <button
            type="button"
            :disabled="!isFormValid()"
            class="px-5 py-2 text-sm font-semibold text-white rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            :class="isFormValid() ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-400'"
            @click="handleSubmit"
          >
            <span class="flex items-center gap-1.5">
              <CheckCircle2 class="w-4 h-4" />
              {{ isTransfer ? '确认转派' : '确认分配' }}
            </span>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
