<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Settings,
  HeartPulse,
  Package,
  BarChart3,
  Menu,
  X,
  Bell,
  Search,
  ChevronRight,
  ShieldCheck,
  FileText,
  Wrench,
  UserCircle,
  CalendarClock,
  UserCog,
  Briefcase,
  Truck,
  Send,
  Tag,
  Receipt,
  Calculator,
} from 'lucide-vue-next'
import { 
  useRoles, 
  provideRole, 
  ROLE_LABELS, 
  ROLE_COLORS, 
  type Role,
  currentRole,
  currentTechnicianName,
  setRole,
  setTechnicianName,
  canPerformAction,
  canViewField,
  canEditField,
  permissions,
  filterOrdersByRole,
  getRoleSpecificStages,
  getDashboardConfig,
} from './composables/useRoles'
import { provideTechnicians } from './composables/useTechnicians'
import { provideNotificationSystem, useNotifications } from './composables/useNotifications'
import { registerNotificationGenerator } from './composables/useOrders'

provideRole()
provideTechnicians()
provideNotificationSystem()

const { unreadCount, generateStageCompleted, generateReworkInitiated, generateStatOrder, generateOverdueWarning, generateAttachmentMissing } = useNotifications()

registerNotificationGenerator({
  generateStageCompleted,
  generateReworkInitiated,
  generateStatOrder,
  generateOverdueWarning,
  generateAttachmentMissing,
})

const route = useRoute()
const router = useRouter()

const sidebarOpen = ref(true)
const currentUserInfo = ref({ name: '陈调度员', department: '调度中心' })

onMounted(() => {
  updateUserInfo()
})

function updateUserInfo() {
  const role = currentRole.value
  if (role === 'clinic') {
    currentUserInfo.value = { name: '王医生', department: '悦齿口腔诊所' }
  } else if (role === 'technician') {
    const techName = currentTechnicianName.value || '李技师'
    currentUserInfo.value = { name: techName, department: '加工中心' }
  } else {
    currentUserInfo.value = { name: '陈调度员', department: '调度中心' }
  }
}

function handleRoleChange(role: Role) {
  setRole(role)
  updateUserInfo()
}

const navItems = computed(() => {
  const role = currentRole.value
  const items = []

  if (role === 'clinic') {
    items.push(
      { label: '我的订单', icon: FileText, path: '/', badge: null },
      { label: '新建订单', icon: ClipboardList, path: '/order/new', badge: null },
      { label: '通知中心', icon: Bell, path: '/notifications', badge: unreadCount.value || null },
      { label: '诊所信息', icon: Users, path: '/', badge: null },
      { label: '系统设置', icon: Settings, path: '/', badge: null }
    )
  } else if (role === 'technician') {
    items.push(
      { label: '我的工作台', icon: Briefcase, path: '/workbench', badge: null },
      { label: '今日排产', icon: CalendarClock, path: '/schedule', badge: null },
      { label: '任务列表', icon: Wrench, path: '/technician-tasks', badge: null },
      { label: '通知中心', icon: Bell, path: '/notifications', badge: unreadCount.value || null },
      { label: '个人设置', icon: UserCircle, path: '/', badge: null }
    )
  } else {
    items.push(
      { label: '订单看板', icon: LayoutDashboard, path: '/', badge: null },
      { label: '今日排产', icon: CalendarClock, path: '/schedule', badge: null },
      { label: '技师任务', icon: Wrench, path: '/technician-tasks', badge: null },
      { label: '诊所管理', icon: Users, path: '/clinics', badge: null },
      { label: '模型收件', icon: Package, path: '/logistics/receive', badge: null },
      { label: '成品发货', icon: Send, path: '/logistics/ship', badge: null },
      { label: '对账单', icon: Receipt, path: '/statements', badge: null },
      { label: '价格规则', icon: Tag, path: '/pricing/rules', badge: null },
      { label: '质检中心', icon: ShieldCheck, path: '/quality', badge: null },
      { label: '通知中心', icon: Bell, path: '/notifications', badge: unreadCount.value || null },
      { label: '数据统计', icon: BarChart3, path: '/', badge: null },
      { label: '系统设置', icon: Settings, path: '/', badge: null }
    )
  }

  return items
})

const roleLabels = ROLE_LABELS
const roleColors = ROLE_COLORS

const breadcrumbs = computed(() => {
  const items: { label: string; path?: string }[] = []
  if (route.name === 'dashboard') {
    items.push({ label: '订单看板' })
  } else if (route.name === 'schedule-board') {
    items.push({ label: '今日排产看板' })
  } else if (route.name === 'technician-task-list') {
    items.push({ label: '技师任务列表' })
  } else if (route.name === 'technician-detail') {
    items.push({ label: '技师任务列表', path: '/technician-tasks' })
    items.push({ label: '技师详情' })
  } else if (route.name === 'workbench') {
    items.push({ label: '技师工作台' })
  } else if (route.name === 'order-detail') {
    items.push({ label: '订单看板', path: '/' })
    items.push({ label: '订单详情' })
  } else if (route.name === 'order-new') {
    items.push({ label: '订单看板', path: '/' })
    items.push({ label: '新建订单' })
  } else if (route.name === 'order-edit') {
    items.push({ label: '订单看板', path: '/' })
    items.push({ label: '编辑订单' })
  } else if (route.name === 'clinic-list') {
    items.push({ label: '诊所管理' })
  } else if (route.name === 'clinic-new') {
    items.push({ label: '诊所管理', path: '/clinics' })
    items.push({ label: '新增诊所' })
  } else if (route.name === 'clinic-edit') {
    items.push({ label: '诊所管理', path: '/clinics' })
    items.push({ label: '编辑诊所' })
  } else if (route.name === 'clinic-detail') {
    items.push({ label: '诊所管理', path: '/clinics' })
    items.push({ label: '诊所详情' })
  } else if (route.name === 'logistics-receive') {
    items.push({ label: '模型收件' })
  } else if (route.name === 'logistics-ship') {
    items.push({ label: '成品发货' })
  } else if (route.name === 'logistics-detail') {
    items.push({ label: '成品发货', path: '/logistics/ship' })
    items.push({ label: '物流详情' })
  } else if (route.name === 'logistics-exception') {
    items.push({ label: '成品发货', path: '/logistics/ship' })
    items.push({ label: '异常处理' })
  } else if (route.name === 'price-rule-config') {
    items.push({ label: '价格规则配置' })
  } else if (route.name === 'order-quote-detail') {
    items.push({ label: '订单看板', path: '/' })
    items.push({ label: '订单报价明细' })
  } else if (route.name === 'statement-list') {
    items.push({ label: '对账单列表' })
  } else if (route.name === 'monthly-settlement-detail') {
    items.push({ label: '对账单列表', path: '/statements' })
    items.push({ label: '月度结算详情' })
  } else if (route.name === 'quality-inspection-list') {
    items.push({ label: '质检中心' })
  } else if (route.name === 'quality-inspection-detail') {
    items.push({ label: '质检中心', path: '/quality' })
    items.push({ label: '质检详情' })
  } else if (route.name === 'notification-list') {
    items.push({ label: '通知中心' })
  } else if (route.name === 'notification-settings') {
    items.push({ label: '通知中心', path: '/notifications' })
    items.push({ label: '消息设置' })
  }
  return items
})

const isActive = (path: string) => {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 text-slate-900 flex">
    <aside
      class="fixed lg:static inset-y-0 left-0 z-30 flex flex-col transition-all duration-300 bg-white border-r border-slate-200"
      :class="[
        sidebarOpen
          ? 'w-64 translate-x-0'
          : 'w-20 lg:w-20 -translate-x-full lg:translate-x-0',
      ]"
    >
      <div
        class="h-16 flex items-center gap-3 px-5 border-b border-slate-200 flex-shrink-0"
      >
        <div
          class="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 flex-shrink-0"
        >
          <HeartPulse class="w-5 h-5 text-white" />
        </div>
        <div
          class="min-w-0 transition-all"
          :class="sidebarOpen ? 'opacity-100' : 'opacity-0 w-0'"
        >
          <div
            class="font-bold text-sm text-slate-800 tracking-tight leading-none"
          >
            义齿智造
          </div>
          <div class="text-[11px] text-slate-500 mt-0.5">
            DENTAL LAB MANAGER
          </div>
        </div>
      </div>

      <div
        class="px-4 py-4 border-b border-slate-100"
        :class="!sidebarOpen && 'px-2'"
      >
        <div
          class="flex items-center gap-2 p-2.5 bg-slate-50 rounded-lg border border-slate-100"
        >
          <div
            class="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center flex-shrink-0"
          >
            <ShieldCheck class="w-4 h-4 text-slate-600" />
          </div>
          <div
            v-if="sidebarOpen"
            class="min-w-0 flex-1"
          >
            <div class="text-[10px] text-slate-500">当前角色</div>
            <div class="flex items-center gap-1.5 mt-0.5">
              <select
                :value="currentRole"
                @change="handleRoleChange(($event.target as HTMLSelectElement).value as Role)"
                class="text-xs font-semibold bg-transparent text-slate-800 w-full focus:outline-none cursor-pointer"
              >
                <option value="dispatcher">调度员</option>
                <option value="clinic">诊所端</option>
                <option value="technician">技师端</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <nav class="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <a
          v-for="item in navItems"
          :key="item.label"
          class="group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all cursor-pointer"
          :class="[
            isActive(item.path)
              ? 'bg-blue-50 text-blue-700 font-medium shadow-sm'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
          ]"
          @click="router.push(item.path)"
        >
          <div
            class="w-5 h-5 flex-shrink-0 transition-colors"
            :class="[
              isActive(item.path)
                ? 'text-blue-600'
                : 'text-slate-400 group-hover:text-slate-600',
            ]"
          >
            <component :is="item.icon" class="w-5 h-5" />
          </div>
          <span
            v-if="sidebarOpen"
            class="flex-1 truncate"
          >
            {{ item.label }}
          </span>
          <span
            v-if="item.badge && sidebarOpen"
            class="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 text-[10px] font-bold text-white bg-rose-500 rounded-full"
          >
            {{ item.badge }}
          </span>
          <div
            v-if="sidebarOpen && isActive(item.path)"
            class="w-1.5 h-1.5 rounded-full bg-blue-500"
          ></div>
        </a>
      </nav>

      <div
        v-if="sidebarOpen"
        class="px-4 py-4 border-t border-slate-100 flex-shrink-0"
      >
        <div
          class="p-3 rounded-xl bg-gradient-to-br from-blue-50 via-indigo-50 to-violet-50 border border-blue-100"
        >
          <div class="text-xs font-medium text-slate-700 mb-1">
            质量承诺
          </div>
          <p class="text-[11px] text-slate-600 leading-relaxed">
            每件修复体均经过严格质检，保证精度与生物相容性。
          </p>
        </div>
      </div>
    </aside>

    <div
      v-if="!sidebarOpen"
      class="fixed inset-0 bg-black/30 z-20 lg:hidden"
      @click="sidebarOpen = true"
    ></div>

    <div class="flex-1 flex flex-col min-w-0">
      <header
        class="h-16 bg-white border-b border-slate-200 px-4 lg:px-8 flex items-center justify-between sticky top-0 z-10 flex-shrink-0"
      >
        <div class="flex items-center gap-4 min-w-0">
          <button
            class="p-2 rounded-lg hover:bg-slate-100 transition-colors lg:hidden"
            @click="toggleSidebar"
          >
            <Menu v-if="!sidebarOpen" class="w-5 h-5 text-slate-600" />
            <X v-else class="w-5 h-5 text-slate-600" />
          </button>
          <button
            class="p-2 rounded-lg hover:bg-slate-100 transition-colors hidden lg:block"
            @click="toggleSidebar"
          >
            <Menu class="w-5 h-5 text-slate-600" />
          </button>

          <nav
            class="hidden md:flex items-center gap-1.5 text-sm min-w-0"
            aria-label="Breadcrumb"
          >
            <template
              v-for="(crumb, idx) in breadcrumbs"
              :key="idx"
            >
              <span
                v-if="crumb.path && idx < breadcrumbs.length - 1"
                class="text-slate-500 hover:text-blue-600 cursor-pointer truncate"
                @click="router.push(crumb.path)"
              >
                {{ crumb.label }}
              </span>
              <span
                v-else
                class="font-medium text-slate-800 truncate"
              >
                {{ crumb.label }}
              </span>
              <ChevronRight
                v-if="idx < breadcrumbs.length - 1"
                class="w-4 h-4 text-slate-300 flex-shrink-0"
              />
            </template>
          </nav>
        </div>

        <div class="flex items-center gap-3 flex-shrink-0">
          <div class="hidden md:flex items-center relative">
            <Search
              class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
            />
            <input
              type="text"
              placeholder="全局搜索..."
              class="w-64 pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-transparent placeholder:text-slate-400 transition-all"
            />
          </div>

          <button
            class="relative p-2 rounded-lg hover:bg-slate-100 transition-colors"
            @click="router.push('/notifications')"
          >
            <Bell class="w-5 h-5 text-slate-600" />
            <span
              v-if="unreadCount > 0"
              class="absolute top-1 right-1 inline-flex items-center justify-center min-w-[1rem] h-4 px-1 text-[9px] font-bold text-white bg-rose-500 rounded-full ring-2 ring-white"
            >
              {{ unreadCount > 99 ? '99+' : unreadCount }}
            </span>
            <span
              v-else
              class="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-slate-300 ring-2 ring-white"
            ></span>
          </button>

          <div class="h-8 w-px bg-slate-200"></div>

          <div class="flex items-center gap-3">
            <div
              class="hidden sm:block text-right"
            >
              <div class="text-sm font-medium text-slate-800 leading-tight">
                {{ currentUserInfo.name }}
              </div>
              <div class="text-[11px] text-slate-500">{{ currentUserInfo.department }}</div>
            </div>
            <div
              class="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold text-white ring-2 ring-white shadow-sm"
              :class="{
                'bg-gradient-to-br from-sky-400 to-sky-600': currentRole === 'clinic',
                'bg-gradient-to-br from-emerald-400 to-emerald-600': currentRole === 'technician',
                'bg-gradient-to-br from-violet-400 to-violet-600': currentRole === 'dispatcher',
              }"
            >
              {{ currentUserInfo.name.charAt(0) }}
            </div>
          </div>
        </div>
      </header>

      <main class="flex-1 p-4 lg:p-8 overflow-x-hidden">
        <div class="max-w-[1600px] mx-auto">
          <router-view v-slot="{ Component }">
            <transition
              name="page-fade"
              mode="out-in"
            >
              <component :is="Component" />
            </transition>
          </router-view>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.page-fade-enter-active,
.page-fade-leave-active {
  transition: all 0.25s ease;
}

.page-fade-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

.page-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
