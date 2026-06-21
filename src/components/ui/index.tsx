import { ReactNode, useState } from 'react'
import {
  TrendingUp,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
  X,
  Inbox,
} from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  icon: ReactNode
  trend?: number
  trendLabel?: string
  color?: 'blue' | 'pink' | 'green' | 'orange' | 'purple'
}

const colorMap = {
  blue: 'from-medical-500 to-medical-600 shadow-medical-500/20',
  pink: 'from-primary-400 to-primary-500 shadow-primary-500/20',
  green: 'from-emerald-500 to-emerald-600 shadow-emerald-500/20',
  orange: 'from-orange-500 to-orange-600 shadow-orange-500/20',
  purple: 'from-violet-500 to-violet-600 shadow-violet-500/20',
}

export function StatCard({
  title,
  value,
  icon,
  trend,
  trendLabel,
  color = 'blue',
}: StatCardProps) {
  const isPositive = (trend ?? 0) >= 0

  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-slate-800">{value}</p>
          {trend !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              {isPositive ? (
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5 text-red-500" />
              )}
              <span
                className={`text-xs font-medium ${
                  isPositive ? 'text-emerald-500' : 'text-red-500'
                }`}
              >
                {isPositive ? '+' : ''}
                {trend}%
              </span>
              {trendLabel && (
                <span className="text-xs text-slate-400">{trendLabel}</span>
              )}
            </div>
          )}
        </div>
        <div
          className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorMap[color]} flex items-center justify-center text-white shadow-lg`}
        >
          {icon}
        </div>
      </div>
    </div>
  )
}

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'default'

interface BadgeProps {
  children: ReactNode
  variant?: BadgeVariant
  className?: string
}

const badgeStyles: Record<BadgeVariant, string> = {
  success: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  warning: 'bg-amber-50 text-amber-600 border-amber-200',
  danger: 'bg-red-50 text-red-600 border-red-200',
  info: 'bg-medical-50 text-medical-600 border-medical-200',
  default: 'bg-slate-50 text-slate-600 border-slate-200',
}

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${badgeStyles[variant]} ${className}`}
    >
      {children}
    </span>
  )
}

type TagColor = 'blue' | 'pink' | 'green' | 'orange' | 'purple' | 'gray'

interface TagProps {
  children: ReactNode
  color?: TagColor
  onClose?: () => void
}

const tagColors: Record<TagColor, string> = {
  blue: 'bg-medical-50 text-medical-700 border-medical-200',
  pink: 'bg-primary-50 text-primary-700 border-primary-200',
  green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  orange: 'bg-orange-50 text-orange-700 border-orange-200',
  purple: 'bg-violet-50 text-violet-700 border-violet-200',
  gray: 'bg-slate-100 text-slate-600 border-slate-200',
}

export function Tag({ children, color = 'gray', onClose }: TagProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border ${tagColors[color]}`}
    >
      {children}
      {onClose && (
        <button
          onClick={onClose}
          className="ml-0.5 hover:bg-black/5 rounded p-0.5 transition-colors"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  )
}

interface ProgressProps {
  value: number
  max?: number
  color?: 'blue' | 'pink' | 'green' | 'orange'
  showLabel?: boolean
  label?: string
}

const progressColors: Record<string, string> = {
  blue: 'bg-medical-500',
  pink: 'bg-primary-500',
  green: 'bg-emerald-500',
  orange: 'bg-orange-500',
}

export function Progress({
  value,
  max = 100,
  color = 'blue',
  showLabel = true,
  label,
}: ProgressProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm text-slate-600">{label || '进度'}</span>
          <span className="text-sm font-medium text-slate-700">{percentage.toFixed(0)}%</span>
        </div>
      )}
      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${progressColors[color]} rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

interface EmptyProps {
  icon?: ReactNode
  title?: string
  description?: string
  action?: ReactNode
}

export function Empty({
  icon,
  title = '暂无数据',
  description,
  action,
}: EmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-4">
        {icon || <Inbox className="w-10 h-10 text-slate-400" />}
      </div>
      <h3 className="text-base font-medium text-slate-700 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-slate-500 mb-4 text-center max-w-sm">
          {description}
        </p>
      )}
      {action}
    </div>
  )
}

interface Column<T> {
  key: string
  title: string
  dataIndex: keyof T
  render?: (value: T[keyof T], record: T, index: number) => ReactNode
  width?: string | number
  align?: 'left' | 'center' | 'right'
}

interface DataTableProps<T> {
  columns: Column<T>[]
  dataSource: T[]
  rowKey: keyof T
  loading?: boolean
  pagination?: boolean
  pageSize?: number
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  dataSource,
  rowKey,
  loading = false,
  pagination = true,
  pageSize = 10,
}: DataTableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1)

  const totalPages = Math.max(1, Math.ceil(dataSource.length / pageSize))
  const startIndex = (currentPage - 1) * pageSize
  const paginatedData = pagination
    ? dataSource.slice(startIndex, startIndex + pageSize)
    : dataSource

  const alignClass = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider ${alignClass[col.align || 'left']}`}
                  style={{ width: col.width }}
                >
                  {col.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-16">
                  <div className="flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-medical-500 border-t-transparent rounded-full animate-spin" />
                    <span className="ml-3 text-sm text-slate-500">加载中...</span>
                  </div>
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>
                  <Empty description="当前没有数据" />
                </td>
              </tr>
            ) : (
              paginatedData.map((record, index) => (
                <tr
                  key={String(record[rowKey])}
                  className="hover:bg-slate-50 transition-colors"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-4 py-3 text-sm text-slate-700 ${alignClass[col.align || 'left']}`}
                    >
                      {col.render
                        ? col.render(record[col.dataIndex], record, startIndex + index)
                        : String(record[col.dataIndex] ?? '')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && dataSource.length > 0 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50/50">
          <div className="text-sm text-slate-500">
            共 <span className="font-medium text-slate-700">{dataSource.length}</span> 条记录，
            第 <span className="font-medium text-slate-700">{currentPage}</span> /{' '}
            <span className="font-medium text-slate-700">{totalPages}</span> 页
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                  page === currentPage
                    ? 'bg-medical-600 text-white'
                    : 'text-slate-600 hover:bg-white border border-transparent hover:border-slate-200'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  footer?: ReactNode
  width?: string | number
}

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  width = 520,
}: ModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="relative bg-white rounded-2xl shadow-2xl max-h-[90vh] flex flex-col"
        style={{ width: typeof width === 'number' ? `${width}px` : width }}
      >
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
            <h3 className="text-base font-semibold text-slate-800">{title}</h3>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        <div className="px-6 py-4 overflow-y-auto flex-1">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-200 bg-slate-50/50 rounded-b-2xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
