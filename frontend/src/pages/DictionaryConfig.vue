<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import {
  Settings,
  Plus,
  Search,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  BookOpen,
  Tag,
  RefreshCw,
  X,
  Save,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Layers,
} from 'lucide-vue-next'
import { useDictionaries } from '../composables/useDictionaries'
import type { DictionaryItem, DictionaryCategory, DictionaryFilter } from '../types'
import { DictionaryCategoryLabels } from '../types'
import StatCard from '../components/StatCard.vue'
import { cn } from '../lib/utils'

const {
  dictionaryItems,
  allCategories,
  categoryStats,
  searchDictionaryItems,
  createDictionaryItem,
  updateDictionaryItem,
  toggleDictionaryItem,
  deleteDictionaryItem,
  getNextSortOrder,
  resetToDefaults,
} = useDictionaries()

const filters = reactive<DictionaryFilter>({
  category: undefined,
  keyword: '',
  enabled: undefined,
})

const pageSize = 15
const currentPage = ref(1)

const showFormDialog = ref(false)
const formMode = ref<'create' | 'edit'>('create')
const editingItem = ref<DictionaryItem | null>(null)

const formData = reactive({
  category: 'restoration_type' as DictionaryCategory,
  code: '',
  name: '',
  sortOrder: 1,
  enabled: true,
  description: '',
  color: '',
  icon: '',
})

const showDeleteConfirm = ref(false)
const deletingItem = ref<DictionaryItem | null>(null)

const showResetConfirm = ref(false)

const filteredItems = computed(() => {
  return searchDictionaryItems({
    category: filters.category,
    keyword: filters.keyword || undefined,
    enabled: filters.enabled,
  })
})

const totalPages = computed(() => Math.ceil(filteredItems.value.length / pageSize))

const paginatedItems = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredItems.value.slice(start, start + pageSize)
})

const stats = computed(() => {
  const list = dictionaryItems.value
  const total = list.length
  const enabled = list.filter((i) => i.enabled).length
  const disabled = total - enabled
  const categories = allCategories.value.length
  return { total, enabled, disabled, categories }
})

function resetFilters() {
  filters.category = undefined
  filters.keyword = ''
  filters.enabled = undefined
  currentPage.value = 1
}

function openCreateDialog() {
  formMode.value = 'create'
  editingItem.value = null
  const defaultCategory = filters.category || allCategories.value[0] || 'restoration_type'
  Object.assign(formData, {
    category: defaultCategory,
    code: '',
    name: '',
    sortOrder: getNextSortOrder(defaultCategory),
    enabled: true,
    description: '',
    color: '',
    icon: '',
  })
  showFormDialog.value = true
}

function openEditDialog(item: DictionaryItem) {
  formMode.value = 'edit'
  editingItem.value = item
  Object.assign(formData, {
    category: item.category,
    code: item.code,
    name: item.name,
    sortOrder: item.sortOrder,
    enabled: item.enabled,
    description: item.description || '',
    color: item.color || '',
    icon: item.icon || '',
  })
  showFormDialog.value = true
}

function handleCategoryChange() {
  if (formMode.value === 'create') {
    formData.sortOrder = getNextSortOrder(formData.category)
  }
}

function validateForm(): boolean {
  if (!formData.code.trim()) {
    alert('请输入字典编码')
    return false
  }
  if (!formData.name.trim()) {
    alert('请输入字典名称')
    return false
  }
  
  const existing = dictionaryItems.value.find(
    (i) => i.category === formData.category && i.code === formData.code && i.id !== editingItem.value?.id
  )
  if (existing) {
    alert('该分类下已存在相同编码的字典项')
    return false
  }
  
  return true
}

function handleSave() {
  if (!validateForm()) return

  if (formMode.value === 'create') {
    createDictionaryItem({
      category: formData.category,
      code: formData.code.trim(),
      name: formData.name.trim(),
      sortOrder: formData.sortOrder,
      enabled: formData.enabled,
      description: formData.description.trim() || undefined,
      color: formData.color.trim() || undefined,
      icon: formData.icon.trim() || undefined,
      extra: {},
    })
  } else if (editingItem.value) {
    updateDictionaryItem(editingItem.value.id, {
      category: formData.category,
      code: formData.code.trim(),
      name: formData.name.trim(),
      sortOrder: formData.sortOrder,
      enabled: formData.enabled,
      description: formData.description.trim() || undefined,
      color: formData.color.trim() || undefined,
      icon: formData.icon.trim() || undefined,
    })
  }

  showFormDialog.value = false
}

function openDeleteConfirm(item: DictionaryItem) {
  if (item.isSystemBuiltin) {
    alert('系统内置字典项不可删除，只能停用')
    return
  }
  deletingItem.value = item
  showDeleteConfirm.value = true
}

function handleDelete() {
  if (!deletingItem.value) return
  deleteDictionaryItem(deletingItem.value.id)
  showDeleteConfirm.value = false
  deletingItem.value = null
}

function handleToggle(item: DictionaryItem) {
  toggleDictionaryItem(item.id)
}

function handleResetDefaults() {
  showResetConfirm.value = true
}

function confirmResetDefaults() {
  resetToDefaults()
  showResetConfirm.value = false
}

function getCategoryLabel(category: DictionaryCategory): string {
  return DictionaryCategoryLabels[category] || category
}

function goToPage(page: number) {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
}

onMounted(() => {
  if (allCategories.value.length > 0) {
    formData.category = allCategories.value[0]
  }
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
          <BookOpen class="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 class="text-xl font-bold text-slate-800">数据字典管理</h1>
          <p class="text-sm text-slate-500">管理系统基础配置字典数据</p>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <button
          class="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors"
          @click="handleResetDefaults"
        >
          <RotateCcw class="w-4 h-4" />
          恢复默认
        </button>
        <button
          class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-violet-600 to-indigo-600 rounded-lg hover:from-violet-700 hover:to-indigo-700 transition-all shadow-md shadow-violet-500/20"
          @click="openCreateDialog"
        >
          <Plus class="w-4 h-4" />
          新增字典项
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="字典分类"
        :value="stats.categories"
        icon="Layers"
        gradient="from-blue-500 to-cyan-500"
      />
      <StatCard
        title="字典项总数"
        :value="stats.total"
        icon="Tag"
        gradient="from-violet-500 to-indigo-500"
      />
      <StatCard
        title="已启用"
        :value="stats.enabled"
        icon="CheckCircle2"
        gradient="from-emerald-500 to-teal-500"
      />
      <StatCard
        title="已停用"
        :value="stats.disabled"
        icon="XCircle"
        gradient="from-slate-500 to-slate-600"
      />
    </div>

    <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div class="p-4 border-b border-slate-100">
        <div class="flex flex-wrap items-center gap-4">
          <div class="flex items-center gap-2">
            <Filter class="w-4 h-4 text-slate-400" />
            <span class="text-sm font-medium text-slate-700">筛选</span>
          </div>
          
          <select
            v-model="filters.category"
            class="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white focus:border-transparent"
          >
            <option :value="undefined">全部分类</option>
            <option v-for="cat in allCategories" :key="cat" :value="cat">
              {{ getCategoryLabel(cat) }}
            </option>
          </select>

          <select
            v-model="filters.enabled"
            class="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white focus:border-transparent"
          >
            <option :value="undefined">全部状态</option>
            <option :value="true">已启用</option>
            <option :value="false">已停用</option>
          </select>

          <div class="flex-1 min-w-[200px] max-w-sm">
            <div class="relative">
              <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                v-model="filters.keyword"
                type="text"
                placeholder="搜索编码、名称..."
                class="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white focus:border-transparent placeholder:text-slate-400"
              />
            </div>
          </div>

          <button
            class="px-3 py-2 text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
            @click="resetFilters"
          >
            <RefreshCw class="w-4 h-4" />
          </button>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-slate-50 border-b border-slate-100">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">分类</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">编码</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">名称</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">排序</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">状态</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">系统内置</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">说明</th>
              <th class="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr
              v-for="item in paginatedItems"
              :key="item.id"
              class="hover:bg-slate-50 transition-colors"
            >
              <td class="px-4 py-3">
                <span class="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-violet-50 text-violet-700 border border-violet-200">
                  {{ getCategoryLabel(item.category) }}
                </span>
              </td>
              <td class="px-4 py-3">
                <code class="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs font-mono">
                  {{ item.code }}
                </code>
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center gap-2">
                  <div
                    v-if="item.color"
                    class="w-3 h-3 rounded-full flex-shrink-0"
                    :class="item.color.includes('bg-') ? item.color.split(' ')[0] : 'bg-slate-200'"
                  ></div>
                  <span class="text-sm font-medium text-slate-800">{{ item.name }}</span>
                </div>
              </td>
              <td class="px-4 py-3">
                <span class="text-sm text-slate-600">{{ item.sortOrder }}</span>
              </td>
              <td class="px-4 py-3">
                <button
                  class="p-1 rounded-lg hover:bg-slate-100 transition-colors"
                  @click="handleToggle(item)"
                >
                  <ToggleRight v-if="item.enabled" class="w-6 h-6 text-emerald-500" />
                  <ToggleLeft v-else class="w-6 h-6 text-slate-400" />
                </button>
              </td>
              <td class="px-4 py-3">
                <span
                  v-if="item.isSystemBuiltin"
                  class="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200"
                >
                  <CheckCircle2 class="w-3 h-3" />
                  是
                </span>
                <span v-else class="text-sm text-slate-400">否</span>
              </td>
              <td class="px-4 py-3">
                <span class="text-sm text-slate-500 line-clamp-1">{{ item.description || '-' }}</span>
              </td>
              <td class="px-4 py-3 text-right">
                <div class="flex items-center justify-end gap-2">
                  <button
                    class="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="编辑"
                    @click="openEditDialog(item)"
                  >
                    <Pencil class="w-4 h-4" />
                  </button>
                  <button
                    class="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    :disabled="item.isSystemBuiltin"
                    :title="item.isSystemBuiltin ? '系统内置不可删除' : '删除'"
                    @click="openDeleteConfirm(item)"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="filteredItems.length === 0">
              <td colspan="8" class="px-4 py-12 text-center">
                <div class="flex flex-col items-center gap-2">
                  <Settings class="w-10 h-10 text-slate-300" />
                  <p class="text-sm text-slate-500">暂无字典数据</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="totalPages > 1" class="px-4 py-3 border-t border-slate-100 flex items-center justify-between">
        <div class="text-sm text-slate-500">
          共 {{ filteredItems.length }} 条，第 {{ currentPage }} / {{ totalPages }} 页
        </div>
        <div class="flex items-center gap-1">
          <button
            class="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            :disabled="currentPage === 1"
            @click="goToPage(currentPage - 1)"
          >
            <ChevronLeft class="w-4 h-4 text-slate-600" />
          </button>
          <button
            v-for="page in Math.min(5, totalPages)"
            :key="page"
            class="w-8 h-8 rounded-lg text-sm font-medium transition-colors"
            :class="currentPage === page ? 'bg-violet-600 text-white' : 'hover:bg-slate-100 text-slate-600'"
            @click="goToPage(page)"
          >
            {{ page }}
          </button>
          <button
            class="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            :disabled="currentPage === totalPages"
            @click="goToPage(currentPage + 1)"
          >
            <ChevronRight class="w-4 h-4 text-slate-600" />
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="showFormDialog"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      @click.self="showFormDialog = false"
    >
      <div class="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-slate-800">
            {{ formMode === 'create' ? '新增字典项' : '编辑字典项' }}
          </h3>
          <button
            class="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            @click="showFormDialog = false"
          >
            <X class="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div class="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">
                字典分类 <span class="text-rose-500">*</span>
              </label>
              <select
                v-model="formData.category"
                class="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white focus:border-transparent"
                :disabled="formMode === 'edit' && editingItem?.isSystemBuiltin"
                @change="handleCategoryChange"
              >
                <option v-for="cat in allCategories" :key="cat" :value="cat">
                  {{ getCategoryLabel(cat) }}
                </option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">
                显示排序
              </label>
              <input
                v-model.number="formData.sortOrder"
                type="number"
                min="1"
                class="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white focus:border-transparent"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">
                字典编码 <span class="text-rose-500">*</span>
              </label>
              <input
                v-model="formData.code"
                type="text"
                placeholder="如：crown"
                class="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white focus:border-transparent font-mono"
                :disabled="formMode === 'edit' && editingItem?.isSystemBuiltin"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">
                字典名称 <span class="text-rose-500">*</span>
              </label>
              <input
                v-model="formData.name"
                type="text"
                placeholder="如：单冠"
                class="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white focus:border-transparent"
              />
            </div>
          </div>

          <div class="flex items-center gap-6">
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                v-model="formData.enabled"
                type="checkbox"
                class="w-4 h-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
              />
              <span class="text-sm text-slate-700">启用状态</span>
            </label>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">
              颜色样式
            </label>
            <input
              v-model="formData.color"
              type="text"
              placeholder="如：bg-blue-50 text-blue-700 border-blue-200"
              class="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white focus:border-transparent"
            />
            <p class="mt-1 text-xs text-slate-400">用于状态标签、徽章等组件的样式类</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">
              图标名称
            </label>
            <input
              v-model="formData.icon"
              type="text"
              placeholder="如：CheckCircle2"
              class="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white focus:border-transparent"
            />
            <p class="mt-1 text-xs text-slate-400">Lucide 图标组件名称，可选</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">
              说明
            </label>
            <textarea
              v-model="formData.description"
              rows="3"
              placeholder="字典项说明描述..."
              class="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white focus:border-transparent resize-none"
            ></textarea>
          </div>

          <div
            v-if="formMode === 'edit' && editingItem?.isSystemBuiltin"
            class="p-3 bg-amber-50 border border-amber-200 rounded-lg"
          >
            <div class="flex items-start gap-2">
              <AlertCircle class="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p class="text-sm font-medium text-amber-800">系统内置字典项</p>
                <p class="text-xs text-amber-600 mt-1">系统内置项的分类和编码不可修改，仅可调整名称、排序、状态和说明。</p>
              </div>
            </div>
          </div>
        </div>

        <div class="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            class="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            @click="showFormDialog = false"
          >
            取消
          </button>
          <button
            class="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-violet-600 to-indigo-600 rounded-lg hover:from-violet-700 hover:to-indigo-700 transition-all shadow-md shadow-violet-500/20"
            @click="handleSave"
          >
            <Save class="w-4 h-4 mr-1" />
            保存
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="showDeleteConfirm"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      @click.self="showDeleteConfirm = false"
    >
      <div class="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div class="p-6">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
              <Trash2 class="w-6 h-6 text-rose-600" />
            </div>
            <div>
              <h3 class="text-lg font-semibold text-slate-800">确认删除</h3>
              <p class="text-sm text-slate-500 mt-1">
                确定要删除字典项「{{ deletingItem?.name }}」吗？此操作不可撤销。
              </p>
            </div>
          </div>
        </div>
        <div class="px-6 py-4 bg-slate-50 flex items-center justify-end gap-3">
          <button
            class="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            @click="showDeleteConfirm = false"
          >
            取消
          </button>
          <button
            class="px-4 py-2 text-sm font-medium text-white bg-rose-600 rounded-lg hover:bg-rose-700 transition-colors"
            @click="handleDelete"
          >
            确认删除
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="showResetConfirm"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      @click.self="showResetConfirm = false"
    >
      <div class="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div class="p-6">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
              <RotateCcw class="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h3 class="text-lg font-semibold text-slate-800">恢复默认配置</h3>
              <p class="text-sm text-slate-500 mt-1">
                确定要将所有字典数据恢复为系统默认值吗？所有自定义修改将丢失，此操作不可撤销。
              </p>
            </div>
          </div>
        </div>
        <div class="px-6 py-4 bg-slate-50 flex items-center justify-end gap-3">
          <button
            class="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            @click="showResetConfirm = false"
          >
            取消
          </button>
          <button
            class="px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition-colors"
            @click="confirmResetDefaults"
          >
            确认恢复
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
