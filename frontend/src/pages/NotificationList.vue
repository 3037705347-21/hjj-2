<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  Bell,
  AlertTriangle,
  CalendarClock,
  Zap,
  RefreshCw,
  CheckCircle2,
  Paperclip,
  Filter,
  CheckCheck,
  Eye,
  ExternalLink,
  MoreHorizontal,
  X,
  Search,
  ChevronDown,
  Settings,
  CheckSquare,
  Square,
  Trash2,
  ArrowRight,
} from 'lucide-vue-next'
import { useNotifications } from '../composables/useNotifications'
import StatCard from '../components/StatCard.vue'
import {
  NotificationTypeLabels,
  NotificationTypeColors,
  NotificationCategoryLabels,
  NotificationCategoryColors,
  NotificationHandleStatusLabels,
  NotificationHandleStatusColors,
  type Notification,
  type NotificationType,
  type NotificationHandleStatus,
  type NotificationCategory,
} from '../types'

const router = useRouter()
const {
  roleNotifications,
  unreadCount,
  pendingCount,
  getCategoryCount,
  getCategoryUnreadCount,
  getCategoryPendingCount,
  markAsRead,
  markAllAsRead,
  batchMarkAsRead,
  batchUpdateHandleStatus,
  updateHandleStatus,
} = useNotifications()

const searchQuery = ref('')
const activeCategory = ref<NotificationCategory | 'all'>('all')
const typeFilter = ref<NotificationType | 'all'>('all')
const statusFilter = ref<NotificationHandleStatus | 'all'>('all')
const readFilter = ref<'all' | 'unread' | 'read'>('all')
const openMenuId = ref<string | null>(null)
const selectedIds = ref<Set<string>>(new Set())
const selectMode = ref(false)

const categories: (NotificationCategory | 'all')[] = ['all', 'delivery-warning', 'rework-reminder', 'stage-change', 'attachment-reminder']

const categoryIconMap: Record<NotificationCategory | 'all', typeof AlertTriangle> = {
  'all': Bell,
  'delivery-warning': AlertTriangle,
  'rework-reminder': RefreshCw,
  'stage-change': CheckCircle2,
  'attachment-reminder': Paperclip,
}

const categoryIconBgMap: Record<NotificationCategory, string> = {
  'delivery-warning': 'bg-rose-100 text-rose-600',
  'rework-reminder': 'bg-orange-100 text-orange-600',
  'stage-change': 'bg-emerald-100 text-emerald-600',
  'attachment-reminder': 'bg-violet-100 text-violet-600',
}

const typeIconMap: Record<NotificationType, typeof AlertTriangle> = {
  'overdue-warning': AlertTriangle,
  'delivery-today': CalendarClock,
  'stat-order': Zap,
  'rework-initiated': RefreshCw,
  'stage-completed': CheckCircle2,
  'attachment-missing': Paperclip,
}

const typeIconBgMap: Record<NotificationType, string> = {
  'overdue-warning': 'bg-rose-100 text-rose-600',
  'delivery-today': 'bg-amber-100 text-amber-600',
  'stat-order': 'bg-red-100 text-red-600',
  'rework-initiated': 'bg-orange-100 text-orange-600',
  'stage-completed': 'bg-emerald-100 text-emerald-600',
  'attachment-missing': 'bg-violet-100 text-violet-600',
}

const today = new Date()
today.setHours(0, 0, 0, 0)

const totalCount = computed(() => roleNotifications.value.length)

const todayCount = computed(() =>
  roleNotifications.value.filter((n) => {
    const d = new Date(n.sentAt)
    d.setHours(0, 0, 0, 0)
    return d.getTime() === today.getTime()
  }).length
)

const categoryStats = computed(() => {
  const stats: { category: NotificationCategory | 'all'; label: string; count: number; unread: number; pending: number }[] = [
    { category: 'all', label: '全部', count: totalCount.value, unread: unreadCount.value, pending: pendingCount.value },
  ]
  for (const cat of ['delivery-warning', 'rework-reminder', 'stage-change', 'attachment-reminder'] as NotificationCategory[]) {
    stats.push({
      category: cat,
      label: NotificationCategoryLabels[cat],
      count: getCategoryCount(cat),
      unread: getCategoryUnreadCount(cat),
      pending: getCategoryPendingCount(cat),
    })
  }
  return stats
})

const filteredNotifications = computed(() =>
  roleNotifications.value.filter((n) => {
    if (activeCategory.value !== 'all' && n.category !== activeCategory.value) return false
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase()
      const match =
        n.content.toLowerCase().includes(q) ||
        n.orderNumber.toLowerCase().includes(q) ||
        n.clinicName.toLowerCase().includes(q) ||
        n.triggerCondition.toLowerCase().includes(q)
      if (!match) return false
    }
    if (typeFilter.value !== 'all' && n.type !== typeFilter.value) return false
    if (statusFilter.value !== 'all' && n.handleStatus !== statusFilter.value) return false
    if (readFilter.value === 'unread' && n.isRead) return false
    if (readFilter.value === 'read' && !n.isRead) return false
    return true
  })
)

const hasActiveFilters = computed(() =>
  typeFilter.value !== 'all' ||
  statusFilter.value !== 'all' ||
  readFilter.value !== 'all' ||
  searchQuery.value.trim() !== ''
)

const allVisibleSelected = computed(() =>
  filteredNotifications.value.length > 0 &&
  filteredNotifications.value.every(n => selectedIds.value.has(n.id))
)

function clearFilters() {
  searchQuery.value = ''
  typeFilter.value = 'all'
  statusFilter.value = 'all'
  readFilter.value = 'all'
}

function toggleMenu(id: string) {
  openMenuId.value = openMenuId.value === id ? null : id
}

function closeMenu() {
  openMenuId.value = null
}

function handleMarkAsRead(n: Notification) {
  markAsRead(n.id)
  closeMenu()
}

function handleUpdateStatus(n: Notification, status: NotificationHandleStatus) {
  updateHandleStatus(n.id, status)
  closeMenu()
}

function handleMarkAllRead() {
  markAllAsRead()
}

function goToOrder(n: Notification) {
  if (!n.isRead) markAsRead(n.id)
  router.push(n.linkPath)
}

function goToModule(n: Notification) {
  if (n.moduleLinkPath) {
    if (!n.isRead) markAsRead(n.id)
    router.push(n.moduleLinkPath!)
  }
}

function goToSettings() {
  router.push('/notifications/settings')
}

function toggleSelectMode() {
  selectMode.value = !selectMode.value
  if (!selectMode.value) {
    selectedIds.value.clear()
  }
}

function toggleSelect(id: string) {
  if (selectedIds.value.has(id)) {
    selectedIds.value.delete(id)
  } else {
    selectedIds.value.add(id)
  }
}

function toggleSelectAll() {
  if (allVisibleSelected.value) {
    filteredNotifications.value.forEach(n => selectedIds.value.delete(n.id))
  } else {
    filteredNotifications.value.forEach(n => selectedIds.value.add(n.id))
  }
}

function handleBatchMarkRead() {
  batchMarkAsRead(Array.from(selectedIds.value))
  selectedIds.value.clear()
  selectMode.value = false
}

function handleBatchHandle() {
  batchUpdateHandleStatus(Array.from(selectedIds.value), 'handled')
  selectedIds.value.clear()
  selectMode.value = false
}

function formatSentTime(sentAt: string): string {
  const d = new Date(sentAt)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHour = Math.floor(diffMs / 3600000)
  const diffDay = Math.floor(diffMs / 86400000)

  if (diffMin < 1) return '刚刚'
  if (diffMin < 60) return `${diffMin}分钟前`
  if (diffHour < 24) return `${diffHour}小时前`
  if (diffDay < 7) return `${diffDay}天前`
  return d.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <div class="min-h-full">
    <div class="mb-6">
      <div class="flex items-start justify-between">
        <div>
          <div class="flex items-center gap-3">
            <h1 class="text-2xl font-bold text-slate-900 tracking-tight">通知中心</h1>
            <span
              v-if="unreadCount > 0"
              class="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold text-white bg-rose-500 rounded-full"
            >
              {{ unreadCount }}
            </span>
          </div>
          <p class="mt-1 text-sm text-slate-500">查看和管理您的订单通知与提醒，支持从通知直接跳转到订单详情或对应模块</p>
        </div>
        <div class="flex items-center gap-2">
          <button
            class="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            @click="goToSettings"
          >
            <Settings class="w-4 h-4" />
            消息设置
          </button>
          <button
            :disabled="unreadCount === 0"
            class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border transition-colors"
            :class="
              unreadCount > 0
                ? 'text-blue-600 bg-blue-50 border-blue-200 hover:bg-blue-100'
                : 'text-slate-400 bg-slate-50 border-slate-200 cursor-not-allowed'
            "
            @click="handleMarkAllRead"
          >
            <CheckCheck class="w-4 h-4" />
            全部已读
          </button>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <StatCard title="通知总数" :value="totalCount" :icon="Bell" tone="primary" />
      <StatCard title="未读通知" :value="unreadCount" :icon="Eye" tone="danger" description="待查看" />
      <StatCard title="待处理" :value="pendingCount" :icon="Filter" tone="warning" description="需及时处理" />
      <StatCard title="今日通知" :value="todayCount" :icon="CalendarClock" tone="success" />
    </div>

    <div class="mb-4">
      <div class="flex items-center gap-1 p-1 bg-slate-100 rounded-xl overflow-x-auto">
        <button
          v-for="cat in categories"
          :key="cat"
          class="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all whitespace-nowrap"
          :class="[
            activeCategory === cat
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-800 hover:bg-white/50',
          ]"
          @click="activeCategory = cat"
        >
          <component
            :is="categoryIconMap[cat]"
            class="w-4 h-4"
            :class="cat !== 'all' && activeCategory === cat ? (categoryIconBgMap[cat as NotificationCategory] || '').split(' ')[1] : ''"
          />
          {{ cat === 'all' ? '全部' : NotificationCategoryLabels[cat as NotificationCategory] }}
          <span
            v-if="cat !== 'all' && getCategoryUnreadCount(cat as NotificationCategory) > 0"
            class="inline-flex items-center justify-center min-w-[18px] h-4 px-1 text-[10px] font-bold rounded-full"
            :class="activeCategory === cat ? 'bg-rose-500 text-white' : 'bg-slate-200 text-slate-600'"
          >
            {{ getCategoryUnreadCount(cat as NotificationCategory) }}
          </span>
        </button>
      </div>
    </div>

    <div class="bg-white rounded-xl border border-slate-200 p-4 mb-4">
      <div class="flex flex-col md:flex-row md:items-center gap-3">
        <div class="relative flex-1">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索通知内容、订单号、诊所名、触发条件..."
            class="w-full pl-9 pr-9 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 placeholder:text-slate-400"
          />
          <button
            v-if="searchQuery"
            class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            @click="searchQuery = ''"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <div class="flex items-center gap-3 flex-wrap">
          <div class="relative">
            <select
              v-model="typeFilter"
              class="appearance-none pl-3 pr-8 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="all">全部类型</option>
              <option v-for="(label, key) in NotificationTypeLabels" :key="key" :value="key">
                {{ label }}
              </option>
            </select>
            <ChevronDown class="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>

          <div class="relative">
            <select
              v-model="statusFilter"
              class="appearance-none pl-3 pr-8 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="all">处理状态</option>
              <option v-for="(label, key) in NotificationHandleStatusLabels" :key="key" :value="key">
                {{ label }}
              </option>
            </select>
            <ChevronDown class="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>

          <div class="inline-flex items-center p-1 bg-slate-100 rounded-lg">
            <button
              class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors"
              :class="readFilter === 'all' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-600 hover:text-slate-800'"
              @click="readFilter = 'all'"
            >
              全部
            </button>
            <button
              class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors"
              :class="readFilter === 'unread' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-600 hover:text-slate-800'"
              @click="readFilter = 'unread'"
            >
              未读
            </button>
            <button
              class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors"
              :class="readFilter === 'read' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-600 hover:text-slate-800'"
              @click="readFilter = 'read'"
            >
              已读
            </button>
          </div>

          <button
            v-if="hasActiveFilters"
            class="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-rose-600 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 transition-colors"
            @click="clearFilters"
          >
            <X class="w-3.5 h-3.5" />
            清除筛选
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="selectMode && selectedIds.size > 0"
      class="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4 flex items-center justify-between"
    >
      <span class="text-sm font-medium text-blue-700">已选择 {{ selectedIds.size }} 条通知</span>
      <div class="flex items-center gap-2">
        <button
          class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
          @click="handleBatchMarkRead"
        >
          <CheckCheck class="w-3.5 h-3.5" />
          批量已读
        </button>
        <button
          class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-white border border-emerald-200 rounded-lg hover:bg-emerald-50 transition-colors"
          @click="handleBatchHandle"
        >
          <CheckCircle2 class="w-3.5 h-3.5" />
          批量处理
        </button>
        <button
          class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          @click="selectedIds.clear()"
        >
          取消选择
        </button>
      </div>
    </div>

    <div class="space-y-3">
      <div
        v-if="filteredNotifications.length > 0 && selectMode"
        class="bg-white rounded-xl border border-slate-200 p-3 flex items-center gap-3"
      >
        <button
          class="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800 transition-colors"
          @click="toggleSelectAll"
        >
          <CheckSquare v-if="allVisibleSelected" class="w-4 h-4 text-blue-600" />
          <Square v-else class="w-4 h-4" />
          {{ allVisibleSelected ? '取消全选' : '全选当前列表' }}
        </button>
      </div>

      <div
        v-for="notification in filteredNotifications"
        :key="notification.id"
        class="bg-white rounded-xl border border-slate-200 hover:shadow-md transition-all group"
        :class="{
          'border-l-4 border-l-blue-400': !notification.isRead && !selectMode,
          'ring-2 ring-blue-300 border-blue-300': selectMode && selectedIds.has(notification.id),
        }"
      >
        <div class="flex items-start gap-4 p-4">
          <div
            v-if="selectMode"
            class="flex-shrink-0 pt-1"
            @click.stop="toggleSelect(notification.id)"
          >
            <CheckSquare v-if="selectedIds.has(notification.id)" class="w-5 h-5 text-blue-600 cursor-pointer" />
            <Square v-else class="w-5 h-5 text-slate-300 cursor-pointer hover:text-slate-500" />
          </div>

          <div
            class="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
            :class="typeIconBgMap[notification.type]"
          >
            <component :is="typeIconMap[notification.type]" class="w-5 h-5" />
          </div>

          <div class="flex-1 min-w-0">
            <div class="flex items-start justify-between gap-3">
              <div class="flex-1 min-w-0 cursor-pointer" @click="!selectMode && goToOrder(notification)">
                <div class="flex items-center gap-2 mb-1 flex-wrap">
                  <span
                    class="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-md border"
                    :class="NotificationCategoryColors[notification.category]"
                  >
                    {{ NotificationCategoryLabels[notification.category] }}
                  </span>
                  <span
                    class="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-md border"
                    :class="NotificationTypeColors[notification.type]"
                  >
                    {{ NotificationTypeLabels[notification.type] }}
                  </span>
                  <span
                    v-if="!notification.isRead"
                    class="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-medium text-blue-600 bg-blue-50 rounded"
                  >
                    <span class="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                    未读
                  </span>
                  <span
                    class="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium text-slate-500 bg-slate-50 border border-slate-200 rounded"
                  >
                    {{ notification.triggerCondition }}
                  </span>
                </div>
                <p class="text-sm text-slate-800 leading-relaxed">{{ notification.content }}</p>
                <div class="flex items-center gap-3 mt-2 text-xs text-slate-400 flex-wrap">
                  <span class="inline-flex items-center gap-1">
                    <ExternalLink class="w-3 h-3" />
                    {{ notification.orderNumber }}
                  </span>
                  <span>{{ notification.clinicName }}</span>
                  <span>{{ formatSentTime(notification.sentAt) }}</span>
                  <span
                    v-if="notification.relatedStage"
                    class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-500 border border-slate-200"
                  >
                    {{ notification.relatedStage }}
                  </span>
                </div>
              </div>

              <div class="flex items-center gap-2 flex-shrink-0">
                <span
                  class="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-md border"
                  :class="NotificationHandleStatusColors[notification.handleStatus]"
                >
                  {{ NotificationHandleStatusLabels[notification.handleStatus] }}
                </span>

                <button
                  v-if="notification.moduleLinkPath && notification.moduleLabel"
                  class="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                  @click.stop="goToModule(notification)"
                >
                  {{ notification.moduleLabel }}
                  <ArrowRight class="w-3 h-3" />
                </button>

                <div class="relative" @click.stop>
                  <button
                    class="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                    @click="toggleMenu(notification.id)"
                  >
                    <MoreHorizontal class="w-4 h-4" />
                  </button>
                  <div
                    v-if="openMenuId === notification.id"
                    class="absolute right-0 top-full mt-1 w-40 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-10"
                  >
                    <button
                      class="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2"
                      @click="goToOrder(notification)"
                    >
                      <ExternalLink class="w-3.5 h-3.5" />
                      查看订单
                    </button>
                    <button
                      v-if="notification.moduleLinkPath && notification.moduleLabel"
                      class="w-full text-left px-3 py-2 text-sm text-blue-700 hover:bg-blue-50 transition-colors flex items-center gap-2"
                      @click="goToModule(notification)"
                    >
                      <ArrowRight class="w-3.5 h-3.5" />
                      {{ notification.moduleLabel }}
                    </button>
                    <div class="border-t border-slate-100 my-1"></div>
                    <button
                      v-if="!notification.isRead"
                      class="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                      @click="handleMarkAsRead(notification)"
                    >
                      标记已读
                    </button>
                    <button
                      v-if="notification.handleStatus !== 'handled'"
                      class="w-full text-left px-3 py-2 text-sm text-emerald-700 hover:bg-emerald-50 transition-colors"
                      @click="handleUpdateStatus(notification, 'handled')"
                    >
                      已处理
                    </button>
                    <button
                      v-if="notification.handleStatus !== 'ignored'"
                      class="w-full text-left px-3 py-2 text-sm text-slate-500 hover:bg-slate-50 transition-colors"
                      @click="handleUpdateStatus(notification, 'ignored')"
                    >
                      已忽略
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        v-if="filteredNotifications.length === 0"
        class="bg-white rounded-xl border border-slate-200 p-16 text-center"
      >
        <div class="flex flex-col items-center gap-3">
          <div class="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
            <Bell class="w-8 h-8 text-slate-300" />
          </div>
          <div>
            <p class="text-base font-medium text-slate-500">暂无通知</p>
            <p class="text-sm text-slate-400 mt-1">
              {{ hasActiveFilters ? '没有符合筛选条件的通知，请调整筛选条件' : '当前没有新的通知消息' }}
            </p>
          </div>
          <button
            v-if="hasActiveFilters"
            class="mt-2 inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            @click="clearFilters"
          >
            清除筛选条件
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="openMenuId"
      class="fixed inset-0 z-[5]"
      @click="closeMenu"
    ></div>

    <div class="fixed bottom-6 right-6 z-10">
      <button
        class="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl shadow-lg transition-all"
        :class="selectMode ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'"
        @click="toggleSelectMode"
      >
        <CheckSquare class="w-4 h-4" />
        {{ selectMode ? '退出批量模式' : '批量操作' }}
      </button>
    </div>
  </div>
</template>
