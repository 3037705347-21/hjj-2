<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  Bell,
  AlertTriangle,
  CalendarClock,
  Zap,
  RefreshCw,
  CheckCircle2,
  Paperclip,
  ExternalLink,
  Check,
  ChevronDown,
  ChevronUp,
  ArrowRight,
} from 'lucide-vue-next'
import { useNotifications } from '../composables/useNotifications'
import type { Notification, NotificationType } from '../types'
import {
  NotificationTypeLabels,
  NotificationTypeColors,
  NotificationCategoryLabels,
  NotificationCategoryColors,
  NotificationHandleStatusLabels,
  NotificationHandleStatusColors,
} from '../types'

const props = defineProps<{
  orderId: string
}>()

const router = useRouter()
const { getNotificationsByOrder, markAsRead, updateHandleStatus } = useNotifications()

const notifications = computed(() => getNotificationsByOrder(props.orderId))
const expanded = ref(false)
const displayedNotifications = computed(() =>
  expanded.value ? notifications.value : notifications.value.slice(0, 5)
)
const hasMore = computed(() => notifications.value.length > 5)
const unreadCount = computed(() => notifications.value.filter(n => !n.isRead).length)

const iconMap: Record<NotificationType, typeof AlertTriangle> = {
  'overdue-warning': AlertTriangle,
  'delivery-today': CalendarClock,
  'stat-order': Zap,
  'rework-initiated': RefreshCw,
  'stage-completed': CheckCircle2,
  'attachment-missing': Paperclip,
}

function getIcon(type: NotificationType) {
  return iconMap[type] || Bell
}

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
  if (diffDay < 30) return `${diffDay}天前`
  const diffMonth = Math.floor(diffDay / 30)
  return `${diffMonth}个月前`
}

function handleClick(notification: Notification) {
  if (!notification.isRead) {
    markAsRead(notification.id)
  }
  router.push(notification.linkPath)
}

function handleMarkRead(event: Event, notification: Notification) {
  event.stopPropagation()
  markAsRead(notification.id)
}

function handleMarkHandled(event: Event, notification: Notification) {
  event.stopPropagation()
  updateHandleStatus(notification.id, 'handled')
}

function goToModule(event: Event, notification: Notification) {
  event.stopPropagation()
  if (notification.moduleLinkPath) {
    if (!notification.isRead) markAsRead(notification.id)
    router.push(notification.moduleLinkPath)
  }
}

function viewAll() {
  router.push('/notifications')
}

function toggleExpand() {
  expanded.value = !expanded.value
}
</script>

<template>
  <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
    <div class="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center">
          <Bell class="w-4 h-4 text-rose-600" />
        </div>
        <h2 class="text-base font-semibold text-slate-800">通知记录</h2>
        <span
          v-if="unreadCount > 0"
          class="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700"
        >
          {{ unreadCount }} 未读
        </span>
      </div>
      <span
        v-if="notifications.length > 0"
        class="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600"
      >
        {{ notifications.length }}
      </span>
    </div>

    <div v-if="notifications.length > 0">
      <div class="px-5 py-4">
        <div class="space-y-0">
          <div
            v-for="(notification, idx) in displayedNotifications"
            :key="notification.id"
            class="relative pl-7 pb-4 last:pb-0"
          >
            <div
              v-if="idx < displayedNotifications.length - 1"
              class="absolute left-2.5 top-5 w-px h-full bg-slate-200"
            ></div>
            <div
              class="absolute left-0 top-0.5 w-5 h-5 rounded-full flex items-center justify-center"
              :class="[
                notification.isRead
                  ? 'bg-slate-100 border border-slate-200'
                  : 'bg-rose-50 border border-rose-200'
              ]"
            >
              <component
                :is="getIcon(notification.type)"
                class="w-3 h-3"
                :class="notification.isRead ? 'text-slate-400' : 'text-rose-600'"
              />
            </div>

            <div
              class="ml-2 p-3 rounded-lg border cursor-pointer transition-all hover:shadow-sm"
              :class="notification.isRead ? 'bg-white border-slate-200 hover:bg-slate-50' : 'bg-rose-50/50 border-rose-200 hover:bg-rose-50'"
              @click="handleClick(notification)"
            >
              <div class="flex items-start justify-between gap-2 mb-1.5">
                <div class="flex items-center gap-1.5 flex-wrap">
                  <span
                    class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border"
                    :class="NotificationCategoryColors[notification.category]"
                  >
                    {{ NotificationCategoryLabels[notification.category] }}
                  </span>
                  <span
                    class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border"
                    :class="NotificationTypeColors[notification.type]"
                  >
                    {{ NotificationTypeLabels[notification.type] }}
                  </span>
                  <span
                    class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border"
                    :class="NotificationHandleStatusColors[notification.handleStatus]"
                  >
                    {{ NotificationHandleStatusLabels[notification.handleStatus] }}
                  </span>
                  <span
                    v-if="!notification.isRead"
                    class="w-1.5 h-1.5 rounded-full bg-rose-500 flex-shrink-0"
                  ></span>
                </div>
                <div class="flex items-center gap-1 flex-shrink-0">
                  <span class="text-[10px] text-slate-400 whitespace-nowrap">
                    {{ getRelativeTime(notification.sentAt) }}
                  </span>
                </div>
              </div>

              <p
                class="text-xs leading-relaxed line-clamp-2 mb-1.5"
                :class="notification.isRead ? 'text-slate-500' : 'text-slate-700'"
              >
                {{ notification.content }}
              </p>

              <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-1.5 flex-wrap">
                  <span class="text-[10px] text-slate-400">
                    {{ notification.triggerCondition }}
                  </span>
                  <span
                    v-if="notification.moduleLinkPath && notification.moduleLabel"
                    class="inline-flex items-center gap-0.5 text-[10px] text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
                    @click="goToModule($event, notification)"
                  >
                    {{ notification.moduleLabel }}
                    <ArrowRight class="w-2.5 h-2.5" />
                  </span>
                </div>

                <div class="flex items-center gap-1">
                  <button
                    v-if="!notification.isRead"
                    class="p-0.5 text-slate-300 hover:text-emerald-600 transition-colors"
                    title="标为已读"
                    @click="handleMarkRead($event, notification)"
                  >
                    <Check class="w-3 h-3" />
                  </button>
                  <button
                    v-if="notification.handleStatus === 'pending'"
                    class="p-0.5 text-slate-300 hover:text-blue-600 transition-colors"
                    title="标为已处理"
                    @click="handleMarkHandled($event, notification)"
                  >
                    <CheckCircle2 class="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        v-if="hasMore || notifications.length > 3"
        class="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between"
      >
        <button
          v-if="hasMore"
          class="flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-800 transition-colors"
          @click="toggleExpand"
        >
          <template v-if="expanded">
            收起
            <ChevronUp class="w-3 h-3" />
          </template>
          <template v-else>
            展开全部 ({{ notifications.length }})
            <ChevronDown class="w-3 h-3" />
          </template>
        </button>
        <span v-else></span>
        <button
          class="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
          @click="viewAll"
        >
          通知中心
          <ExternalLink class="w-3 h-3" />
        </button>
      </div>
    </div>

    <div v-else class="p-8 text-center">
      <div class="w-10 h-10 mx-auto mb-2 rounded-full bg-slate-100 flex items-center justify-center">
        <Bell class="w-5 h-5 text-slate-300" />
      </div>
      <p class="text-xs text-slate-500">暂无相关通知</p>
    </div>
  </div>
</template>
