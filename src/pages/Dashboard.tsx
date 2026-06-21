import { useState, useMemo } from 'react'
import {
  Syringe,
  DollarSign,
  CreditCard,
  ClipboardCheck,
  FileWarning,
  AlertTriangle,
  Building2,
  ChevronDown,
  Search,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  Users,
  Activity,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import { StatCard, DataTable, Badge } from '../components/ui'
import {
  stores,
  customerRecords,
  reports,
  riskPoints,
  projectTemplates,
} from '../data/mockData'
import type { CustomerRecord, RiskPoint, Store } from '../types'

type TimeRange = 'today' | 'week' | 'month' | 'quarter'

const TIME_RANGES: { key: TimeRange; label: string }[] = [
  { key: 'today', label: '今日' },
  { key: 'week', label: '本周' },
  { key: 'month', label: '本月' },
  { key: 'quarter', label: '本季度' },
]

const PIE_COLORS = ['#3b82f6', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4']

const PROJECT_CATEGORY_LABELS: Record<string, string> = {
  injection: '注射类',
  filling: '填充类',
  wrinkle_removal: '除皱类',
  hydration: '水光类',
  lifting: '提升类',
  other: '其他',
}

function formatCurrency(value: number): string {
  return `¥${value.toLocaleString('zh-CN')}`
}

function formatDate(date: Date): string {
  return `${date.getMonth() + 1}/${date.getDate()}`
}

function isInTimeRange(dateStr: string, range: TimeRange): boolean {
  const date = new Date(dateStr)
  const now = new Date()
  now.setHours(23, 59, 59, 999)

  if (range === 'today') {
    return date.toDateString() === now.toDateString()
  }

  const start = new Date(now)
  if (range === 'week') {
    const day = start.getDay()
    const diff = start.getDate() - day + (day === 0 ? -6 : 1)
    start.setDate(diff)
    start.setHours(0, 0, 0, 0)
  } else if (range === 'month') {
    start.setDate(1)
    start.setHours(0, 0, 0, 0)
  } else if (range === 'quarter') {
    const quarter = Math.floor(now.getMonth() / 3)
    start.setMonth(quarter * 3, 1)
    start.setHours(0, 0, 0, 0)
  }

  return date >= start && date <= now
}

export default function Dashboard() {
  const [timeRange, setTimeRange] = useState<TimeRange>('month')
  const [selectedStore, setSelectedStore] = useState<string>('all')
  const [storeDropdownOpen, setStoreDropdownOpen] = useState(false)
  const [sortField, setSortField] = useState<string>('count')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const filteredRecords = useMemo(() => {
    return customerRecords.filter((r) => {
      const inRange = isInTimeRange(r.createdAt, timeRange)
      const inStore = selectedStore === 'all' || r.storeId === selectedStore
      return inRange && inStore
    })
  }, [timeRange, selectedStore])

  const kpiData = useMemo(() => {
    const totalRecords = filteredRecords.length
    const totalRevenue = filteredRecords.reduce((sum, r) => sum + r.totalAmount, 0)
    const avgOrderValue = totalRecords > 0 ? Math.round(totalRevenue / totalRecords) : 0

    const recordsWithFollowUp = filteredRecords.filter(
      (r) => r.followUps && r.followUps.length > 0
    ).length
    const followUpRate =
      totalRecords > 0 ? Math.round((recordsWithFollowUp / totalRecords) * 100) : 0

    const pendingReview = filteredRecords.filter(
      (r) => r.status === 'pending' || r.status === 'reviewing'
    ).length

    const activeRiskPoints = riskPoints.filter(
      (rp) =>
        rp.status === 'open' || rp.status === 'mitigated'
    ).filter((rp) => {
      const record = customerRecords.find((r) => r.id === rp.recordId)
      if (!record) return false
      return isInTimeRange(record.createdAt, timeRange) && (selectedStore === 'all' || record.storeId === selectedStore)
    }).length

    const highRisks = activeRiskPoints

    return {
      totalRecords,
      totalRevenue,
      avgOrderValue,
      followUpRate,
      pendingReview,
      activeRiskPoints: highRisks,
    }
  }, [filteredRecords, timeRange, selectedStore])

  const trendData = useMemo(() => {
    const days = 30
    const result: { date: string; count: number; revenue: number }[] = []
    const now = new Date()

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      const dateStr = formatDate(date)

      const dayRecords = customerRecords.filter((r) => {
        const rDate = new Date(r.createdAt)
        return (
          rDate.toDateString() === date.toDateString() &&
          (selectedStore === 'all' || r.storeId === selectedStore)
        )
      })

      result.push({
        date: dateStr,
        count: dayRecords.length,
        revenue: dayRecords.reduce((sum, r) => sum + r.totalAmount, 0),
      })
    }

    return result
  }, [selectedStore])

  const pieData = useMemo(() => {
    const categoryCount: Record<string, number> = {}

    filteredRecords.forEach((r) => {
      const cat = r.projectCategory
      categoryCount[cat] = (categoryCount[cat] || 0) + 1
    })

    return Object.entries(categoryCount).map(([key, value]) => ({
      name: PROJECT_CATEGORY_LABELS[key] || key,
      value,
    }))
  }, [filteredRecords])

  const storeRankingData = useMemo(() => {
    type StoreRank = {
      storeId: string
      storeName: string
      count: number
      revenue: number
      avgPrice: number
      followUpRate: number
      riskCount: number
      rank: number
    }

    const storeMap = new Map<string, StoreRank>()

    stores
      .filter((s) => s.status === 'active')
      .forEach((s) => {
        storeMap.set(s.id, {
          storeId: s.id,
          storeName: s.shortName,
          count: 0,
          revenue: 0,
          avgPrice: 0,
          followUpRate: 0,
          riskCount: 0,
          rank: 0,
        })
      })

    filteredRecords.forEach((r) => {
      const data = storeMap.get(r.storeId)
      if (!data) return
      data.count += 1
      data.revenue += r.totalAmount
      if (r.followUps && r.followUps.length > 0) {
        data.followUpRate += 1
      }
    })

    filteredRecords.forEach((r) => {
      if (r.riskPoints && r.riskPoints.length > 0) {
        const data = storeMap.get(r.storeId)
        if (data) {
          data.riskCount += r.riskPoints.filter(
            (rp) => rp.status === 'open' || rp.status === 'mitigated'
          ).length
        }
      }
    })

    const result = Array.from(storeMap.values()).map((s) => ({
      ...s,
      avgPrice: s.count > 0 ? Math.round(s.revenue / s.count) : 0,
      followUpRate: s.count > 0 ? Math.round((s.followUpRate / s.count) * 100) : 0,
    }))

    result.sort((a, b) => {
      const aVal = (a as any)[sortField] as number
      const bVal = (b as any)[sortField] as number
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal
    })

    result.forEach((item, index) => {
      item.rank = index + 1
    })

    return result
  }, [filteredRecords, sortField, sortOrder])

  const pendingRecords = useMemo(() => {
    return customerRecords
      .filter((r) => r.status === 'pending' || r.status === 'reviewing')
      .slice(0, 5)
  }, [])

  const activeRisks = useMemo(() => {
    return riskPoints
      .filter((rp) => rp.status === 'open' || rp.status === 'mitigated')
      .filter((rp) => {
        const record = customerRecords.find((r) => r.id === rp.recordId)
        if (!record) return false
        return selectedStore === 'all' || record.storeId === selectedStore
      })
      .sort((a, b) => {
        const levelOrder = { high: 0, medium: 1, low: 2, critical: -1 }
        return (levelOrder[a.level] ?? 99) - (levelOrder[b.level] ?? 99)
      })
      .slice(0, 8)
  }, [selectedStore])

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return null
    return (
      <span className="ml-1 text-medical-500">
        {sortOrder === 'asc' ? '↑' : '↓'}
      </span>
    )
  }

  const storeColumns = [
    {
      key: 'rank',
      title: '排名',
      dataIndex: 'rank' as const,
      width: 60,
      align: 'center' as const,
      render: (_: unknown, __: unknown, index: number) => {
        const rank = index + 1
        const bgClass =
          rank === 1
            ? 'bg-amber-400 text-white'
            : rank === 2
            ? 'bg-slate-400 text-white'
            : rank === 3
            ? 'bg-orange-400 text-white'
            : 'bg-slate-100 text-slate-600'
        return (
          <span
            className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${bgClass}`}
          >
            {rank}
          </span>
        )
      },
    },
    {
      key: 'storeName',
      title: '门店',
      dataIndex: 'storeName' as const,
      render: (value: unknown) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-medical-50 flex items-center justify-center">
            <Building2 className="w-4 h-4 text-medical-500" />
          </div>
          <span className="font-medium text-slate-700">{String(value)}</span>
        </div>
      ),
    },
    {
      key: 'count',
      title: '项目量',
      dataIndex: 'count' as const,
      align: 'right' as const,
      render: (value: unknown) => (
        <button
          onClick={() => handleSort('count')}
          className="font-medium text-slate-700 hover:text-medical-600"
        >
          {String(value)}
          <SortIcon field="count" />
        </button>
      ),
    },
    {
      key: 'revenue',
      title: '营收',
      dataIndex: 'revenue' as const,
      align: 'right' as const,
      render: (value: unknown) => (
        <button
          onClick={() => handleSort('revenue')}
          className="font-medium text-emerald-600 hover:text-emerald-700"
        >
          {formatCurrency(Number(value))}
          <SortIcon field="revenue" />
        </button>
      ),
    },
    {
      key: 'avgPrice',
      title: '客单价',
      dataIndex: 'avgPrice' as const,
      align: 'right' as const,
      render: (value: unknown) => (
        <button
          onClick={() => handleSort('avgPrice')}
          className="text-slate-600 hover:text-medical-600"
        >
          {formatCurrency(Number(value))}
          <SortIcon field="avgPrice" />
        </button>
      ),
    },
    {
      key: 'followUpRate',
      title: '复诊率',
      dataIndex: 'followUpRate' as const,
      align: 'right' as const,
      render: (value: unknown) => {
        const v = Number(value)
        const colorClass = v >= 80 ? 'text-emerald-600' : v >= 60 ? 'text-amber-600' : 'text-red-500'
        return (
          <button
            onClick={() => handleSort('followUpRate')}
            className={`font-medium ${colorClass} hover:opacity-80`}
          >
            {v}%
            <SortIcon field="followUpRate" />
          </button>
        )
      },
    },
    {
      key: 'riskCount',
      title: '风险数',
      dataIndex: 'riskCount' as const,
      align: 'right' as const,
      render: (value: unknown) => {
        const v = Number(value)
        if (v === 0) return <span className="text-emerald-600">0</span>
        const colorClass = v >= 3 ? 'text-red-600' : 'text-amber-600'
        return (
          <button
            onClick={() => handleSort('riskCount')}
            className={`font-medium ${colorClass} hover:opacity-80`}
          >
            {v}
            <SortIcon field="riskCount" />
          </button>
        )
      },
    },
  ]

  const getRiskBadgeVariant = (level: RiskPoint['level']) => {
    switch (level) {
      case 'high':
      case 'critical':
        return 'danger' as const
      case 'medium':
        return 'warning' as const
      default:
        return 'info' as const
    }
  }

  const getRiskLevelLabel = (level: RiskPoint['level']) => {
    switch (level) {
      case 'critical':
        return '危重'
      case 'high':
        return '高风险'
      case 'medium':
        return '中风险'
      default:
        return '低风险'
    }
  }

  const getStatusBadge = (status: CustomerRecord['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="warning"><Clock className="w-3 h-3 mr-1" />待复核</Badge>
      case 'reviewing':
        return <Badge variant="info"><Activity className="w-3 h-3 mr-1" />复核中</Badge>
      case 'confirmed':
        return <Badge variant="success"><CheckCircle className="w-3 h-3 mr-1" />已通过</Badge>
      case 'rejected':
        return <Badge variant="danger"><AlertCircle className="w-3 h-3 mr-1" />已驳回</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">经营看板</h1>
          <p className="text-sm text-slate-500 mt-1">查看门店经营数据和趋势分析</p>
        </div>
      </div>

      <div className="card p-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
          {TIME_RANGES.map((range) => (
            <button
              key={range.key}
              onClick={() => setTimeRange(range.key)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                timeRange === range.key
                  ? 'bg-white text-medical-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>

        <div className="relative">
          <button
            onClick={() => setStoreDropdownOpen(!storeDropdownOpen)}
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 hover:bg-slate-50 transition-colors min-w-[180px]"
          >
            <Search className="w-4 h-4 text-slate-400" />
            <span className="flex-1 text-left">
              {selectedStore === 'all'
                ? '全部门店'
                : stores.find((s) => s.id === selectedStore)?.shortName || '全部门店'}
            </span>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${storeDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {storeDropdownOpen && (
            <div className="absolute top-full left-0 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg z-10 py-1 max-h-60 overflow-y-auto">
              <button
                onClick={() => {
                  setSelectedStore('all')
                  setStoreDropdownOpen(false)
                }}
                className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-50 transition-colors ${
                  selectedStore === 'all' ? 'text-medical-600 font-medium bg-medical-50' : 'text-slate-700'
                }`}
              >
                全部门店
              </button>
              {stores
                .filter((s) => s.status === 'active')
                .map((store) => (
                  <button
                    key={store.id}
                    onClick={() => {
                      setSelectedStore(store.id)
                      setStoreDropdownOpen(false)
                    }}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-50 transition-colors ${
                      selectedStore === store.id ? 'text-medical-600 font-medium bg-medical-50' : 'text-slate-700'
                    }`}
                  >
                    {store.shortName}
                  </button>
                ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="总注射项目量"
          value={kpiData.totalRecords}
          icon={<Syringe className="w-5 h-5" />}
          trend={12.5}
          trendLabel="环比"
          color="blue"
        />
        <StatCard
          title="总营收"
          value={formatCurrency(kpiData.totalRevenue)}
          icon={<DollarSign className="w-5 h-5" />}
          trend={8.3}
          trendLabel="环比"
          color="green"
        />
        <StatCard
          title="平均客单价"
          value={formatCurrency(kpiData.avgOrderValue)}
          icon={<CreditCard className="w-5 h-5" />}
          trend={-2.1}
          trendLabel="环比"
          color="pink"
        />
        <StatCard
          title="复诊达成率"
          value={`${kpiData.followUpRate}%`}
          icon={<ClipboardCheck className="w-5 h-5" />}
          trend={5.6}
          trendLabel="环比"
          color="purple"
        />
        <StatCard
          title="待复核记录"
          value={kpiData.pendingReview}
          icon={<FileWarning className="w-5 h-5" />}
          trend={-15.2}
          trendLabel="环比"
          color="orange"
        />
        <StatCard
          title="风险预警数"
          value={kpiData.activeRiskPoints}
          icon={<AlertTriangle className="w-5 h-5" />}
          trend={kpiData.activeRiskPoints > 0 ? 20 : 0}
          trendLabel="环比"
          color="blue"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-slate-800">近30天注射项目量趋势</h3>
              <p className="text-xs text-slate-500 mt-0.5">项目数量和营收变化</p>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="count"
                  name="项目量"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorCount)"
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="营收"
                  stroke="#ec4899"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-slate-800">项目类型分布</h3>
              <p className="text-xs text-slate-500 mt-0.5">各类项目占比统计</p>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  labelLine={{ stroke: '#94a3b8', strokeWidth: 1 }}
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-slate-800">门店业绩排名</h3>
            <p className="text-xs text-slate-500 mt-0.5">点击列标题可排序</p>
          </div>
        </div>
        <DataTable
          columns={storeColumns}
          dataSource={storeRankingData}
          rowKey="storeId"
          pagination={false}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="card p-5 xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-slate-800">近期待复核记录</h3>
              <p className="text-xs text-slate-500 mt-0.5">最近5条需要复核的注射记录</p>
            </div>
            <button className="text-sm text-medical-600 hover:text-medical-700 font-medium">
              查看全部
            </button>
          </div>
          <div className="space-y-3">
            {pendingRecords.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-sm">暂无待复核记录</div>
            ) : (
              pendingRecords.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-500 flex items-center justify-center text-white font-medium">
                      {record.customerName.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-800">{record.customerName}</span>
                        <span className="text-xs text-slate-400">{record.customerAge}岁</span>
                        {getStatusBadge(record.status)}
                      </div>
                      <div className="text-sm text-slate-500 mt-0.5">
                        {record.projectName} · {record.doctorName} · {record.storeName}
                      </div>
                      {record.riskPoints && record.riskPoints.length > 0 && (
                        <div className="flex items-center gap-1 mt-1">
                          <AlertTriangle className="w-3 h-3 text-amber-500" />
                          <span className="text-xs text-amber-600">
                            含 {record.riskPoints.length} 个风险点
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-2 rounded-lg text-medical-600 hover:bg-medical-50 transition-colors">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="p-2 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors">
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-slate-800">风险预警</h3>
              <p className="text-xs text-slate-500 mt-0.5">当前未处理的风险点</p>
            </div>
            <button className="text-sm text-medical-600 hover:text-medical-700 font-medium">
              全部处理
            </button>
          </div>
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {activeRisks.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-sm flex flex-col items-center gap-2">
                <CheckCircle className="w-10 h-10 text-emerald-400" />
                <span>暂无风险预警，一切正常</span>
              </div>
            ) : (
              activeRisks.map((risk) => {
                const record = customerRecords.find((r) => r.id === risk.recordId)
                return (
                  <div
                    key={risk.id}
                    className="p-3 rounded-xl border bg-white hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={getRiskBadgeVariant(risk.level)}>
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            {getRiskLevelLabel(risk.level)}
                          </Badge>
                          <span className="text-xs text-slate-400">{risk.category}</span>
                        </div>
                        <p className="text-sm text-slate-700 mb-1">{risk.description}</p>
                        {record && (
                          <p className="text-xs text-slate-400">
                            {record.customerName} · {record.storeName}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
