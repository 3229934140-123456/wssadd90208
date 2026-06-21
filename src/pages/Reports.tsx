import React, { useState, useMemo, useCallback } from 'react'
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
  RefreshCw,
  Trash2,
  Expand,
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
  qualityScores,
  riskPoints,
} from '../data/mockData'
import type { Report } from '../types'
import { exportReport, downloadFile } from '../utils/exportUtils'
import { useAppStore } from '../store'

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

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

export default function Reports() {
  const [activeCategory, setActiveCategory] = useState<ReportCategory>('business')
  const [dateRange, setDateRange] = useState('本月')
  const [selectedStores, setSelectedStores] = useState<string[]>([])
  const [selectedProjectType, setSelectedProjectType] = useState('')
  const [showStoreDropdown, setShowStoreDropdown] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [historyFilterCategory, setHistoryFilterCategory] = useState<string>('all')
  const [historyFilterTime, setHistoryFilterTime] = useState<string>('all')
  const [historySearch, setHistorySearch] = useState('')
  const [showDrawer, setShowDrawer] = useState(false)
  const [drawerActiveTab, setDrawerActiveTab] = useState<'all' | 'processing' | 'success' | 'failed'>('all')
  const [historyFilterStore, setHistoryFilterStore] = useState<string>('')
  const [historyFilterProjectType, setHistoryFilterProjectType] = useState<string>('')
  const [historyFilterStatus, setHistoryFilterStatus] = useState<string>('all')
  const [expandedHistoryItems, setExpandedHistoryItems] = useState<Set<string>>(new Set())
  
  const { exportHistory, addExportHistory, updateExportHistory, deleteExportHistory } = useAppStore()
  const mainReport = reports[0]

  const toggleStore = (storeId: string) => {
    setSelectedStores((prev) =>
      prev.includes(storeId) ? prev.filter((s) => s !== storeId) : [...prev, storeId]
    )
  }

  const getBusinessReportData = useCallback(() => {
    const summary = [
      { label: '总营收', value: `¥${mainReport.summary.totalRevenue.toLocaleString()}` },
      { label: '总订单数', value: String(mainReport.summary.totalRecords) },
      { label: '客户总数', value: String(mainReport.summary.totalCustomers) },
      { label: '客单价', value: `¥${mainReport.summary.averageOrderValue.toLocaleString()}` },
    ]

    const storePerformanceData = (mainReport.byStore || []).map((s) => ({
      门店名称: s.storeName,
      订单数: s.count,
      营收: `¥${s.revenue.toLocaleString()}`,
      达成率: Math.round((s.revenue / 500000) * 100),
    }))

    const projectDistributionData = mainReport.byProject.map((p) => ({
      项目名称: p.projectName,
      数量: p.count,
      营收: `¥${p.revenue.toLocaleString()}`,
      占比: `${((p.revenue / mainReport.summary.totalRevenue) * 100).toFixed(1)}%`,
    }))

    const revenueTrendData = Array.from({ length: 6 }, (_, i) => {
      const month = new Date()
      month.setMonth(month.getMonth() - (5 - i))
      return {
        月份: `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`,
        营收: Math.floor(200000 + Math.random() * 400000),
        订单数: Math.floor(30 + Math.random() * 50),
      }
    })

    return {
      summary,
      tables: [
        { title: '门店业绩表', data: storePerformanceData },
        { title: '项目分布表', data: projectDistributionData },
        { title: '营收趋势数据', data: revenueTrendData },
      ],
    }
  }, [mainReport])

  const getQualityReportData = useCallback(() => {
    const passRate = Math.round(((mainReport.qualityStats.excellentCount + mainReport.qualityStats.goodCount) / 
      (mainReport.qualityStats.excellentCount + mainReport.qualityStats.goodCount + mainReport.qualityStats.fairCount + mainReport.qualityStats.poorCount)) * 100)
    
    const summary = [
      { label: '平均质控分', value: String(mainReport.qualityStats.avgScore) },
      { label: '质控通过率', value: `${passRate}%` },
      { label: '风险事件数', value: String(mainReport.riskStats.total) },
      { label: '待整改项', value: String(mainReport.riskStats.openCount) },
    ]

    const qualityScoreData = [
      { 等级: '优秀 (≥90分)', 数量: mainReport.qualityStats.excellentCount, 占比: `${((mainReport.qualityStats.excellentCount / (mainReport.qualityStats.excellentCount + mainReport.qualityStats.goodCount + mainReport.qualityStats.fairCount + mainReport.qualityStats.poorCount)) * 100).toFixed(1)}%` },
      { 等级: '良好 (80-89分)', 数量: mainReport.qualityStats.goodCount, 占比: `${((mainReport.qualityStats.goodCount / (mainReport.qualityStats.excellentCount + mainReport.qualityStats.goodCount + mainReport.qualityStats.fairCount + mainReport.qualityStats.poorCount)) * 100).toFixed(1)}%` },
      { 等级: '一般 (70-79分)', 数量: mainReport.qualityStats.fairCount, 占比: `${((mainReport.qualityStats.fairCount / (mainReport.qualityStats.excellentCount + mainReport.qualityStats.goodCount + mainReport.qualityStats.fairCount + mainReport.qualityStats.poorCount)) * 100).toFixed(1)}%` },
      { 等级: '较差 (<70分)', 数量: mainReport.qualityStats.poorCount, 占比: `${((mainReport.qualityStats.poorCount / (mainReport.qualityStats.excellentCount + mainReport.qualityStats.goodCount + mainReport.qualityStats.fairCount + mainReport.qualityStats.poorCount)) * 100).toFixed(1)}%` },
    ]

    const riskStatsData = [
      { 风险类别: '注射规范', 数量: 5, 高风险: 2, 中风险: 2, 低风险: 1 },
      { 风险类别: '药品管理', 数量: 3, 高风险: 1, 中风险: 1, 低风险: 1 },
      { 风险类别: '记录完整', 数量: 4, 高风险: 0, 中风险: 2, 低风险: 2 },
      { 风险类别: '无菌操作', 数量: 2, 高风险: 1, 中风险: 0, 低风险: 1 },
      { 风险类别: '患者告知', 数量: 2, 高风险: 0, 中风险: 1, 低风险: 1 },
    ]

    return {
      summary,
      tables: [
        { title: '质控评分表', data: qualityScoreData },
        { title: '风险点统计表', data: riskStatsData },
      ],
    }
  }, [mainReport])

  const getDrugReportData = useCallback(() => {
    const totalDrugValue = mainReport.drugStats.reduce((s, d) => s + d.totalValue, 0)
    const warningCount = drugs.filter((d) => d.stock <= d.warningStock).length

    const summary = [
      { label: '药品品类数', value: String(drugs.length) },
      { label: '药品使用次数', value: String(mainReport.summary.drugUsageCount) },
      { label: '药品总营收', value: `¥${totalDrugValue.toLocaleString()}` },
      { label: '库存预警', value: String(warningCount) },
    ]

    const drugUsageData = mainReport.drugStats.map((d) => ({
      药品名称: d.drugName,
      使用量: `${d.totalUsage}${d.unit}`,
      使用金额: `¥${d.totalValue.toLocaleString()}`,
      库存状态: (() => {
        const drug = drugs.find((dr) => dr.name === d.drugName)
        if (!drug) return '正常'
        if (drug.stock === 0) return '缺货'
        if (drug.stock <= drug.warningStock) return '库存不足'
        return '正常'
      })(),
    }))

    const stockWarningData = drugs
      .filter((d) => d.stock <= d.warningStock)
      .slice(0, 10)
      .map((d) => ({
        药品名称: d.name,
        品牌: d.brand,
        规格: d.specification,
        当前库存: `${d.stock}${d.unit}`,
        预警值: `${d.warningStock}${d.unit}`,
        状态: d.stock === 0 ? '缺货' : d.status === 'expiring' ? '即将过期' : '库存不足',
      }))

    return {
      summary,
      tables: [
        { title: '药品使用统计表', data: drugUsageData },
        { title: '库存预警表', data: stockWarningData },
      ],
    }
  }, [mainReport])

  const getPerformanceReportData = useCallback(() => {
    const avgPerformance = Math.round(mainReport.summary.totalRevenue / mainReport.summary.doctorCount)
    const avgScore = (mainReport.byDoctor.reduce((s, d) => s + d.avgScore, 0) / mainReport.byDoctor.length).toFixed(1)

    const summary = [
      { label: '在岗医生数', value: String(mainReport.summary.doctorCount) },
      { label: '人均业绩', value: `¥${avgPerformance.toLocaleString()}` },
      { label: '人均项目量', value: (mainReport.summary.totalRecords / mainReport.summary.doctorCount).toFixed(1) },
      { label: '平均质控分', value: avgScore },
    ]

    const doctorPerformanceData = mainReport.byDoctor
      .sort((a, b) => b.revenue - a.revenue)
      .map((d, idx) => ({
        排名: idx + 1,
        医生姓名: d.doctorName,
        门店: (doctors.find((doc) => doc.id === d.doctorId)?.storeName) || '-',
        项目量: d.count,
        业绩: `¥${d.revenue.toLocaleString()}`,
        平均分: d.avgScore,
      }))

    const qualityRankData = [...mainReport.byDoctor]
      .sort((a, b) => b.avgScore - a.avgScore)
      .map((d, idx) => ({
        排名: idx + 1,
        医生姓名: d.doctorName,
        职称: (() => {
          const doc = doctors.find((doc) => doc.id === d.doctorId)
          const titleMap: Record<string, string> = { chief: '主任医师', associate_chief: '副主任医师', attending: '主治医师', resident: '住院医师' }
          return doc ? titleMap[doc.title] || '-' : '-'
        })(),
        平均分: d.avgScore,
        项目量: d.count,
      }))

    return {
      summary,
      tables: [
        { title: '医生业绩排名', data: doctorPerformanceData },
        { title: '质控评分排名', data: qualityRankData },
      ],
    }
  }, [mainReport])

  const getCustomerReportData = useCallback(() => {
    const summary = [
      { label: '客户总数', value: String(mainReport.summary.totalCustomers) },
      { label: '新增客户', value: String(mainReport.summary.newCustomers) },
      { label: '平均满意度', value: `${mainReport.customerSatisfaction.avgSatisfaction}分` },
      { label: '回访响应率', value: `${Math.round(mainReport.customerSatisfaction.responseRate * 100)}%` },
    ]

    const customerProfileData = [
      { 年龄段: '18-25岁', 人数: 5, 占比: '11.1%' },
      { 年龄段: '26-30岁', 人数: 12, 占比: '26.7%' },
      { 年龄段: '31-35岁', 人数: 15, 占比: '33.3%' },
      { 年龄段: '36-40岁', 人数: 8, 占比: '17.8%' },
      { 年龄段: '41-45岁', 人数: 4, 占比: '8.9%' },
      { 年龄段: '45岁+', 人数: 2, 占比: '4.4%' },
    ]

    const satisfactionData = followUpRecords.slice(0, 15).map((fu) => {
      const record = customerRecords.find((r) => r.id === fu.recordId)
      return {
        客户姓名: record?.customerName || '-',
        回访方式: fu.type === 'phone' ? '电话' : fu.type === 'wechat' ? '微信' : fu.type === 'visit' ? '到店' : '其他',
        满意度: `${fu.satisfaction}星`,
        得分: fu.satisfaction * 20,
        回访人: fu.operatorName,
        回访日期: fu.followUpDate,
      }
    })

    return {
      summary,
      tables: [
        { title: '客户画像数据', data: customerProfileData },
        { title: '满意度数据', data: satisfactionData },
      ],
    }
  }, [mainReport])

  const getReportData = useCallback((category: ReportCategory) => {
    switch (category) {
      case 'business':
        return getBusinessReportData()
      case 'quality':
        return getQualityReportData()
      case 'drug':
        return getDrugReportData()
      case 'performance':
        return getPerformanceReportData()
      case 'customer':
        return getCustomerReportData()
      default:
        return { summary: [], tables: [] }
    }
  }, [getBusinessReportData, getQualityReportData, getDrugReportData, getPerformanceReportData, getCustomerReportData])

  const handleExport = useCallback(async (type: 'excel' | 'pdf') => {
    const categoryName = categoryList.find((c) => c.id === activeCategory)?.name || '报表'
    const reportName = `${dateRange}${categoryName}`
    
    const reportData = getReportData(activeCategory)

    const historyId = addExportHistory({
      name: reportName,
      type,
      category: categoryName,
      status: 'processing',
      reportCategory: activeCategory,
      dateRange: dateRange,
      stores: [...selectedStores],
      projectType: selectedProjectType,
      generatedConfig: { ...reportData },
    })

    try {
      const result = await exportReport({
        type,
        name: reportName,
        category: categoryName,
        data: reportData,
      })

      downloadFile(result.blob, result.fileName)
      
      updateExportHistory(historyId, {
        status: 'success',
        size: formatFileSize(result.fileSize),
        fileSize: result.fileSize,
        realFileName: result.fileName,
      })
    } catch (error) {
      updateExportHistory(historyId, {
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : '导出失败，请稍后重试',
      })
    }
  }, [activeCategory, dateRange, selectedStores, selectedProjectType, addExportHistory, updateExportHistory, getReportData])

  const handleRedownload = useCallback(async (item: any) => {
    const categoryName = categoryList.find((c) => c.id === (item.reportCategory || activeCategory))?.name || item.category || '报表'

    let reportDataToUse = item.generatedConfig
    if (!reportDataToUse && item.reportCategory) {
      reportDataToUse = getReportData(item.reportCategory as ReportCategory)
    } else if (!reportDataToUse) {
      reportDataToUse = getReportData(activeCategory)
    }

    try {
      const result = await exportReport({
        type: item.type,
        name: item.name,
        category: categoryName,
        data: reportDataToUse,
      })

      downloadFile(result.blob, result.fileName)
    } catch (error) {
      console.error('重新下载失败:', error)
    }
  }, [activeCategory, getReportData])

  const handleDeleteHistory = useCallback((id: string) => {
    if (window.confirm('确定要删除这条导出历史吗？')) {
      deleteExportHistory(id)
    }
  }, [deleteExportHistory])

  const handleRetry = useCallback(async (item: any) => {
    const categoryName = categoryList.find((c) => c.id === (item.reportCategory || activeCategory))?.name || item.category || '报表'

    let reportDataToUse = item.generatedConfig
    if (!reportDataToUse && item.reportCategory) {
      reportDataToUse = getReportData(item.reportCategory as ReportCategory)
    } else if (!reportDataToUse) {
      reportDataToUse = getReportData(activeCategory)
    }

    updateExportHistory(item.id, {
      status: 'processing',
      errorMessage: undefined,
    })

    try {
      const result = await exportReport({
        type: item.type,
        name: item.name,
        category: categoryName,
        data: reportDataToUse,
      })

      downloadFile(result.blob, result.fileName)

      updateExportHistory(item.id, {
        status: 'success',
        size: formatFileSize(result.fileSize),
        fileSize: result.fileSize,
        realFileName: result.fileName,
        errorMessage: undefined,
      })
    } catch (error) {
      updateExportHistory(item.id, {
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : '导出失败，请稍后重试',
      })
    }
  }, [activeCategory, getReportData, updateExportHistory])

  const toggleHistoryItemExpand = useCallback((id: string) => {
    setExpandedHistoryItems((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const processingCount = useMemo(
    () => exportHistory.filter((e) => e.status === 'processing').length,
    [exportHistory]
  )

  const drawerStats = useMemo(() => {
    const total = exportHistory.length
    const success = exportHistory.filter((e) => e.status === 'success').length
    const failed = exportHistory.filter((e) => e.status === 'failed').length
    const processing = exportHistory.filter((e) => e.status === 'processing').length
    return { total, success, failed, processing }
  }, [exportHistory])

  const filteredDrawerHistory = useMemo(() => {
    const sorted = [...exportHistory].sort((a, b) => {
      const timeA = new Date(a.time.replace(/\//g, '-')).getTime()
      const timeB = new Date(b.time.replace(/\//g, '-')).getTime()
      return timeB - timeA
    })
    if (drawerActiveTab === 'all') return sorted
    return sorted.filter((e) => e.status === drawerActiveTab)
  }, [exportHistory, drawerActiveTab])

  const getProjectTypeName = (type: string): string => {
    const map: Record<string, string> = {
      injection: '注射类',
      filling: '填充类',
      wrinkle_removal: '除皱类',
      hydration: '水光类',
      lifting: '提升类',
    }
    return map[type] || '全部'
  }

  const isWithinDays = useCallback((timeStr: string, days: number): boolean => {
    try {
      const itemDate = new Date(timeStr.replace(/\//g, '-'))
      const now = new Date()
      const diffMs = now.getTime() - itemDate.getTime()
      const diffDays = diffMs / (1000 * 60 * 60 * 24)
      return diffDays <= days
    } catch {
      return true
    }
  }, [])

  const filteredExportHistory = useMemo(() => {
    return exportHistory.filter((item) => {
      if (historyFilterCategory !== 'all') {
        const catMatch = categoryList.find((c) => c.id === historyFilterCategory)?.name
        if (item.category !== catMatch && item.reportCategory !== historyFilterCategory) {
          return false
        }
      }

      if (historyFilterTime !== 'all') {
        const daysMap: Record<string, number> = { '7days': 7, '30days': 30 }
        const days = daysMap[historyFilterTime]
        if (days && !isWithinDays(item.time, days)) {
          return false
        }
      }

      if (historySearch.trim()) {
        const search = historySearch.trim().toLowerCase()
        if (!item.name.toLowerCase().includes(search)) {
          return false
        }
      }

      if (historyFilterStore) {
        if (!item.stores || !item.stores.includes(historyFilterStore)) {
          return false
        }
      }

      if (historyFilterProjectType) {
        if (item.projectType !== historyFilterProjectType) {
          return false
        }
      }

      if (historyFilterStatus !== 'all') {
        if (item.status !== historyFilterStatus) {
          return false
        }
      }

      return true
    })
  }, [exportHistory, historyFilterCategory, historyFilterTime, historySearch, historyFilterStore, historyFilterProjectType, historyFilterStatus, isWithinDays])

  const recentExportHistory = useMemo(() => exportHistory.slice(0, 5), [exportHistory])

  const getStoreNames = (storeIds: string[]): string => {
    if (!storeIds || storeIds.length === 0) return '全部门店'
    const names = storeIds.map((id) => stores.find((s) => s.id === id)?.shortName || id)
    if (names.length <= 2) return names.join('、')
    return `${names.slice(0, 2).join('、')}等${names.length}家`
  }

  return (
    <>
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
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-medium text-slate-700">最近导出</span>
              </div>
              <button
                onClick={() => setShowHistoryModal(true)}
                className="flex items-center gap-1 text-xs text-medical-600 hover:text-medical-700 transition-colors"
              >
                <Expand className="w-3 h-3" />
                全部
              </button>
            </div>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {recentExportHistory.map((e) => (
                <div
                  key={e.id}
                  onClick={() => e.status === 'success' && handleRedownload(e)}
                  className={`p-2.5 rounded-lg bg-slate-50 ${e.status === 'success' ? 'cursor-pointer hover:bg-slate-100' : ''}`}
                >
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
              {recentExportHistory.length === 0 && (
                <div className="py-8 text-center text-xs text-slate-400">暂无导出记录</div>
              )}
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
                <button
                  onClick={() => setShowDrawer(true)}
                  className="relative flex items-center gap-1.5 px-3 py-1.5 border border-medical-200 bg-medical-50 text-medical-700 rounded-lg text-xs font-medium hover:bg-medical-100 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  导出队列
                  {processingCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center px-1 rounded-full bg-red-500 text-white text-[10px] font-bold">
                      {processingCount > 99 ? '99+' : processingCount}
                    </span>
                  )}
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

    {showHistoryModal && (
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[85vh] flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-medical-50 to-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-medical-100 flex items-center justify-center">
                <History className="w-5 h-5 text-medical-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800">导出历史</h2>
                <p className="text-xs text-slate-500">共 {filteredExportHistory.length} 条记录</p>
              </div>
            </div>
            <button
              onClick={() => setShowHistoryModal(false)}
              className="w-9 h-9 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-600">筛选：</span>
              </div>

              <select
                value={historyFilterCategory}
                onChange={(e) => setHistoryFilterCategory(e.target.value)}
                className="input py-1.5 text-xs w-32"
              >
                <option value="all">全部类型</option>
                <option value="business">经营报表</option>
                <option value="quality">质控报表</option>
                <option value="drug">药品报表</option>
                <option value="performance">绩效报表</option>
                <option value="customer">客户报表</option>
              </select>

              <select
                value={historyFilterStore}
                onChange={(e) => setHistoryFilterStore(e.target.value)}
                className="input py-1.5 text-xs w-36"
              >
                <option value="">全部门店</option>
                {stores.filter((s) => s.status === 'active').map((s) => (
                  <option key={s.id} value={s.id}>{s.shortName}</option>
                ))}
              </select>

              <select
                value={historyFilterProjectType}
                onChange={(e) => setHistoryFilterProjectType(e.target.value)}
                className="input py-1.5 text-xs w-32"
              >
                <option value="">全部项目</option>
                <option value="injection">注射类</option>
                <option value="filling">填充类</option>
                <option value="wrinkle_removal">除皱类</option>
                <option value="hydration">水光类</option>
                <option value="lifting">提升类</option>
              </select>

              <select
                value={historyFilterStatus}
                onChange={(e) => setHistoryFilterStatus(e.target.value)}
                className="input py-1.5 text-xs w-28"
              >
                <option value="all">全部状态</option>
                <option value="success">成功</option>
                <option value="processing">生成中</option>
                <option value="failed">失败</option>
              </select>

              <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg">
                {[
                  { label: '近7天', value: '7days' },
                  { label: '近30天', value: '30days' },
                  { label: '全部', value: 'all' },
                ].map((r) => (
                  <button
                    key={r.value}
                    onClick={() => setHistoryFilterTime(r.value)}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                      historyFilterTime === r.value ? 'bg-white text-medical-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>

              <div className="flex-1" />

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  placeholder="搜索文件名..."
                  className="input pl-8 py-1.5 text-xs w-48"
                />
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            <table className="w-full">
              <thead className="bg-slate-50 sticky top-0 z-10">
                <tr className="border-b border-slate-200">
                  <th className="w-10 py-3 px-2"></th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600">文件名</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 w-24">报表类别</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-slate-600 w-20">格式</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 w-24">时间范围</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 w-28">门店</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 w-24">项目类型</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-slate-600 w-24">文件大小</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 w-40">生成时间</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-slate-600 w-20">状态</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-slate-600 w-32">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredExportHistory.map((item) => {
                  const isExpanded = expandedHistoryItems.has(item.id)
                  return (
                    <React.Fragment key={item.id}>
                      <tr className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-2 text-center">
                          <button
                            onClick={() => toggleHistoryItemExpand(item.id)}
                            className="w-6 h-6 rounded hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
                          >
                            <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                          </button>
                        </td>
                        <td className="py-3 px-4">
                          <div
                            className="flex items-center gap-2 cursor-pointer group"
                            onClick={() => item.status === 'success' && handleRedownload(item)}
                          >
                            {item.type === 'excel' ? (
                              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-100 transition-colors">
                                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                              </div>
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0 group-hover:bg-red-100 transition-colors">
                                <File className="w-4 h-4 text-red-500" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <span className="text-sm font-medium text-slate-700 group-hover:text-medical-600 transition-colors truncate max-w-xs block">
                                {item.name}
                              </span>
                              {item.realFileName && (
                                <span className="text-[10px] text-slate-400 truncate max-w-xs block">{item.realFileName}</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs bg-slate-100 text-slate-600">
                            {item.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`text-xs font-semibold ${
                            item.type === 'excel' ? 'text-emerald-600' : 'text-red-500'
                          }`}>
                            {item.type === 'excel' ? 'Excel' : 'PDF'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {item.dateRange ? (
                            <span className="text-xs text-slate-600">{item.dateRange}</span>
                          ) : (
                            <span className="text-xs text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {item.stores && item.stores.length > 0 ? (
                            <span
                              className="text-xs text-slate-600 cursor-help"
                              title={item.stores.map((id) => stores.find((s) => s.id === id)?.name || id).join('、')}
                            >
                              {item.stores.length > 1 ? `已选${item.stores.length}家` : (stores.find((s) => s.id === item.stores![0])?.shortName || '-')}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-500">全部门店</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {item.projectType ? (
                            <span className="text-xs text-slate-600">{getProjectTypeName(item.projectType)}</span>
                          ) : (
                            <span className="text-xs text-slate-400">全部</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right text-sm text-slate-600 font-mono">
                          {item.size || '-'}
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-500">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{item.time}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {item.status === 'success' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-emerald-50 text-emerald-600">
                              <Check className="w-3 h-3" />
                              成功
                            </span>
                          )}
                          {item.status === 'processing' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-medical-50 text-medical-600">
                              <div className="w-3 h-3 border-2 border-medical-500 border-t-transparent rounded-full animate-spin" />
                              处理中
                            </span>
                          )}
                          {item.status === 'failed' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-red-50 text-red-600">
                              <X className="w-3 h-3" />
                              失败
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => item.status === 'success' && handleRedownload(item)}
                              disabled={item.status !== 'success'}
                              className={`p-1.5 rounded-lg transition-colors ${
                                item.status === 'success'
                                  ? 'hover:bg-medical-50 text-medical-600 hover:text-medical-700'
                                  : 'text-slate-300 cursor-not-allowed'
                              }`}
                              title="重新下载"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
                            {item.status === 'failed' && (
                              <button
                                onClick={() => handleRetry(item)}
                                className="p-1.5 rounded-lg hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 transition-colors"
                                title="一键重试"
                              >
                                <RefreshCw className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteHistory(item.id)}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                              title="删除"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-slate-50/60">
                          <td></td>
                          <td colSpan={10} className="py-3 px-4">
                            <div className="bg-white rounded-xl border border-slate-200 p-4">
                              <div className="flex items-center gap-2 mb-3">
                                <div className="w-6 h-6 rounded-md bg-medical-50 flex items-center justify-center">
                                  <Stethoscope className="w-3.5 h-3.5 text-medical-600" />
                                </div>
                                <span className="text-sm font-semibold text-slate-700">生成条件</span>
                              </div>
                              <div className="grid grid-cols-3 gap-4">
                                <div className="flex items-start gap-2">
                                  <Calendar className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                                  <div>
                                    <div className="text-[10px] text-slate-400 mb-0.5">时间范围</div>
                                    <div className="text-xs text-slate-700 font-medium">{item.dateRange || '-'}</div>
                                  </div>
                                </div>
                                <div className="flex items-start gap-2">
                                  <MapPin className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                                  <div>
                                    <div className="text-[10px] text-slate-400 mb-0.5">门店</div>
                                    <div className="text-xs text-slate-700 font-medium">
                                      {item.stores && item.stores.length > 0
                                        ? (
                                          <span title={item.stores.map((id) => stores.find((s) => s.id === id)?.name || id).join('、')}>
                                            {item.stores.length > 1
                                              ? `已选${item.stores.length}家门店`
                                              : (stores.find((s) => s.id === item.stores![0])?.name || '-')
                                            }
                                          </span>
                                        )
                                        : '全部门店'}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-start gap-2">
                                  <FileText className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                                  <div>
                                    <div className="text-[10px] text-slate-400 mb-0.5">项目类型</div>
                                    <div className="text-xs text-slate-700 font-medium">{item.projectType ? getProjectTypeName(item.projectType) : '全部'}</div>
                                  </div>
                                </div>
                              </div>
                              {item.realFileName && (
                                <div className="mt-3 pt-3 border-t border-slate-100">
                                  <div className="text-[10px] text-slate-400 mb-0.5">真实文件名</div>
                                  <div className="text-xs text-slate-600 font-mono">{item.realFileName}</div>
                                </div>
                              )}
                              {item.status === 'failed' && item.errorMessage && (
                                <div className="mt-3 pt-3 border-t border-slate-100">
                                  <div className="text-[10px] text-red-400 mb-0.5">错误信息</div>
                                  <div className="text-xs text-red-600">{item.errorMessage}</div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )
                })}
                {filteredExportHistory.length === 0 && (
                  <tr>
                    <td colSpan={11} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
                          <History className="w-8 h-8 text-slate-300" />
                        </div>
                        <p className="text-sm text-slate-400">暂无符合条件的导出记录</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between px-6 py-3 border-t border-slate-200 bg-slate-50/50">
            <span className="text-xs text-slate-500">
              显示 {filteredExportHistory.length} / {exportHistory.length} 条记录
            </span>
            <button
              onClick={() => setShowHistoryModal(false)}
              className="px-4 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-sm font-medium hover:bg-slate-200 transition-colors"
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    )}

    {showDrawer && (
      <div className="fixed inset-0 z-50">
        <div
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
          onClick={() => setShowDrawer(false)}
        />
        <div className="absolute right-0 top-0 h-full w-96 bg-white shadow-2xl flex flex-col animate-[slideInRight_0.3s_ease-out]">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-gradient-to-r from-medical-50 to-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-medical-100 flex items-center justify-center">
                <Download className="w-5 h-5 text-medical-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800">导出任务队列</h2>
                <p className="text-xs text-slate-500">共 {drawerStats.total} 条任务</p>
              </div>
            </div>
            <button
              onClick={() => setShowDrawer(false)}
              className="w-9 h-9 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          <div className="flex items-center border-b border-slate-200 px-2">
            {[
              { key: 'all' as const, label: '全部', count: drawerStats.total },
              { key: 'processing' as const, label: '生成中', count: drawerStats.processing },
              { key: 'success' as const, label: '成功', count: drawerStats.success },
              { key: 'failed' as const, label: '失败', count: drawerStats.failed },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setDrawerActiveTab(tab.key)}
                className={`relative flex-1 px-3 py-3 text-xs font-medium transition-colors ${
                  drawerActiveTab === tab.key
                    ? 'text-medical-600'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <div className="flex items-center justify-center gap-1.5">
                  <span>{tab.label}</span>
                  {tab.count > 0 && (
                    <span className={`min-w-[18px] h-[18px] flex items-center justify-center px-1 rounded-full text-[10px] font-bold ${
                      drawerActiveTab === tab.key
                        ? tab.key === 'failed'
                          ? 'bg-red-100 text-red-600'
                          : tab.key === 'success'
                          ? 'bg-emerald-100 text-emerald-600'
                          : tab.key === 'processing'
                          ? 'bg-medical-100 text-medical-600'
                          : 'bg-slate-200 text-slate-600'
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      {tab.count > 99 ? '99+' : tab.count}
                    </span>
                  )}
                </div>
                {drawerActiveTab === tab.key && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-medical-500 rounded-full" />
                )}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {filteredDrawerHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                  <Download className="w-8 h-8 text-slate-300" />
                </div>
                <p className="text-sm text-slate-400">暂无任务记录</p>
              </div>
            ) : (
              filteredDrawerHistory.map((item) => (
                <div
                  key={item.id}
                  className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md hover:border-slate-300 transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      item.type === 'excel' ? 'bg-emerald-50' : 'bg-red-50'
                    }`}>
                      {item.type === 'excel' ? (
                        <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <File className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-slate-800 truncate">{item.name}</span>
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
                              item.type === 'excel'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-red-100 text-red-600'
                            }`}>
                              {item.type === 'excel' ? 'Excel' : 'PDF'}
                            </span>
                          </div>
                          {item.realFileName && (
                            <p className="text-[10px] text-slate-400 mt-0.5 truncate font-mono">{item.realFileName}</p>
                          )}
                        </div>
                      </div>

                      <div className="mt-2 flex items-center gap-1.5">
                        {item.status === 'processing' && (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-medical-500 border-t-transparent rounded-full animate-spin" />
                            <span className="text-xs text-slate-500">正在生成...</span>
                          </>
                        )}
                        {item.status === 'success' && (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="text-xs text-emerald-600 font-medium">生成成功</span>
                            {item.size && <span className="text-xs text-slate-400">· {item.size}</span>}
                          </>
                        )}
                        {item.status === 'failed' && (
                          <>
                            <X className="w-3.5 h-3.5 text-red-500" />
                            <span className="text-xs text-slate-500">生成失败</span>
                          </>
                        )}
                      </div>

                      <div className="mt-2.5 text-xs text-slate-500 space-y-1">
                        {(item.dateRange || item.stores) && (
                          <div className="line-clamp-2">
                            {item.dateRange && (
                              <span className="inline-flex items-center gap-0.5">
                                <Calendar className="w-3 h-3 inline" />
                                {item.dateRange}
                              </span>
                            )}
                            {item.dateRange && item.stores && <span className="mx-1">·</span>}
                            {item.stores && (
                              <span
                                className="inline-flex items-center gap-0.5 cursor-help"
                                title={item.stores.map((id) => stores.find((s) => s.id === id)?.name || id).join('、')}
                              >
                                <MapPin className="w-3 h-3 inline" />
                                {item.stores.length === 0 ? '全部门店' : getStoreNames(item.stores)}
                              </span>
                            )}
                          </div>
                        )}
                        {item.status === 'failed' && item.errorMessage && (
                          <div className="text-red-500 text-[11px] truncate" title={item.errorMessage}>
                            {item.errorMessage}
                          </div>
                        )}
                      </div>

                      <div className="mt-3 flex items-center gap-2">
                        {item.status === 'success' && (
                          <button
                            onClick={() => handleRedownload(item)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-medical-50 text-medical-600 text-xs font-medium hover:bg-medical-100 transition-colors"
                          >
                            <Download className="w-3 h-3" />
                            重新下载
                          </button>
                        )}
                        {item.status === 'failed' && (
                          <button
                            onClick={() => handleRetry(item)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 text-xs font-medium hover:bg-emerald-100 transition-colors"
                          >
                            <RefreshCw className="w-3 h-3" />
                            一键重试
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteHistory(item.id)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-50 text-slate-500 text-xs font-medium hover:bg-red-50 hover:text-red-500 transition-colors ml-auto"
                        >
                          <Trash2 className="w-3 h-3" />
                          删除
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="px-5 py-3 border-t border-slate-200 bg-slate-50/50">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <span className="text-slate-500">总数</span>
                  <span className="font-semibold text-slate-700">{drawerStats.total}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Check className="w-3 h-3 text-emerald-500" />
                  <span className="text-slate-500">成功</span>
                  <span className="font-semibold text-emerald-600">{drawerStats.success}</span>
                </div>
                <div className="flex items-center gap-1">
                  <X className="w-3 h-3 text-red-500" />
                  <span className="text-slate-500">失败</span>
                  <span className="font-semibold text-red-500">{drawerStats.failed}</span>
                </div>
              </div>
              <button
                onClick={() => setShowDrawer(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-200 text-slate-600 font-medium hover:bg-slate-300 transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
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
