import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { Order } from '../src/types'

const STORAGE_KEY = 'denture-lab-orders'
const ROLE_STORAGE_KEY = 'denture-lab-current-role'

function setupMockRole(role: string = 'dispatcher') {
  localStorage.setItem(ROLE_STORAGE_KEY, role)
}

function clearStorage() {
  localStorage.removeItem(STORAGE_KEY)
  localStorage.removeItem(ROLE_STORAGE_KEY)
}

function createMockOrder(overrides: Partial<Order> = {}): Order {
  const today = new Date()
  return {
    id: 'TEST-001',
    orderNumber: 'DD-20260620-001',
    createdAt: today.toISOString(),
    clinicId: 'C001',
    clinic: { id: 'C001', name: '明德口腔医院', contact: '李明华', phone: '010-8888-0001', clinicCode: 'MDE-001', address: '', cooperationStatus: 'active', settlementMethod: 'monthly', paymentTermDays: 30 },
    doctorName: '王医生',
    patient: { patientId: 'P001', anonymousCode: 'YK-2026-0620-A', gender: 'male', age: 30 },
    workItems: [{ toothNumber: '11', restorationType: 'crown', material: 'zirconia' }],
    impressionMethod: 'digital-scan',
    deliveryDate: new Date(today.getTime() + 2 * 86400000).toISOString().split('T')[0] + 'T18:00:00',
    priority: 'normal',
    status: 'in-progress',
    currentStage: 'wax-up',
    stageHistory: [],
    returnRecords: [],
    attachments: [],
    communications: [],
    ...overrides,
  } as Order
}

async function getOrdersComposable(role: string = 'dispatcher') {
  vi.resetModules()
  clearStorage()
  setupMockRole(role)

  const { currentRole } = await import('../src/composables/useRoles')
  currentRole.value = role as any

  const { useOrders, registerNotificationGenerator } = await import('../src/composables/useOrders')

  const generatedNotifications: any[] = []
  registerNotificationGenerator({
    generateOverdueWarning: (...args) => generatedNotifications.push({ type: 'overdue-warning', args }),
    generateDeliveryToday: (...args) => generatedNotifications.push({ type: 'delivery-today', args }),
    generateAttachmentMissing: (...args) => generatedNotifications.push({ type: 'attachment-missing', args }),
    generateStatOrder: (...args) => generatedNotifications.push({ type: 'stat-order', args }),
    generateStageCompleted: (...args) => generatedNotifications.push({ type: 'stage-completed', args }),
    generateReworkInitiated: (...args) => generatedNotifications.push({ type: 'rework-initiated', args }),
  })

  const ctx = useOrders()
  return { ctx, generatedNotifications }
}

describe('useOrders - 交期预警检查', () => {
  it('checkOrderDeliveryWarning - 今日交付应触发 delivery-today', async () => {
    const { ctx, generatedNotifications } = await getOrdersComposable()

    const today = new Date().toISOString().split('T')[0] + 'T18:00:00'
    const order = createMockOrder({ deliveryDate: today, status: 'in-progress' })

    ctx.checkOrderDeliveryWarning(order)

    expect(generatedNotifications.length).toBe(1)
    expect(generatedNotifications[0].type).toBe('delivery-today')
    expect(generatedNotifications[0].args[3]).toBe('wax-up')
  })

  it('checkOrderDeliveryWarning - 3天内交期应触发 overdue-warning', async () => {
    const { ctx, generatedNotifications } = await getOrdersComposable()

    const twoDaysLater = new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0] + 'T18:00:00'
    const order = createMockOrder({ deliveryDate: twoDaysLater, status: 'in-progress' })

    ctx.checkOrderDeliveryWarning(order)

    expect(generatedNotifications.length).toBe(1)
    expect(generatedNotifications[0].type).toBe('overdue-warning')
    expect(generatedNotifications[0].args[3]).toBe(2)
  })

  it('checkOrderDeliveryWarning - 逾期应触发 overdue-warning', async () => {
    const { ctx, generatedNotifications } = await getOrdersComposable()

    const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0] + 'T18:00:00'
    const order = createMockOrder({ deliveryDate: twoDaysAgo, status: 'in-progress' })

    ctx.checkOrderDeliveryWarning(order)

    expect(generatedNotifications.length).toBe(1)
    expect(generatedNotifications[0].type).toBe('overdue-warning')
    expect(generatedNotifications[0].args[3]).toBe(-2)
  })

  it('checkOrderDeliveryWarning - 已完成订单不应触发', async () => {
    const { ctx, generatedNotifications } = await getOrdersComposable()

    const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0] + 'T18:00:00'
    const order = createMockOrder({ deliveryDate: twoDaysAgo, status: 'completed' })

    ctx.checkOrderDeliveryWarning(order)

    expect(generatedNotifications.length).toBe(0)
  })

  it('checkOrderDeliveryWarning - 超过3天不应触发', async () => {
    const { ctx, generatedNotifications } = await getOrdersComposable()

    const tenDaysLater = new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0] + 'T18:00:00'
    const order = createMockOrder({ deliveryDate: tenDaysLater, status: 'in-progress' })

    ctx.checkOrderDeliveryWarning(order)

    expect(generatedNotifications.length).toBe(0)
  })
})

describe('useOrders - 附件缺失检查', () => {
  it('checkOrderAttachmentMissing - 缺少处方单照片应触发提醒', async () => {
    const { ctx, generatedNotifications } = await getOrdersComposable()

    const order = createMockOrder({ attachments: [] })

    ctx.checkOrderAttachmentMissing(order)

    expect(generatedNotifications.length).toBe(1)
    expect(generatedNotifications[0].type).toBe('attachment-missing')
    expect(generatedNotifications[0].args[3]).toContain('处方单照片')
  })

  it('checkOrderAttachmentMissing - 数字扫描且缺少口扫文件应提醒两项', async () => {
    const { ctx, generatedNotifications } = await getOrdersComposable()

    const order = createMockOrder({
      impressionMethod: 'digital-scan',
      attachments: [],
    })

    ctx.checkOrderAttachmentMissing(order)

    expect(generatedNotifications.length).toBe(1)
    expect(generatedNotifications[0].type).toBe('attachment-missing')
    expect(generatedNotifications[0].args[3]).toContain('处方单照片')
    expect(generatedNotifications[0].args[3]).toContain('口扫文件')
  })

  it('checkOrderAttachmentMissing - 非数字扫描且缺少口扫不应提醒口扫', async () => {
    const { ctx, generatedNotifications } = await getOrdersComposable()

    const order = createMockOrder({
      impressionMethod: 'traditional-alginate',
      attachments: [],
    })

    ctx.checkOrderAttachmentMissing(order)

    expect(generatedNotifications.length).toBe(1)
    expect(generatedNotifications[0].args[3]).toContain('处方单照片')
    expect(generatedNotifications[0].args[3]).not.toContain('口扫文件')
  })

  it('checkOrderAttachmentMissing - 附件齐全不应触发', async () => {
    const { ctx, generatedNotifications } = await getOrdersComposable()

    const order = createMockOrder({
      impressionMethod: 'digital-scan',
      attachments: [
        { id: 'A1', orderId: 'TEST-001', category: 'prescription-photo', fileName: 'rx.jpg', uploadedBy: '王医生', uploadedAt: new Date().toISOString() },
        { id: 'A2', orderId: 'TEST-001', category: 'intraoral-scan', fileName: 'scan.stl', uploadedBy: '王医生', uploadedAt: new Date().toISOString() },
      ],
    })

    ctx.checkOrderAttachmentMissing(order)

    expect(generatedNotifications.length).toBe(0)
  })

  it('checkOrderAttachmentMissing - 已完成订单不应触发', async () => {
    const { ctx, generatedNotifications } = await getOrdersComposable()

    const order = createMockOrder({ status: 'completed', attachments: [] })

    ctx.checkOrderAttachmentMissing(order)

    expect(generatedNotifications.length).toBe(0)
  })
})

describe('useOrders - 综合检查', () => {
  it('checkOrderNotifications 应同时检查交期和附件', async () => {
    const { ctx, generatedNotifications } = await getOrdersComposable()

    const today = new Date().toISOString().split('T')[0] + 'T18:00:00'
    const order = createMockOrder({
      deliveryDate: today,
      status: 'in-progress',
      attachments: [],
      impressionMethod: 'digital-scan',
    })

    ctx.checkOrderNotifications(order)

    expect(generatedNotifications.length).toBe(2)
    expect(generatedNotifications.map(n => n.type)).toContain('delivery-today')
    expect(generatedNotifications.map(n => n.type)).toContain('attachment-missing')
  })

  it('createOrder 应触发特急单通知和检查', async () => {
    const { ctx, generatedNotifications } = await getOrdersComposable()

    ctx.createOrder({
      clinicId: 'C001',
      doctorName: '王医生',
      patient: { gender: 'male', age: 30 },
      workItems: [{ toothNumber: '11', restorationType: 'crown', material: 'zirconia' }],
      impressionMethod: 'digital-scan',
      deliveryDate: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0] + 'T18:00:00',
      priority: 'stat',
    })

    const types = generatedNotifications.map(n => n.type)
    expect(types).toContain('stat-order')
    expect(types).toContain('attachment-missing')
  })

  it('updateOrder 变更交期应触发检查', async () => {
    const { ctx, generatedNotifications } = await getOrdersComposable()

    const order = ctx.createOrder({
      clinicId: 'C001',
      doctorName: '王医生',
      patient: { gender: 'male', age: 30 },
      workItems: [{ toothNumber: '11', restorationType: 'crown', material: 'zirconia' }],
      impressionMethod: 'digital-scan',
      deliveryDate: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0] + 'T18:00:00',
      priority: 'normal',
    })

    const beforeCount = generatedNotifications.length
    const today = new Date().toISOString().split('T')[0] + 'T18:00:00'
    ctx.updateOrder(order.id, { deliveryDate: today })

    expect(generatedNotifications.length).toBeGreaterThan(beforeCount)
    expect(generatedNotifications[generatedNotifications.length - 1].type).toBe('delivery-today')
  })
})
