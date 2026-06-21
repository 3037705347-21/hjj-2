<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  Database,
  Search,
  Filter,
  Download,
  Eye,
  Plus,
  Upload,
  FileText,
  Image,
  ScanFace,
  FileBox,
  Truck,
  ShieldCheck,
  AlertCircle,
  Folder,
  Trash2,
  Link2,
  X,
  ChevronDown,
  ChevronUp,
  Layers,
  Users,
  Building2,
  HardDrive,
  EyeOff,
  RefreshCw,
} from 'lucide-vue-next'
import { useAttachments } from '../composables/useAttachments'
import { useClinics } from '../composables/useClinics'
import { useRoles } from '../composables/useRoles'
import StatCard from '../components/StatCard.vue'
import AttachmentUploadDialog from '../components/AttachmentUploadDialog.vue'
import type {
  Attachment,
  AttachmentCategory,
  AttachmentFileType,
  ProcessingStage,
  AttachmentRelatedModule,
} from '../types'
import {
  AttachmentCategoryLabels,
  AttachmentCategoryColors,
  AttachmentFileTypeLabels,
  AttachmentFileTypeColors,
  ProcessingStages,
  AttachmentRelatedModuleLabels,
  AttachmentRelatedModuleColors,
} from '../types'

const router = useRouter()
const {
  attachments,
  getAttachmentsByFilter,
  getAttachmentStats,
  deleteAttachment,
} = useAttachments()
const { clinics } = useClinics()
const { currentRole, canPerformAction } = useRoles()

const showUploadDialog = ref(false)
const showFilterPanel = ref(true)
const sortField = ref<'uploadedAt' | 'fileName' | 'fileSize'>('uploadedAt')
const sortOrder = ref<'asc' | 'desc'>('desc')

const keyword = ref('')
const filterOrderNumber = ref('')
const filterClinicId = ref<string | null>(null)
const filterCategory = ref<AttachmentCategory | null>(null)
const filterFileType = ref<AttachmentFileType | null>(null)
const filterStage = ref<(ProcessingStage | 'general') | null>(null)
const filterRelatedModule = ref<AttachmentRelatedModule | null>(null)
const filterVisibility = ref<boolean | null>(null)

const canUpload = computed(() => canPerformAction('create'))
const canDelete = computed(() => canPerformAction('edit'))

const stats = computed(() => getAttachmentStats())

function formatFileSize(bytes?: number): string {
  if (!bytes) return '—'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

function formatTotalSize(bytes: number): string {
  return formatFileSize(bytes)
}

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

function getCategoryIcon(category: AttachmentCategory) {
  switch (category) {
    case 'intraoral-scan':
      return ScanFace
    case 'prescription-photo':
      return FileText
    case 'facial-photo':
      return Image
    case 'design-draft':
      return FileBox
    case 'logistics-receipt':
      return Truck
    case 'quality-report':
      return ShieldCheck
    case 'rework-document':
      return AlertCircle
    default:
      return Folder
  }
}

const filteredAttachments = computed<Attachment[]>(() => {
  let result = getAttachmentsByFilter({
    orderNumber: filterOrderNumber.value || undefined,
    clinicId: filterClinicId.value || undefined,
    stage: filterStage.value,
    category: filterCategory.value,
    fileType: filterFileType.value,
    isPublic: filterVisibility.value,
    relatedModule: filterRelatedModule.value,
    keyword: keyword.value || undefined,
  })

  result = [...result].sort((a, b) => {
    let diff = 0
    switch (sortField.value) {
      case 'fileName':
        diff = a.fileName.localeCompare(b.fileName)
        break
      case 'fileSize':
        diff = (a.fileSize || 0) - (b.fileSize || 0)
        break
      case 'uploadedAt':
      default:
        diff = new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime()
    }
    return sortOrder.value === 'asc' ? diff : -diff
  })

  return result
})

function toggleSort(field: typeof sortField.value) {
  if (sortField.value === field) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortField.value = field
    sortOrder.value = 'desc'
  }
}

function getSortIcon(field: typeof sortField.value) {
  if (sortField.value !== field) return null
  return sortOrder.value === 'asc' ? ChevronUp : ChevronDown
}

function resetFilters() {
  keyword.value = ''
  filterOrderNumber.value = ''
  filterClinicId.value = null
  filterCategory.value = null
  filterFileType.value = null
  filterStage.value = null
  filterRelatedModule.value = null
  filterVisibility.value = null
}

function goToDetail(id: string) {
  router.push(`/attachments/${id}`)
}

function goToOrder(orderId: string) {
  router.push(`/order/${orderId}`)
}

function handleDelete(id: string, e: Event) {
  e.stopPropagation()
  if (confirm('确定要删除该附件吗？此操作不可撤销。')) {
    deleteAttachment(id)
  }
}

const categoryOptions = computed(() => {
  const result: { value: AttachmentCategory; label: string; count: number }[] = []
  for (const [key, label] of Object.entries(AttachmentCategoryLabels)) {
    result.push({
      value: key as AttachmentCategory,
      label,
      count: stats.value.byCategory[key] || 0,
    })
  }
  return result
})

const fileTypeOptions = computed(() => {
  const result: { value: AttachmentFileType; label: string; count: number }[] = []
  for (const [key, label] of Object.entries(AttachmentFileTypeLabels)) {
    result.push({
      value: key as AttachmentFileType,
      label,
      count: stats.value.byFileType[key] || 0,
    })
  }
  return result
})

const stageOptions = computed(() => {
  const result: { value: ProcessingStage | 'general'; label: string; count: number }[] = [
    { value: 'general', label: '通用资料', count: stats.value.byStage['general'] || 0 },
  ]
  for (const s of ProcessingStages) {
    result.push({
      value: s.stage,
      label: s.label,
      count: stats.value.byStage[s.stage] || 0,
    })
  }
  return result
})

const relatedModuleOptions = computed(() => {
  const result: { value: AttachmentRelatedModule; label: string }[] = []
  for (const [key, label] of Object.entries(AttachmentRelatedModuleLabels)) {
    result.push({
      value: key as AttachmentRelatedModule,
      label,
    })
  }
  return result
})

onMounted(() => {
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-3 mb-2">
          <div
            class="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg shadow-orange-500/20"
          >
            <Database class="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 class="text-xl font-bold text-slate-900 tracking-tight">
              数据资产与附件中心
            </h1>
            <p class="text-sm text-slate-500">
              统一管理全平台订单相关文件，支持多维度检索与版本追踪
            </p>
          </div>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <button
          v-if="canUpload"
          class="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-orange-500 to-amber-600 rounded-lg hover:from-orange-600 hover:to-amber-700 transition-all shadow-sm shadow-orange-500/20"
          @click="showUploadDialog = true"
        >
          <Upload class="w-4 h-4" />
          批量上传
        </button>
      </div>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard
        title="附件总数"
        :value="stats.total"
        :icon="Database"
        color="orange"
        subtitle="覆盖订单"
        :subValue="stats.uniqueOrders"
      />
      <StatCard
        title="关联诊所"
        :value="stats.uniqueClinics"
        :icon="Building2"
        color="blue"
        subtitle="总存储量"
        :subValue="formatTotalSize(stats.totalSize)"
      />
      <StatCard
        title="对外可见"
        :value="stats.publicCount"
        :icon="Eye"
        color="emerald"
        subtitle="内部文件"
        :subValue="stats.privateCount"
      />
      <StatCard
        title="多版本文件"
        :value="stats.withVersions"
        :icon="Layers"
        color="violet"
        subtitle="覆盖版本管理"
      />
    </div>

    <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div
        class="px-5 py-4 border-b border-slate-100 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 transition-colors"
        @click="showFilterPanel = !showFilterPanel"
      >
        <div class="flex items-center gap-2">
          <Filter class="w-4 h-4 text-slate-500" />
          <span class="text-sm font-semibold text-slate-800">筛选条件</span>
          <span
            class="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-bold text-white bg-blue-500 rounded-full"
          >
            {{
              (keyword ? 1 : 0) +
              (filterOrderNumber ? 1 : 0) +
              (filterClinicId ? 1 : 0) +
              (filterCategory ? 1 : 0) +
              (filterFileType ? 1 : 0) +
              (filterStage ? 1 : 0) +
              (filterRelatedModule ? 1 : 0) +
              (filterVisibility !== null ? 1 : 0)
            }}
          </span>
        </div>
        <ChevronDown
          v-if="!showFilterPanel"
          class="w-4 h-4 text-slate-400"
        />
        <ChevronUp v-else class="w-4 h-4 text-slate-400" />
      </div>

      <div
        v-if="showFilterPanel"
        class="px-5 py-4 border-b border-slate-100 bg-slate-50/30"
      >
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1.5">
              关键词搜索
            </label>
            <div class="relative">
              <Search
                class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
              />
              <input
                v-model="keyword"
                type="text"
                placeholder="文件名/备注/上传人..."
                class="w-full pl-9 pr-9 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent placeholder:text-slate-400 transition-all"
              />
              <button
                v-if="keyword"
                class="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-slate-100 transition-colors"
                @click="keyword = ''"
              >
                <X class="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          </div>

          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1.5">
              订单号
            </label>
            <input
              v-model="filterOrderNumber"
              type="text"
              placeholder="输入订单号..."
              class="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent placeholder:text-slate-400 transition-all"
            />
          </div>

          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1.5">
              所属诊所
            </label>
            <select
              v-model="filterClinicId"
              class="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
            >
              <option :value="null">全部诊所</option>
              <option
                v-for="clinic in clinics"
                :key="clinic.id"
                :value="clinic.id"
              >
                {{ clinic.name }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1.5">
              文件类型
            </label>
            <select
              v-model="filterFileType"
              class="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
            >
              <option :value="null">全部类型</option>
              <option
                v-for="opt in fileTypeOptions"
                :key="opt.value"
                :value="opt.value"
              >
                {{ opt.label }} ({{ opt.count }})
              </option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1.5">
              附件类别
            </label>
            <select
              v-model="filterCategory"
              class="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
            >
              <option :value="null">全部类别</option>
              <option
                v-for="opt in categoryOptions"
                :key="opt.value"
                :value="opt.value"
              >
                {{ opt.label }} ({{ opt.count }})
              </option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1.5">
              所属阶段
            </label>
            <select
              v-model="filterStage"
              class="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
            >
              <option :value="null">全部阶段</option>
              <option
                v-for="opt in stageOptions"
                :key="opt.value"
                :value="opt.value"
              >
                {{ opt.label }} ({{ opt.count }})
              </option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1.5">
              关联模块
            </label>
            <select
              v-model="filterRelatedModule"
              class="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
            >
              <option :value="null">全部模块</option>
              <option
                v-for="opt in relatedModuleOptions"
                :key="opt.value"
                :value="opt.value"
              >
                {{ opt.label }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1.5">
              可见范围
            </label>
            <select
              v-model="filterVisibility"
              class="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
            >
              <option :value="null">全部可见</option>
              <option :value="true">对外可见</option>
              <option :value="false">仅内部可见</option>
            </select>
          </div>
        </div>

        <div class="flex items-center justify-end">
          <button
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors"
            @click="resetFilters"
          >
            <RefreshCw class="w-3.5 h-3.5" />
            重置筛选
          </button>
        </div>
      </div>

      <div class="px-5 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between flex-wrap gap-3">
        <div class="text-sm text-slate-600">
          共找到
          <span class="font-semibold text-slate-900">
            {{ filteredAttachments.length }}
          </span>
          个附件
        </div>
      </div>

      <div v-if="filteredAttachments.length === 0" class="p-12">
        <div class="flex flex-col items-center justify-center text-center">
          <div
            class="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4"
          >
            <Folder class="w-8 h-8 text-slate-400" />
          </div>
          <p class="text-sm font-medium text-slate-600 mb-1">暂无匹配的附件</p>
          <p class="text-xs text-slate-400 mb-4">
            请尝试调整筛选条件或上传新文件
          </p>
          <button
            v-if="canUpload"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-orange-500 rounded-md hover:bg-orange-600 transition-colors"
            @click="showUploadDialog = true"
          >
            <Plus class="w-3.5 h-3.5" />
            上传附件
          </button>
        </div>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="bg-slate-50/50 border-b border-slate-100">
              <th
                class="px-5 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider"
              >
                文件信息
              </th>
              <th
                class="px-5 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100/50 transition-colors"
                @click="toggleSort('fileName')"
              >
                <div class="flex items-center gap-1">
                  订单/诊所
                  <component :is="getSortIcon('fileName')" class="w-3 h-3" />
                </div>
              </th>
              <th
                class="px-5 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider"
              >
                类别/阶段
              </th>
              <th
                class="px-5 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider"
              >
                关联模块
              </th>
              <th
                class="px-5 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100/50 transition-colors"
                @click="toggleSort('uploadedAt')"
              >
                <div class="flex items-center gap-1">
                  上传信息
                  <component :is="getSortIcon('uploadedAt')" class="w-3 h-3" />
                </div>
              </th>
              <th
                class="px-5 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100/50 transition-colors"
                @click="toggleSort('fileSize')"
              >
                <div class="flex items-center gap-1">
                  版本/大小
                  <component :is="getSortIcon('fileSize')" class="w-3 h-3" />
                </div>
              </th>
              <th
                class="px-5 py-3 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wider"
              >
                操作
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr
              v-for="att in filteredAttachments"
              :key="att.id"
              class="hover:bg-blue-50/30 transition-colors cursor-pointer group"
              @click="goToDetail(att.id)"
            >
              <td class="px-5 py-4">
                <div class="flex items-start gap-3">
                  <div
                    class="w-10 h-10 rounded-lg flex items-center justify-center border flex-shrink-0"
                    :class="AttachmentCategoryColors[att.category]"
                  >
                    <component :is="getCategoryIcon(att.category)" class="w-5 h-5" />
                  </div>
                  <div class="min-w-0 flex-1">
                    <div
                      class="text-sm font-medium text-slate-800 truncate mb-0.5"
                      :title="att.fileName"
                    >
                      {{ att.fileName }}
                    </div>
                    <div class="flex items-center gap-2 text-xs text-slate-400">
                      <span
                        class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded border"
                        :class="AttachmentFileTypeColors[att.fileType]"
                      >
                        {{ AttachmentFileTypeLabels[att.fileType] }}
                      </span>
                      <component
                        :is="att.isPublic ? Eye : EyeOff"
                        class="w-3 h-3"
                        :class="att.isPublic ? 'text-emerald-500' : 'text-slate-400'"
                      />
                      <span>{{ att.isPublic ? '对外可见' : '内部' }}</span>
                    </div>
                    <p
                      v-if="att.remark"
                      class="text-[11px] text-slate-500 mt-1 line-clamp-1"
                    >
                      {{ att.remark }}
                    </p>
                  </div>
                </div>
              </td>
              <td class="px-5 py-4">
                <div class="space-y-1">
                  <div
                    class="text-sm font-mono font-medium text-blue-600 hover:text-blue-700 hover:underline"
                    @click.stop="goToOrder(att.orderId)"
                  >
                    {{ att.orderNumber }}
                  </div>
                  <div class="text-xs text-slate-500 flex items-center gap-1">
                    <Building2 class="w-3 h-3" />
                    {{ att.clinicName }}
                  </div>
                </div>
              </td>
              <td class="px-5 py-4">
                <div class="space-y-1.5">
                  <span
                    class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border"
                    :class="AttachmentCategoryColors[att.category]"
                  >
                    {{ AttachmentCategoryLabels[att.category] }}
                  </span>
                  <div class="text-[11px] text-slate-500">
                    {{ att.stageLabel }}
                  </div>
                </div>
              </td>
              <td class="px-5 py-4">
                <div
                  v-if="att.relations && att.relations.length > 0"
                  class="flex flex-wrap gap-1"
                >
                  <span
                    v-for="rel in att.relations.slice(0, 3)"
                    :key="`${rel.module}-${rel.recordId}`"
                    class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium border"
                    :class="AttachmentRelatedModuleColors[rel.module]"
                    :title="rel.recordTitle"
                  >
                    <Link2 class="w-2.5 h-2.5" />
                    {{ AttachmentRelatedModuleLabels[rel.module] }}
                  </span>
                  <span
                    v-if="att.relations.length > 3"
                    class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200"
                  >
                    +{{ att.relations.length - 3 }}
                  </span>
                </div>
                <span v-else class="text-[11px] text-slate-400">
                  仅关联订单
                </span>
              </td>
              <td class="px-5 py-4">
                <div class="space-y-1">
                  <div class="text-xs text-slate-600 flex items-center gap-1">
                    <Users class="w-3 h-3 text-slate-400" />
                    {{ att.uploadedBy }}
                  </div>
                  <div class="text-[11px] text-slate-400">
                    {{ formatDate(att.uploadedAt) }}
                  </div>
                </div>
              </td>
              <td class="px-5 py-4">
                <div class="space-y-1">
                  <div
                    class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-semibold bg-violet-50 text-violet-700 border border-violet-200"
                  >
                    <Layers class="w-3 h-3" />
                    {{ att.version }}
                  </div>
                  <div class="text-[11px] text-slate-400 flex items-center gap-1">
                    <HardDrive class="w-3 h-3" />
                    {{ formatFileSize(att.fileSize) }}
                  </div>
                  <div
                    v-if="att.versions && att.versions.length > 1"
                    class="text-[10px] text-violet-500"
                  >
                    共 {{ att.versions.length }} 个版本
                  </div>
                </div>
              </td>
              <td class="px-5 py-4">
                <div class="flex items-center justify-end gap-1">
                  <button
                    class="p-1.5 rounded-md text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors opacity-0 group-hover:opacity-100"
                    title="查看详情"
                    @click.stop="goToDetail(att.id)"
                  >
                    <Eye class="w-4 h-4" />
                  </button>
                  <button
                    class="p-1.5 rounded-md text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors opacity-0 group-hover:opacity-100"
                    title="下载"
                  >
                    <Download class="w-4 h-4" />
                  </button>
                  <button
                    v-if="canDelete"
                    class="p-1.5 rounded-md text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors opacity-0 group-hover:opacity-100"
                    title="删除"
                    @click.stop="handleDelete(att.id, $event)"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <AttachmentUploadDialog
      v-model:visible="showUploadDialog"
      :preSelectedOrderId="null"
    />
  </div>
</template>
