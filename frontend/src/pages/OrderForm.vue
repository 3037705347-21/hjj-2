<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  AlertCircle,
  FileText,
  User,
  Building2,
  Stethoscope,
  Calendar,
  Layers,
  Palette,
  BadgeDollarSign,
  ClipboardList,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Sparkles,
  X,
} from 'lucide-vue-next'
import { useOrders } from '../composables/useOrders'
import type {
  Tooth,
  ToothWorkItem,
  RestorationType,
  MaterialType,
  ShadeGuide,
  ImpressionMethod,
  OrderPriority,
  Order,
} from '../types'
import {
  RestorationTypeLabels,
  MaterialTypeLabels,
  ImpressionMethodLabels,
  PriorityLabels,
} from '../types'
import { ShadeGuides, PermanentTeeth } from '../config/teeth'
import { cn } from '../lib/utils'

const route = useRoute()
const router = useRouter()
const {
  getOrderById,
  getClinics,
  createOrder,
  updateOrder,
  copyOrder,
  generateOrderNumber,
  generateAnonymousCode,
} = useOrders()

type FormMode = 'create' | 'edit' | 'copy'

const mode = ref<FormMode>('create')
const editingOrderId = ref<string | null>(null)
const sourceOrderNumber = ref<string | null>(null)

const todayStr = new Date().toISOString().split('T')[0]
const defaultDeliveryDate = (() => {
  const d = new Date()
  d.setDate(d.getDate() + 7)
  return d.toISOString().split('T')[0]
})()

const clinics = getClinics()

const form = reactive({
  orderNumber: '',
  clinicId: '',
  doctorName: '',
  patientAnonymousCode: '',
  patientGender: '' as '' | 'male' | 'female',
  patientAge: null as number | null,
  impressionMethod: 'digital-scan' as ImpressionMethod,
  deliveryDate: defaultDeliveryDate,
  priority: 'standard' as OrderPriority,
  specialInstructions: '',
  totalAmount: null as number | null,
  isFullArch: false,
  fullArchRestorationType: 'full-denture' as RestorationType,
  fullArchMaterial: 'acrylic' as MaterialType,
  fullArchShade: 'A3' as ShadeGuide,
  fullArchNotes: '',
})

const workItems = ref<ToothWorkItem[]>([])

const selectedTooth = ref<Tooth | null>(null)
const editingItem = ref<{ toothNumber: string } | null>(null)
const workItemForm = reactive({
  restorationType: 'crown' as RestorationType,
  material: 'zirconia' as MaterialType,
  shade: 'A2' as ShadeGuide,
  notes: '',
})

const bridgeMode = ref(false)
const bridgeSelectedTeeth = ref<string[]>([])
const bridgeForm = reactive({
  restorationType: 'bridge' as RestorationType,
  material: 'zirconia' as MaterialType,
  shade: 'A2' as ShadeGuide,
  notes: '',
})

const errors = reactive<Record<string, string>>({})
const submitAttempted = ref(false)

const isFullArch = computed(() => form.isFullArch)
const hasIndividualTeeth = computed(() => workItems.value.length > 0)

const workMap = computed(() => {
  const map = new Map<string, ToothWorkItem>()
  workItems.value.forEach((item) => map.set(item.toothNumber, item))
  return map
})

const pageTitle = computed(() => {
  if (mode.value === 'edit') return '编辑订单'
  if (mode.value === 'copy') return '复制订单'
  return '新建订单'
})

const submitButtonText = computed(() => {
  if (mode.value === 'edit') return '保存修改'
  return '提交订单'
})

function resetBridgeSelection() {
  bridgeSelectedTeeth.value = []
}

function toggleBridgeTooth(toothNumber: string) {
  const idx = bridgeSelectedTeeth.value.indexOf(toothNumber)
  if (idx === -1) {
    bridgeSelectedTeeth.value.push(toothNumber)
  } else {
    bridgeSelectedTeeth.value.splice(idx, 1)
  }
}

function isBridgeSelected(toothNumber: string) {
  return bridgeSelectedTeeth.value.includes(toothNumber)
}

function confirmBridgeWorkItems() {
  if (bridgeSelectedTeeth.value.length < 2) {
    errors.bridge = '联桥至少需要选择2颗牙齿'
    return
  }
  delete errors.bridge

  for (const tn of bridgeSelectedTeeth.value) {
    workItems.value.push({
      toothNumber: tn,
      restorationType: bridgeForm.restorationType,
      material: bridgeForm.material,
      shade: bridgeForm.shade,
      notes:
        tn === bridgeSelectedTeeth.value[0]
          ? `${bridgeSelectedTeeth.value.join('-')}联桥，共${bridgeSelectedTeeth.value.length}颗`
          : bridgeForm.notes || undefined,
    })
  }

  bridgeMode.value = false
  resetBridgeSelection()
}

function handleToothSelect(tooth: Tooth) {
  if (isFullArch.value) {
    errors.tooth = '全口修复模式下不能选择单颗牙齿，请先关闭全口修复'
    return
  }
  delete errors.tooth

  if (bridgeMode.value) {
    toggleBridgeTooth(tooth.number)
    return
  }

  const existing = workMap.value.get(tooth.number)
  if (existing) {
    editingItem.value = { toothNumber: tooth.number }
    workItemForm.restorationType = existing.restorationType
    workItemForm.material = existing.material
    workItemForm.shade = existing.shade
    workItemForm.notes = existing.notes || ''
  } else {
    selectedTooth.value = tooth
    editingItem.value = null
    workItemForm.restorationType = 'crown'
    workItemForm.material = 'zirconia'
    workItemForm.shade = 'A2'
    workItemForm.notes = ''
  }
}

function addWorkItem() {
  if (!selectedTooth.value) return
  const toothNum = selectedTooth.value.number

  if (workMap.value.has(toothNum)) {
    errors.tooth = `牙位 ${toothNum} 已配置修复体，不可重复添加`
    return
  }
  delete errors.tooth

  workItems.value.push({
    toothNumber: toothNum,
    restorationType: workItemForm.restorationType,
    material: workItemForm.material,
    shade: workItemForm.shade,
    notes: workItemForm.notes || undefined,
  })
  selectedTooth.value = null
  workItemForm.notes = ''
}

function updateWorkItem() {
  if (!editingItem.value) return
  const idx = workItems.value.findIndex(
    (w) => w.toothNumber === editingItem.value!.toothNumber
  )
  if (idx !== -1) {
    workItems.value[idx] = {
      ...workItems.value[idx],
      restorationType: workItemForm.restorationType,
      material: workItemForm.material,
      shade: workItemForm.shade,
      notes: workItemForm.notes || undefined,
    }
  }
  editingItem.value = null
  workItemForm.notes = ''
}

function removeWorkItem(toothNumber: string) {
  const idx = workItems.value.findIndex((w) => w.toothNumber === toothNumber)
  if (idx !== -1) workItems.value.splice(idx, 1)
  if (editingItem.value?.toothNumber === toothNumber) {
    editingItem.value = null
  }
}

function cancelWorkItemEdit() {
  if (bridgeMode.value) {
    bridgeMode.value = false
    resetBridgeSelection()
    return
  }
  selectedTooth.value = null
  editingItem.value = null
  workItemForm.notes = ''
}

function toggleFullArch(val: boolean) {
  form.isFullArch = val
  if (val && hasIndividualTeeth.value) {
    errors.fullArch = '全口修复与单牙修复不能混填，请先清除单牙记录或取消全口修复'
    form.isFullArch = false
    return
  }
  delete errors.fullArch
}

watch(
  () => form.isFullArch,
  (val) => {
    if (val && workItems.value.length > 0) {
      form.isFullArch = false
      errors.fullArch = '全口修复与单牙修复不能混填'
    }
  }
)

function validate(): boolean {
  Object.keys(errors).forEach((k) => delete errors[k])
  submitAttempted.value = true

  if (!form.clinicId) errors.clinicId = '请选择诊所'
  if (!form.doctorName.trim()) errors.doctorName = '请填写医生姓名'
  if (!form.patientAnonymousCode.trim()) errors.patientCode = '请填写患者匿名编码'
  if (!form.deliveryDate) errors.deliveryDate = '请选择交付日期'
  if (form.deliveryDate && form.deliveryDate < todayStr)
    errors.deliveryDate = '交付日期不能早于今天'

  if ((form.priority === 'urgent' || form.priority === 'stat') && !form.specialInstructions.trim()) {
    errors.specialInstructions = '加急单/特急单必须填写原因或备注'
  }

  if (!isFullArch.value && workItems.value.length === 0) {
    errors.workItems = '请至少选择一颗牙齿并配置修复体，或启用全口修复'
  }

  if (isFullArch.value) {
    if (!form.fullArchRestorationType) errors.fullArch = '请选择全口修复类型'
    if (!form.fullArchMaterial) errors.fullArch = '请选择全口修复材料'
    if (!form.fullArchShade) errors.fullArch = '请选择全口修复比色号'
  }

  const toothSet = new Set<string>()
  for (const item of workItems.value) {
    if (toothSet.has(item.toothNumber)) {
      errors.workItems = `同一牙位 ${item.toothNumber} 不可重复配置`
      break
    }
    toothSet.add(item.toothNumber)
  }

  return Object.keys(errors).length === 0
}

function handleSubmit() {
  if (!validate()) return

  let finalWorkItems: ToothWorkItem[] = []

  if (isFullArch.value) {
    finalWorkItems = [
      {
        toothNumber: 'all',
        restorationType: form.fullArchRestorationType,
        material: form.fullArchMaterial,
        shade: form.fullArchShade,
        notes: form.fullArchNotes || undefined,
      },
    ]
  } else {
    finalWorkItems = [...workItems.value]
  }

  const orderParams = {
    clinicId: form.clinicId,
    doctorName: form.doctorName.trim(),
    patient: {
      anonymousCode: form.patientAnonymousCode.trim(),
      gender: form.patientGender || undefined,
      age: form.patientAge || undefined,
    },
    workItems: finalWorkItems,
    impressionMethod: form.impressionMethod,
    deliveryDate: form.deliveryDate,
    priority: form.priority,
    specialInstructions: form.specialInstructions.trim() || undefined,
    totalAmount: form.totalAmount || undefined,
  }

  let savedOrder: Order | undefined

  if (mode.value === 'edit' && editingOrderId.value) {
    savedOrder = updateOrder(editingOrderId.value, orderParams)
  } else {
    savedOrder = createOrder(orderParams)
  }

  if (savedOrder) {
    router.push(`/order/${savedOrder.id}`)
  }
}

function handleCopyAndGoto() {
  if (mode.value !== 'edit' || !editingOrderId.value) return
  const newOrder = copyOrder(editingOrderId.value)
  if (newOrder) {
    router.push(`/order/${newOrder.id}`)
  }
}

function goBack() {
  if (mode.value === 'edit' && editingOrderId.value) {
    router.push(`/order/${editingOrderId.value}`)
  } else {
    router.push('/')
  }
}

function regenerateOrderNumber() {
  form.orderNumber = generateOrderNumber()
}

function regeneratePatientCode() {
  form.patientAnonymousCode = generateAnonymousCode()
}

function loadOrderForEdit(id: string) {
  const order = getOrderById(id)
  if (!order) {
    router.push('/')
    return
  }
  editingOrderId.value = id

  form.orderNumber = order.orderNumber
  form.clinicId = order.clinicId
  form.doctorName = order.doctorName
  form.patientAnonymousCode = order.patient.anonymousCode
  form.patientGender = order.patient.gender || ''
  form.patientAge = order.patient.age || null
  form.impressionMethod = order.impressionMethod
  form.deliveryDate = order.deliveryDate
  form.priority = order.priority
  form.specialInstructions = order.specialInstructions || ''
  form.totalAmount = order.totalAmount || null

  const fullArchItem = order.workItems.find((w) => w.toothNumber === 'all')
  if (fullArchItem) {
    form.isFullArch = true
    form.fullArchRestorationType = fullArchItem.restorationType
    form.fullArchMaterial = fullArchItem.material
    form.fullArchShade = fullArchItem.shade
    form.fullArchNotes = fullArchItem.notes || ''
  } else {
    form.isFullArch = false
    workItems.value = order.workItems.map((w) => ({ ...w }))
  }
}

onMounted(() => {
  const routeMode = route.query.mode as string
  const orderId = route.params.id as string

  if (orderId) {
    if (routeMode === 'copy') {
      mode.value = 'copy'
      const source = getOrderById(orderId)
      if (source) {
        sourceOrderNumber.value = source.orderNumber
        form.clinicId = source.clinicId
        form.doctorName = source.doctorName
        form.patientGender = source.patient.gender || ''
        form.patientAge = source.patient.age || null
        form.impressionMethod = source.impressionMethod
        form.deliveryDate = source.deliveryDate
        form.priority = source.priority
        form.specialInstructions = source.specialInstructions || ''
        form.totalAmount = source.totalAmount || null

        const fullArchItem = source.workItems.find((w) => w.toothNumber === 'all')
        if (fullArchItem) {
          form.isFullArch = true
          form.fullArchRestorationType = fullArchItem.restorationType
          form.fullArchMaterial = fullArchItem.material
          form.fullArchShade = fullArchItem.shade
          form.fullArchNotes = fullArchItem.notes || ''
        } else {
          workItems.value = source.workItems.map((w) => ({ ...w }))
        }
      }
      form.orderNumber = generateOrderNumber()
      form.patientAnonymousCode = generateAnonymousCode()
    } else {
      mode.value = 'edit'
      loadOrderForEdit(orderId)
    }
  } else {
    mode.value = 'create'
    form.orderNumber = generateOrderNumber()
    form.patientAnonymousCode = generateAnonymousCode()
    if (clinics.length > 0) form.clinicId = clinics[0].id
  }
})

const availableRestorationTypes: RestorationType[] = [
  'crown',
  'bridge',
  'veneer',
  'inlay',
  'onlay',
  'implant-crown',
  'partial-denture',
]

const fullArchRestorationTypes: RestorationType[] = ['full-denture', 'partial-denture']

const allRestorationLabels = { ...RestorationTypeLabels }
</script>

<template>
  <div class="min-h-full pb-12">
    <div class="mb-6">
      <button
        class="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 mb-4 transition-colors"
        @click="goBack"
      >
        <ArrowLeft class="w-4 h-4" />
        {{ mode === 'edit' && editingOrderId ? '返回订单详情' : '返回订单看板' }}
      </button>

      <div
        class="flex flex-col lg:flex-row lg:items-start justify-between gap-4"
      >
        <div>
          <div class="flex flex-wrap items-center gap-3 mb-2">
            <h1 class="text-2xl font-bold text-slate-900 tracking-tight">
              {{ pageTitle }}
            </h1>
            <span
              v-if="mode === 'copy'"
              class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-violet-50 text-violet-700 border border-violet-200"
            >
              <RefreshCw class="w-3 h-3" />
              源订单：{{ sourceOrderNumber }}
            </span>
          </div>
          <div class="flex flex-wrap items-center gap-4 text-sm text-slate-500">
            <span class="inline-flex items-center gap-1.5 font-mono">
              <FileText class="w-4 h-4" />
              订单编号：<span class="font-semibold text-slate-700">{{ form.orderNumber }}</span>
              <button
                v-if="mode !== 'edit'"
                class="ml-1 inline-flex items-center gap-0.5 text-xs text-blue-600 hover:text-blue-700 hover:underline"
                type="button"
                @click="regenerateOrderNumber"
              >
                <Sparkles class="w-3 h-3" />
                重生成
              </button>
            </span>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button
            v-if="mode === 'edit'"
            type="button"
            class="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-violet-700 bg-violet-50 border border-violet-200 rounded-lg hover:bg-violet-100 transition-colors"
            @click="handleCopyAndGoto"
          >
            <RefreshCw class="w-4 h-4" />
            复制此订单
          </button>
          <button
            type="button"
            class="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            @click="goBack"
          >
            取消
          </button>
          <button
            type="button"
            class="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            @click="handleSubmit"
          >
            <Save class="w-4 h-4" />
            {{ submitButtonText }}
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="submitAttempted && Object.keys(errors).length > 0"
      class="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl"
    >
      <div class="flex items-start gap-2 mb-2">
        <AlertCircle class="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
        <div class="text-sm font-semibold text-rose-800">
          表单校验失败，请修正以下问题
        </div>
      </div>
      <ul class="list-disc list-inside ml-7 space-y-0.5 text-sm text-rose-700">
        <li v-for="(msg, key) in errors" :key="key">{{ msg }}</li>
      </ul>
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <div class="xl:col-span-2 space-y-6">
        <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div
            class="px-5 py-4 border-b border-slate-100 flex items-center gap-2"
          >
            <div
              class="w-8 h-8 rounded-lg bg-sky-50 border border-sky-100 flex items-center justify-center"
            >
              <Building2 class="w-4 h-4 text-sky-600" />
            </div>
            <h2 class="text-base font-semibold text-slate-800">
              诊所与医生信息
            </h2>
          </div>
          <div class="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1.5">
                合作诊所 <span class="text-rose-500">*</span>
              </label>
              <select
                v-model="form.clinicId"
                class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                :class="{ 'border-rose-300 ring-1 ring-rose-200': errors.clinicId }"
              >
                <option value="" disabled>请选择诊所</option>
                <option v-for="c in clinics" :key="c.id" :value="c.id">
                  {{ c.name }} ({{ c.clinicCode }})
                </option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1.5">
                医生姓名 <span class="text-rose-500">*</span>
              </label>
              <input
                v-model="form.doctorName"
                type="text"
                placeholder="例如：李明华"
                class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                :class="{ 'border-rose-300 ring-1 ring-rose-200': errors.doctorName }"
              />
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div
            class="px-5 py-4 border-b border-slate-100 flex items-center gap-2"
          >
            <div
              class="w-8 h-8 rounded-lg bg-violet-50 border border-violet-100 flex items-center justify-center"
            >
              <Stethoscope class="w-4 h-4 text-violet-600" />
            </div>
            <h2 class="text-base font-semibold text-slate-800">
              患者信息
            </h2>
          </div>
          <div class="p-5 grid grid-cols-1 md:grid-cols-3 gap-5">
            <div class="md:col-span-3">
              <label class="block text-xs font-medium text-slate-600 mb-1.5">
                患者匿名编码 <span class="text-rose-500">*</span>
              </label>
              <div class="flex gap-2">
                <input
                  v-model="form.patientAnonymousCode"
                  type="text"
                  placeholder="例如：YK-2026-0617-A"
                  class="flex-1 px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  :class="{ 'border-rose-300 ring-1 ring-rose-200': errors.patientCode }"
                />
                <button
                  v-if="mode !== 'edit'"
                  type="button"
                  class="inline-flex items-center gap-1 px-3 py-2 text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
                  @click="regeneratePatientCode"
                >
                  <Sparkles class="w-4 h-4" />
                  重生成
                </button>
              </div>
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1.5">
                性别
              </label>
              <div class="flex gap-2">
                <label
                  class="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm border rounded-lg cursor-pointer transition-colors"
                  :class="form.patientGender === 'male' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'"
                >
                  <input type="radio" class="hidden" :value="'male'" v-model="form.patientGender" />
                  <User class="w-4 h-4" />
                  男
                </label>
                <label
                  class="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm border rounded-lg cursor-pointer transition-colors"
                  :class="form.patientGender === 'female' ? 'bg-rose-50 border-rose-200 text-rose-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'"
                >
                  <input type="radio" class="hidden" :value="'female'" v-model="form.patientGender" />
                  <User class="w-4 h-4" />
                  女
                </label>
              </div>
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1.5">
                年龄
              </label>
              <div class="relative">
                <input
                  v-model.number="form.patientAge"
                  type="number"
                  min="0"
                  max="120"
                  placeholder="岁"
                  class="w-full px-3 py-2 pr-8 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                  岁
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div
            class="px-5 py-4 border-b border-slate-100 flex items-start justify-between gap-3 flex-wrap"
          >
            <div class="flex items-center gap-2">
              <div
                class="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center"
              >
                <Layers class="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <h2 class="text-base font-semibold text-slate-800">
                  牙位与修复体配置
                </h2>
                <p class="text-xs text-slate-500 mt-0.5">
                  点击牙位添加修复体，或使用联桥模式、全口修复
                </p>
              </div>
            </div>

            <div class="flex items-center gap-2 flex-wrap">
              <label
                class="inline-flex items-center gap-2 px-3 py-1.5 text-xs rounded-md border cursor-pointer transition-colors"
                :class="isFullArch ? 'bg-violet-50 border-violet-200 text-violet-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'"
              >
                <input type="checkbox" class="hidden" :checked="isFullArch" @change="toggleFullArch(!isFullArch)" />
                <div
                  class="w-3.5 h-3.5 rounded border-2 flex items-center justify-center transition-colors"
                  :class="isFullArch ? 'bg-violet-500 border-violet-500' : 'border-slate-300'"
                >
                  <CheckCircle2 v-if="isFullArch" class="w-3 h-3 text-white" />
                </div>
                全口修复
              </label>

              <button
                v-if="!isFullArch"
                type="button"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md border transition-colors"
                :class="bridgeMode ? 'bg-amber-50 border-amber-200 text-amber-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'"
                @click="bridgeMode = !bridgeMode; if (!bridgeMode) resetBridgeSelection()"
              >
                <Plus class="w-3.5 h-3.5" />
                联桥模式{{ bridgeMode ? ' (选择中)' : '' }}
              </button>
            </div>
          </div>

          <div class="p-5 space-y-5">
            <div
              v-if="errors.workItems || errors.tooth || errors.fullArch || errors.bridge"
              class="p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-700 flex items-start gap-2"
            >
              <AlertCircle class="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>
                {{ errors.workItems || errors.tooth || errors.fullArch || errors.bridge }}
              </span>
            </div>

            <div
              v-if="bridgeMode"
              class="p-3 bg-amber-50 border border-amber-200 rounded-lg"
            >
              <div class="flex items-center justify-between flex-wrap gap-2 mb-2">
                <div class="text-sm font-medium text-amber-800">
                  联桥模式：请依次点击要连接的牙齿（至少2颗）
                </div>
                <div class="text-xs text-amber-600">
                  已选：{{ bridgeSelectedTeeth.length }} 颗
                  <span v-if="bridgeSelectedTeeth.length > 0">
                    ({{ bridgeSelectedTeeth.join(' → ') }})
                  </span>
                </div>
              </div>
            </div>

            <div
              v-if="isFullArch"
              class="p-4 bg-violet-50 border border-violet-200 rounded-xl space-y-4"
            >
              <div class="flex items-center gap-2 text-sm font-semibold text-violet-800">
                <div class="w-2.5 h-2.5 rounded bg-violet-500"></div>
                全口修复配置
              </div>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label class="block text-xs font-medium text-violet-700 mb-1.5">
                    修复类型
                  </label>
                  <select
                    v-model="form.fullArchRestorationType"
                    class="w-full px-3 py-2 text-sm bg-white border border-violet-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    <option v-for="rt in fullArchRestorationTypes" :key="rt" :value="rt">
                      {{ allRestorationLabels[rt] }}
                    </option>
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-medium text-violet-700 mb-1.5">
                    材料
                  </label>
                  <select
                    v-model="form.fullArchMaterial"
                    class="w-full px-3 py-2 text-sm bg-white border border-violet-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    <option
                      v-for="(label, key) in MaterialTypeLabels"
                      :key="key"
                      :value="key"
                    >
                      {{ label }}
                    </option>
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-medium text-violet-700 mb-1.5">
                    比色号
                  </label>
                  <select
                    v-model="form.fullArchShade"
                    class="w-full px-3 py-2 text-sm bg-white border border-violet-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    <option v-for="s in ShadeGuides" :key="s" :value="s">
                      {{ s }}
                    </option>
                  </select>
                </div>
              </div>
              <div>
                <label class="block text-xs font-medium text-violet-700 mb-1.5">
                  备注说明
                </label>
                <textarea
                  v-model="form.fullArchNotes"
                  rows="2"
                  placeholder="例如：吸附式设计、患者牙槽骨吸收严重等"
                  class="w-full px-3 py-2 text-sm bg-white border border-violet-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                ></textarea>
              </div>
            </div>

            <div
              :class="isFullArch ? 'opacity-40 pointer-events-none' : ''"
            >
              <div class="w-full">
                <div class="space-y-3">
                  <div class="text-center text-xs font-medium text-slate-500 tracking-widest">
                    上颌 MAXILLARY
                  </div>

                  <div class="grid grid-cols-2 gap-4">
                    <div class="flex justify-end">
                      <div class="flex flex-col items-center">
                        <div class="text-[10px] text-slate-400 mb-1">右上</div>
                        <div class="flex">
                          <div
                            v-for="tooth in PermanentTeeth.filter(t => t.quadrant === 'upper-right')"
                            :key="tooth.number"
                            class="group relative w-8 h-10 mx-0.5 cursor-pointer"
                            @click="handleToothSelect(tooth)"
                          >
                            <div
                              class="absolute inset-0 rounded-t-2xl rounded-b-md border-2 transition-all flex items-end justify-center pb-1"
                              :class="[
                                bridgeMode && isBridgeSelected(tooth.number)
                                  ? 'bg-amber-400 border-amber-500 text-white'
                                  : workMap.has(tooth.number)
                                  ? 'bg-blue-500 border-blue-600 text-white'
                                  : selectedTooth?.number === tooth.number
                                  ? 'bg-blue-100 border-blue-400 text-blue-700'
                                  : 'bg-white border-slate-300 text-slate-500 hover:border-slate-400 hover:bg-slate-50',
                              ]"
                            >
                              <span class="text-[10px] font-bold leading-none">
                                {{ tooth.number }}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div class="flex justify-start">
                      <div class="flex flex-col items-center">
                        <div class="text-[10px] text-slate-400 mb-1">左上</div>
                        <div class="flex">
                          <div
                            v-for="tooth in PermanentTeeth.filter(t => t.quadrant === 'upper-left')"
                            :key="tooth.number"
                            class="group relative w-8 h-10 mx-0.5 cursor-pointer"
                            @click="handleToothSelect(tooth)"
                          >
                            <div
                              class="absolute inset-0 rounded-t-2xl rounded-b-md border-2 transition-all flex items-end justify-center pb-1"
                              :class="[
                                bridgeMode && isBridgeSelected(tooth.number)
                                  ? 'bg-amber-400 border-amber-500 text-white'
                                  : workMap.has(tooth.number)
                                  ? 'bg-blue-500 border-blue-600 text-white'
                                  : selectedTooth?.number === tooth.number
                                  ? 'bg-blue-100 border-blue-400 text-blue-700'
                                  : 'bg-white border-slate-300 text-slate-500 hover:border-slate-400 hover:bg-slate-50',
                              ]"
                            >
                              <span class="text-[10px] font-bold leading-none">
                                {{ tooth.number }}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="flex items-center justify-center py-2">
                    <div class="h-px w-full bg-gradient-to-r from-transparent via-slate-300 to-transparent max-w-xs"></div>
                  </div>

                  <div class="grid grid-cols-2 gap-4">
                    <div class="flex justify-start">
                      <div class="flex flex-col items-center">
                        <div class="flex">
                          <div
                            v-for="tooth in PermanentTeeth.filter(t => t.quadrant === 'lower-left')"
                            :key="tooth.number"
                            class="group relative w-8 h-10 mx-0.5 cursor-pointer"
                            @click="handleToothSelect(tooth)"
                          >
                            <div
                              class="absolute inset-0 rounded-b-2xl rounded-t-md border-2 transition-all flex items-start justify-center pt-1"
                              :class="[
                                bridgeMode && isBridgeSelected(tooth.number)
                                  ? 'bg-amber-400 border-amber-500 text-white'
                                  : workMap.has(tooth.number)
                                  ? 'bg-blue-500 border-blue-600 text-white'
                                  : selectedTooth?.number === tooth.number
                                  ? 'bg-blue-100 border-blue-400 text-blue-700'
                                  : 'bg-white border-slate-300 text-slate-500 hover:border-slate-400 hover:bg-slate-50',
                              ]"
                            >
                              <span class="text-[10px] font-bold leading-none">
                                {{ tooth.number }}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div class="text-[10px] text-slate-400 mt-1">左下</div>
                      </div>
                    </div>

                    <div class="flex justify-end">
                      <div class="flex flex-col items-center">
                        <div class="flex">
                          <div
                            v-for="tooth in PermanentTeeth.filter(t => t.quadrant === 'lower-right')"
                            :key="tooth.number"
                            class="group relative w-8 h-10 mx-0.5 cursor-pointer"
                            @click="handleToothSelect(tooth)"
                          >
                            <div
                              class="absolute inset-0 rounded-b-2xl rounded-t-md border-2 transition-all flex items-start justify-center pt-1"
                              :class="[
                                bridgeMode && isBridgeSelected(tooth.number)
                                  ? 'bg-amber-400 border-amber-500 text-white'
                                  : workMap.has(tooth.number)
                                  ? 'bg-blue-500 border-blue-600 text-white'
                                  : selectedTooth?.number === tooth.number
                                  ? 'bg-blue-100 border-blue-400 text-blue-700'
                                  : 'bg-white border-slate-300 text-slate-500 hover:border-slate-400 hover:bg-slate-50',
                              ]"
                            >
                              <span class="text-[10px] font-bold leading-none">
                                {{ tooth.number }}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div class="text-[10px] text-slate-400 mt-1">右下</div>
                      </div>
                    </div>
                  </div>

                  <div class="text-center text-xs font-medium text-slate-500 tracking-widest mt-2">
                    下颌 MANDIBULAR
                  </div>
                </div>

                <div class="mt-4 flex items-center justify-center gap-4 flex-wrap text-[11px] text-slate-500">
                  <div class="flex items-center gap-1.5">
                    <div class="w-4 h-4 rounded bg-white border-2 border-slate-300"></div>
                    <span>未选</span>
                  </div>
                  <div class="flex items-center gap-1.5">
                    <div class="w-4 h-4 rounded bg-blue-100 border-2 border-blue-400"></div>
                    <span>选中</span>
                  </div>
                  <div class="flex items-center gap-1.5">
                    <div class="w-4 h-4 rounded bg-blue-500 border-2 border-blue-600"></div>
                    <span>已配置</span>
                  </div>
                  <div class="flex items-center gap-1.5">
                    <div class="w-4 h-4 rounded bg-amber-400 border-2 border-amber-500"></div>
                    <span>联桥选择</span>
                  </div>
                </div>
              </div>
            </div>

            <div
              v-if="bridgeMode && bridgeSelectedTeeth.length > 0"
              class="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-4"
            >
              <div class="text-sm font-semibold text-amber-800">联桥配置</div>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label class="block text-xs font-medium text-amber-700 mb-1.5">修复类型</label>
                  <select
                    v-model="bridgeForm.restorationType"
                    class="w-full px-3 py-2 text-sm bg-white border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option :value="'bridge'">固定桥</option>
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-medium text-amber-700 mb-1.5">材料</label>
                  <select
                    v-model="bridgeForm.material"
                    class="w-full px-3 py-2 text-sm bg-white border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option
                      v-for="(label, key) in MaterialTypeLabels"
                      :key="key"
                      :value="key"
                    >
                      {{ label }}
                    </option>
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-medium text-amber-700 mb-1.5">比色号</label>
                  <select
                    v-model="bridgeForm.shade"
                    class="w-full px-3 py-2 text-sm bg-white border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option v-for="s in ShadeGuides" :key="s" :value="s">{{ s }}</option>
                  </select>
                </div>
              </div>
              <div>
                <label class="block text-xs font-medium text-amber-700 mb-1.5">桥体备注</label>
                <textarea
                  v-model="bridgeForm.notes"
                  rows="1"
                  placeholder="例如：中间缺失牙位"
                  class="w-full px-3 py-2 text-sm bg-white border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                ></textarea>
              </div>
              <div class="flex justify-end gap-2">
                <button
                  type="button"
                  class="px-3 py-1.5 text-sm text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
                  @click="cancelWorkItemEdit"
                >
                  取消
                </button>
                <button
                  type="button"
                  class="px-4 py-1.5 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700"
                  @click="confirmBridgeWorkItems"
                >
                  确认添加联桥（{{ bridgeSelectedTeeth.length }}颗）
                </button>
              </div>
            </div>

            <div
              v-if="selectedTooth || editingItem"
              class="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-4"
            >
              <div class="flex items-center justify-between flex-wrap gap-2">
                <div class="flex items-center gap-2">
                  <span
                    class="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-blue-600 text-white font-bold"
                  >
                    {{ editingItem ? editingItem.toothNumber : selectedTooth?.number }}
                  </span>
                  <div>
                    <div class="text-sm font-semibold text-blue-900">
                      {{ editingItem ? '编辑修复体' : '添加修复体' }}
                    </div>
                    <div class="text-xs text-blue-700">
                      {{ (editingItem ? PermanentTeeth.find(t => t.number === editingItem.toothNumber) : selectedTooth)?.name }}
                    </div>
                  </div>
                </div>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label class="block text-xs font-medium text-blue-700 mb-1.5">修复类型</label>
                  <select
                    v-model="workItemForm.restorationType"
                    class="w-full px-3 py-2 text-sm bg-white border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option
                      v-for="rt in availableRestorationTypes"
                      :key="rt"
                      :value="rt"
                    >
                      {{ allRestorationLabels[rt] }}
                    </option>
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-medium text-blue-700 mb-1.5">材料</label>
                  <select
                    v-model="workItemForm.material"
                    class="w-full px-3 py-2 text-sm bg-white border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option
                      v-for="(label, key) in MaterialTypeLabels"
                      :key="key"
                      :value="key"
                    >
                      {{ label }}
                    </option>
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-medium text-blue-700 mb-1.5">比色号</label>
                  <select
                    v-model="workItemForm.shade"
                    class="w-full px-3 py-2 text-sm bg-white border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option v-for="s in ShadeGuides" :key="s" :value="s">{{ s }}</option>
                  </select>
                </div>
              </div>
              <div>
                <label class="block text-xs font-medium text-blue-700 mb-1.5">牙位备注</label>
                <textarea
                  v-model="workItemForm.notes"
                  rows="1"
                  placeholder="例如：邻牙接触区略紧、基台就位等"
                  class="w-full px-3 py-2 text-sm bg-white border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                ></textarea>
              </div>
              <div class="flex justify-end gap-2">
                <button
                  type="button"
                  class="px-3 py-1.5 text-sm text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
                  @click="cancelWorkItemEdit"
                >
                  取消
                </button>
                <button
                  v-if="editingItem"
                  type="button"
                  class="px-4 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                  @click="updateWorkItem"
                >
                  保存修改
                </button>
                <button
                  v-else
                  type="button"
                  class="px-4 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                  @click="addWorkItem"
                >
                  添加此牙位
                </button>
              </div>
            </div>

            <div
              v-if="!isFullArch && workItems.length > 0"
              class="pt-4 border-t border-slate-200"
            >
              <div class="flex items-center justify-between mb-3">
                <div class="text-sm font-semibold text-slate-700">
                  已配置修复体（{{ workItems.length }}件）
                </div>
              </div>
              <div class="space-y-2">
                <div
                  v-for="item in workItems"
                  :key="item.toothNumber"
                  class="flex items-center justify-between py-2.5 px-4 bg-slate-50 rounded-lg border border-slate-100"
                >
                  <div class="flex items-center gap-3 min-w-0">
                    <span
                      class="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100 text-blue-700 font-bold text-sm flex-shrink-0"
                    >
                      {{ item.toothNumber }}
                    </span>
                    <div class="min-w-0">
                      <div class="font-medium text-slate-800 text-sm">
                        {{ RestorationTypeLabels[item.restorationType] }}
                        <span class="text-slate-400 mx-1">·</span>
                        {{ MaterialTypeLabels[item.material] }}
                        <span class="text-slate-400 mx-1">·</span>
                        <span class="font-mono text-xs">{{ item.shade }}</span>
                      </div>
                      <div v-if="item.notes" class="text-xs text-slate-500 mt-0.5 truncate">
                        {{ item.notes }}
                      </div>
                    </div>
                  </div>
                  <div class="flex items-center gap-1 flex-shrink-0">
                    <button
                      type="button"
                      class="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                      title="编辑"
                      @click="handleToothSelect(PermanentTeeth.find(t => t.number === item.toothNumber)!)"
                    >
                      <CheckCircle2 class="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      class="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                      title="删除"
                      @click="removeWorkItem(item.toothNumber)"
                    >
                      <Trash2 class="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          v-if="(form.priority === 'urgent' || form.priority === 'stat') && !form.specialInstructions.trim()"
          class="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2"
        >
          <AlertCircle class="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div class="text-sm">
            <div class="font-medium text-amber-800 mb-0.5">加急/特急单提醒</div>
            <div class="text-amber-700">
              请在下方"特殊说明"中填写加急原因，以便生产调度
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div
            class="px-5 py-4 border-b border-slate-100 flex items-center gap-2"
          >
            <div
              class="w-8 h-8 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center"
            >
              <FileText class="w-4 h-4 text-amber-600" />
            </div>
            <h2 class="text-base font-semibold text-slate-800">
              特殊说明
            </h2>
          </div>
          <div class="p-5">
            <textarea
              v-model="form.specialInstructions"
              rows="3"
              placeholder="例如：患者对美观要求较高、加急单请优先处理、咬合关系特殊注意等"
              class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              :class="{ 'border-rose-300 ring-1 ring-rose-200': errors.specialInstructions }"
            ></textarea>
          </div>
        </div>
      </div>

      <div class="space-y-6">
        <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div
            class="px-5 py-4 border-b border-slate-100 flex items-center gap-2"
          >
            <div
              class="w-8 h-8 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center"
            >
              <ClipboardList class="w-4 h-4 text-teal-600" />
            </div>
            <h2 class="text-base font-semibold text-slate-800">
              取模与交付
            </h2>
          </div>
          <div class="p-5 space-y-4">
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1.5">
                取模方式
              </label>
              <select
                v-model="form.impressionMethod"
                class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option
                  v-for="(label, key) in ImpressionMethodLabels"
                  :key="key"
                  :value="key"
                >
                  {{ label }}
                </option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1.5">
                交付日期 <span class="text-rose-500">*</span>
              </label>
              <div class="relative">
                <Calendar
                  class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
                />
                <input
                  v-model="form.deliveryDate"
                  type="date"
                  :min="todayStr"
                  class="w-full pl-10 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  :class="{ 'border-rose-300 ring-1 ring-rose-200': errors.deliveryDate }"
                />
              </div>
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1.5">
                优先级
              </label>
              <div class="grid grid-cols-3 gap-2">
                <label
                  v-for="(label, key) in PriorityLabels"
                  :key="key"
                  class="flex flex-col items-center justify-center gap-1 px-2 py-2.5 text-sm border rounded-lg cursor-pointer transition-colors"
                  :class="[
                    form.priority === key
                      ? key === 'standard'
                        ? 'bg-slate-50 border-slate-300 text-slate-800 ring-2 ring-slate-200'
                        : key === 'urgent'
                        ? 'bg-amber-50 border-amber-300 text-amber-800 ring-2 ring-amber-200'
                        : 'bg-rose-50 border-rose-300 text-rose-800 ring-2 ring-rose-200'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50',
                  ]"
                >
                  <input
                    type="radio"
                    class="hidden"
                    :value="key"
                    v-model="form.priority"
                  />
                  <span
                    class="text-xs font-bold"
                    :class="[
                      key === 'urgent' ? 'text-amber-600' : key === 'stat' ? 'text-rose-600' : 'text-slate-600',
                    ]"
                  >
                    {{ label }}
                  </span>
                  <span class="text-[10px] text-slate-500">
                    {{ key === 'standard' ? '7-10天' : key === 'urgent' ? '3-5天' : '1-2天' }}
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div
            class="px-5 py-4 border-b border-slate-100 flex items-center gap-2"
          >
            <div
              class="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center"
            >
              <BadgeDollarSign class="w-4 h-4 text-emerald-600" />
            </div>
            <h2 class="text-base font-semibold text-slate-800">
              费用信息
            </h2>
          </div>
          <div class="p-5">
            <label class="block text-xs font-medium text-slate-600 mb-1.5">
              订单总金额（元）
            </label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">
                ¥
              </span>
              <input
                v-model.number="form.totalAmount"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                class="w-full pl-8 pr-3 py-2.5 text-lg font-semibold text-slate-800 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div class="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
              <div class="grid grid-cols-2 gap-2 text-xs">
                <div class="text-slate-500">修复体数量</div>
                <div class="text-right font-medium text-slate-700">
                  {{ isFullArch ? '全口' : workItems.length + ' 件' }}
                </div>
                <div class="text-slate-500">优先级</div>
                <div
                  class="text-right font-medium"
                  :class="form.priority === 'standard' ? 'text-slate-700' : form.priority === 'urgent' ? 'text-amber-700' : 'text-rose-700'"
                >
                  {{ PriorityLabels[form.priority] }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="sticky bottom-4">
          <div class="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-xl p-5 text-white">
            <div class="text-xs text-blue-100 mb-1">提交预览</div>
            <div class="font-mono font-bold text-lg mb-3">
              {{ form.orderNumber }}
            </div>
            <div class="space-y-1.5 text-sm text-blue-50">
              <div class="flex justify-between">
                <span>诊所</span>
                <span class="font-medium text-white">
                  {{ clinics.find(c => c.id === form.clinicId)?.name || '—' }}
                </span>
              </div>
              <div class="flex justify-between">
                <span>患者</span>
                <span class="font-medium text-white font-mono text-xs">
                  {{ form.patientAnonymousCode || '—' }}
                </span>
              </div>
              <div class="flex justify-between">
                <span>交付</span>
                <span class="font-medium text-white">
                  {{ form.deliveryDate || '—' }}
                </span>
              </div>
              <div class="flex justify-between">
                <span>修复体</span>
                <span class="font-medium text-white">
                  {{ isFullArch ? '全口修复' : workItems.length + ' 件' }}
                </span>
              </div>
              <div
                v-if="form.totalAmount"
                class="flex justify-between pt-1.5 mt-1.5 border-t border-blue-500/30"
              >
                <span>金额</span>
                <span class="font-bold text-lg text-white">
                  ¥{{ form.totalAmount.toLocaleString() }}
                </span>
              </div>
            </div>
            <button
              type="button"
              class="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-blue-700 bg-white rounded-lg hover:bg-blue-50 transition-colors shadow-sm"
              @click="handleSubmit"
            >
              <Save class="w-4 h-4" />
              {{ submitButtonText }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
