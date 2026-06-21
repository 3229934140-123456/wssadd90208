import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Search,
  Bell,
  ChevronDown,
  Building2,
  User,
  Settings,
  LogOut,
  MapPin,
} from 'lucide-react'
import { useAppStore } from '../../store'

export default function Header() {
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showStoreMenu, setShowStoreMenu] = useState(false)

  const breadcrumb = useAppStore((state) => state.breadcrumb)
  const user = useAppStore((state) => state.user)
  const selectedStore = useAppStore((state) => state.selectedStore)
  const setSelectedStore = useAppStore((state) => state.setSelectedStore)

  const stores = [
    { id: '1', name: '爱康宠物医院（总院）' },
    { id: '2', name: '爱康宠物医院（朝阳分院）' },
    { id: '3', name: '爱康宠物医院（海淀分院）' },
  ]

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowStoreMenu(!showStoreMenu)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors group"
          >
            <div className="w-8 h-8 rounded-lg bg-medical-50 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-medical-600" />
            </div>
            <div className="flex flex-col items-start">
              <span className="text-xs text-slate-400">当前门店</span>
              <span className="text-sm font-medium text-slate-700 group-hover:text-medical-600 transition-colors">
                {selectedStore?.name}
              </span>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-slate-400 transition-transform ${
                showStoreMenu ? 'rotate-180' : ''
              }`}
            />
          </button>

          {showStoreMenu && (
            <div className="absolute top-14 left-6 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
              <div className="px-3 py-2 text-xs font-medium text-slate-400 uppercase">
                选择门店
              </div>
              {stores.map((store) => (
                <button
                  key={store.id}
                  onClick={() => {
                    setSelectedStore(store)
                    setShowStoreMenu(false)
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-slate-50 transition-colors ${
                    selectedStore?.id === store.id ? 'bg-medical-50' : ''
                  }`}
                >
                  <MapPin
                    className={`w-4 h-4 ${
                      selectedStore?.id === store.id
                        ? 'text-medical-600'
                        : 'text-slate-400'
                    }`}
                  />
                  <span
                    className={`text-sm ${
                      selectedStore?.id === store.id
                        ? 'text-medical-600 font-medium'
                        : 'text-slate-600'
                    }`}
                  >
                    {store.name}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 text-sm">
          {breadcrumb.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              {index > 0 && (
                <span className="text-slate-300">/</span>
              )}
              {item.path ? (
                <Link
                  to={item.path}
                  className="text-slate-500 hover:text-medical-600 transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="text-slate-700 font-medium">{item.label}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="搜索客户、病历、药品..."
            className="w-64 pl-9 pr-4 py-2 bg-slate-50 border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-medical-500 focus:bg-white transition-all"
          />
        </div>

        <button className="relative p-2 rounded-lg hover:bg-slate-50 transition-colors group">
          <Bell className="w-5 h-5 text-slate-500 group-hover:text-medical-600 transition-colors" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary-500" />
        </button>

        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3 pl-2 pr-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-500 flex items-center justify-center text-white font-medium text-sm">
              {user?.name.charAt(0)}
            </div>
            <div className="flex flex-col items-start">
              <span className="text-sm font-medium text-slate-700">{user?.name}</span>
              <span className="text-xs text-slate-400">{user?.role}</span>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-slate-400 transition-transform ${
                showUserMenu ? 'rotate-180' : ''
              }`}
            />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-12 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
              <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                <User className="w-4 h-4" />
                个人中心
              </button>
              <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                <Settings className="w-4 h-4" />
                账号设置
              </button>
              <div className="my-1 border-t border-slate-100" />
              <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors">
                <LogOut className="w-4 h-4" />
                退出登录
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
