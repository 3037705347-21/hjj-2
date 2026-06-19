import { ref, computed, inject, provide } from 'vue'
import type { Order, ProcessingStage } from '../types'

export type Role = 'clinic' | 'technician' | 'dispatcher'

export const ROLE_LABELS: Record<Role, string> = {
  clinic: '诊所端',
  technician: '技师端',
  dispatcher: '调度员',
}

export const ROLE_COLORS: Record<Role, string> = {
  clinic: 'bg-sky-100 text-sky-700 border-sky-200',
  technician: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  dispatcher: 'bg-violet-100 text-violet-700 border-violet-200',
}

export interface FieldPermission {
  visible: boolean
  editable: boolean
}

export interface OrderPermissions {
  fields: Record<string, FieldPermission>
  actions: {
    create: boolean
    edit: boolean
    copy: boolean
    delete: boolean
    startStage: boolean
    completeStage: boolean
    returnStage: boolean
    pause: boolean
    resume: boolean
    ship: boolean
    deliver: boolean
    initiateRework: boolean
    editPriority: boolean
    editClinicInfo: boolean
    editInternalCost: boolean
    editResponsibleTechnician: boolean
    editPatientInfo: boolean
    viewInternalNotes: boolean
    viewReworkCost: boolean
  }
}

export const ROLE_STORAGE_KEY = 'denture-lab-current-role'
export const TECHNICIAN_NAME_KEY = 'denture-lab-technician-name'

function loadInitialRole(): Role {
  try {
    const saved = localStorage.getItem(ROLE_STORAGE_KEY)
    if (saved && ['clinic', 'technician', 'dispatcher'].includes(saved)) {
      return saved as Role
    }
  } catch (e) {
    console.warn('Failed to load role from storage:', e)
  }
  return 'dispatcher'
}

function loadInitialTechnicianName(): string {
  try {
    const saved = localStorage.getItem(TECHNICIAN_NAME_KEY)
    return saved || ''
  } catch (e) {
    return ''
  }
}

export const currentRole = ref<Role>(loadInitialRole())
export const currentTechnicianName = ref<string>(loadInitialTechnicianName())

function persistRole(role: Role) {
  try {
    localStorage.setItem(ROLE_STORAGE_KEY, role)
  } catch (e) {
    console.warn('Failed to save role to storage:', e)
  }
}

function persistTechnicianName(name: string) {
  try {
    localStorage.setItem(TECHNICIAN_NAME_KEY, name)
  } catch (e) {
    console.warn('Failed to save technician name:', e)
  }
}

const baseFieldPermissions: Record<string, FieldPermission> = {
  orderNumber: { visible: true, editable: false },
  createdAt: { visible: true, editable: false },
  clinicId: { visible: true, editable: false },
  clinic: { visible: true, editable: false },
  clinicInfo: { visible: true, editable: false },
  doctorName: { visible: true, editable: false },
  patient: { visible: true, editable: false },
  workItems: { visible: true, editable: false },
  impressionMethod: { visible: true, editable: false },
  deliveryDate: { visible: true, editable: false },
  priority: { visible: true, editable: false },
  status: { visible: true, editable: false },
  currentStage: { visible: true, editable: false },
  stageHistory: { visible: true, editable: false },
  returnRecords: { visible: true, editable: false },
  specialInstructions: { visible: true, editable: false },
  totalAmount: { visible: false, editable: false },
  attachments: { visible: true, editable: false },
  communications: { visible: true, editable: false },
  internalCost: { visible: false, editable: false },
  responsibleTechnician: { visible: false, editable: false },
}

function getClinicPermissions(): OrderPermissions {
  const fields = { ...baseFieldPermissions }
  fields.clinic = { visible: true, editable: false }
  fields.clinicInfo = { visible: true, editable: false }
  fields.doctorName = { visible: true, editable: true }
  fields.patient = { visible: true, editable: true }
  fields.workItems = { visible: true, editable: true }
  fields.impressionMethod = { visible: true, editable: true }
  fields.deliveryDate = { visible: true, editable: true }
  fields.specialInstructions = { visible: true, editable: true }
  fields.attachments = { visible: true, editable: true }
  fields.communications = { visible: true, editable: true }
  fields.priority = { visible: true, editable: false }
  fields.internalCost = { visible: false, editable: false }
  fields.responsibleTechnician = { visible: false, editable: false }
  fields.totalAmount = { visible: true, editable: false }
  fields.stageHistory = { visible: true, editable: false }
  fields.returnRecords = { visible: true, editable: false }

  return {
    fields,
    actions: {
      create: true,
      edit: true,
      copy: true,
      delete: false,
      startStage: false,
      completeStage: false,
      returnStage: false,
      pause: false,
      resume: false,
      ship: false,
      deliver: true,
      initiateRework: false,
      editPriority: false,
      editClinicInfo: false,
      editInternalCost: false,
      editResponsibleTechnician: false,
      editPatientInfo: true,
      viewInternalNotes: false,
      viewReworkCost: false,
    },
  }
}

function getTechnicianPermissions(): OrderPermissions {
  const fields = { ...baseFieldPermissions }
  fields.clinic = { visible: true, editable: false }
  fields.clinicInfo = { visible: false, editable: false }
  fields.doctorName = { visible: true, editable: false }
  fields.patient = { visible: true, editable: false }
  fields.workItems = { visible: true, editable: false }
  fields.impressionMethod = { visible: true, editable: false }
  fields.deliveryDate = { visible: true, editable: false }
  fields.priority = { visible: true, editable: false }
  fields.specialInstructions = { visible: true, editable: false }
  fields.attachments = { visible: true, editable: true }
  fields.communications = { visible: true, editable: true }
  fields.stageHistory = { visible: true, editable: true }
  fields.returnRecords = { visible: true, editable: true }
  fields.internalCost = { visible: false, editable: false }
  fields.responsibleTechnician = { visible: true, editable: false }
  fields.totalAmount = { visible: false, editable: false }

  return {
    fields,
    actions: {
      create: false,
      edit: false,
      copy: false,
      delete: false,
      startStage: true,
      completeStage: true,
      returnStage: true,
      pause: true,
      resume: true,
      ship: false,
      deliver: false,
      initiateRework: true,
      editPriority: false,
      editClinicInfo: false,
      editInternalCost: false,
      editResponsibleTechnician: false,
      editPatientInfo: false,
      viewInternalNotes: true,
      viewReworkCost: false,
    },
  }
}

function getDispatcherPermissions(): OrderPermissions {
  const fields = { ...baseFieldPermissions }
  Object.keys(fields).forEach((key) => {
    fields[key] = { visible: true, editable: true }
  })
  fields.orderNumber = { visible: true, editable: false }
  fields.createdAt = { visible: true, editable: false }
  fields.status = { visible: true, editable: true }

  return {
    fields,
    actions: {
      create: true,
      edit: true,
      copy: true,
      delete: true,
      startStage: true,
      completeStage: true,
      returnStage: true,
      pause: true,
      resume: true,
      ship: true,
      deliver: true,
      initiateRework: true,
      editPriority: true,
      editClinicInfo: true,
      editInternalCost: true,
      editResponsibleTechnician: true,
      editPatientInfo: true,
      viewInternalNotes: true,
      viewReworkCost: true,
    },
  }
}

export const permissions = computed<OrderPermissions>(() => {
  switch (currentRole.value) {
    case 'clinic':
      return getClinicPermissions()
    case 'technician':
      return getTechnicianPermissions()
    case 'dispatcher':
      return getDispatcherPermissions()
    default:
      return getDispatcherPermissions()
  }
})

export function setRole(role: Role) {
  currentRole.value = role
  persistRole(role)
}

export function setTechnicianName(name: string) {
  currentTechnicianName.value = name
  persistTechnicianName(name)
}

export function canViewField(fieldName: string): boolean {
  return permissions.value.fields[fieldName]?.visible ?? false
}

export function canEditField(fieldName: string): boolean {
  return permissions.value.fields[fieldName]?.editable ?? false
}

export function canPerformAction(action: keyof OrderPermissions['actions']): boolean {
  return permissions.value.actions[action] ?? false
}

export function filterOrdersByRole(orders: Order[]): Order[] {
  const role = currentRole.value

  if (role === 'dispatcher') {
    return orders
  }

  if (role === 'clinic') {
    return orders.filter((o) => o.clinicId === 'CLINIC-001')
  }

  if (role === 'technician') {
    const techName = currentTechnicianName.value
    if (!techName) {
      return orders.filter((o) => {
        const currentEntry = o.stageHistory.find(
          (s) => s.stage === o.currentStage && !s.completedAt
        )
        return !!currentEntry?.technician
      })
    }
    return orders.filter((o) => {
      const currentEntry = o.stageHistory.find(
        (s) => s.stage === o.currentStage && !s.completedAt
      )
      if (currentEntry?.technician) {
        return currentEntry.technician.toLowerCase().includes(techName.toLowerCase())
      }
      return o.stageHistory.some(
        (s) =>
          s.technician?.toLowerCase().includes(techName.toLowerCase()) &&
          s.stage === o.currentStage
      )
    })
  }

  return orders
}

export function getRoleSpecificStages(): ProcessingStage[] {
  const role = currentRole.value
  if (role === 'technician') {
    return ['model-scanning', 'wax-up', 'casting', 'porcelain', 'glazing', 'finishing']
  }
  return []
}

export type QuickViewType = 'all' | 'today' | 'overdue' | 'returning' | 'urgent' | 'mytasks'
export type DashboardViewType = 'list' | 'kanban'

export interface DashboardConfig {
  title: string
  subtitle: string
  quickViews: QuickViewType[]
  showPriority: boolean
  showTechnician: boolean
  showInternalCost: boolean
  defaultView: DashboardViewType
}

export function getDashboardConfig(): DashboardConfig {
  const role = currentRole.value

  if (role === 'clinic') {
    return {
      title: '我的订单',
      subtitle: '查看您提交的订单状态和交付结果',
      quickViews: ['all', 'today', 'overdue', 'returning'],
      showPriority: true,
      showTechnician: false,
      showInternalCost: false,
      defaultView: 'list',
    }
  }

  if (role === 'technician') {
    return {
      title: '我的任务',
      subtitle: '分配给您的阶段任务和工艺要求',
      quickViews: ['mytasks', 'today', 'overdue', 'returning'],
      showPriority: true,
      showTechnician: true,
      showInternalCost: false,
      defaultView: 'kanban',
    }
  }

  return {
    title: '订单看板',
    subtitle: '监控全部加工订单进度，确保按时交付',
    quickViews: ['all', 'today', 'overdue', 'returning', 'urgent', 'mytasks'],
    showPriority: true,
    showTechnician: true,
    showInternalCost: true,
    defaultView: 'kanban',
  }
}

const RoleSymbol = Symbol('role')

export function provideRole() {
  provide(RoleSymbol, {
    currentRole,
    currentTechnicianName,
    permissions,
    setRole,
    setTechnicianName,
    canViewField,
    canEditField,
    canPerformAction,
    filterOrdersByRole,
    getRoleSpecificStages,
    getDashboardConfig,
  })
}

export function useRoles() {
  const injected = inject(RoleSymbol)
  if (injected) {
    return injected as {
      currentRole: typeof currentRole
      currentTechnicianName: typeof currentTechnicianName
      permissions: typeof permissions
      setRole: typeof setRole
      setTechnicianName: typeof setTechnicianName
      canViewField: typeof canViewField
      canEditField: typeof canEditField
      canPerformAction: typeof canPerformAction
      filterOrdersByRole: typeof filterOrdersByRole
      getRoleSpecificStages: typeof getRoleSpecificStages
      getDashboardConfig: () => DashboardConfig
    }
  }
  return {
    currentRole,
    currentTechnicianName,
    permissions,
    setRole,
    setTechnicianName,
    canViewField,
    canEditField,
    canPerformAction,
    filterOrdersByRole,
    getRoleSpecificStages,
    getDashboardConfig,
  }
}
