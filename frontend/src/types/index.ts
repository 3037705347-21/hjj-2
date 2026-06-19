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

export interface ReturnRecord {
  id: string
  orderId: string
  returnedAt: string
  reason: string
  stageReturnedFrom: ProcessingStage
  correctiveAction: string
  responsibleTechnician?: string
  completedAt?: string
}

export interface ToothWorkItem {
  toothNumber: string
  restorationType: RestorationType
  material: MaterialType
  shade: ShadeGuide
  notes?: string
}

export interface Clinic {
  id: string
  name: string
  contactPerson: string
  phone: string
  address: string
  clinicCode: string
}

export interface Patient {
  patientId: string
  anonymousCode: string
  gender?: 'male' | 'female'
  age?: number
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
