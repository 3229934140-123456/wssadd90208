import { useState, useMemo, useEffect } from 'react'
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
  Plus,
  Edit2,
  UserX,
  UserCheck,
  Shield,
  LayoutTemplate,
  Pill,
  ClipboardCheck,
  Settings,
  Check,
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
import { doctors as mockDoctors, customerRecords, stores, qualityScores, injectionPoints } from '../data/mockData'
import type { Doctor, CustomerRecord, QualityScore, Gender } from '../types'
import { useAppStore, type DoctorAccount } from '../store'

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

const permissionModules = [
  { key: 'dashboard', name: '经营看板', icon: BarChart3 },
  { key: 'records', name: '诊疗记录', icon: FileText },
  { key: 'record_entry', name: '记录录入', icon: FileText },
  { key: 'record_view', name: '记录查看', icon: Eye },
  { key: 'templates', name: '项目模板', icon: LayoutTemplate },
  { key: 'template_view', name: '项目模板查看', icon: Eye },
  { key: 'drugs', name: '药品管理', icon: Pill },
  { key: 'drug_view', name: '药品查看', icon: Eye },
  { key: 'quality', name: '质量控制', icon: ClipboardCheck },
  { key: 'reports', name: '报表中心', icon: BarChart3 },
  { key: 'settings', name: '系统设置', icon: Settings },
  { key: 'permissions', name: '权限管理', icon: Shield },
]

const rolePermissions: Record<string, string[]> = {
  chief: ['dashboard', 'records', 'record_entry', 'record_view', 'templates', 'template_view', 'drugs', 'drug_view', 'quality', 'reports', 'settings', 'permissions'],
  associate_chief: ['dashboard', 'records', 'record_entry', 'record_view', 'templates', 'template_view', 'drugs', 'drug_view', 'quality', 'reports', 'settings'],
  attending: ['record_view', 'template_view', 'drug_view'],
  resident: ['record_entry'],
}

interface DoctorFormData {
  name: string
  gender: Gender
  phone: string
  idCardNo: string
  licenseNo: string
  title: 'chief' | 'associate_chief' | 'attending' | 'resident'
  storeId: string
  specialty: string[]
  yearsOfExperience: number
  username: string
  password: string
  role: string
  permissions: string[]
  status: 'on_duty' | 'off_duty' | 'leave'
}

const specialtyOptions = [
  '注射美容',
  '面部年轻化',
  '玻尿酸填充',
  '瘦脸针',
  '除皱针',
  '面部轮廓塑形',
  '水光针',
  '中胚层疗法',
  '皮肤修复',
  '埋线提升',
  '颈部年轻化',
  '唇部美化',
  '眼周抗衰',
  '皮肤管理',
  '基础注射',
]

function validatePhone(phone: string): boolean {
  return /^1[3-9]\d{9}$/.test(phone)
}

function validateIdCard(idCard: string): boolean {
  return /^[1-9]\d{5}(19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/.test(idCard)
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

  const [showDoctorModal, setShowDoctorModal] = useState(false)
  const [editingDoctor, setEditingDoctor] = useState<DoctorAccount | null>(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [toggleDoctorId, setToggleDoctorId] = useState<string | null>(null)

  const { doctors: storeDoctors, addDoctor, updateDoctor, toggleDoctorStatus } = useAppStore()

  const allDoctors = useMemo(() => {
    const merged: (Doctor | DoctorAccount)[] = [...storeDoctors]
    mockDoctors.forEach((md) => {
      if (!merged.find((d) => d.id === md.id)) {
        merged.push(md)
      }
    })
    return merged
  }, [storeDoctors])

  const filteredDoctors = useMemo(() => {
    return allDoctors.filter((d) => {
      if (filterStore && d.storeId !== filterStore) return false
      if (filterTitle && d.title !== filterTitle) return false
      if (filterStatus && d.status !== filterStatus) return false
      return true
    })
  }, [allDoctors, filterStore, filterTitle, filterStatus])

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

    const followUpStats = allDoctors.map((doc) => {
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
  }, [allDoctors, getDoctorRecords])

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
              onNewDoctor={() => {
                setEditingDoctor(null)
                setShowDoctorModal(true)
              }}
              onEditDoctor={(doctor) => {
                if ('username' in doctor) {
                  setEditingDoctor(doctor as DoctorAccount)
                } else {
                  setEditingDoctor({
                    ...doctor,
                    username: '',
                    password: '',
                    role: doctor.title,
                    permissions: rolePermissions[doctor.title] || [],
                  } as DoctorAccount)
                }
                setShowDoctorModal(true)
              }}
              onToggleStatus={(doctorId) => {
                setToggleDoctorId(doctorId)
                setShowConfirmModal(true)
              }}
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

      <DoctorFormModal
        open={showDoctorModal}
        editingDoctor={editingDoctor}
        onClose={() => {
          setShowDoctorModal(false)
          setEditingDoctor(null)
        }}
        onSave={(data) => {
          if (editingDoctor) {
            updateDoctor(editingDoctor.id, data)
          } else {
            addDoctor(data)
          }
          setShowDoctorModal(false)
          setEditingDoctor(null)
        }}
      />

      <Modal
        open={showConfirmModal}
        onClose={() => {
          setShowConfirmModal(false)
          setToggleDoctorId(null)
        }}
        title="确认操作"
        width={400}
        footer={
          <>
            <button
              onClick={() => {
                setShowConfirmModal(false)
                setToggleDoctorId(null)
              }}
              className="btn-secondary"
            >
              取消
            </button>
            <button
              onClick={() => {
                if (toggleDoctorId) {
                  toggleDoctorStatus(toggleDoctorId)
                }
                setShowConfirmModal(false)
                setToggleDoctorId(null)
              }}
              className="btn-primary"
            >
              确认
            </button>
          </>
        }
      >
        <div className="py-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700">
                {toggleDoctorId && allDoctors.find((d) => d.id === toggleDoctorId)?.status === 'on_duty'
                  ? '确定要停用该医生账号吗？'
                  : '确定要启用该医生账号吗？'}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {toggleDoctorId && allDoctors.find((d) => d.id === toggleDoctorId)?.status === 'on_duty'
                  ? '停用后该医生将无法登录系统'
                  : '启用后该医生将恢复登录权限'}
              </p>
            </div>
          </div>
        </div>
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
  doctors: (Doctor | DoctorAccount)[]
  filterStore: string
  setFilterStore: (v: string) => void
  filterTitle: string
  setFilterTitle: (v: string) => void
  filterStatus: string
  setFilterStatus: (v: string) => void
  onViewDetail: (d: Doctor) => void
  onNewDoctor: () => void
  onEditDoctor: (d: Doctor | DoctorAccount) => void
  onToggleStatus: (doctorId: string) => void
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
  onNewDoctor,
  onEditDoctor,
  onToggleStatus,
}: DoctorsTabProps) {
  const [searchText, setSearchText] = useState('')

  const filteredDoctors = useMemo(() => {
    if (!searchText.trim()) return doctors
    const kw = searchText.toLowerCase()
    return doctors.filter((d) => d.name.toLowerCase().includes(kw))
  }, [doctors, searchText])

  const columns = [
    {
      key: 'name',
      title: '医生',
      dataIndex: 'name' as const,
      width: 200,
      render: (_: any, record: Doctor | DoctorAccount) => (
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
      width: 240,
      render: (_: any, record: Doctor | DoctorAccount) => (
        <div className="flex items-center justify-center gap-1">
          <button
            onClick={() => onViewDetail(record)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-medical-600 hover:bg-medical-50 rounded-lg transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            详情
          </button>
          <button
            onClick={() => onEditDoctor(record)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
            编辑
          </button>
          <button
            onClick={() => onToggleStatus(record.id)}
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg transition-colors ${
              record.status === 'on_duty'
                ? 'text-red-600 hover:bg-red-50'
                : 'text-emerald-600 hover:bg-emerald-50'
            }`}
          >
            {record.status === 'on_duty' ? (
              <>
                <UserX className="w-3.5 h-3.5" />
                停用
              </>
            ) : (
              <>
                <UserCheck className="w-3.5 h-3.5" />
                启用
              </>
            )}
          </button>
        </div>
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
            className="input w-40 py-1.5 text-xs"
          >
            <option value="">全部门店</option>
            {stores.filter((s) => s.status === 'active').map((s) => (
              <option key={s.id} value={s.id}>{s.shortName}</option>
            ))}
          </select>
          <select
            value={filterTitle}
            onChange={(e) => setFilterTitle(e.target.value)}
            className="input w-36 py-1.5 text-xs"
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
            className="input w-32 py-1.5 text-xs"
          >
            <option value="">全部状态</option>
            <option value="on_duty">在岗</option>
            <option value="off_duty">休息</option>
            <option value="leave">休假</option>
          </select>
          <div className="flex-1" />
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              placeholder="搜索医生姓名"
              className="input pl-9 w-48 py-1.5 text-xs"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
          <button
            onClick={onNewDoctor}
            className="btn-primary flex items-center gap-1.5 py-1.5 text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            新建医生账号
          </button>
        </div>
      </div>

      <DataTable
        columns={columns as any}
        dataSource={filteredDoctors as any[]}
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

interface DoctorFormModalProps {
  open: boolean
  editingDoctor: DoctorAccount | null
  onClose: () => void
  onSave: (data: Omit<DoctorAccount, 'id' | 'createdAt'>) => void
}

function DoctorFormModal({ open, editingDoctor, onClose, onSave }: DoctorFormModalProps) {
  const [formData, setFormData] = useState<DoctorFormData>({
    name: '',
    gender: 'female',
    phone: '',
    idCardNo: '',
    licenseNo: '',
    title: 'attending',
    storeId: '',
    specialty: [],
    yearsOfExperience: 0,
    username: '',
    password: '',
    role: 'attending',
    permissions: rolePermissions['attending'] || [],
    status: 'on_duty',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (editingDoctor && open) {
      setFormData({
        name: editingDoctor.name,
        gender: editingDoctor.gender,
        phone: editingDoctor.phone,
        idCardNo: editingDoctor.idCardNo,
        licenseNo: editingDoctor.licenseNo,
        title: editingDoctor.title,
        storeId: editingDoctor.storeId,
        specialty: editingDoctor.specialty,
        yearsOfExperience: editingDoctor.yearsOfExperience,
        username: editingDoctor.username,
        password: '',
        role: editingDoctor.role,
        permissions: editingDoctor.permissions,
        status: editingDoctor.status,
      })
    } else if (open) {
      setFormData({
        name: '',
        gender: 'female',
        phone: '',
        idCardNo: '',
        licenseNo: '',
        title: 'attending',
        storeId: '',
        specialty: [],
        yearsOfExperience: 0,
        username: '',
        password: '',
        role: 'attending',
        permissions: rolePermissions['attending'] || [],
        status: 'on_duty',
      })
    }
    setErrors({})
  }, [editingDoctor, open])

  const handleChange = <K extends keyof DoctorFormData>(key: K, value: DoctorFormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[key]
        return next
      })
    }

    if (key === 'title' && typeof value === 'string') {
      const defaultPerms = rolePermissions[value] || []
      setFormData((prev) => ({
        ...prev,
        title: value as DoctorFormData['title'],
        role: value,
        permissions: defaultPerms,
      }))
    }
  }

  const toggleSpecialty = (specialty: string) => {
    setFormData((prev) => ({
      ...prev,
      specialty: prev.specialty.includes(specialty)
        ? prev.specialty.filter((s) => s !== specialty)
        : [...prev.specialty, specialty],
    }))
  }

  const togglePermission = (permKey: string) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permKey)
        ? prev.permissions.filter((p) => p !== permKey)
        : [...prev.permissions, permKey],
    }))
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) newErrors.name = '请输入姓名'
    if (!formData.phone.trim()) {
      newErrors.phone = '请输入手机号'
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = '请输入正确的手机号'
    }
    if (!formData.idCardNo.trim()) {
      newErrors.idCardNo = '请输入身份证号'
    } else if (!validateIdCard(formData.idCardNo)) {
      newErrors.idCardNo = '请输入正确的身份证号'
    }
    if (!formData.licenseNo.trim()) newErrors.licenseNo = '请输入执业证号'
    if (!formData.storeId) newErrors.storeId = '请选择所属门店'
    if (formData.specialty.length === 0) newErrors.specialty = '请至少选择一个专长领域'
    if (!formData.username.trim()) newErrors.username = '请输入账号用户名'
    if (!editingDoctor && !formData.password.trim()) newErrors.password = '请输入密码'
    if (formData.yearsOfExperience < 0) newErrors.yearsOfExperience = '从业年限不能为负数'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (!validate()) return

    const selectedStore = stores.find((s) => s.id === formData.storeId)

    const saveData: Omit<DoctorAccount, 'id' | 'createdAt'> = {
      name: formData.name,
      gender: formData.gender,
      age: new Date().getFullYear() - parseInt(formData.idCardNo.slice(6, 10)),
      phone: formData.phone,
      idCardNo: formData.idCardNo,
      licenseNo: formData.licenseNo,
      title: formData.title,
      specialty: formData.specialty,
      yearsOfExperience: formData.yearsOfExperience,
      storeId: formData.storeId,
      storeName: selectedStore?.shortName,
      status: formData.status,
      joinDate: new Date().toISOString().slice(0, 10),
      username: formData.username,
      password: formData.password,
      role: formData.role,
      permissions: formData.permissions,
    }

    if (editingDoctor) {
      saveData.joinDate = editingDoctor.joinDate
    }

    onSave(saveData)
  }

  if (!open) return null

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editingDoctor ? '编辑医生账号' : '新建医生账号'}
      width={800}
      footer={
        <>
          <button onClick={onClose} className="btn-secondary">
            取消
          </button>
          <button onClick={handleSubmit} className="btn-primary">
            保存
          </button>
        </>
      }
    >
      <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-2">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              姓名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className={`input w-full ${errors.name ? 'border-red-300 focus:border-red-500' : ''}`}
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="请输入姓名"
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              性别 <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-4 pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={formData.gender === 'female'}
                  onChange={() => handleChange('gender', 'female')}
                  className="w-4 h-4 text-medical-600"
                />
                <span className="text-sm text-slate-600">女</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={formData.gender === 'male'}
                  onChange={() => handleChange('gender', 'male')}
                  className="w-4 h-4 text-medical-600"
                />
                <span className="text-sm text-slate-600">男</span>
              </label>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              手机号 <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              className={`input w-full ${errors.phone ? 'border-red-300 focus:border-red-500' : ''}`}
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="请输入手机号"
            />
            {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              身份证号 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className={`input w-full ${errors.idCardNo ? 'border-red-300 focus:border-red-500' : ''}`}
              value={formData.idCardNo}
              onChange={(e) => handleChange('idCardNo', e.target.value)}
              placeholder="请输入身份证号"
            />
            {errors.idCardNo && <p className="text-xs text-red-500 mt-1">{errors.idCardNo}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              执业证号 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className={`input w-full ${errors.licenseNo ? 'border-red-300 focus:border-red-500' : ''}`}
              value={formData.licenseNo}
              onChange={(e) => handleChange('licenseNo', e.target.value)}
              placeholder="请输入执业证号"
            />
            {errors.licenseNo && <p className="text-xs text-red-500 mt-1">{errors.licenseNo}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              职称 <span className="text-red-500">*</span>
            </label>
            <select
              className="input w-full"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value as any)}
            >
              <option value="chief">主任医师</option>
              <option value="associate_chief">副主任医师</option>
              <option value="attending">主治医师</option>
              <option value="resident">住院医师</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              所属门店 <span className="text-red-500">*</span>
            </label>
            <select
              className={`input w-full ${errors.storeId ? 'border-red-300 focus:border-red-500' : ''}`}
              value={formData.storeId}
              onChange={(e) => handleChange('storeId', e.target.value)}
            >
              <option value="">请选择门店</option>
              {stores.filter((s) => s.status === 'active').map((s) => (
                <option key={s.id} value={s.id}>{s.shortName}</option>
              ))}
            </select>
            {errors.storeId && <p className="text-xs text-red-500 mt-1">{errors.storeId}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              从业年限 <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              className={`input w-full ${errors.yearsOfExperience ? 'border-red-300 focus:border-red-500' : ''}`}
              value={formData.yearsOfExperience}
              onChange={(e) => handleChange('yearsOfExperience', Number(e.target.value))}
              min="0"
            />
            {errors.yearsOfExperience && <p className="text-xs text-red-500 mt-1">{errors.yearsOfExperience}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              状态 <span className="text-red-500">*</span>
            </label>
            <select
              className="input w-full"
              value={formData.status}
              onChange={(e) => handleChange('status', e.target.value as any)}
            >
              <option value="on_duty">在岗</option>
              <option value="off_duty">休息</option>
              <option value="leave">休假</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            专长领域（多选） <span className="text-red-500">*</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {specialtyOptions.map((s) => (
              <label
                key={s}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border cursor-pointer transition-colors ${
                  formData.specialty.includes(s)
                    ? 'bg-medical-50 border-medical-300 text-medical-700'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <input
                  type="checkbox"
                  checked={formData.specialty.includes(s)}
                  onChange={() => toggleSpecialty(s)}
                  className="sr-only"
                />
                <Check className={`w-3.5 h-3.5 ${formData.specialty.includes(s) ? 'opacity-100' : 'opacity-0'}`} />
                <span className="text-xs font-medium">{s}</span>
              </label>
            ))}
          </div>
          {errors.specialty && <p className="text-xs text-red-500 mt-1">{errors.specialty}</p>}
        </div>

        <div className="border-t border-slate-200 pt-4">
          <h4 className="text-sm font-semibold text-slate-700 mb-3">账号信息</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                账号用户名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className={`input w-full ${errors.username ? 'border-red-300 focus:border-red-500' : ''}`}
                value={formData.username}
                onChange={(e) => handleChange('username', e.target.value)}
                placeholder="请输入账号用户名"
              />
              {errors.username && <p className="text-xs text-red-500 mt-1">{errors.username}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                密码 {!editingDoctor && <span className="text-red-500">*</span>}
              </label>
              <input
                type="password"
                className={`input w-full ${errors.password ? 'border-red-300 focus:border-red-500' : ''}`}
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                placeholder={editingDoctor ? "不修改请留空" : "请输入密码"}
              />
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 pt-4">
          <h4 className="text-sm font-semibold text-slate-700 mb-3">角色与权限配置</h4>
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              角色 <span className="text-red-500">*</span>
            </label>
            <select
              className="input w-full"
              value={formData.role}
              onChange={(e) => handleChange('role', e.target.value)}
            >
              <option value="chief">主任医师</option>
              <option value="associate_chief">副主任医师</option>
              <option value="attending">主治医师</option>
              <option value="resident">住院医师</option>
            </select>
            <p className="text-xs text-slate-400 mt-1">选择角色后将自动关联默认权限配置</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">权限配置（多选）</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {permissionModules.map((mod) => {
                const Icon = mod.icon
                return (
                  <label
                    key={mod.key}
                    className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                      formData.permissions.includes(mod.key)
                        ? 'bg-medical-50 border-medical-300'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.permissions.includes(mod.key)}
                      onChange={() => togglePermission(mod.key)}
                      className="w-4 h-4 text-medical-600 rounded"
                    />
                    <Icon className={`w-4 h-4 ${
                      formData.permissions.includes(mod.key) ? 'text-medical-600' : 'text-slate-400'
                    }`} />
                    <span className={`text-xs font-medium ${
                      formData.permissions.includes(mod.key) ? 'text-medical-700' : 'text-slate-600'
                    }`}>{mod.name}</span>
                  </label>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}
