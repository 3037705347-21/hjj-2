<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  X,
  Link2,
  Plus,
  Trash2,
  Search,
  FileText,
  AlertCircle,
  ShieldCheck,
  Truck,
  ShoppingCart,
  ChevronRight,
  CheckCircle2,
} from 'lucide-vue-next'
import type {
  Attachment,
  AttachmentRelatedModule,
  AttachmentRelation,
} from '../types'
import {
  AttachmentRelatedModuleLabels,
  AttachmentRelatedModuleColors,
} from '../types'
import { useAttachments } from '../composables/useAttachments'
import { useOrders } from '../composables/useOrders'
import { useQualityInspection } from '../composables/useQualityInspection'
import { useLogistics } from '../composables/useLogistics'
import { useRoles } from '../composables/useRoles'

const props = defineProps<{
  visible: boolean
  attachment: Attachment
}>()

const emit = defineEmits<{
  (e: 'update:visible', val: boolean): void
}>()

const { addRelation, removeRelation } = useAttachments()
const { orders } = useOrders()
const { inspections: qualityInspections } = useQualityInspection()
const { logistics: logisticsRecords } = useLogistics()
const { currentRole, currentTechnicianName } = useRoles()

const showAddForm = ref(false)
const selectedModule = ref<AttachmentRelatedModule>('order')
const searchKeyword = ref('')
const selectedRecordId = ref('')
const linkedBy = ref('')

watch(
  () => props.visible,
  (val) => {
    if (val) {
      resetForm()
    }
  }
)

watch(
  () => selectedModule.value,
  () => {
    selectedRecordId.value = ''
    searchKeyword.value = ''
  }
)

function resetForm() {
  showAddForm.value = false
  selectedModule.value = 'order'
  searchKeyword.value = ''
  selectedRecordId.value = ''
  if (currentRole.value === 'technician') {
    linkedBy.value = currentTechnicianName.value || '系统'
  } else if (currentRole.value === 'clinic') {
    linkedBy.value = '诊所用户'
  } else {
    linkedBy.value = '调度员'
  }
}

function close() {
  emit('update:visible', false)
}

function getModuleIcon(module: AttachmentRelatedModule) {
  switch (module) {
    case 'order':
      return FileText
    case 'rework':
      return AlertCircle
    case 'quality':
      return ShieldCheck
    case 'logistics':
      return Truck
    default:
      return Link2
  }
}

function getRouteForRelation(module: AttachmentRelatedModule, recordId: string) {
  switch (module) {
    case 'order':
      return `/order/${recordId}`
    case 'rework':
      return `/order/${props.attachment.orderId}`
    case 'quality':
      return `/quality/${recordId}`
    case 'logistics':
      return `/logistics/detail/${recordId}`
    default:
      return '#'
  }
}

const availableRecords = computed(() => {
  const kw = searchKeyword.value.toLowerCase().trim()
  let records: { id: string; title: string; subtitle?: string }[] = []

  switch (selectedModule.value) {
    case 'order':
      records = orders.value.map((o) => ({
        id: o.id,
        title: o.orderNumber,
        subtitle: `${o.clinic.name} · ${o.patient.anonymousCode}`,
      }))
      break
    case 'rework':
      const order = orders.value.find((o) => o.id === props.attachment.orderId)
      records = (order?.returnRecords || []).map((r) => ({
        id: r.id,
        title: `${r.id} - ${r.reason.slice(0, 20)}`,
        subtitle: `来源：${r.sourceStage}`,
      }))
      break
    case 'quality':
      records = qualityInspections.value
        .filter((q) => q.orderId === props.attachment.orderId)
        .map((q) => ({
          id: q.id,
          title: `${q.processingStage} - ${q.inspectionStage}`,
          subtitle: `状态：${q.status}`,
        }))
      break
    case 'logistics':
      records = logisticsRecords.value
        .filter((l) => l.orderId === props.attachment.orderId)
        .map((l) => ({
          id: l.id,
          title: `${l.trackingNumber}`,
          subtitle: `${l.type === 'receive' ? '收件' : '发货'} · ${l.shippingMethod}`,
        }))
      break
  }

  if (kw) {
    records = records.filter(
      (r) =>
        r.title.toLowerCase().includes(kw) ||
        r.subtitle?.toLowerCase().includes(kw)
    )
  }

  return records
})

const currentRelations = computed<AttachmentRelation[]>(() => {
  return props.attachment.relations || []
})

function handleAddRelation() {
  if (!selectedRecordId.value || !linkedBy.value.trim()) {
    alert('请选择关联记录并填写操作人')
    return
  }

  const record = availableRecords.value.find(
    (r) => r.id === selectedRecordId.value
  )

  addRelation({
    attachmentId: props.attachment.id,
    module: selectedModule.value,
    recordId: selectedRecordId.value,
    recordTitle: record?.title,
    linkedBy: linkedBy.value.trim(),
  })

  resetForm()
}

function handleRemoveRelation(module: AttachmentRelatedModule, recordId: string) {
  if (confirm('确定要取消该关联吗？')) {
    removeRelation(props.attachment.id, module, recordId)
  }
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
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
      v-if="visible"
      class="fixed inset-0 z-50 flex items-center justify-center"
    >
      <div
        class="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        @click="close"
      ></div>
      <div
        class="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden max-h-[85vh] flex flex-col"
      >
        <div
          class="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-blue-50/50"
        >
          <div class="flex items-center gap-2">
            <div
              class="w-8 h-8 rounded-lg bg-blue-100 border border-blue-200 flex items-center justify-center"
            >
              <Link2 class="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h3 class="text-base font-semibold text-slate-800">
                管理关联记录
              </h3>
              <p class="text-xs text-slate-500">
                附件：{{ attachment.fileName }} · 共 {{ currentRelations.length }} 个关联
              </p>
            </div>
          </div>
          <button
            class="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg transition-colors"
            @click="close"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <div class="p-5 space-y-5 overflow-y-auto flex-1">
          <div
            v-if="showAddForm"
            class="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-4"
          >
            <div class="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <Plus class="w-4 h-4 text-blue-600" />
              新增关联
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-medium text-slate-600 mb-1.5">
                  关联模块
                </label>
                <select
                  v-model="selectedModule"
                  class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  <option
                    v-for="(label, key) in AttachmentRelatedModuleLabels"
                    :key="key"
                    :value="key"
                  >
                    {{ label }}
                  </option>
                </select>
              </div>

              <div>
                <label class="block text-xs font-medium text-slate-600 mb-1.5">
                  操作人
                </label>
                <input
                  v-model="linkedBy"
                  type="text"
                  placeholder="请输入操作人姓名"
                  class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-400 bg-white"
                />
              </div>
            </div>

            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1.5">
                搜索记录
              </label>
              <div class="relative">
                <Search
                  class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
                />
                <input
                  v-model="searchKeyword"
                  type="text"
                  placeholder="输入关键词搜索..."
                  class="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-400 bg-white"
                />
              </div>
            </div>

            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1.5">
                选择记录（共 {{ availableRecords.length }} 条）
              </label>
              <div
                class="border border-slate-200 rounded-lg max-h-48 overflow-y-auto bg-white"
              >
                <div
                  v-if="availableRecords.length === 0"
                  class="p-6 text-center text-xs text-slate-400"
                >
                  暂无可用记录
                </div>
                <label
                  v-for="record in availableRecords"
                  :key="record.id"
                  class="flex items-start gap-3 px-3 py-2.5 hover:bg-blue-50/50 cursor-pointer border-b border-slate-100 last:border-b-0 transition-colors"
                >
                  <input
                    type="radio"
                    :value="record.id"
                    v-model="selectedRecordId"
                    class="mt-0.5 w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <div class="flex-1 min-w-0">
                    <div
                      class="text-sm font-medium text-slate-800 truncate"
                    >
                      {{ record.title }}
                    </div>
                    <div
                      v-if="record.subtitle"
                      class="text-xs text-slate-500 truncate mt-0.5"
                    >
                      {{ record.subtitle }}
                    </div>
                  </div>
                  <CheckCircle2
                    v-if="selectedRecordId === record.id"
                    class="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5"
                  />
                </label>
              </div>
            </div>

            <div class="flex items-center justify-end gap-2 pt-2">
              <button
                class="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                @click="resetForm"
              >
                取消
              </button>
              <button
                class="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                :disabled="!selectedRecordId"
                @click="handleAddRelation"
              >
                <Plus class="w-4 h-4 inline mr-1" />
                添加关联
              </button>
            </div>
          </div>

          <div
            v-if="!showAddForm"
            class="flex items-center justify-between"
          >
            <div class="text-xs text-slate-500">
              可将附件关联到返工、质检、物流等业务记录，便于追溯
            </div>
            <button
              class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              @click="showAddForm = true"
            >
              <Plus class="w-3.5 h-3.5" />
              新增关联
            </button>
          </div>

          <div class="space-y-2">
            <div
              v-if="currentRelations.length === 0"
              class="p-10 text-center border border-dashed border-slate-200 rounded-xl"
            >
              <div
                class="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-100 flex items-center justify-center"
              >
                <Link2 class="w-6 h-6 text-slate-400" />
              </div>
              <p class="text-sm font-medium text-slate-600 mb-1">
                暂无关联记录
              </p>
              <p class="text-xs text-slate-400">
                点击右上角「新增关联」按钮添加
              </p>
            </div>

            <div
              v-for="rel in currentRelations"
              :key="`${rel.module}-${rel.recordId}`"
              class="group flex items-start gap-3 p-3 border border-slate-200 rounded-lg hover:border-blue-200 hover:bg-blue-50/30 transition-all"
            >
              <div
                class="w-9 h-9 rounded-lg flex items-center justify-center border flex-shrink-0"
                :class="AttachmentRelatedModuleColors[rel.module]"
              >
                <component
                  :is="getModuleIcon(rel.module)"
                  class="w-4 h-4"
                />
              </div>

              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <span
                    class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border"
                    :class="AttachmentRelatedModuleColors[rel.module]"
                  >
                    {{ AttachmentRelatedModuleLabels[rel.module] }}
                  </span>
                </div>
                <div
                  class="text-sm font-medium text-slate-800 truncate flex items-center gap-1"
                >
                  {{ rel.recordTitle || rel.recordId }}
                  <ChevronRight
                    class="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                </div>
                <div class="text-[11px] text-slate-500 mt-0.5">
                  {{ rel.linkedBy }} · {{ formatDate(rel.linkedAt) }}
                </div>
              </div>

              <div class="flex items-center gap-1 flex-shrink-0">
                <a
                  :href="`#${getRouteForRelation(rel.module, rel.recordId)}`"
                  class="p-1.5 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors opacity-0 group-hover:opacity-100"
                  title="跳转查看"
                  @click.prevent="
                    $router.push(getRouteForRelation(rel.module, rel.recordId))
                  "
                >
                  <ChevronRight class="w-4 h-4" />
                </a>
                <button
                  v-if="rel.module !== 'order'"
                  class="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors opacity-0 group-hover:opacity-100"
                  title="取消关联"
                  @click="handleRemoveRelation(rel.module, rel.recordId)"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div
          class="px-5 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50"
        >
          <div class="text-xs text-slate-500">
            <ShoppingCart class="w-3 h-3 inline mr-1" />
            提示：订单关联不可取消
          </div>
          <button
            class="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
            @click="close"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
