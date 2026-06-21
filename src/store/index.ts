import { create } from 'zustand'

export interface User {
  id: string
  name: string
  avatar: string
  role: string
}

export interface Store {
  collapsed: boolean
  toggleCollapsed: () => void
  user: User | null
  setUser: (user: User | null) => void
  selectedStore: { id: string; name: string } | null
  setSelectedStore: (store: { id: string; name: string } | null) => void
  breadcrumb: { label: string; path?: string }[]
  setBreadcrumb: (items: { label: string; path?: string }[]) => void
}

export const useAppStore = create<Store>((set) => ({
  collapsed: false,
  toggleCollapsed: () => set((state) => ({ collapsed: !state.collapsed })),
  user: {
    id: '1',
    name: '张医生',
    avatar: '',
    role: '系统管理员',
  },
  setUser: (user) => set({ user }),
  selectedStore: {
    id: '1',
    name: '爱康宠物医院（总院）',
  },
  setSelectedStore: (store) => set({ selectedStore: store }),
  breadcrumb: [{ label: '首页' }],
  setBreadcrumb: (items) => set({ breadcrumb: items }),
}))
