import { ref, computed, watch, inject, provide } from 'vue'
import type {
  Technician,
  TaskAssignment,
  TaskHandoverRecord,
  TaskStatus,
  TaskPriority,
  ExceptionType,
  ProcessingStage,
  TechnicianDailyStat,
  ScheduleBoardSlot,
  TechnicianWorkbenchStats,
  OrderPriority,
} from '../types'
import {
  ProcessingStages,
  TechnicianStatusLabels,
  TechnicianSkillLabels,
  TaskStatusLabels,
} from '../types'
import {
  MockTechnicians,
  MockTaskAssignments,
  MockTaskHandoverRecords,
  getSuitableTechnicians,
  getTechnicianById,
  generateTaskId,
  generateHandoverId,
  mapStageToSkill,
  getTechniciansBySkill,
} from '../mock/technicians'

const TECHNICIANS_STORAGE_KEY = 'denture-lab-technicians'
const TASKS_STORAGE_KEY = 'denture-lab-tasks'
const HANDOVERS_STORAGE_KEY = 'denture-lab-handovers'

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0] + 'T' + date.toTimeString().split(' ')[0]
}

function loadTechniciansFromStorage(): Technician[] {
  try {
    const raw = localStorage.getItem(TECHNICIANS_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
      }
    }
  } catch (e) {
    console.warn('Failed to load technicians from localStorage:', e)
  }
  return [...MockTechnicians]
}

function loadTasksFromStorage(): TaskAssignment[] {
  try {
    const raw = localStorage.getItem(TASKS_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
      }
    }
  } catch (e) {
    console.warn('Failed to load tasks from localStorage:', e)
  }
  return [...MockTaskAssignments]
}

function loadHandoversFromStorage(): TaskHandoverRecord[] {
  try {
    const raw = localStorage.getItem(HANDOVERS_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
      }
    }
  } catch (e) {
    console.warn('Failed to load handovers from localStorage:', e)
  }
  return [...MockTaskHandoverRecords]
}

const technicians = ref<Technician[]>(loadTechniciansFromStorage())
const tasks = ref<TaskAssignment[]>(loadTasksFromStorage())
const handovers = ref<TaskHandoverRecord[]>(loadHandoversFromStorage())

watch(
  technicians,
  (newVal) => {
    try {
      localStorage.setItem(TECHNICIANS_STORAGE_KEY, JSON.stringify(newVal))
    } catch (e) {
      console.warn('Failed to save technicians to localStorage:', e)
    }
  },
  { deep: true }
)

watch(
  tasks,
  (newVal) => {
    try {
      localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(newVal))
    } catch (e) {
      console.warn('Failed to save tasks to localStorage:', e)
    }
  },
  { deep: true }
)

watch(
  handovers,
  (newVal) => {
    try {
      localStorage.setItem(HANDOVERS_STORAGE_KEY, JSON.stringify(newVal))
    } catch (e) {
      console.warn('Failed to save handovers to localStorage:', e)
    }
  },
  { deep: true }
)

const TechniciansSymbol = Symbol('technicians')

export function provideTechnicians() {
  provide(TechniciansSymbol, null)
}

export function useTechnicians() {
  const allTechnicians = computed(() => technicians.value)
  const allTasks = computed(() => tasks.value)
  const allHandovers = computed(() => handovers.value)

  const onDutyTechnicians = computed(() =>
    technicians.value.filter((t) => t.status === 'on-duty' || t.status === 'busy')
  )

  function getAllTechnicians(): Technician[] {
    return technicians.value
  }

  function getTechnician(id: string): Technician | undefined {
    return technicians.value.find((t) => t.id === id) || getTechnicianById(id)
  }

  function getTechnicianByName(name: string): Technician | undefined {
    return technicians.value.find(
      (t) => t.name.toLowerCase() === name.toLowerCase()
    )
  }

  function getTasksByTechnician(technicianId: string): TaskAssignment[] {
    return tasks.value.filter((t) => t.technicianId === technicianId)
  }

  function getActiveTasksByTechnician(technicianId: string): TaskAssignment[] {
    return tasks.value.filter(
      (t) =>
        t.technicianId === technicianId &&
        ['assigned', 'accepted', 'in-progress', 'paused'].includes(t.status)
    )
  }

  function getTodayTasksByTechnician(technicianId: string): TaskAssignment[] {
    const today = new Date().toDateString()
    return tasks.value.filter((t) => {
      if (t.technicianId !== technicianId) return false
      const assignedDate = t.assignedAt ? new Date(t.assignedAt).toDateString() : ''
      return assignedDate === today || ['assigned', 'accepted', 'in-progress', 'paused'].includes(t.status)
    })
  }

  function getTasksByOrder(orderId: string): TaskAssignment[] {
    return tasks.value.filter((t) => t.orderId === orderId).sort((a, b) => {
      const idxA = ProcessingStages.findIndex((s) => s.stage === a.stage)
      const idxB = ProcessingStages.findIndex((s) => s.stage === b.stage)
      return idxA - idxB
    })
  }

  function getPendingTasks(): TaskAssignment[] {
    return tasks.value.filter((t) => t.status === 'pending')
  }

  function getAssignedTasks(): TaskAssignment[] {
    return tasks.value.filter((t) => ['assigned', 'accepted'].includes(t.status))
  }

  function getInProgressTasks(): TaskAssignment[] {
    return tasks.value.filter((t) => t.status === 'in-progress')
  }

  function getExceptionTasks(): TaskAssignment[] {
    return tasks.value.filter((t) => t.status === 'exception')
  }

  function getCompletedTodayTasks(): TaskAssignment[] {
    const today = new Date().toDateString()
    return tasks.value.filter((t) => {
      if (!t.completedAt) return false
      return new Date(t.completedAt).toDateString() === today
    })
  }

  function getTasksByStage(stage: ProcessingStage): TaskAssignment[] {
    return tasks.value.filter((t) => t.stage === stage)
  }

  function getActiveTasksByStage(stage: ProcessingStage): TaskAssignment[] {
    return tasks.value.filter(
      (t) =>
        t.stage === stage &&
        ['assigned', 'accepted', 'in-progress', 'paused', 'exception'].includes(t.status)
    )
  }

  function findSuitableTechnicians(stage: ProcessingStage): Technician[] {
    return getSuitableTechnicians(stage)
  }

  function findSuitableTechniciansSorted(stage: ProcessingStage): Technician[] {
    const suitable = findSuitableTechnicians(stage)
    const skill = mapStageToSkill(stage)
    return suitable.sort((a, b) => {
      const aCapacity = a.capacityLimit - a.currentTasksCount
      const bCapacity = b.capacityLimit - b.currentTasksCount
      const aPrimary = a.primarySkill === skill ? 1 : 0
      const bPrimary = b.primarySkill === skill ? 1 : 0
      if (bPrimary !== aPrimary) return bPrimary - aPrimary
      if (bCapacity !== aCapacity) return bCapacity - aCapacity
      return a.avgTaskDurationMinutes - b.avgTaskDurationMinutes
    })
  }

  interface AssignTaskParams {
    orderId: string
    orderNumber: string
    stage: ProcessingStage
    technicianId: string
    technicianName: string
    priority?: TaskPriority
    estimatedCompletionTime?: string
    notes?: string
    assignedBy?: string
    workItemsCount?: number
    clinicName?: string
    deliveryDate?: string
    orderPriority?: OrderPriority
  }

  function assignTask(params: AssignTaskParams): TaskAssignment {
    const now = formatDate(new Date())
    const tech = getTechnician(params.technicianId)

    const task: TaskAssignment = {
      id: generateTaskId(),
      orderId: params.orderId,
      orderNumber: params.orderNumber,
      stage: params.stage,
      technicianId: params.technicianId,
      technicianName: params.technicianName,
      status: 'assigned',
      priority: params.priority || 'normal',
      assignedAt: now,
      estimatedCompletionTime: params.estimatedCompletionTime,
      reworkCount: 0,
      notes: params.notes,
      assignedBy: params.assignedBy || '系统',
      workItemsCount: params.workItemsCount,
      clinicName: params.clinicName,
      deliveryDate: params.deliveryDate,
      orderPriority: params.orderPriority,
    }

    tasks.value.push(task)

    if (tech) {
      tech.currentTasksCount = getActiveTasksByTechnician(tech.id).length
    }

    return task
  }

  function updateTaskTechnician(
    taskId: string,
    technicianId: string,
    technicianName: string,
    reason: string,
    operatedBy: string
  ): TaskAssignment | undefined {
    const idx = tasks.value.findIndex((t) => t.id === taskId)
    if (idx === -1) return undefined

    const task = tasks.value[idx]
    const now = formatDate(new Date())
    const oldTechId = task.technicianId
    const oldTechName = task.technicianName

    const handover: TaskHandoverRecord = {
      id: generateHandoverId(),
      taskId: task.id,
      orderId: task.orderId,
      stage: task.stage,
      fromTechnicianId: oldTechId,
      fromTechnicianName: oldTechName,
      toTechnicianId: technicianId,
      toTechnicianName: technicianName,
      handedAt: now,
      reason,
      handedBy: operatedBy,
    }
    handovers.value.push(handover)

    task.technicianId = technicianId
    task.technicianName = technicianName
    task.status = 'transferred'
    task.transferredAt = now
    task.transferredFrom = oldTechName
    task.transferredTo = technicianName
    task.transferReason = reason

    const newTech = getTechnician(technicianId)
    const oldTech = oldTechId ? getTechnician(oldTechId) : null
    if (newTech) {
      newTech.currentTasksCount = getActiveTasksByTechnician(newTech.id).length + 1
    }
    if (oldTech) {
      oldTech.currentTasksCount = Math.max(0, getActiveTasksByTechnician(oldTech.id).length - 1)
    }

    tasks.value[idx] = { ...task }
    return tasks.value[idx]
  }

  function acceptTask(taskId: string, operator: string, note?: string): TaskAssignment | undefined {
    const idx = tasks.value.findIndex((t) => t.id === taskId)
    if (idx === -1) return undefined

    const task = tasks.value[idx]
    const now = formatDate(new Date())
    task.status = 'accepted'
    task.acceptedAt = now
    if (note && !task.notes) {
      task.notes = note
    }

    tasks.value[idx] = { ...task }
    return tasks.value[idx]
  }

  function startTask(taskId: string, operator: string, note?: string): TaskAssignment | undefined {
    const idx = tasks.value.findIndex((t) => t.id === taskId)
    if (idx === -1) return undefined

    const task = tasks.value[idx]
    const now = formatDate(new Date())
    task.status = 'in-progress'
    task.startedAt = now
    if (note) {
      task.notes = task.notes ? `${task.notes}\n${note}` : note
    }

    tasks.value[idx] = { ...task }
    return tasks.value[idx]
  }

  function pauseTask(taskId: string, operator: string, note?: string): TaskAssignment | undefined {
    const idx = tasks.value.findIndex((t) => t.id === taskId)
    if (idx === -1) return undefined

    const task = tasks.value[idx]
    const now = formatDate(new Date())
    task.status = 'paused'
    task.pausedAt = now
    if (note) {
      task.notes = task.notes ? `${task.notes}\n暂停原因：${note}` : `暂停原因：${note}`
    }

    tasks.value[idx] = { ...task }
    return tasks.value[idx]
  }

  function resumeTask(taskId: string, operator: string, note?: string): TaskAssignment | undefined {
    const idx = tasks.value.findIndex((t) => t.id === taskId)
    if (idx === -1) return undefined

    const task = tasks.value[idx]
    task.status = 'in-progress'
    if (note) {
      task.notes = task.notes ? `${task.notes}\n恢复备注：${note}` : `恢复备注：${note}`
    }

    tasks.value[idx] = { ...task }
    return tasks.value[idx]
  }

  function completeTask(taskId: string, operator: string, note?: string): TaskAssignment | undefined {
    const idx = tasks.value.findIndex((t) => t.id === taskId)
    if (idx === -1) return undefined

    const task = tasks.value[idx]
    const now = formatDate(new Date())
    task.status = 'completed'
    task.completedAt = now
    if (note) {
      task.notes = task.notes ? `${task.notes}\n完成备注：${note}` : `完成备注：${note}`
    }

    const tech = task.technicianId ? getTechnician(task.technicianId) : null
    if (tech) {
      tech.currentTasksCount = Math.max(0, getActiveTasksByTechnician(tech.id).length - 1)
      tech.todayCompleted = getCompletedTodayTasks().filter((t) => t.technicianId === tech.id).length
    }

    tasks.value[idx] = { ...task }
    return tasks.value[idx]
  }

  function reportException(
    taskId: string,
    exceptionType: ExceptionType,
    exceptionReason: string,
    operator: string
  ): TaskAssignment | undefined {
    const idx = tasks.value.findIndex((t) => t.id === taskId)
    if (idx === -1) return undefined

    const task = tasks.value[idx]
    const now = formatDate(new Date())
    task.status = 'exception'
    task.exceptionAt = now
    task.exceptionType = exceptionType
    task.exceptionReason = exceptionReason

    const tech = task.technicianId ? getTechnician(task.technicianId) : null
    if (tech) {
      tech.totalReworkCount += 1
    }

    tasks.value[idx] = { ...task }
    return tasks.value[idx]
  }

  function resolveException(taskId: string, operator: string, note?: string): TaskAssignment | undefined {
    const idx = tasks.value.findIndex((t) => t.id === taskId)
    if (idx === -1) return undefined

    const task = tasks.value[idx]
    task.status = 'in-progress'
    if (note) {
      task.notes = task.notes ? `${task.notes}\n异常处理：${note}` : `异常处理：${note}`
    }

    tasks.value[idx] = { ...task }
    return tasks.value[idx]
  }

  function setTaskPriority(taskId: string, priority: TaskPriority): TaskAssignment | undefined {
    const idx = tasks.value.findIndex((t) => t.id === taskId)
    if (idx === -1) return undefined

    tasks.value[idx].priority = priority
    return tasks.value[idx]
  }

  function getTaskHandovers(taskId: string): TaskHandoverRecord[] {
    return handovers.value
      .filter((h) => h.taskId === taskId)
      .sort((a, b) => new Date(b.handedAt).getTime() - new Date(a.handedAt).getTime())
  }

  function getTechnicianHandovers(technicianId: string): TaskHandoverRecord[] {
    return handovers.value
      .filter(
        (h) => h.fromTechnicianId === technicianId || h.toTechnicianId === technicianId
      )
      .sort((a, b) => new Date(b.handedAt).getTime() - new Date(a.handedAt).getTime())
  }

  function getTechnicianWorkbenchStats(technicianId: string): TechnicianWorkbenchStats {
    const techTasks = getTasksByTechnician(technicianId)
    const today = new Date().toDateString()

    const pendingCount = techTasks.filter((t) => ['assigned', 'accepted'].includes(t.status)).length
    const inProgressCount = techTasks.filter((t) => t.status === 'in-progress').length
    const completedTodayCount = techTasks.filter(
      (t) => t.completedAt && new Date(t.completedAt).toDateString() === today
    ).length
    const exceptionCount = techTasks.filter((t) => t.status === 'exception').length
    const overdueCount = techTasks.filter((t) => {
      if (['completed'].includes(t.status)) return false
      if (!t.deliveryDate) return false
      return new Date(t.deliveryDate) < new Date(today)
    }).length
    const reworkCount = techTasks.reduce((sum, t) => sum + (t.reworkCount || 0), 0)

    const completedWithDuration = techTasks.filter((t) => t.startedAt && t.completedAt)
    const avgProcessingMinutes =
      completedWithDuration.length > 0
        ? Math.round(
            completedWithDuration.reduce((sum, t) => {
              const duration =
                new Date(t.completedAt!).getTime() - new Date(t.startedAt!).getTime()
              return sum + duration / 60000
            }, 0) / completedWithDuration.length
          )
        : 0

    const tech = getTechnician(technicianId)
    const capacityUsedPercent = tech
      ? Math.min(100, Math.round((tech.currentTasksCount / tech.capacityLimit) * 100))
      : 0

    return {
      technicianId,
      pendingCount,
      inProgressCount,
      completedTodayCount,
      exceptionCount,
      overdueCount,
      reworkCount,
      avgProcessingMinutes,
      capacityUsedPercent,
    }
  }

  function getTodayScheduleBoard(): ScheduleBoardSlot[] {
    return ProcessingStages.filter(
      (s) =>
        s.stage !== 'received' &&
        s.stage !== 'shipped' &&
        s.stage !== 'delivered'
    ).map((stageInfo) => {
      const stageTasks = getActiveTasksByStage(stageInfo.stage)
      const skill = mapStageToSkill(stageInfo.stage)
      const suitableTechs = getTechniciansBySkill(skill)
      const estimatedCapacity = suitableTechs.reduce(
        (sum, t) => sum + (t.status === 'on-duty' || t.status === 'busy' ? t.dailyCapacity : 0),
        0
      )
      const usedCapacity = stageTasks.length

      return {
        stage: stageInfo.stage,
        stageLabel: stageInfo.label,
        tasks: stageTasks,
        estimatedCapacity,
        usedCapacity,
      }
    })
  }

  function getTechnicianDailyStats(technicianId: string, date: Date): TechnicianDailyStat {
    const tech = getTechnician(technicianId)
    const dateStr = date.toDateString()

    const dayTasks = tasks.value.filter((t) => {
      if (t.technicianId !== technicianId) return false
      const assignedDate = t.assignedAt ? new Date(t.assignedAt).toDateString() : null
      const completedDate = t.completedAt ? new Date(t.completedAt).toDateString() : null
      return assignedDate === dateStr || completedDate === dateStr
    })

    const assignedCount = dayTasks.filter(
      (t) => t.assignedAt && new Date(t.assignedAt).toDateString() === dateStr
    ).length
    const acceptedCount = dayTasks.filter(
      (t) => t.acceptedAt && new Date(t.acceptedAt).toDateString() === dateStr
    ).length
    const completedCount = dayTasks.filter(
      (t) => t.completedAt && new Date(t.completedAt).toDateString() === dateStr
    ).length
    const reworkCount = dayTasks.filter((t) => (t.reworkCount || 0) > 0).length
    const exceptionCount = dayTasks.filter((t) => t.status === 'exception').length

    const completedToday = dayTasks.filter((t) => t.startedAt && t.completedAt)
    const avgDurationMinutes =
      completedToday.length > 0
        ? Math.round(
            completedToday.reduce((sum, t) => {
              const duration =
                new Date(t.completedAt!).getTime() - new Date(t.startedAt!).getTime()
              return sum + duration / 60000
            }, 0) / completedToday.length
          )
        : 0

    const capacityUtilization =
      tech && tech.dailyCapacity > 0
        ? Math.min(100, Math.round((completedCount / tech.dailyCapacity) * 100))
        : 0

    return {
      technicianId,
      technicianName: tech?.name || '未知技师',
      date: dateStr,
      assignedCount,
      acceptedCount,
      completedCount,
      reworkCount,
      exceptionCount,
      avgDurationMinutes,
      capacityUtilization,
    }
  }

  function getOrderStageTechnician(
    orderId: string,
    stage: ProcessingStage
  ): TaskAssignment | undefined {
    const orderTasks = getTasksByOrder(orderId)
    return orderTasks.find((t) => t.stage === stage)
  }

  function getTaskById(taskId: string): TaskAssignment | undefined {
    return tasks.value.find((t) => t.id === taskId)
  }

  function syncTaskWithStageHistory(
    orderId: string,
    stage: ProcessingStage,
    technicianName: string,
    action: 'start' | 'complete'
  ) {
    const tech = getTechnicianByName(technicianName)
    if (!tech) return

    const existingTask = tasks.value.find(
      (t) =>
        t.orderId === orderId &&
        t.stage === stage &&
        ['assigned', 'accepted', 'in-progress', 'paused'].includes(t.status)
    )

    if (action === 'start') {
      if (existingTask) {
        startTask(existingTask.id, technicianName)
      }
    } else if (action === 'complete') {
      if (existingTask) {
        completeTask(existingTask.id, technicianName)
      }
    }
  }

  function refreshTechnicianStats() {
    technicians.value.forEach((tech) => {
      tech.currentTasksCount = getActiveTasksByTechnician(tech.id).length
      tech.todayCompleted = getCompletedTodayTasks().filter(
        (t) => t.technicianId === tech.id
      ).length
    })
  }

  return {
    technicians: allTechnicians,
    tasks: allTasks,
    handovers: allHandovers,
    onDutyTechnicians,
    getAllTechnicians,
    getTechnician,
    getTechnicianByName,
    getTasksByTechnician,
    getActiveTasksByTechnician,
    getTodayTasksByTechnician,
    getTasksByOrder,
    getPendingTasks,
    getAssignedTasks,
    getInProgressTasks,
    getExceptionTasks,
    getCompletedTodayTasks,
    getTasksByStage,
    getActiveTasksByStage,
    findSuitableTechnicians,
    findSuitableTechniciansSorted,
    assignTask,
    updateTaskTechnician,
    acceptTask,
    startTask,
    pauseTask,
    resumeTask,
    completeTask,
    reportException,
    resolveException,
    setTaskPriority,
    getTaskHandovers,
    getTechnicianHandovers,
    getTechnicianWorkbenchStats,
    getTodayScheduleBoard,
    getTechnicianDailyStats,
    getOrderStageTechnician,
    getTaskById,
    syncTaskWithStageHistory,
    refreshTechnicianStats,
  }
}
