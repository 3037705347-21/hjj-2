import { ref, computed, watch } from 'vue'
import type {
  Attachment,
  AttachmentCategory,
  AttachmentFileType,
  AttachmentRelatedModule,
  AttachmentRelation,
  AttachmentVersion,
  ProcessingStage,
} from '../types'
import { ProcessingStages } from '../types'
import { MockAttachments } from '../mock/attachments'
import { useOrders } from './useOrders'

const STORAGE_KEY = 'denture-lab-attachments'

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0] + 'T' + date.toTimeString().split(' ')[0]
}

function pad(num: number, size: number = 4): string {
  return num.toString().padStart(size, '0')
}

function generateAttachmentId(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = pad(now.getMonth() + 1, 2)
  const day = pad(now.getDate(), 2)
  const seq = pad(attachments.value.length + 1, 4)
  return `ATT-${year}${month}${day}-${seq}`
}

function loadAttachmentsFromStorage(): Attachment[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed as Attachment[]
      }
    }
  } catch (e) {
    console.warn('Failed to load attachments from localStorage:', e)
  }
  return [...MockAttachments]
}

const attachments = ref<Attachment[]>(loadAttachmentsFromStorage())

watch(
  attachments,
  (newVal) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newVal))
    } catch (e) {
      console.warn('Failed to save attachments to localStorage:', e)
    }
  },
  { deep: true }
)

function getStageLabel(stage: ProcessingStage | 'general'): string {
  if (stage === 'general') return '通用资料'
  return ProcessingStages.find((s) => s.stage === stage)?.label || stage
}

function incrementVersion(currentVersion: string): string {
  const match = currentVersion.match(/^v(\d+)\.(\d+)$/)
  if (match) {
    const major = parseInt(match[1])
    const minor = parseInt(match[2])
    return `v${major}.${minor + 1}`
  }
  return 'v1.0'
}

function determineFileTypeFromName(fileName: string): AttachmentFileType {
  const ext = fileName.split('.').pop()?.toLowerCase() || ''
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'heic'].includes(ext)) return 'image'
  if (ext === 'pdf') return 'pdf'
  if (['doc', 'docx'].includes(ext)) return 'doc'
  if (['xls', 'xlsx', 'csv'].includes(ext)) return 'excel'
  if (ext === 'stl') return 'stl'
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return 'zip'
  return 'other'
}

export function useAttachments() {
  const { getOrderById } = useOrders()

  const allAttachments = computed(() => attachments.value)

  interface AttachmentsFilter {
    orderNumber?: string
    clinicId?: string
    clinicName?: string
    stage?: (ProcessingStage | 'general') | null
    category?: AttachmentCategory | null
    fileType?: AttachmentFileType | null
    uploadedBy?: string
    isPublic?: boolean | null
    relatedModule?: AttachmentRelatedModule | null
    keyword?: string
  }

  function getAttachmentsByFilter(filter: AttachmentsFilter): Attachment[] {
    return attachments.value.filter((att) => {
      if (filter.orderNumber && !att.orderNumber?.includes(filter.orderNumber)) return false
      if (filter.clinicId && att.clinicId !== filter.clinicId) return false
      if (filter.clinicName && !att.clinicName?.includes(filter.clinicName)) return false
      if (filter.stage && att.stage !== filter.stage) return false
      if (filter.category && att.category !== filter.category) return false
      if (filter.fileType && att.fileType !== filter.fileType) return false
      if (filter.uploadedBy && !att.uploadedBy.includes(filter.uploadedBy)) return false
      if (filter.isPublic !== null && filter.isPublic !== undefined && att.isPublic !== filter.isPublic) return false
      if (filter.relatedModule) {
        const hasRelation = att.relations?.some((r) => r.module === filter.relatedModule)
        if (!hasRelation) return false
      }
      if (filter.keyword) {
        const kw = filter.keyword.toLowerCase()
        const inName = att.fileName.toLowerCase().includes(kw)
        const inRemark = (att.remark || '').toLowerCase().includes(kw)
        const inDesc = (att.description || '').toLowerCase().includes(kw)
        const inUploader = att.uploadedBy.toLowerCase().includes(kw)
        if (!inName && !inRemark && !inDesc && !inUploader) return false
      }
      return true
    })
  }

  function getAttachmentById(id: string): Attachment | undefined {
    return attachments.value.find((a) => a.id === id)
  }

  function getAttachmentsByOrderId(orderId: string): Attachment[] {
    return attachments.value
      .filter((a) => a.orderId === orderId)
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
  }

  function getAttachmentsByClinicId(clinicId: string): Attachment[] {
    return attachments.value
      .filter((a) => a.clinicId === clinicId)
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
  }

  function getAttachmentsByStage(stage: ProcessingStage | 'general'): Attachment[] {
    return attachments.value.filter((a) => a.stage === stage)
  }

  function getAttachmentsByCategory(category: AttachmentCategory): Attachment[] {
    return attachments.value.filter((a) => a.category === category)
  }

  function getAttachmentsByRelatedModule(
    module: AttachmentRelatedModule,
    recordId: string
  ): Attachment[] {
    return attachments.value.filter((a) =>
      a.relations?.some((r) => r.module === module && r.recordId === recordId)
    )
  }

  function getAttachmentsByReworkId(reworkId: string): Attachment[] {
    return getAttachmentsByRelatedModule('rework', reworkId)
  }

  function getAttachmentsByQualityId(qualityId: string): Attachment[] {
    return getAttachmentsByRelatedModule('quality', qualityId)
  }

  function getAttachmentsByLogisticsId(logisticsId: string): Attachment[] {
    return getAttachmentsByRelatedModule('logistics', logisticsId)
  }

  interface CreateAttachmentParams {
    orderId: string
    category: AttachmentCategory
    fileName: string
    fileSize?: number
    fileType?: AttachmentFileType
    uploadedBy: string
    stage?: ProcessingStage | 'general'
    version?: string
    isPublic?: boolean
    remark?: string
    description?: string
    thumbnailUrl?: string
    url?: string
  }

  function createAttachment(params: CreateAttachmentParams): Attachment | undefined {
    const order = getOrderById(params.orderId)
    if (!order) return undefined

    const now = formatDate(new Date())
    const stage = params.stage || order.currentStage

    const attachment: Attachment = {
      id: generateAttachmentId(),
      orderId: params.orderId,
      orderNumber: order.orderNumber,
      clinicId: order.clinicId,
      clinicName: order.clinic.name,
      category: params.category,
      fileName: params.fileName,
      fileSize: params.fileSize,
      fileType: params.fileType || determineFileTypeFromName(params.fileName),
      uploadedBy: params.uploadedBy,
      uploadedAt: now,
      stage,
      stageLabel: getStageLabel(stage),
      version: params.version || 'v1.0',
      versions: params.version
        ? undefined
        : [
            {
              version: 'v1.0',
              fileName: params.fileName,
              fileSize: params.fileSize,
              uploadedBy: params.uploadedBy,
              uploadedAt: now,
              changeLog: '初始上传',
              url: params.url,
            },
          ],
      isPublic: params.isPublic ?? true,
      remark: params.remark,
      description: params.description,
      thumbnailUrl: params.thumbnailUrl,
      url: params.url,
      relations: [
        {
          module: 'order',
          recordId: params.orderId,
          recordTitle: order.orderNumber,
          linkedAt: now,
          linkedBy: params.uploadedBy,
        },
      ],
    }

    attachments.value.unshift(attachment)
    return attachment
  }

  function batchCreateAttachments(
    paramsList: CreateAttachmentParams[]
  ): Attachment[] {
    const result: Attachment[] = []
    for (const params of paramsList) {
      const existing = checkSameCategoryVersion(params.orderId, params.category)
      if (existing) {
        const updated = uploadNewVersion({
          attachmentId: existing.id,
          fileName: params.fileName,
          fileSize: params.fileSize,
          uploadedBy: params.uploadedBy,
          changeLog: params.remark || params.description || `同类别文件更新，原版本 ${existing.version}`,
          url: params.url,
        })
        if (updated) result.push(updated)
      } else {
        const att = createAttachment(params)
        if (att) result.push(att)
      }
    }
    return result
  }

  interface UploadNewVersionParams {
    attachmentId: string
    fileName: string
    fileSize?: number
    uploadedBy: string
    changeLog?: string
    url?: string
  }

  function uploadNewVersion(params: UploadNewVersionParams): Attachment | undefined {
    const idx = attachments.value.findIndex((a) => a.id === params.attachmentId)
    if (idx === -1) return undefined

    const att = attachments.value[idx]
    const now = formatDate(new Date())
    const newVersion = incrementVersion(att.version)

    const versionEntry: AttachmentVersion = {
      version: newVersion,
      fileName: params.fileName,
      fileSize: params.fileSize,
      uploadedBy: params.uploadedBy,
      uploadedAt: now,
      changeLog: params.changeLog || '版本更新',
      url: params.url,
    }

    const updatedVersions = [...(att.versions || []), versionEntry]

    attachments.value[idx] = {
      ...att,
      fileName: params.fileName,
      fileSize: params.fileSize,
      version: newVersion,
      uploadedBy: params.uploadedBy,
      uploadedAt: now,
      versions: updatedVersions,
      url: params.url || att.url,
    }

    return attachments.value[idx]
  }

  function updateAttachment(
    id: string,
    updates: Partial<Omit<Attachment, 'id' | 'orderId'>>
  ): Attachment | undefined {
    const idx = attachments.value.findIndex((a) => a.id === id)
    if (idx === -1) return undefined

    const existing = attachments.value[idx]
    if (updates.stage && !updates.stageLabel) {
      updates.stageLabel = getStageLabel(updates.stage)
    }
    attachments.value[idx] = { ...existing, ...updates }
    return attachments.value[idx]
  }

  function deleteAttachment(id: string): boolean {
    const idx = attachments.value.findIndex((a) => a.id === id)
    if (idx === -1) return false
    attachments.value.splice(idx, 1)
    return true
  }

  interface AddRelationParams {
    attachmentId: string
    module: AttachmentRelatedModule
    recordId: string
    recordTitle?: string
    linkedBy: string
  }

  function addRelation(params: AddRelationParams): Attachment | undefined {
    const idx = attachments.value.findIndex((a) => a.id === params.attachmentId)
    if (idx === -1) return undefined

    const att = attachments.value[idx]
    const now = formatDate(new Date())

    const existingRelation = att.relations?.find(
      (r) => r.module === params.module && r.recordId === params.recordId
    )
    if (existingRelation) return att

    const newRelation: AttachmentRelation = {
      module: params.module,
      recordId: params.recordId,
      recordTitle: params.recordTitle,
      linkedAt: now,
      linkedBy: params.linkedBy,
    }

    attachments.value[idx] = {
      ...att,
      relations: [...(att.relations || []), newRelation],
    }

    return attachments.value[idx]
  }

  function removeRelation(
    attachmentId: string,
    module: AttachmentRelatedModule,
    recordId: string
  ): Attachment | undefined {
    const idx = attachments.value.findIndex((a) => a.id === attachmentId)
    if (idx === -1) return undefined

    const att = attachments.value[idx]
    attachments.value[idx] = {
      ...att,
      relations: att.relations?.filter(
        (r) => !(r.module === module && r.recordId === recordId)
      ),
    }

    return attachments.value[idx]
  }

  function getAttachmentStats() {
    const total = attachments.value.length
    const byCategory: Record<string, number> = {}
    const byFileType: Record<string, number> = {}
    const byStage: Record<string, number> = {}
    let totalSize = 0
    let publicCount = 0
    let withVersions = 0

    for (const att of attachments.value) {
      byCategory[att.category] = (byCategory[att.category] || 0) + 1
      byFileType[att.fileType] = (byFileType[att.fileType] || 0) + 1
      byStage[att.stage] = (byStage[att.stage] || 0) + 1
      totalSize += att.fileSize || 0
      if (att.isPublic) publicCount++
      if ((att.versions?.length || 0) > 1) withVersions++
    }

    const uniqueOrders = new Set(attachments.value.map((a) => a.orderId)).size
    const uniqueClinics = new Set(attachments.value.map((a) => a.clinicId)).size

    return {
      total,
      byCategory,
      byFileType,
      byStage,
      totalSize,
      publicCount,
      privateCount: total - publicCount,
      withVersions,
      uniqueOrders,
      uniqueClinics,
    }
  }

  function checkSameCategoryVersion(
    orderId: string,
    category: AttachmentCategory
  ): Attachment | undefined {
    const sameCategory = attachments.value
      .filter((a) => a.orderId === orderId && a.category === category)
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
    return sameCategory[0]
  }

  return {
    attachments: allAttachments,
    getAttachmentById,
    getAttachmentsByOrderId,
    getAttachmentsByClinicId,
    getAttachmentsByStage,
    getAttachmentsByCategory,
    getAttachmentsByFilter,
    getAttachmentsByRelatedModule,
    getAttachmentsByReworkId,
    getAttachmentsByQualityId,
    getAttachmentsByLogisticsId,
    createAttachment,
    batchCreateAttachments,
    uploadNewVersion,
    updateAttachment,
    deleteAttachment,
    addRelation,
    removeRelation,
    getAttachmentStats,
    checkSameCategoryVersion,
    determineFileTypeFromName,
    incrementVersion,
  }
}
