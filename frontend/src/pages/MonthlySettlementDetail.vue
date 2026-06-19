<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft,
  Building2,
  BadgeDollarSign,
  Clock,
  FileText,
  TrendingUp,
  Wallet,
  AlertTriangle,
  Receipt,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Download,
  CheckCircle2,
  DollarSign,
  Calendar,
  Layers,
  CheckCheck,
  CreditCard,
  BarChart3,
  AlertCircle,
  RotateCcw,
  Eye,
} from 'lucide-vue-next'
import { usePricing } from '../composables/usePricing'
import { useOrders } from '../composables/useOrders'
import { useClinics } from '../composables/useClinics'
import type { Clinic, OrderQuote } from '../types'
import {
  SettlementMethodLabels,
  StatementStatusLabels,
  StatementStatusColors,
  InvoiceStatusLabels,
  InvoiceStatusColors,
  RestorationTypeLabels,
  MaterialTypeLabels,
} from '../types'
import StatCard from '../components/StatCard.vue'

const route = useRoute()
const router = useRouter()
const {
  getMonthlySettlement,
  getStatementsByClinic,
  updateStatementStatus,
  getQuoteByOrderId,
  downloadStatementsCSV,
} = usePricing()
const { getOrdersByClinic, getOrderById } = useOrders()
const { getClinicById } = useClinics()

const clinic = ref<Clinic | null>(null)
const monthlySettlement = computed(() => {
  const clinicId = route.params.clinicId as string
  const month = route.params.month as string
  return getMonthlySettlement(clinicId, month)
})

const statements = computed(() => {
  const clinicId = route.params.clinicId as string
  const month = route.params.month as string
  return getStatementsByClinic(clinicId).filter((s) => s.month === month)
})

const monthOrders = computed(() => {
  const clinicId = route.params.clinicId as string
  const month = route.params.month as string
  const allOrders = getOrdersByClinic(clinicId)
  return allOrders.filter((o) => {
    const orderDate = new Date(o.createdAt)
    const [year, monthNum] = month.split('-')
    return (
      orderDate.getFullYear() === parseInt(year) &&
      orderDate.getMonth() === parseInt(monthNum) - 1
    )
  })
})

const selectedStatementIds = ref<string[]>([])
const expandedOrderIds = ref<string[]>([])
const expandedStatementIds = ref<string[]>([])

const allStatementsSelected = computed(() => {
  return (
    statements.value.length > 0 &&
    selectedStatementIds.value.length === statements.value.length
  )
})

const someStatementsSelected = computed(() => {
  return (
    selectedStatementIds.value.length > 0 &&
    selectedStatementIds.value.length < statements.value.length
  )
})

function toggleStatementSelection(id: string) {
  const idx = selectedStatementIds.value.indexOf(id)
  if (idx === -1) {
    selectedStatementIds.value.push(id)
  } else {
    selectedStatementIds.value.splice(idx, 1)
  }
}

function toggleAllStatements() {
  if (allStatementsSelected.value) {
    selectedStatementIds.value = []
  } else {
    selectedStatementIds.value = statements.value.map((s) => s.id)
  }
}

function toggleOrderExpand(orderId: string) {
  const idx = expandedOrderIds.value.indexOf(orderId)
  if (idx === -1) {
    expandedOrderIds.value.push(orderId)
  } else {
    expandedOrderIds.value.splice(idx, 1)
  }
}

function toggleStatementExpand(statementId: string) {
  const idx = expandedStatementIds.value.indexOf(statementId)
  if (idx === -1) {
    expandedStatementIds.value.push(statementId)
  } else {
    expandedStatementIds.value.splice(idx, 1)
  }
}

function formatCurrency(amount: number): string {
  if (amount >= 10000) {
    return `¥${(amount / 10000).toFixed(2)}万`
  }
  return `¥${amount.toLocaleString()}`
}

function formatDateStr(dt: string): string {
  return dt.split('T')[0]
}

function goBack() {
  router.back()
}

function goToOrderDetail(orderId: string) {
  router.push(`/order/${orderId}`)
}

function getOrderQuote(orderId: string): OrderQuote | undefined {
  return getQuoteByOrderId(orderId)
}

function batchConfirmStatements() {
  if (selectedStatementIds.value.length === 0) return
  selectedStatementIds.value.forEach((id) => {
    updateStatementStatus(id, 'confirmed', '当前用户')
  })
  selectedStatementIds.value = []
}

function batchMarkPaid() {
  if (selectedStatementIds.value.length === 0) return
  selectedStatementIds.value.forEach((id) => {
    updateStatementStatus(id, 'paid', '当前用户')
  })
  selectedStatementIds.value = []
}

function handleExportCSV() {
  downloadStatementsCSV(statements.value)
}

function exportSettlementDetailCSV() {
  const headers = [
    '订单号',
    '患者',
    '医生',
    '下单日期',
    '交付日期',
    '修复类型',
    '材料',
    '数量',
    '单价(元)',
    '加急费(元)',
    '折扣(元)',
    '返工费(元)',
    '小计(元)',
    '订单总额(元)',
    '对账单号',
    '对账单状态',
    '发票状态',
  ]

  const rows: string[][] = []

  statements.value.forEach((statement) => {
    statement.items.forEach((item) => {
      const order = getOrderById(item.orderId)
      const quote = getQuoteByOrderId(item.orderId)

      if (quote) {
        quote.items.forEach((qi) => {
          rows.push([
            item.orderNumber,
            order?.patient.anonymousCode || '',
            order?.doctorName || '',
            formatDateStr(item.orderDate),
            item.deliveryDate,
            RestorationTypeLabels[qi.restorationType] || qi.restorationType,
            MaterialTypeLabels[qi.material] || qi.material,
            String(qi.quantity),
            String(qi.unitPrice),
            String(qi.surcharge),
            String(qi.discountAmount),
            String(qi.reworkCharge),
            String(qi.subtotal),
            String(quote.totalAmount),
            statement.statementNumber,
            StatementStatusLabels[statement.status],
            InvoiceStatusLabels[statement.invoiceStatus],
          ])
        })
      } else {
        rows.push([
          item.orderNumber,
          order?.patient.anonymousCode || '',
          order?.doctorName || '',
          formatDateStr(item.orderDate),
          item.deliveryDate,
          '',
          '',
          String(item.workItemsCount),
          '',
          '',
          '',
          '',
          '',
          String(item.totalAmount),
          statement.statementNumber,
          StatementStatusLabels[statement.status],
          InvoiceStatusLabels[statement.invoiceStatus],
        ])
      }
    })
  })

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

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  const month = route.params.month as string
  a.download = `月度结算明细_${month}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const agingAnalysis = computed(() => {
  const today = new Date()
  const groups = [
    { label: '未到期', range: '0天内', count: 0, amount: 0, minDays: -9999, maxDays: 0 },
    { label: '逾期1-30天', range: '1-30天', count: 0, amount: 0, minDays: 1, maxDays: 30 },
    { label: '逾期31-60天', range: '31-60天', count: 0, amount: 0, minDays: 31, maxDays: 60 },
    { label: '逾期61-90天', range: '61-90天', count: 0, amount: 0, minDays: 61, maxDays: 90 },
    { label: '逾期90天以上', range: '90天以上', count: 0, amount: 0, minDays: 91, maxDays: 9999 },
  ]

  statements.value.forEach((s) => {
    if (s.status === 'paid') return
    const dueDate = new Date(s.dueDate)
    const diffDays = Math.ceil(
      (today.getTime() - dueDate.getTime()) / 86400000
    )

    for (const group of groups) {
      if (diffDays >= group.minDays && diffDays <= group.maxDays) {
        group.count++
        group.amount += s.unpaidAmount
        break
      }
    }
  })

  return groups
})

const totalUnpaidAmount = computed(() => {
  return statements.value.reduce((s, st) => s + st.unpaidAmount, 0)
})

function loadData() {
  const clinicId = route.params.clinicId as string
  const c = getClinicById(clinicId)
  if (c) {
    clinic.value = c
  }
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="min-h-full pb-12" v-if="clinic && monthlySettlement">
    <div class="mb-6">
      <button
        class="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 mb-4 transition-colors"
        @click="goBack"
      >
        <ArrowLeft class="w-4 h-4" />
        返回
      </button>

      <div class="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
        <div>
          <div class="flex flex-wrap items-center gap-3 mb-2">
            <h1 class="text-2xl font-bold text-slate-900 tracking-tight">
              月度结算详情
            </h1>
            <span
              class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200"
            >
              <Calendar class="w-3 h-3" />
              {{ monthlySettlement.month }}
            </span>
          </div>
          <div class="flex flex-wrap items-center gap-4 text-sm text-slate-500">
            <span class="inline-flex items-center gap-1.5">
              <Building2 class="w-4 h-4" />
              诊所：<span class="font-medium text-slate-700">{{ clinic.name }}</span>
            </span>
            <span class="inline-flex items-center gap-1.5">
              <BadgeDollarSign class="w-4 h-4" />
              结算方式：<span class="font-medium text-slate-700">{{
                SettlementMethodLabels[monthlySettlement.settlementMethod]
              }}</span>
            </span>
            <span class="inline-flex items-center gap-1.5">
              <Clock class="w-4 h-4" />
              账期：<span class="font-medium text-slate-700">{{
                monthlySettlement.paymentTermDays
              }} 天</span>
            </span>
          </div>
        </div>

        <div class="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            class="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            @click="loadData"
          >
            <RotateCcw class="w-4 h-4" />
            刷新
          </button>
          <button
            type="button"
            class="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors"
            @click="exportSettlementDetailCSV"
          >
            <Download class="w-4 h-4" />
            导出明细
          </button>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-4 mb-6">
      <StatCard
        title="订单总数"
        :value="monthlySettlement.orderCount"
        :icon="FileText"
        tone="primary"
        description="本月订单"
      />
      <StatCard
        title="总金额"
        :value="formatCurrency(monthlySettlement.totalAmount)"
        :icon="TrendingUp"
        tone="success"
        description="应收总额"
      />
      <StatCard
        title="已收金额"
        :value="formatCurrency(monthlySettlement.paidAmount)"
        :icon="Wallet"
        tone="primary"
        description="已收款"
      />
      <StatCard
        title="未收金额"
        :value="formatCurrency(monthlySettlement.unpaidAmount)"
        :icon="AlertTriangle"
        :tone="monthlySettlement.unpaidAmount > 0 ? 'warning' : 'success'"
        description="待收款"
      />
      <StatCard
        title="发票状态"
        :value="InvoiceStatusLabels[monthlySettlement.invoiceStatus]"
        :icon="Receipt"
        :tone="
          monthlySettlement.invoiceStatus === 'paid'
            ? 'success'
            : monthlySettlement.invoiceStatus === 'partial'
            ? 'warning'
            : monthlySettlement.invoiceStatus === 'issued'
            ? 'primary'
            : 'default'
        "
        description="开票情况"
      />
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <div class="xl:col-span-2 space-y-6">
        <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div class="px-5 py-4 border-b border-slate-100">
            <div class="flex items-center justify-between flex-wrap gap-3">
              <div class="flex items-center gap-2">
                <div
                  class="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center"
                >
                  <FileText class="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h2 class="text-base font-semibold text-slate-800">
                    对账单列表
                  </h2>
                  <p class="text-xs text-slate-500 mt-0.5">
                    本月共 {{ statements.length }} 张对账单
                  </p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <button
                  v-if="selectedStatementIds.length > 0"
                  type="button"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
                  @click="batchConfirmStatements"
                >
                  <CheckCheck class="w-3.5 h-3.5" />
                  批量确认
                </button>
                <button
                  v-if="selectedStatementIds.length > 0"
                  type="button"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md hover:bg-emerald-100 transition-colors"
                  @click="batchMarkPaid"
                >
                  <DollarSign class="w-3.5 h-3.5" />
                  批量标记已付款
                </button>
                <span
                  v-if="selectedStatementIds.length > 0"
                  class="text-xs text-slate-500"
                >
                  已选 {{ selectedStatementIds.length }} 项
                </span>
              </div>
            </div>
          </div>

          <div class="border-b border-slate-100 px-5 py-2.5 bg-slate-50/50">
            <div class="flex items-center gap-3">
              <input
                type="checkbox"
                :checked="allStatementsSelected"
                :indeterminate="someStatementsSelected"
                @change="toggleAllStatements"
                class="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span class="text-xs font-medium text-slate-600">全选</span>
            </div>
          </div>

          <div class="divide-y divide-slate-100">
            <div
              v-for="statement in statements"
              :key="statement.id"
              class="hover:bg-slate-50 transition-colors"
            >
              <div
                class="px-5 py-4 flex items-center gap-3 cursor-pointer"
                @click="toggleStatementExpand(statement.id)"
              >
                <input
                  type="checkbox"
                  :checked="selectedStatementIds.includes(statement.id)"
                  @click.stop
                  @change="toggleStatementSelection(statement.id)"
                  class="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 flex-wrap mb-1.5">
                    <span class="font-mono font-bold text-sm text-slate-800">
                      {{ statement.statementNumber }}
                    </span>
                    <span
                      class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border"
                      :class="StatementStatusColors[statement.status]"
                    >
                      {{ StatementStatusLabels[statement.status] }}
                    </span>
                    <span
                      class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border"
                      :class="InvoiceStatusColors[statement.invoiceStatus]"
                    >
                      {{ InvoiceStatusLabels[statement.invoiceStatus] }}
                    </span>
                  </div>
                  <div class="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                    <span class="inline-flex items-center gap-1">
                      <Layers class="w-3 h-3" />
                      {{ statement.orderCount }} 笔订单
                    </span>
                    <span class="inline-flex items-center gap-1">
                      <Calendar class="w-3 h-3" />
                      到期日：{{ formatDateStr(statement.dueDate) }}
                    </span>
                    <span
                      v-if="statement.invoiceNumber"
                      class="inline-flex items-center gap-1 font-mono"
                    >
                      <Receipt class="w-3 h-3" />
                      {{ statement.invoiceNumber }}
                    </span>
                  </div>
                </div>
                <div class="text-right flex-shrink-0">
                  <div class="text-lg font-bold text-slate-900">
                    ¥{{ statement.totalAmount.toLocaleString() }}
                  </div>
                  <div
                    v-if="statement.unpaidAmount > 0"
                    class="text-xs text-amber-600 font-medium mt-0.5"
                  >
                    未收：¥{{ statement.unpaidAmount.toLocaleString() }}
                  </div>
                </div>
                <component
                  :is="
                    expandedStatementIds.includes(statement.id)
                      ? ChevronUp
                      : ChevronDown
                  "
                  class="w-4 h-4 text-slate-400 flex-shrink-0"
                />
              </div>

              <div
                v-if="expandedStatementIds.includes(statement.id)"
                class="bg-slate-50/50 border-t border-slate-100 px-5 py-3"
              >
                <div class="text-xs font-semibold text-slate-700 mb-2">
                  订单明细（{{ statement.items.length }} 笔）
                </div>
                <div class="space-y-1.5">
                  <div
                    v-for="item in statement.items"
                    :key="item.id"
                    class="flex items-center justify-between py-1.5 px-3 bg-white rounded-lg border border-slate-100 text-xs hover:border-blue-200 hover:bg-blue-50/30 transition-colors cursor-pointer"
                    @click="goToOrderDetail(item.orderId)"
                  >
                    <div class="flex items-center gap-3">
                      <span class="font-mono font-medium text-slate-700">
                        {{ item.orderNumber }}
                      </span>
                      <span class="text-slate-400">|</span>
                      <span class="text-slate-500">
                        {{ item.workItemsCount }} 件
                      </span>
                      <span
                        v-if="item.isRework"
                        class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-rose-50 text-rose-600 border border-rose-100"
                      >
                        <AlertCircle class="w-2.5 h-2.5" />
                        返工
                      </span>
                    </div>
                    <div class="flex items-center gap-2">
                      <span class="font-semibold text-slate-800">
                        ¥{{ item.totalAmount.toLocaleString() }}
                      </span>
                      <Eye class="w-3 h-3 text-slate-400" />
                    </div>
                  </div>
                </div>
                <div
                  v-if="statement.remark"
                  class="mt-3 p-2 bg-amber-50 border border-amber-100 rounded-lg text-xs text-amber-700"
                >
                  <span class="font-medium">备注：</span>{{ statement.remark }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div class="px-5 py-4 border-b border-slate-100">
            <div class="flex items-center gap-2">
              <div
                class="w-8 h-8 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center"
              >
                <Layers class="w-4 h-4 text-teal-600" />
              </div>
              <div>
                <h2 class="text-base font-semibold text-slate-800">
                  订单明细
                </h2>
                <p class="text-xs text-slate-500 mt-0.5">
                  点击展开查看收费项目明细，共 {{ monthOrders.length }} 笔订单
                </p>
              </div>
            </div>
          </div>

          <div class="divide-y divide-slate-100">
            <div
              v-for="order in monthOrders"
              :key="order.id"
              class="hover:bg-slate-50 transition-colors"
            >
              <div
                class="px-5 py-4 flex items-center gap-3 cursor-pointer"
                @click="toggleOrderExpand(order.id)"
              >
                <component
                  :is="
                    expandedOrderIds.includes(order.id)
                      ? ChevronDown
                      : ChevronRight
                  "
                  class="w-4 h-4 text-slate-400 flex-shrink-0"
                />
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 flex-wrap mb-1.5">
                    <span class="font-mono font-bold text-sm text-slate-800">
                      {{ order.orderNumber }}
                    </span>
                    <span
                      v-if="order.returnRecords.length > 0"
                      class="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-medium bg-rose-50 text-rose-600 border border-rose-200"
                    >
                      <AlertCircle class="w-3 h-3" />
                      返工 x{{ order.returnRecords.length }}
                    </span>
                  </div>
                  <div class="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                    <span class="inline-flex items-center gap-1">
                      <Calendar class="w-3 h-3" />
                      下单：{{ formatDateStr(order.createdAt) }}
                    </span>
                    <span class="inline-flex items-center gap-1">
                      <Clock class="w-3 h-3" />
                      交付：{{ order.deliveryDate }}
                    </span>
                    <span class="inline-flex items-center gap-1">
                      <Layers class="w-3 h-3" />
                      {{ order.workItems.length }} 件修复体
                    </span>
                    <span class="inline-flex items-center gap-1">
                      医生：{{ order.doctorName }}
                    </span>
                  </div>
                </div>
                <div class="text-right flex-shrink-0">
                  <div class="text-base font-bold text-slate-900">
                    ¥{{ (order.totalAmount || 0).toLocaleString() }}
                  </div>
                </div>
                <button
                  type="button"
                  class="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                  title="查看订单详情"
                  @click.stop="goToOrderDetail(order.id)"
                >
                  <Eye class="w-4 h-4" />
                </button>
              </div>

              <div
                v-if="expandedOrderIds.includes(order.id)"
                class="bg-slate-50/50 border-t border-slate-100 px-5 py-4"
              >
                <template v-if="getOrderQuote(order.id)">
                  <div class="space-y-3">
                    <div
                      v-for="(item, idx) in getOrderQuote(order.id)!.items"
                      :key="item.id"
                      class="bg-white rounded-lg border border-slate-100 p-3"
                    >
                      <div class="flex items-start justify-between gap-4">
                        <div class="flex-1 min-w-0">
                          <div class="flex items-center gap-2 mb-1.5">
                            <span
                              class="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700"
                            >
                              {{ idx + 1 }}
                            </span>
                            <span class="text-sm font-semibold text-slate-800">
                              {{ item.toothNumber === 'all' ? '全口' : item.toothNumber }}
                            </span>
                            <span
                              v-if="item.isRework"
                              class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-rose-50 text-rose-600 border border-rose-100"
                            >
                              返工
                            </span>
                          </div>
                          <div class="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
                            <span>
                              类型：
                              <span class="font-medium text-slate-700">
                                {{ RestorationTypeLabels[item.restorationType] }}
                              </span>
                            </span>
                            <span>
                              材料：
                              <span class="font-medium text-slate-700">
                                {{ MaterialTypeLabels[item.material] }}
                              </span>
                            </span>
                            <span>数量：{{ item.quantity }}</span>
                          </div>
                        </div>
                        <div class="text-right flex-shrink-0">
                          <div class="text-sm font-bold text-slate-900">
                            ¥{{ item.subtotal.toLocaleString() }}
                          </div>
                          <div class="text-[10px] text-slate-500">
                            单价 ¥{{ item.unitPrice.toLocaleString() }}
                          </div>
                        </div>
                      </div>
                      <div
                        v-if="
                          item.surcharge > 0 ||
                          item.discountAmount > 0 ||
                          item.reworkCharge > 0
                        "
                        class="mt-2 pt-2 border-t border-slate-100 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500"
                      >
                        <span v-if="item.surcharge > 0" class="text-amber-600">
                          加急费 +¥{{ item.surcharge }}
                        </span>
                        <span v-if="item.discountAmount > 0" class="text-emerald-600">
                          折扣 -¥{{ item.discountAmount }}
                        </span>
                        <span v-if="item.reworkCharge > 0" class="text-rose-600">
                          返工费 +¥{{ item.reworkCharge }}
                        </span>
                      </div>
                    </div>

                    <div
                      class="flex items-center justify-between py-2.5 px-3 bg-slate-100/50 rounded-lg"
                    >
                      <span class="text-sm font-medium text-slate-700">订单合计</span>
                      <span class="text-lg font-bold text-slate-900">
                        ¥{{ getOrderQuote(order.id)!.totalAmount.toLocaleString() }}
                      </span>
                    </div>
                  </div>
                </template>
                <template v-else>
                  <div class="text-center py-4 text-xs text-slate-500">
                    暂无报价信息
                  </div>
                </template>
              </div>
            </div>

            <div v-if="monthOrders.length === 0" class="px-5 py-16 text-center">
              <div class="flex flex-col items-center gap-2">
                <div class="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
                  <FileText class="w-8 h-8 text-slate-400" />
                </div>
                <div class="text-sm font-medium text-slate-600">本月暂无订单</div>
                <div class="text-xs text-slate-400">该月没有订单记录</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="space-y-6">
        <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div class="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <div
              class="w-8 h-8 rounded-lg bg-violet-50 border border-violet-100 flex items-center justify-center"
            >
              <BarChart3 class="w-4 h-4 text-violet-600" />
            </div>
            <h2 class="text-base font-semibold text-slate-800">账龄分析</h2>
          </div>
          <div class="p-5">
            <div
              v-if="totalUnpaidAmount === 0"
              class="py-6 text-center"
            >
              <div class="flex flex-col items-center gap-2">
                <div class="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                  <CheckCircle2 class="w-6 h-6 text-emerald-600" />
                </div>
                <div class="text-sm font-medium text-emerald-700">
                  全部已结清
                </div>
                <div class="text-xs text-slate-500">本月无未收款项</div>
              </div>
            </div>
            <div v-else class="space-y-4">
              <div
                v-for="(group, idx) in agingAnalysis"
                :key="group.label"
                class="group"
              >
                <div class="flex items-center justify-between mb-1.5 text-xs">
                  <span class="font-medium text-slate-700 flex items-center gap-1.5">
                    <span
                      class="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold"
                      :class="{
                        'bg-emerald-100 text-emerald-700': idx === 0,
                        'bg-amber-100 text-amber-700': idx === 1,
                        'bg-orange-100 text-orange-700': idx === 2,
                        'bg-rose-100 text-rose-700': idx === 3,
                        'bg-rose-200 text-rose-800': idx === 4,
                      }"
                    >
                      {{ group.count }}
                    </span>
                    {{ group.label }}
                  </span>
                  <span class="text-slate-500 font-mono">
                    ¥{{ group.amount.toLocaleString() }}
                  </span>
                </div>
                <div class="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    class="h-full rounded-full transition-all"
                    :style="{
                      width: totalUnpaidAmount > 0
                        ? `${(group.amount / totalUnpaidAmount) * 100}%`
                        : '0%',
                      background:
                        idx === 0
                          ? '#10b981'
                          : idx === 1
                          ? '#f59e0b'
                          : idx === 2
                          ? '#f97316'
                          : idx === 3
                          ? '#f43f5e'
                          : '#e11d48',
                    }"
                  ></div>
                </div>
              </div>

              <div class="pt-3 border-t border-slate-100">
                <div class="flex items-center justify-between text-sm">
                  <span class="text-slate-500">未收合计</span>
                  <span class="font-bold text-slate-900">
                    ¥{{ totalUnpaidAmount.toLocaleString() }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div class="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <div
              class="w-8 h-8 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center"
            >
              <CreditCard class="w-4 h-4 text-amber-600" />
            </div>
            <h2 class="text-base font-semibold text-slate-800">结算信息</h2>
          </div>
          <div class="p-5 space-y-3 text-sm">
            <div class="flex items-center justify-between">
              <span class="text-slate-500 inline-flex items-center gap-1.5">
                <BadgeDollarSign class="w-3.5 h-3.5" />
                结算方式
              </span>
              <span class="font-medium text-slate-800">
                {{ SettlementMethodLabels[clinic.settlementMethod] }}
              </span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-slate-500 inline-flex items-center gap-1.5">
                <Clock class="w-3.5 h-3.5" />
                账期天数
              </span>
              <span class="font-medium text-slate-800">
                {{ clinic.paymentTermDays }} 天
              </span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-slate-500 inline-flex items-center gap-1.5">
                <Receipt class="w-3.5 h-3.5" />
                发票状态
              </span>
              <span
                class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border"
                :class="InvoiceStatusColors[monthlySettlement.invoiceStatus]"
              >
                {{ InvoiceStatusLabels[monthlySettlement.invoiceStatus] }}
              </span>
            </div>
            <div class="pt-3 border-t border-slate-100">
              <div class="text-xs font-semibold text-slate-700 mb-2">金额汇总</div>
              <div class="space-y-2">
                <div class="flex items-center justify-between text-xs">
                  <span class="text-slate-500">订单总数</span>
                  <span class="font-medium text-slate-700">
                    {{ monthlySettlement.orderCount }} 笔
                  </span>
                </div>
                <div class="flex items-center justify-between text-xs">
                  <span class="text-slate-500">应收总额</span>
                  <span class="font-medium text-slate-700">
                    ¥{{ monthlySettlement.totalAmount.toLocaleString() }}
                  </span>
                </div>
                <div class="flex items-center justify-between text-xs">
                  <span class="text-slate-500">已收金额</span>
                  <span class="font-medium text-emerald-600">
                    ¥{{ monthlySettlement.paidAmount.toLocaleString() }}
                  </span>
                </div>
                <div class="flex items-center justify-between text-xs">
                  <span class="text-slate-500">未收金额</span>
                  <span class="font-medium text-amber-600">
                    ¥{{ monthlySettlement.unpaidAmount.toLocaleString() }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div class="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <div
              class="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center"
            >
              <FileText class="w-4 h-4 text-emerald-600" />
            </div>
            <h2 class="text-base font-semibold text-slate-800">快速操作</h2>
          </div>
          <div class="p-4 space-y-2">
            <button
              type="button"
              class="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              @click="exportSettlementDetailCSV"
            >
              <Download class="w-4 h-4" />
              导出结算明细
            </button>
            <button
              type="button"
              class="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              @click="handleExportCSV"
            >
              <FileText class="w-4 h-4" />
              导出对账单
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
