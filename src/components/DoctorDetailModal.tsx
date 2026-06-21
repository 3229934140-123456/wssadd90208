import { User, Calendar, MapPin, Award, Briefcase, Eye, Clock, CheckCircle, AlertCircle, Activity } from 'lucide-react'
import { Modal, Badge } from './ui'
import { useAppStore } from '../store'
import { doctors, customerRecords } from '../data/mockData'
import type { CustomerRecord, Doctor } from '../types'

const titleMap: Record<string, string> = {
  resident: '住院医师',
  attending: '主治医师',
  associate_chief: '副主任医师',
  chief: '主任医师',
}

const statusMap: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'default' }> = {
  pending: { label: '待复核', variant: 'warning' },
  reviewing: { label: '审核中', variant: 'info' },
  confirmed: { label: '已通过', variant: 'success' },
  rejected: { label: '已驳回', variant: 'danger' },
}

export default function DoctorDetailModal() {
  const { modal, closeDoctorDetail, openRecordDetail } = useAppStore()
  const { open, doctorId } = modal.doctorDetail

  const doctor = doctors.find(d => d.id === doctorId) as Doctor | undefined

  const doctorRecords = customerRecords
    .filter(r => r.doctorId === doctorId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10)

  if (!doctor) return null

  const stats = {
    totalRecords: customerRecords.filter(r => r.doctorId === doctorId).length,
    avgScore: (() => {
      const records = customerRecords.filter(r => r.doctorId === doctorId && r.qualityScore)
      if (records.length === 0) return 0
      const total = records.reduce((sum, r) => sum + (r.qualityScore?.totalScore || 0), 0)
      return (total / records.length).toFixed(1)
    })(),
    highRiskCount: customerRecords.filter(r => r.doctorId === doctorId && r.riskPoints?.some(rp => rp.level === 'high' || rp.level === 'critical')).length,
  }

  const handleViewRecord = (record: CustomerRecord) => {
    openRecordDetail(record)
  }

  return (
    <Modal
      open={open}
      onClose={closeDoctorDetail}
      title="医生详情"
      width={800}
      footer={
        <button onClick={closeDoctorDetail} className="btn-primary">
          关闭
        </button>
      }
    >
      <div className="space-y-6">
        <div className="flex items-start gap-6">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
            <User className="w-12 h-12 text-primary-500" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-bold text-slate-800">{doctor.name}</h3>
              <Badge variant="info">{titleMap[doctor.title]}</Badge>
              {doctor.status === 'on_duty' ? (
                <Badge variant="success">在岗</Badge>
              ) : doctor.status === 'leave' ? (
                <Badge variant="warning">休假</Badge>
              ) : (
                <Badge variant="default">休息</Badge>
              )}
            </div>
            <div className="text-sm text-slate-500 mb-3">
              {doctor.gender === 'female' ? '女' : '男'} · {doctor.age}岁 · {doctor.yearsOfExperience}年从业经验
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-500">
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {doctor.storeName}
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                入职：{doctor.joinDate}
              </div>
              <div className="flex items-center gap-1">
                <Briefcase className="w-4 h-4" />
                {doctor.specialty.join('、')}
              </div>
            </div>
          </div>
        </div>

        {doctor.introduction && (
          <div className="p-4 bg-slate-50 rounded-xl">
            <h4 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
              <Award className="w-4 h-4 text-medical-500" />
              医生简介
            </h4>
            <p className="text-sm text-slate-600">{doctor.introduction}</p>
          </div>
        )}

        {doctor.certifications && doctor.certifications.length > 0 && (
          <div className="p-4 bg-slate-50 rounded-xl">
            <h4 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              专业认证
            </h4>
            <div className="flex flex-wrap gap-2">
              {doctor.certifications.map((cert, idx) => (
                <Badge key={idx} variant="info">{cert}</Badge>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-medical-50 rounded-xl text-center">
            <div className="text-2xl font-bold text-medical-600">{stats.totalRecords}</div>
            <div className="text-sm text-slate-500">总记录数</div>
          </div>
          <div className="p-4 bg-emerald-50 rounded-xl text-center">
            <div className="text-2xl font-bold text-emerald-600">{stats.avgScore}</div>
            <div className="text-sm text-slate-500">平均评分</div>
          </div>
          <div className="p-4 bg-amber-50 rounded-xl text-center">
            <div className="text-2xl font-bold text-amber-600">{stats.highRiskCount}</div>
            <div className="text-sm text-slate-500">高风险记录</div>
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-slate-800 mb-3">最近 10 条记录</h4>
          <div className="space-y-2">
            {doctorRecords.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-sm">暂无记录</div>
            ) : (
              doctorRecords.map((record) => {
                const status = statusMap[record.status]
                return (
                  <div
                    key={record.id}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center text-primary-600 font-medium">
                        {record.customerName.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-800">{record.customerName}</span>
                          <Badge variant={status.variant}>
                            {status.label}
                          </Badge>
                        </div>
                        <div className="text-xs text-slate-500">
                          {record.projectName} · {new Date(record.createdAt).toLocaleDateString('zh-CN')}
                        </div>
                        {record.riskPoints && record.riskPoints.length > 0 && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <AlertCircle className="w-3 h-3 text-amber-500" />
                            <span className="text-xs text-amber-600">
                              含 {record.riskPoints.length} 个风险点
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {record.qualityScore && (
                        <div className="text-sm font-medium text-amber-600">
                          {record.qualityScore.totalScore}分
                        </div>
                      )}
                      <button
                        onClick={() => handleViewRecord(record)}
                        className="p-2 rounded-lg text-medical-600 hover:bg-medical-50 transition-colors"
                        title="查看详情"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </Modal>
  )
}
