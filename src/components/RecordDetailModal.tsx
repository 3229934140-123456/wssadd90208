import { User, MapPin, Pill, AlertTriangle } from 'lucide-react'
import { Modal, Badge } from './ui'
import { useAppStore } from '../store'
import { injectionPoints } from '../data/mockData'
import type { CustomerRecord } from '../types'

function FaceInjectionMap({ record }: { record: CustomerRecord }) {
  const usedPoints = record.injectionPoints || []
  const pointMap = new Map(injectionPoints.map(p => [p.id, p]))

  return (
    <div className="relative w-full max-w-xs mx-auto">
      <svg viewBox="0 0 100 100" className="w-full h-auto">
        <defs>
          <linearGradient id="faceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fef3f2" />
            <stop offset="100%" stopColor="#fce7f3" />
          </linearGradient>
        </defs>
        <ellipse cx="50" cy="50" rx="35" ry="42" fill="url(#faceGradient)" stroke="#f9a8d4" strokeWidth="0.5" />
        <ellipse cx="38" cy="35" rx="5" ry="3" fill="#e2e8f0" />
        <ellipse cx="62" cy="35" rx="5" ry="3" fill="#e2e8f0" />
        <ellipse cx="38" cy="35" rx="2" ry="1.5" fill="#64748b" />
        <ellipse cx="62" cy="35" rx="2" ry="1.5" fill="#64748b" />
        <path d="M47,45 Q50,48 53,45" stroke="#94a3b8" strokeWidth="0.8" fill="none" />
        <path d="M44,60 Q50,64 56,60" stroke="#94a3b8" strokeWidth="0.8" fill="none" />
        <ellipse cx="50" cy="88" rx="8" ry="4" fill="none" stroke="#e2e8f0" strokeWidth="0.3" />

        {usedPoints.map(ip => {
          const point = pointMap.get(ip.pointId)
          if (!point?.coordinates) return null
          return (
            <g key={ip.pointId}>
              <circle
                cx={point.coordinates.x}
                cy={point.coordinates.y}
                r="2.5"
                fill="#3b82f6"
                stroke="#fff"
                strokeWidth="0.5"
              />
              <circle
                cx={point.coordinates.x}
                cy={point.coordinates.y}
                r="3.5"
                fill="none"
                stroke="#3b82f6"
                strokeWidth="0.3"
                opacity="0.4"
              />
            </g>
          )
        })}
      </svg>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {usedPoints.map(ip => {
          const point = pointMap.get(ip.pointId)
          return (
            <div key={ip.pointId} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-medical-500" />
              <div className="text-xs">
                <div className="font-medium text-slate-700">{ip.pointName}</div>
                <div className="text-slate-500">{ip.actualDosage}{ip.unit}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const riskLevelMap = {
  low: { label: '低风险', color: 'text-emerald-600 bg-emerald-50' },
  medium: { label: '中风险', color: 'text-amber-600 bg-amber-50' },
  high: { label: '高风险', color: 'text-orange-600 bg-orange-50' },
  critical: { label: '严重风险', color: 'text-red-600 bg-red-50' },
}

export default function RecordDetailModal() {
  const { modal, closeRecordDetail } = useAppStore()
  const { open, record } = modal.recordDetail

  if (!record) return null

  const totalDosage = record.drugs.reduce((sum, d) => sum + d.dosage, 0)
  const totalPrice = record.drugs.reduce((sum, d) => sum + d.price, 0)

  return (
    <Modal
      open={open}
      onClose={closeRecordDetail}
      title="病例详情"
      width={960}
      footer={
        <button onClick={closeRecordDetail} className="btn-primary">
          关闭
        </button>
      }
    >
      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 space-y-4">
            <div className="p-4 bg-slate-50 rounded-xl">
              <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <User className="w-4 h-4 text-medical-500" />
                客户基本信息
              </h4>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <div className="text-slate-500 text-xs mb-1">姓名</div>
                  <div className="font-medium text-slate-800">{record.customerName}</div>
                </div>
                <div>
                  <div className="text-slate-500 text-xs mb-1">性别 / 年龄</div>
                  <div className="font-medium text-slate-800">{record.customerGender === 'female' ? '女' : '男'} / {record.customerAge}岁</div>
                </div>
                <div>
                  <div className="text-slate-500 text-xs mb-1">手机号</div>
                  <div className="font-medium text-slate-800">{record.customerPhone}</div>
                </div>
                <div>
                  <div className="text-slate-500 text-xs mb-1">就诊门店</div>
                  <div className="font-medium text-slate-800">{record.storeName}</div>
                </div>
                <div>
                  <div className="text-slate-500 text-xs mb-1">操作医生</div>
                  <div className="font-medium text-slate-800">{record.doctorName}</div>
                </div>
                <div>
                  <div className="text-slate-500 text-xs mb-1">记录编号</div>
                  <div className="font-medium text-slate-800">{record.recordNo}</div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl">
              <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-medical-500" />
                注射点位图
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <FaceInjectionMap record={record} />
                <div className="space-y-3">
                  <div className="text-sm text-slate-600">
                    <span className="font-medium text-slate-700">项目：</span>
                    {record.projectName}
                  </div>
                  <div className="text-sm text-slate-600">
                    <span className="font-medium text-slate-700">术前评估：</span>
                    {record.preOpAssessment}
                  </div>
                  <div className="text-sm text-slate-600">
                    <span className="font-medium text-slate-700">术中记录：</span>
                    {record.intraOpNotes}
                  </div>
                  <div className="text-sm text-slate-600">
                    <span className="font-medium text-slate-700">术后交代：</span>
                    {record.postOpNotes}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl">
              <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <Pill className="w-4 h-4 text-medical-500" />
                药品使用明细
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-slate-500 border-b border-slate-200">
                      <th className="text-left py-2 font-medium">药品名称</th>
                      <th className="text-left py-2 font-medium">品牌</th>
                      <th className="text-left py-2 font-medium">规格</th>
                      <th className="text-left py-2 font-medium">批号</th>
                      <th className="text-right py-2 font-medium">剂量</th>
                      <th className="text-right py-2 font-medium">价格</th>
                    </tr>
                  </thead>
                  <tbody>
                    {record.drugs.map(d => (
                      <tr key={d.id} className="border-b border-slate-100 last:border-0">
                        <td className="py-2.5 text-slate-700 font-medium">{d.drugName}</td>
                        <td className="py-2.5 text-slate-600">{d.drugBrand}</td>
                        <td className="py-2.5 text-slate-600">{d.specification}</td>
                        <td className="py-2.5 text-slate-600 font-mono text-xs">{d.batchNo}</td>
                        <td className="py-2.5 text-slate-700 text-right">{d.dosage}{d.unit}</td>
                        <td className="py-2.5 text-slate-700 text-right">¥{d.price.toLocaleString()}</td>
                      </tr>
                    ))}
                    <tr className="bg-slate-100/50">
                      <td colSpan={4} className="py-2.5 text-right font-medium text-slate-700">合计</td>
                      <td className="py-2.5 text-slate-700 text-right font-medium">{totalDosage.toFixed(1)}{record.drugs[0]?.unit || 'ml'}</td>
                      <td className="py-2.5 text-slate-700 text-right font-medium">¥{totalPrice.toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-xl">
              <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                风险点提示
              </h4>
              <div className="space-y-2">
                {record.riskPoints && record.riskPoints.length > 0 ? (
                  record.riskPoints.map(r => {
                    const rm = riskLevelMap[r.level as keyof typeof riskLevelMap]
                    return (
                      <div key={r.id} className={`p-2.5 rounded-lg border ${rm.color} border-current/20`}>
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className={`w-1.5 h-1.5 rounded-full ${rm.color.replace('text-', 'bg-').split(' ')[0]}`} />
                          <span className="text-xs font-medium">{rm.label}</span>
                          <span className="text-xs text-slate-400 ml-auto">{r.category}</span>
                        </div>
                        <p className="text-xs text-slate-600">{r.description}</p>
                      </div>
                    )
                  })
                ) : (
                  <div className="text-sm text-slate-400 text-center py-4">暂无风险点</div>
                )}
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl">
              <h4 className="font-semibold text-slate-800 mb-3">项目信息</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">项目名称</span>
                  <span className="font-medium text-slate-700">{record.projectName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">操作时间</span>
                  <span className="font-medium text-slate-700">
                    {new Date(record.startTime).toLocaleString('zh-CN')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">总金额</span>
                  <span className="font-medium text-emerald-600">¥{record.totalAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">支付状态</span>
                  <Badge variant={record.paymentStatus === 'paid' ? 'success' : record.paymentStatus === 'partial' ? 'warning' : 'danger'}>
                    {record.paymentStatus === 'paid' ? '已支付' : record.paymentStatus === 'partial' ? '部分支付' : '未支付'}
                  </Badge>
                </div>
                {record.qualityScore && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">质控评分</span>
                    <span className="font-medium text-amber-600">{record.qualityScore.totalScore}分</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}
