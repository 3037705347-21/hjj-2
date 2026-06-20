<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import {
  X,
  AlertTriangle,
  Wrench,
  User,
  Calendar,
  CheckCircle2,
  RotateCcw,
} from 'lucide-vue-next'
import type {
  ReworkProblemType,
  ReworkRootCause,
  ReworkResponsibility,
  Order,
} from '../types'
import {
  ReworkProblemTypeLabels,
  ReworkRootCauseLabels,
  ReworkResponsibilityLabels,
  DefectSeverityLabels,
  DefectSeverityColors,
  QualityCheckItemCategoryLabels,
} from '../types'

const props = defineProps<{
  show: boolean
  order: Order | undefined
  inspectionId?: string
}>()

const emit = defineEmits<{
  (e: 'update:show', val: boolean): void
  (e: 'submit', params: {
    inspectionId: string
    problemType: ReworkProblemType
    problemDescription: string
    defectCategory: string
    severity: 'minor' | 'major' | 'critical'
    relatedTeeth: string[]
    responsibleTechnician?: string
    responsibleDepartment?: ReworkResponsibility
    rootCause: ReworkRootCause
    correctiveAction: string
    reworkDeadline: string
    registeredBy: string
    autoCreateRework: boolean
  }): void
}>()

const formProblemType = ref<ReworkProblemType>('edge-misfit')
const formProblemDescription = ref('')
const formDefectCategory = ref('edge-fit')
const formSeverity = ref<'minor' | 'major' | 'critical'>('major')
const formRelatedTeeth = ref<string[]>([])
const formResponsibleTechnician = ref('')
const formResponsibleDepartment = ref<ReworkResponsibility>('finishing-tech')
const formRootCause = ref<ReworkRootCause>('technician-error')
const formCorrectiveAction = ref('')
const formReworkDeadline = ref('')
const formRegisteredBy = ref('')
const formAutoCreateRework = ref(true)

watch(
  () => props.show,
  (newVal) => {
    if (newVal && props.order) {
      formProblemType.value = 'edge-misfit'
      formProblemDescription.value = ''
      formDefectCategory.value = 'edge-fit'
      formSeverity.value = 'major'
      formRelatedTeeth.value = props.order.workItems
        .filter((w) => w.toothNumber !== 'all')
        .map((w) => w.toothNumber)
      formResponsibleTechnician.value = ''
      formResponsibleDepartment.value = 'other'
      formRootCause.value = 'technician-error'
      formCorrectiveAction.value = ''
      formReworkDeadline.value = props.order.deliveryDate
      formRegisteredBy.value = ''
      formAutoCreateRework.value = true
    }
  }
)

const allTeeth = computed(() => {
  if (!props.order) return []
  return props.order.workItems
    .filter((w) => w.toothNumber !== 'all')
    .map((w) => w.toothNumber)
})

const defectCategories = computed(() => {
  return Object.entries(QualityCheckItemCategoryLabels).map(([key, label]) => ({
    key,
    label,
  }))
})

function toggleTooth(tooth: string) {
  const idx = formRelatedTeeth.value.indexOf(tooth)
  if (idx >= 0) {
    formRelatedTeeth.value.splice(idx, 1)
  } else {
    formRelatedTeeth.value.push(tooth)
  }
}

function isFormValid(): boolean {
  if (!formProblemDescription.value.trim()) return false
  if (!formCorrectiveAction.value.trim()) return false
  if (!formReworkDeadline.value) return false
  if (formRelatedTeeth.value.length === 0) return false
  return true
}

function handleSubmit() {
  if (!isFormValid()) {
    alert('请完整填写不合格登记表单：问题描述、整改措施、截止日期、关联牙位为必填项')
    return
  }
  if (!props.inspectionId) {
    alert('缺少质检任务ID')
    return
  }
  emit('submit', {
    inspectionId: props.inspectionId,
    problemType: formProblemType.value,
    problemDescription: formProblemDescription.value.trim(),
    defectCategory: formDefectCategory.value,
    severity: formSeverity.value,
    relatedTeeth: [...formRelatedTeeth.value],
    responsibleTechnician: formResponsibleTechnician.value.trim() || undefined,
    responsibleDepartment: formResponsibleDepartment.value,
    rootCause: formRootCause.value,
    correctiveAction: formCorrectiveAction.value.trim(),
    reworkDeadline: formReworkDeadline.value,
    registeredBy: formRegisteredBy.value.trim() || '系统',
    autoCreateRework: formAutoCreateRework.value,
  })
}

function handleClose() {
  emit('update:show', false)
}
</script>

<template>
  <Teleport to="body">
    <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" @click="handleClose"></div>
      <div class="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden max-h-[90vh] flex flex-col">
        <div class="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-rose-50/50">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-rose-100 border border-rose-200 flex items-center justify-center">
              <AlertTriangle class="w-4 h-4 text-rose-600" />
            </div>
            <div>
              <h3 class="text-base font-semibold text-slate-800">不合格登记</h3>
              <p class="text-xs text-slate-500">订单：{{ order?.orderNumber }}</p>
            </div>
          </div>
          <button
            class="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg transition-colors"
            @click="handleClose"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <div class="p-5 space-y-5 overflow-y-auto flex-1">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1.5">
                不合格分类 <span class="text-rose-500">*</span>
              </label>
              <select
                v-model="formDefectCategory" class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent bg-white"
              >
                <option v-for="cat in defectCategories" :key="cat.key" :value="cat.key">
                  {{ cat.label }}
                </option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1.5">
                问题类型 <span class="text-rose-500">*</span>
              </label>
              <select
                v-model="formProblemType" class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent bg-white"
              >
                <option v-for="(label, key) in ReworkProblemTypeLabels" :key="key" :value="key">
                  {{ label }}
                </option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1.5">
                严重程度 <span class="text-rose-500">*</span>
              </label>
              <div class="flex gap-2">
                <label
                  v-for="(label, key) in DefectSeverityLabels"
                  :key="key"
                  class="flex-1"
                >
                  <input
                    type="radio"
                    :value="key"
                    v-model="formSeverity"
                    class="sr-only"
                  />
                  <div
                    class="px-3 py-2 text-center text-xs font-medium rounded-lg border cursor-pointer transition-all"
                    :class="[
                      formSeverity === key
                        ? DefectSeverityColors[key as 'minor' | 'major' | 'critical']
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    ]"
                  >
                    {{ label }}
                  </div>
                </label>
              </div>
            </div>

            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1.5">
                <span class="inline-flex items-center gap-1">
                  <Calendar class="w-3 h-3" />整改截止日期
                  <span class="text-rose-500">*</span>
                </span>
              </label>
              <input
                v-model="formReworkDeadline"
                type="date"
                class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent bg-white"
              />
            </div>

            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1.5">
                <span class="inline-flex items-center gap-1"><User class="w-3 h-3" />责任技师</span>
              </label>
              <input
                v-model="formResponsibleTechnician"
                type="text"
                placeholder="请输入责任技师姓名"
                class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent placeholder:text-slate-400 bg-white"
              />
            </div>

            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1.5">
                责任部门 <span class="text-rose-500">*</span>
              </label>
              <select
                v-model="formResponsibleDepartment" class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent bg-white"
              >
                <option v-for="(label, key) in ReworkResponsibilityLabels" :key="key" :value="key">
                  {{ label }}
                </option>
              </select>
            </div>

            <div class="md:col-span-2">
              <label class="block text-xs font-medium text-slate-600 mb-1.5">
                根本原因 <span class="text-rose-500">*</span>
              </label>
              <select
                v-model="formRootCause" class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent bg-white"
              >
                <option v-for="(label, key) in ReworkRootCauseLabels" :key="key" :value="key">
                  {{ label }}
                </option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1.5">
              关联牙位 <span class="text-rose-500">*</span>
              <span class="text-slate-400 font-normal">(已选 {{ formRelatedTeeth.length }} / {{ allTeeth.length }})</span>
            </label>
            <div class="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <label
                v-for="tooth in allTeeth"
                :key="tooth"
                class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border cursor-pointer transition-all text-sm"
                :class="[
                  formRelatedTeeth.includes(tooth)
                    ? 'bg-rose-100 border-rose-300 text-rose-700'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                ]"
              >
                <input
                  type="checkbox"
                  :checked="formRelatedTeeth.includes(tooth)"
                  @change="toggleTooth(tooth)"
                  class="sr-only"
                />
                <span class="font-mono font-bold">{{ tooth }}</span>
              </label>
            </div>
          </div>

          <div>
            <label class="block text-xs font-medium text-rose-700 mb-1.5">
              <span class="inline-flex items-center gap-1">
                <AlertTriangle class="w-3.5 h-3.5" />问题描述
                <span class="text-rose-500">*</span>
              </span>
            </label>
            <textarea
              v-model="formProblemDescription"
              rows="3"
              placeholder="请详细描述不合格问题，如具体位置、偏差程度、是否影响临床使用等"
              class="w-full px-3 py-2 text-sm border border-rose-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent placeholder:text-slate-400 resize-none bg-white"
            ></textarea>
          </div>

          <div>
            <label class="block text-xs font-medium text-emerald-700 mb-1.5">
              <span class="inline-flex items-center gap-1">
                <Wrench class="w-3.5 h-3.5" />整改措施
                <span class="text-rose-500">*</span>
              </span>
            </label>
            <textarea
              v-model="formCorrectiveAction"
              rows="3"
              placeholder="请描述计划采取的整改措施，如重新扫描模型、调整比色号、重新制作等"
              class="w-full px-3 py-2 text-sm border border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder:text-slate-400 resize-none bg-white"
            ></textarea>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1.5">
                <span class="inline-flex items-center gap-1"><User class="w-3 h-3" />登记人</span>
              </label>
              <input
                v-model="formRegisteredBy"
                type="text"
                placeholder="请输入您的姓名"
                class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent placeholder:text-slate-400 bg-white"
              />
            </div>
          </div>

          <div class="p-4 bg-amber-50 rounded-lg border border-amber-200">
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                v-model="formAutoCreateRework"
                type="checkbox"
                class="w-4 h-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
              />
              <span class="inline-flex items-center gap-1 text-sm font-medium text-amber-800">
                <RotateCcw class="w-4 h-4" />
                自动生成返工记录
              </span>
            </label>
            <p class="text-[11px] text-amber-700 mt-1 pl-6">
              勾选后将自动创建返工任务，并将订单回退至相应加工阶段
            </p>
          </div>
        </div>

        <div class="px-5 py-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50">
          <button
            class="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
            @click="handleClose"
          >
            取消
          </button>
          <button
            class="px-5 py-2 text-sm font-semibold text-white bg-rose-600 rounded-lg hover:bg-rose-700 transition-colors shadow-sm inline-flex items-center gap-1.5"
            :disabled="!isFormValid()"
            :class="{ 'opacity-50 cursor-not-allowed': !isFormValid() }"
            @click="handleSubmit"
          >
            <CheckCircle2 class="w-4 h-4" />
            确认登记
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
