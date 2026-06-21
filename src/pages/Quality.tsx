import { useState, useMemo } from 'react'
import {
  Users,
  BarChart3,
  Search,
  Filter,
  Eye,
  ChevronRight,
  Award,
  CheckCircle2,
  AlertTriangle,
  Clock,
  TrendingUp,
  Star,
  Calendar,
  MapPin,
  Briefcase,
  FileText,
  Activity,
  ArrowLeft,
  X,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from 'recharts'
import { StatCard, Badge, Tag, DataTable, Modal } from '../components/ui'
import { doctors, customerRecords, stores, qualityScores, injectionPoints } from '../data/mockData'
import type { Doctor, CustomerRecord, QualityScore } from '../types'

type TabType = 'overview' | 'doctors'

const titleMap: Record<string, string> = {
  chief: '主任医师',
  associate_chief: '副主任医师',
  attending: '主治医师',
  resident: '住院医师',
}

const statusMap: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'default' }> = {
  on_duty: { label: '在岗', variant: 'success' },
  off_duty: { label: '休息', variant: 'default' },
  leave: { label: '休假', variant: 'warning' },
}

function getDoctorRecords(doctorId: string) {
  return customerRecords.filter((r) => r.doctorId === doctorId)
}

function getDoctorQualityScores(doctorId: string): QualityScore[] {
  const records = getDoctorRecords(doctorId).filter((r) => r.qualityScore)
  return records.map((r) => r.qualityScore!)
}

function getAvgScore(doctorId: string): number {
  const scores = getDoctorQualityScores(doctorId)
  if (scores.length === 0) return 0
  return scores.reduce((sum, s) => sum + s.totalScore, 0) / scores.length
}

function getFollowUpRate(doctorId: string): number {
  const records = getDoctorRecords(doctorId)
  if (records.length === 0) return 0
  const followed = records.filter((r) => r.followUps && r.followUps.length > 0).length
  return Math.round((followed / records.length) * 100)
}

export default function Quality() {
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null)
  const [selectedRecord, setSelectedRecord] = useState<CustomerRecord | null>(null)

  const [filterStore, setFilterStore] = useState('')
  const [filterTitle, setFilterTitle] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  const filteredDoctors = useMemo(() => {
    return doctors.filter((d) => {
      if (filterStore && d.storeId !== filterStore) return false
      if (filterTitle && d.title !== filterTitle) return false
      if (filterStatus && d.status !== filterStatus) return false
      return true
    })
  }, [filterStore, filterTitle, filterStatus])

  const overviewData = useMemo(() => {
    const allScores = qualityScores
    const avgScore = allScores.length > 0 ? (allScores.reduce((s, q) => s + q.totalScore, 0) / allScores.length).toFixed(1) : '0'
    const excellentRate = allScores.length > 0 ? Math.round((allScores.filter((q) => q.overallRating === 'excellent').length / allScores.length) * 100) : 0
    const passRate = allScores.length > 0 ? Math.round((allScores.filter((q) => q.overallRating !== 'poor').length / allScores.length) * 100) : 0
    const pendingCount = customerRecords.filter((r) => r.status === 'reviewing' || r.status === 'pending').length

    const scoreDistribution = [
      { range: '90-100', count: allScores.filter((q) => q.totalScore >= 90).length },
      { range: '80-89', count: allScores.filter((q) => q.totalScore >= 80 && q.totalScore < 90).length },
      { range: '70-79', count: allScores.filter((q) => q.totalScore >= 70 && q.totalScore < 80).length },
      { range: '60-69', count: allScores.filter((q) => q.totalScore >= 60 && q.totalScore < 70).length },
      { range: '<60', count: allScores.filter((q) => q.totalScore < 60).length },
    ]

    const storeRankings = stores
      .filter((s) => s.status === 'active')
      .map((store) => {
        const storeRecords = customerRecords.filter((r) => r.storeId === store.id && r.qualityScore)
        const avg = storeRecords.length > 0 ? storeRecords.reduce((s, r) => s + r.qualityScore!.totalScore, 0) / storeRecords.length : 0
        return { id: store.id, name: store.shortName, avgScore: avg.toFixed(1), count: storeRecords.length }
      })
      .sort((a, b) => parseFloat(b.avgScore) - parseFloat(a.avgScore))

    const allRiskPoints = customerRecords
      .filter((r) => r.riskPoints && r.riskPoints.length > 0)
      .flatMap((r) => r.riskPoints!.map((rp) => ({ ...rp, doctorName: r.doctorName, storeName: r.storeName, customerName: r.customerName })))
      .sort((a, b) => new Date(b.identifiedAt).getTime() - new Date(a.identifiedAt).getTime())
      .slice(0, 8)

    const followUpStats = doctors.map((doc) => {
      const records = getDoctorRecords(doc.id)
      const expectedFollowUps = records.length
      const actualFollowUps = records.filter((r) => r.followUps && r.followUps.length > 0).length
      const rate = expectedFollowUps > 0 ? Math.round((actualFollowUps / expectedFollowUps) * 100) : 0
      return {
        id: doc.id,
        name: doc.name,
        storeName: doc.storeName,
        expected: expectedFollowUps,
        actual: actualFollowUps,
        rate,
      }
    })

    return { avgScore, excellentRate, passRate, pendingCount, scoreDistribution, storeRankings, allRiskPoints, followUpStats }
  }, [])

  return (
    <div className="space-y-6">
      {selectedDoctor ? (
        <DoctorDetail doctor={selectedDoctor} onBack={() => setSelectedDoctor(null)} onViewRecord={setSelectedRecord} />
      ) : (
        <>
          <div>
            <h1 className="text-xl font-bold text-slate-800">医生质控</h1>
            <p className="text-sm text-slate-500 mt-1">医生诊疗质量监控与评估</p>
          </div>

          <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'overview' ? 'bg-white text-medical-600 shadow-sm' : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              质控概览
            </button>
            <button
              onClick={() => setActiveTab('doctors')}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'doctors' ? 'bg-white text-medical-600 shadow-sm' : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              <Users className="w-4 h-4" />
              医生列表
            </button>
          </div>

          {activeTab === 'overview' && (
            <OverviewTab data={overviewData} />
          )}

          {activeTab === 'doctors' && (
            <DoctorsTab
              doctors={filteredDoctors}
              filterStore={filterStore}
              setFilterStore={setFilterStore}
              filterTitle={filterTitle}
              setFilterTitle={setFilterTitle}
              filterStatus={filterStatus}
              setFilterStatus={setFilterStatus}
              onViewDetail={setSelectedDoctor}
            />
          )}
        </>
      )}

      <Modal
        open={!!selectedRecord}
        onClose={() => setSelectedRecord(null)}
        title="注射点位图"
        width={720}
      >
        {selectedRecord && <InjectionPointViewer record={selectedRecord} />}
      </Modal>
    </div>
  )
}

function OverviewTab({ data }: { data: ReturnType<typeof useMemo<any>> }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="平均质控分" value={data.avgScore} icon={<Star className="w-5 h-5" />} trend={2.3} trendLabel="较上月" color="blue" />
        <StatCard title="优秀率" value={`${data.excellentRate}%`} icon={<Award className="w-5 h-5" />} trend={5.1} trendLabel="较上月" color="pink" />
        <StatCard title="达标率" value={`${data.passRate}%`} icon={<CheckCircle2 className="w-5 h-5" />} trend={1.2} trendLabel="较上月" color="green" />
        <StatCard title="待抽查数" value={data.pendingCount} icon={<Clock className="w-5 h-5" />} trend={-3} trendLabel="较上周" color="orange" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-5 lg:col-span-2">
          <h3 className="text-base font-semibold text-slate-800 mb-4">质控评分分布</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.scoreDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="range" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 8 }}
              />
              <Bar dataKey="count" name="医生数" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={48} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h3 className="text-base font-semibold text-slate-800 mb-4">门店质控排名</h3>
          <div className="space-y-3">
            {data.storeRankings.map((store: any, idx: number) => (
              <div key={store.id} className="flex items-center gap-3">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  idx === 0 ? 'bg-amber-100 text-amber-600' : idx === 1 ? 'bg-slate-200 text-slate-600' : idx === 2 ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-500'
                }`}>
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700 truncate">{store.name}</span>
                    <span className="text-sm font-semibold text-medical-600">{store.avgScore}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-medical-500 to-medical-400 rounded-full" style={{ width: `${store.avgScore}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h3 className="text-base font-semibold text-slate-800 mb-4">近期风险事件</h3>
          <div className="relative">
            <div className="absolute left-3 top-2 bottom-2 w-px bg-slate-200" />
            <div className="space-y-4">
              {data.allRiskPoints.map((risk: any) => (
                <div key={risk.id} className="relative pl-8">
                  <div className={`absolute left-1.5 top-1.5 w-3 h-3 rounded-full border-2 border-white ${
                    risk.level === 'high' ? 'bg-red-500' : risk.level === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
                  }`} />
                  <div className="bg-slate-50 rounded-lg p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={risk.level === 'high' ? 'danger' : risk.level === 'medium' ? 'warning' : 'success'}>
                          {risk.level === 'high' ? '高风险' : risk.level === 'medium' ? '中风险' : '低风险'}
                        </Badge>
                        <span className="text-xs text-slate-500">{risk.category}</span>
                      </div>
                      <span className="text-xs text-slate-400">{new Date(risk.identifiedAt).toLocaleDateString('zh-CN')}</span>
                    </div>
                    <p className="text-sm text-slate-700 mt-2">{risk.description}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                      <span>医生：{risk.doctorName}</span>
                      <span>门店：{risk.storeName}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-slate-800">复诊达成率</h3>
            <span className="text-xs text-slate-400">按医生统计</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2.5 px-2 text-xs font-semibold text-slate-600">医生</th>
                  <th className="text-center py-2.5 px-2 text-xs font-semibold text-slate-600">应复诊</th>
                  <th className="text-center py-2.5 px-2 text-xs font-semibold text-slate-600">实际复诊</th>
                  <th className="text-right py-2.5 px-2 text-xs font-semibold text-slate-600">达成率</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.followUpStats.slice(0, 10).map((stat: any) => (
                  <tr key={stat.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-medical-100 flex items-center justify-center text-xs font-medium text-medical-600">
                          {stat.name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-slate-700">{stat.name}</div>
                          <div className="text-xs text-slate-400">{stat.storeName}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-2 text-center text-sm text-slate-600">{stat.expected}</td>
                    <td className="py-2.5 px-2 text-center text-sm text-slate-600">{stat.actual}</td>
                    <td className={`py-2.5 px-2 text-right text-sm font-semibold ${stat.rate < 70 ? 'text-red-500' : stat.rate < 85 ? 'text-amber-500' : 'text-emerald-500'}`}>
                      {stat.rate}%
                    </td>
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

interface DoctorsTabProps {
  doctors: Doctor[]
  filterStore: string
  setFilterStore: (v: string) => void
  filterTitle: string
  setFilterTitle: (v: string) => void
  filterStatus: string
  setFilterStatus: (v: string) => void
  onViewDetail: (d: Doctor) => void
}

function DoctorsTab({
  doctors,
  filterStore,
  setFilterStore,
  filterTitle,
  setFilterTitle,
  filterStatus,
  setFilterStatus,
  onViewDetail,
}: DoctorsTabProps) {
  const columns = [
    {
      key: 'name',
      title: '医生',
      dataIndex: 'name' as const,
      width: 200,
      render: (_: any, record: Doctor) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-medical-500 to-primary-500 flex items-center justify-center text-white font-semibold text-sm">
            {record.name.charAt(0)}
          </div>
          <div>
            <div className="text-sm font-medium text-slate-800">{record.name}</div>
            <div className="text-xs text-slate-400">{record.gender === 'female' ? '女' : '男'} · {record.age}岁</div>
          </div>
        </div>
      ),
    },
    {
      key: 'store',
      title: '门店',
      dataIndex: 'storeName' as const,
      render: (v: any) => <span className="text-sm text-slate-600">{v}</span>,
    },
    {
      key: 'title',
      title: '职称',
      dataIndex: 'title' as const,
      render: (v: any) => <Tag color="blue">{titleMap[v]}</Tag>,
    },
    {
      key: 'years',
      title: '从业年限',
      dataIndex: 'yearsOfExperience' as const,
      align: 'center' as const,
      render: (v: any) => <span className="text-sm text-slate-600">{v}年</span>,
    },
    {
      key: 'projects',
      title: '累计项目量',
      dataIndex: 'id' as const,
      align: 'center' as const,
      render: (v: any) => <span className="text-sm text-slate-600">{getDoctorRecords(v).length}</span>,
    },
    {
      key: 'avgScore',
      title: '平均质控分',
      dataIndex: 'id' as const,
      align: 'center' as const,
      render: (v: any) => {
        const score = getAvgScore(v)
        return (
          <span className={`text-sm font-semibold ${score >= 90 ? 'text-emerald-600' : score >= 80 ? 'text-medical-600' : score >= 70 ? 'text-amber-600' : 'text-red-500'}`}>
            {score.toFixed(1)}
          </span>
        )
      },
    },
    {
      key: 'followUp',
      title: '复诊达成率',
      dataIndex: 'id' as const,
      align: 'center' as const,
      render: (v: any) => {
        const rate = getFollowUpRate(v)
        return (
          <span className={`text-sm font-semibold ${rate < 70 ? 'text-red-500' : rate < 85 ? 'text-amber-500' : 'text-emerald-500'}`}>
            {rate}%
          </span>
        )
      },
    },
    {
      key: 'status',
      title: '状态',
      dataIndex: 'status' as const,
      align: 'center' as const,
      render: (v: any) => <Badge variant={statusMap[v].variant}>{statusMap[v].label}</Badge>,
    },
    {
      key: 'action',
      title: '操作',
      dataIndex: 'id' as const,
      align: 'center' as const,
      render: (_: any, record: Doctor) => (
        <button
          onClick={() => onViewDetail(record)}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-medical-600 hover:bg-medical-50 rounded-lg transition-colors"
        >
          <Eye className="w-4 h-4" />
          详情
        </button>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-600">筛选：</span>
          </div>
          <select
            value={filterStore}
            onChange={(e) => setFilterStore(e.target.value)}
            className="input w-40"
          >
            <option value="">全部门店</option>
            {stores.filter((s) => s.status === 'active').map((s) => (
              <option key={s.id} value={s.id}>{s.shortName}</option>
            ))}
          </select>
          <select
            value={filterTitle}
            onChange={(e) => setFilterTitle(e.target.value)}
            className="input w-36"
          >
            <option value="">全部职称</option>
            <option value="chief">主任医师</option>
            <option value="associate_chief">副主任医师</option>
            <option value="attending">主治医师</option>
            <option value="resident">住院医师</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="input w-32"
          >
            <option value="">全部状态</option>
            <option value="on_duty">在岗</option>
            <option value="off_duty">休息</option>
            <option value="leave">休假</option>
          </select>
          <div className="flex-1" />
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input placeholder="搜索医生姓名" className="input pl-9 w-48" />
          </div>
        </div>
      </div>

      <DataTable
        columns={columns as any}
        dataSource={doctors as any[]}
        rowKey="id"
        pageSize={8}
      />
    </div>
  )
}

interface DoctorDetailProps {
  doctor: Doctor
  onBack: () => void
  onViewRecord: (r: CustomerRecord) => void
}

function DoctorDetail({ doctor, onBack, onViewRecord }: DoctorDetailProps) {
  const records = getDoctorRecords(doctor.id)
  const qScores = getDoctorQualityScores(doctor.id)
  const avgScore = getAvgScore(doctor.id)
  const followUpRate = getFollowUpRate(doctor.id)

  const performanceTrend = Array.from({ length: 6 }, (_, i) => {
    const month = new Date()
    month.setMonth(month.getMonth() - (5 - i))
    const monthRecords = records.filter((r) => {
      const rd = new Date(r.createdAt)
      return rd.getMonth() === month.getMonth() && rd.getFullYear() === month.getFullYear()
    })
    const monthScores = monthRecords.filter((r) => r.qualityScore).map((r) => r.qualityScore!.totalScore)
    return {
      month: `${month.getMonth() + 1}月`,
      项目量: monthRecords.length,
      平均分: monthScores.length > 0 ? Math.round(monthScores.reduce((a, b) => a + b, 0) / monthScores.length) : 0,
    }
  })

  const recentRecords = records.slice(0, 10)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-800">医生详情</h1>
          <p className="text-sm text-slate-500 mt-1">查看医生资料与质控记录</p>
        </div>
      </div>

      <div className="card p-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-shrink-0">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-medical-500 to-primary-500 flex items-center justify-center text-white font-bold text-3xl">
              {doctor.name.charAt(0)}
            </div>
          </div>
          <div className="flex-1 space-y-4">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold text-slate-800">{doctor.name}</h2>
                <Tag color="blue">{titleMap[doctor.title]}</Tag>
                <Badge variant={statusMap[doctor.status].variant}>{statusMap[doctor.status].label}</Badge>
              </div>
              {doctor.introduction && (
                <p className="text-sm text-slate-500 mt-2">{doctor.introduction}</p>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span>{doctor.storeName}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Briefcase className="w-4 h-4 text-slate-400" />
                <span>从业{doctor.yearsOfExperience}年</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>{doctor.joinDate}入职</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Activity className="w-4 h-4 text-slate-400" />
                <span>累计{records.length}例</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-2">专长领域</p>
              <div className="flex flex-wrap gap-2">
                {doctor.specialty.map((s, i) => (
                  <Tag key={i} color="pink">{s}</Tag>
                ))}
              </div>
            </div>
            {doctor.certifications && doctor.certifications.length > 0 && (
              <div>
                <p className="text-xs text-slate-400 mb-2">资质认证</p>
                <div className="flex flex-wrap gap-2">
                  {doctor.certifications.map((c, i) => (
                    <Tag key={i} color="green">{c}</Tag>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="grid grid-cols-3 gap-4 md:gap-6">
            <div className="text-center p-4 bg-medical-50 rounded-xl">
              <p className="text-xs text-slate-500">平均质控分</p>
              <p className={`text-2xl font-bold mt-1 ${avgScore >= 90 ? 'text-emerald-600' : avgScore >= 80 ? 'text-medical-600' : 'text-amber-600'}`}>
                {avgScore.toFixed(1)}
              </p>
            </div>
            <div className="text-center p-4 bg-pink-50 rounded-xl">
              <p className="text-xs text-slate-500">复诊达成率</p>
              <p className={`text-2xl font-bold mt-1 ${followUpRate >= 85 ? 'text-emerald-600' : followUpRate >= 70 ? 'text-amber-500' : 'text-red-500'}`}>
                {followUpRate}%
              </p>
            </div>
            <div className="text-center p-4 bg-emerald-50 rounded-xl">
              <p className="text-xs text-slate-500">总业绩</p>
              <p className="text-2xl font-bold mt-1 text-emerald-600">
                ¥{records.reduce((s, r) => s + r.totalAmount, 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-5">
        <h3 className="text-base font-semibold text-slate-800 mb-4">业绩趋势</h3>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={performanceTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
            <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
            <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
            <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 8 }} />
            <Legend />
            <Line yAxisId="left" type="monotone" dataKey="项目量" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4, fill: '#3b82f6' }} />
            <Line yAxisId="right" type="monotone" dataKey="平均分" stroke="#ec4899" strokeWidth={2.5} dot={{ r: 4, fill: '#ec4899' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h3 className="text-base font-semibold text-slate-800 mb-4">质控评分历史</h3>
          {qScores.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">暂无评分记录</div>
          ) : (
            <div className="space-y-3 max-h-[360px] overflow-y-auto">
              {qScores.slice(0, 15).map((qs, idx) => (
                <div key={qs.id} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold ${
                    qs.totalScore >= 90 ? 'bg-emerald-100 text-emerald-600' : qs.totalScore >= 80 ? 'bg-medical-100 text-medical-600' : qs.totalScore >= 70 ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'
                  }`}>
                    {qs.totalScore}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant={qs.overallRating === 'excellent' ? 'success' : qs.overallRating === 'good' ? 'info' : qs.overallRating === 'fair' ? 'warning' : 'danger'}>
                        {qs.overallRating === 'excellent' ? '优秀' : qs.overallRating === 'good' ? '良好' : qs.overallRating === 'fair' ? '一般' : '较差'}
                      </Badge>
                      <span className="text-xs text-slate-400">{new Date(qs.evaluatedAt).toLocaleDateString('zh-CN')}</span>
                    </div>
                    {qs.remarks && <p className="text-sm text-slate-600 mt-1.5">{qs.remarks}</p>}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {qs.scores.map((sc, i) => (
                        <span key={i} className="text-xs text-slate-500">
                          {sc.category}: {sc.score}/{sc.fullScore}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-slate-800">病例抽查</h3>
            <span className="text-xs text-slate-400">最近10条记录</span>
          </div>
          {recentRecords.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">暂无病例记录</div>
          ) : (
            <div className="space-y-2 max-h-[360px] overflow-y-auto">
              {recentRecords.map((r) => (
                <div
                  key={r.id}
                  onClick={() => onViewRecord(r)}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors border border-slate-100"
                >
                  <div className="w-9 h-9 rounded-lg bg-medical-50 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-medical-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-700 truncate">{r.projectName}</span>
                      {r.qualityScore && (
                        <span className={`text-xs font-semibold ${
                          r.qualityScore.totalScore >= 90 ? 'text-emerald-600' : r.qualityScore.totalScore >= 80 ? 'text-medical-600' : 'text-amber-600'
                        }`}>
                          {r.qualityScore.totalScore}分
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-slate-400">{r.customerName}</span>
                      <span className="text-xs text-slate-300">·</span>
                      <span className="text-xs text-slate-400">{new Date(r.createdAt).toLocaleDateString('zh-CN')}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function InjectionPointViewer({ record }: { record: CustomerRecord }) {
  const facePoints = injectionPoints.filter((p) => p.category === 'face')

  const getPointColor = (pointId: string) => {
    const hit = record.injectionPoints.find((ip) => ip.pointId === pointId)
    if (hit) return '#ec4899'
    return '#cbd5e1'
  }

  const getActualDosage = (pointId: string) => {
    const hit = record.injectionPoints.find((ip) => ip.pointId === pointId)
    return hit ? `${hit.actualDosage}${hit.unit}` : null
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border border-slate-200 rounded-xl p-3 bg-slate-50">
          <p className="text-xs text-slate-400 mb-2">客户信息</p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-500 flex items-center justify-center text-white font-semibold text-sm">
              {record.customerName.charAt(0)}
            </div>
            <div>
              <div className="text-sm font-medium text-slate-700">{record.customerName}</div>
              <div className="text-xs text-slate-400">{record.customerGender === 'female' ? '女' : '男'} · {record.customerAge}岁</div>
            </div>
          </div>
        </div>
        <div className="border border-slate-200 rounded-xl p-3 bg-slate-50">
          <p className="text-xs text-slate-400 mb-2">项目信息</p>
          <div className="text-sm font-medium text-slate-700">{record.projectName}</div>
          <div className="text-xs text-slate-400 mt-1">
            {new Date(record.createdAt).toLocaleString('zh-CN')}
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-shrink-0 mx-auto">
          <div className="relative w-64 h-80 bg-gradient-to-b from-slate-50 to-slate-100 rounded-2xl border-2 border-slate-200 overflow-hidden">
            <svg viewBox="0 0 100 110" className="w-full h-full">
              <ellipse cx="50" cy="50" rx="35" ry="42" fill="#fef3c7" opacity="0.4" />
              <ellipse cx="35" cy="35" rx="5" ry="3" fill="#64748b" opacity="0.4" />
              <ellipse cx="65" cy="35" rx="5" ry="3" fill="#64748b" opacity="0.4" />
              <path d="M 45 48 Q 50 52 55 48" stroke="#64748b" strokeWidth="1" fill="none" opacity="0.4" />
              <ellipse cx="50" cy="60" rx="6" ry="3" fill="#64748b" opacity="0.3" />
              <rect x="28" y="88" width="44" height="22" rx="4" fill="#e2e8f0" opacity="0.4" />
              {facePoints.map((p) => p.coordinates && (
                <g key={p.id}>
                  <circle
                    cx={p.coordinates.x}
                    cy={p.coordinates.y}
                    r="2.5"
                    fill={getPointColor(p.id)}
                    stroke="white"
                    strokeWidth="0.8"
                  />
                  {getActualDosage(p.id) && (
                    <text
                      x={p.coordinates.x}
                      y={p.coordinates.y - 4}
                      fontSize="3.5"
                      textAnchor="middle"
                      fill="#be185d"
                      fontWeight="bold"
                    >
                      {getActualDosage(p.id)}
                    </text>
                  )}
                </g>
              ))}
            </svg>
          </div>
          <p className="text-xs text-center text-slate-400 mt-2">粉色点位为本次注射位置</p>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-700 mb-3">注射点位明细</p>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {record.injectionPoints.length === 0 ? (
              <p className="text-sm text-slate-400">该项目无具体注射点位记录</p>
            ) : (
              record.injectionPoints.map((ip, idx) => {
                const pointInfo = injectionPoints.find((p) => p.id === ip.pointId)
                return (
                  <div key={idx} className="p-3 rounded-lg border border-slate-200 bg-white">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-700">{ip.pointName}</span>
                      <Tag color="pink">{ip.actualDosage}{ip.unit}</Tag>
                    </div>
                    {pointInfo && (
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
                        <span>{pointInfo.facialZone}</span>
                        {ip.depth && <span>深度: {ip.depth.toFixed(1)}mm</span>}
                        {ip.angle && <span>角度: {ip.angle}°</span>}
                      </div>
                    )}
                    {pointInfo?.description && (
                      <p className="text-xs text-slate-400 mt-1.5">{pointInfo.description}</p>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {record.drugs.length > 0 && (
        <div>
          <p className="text-sm font-medium text-slate-700 mb-3">使用药品</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {record.drugs.map((drug) => (
              <div key={drug.id} className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">{drug.drugName}</span>
                  <span className="text-xs text-slate-500">{drug.dosage}{drug.unit}</span>
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  {drug.drugBrand} · {drug.specification} · 批次{drug.batchNo}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
