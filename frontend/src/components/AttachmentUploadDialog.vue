<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import {
  X,
  Upload,
  FilePlus,
  FolderOpen,
  FileImage,
  FileText,
  FileSpreadsheet,
  Box,
  Archive,
  Paperclip,
  Calendar,
  User,
  Eye,
  Lock,
  CheckCircle2,
  Trash2,
  ArrowUpCircle,
} from 'lucide-vue-next'
import type {
  AttachmentCategory,
  AttachmentFileType,
  ProcessingStage,
} from '../types'
import {
  AttachmentCategoryLabels,
  AttachmentCategoryColors,
  AttachmentFileTypeLabels,
  AttachmentFileTypeColors,
  ProcessingStages,
} from '../types'
import { useOrders } from '../composables/useOrders'
import { useAttachments } from '../composables/useAttachments'

const props = defineProps<{
  visible: boolean
  preSelectedOrderId?: string
  mode?: 'new' | 'new-version'
  attachmentId?: string
  currentFileName?: string
}>()

const emit = defineEmits<{
  (e: 'update:visible', val: boolean): void
  (e: 'submit', attachments: any[]): void
}>()

const { orders } = useOrders()
const {
  createAttachment,
  batchCreateAttachments,
  uploadNewVersion,
  determineFileTypeFromName,
  getAttachmentById,
  checkSameCategoryVersion,
} = useAttachments()

interface UploadFileItem {
  id: string
  fileName: string
  fileSize: number
  fileType: AttachmentFileType
  category: AttachmentCategory
  stage: ProcessingStage | 'general'
  isPublic: boolean
  remark: string
  status: 'pending' | 'uploading' | 'success' | 'error'
  progress: number
}

const selectedOrderId = ref(props.preSelectedOrderId || '')
const uploadedBy = ref('')
const formCategory = ref<AttachmentCategory>('design-draft')
const formStage = ref<ProcessingStage | 'general'>('general')
const formIsPublic = ref(true)
const formRemark = ref('')
const fileList = ref<UploadFileItem[]>([])
const dragOver = ref(false)
const formChangeLog = ref('')
const fileInputRef = ref<HTMLInputElement | null>(null)

const selectedOrder = computed(() => {
  if (!selectedOrderId.value) return null
  return orders.value.find((o) => o.id === selectedOrderId.value)
})

const isNewVersionMode = computed(() => props.mode === 'new-version')

const currentAttachment = computed(() => {
  if (!isNewVersionMode.value || !props.attachmentId) return undefined
  return getAttachmentById(props.attachmentId)
})

const availableOrders = computed(() => {
  return orders.value
    .slice()
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
})

const stageOptions = computed(() => {
  const stages: { key: ProcessingStage | 'general'; label: string; description: string }[] = [
    { key: 'general', label: '通用资料', description: '不针对特定加工阶段' },
  ]
  ProcessingStages.forEach((s) => {
    stages.push({ key: s.stage, label: s.label, description: s.description })
  })
  return stages
})

watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      resetForm()
    }
  }
)

watch(
  () => props.preSelectedOrderId,
  (newVal) => {
    if (newVal) {
      selectedOrderId.value = newVal
    }
  }
)

function resetForm() {
  selectedOrderId.value = props.preSelectedOrderId || ''
  uploadedBy.value = ''
  formCategory.value = 'design-draft'
  formStage.value = 'general'
  formIsPublic.value = true
  formRemark.value = ''
  formChangeLog.value = ''
  fileList.value = []
}

function getFileIcon(fileType: AttachmentFileType) {
  switch (fileType) {
    case 'image':
      return FileImage
    case 'pdf':
    case 'doc':
      return FileText
    case 'excel':
      return FileSpreadsheet
    case 'stl':
      return Box
    case 'zip':
      return Archive
    default:
      return Paperclip
  }
}

function formatFileSize(bytes: number): string {
  if (!bytes) return '—'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function generateTempId(): string {
  return 'temp-' + Math.random().toString(36).slice(2, 10)
}

function handleFiles(files: FileList | File[]) {
  const fileArray = Array.from(files)
  fileArray.forEach((file) => {
    const fileType = determineFileTypeFromName(file.name)
    const item: UploadFileItem = {
      id: generateTempId(),
      fileName: file.name,
      fileSize: file.size,
      fileType,
      category: formCategory.value,
      stage: formStage.value,
      isPublic: formIsPublic.value,
      remark: '',
      status: 'pending',
      progress: 0,
    }
    fileList.value.push(item)
  })
}

function onDragOver(e: DragEvent) {
  e.preventDefault()
  dragOver.value = true
}

function onDragLeave() {
  dragOver.value = false
}

function onDrop(e: DragEvent) {
  e.preventDefault()
  dragOver.value = false
  if (e.dataTransfer?.files) {
    handleFiles(e.dataTransfer.files)
  }
}

function triggerFileInput() {
  fileInputRef.value?.click()
}

function onFileInputChange(e: Event) {
  const target = e.target as HTMLInputElement
  if (target.files) {
    handleFiles(target.files)
  }
  target.value = ''
}

function removeFile(id: string) {
  const idx = fileList.value.findIndex((f) => f.id === id)
  if (idx >= 0) {
    fileList.value.splice(idx, 1)
  }
}

function isFormValid(): boolean {
  if (!uploadedBy.value.trim()) return false
  if (isNewVersionMode.value) {
    return fileList.value.length === 1
  } else {
    if (!selectedOrderId.value) return false
    return fileList.value.length > 0
  }
}

function applyDefaultSettingsToAll() {
  fileList.value.forEach((item) => {
    item.category = formCategory.value
    item.stage = formStage.value
    item.isPublic = formIsPublic.value
  })
}

async function handleSubmit() {
  if (!isFormValid()) {
    alert('请完整填写必填项：上传人、选择文件，新上传模式还需选择订单')
    return
  }

  if (isNewVersionMode.value && props.attachmentId) {
    const file = fileList.value[0]
    const result = uploadNewVersion({
      attachmentId: props.attachmentId,
      fileName: file.fileName,
      fileSize: file.fileSize,
      uploadedBy: uploadedBy.value.trim(),
      changeLog: formChangeLog.value.trim() || undefined,
    })
    if (result) {
      emit('submit', [result])
      handleClose()
    } else {
      alert('上传新版本失败，请重试')
    }
    return
  }

  if (fileList.value.length === 1) {
    const file = fileList.value[0]
    const existing = checkSameCategoryVersion(selectedOrderId.value, file.category)
    const createParams = {
      orderId: selectedOrderId.value,
      category: file.category,
      fileName: file.fileName,
      fileSize: file.fileSize,
      fileType: file.fileType,
      uploadedBy: uploadedBy.value.trim(),
      stage: file.stage,
      isPublic: file.isPublic,
      remark: file.remark || formRemark.value || undefined,
    }

    let result: any
    if (existing) {
      result = uploadNewVersion({
        attachmentId: existing.id,
        fileName: file.fileName,
        fileSize: file.fileSize,
        uploadedBy: uploadedBy.value.trim(),
        changeLog: formRemark.value.trim() || `同类别文件更新，原版本 ${existing.version}`,
      })
    } else {
      result = createAttachment(createParams)
    }

    if (result) {
      emit('submit', [result])
      handleClose()
    } else {
      alert('上传失败，请重试')
    }
  } else {
    const paramsList = fileList.value.map((file) => ({
      orderId: selectedOrderId.value,
      category: file.category,
      fileName: file.fileName,
      fileSize: file.fileSize,
      fileType: file.fileType,
      uploadedBy: uploadedBy.value.trim(),
      stage: file.stage,
      isPublic: file.isPublic,
      remark: file.remark || undefined,
    }))
    const results = batchCreateAttachments(paramsList)
    if (results.length > 0) {
      emit('submit', results)
      handleClose()
    } else {
      alert('批量上传失败，请重试')
    }
  }
}

function handleClose() {
  emit('update:visible', false)
}
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="fixed inset-0 z-50 flex items-center justify-center">
      <div
        class="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        @click="handleClose"
      ></div>
      <div
        class="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl mx-4 overflow-hidden max-h-[90vh] flex flex-col"
      >
        <div
          class="px-5 py-4 border-b border-slate-100 flex items-center justify-between"
          :class="isNewVersionMode ? 'bg-violet-50/50' : 'bg-blue-50/50'"
        >
          <div class="flex items-center gap-2">
            <div
              class="w-8 h-8 rounded-lg border flex items-center justify-center"
              :class="
                isNewVersionMode
                  ? 'bg-violet-100 border-violet-200'
                  : 'bg-blue-100 border-blue-200'
              "
            >
              <component
                :is="isNewVersionMode ? ArrowUpCircle : Upload"
                class="w-4 h-4"
                :class="isNewVersionMode ? 'text-violet-600' : 'text-blue-600'"
              />
            </div>
            <div>
              <h3 class="text-base font-semibold text-slate-800">
                {{ isNewVersionMode ? '上传新版本' : '批量上传附件' }}
              </h3>
              <p class="text-xs text-slate-500">
                {{
                  isNewVersionMode
                    ? `附件：${currentFileName || currentAttachment?.fileName || ''}`
                    : '支持一次上传多个文件，相同类别自动版本覆盖'
                }}
              </p>
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
            <div v-if="!isNewVersionMode">
              <label class="block text-xs font-medium text-slate-600 mb-1.5">
                所属订单 <span class="text-rose-500">*</span>
              </label>
              <select
                v-model="selectedOrderId"
                class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="">请选择订单</option>
                <option v-for="order in availableOrders" :key="order.id" :value="order.id">
                  {{ order.orderNumber }} - {{ order.clinic.name }}
                </option>
              </select>
              <div v-if="selectedOrder" class="mt-1.5 text-[11px] text-slate-400">
                患者：{{ selectedOrder.patient.anonymousCode }} / 交期：{{ selectedOrder.deliveryDate }}
              </div>
            </div>

            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1.5">
                <span class="inline-flex items-center gap-1"><User class="w-3 h-3" />上传人 <span class="text-rose-500">*</span></span>
              </label>
              <input
                v-model="uploadedBy"
                type="text"
                placeholder="请输入上传人姓名"
                class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-400 bg-white"
              />
            </div>
          </div>

          <div v-if="!isNewVersionMode" class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1.5">
                默认文件类别
              </label>
              <select
                v-model="formCategory"
                class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option
                  v-for="(label, key) in AttachmentCategoryLabels"
                  :key="key"
                  :value="key"
                >
                  {{ label }}
                </option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1.5">
                <span class="inline-flex items-center gap-1"><Calendar class="w-3 h-3" />默认所属阶段</span>
              </label>
              <select
                v-model="formStage"
                class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option v-for="s in stageOptions" :key="s.key" :value="s.key">
                  {{ s.label }}
                </option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1.5">
                默认可见范围
              </label>
              <div class="flex gap-2">
                <label class="flex-1">
                  <input
                    type="radio"
                    :value="true"
                    v-model="formIsPublic"
                    class="sr-only"
                  />
                  <div
                    class="px-3 py-2 text-center text-xs font-medium rounded-lg border cursor-pointer transition-all flex items-center justify-center gap-1.5"
                    :class="
                      formIsPublic
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    "
                  >
                    <Eye class="w-3.5 h-3.5" />对外可见
                  </div>
                </label>
                <label class="flex-1">
                  <input
                    type="radio"
                    :value="false"
                    v-model="formIsPublic"
                    class="sr-only"
                  />
                  <div
                    class="px-3 py-2 text-center text-xs font-medium rounded-lg border cursor-pointer transition-all flex items-center justify-center gap-1.5"
                    :class="
                      !formIsPublic
                        ? 'bg-slate-100 border-slate-300 text-slate-700'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    "
                  >
                    <Lock class="w-3.5 h-3.5" />仅内部
                  </div>
                </label>
              </div>
            </div>
          </div>

          <div v-if="isNewVersionMode">
            <label class="block text-xs font-medium text-slate-600 mb-1.5">
              变更说明 <span class="text-slate-400 font-normal">(可选)</span>
            </label>
            <textarea
              v-model="formChangeLog"
              rows="2"
              placeholder="请填写本次版本更新的主要变更内容，如修复边缘问题、调整颜色、重新建模等"
              class="w-full px-3 py-2 text-sm border border-violet-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent placeholder:text-slate-400 resize-none bg-white"
            ></textarea>
          </div>

          <div v-if="!isNewVersionMode && fileList.length > 1" class="p-3 bg-amber-50 rounded-lg border border-amber-200 flex items-center justify-between">
            <p class="text-[11px] text-amber-700">
              已添加 {{ fileList.length }} 个文件，可将上方默认设置应用到全部
            </p>
            <button
              class="px-3 py-1.5 text-xs font-medium text-amber-700 bg-white border border-amber-300 rounded-md hover:bg-amber-100 transition-colors"
              @click="applyDefaultSettingsToAll"
            >
              应用默认设置
            </button>
          </div>

          <div
            class="border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer"
            :class="
              dragOver
                ? 'border-blue-400 bg-blue-50'
                : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
            "
            @dragover="onDragOver"
            @dragleave="onDragLeave"
            @drop="onDrop"
            @click="triggerFileInput"
          >
            <input
              ref="fileInputRef"
              type="file"
              class="hidden"
              :multiple="!isNewVersionMode"
              @change="onFileInputChange"
            />
            <div
              class="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center"
              :class="
                isNewVersionMode ? 'bg-violet-100' : 'bg-slate-100'
              "
            >
              <component
                :is="isNewVersionMode ? ArrowUpCircle : FilePlus"
                class="w-6 h-6"
                :class="isNewVersionMode ? 'text-violet-600' : 'text-slate-500'"
              />
            </div>
            <p class="text-sm font-medium text-slate-700 mb-1">
              {{ isNewVersionMode ? '点击或拖放新版文件到此处' : '点击或拖放文件到此处上传' }}
            </p>
            <p class="text-xs text-slate-400">
              {{
                isNewVersionMode
                  ? '支持单个文件，版本号将自动递增'
                  : '支持批量上传，图片/PDF/Word/Excel/STL/压缩包等，最大50MB/个'
              }}
            </p>
          </div>

          <div v-if="fileList.length > 0" class="space-y-2">
            <div class="flex items-center justify-between">
              <p class="text-xs font-medium text-slate-600">
                待上传文件列表 <span class="text-slate-400">({{ fileList.length }} 个)</span>
              </p>
            </div>
            <div class="border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100">
              <div
                v-for="file in fileList"
                :key="file.id"
                class="p-3 flex items-start gap-3 hover:bg-slate-50/50 transition-colors"
              >
                <div
                  class="w-10 h-10 rounded-lg border flex-shrink-0 flex items-center justify-center"
                  :class="AttachmentFileTypeColors[file.fileType]"
                >
                  <component :is="getFileIcon(file.fileType)" class="w-5 h-5" />
                </div>

                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-1">
                    <span
                      class="text-sm font-medium text-slate-800 truncate"
                      :title="file.fileName"
                    >
                      {{ file.fileName }}
                    </span>
                    <span
                      class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border flex-shrink-0"
                      :class="AttachmentFileTypeColors[file.fileType]"
                    >
                      {{ AttachmentFileTypeLabels[file.fileType] }}
                    </span>
                  </div>
                  <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400 mb-2">
                    <span>{{ formatFileSize(file.fileSize) }}</span>
                  </div>

                  <div v-if="!isNewVersionMode" class="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <div>
                      <select
                        v-model="file.category"
                        class="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                      >
                        <option
                          v-for="(label, key) in AttachmentCategoryLabels"
                          :key="key"
                          :value="key"
                        >
                          {{ label }}
                        </option>
                      </select>
                    </div>
                    <div>
                      <select
                        v-model="file.stage"
                        class="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                      >
                        <option v-for="s in stageOptions" :key="s.key" :value="s.key">
                          {{ s.label }}
                        </option>
                      </select>
                    </div>
                    <div>
                      <select
                        v-model="file.isPublic"
                        class="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                      >
                        <option :value="true">对外可见</option>
                        <option :value="false">仅内部</option>
                      </select>
                    </div>
                  </div>
                </div>

                <button
                  class="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors flex-shrink-0"
                  @click="removeFile(file.id)"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div
          class="px-5 py-4 border-t border-slate-100 flex items-center justify-between gap-3 bg-slate-50"
        >
          <div class="text-xs text-slate-500">
            <span v-if="isNewVersionMode">
              将自动从版本
              <span class="font-medium text-violet-600">{{ currentAttachment?.version || 'v1.0' }}</span>
              递增
            </span>
            <span v-else-if="fileList.length > 0">
              共 <span class="font-medium text-blue-600">{{ fileList.length }}</span> 个文件
              <template v-if="selectedOrder">
                · 订单：<span class="font-medium">{{ selectedOrder.orderNumber }}</span>
              </template>
            </span>
          </div>
          <div class="flex items-center gap-3">
            <button
              class="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
              @click="handleClose"
            >
              取消
            </button>
            <button
              class="px-5 py-2 text-sm font-semibold text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              :class="isNewVersionMode ? 'bg-violet-600 hover:bg-violet-700' : 'bg-blue-600 hover:bg-blue-700'"
              :disabled="fileList.length === 0 || !selectedOrderId || !uploadedBy.trim()"
              @click="handleSubmit"
            >
              <ArrowUpCircle class="w-4 h-4 inline mr-1.5" />
              {{ isNewVersionMode ? '上传新版本' : '确认上传' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>