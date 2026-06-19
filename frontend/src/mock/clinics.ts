import type { Clinic, Doctor } from '../types'
import type { CooperationStatus, SettlementMethod } from '../types'

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0] + 'T' + date.toTimeString().split(' ')[0]
}

const today = new Date()
const daysAgo = (n: number) => new Date(today.getTime() - n * 86400000)

export const MockDoctors: Record<string, Doctor[]> = {
  C001: [
    { id: 'D001', name: '李明华', title: '主任医师', phone: '13800138001', specialty: '口腔修复', isPrimary: true },
    { id: 'D002', name: '赵文博', title: '副主任医师', phone: '13800138002', specialty: '口腔种植' },
    { id: 'D003', name: '孙晓燕', title: '主治医师', phone: '13800138003', specialty: '口腔正畸' },
  ],
  C002: [
    { id: 'D004', name: '王雅芳', title: '主任医师', phone: '13800138004', specialty: '口腔修复', isPrimary: true },
    { id: 'D005', name: '周建国', title: '主治医师', phone: '13800138005', specialty: '口腔内科' },
  ],
  C003: [
    { id: 'D006', name: '张伟强', title: '副主任医师', phone: '13800138006', specialty: '口腔美学修复', isPrimary: true },
    { id: 'D007', name: '林美玲', title: '主治医师', phone: '13800138007', specialty: '牙周治疗' },
    { id: 'D008', name: '黄志强', title: '医师', phone: '13800138008', specialty: '口腔外科' },
  ],
  C004: [
    { id: 'D009', name: '陈秀英', title: '主任医师', phone: '13800138009', specialty: '口腔修复', isPrimary: true },
    { id: 'D010', name: '刘海峰', title: '副主任医师', phone: '13800138010', specialty: '口腔种植' },
  ],
}

export const MockClinics: Clinic[] = [
  {
    id: 'C001',
    name: '明德口腔医院',
    clinicCode: 'MDE-001',
    contactPerson: '李明华',
    phone: '010-8888-0001',
    address: '北京市朝阳区建国路88号SOHO现代城A座',
    cooperationStatus: 'active',
    settlementMethod: 'monthly',
    paymentTermDays: 30,
    doctors: MockDoctors.C001,
    remarks: '三甲医院合作单位，月单量稳定，要求较高，优先排产',
    stats: { totalOrders: 156, reworkRate: 2.56, totalAmount: 685400 },
    createdAt: formatDate(daysAgo(365)),
    updatedAt: formatDate(daysAgo(2)),
  },
  {
    id: 'C002',
    name: '康健牙科诊所',
    clinicCode: 'KJD-002',
    contactPerson: '王雅芳',
    phone: '021-6666-0002',
    address: '上海市徐汇区淮海中路168号2楼',
    cooperationStatus: 'active',
    settlementMethod: 'weekly',
    paymentTermDays: 7,
    doctors: MockDoctors.C002,
    remarks: '连锁诊所，周结，对账及时',
    stats: { totalOrders: 89, reworkRate: 4.49, totalAmount: 389200 },
    createdAt: formatDate(daysAgo(280)),
    updatedAt: formatDate(daysAgo(5)),
  },
  {
    id: 'C003',
    name: '华美齿科中心',
    clinicCode: 'HMC-003',
    contactPerson: '张伟强',
    phone: '020-7777-0003',
    address: '广州市天河区体育西路256号维多利广场B座15楼',
    cooperationStatus: 'active',
    settlementMethod: 'monthly',
    paymentTermDays: 45,
    doctors: MockDoctors.C003,
    remarks: '高端美学修复为主，材料要求高，金额大',
    stats: { totalOrders: 234, reworkRate: 1.28, totalAmount: 1256800 },
    createdAt: formatDate(daysAgo(500)),
    updatedAt: formatDate(daysAgo(1)),
  },
  {
    id: 'C004',
    name: '仁和口腔门诊部',
    clinicCode: 'RHO-004',
    contactPerson: '陈秀英',
    phone: '0755-9999-0004',
    address: '深圳市福田区深南大道6018号招商银行大厦22层',
    cooperationStatus: 'pending',
    settlementMethod: 'per-order',
    paymentTermDays: 0,
    doctors: MockDoctors.C004,
    remarks: '新合作诊所，首次合作按单次结算，观察质量后再转月结',
    stats: { totalOrders: 12, reworkRate: 0, totalAmount: 52800 },
    createdAt: formatDate(daysAgo(30)),
    updatedAt: formatDate(daysAgo(0)),
  },
  {
    id: 'C005',
    name: '悦齿口腔连锁',
    clinicCode: 'YTC-005',
    contactPerson: '刘梦琪',
    phone: '0571-8888-0005',
    address: '杭州市西湖区文三路478号华星时代广场C座',
    cooperationStatus: 'suspended',
    settlementMethod: 'monthly',
    paymentTermDays: 30,
    doctors: [
      { id: 'D011', name: '刘梦琪', title: '主任医师', phone: '13800138011', specialty: '口腔综合', isPrimary: true },
      { id: 'D012', name: '郑浩然', title: '主治医师', phone: '13800138012', specialty: '儿童牙科' },
    ],
    remarks: '近期内部整顿，暂停接单，预计下月恢复合作',
    stats: { totalOrders: 67, reworkRate: 5.97, totalAmount: 278600 },
    createdAt: formatDate(daysAgo(200)),
    updatedAt: formatDate(daysAgo(15)),
  },
  {
    id: 'C006',
    name: '博瑞口腔医院',
    clinicCode: 'BRC-006',
    contactPerson: '徐晓东',
    phone: '028-6666-0006',
    address: '成都市锦江区红星路三段99号银石广场',
    cooperationStatus: 'inactive',
    settlementMethod: 'quarterly',
    paymentTermDays: 90,
    doctors: [
      { id: 'D013', name: '徐晓东', title: '副主任医师', phone: '13800138013', specialty: '口腔修复', isPrimary: true },
    ],
    remarks: '账期过长，已终止合作，待结算尾款',
    stats: { totalOrders: 23, reworkRate: 8.70, totalAmount: 95200 },
    createdAt: formatDate(daysAgo(600)),
    updatedAt: formatDate(daysAgo(120)),
  },
]

export function getClinicById(id: string): Clinic | undefined {
  return MockClinics.find((c) => c.id === id)
}

export function getClinicsByStatus(status: CooperationStatus): Clinic[] {
  return MockClinics.filter((c) => c.cooperationStatus === status)
}
