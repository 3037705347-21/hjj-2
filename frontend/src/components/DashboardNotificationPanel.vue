<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  Bell,
  AlertTriangle,
  CalendarClock,
  Zap,
  RefreshCw,
  CheckCircle2,
  Paperclip,
  ArrowRight,
  ExternalLink,
} from 'lucide-vue-next'
import { useNotifications } from '../composables/useNotifications'
import { useRoles } from '../composables/useRoles'
import type { NotificationCategory } from '../types'
import {
  NotificationCategoryLabels,
  NotificationCategoryColors,
  NotificationCategoryIconMap,
} from '../types'

const router = useRouter()
const { allNotifications, unreadCount, getCategoryUnreadCount, getCategoryPendingCount, markAsRead } = useNotifications()
const { currentRole } = useRoles()

const categories: NotificationCategory[] = ['delivery-warning', 'rework-reminder', 'stage-change', 'attachment-reminder']

const iconComponentMap: Record<string, typeof AlertTriangle> = {
  AlertTriangle,
  CalendarClock,
  Zap,
  RefreshCw,
  CheckCircle2,
  Paperclip,
}

function getIconComponent(category: NotificationCategory) {
  const iconName = NotificationCategoryIconMap[category]
  return iconComponentMap[iconName] || Bell
}

const recentUnread = computed(() =>
  allNotifications.value
    .filter(n => !n.isRead)
    .slice(0, 5)
)

function getRelativeTime(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diffMs = now - then
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return '刚刚'
  if (diffMin < 60) return `${diffMin}分钟前`
  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) return `${diffHour}小时前`
  const diffDay = Math.floor(diffHour / 24)
  return `${diffDay}天前`
}

function handleCategoryClick(category: NotificationCategory) {
  router.push({ path: '/notifications', query: { category } })
}

function handleNotificationClick(id: string, linkPath: string) {
  markAsRead(id)
  router.push(linkPath)
}

function goToNotifications() {
  router.push('/notifications')
}
</script>

<template>
  <div
    v-if="unreadCount > 0"
    class="mb-6 bg-gradient-to-r from-rose-50 via-white to-amber-50 rounded-xl border border-rose-200 overflow-hidden"
  >
    <div class="px-5 py-4 border-b border-rose-100 flex items-center justify-between">
      <div class="flex items-center gap-2.5">
        <div class="flex items-center justify-center w-8 h-8 rounded-lg bg-rose-100 border border-rose-200">
          <Bell class="w-4 h-4 text-rose-600" />
        </div>
        <div>
          <h3 class="text-sm font-semibold text-slate-800">通知预警</h3>
          <p class="text-[11px] text-slate-500">
            您有 <span class="text-rose-600 font-semibold">{{ unreadCount }}</span> 条未读通知
          </p>
        </div>
      </div>
      <button
        class="inline-flex items-center gap-1 text-xs font-medium text-rose-600 hover:text-rose-700 transition-colors"
        @click="goToNotifications"
      >
        查看全部
        <ArrowRight class="w-3 h-3" />
      </button>
    </div>

    <div class="px-5 py-3">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
        <button
          v-for="category in categories"
          :key="category"
          class="flex items-center gap-2 px-3 py-2.5 rounded-lg border transition-all hover:shadow-sm"
          :class="[
            getCategoryUnreadCount(category) > 0
              ? 'bg-white border-slate-200 hover:border-slate-300'
              : 'bg-slate-50 border-slate-100 opacity-50'
          ]"
          @click="handleCategoryClick(category)"
        >
          <div
            class="flex items-center justify-center w-7 h-7 rounded-md shrink-0"
            :class="NotificationCategoryColors[category]"
          >
            <component :is="getIconComponent(category)" class="w-3.5 h-3.5" />
          </div>
          <div class="text-left min-w-0">
            <p class="text-[11px] font-medium text-slate-700 truncate">
              {{ NotificationCategoryLabels[category] }}
            </p>
            <div class="flex items-center gap-1">
              <span
                v-if="getCategoryUnreadCount(category) > 0"
                class="text-[10px] font-bold text-rose-600"
              >
                {{ getCategoryUnreadCount(category) }} 未读
              </span>
              <span
                v-if="getCategoryPendingCount(category) > 0"
                class="text-[10px] font-medium text-amber-600"
              >
                {{ getCategoryPendingCount(category) }} 待处理
              </span>
              <span
                v-if="getCategoryUnreadCount(category) === 0 && getCategoryPendingCount(category) === 0"
                class="text-[10px] text-slate-400"
              >
                暂无
              </span>
            </div>
          </div>
        </button>
      </div>

      <div v-if="recentUnread.length > 0" class="space-y-1.5">
        <div
          v-for="n in recentUnread"
          :key="n.id"
          class="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-slate-100 hover:border-slate-200 cursor-pointer transition-all group"
          @click="handleNotificationClick(n.id, n.linkPath)"
        >
          <span class="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></span>
          <span
            class="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium border shrink-0"
            :class="NotificationCategoryColors[n.category]"
          >
            {{ NotificationCategoryLabels[n.category] }}
          </span>
          <p class="text-xs text-slate-700 truncate flex-1 min-w-0 group-hover:text-slate-900">
            {{ n.content }}
          </p>
          <span class="text-[10px] text-slate-400 shrink-0 whitespace-nowrap">
            {{ getRelativeTime(n.sentAt) }}
          </span>
          <ExternalLink class="w-3 h-3 text-slate-300 group-hover:text-blue-500 shrink-0 transition-colors" />
        </div>
      </div>
    </div>
  </div>
</template>
