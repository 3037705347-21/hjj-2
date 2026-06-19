<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  X,
  AlertTriangle,
  Wrench,
  User,
  Clock,
  DollarSign,
  CheckCircle2,
  XCircle,
  ChevronRight,
  ArrowRight,
  FileText,
  Eye,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-vue-next'
import type {
  Order,
  ReturnRecord,
  ReworkStatus,
} from '../types'
import {
  ReworkStatusLabels,
  ReworkStatusColors,
  ReworkSourceStageLabels,
  ReworkProblemTypeLabels,
  ReworkRootCauseLabels,
  ReworkResponsibilityLabels,
  OrderStatusLabels,
  ProcessingStages,
} from '../types'

const props = defineProps<{
  show: boolean
  order: Order | undefined
  rework: ReturnRecord | undefined
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'accept', params: { operator: string; note?: string }): void
  (e: 'startRectification', params: { operator: string; note?: string }): void
  (e: 'submitForRecheck', params: { operator: string; note?: string }): void
  (e: 'closeRework', params: {
    operator: string
    recheckResult: 'pass' | 'fail'
    closureNote?: string
    recheckNote?: string
    chargeAmount?: number
  }): void
}>()

const activeTab = ref<'detail' | 'timeline'>('detail')
const operatorInput = ref('')
const noteInput = ref('')
const recheckNoteInput = ref('')
const closureNoteInput = ref('')
const chargeAmountInput = ref<number | undefined>(undefined)
const recheckResult = ref<'pass' | 'fail'>('pass')
const showActionDialog = ref<null | 'accept' | 'rectify' | 'recheck' | 'close'>(null)

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

const canAccept = computed(() => props.rework?.status === 'initiated')
const canStartRectify = computed(() => props.rework?.status === 'accepted')
const canSubmitRecheck = computed(() => props.rework?.status === 'rectifying')
const canClose = computed(() => props.rework?.status === 'rechecking')

const reworkStepList = computed(() => [
  { status: 'initiated' as ReworkStatus, label: '发起返工', icon: AlertTriangle },
  { status: 'accepted' as ReworkStatus, label: '返工受理', icon: Eye },
  { status: 'rectifying' as ReworkStatus, label: '返工整改', icon: Wrench },
  { status: 'rechecking' as ReworkStatus, label: '返工复检', icon: CheckCircle2 },
  { status: 'closed' as ReworkStatus, label: '返工关闭', icon: CheckCircle2 },
])

function getStepIndex(status: ReworkStatus): number {
  return reworkStepList.value.findIndex((s) => s.status === status)
}

function openActionDialog(action: 'accept' | 'rectify' | 'recheck' | 'close') {
  showActionDialog.value = action
  operatorInput.value = ''
  noteInput.value = ''
  recheckNoteInput.value = ''
  closureNoteInput.value = ''
  chargeAmountInput.value = props.rework?.chargeAmount
  recheckResult.value = 'pass'
}

function closeActionDialog() {
  showActionDialog.value = null
}

function confirmAction() {
  if (!showActionDialog.value) return
  if (!operatorInput.value.trim()) {
    alert('请输入操作人姓名')
    return
  }
  switch (showActionDialog.value) {
    case 'accept':
      emit('accept', {
        operator: operatorInput.value.trim(),
        note: noteInput.value.trim() || undefined,
      })
      break
    case 'rectify':
      emit('startRectification', {
        operator: operatorInput.value.trim(),
        note: noteInput.value.trim() || undefined,
      })
      break
    case 'recheck':
      emit('submitForRecheck', {
        operator: operatorInput.value.trim(),
        note: noteInput.value.trim() || undefined,
      })
      break
    case 'close':
      emit('closeRework', {
        operator: operatorInput.value.trim(),
        recheckResult: recheckResult.value,
        closureNote: closureNoteInput.value.trim() || undefined,
        recheckNote: recheckNoteInput.value.trim() || undefined,
        chargeAmount: chargeAmountInput.value,
      })
      break
  }
  closeActionDialog()
}

const actionDialogTitle = computed(() => {
  switch (showActionDialog.value) {
    case 'accept': return '受理返工'
    case 'rectify': return '开始整改'
    case 'recheck': return '提交复检'
    case 'close': return '关闭返工'
    default: return ''
  }
})

function handleClose() {
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" @click="handleClose"></div>
      <div class="relative bg-white rounded-xl shadow-2xl w-full max-w-3xl mx-4 overflow-hidden max-h-[92vh] flex flex-col">
        <div v-if="rework" class="px-5 py-4 border-b border-slate-100 flex items-center justify-between" :class="rework.status === 'closed' ? 'bg-emerald-50/50' : 'bg-rose-50/50'">
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" :class="rework.status === 'closed' ? 'bg-emerald-100 border border-emerald-200' : 'bg-rose-100 border border-rose-200'">
              <AlertTriangle v-if="rework.status !== 'closed'" class="w-5 h-5 text-rose-600" />
              <CheckCircle2 v-else class="w-5 h-5 text-emerald-600" />
            </div>
            <div class="min-w-0">
              <div class="flex items-center gap-2 flex-wrap mb-0.5">
                <h3 class="text-base font-semibold text-slate-800 truncate">返工详情 - {{ rework.id }}</h3>
                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border" :class="ReworkStatusColors[rework.status]">{{ ReworkStatusLabels[rework.status] }}</span>
              </div>
              <p class="text-xs text-slate-500">订单：{{ order?.orderNumber }} · 发起于 {{ formatDate(rework.returnedAt) }}</p>
            </div>
          </div>
          <button class="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg transition-colors flex-shrink-0" @click="handleClose">
            <X class="w-4 h-4" />
          </button>
        </div>

        <div v-if="rework" class="flex-1 overflow-hidden flex flex-col">
          <div class="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
            <div class="flex items-center justify-between mb-4">
              <div class="text-xs font-medium text-slate-500">返工流程进度</div>
              <div class="text-xs text-slate-500">
                返工前：<span class="font-medium text-slate-700">{{ getStageInfo(rework.stageBeforeRework)?.label }}</span>
                <ChevronRight class="w-3 h-3 inline mx-0.5" />
                <span :class="rework.statusBeforeRework === 'completed' ? 'text-emerald-700' : 'text-slate-700'" class="font-medium">{{ OrderStatusLabels[rework.statusBeforeRework] }}</span>
              </div>
            </div>
            <div class="flex items-start justify-between relative">
              <div class="absolute left-6 right-6 top-3 h-0.5 bg-slate-200 -z-0"></div>
              <div
                class="absolute left-6 top-3 h-0.5 -z-0 bg-gradient-to-r from-rose-400 via-amber-400 to-emerald-400"
                :style="{ width: `${(getStepIndex(rework.status) / (reworkStepList.length - 1)) * 100}%` }"
              ></div>
              <div v-for="(step, idx) in reworkStepList" :key="step.status" class="flex flex-col items-center relative z-10 flex-1">
                <div class="w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all" :class="[
                  idx <= getStepIndex(rework.status)
                    ? rework.status === 'closed' && idx === reworkStepList.length - 1
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : 'bg-rose-500 border-rose-500 text-white'
                    : 'bg-white border-slate-300 text-slate-400'
                ]">
                  <component :is="step.icon" class="w-3 h-3" />
                </div>
                <div class="mt-1.5 text-[11px] font-medium text-center" :class="idx <= getStepIndex(rework.status) ? 'text-slate-800' : 'text-slate-400'">{{ step.label }}</div>
              </div>
            </div>
          </div>

          <div class="px-5 py-3 border-b border-slate-100 flex items-center gap-1">
            <button class="px-3 py-1.5 rounded-md text-xs font-medium transition-colors" :class="activeTab === 'detail' ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'" @click="activeTab = 'detail'">
              <FileText class="w-3 h-3 inline mr-1" />详细信息
            </button>
            <button class="px-3 py-1.5 rounded-md text-xs font-medium transition-colors" :class="activeTab === 'timeline' ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'" @click="activeTab = 'timeline'">
              <Clock class="w-3 h-3 inline mr-1" />状态流转记录
            </button>
          </div>

          <div v-if="activeTab === 'detail'" class="p-5 space-y-4 overflow-y-auto flex-1">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div class="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div class="text-xs text-slate-500 mb-1">返工来源阶段</div>
                <div class="text-sm font-medium text-slate-800">{{ ReworkSourceStageLabels[rework.sourceStage] }}</div>
              </div>
              <div class="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div class="text-xs text-slate-500 mb-1">问题类型</div>
                <div class="text-sm font-medium text-slate-800">{{ ReworkProblemTypeLabels[rework.problemType] }}</div>
              </div>
              <div class="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div class="text-xs text-slate-500 mb-1">问题根因</div>
                <div class="text-sm font-medium text-slate-800">{{ ReworkRootCauseLabels[rework.rootCause] }}</div>
              </div>
              <div class="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div class="text-xs text-slate-500 mb-1">责任归属</div>
                <div class="text-sm font-medium text-slate-800">{{ ReworkResponsibilityLabels[rework.responsibility] }}</div>
              </div>
              <div class="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div class="text-xs text-slate-500 mb-1">责任技师</div>
                <div class="text-sm font-medium text-slate-800 flex items-center gap-1">
                  <User class="w-3 h-3 text-slate-400" />
                  {{ rework.responsibleTechnician || '未指定' }}
                </div>
              </div>
              <div class="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div class="text-xs text-slate-500 mb-1">整改截止日期</div>
                <div class="text-sm font-medium text-slate-800 flex items-center gap-1">
                  <Clock class="w-3 h-3 text-slate-400" />
                  {{ formatShortDate(rework.deadline) }}
                </div>
              </div>
              <div class="p-3 bg-amber-50 rounded-lg border border-amber-200 md:col-span-2">
                <div class="text-xs text-amber-700 mb-1 flex items-center gap-1"><DollarSign class="w-3 h-3" />费用信息</div>
                <div class="text-sm font-medium text-amber-800">
                  <template v-if="rework.chargeable">
                    收费返工 · 金额：<span class="text-lg">¥{{ rework.chargeAmount?.toLocaleString() || '0.00' }}</span>
                  </template>
                  <template v-else>免费返工</template>
                </div>
              </div>
            </div>

            <div>
              <div class="text-xs font-medium text-slate-500 mb-1.5">关联牙位</div>
              <div class="flex flex-wrap gap-1.5">
                <span v-for="tooth in rework.relatedTeeth" :key="tooth" class="inline-flex items-center justify-center px-2 py-1 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-xs font-mono font-bold">{{ tooth }}</span>
              </div>
            </div>

            <div class="p-4 bg-rose-50 rounded-lg border border-rose-200">
              <div class="flex items-center gap-1.5 text-xs font-medium text-rose-700 mb-2">
                <AlertTriangle class="w-3.5 h-3.5" />问题描述
              </div>
              <p class="text-sm text-slate-800 leading-relaxed">{{ rework.reason }}</p>
            </div>

            <div class="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
              <div class="flex items-center gap-1.5 text-xs font-medium text-emerald-700 mb-2">
                <Wrench class="w-3.5 h-3.5" />整改措施
              </div>
              <p class="text-sm text-slate-800 leading-relaxed">{{ rework.correctiveAction }}</p>
            </div>

            <div v-if="rework.recheckNote || rework.closureNote" class="space-y-3">
              <div v-if="rework.recheckNote" class="p-4 bg-violet-50 rounded-lg border border-violet-200">
                <div class="flex items-center gap-1.5 text-xs font-medium text-violet-700 mb-2">
                  <Eye class="w-3.5 h-3.5" />复检备注
                </div>
                <p class="text-sm text-slate-800 leading-relaxed">{{ rework.recheckNote }}</p>
              </div>
              <div v-if="rework.closureNote" class="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div class="flex items-center gap-1.5 text-xs font-medium text-slate-700 mb-2">
                  <CheckCircle2 class="w-3.5 h-3.5" />关闭备注
                </div>
                <p class="text-sm text-slate-800 leading-relaxed">{{ rework.closureNote }}</p>
              </div>
            </div>

            <div v-if="rework.recheckResult" class="p-3 rounded-lg border flex items-center gap-2" :class="rework.recheckResult === 'pass' ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'">
              <ThumbsUp v-if="rework.recheckResult === 'pass'" class="w-4 h-4 text-emerald-600" />
              <ThumbsDown v-else class="w-4 h-4 text-rose-600" />
              <span class="text-sm font-medium" :class="rework.recheckResult === 'pass' ? 'text-emerald-700' : 'text-rose-700'">复检结果：{{ rework.recheckResult === 'pass' ? '通过' : '不通过' }}</span>
            </div>
          </div>

          <div v-else-if="activeTab === 'timeline'" class="p-5 overflow-y-auto flex-1">
            <div class="space-y-0">
              <div v-for="(entry, idx) in rework.statusHistory" :key="idx" class="relative pl-8 pb-5 last:pb-0">
                <div v-if="idx < rework.statusHistory.length - 1" class="absolute left-3.5 top-5 w-px h-full bg-slate-200"></div>
                <div class="absolute left-0 top-0 w-7 h-7 rounded-full flex items-center justify-center border-2 bg-white" :class="[
                  entry.toStatus === 'closed'
                    ? 'border-emerald-500'
                    : entry.toStatus === 'initiated'
                    ? 'border-rose-500'
                    : 'border-blue-500'
                ]">
                  <div class="w-2 h-2 rounded-full" :class="[
                    entry.toStatus === 'closed'
                      ? 'bg-emerald-500'
                      : entry.toStatus === 'initiated'
                      ? 'bg-rose-500'
                      : 'bg-blue-500'
                  ]"></div>
                </div>
                <div class="bg-white border border-slate-200 rounded-lg p-3 ml-2">
                  <div class="flex items-center justify-between mb-1.5 flex-wrap gap-2">
                    <div class="flex items-center gap-2">
                      <template v-if="entry.fromStatus">
                        <span class="text-xs px-2 py-0.5 rounded border text-slate-500 bg-slate-50">{{ ReworkStatusLabels[entry.fromStatus] }}</span>
                        <ArrowRight class="w-3 h-3 text-slate-300" />
                      </template>
                      <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border" :class="ReworkStatusColors[entry.toStatus]">{{ ReworkStatusLabels[entry.toStatus] }}</span>
                    </div>
                    <div class="flex items-center gap-3 text-xs text-slate-500">
                      <span class="inline-flex items-center gap-1"><User class="w-3 h-3" />{{ entry.operator }}</span>
                      <span class="inline-flex items-center gap-1"><Clock class="w-3 h-3" />{{ formatDate(entry.timestamp) }}</span>
                    </div>
                  </div>
                  <p v-if="entry.note" class="text-xs text-slate-600 bg-slate-50 rounded px-2.5 py-1.5 border border-slate-100">{{ entry.note }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="rework && rework.status !== 'closed'" class="px-5 py-4 border-t border-slate-100 flex items-center justify-between gap-3 bg-slate-50">
          <div class="text-xs text-slate-500">
            <template v-if="canAccept">待受理：请核实问题后点击受理</template>
            <template v-else-if="canStartRectify">待整改：分配给责任技师开始整改</template>
            <template v-else-if="canSubmitRecheck">待复检：整改完成后提交质检复检</template>
            <template v-else-if="canClose">待关闭：复检完成后关闭返工</template>
          </div>
          <div class="flex items-center gap-2 flex-wrap">
            <button v-if="canAccept" class="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm" @click="openActionDialog('accept')">
              <Eye class="w-4 h-4" />受理返工
            </button>
            <button v-if="canStartRectify" class="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition-colors shadow-sm" @click="openActionDialog('rectify')">
              <Wrench class="w-4 h-4" />开始整改
            </button>
            <button v-if="canSubmitRecheck" class="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-violet-600 rounded-lg hover:bg-violet-700 transition-colors shadow-sm" @click="openActionDialog('recheck')">
              <CheckCircle2 class="w-4 h-4" />提交复检
            </button>
            <button v-if="canClose" class="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm" @click="openActionDialog('close')">
              <CheckCircle2 class="w-4 h-4" />关闭返工
            </button>
          </div>
        </div>

        <div v-if="showActionDialog" class="absolute inset-0 z-10 flex items-center justify-center bg-white/90 backdrop-blur-sm">
          <div class="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden border border-slate-200">
            <div class="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 class="text-base font-semibold text-slate-800">{{ actionDialogTitle }}</h3>
              <button class="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors" @click="closeActionDialog">
                <X class="w-4 h-4" />
              </button>
            </div>
            <div class="p-5 space-y-4">
              <div>
                <label class="block text-xs font-medium text-slate-700 mb-1.5">操作人 <span class="text-rose-500">*</span></label>
                <input v-model="operatorInput" type="text" placeholder="请输入您的姓名" class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-400" />
              </div>

              <div v-if="showActionDialog !== 'close' || (showActionDialog === 'close' && recheckResult === 'fail' || recheckNoteInput)">
                <label class="block text-xs font-medium text-slate-700 mb-1.5">
                  <template v-if="showActionDialog === 'close'">复检说明/备注</template>
                  <template v-else>备注（可选）</template>
                </label>
                <textarea v-if="showActionDialog === 'close'" v-model="recheckNoteInput" rows="2" placeholder="请输入复检说明" class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-400 resize-none"></textarea>
                <textarea v-else v-model="noteInput" rows="2" placeholder="请输入操作备注" class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-400 resize-none"></textarea>
              </div>

              <div v-if="showActionDialog === 'close'" class="space-y-3 pt-2 border-t border-slate-100">
                <div>
                  <label class="block text-xs font-medium text-slate-700 mb-2">复检结果 <span class="text-rose-500">*</span></label>
                  <div class="flex items-center gap-3">
                    <label class="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border-2 cursor-pointer transition-all" :class="recheckResult === 'pass' ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-emerald-300'">
                      <input type="radio" v-model="recheckResult" value="pass" class="sr-only" />
                      <ThumbsUp class="w-4 h-4" :class="recheckResult === 'pass' ? 'text-emerald-600' : 'text-slate-400'" />
                      <span class="text-sm font-medium" :class="recheckResult === 'pass' ? 'text-emerald-700' : 'text-slate-600'">通过</span>
                    </label>
                    <label class="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border-2 cursor-pointer transition-all" :class="recheckResult === 'fail' ? 'border-rose-500 bg-rose-50' : 'border-slate-200 hover:border-rose-300'">
                      <input type="radio" v-model="recheckResult" value="fail" class="sr-only" />
                      <ThumbsDown class="w-4 h-4" :class="recheckResult === 'fail' ? 'text-rose-600' : 'text-slate-400'" />
                      <span class="text-sm font-medium" :class="recheckResult === 'fail' ? 'text-rose-700' : 'text-slate-600'">不通过</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label class="block text-xs font-medium text-slate-700 mb-1.5">关闭备注（可选）</label>
                  <textarea v-model="closureNoteInput" rows="2" placeholder="请输入关闭返工的总结备注" class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-400 resize-none"></textarea>
                </div>

                <div>
                  <label class="block text-xs font-medium text-slate-700 mb-1.5">
                    <span class="inline-flex items-center gap-1"><DollarSign class="w-3 h-3" />收费金额（元）</span>
                    <span class="text-slate-400 font-normal">· 原金额：{{ rework?.chargeable ? '¥' + (rework?.chargeAmount?.toLocaleString() || '0.00') : '免费' }}</span>
                  </label>
                  <input v-model.number="chargeAmountInput" type="number" min="0" step="0.01" placeholder="如需调整可重新输入" class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent placeholder:text-slate-400" />
                </div>
              </div>
            </div>
            <div class="px-5 py-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50">
              <button class="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors" @click="closeActionDialog">取消</button>
              <button class="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm inline-flex items-center gap-1.5" :disabled="!operatorInput.trim()" :class="{ 'opacity-50 cursor-not-allowed': !operatorInput.trim() }" @click="confirmAction">
                <CheckCircle2 class="w-4 h-4" />确认
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
