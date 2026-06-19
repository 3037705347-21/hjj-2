import type {
  PriceRule,
  Statement,
  StatementItem,
  OrderQuote,
  QuoteItem,
  MonthlySettlement,
} from '../types'
import { MockClinics } from './clinics'
import { MockOrders } from './orders'

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0] + 'T' + date.toTimeString().split(' ')[0]
}

const today = new Date()

export const MockPriceRules: PriceRule[] = [
  {
    id: 'PR001',
    name: '氧化锆单冠-常规',
    restorationType: 'crown',
    material: 'zirconia',
    priority: 'standard',
    unitPrice: 1200,
    surchargeRate: 0,
    reworkChargeable: false,
    reworkChargeRate: 0,
    discount: 0,
    status: 'active',
    description: '标准氧化锆单冠，常规交期',
    createdAt: formatDate(new Date(today.getTime() - 90 * 86400000)),
    updatedAt: formatDate(new Date(today.getTime() - 30 * 86400000)),
  },
  {
    id: 'PR002',
    name: '氧化锆单冠-加急',
    restorationType: 'crown',
    material: 'zirconia',
    priority: 'urgent',
    unitPrice: 1500,
    surchargeRate: 25,
    reworkChargeable: false,
    reworkChargeRate: 0,
    discount: 0,
    status: 'active',
    description: '加急氧化锆单冠，缩短交期',
    createdAt: formatDate(new Date(today.getTime() - 90 * 86400000)),
    updatedAt: formatDate(new Date(today.getTime() - 30 * 86400000)),
  },
  {
    id: 'PR003',
    name: '氧化锆单冠-特急',
    restorationType: 'crown',
    material: 'zirconia',
    priority: 'stat',
    unitPrice: 1800,
    surchargeRate: 50,
    reworkChargeable: false,
    reworkChargeRate: 0,
    discount: 0,
    status: 'active',
    description: '特急氧化锆单冠，最快交期',
    createdAt: formatDate(new Date(today.getTime() - 90 * 86400000)),
    updatedAt: formatDate(new Date(today.getTime() - 30 * 86400000)),
  },
  {
    id: 'PR004',
    name: 'E.max铸瓷贴面-常规',
    restorationType: 'veneer',
    material: 'emax',
    priority: 'standard',
    unitPrice: 1800,
    surchargeRate: 0,
    reworkChargeable: true,
    reworkChargeRate: 50,
    discount: 0,
    status: 'active',
    description: 'E.max铸瓷贴面，常规交期',
    createdAt: formatDate(new Date(today.getTime() - 80 * 86400000)),
    updatedAt: formatDate(new Date(today.getTime() - 25 * 86400000)),
  },
  {
    id: 'PR005',
    name: '氧化锆固定桥-常规',
    restorationType: 'bridge',
    material: 'zirconia',
    priority: 'standard',
    unitPrice: 2500,
    surchargeRate: 0,
    reworkChargeable: false,
    reworkChargeRate: 0,
    discount: 0,
    status: 'active',
    description: '氧化锆固定桥，单位价格',
    createdAt: formatDate(new Date(today.getTime() - 85 * 86400000)),
    updatedAt: formatDate(new Date(today.getTime() - 20 * 86400000)),
  },
  {
    id: 'PR006',
    name: '氧化锆固定桥-加急',
    restorationType: 'bridge',
    material: 'zirconia',
    priority: 'urgent',
    unitPrice: 3000,
    surchargeRate: 20,
    reworkChargeable: false,
    reworkChargeRate: 0,
    discount: 0,
    status: 'active',
    description: '加急氧化锆固定桥',
    createdAt: formatDate(new Date(today.getTime() - 85 * 86400000)),
    updatedAt: formatDate(new Date(today.getTime() - 20 * 86400000)),
  },
  {
    id: 'PR007',
    name: '种植冠-氧化锆-常规',
    restorationType: 'implant-crown',
    material: 'zirconia',
    priority: 'standard',
    unitPrice: 3500,
    surchargeRate: 0,
    reworkChargeable: true,
    reworkChargeRate: 30,
    discount: 0,
    status: 'active',
    description: '氧化锆种植冠，常规交期',
    createdAt: formatDate(new Date(today.getTime() - 70 * 86400000)),
    updatedAt: formatDate(new Date(today.getTime() - 15 * 86400000)),
  },
  {
    id: 'PR008',
    name: '烤瓷熔附金属单冠-常规',
    restorationType: 'crown',
    material: 'pfm',
    priority: 'standard',
    unitPrice: 800,
    surchargeRate: 0,
    reworkChargeable: false,
    reworkChargeRate: 0,
    discount: 0,
    status: 'active',
    description: 'PFM烤瓷冠，常规交期',
    createdAt: formatDate(new Date(today.getTime() - 100 * 86400000)),
    updatedAt: formatDate(new Date(today.getTime() - 40 * 86400000)),
  },
  {
    id: 'PR009',
    name: '复合树脂嵌体-常规',
    restorationType: 'inlay',
    material: 'composite',
    priority: 'standard',
    unitPrice: 600,
    surchargeRate: 0,
    reworkChargeable: true,
    reworkChargeRate: 50,
    discount: 0,
    status: 'active',
    description: '复合树脂嵌体',
    createdAt: formatDate(new Date(today.getTime() - 60 * 86400000)),
    updatedAt: formatDate(new Date(today.getTime() - 10 * 86400000)),
  },
  {
    id: 'PR010',
    name: 'E.max高嵌体-常规',
    restorationType: 'onlay',
    material: 'emax',
    priority: 'standard',
    unitPrice: 1600,
    surchargeRate: 0,
    reworkChargeable: true,
    reworkChargeRate: 40,
    discount: 0,
    status: 'active',
    description: 'E.max铸瓷高嵌体',
    createdAt: formatDate(new Date(today.getTime() - 55 * 86400000)),
    updatedAt: formatDate(new Date(today.getTime() - 8 * 86400000)),
  },
  {
    id: 'PR011',
    name: '全口义齿-亚克力-常规',
    restorationType: 'full-denture',
    material: 'acrylic',
    priority: 'standard',
    unitPrice: 8000,
    surchargeRate: 0,
    reworkChargeable: false,
    reworkChargeRate: 0,
    discount: 10,
    status: 'active',
    description: '全口亚克力义齿，首单9折',
    createdAt: formatDate(new Date(today.getTime() - 75 * 86400000)),
    updatedAt: formatDate(new Date(today.getTime() - 18 * 86400000)),
  },
  {
    id: 'PR012',
    name: '活动义齿-常规',
    restorationType: 'partial-denture',
    material: 'acrylic',
    priority: 'standard',
    unitPrice: 3500,
    surchargeRate: 0,
    reworkChargeable: false,
    reworkChargeRate: 0,
    discount: 0,
    status: 'inactive',
    description: '活动义齿（已停用）',
    createdAt: formatDate(new Date(today.getTime() - 120 * 86400000)),
    updatedAt: formatDate(new Date(today.getTime() - 50 * 86400000)),
  },
]

function generateMockQuotes(): OrderQuote[] {
  const quotes: OrderQuote[] = []

  MockOrders.forEach((order, idx) => {
    const items: QuoteItem[] = order.workItems.map((item, wi) => {
      const matchingRule = MockPriceRules.find(
        (r) =>
          r.restorationType === item.restorationType &&
          r.material === item.material &&
          r.priority === order.priority &&
          r.status === 'active'
      )

      const unitPrice = matchingRule?.unitPrice || 1000
      const surchargeRate = matchingRule?.surchargeRate || 0
      const discount = matchingRule?.discount || 0
      const reworkChargeRate = matchingRule?.reworkChargeRate || 0
      const isRework = order.returnRecords.length > 0
      const reworkChargeable = matchingRule?.reworkChargeable || false

      const quantity = 1
      const baseAmount = unitPrice * quantity
      const surcharge = Math.round(baseAmount * (surchargeRate / 100))
      const discountAmount = Math.round(baseAmount * (discount / 100))
      const reworkCharge = isRework && reworkChargeable ? Math.round(baseAmount * (reworkChargeRate / 100)) : 0
      const subtotal = baseAmount + surcharge - discountAmount + reworkCharge

      return {
        id: `QI-${order.id}-${wi + 1}`,
        orderId: order.id,
        workItemIndex: wi,
        toothNumber: item.toothNumber,
        restorationType: item.restorationType,
        material: item.material,
        priority: order.priority,
        unitPrice,
        quantity,
        surcharge,
        surchargeRate,
        discount,
        discountAmount,
        isRework,
        reworkCharge,
        reworkChargeRate,
        subtotal,
        priceRuleId: matchingRule?.id,
        notes: item.notes,
      }
    })

    const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0)
    const surchargeTotal = items.reduce((s, i) => s + i.surcharge, 0)
    const discountTotal = items.reduce((s, i) => s + i.discountAmount, 0)
    const reworkChargeTotal = items.reduce((s, i) => s + i.reworkCharge, 0)
    const totalAmount = subtotal + surchargeTotal - discountTotal + reworkChargeTotal

    const paymentProgress = idx % 4
    let receivedAmount = 0
    let invoiceStatus: 'unissued' | 'issued' | 'paid' | 'partial' = 'unissued'

    if (paymentProgress === 1) {
      invoiceStatus = 'issued'
    } else if (paymentProgress === 2) {
      invoiceStatus = 'partial'
      receivedAmount = Math.round(totalAmount * 0.5)
    } else if (paymentProgress === 3) {
      invoiceStatus = 'paid'
      receivedAmount = totalAmount
    }

    quotes.push({
      id: `Q-${order.id}`,
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
      invoiceStatus,
      createdAt: order.createdAt,
      updatedAt: order.createdAt,
    })
  })

  return quotes
}

export const MockQuotes: OrderQuote[] = generateMockQuotes()

function generateMockStatements(): Statement[] {
  const statements: Statement[] = []
  const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1)

  MockClinics.forEach((clinic, clinicIdx) => {
    for (let m = 0; m < 3; m++) {
      const monthDate = new Date(currentMonth)
      monthDate.setMonth(monthDate.getMonth() - m)
      const monthStr = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`

      const clinicOrders = MockOrders.filter((o) => {
        const orderDate = new Date(o.createdAt)
        return (
          o.clinicId === clinic.id &&
          orderDate.getFullYear() === monthDate.getFullYear() &&
          orderDate.getMonth() === monthDate.getMonth()
        )
      })

      if (clinicOrders.length === 0) continue

      const items: StatementItem[] = clinicOrders.map((order, oi) => {
        const quote = MockQuotes.find((q) => q.orderId === order.id)
        return {
          id: `SI-${clinic.id}-${monthStr}-${oi + 1}`,
          statementId: '',
          orderId: order.id,
          orderNumber: order.orderNumber,
          orderDate: order.createdAt,
          deliveryDate: order.deliveryDate,
          totalAmount: quote?.totalAmount || order.totalAmount || 0,
          workItemsCount: order.workItems.length,
          isRework: order.returnRecords.length > 0,
        }
      })

      const totalAmount = items.reduce((s, i) => s + i.totalAmount, 0)
      const statusIdx = (clinicIdx + m) % 4
      const statuses: ('pending' | 'confirmed' | 'paid' | 'overdue')[] = ['pending', 'confirmed', 'paid', 'overdue']
      const status = statuses[statusIdx]

      let paidAmount = 0
      let invoiceStatus: 'unissued' | 'issued' | 'paid' | 'partial' = 'unissued'
      let paymentDate: string | undefined

      if (status === 'confirmed') {
        invoiceStatus = 'issued'
      } else if (status === 'paid') {
        invoiceStatus = 'paid'
        paidAmount = totalAmount
        const payDate = new Date(monthDate)
        payDate.setDate(payDate.getDate() + 25)
        paymentDate = formatDate(payDate)
      } else if (status === 'overdue') {
        invoiceStatus = 'issued'
      }

      const dueDate = new Date(monthDate)
      dueDate.setMonth(dueDate.getMonth() + 1)
      dueDate.setDate(clinic.paymentTermDays || 30)

      const statementId = `ST-${clinic.id}-${monthStr}`
      items.forEach((i) => (i.statementId = statementId))

      statements.push({
        id: statementId,
        statementNumber: `DZ-${clinic.clinicCode}-${monthStr}`,
        clinicId: clinic.id,
        clinicName: clinic.name,
        month: monthStr,
        status,
        orderCount: items.length,
        totalAmount,
        paidAmount,
        unpaidAmount: totalAmount - paidAmount,
        invoiceStatus,
        invoiceNumber: invoiceStatus !== 'unissued' ? `INV-${clinic.id}-${monthStr}` : undefined,
        dueDate: formatDate(dueDate),
        paymentDate,
        remark: status === 'overdue' ? '已逾期，请尽快安排付款' : undefined,
        items,
        createdAt: formatDate(new Date(monthDate.getFullYear(), monthDate.getMonth(), 28)),
        updatedAt: formatDate(new Date(monthDate.getFullYear(), monthDate.getMonth(), 28)),
        confirmedAt: status !== 'pending' ? formatDate(new Date(monthDate.getFullYear(), monthDate.getMonth(), 29)) : undefined,
        confirmedBy: status !== 'pending' ? '财务-张' : undefined,
      })
    }
  })

  return statements.sort((a, b) => b.month.localeCompare(a.month))
}

export const MockStatements: Statement[] = generateMockStatements()

function generateMonthlySettlements(): MonthlySettlement[] {
  const settlements: MonthlySettlement[] = []
  const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1)

  MockClinics.forEach((clinic) => {
    for (let m = 0; m < 3; m++) {
      const monthDate = new Date(currentMonth)
      monthDate.setMonth(monthDate.getMonth() - m)
      const monthStr = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`

      const clinicStatements = MockStatements.filter(
        (s) => s.clinicId === clinic.id && s.month === monthStr
      )

      if (clinicStatements.length === 0) continue

      const orderCount = clinicStatements.reduce((s, st) => s + st.orderCount, 0)
      const totalAmount = clinicStatements.reduce((s, st) => s + st.totalAmount, 0)
      const paidAmount = clinicStatements.reduce((s, st) => s + st.paidAmount, 0)

      const allPaid = clinicStatements.every((s) => s.status === 'paid')
      const anyIssued = clinicStatements.some((s) => s.invoiceStatus === 'issued' || s.invoiceStatus === 'paid')
      const anyPartial = clinicStatements.some((s) => s.invoiceStatus === 'partial')

      let invoiceStatus: 'unissued' | 'issued' | 'paid' | 'partial' = 'unissued'
      if (allPaid) invoiceStatus = 'paid'
      else if (anyPartial) invoiceStatus = 'partial'
      else if (anyIssued) invoiceStatus = 'issued'

      settlements.push({
        id: `MS-${clinic.id}-${monthStr}`,
        month: monthStr,
        clinicId: clinic.id,
        clinicName: clinic.name,
        orderCount,
        totalAmount,
        paidAmount,
        unpaidAmount: totalAmount - paidAmount,
        invoiceStatus,
        settlementMethod: clinic.settlementMethod,
        paymentTermDays: clinic.paymentTermDays,
        statements: clinicStatements,
        createdAt: formatDate(new Date(monthDate.getFullYear(), monthDate.getMonth(), 28)),
        updatedAt: formatDate(new Date(monthDate.getFullYear(), monthDate.getMonth(), 28)),
      })
    }
  })

  return settlements.sort((a, b) => b.month.localeCompare(a.month))
}

export const MockMonthlySettlements: MonthlySettlement[] = generateMonthlySettlements()
