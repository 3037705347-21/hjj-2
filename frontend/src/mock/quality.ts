import type {
  QualityCheckItem,
  QualityInspection,
  QualityInspectionRule,
  QualityDefectRecord,
  QualityInspectionItemResult,
  ProcessingStage,
  ReworkProblemType,
  ReworkRootCause,
  ReworkResponsibility,
  QualityInspectionStage,
  QualityCheckResult,
} from '../types'
import {
  ProcessingStages,
  ReworkProblemTypeLabels,
} from '../types'

const today = new Date()
const daysAgo = (n: number) => new Date(today.getTime() - n * 86400000)
const daysLater = (n: number) => new Date(today.getTime() + n * 86400000)

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0] + 'T' + date.toTimeString().split(' ')[0]
}

export const MockQualityCheckItems: QualityCheckItem[] = [
  { id: 'QI-001', name: '边缘密合度检查', category: 'edge-fit', description: '检查修复体边缘与肩台的密合度，间隙不超过50μm', isRequired: true, sortOrder: 1, applicableStages: ['finishing', 'quality-check'] },
  { id: 'QI-002', name: '颜色匹配度', category: 'color', description: '对比比色板，检查颜色是否符合处方要求', isRequired: true, sortOrder: 2, applicableStages: ['porcelain', 'glazing', 'quality-check'] },
  { id: 'QI-003', name: '咬合关系检查', category: 'occlusion', description: '检查正中咬合、前伸及侧方咬合是否均匀', isRequired: true, sortOrder: 3, applicableStages: ['finishing', 'quality-check'] },
  { id: 'QI-004', name: '修复体形态', category: 'shape', description: '检查解剖形态、邻接关系、接触点位置是否正确', isRequired: true, sortOrder: 4, applicableStages: ['wax-up', 'porcelain', 'finishing', 'quality-check'] },
  { id: 'QI-005', name: '材料质量检查', category: 'material', description: '检查材料是否有气泡、裂纹、杂质等缺陷', isRequired: true, sortOrder: 5, applicableStages: ['casting', 'porcelain', 'quality-check'] },
  { id: 'QI-006', name: '设计精度验证', category: 'design', description: '核对设计方案与修复体是否一致', isRequired: false, sortOrder: 6, applicableStages: ['wax-up', 'casting', 'quality-check'] },
  { id: 'QI-007', name: '表面光滑度', category: 'surface', description: '检查抛光是否充分，表面是否光滑无划痕', isRequired: true, sortOrder: 7, applicableStages: ['finishing', 'glazing', 'quality-check'] },
  { id: 'QI-008', name: '切端透明度', category: 'color', description: '前牙修复体切端透明度是否自然', isRequired: false, sortOrder: 8, applicableStages: ['porcelain', 'glazing', 'quality-check'] },
  { id: 'QI-009', name: '颈部颜色渐变', category: 'color', description: '颈部颜色是否自然过渡', isRequired: false, sortOrder: 9, applicableStages: ['porcelain', 'glazing', 'quality-check'] },
  { id: 'QI-010', name: '整体外观检查', category: 'other', description: '综合检查外观是否符合临床要求', isRequired: true, sortOrder: 10, applicableStages: ['quality-check'] },
]

export const MockQualityInspectionRules: QualityInspectionRule[] = [
  {
    id: 'QR-001',
    name: '蜡型阶段质检规则',
    applicableStage: 'wax-up',
    inspectionStage: 'stage-check',
    checkItems: ['QI-004', 'QI-006'],
    isEnabled: true,
    autoGenerate: true,
    description: '蜡型完成后自动触发生成质检任务',
    createdAt: formatDate(daysAgo(30)),
    updatedAt: formatDate(daysAgo(15)),
  },
  {
    id: 'QR-002',
    name: '铸造阶段质检规则',
    applicableStage: 'casting',
    inspectionStage: 'stage-check',
    checkItems: ['QI-005', 'QI-006'],
    isEnabled: true,
    autoGenerate: true,
    description: '铸造完成后检查金属内冠质量',
    createdAt: formatDate(daysAgo(30)),
    updatedAt: formatDate(daysAgo(15)),
  },
  {
    id: 'QR-003',
    name: '烤瓷阶段质检规则',
    applicableStage: 'porcelain',
    inspectionStage: 'stage-check',
    checkItems: ['QI-002', 'QI-004', 'QI-008', 'QI-009'],
    isEnabled: true,
    autoGenerate: false,
    description: '烤瓷堆瓷完成后检查颜色和形态',
    createdAt: formatDate(daysAgo(30)),
    updatedAt: formatDate(daysAgo(15)),
  },
  {
    id: 'QR-004',
    name: '精磨阶段质检规则',
    applicableStage: 'finishing',
    inspectionStage: 'stage-check',
    checkItems: ['QI-001', 'QI-003', 'QI-004', 'QI-007'],
    isEnabled: true,
    autoGenerate: true,
    description: '精磨修整完成后检查边缘、咬合、形态和抛光',
    createdAt: formatDate(daysAgo(30)),
    updatedAt: formatDate(daysAgo(15)),
  },
  {
    id: 'QR-005',
    name: '出厂终检规则',
    applicableStage: 'quality-check',
    inspectionStage: 'final-check',
    checkItems: ['QI-001', 'QI-002', 'QI-003', 'QI-004', 'QI-005', 'QI-007', 'QI-010'],
    isEnabled: true,
    autoGenerate: true,
    description: '出厂前全面质检，所有必检项必须合格',
    createdAt: formatDate(daysAgo(30)),
    updatedAt: formatDate(daysAgo(10)),
  },
]

function createItemResults(
  checkItemIds: string[],
  result: QualityCheckResult,
  inspector: string,
  time: string
): QualityInspectionItemResult[] {
  return checkItemIds.map((id) => {
    const item = MockQualityCheckItems.find((i) => i.id === id)
    return {
      checkItemId: id,
      checkItemName: item?.name || '检查项',
      category: item?.category || 'other',
      result,
      checkedBy: inspector,
      checkedAt: time,
    }
  })
}

export const MockQualityInspections: QualityInspection[] = [
  {
    id: 'QC-20260617-001',
    orderId: 'O20260613005',
    orderNumber: 'DD-20260613-0005',
    clinicName: '明德口腔医院',
    inspectionStage: 'final-check',
    processingStage: 'quality-check',
    status: 'in-progress',
    itemResults: createItemResults(['QI-001', 'QI-002', 'QI-003', 'QI-004', 'QI-005', 'QI-007', 'QI-010'], 'pending', '', ''),
    inspector: '质检员-孙',
    startedAt: formatDate(daysAgo(0)),
    defects: [],
    reworkCount: 0,
    createdAt: formatDate(daysAgo(0)),
    updatedAt: formatDate(daysAgo(0)),
  },
  {
    id: 'QC-20260614-002',
    orderId: 'O20260614004',
    orderNumber: 'DD-20260614-0004',
    clinicName: '仁和口腔门诊部',
    inspectionStage: 'stage-check',
    processingStage: 'finishing',
    status: 'completed',
    overallResult: 'pass',
    itemResults: [
      ...createItemResults(['QI-001', 'QI-003', 'QI-007'], 'pass', '质检员-孙', formatDate(daysAgo(3))),
      {
        checkItemId: 'QI-004',
        checkItemName: '修复体形态',
        category: 'shape',
        result: 'pass',
        remark: '邻接略紧，已调整',
        checkedBy: '质检员-孙',
        checkedAt: formatDate(daysAgo(3)),
      },
    ],
    inspector: '质检员-孙',
    startedAt: formatDate(daysAgo(3)),
    completedAt: formatDate(daysAgo(3)),
    defects: [],
    reworkCount: 0,
    createdAt: formatDate(daysAgo(3)),
    updatedAt: formatDate(daysAgo(3)),
  },
  {
    id: 'QC-20260612-003',
    orderId: 'O20260612001',
    orderNumber: 'DD-20260612-0006',
    clinicName: '康健牙科诊所',
    inspectionStage: 'final-check',
    processingStage: 'quality-check',
    status: 'released',
    overallResult: 'recheck-pass',
    itemResults: [
      {
        checkItemId: 'QI-001',
        checkItemName: '边缘密合度检查',
        category: 'edge-fit',
        result: 'recheck-pass',
        remark: '初次检查间隙75μm，返工后复检间隙35μm，合格',
        checkedBy: '质检员-王',
        checkedAt: formatDate(daysAgo(2)),
      },
      ...createItemResults(['QI-002', 'QI-003', 'QI-004', 'QI-005', 'QI-007', 'QI-010'], 'pass', '质检员-王', formatDate(daysAgo(2))),
    ],
    inspector: '质检员-王',
    startedAt: formatDate(daysAgo(5)),
    completedAt: formatDate(daysAgo(2)),
    releasedAt: formatDate(daysAgo(2)),
    releasedBy: '质检主管-李',
    defects: [
      {
        id: 'D-001',
        inspectionId: 'QC-20260612-003',
        orderId: 'O20260612001',
        orderNumber: 'DD-20260612-0006',
        problemType: 'edge-misfit',
        problemDescription: '16号牙冠边缘不密合，肩台间隙约75μm，超过标准50μm',
        defectCategory: 'edge-fit',
        severity: 'major',
        relatedTeeth: ['16'],
        responsibleTechnician: '刘师傅',
        responsibleDepartment: 'finishing-tech',
        rootCause: 'technician-error',
        correctiveAction: '重新制作内冠，使用高精度扫描仪确认肩台数据，加强边缘修整',
        reworkDeadline: formatDate(daysAgo(1)).split('T')[0],
        reworkRecordId: 'R001',
        recheckResult: 'pass',
        recheckNote: '返工后边缘间隙约35μm，符合标准',
        recheckBy: '质检员-王',
        recheckAt: formatDate(daysAgo(2)),
        registeredBy: '质检员-王',
        registeredAt: formatDate(daysAgo(5)),
      },
    ],
    reworkCount: 1,
    notes: '初次质检不合格，返工后复检通过',
    createdAt: formatDate(daysAgo(5)),
    updatedAt: formatDate(daysAgo(2)),
  },
  {
    id: 'QC-20260616-004',
    orderId: 'O20260616002',
    orderNumber: 'DD-20260616-0002',
    clinicName: '康健牙科诊所',
    inspectionStage: 'stage-check',
    processingStage: 'porcelain',
    status: 'completed',
    overallResult: 'pass',
    itemResults: createItemResults(['QI-002', 'QI-004', 'QI-008'], 'pass', '质检员-孙', formatDate(daysAgo(1))),
    inspector: '质检员-孙',
    startedAt: formatDate(daysAgo(1)),
    completedAt: formatDate(daysAgo(1)),
    defects: [],
    reworkCount: 0,
    createdAt: formatDate(daysAgo(1)),
    updatedAt: formatDate(daysAgo(1)),
  },
  {
    id: 'QC-20260610-005',
    orderId: 'O20260610007',
    orderNumber: 'DD-20260610-0007',
    clinicName: '华美齿科中心',
    inspectionStage: 'final-check',
    processingStage: 'quality-check',
    status: 'released',
    overallResult: 'pass',
    itemResults: createItemResults(['QI-001', 'QI-002', 'QI-003', 'QI-004', 'QI-005', 'QI-007', 'QI-010'], 'pass', '质检员-王', formatDate(daysAgo(7))),
    inspector: '质检员-王',
    startedAt: formatDate(daysAgo(7)),
    completedAt: formatDate(daysAgo(7)),
    releasedAt: formatDate(daysAgo(7)),
    releasedBy: '质检主管-李',
    defects: [],
    reworkCount: 0,
    createdAt: formatDate(daysAgo(7)),
    updatedAt: formatDate(daysAgo(7)),
  },
  {
    id: 'QC-20260617-006',
    orderId: 'O20260617001',
    orderNumber: 'DD-20260617-0001',
    clinicName: '明德口腔医院',
    inspectionStage: 'stage-check',
    processingStage: 'wax-up',
    status: 'pending',
    itemResults: createItemResults(['QI-004', 'QI-006'], 'pending', '', ''),
    defects: [],
    reworkCount: 0,
    createdAt: formatDate(daysAgo(0)),
    updatedAt: formatDate(daysAgo(0)),
  },
]

export const getQualityCheckItemsByStage = (stage: ProcessingStage): QualityCheckItem[] => {
  return MockQualityCheckItems.filter((item) => item.applicableStages.includes(stage))
}

export const getQualityInspectionsByOrderId = (orderId: string): QualityInspection[] => {
  return MockQualityInspections.filter((q) => q.orderId === orderId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export const getAllQualityInspections = (): QualityInspection[] => {
  return [...MockQualityInspections].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}

export const generateInspectionId = (): string => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const seq = String(MockQualityInspections.length + 1).padStart(3, '0')
  return `QC-${year}${month}${day}-${seq}`
}

export const generateDefectId = (): string => {
  return `D-${Date.now()}`
}
