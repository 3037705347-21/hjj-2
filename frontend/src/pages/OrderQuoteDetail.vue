<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft,
  Building2,
  Calendar,
  Clock,
  DollarSign,
  Tag,
  Receipt,
  CreditCard,
  Pencil,
  Check,
  X,
  BadgeDollarSign,
  TrendingUp,
  TrendingDown,
  FileText,
  Settings,
  RefreshCw,
  Plus,
  Minus,
  AlertCircle,
  CheckCircle2,
  Info,
} from 'lucide-vue-next'
import { usePricing } from '../composables/usePricing'
import { useOrders } from '../composables/useOrders'
import {
  RestorationTypeLabels,
  MaterialTypeLabels,
  PriorityLabels,
  InvoiceStatusLabels,
  InvoiceStatusColors,
  SettlementMethodLabels,
  type OrderQuote,
  type QuoteItem,
  type InvoiceStatus,
} from '../types'
import PriorityBadge from '../components/PriorityBadge.vue'
import StatCard from '../components/StatCard.vue'

const route = useRoute()
const router = useRouter()
const { getOrderById } = useOrders()
const { getOrCreateQuote, updateQuoteAmount, updateQuotePayment, findPriceRule } = usePricing()

const orderId = computed(() => String(route.params.orderId))
const order = computed(() => getOrderById(orderId.value))
const quote = computed<OrderQuote | undefined>(() => {
  if (!order.value) return undefined
  return getOrCreateQuote(order.value)
})

const isEditingAmount = ref(false)
const editTotalAmount = ref(0)
const showPaymentDialog = ref(false)
const paymentAmount = ref(0)

function startEditAmount() {
  if (!quote.value) return
  editTotalAmount.value = quote.value.totalAmount
  isEditingAmount.value = true
}

function cancelEditAmount() {
  isEditingAmount.value = false
}

function saveEditAmount() {
  if (!quote.value) return
  updateQuoteAmount(orderId.value, editTotalAmount.value)
  isEditingAmount.value = false
}

function openPaymentDialog() {
  if (!quote.value) return
  paymentAmount.value = quote.value.unpaidAmount
  showPaymentDialog.value = true
}

function closePaymentDialog() {
  showPaymentDialog.value = false
}

function handlePayment() {
  if (!quote.value || paymentAmount.value <= 0) return
  const newReceivedAmount = quote.value.receivedAmount + paymentAmount.value
  let newInvoiceStatus: InvoiceStatus = 'unissued'
  if (newReceivedAmount >= quote.value.totalAmount) {
    newInvoiceStatus = 'paid'
  } else if (newReceivedAmount > 0) {
    newInvoiceStatus = 'partial'
  }
  updateQuotePayment(orderId.value, newReceivedAmount, newInvoiceStatus)
  showPaymentDialog.value = false
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatCurrency(amount: number): string {
  return `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function hasPriceRule(item: QuoteItem): boolean {
  return !!item.priceRuleId
}

function getPriceRuleName(item: QuoteItem): string {
  if (!item.priceRuleId) return ''
  const rule = findPriceRule({
    restorationType: item.restorationType,
    material: item.material,
    priority: item.priority,
  })
  return rule?.name || ''
}

function goBack() {
  router.back()
}

function goToOrderDetail() {
  router.push(`/order/${orderId.value}`)
}
</script>

<template>
  <div v-if="order && quote" class="min-h-full pb-12">
    <div class="mb-6">
      <button
        class="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 mb-4 transition-colors"
        @click="goBack"
      >
        <ArrowLeft class="w-4 h-4" />
        返回
      </button>

      <div class="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-4">
        <div>
          <div class="flex flex-wrap items-center gap-3 mb-2">
            <h1 class="text-2xl font-bold text-slate-900 tracking-tight font-mono">
              {{ order.orderNumber }}
            </h1>
            <PriorityBadge :priority="order.priority" />
            <span
              class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium"
              :class="InvoiceStatusColors[quote.invoiceStatus]"
            >
              <Receipt class="w-3 h-3" />
              {{ InvoiceStatusLabels[quote.invoiceStatus] }}
            </span>
          </div>
          <p class="text-sm text-slate-500">
            报价明细 · 下单时间：{{ formatDate(order.createdAt) }}
          </p>
        </div>

        <div class="flex items-center gap-2 flex-wrap">
          <button
            class="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            @click="goToOrderDetail"
          >
            <FileText class="w-4 h-4" />
            订单详情
          </button>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-xl border border-slate-200 overflow-hidden mb-6">
      <div class="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
            <Building2 class="w-4 h-4 text-blue-600" />
          </div>
          <h2 class="text-base font-semibold text-slate-800">订单基本信息</h2>
        </div>
      </div>
      <div class="p-5">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div class="text-xs text-slate-500 mb-1">订单号</div>
            <div class="text-sm font-medium text-slate-800 font-mono">{{ order.orderNumber }}</div>
          </div>
          <div>
            <div class="text-xs text-slate-500 mb-1">诊所名称</div>
            <div class="text-sm font-medium text-slate-800">{{ order.clinic.name }}</div>
          </div>
          <div>
            <div class="text-xs text-slate-500 mb-1">下单时间</div>
            <div class="text-sm font-medium text-slate-800">{{ formatDate(order.createdAt) }}</div>
          </div>
          <div>
            <div class="text-xs text-slate-500 mb-1">加急等级</div>
            <div class="text-sm font-medium text-slate-800">
              {{ PriorityLabels[order.priority] }}
            </div>
          </div>
          <div>
            <div class="text-xs text-slate-500 mb-1">结算方式</div>
            <div class="text-sm font-medium text-slate-800">
              {{ SettlementMethodLabels[order.clinic.settlementMethod] }}
            </div>
          </div>
          <div>
            <div class="text-xs text-slate-500 mb-1">医生</div>
            <div class="text-sm font-medium text-slate-800">{{ order.doctorName }}</div>
          </div>
          <div>
            <div class="text-xs text-slate-500 mb-1">患者编号</div>
            <div class="text-sm font-medium text-slate-800 font-mono">{{ order.patient.anonymousCode }}</div>
          </div>
          <div>
            <div class="text-xs text-slate-500 mb-1">牙位数</div>
            <div class="text-sm font-medium text-slate-800">{{ quote.items.length }} 颗</div>
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <StatCard
        title="基础金额"
        :value="formatCurrency(quote.subtotal)"
        :icon="DollarSign"
        tone="primary"
      />
      <StatCard
        title="附加费合计"
        :value="formatCurrency(quote.surchargeTotal)"
        :icon="TrendingUp"
        tone="warning"
      />
      <StatCard
        title="折扣合计"
        :value="formatCurrency(quote.discountTotal)"
        :icon="Tag"
        tone="success"
      />
      <StatCard
        title="返工收费合计"
        :value="formatCurrency(quote.reworkChargeTotal)"
        :icon="RefreshCw"
        tone="danger"
      />
    </div>

    <div class="bg-white rounded-xl border border-slate-200 overflow-hidden mb-6">
      <div class="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-lg bg-violet-50 border border-violet-100 flex items-center justify-center">
            <BadgeDollarSign class="w-4 h-4 text-violet-600" />
          </div>
          <h2 class="text-base font-semibold text-slate-800">收款统计</h2>
        </div>
        <div class="flex items-center gap-2">
          <button
            v-if="!isEditingAmount"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
            @click="startEditAmount"
          >
            <Pencil class="w-3.5 h-3.5" />
            调整金额
          </button>
          <button
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
            @click="openPaymentDialog"
          >
            <CreditCard class="w-3.5 h-3.5" />
            登记收款
          </button>
        </div>
      </div>
      <div class="p-5">
        <div v-if="isEditingAmount" class="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2">
              <Info class="w-4 h-4 text-blue-600" />
              <span class="text-sm font-medium text-blue-800">调整应收总金额</span>
            </div>
            <div class="flex items-center gap-2">
              <button
                class="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors"
                @click="cancelEditAmount"
              >
                <X class="w-3 h-3" />
                取消
              </button>
              <button
                class="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                @click="saveEditAmount"
              >
                <Check class="w-3 h-3" />
                保存
              </button>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <span class="text-sm text-slate-600">应收总金额：</span>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">¥</span>
              <input
                v-model.number="editTotalAmount"
                type="number"
                class="pl-7 pr-3 py-2 text-sm font-medium text-slate-800 border border-blue-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-40"
                min="0"
                step="0.01"
              />
            </div>
          </div>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div class="text-xs text-slate-500 mb-1">应收总金额</div>
            <div class="text-xl font-bold text-slate-900 tracking-tight">
              {{ formatCurrency(quote.totalAmount) }}
            </div>
          </div>
          <div class="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
            <div class="text-xs text-emerald-600 mb-1">已收金额</div>
            <div class="text-xl font-bold text-emerald-700 tracking-tight">
              {{ formatCurrency(quote.receivedAmount) }}
            </div>
          </div>
          <div
            class="p-4 rounded-lg border"
            :class="quote.unpaidAmount > 0 ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-200'"
          >
            <div class="text-xs mb-1" :class="quote.unpaidAmount > 0 ? 'text-rose-600' : 'text-slate-500'">
              未收金额
            </div>
            <div class="text-xl font-bold tracking-tight" :class="quote.unpaidAmount > 0 ? 'text-rose-700' : 'text-slate-900'">
              {{ formatCurrency(quote.unpaidAmount) }}
            </div>
          </div>
          <div class="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div class="text-xs text-blue-600 mb-1">发票状态</div>
            <div class="flex items-center gap-2">
              <span
                class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium"
                :class="InvoiceStatusColors[quote.invoiceStatus]"
              >
                {{ InvoiceStatusLabels[quote.invoiceStatus] }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div class="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center">
            <Settings class="w-4 h-4 text-teal-600" />
          </div>
          <div>
            <h2 class="text-base font-semibold text-slate-800">报价明细</h2>
            <p class="text-xs text-slate-500">共 {{ quote.items.length }} 项收费明细</p>
          </div>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-200">
              <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                牙位
              </th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                修复类型
              </th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                材料
              </th>
              <th class="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                单价
              </th>
              <th class="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                数量
              </th>
              <th class="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                附加费
              </th>
              <th class="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                折扣
              </th>
              <th class="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                返工费
              </th>
              <th class="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                小计
              </th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                价格规则
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr
              v-for="item in quote.items"
              :key="item.id"
              class="hover:bg-slate-50/50 transition-colors"
            >
              <td class="px-4 py-3">
                <span class="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 text-slate-700 font-mono font-bold text-sm">
                  {{ item.toothNumber }}
                </span>
              </td>
              <td class="px-4 py-3">
                <span class="text-sm text-slate-800">
                  {{ RestorationTypeLabels[item.restorationType] }}
                </span>
              </td>
              <td class="px-4 py-3">
                <span class="text-sm text-slate-800">
                  {{ MaterialTypeLabels[item.material] }}
                </span>
              </td>
              <td class="px-4 py-3 text-right">
                <span class="text-sm text-slate-700 font-mono">
                  {{ formatCurrency(item.unitPrice) }}
                </span>
              </td>
              <td class="px-4 py-3 text-center">
                <span class="text-sm text-slate-700">{{ item.quantity }}</span>
              </td>
              <td class="px-4 py-3 text-right">
                <span v-if="item.surcharge > 0" class="text-sm text-amber-600 font-mono">
                  +{{ formatCurrency(item.surcharge) }}
                </span>
                <span v-else class="text-sm text-slate-400">-</span>
              </td>
              <td class="px-4 py-3 text-right">
                <span v-if="item.discountAmount > 0" class="text-sm text-emerald-600 font-mono">
                  -{{ formatCurrency(item.discountAmount) }}
                </span>
                <span v-else class="text-sm text-slate-400">-</span>
              </td>
              <td class="px-4 py-3 text-right">
                <span v-if="item.reworkCharge > 0" class="text-sm text-rose-600 font-mono">
                  +{{ formatCurrency(item.reworkCharge) }}
                </span>
                <span v-else class="text-sm text-slate-400">-</span>
              </td>
              <td class="px-4 py-3 text-right">
                <span class="text-sm font-semibold text-slate-900 font-mono">
                  {{ formatCurrency(item.subtotal) }}
                </span>
              </td>
              <td class="px-4 py-3">
                <div v-if="hasPriceRule(item)" class="flex items-center gap-1">
                  <CheckCircle2 class="w-3.5 h-3.5 text-emerald-500" />
                  <span class="text-xs text-slate-600" :title="getPriceRuleName(item)">
                    {{ getPriceRuleName(item) }}
                  </span>
                </div>
                <div v-else class="flex items-center gap-1">
                  <AlertCircle class="w-3.5 h-3.5 text-slate-400" />
                  <span class="text-xs text-slate-400">未匹配</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="border-t border-slate-200 bg-slate-50/50 p-5">
        <div class="flex flex-col md:flex-row md:items-center justify-end gap-4">
          <div class="flex flex-col gap-2 md:w-72">
            <div class="flex items-center justify-between text-sm">
              <span class="text-slate-500">基础金额</span>
              <span class="text-slate-700 font-mono">{{ formatCurrency(quote.subtotal) }}</span>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-slate-500">附加费合计</span>
              <span class="text-amber-600 font-mono">+{{ formatCurrency(quote.surchargeTotal) }}</span>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-slate-500">折扣合计</span>
              <span class="text-emerald-600 font-mono">-{{ formatCurrency(quote.discountTotal) }}</span>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-slate-500">返工收费合计</span>
              <span class="text-rose-600 font-mono">+{{ formatCurrency(quote.reworkChargeTotal) }}</span>
            </div>
            <div class="border-t border-slate-200 pt-2 mt-1">
              <div class="flex items-center justify-between">
                <span class="text-base font-semibold text-slate-800">应收总金额</span>
                <span class="text-xl font-bold text-slate-900 font-mono tracking-tight">
                  {{ formatCurrency(quote.totalAmount) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showPaymentDialog" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" @click="closePaymentDialog"></div>
      <div class="relative bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md mx-4">
        <div class="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center">
              <CreditCard class="w-4 h-4 text-emerald-600" />
            </div>
            <h3 class="text-base font-semibold text-slate-800">登记收款</h3>
          </div>
          <button
            class="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            @click="closePaymentDialog"
          >
            <X class="w-5 h-5" />
          </button>
        </div>
        <div class="p-5 space-y-4">
          <div class="grid grid-cols-2 gap-3">
            <div class="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div class="text-xs text-slate-500 mb-1">应收金额</div>
              <div class="text-lg font-bold text-slate-900 font-mono">
                {{ formatCurrency(quote.totalAmount) }}
              </div>
            </div>
            <div class="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
              <div class="text-xs text-emerald-600 mb-1">已收金额</div>
              <div class="text-lg font-bold text-emerald-700 font-mono">
                {{ formatCurrency(quote.receivedAmount) }}
              </div>
            </div>
          </div>

          <div class="p-3 bg-rose-50 rounded-lg border border-rose-200">
            <div class="text-xs text-rose-600 mb-1">待收金额</div>
            <div class="text-lg font-bold text-rose-700 font-mono">
              {{ formatCurrency(quote.unpaidAmount) }}
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-2">
              收款金额
            </label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">¥</span>
              <input
                v-model.number="paymentAmount"
                type="number"
                class="w-full pl-8 pr-4 py-2.5 text-sm font-medium text-slate-800 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                min="0"
                :max="quote.unpaidAmount"
                step="0.01"
                placeholder="请输入收款金额"
              />
            </div>
            <div class="mt-2 flex items-center gap-2">
              <button
                class="px-2 py-1 text-xs text-slate-600 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors"
                @click="paymentAmount = quote.unpaidAmount"
              >
                全额
              </button>
              <button
                class="px-2 py-1 text-xs text-slate-600 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors"
                @click="paymentAmount = Math.round(quote.unpaidAmount / 2 * 100) / 100"
              >
                一半
              </button>
            </div>
          </div>

          <div class="text-xs text-slate-500">
            <p>收款后，已收金额将更新为 {{ formatCurrency(quote.receivedAmount + (paymentAmount || 0)) }}</p>
          </div>
        </div>
        <div class="px-5 py-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            class="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            @click="closePaymentDialog"
          >
            取消
          </button>
          <button
            class="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
            :disabled="paymentAmount <= 0 || paymentAmount > quote.unpaidAmount"
            :class="{ 'opacity-50 cursor-not-allowed': paymentAmount <= 0 || paymentAmount > quote.unpaidAmount }"
            @click="handlePayment"
          >
            确认收款
          </button>
        </div>
      </div>
    </div>
  </div>

  <div v-else class="min-h-full flex items-center justify-center">
    <div class="text-center">
      <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
        <FileText class="w-8 h-8 text-slate-300" />
      </div>
      <p class="text-sm text-slate-500">加载中...</p>
    </div>
  </div>
</template>
