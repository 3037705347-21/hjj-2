<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  MessageSquare,
  Filter,
  User,
  Calendar,
  Clock,
  Tag,
  Cpu,
  MessageCircle,
  StickyNote,
  Phone,
  RotateCcw,
  PackageCheck,
  AlertCircle,
  ArrowDownAZ,
  ArrowUpAZ,
} from 'lucide-vue-next'
import type { Communication, CommunicationType } from '../types'
import {
  CommunicationTypeLabels,
  CommunicationTypeColors,
  ProcessingStages,
} from '../types'

interface Props {
  communications: Communication[]
}

const props = defineProps<Props>()

const activeType = ref<CommunicationType | 'all'>('all')
const sortOrder = ref<'desc' | 'asc'>('desc')

const typeList: { key: CommunicationType | 'all'; label: string; count: number }[] = computed(() => {
  const types: { key: CommunicationType | 'all'; label: string; count: number }[] = [
    { key: 'all', label: '全部', count: props.communications.length },
  ]
  const order: CommunicationType[] = [
    'clinic-message',
    'internal-note',
    'phone-summary',
    'rework-communication',
    'delivery-confirmation',
    'system-notice',
  ]
  order.forEach((t) => {
    const count = props.communications.filter((c) => c.type === t).length
    if (count > 0) {
      types.push({
        key: t,
        label: CommunicationTypeLabels[t],
        count,
      })
    }
  })
  return types
})

const sortedCommunications = computed(() => {
  let list = [...props.communications]
  if (activeType.value !== 'all') {
    list = list.filter((c) => c.type === activeType.value)
  }
  list.sort((a, b) => {
    const diff = new Date(a.operatedAt).getTime() - new Date(b.operatedAt).getTime()
    return sortOrder.value === 'desc' ? -diff : diff
  })
  return list
})

function getTypeIcon(type: CommunicationType) {
  switch (type) {
    case 'clinic-message':
      return MessageCircle
    case 'internal-note':
      return StickyNote
    case 'phone-summary':
      return Phone
    case 'rework-communication':
      return RotateCcw
    case 'delivery-confirmation':
      return PackageCheck
    case 'system-notice':
      return Cpu
    default:
      return MessageSquare
  }
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

function getStageLabel(stage?: string) {
  if (!stage) return null
  const info = ProcessingStages.find((s) => s.stage === stage)
  return info?.label || stage
}

function setType(t: CommunicationType | 'all') {
  activeType.value = t
}

function toggleSort() {
  sortOrder.value = sortOrder.value === 'desc' ? 'asc' : 'desc'
}
</script>

<template>
  <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
    <div
      class="px-5 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3"
    >
      <div class="flex items-center gap-2">
        <div
          class="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center"
        >
          <MessageSquare class="w-4 h-4 text-emerald-600" />
        </div>
        <div>
          <h2 class="text-base font-semibold text-slate-800">沟通记录</h2>
          <p class="text-xs text-slate-500">
            共 {{ communications.length }} 条记录
          </p>
        </div>
      </div>
      <button
        class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
        @click="toggleSort"
      >
        <ArrowDownAZ
          v-if="sortOrder === 'desc'"
          class="w-3.5 h-3.5"
        />
        <ArrowUpAZ v-else class="w-3.5 h-3.5" />
        {{ sortOrder === 'desc' ? '时间倒序' : '时间正序' }}
      </button>
    </div>

    <div class="px-5 py-3 border-b border-slate-100 bg-slate-50/50">
      <div class="flex items-center gap-1.5 flex-wrap">
        <Filter class="w-3.5 h-3.5 text-slate-400" />
        <button
          v-for="t in typeList"
          :key="t.key"
          class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all"
          :class="[
            activeType === t.key
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50',
          ]"
          @click="setType(t.key)"
        >
          <span>{{ t.label }}</span>
          <span
            class="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px]"
            :class="[
              activeType === t.key
                ? 'bg-white/20 text-white'
                : 'bg-slate-100 text-slate-500',
            ]"
          >
            {{ t.count }}
          </span>
        </button>
      </div>
    </div>

    <div class="p-5">
      <template v-if="communications.length === 0">
        <div
          class="flex flex-col items-center justify-center py-10 text-center"
        >
          <div
            class="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-3"
          >
            <MessageSquare class="w-7 h-7 text-slate-400" />
          </div>
          <p class="text-sm font-medium text-slate-600 mb-1">暂无沟通记录</p>
          <p class="text-xs text-slate-400">该订单暂无任何沟通记录</p>
        </div>
      </template>

      <template v-else-if="sortedCommunications.length === 0">
        <div
          class="flex flex-col items-center justify-center py-10 text-center"
        >
          <div
            class="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-3"
          >
            <Filter class="w-7 h-7 text-slate-400" />
          </div>
          <p class="text-sm font-medium text-slate-600 mb-1">
            未找到相关记录
          </p>
          <p class="text-xs text-slate-400">
            当前筛选条件下暂无沟通记录
          </p>
        </div>
      </template>

      <template v-else>
        <div class="space-y-0">
          <div
            v-for="(comm, idx) in sortedCommunications"
            :key="comm.id"
            class="relative pl-8 pb-4 last:pb-0"
          >
            <div
              v-if="idx < sortedCommunications.length - 1"
              class="absolute left-3.5 top-5 w-px h-full bg-slate-200"
            ></div>

            <div
              class="absolute left-0 top-0 w-7 h-7 rounded-full flex items-center justify-center transition-all"
              :class="[
                comm.isSystemGenerated
                  ? 'bg-amber-100 border-2 border-amber-500'
                  : 'bg-white border-2 border-slate-300',
              ]"
            >
              <component
                :is="getTypeIcon(comm.type)"
                class="w-3.5 h-3.5"
                :class="comm.isSystemGenerated ? 'text-amber-600' : 'text-slate-500'"
              />
            </div>

            <div
              class="rounded-lg border p-4 ml-2 transition-all"
              :class="[
                comm.isSystemGenerated
                  ? 'bg-amber-50/50 border-amber-100'
                  : 'bg-white border-slate-200 hover:border-blue-200 hover:bg-blue-50/20',
              ]"
            >
              <div
                class="flex items-center justify-between mb-2 flex-wrap gap-2"
              >
                <div class="flex items-center gap-2 flex-wrap">
                  <span
                    class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border"
                    :class="CommunicationTypeColors[comm.type]"
                  >
                    <Tag class="w-3 h-3" />
                    {{ CommunicationTypeLabels[comm.type] }}
                  </span>
                  <span
                    v-if="comm.isSystemGenerated"
                    class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-500 border border-slate-200"
                  >
                    <Cpu class="w-2.5 h-2.5" />
                    系统生成
                  </span>
                  <span
                    v-if="getStageLabel(comm.relatedStage)"
                    class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-blue-50 text-blue-600 border border-blue-100"
                  >
                    <Clock class="w-2.5 h-2.5" />
                    {{ getStageLabel(comm.relatedStage) }}
                  </span>
                </div>
                <span
                  class="inline-flex items-center gap-1 text-xs text-slate-400"
                >
                  <Calendar class="w-3 h-3" />
                  {{ formatDate(comm.operatedAt) }}
                </span>
              </div>

              <div
                class="flex items-center gap-1.5 text-xs text-slate-500 mb-2"
              >
                <User class="w-3 h-3" />
                <span
                  :class="comm.isSystemGenerated ? 'font-medium text-amber-700' : ''"
                >
                  {{ comm.operator }}
                </span>
              </div>

              <p
                class="text-sm leading-relaxed"
                :class="comm.isSystemGenerated ? 'text-amber-800' : 'text-slate-700'"
              >
                {{ comm.content }}
              </p>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
