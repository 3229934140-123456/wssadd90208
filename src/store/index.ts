import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CustomerRecord, Doctor, QualityScore, RecordStatus, User } from '../types'
import type { RuleViolation } from '../utils/auditRules'
import { doctors as mockDoctors } from '../data/mockData'

export interface AppUser {
  id: string
  name: string
  avatar: string
  role: string
}

export const rolePermissions: Record<string, string[]> = {
  chief: ['dashboard', 'records', 'record_entry', 'record_view', 'templates', 'template_view', 'drugs', 'drug_view', 'quality', 'reports', 'settings', 'permissions'],
  associate_chief: ['dashboard', 'records', 'record_entry', 'record_view', 'templates', 'template_view', 'drugs', 'drug_view', 'quality', 'reports', 'settings'],
  attending: ['dashboard', 'record_view', 'template_view', 'drug_view', 'quality', 'reports'],
  resident: ['record_entry'],
}

export interface DoctorAccount extends Doctor {
  username: string
  password: string
  role: string
  permissions: string[]
  createdAt: string
}

export interface ExportHistoryItem {
  id: string
  name: string
  type: 'excel' | 'pdf'
  category: string
  time: string
  status: 'success' | 'processing' | 'failed'
  size?: string
  fileSize?: number
  reportCategory?: string
  dateRange?: string
  stores?: string[]
  projectType?: string
  generatedConfig?: any
  realFileName?: string
  errorMessage?: string
}

export interface PermissionChangeLog {
  id: string
  doctorId: string
  doctorName: string
  changeType: 'role_change' | 'manual_permission' | 'batch_role' | 'batch_store' | 'batch_status'
  operatorId: string
  operatorName: string
  changeTime: string
  before: {
    role?: string
    permissions?: string[]
    storeId?: string
    storeName?: string
    status?: string
  }
  after: {
    role?: string
    permissions?: string[]
    storeId?: string
    storeName?: string
    status?: string
  }
  remark?: string
}

interface RecordUpdate {
  status: RecordStatus
  qualityScore?: QualityScore
  reviewRemark?: string
  reviewerId?: string
  reviewerName?: string
  reviewedAt?: string
  ruleViolations?: RuleViolation[]
  riskPoints?: CustomerRecord['riskPoints']
}

interface ModalState {
  recordDetail: {
    open: boolean
    record: CustomerRecord | null
  }
  doctorDetail: {
    open: boolean
    doctorId: string | null
  }
}

interface AppState {
  collapsed: boolean
  user: AppUser | null
  selectedStore: { id: string; name: string } | null
  breadcrumb: { label: string; path?: string }[]
  
  modal: ModalState
  openRecordDetail: (record: CustomerRecord) => void
  closeRecordDetail: () => void
  openDoctorDetail: (doctorId: string) => void
  closeDoctorDetail: () => void
  
  records: CustomerRecord[]
  setRecords: (records: CustomerRecord[]) => void
  updateRecord: (recordId: string, updates: RecordUpdate) => void
  
  doctors: DoctorAccount[]
  initializeDoctors: () => void
  ensureBuiltinDoctors: () => void
  addDoctor: (doctor: Omit<DoctorAccount, 'id' | 'createdAt'>) => void
  updateDoctor: (doctorId: string, updates: Partial<DoctorAccount>) => void
  toggleDoctorStatus: (doctorId: string) => void
  batchUpdateDoctors: (doctorIds: string[], updates: Partial<DoctorAccount>) => void
  batchSetDoctorsStatus: (doctorIds: string[], status: 'on_duty' | 'off_duty' | 'leave') => void
  batchChangeDoctorsStore: (doctorIds: string[], storeId: string, storeName: string) => void
  
  exportHistory: ExportHistoryItem[]
  addExportHistory: (item: Omit<ExportHistoryItem, 'id' | 'time'>) => string
  updateExportHistory: (id: string, updates: Partial<ExportHistoryItem>) => void
  deleteExportHistory: (id: string) => void

  permissionChangeLogs: PermissionChangeLog[]
  addPermissionChangeLog: (log: Omit<PermissionChangeLog, 'id' | 'changeTime'>) => void
  getDoctorPermissionLogs: (doctorId: string) => PermissionChangeLog[]
  
  toggleCollapsed: () => void
  setUser: (user: AppUser | null) => void
  setSelectedStore: (store: { id: string; name: string } | null) => void
  setBreadcrumb: (items: { label: string; path?: string }[]) => void
}

function getDefaultUsername(id: string): string {
  const last4 = id.slice(-4)
  return `dr_${last4}`
}

function convertMockDoctorToAccount(d: Doctor): DoctorAccount {
  return {
    ...d,
    username: getDefaultUsername(d.id),
    password: '123456',
    role: d.title,
    permissions: rolePermissions[d.title] || [],
    createdAt: new Date().toISOString(),
  }
}

function mergeDoctors(existing: DoctorAccount[]): DoctorAccount[] {
  const existingMap = new Map(existing.map((d) => [d.id, d]))
  const mockMap = new Map(mockDoctors.map((d) => [d.id, d]))
  const result: DoctorAccount[] = []
  const seenIds = new Set<string>()

  for (const d of existing) {
    seenIds.add(d.id)
    if (mockMap.has(d.id)) {
      const mockDoc = mockMap.get(d.id)!
      const merged: DoctorAccount = {
        ...d,
        username: d.username || getDefaultUsername(d.id),
        password: d.password || '123456',
        role: d.role || mockDoc.title,
        permissions: d.permissions && d.permissions.length > 0 ? d.permissions : rolePermissions[mockDoc.title] || [],
      }
      result.push(merged)
    } else {
      const userCreated: DoctorAccount = {
        ...d,
        username: d.username || getDefaultUsername(d.id),
        password: d.password || '123456',
        role: d.role || d.title,
        permissions: d.permissions && d.permissions.length > 0 ? d.permissions : rolePermissions[d.title] || [],
      }
      result.push(userCreated)
    }
  }

  for (const mockDoc of mockDoctors) {
    if (!seenIds.has(mockDoc.id)) {
      result.push(convertMockDoctorToAccount(mockDoc))
    }
  }

  return result
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      collapsed: false,
      user: {
        id: '1',
        name: '李院长',
        avatar: '',
        role: '超级管理员',
      },
      selectedStore: {
        id: 'all',
        name: '全部门店',
      },
      breadcrumb: [{ label: '首页' }],
      
      modal: {
        recordDetail: {
          open: false,
          record: null,
        },
        doctorDetail: {
          open: false,
          doctorId: null,
        },
      },
      openRecordDetail: (record) => set((state) => ({
        modal: {
          ...state.modal,
          recordDetail: { open: true, record },
        },
      })),
      closeRecordDetail: () => set((state) => ({
        modal: {
          ...state.modal,
          recordDetail: { open: false, record: null },
        },
      })),
      openDoctorDetail: (doctorId) => set((state) => ({
        modal: {
          ...state.modal,
          doctorDetail: { open: true, doctorId },
        },
      })),
      closeDoctorDetail: () => set((state) => ({
        modal: {
          ...state.modal,
          doctorDetail: { open: false, doctorId: null },
        },
      })),
      
      records: [],
      setRecords: (records) => set({ records }),
      updateRecord: (recordId, updates) => set((state) => ({
        records: state.records.map((r) =>
          r.id === recordId
            ? {
                ...r,
                status: updates.status,
                qualityScore: updates.qualityScore ?? r.qualityScore,
                reviewRemark: updates.reviewRemark ?? r.reviewRemark,
                reviewerId: updates.reviewerId ?? r.reviewerId,
                reviewerName: updates.reviewerName ?? r.reviewerName,
                reviewedAt: updates.reviewedAt ?? r.reviewedAt,
                ruleViolations: updates.ruleViolations ?? r.ruleViolations,
                riskPoints: updates.riskPoints ?? r.riskPoints,
              }
            : r
        ),
      })),
      
      doctors: [],
      initializeDoctors: () => set((state) => {
        if (state.doctors.length > 0) return state
        const initializedDoctors: DoctorAccount[] = mockDoctors.map((d) => convertMockDoctorToAccount(d))
        return { doctors: initializedDoctors }
      }),
      ensureBuiltinDoctors: () => set((state) => {
        const merged = mergeDoctors(state.doctors)
        const changed = merged.length !== state.doctors.length ||
          state.doctors.some((d, i) => {
            const m = merged[i]
            return !m ||
              d.username !== m.username ||
              d.password !== m.password ||
              d.role !== m.role ||
              d.permissions.length !== m.permissions.length
          })
        if (!changed) return state
        return { doctors: merged }
      }),
      addDoctor: (doctor) => set((state) => {
        const newId = `doc_${Date.now()}`
        const currentUser = state.user
        const newDoctor: DoctorAccount = {
          ...doctor,
          id: newId,
          createdAt: new Date().toISOString(),
        }
        const log: PermissionChangeLog = {
          id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          doctorId: newId,
          doctorName: doctor.name,
          changeType: 'role_change',
          operatorId: currentUser?.id || '',
          operatorName: currentUser?.name || '',
          changeTime: new Date().toLocaleString('zh-CN'),
          before: {},
          after: {
            role: doctor.role,
            permissions: doctor.permissions,
            storeId: doctor.storeId,
            storeName: doctor.storeName,
            status: doctor.status,
          },
          remark: '新建医生账号',
        }
        return {
          doctors: [...state.doctors, newDoctor],
          permissionChangeLogs: [log, ...state.permissionChangeLogs],
        }
      }),
      updateDoctor: (doctorId, updates) => set((state) => {
        const currentUser = state.user
        const existingDoctor = state.doctors.find((d) => d.id === doctorId)
        if (!existingDoctor) {
          return {
            doctors: state.doctors.map((d) =>
              d.id === doctorId ? { ...d, ...updates } : d
            ),
          }
        }

        const updatedDoctor = { ...existingDoctor, ...updates }
        const before: PermissionChangeLog['before'] = {}
        const after: PermissionChangeLog['after'] = {}
        let hasChange = false

        if (existingDoctor.role !== updatedDoctor.role) {
          before.role = existingDoctor.role
          after.role = updatedDoctor.role
          hasChange = true
        }
        if (
          existingDoctor.permissions?.length !== updatedDoctor.permissions?.length ||
          existingDoctor.permissions?.some((p) => !updatedDoctor.permissions?.includes(p)) ||
          updatedDoctor.permissions?.some((p) => !existingDoctor.permissions?.includes(p))
        ) {
          before.permissions = [...(existingDoctor.permissions || [])]
          after.permissions = [...(updatedDoctor.permissions || [])]
          hasChange = true
        }
        if (existingDoctor.storeId !== updatedDoctor.storeId || existingDoctor.storeName !== updatedDoctor.storeName) {
          before.storeId = existingDoctor.storeId
          before.storeName = existingDoctor.storeName
          after.storeId = updatedDoctor.storeId
          after.storeName = updatedDoctor.storeName
          hasChange = true
        }
        if (existingDoctor.status !== updatedDoctor.status) {
          before.status = existingDoctor.status
          after.status = updatedDoctor.status
          hasChange = true
        }

        const updatedDoctors = state.doctors.map((d) =>
          d.id === doctorId ? updatedDoctor : d
        )

        if (!hasChange) {
          return { doctors: updatedDoctors }
        }

        const isRoleChange = before.role !== undefined
        const isPermissionOnlyChange = before.permissions !== undefined && before.role === undefined
        let changeType: PermissionChangeLog['changeType'] = 'role_change'
        if (isRoleChange) {
          changeType = 'role_change'
        } else if (isPermissionOnlyChange) {
          changeType = 'manual_permission'
        }

        const log: PermissionChangeLog = {
          id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          doctorId,
          doctorName: existingDoctor.name,
          changeType,
          operatorId: currentUser?.id || '',
          operatorName: currentUser?.name || '',
          changeTime: new Date().toLocaleString('zh-CN'),
          before,
          after,
        }

        return {
          doctors: updatedDoctors,
          permissionChangeLogs: [log, ...state.permissionChangeLogs],
        }
      }),
      toggleDoctorStatus: (doctorId) => set((state) => {
        const currentUser = state.user
        const existingDoctor = state.doctors.find((d) => d.id === doctorId)
        if (!existingDoctor) return state

        const newStatus = existingDoctor.status === 'on_duty' ? 'off_duty' : 'on_duty'
        const log: PermissionChangeLog = {
          id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          doctorId,
          doctorName: existingDoctor.name,
          changeType: 'role_change',
          operatorId: currentUser?.id || '',
          operatorName: currentUser?.name || '',
          changeTime: new Date().toLocaleString('zh-CN'),
          before: { status: existingDoctor.status },
          after: { status: newStatus },
        }
        return {
          doctors: state.doctors.map((d) =>
            d.id === doctorId ? { ...d, status: newStatus } : d
          ),
          permissionChangeLogs: [log, ...state.permissionChangeLogs],
        }
      }),
      batchUpdateDoctors: (doctorIds, updates) => set((state) => {
        const logs: PermissionChangeLog[] = []
        const currentUser = state.user
        const updatedDoctors = state.doctors.map((d) => {
          if (doctorIds.includes(d.id)) {
            const updated = { ...d, ...updates }
            const before: PermissionChangeLog['before'] = {}
            const after: PermissionChangeLog['after'] = {}
            let hasChange = false

            if (d.role !== updated.role) {
              before.role = d.role
              after.role = updated.role
              hasChange = true
            }
            if (
              d.permissions?.length !== updated.permissions?.length ||
              d.permissions?.some((p) => !updated.permissions?.includes(p)) ||
              updated.permissions?.some((p) => !d.permissions?.includes(p))
            ) {
              before.permissions = [...(d.permissions || [])]
              after.permissions = [...(updated.permissions || [])]
              hasChange = true
            }
            if (d.storeId !== updated.storeId || d.storeName !== updated.storeName) {
              before.storeId = d.storeId
              before.storeName = d.storeName
              after.storeId = updated.storeId
              after.storeName = updated.storeName
              hasChange = true
            }
            if (d.status !== updated.status) {
              before.status = d.status
              after.status = updated.status
              hasChange = true
            }

            if (hasChange) {
              logs.push({
                id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
                doctorId: d.id,
                doctorName: d.name,
                changeType: before.role ? 'batch_role' : 'batch_status',
                operatorId: currentUser?.id || '',
                operatorName: currentUser?.name || '',
                changeTime: new Date().toLocaleString('zh-CN'),
                before,
                after,
              })
            }
            return updated
          }
          return d
        })
        return {
          doctors: updatedDoctors,
          permissionChangeLogs: [...logs, ...state.permissionChangeLogs],
        }
      }),
      batchSetDoctorsStatus: (doctorIds, status) => set((state) => {
        const logs: PermissionChangeLog[] = []
        const currentUser = state.user
        const updatedDoctors = state.doctors.map((d) => {
          if (doctorIds.includes(d.id) && d.status !== status) {
            logs.push({
              id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
              doctorId: d.id,
              doctorName: d.name,
              changeType: 'batch_status',
              operatorId: currentUser?.id || '',
              operatorName: currentUser?.name || '',
              changeTime: new Date().toLocaleString('zh-CN'),
              before: { status: d.status },
              after: { status },
            })
            return { ...d, status }
          }
          return d
        })
        return {
          doctors: updatedDoctors,
          permissionChangeLogs: [...logs, ...state.permissionChangeLogs],
        }
      }),
      batchChangeDoctorsStore: (doctorIds, storeId, storeName) => set((state) => {
        const logs: PermissionChangeLog[] = []
        const currentUser = state.user
        const updatedDoctors = state.doctors.map((d) => {
          if (doctorIds.includes(d.id)) {
            const before = { storeId: d.storeId, storeName: d.storeName }
            const after = { storeId, storeName }
            if (before.storeId !== after.storeId || before.storeName !== after.storeName) {
              logs.push({
                id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
                doctorId: d.id,
                doctorName: d.name,
                changeType: 'batch_store',
                operatorId: currentUser?.id || '',
                operatorName: currentUser?.name || '',
                changeTime: new Date().toLocaleString('zh-CN'),
                before,
                after,
              })
            }
            return { ...d, storeId, storeName }
          }
          return d
        })
        return {
          doctors: updatedDoctors,
          permissionChangeLogs: [...logs, ...state.permissionChangeLogs],
        }
      }),

      permissionChangeLogs: [],
      addPermissionChangeLog: (log) => set((state) => ({
        permissionChangeLogs: [
          {
            ...log,
            id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            changeTime: new Date().toLocaleString('zh-CN'),
          },
          ...state.permissionChangeLogs,
        ],
      })),
      getDoctorPermissionLogs: (doctorId) => {
        const state = get()
        return state.permissionChangeLogs
          .filter((log) => log.doctorId === doctorId)
          .sort((a, b) => new Date(b.changeTime).getTime() - new Date(a.changeTime).getTime())
      },
      
      exportHistory: [
        { id: '1', name: '6月经营月报', type: 'excel', category: '经营报表', time: '2024-06-22 10:30', status: 'success', size: '245KB', fileSize: 245 * 1024 },
        { id: '2', name: '质控周报W25', type: 'pdf', category: '质控报表', time: '2024-06-21 16:45', status: 'success', size: '1.2MB', fileSize: 1.2 * 1024 * 1024 },
        { id: '3', name: '药品统计6月', type: 'excel', category: '药品报表', time: '2024-06-20 09:15', status: 'success', size: '180KB', fileSize: 180 * 1024 },
      ],
      addExportHistory: (item) => {
        const id = Date.now().toString()
        set((state) => ({
          exportHistory: [
            {
              ...item,
              id,
              time: new Date().toLocaleString('zh-CN'),
            },
            ...state.exportHistory,
          ],
        }))
        return id
      },
      updateExportHistory: (id, updates) => set((state) => ({
        exportHistory: state.exportHistory.map((e) =>
          e.id === id ? { ...e, ...updates } : e
        ),
      })),
      deleteExportHistory: (id: string) => set((state) => ({
        exportHistory: state.exportHistory.filter((e) => e.id !== id),
      })),
      
      toggleCollapsed: () => set((state) => ({ collapsed: !state.collapsed })),
      setUser: (user) => set({ user }),
      setSelectedStore: (store) => set({ selectedStore: store }),
      setBreadcrumb: (items) => set({ breadcrumb: items }),
    }),
    {
      name: 'aesthetic-medicine-storage',
      partialize: (state) => ({
        records: state.records,
        doctors: state.doctors,
        exportHistory: state.exportHistory,
        permissionChangeLogs: state.permissionChangeLogs,
        collapsed: state.collapsed,
        user: state.user,
        selectedStore: state.selectedStore,
        breadcrumb: state.breadcrumb,
      }),
    }
  )
)
