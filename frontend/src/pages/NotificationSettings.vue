<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  Settings,
  Bell,
  AlertTriangle,
  CalendarClock,
  Zap,
  RefreshCw,
  CheckCircle2,
  Paperclip,
  Save,
  RotateCcw,
  ArrowLeft,
  Info,
  ShieldCheck,
  Eye,
} from 'lucide-vue-next'
import { useNotifications } from '../composables/useNotifications'
import { useRoles } from '../composables/useRoles'
import type { NotificationType, NotificationSetting, NotificationRole, NotificationCategory } from '../types'
import { NotificationTriggerRules, NotificationTypeLabels, NotificationCategoryLabels, NotificationTypeCategoryMap } from '../types'
import { MockNotificationSettings } from '../mock/notifications'

const router = useRouter()
const { settings, updateSettings } = useNotifications()
const { currentRole } = useRoles()

const localSettings = ref<NotificationSetting[]>(
  settings.value.map(s => ({ ...s, roleEnabled: { ...s.roleEnabled } }))
)

const globalEnabled = computed(() => localSettings.value.every(s => s.enabled))

function toggleGlobal() {
  const newState = !globalEnabled.value
  localSettings.value.forEach(s => {
    s.enabled = newState
  })
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

const allRoles: NotificationRole[] = ['clinic', 'technician', 'dispatcher']

const roleLabelMap: Record<NotificationRole, string> = {
  clinic: '诊所端',
  technician: '技师端',
  dispatcher: '调度员',
}

const roleColorMap: Record<NotificationRole, string> = {
  clinic: 'bg-sky-50 text-sky-700 border-sky-200',
  technician: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  dispatcher: 'bg-violet-50 text-violet-700 border-violet-200',
}

const roleIconMap: Record<NotificationRole, typeof ShieldCheck> = {
  clinic: Eye,
  technician: ShieldCheck,
  dispatcher: Settings,
}

const groupedSettings = computed(() => {
  const groups: { category: NotificationCategory; label: string; settings: NotificationSetting[] }[] = []
  const categories: NotificationCategory[] = ['delivery-warning', 'rework-reminder', 'stage-change', 'attachment-reminder']
  for (const cat of categories) {
    const catSettings = localSettings.value.filter(s => NotificationTypeCategoryMap[s.type] === cat)
    if (catSettings.length > 0) {
      groups.push({ category: cat, label: NotificationCategoryLabels[cat], settings: catSettings })
    }
  }
  return groups
})

function getTriggerRule(type: NotificationType) {
  return NotificationTriggerRules.find(r => r.type === type)
}

function toggleTypeEnabled(type: NotificationType) {
  const setting = localSettings.value.find(s => s.type === type)
  if (setting) {
    setting.enabled = !setting.enabled
  }
}

function toggleRoleEnabled(type: NotificationType, role: NotificationRole) {
  const setting = localSettings.value.find(s => s.type === type)
  if (setting) {
    setting.roleEnabled[role] = !setting.roleEnabled[role]
  }
}

const saving = ref(false)
const saved = ref(false)

async function handleSave() {
  saving.value = true
  saved.value = false
  updateSettings(localSettings.value)
  await new Promise(r => setTimeout(r, 400))
  saving.value = false
  saved.value = true
  setTimeout(() => { saved.value = false }, 2000)
}

function handleReset() {
  localSettings.value = MockNotificationSettings.map(s => ({
    ...s,
    roleEnabled: { ...s.roleEnabled },
  }))
}

function goBack() {
  router.push('/notifications')
}
</script>

<template>
  <div class="min-h-full">
    <div class="max-w-4xl mx-auto space-y-6">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <button
            class="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 transition-colors"
            @click="goBack"
          >
            <ArrowLeft class="w-4 h-4" />
            返回通知中心
          </button>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <div class="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100 text-blue-600">
          <Settings class="w-5 h-5" />
        </div>
        <div>
          <h1 class="text-xl font-semibold text-slate-900">消息设置</h1>
          <p class="text-sm text-slate-500">配置通知规则和接收偏好，控制不同角色看到的通知类型</p>
        </div>
      </div>

      <div class="bg-white rounded-xl border border-slate-200 p-5">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-50 text-blue-500">
              <Bell class="w-5 h-5" />
            </div>
            <div>
              <p class="text-sm font-medium text-slate-800">全局通知开关</p>
              <p class="text-xs text-slate-500">开启或关闭所有通知推送</p>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            :aria-checked="globalEnabled"
            class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            :class="globalEnabled ? 'bg-blue-600' : 'bg-slate-300'"
            @click="toggleGlobal"
          >
            <span
              class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
              :class="globalEnabled ? 'translate-x-5' : 'translate-x-0'"
            />
          </button>
        </div>
      </div>

      <div v-for="group in groupedSettings" :key="group.category" class="space-y-4">
        <div class="flex items-center gap-2 px-1">
          <span class="text-sm font-semibold text-slate-700">{{ group.label }}</span>
          <span class="text-xs text-slate-400">{{ group.settings.length }} 类通知</span>
        </div>

        <div
          v-for="setting in group.settings"
          :key="setting.type"
          class="bg-white rounded-xl border border-slate-200 overflow-hidden transition-all duration-200"
          :class="{ 'opacity-60': !setting.enabled }"
        >
          <div class="p-5">
            <div class="flex items-start justify-between gap-4">
              <div class="flex items-start gap-3 flex-1 min-w-0">
                <div
                  class="flex items-center justify-center w-9 h-9 rounded-lg shrink-0"
                  :class="typeIconBgMap[setting.type]"
                >
                  <component :is="typeIconMap[setting.type]" class="w-5 h-5" />
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-1">
                    <span class="text-sm font-medium text-slate-900">
                      {{ NotificationTypeLabels[setting.type] }}
                    </span>
                    <span
                      v-if="getTriggerRule(setting.type)?.targetRoles.includes(currentRole as NotificationRole)"
                      class="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded bg-blue-50 text-blue-600"
                    >
                      当前角色
                    </span>
                  </div>

                  <div
                    v-if="getTriggerRule(setting.type)"
                    class="flex items-start gap-1.5 mb-2 p-2 bg-slate-50 rounded-lg border border-slate-100"
                  >
                    <Info class="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <p class="text-xs text-slate-600 font-medium">{{ getTriggerRule(setting.type)?.description }}</p>
                      <p class="text-[10px] text-slate-400 mt-0.5">触发条件：{{ getTriggerRule(setting.type)?.condition }}</p>
                    </div>
                  </div>

                  <div class="flex items-center gap-1.5 flex-wrap">
                    <span class="text-[11px] text-slate-400 mr-1">通知对象：</span>
                    <span
                      v-for="role in getTriggerRule(setting.type)?.targetRoles"
                      :key="role"
                      class="inline-flex items-center gap-1 px-1.5 py-0.5 text-[11px] font-medium rounded-md border"
                      :class="roleColorMap[role]"
                    >
                      <component :is="roleIconMap[role]" class="w-2.5 h-2.5" />
                      {{ roleLabelMap[role] }}
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                :aria-checked="setting.enabled"
                class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                :class="setting.enabled ? 'bg-blue-600' : 'bg-slate-300'"
                @click="toggleTypeEnabled(setting.type)"
              >
                <span
                  class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                  :class="setting.enabled ? 'translate-x-5' : 'translate-x-0'"
                />
              </button>
            </div>
          </div>

          <div
            v-if="setting.enabled"
            class="border-t border-slate-100 px-5 py-4 bg-slate-50/50"
          >
            <p class="text-xs font-medium text-slate-600 mb-3">角色接收设置</p>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div
                v-for="role in allRoles"
                :key="role"
                class="flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg border transition-colors"
                :class="[
                  role === currentRole
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-white border-slate-200'
                ]"
              >
                <div class="flex items-center gap-2 min-w-0">
                  <span
                    class="inline-flex items-center px-1.5 py-0.5 text-[11px] font-medium rounded-md border shrink-0"
                    :class="roleColorMap[role]"
                  >
                    {{ roleLabelMap[role] }}
                  </span>
                  <span
                    v-if="role === currentRole"
                    class="text-[10px] text-blue-500 font-medium shrink-0"
                  >
                    (我)
                  </span>
                </div>
                <button
                  type="button"
                  role="switch"
                  :aria-checked="setting.roleEnabled[role]"
                  class="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                  :class="setting.roleEnabled[role] ? 'bg-blue-600' : 'bg-slate-300'"
                  @click="toggleRoleEnabled(setting.type, role)"
                >
                  <span
                    class="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                    :class="setting.roleEnabled[role] ? 'translate-x-4' : 'translate-x-0'"
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl border border-slate-200 p-5">
        <div class="flex items-center justify-end gap-3">
          <button
            type="button"
            class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            @click="handleReset"
          >
            <RotateCcw class="w-4 h-4" />
            恢复默认
          </button>
          <button
            type="button"
            class="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white rounded-lg transition-colors"
            :class="saved ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700'"
            :disabled="saving"
            @click="handleSave"
          >
            <CheckCircle2 v-if="saved" class="w-4 h-4" />
            <Save v-else class="w-4 h-4" />
            {{ saving ? '保存中...' : saved ? '已保存' : '保存设置' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
