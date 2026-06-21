import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Settings,
  FileCheck,
  Pill,
  Stethoscope,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  PawPrint,
} from 'lucide-react'
import { useAppStore } from '../../store'

const menuItems = [
  {
    path: '/dashboard',
    label: '经营看板',
    icon: LayoutDashboard,
  },
  {
    path: '/standard',
    label: '标准设置',
    icon: Settings,
  },
  {
    path: '/audit',
    label: '记录审核',
    icon: FileCheck,
  },
  {
    path: '/medicine',
    label: '药品统计',
    icon: Pill,
  },
  {
    path: '/quality',
    label: '医生质控',
    icon: Stethoscope,
  },
  {
    path: '/reports',
    label: '报表中心',
    icon: BarChart3,
  },
]

export default function Sidebar() {
  const collapsed = useAppStore((state) => state.collapsed)
  const toggleCollapsed = useAppStore((state) => state.toggleCollapsed)

  return (
    <aside
      className={`relative flex flex-col bg-white border-r border-slate-200 transition-all duration-300 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div
        className={`flex items-center h-16 px-4 border-b border-slate-100 ${
          collapsed ? 'justify-center' : 'gap-3'
        }`}
      >
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-medical-500 to-medical-600 shadow-lg shadow-medical-500/20">
          <PawPrint className="w-6 h-6 text-white" />
        </div>
        {!collapsed && (
          <div className="flex flex-col">
            <span className="text-base font-bold text-slate-800">爱康医疗</span>
            <span className="text-xs text-slate-500">Pet Clinic System</span>
          </div>
        )}
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? 'bg-gradient-to-r from-medical-500 to-medical-600 text-white shadow-lg shadow-medical-500/25'
                    : 'text-slate-600 hover:bg-medical-50 hover:text-medical-600'
                } ${collapsed ? 'justify-center' : ''}`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 ${
                      isActive ? '' : 'group-hover:scale-110'
                    }`}
                  />
                  {!collapsed && <span>{item.label}</span>}
                </>
              )}
            </NavLink>
          )
        })}
      </nav>

      <button
        onClick={toggleCollapsed}
        className="absolute -right-3 top-20 flex items-center justify-center w-6 h-6 rounded-full bg-white border border-slate-200 text-slate-500 hover:text-medical-600 hover:border-medical-200 shadow-sm transition-colors z-10"
      >
        {collapsed ? (
          <ChevronRight className="w-4 h-4" />
        ) : (
          <ChevronLeft className="w-4 h-4" />
        )}
      </button>
    </aside>
  )
}
