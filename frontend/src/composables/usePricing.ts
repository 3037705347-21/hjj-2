import { ref, computed, watch } from 'vue'
import type {
  PriceRule,
  PriceCalculationParams,
  PriceCalculationResult,
  OrderQuote,
  QuoteItem,
  Statement,
  StatementStatus,
  InvoiceStatus,
  MonthlySettlement,
  PriceRuleStatus,
  Order,
  ToothWorkItem,
  Clinic,
  SettlementMethod,
} from '../types'
import {
  RestorationTypeLabels,
  MaterialTypeLabels,
  PriorityLabels,
  SettlementMethodLabels,
} from '../types'
import { MockPriceRules, MockQuotes, MockStatements, MockMonthlySettlements } from '../mock/pricing'
import { useOrders } from './useOrders'
import { useClinics } from './useClinics'

const PRICE_RULES_STORAGE_KEY = 'denture-lab-price-rules'
const QUOTES_STORAGE_KEY = 'denture-lab-quotes'
const STATEMENTS_STORAGE_KEY = 'denture-lab-statements'

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0] + 'T' + date.toTimeString().split(' ')[0]
}

function pad(num: number, size: number = 4): string {
  return num.toString().padStart(size, '0')
}

function loadPriceRules(): PriceRule[] {
  try {
    const raw = localStorage.getItem(PRICE_RULES_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
      }
    }
  } catch (e) {
    console.warn('Failed to load price rules from localStorage:', e)
  }
  return [...MockPriceRules]
}

function loadQuotes(): OrderQuote[] {
  try {
    const raw = localStorage.getItem(QUOTES_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
      }
    }
  } catch (e) {
    console.warn('Failed to load quotes from localStorage:', e)
  }
  return [...MockQuotes]
}

function loadStatements(): Statement[] {
  try {
    const raw = localStorage.getItem(STATEMENTS_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
      }
    }
  } catch (e) {
    console.warn('Failed to load statements from localStorage:', e)
  }
  return [...MockStatements]
}

const priceRules = ref<PriceRule[]>(loadPriceRules())
const quotes = ref<OrderQuote[]>(loadQuotes())
const statements = ref<Statement[]>(loadStatements())

watch(
  priceRules,
  (newVal) => {
    try {
      localStorage.setItem(PRICE_RULES_STORAGE_KEY, JSON.stringify(newVal))
    } catch (e) {
      console.warn('Failed to save price rules:', e)
    }
  },
  { deep: true }
)

watch(
  quotes,
  (newVal) => {
    try {
      localStorage.setItem(QUOTES_STORAGE_KEY, JSON.stringify(newVal))
    } catch (e) {
      console.warn('Failed to save quotes:', e)
    }
  },
  { deep: true }
)

watch(
  statements,
  (newVal) => {
    try {
      localStorage.setItem(STATEMENTS_STORAGE_KEY, JSON.stringify(newVal))
    } catch (e) {
      console.warn('Failed to save statements:', e)
    }
  },
  { deep: true }
)

export function usePricing() {
  const activePriceRules = computed(() =>
    priceRules.value.filter((r) => r.status === 'active')
  )

  function findPriceRule(params: {
    restorationType: string
    material: string
    priority: string
  }): PriceRule | undefined {
    return priceRules.value.find(
      (r) =>
        r.restorationType === params.restorationType &&
        r.material === params.material &&
        r.priority === params.priority &&
        r.status === 'active'
    )
  }

  function calculatePrice(params: PriceCalculationParams): PriceCalculationResult {
    const rule = findPriceRule({
      restorationType: params.restorationType,
      material: params.material,
      priority: params.priority,
    })

    const unitPrice = rule?.unitPrice || 0
    const quantity = params.quantity ?? 1
    const surchargeRate = rule?.surchargeRate || 0
    const discount = params.discount ?? rule?.discount ?? 0
    const reworkChargeRate = rule?.reworkChargeRate || 0
    const isRework = params.isRework || false
    const reworkChargeable = rule?.reworkChargeable || false

    const baseAmount = unitPrice * quantity
    const surcharge = Math.round(baseAmount * (surchargeRate / 100))
    const discountAmount = Math.round(baseAmount * (discount / 100))
    const reworkCharge =
      isRework && reworkChargeable ? Math.round(baseAmount * (reworkChargeRate / 100)) : 0
    const subtotal = baseAmount + surcharge - discountAmount + reworkCharge

    return {
      unitPrice,
      quantity,
      surchargeRate,
      surcharge,
      discount,
      discountAmount,
      reworkChargeRate,
      reworkCharge,
      subtotal,
      priceRuleId: rule?.id,
    }
  }

  function calculateOrderQuote(order: Order): OrderQuote {
    const isReworkOrder = order.returnRecords.length > 0

    const items: QuoteItem[] = order.workItems.map((item, index) => {
      const calcResult = calculatePrice({
        restorationType: item.restorationType,
        material: item.material,
        priority: order.priority,
        quantity: 1,
        isRework: isReworkOrder,
      })

      return {
        id: `QI-${order.id}-${index + 1}`,
        orderId: order.id,
        workItemIndex: index,
        toothNumber: item.toothNumber,
        restorationType: item.restorationType,
        material: item.material,
        priority: order.priority,
        unitPrice: calcResult.unitPrice,
        quantity: calcResult.quantity,
        surcharge: calcResult.surcharge,
        surchargeRate: calcResult.surchargeRate,
        discount: calcResult.discount,
        discountAmount: calcResult.discountAmount,
        isRework: isReworkOrder,
        reworkCharge: calcResult.reworkCharge,
        reworkChargeRate: calcResult.reworkChargeRate,
        subtotal: calcResult.subtotal,
        priceRuleId: calcResult.priceRuleId,
        notes: item.notes,
      }
    })

    const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0)
    const surchargeTotal = items.reduce((s, i) => s + i.surcharge, 0)
    const discountTotal = items.reduce((s, i) => s + i.discountAmount, 0)
    const reworkChargeTotal = items.reduce((s, i) => s + i.reworkCharge, 0)
    const totalAmount = subtotal + surchargeTotal - discountTotal + reworkChargeTotal

    const existingQuote = quotes.value.find((q) => q.orderId === order.id)
    const receivedAmount = existingQuote?.receivedAmount || 0

    return {
      id: existingQuote?.id || `Q-${order.id}`,
      orderId: order.id,
      orderNumber: order.orderNumber,
      clinicId: order.clinicId,
      clinicName: order.clinic.name,
      items,
      subtotal,
      surchargeTotal,
      discountTotal,
      reworkChargeTotal,
      totalAmount,
      receivedAmount,
      unpaidAmount: totalAmount - receivedAmount,
      settlementCycle: order.clinic.settlementMethod,
      invoiceStatus: existingQuote?.invoiceStatus || 'unissued',
      createdAt: existingQuote?.createdAt || formatDate(new Date()),
      updatedAt: formatDate(new Date()),
    }
  }

  function getQuoteByOrderId(orderId: string): OrderQuote | undefined {
    return quotes.value.find((q) => q.orderId === orderId)
  }

  function getOrCreateQuote(order: Order): OrderQuote {
    const existing = getQuoteByOrderId(order.id)
    if (existing) return existing
    const newQuote = calculateOrderQuote(order)
    quotes.value.push(newQuote)
    return newQuote
  }

  function updateQuoteAmount(orderId: string, totalAmount: number): OrderQuote | undefined {
    const idx = quotes.value.findIndex((q) => q.orderId === orderId)
    if (idx === -1) return undefined

    const quote = quotes.value[idx]
    const diff = totalAmount - quote.totalAmount
    quote.totalAmount = totalAmount
    quote.unpaidAmount = totalAmount - quote.receivedAmount
    quote.updatedAt = formatDate(new Date())
    quotes.value[idx] = { ...quote }

    const { updateOrder } = useOrders()
    updateOrder(orderId, { totalAmount })

    return quote
  }

  function updateQuotePayment(
    orderId: string,
    receivedAmount: number,
    invoiceStatus: InvoiceStatus
  ): OrderQuote | undefined {
    const idx = quotes.value.findIndex((q) => q.orderId === orderId)
    if (idx === -1) return undefined

    const quote = quotes.value[idx]
    quote.receivedAmount = receivedAmount
    quote.unpaidAmount = quote.totalAmount - receivedAmount
    quote.invoiceStatus = invoiceStatus
    quote.updatedAt = formatDate(new Date())
    quotes.value[idx] = { ...quote }

    return quote
  }

  function generatePriceRuleId(): string {
    const num = priceRules.value.length + 1
    return `PR${pad(num, 3)}`
  }

  function generatePriceRuleName(params: {
    restorationType: string
    material: string
    priority: string
  }): string {
    const typeLabel =
      RestorationTypeLabels[params.restorationType as keyof typeof RestorationTypeLabels] ||
      params.restorationType
    const materialLabel =
      MaterialTypeLabels[params.material as keyof typeof MaterialTypeLabels] || params.material
    const priorityLabel =
      PriorityLabels[params.priority as keyof typeof PriorityLabels] || params.priority
    return `${materialLabel}${typeLabel}-${priorityLabel}`
  }

  interface CreatePriceRuleParams {
    name?: string
    restorationType: string
    material: string
    priority: string
    unitPrice: number
    surchargeRate?: number
    reworkChargeable?: boolean
    reworkChargeRate?: number
    discount?: number
    status?: PriceRuleStatus
    description?: string
  }

  function createPriceRule(params: CreatePriceRuleParams): PriceRule {
    const now = formatDate(new Date())
    const newRule: PriceRule = {
      id: generatePriceRuleId(),
      name:
        params.name ||
        generatePriceRuleName({
          restorationType: params.restorationType,
          material: params.material,
          priority: params.priority,
        }),
      restorationType: params.restorationType as PriceRule['restorationType'],
      material: params.material as PriceRule['material'],
      priority: params.priority as PriceRule['priority'],
      unitPrice: params.unitPrice,
      surchargeRate: params.surchargeRate ?? 0,
      reworkChargeable: params.reworkChargeable ?? false,
      reworkChargeRate: params.reworkChargeRate ?? 0,
      discount: params.discount ?? 0,
      status: params.status || 'active',
      description: params.description,
      createdAt: now,
      updatedAt: now,
    }
    priceRules.value.unshift(newRule)
    return newRule
  }

  interface UpdatePriceRuleParams {
    name?: string
    restorationType?: string
    material?: string
    priority?: string
    unitPrice?: number
    surchargeRate?: number
    reworkChargeable?: boolean
    reworkChargeRate?: number
    discount?: number
    status?: PriceRuleStatus
    description?: string
  }

  function updatePriceRule(id: string, params: UpdatePriceRuleParams): PriceRule | undefined {
    const idx = priceRules.value.findIndex((r) => r.id === id)
    if (idx === -1) return undefined

    const existing = priceRules.value[idx]
    if (params.name !== undefined) existing.name = params.name
    if (params.restorationType !== undefined)
      existing.restorationType = params.restorationType as PriceRule['restorationType']
    if (params.material !== undefined) existing.material = params.material as PriceRule['material']
    if (params.priority !== undefined) existing.priority = params.priority as PriceRule['priority']
    if (params.unitPrice !== undefined) existing.unitPrice = params.unitPrice
    if (params.surchargeRate !== undefined) existing.surchargeRate = params.surchargeRate
    if (params.reworkChargeable !== undefined) existing.reworkChargeable = params.reworkChargeable
    if (params.reworkChargeRate !== undefined) existing.reworkChargeRate = params.reworkChargeRate
    if (params.discount !== undefined) existing.discount = params.discount
    if (params.status !== undefined) existing.status = params.status
    if (params.description !== undefined) existing.description = params.description

    existing.updatedAt = formatDate(new Date())
    priceRules.value[idx] = { ...existing }
    return existing
  }

  function deletePriceRule(id: string): boolean {
    const idx = priceRules.value.findIndex((r) => r.id === id)
    if (idx === -1) return false
    priceRules.value.splice(idx, 1)
    return true
  }

  function togglePriceRuleStatus(id: string): PriceRule | undefined {
    const rule = priceRules.value.find((r) => r.id === id)
    if (!rule) return undefined
    const newStatus: PriceRuleStatus = rule.status === 'active' ? 'inactive' : 'active'
    return updatePriceRule(id, { status: newStatus })
  }

  function searchPriceRules(params: {
    restorationType?: string
    material?: string
    priority?: string
    status?: PriceRuleStatus | ''
    keyword?: string
  }): PriceRule[] {
    return priceRules.value.filter((r) => {
      if (params.restorationType && r.restorationType !== params.restorationType) return false
      if (params.material && r.material !== params.material) return false
      if (params.priority && r.priority !== params.priority) return false
      if (params.status && r.status !== params.status) return false
      if (params.keyword) {
        const kw = params.keyword.toLowerCase()
        if (
          !r.name.toLowerCase().includes(kw) &&
          !r.description?.toLowerCase().includes(kw)
        )
          return false
      }
      return true
    })
  }

  function searchStatements(params: {
    clinicId?: string
    month?: string
    status?: StatementStatus | ''
    invoiceStatus?: InvoiceStatus | ''
  }): Statement[] {
    return statements.value.filter((s) => {
      if (params.clinicId && s.clinicId !== params.clinicId) return false
      if (params.month && s.month !== params.month) return false
      if (params.status && s.status !== params.status) return false
      if (params.invoiceStatus && s.invoiceStatus !== params.invoiceStatus) return false
      return true
    })
  }

  function getStatementById(id: string): Statement | undefined {
    return statements.value.find((s) => s.id === id)
  }

  function getStatementsByClinic(clinicId: string): Statement[] {
    return statements.value.filter((s) => s.clinicId === clinicId)
  }

  function getStatementsByMonth(month: string): Statement[] {
    return statements.value.filter((s) => s.month === month)
  }

  function updateStatementStatus(
    id: string,
    status: StatementStatus,
    operator?: string
  ): Statement | undefined {
    const idx = statements.value.findIndex((s) => s.id === id)
    if (idx === -1) return undefined

    const statement = statements.value[idx]
    statement.status = status
    statement.updatedAt = formatDate(new Date())

    if (status === 'confirmed') {
      statement.confirmedAt = formatDate(new Date())
      statement.confirmedBy = operator || '系统'
    } else if (status === 'paid') {
      statement.paymentDate = formatDate(new Date())
      statement.paidAmount = statement.totalAmount
      statement.unpaidAmount = 0
      statement.invoiceStatus = 'paid'
    }

    statements.value[idx] = { ...statement }
    return statement
  }

  function exportStatementsToCSV(filteredStatements?: Statement[]): string {
    const data = filteredStatements || statements.value
    const headers = [
      '对账单号',
      '诊所名称',
      '月份',
      '状态',
      '订单数',
      '总金额(元)',
      '已收金额(元)',
      '未收金额(元)',
      '发票状态',
      '发票号',
      '到期日',
      '付款日',
      '备注',
      '创建时间',
      '更新时间',
    ]
    const rows = data.map((s) => [
      s.statementNumber,
      s.clinicName,
      s.month,
      s.status,
      s.orderCount,
      s.totalAmount,
      s.paidAmount,
      s.unpaidAmount,
      s.invoiceStatus,
      s.invoiceNumber || '',
      s.dueDate,
      s.paymentDate || '',
      s.remark || '',
      s.createdAt,
      s.updatedAt,
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

  function downloadStatementsCSV(filteredStatements?: Statement[]): void {
    const csv = exportStatementsToCSV(filteredStatements)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `对账单_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  function getMonthlySettlement(clinicId: string, month: string): MonthlySettlement | undefined {
    const clinicStatements = getStatementsByClinic(clinicId).filter((s) => s.month === month)
    if (clinicStatements.length === 0) return undefined

    const { getClinicById } = useClinics()
    const clinic = getClinicById(clinicId)

    const orderCount = clinicStatements.reduce((s, st) => s + st.orderCount, 0)
    const totalAmount = clinicStatements.reduce((s, st) => s + st.totalAmount, 0)
    const paidAmount = clinicStatements.reduce((s, st) => s + st.paidAmount, 0)

    const allPaid = clinicStatements.every((s) => s.status === 'paid')
    const anyIssued = clinicStatements.some(
      (s) => s.invoiceStatus === 'issued' || s.invoiceStatus === 'paid'
    )
    const anyPartial = clinicStatements.some((s) => s.invoiceStatus === 'partial')

    let invoiceStatus: InvoiceStatus = 'unissued'
    if (allPaid) invoiceStatus = 'paid'
    else if (anyPartial) invoiceStatus = 'partial'
    else if (anyIssued) invoiceStatus = 'issued'

    return {
      id: `MS-${clinicId}-${month}`,
      month,
      clinicId,
      clinicName: clinic?.name || '',
      orderCount,
      totalAmount,
      paidAmount,
      unpaidAmount: totalAmount - paidAmount,
      invoiceStatus,
      settlementMethod: clinic?.settlementMethod || 'monthly',
      paymentTermDays: clinic?.paymentTermDays || 30,
      statements: clinicStatements,
      createdAt: formatDate(new Date()),
      updatedAt: formatDate(new Date()),
    }
  }

  function getAllMonthlySettlements(): MonthlySettlement[] {
    const result: MonthlySettlement[] = []
    const monthSet = new Set(statements.value.map((s) => s.month))
    const clinicSet = new Set(statements.value.map((s) => s.clinicId))

    monthSet.forEach((month) => {
      clinicSet.forEach((clinicId) => {
        const settlement = getMonthlySettlement(clinicId, month)
        if (settlement) {
          result.push(settlement)
        }
      })
    })

    return result.sort((a, b) => {
      if (a.month !== b.month) return b.month.localeCompare(a.month)
      return a.clinicName.localeCompare(b.clinicName)
    })
  }

  function refreshQuotesForOrder(orderId: string): void {
    const { getOrderById } = useOrders()
    const order = getOrderById(orderId)
    if (!order) return

    const quote = calculateOrderQuote(order)
    const idx = quotes.value.findIndex((q) => q.orderId === orderId)
    if (idx === -1) {
      quotes.value.push(quote)
    } else {
      const existing = quotes.value[idx]
      quote.receivedAmount = existing.receivedAmount
      quote.invoiceStatus = existing.invoiceStatus
      quotes.value[idx] = quote
    }

    const { updateOrder } = useOrders()
    updateOrder(orderId, { totalAmount: quote.totalAmount })
  }

  function refreshAllQuotes(): void {
    const { orders } = useOrders()
    orders.value.forEach((order) => {
      refreshQuotesForOrder(order.id)
    })
  }

  return {
    priceRules,
    activePriceRules,
    quotes,
    statements,
    findPriceRule,
    calculatePrice,
    calculateOrderQuote,
    getQuoteByOrderId,
    getOrCreateQuote,
    updateQuoteAmount,
    updateQuotePayment,
    createPriceRule,
    updatePriceRule,
    deletePriceRule,
    togglePriceRuleStatus,
    searchPriceRules,
    searchStatements,
    getStatementById,
    getStatementsByClinic,
    getStatementsByMonth,
    updateStatementStatus,
    exportStatementsToCSV,
    downloadStatementsCSV,
    getMonthlySettlement,
    getAllMonthlySettlements,
    refreshQuotesForOrder,
    refreshAllQuotes,
    generatePriceRuleName,
  }
}
