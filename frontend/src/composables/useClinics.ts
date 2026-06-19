import { ref, computed, watch } from 'vue'
import type {
  Clinic,
  Doctor,
  CooperationStatus,
  SettlementMethod,
  Order,
  RestorationType,
} from '../types'
import { MockClinics } from '../mock/clinics'
import { useOrders } from './useOrders'

const STORAGE_KEY = 'denture-lab-clinics'

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0] + 'T' + date.toTimeString().split(' ')[0]
}

function pad(num: number, size: number = 3): string {
  return num.toString().padStart(size, '0')
}

function migrateClinic(clinic: Clinic): Clinic {
  if (!clinic.doctors) clinic.doctors = []
  if (!clinic.stats) {
    clinic.stats = { totalOrders: 0, reworkRate: 0, totalAmount: 0 }
  }
  if (!clinic.cooperationStatus) clinic.cooperationStatus = 'active'
  if (!clinic.settlementMethod) clinic.settlementMethod = 'monthly'
  if (!clinic.paymentTermDays) clinic.paymentTermDays = 30
  if (!clinic.createdAt) clinic.createdAt = formatDate(new Date())
  if (!clinic.updatedAt) clinic.updatedAt = formatDate(new Date())
  return clinic
}

function loadClinicsFromStorage(): Clinic[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((c) => migrateClinic(c as Clinic))
      }
    }
  } catch (e) {
    console.warn('Failed to load clinics from localStorage:', e)
  }
  return [...MockClinics]
}

const clinics = ref<Clinic[]>(loadClinicsFromStorage())

watch(
  clinics,
  (newVal) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newVal))
    } catch (e) {
      console.warn('Failed to save clinics to localStorage:', e)
    }
  },
  { deep: true }
)

function generateClinicId(): string {
  const num = clinics.value.length + 1
  return `C${pad(num, 3)}`
}

function generateClinicCode(name: string): string {
  const pinyinMap: Record<string, string> = {}
  const initials = name
    .slice(0, 3)
    .split('')
    .map((c) => {
      const code = c.charCodeAt(0)
      return code < 128 ? c.toUpperCase() : 'X'
    })
    .join('')
  const num = pad(clinics.value.length + 1, 3)
  return `${initials || 'CLN'}-${num}`
}

function generateDoctorId(): string {
  return `D${Date.now()}${Math.floor(Math.random() * 1000)}`
}

function recalcClinicStats(clinicId: string): void {
  const { getOrdersByClinic } = useOrders()
  const orders = getOrdersByClinic(clinicId)
  const idx = clinics.value.findIndex((c) => c.id === clinicId)
  if (idx === -1) return

  const totalOrders = orders.length
  const totalAmount = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0)
  const reworkCount = orders.filter((o) => o.returnRecords && o.returnRecords.length > 0).length
  const reworkRate = totalOrders > 0 ? parseFloat(((reworkCount / totalOrders) * 100).toFixed(2)) : 0

  clinics.value[idx].stats = { totalOrders, reworkRate, totalAmount }
  clinics.value[idx].updatedAt = formatDate(new Date())
}

export function useClinics() {
  const allClinics = computed(() => clinics.value)

  const activeClinics = computed(() =>
    clinics.value.filter((c) => c.cooperationStatus === 'active')
  )

  function getClinicById(id: string): Clinic | undefined {
    return clinics.value.find((c) => c.id === id)
  }

  function getClinicsByStatus(status: CooperationStatus): Clinic[] {
    return clinics.value.filter((c) => c.cooperationStatus === status)
  }

  function searchClinics(params: {
    name?: string
    code?: string
    contactPerson?: string
    status?: CooperationStatus | ''
  }): Clinic[] {
    return clinics.value.filter((c) => {
      if (params.name && !c.name.toLowerCase().includes(params.name.toLowerCase())) return false
      if (params.code && !c.clinicCode.toLowerCase().includes(params.code.toLowerCase())) return false
      if (
        params.contactPerson &&
        !c.contactPerson.toLowerCase().includes(params.contactPerson.toLowerCase())
      )
        return false
      if (params.status && c.cooperationStatus !== params.status) return false
      return true
    })
  }

  interface CreateClinicParams {
    name: string
    clinicCode?: string
    contactPerson: string
    phone: string
    address: string
    cooperationStatus: CooperationStatus
    settlementMethod: SettlementMethod
    paymentTermDays: number
    doctors?: Doctor[]
    remarks?: string
  }

  function createClinic(params: CreateClinicParams): Clinic {
    const now = formatDate(new Date())
    const newClinic: Clinic = {
      id: generateClinicId(),
      name: params.name,
      clinicCode: params.clinicCode || generateClinicCode(params.name),
      contactPerson: params.contactPerson,
      phone: params.phone,
      address: params.address,
      cooperationStatus: params.cooperationStatus,
      settlementMethod: params.settlementMethod,
      paymentTermDays: params.paymentTermDays,
      doctors: params.doctors || [],
      remarks: params.remarks,
      stats: { totalOrders: 0, reworkRate: 0, totalAmount: 0 },
      createdAt: now,
      updatedAt: now,
    }
    clinics.value.unshift(newClinic)
    return newClinic
  }

  interface UpdateClinicParams {
    name?: string
    clinicCode?: string
    contactPerson?: string
    phone?: string
    address?: string
    cooperationStatus?: CooperationStatus
    settlementMethod?: SettlementMethod
    paymentTermDays?: number
    doctors?: Doctor[]
    remarks?: string
  }

  function updateClinic(id: string, params: UpdateClinicParams): Clinic | undefined {
    const idx = clinics.value.findIndex((c) => c.id === id)
    if (idx === -1) return undefined

    const existing = clinics.value[idx]
    if (params.name !== undefined) existing.name = params.name
    if (params.clinicCode !== undefined) existing.clinicCode = params.clinicCode
    if (params.contactPerson !== undefined) existing.contactPerson = params.contactPerson
    if (params.phone !== undefined) existing.phone = params.phone
    if (params.address !== undefined) existing.address = params.address
    if (params.cooperationStatus !== undefined) existing.cooperationStatus = params.cooperationStatus
    if (params.settlementMethod !== undefined) existing.settlementMethod = params.settlementMethod
    if (params.paymentTermDays !== undefined) existing.paymentTermDays = params.paymentTermDays
    if (params.doctors !== undefined) existing.doctors = [...params.doctors]
    if (params.remarks !== undefined) existing.remarks = params.remarks

    existing.updatedAt = formatDate(new Date())
    clinics.value[idx] = { ...existing }
    return clinics.value[idx]
  }

  function deleteClinic(id: string): boolean {
    const idx = clinics.value.findIndex((c) => c.id === id)
    if (idx === -1) return false
    clinics.value.splice(idx, 1)
    return true
  }

  function addDoctor(clinicId: string, doctor: Omit<Doctor, 'id'>): Doctor | undefined {
    const clinic = getClinicById(clinicId)
    if (!clinic) return undefined

    const newDoctor: Doctor = {
      ...doctor,
      id: generateDoctorId(),
    }
    clinic.doctors.push(newDoctor)
    clinic.updatedAt = formatDate(new Date())
    return newDoctor
  }

  function updateDoctor(
    clinicId: string,
    doctorId: string,
    updates: Partial<Omit<Doctor, 'id'>>
  ): Doctor | undefined {
    const clinic = getClinicById(clinicId)
    if (!clinic) return undefined
    const dIdx = clinic.doctors.findIndex((d) => d.id === doctorId)
    if (dIdx === -1) return undefined

    clinic.doctors[dIdx] = { ...clinic.doctors[dIdx], ...updates }
    clinic.updatedAt = formatDate(new Date())
    return clinic.doctors[dIdx]
  }

  function removeDoctor(clinicId: string, doctorId: string): boolean {
    const clinic = getClinicById(clinicId)
    if (!clinic) return false
    const dIdx = clinic.doctors.findIndex((d) => d.id === doctorId)
    if (dIdx === -1) return false
    clinic.doctors.splice(dIdx, 1)
    clinic.updatedAt = formatDate(new Date())
    return true
  }

  function getClinicOrders(clinicId: string): Order[] {
    const { getOrdersByClinic } = useOrders()
    return getOrdersByClinic(clinicId)
  }

  function getCommonRestorationTypes(clinicId: string): { type: RestorationType; count: number }[] {
    const orders = getClinicOrders(clinicId)
    const typeCount = new Map<RestorationType, number>()
    orders.forEach((o) => {
      o.workItems.forEach((w) => {
        const count = typeCount.get(w.restorationType) || 0
        typeCount.set(w.restorationType, count + 1)
      })
    })
    return Array.from(typeCount.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }

  function getRecentReworks(clinicId: string, limit: number = 5) {
    const orders = getClinicOrders(clinicId)
    const reworks: {
      orderId: string
      orderNumber: string
      reworkId: string
      returnedAt: string
      reason: string
      status: string
      problemType: string
    }[] = []
    orders.forEach((o) => {
      o.returnRecords.forEach((r) => {
        reworks.push({
          orderId: o.id,
          orderNumber: o.orderNumber,
          reworkId: r.id,
          returnedAt: r.returnedAt,
          reason: r.reason,
          status: r.status,
          problemType: r.problemType,
        })
      })
    })
    return reworks
      .sort((a, b) => new Date(b.returnedAt).getTime() - new Date(a.returnedAt).getTime())
      .slice(0, limit)
  }

  function exportClinicsToCSV(filteredClinics?: Clinic[]): string {
    const data = filteredClinics || clinics.value
    const headers = [
      '诊所ID',
      '诊所名称',
      '诊所编码',
      '联系人',
      '联系电话',
      '地址',
      '合作状态',
      '结算方式',
      '账期(天)',
      '常用医生数',
      '累计订单数',
      '返工率(%)',
      '累计金额(元)',
      '备注',
      '创建时间',
      '更新时间',
    ]
    const rows = data.map((c) => [
      c.id,
      c.name,
      c.clinicCode,
      c.contactPerson,
      c.phone,
      c.address,
      c.cooperationStatus,
      c.settlementMethod,
      c.paymentTermDays,
      c.doctors.length,
      c.stats.totalOrders,
      c.stats.reworkRate,
      c.stats.totalAmount,
      c.remarks || '',
      c.createdAt,
      c.updatedAt,
    ])
    const csv = [headers, ...rows]
      .map((row) =>
        row
          .map((cell) => {
            const s = String(cell ?? '')
            if (s.includes(',') || s.includes('"') || s.includes('\n')) {
              return `"${s.replace(/"/g, '""')}"`
            }
            return s
          })
          .join(',')
      )
      .join('\n')
    return '\uFEFF' + csv
  }

  function downloadClinicsCSV(filteredClinics?: Clinic[]): void {
    const csv = exportClinicsToCSV(filteredClinics)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `诊所列表_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  function refreshAllClinicStats(): void {
    clinics.value.forEach((c) => recalcClinicStats(c.id))
  }

  return {
    clinics: allClinics,
    activeClinics,
    getClinicById,
    getClinicsByStatus,
    searchClinics,
    createClinic,
    updateClinic,
    deleteClinic,
    addDoctor,
    updateDoctor,
    removeDoctor,
    getClinicOrders,
    getCommonRestorationTypes,
    getRecentReworks,
    exportClinicsToCSV,
    downloadClinicsCSV,
    refreshAllClinicStats,
    recalcClinicStats,
    generateClinicCode,
  }
}
