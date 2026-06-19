<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  Building2,
  Plus,
  Search,
  Download,
  RotateCcw,
  Eye,
  Pencil,
  Trash2,
  Phone,
  MapPin,
  FileText,
  AlertTriangle,
  TrendingUp,
  Users,
  Ban,
  Clock,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  UserPlus,
} from 'lucide-vue-next'
import { useClinics } from '../composables/useClinics'
import type { CooperationStatus, Clinic } from '../types'
import {
  CooperationStatusLabels,
  CooperationStatusColors,
  SettlementMethodLabels,
} from '../types'
import StatCard from '../components/StatCard.vue'
import { cn } from '../lib/utils'

const router = useRouter()
const {
  clinics,
  searchClinics,
  downloadClinicsCSV,
  deleteClinic,
  refreshAllClinicStats,
} = useClinics()

const filters = reactive({
  name: '',
  code: '',
  contactPerson: '',
  status: '' as CooperationStatus | '',
})

const pageSize = 10
const currentPage = ref(1)

const showDeleteConfirm = ref(false)
const deletingClinic = ref<Clinic | null>(null)

const filteredClinics = computed(() => {
  return searchClinics({
    name: filters.name || undefined,
    code: filters.code || undefined,
    contactPerson: filters.contactPerson || undefined,
    status: filters.status || undefined,
  })
})

const totalPages = computed(() => Math.ceil(filteredClinics.value.length / pageSize))

const paginatedClinics = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredClinics.value.slice(start, start + pageSize)
})

const stats = computed(() => {
  const list = clinics.value
  const total = list.length
  const active = list.filter((c) => c.cooperationStatus === 'active').length
  const suspended = list.filter((c) => c.cooperationStatus === 'suspended').length
  const totalOrders = list.reduce((s, c) => s + c.stats.totalOrders, 0)
  const totalAmount = list.reduce((s, c) => s + c.stats.totalAmount, 0)
  const avgRework =
    total > 0
      ? parseFloat((list.reduce((s, c) => s + c.stats.reworkRate, 0) / total).toFixed(2))
      : 0
  return { total, active, suspended, totalOrders, totalAmount, avgRework }
})

function resetFilters() {
  filters.name = ''
  filters.code = ''
  filters.contactPerson = ''
  filters.status = ''
  currentPage.value = 1
}

function handleExport() {
  downloadClinicsCSV(filteredClinics.value)
}

function confirmDelete(clinic: Clinic) {
  deletingClinic.value = clinic
  showDeleteConfirm.value = true
}

function doDelete() {
  if (deletingClinic.value) {
    deleteClinic(deletingClinic.value.id)
  }
  showDeleteConfirm.value = false
  deletingClinic.value = null
}

function formatCurrency(amount: number): string {
  if (amount >= 10000) {
    return `¥${(amount / 10000).toFixed(2)}万`
  }
  return `¥${amount.toLocaleString()}`
}

function goToDetail(id: string) {
  router.push(`/clinic/${id}`)
}

function goToEdit(id: string) {
  router.push(`/clinic/${id}/edit`)
}

function goToCreate() {
  router.push('/clinic/new')
}

function goToCreateOrder(clinicId: string) {
  router.push(`/order/new?clinicId=${clinicId}`)
}

onMounted(() => {
  refreshAllClinicStats()
})
</script>

<template>
  <div class="min-h-full pb-12">
    <div class="mb-6 flex flex-col lg:flex-row lg:items-start justify-between gap-4">
      <div>
        <div class="flex items-center gap-3 mb-2">
          <h1 class="text-2xl font-bold text-slate-900 tracking-tight">诊所管理</h1>
          <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
            <Building2 class="w-3 h-3" />
            合作诊所与医生档案
          </span>
        </div>
        <p class="text-sm text-slate-500">
          管理合作诊所信息、医生档案，查看诊所历史订单与质量数据
        </p>
      </div>
      <div class="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          class="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          @click="handleExport"
        >
          <Download class="w-4 h-4" />
          导出
        </button>
        <button
          type="button"
          class="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          @click="goToCreate"
        >
          <Plus class="w-4 h-4" />
          新增诊所
        </button>
      </div>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
      <StatCard
        title="诊所总数"
        :value="stats.total"
        :icon="Building2"
        tone="primary"
        description="家合作机构"
      />
      <StatCard
        title="合作中"
        :value="stats.active"
        :icon="Users"
        tone="success"
        description="正常接单"
      />
      <StatCard
        title="已暂停"
        :value="stats.suspended"
        :icon="Ban"
        tone="warning"
        description="暂停合作"
      />
      <StatCard
        title="累计订单"
        :value="stats.totalOrders"
        :icon="FileText"
        tone="primary"
        description="总订单数"
      />
      <StatCard
        title="平均返工率"
        :value="`${stats.avgRework}%`"
        :icon="AlertTriangle"
        tone="warning"
        description="质量指标"
      />
      <StatCard
        title="累计金额"
        :value="formatCurrency(stats.totalAmount)"
        :icon="TrendingUp"
        tone="success"
        description="合作总额"
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
          <label class="block text-xs font-medium text-slate-600 mb-1.5">诊所名称</label>
          <input
            v-model="filters.name"
            type="text"
            placeholder="输入诊所名称"
            class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-slate-600 mb-1.5">诊所编码</label>
          <input
            v-model="filters.code"
            type="text"
            placeholder="如 MDE-001"
            class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-slate-600 mb-1.5">联系人</label>
          <input
            v-model="filters.contactPerson"
            type="text"
            placeholder="输入联系人姓名"
            class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-slate-600 mb-1.5">合作状态</label>
          <select
            v-model="filters.status"
            class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">全部状态</option>
            <option
              v-for="(label, key) in CooperationStatusLabels"
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
            诊所列表
            <span class="text-slate-500 ml-1">
              （共 {{ filteredClinics.length }} 条记录）
            </span>
          </div>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-slate-50 border-b border-slate-200">
            <tr>
              <th class="px-5 py-3 text-left font-semibold text-slate-700 whitespace-nowrap">诊所信息</th>
              <th class="px-5 py-3 text-left font-semibold text-slate-700 whitespace-nowrap">联系方式</th>
              <th class="px-5 py-3 text-left font-semibold text-slate-700 whitespace-nowrap">合作状态</th>
              <th class="px-5 py-3 text-left font-semibold text-slate-700 whitespace-nowrap">结算信息</th>
              <th class="px-5 py-3 text-center font-semibold text-slate-700 whitespace-nowrap">常用医生</th>
              <th class="px-5 py-3 text-right font-semibold text-slate-700 whitespace-nowrap">累计订单</th>
              <th class="px-5 py-3 text-right font-semibold text-slate-700 whitespace-nowrap">返工率</th>
              <th class="px-5 py-3 text-right font-semibold text-slate-700 whitespace-nowrap">累计金额</th>
              <th class="px-5 py-3 text-center font-semibold text-slate-700 whitespace-nowrap">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr
              v-for="clinic in paginatedClinics"
              :key="clinic.id"
              class="hover:bg-slate-50 transition-colors"
            >
              <td class="px-5 py-4">
                <div class="flex items-start gap-3 min-w-0">
                  <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Building2 class="w-5 h-5 text-white" />
                  </div>
                  <div class="min-w-0">
                    <div
                      class="font-semibold text-slate-900 truncate cursor-pointer hover:text-blue-600 transition-colors"
                      @click="goToDetail(clinic.id)"
                    >
                      {{ clinic.name }}
                    </div>
                    <div class="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                      <Sparkles class="w-3 h-3" />
                      <span class="font-mono">{{ clinic.clinicCode }}</span>
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-5 py-4">
                <div class="space-y-1">
                  <div class="flex items-center gap-1.5 text-slate-700">
                    <Users class="w-3.5 h-3.5 text-slate-400" />
                    <span>{{ clinic.contactPerson }}</span>
                  </div>
                  <div class="flex items-center gap-1.5 text-slate-600">
                    <Phone class="w-3.5 h-3.5 text-slate-400" />
                    <span class="font-mono text-xs">{{ clinic.phone }}</span>
                  </div>
                  <div class="flex items-start gap-1.5 text-slate-500">
                    <MapPin class="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                    <span class="text-xs line-clamp-1">{{ clinic.address }}</span>
                  </div>
                </div>
              </td>
              <td class="px-5 py-4">
                <span
                  class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border"
                  :class="CooperationStatusColors[clinic.cooperationStatus]"
                >
                  <span class="w-1.5 h-1.5 rounded-full" :class="{
                    'bg-emerald-500': clinic.cooperationStatus === 'active',
                    'bg-slate-500': clinic.cooperationStatus === 'inactive',
                    'bg-amber-500': clinic.cooperationStatus === 'pending',
                    'bg-rose-500': clinic.cooperationStatus === 'suspended',
                  }"></span>
                  {{ CooperationStatusLabels[clinic.cooperationStatus] }}
                </span>
              </td>
              <td class="px-5 py-4">
                <div class="space-y-1">
                  <div class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                    {{ SettlementMethodLabels[clinic.settlementMethod] }}
                  </div>
                  <div class="flex items-center gap-1 text-xs text-slate-500">
                    <Clock class="w-3 h-3" />
                    <span>账期 {{ clinic.paymentTermDays }} 天</span>
                  </div>
                </div>
              </td>
              <td class="px-5 py-4 text-center">
                <div class="flex items-center justify-center">
                  <div class="flex -space-x-2">
                    <div
                      v-for="(doc, idx) in clinic.doctors.slice(0, 3)"
                      :key="doc.id"
                      class="w-7 h-7 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-[10px] font-bold text-white ring-2 ring-white"
                      :title="`${doc.name}${doc.title ? `（${doc.title}）` : ''}`"
                    >
                      {{ doc.name.charAt(0) }}
                    </div>
                    <div
                      v-if="clinic.doctors.length > 3"
                      class="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-semibold text-slate-600 ring-2 ring-white"
                    >
                      +{{ clinic.doctors.length - 3 }}
                    </div>
                    <div
                      v-if="clinic.doctors.length === 0"
                      class="text-xs text-slate-400"
                    >
                      暂无
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-5 py-4 text-right">
                <div class="font-semibold text-slate-900">{{ clinic.stats.totalOrders }}</div>
                <div class="text-[11px] text-slate-500">单</div>
              </td>
              <td class="px-5 py-4 text-right">
                <span
                  class="font-semibold"
                  :class="{
                    'text-emerald-600': clinic.stats.reworkRate < 2,
                    'text-amber-600': clinic.stats.reworkRate >= 2 && clinic.stats.reworkRate < 5,
                    'text-rose-600': clinic.stats.reworkRate >= 5,
                  }"
                >
                  {{ clinic.stats.reworkRate }}%
                </span>
              </td>
              <td class="px-5 py-4 text-right">
                <div class="font-semibold text-slate-900">{{ formatCurrency(clinic.stats.totalAmount) }}</div>
              </td>
              <td class="px-5 py-4">
                <div class="flex items-center justify-center gap-1">
                  <button
                    type="button"
                    class="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                    title="查看详情"
                    @click="goToDetail(clinic.id)"
                  >
                    <Eye class="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    class="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors"
                    title="编辑"
                    @click="goToEdit(clinic.id)"
                  >
                    <Pencil class="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    class="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                    title="新建该诊所订单"
                    @click="goToCreateOrder(clinic.id)"
                  >
                    <FileText class="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    class="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                    title="删除"
                    @click="confirmDelete(clinic)"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="filteredClinics.length === 0">
              <td colspan="9" class="px-5 py-16 text-center">
                <div class="flex flex-col items-center gap-2">
                  <div class="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
                    <Building2 class="w-8 h-8 text-slate-400" />
                  </div>
                  <div class="text-sm font-medium text-slate-600">暂无匹配的诊所数据</div>
                  <div class="text-xs text-slate-400">尝试调整筛选条件，或点击右上角新增诊所</div>
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
          第 {{ currentPage }} / {{ totalPages }} 页，共 {{ filteredClinics.length }} 条
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
      v-if="showDeleteConfirm"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      @click.self="showDeleteConfirm = false"
    >
      <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
        <div class="p-6">
          <div class="flex items-start gap-4">
            <div class="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
              <AlertTriangle class="w-6 h-6 text-rose-600" />
            </div>
            <div class="flex-1">
              <h3 class="text-lg font-semibold text-slate-900">确认删除诊所？</h3>
              <p class="text-sm text-slate-600 mt-1">
                您即将删除诊所
                <span class="font-semibold text-slate-800">「{{ deletingClinic?.name }}」</span>
                ，此操作不可撤销。该诊所关联的历史订单数据将保留，但无法再通过此诊所创建新订单。
              </p>
            </div>
          </div>
        </div>
        <div class="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            type="button"
            class="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            @click="showDeleteConfirm = false"
          >
            取消
          </button>
          <button
            type="button"
            class="px-4 py-2 text-sm font-semibold text-white bg-rose-600 rounded-lg hover:bg-rose-700 transition-colors shadow-sm"
            @click="doDelete"
          >
            确认删除
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
