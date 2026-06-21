import { ReactNode, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import { useAppStore } from '../../store'

interface LayoutProps {
  children: ReactNode
}

const breadcrumbMap: Record<string, { label: string; path?: string }[]> = {
  '/dashboard': [{ label: '首页' }, { label: '经营看板' }],
  '/standard': [{ label: '首页' }, { label: '标准设置' }],
  '/audit': [{ label: '首页' }, { label: '记录审核' }],
  '/medicine': [{ label: '首页' }, { label: '药品统计' }],
  '/quality': [{ label: '首页' }, { label: '医生质控' }],
  '/reports': [{ label: '首页' }, { label: '报表中心' }],
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const setBreadcrumb = useAppStore((state) => state.setBreadcrumb)

  useEffect(() => {
    const items = breadcrumbMap[location.pathname] || [{ label: '首页' }]
    setBreadcrumb(items)
  }, [location.pathname, setBreadcrumb])

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  )
}
