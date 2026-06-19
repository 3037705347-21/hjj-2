<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import {
  Settings,
  Plus,
  Search,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  DollarSign,
  Percent,
  Tag,
  RefreshCw,
  X,
  Save,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Zap,
  Clock,
} from 'lucide-vue-next'
import { usePricing } from '../composables/usePricing'
import type { PriceRule, RestorationType, MaterialType, OrderPriority, PriceRuleStatus } from '../types'
import {
  RestorationTypeLabels,
  MaterialTypeLabels,
  PriorityLabels,
  PriceRuleStatusLabels,
  PriceRuleStatusColors,
} from '../types'
import StatCard from '../components/StatCard.vue'

const {
  priceRules,
  searchPriceRules,
  createPriceRule,
  updatePriceRule,
  deletePriceRule,
  togglePriceRuleStatus,
  calculatePrice,
  refreshAllQuotes,
} = usePricing()

const filters = reactive({
  restorationType: '' as RestorationType | '',
  material: '' as MaterialType | '',
  priority: '' as OrderPriority | '',
  status: '' as PriceRuleStatus | '',
  keyword: '',
})

const pageSize = 10
const currentPage = ref(1)

const showFormDialog = ref(false)
const formMode = ref<'create' | 'edit'>('create')
const editingRule = ref<PriceRule | null>(null)

const formData = reactive({
  name: '',
  restorationType: 'crown' as RestorationType,
  material: 'zirconia' as MaterialType,
  priority: 'standard' as OrderPriority,
  unitPrice: 0,
  surchargeRate: 0,
  reworkChargeable: false,
  reworkChargeRate: 0,
  discount: 0,
  status: 'active' as PriceRuleStatus,
  description: '',
})

const showDeleteConfirm = ref(false)
const deletingRule = ref<PriceRule | null>(null)

const filteredRules = computed(() => {
  return searchPriceRules({
    restorationType: filters.restorationType || undefined,
    material: filters.material || undefined,
    priority: filters.priority || undefined,
    status: filters.status || undefined,
    keyword: filters.keyword || undefined,
  })
})

const totalPages = computed(() => Math.ceil(filteredRules.value.length / pageSize))

const paginatedRules = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredRules.value.slice(start, start + pageSize)
})

const stats = computed(() => {
  const list = priceRules.value
  const total = list.length
  const active = list.filter((r) => r.status === 'active').length
  const inactive = total - active
  const avgPrice =
    total > 0
      ? Math.round(list.reduce((s, r) => s + r.unitPrice, 0) / total)
      : 0
  return { total, active, inactive, avgPrice }
})

const previewPrice = computed(() => {
  if (!formData.unitPrice) return null
  const result = calculatePrice({
    restorationType: formData.restorationType,
    material: formData.material,
    priority: formData.priority,
    quantity: 1,
    isRework: formData.reworkChargeable,
    discount: formData.discount,
  })
  return result
})

function resetFilters() {
  filters.restorationType = ''
  filters.material = ''
  filters.priority = ''
  filters.status = ''
  filters.keyword = ''
  currentPage.value = 1
}

function openCreateDialog() {
  formMode.value = 'create'
  editingRule.value = null
  Object.assign(formData, {
    name: '',
    restorationType: 'crown',
    material: 'zirconia',
    priority: 'standard',
    unitPrice: 1000,
    surchargeRate: 0,
    reworkChargeable: false,
    reworkChargeRate: 0,
    discount: 0,
    status: 'active',
    description: '',
  })
  showFormDialog.value = true
}

function openEditDialog(rule: PriceRule) {
  formMode.value = 'edit'
  editingRule.value = rule
  Object.assign(formData, {
    name: rule.name,
    restorationType: rule.restorationType,
    material: rule.material,
    priority: rule.priority,
    unitPrice: rule.unitPrice,
    surchargeRate: rule.surchargeRate,
    reworkChargeable: rule.reworkChargeable,
    reworkChargeRate: rule.reworkChargeRate,
    discount: rule.discount,
    status: rule.status,
    description: rule.description || '',
  })
  showFormDialog.value = true
}

function closeFormDialog() {
  showFormDialog.value = false
  editingRule.value = null
}

function handleSubmit() {
  if (formMode.value === 'create') {
    createPriceRule({
      name: formData.name || undefined,
      restorationType: formData.restorationType,
      material: formData.material,
      priority: formData.priority,
      unitPrice: formData.unitPrice,
      surchargeRate: formData.surchargeRate,
      reworkChargeable: formData.reworkChargeable,
      reworkChargeRate: formData.reworkChargeRate,
      discount: formData.discount,
      status: formData.status,
      description: formData.description || undefined,
    })
  } else if (editingRule.value) {
    updatePriceRule(editingRule.value.id, {
      name: formData.name,
      restorationType: formData.restorationType,
      material: formData.material,
      priority: formData.priority,
      unitPrice: formData.unitPrice,
      surchargeRate: formData.surchargeRate,
      reworkChargeable: formData.reworkChargeable,
      reworkChargeRate: formData.reworkChargeRate,
      discount: formData.discount,
      status: formData.status,
      description: formData.description,
    })
  }
  closeFormDialog()
}

function confirmDelete(rule: PriceRule) {
  deletingRule.value = rule
  showDeleteConfirm.value = true
}

function handleDelete() {
  if (deletingRule.value) {
    deletePriceRule(deletingRule.value.id)
  }
  showDeleteConfirm.value = false
  deletingRule.value = null
}

function handleToggleStatus(rule: PriceRule) {
  togglePriceRuleStatus(rule.id)
}

function handleRefreshQuotes() {
  refreshAllQuotes()
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

const restorationTypeOptions = Object.entries(RestorationTypeLabels).map(([value, label]) => ({
  value: value as RestorationType,
  label,
}))

const materialTypeOptions = Object.entries(MaterialTypeLabels).map(([value, label]) => ({
  value: value as MaterialType,
  label,
}))

const priorityOptions = Object.entries(PriorityLabels).map(([value, label]) => ({
  value: value as OrderPriority,
  label,
}))

const statusOptions = [
  { value: 'active', label: '启用' },
  { value: 'inactive', label: '禁用' },
]
</script>

<template>
  <div class="min-h-full pb-12">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-slate-900 tracking-tight mb-2">价格规则配置</h1>
      <p class="text-sm text-slate-500">管理义齿加工价格规则，支持按修复类型、材料、加急等级配置单价和附加费</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <StatCard
        title="价格规则总数"
        :value="stats.total"
        icon="Settings"
        color="blue"
      />
      <StatCard
        title="启用规则"
        :value="stats.active"
        icon="ToggleRight"
        color="emerald"
      />
      <StatCard
        title="禁用规则"
        :value="stats.inactive"
        icon="ToggleLeft"
        color="slate"
      />
      <StatCard
        title="平均单价"
        :value="'¥' + stats.avgPrice.toLocaleString()"
        icon="DollarSign"
        color="amber"
      />
    </div>

    <div class="bg-white rounded-xl border border-slate-200 overflow-hidden mb-6">
      <div class="px-5 py-4 border-b border-slate-100">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div class="flex items-center gap-2">
            <Settings class="w-5 h-5 text-blue-600" />
            <h2 class="text-base font-semibold text-slate-800">规则筛选</h2>
          </div>
          <div class="flex items-center gap-2">
            <button
              class="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              @click="handleRefreshQuotes"
            >
              <RotateCcw class="w-4 h-4" />
              刷新报价
            </button>
            <button
              class="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              @click="openCreateDialog"
            >
              <Plus class="w-4 h-4" />
              新增规则
            </button>
          </div>
        </div>
      </div>
      <div class="p-5">
        <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label class="block text-xs font-medium text-slate-700 mb-1.5">修复类型</label>
            <select
              v-model="filters.restorationType"
              class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            >
              <option value="">全部</option>
              <option v-for="opt in restorationTypeOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-700 mb-1.5">材料</label>
            <select
              v-model="filters.material"
              class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            >
              <option value="">全部</option>
              <option v-for="opt in materialTypeOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-700 mb-1.5">加急等级</label>
            <select
              v-model="filters.priority"
              class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            >
              <option value="">全部</option>
              <option v-for="opt in priorityOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-700 mb-1.5">状态</label>
            <select
              v-model="filters.status"
              class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            >
              <option value="">全部</option>
              <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-700 mb-1.5">关键词</label>
            <div class="relative">
              <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                v-model="filters.keyword"
                type="text"
                placeholder="搜索规则名称..."
                class="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>
          </div>
        </div>
        <div class="flex justify-end mt-4">
          <button
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 transition-colors"
            @click="resetFilters"
          >
            <RefreshCw class="w-3.5 h-3.5" />
            重置筛选
          </button>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-slate-50 border-b border-slate-100">
            <tr>
              <th class="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                规则名称
              </th>
              <th class="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                修复类型
              </th>
              <th class="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                材料
              </th>
              <th class="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                加急等级
              </th>
              <th class="px-5 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                单价
              </th>
              <th class="px-5 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                附加费率
              </th>
              <th class="px-5 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                返工收费
              </th>
              <th class="px-5 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                折扣
              </th>
              <th class="px-5 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                状态
              </th>
              <th class="px-5 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr
              v-for="rule in paginatedRules"
              :key="rule.id"
              class="hover:bg-slate-50 transition-colors"
            >
              <td class="px-5 py-4">
                <div class="text-sm font-medium text-slate-900">{{ rule.name }}</div>
                <div v-if="rule.description" class="text-xs text-slate-500 mt-0.5 line-clamp-1">
                  {{ rule.description }}
                </div>
              </td>
              <td class="px-5 py-4">
                <span class="text-sm text-slate-700">
                  {{ RestorationTypeLabels[rule.restorationType] }}
                </span>
              </td>
              <td class="px-5 py-4">
                <span class="text-sm text-slate-700">
                  {{ MaterialTypeLabels[rule.material] }}
                </span>
              </td>
              <td class="px-5 py-4">
                <span class="text-sm text-slate-700">
                  {{ PriorityLabels[rule.priority] }}
                </span>
              </td>
              <td class="px-5 py-4 text-right">
                <span class="text-sm font-semibold text-slate-900">
                  ¥{{ rule.unitPrice.toLocaleString() }}
                </span>
              </td>
              <td class="px-5 py-4 text-right">
                <span
                  class="text-sm"
                  :class="rule.surchargeRate > 0 ? 'text-rose-600' : 'text-slate-500'"
                >
                  {{ rule.surchargeRate > 0 ? '+' + rule.surchargeRate + '%' : '-' }}
                </span>
              </td>
              <td class="px-5 py-4 text-center">
                <span
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium"
                  :class="
                    rule.reworkChargeable
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-slate-100 text-slate-500'
                  "
                >
                  <RefreshCw v-if="rule.reworkChargeable" class="w-3 h-3" />
                  {{ rule.reworkChargeable ? rule.reworkChargeRate + '%' : '免费' }}
                </span>
              </td>
              <td class="px-5 py-4 text-right">
                <span
                  class="text-sm"
                  :class="rule.discount > 0 ? 'text-emerald-600' : 'text-slate-500'"
                >
                  {{ rule.discount > 0 ? '-' + rule.discount + '%' : '-' }}
                </span>
              </td>
              <td class="px-5 py-4 text-center">
                <span
                  class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border"
                  :class="PriceRuleStatusColors[rule.status]"
                >
                  {{ PriceRuleStatusLabels[rule.status] }}
                </span>
              </td>
              <td class="px-5 py-4">
                <div class="flex items-center justify-center gap-1">
                  <button
                    class="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                    title="编辑"
                    @click="openEditDialog(rule)"
                  >
                    <Pencil class="w-4 h-4" />
                  </button>
                  <button
                    class="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                    :title="rule.status === 'active' ? '禁用' : '启用'"
                    @click="handleToggleStatus(rule)"
                  >
                    <ToggleRight v-if="rule.status === 'active'" class="w-4 h-4" />
                    <ToggleLeft v-else class="w-4 h-4" />
                  </button>
                  <button
                    class="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                    title="删除"
                    @click="confirmDelete(rule)"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="filteredRules.length === 0">
              <td colspan="10" class="px-5 py-12 text-center">
                <div class="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-100 flex items-center justify-center">
                  <Settings class="w-6 h-6 text-slate-400" />
                </div>
                <p class="text-sm text-slate-500">暂无价格规则</p>
                <p class="text-xs text-slate-400 mt-1">点击右上角"新增规则"开始配置</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div
        v-if="filteredRules.length > pageSize"
        class="px-5 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between"
      >
        <span class="text-sm text-slate-500">
          共 {{ filteredRules.length }} 条规则，第 {{ currentPage }} / {{ totalPages }} 页
        </span>
        <div class="flex items-center gap-1">
          <button
            class="p-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            :disabled="currentPage === 1"
            @click="currentPage--"
          >
            <ChevronLeft class="w-4 h-4" />
          </button>
          <button
            class="p-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            :disabled="currentPage === totalPages"
            @click="currentPage++"
          >
            <ChevronRight class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div
        v-if="showFormDialog"
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        @click.self="closeFormDialog"
      >
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
          <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                <Settings class="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 class="text-lg font-semibold text-slate-900">
                  {{ formMode === 'create' ? '新增价格规则' : '编辑价格规则' }}
                </h3>
                <p class="text-xs text-slate-500">配置修复体的价格参数</p>
              </div>
            </div>
            <button
              class="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              @click="closeFormDialog"
            >
              <X class="w-5 h-5" />
            </button>
          </div>

          <div class="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-slate-700 mb-1.5">
                  规则名称 <span class="text-slate-400 text-xs">（选填，留空将自动生成）</span>
                </label>
                <input
                  v-model="formData.name"
                  type="text"
                  placeholder="例如：氧化锆单冠-常规"
                  class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1.5">
                  修复类型 <span class="text-rose-500">*</span>
                </label>
                <select
                  v-model="formData.restorationType"
                  class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                >
                  <option v-for="opt in restorationTypeOptions" :key="opt.value" :value="opt.value">
                    {{ opt.label }}
                  </option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1.5">
                  材料 <span class="text-rose-500">*</span>
                </label>
                <select
                  v-model="formData.material"
                  class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                >
                  <option v-for="opt in materialTypeOptions" :key="opt.value" :value="opt.value">
                    {{ opt.label }}
                  </option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1.5">
                  加急等级 <span class="text-rose-500">*</span>
                </label>
                <select
                  v-model="formData.priority"
                  class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                >
                  <option v-for="opt in priorityOptions" :key="opt.value" :value="opt.value">
                    {{ opt.label }}
                  </option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1.5">
                  单价（元） <span class="text-rose-500">*</span>
                </label>
                <div class="relative">
                  <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">¥</span>
                  <input
                    v-model.number="formData.unitPrice"
                    type="number"
                    min="0"
                    placeholder="0"
                    class="w-full pl-7 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1.5">
                  附加费率（%）
                </label>
                <div class="relative">
                  <input
                    v-model.number="formData.surchargeRate"
                    type="number"
                    min="0"
                    max="100"
                    placeholder="0"
                    class="w-full px-3 py-2 pr-7 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                  <Percent class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                </div>
                <p class="text-xs text-slate-500 mt-1">加急订单的额外收费比例</p>
              </div>

              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1.5">
                  折扣率（%）
                </label>
                <div class="relative">
                  <input
                    v-model.number="formData.discount"
                    type="number"
                    min="0"
                    max="100"
                    placeholder="0"
                    class="w-full px-3 py-2 pr-7 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                  <Percent class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                </div>
                <p class="text-xs text-slate-500 mt-1">优惠折扣比例，0表示无折扣</p>
              </div>

              <div class="md:col-span-2">
                <label class="flex items-center gap-3 cursor-pointer">
                  <input
                    v-model="formData.reworkChargeable"
                    type="checkbox"
                    class="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                  <span class="text-sm font-medium text-slate-700">返工收费</span>
                </label>
                <p class="text-xs text-slate-500 ml-7 mt-1">开启后，返工订单将按比例额外收费</p>
              </div>

              <div v-if="formData.reworkChargeable">
                <label class="block text-sm font-medium text-slate-700 mb-1.5">
                  返工收费比例（%）
                </label>
                <div class="relative">
                  <input
                    v-model.number="formData.reworkChargeRate"
                    type="number"
                    min="0"
                    max="100"
                    placeholder="0"
                    class="w-full px-3 py-2 pr-7 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                  <Percent class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1.5">
                  状态
                </label>
                <select
                  v-model="formData.status"
                  class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                >
                  <option value="active">启用</option>
                  <option value="inactive">禁用</option>
                </select>
              </div>

              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-slate-700 mb-1.5">
                  描述
                </label>
                <textarea
                  v-model="formData.description"
                  rows="2"
                  placeholder="可选：填写规则说明或备注"
                  class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
                ></textarea>
              </div>
            </div>

            <div v-if="previewPrice" class="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
              <div class="flex items-center gap-2 mb-3">
                <Zap class="w-4 h-4 text-blue-600" />
                <span class="text-sm font-semibold text-blue-900">价格试算预览</span>
              </div>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div class="text-xs text-blue-600 mb-1">基础单价</div>
                  <div class="text-lg font-bold text-blue-900">
                    ¥{{ previewPrice.unitPrice.toLocaleString() }}
                  </div>
                </div>
                <div>
                  <div class="text-xs text-blue-600 mb-1">附加费</div>
                  <div class="text-lg font-bold text-rose-600">
                    {{ previewPrice.surcharge > 0 ? '+' : '' }}¥{{ previewPrice.surcharge.toLocaleString() }}
                  </div>
                </div>
                <div>
                  <div class="text-xs text-blue-600 mb-1">折扣</div>
                  <div class="text-lg font-bold text-emerald-600">
                    -¥{{ previewPrice.discountAmount.toLocaleString() }}
                  </div>
                </div>
                <div>
                  <div class="text-xs text-blue-600 mb-1">应收金额</div>
                  <div class="text-lg font-bold text-blue-900">
                    ¥{{ previewPrice.subtotal.toLocaleString() }}
                  </div>
                </div>
              </div>
              <div v-if="formData.reworkChargeable" class="mt-3 pt-3 border-t border-blue-200">
                <div class="flex items-center gap-2 text-xs text-blue-700">
                  <RefreshCw class="w-3.5 h-3.5" />
                  返工收费：+¥{{ previewPrice.reworkCharge.toLocaleString() }}
                  （{{ formData.reworkChargeRate }}%）
                </div>
              </div>
            </div>
          </div>

          <div class="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
            <button
              class="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              @click="closeFormDialog"
            >
              取消
            </button>
            <button
              class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm inline-flex items-center gap-1.5"
              @click="handleSubmit"
            >
              <Save class="w-4 h-4" />
              {{ formMode === 'create' ? '创建规则' : '保存修改' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div
        v-if="showDeleteConfirm"
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        @click.self="showDeleteConfirm = false"
      >
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
          <div class="w-12 h-12 mx-auto mb-4 rounded-full bg-rose-100 flex items-center justify-center">
            <Trash2 class="w-6 h-6 text-rose-600" />
          </div>
          <h3 class="text-lg font-semibold text-slate-900 text-center mb-2">确认删除</h3>
          <p class="text-sm text-slate-500 text-center mb-6">
            确定要删除价格规则
            <span class="font-medium text-slate-700">"{{ deletingRule?.name }}"</span>
            吗？此操作不可恢复。
          </p>
          <div class="flex gap-3">
            <button
              class="flex-1 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              @click="showDeleteConfirm = false"
            >
              取消
            </button>
            <button
              class="flex-1 px-4 py-2 text-sm font-medium text-white bg-rose-600 rounded-lg hover:bg-rose-700 transition-colors"
              @click="handleDelete"
            >
              确认删除
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
