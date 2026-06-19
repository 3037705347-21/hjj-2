import type { LogisticsRecord, LogisticsType, SignStatus, LogisticsExceptionType, ShippingMethod, LogisticsTimelineEntry } from '../types'
import { MockOrders, MockClinics } from './orders'

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0] + 'T' + date.toTimeString().split(' ')[0]
}

const today = new Date()
const daysAgo = (n: number) => new Date(today.getTime() - n * 86400000)
const daysLater = (n: number) => new Date(today.getTime() + n * 86400000)

function generateTrackingId(): string {
  const prefix = 'WL'
  const now = new Date()
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `${prefix}${dateStr}${random}`
}

function generateExpressNumber(method: ShippingMethod): string {
  const prefixes: Record<ShippingMethod, string> = {
    'sf-express': 'SF',
    'jd-express': 'JD',
    'sto-express': 'STO',
    'yunda-express': 'YD',
    'zto-express': 'ZT',
    'ems': 'EM',
    'other': 'QT',
  }
  const prefix = prefixes[method] || 'EXP'
  const nums = Array.from({ length: 10 }, () => Math.floor(Math.random() * 10)).join('')
  return `${prefix}${nums}`
}

function createTimeline(
  type: LogisticsType,
  status: SignStatus,
  baseDate: Date
): LogisticsTimelineEntry[] {
  const timeline: LogisticsTimelineEntry[] = []
  const hoursLater = (h: number) => new Date(baseDate.getTime() + h * 3600000)

  if (type === 'receive') {
    timeline.push({
      id: 't1',
      status: '快递到件',
      location: '义齿加工中心',
      description: '快递已送达加工中心，等待验收',
      operator: '调度员-陈',
      timestamp: formatDate(hoursLater(0)),
    })
    timeline.push({
      id: 't2',
      status: '验收完成',
      location: '义齿加工中心',
      description: '模型/口扫资料验收完成，已登记入库',
      operator: '调度员-陈',
      timestamp: formatDate(hoursLater(1)),
    })
    if (status !== 'pending') {
      timeline.push({
        id: 't3',
        status: '订单创建',
        location: '调度中心',
        description: '已关联订单并创建加工任务',
        operator: '调度员-陈',
        timestamp: formatDate(hoursLater(2)),
      })
    }
  } else {
    timeline.push({
      id: 't1',
      status: '成品出库',
      location: '质检部',
      description: '修复体质检通过，已出库待发货',
      operator: '质检员-孙',
      timestamp: formatDate(hoursLater(0)),
    })
    timeline.push({
      id: 't2',
      status: '快递揽收',
      location: '义齿加工中心',
      description: '快递员已揽收包裹',
      operator: '调度员-陈',
      timestamp: formatDate(hoursLater(2)),
    })
    if (status === 'in-transit' || status === 'signed' || status === 'exception') {
      timeline.push({
        id: 't3',
        status: '运输中',
        location: '转运中心',
        description: '包裹已到达转运中心，正在分拣',
        timestamp: formatDate(hoursLater(8)),
      })
    }
    if (status === 'signed') {
      timeline.push({
        id: 't4',
        status: '派送中',
        location: '目的城市',
        description: '包裹正在派送中',
        timestamp: formatDate(hoursLater(24)),
      })
      timeline.push({
        id: 't5',
        status: '已签收',
        location: '诊所',
        description: '包裹已签收，签收人：诊所前台',
        operator: '系统',
        timestamp: formatDate(hoursLater(28)),
      })
    }
    if (status === 'exception') {
      timeline.push({
        id: 't4',
        status: '异常',
        location: '转运中心',
        description: '包裹出现异常，正在处理中',
        operator: '系统',
        timestamp: formatDate(hoursLater(12)),
        isException: true,
      })
    }
  }

  return timeline.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

export const MockLogistics: LogisticsRecord[] = [
  {
    id: generateTrackingId(),
    orderId: 'O20260617001',
    orderNumber: 'DD-20260617-0001',
    clinicId: 'C001',
    clinicName: '明德口腔医院',
    type: 'receive',
    receiveTime: formatDate(daysAgo(0)),
    shippingMethod: 'sf-express',
    trackingNumber: 'SF1234567890123',
    receiverName: '调度员-陈',
    receiverPhone: '010-8888-0001',
    receiverAddress: '北京市朝阳区建国路88号义齿加工中心',
    signStatus: 'signed',
    notes: '数字印模文件，已下载验证完整性',
    items: ['上下颌口扫数据', '比色板照片', '咬合记录'],
    operator: '调度员-陈',
    createdAt: formatDate(daysAgo(0)),
    updatedAt: formatDate(daysAgo(0)),
    timeline: createTimeline('receive', 'signed', daysAgo(0)),
  },
  {
    id: generateTrackingId(),
    orderId: 'O20260616002',
    orderNumber: 'DD-20260616-0002',
    clinicId: 'C002',
    clinicName: '康健牙科诊所',
    type: 'receive',
    receiveTime: formatDate(daysAgo(1)),
    shippingMethod: 'sf-express',
    trackingNumber: 'SF2345678901234',
    receiverName: '调度员-陈',
    receiverPhone: '010-8888-0001',
    receiverAddress: '北京市朝阳区建国路88号义齿加工中心',
    signStatus: 'signed',
    notes: '数字印模，种植基台已就位',
    items: ['口扫数据', '种植体信息', '基台型号'],
    operator: '调度员-陈',
    createdAt: formatDate(daysAgo(1)),
    updatedAt: formatDate(daysAgo(1)),
    timeline: createTimeline('receive', 'signed', daysAgo(1)),
  },
  {
    id: generateTrackingId(),
    orderId: 'O20260615003',
    orderNumber: 'DD-20260615-0003',
    clinicId: 'C003',
    clinicName: '华美齿科中心',
    type: 'receive',
    receiveTime: formatDate(daysAgo(2)),
    shippingMethod: 'sto-express',
    trackingNumber: 'STO3456789012345',
    receiverName: '调度员-吴',
    receiverPhone: '010-8888-0001',
    receiverAddress: '北京市朝阳区建国路88号义齿加工中心',
    signStatus: 'signed',
    notes: '传统硅橡胶印模，包装完好，模型清晰',
    items: ['上下颌硅橡胶印模', '咬合记录', '比色板'],
    weight: 0.8,
    operator: '调度员-吴',
    createdAt: formatDate(daysAgo(2)),
    updatedAt: formatDate(daysAgo(2)),
    timeline: createTimeline('receive', 'signed', daysAgo(2)),
  },
  {
    id: generateTrackingId(),
    orderId: 'O20260610007',
    orderNumber: 'DD-20260610-0007',
    clinicId: 'C003',
    clinicName: '华美齿科中心',
    type: 'ship',
    shipTime: formatDate(daysAgo(1)),
    signTime: formatDate(daysAgo(0)),
    shippingMethod: 'sf-express',
    trackingNumber: 'SF4567890123456',
    receiverName: '张伟强医生',
    receiverPhone: '020-7777-0003',
    receiverAddress: '广州市天河区体育西路256号华美齿科中心',
    signStatus: 'signed',
    notes: '嵌体修复体，已质检合格',
    items: ['36#高嵌体', '质保卡', '使用说明'],
    weight: 0.3,
    cost: 25,
    operator: '调度员-陈',
    createdAt: formatDate(daysAgo(1)),
    updatedAt: formatDate(daysAgo(0)),
    timeline: createTimeline('ship', 'signed', daysAgo(1)),
  },
  {
    id: generateTrackingId(),
    orderId: 'O20260613005',
    orderNumber: 'DD-20260613-0005',
    clinicId: 'C001',
    clinicName: '明德口腔医院',
    type: 'ship',
    shipTime: formatDate(daysAgo(0)),
    shippingMethod: 'sf-express',
    trackingNumber: 'SF5678901234567',
    receiverName: '李明华医生',
    receiverPhone: '010-8888-0001',
    receiverAddress: '北京市朝阳区建国路88号明德口腔医院',
    signStatus: 'in-transit',
    notes: '加急单，24-26联桥，注意轻拿轻放',
    items: ['24-26联桥', '质保卡', '设计方案'],
    weight: 0.4,
    cost: 30,
    operator: '调度员-陈',
    createdAt: formatDate(daysAgo(0)),
    updatedAt: formatDate(daysAgo(0)),
    timeline: createTimeline('ship', 'in-transit', daysAgo(0)),
  },
  {
    id: generateTrackingId(),
    orderId: 'O20260614004',
    orderNumber: 'DD-20260614-0004',
    clinicId: 'C004',
    clinicName: '仁和口腔门诊部',
    type: 'ship',
    shippingMethod: 'jd-express',
    trackingNumber: 'JD6789012345678',
    receiverName: '陈秀英医生',
    receiverPhone: '0755-9999-0004',
    receiverAddress: '深圳市福田区深南大道6018号仁和口腔门诊部',
    signStatus: 'pending',
    notes: '44-47连冠，待质检完成后发货',
    items: ['44-47连冠', '质保卡'],
    operator: '调度员-陈',
    createdAt: formatDate(daysAgo(0)),
    updatedAt: formatDate(daysAgo(0)),
    timeline: [],
  },
  {
    id: generateTrackingId(),
    orderId: 'O20260616010',
    orderNumber: 'DD-20260616-0010',
    clinicId: 'C002',
    clinicName: '康健牙科诊所',
    type: 'ship',
    shippingMethod: 'sf-express',
    trackingNumber: 'SF7890123456789',
    receiverName: '王雅芳医生',
    receiverPhone: '021-6666-0002',
    receiverAddress: '上海市徐汇区淮海中路168号康健牙科诊所',
    signStatus: 'pending',
    notes: '特急单！患者下午试戴，优先发货',
    items: ['14-16联桥', '质保卡', '设计方案'],
    operator: '调度员-陈',
    createdAt: formatDate(daysAgo(0)),
    updatedAt: formatDate(daysAgo(0)),
    timeline: [],
  },
  {
    id: generateTrackingId(),
    orderId: 'O20260612001',
    orderNumber: 'DD-20260612-0006',
    clinicId: 'C002',
    clinicName: '康健牙科诊所',
    type: 'ship',
    shipTime: formatDate(daysAgo(3)),
    shippingMethod: 'sto-express',
    trackingNumber: 'STO8901234567890',
    receiverName: '王雅芳医生',
    receiverPhone: '021-6666-0002',
    receiverAddress: '上海市徐汇区淮海中路168号康健牙科诊所',
    signStatus: 'exception',
    exceptionType: 'returned',
    exceptionDescription: '收件人拒收，原因：返工产品，需重新制作',
    exceptionReportedAt: formatDate(daysAgo(1)),
    exceptionHandled: false,
    notes: '16#单冠，因边缘不密合返工重发',
    items: ['16#单冠（返工）', '返工说明'],
    weight: 0.25,
    cost: 20,
    operator: '调度员-陈',
    createdAt: formatDate(daysAgo(3)),
    updatedAt: formatDate(daysAgo(1)),
    timeline: [
      {
        id: 't1',
        status: '异常-退回',
        location: '上海徐汇区网点',
        description: '收件人拒收，包裹正在退回',
        operator: '系统',
        timestamp: formatDate(daysAgo(1)),
        isException: true,
      },
      {
        id: 't2',
        status: '派送中',
        location: '上海徐汇区',
        description: '包裹正在派送',
        timestamp: formatDate(daysAgo(2)),
      },
      {
        id: 't3',
        status: '运输中',
        location: '上海转运中心',
        description: '包裹已到达上海',
        timestamp: formatDate(daysAgo(2.5)),
      },
      {
        id: 't4',
        status: '快递揽收',
        location: '义齿加工中心',
        description: '快递员已揽收',
        operator: '调度员-陈',
        timestamp: formatDate(daysAgo(3)),
      },
      {
        id: 't5',
        status: '成品出库',
        location: '质检部',
        description: '返工产品质检通过，已出库',
        operator: '质检员-孙',
        timestamp: formatDate(daysAgo(3)),
      },
    ],
  },
]

export function getLogisticsById(id: string): LogisticsRecord | undefined {
  return MockLogistics.find((l) => l.id === id)
}

export function getLogisticsByOrder(orderId: string): LogisticsRecord[] {
  return MockLogistics.filter((l) => l.orderId === orderId)
}

export function getLogisticsByClinic(clinicId: string): LogisticsRecord[] {
  return MockLogistics.filter((l) => l.clinicId === clinicId)
}
