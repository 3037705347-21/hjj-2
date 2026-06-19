<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  Paperclip,
  FileText,
  Image,
  ScanFace,
  FileBox,
  Truck,
  User,
  Calendar,
  Download,
  Eye,
  Folder,
  Filter,
} from 'lucide-vue-next'
import type { Attachment, AttachmentCategory } from '../types'
import {
  AttachmentCategoryLabels,
  AttachmentCategoryColors,
} from '../types'

interface Props {
  attachments: Attachment[]
}

const props = defineProps<Props>()

const activeCategory = ref<AttachmentCategory | 'all'>('all')

const categoryList: { key: AttachmentCategory | 'all'; label: string; count: number }[] = computed(() => {
  const cats: { key: AttachmentCategory | 'all'; label: string; count: number }[] = [
    { key: 'all', label: '全部', count: props.attachments.length },
  ]
  const order: AttachmentCategory[] = [
    'intraoral-scan',
    'prescription-photo',
    'facial-photo',
    'design-draft',
    'logistics-receipt',
  ]
  order.forEach((cat) => {
    const count = props.attachments.filter((a) => a.category === cat).length
    if (count > 0) {
      cats.push({
        key: cat,
        label: AttachmentCategoryLabels[cat],
        count,
      })
    }
  })
  return cats
})

const groupedAttachments = computed(() => {
  const filtered =
    activeCategory.value === 'all'
      ? props.attachments
      : props.attachments.filter((a) => a.category === activeCategory.value)

  const groups: Record<AttachmentCategory, Attachment[]> = {
    'intraoral-scan': [],
    'prescription-photo': [],
    'facial-photo': [],
    'design-draft': [],
    'logistics-receipt': [],
  }
  filtered.forEach((a) => {
    groups[a.category].push(a)
  })
  return groups
})

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
    default:
      return Paperclip
  }
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return '—'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
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

function setCategory(cat: AttachmentCategory | 'all') {
  activeCategory.value = cat
}
</script>

<template>
  <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
    <div
      class="px-5 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3"
    >
      <div class="flex items-center gap-2">
        <div
          class="w-8 h-8 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center"
        >
          <Paperclip class="w-4 h-4 text-orange-600" />
        </div>
        <div>
          <h2 class="text-base font-semibold text-slate-800">附件资料</h2>
          <p class="text-xs text-slate-500">
            共 {{ attachments.length }} 个文件
          </p>
        </div>
      </div>
    </div>

    <div class="px-5 py-3 border-b border-slate-100 bg-slate-50/50">
      <div class="flex items-center gap-1.5 flex-wrap">
        <Filter class="w-3.5 h-3.5 text-slate-400" />
        <button
          v-for="cat in categoryList"
          :key="cat.key"
          class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all"
          :class="[
            activeCategory === cat.key
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50',
          ]"
          @click="setCategory(cat.key)"
        >
          <span>{{ cat.label }}</span>
          <span
            class="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px]"
            :class="[
              activeCategory === cat.key
                ? 'bg-white/20 text-white'
                : 'bg-slate-100 text-slate-500',
            ]"
          >
            {{ cat.count }}
          </span>
        </button>
      </div>
    </div>

    <div class="p-5">
      <template v-if="attachments.length === 0">
        <div
          class="flex flex-col items-center justify-center py-10 text-center"
        >
          <div
            class="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-3"
          >
            <Folder class="w-7 h-7 text-slate-400" />
          </div>
          <p class="text-sm font-medium text-slate-600 mb-1">暂无附件</p>
          <p class="text-xs text-slate-400">该订单尚未上传任何附件资料</p>
        </div>
      </template>

      <template v-else>
        <div class="space-y-5">
          <template v-for="cat in (Object.keys(groupedAttachments) as AttachmentCategory[])" :key="cat">
            <div v-if="groupedAttachments[cat].length > 0">
              <div class="flex items-center gap-2 mb-3">
                <span
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border"
                  :class="AttachmentCategoryColors[cat]"
                >
                  <component :is="getCategoryIcon(cat)" class="w-3 h-3" />
                  {{ AttachmentCategoryLabels[cat] }}
                </span>
                <span class="text-xs text-slate-400">
                  {{ groupedAttachments[cat].length }} 个
                </span>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div
                  v-for="att in groupedAttachments[cat]"
                  :key="att.id"
                  class="group relative border border-slate-200 rounded-lg p-3 hover:border-blue-300 hover:bg-blue-50/30 transition-all"
                >
                  <div class="flex items-start gap-3">
                    <div
                      class="w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center border"
                      :class="AttachmentCategoryColors[cat]"
                    >
                      <component :is="getCategoryIcon(cat)" class="w-5 h-5" />
                    </div>

                    <div class="flex-1 min-w-0">
                      <div
                        class="text-sm font-medium text-slate-800 truncate mb-1"
                        :title="att.fileName"
                      >
                        {{ att.fileName }}
                      </div>
                      <p
                        v-if="att.description"
                        class="text-xs text-slate-500 mb-2 line-clamp-1"
                      >
                        {{ att.description }}
                      </p>
                      <div
                        class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400"
                      >
                        <span class="inline-flex items-center gap-1">
                          <User class="w-3 h-3" />
                          {{ att.uploadedBy }}
                        </span>
                        <span class="inline-flex items-center gap-1">
                          <Calendar class="w-3 h-3" />
                          {{ formatDate(att.uploadedAt) }}
                        </span>
                        <span>{{ formatFileSize(att.fileSize) }}</span>
                      </div>
                    </div>

                    <div
                      class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <button
                        class="p-1.5 rounded-md text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="预览"
                      >
                        <Eye class="w-4 h-4" />
                      </button>
                      <button
                        class="p-1.5 rounded-md text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                        title="下载"
                      >
                        <Download class="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </div>
      </template>
    </div>
  </div>
</template>
