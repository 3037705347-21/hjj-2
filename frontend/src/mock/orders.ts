import type { Clinic, Order, ReturnRecord, Attachment, Communication } from '../types'
import type { AttachmentCategory, CommunicationType, ProcessingStage } from '../types'

export const MockClinics: Clinic[] = [
  {
    id: 'C001',
    name: '明德口腔医院',
    contactPerson: '李明华',
    phone: '010-8888-0001',
    address: '北京市朝阳区建国路88号',
    clinicCode: 'MDE-001',
  },
  {
    id: 'C002',
    name: '康健牙科诊所',
    contactPerson: '王雅芳',
    phone: '021-6666-0002',
    address: '上海市徐汇区淮海中路168号',
    clinicCode: 'KJD-002',
  },
  {
    id: 'C003',
    name: '华美齿科中心',
    contactPerson: '张伟强',
    phone: '020-7777-0003',
    address: '广州市天河区体育西路256号',
    clinicCode: 'HMC-003',
  },
  {
    id: 'C004',
    name: '仁和口腔门诊部',
    contactPerson: '陈秀英',
    phone: '0755-9999-0004',
    address: '深圳市福田区深南大道6018号',
    clinicCode: 'RHO-004',
  },
]

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0] + 'T' + date.toTimeString().split(' ')[0]
}

const today = new Date()
const daysAgo = (n: number) => new Date(today.getTime() - n * 86400000)
const daysLater = (n: number) => new Date(today.getTime() + n * 86400000)

const mockReturns: ReturnRecord[] = [
  {
    id: 'R001',
    orderId: 'O20260612001',
    returnedAt: formatDate(daysAgo(5)),
    reason: '边缘不密合，存在缝隙',
    stageReturnedFrom: 'quality-check',
    correctiveAction: '重新制作内冠，加强边缘密合度，检查肩台预备',
    responsibleTechnician: '刘师傅',
    completedAt: formatDate(daysAgo(2)),
    status: 'closed',
    sourceStage: 'quality-check',
    problemType: 'edge-misfit',
    rootCause: 'technician-error',
    responsibility: 'finishing-tech',
    relatedTeeth: ['16'],
    chargeable: false,
    chargeAmount: 0,
    deadline: formatDate(daysAgo(1)).split('T')[0],
    stageBeforeRework: 'quality-check',
    statusBeforeRework: 'in-progress',
    timeline: [
      { status: 'initiated', timestamp: formatDate(daysAgo(5)), operator: '质检-王', note: '发起返工' },
      { status: 'accepted', timestamp: formatDate(daysAgo(5)), operator: '刘师傅', note: '受理返工' },
      { status: 'rectifying', timestamp: formatDate(daysAgo(4)), operator: '刘师傅', note: '开始整改' },
      { status: 'rechecking', timestamp: formatDate(daysAgo(2)), operator: '刘师傅', note: '提交复检' },
      { status: 'closed', timestamp: formatDate(daysAgo(2)), operator: '质检-王', note: '复检通过，关闭' },
    ],
    statusHistory: [
      { fromStatus: 'initiated', toStatus: 'accepted', timestamp: formatDate(daysAgo(5)), operator: '刘师傅', note: '已接收返工任务' },
      { fromStatus: 'accepted', toStatus: 'rectifying', timestamp: formatDate(daysAgo(4)), operator: '刘师傅', note: '开始重新制作内冠' },
      { fromStatus: 'rectifying', toStatus: 'rechecking', timestamp: formatDate(daysAgo(2)), operator: '刘师傅', note: '整改完成，申请复检' },
      { fromStatus: 'rechecking', toStatus: 'closed', timestamp: formatDate(daysAgo(2)), operator: '质检-王', note: '边缘密合度合格，复检通过' },
    ],
    acceptanceAt: formatDate(daysAgo(5)),
    acceptedBy: '刘师傅',
    rectificationStartAt: formatDate(daysAgo(4)),
    rectifiedBy: '刘师傅',
    recheckAt: formatDate(daysAgo(2)),
    recheckedBy: '质检-王',
    recheckResult: 'pass',
    closedAt: formatDate(daysAgo(2)),
    closedBy: '质检-王',
  },
]

export const MockOrders: Order[] = [
  {
    id: 'O20260617001',
    orderNumber: 'DD-20260617-0001',
    createdAt: formatDate(daysAgo(0)),
    clinicId: 'C001',
    clinic: MockClinics[0],
    doctorName: '李明华',
    patient: {
      patientId: 'P0001',
      anonymousCode: 'YK-2026-0617-A',
      gender: 'female',
      age: 45,
    },
    workItems: [
      {
        toothNumber: '11',
        restorationType: 'crown',
        material: 'zirconia',
        shade: 'A2',
        notes: '邻牙接触区略紧',
      },
      {
        toothNumber: '21',
        restorationType: 'crown',
        material: 'zirconia',
        shade: 'A2',
      },
    ],
    impressionMethod: 'digital-scan',
    deliveryDate: formatDate(daysLater(7)).split('T')[0],
    priority: 'standard',
    status: 'in-progress',
    currentStage: 'wax-up',
    stageHistory: [
      { stage: 'received', startedAt: formatDate(daysAgo(0)), completedAt: formatDate(daysAgo(0)), technician: '调度员-陈', notes: '数字印模已接收' },
      { stage: 'model-scanning', startedAt: formatDate(daysAgo(0)), completedAt: formatDate(daysAgo(0)), technician: '王技师', notes: '扫描数据质量良好' },
      { stage: 'wax-up', startedAt: formatDate(daysAgo(0)), technician: '张技师', notes: '按照设计稿制作蜡型，注意切端透明度' },
    ],
    returnRecords: [],
    attachments: [],
    communications: [],
    specialInstructions: '患者对美观要求较高，注意切端透明度',
    totalAmount: 6800,
  },
  {
    id: 'O20260616002',
    orderNumber: 'DD-20260616-0002',
    createdAt: formatDate(daysAgo(1)),
    clinicId: 'C002',
    clinic: MockClinics[1],
    doctorName: '王雅芳',
    patient: {
      patientId: 'P0002',
      anonymousCode: 'YK-2026-0616-B',
      gender: 'male',
      age: 58,
    },
    workItems: [
      {
        toothNumber: '36',
        restorationType: 'implant-crown',
        material: 'zirconia',
        shade: 'A3',
        notes: '基台已就位，修复体螺丝固位',
      },
    ],
    impressionMethod: 'digital-scan',
    deliveryDate: formatDate(daysLater(6)).split('T')[0],
    priority: 'urgent',
    status: 'in-progress',
    currentStage: 'porcelain',
    stageHistory: [
      { stage: 'received', startedAt: formatDate(daysAgo(1)), completedAt: formatDate(daysAgo(1)), technician: '调度员-陈' },
      { stage: 'model-scanning', startedAt: formatDate(daysAgo(1)), completedAt: formatDate(daysAgo(1)), technician: '王技师' },
      { stage: 'wax-up', startedAt: formatDate(daysAgo(1)), completedAt: formatDate(daysAgo(0)), technician: '张技师' },
      { stage: 'casting', startedAt: formatDate(daysAgo(0)), completedAt: formatDate(daysAgo(0)), technician: '李师傅' },
      { stage: 'porcelain', startedAt: formatDate(daysAgo(0)), technician: '刘技师', notes: '加急单，优先上瓷，注意颜色匹配' },
    ],
    returnRecords: [],
    attachments: [],
    communications: [],
    specialInstructions: '加急单，请优先处理',
    totalAmount: 5500,
  },
  {
    id: 'O20260615003',
    orderNumber: 'DD-20260615-0003',
    createdAt: formatDate(daysAgo(2)),
    clinicId: 'C003',
    clinic: MockClinics[2],
    doctorName: '张伟强',
    patient: {
      patientId: 'P0003',
      anonymousCode: 'YK-2026-0615-C',
      gender: 'female',
      age: 32,
    },
    workItems: [
      {
        toothNumber: '12',
        restorationType: 'veneer',
        material: 'emax',
        shade: 'B1',
      },
      {
        toothNumber: '13',
        restorationType: 'veneer',
        material: 'emax',
        shade: 'B1',
      },
      {
        toothNumber: '22',
        restorationType: 'veneer',
        material: 'emax',
        shade: 'B1',
      },
      {
        toothNumber: '23',
        restorationType: 'veneer',
        material: 'emax',
        shade: 'B1',
      },
    ],
    impressionMethod: 'traditional-silicone',
    deliveryDate: formatDate(daysLater(8)).split('T')[0],
    priority: 'standard',
    status: 'in-progress',
    currentStage: 'model-scanning',
    stageHistory: [
      { stage: 'received', startedAt: formatDate(daysAgo(2)), completedAt: formatDate(daysAgo(2)), technician: '调度员-吴' },
      { stage: 'model-scanning', startedAt: formatDate(daysAgo(1)) },
    ],
    returnRecords: [],
    attachments: [],
    communications: [],
    specialInstructions: '美容修复，颜色要求严格，需比色确认',
    totalAmount: 12800,
  },
  {
    id: 'O20260614004',
    orderNumber: 'DD-20260614-0004',
    createdAt: formatDate(daysAgo(3)),
    clinicId: 'C004',
    clinic: MockClinics[3],
    doctorName: '陈秀英',
    patient: {
      patientId: 'P0004',
      anonymousCode: 'YK-2026-0614-D',
      gender: 'male',
      age: 67,
    },
    workItems: [
      {
        toothNumber: '44',
        restorationType: 'crown',
        material: 'pfm',
        shade: 'A3.5',
      },
      {
        toothNumber: '45',
        restorationType: 'crown',
        material: 'pfm',
        shade: 'A3.5',
      },
      {
        toothNumber: '46',
        restorationType: 'crown',
        material: 'pfm',
        shade: 'A3.5',
      },
      {
        toothNumber: '47',
        restorationType: 'crown',
        material: 'pfm',
        shade: 'A4',
      },
    ],
    impressionMethod: 'dual-arch-tray',
    deliveryDate: formatDate(daysLater(4)).split('T')[0],
    priority: 'standard',
    status: 'in-progress',
    currentStage: 'finishing',
    stageHistory: [
      { stage: 'received', startedAt: formatDate(daysAgo(3)), completedAt: formatDate(daysAgo(3)), technician: '调度员-陈' },
      { stage: 'model-scanning', startedAt: formatDate(daysAgo(3)), completedAt: formatDate(daysAgo(3)), technician: '王技师' },
      { stage: 'wax-up', startedAt: formatDate(daysAgo(3)), completedAt: formatDate(daysAgo(2)), technician: '张技师' },
      { stage: 'casting', startedAt: formatDate(daysAgo(2)), completedAt: formatDate(daysAgo(1)), technician: '李师傅' },
      { stage: 'porcelain', startedAt: formatDate(daysAgo(1)), completedAt: formatDate(daysAgo(0)), technician: '赵技师' },
      { stage: 'glazing', startedAt: formatDate(daysAgo(0)), completedAt: formatDate(daysAgo(0)), technician: '赵技师' },
      { stage: 'finishing', startedAt: formatDate(daysAgo(0)) },
    ],
    returnRecords: [],
    attachments: [],
    communications: [],
    totalAmount: 9600,
  },
  {
    id: 'O20260613005',
    orderNumber: 'DD-20260613-0005',
    createdAt: formatDate(daysAgo(4)),
    clinicId: 'C001',
    clinic: MockClinics[0],
    doctorName: '李明华',
    patient: {
      patientId: 'P0005',
      anonymousCode: 'YK-2026-0613-E',
      gender: 'male',
      age: 50,
    },
    workItems: [
      {
        toothNumber: '24',
        restorationType: 'bridge',
        material: 'zirconia',
        shade: 'A2',
        notes: '24-26联桥，25缺失',
      },
      {
        toothNumber: '25',
        restorationType: 'bridge',
        material: 'zirconia',
        shade: 'A2',
      },
      {
        toothNumber: '26',
        restorationType: 'bridge',
        material: 'zirconia',
        shade: 'A2',
      },
    ],
    impressionMethod: 'digital-scan',
    deliveryDate: formatDate(daysLater(1)).split('T')[0],
    priority: 'urgent',
    status: 'in-progress',
    currentStage: 'quality-check',
    stageHistory: [
      { stage: 'received', startedAt: formatDate(daysAgo(4)), completedAt: formatDate(daysAgo(4)), technician: '调度员-陈' },
      { stage: 'model-scanning', startedAt: formatDate(daysAgo(4)), completedAt: formatDate(daysAgo(4)), technician: '王技师' },
      { stage: 'wax-up', startedAt: formatDate(daysAgo(4)), completedAt: formatDate(daysAgo(3)), technician: '张技师' },
      { stage: 'casting', startedAt: formatDate(daysAgo(3)), completedAt: formatDate(daysAgo(2)), technician: '李师傅' },
      { stage: 'porcelain', startedAt: formatDate(daysAgo(2)), completedAt: formatDate(daysAgo(1)), technician: '赵技师' },
      { stage: 'glazing', startedAt: formatDate(daysAgo(1)), completedAt: formatDate(daysAgo(0)), technician: '赵技师' },
      { stage: 'finishing', startedAt: formatDate(daysAgo(0)), completedAt: formatDate(daysAgo(0)), technician: '刘师傅' },
      { stage: 'quality-check', startedAt: formatDate(daysAgo(0)) },
    ],
    returnRecords: [],
    attachments: [],
    communications: [],
    specialInstructions: '加急单，确保咬合关系正确',
    totalAmount: 10500,
  },
  {
    id: 'O20260612001',
    orderNumber: 'DD-20260612-0006',
    createdAt: formatDate(daysAgo(5)),
    clinicId: 'C002',
    clinic: MockClinics[1],
    doctorName: '王雅芳',
    patient: {
      patientId: 'P0006',
      anonymousCode: 'YK-2026-0612-F',
      gender: 'female',
      age: 72,
    },
    workItems: [
      {
        toothNumber: '16',
        restorationType: 'crown',
        material: 'zirconia',
        shade: 'A3',
      },
    ],
    impressionMethod: 'traditional-alginate',
    deliveryDate: formatDate(daysAgo(1)).split('T')[0],
    priority: 'standard',
    status: 'returned',
    currentStage: 'porcelain',
    stageHistory: [
      { stage: 'received', startedAt: formatDate(daysAgo(5)), completedAt: formatDate(daysAgo(5)), technician: '调度员-吴' },
      { stage: 'model-scanning', startedAt: formatDate(daysAgo(5)), completedAt: formatDate(daysAgo(5)), technician: '王技师' },
      { stage: 'wax-up', startedAt: formatDate(daysAgo(5)), completedAt: formatDate(daysAgo(4)), technician: '张技师' },
      { stage: 'casting', startedAt: formatDate(daysAgo(4)), completedAt: formatDate(daysAgo(3)), technician: '李师傅' },
      { stage: 'porcelain', startedAt: formatDate(daysAgo(3)), completedAt: formatDate(daysAgo(2)), technician: '赵技师' },
      { stage: 'glazing', startedAt: formatDate(daysAgo(2)), completedAt: formatDate(daysAgo(2)), technician: '赵技师' },
      { stage: 'finishing', startedAt: formatDate(daysAgo(2)), completedAt: formatDate(daysAgo(1)), technician: '刘师傅' },
      { stage: 'quality-check', startedAt: formatDate(daysAgo(1)), completedAt: formatDate(daysAgo(1)), technician: '质检员-孙', notes: '返工处理' },
      { stage: 'porcelain', startedAt: formatDate(daysAgo(1)) },
    ],
    returnRecords: [mockReturns[0]],
    attachments: [],
    communications: [],
    totalAmount: 3400,
  },
  {
    id: 'O20260610007',
    orderNumber: 'DD-20260610-0007',
    createdAt: formatDate(daysAgo(7)),
    clinicId: 'C003',
    clinic: MockClinics[2],
    doctorName: '张伟强',
    patient: {
      patientId: 'P0007',
      anonymousCode: 'YK-2026-0610-G',
      gender: 'male',
      age: 61,
    },
    workItems: [
      {
        toothNumber: '36',
        restorationType: 'onlay',
        material: 'emax',
        shade: 'A3',
        notes: 'MOD大面积修复',
      },
    ],
    impressionMethod: 'digital-scan',
    deliveryDate: formatDate(daysAgo(2)).split('T')[0],
    priority: 'standard',
    status: 'completed',
    currentStage: 'delivered',
    stageHistory: [
      { stage: 'received', startedAt: formatDate(daysAgo(7)), completedAt: formatDate(daysAgo(7)), technician: '调度员-陈' },
      { stage: 'model-scanning', startedAt: formatDate(daysAgo(7)), completedAt: formatDate(daysAgo(7)), technician: '王技师' },
      { stage: 'wax-up', startedAt: formatDate(daysAgo(6)), completedAt: formatDate(daysAgo(6)), technician: '张技师' },
      { stage: 'casting', startedAt: formatDate(daysAgo(5)), completedAt: formatDate(daysAgo(5)), technician: '李师傅' },
      { stage: 'porcelain', startedAt: formatDate(daysAgo(4)), completedAt: formatDate(daysAgo(3)), technician: '赵技师' },
      { stage: 'glazing', startedAt: formatDate(daysAgo(3)), completedAt: formatDate(daysAgo(3)), technician: '赵技师' },
      { stage: 'finishing', startedAt: formatDate(daysAgo(2)), completedAt: formatDate(daysAgo(2)), technician: '刘师傅' },
      { stage: 'quality-check', startedAt: formatDate(daysAgo(2)), completedAt: formatDate(daysAgo(2)), technician: '质检员-孙' },
      { stage: 'shipped', startedAt: formatDate(daysAgo(1)), completedAt: formatDate(daysAgo(1)), technician: '调度员-陈' },
      { stage: 'delivered', startedAt: formatDate(daysAgo(0)), completedAt: formatDate(daysAgo(0)) },
    ],
    returnRecords: [],
    attachments: [],
    communications: [],
    totalAmount: 2800,
  },
  {
    id: 'O20260617008',
    orderNumber: 'DD-20260617-0008',
    createdAt: formatDate(daysAgo(0)),
    clinicId: 'C004',
    clinic: MockClinics[3],
    doctorName: '陈秀英',
    patient: {
      patientId: 'P0008',
      anonymousCode: 'YK-2026-0617-H',
      gender: 'female',
      age: 40,
    },
    workItems: [
      {
        toothNumber: '34',
        restorationType: 'inlay',
        material: 'composite',
        shade: 'A2',
      },
      {
        toothNumber: '35',
        restorationType: 'inlay',
        material: 'composite',
        shade: 'A2',
      },
    ],
    impressionMethod: 'digital-scan',
    deliveryDate: formatDate(daysLater(5)).split('T')[0],
    priority: 'standard',
    status: 'pending',
    currentStage: 'received',
    stageHistory: [
      { stage: 'received', startedAt: formatDate(daysAgo(0)), technician: '调度员-吴' },
    ],
    returnRecords: [],
    attachments: [],
    communications: [],
    totalAmount: 3200,
  },
  {
    id: 'O20260615009',
    orderNumber: 'DD-20260615-0009',
    createdAt: formatDate(daysAgo(2)),
    clinicId: 'C001',
    clinic: MockClinics[0],
    doctorName: '李明华',
    patient: {
      patientId: 'P0009',
      anonymousCode: 'YK-2026-0615-I',
      gender: 'male',
      age: 75,
    },
    workItems: [
      {
        toothNumber: 'all',
        restorationType: 'full-denture',
        material: 'acrylic',
        shade: 'A3',
        notes: '全口总义齿，吸附式设计',
      },
    ],
    impressionMethod: 'traditional-silicone',
    deliveryDate: formatDate(daysLater(10)).split('T')[0],
    priority: 'standard',
    status: 'in-progress',
    currentStage: 'wax-up',
    stageHistory: [
      { stage: 'received', startedAt: formatDate(daysAgo(2)), completedAt: formatDate(daysAgo(2)), technician: '调度员-陈' },
      { stage: 'model-scanning', startedAt: formatDate(daysAgo(2)), completedAt: formatDate(daysAgo(1)), technician: '王技师' },
      { stage: 'wax-up', startedAt: formatDate(daysAgo(1)) },
    ],
    returnRecords: [],
    attachments: [],
    communications: [],
    specialInstructions: '患者牙槽骨吸收严重，注意吸附力',
    totalAmount: 18000,
  },
  {
    id: 'O20260616010',
    orderNumber: 'DD-20260616-0010',
    createdAt: formatDate(daysAgo(1)),
    clinicId: 'C002',
    clinic: MockClinics[1],
    doctorName: '王雅芳',
    patient: {
      patientId: 'P0010',
      anonymousCode: 'YK-2026-0616-J',
      gender: 'female',
      age: 55,
    },
    workItems: [
      {
        toothNumber: '16',
        restorationType: 'bridge',
        material: 'zirconia',
        shade: 'A2',
        notes: '16-14联桥，15缺失',
      },
      {
        toothNumber: '15',
        restorationType: 'bridge',
        material: 'zirconia',
        shade: 'A2',
      },
      {
        toothNumber: '14',
        restorationType: 'bridge',
        material: 'zirconia',
        shade: 'A2',
      },
    ],
    impressionMethod: 'digital-scan',
    deliveryDate: formatDate(daysAgo(0)).split('T')[0],
    priority: 'stat',
    status: 'in-progress',
    currentStage: 'glazing',
    stageHistory: [
      { stage: 'received', startedAt: formatDate(daysAgo(1)), completedAt: formatDate(daysAgo(1)), technician: '调度员-陈' },
      { stage: 'model-scanning', startedAt: formatDate(daysAgo(1)), completedAt: formatDate(daysAgo(1)), technician: '王技师' },
      { stage: 'wax-up', startedAt: formatDate(daysAgo(1)), completedAt: formatDate(daysAgo(1)), technician: '张技师' },
      { stage: 'casting', startedAt: formatDate(daysAgo(1)), completedAt: formatDate(daysAgo(0)), technician: '李师傅' },
      { stage: 'porcelain', startedAt: formatDate(daysAgo(0)), completedAt: formatDate(daysAgo(0)), technician: '赵技师' },
      { stage: 'glazing', startedAt: formatDate(daysAgo(0)) },
    ],
    returnRecords: [],
    attachments: [],
    communications: [],
    specialInstructions: '特急单！患者下午试戴',
    totalAmount: 10500,
  },
]

function generateMockAttachments(orderId: string, orderCreatedAt: string): Attachment[] {
  const baseDate = new Date(orderCreatedAt)
  const hoursLater = (h: number) => new Date(baseDate.getTime() + h * 3600000)
  const attachments: Attachment[] = [
    {
      id: `A-${orderId}-1`,
      orderId,
      category: 'intraoral-scan',
      fileName: `${orderId}_口扫数据.stl`,
      fileSize: 15 * 1024 * 1024,
      fileType: 'model/stl',
      uploadedBy: '调度员-陈',
      uploadedAt: formatDate(hoursLater(0.5)),
      description: '患者口内三维扫描数据',
    },
    {
      id: `A-${orderId}-2`,
      orderId,
      category: 'prescription-photo',
      fileName: `${orderId}_处方单.jpg`,
      fileSize: 2.3 * 1024 * 1024,
      fileType: 'image/jpeg',
      uploadedBy: '调度员-陈',
      uploadedAt: formatDate(hoursLater(1)),
      description: '医生签字处方单扫描件',
    },
  ]
  if (Math.random() > 0.3) {
    attachments.push({
      id: `A-${orderId}-3`,
      orderId,
      category: 'facial-photo',
      fileName: `${orderId}_正面像.jpg`,
      fileSize: 3.1 * 1024 * 1024,
      fileType: 'image/jpeg',
      uploadedBy: '调度员-吴',
      uploadedAt: formatDate(hoursLater(1.5)),
      description: '患者面部正面照片',
    })
    attachments.push({
      id: `A-${orderId}-4`,
      orderId,
      category: 'facial-photo',
      fileName: `${orderId}_侧面像.jpg`,
      fileSize: 2.8 * 1024 * 1024,
      fileType: 'image/jpeg',
      uploadedBy: '调度员-吴',
      uploadedAt: formatDate(hoursLater(1.5)),
      description: '患者面部侧面照片',
    })
  }
  if (Math.random() > 0.5) {
    attachments.push({
      id: `A-${orderId}-5`,
      orderId,
      category: 'design-draft',
      fileName: `${orderId}_设计方案.pdf`,
      fileSize: 5.6 * 1024 * 1024,
      fileType: 'application/pdf',
      uploadedBy: '张技师',
      uploadedAt: formatDate(hoursLater(24)),
      description: '修复体设计方案及咬合分析',
    })
  }
  if (Math.random() > 0.6) {
    attachments.push({
      id: `A-${orderId}-6`,
      orderId,
      category: 'logistics-receipt',
      fileName: `${orderId}_物流回单.jpg`,
      fileSize: 1.2 * 1024 * 1024,
      fileType: 'image/jpeg',
      uploadedBy: '调度员-陈',
      uploadedAt: formatDate(hoursLater(72)),
      description: '顺丰快递签收单',
    })
  }
  return attachments
}

function generateMockCommunications(orderId: string, orderCreatedAt: string, currentStage: ProcessingStage, hasReturn: boolean): Communication[] {
  const baseDate = new Date(orderCreatedAt)
  const hoursLater = (h: number) => new Date(baseDate.getTime() + h * 3600000)
  const comms: Communication[] = [
    {
      id: `C-${orderId}-1`,
      orderId,
      type: 'system-notice',
      operator: '系统',
      operatedAt: formatDate(hoursLater(0)),
      content: `订单已创建，当前阶段：订单接收`,
      relatedStage: 'received',
      isSystemGenerated: true,
    },
    {
      id: `C-${orderId}-2`,
      orderId,
      type: 'clinic-message',
      operator: '李明华医生',
      operatedAt: formatDate(hoursLater(0.3)),
      content: '请优先处理该患者，本周需要戴牙。患者对美学要求较高，切端透明度需特别注意。',
      relatedStage: 'received',
    },
    {
      id: `C-${orderId}-3`,
      orderId,
      type: 'internal-note',
      operator: '调度员-陈',
      operatedAt: formatDate(hoursLater(1)),
      content: '已核对处方单和口扫数据，信息完整，分配给王技师进行模型扫描。',
      relatedStage: 'model-scanning',
    },
  ]
  if (Math.random() > 0.4) {
    comms.push({
      id: `C-${orderId}-4`,
      orderId,
      type: 'phone-summary',
      operator: '调度员-陈',
      operatedAt: formatDate(hoursLater(3)),
      content: '与诊所王医生电话确认：咬合关系按对颌牙排列，颜色比色以A2为基准，颈部略深。',
      relatedStage: 'wax-up',
    })
  }
  if (hasReturn) {
    comms.push({
      id: `C-${orderId}-5`,
      orderId,
      type: 'system-notice',
      operator: '系统',
      operatedAt: formatDate(hoursLater(48)),
      content: `订单已从质检审核阶段退回至烤瓷堆瓷阶段，原因：边缘不密合，存在缝隙`,
      relatedStage: 'quality-check',
      isSystemGenerated: true,
    })
    comms.push({
      id: `C-${orderId}-6`,
      orderId,
      type: 'rework-communication',
      operator: '质检员-孙',
      operatedAt: formatDate(hoursLater(48.5)),
      content: '内冠边缘间隙超过50μm，需重新制作内冠，注意肩台制备精度。',
      relatedStage: 'porcelain',
    })
    comms.push({
      id: `C-${orderId}-7`,
      orderId,
      type: 'internal-note',
      operator: '赵技师',
      operatedAt: formatDate(hoursLater(50)),
      content: '收到返工通知，将重新制作内冠，预计2天内完成返工。',
      relatedStage: 'porcelain',
    })
  }
  if (currentStage === 'delivered') {
    comms.push({
      id: `C-${orderId}-8`,
      orderId,
      type: 'system-notice',
      operator: '系统',
      operatedAt: formatDate(hoursLater(120)),
      content: `订单已标记为已送达，诊所已签收`,
      relatedStage: 'delivered',
      isSystemGenerated: true,
    })
    comms.push({
      id: `C-${orderId}-9`,
      orderId,
      type: 'delivery-confirmation',
      operator: '张伟强医生',
      operatedAt: formatDate(hoursLater(122)),
      content: '修复体已收到，颜色和形态均满意，患者戴牙顺利，感谢。',
      relatedStage: 'delivered',
    })
  }
  return comms.sort((a, b) => new Date(b.operatedAt).getTime() - new Date(a.operatedAt).getTime())
}

MockOrders.forEach((order) => {
  order.attachments = generateMockAttachments(order.id, order.createdAt)
  order.communications = generateMockCommunications(
    order.id,
    order.createdAt,
    order.currentStage,
    order.returnRecords.length > 0
  )
})

export function getOrderById(id: string): Order | undefined {
  return MockOrders.find((o) => o.id === id)
}

export function getOrdersByClinic(clinicId: string): Order[] {
  return MockOrders.filter((o) => o.clinicId === clinicId)
}
