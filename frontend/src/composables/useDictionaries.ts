import { ref, computed, watch, provide, inject } from 'vue'
import type { DictionaryItem, DictionaryCategory, DictionaryFilter, ProcessingStage } from '../types'
import { DictionaryCategoryLabels } from '../types'
import { MockDictionaryItems } from '../mock/dictionaries'

const DICTIONARIES_STORAGE_KEY = 'denture-lab-dictionaries'

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0] + 'T' + date.toTimeString().split(' ')[0]
}

function loadDictionaryItems(): DictionaryItem[] {
  try {
    const raw = localStorage.getItem(DICTIONARIES_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
      }
    }
  } catch (e) {
    console.warn('Failed to load dictionary items from localStorage:', e)
  }
  return [...MockDictionaryItems]
}

const dictionaryItems = ref<DictionaryItem[]>(loadDictionaryItems())

watch(
  dictionaryItems,
  (newVal) => {
    try {
      localStorage.setItem(DICTIONARIES_STORAGE_KEY, JSON.stringify(newVal))
    } catch (e) {
      console.warn('Failed to save dictionary items:', e)
    }
  },
  { deep: true }
)

let _inited = false

export function provideDictionaries() {
  if (_inited) return
  _inited = true
  provide('dictionaries', {
    items: dictionaryItems,
  })
}

export function useDictionaries() {
  const injected = inject<{ items: typeof dictionaryItems } | null>('dictionaries', null)
  const items = injected?.items || dictionaryItems

  const allCategories = computed(() => {
    const cats = new Set<DictionaryCategory>()
    items.value.forEach((item) => cats.add(item.category))
    return Array.from(cats).sort((a, b) => {
      const aLabel = DictionaryCategoryLabels[a] || a
      const bLabel = DictionaryCategoryLabels[b] || b
      return aLabel.localeCompare(bLabel, 'zh-CN')
    })
  })

  const categoryStats = computed(() => {
    const stats: Record<string, { total: number; enabled: number; disabled: number }> = {}
    items.value.forEach((item) => {
      if (!stats[item.category]) {
        stats[item.category] = { total: 0, enabled: 0, disabled: 0 }
      }
      stats[item.category].total++
      if (item.enabled) {
        stats[item.category].enabled++
      } else {
        stats[item.category].disabled++
      }
    })
    return stats
  })

  function getDictionaryItems(category: DictionaryCategory): DictionaryItem[] {
    return items.value
      .filter((item) => item.category === category)
      .sort((a, b) => a.sortOrder - b.sortOrder)
  }

  function getEnabledDictionaryItems(category: DictionaryCategory): DictionaryItem[] {
    return getDictionaryItems(category).filter((item) => item.enabled)
  }

  function getDictionaryItem(category: DictionaryCategory, code: string): DictionaryItem | undefined {
    return items.value.find((item) => item.category === category && item.code === code)
  }

  function getDictionaryLabel(category: DictionaryCategory, code: string): string {
    const item = getDictionaryItem(category, code)
    return item?.name || code
  }

  function getDictionaryColor(category: DictionaryCategory, code: string): string | undefined {
    const item = getDictionaryItem(category, code)
    return item?.color
  }

  function searchDictionaryItems(filter: DictionaryFilter): DictionaryItem[] {
    let result = [...items.value]

    if (filter.category) {
      result = result.filter((item) => item.category === filter.category)
    }

    if (filter.enabled !== undefined) {
      result = result.filter((item) => item.enabled === filter.enabled)
    }

    if (filter.keyword) {
      const keyword = filter.keyword.toLowerCase()
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(keyword) ||
          item.code.toLowerCase().includes(keyword) ||
          (item.description && item.description.toLowerCase().includes(keyword))
      )
    }

    return result.sort((a, b) => {
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category)
      }
      return a.sortOrder - b.sortOrder
    })
  }

  function createDictionaryItem(data: Omit<DictionaryItem, 'id' | 'createdAt' | 'updatedAt' | 'isSystemBuiltin'>): DictionaryItem {
    const now = formatDate(new Date())
    const id = `DICT-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
    
    const newItem: DictionaryItem = {
      ...data,
      id,
      isSystemBuiltin: false,
      createdAt: now,
      updatedAt: now,
    }
    
    items.value.push(newItem)
    return newItem
  }

  function updateDictionaryItem(id: string, data: Partial<DictionaryItem>): DictionaryItem | null {
    const index = items.value.findIndex((item) => item.id === id)
    if (index === -1) return null

    const now = formatDate(new Date())
    items.value[index] = {
      ...items.value[index],
      ...data,
      id,
      updatedAt: now,
    }
    return items.value[index]
  }

  function toggleDictionaryItem(id: string): DictionaryItem | null {
    const item = items.value.find((i) => i.id === id)
    if (!item) return null
    return updateDictionaryItem(id, { enabled: !item.enabled })
  }

  function deleteDictionaryItem(id: string): boolean {
    const index = items.value.findIndex((item) => item.id === id)
    if (index === -1) return false
    
    const item = items.value[index]
    if (item.isSystemBuiltin) {
      console.warn('Cannot delete system builtin dictionary item')
      return false
    }
    
    items.value.splice(index, 1)
    return true
  }

  function getNextSortOrder(category: DictionaryCategory): number {
    const itemsInCategory = getDictionaryItems(category)
    if (itemsInCategory.length === 0) return 1
    return Math.max(...itemsInCategory.map((i) => i.sortOrder)) + 1
  }

  function resetToDefaults(): void {
    items.value = [...MockDictionaryItems]
  }

  function getDictionaryOptions(category: DictionaryCategory): { value: string; label: string }[] {
    return getEnabledDictionaryItems(category).map((item) => ({
      value: item.code,
      label: item.name,
    }))
  }

  function getLabelMap(category: DictionaryCategory): Record<string, string> {
    const map: Record<string, string> = {}
    getEnabledDictionaryItems(category).forEach((item) => {
      map[item.code] = item.name
    })
    return map
  }

  function getColorMap(category: DictionaryCategory): Record<string, string> {
    const map: Record<string, string> = {}
    getEnabledDictionaryItems(category).forEach((item) => {
      if (item.color) {
        map[item.code] = item.color
      }
    })
    return map
  }

  const restorationTypeLabels = computed(() => getLabelMap('restoration_type'))
  const materialTypeLabels = computed(() => getLabelMap('material_type'))
  const shadeGuideOptions = computed(() => getDictionaryOptions('shade_guide'))
  const impressionMethodLabels = computed(() => getLabelMap('impression_method'))
  const priorityLabels = computed(() => getLabelMap('priority'))
  const priorityColors = computed(() => getColorMap('priority'))
  const orderStatusLabels = computed(() => getLabelMap('order_status'))
  const orderStatusColors = computed(() => getColorMap('order_status'))
  const reworkStatusLabels = computed(() => getLabelMap('rework_status'))
  const reworkStatusColors = computed(() => getColorMap('rework_status'))
  const reworkProblemTypeLabels = computed(() => getLabelMap('rework_problem_type'))
  const reworkRootCauseLabels = computed(() => getLabelMap('rework_root_cause'))
  const reworkResponsibilityLabels = computed(() => getLabelMap('rework_responsibility'))
  const reworkSourceStageLabels = computed(() => getLabelMap('rework_source_stage'))
  const technicianSkillLabels = computed(() => getLabelMap('technician_skill'))
  const technicianSkillColors = computed(() => getColorMap('technician_skill'))
  const technicianStatusLabels = computed(() => getLabelMap('technician_status'))
  const technicianStatusColors = computed(() => getColorMap('technician_status'))
  const taskStatusLabels = computed(() => getLabelMap('task_status'))
  const taskStatusColors = computed(() => getColorMap('task_status'))
  const taskPriorityLabels = computed(() => getLabelMap('task_priority'))
  const taskPriorityColors = computed(() => getColorMap('task_priority'))
  const exceptionTypeLabels = computed(() => getLabelMap('exception_type'))
  const logisticsTypeLabels = computed(() => getLabelMap('logistics_type'))
  const signStatusLabels = computed(() => getLabelMap('sign_status'))
  const signStatusColors = computed(() => getColorMap('sign_status'))
  const logisticsExceptionTypeLabels = computed(() => getLabelMap('logistics_exception_type'))
  const shippingMethodLabels = computed(() => getLabelMap('shipping_method'))
  const cooperationStatusLabels = computed(() => getLabelMap('cooperation_status'))
  const cooperationStatusColors = computed(() => getColorMap('cooperation_status'))
  const settlementMethodLabels = computed(() => getLabelMap('settlement_method'))
  const attachmentCategoryLabels = computed(() => getLabelMap('attachment_category'))
  const attachmentCategoryColors = computed(() => getColorMap('attachment_category'))
  const attachmentFileTypeLabels = computed(() => getLabelMap('attachment_file_type'))
  const attachmentFileTypeColors = computed(() => getColorMap('attachment_file_type'))
  const attachmentRelatedModuleLabels = computed(() => getLabelMap('attachment_related_module'))
  const attachmentRelatedModuleColors = computed(() => getColorMap('attachment_related_module'))
  const communicationTypeLabels = computed(() => getLabelMap('communication_type'))
  const communicationTypeColors = computed(() => getColorMap('communication_type'))
  const qualityInspectionStageLabels = computed(() => getLabelMap('quality_inspection_stage'))
  const qualityInspectionStageColors = computed(() => getColorMap('quality_inspection_stage'))
  const qualityCheckResultLabels = computed(() => getLabelMap('quality_check_result'))
  const qualityCheckResultColors = computed(() => getColorMap('quality_check_result'))
  const qualityInspectionStatusLabels = computed(() => getLabelMap('quality_inspection_status'))
  const qualityInspectionStatusColors = computed(() => getColorMap('quality_inspection_status'))
  const defectSeverityLabels = computed(() => getLabelMap('defect_severity'))
  const defectSeverityColors = computed(() => getColorMap('defect_severity'))
  const priceRuleStatusLabels = computed(() => getLabelMap('price_rule_status'))
  const priceRuleStatusColors = computed(() => getColorMap('price_rule_status'))
  const invoiceStatusLabels = computed(() => getLabelMap('invoice_status'))
  const invoiceStatusColors = computed(() => getColorMap('invoice_status'))
  const statementStatusLabels = computed(() => getLabelMap('statement_status'))
  const statementStatusColors = computed(() => getColorMap('statement_status'))
  const technicianLevelLabels = computed(() => getLabelMap('technician_level'))
  const technicianLevelColors = computed(() => getColorMap('technician_level'))
  const notificationTypeLabels = computed(() => getLabelMap('notification_type'))
  const notificationTypeColors = computed(() => getColorMap('notification_type'))
  const notificationRoleLabels = computed(() => getLabelMap('notification_role'))
  const notificationHandleStatusLabels = computed(() => getLabelMap('notification_handle_status'))
  const notificationHandleStatusColors = computed(() => getColorMap('notification_handle_status'))
  const notificationCategoryLabels = computed(() => getLabelMap('notification_category'))
  const notificationCategoryColors = computed(() => getColorMap('notification_category'))

  const processingStages = computed(() => {
    return getEnabledDictionaryItems('processing_stage').map((item) => ({
      stage: item.code as ProcessingStage,
      label: item.name,
      description: item.extra?.description || '',
      estimatedDurationDays: item.extra?.estimatedDurationDays || 0,
    }))
  })

  return {
    dictionaryItems: items,
    allCategories,
    categoryStats,
    getDictionaryItems,
    getEnabledDictionaryItems,
    getDictionaryItem,
    getDictionaryLabel,
    getDictionaryColor,
    searchDictionaryItems,
    createDictionaryItem,
    updateDictionaryItem,
    toggleDictionaryItem,
    deleteDictionaryItem,
    getNextSortOrder,
    resetToDefaults,
    getDictionaryOptions,
    getLabelMap,
    getColorMap,
    restorationTypeLabels,
    materialTypeLabels,
    shadeGuideOptions,
    impressionMethodLabels,
    priorityLabels,
    priorityColors,
    orderStatusLabels,
    orderStatusColors,
    reworkStatusLabels,
    reworkStatusColors,
    reworkProblemTypeLabels,
    reworkRootCauseLabels,
    reworkResponsibilityLabels,
    reworkSourceStageLabels,
    technicianSkillLabels,
    technicianSkillColors,
    technicianStatusLabels,
    technicianStatusColors,
    taskStatusLabels,
    taskStatusColors,
    taskPriorityLabels,
    taskPriorityColors,
    exceptionTypeLabels,
    logisticsTypeLabels,
    signStatusLabels,
    signStatusColors,
    logisticsExceptionTypeLabels,
    shippingMethodLabels,
    cooperationStatusLabels,
    cooperationStatusColors,
    settlementMethodLabels,
    attachmentCategoryLabels,
    attachmentCategoryColors,
    attachmentFileTypeLabels,
    attachmentFileTypeColors,
    attachmentRelatedModuleLabels,
    attachmentRelatedModuleColors,
    communicationTypeLabels,
    communicationTypeColors,
    qualityInspectionStageLabels,
    qualityInspectionStageColors,
    qualityCheckResultLabels,
    qualityCheckResultColors,
    qualityInspectionStatusLabels,
    qualityInspectionStatusColors,
    defectSeverityLabels,
    defectSeverityColors,
    priceRuleStatusLabels,
    priceRuleStatusColors,
    invoiceStatusLabels,
    invoiceStatusColors,
    statementStatusLabels,
    statementStatusColors,
    technicianLevelLabels,
    technicianLevelColors,
    notificationTypeLabels,
    notificationTypeColors,
    notificationRoleLabels,
    notificationHandleStatusLabels,
    notificationHandleStatusColors,
    notificationCategoryLabels,
    notificationCategoryColors,
    processingStages,
  }
}
