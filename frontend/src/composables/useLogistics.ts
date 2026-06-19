import { ref, computed, watch } from 'vue'
import type {
  LogisticsRecord,
  LogisticsType,
  SignStatus,
  ExceptionType,
  ShippingMethod,
  LogisticsTimelineEntry,
  LogisticsStats,
} from '../types'
import { MockLogistics } from '../mock/logistics'
import { useOrders } from './useOrders'

const STORAGE_KEY = 'denture-lab-logistics'

function loadLogisticsFromStorage(): LogisticsRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
      }
    }
  } catch (e) {
    console.warn('Failed to load logistics from localStorage:', e)
  }
  return [...MockLogistics]
}

const logistics = ref<LogisticsRecord[]>(loadLogisticsFromStorage())

watch(
  logistics,
  (newVal) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newVal))
    } catch (e) {
      console.warn('Failed to save logistics to localStorage:', e)
    }
  },
  { deep: true }
)

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0] + 'T' + date.toTimeString().split(' ')[0]
}

function generateLogisticsId(): string {
  const prefix = 'WL'
  const now = new Date()
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
  const count = logistics.value.filter((l) => l.createdAt.startsWith(dateStr.slice(0, 10))).length + 1
  const random = Math.random().toString(36).substring(2, 4).toUpperCase()
  return `${prefix}${dateStr}${String(count).padStart(2, '0')}${random}`
}

function generateExpressNumber(method: ShippingMethod): string {
  const prefixes: Record<ShippingMethod, string> = {
    'sf-express': 'SF',
    'jd-express': 'JD',
    'sto-express': 'STO',
    'yunda-express': 'YD',
    'zto-express': 'ZT',
    'ems': 'EM',
    'other': 'QT',
  }
  const prefix = prefixes[method] || 'EXP'
  const nums = Array.from({ length: 10 }, () => Math.floor(Math.random() * 10)).join('')
  return `${prefix}${nums}`
}

function addTimelineEntry(
  record: LogisticsRecord,
  entry: Omit<LogisticsTimelineEntry, 'id'>
): void {
  const newEntry: LogisticsTimelineEntry = {
    ...entry,
    id: `t${record.timeline.length + 1}-${Date.now()}`,
  }
  record.timeline.unshift(newEntry)
  record.updatedAt = formatDate(new Date())
}

export function useLogistics() {
  const { getOrderById, markAsShipped, markAsDelivered, addSystemCommunication } = useOrders()

  const allLogistics = computed(() => logistics.value)

  const receiveRecords = computed(() =>
    logistics.value.filter((l) => l.type === 'receive')
  )

  const shipRecords = computed(() =>
    logistics.value.filter((l) => l.type === 'ship')
  )

  const pendingShipRecords = computed(() =>
    logistics.value.filter((l) => l.type === 'ship' && l.signStatus === 'pending')
  )

  const inTransitRecords = computed(() =>
    logistics.value.filter((l) => l.type === 'ship' && l.signStatus === 'in-transit')
  )

  const exceptionRecords = computed(() =>
    logistics.value.filter((l) => l.signStatus === 'exception' && !l.exceptionHandled)
  )

  const stats = computed<LogisticsStats>(() => {
    const today = new Date().toISOString().split('T')[0]
    return {
      totalReceive: receiveRecords.value.length,
      totalShip: shipRecords.value.length,
      pendingShip: pendingShipRecords.value.length,
      inTransit: inTransitRecords.value.length,
      signedToday: logistics.value.filter(
        (l) => l.signTime && l.signTime.startsWith(today)
      ).length,
      exceptionCount: exceptionRecords.value.length,
    }
  })

  function getLogisticsById(id: string): LogisticsRecord | undefined {
    return logistics.value.find((l) => l.id === id)
  }

  function getLogisticsByOrder(orderId: string): LogisticsRecord[] {
    return logistics.value.filter((l) => l.orderId === orderId)
  }

  function getLogisticsByClinic(clinicId: string): LogisticsRecord[] {
    return logistics.value.filter((l) => l.clinicId === clinicId)
  }

  function getLogisticsByStatus(status: SignStatus): LogisticsRecord[] {
    return logistics.value.filter((l) => l.signStatus === status)
  }

  interface CreateReceiveParams {
    orderId?: string
    orderNumber?: string
    clinicId: string
    clinicName: string
    receiveTime: string
    shippingMethod: ShippingMethod
    trackingNumber: string
    receiverName: string
    receiverPhone: string
    receiverAddress: string
    notes?: string
    items?: string[]
    weight?: number
    operator: string
  }

  function createReceiveRecord(params: CreateReceiveParams): LogisticsRecord {
    const now = formatDate(new Date())
    const order = params.orderId ? getOrderById(params.orderId) : undefined

    const record: LogisticsRecord = {
      id: generateLogisticsId(),
      orderId: params.orderId || '',
      orderNumber: params.orderNumber || order?.orderNumber || '',
      clinicId: params.clinicId,
      clinicName: params.clinicName,
      type: 'receive',
      receiveTime: params.receiveTime,
      shippingMethod: params.shippingMethod,
      trackingNumber: params.trackingNumber,
      receiverName: params.receiverName,
      receiverPhone: params.receiverPhone,
      receiverAddress: params.receiverAddress,
      signStatus: 'signed',
      notes: params.notes,
      items: params.items,
      weight: params.weight,
      operator: params.operator,
      createdAt: now,
      updatedAt: now,
      timeline: [],
    }

    addTimelineEntry(record, {
      status: '快递到件',
      location: '义齿加工中心',
      description: '快递已送达加工中心',
      operator: params.operator,
      timestamp: params.receiveTime,
    })

    addTimelineEntry(record, {
      status: '验收完成',
      location: '义齿加工中心',
      description: '模型/口扫资料验收完成，已登记入库',
      operator: params.operator,
      timestamp: now,
    })

    if (params.orderId) {
      addTimelineEntry(record, {
        status: '订单关联',
        location: '调度中心',
        description: `已关联订单 ${params.orderNumber || order?.orderNumber}`,
        operator: params.operator,
        timestamp: now,
      })

      addSystemCommunication(
        params.orderId,
        `【收件登记】已收到诊所寄来的模型/口扫资料，快递单号：${params.trackingNumber}`,
        'received'
      )
    }

    logistics.value.unshift(record)
    return record
  }

  interface CreateShipParams {
    orderId: string
    orderNumber: string
    clinicId: string
    clinicName: string
    shippingMethod: ShippingMethod
    trackingNumber?: string
    receiverName: string
    receiverPhone: string
    receiverAddress: string
    notes?: string
    items?: string[]
    weight?: number
    cost?: number
    operator: string
  }

  function createShipRecord(params: CreateShipParams): LogisticsRecord {
    const now = formatDate(new Date())
    const trackingNumber = params.trackingNumber || generateExpressNumber(params.shippingMethod)

    const record: LogisticsRecord = {
      id: generateLogisticsId(),
      orderId: params.orderId,
      orderNumber: params.orderNumber,
      clinicId: params.clinicId,
      clinicName: params.clinicName,
      type: 'ship',
      shippingMethod: params.shippingMethod,
      trackingNumber,
      receiverName: params.receiverName,
      receiverPhone: params.receiverPhone,
      receiverAddress: params.receiverAddress,
      signStatus: 'pending',
      notes: params.notes,
      items: params.items,
      weight: params.weight,
      cost: params.cost,
      operator: params.operator,
      createdAt: now,
      updatedAt: now,
      timeline: [],
    }

    addTimelineEntry(record, {
      status: '成品出库',
      location: '质检部',
      description: '修复体质检通过，已出库待发货',
      operator: params.operator,
      timestamp: now,
    })

    logistics.value.unshift(record)
    return record
  }

  function confirmShipment(
    id: string,
    operator: string,
    trackingNumber?: string
  ): LogisticsRecord | undefined {
    const idx = logistics.value.findIndex((l) => l.id === id)
    if (idx === -1) return undefined

    const record = logistics.value[idx]
    const now = formatDate(new Date())

    if (trackingNumber) {
      record.trackingNumber = trackingNumber
    }

    record.shipTime = now
    record.signStatus = 'in-transit'

    addTimelineEntry(record, {
      status: '快递揽收',
      location: '义齿加工中心',
      description: '快递员已揽收包裹',
      operator,
      timestamp: now,
    })

    addTimelineEntry(record, {
      status: '运输中',
      location: '转运中心',
      description: '包裹已发出，正在运输途中',
      timestamp: now,
    })

    if (record.orderId) {
      const order = markAsShipped(record.orderId, {
        technician: operator,
        notes: `已发货，快递单号：${record.trackingNumber}`,
      })

      if (order) {
        addSystemCommunication(
          record.orderId,
          `【成品发货】修复体已发货，快递公司：${record.shippingMethod}，单号：${record.trackingNumber}`,
          'shipped'
        )
      }
    }

    logistics.value[idx] = { ...record }
    return record
  }

  function confirmDelivery(
    id: string,
    operator: string,
    signTime?: string
  ): LogisticsRecord | undefined {
    const idx = logistics.value.findIndex((l) => l.id === id)
    if (idx === -1) return undefined

    const record = logistics.value[idx]
    const now = signTime || formatDate(new Date())

    record.signTime = now
    record.signStatus = 'signed'

    addTimelineEntry(record, {
      status: '已签收',
      location: '诊所',
      description: '包裹已成功签收',
      operator,
      timestamp: now,
    })

    if (record.orderId) {
      const order = markAsDelivered(record.orderId, {
        technician: operator,
        notes: '诊所已签收',
      })

      if (order) {
        addSystemCommunication(
          record.orderId,
          `【物流签收】包裹已送达诊所，签收时间：${now}`,
          'delivered'
        )
      }
    }

    logistics.value[idx] = { ...record }
    return record
  }

  function reportException(
    id: string,
    exceptionType: ExceptionType,
    exceptionDescription: string,
    operator: string
  ): LogisticsRecord | undefined {
    const idx = logistics.value.findIndex((l) => l.id === id)
    if (idx === -1) return undefined

    const record = logistics.value[idx]
    const now = formatDate(new Date())

    record.signStatus = 'exception'
    record.exceptionType = exceptionType
    record.exceptionDescription = exceptionDescription
    record.exceptionHandled = false

    addTimelineEntry(record, {
      status: '物流异常',
      description: `异常类型：${exceptionType}，描述：${exceptionDescription}`,
      operator,
      timestamp: now,
      isException: true,
    })

    if (record.orderId) {
      addSystemCommunication(
        record.orderId,
        `【物流异常】${exceptionType}：${exceptionDescription}，快递单号：${record.trackingNumber}`,
        record.type === 'ship' ? 'shipped' : 'received'
      )
    }

    logistics.value[idx] = { ...record }
    return record
  }

  function handleException(
    id: string,
    resolution: string,
    operator: string,
    needReship?: boolean
  ): LogisticsRecord | undefined {
    const idx = logistics.value.findIndex((l) => l.id === id)
    if (idx === -1) return undefined

    const record = logistics.value[idx]
    const now = formatDate(new Date())

    record.exceptionHandled = true
    record.exceptionHandledAt = now
    record.exceptionHandledBy = operator
    record.exceptionResolution = resolution

    if (needReship) {
      record.signStatus = 'pending'
    }

    addTimelineEntry(record, {
      status: '异常处理完成',
      description: `处理方案：${resolution}${needReship ? '，将重新发货' : ''}`,
      operator,
      timestamp: now,
    })

    if (record.orderId) {
      addSystemCommunication(
        record.orderId,
        `【异常处理】${resolution}${needReship ? '，将重新安排发货' : ''}`,
        record.type === 'ship' ? 'shipped' : 'received'
      )
    }

    logistics.value[idx] = { ...record }
    return record
  }

  function addManualTimelineEntry(
    id: string,
    entry: Omit<LogisticsTimelineEntry, 'id'>
  ): LogisticsRecord | undefined {
    const record = getLogisticsById(id)
    if (!record) return undefined

    addTimelineEntry(record, entry)
    const idx = logistics.value.findIndex((l) => l.id === id)
    logistics.value[idx] = { ...record }
    return record
  }

  function updateLogistics(
    id: string,
    updates: Partial<LogisticsRecord>
  ): LogisticsRecord | undefined {
    const idx = logistics.value.findIndex((l) => l.id === id)
    if (idx === -1) return undefined

    const record = { ...logistics.value[idx], ...updates }
    record.updatedAt = formatDate(new Date())
    logistics.value[idx] = record
    return record
  }

  function deleteLogistics(id: string): boolean {
    const idx = logistics.value.findIndex((l) => l.id === id)
    if (idx === -1) return false
    logistics.value.splice(idx, 1)
    return true
  }

  return {
    logistics: allLogistics,
    receiveRecords,
    shipRecords,
    pendingShipRecords,
    inTransitRecords,
    exceptionRecords,
    stats,
    getLogisticsById,
    getLogisticsByOrder,
    getLogisticsByClinic,
    getLogisticsByStatus,
    createReceiveRecord,
    createShipRecord,
    confirmShipment,
    confirmDelivery,
    reportException,
    handleException,
    addManualTimelineEntry,
    updateLogistics,
    deleteLogistics,
    generateExpressNumber,
  }
}
