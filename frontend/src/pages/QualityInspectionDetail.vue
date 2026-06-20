<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft,
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Building2,
  Calendar,
  Users,
  Eye,
  Plus,
  Play,
  CheckCheck,
  RefreshCw,
  Send,
  FileText,
  Pencil,
  Save,
  Wrench,
  RotateCcw,
  ChevronRight,
  ThumbsUp,
  ThumbsDown,
  User,
} from 'lucide-vue-next'
import { useQualityInspection } from '../composables/useQualityInspection'
import { useOrders } from '../composables/useOrders'
import { useRoles } from '../composables/useRoles'
import DefectRegisterDialog from '../components/DefectRegisterDialog.vue'
import type {
  QualityInspection,
  QualityCheckResult,
  QualityInspectionItemResult,
  QualityDefectRecord,
  ReworkProblemType,
  ReworkRootCause,
  ReworkResponsibility,
} from '../types'
import {
  QualityInspectionStatusLabels,
  QualityInspectionStatusColors,
  QualityInspectionStageLabels,
  QualityInspectionStageColors,
  QualityCheckResultLabels,
  QualityCheckResultColors,
  ProcessingStages,
  QualityCheckItemCategoryLabels,
  ReworkProblemTypeLabels,
  ReworkRootCauseLabels,
  ReworkResponsibilityLabels,
  DefectSeverityLabels,
  DefectSeverityColors,
} from '../types'

const route = useRoute()
const router = useRouter()
const {
  getInspectionById,
  startInspection,
  updateCheckItemResult,
  completeInspection,
  registerDefect,
  startReworkForDefect,
  submitForRecheck,
  updateDefectRecheck,
  releaseInspection,
} = useQualityInspection()
const { getOrderById } = useOrders()
const { currentRole, canPerformAction, currentTechnicianName } = useRoles()

const inspection = ref<QualityInspection | undefined>(undefined)
const order = computed(() => inspection.value ? getOrderById(inspection.value.orderId) : undefined)

const showDefectDialog = ref(false)
const formInspector = ref('')
const formNotes = ref('')
const editingRemarkItemId = ref<string | null>(null)
const editingRemark = ref('')
const recheckDefectId = ref<string | null>(null)
const recheckResult = ref<'pass' | 'fail'>('pass')
const recheckNote = ref('')
const recheckBy = ref('')

onMounted(() => {
  const id = String(route.params.id)
  inspection.value = getInspectionById(id)
  formInspector.value = currentTechnicianName.value || ''
})

const canStart = computed(() => {
  if (!inspection.value) return false
  return inspection.value.status === 'pending'
})

const canEditItems = computed(() => {
  if (!inspection.value) return false
  return ['in-progress', 'rechecking'].includes(inspection.value.status)
})

const canComplete = computed(() => {
  if (!inspection.value) return false
  if (!['in-progress', 'rechecking'].includes(inspection.value.status)) return false
  return inspection.value.itemResults.every((i) => i.result !== 'pending')
})

const canRegisterDefect = computed(() => {
  if (!inspection.value) return false
  return ['in-progress', 'rechecking'].includes(inspection.value.status)
})

const canSubmitRecheck = computed(() => {
  if (!inspection.value) return false
  return inspection.value.status === 'reworking'
})

const canRelease = computed(() => {
  if (!inspection.value) return false
  if (inspection.value.inspectionStage !== 'final-check') return false
  if (inspection.value.status !== 'completed') return false
  return inspection.value.overallResult === 'pass' || inspection.value.overallResult === 'recheck-pass'
})

const hasDefects = computed(() => {
  return inspection.value && inspection.value.defects.length > 0
})

const pendingDefects = computed(() => {
  if (!inspection.value) return []
  return inspection.value.defects.filter((d) => !d.recheckResult || d.recheckResult === 'fail')
})

const failItems = computed(() => {
  if (!inspection.value) return []
  return inspection.value.itemResults.filter(
    (i) => i.result === 'fail' || i.result === 'recheck-fail'
  )
})

const groupedItems = computed(() => {
  if (!inspection.value) return []
  const groups: { category: string; categoryLabel: string; items: QualityInspectionItemResult[] }[] = []
  const map = new Map<string, QualityInspectionItemResult[]>()
  inspection.value.itemResults.forEach((item) => {
    if (!map.has(item.category)) {
      map.set(item.category, [])
    }
    map.get(item.category)!.push(item)
  })
  map.forEach((items, category) => {
    groups.push({
      category,
      categoryLabel: QualityCheckItemCategoryLabels[category] || category,
      items,
    })
  })
  return groups
})

const overallResult = computed<QualityCheckResult>(() => {
  if (!inspection.value) return 'pending'
  if (inspection.value.overallResult) return inspection.value.overallResult
  const hasFail = inspection.value.itemResults.some(
    (i) => i.result === 'fail' || i.result === 'recheck-fail'
  )
  const hasRecheckPass = inspection.value.itemResults.some(
    (i) => i.result === 'recheck-pass'
  )
  const allChecked = inspection.value.itemResults.every((i) => i.result !== 'pending')
  if (!allChecked) return 'pending'
  if (hasFail) return hasRecheckPass ? 'recheck-fail' : 'fail'
  return hasRecheckPass ? 'recheck-pass' : 'pass'
})

function formatDate(dateStr: string) {
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

function getProcessingStageLabel(stage: string) {
  return ProcessingStages.find((s) => s.stage === stage)?.label || stage
}

function goBack() {
  router.back()
}

function goToOrder() {
  if (!inspection.value) return
  router.push(`/order/${inspection.value.orderId}`)
}

function handleStart() {
  if (!inspection.value) return
  const inspector = formInspector.value.trim() || currentTechnicianName.value || '质检员'
  const updated = startInspection(inspection.value.id, inspector)
  if (updated) {
    inspection.value = updated
  }
}

function handleItemResult(itemId: string, result: QualityCheckResult) {
  if (!inspection.value || !canEditItems.value) return
  const inspector = formInspector.value.trim() || inspection.value.inspector || '质检员'
  const updated = updateCheckItemResult(
    inspection.value.id,
    itemId,
    result,
    undefined,
    inspector
  )
  if (updated) {
    inspection.value = updated
  }
}

function openRemarkEdit(item: QualityInspectionItemResult) {
  editingRemarkItemId.value = item.checkItemId
  editingRemark.value = item.remark || ''
}

function saveRemark(item: QualityInspectionItemResult) {
  if (!inspection.value) return
  const inspector = formInspector.value.trim() || inspection.value.inspector || '质检员'
  const updated = updateCheckItemResult(
    inspection.value.id,
    item.checkItemId,
    item.result,
    editingRemark.value.trim() || undefined,
    inspector
  )
  if (updated) {
    inspection.value = updated
  }
  editingRemarkItemId.value = null
  editingRemark.value = ''
}

function cancelRemarkEdit() {
  editingRemarkItemId.value = null
  editingRemark.value = ''
}

function handleComplete() {
  if (!inspection.value) return
  if (!confirm('确认完成此次质检吗？')) return
  const result = overallResult.value
  const updated = completeInspection(inspection.value.id, result, formNotes.value.trim() || undefined)
  if (updated) {
    inspection.value = updated
  }
}

function handleRegisterDefect(params: {
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
}) {
  if (!inspection.value) return
  const defect = registerDefect({
    ...params,
    orderId: inspection.value.orderId,
    orderNumber: inspection.value.orderNumber,
  })
  if (defect) {
    const updated = getInspectionById(inspection.value.id)
    if (updated) {
      inspection.value = updated
    }
  }
  showDefectDialog.value = false
}

function handleStartRework() {
  if (!inspection.value) return
  if (!confirm('确认开始整改？订单将进入返工流程。')) return
  const operator = formInspector.value.trim() || currentTechnicianName.value || '系统'
  const updated = startReworkForDefect(inspection.value.id, inspection.value.defects[0]?.id || '', operator)
  if (updated) {
    inspection.value = updated
  }
}

function handleSubmitRecheck() {
  if (!inspection.value) return
  if (!confirm('整改已完成，确认提交复检？')) return
  const operator = formInspector.value.trim() || currentTechnicianName.value || '系统'
  const updated = submitForRecheck(inspection.value.id, operator, formNotes.value.trim() || undefined)
  if (updated) {
    inspection.value = updated
  }
}

function openRecheckDialog(defectId: string) {
  recheckDefectId.value = defectId
  recheckResult.value = 'pass'
  recheckNote.value = ''
  recheckBy.value = formInspector.value.trim() || currentTechnicianName.value || '质检员'
}

function handleRecheckSubmit() {
  if (!inspection.value || !recheckDefectId.value) return
  const updated = updateDefectRecheck(
    inspection.value.id,
    recheckDefectId.value,
    recheckResult.value,
    recheckNote.value.trim(),
    recheckBy.value.trim() || '质检员'
  )
  if (updated) {
    inspection.value = { ...updated }
    if (recheckResult.value === 'pass' && updated.status === 'in-progress') {
      const allItemsRecheckPass = updated.itemResults.every(
        (item) => item.result === 'pass' || item.result === 'recheck-pass'
      )
      if (allItemsRecheckPass) {
        setTimeout(() => {
          if (inspection.value) {
            const finalResult = overallResult.value
            const finalUpdated = completeInspection(
              inspection.value.id,
              finalResult,
              formNotes.value.trim() || undefined
            )
            if (finalUpdated) {
              inspection.value = { ...finalUpdated }
            }
          }
        }, 300)
      }
    }
  }
  recheckDefectId.value = null
}

function handleRelease() {
  if (!inspection.value) return
  if (!confirm('确认放行此产品出厂？')) return
  const operator = formInspector.value.trim() || currentTechnicianName.value || '质检主管'
  const updated = releaseInspection(inspection.value.id, operator, formNotes.value.trim() || undefined)
  if (updated) {
    inspection.value = updated
  }
}
</script>

<template>
  <div class="min-h-full pb-12" v-if="inspection">
    <div class="mb-6">
      <button
        class="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 mb-4 transition-colors"
        @click="goBack"
      >
        <ArrowLeft class="w-4 h-4" />
        返回质检中心
      </button>

      <div class="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-4">
        <div>
          <div class="flex flex-wrap items-center gap-3 mb-2">
            <h1 class="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <ClipboardCheck class="w-6 h-6 text-emerald-600" />
              质检详情
            </h1>
            <span
              class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium border"
              :class="QualityInspectionStageColors[inspection.inspectionStage]"
            >
              {{ QualityInspectionStageLabels[inspection.inspectionStage] }}
            </span>
            <span
              class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium border"
              :class="QualityInspectionStatusColors[inspection.status]"
            >
              {{ QualityInspectionStatusLabels[inspection.status] }}
            </span>
            <span
              v-if="inspection.overallResult"
              class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium border"
              :class="QualityCheckResultColors[inspection.overallResult]"
            >
              {{ QualityCheckResultLabels[inspection.overallResult] }}
            </span>
          </div>
          <p class="text-sm text-slate-500 flex items-center gap-3 flex-wrap">
            <span class="font-mono font-semibold text-slate-700">{{ inspection.orderNumber }}</span>
            <span>·</span>
            <span>{{ inspection.clinicName }}</span>
            <span>·</span>
            <span>创建于 {{ formatDate(inspection.createdAt) }}</span>
          </p>
        </div>

        <div class="flex flex-col items-stretch lg:items-end gap-3">
          <div class="flex items-center gap-2">
            <button
              class="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              @click="goToOrder"
            >
              <Eye class="w-4 h-4" />
              查看订单
            </button>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="['pending', 'in-progress', 'rejected', 'reworking', 'rechecking', 'completed'].includes(inspection.status)"
      class="bg-white rounded-xl border border-slate-200 overflow-hidden mb-6"
    >
      <div class="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div
            class="w-8 h-8 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center"
          >
            <Wrench class="w-4 h-4 text-orange-600" />
          </div>
          <h2 class="text-base font-semibold text-slate-800">
            质检操作区
          </h2>
        </div>
        <span class="text-xs text-slate-500">
          当前状态：{{ QualityInspectionStatusLabels[inspection.status] }}
        </span>
      </div>
      <div class="p-5 space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1.5">
              <span class="inline-flex items-center gap-1"><User class="w-3 h-3" />质检员</span>
            </label>
            <input
              v-model="formInspector"
              type="text"
              placeholder="请输入质检员姓名"
              class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-400"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1.5">
              <span class="inline-flex items-center gap-1"><FileText class="w-3 h-3" />质检备注</span>
            </label>
            <input
              v-model="formNotes"
              type="text"
              placeholder="质检备注（可选）"
              class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-400"
            />
          </div>
        </div>

        <div class="flex flex-wrap gap-3 pt-2 border-t border-slate-100">
          <button
            v-if="canStart"
            class="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            @click="handleStart"
          >
            <Play class="w-4 h-4" />
            开始质检
          </button>
          <button
            v-if="canRegisterDefect"
            class="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-rose-600 rounded-lg hover:bg-rose-700 transition-colors shadow-sm"
            @click="showDefectDialog = true"
          >
            <AlertTriangle class="w-4 h-4" />
            登记不合格
          </button>
          <button
            v-if="canComplete"
            class="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
            @click="handleComplete"
          >
            <CheckCheck class="w-4 h-4" />
            完成质检
          </button>
          <button
            v-if="inspection.status === 'rejected' && hasDefects"
            class="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition-colors shadow-sm"
            @click="handleStartRework"
          >
            <RotateCcw class="w-4 h-4" />
            开始整改
          </button>
          <button
            v-if="canSubmitRecheck"
            class="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition-colors shadow-sm"
            @click="handleSubmitRecheck"
          >
            <RefreshCw class="w-4 h-4" />
            提交复检
          </button>
          <button
            v-if="canRelease"
            class="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors shadow-sm"
            @click="handleRelease"
          >
            <Send class="w-4 h-4" />
            产品放行
          </button>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <div class="xl:col-span-2 space-y-6">
        <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div class="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div
                class="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center"
              >
                <ClipboardCheck class="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h2 class="text-base font-semibold text-slate-800">检查项明细</h2>
                <p class="text-xs text-slate-500">
                  共 {{ inspection.itemResults.length }} 项，合格 {{ inspection.itemResults.filter(i => i.result === 'pass' || i.result === 'recheck-pass').length }} 项，
                  不合格 {{ failItems.length }} 项，
                  待检查 {{ inspection.itemResults.filter(i => i.result === 'pending').length }} 项
                </p>
              </div>
            </div>
            <span
              class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-sm font-semibold border"
              :class="QualityCheckResultColors[overallResult]"
            >
              {{ QualityCheckResultLabels[overallResult] }}
            </span>
          </div>

          <div class="divide-y divide-slate-100">
            <div
              v-for="group in groupedItems"
              :key="group.category"
              class="bg-slate-50/50 px-5 py-2.5 flex items-center gap-2"
            >
              <div class="text-xs font-semibold text-slate-600">
                {{ group.categoryLabel }}
              </div>
              <div class="text-[11px] text-slate-400">
                ({{ group.items.length }} 项)
              </div>
            </div>

            <template v-for="group in groupedItems" :key="group.category + '-items'">
              <div
                v-for="item in group.items"
                :key="item.checkItemId"
                class="px-5 py-4 hover:bg-slate-50/50 transition-colors"
              >
                <div class="flex items-start justify-between gap-4">
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-1.5">
                      <span class="text-sm font-medium text-slate-800">
                        {{ item.checkItemName }}
                      </span>
                      <span
                        v-if="item.result !== 'pending'"
                        class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border"
                        :class="QualityCheckResultColors[item.result]"
                      >
                        {{ QualityCheckResultLabels[item.result] }}
                      </span>
                    </div>

                    <div
                      v-if="item.checkedBy"
                      class="text-xs text-slate-500 flex items-center gap-2"
                    >
                      <Users class="w-3 h-3" />
                      {{ item.checkedBy }}
                      <span v-if="item.checkedAt">· {{ formatDate(item.checkedAt) }}</span>
                    </div>

                    <div v-if="editingRemarkItemId === item.checkItemId" class="mt-3">
                      <textarea
                        v-model="editingRemark"
                        rows="2"
                        placeholder="输入检查备注..."
                        class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-400 resize-none"
                      ></textarea>
                      <div class="flex items-center gap-2 mt-2">
                        <button
                          class="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors inline-flex items-center gap-1"
                          @click="saveRemark(item)"
                        >
                          <Save class="w-3 h-3" />
                          保存
                        </button>
                        <button
                          class="px-3 py-1 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors"
                          @click="cancelRemarkEdit"
                        >
                          取消
                        </button>
                      </div>
                    </div>
                    <div
                      v-else-if="item.remark"
                      class="mt-2 p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-start justify-between gap-2"
                    >
                      <p class="text-xs text-slate-700 flex-1">{{ item.remark }}</p>
                      <button
                        v-if="canEditItems"
                        class="text-slate-400 hover:text-blue-600 p-0.5 flex-shrink-0"
                        @click="openRemarkEdit(item)"
                      >
                        <Pencil class="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <button
                      v-else-if="canEditItems"
                      class="mt-2 text-xs text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
                      @click="openRemarkEdit(item)"
                    >
                      <Pencil class="w-3 h-3" />
                      添加备注
                    </button>
                  </div>

                  <div v-if="canEditItems" class="flex items-center gap-1 flex-shrink-0">
                    <button
                      class="px-3 py-1.5 rounded-md text-xs font-medium border transition-all inline-flex items-center gap-1"
                      :class="item.result === 'pass' || item.result === 'recheck-pass'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300'"
                      @click="handleItemResult(item.checkItemId, inspection.status === 'rechecking' ? 'recheck-pass' : 'pass')"
                    >
                      <CheckCircle2 class="w-3.5 h-3.5" />
                      合格
                    </button>
                    <button
                      class="px-3 py-1.5 rounded-md text-xs font-medium border transition-all inline-flex items-center gap-1"
                      :class="item.result === 'fail' || item.result === 'recheck-fail'
                        ? 'bg-rose-600 text-white border-rose-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300'"
                      @click="handleItemResult(item.checkItemId, inspection.status === 'rechecking' ? 'recheck-fail' : 'fail')"
                    >
                      <XCircle class="w-3.5 h-3.5" />
                      不合格
                    </button>
                  </div>
                  <div v-else class="flex-shrink-0">
                    <Clock v-if="item.result === 'pending'" class="w-5 h-5 text-slate-400" />
                    <CheckCircle2
                      v-else-if="item.result === 'pass' || item.result === 'recheck-pass'"
                      class="w-5 h-5 text-emerald-500"
                    />
                    <XCircle
                      v-else
                      class="w-5 h-5 text-rose-500"
                    />
                  </div>
                </div>
              </div>
            </template>
          </div>
        </div>

        <div
          class="bg-white rounded-xl border overflow-hidden"
          :class="hasDefects ? 'border-rose-200' : 'border-slate-200'"
        >
          <div
            class="px-5 py-4 border-b border-slate-100 flex items-center justify-between"
            :class="hasDefects ? 'bg-rose-50/50 border-rose-100' : 'bg-slate-50/50'"
          >
            <div class="flex items-center gap-2">
              <div
                class="w-8 h-8 rounded-lg flex items-center justify-center border"
                :class="hasDefects ? 'bg-rose-100 border-rose-200' : 'bg-slate-100 border-slate-200'"
              >
                <AlertTriangle
                  class="w-4 h-4"
                  :class="hasDefects ? 'text-rose-600' : 'text-slate-500'"
                />
              </div>
              <div>
                <h2 class="text-base font-semibold text-slate-800">不合格记录</h2>
                <p class="text-xs text-slate-500">
                  共 {{ inspection.defects.length }} 项，
                  待整改 {{ pendingDefects.length }} 项
                </p>
              </div>
            </div>
            <button
              v-if="canRegisterDefect"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-rose-600 rounded-lg hover:bg-rose-700 transition-colors shadow-sm"
              @click="showDefectDialog = true"
            >
              <Plus class="w-3.5 h-3.5" />
              登记不合格
            </button>
          </div>

          <div v-if="!hasDefects" class="p-8 text-center">
            <div class="w-12 h-12 mx-auto mb-2 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 class="w-6 h-6 text-emerald-500" />
            </div>
            <p class="text-sm font-medium text-emerald-700 mb-1">暂无不合格记录</p>
            <p class="text-xs text-slate-500">
              所有检查项均符合质量标准
            </p>
          </div>

          <div v-else class="divide-y divide-slate-100">
            <div
              v-for="(defect, idx) in inspection.defects"
              :key="defect.id"
              class="px-5 py-4"
              :class="defect.recheckResult === 'pass' ? 'bg-emerald-50/30' : defect.recheckResult === 'fail' ? 'bg-rose-50/30' : 'bg-rose-50/20'"
            >
              <div class="flex items-start justify-between gap-4 mb-3 flex-wrap">
                <div class="flex items-center gap-2 flex-wrap">
                  <span
                    class="inline-flex items-center justify-center w-6 h-6 rounded-full text-white text-xs font-bold bg-rose-600"
                  >
                    #{{ idx + 1 }}
                  </span>
                  <span
                    class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border"
                    :class="DefectSeverityColors[defect.severity]"
                  >
                    {{ DefectSeverityLabels[defect.severity] }}
                  </span>
                  <span class="text-sm font-medium text-slate-800">
                    {{ ReworkProblemTypeLabels[defect.problemType] }}
                  </span>
                  <span
                    v-if="defect.recheckResult"
                    class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium border"
                    :class="defect.recheckResult === 'pass' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'"
                  >
                    <ThumbsUp v-if="defect.recheckResult === 'pass'" class="w-2.5 h-2.5" />
                    <ThumbsDown v-else class="w-2.5 h-2.5" />
                    {{ defect.recheckResult === 'pass' ? '复检通过' : '复检不通过' }}
                  </span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-xs text-slate-500">
                    登记：{{ formatDate(defect.registeredAt) }}
                  </span>
                  <button
                    v-if="inspection.status === 'rechecking' && (!defect.recheckResult || defect.recheckResult === 'fail')"
                    class="text-xs font-medium text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
                    @click="openRecheckDialog(defect.id)"
                  >
                    <RefreshCw class="w-3 h-3" />
                    复检
                  </button>
                </div>
              </div>

              <div class="flex flex-wrap gap-1.5 mb-3">
                <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                  {{ ReworkRootCauseLabels[defect.rootCause] }}
                </span>
                <span
                  v-if="defect.responsibleDepartment"
                  class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200"
                >
                  {{ ReworkResponsibilityLabels[defect.responsibleDepartment] }}
                </span>
                <span
                  v-if="defect.responsibleTechnician"
                  class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200"
                >
                  <User class="w-2.5 h-2.5" />
                  {{ defect.responsibleTechnician }}
                </span>
                <span
                  v-for="tooth in defect.relatedTeeth"
                  :key="tooth"
                  class="inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-50 border border-rose-200 text-rose-700"
                >
                  {{ tooth }}
                </span>
              </div>

              <div class="space-y-2 text-sm">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div
                    class="p-2.5 bg-white rounded-lg border border-slate-200"
                  >
                    <div class="flex items-center gap-1 text-[11px] font-medium text-rose-600 mb-0.5">
                      <AlertTriangle class="w-3 h-3" />
                      问题描述
                    </div>
                    <p class="text-slate-700 text-xs">{{ defect.problemDescription }}</p>
                  </div>
                  <div
                    class="p-2.5 bg-white rounded-lg border border-slate-200"
                  >
                    <div class="flex items-center gap-1 text-[11px] font-medium text-emerald-600 mb-0.5">
                      <Wrench class="w-3 h-3" />
                      整改措施
                    </div>
                    <p class="text-slate-700 text-xs">
                      {{ defect.correctiveAction }}
                    </p>
                  </div>
                </div>

                <div class="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                  <div class="flex items-center gap-4 flex-wrap">
                    <span class="inline-flex items-center gap-1">
                      <Calendar class="w-3 h-3" />
                      整改期限：{{ formatShortDate(defect.reworkDeadline) }}
                    </span>
                    <span>登记人：{{ defect.registeredBy }}</span>
                    <span v-if="defect.reworkRecordId">
                      返工单号：{{ defect.reworkRecordId }}
                    </span>
                  </div>
                  <div v-if="defect.recheckResult" class="text-slate-600">
                    复检人：{{ defect.recheckBy }} · {{ formatDate(defect.recheckAt!) }}
                    <span v-if="defect.recheckNote"> · 备注：{{ defect.recheckNote }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="space-y-6">
        <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div class="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <div
              class="w-8 h-8 rounded-lg bg-violet-50 border border-violet-100 flex items-center justify-center"
            >
              <FileText class="w-4 h-4 text-violet-600" />
            </div>
            <h3 class="text-base font-semibold text-slate-800">质检信息</h3>
          </div>
          <div class="p-5 space-y-4">
            <div class="space-y-3">
              <div class="flex items-start justify-between gap-2 text-sm">
                <span class="text-slate-500 flex-shrink-0">订单号</span>
                <span class="font-mono font-medium text-slate-800">{{ inspection.orderNumber }}</span>
              </div>
              <div class="flex items-start justify-between gap-2 text-sm">
                <span class="text-slate-500 flex-shrink-0">诊所</span>
                <span class="text-slate-800 text-right">{{ inspection.clinicName }}</span>
              </div>
              <div class="flex items-start justify-between gap-2 text-sm">
                <span class="text-slate-500 flex-shrink-0">质检类型</span>
                <span
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border"
                  :class="QualityInspectionStageColors[inspection.inspectionStage]"
                >
                  {{ QualityInspectionStageLabels[inspection.inspectionStage] }}
                </span>
              </div>
              <div class="flex items-start justify-between gap-2 text-sm">
                <span class="text-slate-500 flex-shrink-0">加工阶段</span>
                <span class="text-slate-800">{{ getProcessingStageLabel(inspection.processingStage) }}</span>
              </div>
              <div class="flex items-start justify-between gap-2 text-sm">
                <span class="text-slate-500 flex-shrink-0">质检员</span>
                <span class="text-slate-800">{{ inspection.inspector || '-' }}</span>
              </div>
              <div class="flex items-start justify-between gap-2 text-sm">
                <span class="text-slate-500 flex-shrink-0">开始时间</span>
                <span class="text-slate-800">{{ formatDate(inspection.startedAt || '') }}</span>
              </div>
              <div class="flex items-start justify-between gap-2 text-sm">
                <span class="text-slate-500 flex-shrink-0">完成时间</span>
                <span class="text-slate-800">{{ formatDate(inspection.completedAt || '') }}</span>
              </div>
              <div class="flex items-start justify-between gap-2 text-sm">
                <span class="text-slate-500 flex-shrink-0">放行时间</span>
                <span class="text-slate-800">
                  <template v-if="inspection.releasedAt">
                    {{ formatDate(inspection.releasedAt) }}
                    <span class="text-slate-400 text-xs"> ({{ inspection.releasedBy }})</span>
                  </template>
                  <template v-else>-</template>
                </span>
              </div>
              <div class="flex items-start justify-between gap-2 text-sm">
                <span class="text-slate-500 flex-shrink-0">返工次数</span>
                <span class="text-slate-800">{{ inspection.reworkCount }} 次</span>
              </div>
            </div>

            <div v-if="inspection.notes" class="pt-3 border-t border-slate-100">
              <div class="text-xs font-medium text-slate-600 mb-1.5">质检备注</div>
              <p class="text-sm text-slate-700 p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                {{ inspection.notes }}
              </p>
            </div>
          </div>
        </div>

        <div v-if="order" class="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div class="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div
                class="w-8 h-8 rounded-lg bg-sky-50 border border-sky-100 flex items-center justify-center"
              >
                <Building2 class="w-4 h-4 text-sky-600" />
              </div>
              <h3 class="text-base font-semibold text-slate-800">订单信息</h3>
            </div>
            <button
              class="text-xs text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1"
              @click="goToOrder"
            >
              查看详情
              <ChevronRight class="w-3 h-3" />
            </button>
          </div>
          <div class="p-5 space-y-3 text-sm">
            <div class="flex items-center justify-between">
              <span class="text-slate-500">医生</span>
              <span class="text-slate-800">{{ order.doctorName }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-slate-500">患者编号</span>
              <span class="font-mono text-slate-800">{{ order.patient.anonymousCode }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-slate-500">交付日期</span>
              <span class="text-slate-800">{{ formatShortDate(order.deliveryDate) }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-slate-500">修复体数量</span>
              <span class="text-slate-800">{{ order.workItems.length }} 件</span>
            </div>
            <div class="pt-2 border-t border-slate-100">
              <div class="text-xs text-slate-500 mb-2">涉及牙位</div>
              <div class="flex flex-wrap gap-1">
                <span
                  v-for="item in order.workItems.filter(w => w.toothNumber !== 'all')"
                  :key="item.toothNumber"
                  class="inline-flex items-center justify-center px-2 py-0.5 rounded text-xs font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200"
                >
                  {{ item.toothNumber }}
                </span>
                <span
                  v-if="order.workItems.some(w => w.toothNumber === 'all')"
                  class="inline-flex items-center justify-center px-2 py-0.5 rounded text-xs font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200"
                >
                  全口
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <DefectRegisterDialog
      v-model:show="showDefectDialog"
      :order="order"
      :inspection-id="inspection.id"
      @submit="handleRegisterDefect"
    />

    <Teleport to="body">
      <div v-if="recheckDefectId" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" @click="recheckDefectId = null"></div>
        <div class="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
          <div class="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-amber-50/50">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-lg bg-amber-100 border border-amber-200 flex items-center justify-center">
                <RefreshCw class="w-4 h-4 text-amber-600" />
              </div>
              <h3 class="text-base font-semibold text-slate-800">不合格项复检</h3>
            </div>
            <button
              class="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg transition-colors"
              @click="recheckDefectId = null"
            >
              <ChevronRight class="w-4 h-4" />
            </button>
          </div>
          <div class="p-5 space-y-4">
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1.5">
                复检结果 <span class="text-rose-500">*</span>
              </label>
              <div class="flex gap-2">
                <label class="flex-1">
                  <input type="radio" v-model="recheckResult" value="pass" class="sr-only" />
                  <div
                    class="px-3 py-2 text-center text-sm font-medium rounded-lg border cursor-pointer transition-all flex items-center justify-center gap-1.5"
                    :class="recheckResult === 'pass'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'"
                  >
                    <ThumbsUp class="w-4 h-4" />
                    复检通过
                  </div>
                </label>
                <label class="flex-1">
                  <input type="radio" v-model="recheckResult" value="fail" class="sr-only" />
                  <div
                    class="px-3 py-2 text-center text-sm font-medium rounded-lg border cursor-pointer transition-all flex items-center justify-center gap-1.5"
                    :class="recheckResult === 'fail'
                      ? 'bg-rose-50 text-rose-700 border-rose-300'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'"
                  >
                    <ThumbsDown class="w-4 h-4" />
                    复检不通过
                  </div>
                </label>
              </div>
            </div>

            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1.5">
                复检说明
              </label>
              <textarea
                v-model="recheckNote"
                rows="3"
                placeholder="请描述复检情况..."
                class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent placeholder:text-slate-400 resize-none"
              ></textarea>
            </div>

            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1.5">
                复检人
              </label>
              <input
                v-model="recheckBy"
                type="text"
                placeholder="请输入复检人姓名"
                class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent placeholder:text-slate-400"
              />
            </div>
          </div>
          <div class="px-5 py-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50">
            <button
              class="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
              @click="recheckDefectId = null"
            >
              取消
            </button>
            <button
              class="px-5 py-2 text-sm font-semibold text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition-colors shadow-sm inline-flex items-center gap-1.5"
              :disabled="!recheckBy.trim()"
              :class="{ 'opacity-50 cursor-not-allowed': !recheckBy.trim() }"
              @click="handleRecheckSubmit"
            >
              <CheckCircle2 class="w-4 h-4" />
              确认复检
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
