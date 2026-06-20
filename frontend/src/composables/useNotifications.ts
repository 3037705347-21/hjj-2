import { ref, computed, watch, provide, inject } from 'vue'
import type {
  Notification,
  NotificationType,
  NotificationHandleStatus,
  NotificationSetting,
  NotificationRole,
  NotificationCategory,
} from '../types'
import {
  NotificationTypeLabels,
  NotificationTypeCategoryMap,
  NotificationTriggerRules,
} from '../types'
import { MockNotifications, MockNotificationSettings } from '../mock/notifications'
import { currentRole } from './useRoles'

const NOTIFICATION_STORAGE_KEY = 'denture-lab-notifications'
const SETTINGS_STORAGE_KEY = 'denture-lab-notification-settings'

function loadNotifications(): Notification[] {
  try {
    const raw = localStorage.getItem(NOTIFICATION_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((n: any) => ({
          ...n,
          category: n.category || NotificationTypeCategoryMap[n.type as NotificationType] || 'delivery-warning',
          triggerCondition: n.triggerCondition || NotificationTriggerRules.find(r => r.type === n.type)?.description || '',
        }))
      }
    }
  } catch (e) {
    console.warn('Failed to load notifications:', e)
  }
  return [...MockNotifications]
}

function loadSettings(): NotificationSetting[] {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch (e) {
    console.warn('Failed to load notification settings:', e)
  }
  return MockNotificationSettings.map(s => ({ ...s, roleEnabled: { ...s.roleEnabled } }))
}

const notifications = ref<Notification[]>(loadNotifications())
const settings = ref<NotificationSetting[]>(loadSettings())

watch(notifications, (val) => {
  try {
    localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(val))
  } catch (e) {
    console.warn('Failed to save notifications:', e)
  }
}, { deep: true })

watch(settings, (val) => {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(val))
  } catch (e) {
    console.warn('Failed to save notification settings:', e)
  }
}, { deep: true })

function filterByRole(notifs: Notification[]): Notification[] {
  const role = currentRole.value
  return notifs.filter(n => n.targetRoles.includes(role as NotificationRole))
}

function generateNotificationId(): string {
  const seq = notifications.value.length + 1
  return `NTF-${String(seq).padStart(3, '0')}-${Date.now()}`
}

export function provideNotifications() {
  const allNotifications = computed(() => notifications.value)
  const roleNotifications = computed(() => filterByRole(notifications.value))
  const unreadCount = computed(() => roleNotifications.value.filter(n => !n.isRead).length)
  const pendingCount = computed(() => roleNotifications.value.filter(n => n.handleStatus === 'pending').length)
  const settingsList = computed(() => settings.value)

  function getCategoryCount(category: NotificationCategory): number {
    return roleNotifications.value.filter(n => n.category === category).length
  }

  function getCategoryUnreadCount(category: NotificationCategory): number {
    return roleNotifications.value.filter(n => n.category === category && !n.isRead).length
  }

  function getCategoryPendingCount(category: NotificationCategory): number {
    return roleNotifications.value.filter(n => n.category === category && n.handleStatus === 'pending').length
  }

  function getNotificationsByOrder(orderId: string): Notification[] {
    return filterByRole(notifications.value.filter(n => n.orderId === orderId))
  }

  function getNotificationsByCategory(category: NotificationCategory): Notification[] {
    return filterByRole(notifications.value.filter(n => n.category === category))
  }

  function markAsRead(id: string) {
    const idx = notifications.value.findIndex(n => n.id === id)
    if (idx !== -1) {
      notifications.value[idx] = { ...notifications.value[idx], isRead: true }
    }
  }

  function markAllAsRead() {
    const role = currentRole.value
    notifications.value.forEach((n, idx) => {
      if (n.targetRoles.includes(role as NotificationRole) && !n.isRead) {
        notifications.value[idx] = { ...n, isRead: true }
      }
    })
  }

  function batchMarkAsRead(ids: string[]) {
    ids.forEach(id => markAsRead(id))
  }

  function batchUpdateHandleStatus(ids: string[], status: NotificationHandleStatus) {
    ids.forEach(id => updateHandleStatus(id, status))
  }

  function updateHandleStatus(id: string, status: NotificationHandleStatus) {
    const idx = notifications.value.findIndex(n => n.id === id)
    if (idx !== -1) {
      notifications.value[idx] = { ...notifications.value[idx], handleStatus: status }
    }
  }

  function addNotification(params: {
    type: NotificationType
    targetRoles: NotificationRole[]
    orderId: string
    orderNumber: string
    clinicName: string
    content: string
    triggerCondition?: string
    relatedStage?: string
    linkPath?: string
    moduleLinkPath?: string
    moduleLabel?: string
  }): Notification {
    const notif: Notification = {
      id: generateNotificationId(),
      type: params.type,
      category: NotificationTypeCategoryMap[params.type],
      targetRoles: params.targetRoles,
      triggerCondition: params.triggerCondition || NotificationTriggerRules.find(r => r.type === params.type)?.description || '',
      orderId: params.orderId,
      orderNumber: params.orderNumber,
      clinicName: params.clinicName,
      content: params.content,
      isRead: false,
      handleStatus: 'pending',
      sentAt: new Date().toISOString(),
      relatedStage: params.relatedStage as Notification['relatedStage'],
      linkPath: params.linkPath || `/order/${params.orderId}`,
      moduleLinkPath: params.moduleLinkPath,
      moduleLabel: params.moduleLabel,
    }
    notifications.value.unshift(notif)
    return notif
  }

  function updateSettings(newSettings: NotificationSetting[]) {
    settings.value = newSettings.map(s => ({ ...s, roleEnabled: { ...s.roleEnabled } }))
  }

  function isTypeEnabledForRole(type: NotificationType): boolean {
    const setting = settings.value.find(s => s.type === type)
    if (!setting || !setting.enabled) return false
    return setting.roleEnabled[currentRole.value as NotificationRole] ?? false
  }

  function generateOverdueWarning(orderId: string, orderNumber: string, clinicName: string, daysLeft: number, stage?: string) {
    if (!isTypeEnabledForRole('overdue-warning')) return
    const rule = NotificationTriggerRules.find(r => r.type === 'overdue-warning')
    const triggerCondition = daysLeft < 0 ? `已超出交期${Math.abs(daysLeft)}天` : `交期前${daysLeft}天提醒`
    addNotification({
      type: 'overdue-warning',
      targetRoles: rule?.targetRoles || ['dispatcher', 'technician'],
      orderId,
      orderNumber,
      clinicName,
      content: daysLeft < 0
        ? `订单 ${orderNumber} 已超出交期${Math.abs(daysLeft)}天，请立即处理`
        : `订单 ${orderNumber} 交期将至，距离交付日仅剩${daysLeft}天，请加快进度`,
      triggerCondition,
      relatedStage: stage,
      moduleLinkPath: daysLeft <= 0 ? '/logistics/ship' : undefined,
      moduleLabel: daysLeft <= 0 ? '发货管理' : undefined,
    })
  }

  function generateDeliveryToday(orderId: string, orderNumber: string, clinicName: string, stage?: string) {
    if (!isTypeEnabledForRole('delivery-today')) return
    const rule = NotificationTriggerRules.find(r => r.type === 'delivery-today')
    addNotification({
      type: 'delivery-today',
      targetRoles: rule?.targetRoles || ['dispatcher', 'technician', 'clinic'],
      orderId,
      orderNumber,
      clinicName,
      content: `订单 ${orderNumber} 今日交付，请确认发货安排`,
      triggerCondition: '今日需交付',
      relatedStage: stage,
      moduleLinkPath: '/logistics/ship',
      moduleLabel: '发货管理',
    })
  }

  function generateStatOrder(orderId: string, orderNumber: string, clinicName: string, stage?: string) {
    if (!isTypeEnabledForRole('stat-order')) return
    const rule = NotificationTriggerRules.find(r => r.type === 'stat-order')
    addNotification({
      type: 'stat-order',
      targetRoles: rule?.targetRoles || ['dispatcher', 'technician'],
      orderId,
      orderNumber,
      clinicName,
      content: `特急单 ${orderNumber} 已创建，请优先安排生产`,
      triggerCondition: '特急单创建',
      relatedStage: stage,
      moduleLinkPath: '/schedule',
      moduleLabel: '排产看板',
    })
  }

  function generateReworkInitiated(orderId: string, orderNumber: string, clinicName: string, reason: string, stage?: string) {
    if (!isTypeEnabledForRole('rework-initiated')) return
    const rule = NotificationTriggerRules.find(r => r.type === 'rework-initiated')
    addNotification({
      type: 'rework-initiated',
      targetRoles: rule?.targetRoles || ['dispatcher', 'technician', 'clinic'],
      orderId,
      orderNumber,
      clinicName,
      content: `订单 ${orderNumber} 已发起返工，原因：${reason}`,
      triggerCondition: '返工发起',
      relatedStage: stage,
      moduleLinkPath: '/quality',
      moduleLabel: '质检中心',
    })
  }

  function generateStageCompleted(orderId: string, orderNumber: string, clinicName: string, stageLabel: string, nextStageLabel: string, stage?: string) {
    if (!isTypeEnabledForRole('stage-completed')) return
    const rule = NotificationTriggerRules.find(r => r.type === 'stage-completed')
    addNotification({
      type: 'stage-completed',
      targetRoles: rule?.targetRoles || ['dispatcher', 'technician'],
      orderId,
      orderNumber,
      clinicName,
      content: `订单 ${orderNumber} ${stageLabel}已完成，可进入${nextStageLabel}阶段`,
      triggerCondition: `${stageLabel}阶段完成`,
      relatedStage: stage,
    })
  }

  function generateAttachmentMissing(orderId: string, orderNumber: string, clinicName: string, missingTypes: string) {
    if (!isTypeEnabledForRole('attachment-missing')) return
    const rule = NotificationTriggerRules.find(r => r.type === 'attachment-missing')
    addNotification({
      type: 'attachment-missing',
      targetRoles: rule?.targetRoles || ['clinic', 'dispatcher'],
      orderId,
      orderNumber,
      clinicName,
      content: `订单 ${orderNumber} 缺少${missingTypes}，请尽快补传`,
      triggerCondition: `缺少${missingTypes}`,
    })
  }

  return {
    allNotifications,
    roleNotifications,
    unreadCount,
    pendingCount,
    settings: settingsList,
    getCategoryCount,
    getCategoryUnreadCount,
    getCategoryPendingCount,
    getNotificationsByOrder,
    getNotificationsByCategory,
    markAsRead,
    markAllAsRead,
    batchMarkAsRead,
    batchUpdateHandleStatus,
    updateHandleStatus,
    addNotification,
    updateSettings,
    isTypeEnabledForRole,
    generateOverdueWarning,
    generateDeliveryToday,
    generateStatOrder,
    generateReworkInitiated,
    generateStageCompleted,
    generateAttachmentMissing,
  }
}

const NotificationSymbol = Symbol('notifications')

export function provideNotificationContext() {
  const ctx = provideNotifications()
  return ctx
}

export function provideNotificationSystem() {
  const ctx = provideNotifications()
  provide(NotificationSymbol, ctx)
  return ctx
}

export function useNotifications() {
  const injected = inject(NotificationSymbol)
  if (injected) {
    return injected as ReturnType<typeof provideNotifications>
  }
  return provideNotifications()
}
