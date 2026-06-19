<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { X, AlertTriangle, Wrench, User, Clock, DollarSign, CheckCircle2 } from 'lucide-vue-next'
import type {
  Order,
  ReworkSourceStage,
  ReworkProblemType,
  ReworkRootCause,
  ReworkResponsibility,
  ProcessingStage,
} from '../types'
import {
  ReworkSourceStageLabels,
  ReworkProblemTypeLabels,
  ReworkRootCauseLabels,
  ReworkResponsibilityLabels,
  ProcessingStages,
} from '../types'

const props = defineProps<{
  show: boolean
  order: Order | undefined
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'submit', params: {
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
  }): void
}>()

const formSourceStage = ref<ReworkSourceStage>('quality-check')
const formProblemType = ref<ReworkProblemType>('edge-misfit')
const formRootCause = ref<ReworkRootCause>('technician-error')
const formResponsibility = ref<ReworkResponsibility>('qc-personnel')
const formReason = ref('')
const formCorrectiveAction = ref('')
const formRelatedTeeth = ref<string[]>([])
const formResponsibleTechnician = ref('')
const formChargeable = ref(false)
const formChargeAmount = ref<number | undefined>(undefined)
const formDeadline = ref('')
const formTargetStage = ref<ProcessingStage | ''>('')
const formOperator = ref('')

watch(() => props.show, (newVal) => {
  if (newVal && props.order) {
    formSourceStage.value = (props.order.currentStage as ReworkSourceStage) || 'quality-check'
    const currentIdx = ProcessingStages.findIndex((s) => s.stage === props.order!.currentStage)
    const prevStage = currentIdx > 0 ? ProcessingStages[currentIdx - 1].stage : ProcessingStages[0].stage
    formTargetStage.value = prevStage
    formRelatedTeeth.value = props.order.workItems.filter((w) => w.toothNumber !== 'all').map((w) => w.toothNumber)
    formDeadline.value = props.order.deliveryDate
    formProblemType.value = 'edge-misfit'
    formRootCause.value = 'technician-error'
    formResponsibility.value = 'other'
    formReason.value = ''
    formCorrectiveAction.value = ''
    formResponsibleTechnician.value = ''
    formChargeable.value = false
    formChargeAmount.value = undefined
    formOperator.value = ''
  }
})

const availableTargetStages = computed(() => {
  if (!props.order) return []
  const currentIdx = ProcessingStages.findIndex((s) => s.stage === props.order!.currentStage)
  return ProcessingStages.slice(0, currentIdx)
})

const allTeeth = computed(() => {
  if (!props.order) return []
  return props.order.workItems
    .filter((w) => w.toothNumber !== 'all')
    .map((w) => w.toothNumber)
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
  if (!formReason.value.trim()) return false
  if (!formCorrectiveAction.value.trim()) return false
  if (!formDeadline.value) return false
  if (formRelatedTeeth.value.length === 0) return false
  if (formChargeable.value && formChargeAmount.value === undefined) return false
  return true
}

function handleSubmit() {
  if (!isFormValid()) {
    alert('请完整填写返工表单：问题描述、整改措施、截止日期、关联牙位为必填项')
    return
  }
  emit('submit', {
    sourceStage: formSourceStage.value,
    problemType: formProblemType.value,
    rootCause: formRootCause.value,
    responsibility: formResponsibility.value,
    reason: formReason.value.trim(),
    correctiveAction: formCorrectiveAction.value.trim(),
    relatedTeeth: [...formRelatedTeeth.value],
    responsibleTechnician: formResponsibleTechnician.value.trim() || undefined,
    chargeable: formChargeable.value,
    chargeAmount: formChargeable.value ? formChargeAmount.value : undefined,
    deadline: formDeadline.value,
    targetStage: formTargetStage.value || undefined,
    operator: formOperator.value.trim() || '系统',
  })
}

function handleClose() {
  emit('close')
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
              <h3 class="text-base font-semibold text-slate-800">发起返工</h3>
              <p class="text-xs text-slate-500">订单：{{ order?.orderNumber }}</p>
            </div>
          </div>
          <button class="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg transition-colors" @click="handleClose">
            <X class="w-4 h-4" />
          </button>
        </div>

        <div class="p-5 space-y-5 overflow-y-auto flex-1">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1.5">
                返工来源阶段 <span class="text-rose-500">*</span>
              </label>
              <select v-model="formSourceStage" class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent">
                <option v-for="(label, key) in ReworkSourceStageLabels" :key="key" :value="key">{{ label }}</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1.5">
                问题类型 <span class="text-rose-500">*</span>
              </label>
              <select v-model="formProblemType" class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent">
                <option v-for="(label, key) in ReworkProblemTypeLabels" :key="key" :value="key">{{ label }}</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1.5">
                问题根因 <span class="text-rose-500">*</span>
              </label>
              <select v-model="formRootCause" class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent">
                <option v-for="(label, key) in ReworkRootCauseLabels" :key="key" :value="key">{{ label }}</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1.5">
                责任归属 <span class="text-rose-500">*</span>
              </label>
              <select v-model="formResponsibility" class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent">
                <option v-for="(label, key) in ReworkResponsibilityLabels" :key="key" :value="key">{{ label }}</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1.5">
                <span class="inline-flex items-center gap-1"><Wrench class="w-3 h-3" />责任技师</span>
              </label>
              <input v-model="formResponsibleTechnician" type="text" placeholder="请输入责任技师姓名" class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent placeholder:text-slate-400" />
            </div>

            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1.5">
                <span class="inline-flex items-center gap-1"><User class="w-3 h-3" />操作人</span>
              </label>
              <input v-model="formOperator" type="text" placeholder="请输入您的姓名" class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent placeholder:text-slate-400" />
            </div>

            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1.5">
                <span class="inline-flex items-center gap-1"><Clock class="w-3 h-3" />回退至阶段</span>
              </label>
              <select v-model="formTargetStage" class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent">
                <option v-for="stage in availableTargetStages" :key="stage.stage" :value="stage.stage">{{ stage.label }}</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1.5">
                <span class="inline-flex items-center gap-1"><Clock class="w-3 h-3" />整改截止日期 <span class="text-rose-500">*</span></span>
              </label>
              <input v-model="formDeadline" type="date" class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent" />
            </div>
          </div>

          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1.5">
              关联牙位 <span class="text-rose-500">*</span>
              <span class="text-slate-400 font-normal">(已选 {{ formRelatedTeeth.length }} / {{ allTeeth.length }})</span>
            </label>
            <div class="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <label v-for="tooth in allTeeth" :key="tooth" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border cursor-pointer transition-all text-sm" :class="formRelatedTeeth.includes(tooth) ? 'bg-rose-100 border-rose-300 text-rose-700' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'">
                <input type="checkbox" :checked="formRelatedTeeth.includes(tooth)" @change="toggleTooth(tooth)" class="sr-only" />
                <span class="font-mono font-bold">{{ tooth }}</span>
              </label>
            </div>
          </div>

          <div>
            <label class="block text-xs font-medium text-rose-700 mb-1.5">
              <span class="inline-flex items-center gap-1"><AlertTriangle class="w-3.5 h-3.5" />问题描述 <span class="text-rose-500">*</span></span>
            </label>
            <textarea v-model="formReason" rows="3" placeholder="请详细描述返工问题，如边缘不密合的具体位置、颜色偏差程度等" class="w-full px-3 py-2 text-sm border border-rose-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent placeholder:text-slate-400 resize-none"></textarea>
          </div>

          <div>
            <label class="block text-xs font-medium text-emerald-700 mb-1.5">
              <span class="inline-flex items-center gap-1"><Wrench class="w-3.5 h-3.5" />整改措施 <span class="text-rose-500">*</span></span>
            </label>
            <textarea v-model="formCorrectiveAction" rows="3" placeholder="请描述计划采取的具体整改措施，如重新扫描模型、调整比色号、重新制作等" class="w-full px-3 py-2 text-sm border border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder:text-slate-400 resize-none"></textarea>
          </div>

          <div class="p-4 bg-amber-50 rounded-lg border border-amber-200 space-y-3">
            <label class="flex items-center gap-2 cursor-pointer">
              <input v-model="formChargeable" type="checkbox" class="w-4 h-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500" />
              <span class="inline-flex items-center gap-1 text-sm font-medium text-amber-800"><DollarSign class="w-4 h-4" />本次返工是否收费</span>
            </label>
            <div v-if="formChargeable" class="pl-6">
              <label class="block text-xs font-medium text-amber-700 mb-1.5">收费金额（元）<span class="text-rose-500"> *</span></label>
              <input v-model.number="formChargeAmount" type="number" min="0" step="0.01" placeholder="请输入收费金额" class="w-full md:w-48 px-3 py-2 text-sm border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent placeholder:text-slate-400" />
            </div>
          </div>
        </div>

        <div class="px-5 py-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50">
          <button class="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors" @click="handleClose">取消</button>
          <button class="px-5 py-2 text-sm font-semibold text-white bg-rose-600 rounded-lg hover:bg-rose-700 transition-colors shadow-sm inline-flex items-center gap-1.5" :disabled="!isFormValid()" :class="{ 'opacity-50 cursor-not-allowed': !isFormValid() }" @click="handleSubmit">
            <CheckCircle2 class="w-4 h-4" />确认发起返工
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
