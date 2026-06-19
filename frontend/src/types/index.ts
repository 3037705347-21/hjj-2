export type ToothQuadrant = 'upper-left' | 'upper-right' | 'lower-left' | 'lower-right'

export interface Tooth {
  number: string
  name: string
  quadrant: ToothQuadrant
  isPrimary: boolean
}

export type RestorationType =
  | 'crown'
  | 'bridge'
  | 'veneer'
  | 'inlay'
  | 'onlay'
  | 'implant-crown'
  | 'partial-denture'
  | 'full-denture'
  | 'orthodontic-appliance'

export const RestorationTypeLabels: Record<RestorationType, string> = {
  'crown': '单冠',
  'bridge': '固定桥',
  'veneer': '贴面',
  'inlay': '嵌体',
  'onlay': '高嵌体',
  'implant-crown': '种植冠',
  'partial-denture': '活动义齿',
  'full-denture': '全口义齿',
  'orthodontic-appliance': '正畸矫治器',
}

export type MaterialType =
  | 'zirconia'
  | 'emax'
  | 'pfm'
  | 'full-metal'
  | 'composite'
  | 'acrylic'
  | 'peek'
  | 'titanium'

export const MaterialTypeLabels: Record<MaterialType, string> = {
  'zirconia': '氧化锆',
  'emax': 'E.MAX铸瓷',
  'pfm': '烤瓷熔附金属',
  'full-metal': '全金属',
  'composite': '复合树脂',
  'acrylic': '亚克力',
  'peek': 'PEEK高分子',
  'titanium': '纯钛',
}

export type ShadeGuide =
  | 'A1' | 'A2' | 'A3' | 'A3.5' | 'A4'
  | 'B1' | 'B2' | 'B3' | 'B4'
  | 'C1' | 'C2' | 'C3' | 'C4'
  | 'D2' | 'D3' | 'D4'

export type ImpressionMethod =
  | 'digital-scan'
  | 'traditional-alginate'
  | 'traditional-silicone'
  | 'dual-arch-tray'

export const ImpressionMethodLabels: Record<ImpressionMethod, string> = {
  'digital-scan': '数字化扫描',
  'traditional-alginate': '藻酸盐取模',
  'traditional-silicone': '硅橡胶取模',
  'dual-arch-tray': '双颌托盘取模',
}

export type ProcessingStage =
  | 'received'
  | 'model-scanning'
  | 'wax-up'
  | 'casting'
  | 'porcelain'
  | 'glazing'
  | 'finishing'
  | 'quality-check'
  | 'shipped'
  | 'delivered'

export interface StageInfo {
  stage: ProcessingStage
  label: string
  description: string
  estimatedDurationDays: number
}

export const ProcessingStages: StageInfo[] = [
  { stage: 'received', label: '订单接收', description: '订单已收到，正在审核', estimatedDurationDays: 0 },
  { stage: 'model-scanning', label: '模型扫描', description: '扫描石膏模型或处理数字印模', estimatedDurationDays: 1 },
  { stage: 'wax-up', label: '蜡型制作', description: '制作蜡型、设计修复体形态', estimatedDurationDays: 1 },
  { stage: 'casting', label: '铸造/切削', description: '金属铸造或氧化锆/瓷块切削', estimatedDurationDays: 1 },
  { stage: 'porcelain', label: '烤瓷堆瓷', description: '烤瓷牙体外形构建与上色', estimatedDurationDays: 2 },
  { stage: 'glazing', label: '上釉烧结', description: '修复体上釉与最终烧结', estimatedDurationDays: 1 },
  { stage: 'finishing', label: '精磨修整', description: '精细打磨、咬合调整、抛光', estimatedDurationDays: 1 },
  { stage: 'quality-check', label: '质检审核', description: '质量检查、咬合验证、颜色确认', estimatedDurationDays: 0 },
  { stage: 'shipped', label: '已发货', description: '修复体已寄出', estimatedDurationDays: 1 },
  { stage: 'delivered', label: '已送达', description: '诊所已签收', estimatedDurationDays: 0 },
]

export interface StageHistoryEntry {
  stage: ProcessingStage
  startedAt: string
  completedAt?: string
  technician?: string
  notes?: string
  errorReason?: string
}

export type OrderPriority = 'standard' | 'urgent' | 'stat'

export const PriorityLabels: Record<OrderPriority, string> = {
  'standard': '常规',
  'urgent': '加急',
  'stat': '特急',
}

export type OrderStatus = 'pending' | 'in-progress' | 'completed' | 'on-hold' | 'returned'

export const OrderStatusLabels: Record<OrderStatus, string> = {
  'pending': '待开始',
  'in-progress': '加工中',
  'completed': '已完成',
  'on-hold': '已暂停',
  'returned': '已返工',
}

export type ReworkStatus =
  | 'initiated'
  | 'accepted'
  | 'rectifying'
  | 'rechecking'
  | 'closed'

export const ReworkStatusLabels: Record<ReworkStatus, string> = {
  'initiated': '待受理',
  'accepted': '已受理',
  'rectifying': '整改中',
  'rechecking': '复检中',
  'closed': '已关闭',
}

export const ReworkStatusColors: Record<ReworkStatus, string> = {
  'initiated': 'bg-amber-50 text-amber-700 border-amber-200',
  'accepted': 'bg-blue-50 text-blue-700 border-blue-200',
  'rectifying': 'bg-orange-50 text-orange-700 border-orange-200',
  'rechecking': 'bg-violet-50 text-violet-700 border-violet-200',
  'closed': 'bg-emerald-50 text-emerald-700 border-emerald-200',
}

export type ReworkSourceStage =
  | 'model-scanning'
  | 'wax-up'
  | 'casting'
  | 'porcelain'
  | 'glazing'
  | 'finishing'
  | 'quality-check'
  | 'clinic-return'

export const ReworkSourceStageLabels: Record<ReworkSourceStage, string> = {
  'model-scanning': '模型扫描',
  'wax-up': '蜡型制作',
  'casting': '铸造/切削',
  'porcelain': '烤瓷堆瓷',
  'glazing': '上釉烧结',
  'finishing': '精磨修整',
  'quality-check': '质检审核',
  'clinic-return': '诊所退回',
}

export type ReworkProblemType =
  | 'edge-misfit'
  | 'color-mismatch'
  | 'occlusion-issue'
  | 'shape-error'
  | 'material-defect'
  | 'design-error'
  | 'other'

export const ReworkProblemTypeLabels: Record<ReworkProblemType, string> = {
  'edge-misfit': '边缘不密合',
  'color-mismatch': '颜色偏差',
  'occlusion-issue': '咬合问题',
  'shape-error': '形态错误',
  'material-defect': '材料缺陷',
  'design-error': '设计失误',
  'other': '其他问题',
}

export type ReworkRootCause =
  | 'technician-error'
  | 'material-issue'
  | 'equipment-problem'
  | 'design-flaw'
  | 'impression-quality'
  | 'clinic-requirement-change'
  | 'other'

export const ReworkRootCauseLabels: Record<ReworkRootCause, string> = {
  'technician-error': '技师操作失误',
  'material-issue': '材料质量问题',
  'equipment-problem': '设备故障',
  'design-flaw': '设计缺陷',
  'impression-quality': '印模/扫描质量差',
  'clinic-requirement-change': '诊所需求变更',
  'other': '其他原因',
}

export type ReworkResponsibility =
  | 'modeling-tech'
  | 'wax-tech'
  | 'casting-tech'
  | 'porcelain-tech'
  | 'glazing-tech'
  | 'finishing-tech'
  | 'qc-personnel'
  | 'design-department'
  | 'other'

export const ReworkResponsibilityLabels: Record<ReworkResponsibility, string> = {
  'modeling-tech': '扫描/模型技师',
  'wax-tech': '蜡型技师',
  'casting-tech': '铸造/切削技师',
  'porcelain-tech': '烤瓷技师',
  'glazing-tech': '上釉技师',
  'finishing-tech': '精磨技师',
  'qc-personnel': '质检人员',
  'design-department': '设计部门',
  'other': '其他',
}

export interface ReworkTimelineEntry {
  status: ReworkStatus
  timestamp: string
  operator: string
  note?: string
}

export interface ReworkStatusTransition {
  fromStatus: ReworkStatus | null
  toStatus: ReworkStatus
  timestamp: string
  operator: string
  note?: string
}

export interface ReturnRecord {
  id: string
  orderId: string
  returnedAt: string
  reason: string
  stageReturnedFrom: ProcessingStage
  correctiveAction: string
  responsibleTechnician?: string
  completedAt?: string
  status: ReworkStatus
  sourceStage: ReworkSourceStage
  problemType: ReworkProblemType
  rootCause: ReworkRootCause
  responsibility: ReworkResponsibility
  relatedTeeth: string[]
  chargeable: boolean
  chargeAmount?: number
  deadline: string
  acceptanceAt?: string
  rectificationStartAt?: string
  rectificationCompleteAt?: string
  recheckAt?: string
  closedAt?: string
  acceptedBy?: string
  rectifiedBy?: string
  recheckedBy?: string
  closedBy?: string
  recheckResult?: 'pass' | 'fail'
  recheckNote?: string
  closureNote?: string
  timeline: ReworkTimelineEntry[]
  statusHistory: ReworkStatusTransition[]
  stageBeforeRework: ProcessingStage
  statusBeforeRework: OrderStatus
}

export interface ToothWorkItem {
  toothNumber: string
  restorationType: RestorationType
  material: MaterialType
  shade: ShadeGuide
  notes?: string
}

export type CooperationStatus = 'active' | 'inactive' | 'pending' | 'suspended'

export const CooperationStatusLabels: Record<CooperationStatus, string> = {
  'active': '合作中',
  'inactive': '已终止',
  'pending': '待审核',
  'suspended': '已暂停',
}

export const CooperationStatusColors: Record<CooperationStatus, string> = {
  'active': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'inactive': 'bg-slate-50 text-slate-600 border-slate-200',
  'pending': 'bg-amber-50 text-amber-700 border-amber-200',
  'suspended': 'bg-rose-50 text-rose-700 border-rose-200',
}

export type SettlementMethod = 'monthly' | 'weekly' | 'per-order' | 'quarterly' | 'prepaid'

export const SettlementMethodLabels: Record<SettlementMethod, string> = {
  'monthly': '月结',
  'weekly': '周结',
  'per-order': '单次结算',
  'quarterly': '季结',
  'prepaid': '预充值',
}

export interface Doctor {
  id: string
  name: string
  title?: string
  phone?: string
  specialty?: string
  isPrimary?: boolean
}

export interface ClinicStats {
  totalOrders: number
  reworkRate: number
  totalAmount: number
}

export interface Clinic {
  id: string
  name: string
  clinicCode: string
  contactPerson: string
  phone: string
  address: string
  cooperationStatus: CooperationStatus
  settlementMethod: SettlementMethod
  paymentTermDays: number
  doctors: Doctor[]
  remarks?: string
  stats: ClinicStats
  createdAt: string
  updatedAt: string
}

export interface Patient {
  patientId: string
  anonymousCode: string
  gender?: 'male' | 'female'
  age?: number
}

export type AttachmentCategory =
  | 'intraoral-scan'
  | 'prescription-photo'
  | 'facial-photo'
  | 'design-draft'
  | 'logistics-receipt'

export const AttachmentCategoryLabels: Record<AttachmentCategory, string> = {
  'intraoral-scan': '口扫文件',
  'prescription-photo': '处方单照片',
  'facial-photo': '面像照片',
  'design-draft': '设计稿',
  'logistics-receipt': '物流回单',
}

export const AttachmentCategoryColors: Record<AttachmentCategory, string> = {
  'intraoral-scan': 'bg-cyan-50 text-cyan-700 border-cyan-200',
  'prescription-photo': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'facial-photo': 'bg-pink-50 text-pink-700 border-pink-200',
  'design-draft': 'bg-violet-50 text-violet-700 border-violet-200',
  'logistics-receipt': 'bg-amber-50 text-amber-700 border-amber-200',
}

export interface Attachment {
  id: string
  orderId: string
  category: AttachmentCategory
  fileName: string
  fileSize?: number
  fileType?: string
  uploadedBy: string
  uploadedAt: string
  url?: string
  thumbnailUrl?: string
  description?: string
}

export type CommunicationType =
  | 'clinic-message'
  | 'internal-note'
  | 'phone-summary'
  | 'rework-communication'
  | 'delivery-confirmation'
  | 'system-notice'

export const CommunicationTypeLabels: Record<CommunicationType, string> = {
  'clinic-message': '诊所留言',
  'internal-note': '内部备注',
  'phone-summary': '电话纪要',
  'rework-communication': '返工沟通',
  'delivery-confirmation': '交付确认',
  'system-notice': '系统通知',
}

export const CommunicationTypeColors: Record<CommunicationType, string> = {
  'clinic-message': 'bg-blue-50 text-blue-700 border-blue-200',
  'internal-note': 'bg-slate-50 text-slate-700 border-slate-200',
  'phone-summary': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'rework-communication': 'bg-rose-50 text-rose-700 border-rose-200',
  'delivery-confirmation': 'bg-teal-50 text-teal-700 border-teal-200',
  'system-notice': 'bg-amber-50 text-amber-700 border-amber-200',
}

export interface Communication {
  id: string
  orderId: string
  type: CommunicationType
  operator: string
  operatedAt: string
  content: string
  relatedStage?: ProcessingStage
  isSystemGenerated?: boolean
}

export interface Order {
  id: string
  orderNumber: string
  createdAt: string
  clinicId: string
  clinic: Clinic
  doctorName: string
  patient: Patient
  workItems: ToothWorkItem[]
  impressionMethod: ImpressionMethod
  deliveryDate: string
  priority: OrderPriority
  status: OrderStatus
  currentStage: ProcessingStage
  stageHistory: StageHistoryEntry[]
  returnRecords: ReturnRecord[]
  specialInstructions?: string
  totalAmount?: number
  attachments: Attachment[]
  communications: Communication[]
}

export interface DashboardStats {
  totalOrders: number
  inProgressCount: number
  urgentCount: number
  dueTodayCount: number
  overdueCount: number
  completedTodayCount: number
  returnedCount: number
  averageTurnaroundDays: number
}

export type TechnicianSkill =
  | 'model-scanning'
  | 'wax-up'
  | 'casting'
  | 'porcelain'
  | 'glazing'
  | 'finishing'
  | 'quality-check'
  | 'design'
  | 'implant'
  | 'orthodontics'

export const TechnicianSkillLabels: Record<TechnicianSkill, string> = {
  'model-scanning': '模型扫描',
  'wax-up': '蜡型制作',
  'casting': '铸造/切削',
  'porcelain': '烤瓷堆瓷',
  'glazing': '上釉烧结',
  'finishing': '精磨修整',
  'quality-check': '质检审核',
  'design': '数字化设计',
  'implant': '种植修复',
  'orthodontics': '正畸矫治',
}

export const TechnicianSkillColors: Record<TechnicianSkill, string> = {
  'model-scanning': 'bg-cyan-50 text-cyan-700 border-cyan-200',
  'wax-up': 'bg-amber-50 text-amber-700 border-amber-200',
  'casting': 'bg-orange-50 text-orange-700 border-orange-200',
  'porcelain': 'bg-rose-50 text-rose-700 border-rose-200',
  'glazing': 'bg-pink-50 text-pink-700 border-pink-200',
  'finishing': 'bg-teal-50 text-teal-700 border-teal-200',
  'quality-check': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'design': 'bg-violet-50 text-violet-700 border-violet-200',
  'implant': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'orthodontics': 'bg-sky-50 text-sky-700 border-sky-200',
}

export type TechnicianStatus = 'on-duty' | 'off-duty' | 'leave' | 'busy'

export const TechnicianStatusLabels: Record<TechnicianStatus, string> = {
  'on-duty': '在岗',
  'off-duty': '下班',
  'leave': '请假',
  'busy': '繁忙',
}

export const TechnicianStatusColors: Record<TechnicianStatus, string> = {
  'on-duty': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'off-duty': 'bg-slate-50 text-slate-600 border-slate-200',
  'leave': 'bg-amber-50 text-amber-700 border-amber-200',
  'busy': 'bg-rose-50 text-rose-700 border-rose-200',
}

export type TaskStatus =
  | 'pending'
  | 'assigned'
  | 'accepted'
  | 'in-progress'
  | 'paused'
  | 'completed'
  | 'transferred'
  | 'exception'

export const TaskStatusLabels: Record<TaskStatus, string> = {
  'pending': '待分配',
  'assigned': '已分配',
  'accepted': '已接单',
  'in-progress': '处理中',
  'paused': '已暂停',
  'completed': '已完成',
  'transferred': '已转派',
  'exception': '异常',
}

export const TaskStatusColors: Record<TaskStatus, string> = {
  'pending': 'bg-slate-50 text-slate-600 border-slate-200',
  'assigned': 'bg-blue-50 text-blue-700 border-blue-200',
  'accepted': 'bg-cyan-50 text-cyan-700 border-cyan-200',
  'in-progress': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'paused': 'bg-amber-50 text-amber-700 border-amber-200',
  'completed': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'transferred': 'bg-violet-50 text-violet-700 border-violet-200',
  'exception': 'bg-rose-50 text-rose-700 border-rose-200',
}

export type TaskPriority = 'low' | 'normal' | 'high' | 'urgent'

export const TaskPriorityLabels: Record<TaskPriority, string> = {
  'low': '低',
  'normal': '普通',
  'high': '高',
  'urgent': '紧急',
}

export const TaskPriorityColors: Record<TaskPriority, string> = {
  'low': 'bg-slate-50 text-slate-600 border-slate-200',
  'normal': 'bg-blue-50 text-blue-700 border-blue-200',
  'high': 'bg-orange-50 text-orange-700 border-orange-200',
  'urgent': 'bg-rose-50 text-rose-700 border-rose-200',
}

export type ExceptionType =
  | 'material-shortage'
  | 'equipment-failure'
  | 'skill-gap'
  | 'quality-issue'
  | 'other'

export const ExceptionTypeLabels: Record<ExceptionType, string> = {
  'material-shortage': '材料不足',
  'equipment-failure': '设备故障',
  'skill-gap': '技能不足',
  'quality-issue': '质量问题',
  'other': '其他异常',
}

export interface TaskAssignment {
  id: string
  orderId: string
  orderNumber: string
  stage: ProcessingStage
  technicianId: string
  technicianName: string
  status: TaskStatus
  priority: TaskPriority
  assignedAt: string
  acceptedAt?: string
  startedAt?: string
  completedAt?: string
  pausedAt?: string
  transferredAt?: string
  exceptionAt?: string
  estimatedCompletionTime?: string
  reworkCount: number
  notes?: string
  exceptionType?: ExceptionType
  exceptionReason?: string
  transferredFrom?: string
  transferredTo?: string
  transferReason?: string
  assignedBy?: string
  workItemsCount?: number
  clinicName?: string
  deliveryDate?: string
  orderPriority?: OrderPriority
}

export interface Technician {
  id: string
  name: string
  employeeCode: string
  phone?: string
  email?: string
  status: TechnicianStatus
  skills: TechnicianSkill[]
  primarySkill?: TechnicianSkill
  currentTasksCount: number
  capacityLimit: number
  dailyCapacity: number
  todayCompleted: number
  totalReworkCount: number
  avgTaskDurationMinutes: number
  joinedAt: string
  avatarColor?: string
  department?: string
  level?: 'junior' | 'intermediate' | 'senior' | 'expert'
  certifications?: string[]
}

export const TechnicianLevelLabels: Record<NonNullable<Technician['level']>, string> = {
  'junior': '初级技师',
  'intermediate': '中级技师',
  'senior': '高级技师',
  'expert': '专家技师',
}

export const TechnicianLevelColors: Record<NonNullable<Technician['level']>, string> = {
  'junior': 'bg-slate-50 text-slate-700 border-slate-200',
  'intermediate': 'bg-blue-50 text-blue-700 border-blue-200',
  'senior': 'bg-violet-50 text-violet-700 border-violet-200',
  'expert': 'bg-amber-50 text-amber-700 border-amber-200',
}

export interface TaskHandoverRecord {
  id: string
  taskId: string
  orderId: string
  stage: ProcessingStage
  fromTechnicianId: string
  fromTechnicianName: string
  toTechnicianId: string
  toTechnicianName: string
  handedAt: string
  reason: string
  handedBy: string
  notes?: string
}

export interface TechnicianDailyStat {
  technicianId: string
  technicianName: string
  date: string
  assignedCount: number
  acceptedCount: number
  completedCount: number
  reworkCount: number
  exceptionCount: number
  avgDurationMinutes: number
  capacityUtilization: number
}

export interface ScheduleBoardSlot {
  stage: ProcessingStage
  stageLabel: string
  tasks: TaskAssignment[]
  estimatedCapacity: number
  usedCapacity: number
}

export interface TechnicianWorkbenchStats {
  technicianId: string
  pendingCount: number
  inProgressCount: number
  completedTodayCount: number
  exceptionCount: number
  overdueCount: number
  reworkCount: number
  avgProcessingMinutes: number
  capacityUsedPercent: number
}
