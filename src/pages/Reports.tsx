import { useState, useMemo } from 'react'
import {
  FileText,
  TrendingUp,
  ShieldCheck,
  Pill,
  Users,
  PieChart as PieIcon,
  Calendar,
  MapPin,
  Stethoscope,
  Download,
  FileSpreadsheet,
  File,
  Search,
  ChevronDown,
  ChevronRight,
  BarChart3,
  LineChart as LineIcon,
  History,
  Clock,
  X,
  Check,
  Filter,
  Star,
} from 'lucide-react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts'
import { StatCard, Badge, Tag, DataTable } from '../components/ui'
import {
  stores,
  reports,
  customerRecords,
  drugs,
  doctors,
  followUpRecords,
} from '../data/mockData'
import type { Report } from '../types'

type ReportCategory = 'business' | 'quality' | 'drug' | 'performance' | 'customer'

const categoryList: { id: ReportCategory; name: string; icon: any; desc: string }[] = [
  { id: 'business', name: '经营报表', icon: TrendingUp, desc: '营收、项目、门店数据' },
  { id: 'quality', name: '质控报表', icon: ShieldCheck, desc: '质控评分、风险分析' },
  { id: 'drug', name: '药品报表', icon: Pill, desc: '药品使用、库存统计' },
  { id: 'performance', name: '医生绩效报表', icon: Users, desc: '医生业绩、评分排名' },
  { id: 'customer', name: '客户分析报表', icon: PieIcon, desc: '客户画像、复购分析' },
]

const COLORS = ['#3b82f6', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#f43f5e', '#84cc16']

const quickRanges = [
  { label: '今日', days: 1 },
  { label: '本周', days: 7 },
  { label: '本月', days: 30 },
  { label: '本季度', days: 90 },
  { label: '本年', days: 365 },
]

interface ExportHistory {
  id: string
  name: string
  type: 'excel' | 'pdf'
  category: string
  time: string
  status: 'success' | 'processing' | 'failed'
  size?: string
}

export default function Reports() {
  const [activeCategory, setActiveCategory] = useState<ReportCategory>('business')
  const [dateRange, setDateRange] = useState('本月')
  const [selectedStores, setSelectedStores] = useState<string[]>([])
  const [selectedProjectType, setSelectedProjectType] = useState('')
  const [showStoreDropdown, setShowStoreDropdown] = useState(false)
  const [exportHistory, setExportHistory] = useState<ExportHistory[]>([
    { id: '1', name: '6月经营月报', type: 'excel', category: '经营报表', time: '2024-06-22 10:30', status: 'success', size: '245KB' },
    { id: '2', name: '质控周报W25', type: 'pdf', category: '质控报表', time: '2024-06-21 16:45', status: 'success', size: '1.2MB' },
    { id: '3', name: '药品统计6月', type: 'excel', category: '药品报表', time: '2024-06-20 09:15', status: 'success', size: '180KB' },
    { id: '4', name: '医生绩效报表', type: 'excel', category: '医生绩效报表', time: '2024-06-22 11:02', status: 'processing' },
  ])

  const mainReport = reports[0]

  const toggleStore = (storeId: string) => {
    setSelectedStores((prev) =>
      prev.includes(storeId) ? prev.filter((s) => s !== storeId) : [...prev, storeId]
    )
  }

  const handleExport = (type: 'excel' | 'pdf') => {
    const categoryName = categoryList.find((c) => c.id === activeCategory)?.name || '报表'
    const newExport: ExportHistory = {
      id: Date.now().toString(),
      name: `${dateRange}${categoryName}`,
      type,
      category: categoryName,
      time: new Date().toLocaleString('zh-CN'),
      status: 'processing',
    }
    setExportHistory([newExport, ...exportHistory])
    setTimeout(() => {
      setExportHistory((prev) =>
        prev.map((e) =>
          e.id === newExport.id ? { ...e, status: 'success', size: type === 'excel' ? `${Math.floor(Math.random() * 300 + 100)}KB` : `${(Math.random() * 2 + 0.5).toFixed(1)}MB` } : e
        )
      )
    }, 2000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800">报表中心</h1>
        <p className="text-sm text-slate-500 mt-1">各类业务报表的生成与导出</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 min-h-[calc(100vh-220px)]">
        <div className="lg:w-56 flex-shrink-0">
          <div className="card p-2">
            {categoryList.map((cat) => {
              const Icon = cat.icon
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors ${
                    activeCategory === cat.id
                      ? 'bg-medical-50 text-medical-700'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                      activeCategory === cat.id ? 'bg-medical-500 text-white' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <div className={`text-sm font-medium ${activeCategory === cat.id ? 'text-medical-700' : 'text-slate-700'}`}>
                      {cat.name}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">{cat.desc}</div>
                  </div>
                </button>
              )
            })}
          </div>

          <div className="card p-4 mt-4">
            <div className="flex items-center gap-2 mb-3">
              <History className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-medium text-slate-700">导出历史</span>
            </div>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {exportHistory.map((e) => (
                <div key={e.id} className="p-2.5 rounded-lg bg-slate-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {e.type === 'excel' ? (
                        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                      ) : (
                        <File className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                      )}
                      <span className="text-xs font-medium text-slate-700 truncate">{e.name}</span>
                    </div>
                    {e.status === 'success' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                    ) : e.status === 'processing' ? (
                      <div className="w-3.5 h-3.5 border-2 border-medical-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] text-slate-400">
                      <Clock className="w-3 h-3 inline mr-0.5" />
                      {e.time.split(' ')[0]}
                    </span>
                    {e.size && <span className="text-[10px] text-slate-400">{e.size}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 min-w-0 space-y-4">
          <div className="card p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-600">筛选：</span>
              </div>

              <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg">
                {quickRanges.map((r) => (
                  <button
                    key={r.label}
                    onClick={() => setDateRange(r.label)}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                      dateRange === r.label ? 'bg-white text-medical-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5 border border-slate-300 rounded-lg px-3 py-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs text-slate-600">2024-06-01 ~ 2024-06-30</span>
              </div>

              <div className="relative">
                <button
                  onClick={() => setShowStoreDropdown(!showStoreDropdown)}
                  className="flex items-center gap-1.5 border border-slate-300 rounded-lg px-3 py-1.5 hover:bg-slate-50 transition-colors"
                >
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs text-slate-600">
                    {selectedStores.length === 0 ? '全部门店' : `已选 ${selectedStores.length} 家`}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>
                {showStoreDropdown && (
                  <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-slate-200 rounded-lg shadow-lg z-10 py-1 max-h-64 overflow-y-auto">
                    <div
                      onClick={() => setSelectedStores([])}
                      className="px-3 py-2 text-xs text-slate-600 hover:bg-slate-50 cursor-pointer flex items-center justify-between"
                    >
                      全部门店
                      {selectedStores.length === 0 && <Check className="w-3.5 h-3.5 text-medical-500" />}
                    </div>
                    <div className="border-t border-slate-100" />
                    {stores
                      .filter((s) => s.status === 'active')
                      .map((s) => (
                        <div
                          key={s.id}
                          onClick={() => toggleStore(s.id)}
                          className="px-3 py-2 text-xs text-slate-600 hover:bg-slate-50 cursor-pointer flex items-center justify-between"
                        >
                          {s.shortName}
                          {selectedStores.includes(s.id) && <Check className="w-3.5 h-3.5 text-medical-500" />}
                        </div>
                      ))}
                  </div>
                )}
              </div>

              <select
                value={selectedProjectType}
                onChange={(e) => setSelectedProjectType(e.target.value)}
                className="input w-36 py-1.5 text-xs"
              >
                <option value="">全部项目类型</option>
                <option value="injection">注射类</option>
                <option value="filling">填充类</option>
                <option value="wrinkle_removal">除皱类</option>
                <option value="hydration">水光类</option>
                <option value="lifting">提升类</option>
              </select>

              <div className="flex-1" />

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleExport('excel')}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-emerald-200 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-medium hover:bg-emerald-100 transition-colors"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  导出 Excel
                </button>
                <button
                  onClick={() => handleExport('pdf')}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-red-200 bg-red-50 text-red-600 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors"
                >
                  <File className="w-3.5 h-3.5" />
                  导出 PDF
                </button>
              </div>
            </div>
          </div>

          {activeCategory === 'business' && <BusinessReport report={mainReport} />}
          {activeCategory === 'quality' && <QualityReport report={mainReport} />}
          {activeCategory === 'drug' && <DrugReport report={mainReport} />}
          {activeCategory === 'performance' && <PerformanceReport report={mainReport} />}
          {activeCategory === 'customer' && <CustomerReport report={mainReport} />}
        </div>
      </div>
    </div>
  )
}

function BusinessReport({ report }: { report: Report }) {
  const revenueTrend = Array.from({ length: 6 }, (_, i) => {
    const month = new Date()
    month.setMonth(month.getMonth() - (5 - i))
    return {
      month: `${month.getMonth() + 1}月`,
      营收: Math.floor(200000 + Math.random() * 400000),
      订单数: Math.floor(30 + Math.random() * 50),
    }
  })

  const projectData = report.byProject.map((p) => ({
    name: p.projectName.replace(/（.*?）/g, '').slice(0, 6),
    营收: p.revenue,
    数量: p.count,
  }))

  const pieData = report.byProject.slice(0, 6).map((p) => ({
    name: p.projectName.replace(/（.*?）/g, ''),
    value: p.revenue,
  }))

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="总营收" value={`¥${report.summary.totalRevenue.toLocaleString()}`} icon={<TrendingUp className="w-5 h-5" />} trend={8.5} trendLabel="较上月" color="blue" />
        <StatCard title="总订单数" value={report.summary.totalRecords} icon={<FileText className="w-5 h-5" />} trend={5.2} trendLabel="较上月" color="pink" />
        <StatCard title="客户总数" value={report.summary.totalCustomers} icon={<Users className="w-5 h-5" />} trend={12.3} trendLabel="较上月" color="green" />
        <StatCard title="客单价" value={`¥${report.summary.averageOrderValue.toLocaleString()}`} icon={<BarChart3 className="w-5 h-5" />} trend={3.1} trendLabel="较上月" color="orange" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-slate-800">营收趋势</h3>
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <LineIcon className="w-3.5 h-3.5" />
              近6个月
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={revenueTrend}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(v) => `¥${(v / 10000).toFixed(0)}万`} />
              <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 8 }} formatter={(v: any) => [`¥${Number(v).toLocaleString()}`, '营收']} />
              <Area type="monotone" dataKey="营收" stroke="#3b82f6" strokeWidth={2.5} fill="url(#revenueGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-slate-800">项目营收分布</h3>
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <PieIcon className="w-3.5 h-3.5" />
              TOP 6
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={95}
                paddingAngle={2}
                dataKey="value"
              >
                {pieData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 8 }}
                formatter={(v: any) => [`¥${Number(v).toLocaleString()}`, '营收']}
              />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="text-base font-semibold text-slate-800 mb-4">门店业绩对比</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={report.byStore || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="storeName" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={(v) => v.replace('店', '')} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(v) => `¥${(v / 10000).toFixed(0)}万`} />
              <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 8 }} formatter={(v: any) => [`¥${Number(v).toLocaleString()}`, '营收']} />
              <Bar dataKey="revenue" name="营收" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h3 className="text-base font-semibold text-slate-800 mb-4">项目营收明细</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2.5 px-2 text-xs font-semibold text-slate-600">项目名称</th>
                  <th className="text-center py-2.5 px-2 text-xs font-semibold text-slate-600">数量</th>
                  <th className="text-right py-2.5 px-2 text-xs font-semibold text-slate-600">营收</th>
                  <th className="text-right py-2.5 px-2 text-xs font-semibold text-slate-600">占比</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {report.byProject.map((p) => (
                  <tr key={p.projectId} className="hover:bg-slate-50">
                    <td className="py-2.5 px-2 text-sm text-slate-700">{p.projectName}</td>
                    <td className="py-2.5 px-2 text-center text-sm text-slate-600">{p.count}</td>
                    <td className="py-2.5 px-2 text-right text-sm font-medium text-slate-700">¥{p.revenue.toLocaleString()}</td>
                    <td className="py-2.5 px-2 text-right">
                      <div className="inline-flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-medical-500 to-primary-400 rounded-full"
                            style={{ width: `${(p.revenue / report.summary.totalRevenue) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-500 w-10 text-right">{((p.revenue / report.summary.totalRevenue) * 100).toFixed(1)}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="card p-5">
        <h3 className="text-base font-semibold text-slate-800 mb-4">客户复购分析</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="p-4 rounded-xl bg-medical-50">
            <p className="text-xs text-slate-500">复购率</p>
            <p className="text-2xl font-bold text-medical-600 mt-1">57.1%</p>
            <p className="text-xs text-emerald-500 mt-1">↑ 4.2% 较上月</p>
          </div>
          <div className="p-4 rounded-xl bg-pink-50">
            <p className="text-xs text-slate-500">新客户数</p>
            <p className="text-2xl font-bold text-primary-600 mt-1">{report.summary.newCustomers}</p>
            <p className="text-xs text-emerald-500 mt-1">↑ 8.1% 较上月</p>
          </div>
          <div className="p-4 rounded-xl bg-emerald-50">
            <p className="text-xs text-slate-500">平均满意度</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{report.customerSatisfaction.avgSatisfaction}分</p>
            <p className="text-xs text-slate-400 mt-1">基于 {report.customerSatisfaction.feedbackCount} 条评价</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart
            data={[
              { range: '1次', count: 18 },
              { range: '2-3次', count: 12 },
              { range: '4-6次', count: 7 },
              { range: '7-10次', count: 3 },
              { range: '10次+', count: 2 },
            ]}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="range" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
            <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 8 }} />
            <Bar dataKey="count" name="客户数" fill="#ec4899" radius={[6, 6, 0, 0]} barSize={40} />
          </BarChart>
        </ResponsiveContainer>
        <p className="text-xs text-center text-slate-400 mt-2">客户消费频次分布</p>
      </div>
    </div>
  )
}

function QualityReport({ report }: { report: Report }) {
  const scoreTrend = Array.from({ length: 6 }, (_, i) => {
    const month = new Date()
    month.setMonth(month.getMonth() - (5 - i))
    return {
      month: `${month.getMonth() + 1}月`,
      平均评分: (88 + Math.random() * 6).toFixed(1),
      通过率: Math.round(90 + Math.random() * 8),
    }
  })

  const storeQuality = (report.byStore || []).map((s, i) => ({
    name: s.storeName.replace('店', ''),
    平均评分: (85 + Math.random() * 10).toFixed(1),
    优秀数: Math.floor(2 + Math.random() * 5),
    风险数: Math.floor(Math.random() * 3),
  }))

  const riskCategoryData = [
    { name: '注射规范', value: 5, color: '#ef4444' },
    { name: '药品管理', value: 3, color: '#f59e0b' },
    { name: '记录完整', value: 4, color: '#3b82f6' },
    { name: '无菌操作', value: 2, color: '#10b981' },
    { name: '患者告知', value: 2, color: '#8b5cf6' },
  ]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="平均质控分" value={report.qualityStats.avgScore} icon={<ShieldCheck className="w-5 h-5" />} trend={1.2} trendLabel="较上月" color="blue" />
        <StatCard title="质控通过率" value={`${Math.round(((report.qualityStats.excellentCount + report.qualityStats.goodCount) / (report.qualityStats.excellentCount + report.qualityStats.goodCount + report.qualityStats.fairCount + report.qualityStats.poorCount)) * 100)}%`} icon={<Check className="w-5 h-5" />} trend={2.5} trendLabel="较上月" color="green" />
        <StatCard title="风险事件数" value={report.riskStats.total} icon={<TrendingUp className="w-5 h-5" />} trend={-15} trendLabel="较上月" color="pink" />
        <StatCard title="待整改项" value={report.riskStats.openCount} icon={<Clock className="w-5 h-5" />} trend={-8} trendLabel="较上周" color="orange" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="text-base font-semibold text-slate-800 mb-4">各门店质控评分趋势</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={scoreTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
              <YAxis yAxisId="left" domain={[80, 100]} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
              <YAxis yAxisId="right" orientation="right" domain={[80, 100]} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
              <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 8 }} />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="平均评分" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4, fill: '#3b82f6' }} />
              <Line yAxisId="right" type="monotone" dataKey="通过率" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4, fill: '#10b981' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h3 className="text-base font-semibold text-slate-800 mb-4">风险点类别分布</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={riskCategoryData}
                cx="50%"
                cy="50%"
                outerRadius={95}
                dataKey="value"
                label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {riskCategoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="text-base font-semibold text-slate-800 mb-4">质控评分等级分布</h3>
          <div className="space-y-4">
            {[
              { label: '优秀 (≥90分)', count: report.qualityStats.excellentCount, color: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700' },
              { label: '良好 (80-89分)', count: report.qualityStats.goodCount, color: 'bg-medical-500', bg: 'bg-medical-50', text: 'text-medical-700' },
              { label: '一般 (70-79分)', count: report.qualityStats.fairCount, color: 'bg-amber-500', bg: 'bg-amber-50', text: 'text-amber-700' },
              { label: '较差 (<70分)', count: report.qualityStats.poorCount, color: 'bg-red-500', bg: 'bg-red-50', text: 'text-red-700' },
            ].map((item) => {
              const total = report.qualityStats.excellentCount + report.qualityStats.goodCount + report.qualityStats.fairCount + report.qualityStats.poorCount
              const percent = total > 0 ? (item.count / total) * 100 : 0
              return (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                      <span className="text-sm text-slate-700">{item.label}</span>
                    </div>
                    <span className={`text-sm font-semibold ${item.text}`}>{item.count}</span>
                  </div>
                  <div className={`w-full h-2 ${item.bg} rounded-full overflow-hidden`}>
                    <div className={`h-full ${item.color} rounded-full transition-all duration-500`} style={{ width: `${percent}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="text-base font-semibold text-slate-800 mb-4">门店质控排名</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 px-2 text-xs font-semibold text-slate-600">排名</th>
                  <th className="text-left py-2 px-2 text-xs font-semibold text-slate-600">门店</th>
                  <th className="text-center py-2 px-2 text-xs font-semibold text-slate-600">平均分</th>
                  <th className="text-center py-2 px-2 text-xs font-semibold text-slate-600">优秀</th>
                  <th className="text-center py-2 px-2 text-xs font-semibold text-slate-600">风险</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {storeQuality.map((s, idx) => (
                  <tr key={s.name} className="hover:bg-slate-50">
                    <td className="py-2 px-2">
                      <span className={`w-6 h-6 inline-flex items-center justify-center rounded-full text-xs font-bold ${
                        idx === 0 ? 'bg-amber-100 text-amber-600' : idx === 1 ? 'bg-slate-200 text-slate-600' : idx === 2 ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {idx + 1}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-sm text-slate-700">{s.name}</td>
                    <td className="py-2 px-2 text-center">
                      <span className={`text-sm font-semibold ${parseFloat(s.平均评分) >= 90 ? 'text-emerald-600' : parseFloat(s.平均评分) >= 80 ? 'text-medical-600' : 'text-amber-600'}`}>
                        {s.平均评分}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-center text-sm text-emerald-600">{s.优秀数}</td>
                    <td className="py-2 px-2 text-center text-sm text-red-500">{s.风险数}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

function DrugReport({ report }: { report: Report }) {
  const drugColumns = [
    {
      key: 'name',
      title: '药品名称',
      dataIndex: 'drugName' as const,
      width: 180,
    },
    {
      key: 'usage',
      title: '使用量',
      dataIndex: 'totalUsage' as const,
      align: 'center' as const,
      render: (v: any, record: any) => (
        <span className="text-sm text-slate-700">{v}{record.unit}</span>
      ),
    },
    {
      key: 'value',
      title: '使用金额',
      dataIndex: 'totalValue' as const,
      align: 'right' as const,
      render: (v: any) => <span className="text-sm font-medium text-slate-700">¥{v.toLocaleString()}</span>,
    },
    {
      key: 'stock',
      title: '当前库存',
      dataIndex: 'drugName' as const,
      align: 'center' as const,
      render: (v: any) => {
        const drug = drugs.find((d) => d.name === v)
        if (!drug) return <span className="text-sm text-slate-400">-</span>
        return (
          <Badge variant={drug.stock <= drug.warningStock ? 'warning' : drug.stock === 0 ? 'danger' : 'success'}>
            {drug.stock === 0 ? '缺货' : drug.stock + drug.unit}
          </Badge>
        )
      },
    },
  ]

  const drugUsageTrend = Array.from({ length: 6 }, (_, i) => {
    const month = new Date()
    month.setMonth(month.getMonth() - (5 - i))
    return {
      month: `${month.getMonth() + 1}月`,
      肉毒素: Math.floor(800 + Math.random() * 600),
      玻尿酸: Math.floor(10 + Math.random() * 15),
      水光类: Math.floor(30 + Math.random() * 25),
    }
  })

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="药品品类数" value={drugs.length} icon={<Pill className="w-5 h-5" />} color="blue" />
        <StatCard title="药品使用次数" value={report.summary.drugUsageCount} icon={<Stethoscope className="w-5 h-5" />} trend={6.8} trendLabel="较上月" color="pink" />
        <StatCard title="药品总营收" value={`¥${report.drugStats.reduce((s, d) => s + d.totalValue, 0).toLocaleString()}`} icon={<TrendingUp className="w-5 h-5" />} trend={9.2} trendLabel="较上月" color="green" />
        <StatCard title="库存预警" value={drugs.filter((d) => d.stock <= d.warningStock).length} icon={<Clock className="w-5 h-5" />} trend={-2} trendLabel="较上周" color="orange" />
      </div>

      <div className="card p-5">
        <h3 className="text-base font-semibold text-slate-800 mb-4">各类药品使用趋势</h3>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={drugUsageTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
            <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 8 }} />
            <Legend />
            <Line type="monotone" dataKey="肉毒素" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4, fill: '#3b82f6' }} />
            <Line type="monotone" dataKey="玻尿酸" stroke="#ec4899" strokeWidth={2.5} dot={{ r: 4, fill: '#ec4899' }} />
            <Line type="monotone" dataKey="水光类" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4, fill: '#10b981' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="text-base font-semibold text-slate-800 mb-4">药品使用排行</h3>
          <DataTable
            columns={drugColumns}
            dataSource={report.drugStats}
            rowKey="drugId"
            pagination={false}
          />
        </div>

        <div className="card p-5">
          <h3 className="text-base font-semibold text-slate-800 mb-4">库存预警</h3>
          <div className="space-y-3">
            {drugs
              .filter((d) => d.stock <= d.warningStock)
              .slice(0, 8)
              .map((drug) => (
                <div key={drug.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    drug.stock === 0 ? 'bg-red-100' : drug.status === 'expiring' ? 'bg-amber-100' : 'bg-orange-100'
                  }`}>
                    <Pill className={`w-5 h-5 ${
                      drug.stock === 0 ? 'text-red-500' : drug.status === 'expiring' ? 'text-amber-500' : 'text-orange-500'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-700 truncate">{drug.name}</span>
                      <Badge variant={drug.stock === 0 ? 'danger' : drug.status === 'expiring' ? 'warning' : 'warning'}>
                        {drug.stock === 0 ? '缺货' : drug.status === 'expiring' ? '即将过期' : '库存不足'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                      <span>当前库存: {drug.stock}{drug.unit}</span>
                      <span>预警值: {drug.warningStock}{drug.unit}</span>
                    </div>
                  </div>
                </div>
              ))}
            {drugs.filter((d) => d.stock <= d.warningStock).length === 0 && (
              <div className="py-12 text-center text-slate-400 text-sm">暂无库存预警</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function PerformanceReport({ report }: { report: Report }) {
  const perfColumns = [
    {
      key: 'rank',
      title: '排名',
      dataIndex: 'doctorId' as const,
      align: 'center' as const,
      width: 60,
      render: (_: any, __: any, index: number) => (
        <span className={`w-6 h-6 inline-flex items-center justify-center rounded-full text-xs font-bold ${
          index === 0 ? 'bg-amber-100 text-amber-600' : index === 1 ? 'bg-slate-200 text-slate-600' : index === 2 ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-500'
        }`}>
          {index + 1}
        </span>
      ),
    },
    {
      key: 'name',
      title: '医生',
      dataIndex: 'doctorName' as const,
      width: 120,
      render: (v: any, record: any) => {
        const doc = doctors.find((d) => d.id === record.doctorId)
        return (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-medical-500 to-primary-500 flex items-center justify-center text-white font-semibold text-xs">
              {v.charAt(0)}
            </div>
            <div>
              <div className="text-sm font-medium text-slate-700">{v}</div>
              <div className="text-xs text-slate-400">{doc?.storeName}</div>
            </div>
          </div>
        )
      },
    },
    {
      key: 'count',
      title: '项目量',
      dataIndex: 'count' as const,
      align: 'center' as const,
      render: (v: any) => <span className="text-sm text-slate-700">{v}</span>,
    },
    {
      key: 'revenue',
      title: '业绩',
      dataIndex: 'revenue' as const,
      align: 'right' as const,
      render: (v: any) => <span className="text-sm font-medium text-slate-700">¥{v.toLocaleString()}</span>,
    },
    {
      key: 'avgScore',
      title: '平均分',
      dataIndex: 'avgScore' as const,
      align: 'center' as const,
      render: (v: any) => (
        <span className={`text-sm font-semibold ${v >= 90 ? 'text-emerald-600' : v >= 80 ? 'text-medical-600' : 'text-amber-600'}`}>
          {v}
        </span>
      ),
    },
  ]

  const doctorPerformanceTrend = Array.from({ length: 6 }, (_, i) => {
    const month = new Date()
    month.setMonth(month.getMonth() - (5 - i))
    return {
      month: `${month.getMonth() + 1}月`,
      张美容: Math.floor(80000 + Math.random() * 60000),
      陈医美: Math.floor(70000 + Math.random() * 50000),
      李整形: Math.floor(40000 + Math.random() * 30000),
    }
  })

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="在岗医生数" value={report.summary.doctorCount} icon={<Users className="w-5 h-5" />} color="blue" />
        <StatCard title="人均业绩" value={`¥${Math.round(report.summary.totalRevenue / report.summary.doctorCount).toLocaleString()}`} icon={<TrendingUp className="w-5 h-5" />} trend={5.6} trendLabel="较上月" color="pink" />
        <StatCard title="人均项目量" value={(report.summary.totalRecords / report.summary.doctorCount).toFixed(1)} icon={<FileText className="w-5 h-5" />} trend={3.2} trendLabel="较上月" color="green" />
        <StatCard title="平均质控分" value={(report.byDoctor.reduce((s, d) => s + d.avgScore, 0) / report.byDoctor.length).toFixed(1)} icon={<ShieldCheck className="w-5 h-5" />} trend={1.8} trendLabel="较上月" color="orange" />
      </div>

      <div className="card p-5">
        <h3 className="text-base font-semibold text-slate-800 mb-4">TOP 3 医生业绩趋势</h3>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={doctorPerformanceTrend}>
            <defs>
              <linearGradient id="doc1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="doc2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ec4899" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="doc3" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(v) => `¥${(v / 10000).toFixed(0)}万`} />
            <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 8 }} formatter={(v: any) => [`¥${Number(v).toLocaleString()}`, '']} />
            <Legend />
            <Area type="monotone" dataKey="张美容" stroke="#3b82f6" strokeWidth={2.5} fill="url(#doc1)" />
            <Area type="monotone" dataKey="陈医美" stroke="#ec4899" strokeWidth={2.5} fill="url(#doc2)" />
            <Area type="monotone" dataKey="李整形" stroke="#10b981" strokeWidth={2.5} fill="url(#doc3)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="card p-5">
        <h3 className="text-base font-semibold text-slate-800 mb-4">医生绩效排行</h3>
        <DataTable
          columns={perfColumns}
          dataSource={report.byDoctor.sort((a, b) => b.revenue - a.revenue)}
          rowKey="doctorId"
          pagination={false}
        />
      </div>
    </div>
  )
}

function CustomerReport({ report }: { report: Report }) {
  const ageData = [
    { range: '18-25岁', count: 5 },
    { range: '26-30岁', count: 12 },
    { range: '31-35岁', count: 15 },
    { range: '36-40岁', count: 8 },
    { range: '41-45岁', count: 4 },
    { range: '45岁+', count: 2 },
  ]

  const genderData = [
    { name: '女性', value: 38, color: '#ec4899' },
    { name: '男性', value: 4, color: '#3b82f6' },
  ]

  const projectPrefData = report.byProject.slice(0, 5).map((p) => ({
    name: p.projectName.replace(/（.*?）/g, ''),
    value: p.count,
  }))

  const satisfactionTrend = Array.from({ length: 6 }, (_, i) => {
    const month = new Date()
    month.setMonth(month.getMonth() - (5 - i))
    return {
      month: `${month.getMonth() + 1}月`,
      满意度: (4.5 + Math.random() * 0.4).toFixed(1),
      响应率: Math.round(60 + Math.random() * 20),
    }
  })

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="客户总数" value={report.summary.totalCustomers} icon={<Users className="w-5 h-5" />} trend={10.5} trendLabel="较上月" color="blue" />
        <StatCard title="新增客户" value={report.summary.newCustomers} icon={<TrendingUp className="w-5 h-5" />} trend={15.2} trendLabel="较上月" color="pink" />
        <StatCard title="平均满意度" value={`${report.customerSatisfaction.avgSatisfaction}分`} icon={<Star className="w-5 h-5" />} trend={0.2} trendLabel="较上月" color="green" />
        <StatCard title="回访响应率" value={`${Math.round(report.customerSatisfaction.responseRate * 100)}%`} icon={<FileText className="w-5 h-5" />} trend={5.3} trendLabel="较上月" color="orange" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-5">
          <h3 className="text-base font-semibold text-slate-800 mb-4">客户性别分布</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={genderData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                dataKey="value"
                label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
              >
                {genderData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5 lg:col-span-2">
          <h3 className="text-base font-semibold text-slate-800 mb-4">客户年龄分布</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={ageData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="range" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
              <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 8 }} />
              <Bar dataKey="count" name="客户数" fill="#ec4899" radius={[6, 6, 0, 0]} barSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="text-base font-semibold text-slate-800 mb-4">客户满意度趋势</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={satisfactionTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
              <YAxis yAxisId="left" domain={[4, 5]} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
              <YAxis yAxisId="right" orientation="right" domain={[50, 90]} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
              <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 8 }} />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="满意度" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4, fill: '#10b981' }} />
              <Line yAxisId="right" type="monotone" dataKey="响应率" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4, fill: '#3b82f6' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h3 className="text-base font-semibold text-slate-800 mb-4">热门项目偏好 TOP 5</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={projectPrefData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
              <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
              <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} width={80} />
              <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 8 }} />
              <Bar dataKey="value" name="选择人数" fill="#8b5cf6" radius={[0, 6, 6, 0]} barSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card p-5">
        <h3 className="text-base font-semibold text-slate-800 mb-4">最近回访记录</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-600">客户</th>
                <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-600">回访方式</th>
                <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-600">反馈内容</th>
                <th className="text-center py-2.5 px-3 text-xs font-semibold text-slate-600">满意度</th>
                <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-600">回访人</th>
                <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-600">日期</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {followUpRecords.slice(0, 8).map((fu) => {
                const record = customerRecords.find((r) => r.id === fu.recordId)
                return (
                  <tr key={fu.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 text-sm text-slate-700">{record?.customerName || '-'}</td>
                    <td className="py-2.5 px-3">
                      <Tag color={fu.type === 'visit' ? 'blue' : fu.type === 'wechat' ? 'green' : 'gray'}>
                        {fu.type === 'phone' ? '电话' : fu.type === 'wechat' ? '微信' : fu.type === 'visit' ? '到店' : '其他'}
                      </Tag>
                    </td>
                    <td className="py-2.5 px-3 text-sm text-slate-600 max-w-xs truncate">{fu.customerFeedback}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="text-sm font-medium text-amber-500">
                        {'★'.repeat(fu.satisfaction)}
                        <span className="text-slate-300">{'★'.repeat(5 - fu.satisfaction)}</span>
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-sm text-slate-600">{fu.operatorName}</td>
                    <td className="py-2.5 px-3 text-sm text-slate-500">{fu.followUpDate}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
