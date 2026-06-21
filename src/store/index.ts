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
  addDoctor: (doctor: Omit<DoctorAccount, 'id' | 'createdAt'>) => void
  updateDoctor: (doctorId: string, updates: Partial<DoctorAccount>) => void
  toggleDoctorStatus: (doctorId: string) => void
  
  exportHistory: ExportHistoryItem[]
  addExportHistory: (item: Omit<ExportHistoryItem, 'id' | 'time'>) => string
  updateExportHistory: (id: string, updates: Partial<ExportHistoryItem>) => void
  
  toggleCollapsed: () => void
  setUser: (user: AppUser | null) => void
  setSelectedStore: (store: { id: string; name: string } | null) => void
  setBreadcrumb: (items: { label: string; path?: string }[]) => void
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
        const initializedDoctors: DoctorAccount[] = mockDoctors.map((d) => ({
          ...d,
          username: '',
          password: '',
          role: d.title,
          permissions: rolePermissions[d.title] || [],
        }))
        return { doctors: initializedDoctors }
      }),
      addDoctor: (doctor) => set((state) => ({
        doctors: [
          ...state.doctors,
          {
            ...doctor,
            id: `doc_${Date.now()}`,
            createdAt: new Date().toISOString(),
          } as DoctorAccount,
        ],
      })),
      updateDoctor: (doctorId, updates) => set((state) => ({
        doctors: state.doctors.map((d) =>
          d.id === doctorId ? { ...d, ...updates } : d
        ),
      })),
      toggleDoctorStatus: (doctorId) => set((state) => ({
        doctors: state.doctors.map((d) =>
          d.id === doctorId
            ? { ...d, status: d.status === 'on_duty' ? 'off_duty' : 'on_duty' }
            : d
        ),
      })),
      
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
        collapsed: state.collapsed,
        user: state.user,
        selectedStore: state.selectedStore,
        breadcrumb: state.breadcrumb,
      }),
    }
  )
)
