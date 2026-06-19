<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  AlertCircle,
  Building2,
  Phone,
  MapPin,
  Users,
  Handshake,
  BadgeDollarSign,
  Calendar,
  FileText,
  Sparkles,
  Star,
  StarOff,
  UserPlus,
  X,
} from 'lucide-vue-next'
import { useClinics } from '../composables/useClinics'
import type {
  CooperationStatus,
  SettlementMethod,
  Doctor,
  Clinic,
} from '../types'
import {
  CooperationStatusLabels,
  CooperationStatusColors,
  SettlementMethodLabels,
} from '../types'
import { cn } from '../lib/utils'

const route = useRoute()
const router = useRouter()
const {
  getClinicById,
  createClinic,
  updateClinic,
  generateClinicCode,
} = useClinics()

type FormMode = 'create' | 'edit'
const mode = ref<FormMode>('create')
const editingClinicId = ref<string | null>(null)

const form = reactive({
  name: '',
  clinicCode: '',
  contactPerson: '',
  phone: '',
  address: '',
  cooperationStatus: 'active' as CooperationStatus,
  settlementMethod: 'monthly' as SettlementMethod,
  paymentTermDays: 30,
  remarks: '',
})

const doctors = ref<Doctor[]>([])

const doctorForm = reactive({
  name: '',
  title: '',
  phone: '',
  specialty: '',
  isPrimary: false,
})

const showDoctorDialog = ref(false)
const editingDoctorIdx = ref<number | null>(null)

const errors = reactive<Record<string, string>>({})
const submitAttempted = ref(false)

const pageTitle = computed(() => (mode.value === 'edit' ? '编辑诊所' : '新增诊所'))
const submitButtonText = computed(() => (mode.value === 'edit' ? '保存修改' : '创建诊所'))

const primaryDoctor = computed(() => doctors.value.find((d) => d.isPrimary))

function resetDoctorForm() {
  doctorForm.name = ''
  doctorForm.title = ''
  doctorForm.phone = ''
  doctorForm.specialty = ''
  doctorForm.isPrimary = false
  editingDoctorIdx.value = null
}

function openAddDoctor() {
  resetDoctorForm()
  showDoctorDialog.value = true
}

function openEditDoctor(idx: number) {
  const doc = doctors.value[idx]
  doctorForm.name = doc.name
  doctorForm.title = doc.title || ''
  doctorForm.phone = doc.phone || ''
  doctorForm.specialty = doc.specialty || ''
  doctorForm.isPrimary = doc.isPrimary || false
  editingDoctorIdx.value = idx
  showDoctorDialog.value = true
}

function confirmDoctor() {
  if (!doctorForm.name.trim()) {
    return
  }

  if (doctorForm.isPrimary) {
    doctors.value.forEach((d) => (d.isPrimary = false))
  }

  const doctorData: Doctor = {
    id: editingDoctorIdx.value !== null ? doctors.value[editingDoctorIdx.value].id : `D${Date.now()}`,
    name: doctorForm.name.trim(),
    title: doctorForm.title.trim() || undefined,
    phone: doctorForm.phone.trim() || undefined,
    specialty: doctorForm.specialty.trim() || undefined,
    isPrimary: doctorForm.isPrimary || (doctors.value.length === 0 && editingDoctorIdx.value === null),
  }

  if (editingDoctorIdx.value !== null) {
    doctors.value[editingDoctorIdx.value] = doctorData
  } else {
    if (!doctorData.isPrimary && doctors.value.length === 0) {
      doctorData.isPrimary = true
    }
    doctors.value.push(doctorData)
  }

  showDoctorDialog.value = false
  resetDoctorForm()
}

function removeDoctor(idx: number) {
  const wasPrimary = doctors.value[idx].isPrimary
  doctors.value.splice(idx, 1)
  if (wasPrimary && doctors.value.length > 0) {
    doctors.value[0].isPrimary = true
  }
}

function setPrimaryDoctor(idx: number) {
  doctors.value.forEach((d, i) => (d.isPrimary = i === idx))
}

function regenerateCode() {
  form.clinicCode = generateClinicCode(form.name || '诊所')
}

function validate(): boolean {
  Object.keys(errors).forEach((k) => delete errors[k])
  submitAttempted.value = true

  if (!form.name.trim()) errors.name = '请输入诊所名称'
  if (!form.clinicCode.trim()) errors.clinicCode = '请输入诊所编码'
  if (!form.contactPerson.trim()) errors.contactPerson = '请输入联系人姓名'
  if (!form.phone.trim()) errors.phone = '请输入联系电话'
  if (!form.address.trim()) errors.address = '请输入诊所地址'
  if (form.paymentTermDays < 0) errors.paymentTermDays = '账期天数不能为负数'

  return Object.keys(errors).length === 0
}

function handleSubmit() {
  if (!validate()) return

  const finalDoctors = [...doctors.value]
  if (finalDoctors.length > 0 && !finalDoctors.find((d) => d.isPrimary)) {
    finalDoctors[0].isPrimary = true
  }
  if (form.contactPerson && !finalDoctors.find((d) => d.name === form.contactPerson)) {
    finalDoctors.unshift({
      id: `D${Date.now()}C`,
      name: form.contactPerson,
      phone: form.phone,
      isPrimary: finalDoctors.length === 0,
    })
  }

  const params = {
    name: form.name.trim(),
    clinicCode: form.clinicCode.trim(),
    contactPerson: form.contactPerson.trim(),
    phone: form.phone.trim(),
    address: form.address.trim(),
    cooperationStatus: form.cooperationStatus,
    settlementMethod: form.settlementMethod,
    paymentTermDays: form.paymentTermDays,
    doctors: finalDoctors,
    remarks: form.remarks.trim() || undefined,
  }

  let savedClinic: Clinic | undefined

  if (mode.value === 'edit' && editingClinicId.value) {
    savedClinic = updateClinic(editingClinicId.value, params)
  } else {
    savedClinic = createClinic(params)
  }

  if (savedClinic) {
    router.push(`/clinic/${savedClinic.id}`)
  }
}

function goBack() {
  if (mode.value === 'edit' && editingClinicId.value) {
    router.push(`/clinic/${editingClinicId.value}`)
  } else {
    router.push('/clinics')
  }
}

function loadClinicForEdit(id: string) {
  const clinic = getClinicById(id)
  if (!clinic) {
    router.push('/clinics')
    return
  }
  editingClinicId.value = id

  form.name = clinic.name
  form.clinicCode = clinic.clinicCode
  form.contactPerson = clinic.contactPerson
  form.phone = clinic.phone
  form.address = clinic.address
  form.cooperationStatus = clinic.cooperationStatus
  form.settlementMethod = clinic.settlementMethod
  form.paymentTermDays = clinic.paymentTermDays
  form.remarks = clinic.remarks || ''
  doctors.value = clinic.doctors.map((d) => ({ ...d }))
}

onMounted(() => {
  const id = route.params.id as string

  if (id) {
    mode.value = 'edit'
    loadClinicForEdit(id)
  } else {
    mode.value = 'create'
    form.clinicCode = generateClinicCode('新诊所')
  }
})
</script>

<template>
  <div class="min-h-full pb-12">
    <div class="mb-6">
      <button
        class="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 mb-4 transition-colors"
        @click="goBack"
      >
        <ArrowLeft class="w-4 h-4" />
        {{ mode === 'edit' ? '返回诊所详情' : '返回诊所列表' }}
      </button>

      <div class="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
        <div>
          <div class="flex flex-wrap items-center gap-3 mb-2">
            <h1 class="text-2xl font-bold text-slate-900 tracking-tight">
              {{ pageTitle }}
            </h1>
          </div>
          <p class="text-sm text-slate-500">
            {{ mode === 'edit' ? '更新诊所的基础信息、合作状态和医生档案' : '录入新合作诊所的基础信息、合作条款及常用医生' }}
          </p>
        </div>

        <div class="flex items-center gap-2">
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
          <div class="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-sky-50 border border-sky-100 flex items-center justify-center">
              <Building2 class="w-4 h-4 text-sky-600" />
            </div>
            <h2 class="text-base font-semibold text-slate-800">
              诊所基础信息
            </h2>
          </div>
          <div class="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
            <div class="md:col-span-2">
              <label class="block text-xs font-medium text-slate-600 mb-1.5">
                诊所名称 <span class="text-rose-500">*</span>
              </label>
              <input
                v-model="form.name"
                type="text"
                placeholder="例如：明德口腔医院"
                class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                :class="{ 'border-rose-300 ring-1 ring-rose-200': errors.name }"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1.5">
                诊所编码 <span class="text-rose-500">*</span>
              </label>
              <div class="flex gap-2">
                <input
                  v-model="form.clinicCode"
                  type="text"
                  placeholder="例如：MDE-001"
                  class="flex-1 px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  :class="{ 'border-rose-300 ring-1 ring-rose-200': errors.clinicCode }"
                />
                <button
                  v-if="mode === 'create'"
                  type="button"
                  class="inline-flex items-center gap-1 px-3 py-2 text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
                  @click="regenerateCode"
                >
                  <Sparkles class="w-4 h-4" />
                  生成
                </button>
              </div>
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1.5">
                联系人 <span class="text-rose-500">*</span>
              </label>
              <div class="relative">
                <Users class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  v-model="form.contactPerson"
                  type="text"
                  placeholder="例如：李明华"
                  class="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  :class="{ 'border-rose-300 ring-1 ring-rose-200': errors.contactPerson }"
                />
              </div>
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1.5">
                联系电话 <span class="text-rose-500">*</span>
              </label>
              <div class="relative">
                <Phone class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  v-model="form.phone"
                  type="tel"
                  placeholder="例如：010-8888-0001"
                  class="w-full pl-9 pr-3 py-2 text-sm font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  :class="{ 'border-rose-300 ring-1 ring-rose-200': errors.phone }"
                />
              </div>
            </div>
            <div class="md:col-span-2">
              <label class="block text-xs font-medium text-slate-600 mb-1.5">
                详细地址 <span class="text-rose-500">*</span>
              </label>
              <div class="relative">
                <MapPin class="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <textarea
                  v-model="form.address"
                  rows="2"
                  placeholder="请输入诊所详细地址"
                  class="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  :class="{ 'border-rose-300 ring-1 ring-rose-200': errors.address }"
                ></textarea>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div class="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-violet-50 border border-violet-100 flex items-center justify-center">
              <Handshake class="w-4 h-4 text-violet-600" />
            </div>
            <h2 class="text-base font-semibold text-slate-800">
              合作条款
            </h2>
          </div>
          <div class="p-5 grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1.5">
                合作状态
              </label>
              <select
                v-model="form.cooperationStatus"
                class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option
                  v-for="(label, key) in CooperationStatusLabels"
                  :key="key"
                  :value="key"
                >
                  {{ label }}
                </option>
              </select>
              <div class="mt-2">
                <span
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border"
                  :class="CooperationStatusColors[form.cooperationStatus]"
                >
                  <span class="w-1.5 h-1.5 rounded-full" :class="{
                    'bg-emerald-500': form.cooperationStatus === 'active',
                    'bg-slate-500': form.cooperationStatus === 'inactive',
                    'bg-amber-500': form.cooperationStatus === 'pending',
                    'bg-rose-500': form.cooperationStatus === 'suspended',
                  }"></span>
                  {{ CooperationStatusLabels[form.cooperationStatus] }}
                </span>
              </div>
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1.5">
                结算方式
              </label>
              <div class="relative">
                <BadgeDollarSign class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select
                  v-model="form.settlementMethod"
                  class="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option
                    v-for="(label, key) in SettlementMethodLabels"
                    :key="key"
                    :value="key"
                  >
                    {{ label }}
                  </option>
                </select>
              </div>
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1.5">
                账期（天）
              </label>
              <div class="relative">
                <Calendar class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  v-model.number="form.paymentTermDays"
                  type="number"
                  min="0"
                  placeholder="0"
                  class="w-full pl-9 pr-8 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  :class="{ 'border-rose-300 ring-1 ring-rose-200': errors.paymentTermDays }"
                />
                <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                  天
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div class="px-5 py-4 border-b border-slate-100 flex items-start justify-between gap-3 flex-wrap">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                <Users class="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <h2 class="text-base font-semibold text-slate-800">
                  常用医生
                </h2>
                <p class="text-xs text-slate-500 mt-0.5">
                  维护该诊所的合作医生档案，设为主联系人的医生将作为默认选项
                </p>
              </div>
            </div>
            <button
              type="button"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md hover:bg-emerald-100 transition-colors"
              @click="openAddDoctor"
            >
              <UserPlus class="w-3.5 h-3.5" />
              添加医生
            </button>
          </div>
          <div class="p-5">
            <div
              v-if="doctors.length === 0"
              class="py-10 text-center border-2 border-dashed border-slate-200 rounded-xl"
            >
              <div class="flex flex-col items-center gap-2">
                <div class="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                  <Users class="w-6 h-6 text-slate-400" />
                </div>
                <div class="text-sm font-medium text-slate-600">暂无医生档案</div>
                <div class="text-xs text-slate-400">点击右上角「添加医生」创建医生档案</div>
              </div>
            </div>

            <div v-else class="space-y-3">
              <div
                v-for="(doc, idx) in doctors"
                :key="doc.id"
                class="flex items-start justify-between gap-3 p-4 rounded-xl border transition-all"
                :class="doc.isPrimary ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-100 hover:bg-slate-100'"
              >
                <div class="flex items-start gap-3 flex-1 min-w-0">
                  <div
                    class="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                    :class="doc.isPrimary
                      ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-sm'
                      : 'bg-white border border-slate-200 text-slate-700'"
                  >
                    {{ doc.name.charAt(0) }}
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 flex-wrap">
                      <span class="font-semibold text-slate-900">{{ doc.name }}</span>
                      <span
                        v-if="doc.title"
                        class="text-xs px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-600"
                      >
                        {{ doc.title }}
                      </span>
                      <span
                        v-if="doc.isPrimary"
                        class="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-600 text-white"
                      >
                        <Star class="w-3 h-3 fill-current" />
                        主联系人
                      </span>
                    </div>
                    <div class="flex items-center gap-4 mt-1.5 text-xs text-slate-500 flex-wrap">
                      <span v-if="doc.specialty" class="inline-flex items-center gap-1">
                        <span class="text-slate-400">专长：</span>
                        {{ doc.specialty }}
                      </span>
                      <span v-if="doc.phone" class="inline-flex items-center gap-1 font-mono">
                        <Phone class="w-3 h-3" />
                        {{ doc.phone }}
                      </span>
                    </div>
                  </div>
                </div>
                <div class="flex items-center gap-1 flex-shrink-0">
                  <button
                    v-if="!doc.isPrimary"
                    type="button"
                    class="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-100 rounded-md transition-colors"
                    title="设为主联系人"
                    @click="setPrimaryDoctor(idx)"
                  >
                    <StarOff class="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    class="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors"
                    title="编辑"
                    @click="openEditDoctor(idx)"
                  >
                    <Plus class="w-4 h-4 rotate-45" />
                  </button>
                  <button
                    type="button"
                    class="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                    title="删除"
                    @click="removeDoctor(idx)"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="space-y-6">
        <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div class="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center">
              <FileText class="w-4 h-4 text-amber-600" />
            </div>
            <h2 class="text-base font-semibold text-slate-800">
              备注说明
            </h2>
          </div>
          <div class="p-5">
            <textarea
              v-model="form.remarks"
              rows="6"
              placeholder="记录合作注意事项、特殊要求、历史问题等信息..."
              class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            ></textarea>
          </div>
        </div>

        <div class="bg-gradient-to-br from-slate-50 to-white rounded-xl border border-slate-200 p-5">
          <div class="text-xs font-semibold text-slate-700 mb-3">表单信息预览</div>
          <div class="space-y-3 text-xs">
            <div class="flex items-start justify-between gap-3 py-2 border-b border-slate-100">
              <span class="text-slate-500">医生档案数</span>
              <span class="font-semibold text-slate-800">{{ doctors.length }} 位</span>
            </div>
            <div class="flex items-start justify-between gap-3 py-2 border-b border-slate-100">
              <span class="text-slate-500">主联系人医生</span>
              <span class="font-semibold text-slate-800 truncate">
                {{ primaryDoctor?.name || contactPerson || '—' }}
              </span>
            </div>
            <div class="flex items-start justify-between gap-3 py-2 border-b border-slate-100">
              <span class="text-slate-500">结算周期</span>
              <span class="font-semibold text-slate-800">
                {{ SettlementMethodLabels[form.settlementMethod] }} · {{ form.paymentTermDays }}天
              </span>
            </div>
            <div class="flex items-start justify-between gap-3 py-2">
              <span class="text-slate-500">当前合作状态</span>
              <span
                class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border"
                :class="CooperationStatusColors[form.cooperationStatus]"
              >
                {{ CooperationStatusLabels[form.cooperationStatus] }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="showDoctorDialog"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      @click.self="showDoctorDialog = false; resetDoctorForm()"
    >
      <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
        <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 class="text-base font-semibold text-slate-900">
            {{ editingDoctorIdx !== null ? '编辑医生' : '添加医生' }}
          </h3>
          <button
            type="button"
            class="p-1.5 text-slate-500 hover:bg-slate-100 rounded-md transition-colors"
            @click="showDoctorDialog = false; resetDoctorForm()"
          >
            <X class="w-4 h-4" />
          </button>
        </div>
        <div class="p-6 space-y-4">
          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1.5">
              医生姓名 <span class="text-rose-500">*</span>
            </label>
            <input
              v-model="doctorForm.name"
              type="text"
              placeholder="请输入医生姓名"
              class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1.5">职称</label>
              <input
                v-model="doctorForm.title"
                type="text"
                placeholder="如：主任医师"
                class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1.5">联系电话</label>
              <input
                v-model="doctorForm.phone"
                type="tel"
                placeholder="手机号/座机"
                class="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1.5">专业领域</label>
            <input
              v-model="doctorForm.specialty"
              type="text"
              placeholder="如：口腔修复、口腔种植"
              class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <label class="flex items-center gap-2 p-3 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
            <input
              type="checkbox"
              class="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              v-model="doctorForm.isPrimary"
            />
            <div class="flex-1">
              <div class="text-sm font-medium text-slate-800">设为该诊所主联系人</div>
              <div class="text-xs text-slate-500">主联系人将在创建订单时作为默认医生选项</div>
            </div>
            <Star
              v-if="doctorForm.isPrimary"
              class="w-4 h-4 text-amber-500 fill-current"
            />
            <StarOff v-else class="w-4 h-4 text-slate-400" />
          </label>
        </div>
        <div class="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            type="button"
            class="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            @click="showDoctorDialog = false; resetDoctorForm()"
          >
            取消
          </button>
          <button
            type="button"
            class="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="!doctorForm.name.trim()"
            @click="confirmDoctor"
          >
            {{ editingDoctorIdx !== null ? '保存修改' : '确认添加' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
