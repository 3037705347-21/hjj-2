<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  X,
  FileSearch,
  Plus,
  Pencil,
  Trash2,
  Save,
  Check,
  CheckCircle2,
  XCircle,
  Settings,
  Zap,
  ChevronDown,
  ChevronUp,
} from 'lucide-vue-next'
import { useQualityInspection } from '../composables/useQualityInspection'
import type {
  QualityInspectionRule,
  ProcessingStage,
  QualityInspectionStage,
} from '../types'
import {
  ProcessingStages,
  QualityInspectionStageLabels,
  QualityCheckItemCategoryLabels,
} from '../types'

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  (e: 'update:show', val: boolean): void
}>()

const { getRules, getCheckItems, updateRule, createRule, deleteRule } = useQualityInspection()

const rules = ref<QualityInspectionRule[]>([])
const checkItems = computed(() => getCheckItems())

const showAddForm = ref(false)
const editingId = ref<string | null>(null)
const expandedId = ref<string | null>(null)

const formName = ref('')
const formApplicableStage = ref<ProcessingStage>('wax-up')
const formInspectionStage = ref<QualityInspectionStage>('stage-check')
const formCheckItems = ref<string[]>([])
const formIsEnabled = ref(true)
const formAutoGenerate = ref(true)
const formDescription = ref('')

watch(
  () => props.show,
  (newVal) => {
    if (newVal) {
      rules.value = getRules()
    }
  }
)

function resetForm() {
  editingId.value = null
  showAddForm.value = false
  formName.value = ''
  formApplicableStage.value = 'wax-up'
  formInspectionStage.value = 'stage-check'
  formCheckItems.value = []
  formIsEnabled.value = true
  formAutoGenerate.value = true
  formDescription.value = ''
}

function openAddForm() {
  resetForm()
  showAddForm.value = true
}

function openEditForm(rule: QualityInspectionRule) {
  editingId.value = rule.id
  showAddForm.value = true
  formName.value = rule.name
  formApplicableStage.value = rule.applicableStage
  formInspectionStage.value = rule.inspectionStage
  formCheckItems.value = [...rule.checkItems]
  formIsEnabled.value = rule.isEnabled
  formAutoGenerate.value = rule.autoGenerate
  formDescription.value = rule.description || ''
}

function toggleCheckItem(itemId: string) {
  const idx = formCheckItems.value.indexOf(itemId)
  if (idx >= 0) {
    formCheckItems.value.splice(idx, 1)
  } else {
    formCheckItems.value.push(itemId)
  }
}

function toggleExpand(ruleId: string) {
  expandedId.value = expandedId.value === ruleId ? null : ruleId
}

function isFormValid(): boolean {
  if (!formName.value.trim()) return false
  if (formCheckItems.value.length === 0) return false
  return true
}

function handleSubmit() {
  if (!isFormValid()) {
    alert('请完整填写规则名称和检查项')
    return
  }

  if (editingId.value) {
    updateRule(editingId.value, {
      name: formName.value.trim(),
      applicableStage: formApplicableStage.value,
      inspectionStage: formInspectionStage.value,
      checkItems: [...formCheckItems.value],
      isEnabled: formIsEnabled.value,
      autoGenerate: formAutoGenerate.value,
      description: formDescription.value.trim() || undefined,
    })
  } else {
    createRule({
      name: formName.value.trim(),
      applicableStage: formApplicableStage.value,
      inspectionStage: formInspectionStage.value,
      checkItems: [...formCheckItems.value],
      isEnabled: formIsEnabled.value,
      autoGenerate: formAutoGenerate.value,
      description: formDescription.value.trim() || undefined,
    })
  }

  rules.value = getRules()
  resetForm()
}

function handleDelete(ruleId: string) {
  if (!confirm('确定要删除此质检规则吗？')) return
  deleteRule(ruleId)
  rules.value = getRules()
}

function toggleEnabled(rule: QualityInspectionRule) {
  updateRule(rule.id, { isEnabled: !rule.isEnabled })
  rules.value = getRules()
}

function getStageLabel(stage: ProcessingStage) {
  return ProcessingStages.find((s) => s.stage === stage)?.label || stage
}

function getCheckItemName(itemId: string) {
  return checkItems.value.find((i) => i.id === itemId)?.name || itemId
}

function getCheckItemCategory(itemId: string) {
  const item = checkItems.value.find((i) => i.id === itemId)
  if (!item) return '其他'
  return QualityCheckItemCategoryLabels[item.category] || item.category
}

function handleClose() {
  emit('update:show', false)
}
</script>

<template>
  <Teleport to="body">
    <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" @click="handleClose"></div>
      <div class="relative bg-white rounded-xl shadow-2xl w-full max-w-3xl mx-4 overflow-hidden max-h-[90vh] flex flex-col">
        <div class="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-violet-50/50">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-violet-100 border border-violet-200 flex items-center justify-center">
              <Settings class="w-4 h-4 text-violet-600" />
            </div>
            <div>
              <h3 class="text-base font-semibold text-slate-800">质检规则配置</h3>
              <p class="text-xs text-slate-500">配置各加工阶段的质检检查项和触发规则</p>
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
          <div v-if="!showAddForm" class="flex items-center justify-between">
            <div class="text-sm text-slate-600">
              共 {{ rules.length }} 条质检规则
            </div>
            <button
              class="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-white bg-violet-600 rounded-lg hover:bg-violet-700 transition-colors shadow-sm"
              @click="openAddForm"
            >
              <Plus class="w-4 h-4" />
              新增规则
            </button>
          </div>

          <div v-if="showAddForm" class="bg-violet-50/50 border border-violet-200 rounded-xl p-5 space-y-4">
            <div class="flex items-center justify-between">
              <h4 class="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <Pencil class="w-4 h-4 text-violet-600" />
                {{ editingId ? '编辑质检规则' : '新增质检规则' }}
              </h4>
              <button
                class="text-slate-400 hover:text-slate-600 p-1"
                @click="resetForm"
              >
                <X class="w-4 h-4" />
              </button>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-medium text-slate-600 mb-1.5">
                  规则名称 <span class="text-rose-500">*</span>
                </label>
                <input
                  v-model="formName"
                  type="text"
                  placeholder="如：蜡型阶段质检规则"
                  class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent placeholder:text-slate-400 bg-white"
                />
              </div>

              <div>
                <label class="block text-xs font-medium text-slate-600 mb-1.5">
                  质检类型
                </label>
                <select
                  v-model="formInspectionStage" class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white"
                >
                  <option v-for="(label, key) in QualityInspectionStageLabels" :key="key" :value="key">
                    {{ label }}
                  </option>
                </select>
              </div>

              <div>
                <label class="block text-xs font-medium text-slate-600 mb-1.5">
                  适用加工阶段
                </label>
                <select
                  v-model="formApplicableStage" class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white"
                >
                  <option v-for="stage in ProcessingStages" :key="stage.stage" :value="stage.stage">
                    {{ stage.label }}
                  </option>
                </select>
              </div>
            </div>

            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1.5">
                检查项 <span class="text-rose-500">*</span>
                <span class="text-slate-400 font-normal">(已选 {{ formCheckItems.length }} 项)</span>
              </label>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-3 bg-white rounded-lg border border-slate-200">
                <label
                  v-for="item in checkItems.filter((i) => i.applicableStages.includes(formApplicableStage))"
                  :key="item.id"
                  class="flex items-start gap-2 p-2 rounded-md cursor-pointer transition-all"
                  :class="[
                    formCheckItems.includes(item.id)
                      ? 'bg-violet-50 border border-violet-200'
                      : 'bg-slate-50 border border-transparent hover:bg-slate-100'
                  ]"
                >
                  <input
                    type="checkbox"
                    :checked="formCheckItems.includes(item.id)"
                    @change="toggleCheckItem(item.id)"
                    class="mt-0.5 w-4 h-4 rounded border-violet-300 text-violet-600 focus:ring-violet-500"
                  />
                  <div class="flex-1 min-w-0">
                    <div class="text-sm font-medium text-slate-800 flex items-center gap-1">
                      {{ item.name }}
                      <span v-if="item.isRequired" class="text-[10px] px-1 py-0.5 rounded bg-rose-100 text-rose-600">必检</span>
                    </div>
                    <div class="text-[11px] text-slate-500 flex items-center gap-1.5">
                      <span>{{ QualityCheckItemCategoryLabels[item.category] || item.category }}</span>
                      <span v-if="item.description">· {{ item.description }}</span>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label class="flex items-center gap-2 p-3 bg-white rounded-lg border border-slate-200 cursor-pointer">
                <input
                  v-model="formIsEnabled"
                  type="checkbox"
                  class="w-4 h-4 rounded border-violet-300 text-violet-600 focus:ring-violet-500"
                />
                <div>
                  <div class="text-sm font-medium text-slate-700">启用此规则</div>
                  <div class="text-[11px] text-slate-500">关闭后该规则不会触发生成质检任务</div>
                </div>
              </label>

              <label class="flex items-center gap-2 p-3 bg-white rounded-lg border border-slate-200 cursor-pointer">
                <input
                  v-model="formAutoGenerate"
                  type="checkbox"
                  class="w-4 h-4 rounded border-violet-300 text-violet-600 focus:ring-violet-500"
                />
                <div class="flex items-center gap-1.5">
                  <Zap class="w-3.5 h-3.5 text-amber-500" />
                  <div>
                    <div class="text-sm font-medium text-slate-700">自动生成</div>
                    <div class="text-[11px] text-slate-500">阶段完成时自动创建质检任务</div>
                  </div>
                </div>
              </label>
            </div>

            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1.5">
                规则描述
              </label>
              <textarea
                v-model="formDescription"
                rows="2"
                placeholder="简要描述此质检规则的用途和注意事项"
                class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent placeholder:text-slate-400 resize-none bg-white"
              ></textarea>
            </div>

            <div class="flex items-center justify-end gap-3 pt-2 border-t border-violet-100">
              <button
                class="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
                @click="resetForm"
              >
                取消
              </button>
              <button
                class="px-5 py-2 text-sm font-semibold text-white bg-violet-600 rounded-lg hover:bg-violet-700 transition-colors shadow-sm inline-flex items-center gap-1.5"
                :disabled="!isFormValid()"
                :class="{ 'opacity-50 cursor-not-allowed': !isFormValid() }"
                @click="handleSubmit"
              >
                <Save class="w-4 h-4" />
                {{ editingId ? '保存修改' : '创建规则' }}
              </button>
            </div>
          </div>

          <div class="space-y-3">
            <div
              v-for="rule in rules"
              :key="rule.id"
              class="border rounded-xl overflow-hidden transition-all"
              :class="rule.isEnabled ? 'border-slate-200' : 'border-slate-200 bg-slate-50/50'"
            >
              <div
                class="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                @click="toggleExpand(rule.id)"
              >
                <div class="flex items-center gap-3">
                  <button
                    class="w-6 h-6 rounded flex items-center justify-center"
                    @click.stop="toggleEnabled(rule)"
                    :title="rule.isEnabled ? '点击禁用' : '点击启用'"
                  >
                    <CheckCircle2 v-if="rule.isEnabled" class="w-5 h-5 text-emerald-500" />
                    <XCircle v-else class="w-5 h-5 text-slate-400" />
                  </button>
                  <div>
                    <div class="text-sm font-semibold text-slate-800 flex items-center gap-2">
                      {{ rule.name }}
                      <span
                        v-if="rule.autoGenerate"
                        class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] bg-amber-50 text-amber-700 border border-amber-200"
                      >
                        <Zap class="w-2.5 h-2.5" />
                        自动
                      </span>
                      <span
                        class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border"
                        :class="rule.inspectionStage === 'final-check'
                          ? 'bg-violet-50 text-violet-700 border-violet-200'
                          : 'bg-blue-50 text-blue-700 border-blue-200'"
                      >
                        {{ QualityInspectionStageLabels[rule.inspectionStage] }}
                      </span>
                    </div>
                    <div class="text-xs text-slate-500 flex items-center gap-2">
                      <span>适用阶段：{{ getStageLabel(rule.applicableStage) }}</span>
                      <span>·</span>
                      <span>{{ rule.checkItems.length }} 项检查</span>
                      <span v-if="rule.description">· {{ rule.description }}</span>
                    </div>
                  </div>
                </div>

                <div class="flex items-center gap-1">
                  <button
                    class="p-1.5 text-slate-500 hover:text-violet-600 hover:bg-violet-50 rounded-md transition-colors"
                    @click.stop="openEditForm(rule)"
                  >
                    <Pencil class="w-4 h-4" />
                  </button>
                  <button
                    class="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                    @click.stop="handleDelete(rule.id)"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                  <component
                    :is="expandedId === rule.id ? ChevronUp : ChevronDown"
                    class="w-4 h-4 text-slate-400 ml-1"
                  />
                </div>
              </div>

              <div
                v-if="expandedId === rule.id"
                class="px-4 pb-4 pt-0 border-t border-slate-100"
              >
                <div class="pt-3">
                  <div class="text-xs font-medium text-slate-600 mb-2">检查项列表</div>
                  <div class="flex flex-wrap gap-2">
                    <span
                      v-for="itemId in rule.checkItems"
                      :key="itemId"
                      class="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] bg-slate-100 text-slate-700 border border-slate-200"
                    >
                      <Check class="w-3 h-3 text-emerald-500" />
                      {{ getCheckItemName(itemId) }}
                      <span class="text-slate-400">· {{ getCheckItemCategory(itemId) }}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="px-5 py-4 border-t border-slate-100 flex items-center justify-end bg-slate-50">
          <button
            class="px-5 py-2 text-sm font-semibold text-white bg-slate-700 rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
            @click="handleClose"
          >
            完成
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
