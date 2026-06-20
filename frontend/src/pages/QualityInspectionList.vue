<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  ClipboardCheck,
  Search,
  Filter,
  Eye,
  Plus,
  ArrowLeft,
  Calendar,
  Building2,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  FileSearch,
  BarChart3,
  ChevronRight,
  X,
  PieChart,
  Users,
  Activity,
} from 'lucide-vue-next'
import StatCard from '../components/StatCard.vue'
import { useQualityInspection } from '../composables/useQualityInspection'
import { useOrders } from '../composables/useOrders'
import { useRoles } from '../composables/useRoles'
import type {
  QualityInspection,
  QualityInspectionStatus,
  QualityInspectionStage,
  ProcessingStage,
  ReworkProblemType,
  QualityStatsFilter,
} from '../types'
import {
  QualityInspectionStatusLabels,
  QualityInspectionStatusColors,
  QualityInspectionStageLabels,
  QualityInspectionStageColors,
  ProcessingStages,
  ReworkProblemTypeLabels,
} from '../types'
import QualityRuleConfig from '../components/QualityRuleConfig.vue'

const router = useRouter()
const {
  inspections,
  getPendingInspections,
  getQualityStats,
} = useQualityInspection()
const { orders } = useOrders()
const { currentRole, canPerformAction } = useRoles()

const showStats = ref(true)
const showRuleConfig = ref(false)
const searchKeyword = ref('')
const filterStatus = ref<QualityInspectionStatus | ''>('')
const filterStage = ref<QualityInspectionStage | ''>('')
const filterProcessingStage = ref<ProcessingStage | ''>('')
const dateRange = ref({ start: '', end: '' })

const stats = computed(() => getQualityStats(getStatsFilter()))

const pendingCount = computed(() => getPendingInspections().length)

const getStatsFilter = (): QualityStatsFilter => {
  const f: QualityStatsFilter = {}
  if (dateRange.value.start) f.startDate = dateRange.value.start
  if (dateRange.value.end) f.endDate = dateRange.value.end
  if (filterStage.value) f.inspectionStage = filterStage.value
  return f
}

const filteredInspections = computed(() => {
  let result = inspections.value

  if (searchKeyword.value) {
    const kw = searchKeyword.value.toLowerCase()
    result = result.filter(
      (i) =>
        i.orderNumber.toLowerCase().includes(kw) ||
        i.clinicName.toLowerCase().includes(kw) ||
        i.inspector?.toLowerCase().includes(kw)
    )
  }

  if (filterStatus.value) {
    result = result.filter((i) => i.status === filterStatus.value)
  }

  if (filterStage.value) {
    result = result.filter((i) => i.inspectionStage === filterStage.value)
  }

  if (filterProcessingStage.value) {
    result = result.filter((i) => i.processingStage === filterProcessingStage.value)
  }

  if (dateRange.value.start) {
    result = result.filter((i) => i.createdAt >= dateRange.value.start)
  }
  if (dateRange.value.end) {
    result = result.filter((i) => i.createdAt <= dateRange.value.end + 'T23:59:59')
  }

  return result
})

function formatDate(dateStr: string) {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return d.toLocaleDateString('zh-CN', {
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

function getProcessingStageLabel(stage: ProcessingStage) {
  return ProcessingStages.find((s) => s.stage === stage)?.label || stage
}

function goToDetail(id: string) {
  router.push(`/quality/${id}`)
}

function goToOrder(orderId: string) {
  router.push(`/order/${orderId}`)
}

function clearFilters() {
  searchKeyword.value = ''
  filterStatus.value = ''
  filterStage.value = ''
  filterProcessingStage.value = ''
  dateRange.value = { start: '', end: '' }
}

function getMaxDefectCount(items: { type: ReworkProblemType; label: string; count: number; percentage: number }[]) {
  if (items.length === 0) return 1
  return Math.max(...items.map((i) => i.count))
}

function getMaxTechCount(items: { technician: string; count: number; percentage: number }[]) {
  if (items.length === 0) return 1
  return Math.max(...items.map((i) => i.count))
}
</script>

<template>
  <div class="min-h-full pb-12">
    <div class="mb-6">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h1 class="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ClipboardCheck class="w-7 h-7 text-emerald-600" />
            质检中心
          </h1>
          <p class="text-sm text-slate-500 mt-1">阶段质检、出厂终检、不合格闭环全流程管理</p>
        </div>
        <div class="flex items-center gap-2">
          <button
            class="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            @click="showStats = !showStats"
          >
            <BarChart3 class="w-4 h-4" />
            {{ showStats ? '隐藏统计' : '显示统计' }}
          </button>
          <button
            v-if="currentRole === 'dispatcher'"
            class="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-violet-700 bg-violet-50 border border-violet-200 rounded-lg hover:bg-violet-100 transition-colors"
            @click="showRuleConfig = true"
          >
            <FileSearch class="w-4 h-4" />
            质检规则配置
          </button>
        </div>
      </div>
    </div>

    <div v-if="showStats" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
      <StatCard
        title="质检任务总数"
        :value="stats.totalInspections"
        icon="ClipboardCheck"
        color="blue"
        :subtitle="`待处理 ${pendingCount} 项`"
      />
      <StatCard
        title="质检合格率"
        :value="`${stats.passRate.toFixed(1)}%`"
        icon="CheckCircle2"
        color="emerald"
        :subtitle="`合格 ${Math.round(stats.totalInspections * stats.passRate / 100)} / ${stats.totalInspections}`"
      />
      <StatCard
        title="不合格项数"
        :value="stats.failCount"
        icon="XCircle"
        color="rose"
        subtitle="质检不通过次数"
      />
      <StatCard
        title="触发返工数"
        :value="stats.reworkCount"
        icon="RefreshCw"
        color="amber"
        subtitle="因质检不合格返工"
      />
    </div>

    <div v-if="showStats" class="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
      <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div class="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
          <PieChart class="w-4 h-4 text-rose-500" />
          <h3 class="text-sm font-semibold text-slate-800">不合格类型分布</h3>
        </div>
        <div class="p-5">
          <div v-if="stats.defectDistribution.length === 0" class="text-center py-8">
            <div class="text-slate-400 text-sm">暂无不合格数据</div>
          </div>
          <div v-else class="space-y-3">
            <div
              v-for="item in stats.defectDistribution"
              :key="item.type"
              class="space-y-1"
            >
              <div class="flex items-center justify-between text-xs">
                <span class="font-medium text-slate-700">{{ item.label }}</span>
                <span class="text-slate-500">{{ item.count }} 项 ({{ item.percentage.toFixed(1) }}%)</span>
              </div>
              <div class="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  class="h-full bg-gradient-to-r from-rose-400 to-rose-600 rounded-full transition-all duration-500"
                  :style="{ width: `${(item.count / getMaxDefectCount(stats.defectDistribution)) * 100}%` }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div class="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
          <Users class="w-4 h-4 text-amber-500" />
          <h3 class="text-sm font-semibold text-slate-800">责任技师分布</h3>
        </div>
        <div class="p-5">
          <div v-if="stats.technicianDistribution.length === 0" class="text-center py-8">
            <div class="text-slate-400 text-sm">暂无责任分配数据</div>
          </div>
          <div v-else class="space-y-3">
            <div
              v-for="item in stats.technicianDistribution.slice(0, 6)"
              :key="item.technician"
              class="space-y-1"
            >
              <div class="flex items-center justify-between text-xs">
                <span class="font-medium text-slate-700">{{ item.technician }}</span>
                <span class="text-slate-500">{{ item.count }} 项 ({{ item.percentage.toFixed(1) }}%)</span>
              </div>
              <div class="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  class="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full transition-all duration-500"
                  :style="{ width: `${(item.count / getMaxTechCount(stats.technicianDistribution)) * 100}%` }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div class="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
          <Activity class="w-4 h-4 text-blue-500" />
          <h3 class="text-sm font-semibold text-slate-800">质检趋势（近7天）</h3>
        </div>
        <div class="p-5">
          <div v-if="stats.trendData.length === 0" class="text-center py-8">
            <div class="text-slate-400 text-sm">暂无趋势数据</div>
          </div>
          <div v-else class="flex items-end justify-between gap-2 h-32">
            <div
              v-for="item in stats.trendData.slice(-7)"
              :key="item.date"
              class="flex-1 flex flex-col items-center gap-1"
            >
              <div class="w-full flex items-end justify-center gap-0.5 h-24">
                <div
                  class="w-1/2 bg-emerald-400 rounded-t transition-all"
                  :style="{ height: `${item.total > 0 ? (item.pass / item.total) * 100 : 0}%` }"
                  :title="`合格: ${item.pass}`"
                ></div>
                <div
                  class="w-1/2 bg-rose-400 rounded-t transition-all"
                  :style="{ height: `${item.total > 0 ? (item.fail / item.total) * 100 : 0}%` }"
                  :title="`不合格: ${item.fail}`"
                ></div>
              </div>
              <div class="text-[10px] text-slate-500 font-mono">
                {{ item.date.slice(5) }}
              </div>
            </div>
          </div>
          <div class="flex items-center justify-center gap-4 mt-3 text-xs">
            <div class="flex items-center gap-1">
              <div class="w-3 h-3 bg-emerald-400 rounded"></div>
              <span class="text-slate-600">合格</span>
            </div>
            <div class="flex items-center gap-1">
              <div class="w-3 h-3 bg-rose-400 rounded"></div>
              <span class="text-slate-600">不合格</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div class="px-5 py-4 border-b border-slate-100">
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div class="flex items-center gap-2 flex-wrap">
            <div class="relative">
              <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                v-model="searchKeyword"
                type="text"
                placeholder="搜索订单号、诊所、质检员..."
                class="w-64 pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-transparent placeholder:text-slate-400 transition-all"
              />
            </div>

            <select
              v-model="filterStatus"
              class="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="">全部状态</option>
              <option v-for="(label, key) in QualityInspectionStatusLabels" :key="key" :value="key">
                {{ label }}
              </option>
            </select>

            <select
              v-model="filterStage"
              class="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="">全部质检类型</option>
              <option v-for="(label, key) in QualityInspectionStageLabels" :key="key" :value="key">
                {{ label }}
              </option>
            </select>

            <select
              v-model="filterProcessingStage"
              class="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="">全部加工阶段</option>
              <option v-for="stage in ProcessingStages" :key="stage.stage" :value="stage.stage">
                {{ stage.label }}
              </option>
            </select>
          </div>

          <div class="flex items-center gap-2 flex-wrap">
            <div class="flex items-center gap-1.5 px-2 py-1 bg-slate-50 rounded-lg border border-slate-200">
              <Calendar class="w-3.5 h-3.5 text-slate-400" />
              <input
                v-model="dateRange.start"
                type="date"
                class="bg-transparent text-sm px-1 py-0.5 focus:outline-none border-0"
              />
              <span class="text-slate-400 text-sm">至</span>
              <input
                v-model="dateRange.end"
                type="date"
                class="bg-transparent text-sm px-1 py-0.5 focus:outline-none border-0"
              />
            </div>
            <button
              class="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
              @click="clearFilters"
            >
              <X class="w-3.5 h-3.5" />
              清除筛选
            </button>
          </div>
        </div>
      </div>

      <div v-if="filteredInspections.length === 0" class="p-12 text-center">
        <div class="w-16 h-16 mx-auto mb-3 rounded-full bg-slate-100 flex items-center justify-center">
          <ClipboardCheck class="w-8 h-8 text-slate-300" />
        </div>
        <p class="text-sm font-medium text-slate-600 mb-1">暂无质检任务</p>
        <p class="text-xs text-slate-400">
          加工阶段完成后将自动生成质检任务
        </p>
      </div>

      <div v-else class="divide-y divide-slate-100">
        <div
          v-for="inspection in filteredInspections"
          :key="inspection.id"
          class="px-5 py-4 hover:bg-slate-50/50 transition-colors cursor-pointer"
          @click="goToDetail(inspection.id)"
        >
          <div class="flex items-start justify-between gap-4 flex-wrap">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap mb-2">
                <span class="font-mono font-semibold text-slate-800 text-sm">
                  {{ inspection.orderNumber }}
                </span>
                <span
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border"
                  :class="QualityInspectionStageColors[inspection.inspectionStage]"
                >
                  {{ QualityInspectionStageLabels[inspection.inspectionStage] }}
                </span>
                <span
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border"
                  :class="QualityInspectionStatusColors[inspection.status]"
                >
                  {{ QualityInspectionStatusLabels[inspection.status] }}
                </span>
                <span
                  v-if="inspection.defects.length > 0"
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200"
                >
                  <AlertTriangle class="w-3 h-3" />
                  {{ inspection.defects.length }} 项不合格
                </span>
                <span
                  v-if="inspection.reworkCount > 0"
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200"
                >
                  <RefreshCw class="w-3 h-3" />
                  返工 {{ inspection.reworkCount }} 次
                </span>
              </div>

              <div class="flex items-center gap-4 flex-wrap text-xs text-slate-500">
                <span class="inline-flex items-center gap-1">
                  <Building2 class="w-3.5 h-3.5" />
                  {{ inspection.clinicName }}
                </span>
                <span class="inline-flex items-center gap-1">
                  <Clock class="w-3.5 h-3.5" />
                  加工阶段：{{ getProcessingStageLabel(inspection.processingStage) }}
                </span>
                <span v-if="inspection.inspector" class="inline-flex items-center gap-1">
                  <Users class="w-3.5 h-3.5" />
                  质检员：{{ inspection.inspector }}
                </span>
                <span class="inline-flex items-center gap-1">
                  <Calendar class="w-3.5 h-3.5" />
                  创建：{{ formatDate(inspection.createdAt) }}
                </span>
              </div>
            </div>

            <div class="flex items-center gap-2 flex-shrink-0">
              <button
                class="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                @click.stop="goToOrder(inspection.orderId)"
              >
                <Eye class="w-3.5 h-3.5" />
                订单详情
              </button>
              <button
                class="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors"
              >
                <ChevronRight class="w-3.5 h-3.5" />
                质检详情
              </button>
            </div>
          </div>

          <div class="mt-3 flex items-center gap-2 flex-wrap">
            <div
              v-for="(item, idx) in inspection.itemResults.slice(0, 5)"
              :key="item.checkItemId"
              class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] border"
              :class="item.result === 'pass' || item.result === 'recheck-pass'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : item.result === 'fail' || item.result === 'recheck-fail'
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : 'bg-slate-50 text-slate-600 border-slate-200'"
            >
              <CheckCircle2 v-if="item.result === 'pass' || item.result === 'recheck-pass'" class="w-3 h-3" />
              <XCircle v-else-if="item.result === 'fail' || item.result === 'recheck-fail'" class="w-3 h-3" />
              <Clock v-else class="w-3 h-3" />
              {{ item.checkItemName }}
            </div>
            <span
              v-if="inspection.itemResults.length > 5"
              class="inline-flex items-center px-2 py-0.5 rounded text-[11px] bg-slate-100 text-slate-600"
            >
              +{{ inspection.itemResults.length - 5 }} 项
            </span>
          </div>
        </div>
      </div>
    </div>

    <QualityRuleConfig v-model:show="showRuleConfig" />
  </div>
</template>
