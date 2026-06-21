<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft,
  Download,
  Eye,
  EyeOff,
  Upload,
  Trash2,
  Pencil,
  Save,
  X,
  Layers,
  Link2,
  Plus,
  Database,
  FileText,
  Image,
  ScanFace,
  FileBox,
  Truck,
  ShieldCheck,
  AlertCircle,
  Folder,
  ChevronRight,
  History,
  Building2,
  Users,
  Calendar,
  HardDrive,
  Clock,
  CheckCircle2,
  RefreshCw,
  FileImage,
  File,
  FileSpreadsheet,
  Box,
  Archive,
  HelpCircle,
} from 'lucide-vue-next'
import { useAttachments } from '../composables/useAttachments'
import { useRoles } from '../composables/useRoles'
import AttachmentRelationPanel from '../components/AttachmentRelationPanel.vue'
import AttachmentUploadDialog from '../components/AttachmentUploadDialog.vue'
import type {
  Attachment,
  AttachmentCategory,
  AttachmentFileType,
  AttachmentVersion,
  ProcessingStage,
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

const route = useRoute()
const router = useRouter()
const {
  getAttachmentById,
  updateAttachment,
  deleteAttachment,
  uploadNewVersion,
  addRelation,
  removeRelation,
} = useAttachments()
const { currentRole, canPerformAction, currentTechnicianName } = useRoles()

const attachment = computed<Attachment | undefined>(() =>
  getAttachmentById(String(route.params.id))
)

const showRelationPanel = ref(false)
const showNewVersionDialog = ref(false)
const isEditing = ref(false)
const editRemark = ref('')
const editIsPublic = ref(true)
const editStage = ref<ProcessingStage | 'general'>('received')

const canEdit = computed(() => canPerformAction('edit'))
const canDelete = computed(() => canPerformAction('edit'))
const canUploadVersion = computed(() => canPerformAction('create'))

watch(
  () => attachment.value,
  (att) => {
    if (att) {
      editRemark.value = att.remark || ''
      editIsPublic.value = att.isPublic
      editStage.value = att.stage
    }
  },
  { immediate: true }
)

function goBack() {
  router.back()
}

function goToOrder(orderId: string) {
  router.push(`/order/${orderId}`)
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return '—'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
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

function getFileTypeIcon(fileType: AttachmentFileType) {
  switch (fileType) {
    case 'image':
      return FileImage
    case 'pdf':
      return FileText
    case 'doc':
      return File
    case 'excel':
      return FileSpreadsheet
    case 'stl':
      return Box
    case 'zip':
      return Archive
    default:
      return HelpCircle
  }
}

function startEdit() {
  if (!attachment.value) return
  editRemark.value = attachment.value.remark || ''
  editIsPublic.value = attachment.value.isPublic
  editStage.value = attachment.value.stage
  isEditing.value = true
}

function cancelEdit() {
  isEditing.value = false
}

function saveEdit() {
  if (!attachment.value) return
  updateAttachment(attachment.value.id, {
    remark: editRemark.value,
    isPublic: editIsPublic.value,
    stage: editStage.value,
  })
  isEditing.value = false
}

function handleDelete() {
  if (!attachment.value) return
  if (confirm('确定要删除该附件吗？此操作不可撤销。')) {
    deleteAttachment(attachment.value.id)
    router.push('/attachments')
  }
}

function handleNewVersionSubmit(_attachments: any[]) {
  showNewVersionDialog.value = false
}

const stageOptions = computed(() => {
  const result: { value: ProcessingStage | 'general'; label: string }[] = [
    { value: 'general', label: '通用资料' },
  ]
  for (const s of ProcessingStages) {
    result.push({ value: s.stage, label: s.label })
  }
  return result
})

const relationRouteMap: Record<string, (id: string) => string> = {
  order: (id) => `/order/${id}`,
  rework: (id) => `/order/${attachment.value?.orderId || ''}`,
  quality: (id) => `/quality/${id}`,
  logistics: (id) => `/logistics/detail/${id}`,
}

function goToRelation(module: string, recordId: string) {
  const routeFn = relationRouteMap[module]
  if (routeFn) {
    router.push(routeFn(recordId))
  }
}
</script>

<template>
  <div v-if="attachment" class="space-y-6">
    <div class="flex items-center gap-2 mb-4">
      <button
        class="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 transition-colors"
        @click="goBack"
      >
        <ArrowLeft class="w-4 h-4" />
        返回附件中心
      </button>
    </div>

    <div class="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-6">
      <div class="flex items-start gap-4">
        <div
          class="w-14 h-14 rounded-xl flex items-center justify-center border-2 flex-shrink-0"
          :class="AttachmentCategoryColors[attachment.category]"
        >
          <component :is="getCategoryIcon(attachment.category)" class="w-7 h-7" />
        </div>
        <div>
          <div class="flex items-center gap-2 flex-wrap mb-1">
            <h1
              class="text-xl font-bold text-slate-900 tracking-tight break-all"
            >
              {{ attachment.fileName }}
            </h1>
          </div>
          <div class="flex items-center gap-2 flex-wrap">
            <span
              class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border"
              :class="AttachmentCategoryColors[attachment.category]"
            >
              {{ AttachmentCategoryLabels[attachment.category] }}
            </span>
            <span
              class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border"
              :class="AttachmentFileTypeColors[attachment.fileType]"
            >
              <component :is="getFileTypeIcon(attachment.fileType)" class="w-3 h-3" />
              {{ AttachmentFileTypeLabels[attachment.fileType] }}
            </span>
            <span
              class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-violet-50 text-violet-700 border border-violet-200"
            >
              <Layers class="w-3 h-3" />
              {{ attachment.version }}
            </span>
            <span
              v-if="attachment.isPublic"
              class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200"
            >
              <Eye class="w-3 h-3" />
              对外可见
            </span>
            <span
              v-else
              class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-slate-50 text-slate-600 border border-slate-200"
            >
              <EyeOff class="w-3 h-3" />
              仅内部可见
            </span>
          </div>
          <p
            v-if="attachment.remark && !isEditing"
            class="text-sm text-slate-600 mt-2"
          >
            {{ attachment.remark }}
          </p>
        </div>
      </div>

      <div class="flex items-center gap-2 flex-wrap">
        <button
          class="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
        >
          <Download class="w-4 h-4" />
          下载
        </button>
        <button
          v-if="canUploadVersion"
          class="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-violet-700 bg-violet-50 border border-violet-200 rounded-lg hover:bg-violet-100 transition-colors"
          @click="showNewVersionDialog = true"
        >
          <Upload class="w-4 h-4" />
          上传新版本
        </button>
        <button
          v-if="canEdit && !isEditing"
          class="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
          @click="startEdit"
        >
          <Pencil class="w-4 h-4" />
          编辑
        </button>
        <template v-if="isEditing">
          <button
            class="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors"
            @click="saveEdit"
          >
            <Save class="w-4 h-4" />
            保存
          </button>
          <button
            class="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            @click="cancelEdit"
          >
            <X class="w-4 h-4" />
            取消
          </button>
        </template>
        <button
          v-if="canDelete && !isEditing"
          class="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 transition-colors"
          @click="handleDelete"
        >
          <Trash2 class="w-4 h-4" />
          删除
        </button>
      </div>
    </div>

    <div v-if="isEditing" class="bg-white rounded-xl border border-blue-200 p-5 space-y-4">
      <div class="text-sm font-semibold text-slate-800 flex items-center gap-2">
        <Pencil class="w-4 h-4 text-blue-600" />
        编辑附件信息
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-xs font-medium text-slate-600 mb-1.5">
            备注说明
          </label>
          <textarea
            v-model="editRemark"
            rows="3"
            placeholder="输入附件备注..."
            class="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-400 transition-all resize-none"
          ></textarea>
        </div>
        <div class="space-y-4">
          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1.5">
              所属阶段
            </label>
            <select
              v-model="editStage"
              class="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option
                v-for="opt in stageOptions"
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
            <div class="flex items-center gap-4">
              <label class="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  :value="true"
                  v-model="editIsPublic"
                  class="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                />
                <span class="text-sm text-slate-700 flex items-center gap-1">
                  <Eye class="w-3.5 h-3.5 text-emerald-500" />
                  对外可见
                </span>
              </label>
              <label class="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  :value="false"
                  v-model="editIsPublic"
                  class="w-4 h-4 text-slate-600 focus:ring-slate-500"
                />
                <span class="text-sm text-slate-700 flex items-center gap-1">
                  <EyeOff class="w-3.5 h-3.5 text-slate-500" />
                  仅内部可见
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <div class="xl:col-span-2 space-y-6">
        <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div
            class="px-5 py-4 border-b border-slate-100 flex items-center justify-between"
          >
            <div class="flex items-center gap-2">
              <div
                class="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center"
              >
                <Eye class="w-4 h-4 text-blue-600" />
              </div>
              <h2 class="text-base font-semibold text-slate-800">文件预览</h2>
            </div>
          </div>
          <div class="p-8">
            <div
              class="aspect-video bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200 flex flex-col items-center justify-center"
            >
              <div
                class="w-20 h-20 rounded-2xl flex items-center justify-center border-2 mb-4"
                :class="AttachmentCategoryColors[attachment.category]"
              >
                <component
                  :is="getCategoryIcon(attachment.category)"
                  class="w-10 h-10"
                />
              </div>
              <p class="text-sm font-medium text-slate-700 mb-1">
                {{ attachment.fileName }}
              </p>
              <p class="text-xs text-slate-500 mb-4">
                {{ AttachmentFileTypeLabels[attachment.fileType] }} · {{ formatFileSize(attachment.fileSize) }}
              </p>
              <div
                v-if="attachment.fileType === 'image'"
                class="w-full max-w-md p-4 bg-white rounded-lg border border-slate-200 shadow-inner"
              >
                <div
                  class="aspect-square bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100 rounded-lg flex items-center justify-center"
                >
                  <div class="text-center">
                    <FileImage class="w-12 h-12 text-slate-300 mx-auto mb-2" />
                    <p class="text-xs text-slate-400">图片预览区域</p>
                  </div>
                </div>
              </div>
              <div
                v-else-if="attachment.fileType === 'pdf'"
                class="w-full max-w-md bg-white rounded-lg border border-slate-200 shadow overflow-hidden"
              >
                <div class="bg-rose-50 border-b border-rose-100 px-4 py-2 flex items-center gap-2">
                  <FileText class="w-4 h-4 text-rose-600" />
                  <span class="text-xs font-medium text-rose-700">PDF 文档预览</span>
                </div>
                <div class="p-6 space-y-2">
                  <div class="h-2 bg-slate-100 rounded w-full"></div>
                  <div class="h-2 bg-slate-100 rounded w-5/6"></div>
                  <div class="h-2 bg-slate-100 rounded w-4/6"></div>
                  <div class="h-2 bg-slate-100 rounded w-full mt-3"></div>
                  <div class="h-2 bg-slate-100 rounded w-3/4"></div>
                  <div class="h-2 bg-slate-100 rounded w-5/6"></div>
                </div>
              </div>
              <div
                v-else-if="attachment.fileType === 'stl'"
                class="w-full max-w-md aspect-square bg-gradient-to-br from-violet-50 via-indigo-50 to-blue-50 rounded-lg border border-violet-200 flex items-center justify-center"
              >
                <div class="text-center">
                  <Box class="w-16 h-16 text-violet-400 mx-auto mb-3 animate-pulse" />
                  <p class="text-sm font-medium text-violet-700">3D 模型文件</p>
                  <p class="text-xs text-violet-500">STL 格式</p>
                </div>
              </div>
              <div v-else class="mt-2">
                <button
                  class="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-orange-500 to-amber-600 rounded-lg hover:from-orange-600 hover:to-amber-700 transition-all shadow-sm"
                >
                  <Download class="w-4 h-4" />
                  下载文件查看
                </button>
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
                class="w-8 h-8 rounded-lg bg-violet-50 border border-violet-100 flex items-center justify-center"
              >
                <History class="w-4 h-4 text-violet-600" />
              </div>
              <div>
                <h2 class="text-base font-semibold text-slate-800">
                  版本历史
                </h2>
                <p class="text-xs text-slate-500">
                  共 {{ attachment.versions?.length || 1 }} 个版本记录
                </p>
              </div>
            </div>
            <button
              v-if="canUploadVersion"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-violet-700 bg-violet-50 border border-violet-200 rounded-md hover:bg-violet-100 transition-colors"
              @click="showNewVersionDialog = true"
            >
              <Plus class="w-3.5 h-3.5" />
              新版本
            </button>
          </div>

          <div v-if="attachment.versions && attachment.versions.length > 0" class="p-5">
            <div class="space-y-0">
              <div
                v-for="(ver, idx) in [...attachment.versions].reverse()"
                :key="ver.version"
                class="relative pl-10 pb-5 last:pb-0"
              >
                <div
                  v-if="idx < (attachment.versions?.length || 0) - 1"
                  class="absolute left-3.5 top-5 w-px h-full bg-slate-200"
                ></div>
                <div
                  class="absolute left-0 top-0 w-7 h-7 rounded-full flex items-center justify-center transition-all"
                  :class="[
                    idx === 0
                      ? 'bg-violet-100 border-2 border-violet-500 ring-4 ring-violet-100'
                      : 'bg-white border-2 border-slate-300',
                  ]"
                >
                  <CheckCircle2
                    v-if="idx === 0"
                    class="w-3.5 h-3.5 text-violet-600"
                  />
                  <div v-else class="w-2 h-2 rounded-full bg-slate-300"></div>
                </div>

                <div
                  class="bg-slate-50/50 border rounded-lg p-4 ml-2"
                  :class="{
                    'bg-violet-50/30 border-violet-200 ring-2 ring-violet-100':
                      idx === 0,
                    'border-slate-200': idx !== 0,
                  }"
                >
                  <div
                    class="flex items-center justify-between mb-2 flex-wrap gap-2"
                  >
                    <div class="flex items-center gap-2">
                      <span
                        class="font-bold text-sm"
                        :class="idx === 0 ? 'text-violet-700' : 'text-slate-600'"
                      >
                        {{ ver.version }}
                      </span>
                      <span
                        v-if="idx === 0"
                        class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-violet-100 text-violet-700"
                      >
                        当前版本
                      </span>
                    </div>
                    <div class="flex items-center gap-3 text-xs text-slate-500">
                      <span class="inline-flex items-center gap-1">
                        <Users class="w-3 h-3" />
                        {{ ver.uploadedBy }}
                      </span>
                      <span class="inline-flex items-center gap-1">
                        <Calendar class="w-3 h-3" />
                        {{ formatDate(ver.uploadedAt) }}
                      </span>
                      <span class="inline-flex items-center gap-1">
                        <HardDrive class="w-3 h-3" />
                        {{ formatFileSize(ver.fileSize) }}
                      </span>
                    </div>
                  </div>
                  <div
                    class="text-sm font-medium text-slate-700 mb-1 truncate"
                    :title="ver.fileName"
                  >
                    {{ ver.fileName }}
                  </div>
                  <p
                    v-if="ver.changeLog"
                    class="text-xs text-slate-600 bg-white rounded-md px-3 py-2 border border-slate-200"
                  >
                    <span class="font-medium text-slate-700">更新说明：</span>
                    {{ ver.changeLog }}
                  </p>
                  <div
                    v-if="idx !== 0"
                    class="mt-2 flex items-center gap-2"
                  >
                    <button
                      class="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-slate-600 bg-white border border-slate-200 rounded hover:bg-slate-50 transition-colors"
                    >
                      <Download class="w-3 h-3" />
                      下载此版本
                    </button>
                    <button
                      class="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors"
                    >
                      <Eye class="w-3 h-3" />
                      预览此版本
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="p-10 text-center">
            <div
              class="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-100 flex items-center justify-center"
            >
              <History class="w-6 h-6 text-slate-400" />
            </div>
            <p class="text-sm text-slate-500">暂无版本历史记录</p>
          </div>
        </div>
      </div>

      <div class="space-y-6">
        <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div
            class="px-5 py-4 border-b border-slate-100 flex items-center gap-2"
          >
            <div
              class="w-8 h-8 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center"
            >
              <Database class="w-4 h-4 text-orange-600" />
            </div>
            <h2 class="text-base font-semibold text-slate-800">基本信息</h2>
          </div>
          <div class="p-5 space-y-4">
            <div class="space-y-1">
              <div class="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                附件ID
              </div>
              <div class="text-sm font-mono text-slate-800">
                {{ attachment.id }}
              </div>
            </div>
            <div class="space-y-1">
              <div class="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                所属订单
              </div>
              <div
                class="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline cursor-pointer inline-flex items-center gap-1"
                @click="goToOrder(attachment.orderId)"
              >
                <span class="font-mono">{{ attachment.orderNumber }}</span>
                <ChevronRight class="w-3 h-3" />
              </div>
            </div>
            <div class="space-y-1">
              <div class="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                所属诊所
              </div>
              <div class="text-sm text-slate-700 flex items-center gap-1">
                <Building2 class="w-3.5 h-3.5 text-slate-400" />
                {{ attachment.clinicName }}
              </div>
            </div>
            <div class="space-y-1">
              <div class="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                所属阶段
              </div>
              <div class="text-sm text-slate-700 flex items-center gap-1">
                <Clock class="w-3.5 h-3.5 text-slate-400" />
                {{ attachment.stageLabel }}
              </div>
            </div>
            <div class="space-y-1">
              <div class="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                上传人
              </div>
              <div class="text-sm text-slate-700 flex items-center gap-1">
                <Users class="w-3.5 h-3.5 text-slate-400" />
                {{ attachment.uploadedBy }}
              </div>
            </div>
            <div class="space-y-1">
              <div class="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                上传时间
              </div>
              <div class="text-sm text-slate-700 flex items-center gap-1">
                <Calendar class="w-3.5 h-3.5 text-slate-400" />
                {{ formatDate(attachment.uploadedAt) }}
              </div>
            </div>
            <div class="space-y-1">
              <div class="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                描述说明
              </div>
              <div v-if="attachment.description" class="text-sm text-slate-700">
                {{ attachment.description }}
              </div>
              <div v-else class="text-sm text-slate-400">
                —
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
                class="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center"
              >
                <Link2 class="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h2 class="text-base font-semibold text-slate-800">
                  关联记录
                </h2>
                <p class="text-xs text-slate-500">
                  {{ attachment.relations?.length || 1 }} 个关联
                </p>
              </div>
            </div>
            <button
              v-if="canEdit"
              class="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
              @click="showRelationPanel = true"
            >
              <Pencil class="w-3 h-3" />
              管理
            </button>
          </div>
          <div v-if="attachment.relations && attachment.relations.length > 0" class="p-4 space-y-2">
            <div
              v-for="rel in attachment.relations"
              :key="`${rel.module}-${rel.recordId}`"
              class="group p-3 rounded-lg border border-slate-200 hover:border-blue-200 hover:bg-blue-50/30 transition-all cursor-pointer"
              @click="goToRelation(rel.module, rel.recordId)"
            >
              <div class="flex items-center justify-between mb-1">
                <span
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border"
                  :class="AttachmentRelatedModuleColors[rel.module]"
                >
                  <Link2 class="w-2.5 h-2.5" />
                  {{ AttachmentRelatedModuleLabels[rel.module] }}
                </span>
                <ChevronRight class="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500 transition-colors" />
              </div>
              <div
                class="text-sm font-medium text-slate-800 truncate"
                :title="rel.recordTitle"
              >
                {{ rel.recordTitle || rel.recordId }}
              </div>
              <div class="text-[11px] text-slate-500 mt-0.5">
                {{ rel.linkedBy }} · {{ formatShortDate(rel.linkedAt) }}
              </div>
            </div>
          </div>
          <div v-else class="p-6 text-center">
            <div
              class="w-10 h-10 mx-auto mb-2 rounded-full bg-slate-100 flex items-center justify-center"
            >
              <Link2 class="w-5 h-5 text-slate-400" />
            </div>
            <p class="text-xs text-slate-500">暂无关联记录</p>
          </div>
        </div>
      </div>
    </div>

    <AttachmentRelationPanel
      v-if="showRelationPanel && attachment"
      v-model:visible="showRelationPanel"
      :attachment="attachment"
    />

    <AttachmentUploadDialog
      v-model:visible="showNewVersionDialog"
      :preSelectedOrderId="attachment?.orderId || null"
      :mode="'new-version'"
      :attachmentId="attachment?.id"
      :currentFileName="attachment?.fileName"
      @submit="handleNewVersionSubmit"
    />
  </div>

  <div v-else class="p-12 text-center">
    <div
      class="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center"
    >
      <Folder class="w-10 h-10 text-slate-400" />
    </div>
    <p class="text-lg font-medium text-slate-700 mb-1">附件不存在</p>
    <p class="text-sm text-slate-500 mb-4">
      该附件可能已被删除或ID无效
    </p>
    <button
      class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
      @click="router.push('/attachments')"
    >
      <ArrowLeft class="w-4 h-4" />
      返回附件中心
    </button>
  </div>
</template>
