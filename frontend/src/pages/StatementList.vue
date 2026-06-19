<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  FileText,
  Search,
  Download,
  RotateCcw,
  Eye,
  CheckCircle,
  CreditCard,
  Clock,
  AlertTriangle,
  TrendingUp,
  Wallet,
  ChevronLeft,
  ChevronRight,
  Building2,
  Calendar,
  Receipt,
  ChevronDown,
  ChevronUp,
  XCircle,
} from 'lucide-vue-next'
import { usePricing } from '../composables/usePricing'
import { useClinics } from '../composables/useClinics'
import type { StatementStatus, InvoiceStatus, Statement } from '../types'
import {
  StatementStatusLabels,
  StatementStatusColors,
  InvoiceStatusLabels,
  InvoiceStatusColors,
} from '../types'
import StatCard from '../components/StatCard.vue'
import { cn } from '../lib/utils'

const router = useRouter()
const {
  statements,
  searchStatements,
  downloadStatementsCSV,
  updateStatementStatus,
} = usePricing()
const { clinics } = useClinics()

const filters = reactive({
  clinicId: '',
  month: '',
  status: '' as StatementStatus | '',
  invoiceStatus: '' as InvoiceStatus | '',
})

const pageSize = 10
const currentPage = ref(1)
const expandedRows = ref<Set<string>>(new Set())

const showConfirmDialog = ref(false)
const showPaidDialog = ref(false)
const targetStatement = ref<Statement | null>(null)

const availableMonths = computed(() => {
  const months = new Set(statements.value.map((s) => s.month))
  return Array.from(months).sort().reverse()
})

const filteredStatements = computed(() => {
  return searchStatements({
    clinicId: filters.clinicId || undefined,
    month: filters.month || undefined,
    status: filters.status || undefined,
    invoiceStatus: filters.invoiceStatus || undefined,
  })
})

const totalPages = computed(() => Math.ceil(filteredStatements.value.length / pageSize))

const paginatedStatements = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredStatements.value.slice(start, start + pageSize)
})

const stats = computed(() => {
  const list = statements.value
  const total = list.length
  const pending = list.filter((s) => s.status === 'pending').length
  const paid = list.filter((s) => s.status === 'paid').length
  const overdue = list.filter((s) => s.status === 'overdue').length
  const totalAmount = list.reduce((s, c) => s + c.totalAmount, 0)
  const unpaidAmount = list.reduce((s, c) => s + c.unpaidAmount, 0)
  return { total, pending, paid, overdue, totalAmount, unpaidAmount }
})

function resetFilters() {
  filters.clinicId = ''
  filters.month = ''
  filters.status = ''
  filters.invoiceStatus = ''
  currentPage.value = 1
}

function handleExport() {
  downloadStatementsCSV(filteredStatements.value)
}

function toggleExpand(id: string) {
  if (expandedRows.value.has(id)) {
    expandedRows.value.delete(id)
  } else {
    expandedRows.value.add(id)
  }
}

function isExpanded(id: string): boolean {
  return expandedRows.value.has(id)
}

function formatCurrency(amount: number): string {
  if (amount >= 10000) {
    return `¥${(amount / 10000).toFixed(2)}万`
  }
  return `¥${amount.toLocaleString()}`
}

function goToDetail(id: string) {
  router.push(`/statement/${id}`)
}

function openConfirmDialog(statement: Statement) {
  targetStatement.value = statement
  showConfirmDialog.value = true
}

function doConfirm() {
  if (targetStatement.value) {
    updateStatementStatus(targetStatement.value.id, 'confirmed')
  }
  showConfirmDialog.value = false
  targetStatement.value = null
}

function openPaidDialog(statement: Statement) {
  targetStatement.value = statement
  showPaidDialog.value = true
}

function doMarkPaid() {
  if (targetStatement.value) {
    updateStatementStatus(targetStatement.value.id, 'paid')
  }
  showPaidDialog.value = false
  targetStatement.value = null
}

function getClinicName(clinicId: string): string {
  const clinic = clinics.value.find((c) => c.id === clinicId)
  return clinic?.name || ''
}

onMounted(() => {
})
</script>

<template>
  <div class="min-h-full pb-12">
    <div class="mb-6 flex flex-col lg:flex-row lg:items-start justify-between gap-4">
      <div>
        <div class="flex items-center gap-3 mb-2">
          <h1 class="text-2xl font-bold text-slate-900 tracking-tight">对账单管理</h1>
          <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Receipt class="w-3 h-3" />
            月度对账单与结算
          </span>
        </div>
        <p class="text-sm text-slate-500">
          管理诊所月度对账单，查看订单明细，跟踪收款状态与发票信息
        </p>
      </div>
      <div class="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          class="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          @click="handleExport"
        >
          <Download class="w-4 h-4" />
          导出CSV
        </button>
      </div>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
      <StatCard
        title="对账单总数"
        :value="stats.total"
        :icon="FileText"
        tone="primary"
        description="份对账单"
      />
      <StatCard
        title="待确认"
        :value="stats.pending"
        :icon="Clock"
        tone="warning"
        description="等待诊所确认"
      />
      <StatCard
        title="已结清"
        :value="stats.paid"
        :icon="CheckCircle"
        tone="success"
        description="款项已收齐"
      />
      <StatCard
        title="逾期数"
        :value="stats.overdue"
        :icon="AlertTriangle"
        tone="danger"
        description="已逾期未结"
      />
      <StatCard
        title="总金额"
        :value="formatCurrency(stats.totalAmount)"
        :icon="TrendingUp"
        tone="primary"
        description="累计对账金额"
      />
      <StatCard
        title="未收金额"
        :value="formatCurrency(stats.unpaidAmount)"
        :icon="Wallet"
        tone="warning"
        description="待收款项"
      />
    </div>

    <div class="bg-white rounded-xl border border-slate-200 overflow-hidden mb-6">
      <div class="px-5 py-4 border-b border-slate-100">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center">
            <Search class="w-4 h-4 text-slate-600" />
          </div>
          <h2 class="text-base font-semibold text-slate-800">筛选条件</h2>
        </div>
      </div>
      <div class="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div>
          <label class="block text-xs font-medium text-slate-600 mb-1.5">诊所</label>
          <select
            v-model="filters.clinicId"
            class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">全部诊所</option>
            <option
              v-for="clinic in clinics"
              :key="clinic.id"
              :value="clinic.id"
            >
              {{ clinic.name }}
            </option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-medium text-slate-600 mb-1.5">月份</label>
          <select
            v-model="filters.month"
            class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">全部月份</option>
            <option
              v-for="month in availableMonths"
              :key="month"
              :value="month"
            >
              {{ month }}
            </option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-medium text-slate-600 mb-1.5">状态</label>
          <select
            v-model="filters.status"
            class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">全部状态</option>
            <option
              v-for="(label, key) in StatementStatusLabels"
              :key="key"
              :value="key"
            >
              {{ label }}
            </option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-medium text-slate-600 mb-1.5">发票状态</label>
          <select
            v-model="filters.invoiceStatus"
            class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">全部发票状态</option>
            <option
              v-for="(label, key) in InvoiceStatusLabels"
              :key="key"
              :value="key"
            >
              {{ label }}
            </option>
          </select>
        </div>
        <div class="flex items-end gap-2">
          <button
            type="button"
            class="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Search class="w-4 h-4" />
            搜索
          </button>
          <button
            type="button"
            class="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            @click="resetFilters"
          >
            <RotateCcw class="w-4 h-4" />
            重置
          </button>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div class="px-5 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
        <div class="flex items-center gap-2">
          <div class="text-sm font-medium text-slate-800">
            对账单列表
            <span class="text-slate-500 ml-1">
              （共 {{ filteredStatements.length }} 条记录）
            </span>
          </div>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-slate-50 border-b border-slate-200">
            <tr>
              <th class="px-5 py-3 text-left font-semibold text-slate-700 whitespace-nowrap w-10"></th>
              <th class="px-5 py-3 text-left font-semibold text-slate-700 whitespace-nowrap">对账单号</th>
              <th class="px-5 py-3 text-left font-semibold text-slate-700 whitespace-nowrap">诊所名称</th>
              <th class="px-5 py-3 text-left font-semibold text-slate-700 whitespace-nowrap">月份</th>
              <th class="px-5 py-3 text-right font-semibold text-slate-700 whitespace-nowrap">订单数</th>
              <th class="px-5 py-3 text-right font-semibold text-slate-700 whitespace-nowrap">总金额</th>
              <th class="px-5 py-3 text-right font-semibold text-slate-700 whitespace-nowrap">已收金额</th>
              <th class="px-5 py-3 text-right font-semibold text-slate-700 whitespace-nowrap">未收金额</th>
              <th class="px-5 py-3 text-center font-semibold text-slate-700 whitespace-nowrap">状态</th>
              <th class="px-5 py-3 text-center font-semibold text-slate-700 whitespace-nowrap">发票状态</th>
              <th class="px-5 py-3 text-center font-semibold text-slate-700 whitespace-nowrap">到期日</th>
              <th class="px-5 py-3 text-center font-semibold text-slate-700 whitespace-nowrap">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <template v-for="statement in paginatedStatements" :key="statement.id">
              <tr
                class="hover:bg-slate-50 transition-colors"
                :class="{ 'bg-slate-50': isExpanded(statement.id) }"
              >
                <td class="px-5 py-4">
                  <button
                    type="button"
                    class="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors"
                    @click="toggleExpand(statement.id)"
                  >
                    <ChevronDown v-if="!isExpanded(statement.id)" class="w-4 h-4" />
                    <ChevronUp v-else class="w-4 h-4" />
                  </button>
                </td>
                <td class="px-5 py-4">
                  <div class="font-semibold text-slate-900 font-mono text-xs">
                    {{ statement.statementNumber }}
                  </div>
                </td>
                <td class="px-5 py-4">
                  <div class="flex items-center gap-2">
                    <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                      <Building2 class="w-4 h-4 text-white" />
                    </div>
                    <div class="font-medium text-slate-900">{{ statement.clinicName }}</div>
                  </div>
                </td>
                <td class="px-5 py-4">
                  <div class="flex items-center gap-1.5 text-slate-700">
                    <Calendar class="w-3.5 h-3.5 text-slate-400" />
                    <span>{{ statement.month }}</span>
                  </div>
                </td>
                <td class="px-5 py-4 text-right">
                  <div class="font-semibold text-slate-900">{{ statement.orderCount }}</div>
                  <div class="text-[11px] text-slate-500">单</div>
                </td>
                <td class="px-5 py-4 text-right">
                  <div class="font-semibold text-slate-900">¥{{ statement.totalAmount.toLocaleString() }}</div>
                </td>
                <td class="px-5 py-4 text-right">
                  <div class="font-semibold text-emerald-600">¥{{ statement.paidAmount.toLocaleString() }}</div>
                </td>
                <td class="px-5 py-4 text-right">
                  <div class="font-semibold" :class="statement.unpaidAmount > 0 ? 'text-amber-600' : 'text-slate-600'">
                    ¥{{ statement.unpaidAmount.toLocaleString() }}
                  </div>
                </td>
                <td class="px-5 py-4 text-center">
                  <span
                    class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border"
                    :class="StatementStatusColors[statement.status]"
                  >
                    <span
                      class="w-1.5 h-1.5 rounded-full"
                      :class="{
                        'bg-amber-500': statement.status === 'pending',
                        'bg-blue-500': statement.status === 'confirmed',
                        'bg-emerald-500': statement.status === 'paid',
                        'bg-rose-500': statement.status === 'overdue',
                      }"
                    ></span>
                    {{ StatementStatusLabels[statement.status] }}
                  </span>
                </td>
                <td class="px-5 py-4 text-center">
                  <span
                    class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border"
                    :class="InvoiceStatusColors[statement.invoiceStatus]"
                  >
                    {{ InvoiceStatusLabels[statement.invoiceStatus] }}
                  </span>
                </td>
                <td class="px-5 py-4 text-center">
                  <div class="text-slate-700">{{ statement.dueDate }}</div>
                </td>
                <td class="px-5 py-4">
                  <div class="flex items-center justify-center gap-1">
                    <button
                      type="button"
                      class="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                      title="查看详情"
                      @click="goToDetail(statement.id)"
                    >
                      <Eye class="w-4 h-4" />
                    </button>
                    <button
                      v-if="statement.status === 'pending'"
                      type="button"
                      class="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                      title="确认对账单"
                      @click="openConfirmDialog(statement)"
                    >
                      <CheckCircle class="w-4 h-4" />
                    </button>
                    <button
                      v-if="statement.status === 'confirmed' || statement.status === 'overdue'"
                      type="button"
                      class="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                      title="标记已付款"
                      @click="openPaidDialog(statement)"
                    >
                      <CreditCard class="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
              <tr
                v-if="isExpanded(statement.id)"
                class="bg-slate-50"
              >
                <td colspan="12" class="px-5 py-4">
                  <div class="bg-white rounded-lg border border-slate-200 p-4">
                    <div class="flex items-center gap-2 mb-3">
                      <FileText class="w-4 h-4 text-slate-500" />
                      <span class="text-sm font-semibold text-slate-800">订单明细</span>
                      <span class="text-xs text-slate-500">（共 {{ statement.items.length }} 条）</span>
                    </div>
                    <div class="overflow-x-auto">
                      <table class="w-full text-xs">
                        <thead class="bg-slate-50 border-b border-slate-200">
                          <tr>
                            <th class="px-3 py-2 text-left font-semibold text-slate-600 whitespace-nowrap">订单号</th>
                            <th class="px-3 py-2 text-left font-semibold text-slate-600 whitespace-nowrap">订单日期</th>
                            <th class="px-3 py-2 text-left font-semibold text-slate-600 whitespace-nowrap">交货日期</th>
                            <th class="px-3 py-2 text-right font-semibold text-slate-600 whitespace-nowrap">工件数</th>
                            <th class="px-3 py-2 text-right font-semibold text-slate-600 whitespace-nowrap">金额</th>
                            <th class="px-3 py-2 text-center font-semibold text-slate-600 whitespace-nowrap">状态</th>
                          </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100">
                          <tr
                            v-for="item in statement.items"
                            :key="item.id"
                            class="hover:bg-slate-50 transition-colors"
                          >
                            <td class="px-3 py-2 font-mono text-slate-800">{{ item.orderNumber }}</td>
                            <td class="px-3 py-2 text-slate-600">{{ item.orderDate }}</td>
                            <td class="px-3 py-2 text-slate-600">{{ item.deliveryDate }}</td>
                            <td class="px-3 py-2 text-right text-slate-700">{{ item.workItemsCount }} 件</td>
                            <td class="px-3 py-2 text-right font-medium text-slate-900">¥{{ item.totalAmount.toLocaleString() }}</td>
                            <td class="px-3 py-2 text-center">
                              <span
                                v-if="item.isRework"
                                class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200"
                              >
                                返工
                              </span>
                              <span
                                v-else
                                class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200"
                              >
                                正常
                              </span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div v-if="statement.remark" class="mt-3 pt-3 border-t border-slate-100">
                      <div class="text-xs text-slate-500">备注：{{ statement.remark }}</div>
                    </div>
                  </div>
                </td>
              </tr>
            </template>
            <tr v-if="filteredStatements.length === 0">
              <td colspan="12" class="px-5 py-16 text-center">
                <div class="flex flex-col items-center gap-2">
                  <div class="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
                    <FileText class="w-8 h-8 text-slate-400" />
                  </div>
                  <div class="text-sm font-medium text-slate-600">暂无匹配的对账单数据</div>
                  <div class="text-xs text-slate-400">尝试调整筛选条件</div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div
        v-if="totalPages > 1"
        class="px-5 py-4 border-t border-slate-100 flex items-center justify-between flex-wrap gap-3"
      >
        <div class="text-xs text-slate-500">
          第 {{ currentPage }} / {{ totalPages }} 页，共 {{ filteredStatements.length }} 条
        </div>
        <div class="flex items-center gap-1">
          <button
            type="button"
            class="p-2 rounded-md text-slate-500 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            :disabled="currentPage === 1"
            @click="currentPage--"
          >
            <ChevronLeft class="w-4 h-4" />
          </button>
          <button
            v-for="n in Math.min(5, totalPages)"
            :key="n"
            type="button"
            class="min-w-[36px] h-9 px-2 rounded-md text-sm font-medium transition-colors"
            :class="currentPage === n ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'"
            @click="currentPage = n"
          >
            {{ n }}
          </button>
          <button
            type="button"
            class="p-2 rounded-md text-slate-500 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            :disabled="currentPage === totalPages"
            @click="currentPage++"
          >
            <ChevronRight class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="showConfirmDialog"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      @click.self="showConfirmDialog = false"
    >
      <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
        <div class="p-6">
          <div class="flex items-start gap-4">
            <div class="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <CheckCircle class="w-6 h-6 text-blue-600" />
            </div>
            <div class="flex-1">
              <h3 class="text-lg font-semibold text-slate-900">确认对账单？</h3>
              <p class="text-sm text-slate-600 mt-1">
                您即将确认对账单
                <span class="font-semibold text-slate-800">「{{ targetStatement?.statementNumber }}」</span>
                ，确认后状态将变更为已确认。
              </p>
            </div>
          </div>
        </div>
        <div class="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            type="button"
            class="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            @click="showConfirmDialog = false"
          >
            取消
          </button>
          <button
            type="button"
            class="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            @click="doConfirm"
          >
            确认
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="showPaidDialog"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      @click.self="showPaidDialog = false"
    >
      <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
        <div class="p-6">
          <div class="flex items-start gap-4">
            <div class="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <CreditCard class="w-6 h-6 text-emerald-600" />
            </div>
            <div class="flex-1">
              <h3 class="text-lg font-semibold text-slate-900">标记为已付款？</h3>
              <p class="text-sm text-slate-600 mt-1">
                您即将将对账单
                <span class="font-semibold text-slate-800">「{{ targetStatement?.statementNumber }}」</span>
                标记为已付款，未收金额将清零。
              </p>
              <div class="mt-4 p-3 bg-slate-50 rounded-lg">
                <div class="flex justify-between text-sm">
                  <span class="text-slate-500">对账单金额</span>
                  <span class="font-semibold text-slate-900">¥{{ targetStatement?.totalAmount.toLocaleString() }}</span>
                </div>
                <div class="flex justify-between text-sm mt-2">
                  <span class="text-slate-500">已收金额</span>
                  <span class="font-semibold text-emerald-600">¥{{ targetStatement?.paidAmount.toLocaleString() }}</span>
                </div>
                <div class="flex justify-between text-sm mt-2">
                  <span class="text-slate-500">未收金额</span>
                  <span class="font-semibold text-amber-600">¥{{ targetStatement?.unpaidAmount.toLocaleString() }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            type="button"
            class="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            @click="showPaidDialog = false"
          >
            取消
          </button>
          <button
            type="button"
            class="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
            @click="doMarkPaid"
          >
            确认付款
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
