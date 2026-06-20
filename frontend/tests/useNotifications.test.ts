import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { NotificationType, NotificationRole } from '../src/types'

const NOTIFICATION_STORAGE_KEY = 'denture-lab-notifications'
const SETTINGS_STORAGE_KEY = 'denture-lab-notification-settings'
const ROLE_STORAGE_KEY = 'denture-lab-current-role'

function setupMockRole(role: string = 'dispatcher') {
  localStorage.setItem(ROLE_STORAGE_KEY, role)
}

function clearStorage() {
  localStorage.removeItem(NOTIFICATION_STORAGE_KEY)
  localStorage.removeItem(SETTINGS_STORAGE_KEY)
  localStorage.removeItem(ROLE_STORAGE_KEY)
}

async function getNotificationsComposable(role: string = 'dispatcher') {
  vi.resetModules()
  clearStorage()
  setupMockRole(role)

  const { currentRole } = await import('../src/composables/useRoles')
  currentRole.value = role as any

  const { provideNotifications } = await import('../src/composables/useNotifications')
  return provideNotifications()
}

describe('useNotifications - 去重逻辑', () => {
  it('getDedupeKey 应生成正确的去重键', async () => {
    const ctx = await getNotificationsComposable()

    const today = new Date().toISOString().split('T')[0]
    const key = ctx.getDedupeKey('O123', 'overdue-warning', '交期前3天提醒')

    expect(key).toBe(`O123:overdue-warning:交期前3天提醒:${today}`)
  })

  it('相同业务条件同日添加通知应去重', async () => {
    const ctx = await getNotificationsComposable()

    const params = {
      type: 'overdue-warning' as NotificationType,
      targetRoles: ['dispatcher'] as NotificationRole[],
      orderId: 'O001',
      orderNumber: 'DD-20260620-001',
      clinicName: '悦齿口腔',
      content: '测试通知',
      triggerCondition: '交期前3天提醒',
    }

    const result1 = ctx.addNotification(params)
    const result2 = ctx.addNotification(params)

    expect(result1).not.toBeNull()
    expect(result2).toBeNull()
    expect(ctx.allNotifications.value.filter(n => n.orderId === 'O001').length).toBe(1)
  })

  it('不同订单的相同类型通知不应去重', async () => {
    const ctx = await getNotificationsComposable()

    const baseParams = {
      type: 'overdue-warning' as NotificationType,
      targetRoles: ['dispatcher'] as NotificationRole[],
      clinicName: '悦齿口腔',
      content: '测试通知',
      triggerCondition: '交期前3天提醒',
    }

    const result1 = ctx.addNotification({ ...baseParams, orderId: 'O001', orderNumber: 'DD-20260620-001' })
    const result2 = ctx.addNotification({ ...baseParams, orderId: 'O002', orderNumber: 'DD-20260620-002' })

    expect(result1).not.toBeNull()
    expect(result2).not.toBeNull()
    expect(ctx.allNotifications.value.filter(n => n.orderId.startsWith('O00')).length).toBe(2)
  })

  it('已处理的通知允许重新生成', async () => {
    const ctx = await getNotificationsComposable()

    const params = {
      type: 'delivery-today' as NotificationType,
      targetRoles: ['dispatcher'] as NotificationRole[],
      orderId: 'O003',
      orderNumber: 'DD-20260620-003',
      clinicName: '悦齿口腔',
      content: '今日交付',
      triggerCondition: '今日需交付',
    }

    const result1 = ctx.addNotification(params)
    expect(result1).not.toBeNull()

    if (result1) {
      ctx.updateHandleStatus(result1.id, 'handled')
    }

    const result2 = ctx.addNotification(params)
    expect(result2).not.toBeNull()
  })
})

describe('useNotifications - 基础操作', () => {
  it('addNotification 应正确填充默认字段', async () => {
    const ctx = await getNotificationsComposable()

    const result = ctx.addNotification({
      type: 'stage-completed' as NotificationType,
      targetRoles: ['technician', 'dispatcher'] as NotificationRole[],
      orderId: 'O100',
      orderNumber: 'DD-20260620-100',
      clinicName: '悦齿口腔',
      content: '模型扫描已完成',
    })

    expect(result).not.toBeNull()
    if (result) {
      expect(result.id).toMatch(/^NTF-/)
      expect(result.category).toBe('stage-change')
      expect(result.isRead).toBe(false)
      expect(result.handleStatus).toBe('pending')
      expect(result.linkPath).toBe('/order/O100')
      expect(result.triggerCondition).toBeTruthy()
      expect(result.sentAt).toBeTruthy()
    }
  })

  it('markAsRead 应正确标记已读', async () => {
    const ctx = await getNotificationsComposable()

    const result = ctx.addNotification({
      type: 'overdue-warning' as NotificationType,
      targetRoles: ['dispatcher'] as NotificationRole[],
      orderId: 'O200',
      orderNumber: 'DD-20260620-200',
      clinicName: '悦齿口腔',
      content: '测试',
    })

    expect(result).not.toBeNull()
    if (result) {
      expect(result.isRead).toBe(false)
      ctx.markAsRead(result.id)
      const updated = ctx.allNotifications.value.find(n => n.id === result.id)
      expect(updated?.isRead).toBe(true)
    }
  })

  it('markAllAsRead 应标记所有为已读', async () => {
    const ctx = await getNotificationsComposable('dispatcher')

    const initialUnread = ctx.unreadCount.value

    ctx.addNotification({
      type: 'overdue-warning' as NotificationType,
      targetRoles: ['dispatcher'] as NotificationRole[],
      orderId: 'O300',
      orderNumber: 'DD-20260620-300',
      clinicName: '悦齿口腔',
      content: '测试1',
    })
    ctx.addNotification({
      type: 'delivery-today' as NotificationType,
      targetRoles: ['dispatcher'] as NotificationRole[],
      orderId: 'O301',
      orderNumber: 'DD-20260620-301',
      clinicName: '悦齿口腔',
      content: '测试2',
    })

    expect(ctx.unreadCount.value).toBe(initialUnread + 2)
    ctx.markAllAsRead()
    expect(ctx.unreadCount.value).toBe(0)
  })

  it('updateHandleStatus 应正确更新处理状态', async () => {
    const ctx = await getNotificationsComposable()

    const result = ctx.addNotification({
      type: 'attachment-missing' as NotificationType,
      targetRoles: ['clinic'] as NotificationRole[],
      orderId: 'O400',
      orderNumber: 'DD-20260620-400',
      clinicName: '悦齿口腔',
      content: '测试',
    })

    expect(result).not.toBeNull()
    if (result) {
      ctx.updateHandleStatus(result.id, 'handled')
      const updated = ctx.allNotifications.value.find(n => n.id === result.id)
      expect(updated?.handleStatus).toBe('handled')
    }
  })
})

describe('useNotifications - 分类统计', () => {
  it('getCategoryCount 应正确统计分类数量', async () => {
    const ctx = await getNotificationsComposable('dispatcher')

    ctx.addNotification({
      type: 'overdue-warning' as NotificationType,
      targetRoles: ['dispatcher'] as NotificationRole[],
      orderId: 'O500',
      orderNumber: 'DD-20260620-500',
      clinicName: '悦齿口腔',
      content: '交期预警测试',
    })
    ctx.addNotification({
      type: 'rework-initiated' as NotificationType,
      targetRoles: ['dispatcher'] as NotificationRole[],
      orderId: 'O501',
      orderNumber: 'DD-20260620-501',
      clinicName: '悦齿口腔',
      content: '返工提醒测试',
    })

    expect(ctx.getCategoryCount('delivery-warning')).toBeGreaterThanOrEqual(1)
    expect(ctx.getCategoryCount('rework-reminder')).toBeGreaterThanOrEqual(1)
  })

  it('getCategoryUnreadCount 应正确统计未读数量', async () => {
    const ctx = await getNotificationsComposable('dispatcher')

    const result = ctx.addNotification({
      type: 'stage-completed' as NotificationType,
      targetRoles: ['dispatcher'] as NotificationRole[],
      orderId: 'O600',
      orderNumber: 'DD-20260620-600',
      clinicName: '悦齿口腔',
      content: '阶段变更测试',
    })

    expect(ctx.getCategoryUnreadCount('stage-change')).toBeGreaterThanOrEqual(1)
    if (result) {
      ctx.markAsRead(result.id)
      expect(ctx.getCategoryUnreadCount('stage-change')).toBeLessThan(ctx.getCategoryCount('stage-change'))
    }
  })

  it('getCategoryPendingCount 应正确统计待处理数量', async () => {
    const ctx = await getNotificationsComposable('dispatcher')

    const result = ctx.addNotification({
      type: 'attachment-missing' as NotificationType,
      targetRoles: ['dispatcher'] as NotificationRole[],
      orderId: 'O700',
      orderNumber: 'DD-20260620-700',
      clinicName: '悦齿口腔',
      content: '附件缺失测试',
    })

    expect(ctx.getCategoryPendingCount('attachment-reminder')).toBeGreaterThanOrEqual(1)
    if (result) {
      ctx.updateHandleStatus(result.id, 'handled')
      expect(ctx.getCategoryPendingCount('attachment-reminder')).toBeLessThan(ctx.getCategoryCount('attachment-reminder'))
    }
  })
})

describe('useNotifications - 批量操作', () => {
  it('batchMarkAsRead 应批量标记已读', async () => {
    const ctx = await getNotificationsComposable('dispatcher')

    const result1 = ctx.addNotification({
      type: 'overdue-warning' as NotificationType,
      targetRoles: ['dispatcher'] as NotificationRole[],
      orderId: 'O800',
      orderNumber: 'DD-20260620-800',
      clinicName: '悦齿口腔',
      content: '批量测试1',
    })
    const result2 = ctx.addNotification({
      type: 'overdue-warning' as NotificationType,
      targetRoles: ['dispatcher'] as NotificationRole[],
      orderId: 'O801',
      orderNumber: 'DD-20260620-801',
      clinicName: '悦齿口腔',
      content: '批量测试2',
    })

    if (result1 && result2) {
      ctx.batchMarkAsRead([result1.id, result2.id])
      const updated1 = ctx.allNotifications.value.find(n => n.id === result1.id)
      const updated2 = ctx.allNotifications.value.find(n => n.id === result2.id)
      expect(updated1?.isRead).toBe(true)
      expect(updated2?.isRead).toBe(true)
    }
  })

  it('batchUpdateHandleStatus 应批量更新处理状态', async () => {
    const ctx = await getNotificationsComposable('dispatcher')

    const result1 = ctx.addNotification({
      type: 'delivery-today' as NotificationType,
      targetRoles: ['dispatcher'] as NotificationRole[],
      orderId: 'O900',
      orderNumber: 'DD-20260620-900',
      clinicName: '悦齿口腔',
      content: '批量测试3',
    })
    const result2 = ctx.addNotification({
      type: 'delivery-today' as NotificationType,
      targetRoles: ['dispatcher'] as NotificationRole[],
      orderId: 'O901',
      orderNumber: 'DD-20260620-901',
      clinicName: '悦齿口腔',
      content: '批量测试4',
    })

    if (result1 && result2) {
      ctx.batchUpdateHandleStatus([result1.id, result2.id], 'handled')
      const updated1 = ctx.allNotifications.value.find(n => n.id === result1.id)
      const updated2 = ctx.allNotifications.value.find(n => n.id === result2.id)
      expect(updated1?.handleStatus).toBe('handled')
      expect(updated2?.handleStatus).toBe('handled')
    }
  })
})

describe('useNotifications - 通知生成器', () => {
  it('generateOverdueWarning 应生成正确的逾期预警', async () => {
    const ctx = await getNotificationsComposable('dispatcher')

    const beforeCount = ctx.allNotifications.value.length
    ctx.generateOverdueWarning('O1000', 'DD-20260620-1000', '悦齿口腔', 3, 'wax-up')
    const afterCount = ctx.allNotifications.value.length

    expect(afterCount).toBe(beforeCount + 1)
    const latest = ctx.allNotifications.value[0]
    expect(latest.type).toBe('overdue-warning')
    expect(latest.category).toBe('delivery-warning')
    expect(latest.triggerCondition).toBe('交期前3天提醒')
    expect(latest.content).toContain('3天')
  })

  it('generateDeliveryToday 应生成正确的今日交付通知', async () => {
    const ctx = await getNotificationsComposable('dispatcher')

    const beforeCount = ctx.allNotifications.value.length
    ctx.generateDeliveryToday('O1001', 'DD-20260620-1001', '悦齿口腔', 'quality-check')
    const afterCount = ctx.allNotifications.value.length

    expect(afterCount).toBe(beforeCount + 1)
    const latest = ctx.allNotifications.value[0]
    expect(latest.type).toBe('delivery-today')
    expect(latest.triggerCondition).toBe('今日需交付')
    expect(latest.moduleLinkPath).toBe('/logistics/ship')
    expect(latest.moduleLabel).toBe('发货管理')
  })

  it('generateReworkInitiated 应生成正确的返工通知', async () => {
    const ctx = await getNotificationsComposable('dispatcher')

    const beforeCount = ctx.allNotifications.value.length
    ctx.generateReworkInitiated('O1002', 'DD-20260620-1002', '悦齿口腔', '边缘不密合', 'quality-check')
    const afterCount = ctx.allNotifications.value.length

    expect(afterCount).toBe(beforeCount + 1)
    const latest = ctx.allNotifications.value[0]
    expect(latest.type).toBe('rework-initiated')
    expect(latest.category).toBe('rework-reminder')
    expect(latest.content).toContain('边缘不密合')
    expect(latest.moduleLinkPath).toBe('/quality')
    expect(latest.moduleLabel).toBe('质检中心')
  })

  it('generateAttachmentMissing 应生成正确的附件缺失通知', async () => {
    const ctx = await getNotificationsComposable('clinic')

    const beforeCount = ctx.allNotifications.value.length
    ctx.generateAttachmentMissing('O1003', 'DD-20260620-1003', '悦齿口腔', '处方单照片、口扫文件')
    const afterCount = ctx.allNotifications.value.length

    expect(afterCount).toBe(beforeCount + 1)
    const latest = ctx.allNotifications.value[0]
    expect(latest.type).toBe('attachment-missing')
    expect(latest.category).toBe('attachment-reminder')
    expect(latest.triggerCondition).toContain('处方单照片')
  })

  it('generateStageCompleted 应生成正确的阶段完成通知', async () => {
    const ctx = await getNotificationsComposable('dispatcher')

    const beforeCount = ctx.allNotifications.value.length
    ctx.generateStageCompleted('O1004', 'DD-20260620-1004', '悦齿口腔', '模型扫描', '蜡型制作', 'model-scanning')
    const afterCount = ctx.allNotifications.value.length

    expect(afterCount).toBe(beforeCount + 1)
    const latest = ctx.allNotifications.value[0]
    expect(latest.type).toBe('stage-completed')
    expect(latest.category).toBe('stage-change')
    expect(latest.content).toContain('模型扫描')
    expect(latest.content).toContain('蜡型制作')
  })

  it('generateStatOrder 应生成正确的特急单通知', async () => {
    const ctx = await getNotificationsComposable('dispatcher')

    const beforeCount = ctx.allNotifications.value.length
    ctx.generateStatOrder('O1005', 'DD-20260620-1005', '悦齿口腔', 'received')
    const afterCount = ctx.allNotifications.value.length

    expect(afterCount).toBe(beforeCount + 1)
    const latest = ctx.allNotifications.value[0]
    expect(latest.type).toBe('stat-order')
    expect(latest.category).toBe('delivery-warning')
    expect(latest.moduleLinkPath).toBe('/schedule')
    expect(latest.moduleLabel).toBe('排产看板')
  })
})

describe('useNotifications - 角色过滤', () => {
  it('诊所端角色只能看到面向诊所的通知', async () => {
    const ctx = await getNotificationsComposable('clinic')

    ctx.generateOverdueWarning('O1100', 'DD-20260620-1100', '悦齿口腔', 3)
    ctx.generateAttachmentMissing('O1101', 'DD-20260620-1101', '悦齿口腔', '处方单照片')

    for (const n of ctx.roleNotifications.value) {
      expect(n.targetRoles).toContain('clinic')
    }
  })

  it('技师端角色只能看到面向技师的通知', async () => {
    const ctx = await getNotificationsComposable('technician')

    ctx.generateOverdueWarning('O1200', 'DD-20260620-1200', '悦齿口腔', 2)
    ctx.generateAttachmentMissing('O1201', 'DD-20260620-1201', '悦齿口腔', '处方单照片')

    for (const n of ctx.roleNotifications.value) {
      expect(n.targetRoles).toContain('technician')
    }
  })
})

describe('useNotifications - 通知设置', () => {
  it('isTypeEnabledForRole 应正确判断类型启用状态', async () => {
    const ctx = await getNotificationsComposable('dispatcher')

    expect(ctx.isTypeEnabledForRole('overdue-warning')).toBe(true)
    expect(ctx.isTypeEnabledForRole('delivery-today')).toBe(true)
  })

  it('updateSettings 应正确更新设置', async () => {
    const ctx = await getNotificationsComposable('dispatcher')

    const newSettings = ctx.settings.value.map(s => ({
      ...s,
      enabled: s.type === 'overdue-warning' ? false : s.enabled,
      roleEnabled: { ...s.roleEnabled },
    }))

    ctx.updateSettings(newSettings)
    expect(ctx.settings.value.find(s => s.type === 'overdue-warning')?.enabled).toBe(false)
  })
})
