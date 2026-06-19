import { ref, computed, watch } from 'vue'
import type {
  Order,
  OrderStatus,
  OrderPriority,
  ProcessingStage,
  ToothWorkItem,
  Clinic,
  Patient,
  StageHistoryEntry,
  Attachment,
  Communication,
  AttachmentCategory,
  CommunicationType,
  ReturnRecord,
  ReworkStatus,
  ReworkSourceStage,
  ReworkProblemType,
  ReworkRootCause,
  ReworkResponsibility,
  ReworkTimelineEntry,
  ReworkStatusTransition,
} from '../types'
import { ProcessingStages, ReworkStatusLabels } from '../types'
import { MockOrders } from '../mock/orders'
import { MockClinics } from '../mock/clinics'
import { useClinics } from './useClinics'

const STORAGE_KEY = 'denture-lab-orders'

function migrateReturnRecord(record: any, order: Order): ReturnRecord {
  const now = formatDate(new Date())
  const existingRecord = record as ReturnRecord
  if (existingRecord.status && existingRecord.timeline) {
    return existingRecord
  }
  const timeline: ReworkTimelineEntry[] = [
    { status: 'initiated', timestamp: record.returnedAt || now, operator: record.responsibleTechnician || '系统', note: '返工记录创建（历史数据迁移）' },
  ]
  const statusHistory: ReworkStatusTransition[] = [
    { fromStatus: null, toStatus: 'initiated', timestamp: record.returnedAt || now, operator: record.responsibleTechnician || '系统', note: '历史数据迁移' },
  ]
  if (record.completedAt) {
    timeline.push({ status: 'closed', timestamp: record.completedAt, operator: record.responsibleTechnician || '系统', note: '返工完成（历史数据）' })
    statusHistory.push({ fromStatus: 'initiated', toStatus: 'closed', timestamp: record.completedAt, operator: record.responsibleTechnician || '系统', note: '历史数据迁移' })
  }
  return {
    id: record.id || `R${Date.now()}`,
    orderId: record.orderId || order.id,
    returnedAt: record.returnedAt || now,
    reason: record.reason || '未填写原因',
    stageReturnedFrom: record.stageReturnedFrom || order.currentStage,
    correctiveAction: record.correctiveAction || '',
    responsibleTechnician: record.responsibleTechnician,
    completedAt: record.completedAt,
    status: record.completedAt ? 'closed' : 'initiated',
    sourceStage: (record.stageReturnedFrom as ReworkSourceStage) || 'quality-check',
    problemType: 'other',
    rootCause: 'other',
    responsibility: 'other',
    relatedTeeth: order.workItems.filter(w => w.toothNumber !== 'all').map(w => w.toothNumber),
    chargeable: false,
    deadline: order.deliveryDate,
    closedAt: record.completedAt,
    closedBy: record.responsibleTechnician,
    timeline,
    statusHistory,
    stageBeforeRework: record.stageReturnedFrom || order.currentStage,
    statusBeforeRework: order.status,
  }
}

function migrateOrder(order: Order): Order {
  if (!order.stageHistory) {
    order.stageHistory = []
  }
  if (!order.returnRecords) {
    order.returnRecords = []
  } else {
    order.returnRecords = order.returnRecords.map(r => migrateReturnRecord(r, order))
  }

  const mockMatch = MockOrders.find((m) => m.id === order.id)
  if (!order.attachments || order.attachments.length === 0) {
    order.attachments = mockMatch?.attachments || []
  }
  if (!order.communications || order.communications.length === 0) {
    order.communications = mockMatch?.communications || []
  }
  return order
}

function loadOrdersFromStorage(): Order[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((o) => migrateOrder(o as Order))
      }
    }
  } catch (e) {
    console.warn('Failed to load orders from localStorage:', e)
  }
  return [...MockOrders]
}

const orders = ref<Order[]>(loadOrdersFromStorage())

watch(
  orders,
  (newVal) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newVal))
    } catch (e) {
      console.warn('Failed to save orders to localStorage:', e)
    }
  },
  { deep: true }
)

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0] + 'T' + date.toTimeString().split(' ')[0]
}

function pad(num: number, size: number = 4): string {
  return num.toString().padStart(size, '0')
}

function generateOrderNumber(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = pad(now.getMonth() + 1, 2)
  const day = pad(now.getDate(), 2)
  const todayOrders = orders.value.filter((o) => {
    const d = new Date(o.createdAt)
    return (
      d.getFullYear() === year &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    )
  })
  const seq = pad(todayOrders.length + 1, 4)
  return `DD-${year}${month}${day}-${seq}`
}

function generateOrderId(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = pad(now.getMonth() + 1, 2)
  const day = pad(now.getDate(), 2)
  const todayOrders = orders.value.filter((o) => {
    const d = new Date(o.createdAt)
    return (
      d.getFullYear() === year &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    )
  })
  const seq = pad(todayOrders.length + 1, 3)
  return `O${year}${month}${day}${seq}`
}

function generateAnonymousCode(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = pad(now.getMonth() + 1, 2)
  const day = pad(now.getDate(), 2)
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const todayCodes = new Set(
    orders.value
      .filter((o) => {
        const code = o.patient.anonymousCode
        return code.includes(`${year}-${month}${day}`)
      })
      .map((o) => o.patient.anonymousCode.slice(-1))
  )
  let letter = 'A'
  for (const l of letters) {
    if (!todayCodes.has(l)) {
      letter = l
      break
    }
  }
  return `YK-${year}-${month}${day}-${letter}`
}

function generatePatientId(): string {
  const num = orders.value.length + 1
  return `P${pad(num, 4)}`
}

function generateAttachmentId(orderId: string): string {
  const order = orders.value.find((o) => o.id === orderId)
  const seq = pad((order?.attachments.length || 0) + 1, 3)
  return `A-${orderId}-${seq}`
}

function generateCommunicationId(orderId: string): string {
  const order = orders.value.find((o) => o.id === orderId)
  const seq = pad((order?.communications.length || 0) + 1, 3)
  return `C-${orderId}-${seq}`
}

function addSystemCommunication(
  orderId: string,
  content: string,
  relatedStage?: ProcessingStage
): Communication | undefined {
  const idx = orders.value.findIndex((o) => o.id === orderId)
  if (idx === -1) return undefined

  const order = orders.value[idx]
  const now = formatDate(new Date())

  const comm: Communication = {
    id: generateCommunicationId(orderId),
    orderId,
    type: 'system-notice',
    operator: '系统',
    operatedAt: now,
    content,
    relatedStage: relatedStage || order.currentStage,
    isSystemGenerated: true,
  }

  order.communications.unshift(comm)
  orders.value[idx] = { ...order }
  return comm
}

export function useOrders() {
  const allOrders = computed(() => orders.value)

  function getOrderById(id: string): Order | undefined {
    return orders.value.find((o) => o.id === id)
  }

  function getOrdersByClinic(clinicId: string): Order[] {
    return orders.value.filter((o) => o.clinicId === clinicId)
  }

  function getClinics(): Clinic[] {
    try {
      const instance = useClinics()
      return instance.clinics.value
    } catch {
      return MockClinics as Clinic[]
    }
  }

  function getClinicById(id: string): Clinic | undefined {
    try {
      const instance = useClinics()
      return instance.getClinicById(id)
    } catch {
      return MockClinics.find((c) => c.id === id) as Clinic | undefined
    }
  }

  function createInitialStageHistory(): StageHistoryEntry[] {
    const now = formatDate(new Date())
    const firstStage = ProcessingStages[0]
    return [
      {
        stage: firstStage.stage as ProcessingStage,
        startedAt: now,
        technician: '调度员-系统',
        notes: '订单创建，自动接收',
      },
    ]
  }

  interface StageOperationParams {
    technician?: string
    notes?: string
    errorReason?: string
  }

  function getCurrentStageIndex(order: Order): number {
    return ProcessingStages.findIndex((s) => s.stage === order.currentStage)
  }

  function determineStatusFromStage(
    stage: ProcessingStage,
    hasReturnRecords: boolean
  ): OrderStatus {
    if (hasReturnRecords) return 'returned'
    if (stage === 'delivered') return 'completed'
    if (stage === 'received') return 'pending'
    return 'in-progress'
  }

  function startStage(
    orderId: string,
    params: StageOperationParams = {}
  ): Order | undefined {
    const idx = orders.value.findIndex((o) => o.id === orderId)
    if (idx === -1) return undefined

    const order = orders.value[idx]
    const now = formatDate(new Date())
    const currentEntry = order.stageHistory.find(
      (e) => e.stage === order.currentStage && !e.completedAt
    )

    if (currentEntry) {
      currentEntry.startedAt = now
      currentEntry.technician = params.technician || currentEntry.technician
      currentEntry.notes = params.notes || currentEntry.notes
    }

    order.status = determineStatusFromStage(
      order.currentStage,
      order.returnRecords.length > 0
    )

    orders.value[idx] = { ...order }
    return orders.value[idx]
  }

  function completeStage(
    orderId: string,
    params: StageOperationParams = {}
  ): Order | undefined {
    const idx = orders.value.findIndex((o) => o.id === orderId)
    if (idx === -1) return undefined

    const order = orders.value[idx]
    const now = formatDate(new Date())
    const currentIdx = getCurrentStageIndex(order)

    const currentEntry = order.stageHistory.find(
      (e) => e.stage === order.currentStage && !e.completedAt
    )
    if (currentEntry) {
      currentEntry.completedAt = now
      if (params.technician) currentEntry.technician = params.technician
      if (params.notes) currentEntry.notes = params.notes
      if (params.errorReason) currentEntry.errorReason = params.errorReason
    }

    if (currentIdx < ProcessingStages.length - 1) {
      const nextStage = ProcessingStages[currentIdx + 1].stage
      order.currentStage = nextStage
      order.stageHistory.push({
        stage: nextStage,
        startedAt: now,
        technician: '调度员-系统',
        notes: params.notes,
      })
    }

    order.status = determineStatusFromStage(
      order.currentStage,
      order.returnRecords.length > 0
    )

    orders.value[idx] = { ...order }
    return orders.value[idx]
  }

  interface InitiateReworkParams {
    sourceStage: ReworkSourceStage
    problemType: ReworkProblemType
    rootCause: ReworkRootCause
    responsibility: ReworkResponsibility
    reason: string
    correctiveAction: string
    relatedTeeth: string[]
    responsibleTechnician?: string
    chargeable: boolean
    chargeAmount?: number
    deadline: string
    targetStage?: ProcessingStage
    operator: string
  }

  function initiateRework(
    orderId: string,
    params: InitiateReworkParams
  ): Order | undefined {
    const idx = orders.value.findIndex((o) => o.id === orderId)
    if (idx === -1) return undefined

    const order = orders.value[idx]
    const now = formatDate(new Date())
    const currentIdx = getCurrentStageIndex(order)
    const stageBeforeRework = order.currentStage
    const statusBeforeRework = order.status

    const currentEntry = order.stageHistory.find(
      (e) => e.stage === order.currentStage && !e.completedAt
    )
    if (currentEntry) {
      currentEntry.completedAt = now
      if (params.responsibleTechnician) currentEntry.technician = params.responsibleTechnician
      currentEntry.errorReason = params.reason
    }

    let targetStageIdx = currentIdx - 1
    if (params.targetStage) {
      const targetIdx = ProcessingStages.findIndex((s) => s.stage === params.targetStage)
      if (targetIdx >= 0 && targetIdx < currentIdx) {
        targetStageIdx = targetIdx
      }
    }
    if (targetStageIdx < 0) targetStageIdx = 0

    const targetStage = ProcessingStages[targetStageIdx].stage
    order.currentStage = targetStage
    order.stageHistory.push({
      stage: targetStage,
      startedAt: now,
      technician: params.responsibleTechnician || '调度员-系统',
      notes: `返工回退：${params.reason}`,
      errorReason: params.reason,
    })

    const timeline: ReworkTimelineEntry[] = [
      { status: 'initiated', timestamp: now, operator: params.operator, note: params.reason },
    ]
    const statusHistory: ReworkStatusTransition[] = [
      { fromStatus: null, toStatus: 'initiated', timestamp: now, operator: params.operator, note: `发起返工，问题：${params.reason}` },
    ]

    const returnRecord: ReturnRecord = {
      id: `R${Date.now()}`,
      orderId: order.id,
      returnedAt: now,
      reason: params.reason,
      stageReturnedFrom: ProcessingStages[currentIdx].stage,
      correctiveAction: params.correctiveAction,
      responsibleTechnician: params.responsibleTechnician,
      status: 'initiated',
      sourceStage: params.sourceStage,
      problemType: params.problemType,
      rootCause: params.rootCause,
      responsibility: params.responsibility,
      relatedTeeth: params.relatedTeeth,
      chargeable: params.chargeable,
      chargeAmount: params.chargeAmount,
      deadline: params.deadline,
      timeline,
      statusHistory,
      stageBeforeRework,
      statusBeforeRework,
    }

    order.returnRecords.push(returnRecord)
    order.status = 'returned'

    addSystemCommunication(
      orderId,
      `【发起返工】从${ProcessingStages[currentIdx].label}回退至${ProcessingStages[targetStageIdx].label} | 问题类型：${params.problemType} | 原因：${params.reason} | 整改：${params.correctiveAction}`,
      ProcessingStages[currentIdx].stage
    )

    orders.value[idx] = { ...order }
    return orders.value[idx]
  }

  interface ReworkStatusUpdateParams {
    operator: string
    note?: string
  }

  function updateReworkStatus(
    orderId: string,
    reworkId: string,
    newStatus: ReworkStatus,
    params: ReworkStatusUpdateParams & {
      recheckResult?: 'pass' | 'fail'
      recheckNote?: string
      closureNote?: string
      chargeAmount?: number
    } = { operator: '系统' }
  ): Order | undefined {
    const idx = orders.value.findIndex((o) => o.id === orderId)
    if (idx === -1) return undefined

    const order = orders.value[idx]
    const reworkIdx = order.returnRecords.findIndex((r) => r.id === reworkId)
    if (reworkIdx === -1) return undefined

    const rework = order.returnRecords[reworkIdx]
    const now = formatDate(new Date())
    const oldStatus = rework.status

    rework.status = newStatus
    rework.timeline.push({
      status: newStatus,
      timestamp: now,
      operator: params.operator,
      note: params.note,
    })
    rework.statusHistory.push({
      fromStatus: oldStatus,
      toStatus: newStatus,
      timestamp: now,
      operator: params.operator,
      note: params.note,
    })

    switch (newStatus) {
      case 'accepted':
        rework.acceptanceAt = now
        rework.acceptedBy = params.operator
        addSystemCommunication(orderId, `【返工受理】记录${rework.id}已由${params.operator}受理${params.note ? `，备注：${params.note}` : ''}`, order.currentStage)
        break
      case 'rectifying':
        rework.rectificationStartAt = now
        rework.rectifiedBy = params.operator
        addSystemCommunication(orderId, `【返工整改中】${params.operator}开始整改${params.note ? `，备注：${params.note}` : ''}`, order.currentStage)
        break
      case 'rechecking':
        rework.rectificationCompleteAt = now
        rework.recheckAt = now
        rework.recheckedBy = params.operator
        addSystemCommunication(orderId, `【返工整改完成，进入复检】${params.operator}完成整改提交复检${params.note ? `，备注：${params.note}` : ''}`, order.currentStage)
        break
      case 'closed':
        rework.closedAt = now
        rework.closedBy = params.operator
        rework.completedAt = now
        if (params.recheckResult) rework.recheckResult = params.recheckResult
        if (params.recheckNote) rework.recheckNote = params.recheckNote
        if (params.closureNote) rework.closureNote = params.closureNote
        if (params.chargeAmount !== undefined) rework.chargeAmount = params.chargeAmount

        const hasActiveRework = order.returnRecords.some(
          (r, i) => i !== reworkIdx && r.status !== 'closed'
        )
        if (!hasActiveRework) {
          order.status = determineStatusFromStage(order.currentStage, false)
        }

        const resultText = params.recheckResult === 'pass' ? '复检通过' : params.recheckResult === 'fail' ? '复检不通过' : ''
        addSystemCommunication(
          orderId,
          `【返工关闭】记录${rework.id}${resultText}已关闭${params.closureNote ? `，关闭备注：${params.closureNote}` : ''}${!hasActiveRework ? '，订单返工状态已解除' : ''}`,
          order.currentStage
        )
        break
    }

    order.returnRecords[reworkIdx] = { ...rework }
    orders.value[idx] = { ...order }
    return orders.value[idx]
  }

  function acceptRework(orderId: string, reworkId: string, operator: string, note?: string): Order | undefined {
    return updateReworkStatus(orderId, reworkId, 'accepted', { operator, note })
  }

  function startRectification(orderId: string, reworkId: string, operator: string, note?: string): Order | undefined {
    return updateReworkStatus(orderId, reworkId, 'rectifying', { operator, note })
  }

  function submitForRecheck(orderId: string, reworkId: string, operator: string, note?: string): Order | undefined {
    return updateReworkStatus(orderId, reworkId, 'rechecking', { operator, note })
  }

  function closeRework(
    orderId: string,
    reworkId: string,
    operator: string,
    recheckResult: 'pass' | 'fail',
    closureNote?: string,
    recheckNote?: string,
    chargeAmount?: number
  ): Order | undefined {
    return updateReworkStatus(orderId, reworkId, 'closed', {
      operator,
      recheckResult,
      closureNote,
      recheckNote,
      chargeAmount,
    })
  }

  function getActiveRework(orderId: string): ReturnRecord | undefined {
    const order = getOrderById(orderId)
    if (!order) return undefined
    return order.returnRecords.find((r) => r.status !== 'closed')
  }

  function getAllReworks(): ReturnRecord[] {
    const result: ReturnRecord[] = []
    orders.value.forEach((order) => {
      order.returnRecords.forEach((r) => result.push(r))
    })
    return result.sort((a, b) => new Date(b.returnedAt).getTime() - new Date(a.returnedAt).getTime())
  }

  function returnToPreviousStage(
    orderId: string,
    params: StageOperationParams & {
      reason: string
      correctiveAction?: string
      responsibleTechnician?: string
    }
  ): Order | undefined {
    const order = getOrderById(orderId)
    if (!order) return undefined

    return initiateRework(orderId, {
      sourceStage: (order.currentStage as ReworkSourceStage) || 'quality-check',
      problemType: 'other',
      rootCause: 'other',
      responsibility: 'other',
      reason: params.reason,
      correctiveAction: params.correctiveAction || '待补充整改措施',
      relatedTeeth: order.workItems.filter(w => w.toothNumber !== 'all').map(w => w.toothNumber),
      responsibleTechnician: params.responsibleTechnician,
      chargeable: false,
      deadline: order.deliveryDate,
      operator: params.technician || '系统',
    })
  }

  function pauseOrder(
    orderId: string,
    params: StageOperationParams = {}
  ): Order | undefined {
    const idx = orders.value.findIndex((o) => o.id === orderId)
    if (idx === -1) return undefined

    const order = orders.value[idx]
    const now = formatDate(new Date())

    const currentEntry = order.stageHistory.find(
      (e) => e.stage === order.currentStage && !e.completedAt
    )
    if (currentEntry) {
      if (params.notes) currentEntry.notes = params.notes
      if (params.technician) currentEntry.technician = params.technician
    }

    order.status = 'on-hold'

    addSystemCommunication(
      orderId,
      `订单已暂停处理${params.notes ? `，备注：${params.notes}` : ''}`,
      order.currentStage
    )

    orders.value[idx] = { ...order }
    return orders.value[idx]
  }

  function resumeOrder(
    orderId: string,
    params: StageOperationParams = {}
  ): Order | undefined {
    const idx = orders.value.findIndex((o) => o.id === orderId)
    if (idx === -1) return undefined

    const order = orders.value[idx]
    const now = formatDate(new Date())

    order.status = determineStatusFromStage(
      order.currentStage,
      order.returnRecords.length > 0
    )

    orders.value[idx] = { ...order }
    return orders.value[idx]
  }

  function markAsShipped(
    orderId: string,
    params: StageOperationParams = {}
  ): Order | undefined {
    const idx = orders.value.findIndex((o) => o.id === orderId)
    if (idx === -1) return undefined

    const order = orders.value[idx]
    const now = formatDate(new Date())

    const currentEntry = order.stageHistory.find(
      (e) => e.stage === order.currentStage && !e.completedAt
    )
    if (currentEntry) {
      currentEntry.completedAt = now
      if (params.technician) currentEntry.technician = params.technician
      if (params.notes) currentEntry.notes = params.notes
    }

    const shippedIdx = ProcessingStages.findIndex((s) => s.stage === 'shipped')
    order.currentStage = 'shipped'
    if (!order.stageHistory.find((e) => e.stage === 'shipped' && !e.completedAt)) {
      order.stageHistory.push({
        stage: 'shipped',
        startedAt: now,
        technician: params.technician || '调度员-系统',
        notes: params.notes || '已发货',
      })
    }

    order.status = 'in-progress'

    orders.value[idx] = { ...order }
    return orders.value[idx]
  }

  function markAsDelivered(
    orderId: string,
    params: StageOperationParams = {}
  ): Order | undefined {
    const idx = orders.value.findIndex((o) => o.id === orderId)
    if (idx === -1) return undefined

    const order = orders.value[idx]
    const now = formatDate(new Date())

    const shippedEntry = order.stageHistory.find(
      (e) => e.stage === 'shipped' && !e.completedAt
    )
    if (shippedEntry) {
      shippedEntry.completedAt = now
      if (params.technician) shippedEntry.technician = params.technician
    }

    order.currentStage = 'delivered'
    order.stageHistory.push({
      stage: 'delivered',
      startedAt: now,
      completedAt: now,
      technician: params.technician || '调度员-系统',
      notes: params.notes || '诊所已签收',
    })

    order.status = 'completed'

    orders.value[idx] = { ...order }
    return orders.value[idx]
  }

  interface CreateOrderParams {
    clinicId: string
    doctorName: string
    patient: Omit<Patient, 'patientId' | 'anonymousCode'> & {
      anonymousCode?: string
      patientId?: string
    }
    workItems: ToothWorkItem[]
    impressionMethod: Order['impressionMethod']
    deliveryDate: string
    priority: OrderPriority
    specialInstructions?: string
    totalAmount?: number
  }

  function createOrder(params: CreateOrderParams): Order {
    const clinic = getClinicById(params.clinicId)!
    const now = formatDate(new Date())

    const patient: Patient = {
      patientId: params.patient.patientId || generatePatientId(),
      anonymousCode: params.patient.anonymousCode || generateAnonymousCode(),
      gender: params.patient.gender,
      age: params.patient.age,
    }

    const newOrder: Order = {
      id: generateOrderId(),
      orderNumber: generateOrderNumber(),
      createdAt: now,
      clinicId: params.clinicId,
      clinic,
      doctorName: params.doctorName,
      patient,
      workItems: params.workItems,
      impressionMethod: params.impressionMethod,
      deliveryDate: params.deliveryDate,
      priority: params.priority,
      status: 'pending',
      currentStage: 'received',
      stageHistory: createInitialStageHistory(),
      returnRecords: [],
      specialInstructions: params.specialInstructions,
      totalAmount: params.totalAmount,
      attachments: [],
      communications: [],
    }

    newOrder.communications.push({
      id: generateCommunicationId(newOrder.id),
      orderId: newOrder.id,
      type: 'system-notice',
      operator: '系统',
      operatedAt: now,
      content: `订单已创建，当前阶段：订单接收`,
      relatedStage: 'received',
      isSystemGenerated: true,
    })

    orders.value.unshift(newOrder)
    return newOrder
  }

  interface UpdateOrderParams {
    clinicId?: string
    doctorName?: string
    patient?: Partial<Patient>
    workItems?: ToothWorkItem[]
    impressionMethod?: Order['impressionMethod']
    deliveryDate?: string
    priority?: OrderPriority
    status?: OrderStatus
    specialInstructions?: string
    totalAmount?: number
  }

  function updateOrder(id: string, params: UpdateOrderParams): Order | undefined {
    const idx = orders.value.findIndex((o) => o.id === id)
    if (idx === -1) return undefined

    const existing = orders.value[idx]

    if (params.deliveryDate && params.deliveryDate !== existing.deliveryDate) {
      const oldDate = new Date(existing.deliveryDate)
      const newDate = new Date(params.deliveryDate)
      if (newDate.getTime() > oldDate.getTime()) {
        const diffDays = Math.ceil((newDate.getTime() - oldDate.getTime()) / 86400000)
        addSystemCommunication(
          id,
          `交付日期已延期，原交付日期：${existing.deliveryDate}，新交付日期：${params.deliveryDate}，延期 ${diffDays} 天`,
          existing.currentStage
        )
      }
    }

    if (params.clinicId) {
      existing.clinicId = params.clinicId
      existing.clinic = getClinicById(params.clinicId)!
    }
    if (params.doctorName !== undefined) existing.doctorName = params.doctorName
    if (params.patient) {
      existing.patient = { ...existing.patient, ...params.patient }
    }
    if (params.workItems) existing.workItems = [...params.workItems]
    if (params.impressionMethod) existing.impressionMethod = params.impressionMethod
    if (params.deliveryDate) existing.deliveryDate = params.deliveryDate
    if (params.priority) existing.priority = params.priority
    if (params.status) existing.status = params.status
    if (params.specialInstructions !== undefined)
      existing.specialInstructions = params.specialInstructions
    if (params.totalAmount !== undefined) existing.totalAmount = params.totalAmount

    orders.value[idx] = { ...existing }
    return orders.value[idx]
  }

  function copyOrder(id: string): Order | undefined {
    const source = getOrderById(id)
    if (!source) return undefined

    const newWorkItems = source.workItems.map((item) => ({ ...item }))

    return createOrder({
      clinicId: source.clinicId,
      doctorName: source.doctorName,
      patient: {
        gender: source.patient.gender,
        age: source.patient.age,
      },
      workItems: newWorkItems,
      impressionMethod: source.impressionMethod,
      deliveryDate: source.deliveryDate,
      priority: source.priority,
      specialInstructions: source.specialInstructions,
      totalAmount: source.totalAmount,
    })
  }

  function getOrders(): Order[] {
    return orders.value
  }

  interface AddAttachmentParams {
    category: AttachmentCategory
    fileName: string
    fileSize?: number
    fileType?: string
    uploadedBy: string
    description?: string
  }

  function addAttachment(
    orderId: string,
    params: AddAttachmentParams
  ): Attachment | undefined {
    const idx = orders.value.findIndex((o) => o.id === orderId)
    if (idx === -1) return undefined

    const order = orders.value[idx]
    const now = formatDate(new Date())

    const attachment: Attachment = {
      id: generateAttachmentId(orderId),
      orderId,
      category: params.category,
      fileName: params.fileName,
      fileSize: params.fileSize,
      fileType: params.fileType,
      uploadedBy: params.uploadedBy,
      uploadedAt: now,
      description: params.description,
    }

    order.attachments.push(attachment)
    orders.value[idx] = { ...order }
    return attachment
  }

  interface AddCommunicationParams {
    type: CommunicationType
    operator: string
    content: string
    relatedStage?: ProcessingStage
  }

  function addCommunication(
    orderId: string,
    params: AddCommunicationParams
  ): Communication | undefined {
    const idx = orders.value.findIndex((o) => o.id === orderId)
    if (idx === -1) return undefined

    const order = orders.value[idx]
    const now = formatDate(new Date())

    const comm: Communication = {
      id: generateCommunicationId(orderId),
      orderId,
      type: params.type,
      operator: params.operator,
      operatedAt: now,
      content: params.content,
      relatedStage: params.relatedStage || order.currentStage,
      isSystemGenerated: false,
    }

    order.communications.unshift(comm)
    orders.value[idx] = { ...order }
    return comm
  }

  return {
    orders: allOrders,
    getOrderById,
    getOrdersByClinic,
    getClinics,
    getClinicById,
    createOrder,
    updateOrder,
    copyOrder,
    getOrders,
    generateOrderNumber,
    generateAnonymousCode,
    startStage,
    completeStage,
    returnToPreviousStage,
    pauseOrder,
    resumeOrder,
    markAsShipped,
    markAsDelivered,
    addAttachment,
    addCommunication,
    addSystemCommunication,
    initiateRework,
    acceptRework,
    startRectification,
    submitForRecheck,
    closeRework,
    updateReworkStatus,
    getActiveRework,
    getAllReworks,
  }
}
