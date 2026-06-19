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
} from '../types'
import { ProcessingStages } from '../types'
import { MockOrders, MockClinics } from '../mock/orders'

const STORAGE_KEY = 'denture-lab-orders'

function loadOrdersFromStorage(): Order[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
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

export function useOrders() {
  const allOrders = computed(() => orders.value)

  function getOrderById(id: string): Order | undefined {
    return orders.value.find((o) => o.id === id)
  }

  function getOrdersByClinic(clinicId: string): Order[] {
    return orders.value.filter((o) => o.clinicId === clinicId)
  }

  function getClinics(): Clinic[] {
    return MockClinics
  }

  function getClinicById(id: string): Clinic | undefined {
    return MockClinics.find((c) => c.id === id)
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

  function returnToPreviousStage(
    orderId: string,
    params: StageOperationParams & {
      reason: string
      correctiveAction?: string
      responsibleTechnician?: string
    }
  ): Order | undefined {
    const idx = orders.value.findIndex((o) => o.id === orderId)
    if (idx === -1) return undefined

    const order = orders.value[idx]
    const now = formatDate(new Date())
    const currentIdx = getCurrentStageIndex(order)

    if (currentIdx <= 0) return undefined

    const currentEntry = order.stageHistory.find(
      (e) => e.stage === order.currentStage && !e.completedAt
    )
    if (currentEntry) {
      currentEntry.completedAt = now
      if (params.technician) currentEntry.technician = params.technician
      if (params.notes) currentEntry.notes = params.notes
      currentEntry.errorReason = params.reason
    }

    const prevStage = ProcessingStages[currentIdx - 1].stage
    order.currentStage = prevStage
    order.stageHistory.push({
      stage: prevStage,
      startedAt: now,
      technician: params.technician || '调度员-系统',
      notes: params.notes || '退回返工',
      errorReason: params.reason,
    })

    order.returnRecords.push({
      id: `R${Date.now()}`,
      orderId: order.id,
      returnedAt: now,
      reason: params.reason,
      stageReturnedFrom: ProcessingStages[currentIdx].stage,
      correctiveAction: params.correctiveAction || '',
      responsibleTechnician: params.responsibleTechnician,
    })

    order.status = 'returned'

    orders.value[idx] = { ...order }
    return orders.value[idx]
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
    }

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
  }
}
