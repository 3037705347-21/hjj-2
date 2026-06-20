import { ref, computed, watch } from 'vue'
import type {
  QualityInspection,
  QualityInspectionStatus,
  QualityDefectRecord,
  QualityCheckResult,
  QualityInspectionItemResult,
  QualityStatsFilter,
  QualityStatsResult,
  QualityInspectionRule,
  QualityCheckItem,
  ProcessingStage,
  ReworkProblemType,
  ReworkRootCause,
  ReworkResponsibility,
  QualityInspectionStage,
} from '../types'
import {
  ProcessingStages,
  ReworkProblemTypeLabels,
} from '../types'
import {
  MockQualityInspections,
  MockQualityCheckItems,
  MockQualityInspectionRules,
  getQualityCheckItemsByStage,
  getAllQualityInspections,
  getQualityInspectionsByOrderId,
  generateInspectionId,
  generateDefectId,
} from '../mock/quality'
import { useOrders } from './useOrders'

const STORAGE_KEY = 'denture-lab-quality-inspections'
const RULES_STORAGE_KEY = 'denture-lab-quality-rules'

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0] + 'T' + date.toTimeString().split(' ')[0]
}

function loadInspectionsFromStorage(): QualityInspection[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed as QualityInspection[]
      }
    }
  } catch (e) {
    console.warn('Failed to load quality inspections from localStorage:', e)
  }
  return [...MockQualityInspections]
}

function loadRulesFromStorage(): QualityInspectionRule[] {
  try {
    const raw = localStorage.getItem(RULES_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed as QualityInspectionRule[]
      }
    }
  } catch (e) {
    console.warn('Failed to load quality rules from localStorage:', e)
  }
  return [...MockQualityInspectionRules]
}

const inspections = ref<QualityInspection[]>(loadInspectionsFromStorage())
const rules = ref<QualityInspectionRule[]>(loadRulesFromStorage())
const checkItems = ref<QualityCheckItem[]>([...MockQualityCheckItems])

watch(
  inspections,
  (newVal) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newVal))
    } catch (e) {
      console.warn('Failed to save quality inspections to localStorage:', e)
    }
  },
  { deep: true }
)

watch(
  rules,
  (newVal) => {
    try {
      localStorage.setItem(RULES_STORAGE_KEY, JSON.stringify(newVal))
    } catch (e) {
      console.warn('Failed to save quality rules to localStorage:', e)
    }
  },
  { deep: true }
)

export function useQualityInspection() {
  const { orders, initiateRework, addSystemCommunication, closeRework } = useOrders()

  const allInspections = computed(() =>
    [...inspections.value].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  )

  function getInspectionById(id: string): QualityInspection | undefined {
    return inspections.value.find((i) => i.id === id)
  }

  function getInspectionsByOrder(orderId: string): QualityInspection[] {
    return inspections.value
      .filter((i) => i.orderId === orderId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  function getDefectsByOrder(orderId: string): QualityDefectRecord[] {
    const result: QualityDefectRecord[] = []
    inspections.value.forEach((ins) => {
      if (ins.orderId === orderId) {
        result.push(...ins.defects)
      }
    })
    return result.sort((a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime())
  }

  function getPendingInspections(): QualityInspection[] {
    return allInspections.value.filter((i) =>
      ['pending', 'in-progress', 'rejected', 'reworking', 'rechecking'].includes(i.status)
    )
  }

  function createInspection(params: {
    orderId: string
    orderNumber: string
    clinicName: string
    inspectionStage: QualityInspectionStage
    processingStage: ProcessingStage
    inspector?: string
  }): QualityInspection {
    const now = formatDate(new Date())
    const applicableItems = getQualityCheckItemsByStage(params.processingStage)
    const itemResults: QualityInspectionItemResult[] = applicableItems.map((item) => ({
      checkItemId: item.id,
      checkItemName: item.name,
      category: item.category,
      result: 'pending' as QualityCheckResult,
    }))

    const newInspection: QualityInspection = {
      id: generateInspectionId(),
      orderId: params.orderId,
      orderNumber: params.orderNumber,
      clinicName: params.clinicName,
      inspectionStage: params.inspectionStage,
      processingStage: params.processingStage,
      status: 'pending',
      itemResults,
      inspector: params.inspector,
      defects: [],
      reworkCount: 0,
      createdAt: now,
      updatedAt: now,
    }

    inspections.value.unshift(newInspection)

    const orderIdx = orders.value.findIndex((o) => o.id === params.orderId)
    if (orderIdx >= 0) {
      if (!orders.value[orderIdx].qualityInspections) {
        orders.value[orderIdx].qualityInspections = []
      }
      orders.value[orderIdx].qualityInspections.unshift(newInspection)
    }

    addSystemCommunication(
      params.orderId,
      `【质检任务创建】${params.inspectionStage === 'final-check' ? '出厂终检' : '阶段质检'}任务已创建，阶段：${ProcessingStages.find((s) => s.stage === params.processingStage)?.label || params.processingStage}`,
      params.processingStage
    )

    return newInspection
  }

  function startInspection(inspectionId: string, inspector: string): QualityInspection | undefined {
    const idx = inspections.value.findIndex((i) => i.id === inspectionId)
    if (idx === -1) return undefined

    const now = formatDate(new Date())
    const inspection = inspections.value[idx]
    inspection.status = 'in-progress'
    inspection.inspector = inspector
    inspection.startedAt = now
    inspection.updatedAt = now

    inspections.value[idx] = { ...inspection }
    syncInspectionToOrder(inspection)

    addSystemCommunication(
      inspection.orderId,
      `【开始质检】${inspector}开始进行${inspection.inspectionStage === 'final-check' ? '出厂终检' : '阶段质检'}`,
      inspection.processingStage
    )

    return inspection
  }

  function updateCheckItemResult(
    inspectionId: string,
    checkItemId: string,
    result: QualityCheckResult,
    remark?: string,
    checkedBy?: string
  ): QualityInspection | undefined {
    const idx = inspections.value.findIndex((i) => i.id === inspectionId)
    if (idx === -1) return undefined

    const now = formatDate(new Date())
    const inspection = inspections.value[idx]
    const itemIdx = inspection.itemResults.findIndex((r) => r.checkItemId === checkItemId)
    if (itemIdx >= 0) {
      inspection.itemResults[itemIdx].result = result
      inspection.itemResults[itemIdx].remark = remark
      inspection.itemResults[itemIdx].checkedBy = checkedBy || inspection.inspector
      inspection.itemResults[itemIdx].checkedAt = now
    }

    inspection.updatedAt = now
    inspections.value[idx] = { ...inspection }
    syncInspectionToOrder(inspection)

    return inspection
  }

  function completeInspection(
    inspectionId: string,
    overallResult: QualityCheckResult,
    notes?: string
  ): QualityInspection | undefined {
    const idx = inspections.value.findIndex((i) => i.id === inspectionId)
    if (idx === -1) return undefined

    const now = formatDate(new Date())
    const inspection = inspections.value[idx]
    inspection.overallResult = overallResult
    inspection.completedAt = now
    inspection.updatedAt = now
    inspection.notes = notes

    if (overallResult === 'pass' || overallResult === 'recheck-pass') {
      inspection.status = inspection.inspectionStage === 'final-check' ? 'completed' : 'completed'
    } else {
      inspection.status = 'rejected'
    }

    inspections.value[idx] = { ...inspection }
    syncInspectionToOrder(inspection)

    addSystemCommunication(
      inspection.orderId,
      `【质检完成】${inspection.inspectionStage === 'final-check' ? '出厂终检' : '阶段质检'}${overallResult === 'pass' || overallResult === 'recheck-pass' ? '合格' : '不合格'}${notes ? `，备注：${notes}` : ''}`,
      inspection.processingStage
    )

    return inspection
  }

  function registerDefect(params: {
    inspectionId: string
    orderId: string
    orderNumber: string
    problemType: ReworkProblemType
    problemDescription: string
    defectCategory: string
    severity: 'minor' | 'major' | 'critical'
    relatedTeeth: string[]
    responsibleTechnician?: string
    responsibleDepartment?: ReworkResponsibility
    rootCause: ReworkRootCause
    correctiveAction: string
    reworkDeadline: string
    registeredBy: string
    autoCreateRework?: boolean
  }): QualityDefectRecord | undefined {
    const idx = inspections.value.findIndex((i) => i.id === params.inspectionId)
    if (idx === -1) return undefined

    const now = formatDate(new Date())
    const inspection = inspections.value[idx]

    const defect: QualityDefectRecord = {
      id: generateDefectId(),
      inspectionId: params.inspectionId,
      orderId: params.orderId,
      orderNumber: params.orderNumber,
      problemType: params.problemType,
      problemDescription: params.problemDescription,
      defectCategory: params.defectCategory,
      severity: params.severity,
      relatedTeeth: params.relatedTeeth,
      responsibleTechnician: params.responsibleTechnician,
      responsibleDepartment: params.responsibleDepartment,
      rootCause: params.rootCause,
      correctiveAction: params.correctiveAction,
      reworkDeadline: params.reworkDeadline,
      registeredBy: params.registeredBy,
      registeredAt: now,
    }

    inspection.defects.push(defect)
    inspection.status = 'rejected'
    inspection.reworkCount += 1
    inspection.updatedAt = now

    inspections.value[idx] = { ...inspection }
    syncInspectionToOrder(inspection)

    if (params.autoCreateRework) {
      const rework = initiateRework(params.orderId, {
        sourceStage: (inspection.processingStage as any) || 'quality-check',
        problemType: params.problemType,
        rootCause: params.rootCause,
        responsibility: params.responsibleDepartment || 'other',
        reason: params.problemDescription,
        correctiveAction: params.correctiveAction,
        relatedTeeth: params.relatedTeeth,
        responsibleTechnician: params.responsibleTechnician,
        chargeable: false,
        deadline: params.reworkDeadline,
        operator: params.registeredBy,
      })
      if (rework) {
        const defectIdx = inspection.defects.findIndex((d) => d.id === defect.id)
        if (defectIdx >= 0) {
          const lastRework = rework.returnRecords[rework.returnRecords.length - 1]
          if (lastRework) {
            inspection.defects[defectIdx].reworkRecordId = lastRework.id
          }
        }
        inspections.value[idx] = { ...inspection }
        syncInspectionToOrder(inspection)
      }
    }

    addSystemCommunication(
      params.orderId,
      `【不合格登记】问题类型：${ReworkProblemTypeLabels[params.problemType]} | 严重程度：${params.severity === 'critical' ? '严重' : params.severity === 'major' ? '一般' : '轻微'} | 原因：${params.problemDescription}`,
      inspection.processingStage
    )

    return defect
  }

  function startReworkForDefect(
    inspectionId: string,
    defectId: string,
    operator: string
  ): QualityInspection | undefined {
    const idx = inspections.value.findIndex((i) => i.id === inspectionId)
    if (idx === -1) return undefined

    const now = formatDate(new Date())
    const inspection = inspections.value[idx]
    inspection.status = 'reworking'
    inspection.updatedAt = now

    inspections.value[idx] = { ...inspection }
    syncInspectionToOrder(inspection)

    addSystemCommunication(
      inspection.orderId,
      `【开始整改】质检不合格项进入整改阶段，操作人：${operator}`,
      inspection.processingStage
    )

    return inspection
  }

  function submitForRecheck(
    inspectionId: string,
    operator: string,
    note?: string
  ): QualityInspection | undefined {
    const idx = inspections.value.findIndex((i) => i.id === inspectionId)
    if (idx === -1) return undefined

    const now = formatDate(new Date())
    const inspection = inspections.value[idx]
    inspection.status = 'rechecking'
    inspection.updatedAt = now

    inspection.itemResults.forEach((item) => {
      if (item.result === 'fail') {
        item.result = 'pending'
      }
    })

    inspections.value[idx] = { ...inspection }
    syncInspectionToOrder(inspection)

    addSystemCommunication(
      inspection.orderId,
      `【提交复检】整改完成，申请复检${note ? `，备注：${note}` : ''}，操作人：${operator}`,
      inspection.processingStage
    )

    return inspection
  }

  function updateDefectRecheck(
    inspectionId: string,
    defectId: string,
    recheckResult: 'pass' | 'fail',
    recheckNote: string,
    recheckBy: string
  ): QualityInspection | undefined {
    const idx = inspections.value.findIndex((i) => i.id === inspectionId)
    if (idx === -1) return undefined

    const now = formatDate(new Date())
    const inspection = inspections.value[idx]
    const defectIdx = inspection.defects.findIndex((d) => d.id === defectId)
    if (defectIdx >= 0) {
      inspection.defects[defectIdx].recheckResult = recheckResult
      inspection.defects[defectIdx].recheckNote = recheckNote
      inspection.defects[defectIdx].recheckBy = recheckBy
      inspection.defects[defectIdx].recheckAt = now

      if (inspection.defects[defectIdx].reworkRecordId) {
        closeRework(
          inspection.orderId,
          inspection.defects[defectIdx].reworkRecordId!,
          recheckBy,
          recheckResult,
          recheckNote,
          recheckNote,
          0
        )
      }
    }

    const allDefectsChecked = inspection.defects.length > 0
      && inspection.defects.every((d) => d.recheckResult)
    const allDefectsPassed = allDefectsChecked
      && inspection.defects.every((d) => d.recheckResult === 'pass')
    const hasAnyFailDefect = inspection.defects.some((d) => d.recheckResult === 'fail')

    if (allDefectsPassed) {
      inspection.itemResults.forEach((item) => {
        if (item.result === 'pending' || item.result === 'fail' || item.result === 'recheck-fail') {
          item.result = 'recheck-pass'
          item.checkedBy = recheckBy
          item.checkedAt = now
          item.remark = recheckNote || item.remark
        }
      })
    }

    if (allDefectsChecked) {
      if (allDefectsPassed) {
        inspection.status = 'in-progress'
        inspection.overallResult = undefined
        inspection.completedAt = undefined
        addSystemCommunication(
          inspection.orderId,
          `【全部复检通过】所有不合格项已整改并通过复检，可继续完成质检`,
          inspection.processingStage
        )
      } else if (hasAnyFailDefect) {
        inspection.status = 'rejected'
        inspection.reworkCount += 1
        addSystemCommunication(
          inspection.orderId,
          `【复检不通过】仍存在不合格项，需继续整改`,
          inspection.processingStage
        )
      }
    } else {
      if (hasAnyFailDefect) {
        inspection.status = 'rejected'
      }
    }

    inspection.updatedAt = now
    inspections.value[idx] = { ...inspection }
    syncInspectionToOrder(inspection)

    return inspection
  }

  function releaseInspection(
    inspectionId: string,
    releasedBy: string,
    notes?: string
  ): QualityInspection | undefined {
    const idx = inspections.value.findIndex((i) => i.id === inspectionId)
    if (idx === -1) return undefined

    const now = formatDate(new Date())
    const inspection = inspections.value[idx]
    inspection.status = 'released'
    inspection.releasedAt = now
    inspection.releasedBy = releasedBy
    inspection.notes = notes || inspection.notes
    inspection.updatedAt = now

    inspections.value[idx] = { ...inspection }
    syncInspectionToOrder(inspection)

    addSystemCommunication(
      inspection.orderId,
      `【质检放行】产品通过质检，准予出厂放行，放行人员：${releasedBy}${notes ? `，备注：${notes}` : ''}`,
      inspection.processingStage
    )

    return inspection
  }

  function syncInspectionToOrder(inspection: QualityInspection) {
    const orderIdx = orders.value.findIndex((o) => o.id === inspection.orderId)
    if (orderIdx >= 0) {
      if (!orders.value[orderIdx].qualityInspections) {
        orders.value[orderIdx].qualityInspections = []
      }
      const existingIdx = orders.value[orderIdx].qualityInspections.findIndex(
        (q) => q.id === inspection.id
      )
      if (existingIdx >= 0) {
        orders.value[orderIdx].qualityInspections[existingIdx] = { ...inspection }
      } else {
        orders.value[orderIdx].qualityInspections.unshift({ ...inspection })
      }
    }
  }

  function getQualityStats(filter: QualityStatsFilter = {}): QualityStatsResult {
    let filtered = [...inspections.value]

    if (filter.startDate) {
      filtered = filtered.filter((i) => i.createdAt >= filter.startDate)
    }
    if (filter.endDate) {
      filtered = filtered.filter((i) => i.createdAt <= filter.endDate + 'T23:59:59')
    }
    if (filter.inspectionStage) {
      filtered = filtered.filter((i) => i.inspectionStage === filter.inspectionStage)
    }

    const allDefects: QualityDefectRecord[] = []
    filtered.forEach((i) => allDefects.push(...i.defects))

    let defectFiltered = allDefects
    if (filter.problemType) {
      defectFiltered = defectFiltered.filter((d) => d.problemType === filter.problemType)
    }
    if (filter.responsibleTechnician) {
      defectFiltered = defectFiltered.filter(
        (d) => d.responsibleTechnician === filter.responsibleTechnician
      )
    }

    const totalInspections = filtered.length
    const passCount = filtered.filter(
      (i) => i.overallResult === 'pass' || i.overallResult === 'recheck-pass'
    ).length
    const failCount = filtered.filter(
      (i) => i.overallResult === 'fail' || i.overallResult === 'recheck-fail'
    ).length
    const reworkCount = filtered.reduce((sum, i) => sum + i.reworkCount, 0)
    const passRate = totalInspections > 0 ? (passCount / totalInspections) * 100 : 0

    const defectTypeMap = new Map<ReworkProblemType, number>()
    defectFiltered.forEach((d) => {
      defectTypeMap.set(d.problemType, (defectTypeMap.get(d.problemType) || 0) + 1)
    })
    const defectDistribution = Array.from(defectTypeMap.entries()).map(([type, count]) => ({
      type,
      label: ReworkProblemTypeLabels[type] || type,
      count,
      percentage: defectFiltered.length > 0 ? (count / defectFiltered.length) * 100 : 0,
    })).sort((a, b) => b.count - a.count)

    const techMap = new Map<string, number>()
    defectFiltered.forEach((d) => {
      if (d.responsibleTechnician) {
        techMap.set(d.responsibleTechnician, (techMap.get(d.responsibleTechnician) || 0) + 1)
      }
    })
    const technicianDistribution = Array.from(techMap.entries()).map(([technician, count]) => ({
      technician,
      count,
      percentage: defectFiltered.length > 0 ? (count / defectFiltered.length) * 100 : 0,
    })).sort((a, b) => b.count - a.count)

    const stageMap = new Map<ProcessingStage, number>()
    filtered.forEach((i) => {
      stageMap.set(i.processingStage, (stageMap.get(i.processingStage) || 0) + 1)
    })
    const stageDistribution = Array.from(stageMap.entries()).map(([stage, count]) => ({
      stage,
      label: ProcessingStages.find((s) => s.stage === stage)?.label || stage,
      count,
      percentage: totalInspections > 0 ? (count / totalInspections) * 100 : 0,
    })).sort((a, b) => b.count - a.count)

    const dateMap = new Map<string, { total: number; pass: number; fail: number }>()
    filtered.forEach((i) => {
      const date = i.createdAt.split('T')[0]
      if (!dateMap.has(date)) {
        dateMap.set(date, { total: 0, pass: 0, fail: 0 })
      }
      const entry = dateMap.get(date)!
      entry.total += 1
      if (i.overallResult === 'pass' || i.overallResult === 'recheck-pass') {
        entry.pass += 1
      } else if (i.overallResult === 'fail' || i.overallResult === 'recheck-fail') {
        entry.fail += 1
      }
    })
    const trendData = Array.from(dateMap.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date))

    return {
      totalInspections,
      passRate,
      failCount,
      reworkCount,
      defectDistribution,
      technicianDistribution,
      stageDistribution,
      trendData,
    }
  }

  function getCheckItems(): QualityCheckItem[] {
    return [...checkItems.value]
  }

  function getRules(): QualityInspectionRule[] {
    return [...rules.value].sort((a, b) => a.applicableStage.localeCompare(b.applicableStage))
  }

  function updateRule(ruleId: string, updates: Partial<QualityInspectionRule>): QualityInspectionRule | undefined {
    const idx = rules.value.findIndex((r) => r.id === ruleId)
    if (idx === -1) return undefined

    const now = formatDate(new Date())
    rules.value[idx] = { ...rules.value[idx], ...updates, updatedAt: now }
    return rules.value[idx]
  }

  function createRule(params: Omit<QualityInspectionRule, 'id' | 'createdAt' | 'updatedAt'>): QualityInspectionRule {
    const now = formatDate(new Date())
    const newRule: QualityInspectionRule = {
      ...params,
      id: `QR-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    }
    rules.value.unshift(newRule)
    return newRule
  }

  function deleteRule(ruleId: string): boolean {
    const idx = rules.value.findIndex((r) => r.id === ruleId)
    if (idx === -1) return false
    rules.value.splice(idx, 1)
    return true
  }

  return {
    inspections: allInspections,
    getInspectionById,
    getInspectionsByOrder,
    getDefectsByOrder,
    getPendingInspections,
    createInspection,
    startInspection,
    updateCheckItemResult,
    completeInspection,
    registerDefect,
    startReworkForDefect,
    submitForRecheck,
    updateDefectRecheck,
    releaseInspection,
    getQualityStats,
    getCheckItems,
    getRules,
    updateRule,
    createRule,
    deleteRule,
  }
}
