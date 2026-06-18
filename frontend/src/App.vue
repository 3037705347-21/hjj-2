<script setup lang="ts">
import { ref, computed } from 'vue'
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
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()

const sidebarOpen = ref(true)

const navItems = [
  {
    label: '订单看板',
    icon: LayoutDashboard,
    path: '/',
    badge: null,
  },
  {
    label: '订单列表',
    icon: ClipboardList,
    path: '/',
    badge: null,
  },
  {
    label: '诊所管理',
    icon: Users,
    path: '/',
    badge: null,
  },
  {
    label: '技师排程',
    icon: Package,
    path: '/',
    badge: null,
  },
  {
    label: '数据统计',
    icon: BarChart3,
    path: '/',
    badge: null,
  },
  {
    label: '系统设置',
    icon: Settings,
    path: '/',
    badge: null,
  },
]

const currentRole = ref<'clinic' | 'technician' | 'dispatcher'>('dispatcher')

const roleLabels = {
  clinic: '诊所端',
  technician: '技师端',
  dispatcher: '调度员',
}

const roleColors = {
  clinic: 'bg-sky-100 text-sky-700 border-sky-200',
  technician: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  dispatcher: 'bg-violet-100 text-violet-700 border-violet-200',
}

const breadcrumbs = computed(() => {
  const items: { label: string; path?: string }[] = []
  if (route.name === 'dashboard') {
    items.push({ label: '订单看板' })
  } else if (route.name === 'order-detail') {
    items.push({ label: '订单看板', path: '/' })
    items.push({ label: '订单详情' })
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
                v-model="currentRole"
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
          >
            <Bell class="w-5 h-5 text-slate-600" />
            <span
              class="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white"
            ></span>
          </button>

          <div class="h-8 w-px bg-slate-200"></div>

          <div class="flex items-center gap-3">
            <div
              class="hidden sm:block text-right"
            >
              <div class="text-sm font-medium text-slate-800 leading-tight">
                陈调度员
              </div>
              <div class="text-[11px] text-slate-500">调度中心</div>
            </div>
            <div
              class="w-9 h-9 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-sm font-semibold text-slate-600 ring-2 ring-white shadow-sm"
            >
              陈
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
