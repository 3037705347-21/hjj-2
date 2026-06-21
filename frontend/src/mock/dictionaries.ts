import type { DictionaryItem, DictionaryCategory } from '../types'

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0] + 'T' + date.toTimeString().split(' ')[0]
}

const now = formatDate(new Date())

function createDictItem(
  id: string,
  category: DictionaryCategory,
  code: string,
  name: string,
  sortOrder: number,
  options: Partial<DictionaryItem> = {}
): DictionaryItem {
  return {
    id,
    category,
    code,
    name,
    sortOrder,
    enabled: true,
    isSystemBuiltin: true,
    createdAt: now,
    updatedAt: now,
    ...options,
  }
}

export const MockDictionaryItems: DictionaryItem[] = [
  // 修复类型
  createDictItem('DT-RT-001', 'restoration_type', 'crown', '单冠', 1),
  createDictItem('DT-RT-002', 'restoration_type', 'bridge', '固定桥', 2),
  createDictItem('DT-RT-003', 'restoration_type', 'veneer', '贴面', 3),
  createDictItem('DT-RT-004', 'restoration_type', 'inlay', '嵌体', 4),
  createDictItem('DT-RT-005', 'restoration_type', 'onlay', '高嵌体', 5),
  createDictItem('DT-RT-006', 'restoration_type', 'implant-crown', '种植冠', 6),
  createDictItem('DT-RT-007', 'restoration_type', 'partial-denture', '活动义齿', 7),
  createDictItem('DT-RT-008', 'restoration_type', 'full-denture', '全口义齿', 8),
  createDictItem('DT-RT-009', 'restoration_type', 'orthodontic-appliance', '正畸矫治器', 9),

  // 材料类型
  createDictItem('DT-MT-001', 'material_type', 'zirconia', '氧化锆', 1),
  createDictItem('DT-MT-002', 'material_type', 'emax', 'E.MAX铸瓷', 2),
  createDictItem('DT-MT-003', 'material_type', 'pfm', '烤瓷熔附金属', 3),
  createDictItem('DT-MT-004', 'material_type', 'full-metal', '全金属', 4),
  createDictItem('DT-MT-005', 'material_type', 'composite', '复合树脂', 5),
  createDictItem('DT-MT-006', 'material_type', 'acrylic', '亚克力', 6),
  createDictItem('DT-MT-007', 'material_type', 'peek', 'PEEK高分子', 7),
  createDictItem('DT-MT-008', 'material_type', 'titanium', '纯钛', 8),

  // 比色
  createDictItem('DT-SG-001', 'shade_guide', 'A1', 'A1', 1),
  createDictItem('DT-SG-002', 'shade_guide', 'A2', 'A2', 2),
  createDictItem('DT-SG-003', 'shade_guide', 'A3', 'A3', 3),
  createDictItem('DT-SG-004', 'shade_guide', 'A3.5', 'A3.5', 4),
  createDictItem('DT-SG-005', 'shade_guide', 'A4', 'A4', 5),
  createDictItem('DT-SG-006', 'shade_guide', 'B1', 'B1', 6),
  createDictItem('DT-SG-007', 'shade_guide', 'B2', 'B2', 7),
  createDictItem('DT-SG-008', 'shade_guide', 'B3', 'B3', 8),
  createDictItem('DT-SG-009', 'shade_guide', 'B4', 'B4', 9),
  createDictItem('DT-SG-010', 'shade_guide', 'C1', 'C1', 10),
  createDictItem('DT-SG-011', 'shade_guide', 'C2', 'C2', 11),
  createDictItem('DT-SG-012', 'shade_guide', 'C3', 'C3', 12),
  createDictItem('DT-SG-013', 'shade_guide', 'C4', 'C4', 13),
  createDictItem('DT-SG-014', 'shade_guide', 'D2', 'D2', 14),
  createDictItem('DT-SG-015', 'shade_guide', 'D3', 'D3', 15),
  createDictItem('DT-SG-016', 'shade_guide', 'D4', 'D4', 16),

  // 取模方式
  createDictItem('DT-IM-001', 'impression_method', 'digital-scan', '数字化扫描', 1),
  createDictItem('DT-IM-002', 'impression_method', 'traditional-alginate', '藻酸盐取模', 2),
  createDictItem('DT-IM-003', 'impression_method', 'traditional-silicone', '硅橡胶取模', 3),
  createDictItem('DT-IM-004', 'impression_method', 'dual-arch-tray', '双颌托盘取模', 4),

  // 加工阶段
  createDictItem('DT-PS-001', 'processing_stage', 'received', '订单接收', 1, { extra: { description: '订单已收到，正在审核', estimatedDurationDays: 0 } }),
  createDictItem('DT-PS-002', 'processing_stage', 'model-scanning', '模型扫描', 2, { extra: { description: '扫描石膏模型或处理数字印模', estimatedDurationDays: 1 } }),
  createDictItem('DT-PS-003', 'processing_stage', 'wax-up', '蜡型制作', 3, { extra: { description: '制作蜡型、设计修复体形态', estimatedDurationDays: 1 } }),
  createDictItem('DT-PS-004', 'processing_stage', 'casting', '铸造/切削', 4, { extra: { description: '金属铸造或氧化锆/瓷块切削', estimatedDurationDays: 1 } }),
  createDictItem('DT-PS-005', 'processing_stage', 'porcelain', '烤瓷堆瓷', 5, { extra: { description: '烤瓷牙体外形构建与上色', estimatedDurationDays: 2 } }),
  createDictItem('DT-PS-006', 'processing_stage', 'glazing', '上釉烧结', 6, { extra: { description: '修复体上釉与最终烧结', estimatedDurationDays: 1 } }),
  createDictItem('DT-PS-007', 'processing_stage', 'finishing', '精磨修整', 7, { extra: { description: '精细打磨、咬合调整、抛光', estimatedDurationDays: 1 } }),
  createDictItem('DT-PS-008', 'processing_stage', 'quality-check', '质检审核', 8, { extra: { description: '质量检查、咬合验证、颜色确认', estimatedDurationDays: 0 } }),
  createDictItem('DT-PS-009', 'processing_stage', 'shipped', '已发货', 9, { extra: { description: '修复体已寄出', estimatedDurationDays: 1 } }),
  createDictItem('DT-PS-010', 'processing_stage', 'delivered', '已送达', 10, { extra: { description: '诊所已签收', estimatedDurationDays: 0 } }),

  // 优先级
  createDictItem('DT-PR-001', 'priority', 'standard', '常规', 1, { color: 'bg-slate-50 text-slate-700 border-slate-200' }),
  createDictItem('DT-PR-002', 'priority', 'urgent', '加急', 2, { color: 'bg-amber-50 text-amber-700 border-amber-200' }),
  createDictItem('DT-PR-003', 'priority', 'stat', '特急', 3, { color: 'bg-rose-50 text-rose-700 border-rose-200' }),

  // 订单状态
  createDictItem('DT-OS-001', 'order_status', 'pending', '待开始', 1, { color: 'bg-slate-50 text-slate-600 border-slate-200' }),
  createDictItem('DT-OS-002', 'order_status', 'in-progress', '加工中', 2, { color: 'bg-blue-50 text-blue-700 border-blue-200' }),
  createDictItem('DT-OS-003', 'order_status', 'completed', '已完成', 3, { color: 'bg-emerald-50 text-emerald-700 border-emerald-200' }),
  createDictItem('DT-OS-004', 'order_status', 'on-hold', '已暂停', 4, { color: 'bg-amber-50 text-amber-700 border-amber-200' }),
  createDictItem('DT-OS-005', 'order_status', 'returned', '已返工', 5, { color: 'bg-rose-50 text-rose-700 border-rose-200' }),

  // 返工状态
  createDictItem('DT-RS-001', 'rework_status', 'initiated', '待受理', 1, { color: 'bg-amber-50 text-amber-700 border-amber-200' }),
  createDictItem('DT-RS-002', 'rework_status', 'accepted', '已受理', 2, { color: 'bg-blue-50 text-blue-700 border-blue-200' }),
  createDictItem('DT-RS-003', 'rework_status', 'rectifying', '整改中', 3, { color: 'bg-orange-50 text-orange-700 border-orange-200' }),
  createDictItem('DT-RS-004', 'rework_status', 'rechecking', '复检中', 4, { color: 'bg-violet-50 text-violet-700 border-violet-200' }),
  createDictItem('DT-RS-005', 'rework_status', 'closed', '已关闭', 5, { color: 'bg-emerald-50 text-emerald-700 border-emerald-200' }),

  // 返工问题类型
  createDictItem('DT-RPT-001', 'rework_problem_type', 'edge-misfit', '边缘不密合', 1),
  createDictItem('DT-RPT-002', 'rework_problem_type', 'color-mismatch', '颜色偏差', 2),
  createDictItem('DT-RPT-003', 'rework_problem_type', 'occlusion-issue', '咬合问题', 3),
  createDictItem('DT-RPT-004', 'rework_problem_type', 'shape-error', '形态错误', 4),
  createDictItem('DT-RPT-005', 'rework_problem_type', 'material-defect', '材料缺陷', 5),
  createDictItem('DT-RPT-006', 'rework_problem_type', 'design-error', '设计失误', 6),
  createDictItem('DT-RPT-007', 'rework_problem_type', 'other', '其他问题', 7),

  // 返工根本原因
  createDictItem('DT-RRC-001', 'rework_root_cause', 'technician-error', '技师操作失误', 1),
  createDictItem('DT-RRC-002', 'rework_root_cause', 'material-issue', '材料质量问题', 2),
  createDictItem('DT-RRC-003', 'rework_root_cause', 'equipment-problem', '设备故障', 3),
  createDictItem('DT-RRC-004', 'rework_root_cause', 'design-flaw', '设计缺陷', 4),
  createDictItem('DT-RRC-005', 'rework_root_cause', 'impression-quality', '印模/扫描质量差', 5),
  createDictItem('DT-RRC-006', 'rework_root_cause', 'clinic-requirement-change', '诊所需求变更', 6),
  createDictItem('DT-RRC-007', 'rework_root_cause', 'other', '其他原因', 7),

  // 返工责任方
  createDictItem('DT-RR-001', 'rework_responsibility', 'modeling-tech', '扫描/模型技师', 1),
  createDictItem('DT-RR-002', 'rework_responsibility', 'wax-tech', '蜡型技师', 2),
  createDictItem('DT-RR-003', 'rework_responsibility', 'casting-tech', '铸造/切削技师', 3),
  createDictItem('DT-RR-004', 'rework_responsibility', 'porcelain-tech', '烤瓷技师', 4),
  createDictItem('DT-RR-005', 'rework_responsibility', 'glazing-tech', '上釉技师', 5),
  createDictItem('DT-RR-006', 'rework_responsibility', 'finishing-tech', '精磨技师', 6),
  createDictItem('DT-RR-007', 'rework_responsibility', 'qc-personnel', '质检人员', 7),
  createDictItem('DT-RR-008', 'rework_responsibility', 'design-department', '设计部门', 8),
  createDictItem('DT-RR-009', 'rework_responsibility', 'other', '其他', 9),

  // 返工来源阶段
  createDictItem('DT-RSS-001', 'rework_source_stage', 'model-scanning', '模型扫描', 1),
  createDictItem('DT-RSS-002', 'rework_source_stage', 'wax-up', '蜡型制作', 2),
  createDictItem('DT-RSS-003', 'rework_source_stage', 'casting', '铸造/切削', 3),
  createDictItem('DT-RSS-004', 'rework_source_stage', 'porcelain', '烤瓷堆瓷', 4),
  createDictItem('DT-RSS-005', 'rework_source_stage', 'glazing', '上釉烧结', 5),
  createDictItem('DT-RSS-006', 'rework_source_stage', 'finishing', '精磨修整', 6),
  createDictItem('DT-RSS-007', 'rework_source_stage', 'quality-check', '质检审核', 7),
  createDictItem('DT-RSS-008', 'rework_source_stage', 'clinic-return', '诊所退回', 8),

  // 技师技能
  createDictItem('DT-TS-001', 'technician_skill', 'model-scanning', '模型扫描', 1, { color: 'bg-cyan-50 text-cyan-700 border-cyan-200' }),
  createDictItem('DT-TS-002', 'technician_skill', 'wax-up', '蜡型制作', 2, { color: 'bg-amber-50 text-amber-700 border-amber-200' }),
  createDictItem('DT-TS-003', 'technician_skill', 'casting', '铸造/切削', 3, { color: 'bg-orange-50 text-orange-700 border-orange-200' }),
  createDictItem('DT-TS-004', 'technician_skill', 'porcelain', '烤瓷堆瓷', 4, { color: 'bg-rose-50 text-rose-700 border-rose-200' }),
  createDictItem('DT-TS-005', 'technician_skill', 'glazing', '上釉烧结', 5, { color: 'bg-pink-50 text-pink-700 border-pink-200' }),
  createDictItem('DT-TS-006', 'technician_skill', 'finishing', '精磨修整', 6, { color: 'bg-teal-50 text-teal-700 border-teal-200' }),
  createDictItem('DT-TS-007', 'technician_skill', 'quality-check', '质检审核', 7, { color: 'bg-emerald-50 text-emerald-700 border-emerald-200' }),
  createDictItem('DT-TS-008', 'technician_skill', 'design', '数字化设计', 8, { color: 'bg-violet-50 text-violet-700 border-violet-200' }),
  createDictItem('DT-TS-009', 'technician_skill', 'implant', '种植修复', 9, { color: 'bg-indigo-50 text-indigo-700 border-indigo-200' }),
  createDictItem('DT-TS-010', 'technician_skill', 'orthodontics', '正畸矫治', 10, { color: 'bg-sky-50 text-sky-700 border-sky-200' }),

  // 技师状态
  createDictItem('DT-TST-001', 'technician_status', 'on-duty', '在岗', 1, { color: 'bg-emerald-50 text-emerald-700 border-emerald-200' }),
  createDictItem('DT-TST-002', 'technician_status', 'off-duty', '下班', 2, { color: 'bg-slate-50 text-slate-600 border-slate-200' }),
  createDictItem('DT-TST-003', 'technician_status', 'leave', '请假', 3, { color: 'bg-amber-50 text-amber-700 border-amber-200' }),
  createDictItem('DT-TST-004', 'technician_status', 'busy', '繁忙', 4, { color: 'bg-rose-50 text-rose-700 border-rose-200' }),

  // 任务状态
  createDictItem('DT-TA-001', 'task_status', 'pending', '待分配', 1, { color: 'bg-slate-50 text-slate-600 border-slate-200' }),
  createDictItem('DT-TA-002', 'task_status', 'assigned', '已分配', 2, { color: 'bg-blue-50 text-blue-700 border-blue-200' }),
  createDictItem('DT-TA-003', 'task_status', 'accepted', '已接单', 3, { color: 'bg-cyan-50 text-cyan-700 border-cyan-200' }),
  createDictItem('DT-TA-004', 'task_status', 'in-progress', '处理中', 4, { color: 'bg-indigo-50 text-indigo-700 border-indigo-200' }),
  createDictItem('DT-TA-005', 'task_status', 'paused', '已暂停', 5, { color: 'bg-amber-50 text-amber-700 border-amber-200' }),
  createDictItem('DT-TA-006', 'task_status', 'completed', '已完成', 6, { color: 'bg-emerald-50 text-emerald-700 border-emerald-200' }),
  createDictItem('DT-TA-007', 'task_status', 'transferred', '已转派', 7, { color: 'bg-violet-50 text-violet-700 border-violet-200' }),
  createDictItem('DT-TA-008', 'task_status', 'exception', '异常', 8, { color: 'bg-rose-50 text-rose-700 border-rose-200' }),

  // 任务优先级
  createDictItem('DT-TP-001', 'task_priority', 'low', '低', 1, { color: 'bg-slate-50 text-slate-600 border-slate-200' }),
  createDictItem('DT-TP-002', 'task_priority', 'normal', '普通', 2, { color: 'bg-blue-50 text-blue-700 border-blue-200' }),
  createDictItem('DT-TP-003', 'task_priority', 'high', '高', 3, { color: 'bg-orange-50 text-orange-700 border-orange-200' }),
  createDictItem('DT-TP-004', 'task_priority', 'urgent', '紧急', 4, { color: 'bg-rose-50 text-rose-700 border-rose-200' }),

  // 异常类型
  createDictItem('DT-ET-001', 'exception_type', 'material-shortage', '材料不足', 1),
  createDictItem('DT-ET-002', 'exception_type', 'equipment-failure', '设备故障', 2),
  createDictItem('DT-ET-003', 'exception_type', 'skill-gap', '技能不足', 3),
  createDictItem('DT-ET-004', 'exception_type', 'quality-issue', '质量问题', 4),
  createDictItem('DT-ET-005', 'exception_type', 'other', '其他异常', 5),

  // 物流类型
  createDictItem('DT-LT-001', 'logistics_type', 'receive', '收件登记', 1),
  createDictItem('DT-LT-002', 'logistics_type', 'ship', '成品发货', 2),

  // 签收状态
  createDictItem('DT-SS-001', 'sign_status', 'pending', '待发货', 1, { color: 'bg-slate-50 text-slate-600 border-slate-200' }),
  createDictItem('DT-SS-002', 'sign_status', 'in-transit', '运输中', 2, { color: 'bg-blue-50 text-blue-600 border-blue-200' }),
  createDictItem('DT-SS-003', 'sign_status', 'signed', '已签收', 3, { color: 'bg-emerald-50 text-emerald-600 border-emerald-200' }),
  createDictItem('DT-SS-004', 'sign_status', 'exception', '异常', 4, { color: 'bg-rose-50 text-rose-600 border-rose-200' }),

  // 物流异常类型
  createDictItem('DT-LET-001', 'logistics_exception_type', 'returned', '退回', 1),
  createDictItem('DT-LET-002', 'logistics_exception_type', 'lost', '丢件', 2),
  createDictItem('DT-LET-003', 'logistics_exception_type', 'damaged', '破损', 3),
  createDictItem('DT-LET-004', 'logistics_exception_type', 'delayed', '延误', 4),
  createDictItem('DT-LET-005', 'logistics_exception_type', 'address-error', '地址错误', 5),
  createDictItem('DT-LET-006', 'logistics_exception_type', 'refused', '拒收', 6),
  createDictItem('DT-LET-007', 'logistics_exception_type', 'other', '其他', 7),

  // 发货方式
  createDictItem('DT-SM-001', 'shipping_method', 'sf-express', '顺丰速运', 1),
  createDictItem('DT-SM-002', 'shipping_method', 'jd-express', '京东物流', 2),
  createDictItem('DT-SM-003', 'shipping_method', 'sto-express', '申通快递', 3),
  createDictItem('DT-SM-004', 'shipping_method', 'yunda-express', '韵达快递', 4),
  createDictItem('DT-SM-005', 'shipping_method', 'zto-express', '中通快递', 5),
  createDictItem('DT-SM-006', 'shipping_method', 'ems', 'EMS', 6),
  createDictItem('DT-SM-007', 'shipping_method', 'other', '其他', 7),

  // 合作状态
  createDictItem('DT-CS-001', 'cooperation_status', 'active', '合作中', 1, { color: 'bg-emerald-50 text-emerald-700 border-emerald-200' }),
  createDictItem('DT-CS-002', 'cooperation_status', 'inactive', '已终止', 2, { color: 'bg-slate-50 text-slate-600 border-slate-200' }),
  createDictItem('DT-CS-003', 'cooperation_status', 'pending', '待审核', 3, { color: 'bg-amber-50 text-amber-700 border-amber-200' }),
  createDictItem('DT-CS-004', 'cooperation_status', 'suspended', '已暂停', 4, { color: 'bg-rose-50 text-rose-700 border-rose-200' }),

  // 结算方式
  createDictItem('DT-SET-001', 'settlement_method', 'monthly', '月结', 1),
  createDictItem('DT-SET-002', 'settlement_method', 'weekly', '周结', 2),
  createDictItem('DT-SET-003', 'settlement_method', 'per-order', '单次结算', 3),
  createDictItem('DT-SET-004', 'settlement_method', 'quarterly', '季结', 4),
  createDictItem('DT-SET-005', 'settlement_method', 'prepaid', '预充值', 5),

  // 附件分类
  createDictItem('DT-AC-001', 'attachment_category', 'intraoral-scan', '口扫文件', 1, { color: 'bg-cyan-50 text-cyan-700 border-cyan-200' }),
  createDictItem('DT-AC-002', 'attachment_category', 'prescription-photo', '处方单照片', 2, { color: 'bg-emerald-50 text-emerald-700 border-emerald-200' }),
  createDictItem('DT-AC-003', 'attachment_category', 'facial-photo', '面像照片', 3, { color: 'bg-pink-50 text-pink-700 border-pink-200' }),
  createDictItem('DT-AC-004', 'attachment_category', 'design-draft', '设计稿', 4, { color: 'bg-violet-50 text-violet-700 border-violet-200' }),
  createDictItem('DT-AC-005', 'attachment_category', 'logistics-receipt', '物流回单', 5, { color: 'bg-amber-50 text-amber-700 border-amber-200' }),
  createDictItem('DT-AC-006', 'attachment_category', 'quality-report', '质检报告', 6, { color: 'bg-teal-50 text-teal-700 border-teal-200' }),
  createDictItem('DT-AC-007', 'attachment_category', 'rework-document', '返工单据', 7, { color: 'bg-rose-50 text-rose-700 border-rose-200' }),
  createDictItem('DT-AC-008', 'attachment_category', 'other-document', '其他文档', 8, { color: 'bg-slate-50 text-slate-700 border-slate-200' }),

  // 附件文件类型
  createDictItem('DT-AFT-001', 'attachment_file_type', 'image', '图片', 1, { color: 'bg-pink-50 text-pink-700 border-pink-200' }),
  createDictItem('DT-AFT-002', 'attachment_file_type', 'pdf', 'PDF文档', 2, { color: 'bg-red-50 text-red-700 border-red-200' }),
  createDictItem('DT-AFT-003', 'attachment_file_type', 'doc', 'Word文档', 3, { color: 'bg-blue-50 text-blue-700 border-blue-200' }),
  createDictItem('DT-AFT-004', 'attachment_file_type', 'excel', 'Excel表格', 4, { color: 'bg-emerald-50 text-emerald-700 border-emerald-200' }),
  createDictItem('DT-AFT-005', 'attachment_file_type', 'stl', '3D模型(STL)', 5, { color: 'bg-violet-50 text-violet-700 border-violet-200' }),
  createDictItem('DT-AFT-006', 'attachment_file_type', 'zip', '压缩包', 6, { color: 'bg-amber-50 text-amber-700 border-amber-200' }),
  createDictItem('DT-AFT-007', 'attachment_file_type', 'other', '其他', 7, { color: 'bg-slate-50 text-slate-700 border-slate-200' }),

  // 附件关联模块
  createDictItem('DT-ARM-001', 'attachment_related_module', 'order', '订单', 1, { color: 'bg-blue-50 text-blue-700 border-blue-200' }),
  createDictItem('DT-ARM-002', 'attachment_related_module', 'rework', '返工', 2, { color: 'bg-rose-50 text-rose-700 border-rose-200' }),
  createDictItem('DT-ARM-003', 'attachment_related_module', 'quality', '质检', 3, { color: 'bg-teal-50 text-teal-700 border-teal-200' }),
  createDictItem('DT-ARM-004', 'attachment_related_module', 'logistics', '物流', 4, { color: 'bg-amber-50 text-amber-700 border-amber-200' }),

  // 沟通类型
  createDictItem('DT-CT-001', 'communication_type', 'clinic-message', '诊所留言', 1, { color: 'bg-blue-50 text-blue-700 border-blue-200' }),
  createDictItem('DT-CT-002', 'communication_type', 'internal-note', '内部备注', 2, { color: 'bg-slate-50 text-slate-700 border-slate-200' }),
  createDictItem('DT-CT-003', 'communication_type', 'phone-summary', '电话纪要', 3, { color: 'bg-indigo-50 text-indigo-700 border-indigo-200' }),
  createDictItem('DT-CT-004', 'communication_type', 'rework-communication', '返工沟通', 4, { color: 'bg-rose-50 text-rose-700 border-rose-200' }),
  createDictItem('DT-CT-005', 'communication_type', 'delivery-confirmation', '交付确认', 5, { color: 'bg-teal-50 text-teal-700 border-teal-200' }),
  createDictItem('DT-CT-006', 'communication_type', 'system-notice', '系统通知', 6, { color: 'bg-amber-50 text-amber-700 border-amber-200' }),

  // 质检阶段
  createDictItem('DT-QIS-001', 'quality_inspection_stage', 'stage-check', '阶段质检', 1, { color: 'bg-blue-50 text-blue-700 border-blue-200' }),
  createDictItem('DT-QIS-002', 'quality_inspection_stage', 'final-check', '出厂终检', 2, { color: 'bg-violet-50 text-violet-700 border-violet-200' }),

  // 质检结果
  createDictItem('DT-QCR-001', 'quality_check_result', 'pending', '待检查', 1, { color: 'bg-slate-50 text-slate-600 border-slate-200' }),
  createDictItem('DT-QCR-002', 'quality_check_result', 'pass', '合格', 2, { color: 'bg-emerald-50 text-emerald-700 border-emerald-200' }),
  createDictItem('DT-QCR-003', 'quality_check_result', 'fail', '不合格', 3, { color: 'bg-rose-50 text-rose-700 border-rose-200' }),
  createDictItem('DT-QCR-004', 'quality_check_result', 'recheck-pass', '复检合格', 4, { color: 'bg-teal-50 text-teal-700 border-teal-200' }),
  createDictItem('DT-QCR-005', 'quality_check_result', 'recheck-fail', '复检不合格', 5, { color: 'bg-orange-50 text-orange-700 border-orange-200' }),

  // 质检状态
  createDictItem('DT-QIST-001', 'quality_inspection_status', 'pending', '待质检', 1, { color: 'bg-slate-50 text-slate-600 border-slate-200' }),
  createDictItem('DT-QIST-002', 'quality_inspection_status', 'in-progress', '质检中', 2, { color: 'bg-blue-50 text-blue-700 border-blue-200' }),
  createDictItem('DT-QIST-003', 'quality_inspection_status', 'completed', '质检完成', 3, { color: 'bg-emerald-50 text-emerald-700 border-emerald-200' }),
  createDictItem('DT-QIST-004', 'quality_inspection_status', 'rejected', '质检不合格', 4, { color: 'bg-rose-50 text-rose-700 border-rose-200' }),
  createDictItem('DT-QIST-005', 'quality_inspection_status', 'reworking', '整改中', 5, { color: 'bg-orange-50 text-orange-700 border-orange-200' }),
  createDictItem('DT-QIST-006', 'quality_inspection_status', 'rechecking', '复检中', 6, { color: 'bg-amber-50 text-amber-700 border-amber-200' }),
  createDictItem('DT-QIST-007', 'quality_inspection_status', 'released', '已放行', 7, { color: 'bg-teal-50 text-teal-700 border-teal-200' }),

  // 缺陷严重程度
  createDictItem('DT-DS-001', 'defect_severity', 'minor', '轻微', 1, { color: 'bg-amber-50 text-amber-700 border-amber-200' }),
  createDictItem('DT-DS-002', 'defect_severity', 'major', '一般', 2, { color: 'bg-orange-50 text-orange-700 border-orange-200' }),
  createDictItem('DT-DS-003', 'defect_severity', 'critical', '严重', 3, { color: 'bg-rose-50 text-rose-700 border-rose-200' }),

  // 价格规则状态
  createDictItem('DT-PRS-001', 'price_rule_status', 'active', '启用', 1, { color: 'bg-emerald-50 text-emerald-700 border-emerald-200' }),
  createDictItem('DT-PRS-002', 'price_rule_status', 'inactive', '禁用', 2, { color: 'bg-slate-50 text-slate-600 border-slate-200' }),

  // 发票状态
  createDictItem('DT-INV-001', 'invoice_status', 'unissued', '未开票', 1, { color: 'bg-slate-50 text-slate-600 border-slate-200' }),
  createDictItem('DT-INV-002', 'invoice_status', 'issued', '已开票', 2, { color: 'bg-blue-50 text-blue-700 border-blue-200' }),
  createDictItem('DT-INV-003', 'invoice_status', 'paid', '已收款', 3, { color: 'bg-emerald-50 text-emerald-700 border-emerald-200' }),
  createDictItem('DT-INV-004', 'invoice_status', 'partial', '部分收款', 4, { color: 'bg-amber-50 text-amber-700 border-amber-200' }),

  // 对账单状态
  createDictItem('DT-STM-001', 'statement_status', 'pending', '待确认', 1, { color: 'bg-amber-50 text-amber-700 border-amber-200' }),
  createDictItem('DT-STM-002', 'statement_status', 'confirmed', '已确认', 2, { color: 'bg-blue-50 text-blue-700 border-blue-200' }),
  createDictItem('DT-STM-003', 'statement_status', 'paid', '已结清', 3, { color: 'bg-emerald-50 text-emerald-700 border-emerald-200' }),
  createDictItem('DT-STM-004', 'statement_status', 'overdue', '已逾期', 4, { color: 'bg-rose-50 text-rose-700 border-rose-200' }),

  // 技师等级
  createDictItem('DT-TL-001', 'technician_level', 'junior', '初级技师', 1, { color: 'bg-slate-50 text-slate-700 border-slate-200' }),
  createDictItem('DT-TL-002', 'technician_level', 'intermediate', '中级技师', 2, { color: 'bg-blue-50 text-blue-700 border-blue-200' }),
  createDictItem('DT-TL-003', 'technician_level', 'senior', '高级技师', 3, { color: 'bg-violet-50 text-violet-700 border-violet-200' }),
  createDictItem('DT-TL-004', 'technician_level', 'expert', '专家技师', 4, { color: 'bg-amber-50 text-amber-700 border-amber-200' }),

  // 通知类型
  createDictItem('DT-NT-001', 'notification_type', 'overdue-warning', '逾期预警', 1, { color: 'bg-rose-50 text-rose-700 border-rose-200', icon: 'AlertTriangle' }),
  createDictItem('DT-NT-002', 'notification_type', 'delivery-today', '今日交付', 2, { color: 'bg-amber-50 text-amber-700 border-amber-200', icon: 'CalendarClock' }),
  createDictItem('DT-NT-003', 'notification_type', 'stat-order', '特急单提醒', 3, { color: 'bg-red-50 text-red-700 border-red-200', icon: 'Zap' }),
  createDictItem('DT-NT-004', 'notification_type', 'rework-initiated', '返工发起', 4, { color: 'bg-orange-50 text-orange-700 border-orange-200', icon: 'RefreshCw' }),
  createDictItem('DT-NT-005', 'notification_type', 'stage-completed', '阶段完成', 5, { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: 'CheckCircle2' }),
  createDictItem('DT-NT-006', 'notification_type', 'attachment-missing', '附件缺失', 6, { color: 'bg-violet-50 text-violet-700 border-violet-200', icon: 'Paperclip' }),

  // 通知角色
  createDictItem('DT-NR-001', 'notification_role', 'clinic', '诊所端', 1),
  createDictItem('DT-NR-002', 'notification_role', 'technician', '技师端', 2),
  createDictItem('DT-NR-003', 'notification_role', 'dispatcher', '调度员', 3),

  // 通知处理状态
  createDictItem('DT-NHS-001', 'notification_handle_status', 'pending', '待处理', 1, { color: 'bg-amber-50 text-amber-700 border-amber-200' }),
  createDictItem('DT-NHS-002', 'notification_handle_status', 'handled', '已处理', 2, { color: 'bg-emerald-50 text-emerald-700 border-emerald-200' }),
  createDictItem('DT-NHS-003', 'notification_handle_status', 'ignored', '已忽略', 3, { color: 'bg-slate-50 text-slate-600 border-slate-200' }),

  // 通知分类
  createDictItem('DT-NC-001', 'notification_category', 'delivery-warning', '交期预警', 1, { color: 'bg-rose-50 text-rose-700 border-rose-200', icon: 'AlertTriangle' }),
  createDictItem('DT-NC-002', 'notification_category', 'rework-reminder', '返工提醒', 2, { color: 'bg-orange-50 text-orange-700 border-orange-200', icon: 'RefreshCw' }),
  createDictItem('DT-NC-003', 'notification_category', 'stage-change', '阶段变更', 3, { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: 'CheckCircle2' }),
  createDictItem('DT-NC-004', 'notification_category', 'attachment-reminder', '资料补传', 4, { color: 'bg-violet-50 text-violet-700 border-violet-200', icon: 'Paperclip' }),
]
