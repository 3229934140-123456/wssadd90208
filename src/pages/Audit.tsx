import { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  RotateCcw,
  AlertTriangle,
  Star,
  User,
  MapPin,
  Calendar,
  Pill,
  Image as ImageIcon,
  ShieldAlert,
  FileCheck,
  ChevronDown,
  HelpCircle,
  X,
} from 'lucide-react';
import { Badge, DataTable, Modal, Progress } from '../components/ui';
import { stores, doctors, projectTemplates, injectionPoints, customerRecords as mockCustomerRecords } from '../data/mockData';
import { useAppStore } from '../store';
import { runAuditRules } from '../utils/auditRules';
import type { CustomerRecord, RecordStatus, RuleViolation, QualityScore } from '../types';

const statusMap: Record<RecordStatus, { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'default'; color: string }> = {
  pending: { label: '待复核', variant: 'warning', color: 'text-amber-600 bg-amber-50' },
  reviewing: { label: '审核中', variant: 'info', color: 'text-medical-600 bg-medical-50' },
  confirmed: { label: '已确认', variant: 'success', color: 'text-emerald-600 bg-emerald-50' },
  rejected: { label: '已驳回', variant: 'danger', color: 'text-red-600 bg-red-50' },
};

const severityMap = {
  high: { label: '高', color: 'text-red-600 bg-red-50', border: 'border-red-200', dotColor: 'bg-red-500' },
  medium: { label: '中', color: 'text-amber-600 bg-amber-50', border: 'border-amber-200', dotColor: 'bg-amber-500' },
  low: { label: '低', color: 'text-emerald-600 bg-emerald-50', border: 'border-emerald-200', dotColor: 'bg-emerald-500' },
};

const riskLevelMap = {
  low: { label: '低风险', color: 'text-emerald-600 bg-emerald-50' },
  medium: { label: '中风险', color: 'text-amber-600 bg-amber-50' },
  high: { label: '高风险', color: 'text-orange-600 bg-orange-50' },
  critical: { label: '严重风险', color: 'text-red-600 bg-red-50' },
};

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function getOverallRating(totalScore: number, maxScore: number): QualityScore['overallRating'] {
  const percentage = (totalScore / maxScore) * 100;
  if (percentage >= 90) return 'excellent';
  if (percentage >= 80) return 'good';
  if (percentage >= 70) return 'fair';
  return 'poor';
}

function getRatingLabel(rating: QualityScore['overallRating']): string {
  const labels = {
    excellent: '优秀',
    good: '良好',
    fair: '一般',
    poor: '较差',
  };
  return labels[rating];
}

function getReviewRemark(totalScore: number, maxScore: number, violations: RuleViolation[]): string {
  const percentage = (totalScore / maxScore) * 100;
  if (violations.length > 0) {
    const violationNames = violations.slice(0, 3).map(v => v.ruleName).join('、');
    return `存在违规项：${violationNames}${violations.length > 3 ? '等' : ''}，需关注整改。`;
  }
  if (percentage >= 90) return '操作规范，记录完整，质量优秀。';
  if (percentage >= 80) return '整体良好，细节可进一步优化。';
  if (percentage >= 70) return '存在部分不规范，需改进。';
  return '存在较多问题，需重点整改。';
}

function FaceInjectionMap({ record }: { record: CustomerRecord }) {
  const usedPoints = record.injectionPoints || [];
  const pointMap = new Map(injectionPoints.map(p => [p.id, p]));

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
          const point = pointMap.get(ip.pointId);
          if (!point?.coordinates) return null;
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
          );
        })}
      </svg>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {usedPoints.map(ip => {
          const point = pointMap.get(ip.pointId);
          return (
            <div key={ip.pointId} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-medical-500" />
              <div className="text-xs">
                <div className="font-medium text-slate-700">{ip.pointName}</div>
                <div className="text-slate-500">{ip.actualDosage}{ip.unit}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function QualityScorePanel({
  record,
  scores,
  onScoreChange,
  readOnly,
}: {
  record: CustomerRecord;
  scores: { category: string; score: number; fullScore: number; remark?: string }[];
  onScoreChange: (idx: number, score: number) => void;
  readOnly?: boolean;
}) {
  const totalScore = scores.reduce((s, c) => s + c.score, 0);
  const maxScore = scores.reduce((s, c) => s + c.fullScore, 0);
  const rating = getOverallRating(totalScore, maxScore);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-slate-800 flex items-center gap-2">
          <Star className="w-4 h-4 text-amber-500" />
          质控评分
        </h4>
        <div className="text-right">
          <span className="text-2xl font-bold text-medical-600">{totalScore}</span>
          <span className="text-slate-400 text-sm"> / {maxScore}</span>
          <Badge variant={rating === 'excellent' ? 'success' : rating === 'good' ? 'info' : rating === 'fair' ? 'warning' : 'danger'} className="ml-2">
            {getRatingLabel(rating)}
          </Badge>
        </div>
      </div>
      <div className="space-y-3">
        {scores.map((s, idx) => (
          <div key={s.category} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-700">{s.category}</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={s.fullScore}
                  value={s.score}
                  onChange={(e) => onScoreChange(idx, Math.min(s.fullScore, Math.max(0, Number(e.target.value))))}
                  disabled={readOnly}
                  className={`w-16 px-2 py-1 text-sm text-right border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-medical-500 ${readOnly ? 'bg-slate-100 cursor-not-allowed' : ''}`}
                />
                <span className="text-xs text-slate-400">/ {s.fullScore}</span>
              </div>
            </div>
            <Progress value={(s.score / s.fullScore) * 100} showLabel={false} color={s.score >= s.fullScore * 0.8 ? 'green' : s.score >= s.fullScore * 0.6 ? 'orange' : 'pink'} />
          </div>
        ))}
      </div>
    </div>
  );
}

function RuleViolationPanel({ violations }: { violations: RuleViolation[] }) {
  if (!violations || violations.length === 0) {
    return (
      <div className="p-4 bg-slate-50 rounded-xl">
        <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-emerald-500" />
          违规检测结果
        </h4>
        <div className="text-sm text-slate-400 text-center py-6">
          <CheckCircle className="w-12 h-12 text-emerald-300 mx-auto mb-2" />
          未检测到违规项
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-slate-50 rounded-xl">
      <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
        <ShieldAlert className="w-4 h-4 text-amber-500" />
        违规检测结果
        <Badge variant="warning" className="ml-2">{violations.length} 项违规</Badge>
      </h4>
      <div className="space-y-3">
        {violations.map((v, idx) => {
          const sm = severityMap[v.severity];
          return (
            <div key={idx} className={`p-3 rounded-lg border ${sm.color}`}>
              <div className="flex items-start gap-2">
                <span className={`w-2 h-2 rounded-full ${sm.dotColor} mt-1.5 flex-shrink-0`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm text-slate-800">{v.ruleName}</span>
                    <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${sm.color} border ${sm.border}`}>
                      {sm.label}风险
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mb-1">{v.description}</p>
                  {v.evidence && (
                    <p className="text-xs text-slate-500 bg-white/50 px-2 py-1 rounded">
                      <span className="font-medium">证据：</span>{v.evidence}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RulesHelpModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const rules = [
    {
      id: 'dosage_range',
      name: '剂量超范围检测',
      severity: 'high' as const,
      description: '检查各注射点位的实际剂量是否在建议范围内。如果点位有项目模板定义的推荐剂量，则以推荐剂量的±30%为范围；否则以点位配置的最小/最大剂量为范围。',
    },
    {
      id: 'left_right_balance',
      name: '左右差异>30%检测',
      severity: 'medium' as const,
      description: '检查面部左右对称点位的注射剂量差异。如果差异超过30%，则判定为违规，提示可能存在注射不对称风险。',
    },
    {
      id: 'pre_op_photos',
      name: '缺术前照片检测',
      severity: 'high' as const,
      description: '检查是否上传了术前照片，且包含正位、侧位45°、侧位90°三个必要角度。缺少照片或角度不全将被判定为违规。',
    },
    {
      id: 'batch_no_missing',
      name: '缺药品批号检测',
      severity: 'high' as const,
      description: '检查所有使用药品是否都填写了生产批号。缺少批号将无法追溯药品来源，属于严重违规。',
    },
  ];

  return (
    <Modal open={open} onClose={onClose} title="审核规则说明" width={640}>
      <div className="space-y-4">
        <p className="text-sm text-slate-600">
          系统将自动对所有记录执行以下规则检测，检测不通过的记录将标记为"待复核"状态。
        </p>
        {rules.map(rule => {
          const sm = severityMap[rule.severity];
          return (
            <div key={rule.id} className={`p-4 rounded-lg border ${sm.color}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`w-2 h-2 rounded-full ${sm.dotColor}`} />
                <span className="font-semibold text-slate-800">{rule.name}</span>
                <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${sm.color} border ${sm.border}`}>
                  {sm.label}风险
                </span>
              </div>
              <p className="text-sm text-slate-600">{rule.description}</p>
            </div>
          );
        })}
      </div>
    </Modal>
  );
}

export default function Audit() {
  const [activeStatus, setActiveStatus] = useState<'all' | RecordStatus>('all');
  const [storeFilter, setStoreFilter] = useState('');
  const [doctorFilter, setDoctorFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [searchText, setSearchText] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<CustomerRecord | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [qualityScores, setQualityScores] = useState<{ category: string; score: number; fullScore: number; remark?: string }[]>([]);
  const [reviewRemark, setReviewRemark] = useState('');
  const [rulesHelpOpen, setRulesHelpOpen] = useState(false);
  const [modifySuggestion, setModifySuggestion] = useState('');
  const [showModifyInput, setShowModifyInput] = useState(false);

  const { records, setRecords, updateRecord, user } = useAppStore();

  useEffect(() => {
    if (records.length === 0) {
      const processedRecords = mockCustomerRecords.map(record => {
        const template = projectTemplates.find(t => t.id === record.projectId);
        const auditResult = runAuditRules(record, template, injectionPoints);
        
        return {
          ...record,
          status: auditResult.needsReview ? 'pending' : record.status,
          riskPoints: auditResult.riskPoints.length > 0 ? auditResult.riskPoints : record.riskPoints,
          ruleViolations: auditResult.violations.length > 0 ? auditResult.violations : undefined,
        } as CustomerRecord;
      });
      setRecords(processedRecords);
    }
  }, [records.length, setRecords]);

  const statusCounts = useMemo(() => {
    const counts = { all: records.length, pending: 0, reviewing: 0, confirmed: 0, rejected: 0 };
    records.forEach(r => { counts[r.status]++; });
    return counts;
  }, [records]);

  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      if (activeStatus !== 'all' && r.status !== activeStatus) return false;
      if (storeFilter && r.storeId !== storeFilter) return false;
      if (doctorFilter && r.doctorId !== doctorFilter) return false;
      if (categoryFilter && r.projectCategory !== categoryFilter) return false;
      if (dateFrom && r.appointmentDate < dateFrom) return false;
      if (dateTo && r.appointmentDate > dateTo) return false;
      if (searchText && !r.customerName.includes(searchText) && !r.projectName.includes(searchText) && !r.recordNo.includes(searchText)) return false;
      return true;
    });
  }, [records, activeStatus, storeFilter, doctorFilter, categoryFilter, dateFrom, dateTo, searchText]);

  const projectCategoryOptions = [
    { value: 'injection', label: '注射美容' },
    { value: 'filling', label: '填充塑形' },
    { value: 'wrinkle_removal', label: '除皱抗衰' },
    { value: 'hydration', label: '水光补水' },
    { value: 'lifting', label: '提升紧致' },
  ];

  const openDetailModal = (record: CustomerRecord) => {
    const freshRecord = records.find(r => r.id === record.id) || record;
    setSelectedRecord(freshRecord);
    setQualityScores([
      { category: '记录完整度', score: freshRecord.qualityScore?.scores.find(s => s.category.includes('记录') || s.category.includes('完整'))?.score ?? 25, fullScore: 30 },
      { category: '拍照清晰度', score: freshRecord.qualityScore?.scores.find(s => s.category.includes('注射') || s.category.includes('拍照'))?.score ?? 15, fullScore: 20 },
      { category: '术后交代', score: freshRecord.qualityScore?.scores.find(s => s.category.includes('术后') || s.category.includes('告知'))?.score ?? 15, fullScore: 20 },
      { category: '注射规范', score: freshRecord.qualityScore?.scores.find(s => s.category.includes('无菌') || s.category.includes('规范'))?.score ?? 25, fullScore: 30 },
    ]);
    setReviewRemark(freshRecord.reviewRemark || '');
    setModifySuggestion('');
    setShowModifyInput(false);
    setDetailModalOpen(true);
  };

  const handleScoreChange = (idx: number, score: number) => {
    setQualityScores(prev => prev.map((s, i) => i === idx ? { ...s, score } : s));
  };

  const handleConfirm = () => {
    if (!selectedRecord) return;
    
    const totalScore = qualityScores.reduce((s, c) => s + c.score, 0);
    const maxScore = qualityScores.reduce((s, c) => s + c.fullScore, 0);
    const rating = getOverallRating(totalScore, maxScore);
    const remark = reviewRemark || getReviewRemark(totalScore, maxScore, selectedRecord.ruleViolations || []);

    const qualityScore: QualityScore = {
      id: `qs_${selectedRecord.id}_${Date.now()}`,
      recordId: selectedRecord.id,
      inspectorId: user?.id || 'user_008',
      inspectorName: user?.name || '质控张',
      totalScore,
      scores: qualityScores,
      overallRating: rating,
      remarks: remark,
      evaluatedAt: new Date().toISOString(),
    };

    updateRecord(selectedRecord.id, {
      status: 'confirmed',
      qualityScore,
      reviewRemark: remark,
      reviewerId: user?.id || 'user_008',
      reviewerName: user?.name || '质控张',
      reviewedAt: new Date().toISOString(),
    });

    setDetailModalOpen(false);
    setSelectedRecord(null);
  };

  const handleReject = () => {
    if (!selectedRecord) return;
    
    const remark = reviewRemark || '存在违规项，予以驳回，请整改后重新提交。';

    updateRecord(selectedRecord.id, {
      status: 'rejected',
      reviewRemark: remark,
      reviewerId: user?.id || 'user_008',
      reviewerName: user?.name || '质控张',
      reviewedAt: new Date().toISOString(),
    });

    setDetailModalOpen(false);
    setSelectedRecord(null);
  };

  const handleReturnModify = () => {
    if (!selectedRecord) return;
    
    if (!showModifyInput) {
      setShowModifyInput(true);
      return;
    }

    const remark = modifySuggestion || '请完善相关信息后重新提交审核。';

    updateRecord(selectedRecord.id, {
      status: 'reviewing',
      reviewRemark: remark,
      reviewerId: user?.id || 'user_008',
      reviewerName: user?.name || '质控张',
      reviewedAt: new Date().toISOString(),
    });

    setDetailModalOpen(false);
    setSelectedRecord(null);
    setShowModifyInput(false);
  };

  const getHighestSeverity = (violations: RuleViolation[] | undefined) => {
    if (!violations || violations.length === 0) return null;
    const order = ['high', 'medium', 'low'] as const;
    return violations.reduce((prev, curr) => 
      order.indexOf(curr.severity) < order.indexOf(prev.severity) ? curr : prev
    ).severity;
  };

  const columns = [
    {
      key: 'customer',
      title: '客户信息',
      dataIndex: 'customerName' as const,
      render: (_: unknown, record: CustomerRecord) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center">
            <User className="w-4 h-4 text-primary-500" />
          </div>
          <div>
            <div className="font-medium text-slate-800">{record.customerName}</div>
            <div className="text-xs text-slate-500">{record.customerGender === 'female' ? '女' : '男'} · {record.customerAge}岁</div>
          </div>
        </div>
      ),
      width: 180,
    },
    {
      key: 'project',
      title: '项目名称',
      dataIndex: 'projectName' as const,
      render: (v: unknown) => <span className="text-slate-700">{String(v)}</span>,
      width: 200,
    },
    {
      key: 'store',
      title: '门店',
      dataIndex: 'storeName' as const,
      render: (v: unknown) => (
        <span className="flex items-center gap-1 text-slate-600 text-sm">
          <MapPin className="w-3 h-3" />
          {String(v)}
        </span>
      ),
      width: 140,
    },
    {
      key: 'doctor',
      title: '医生',
      dataIndex: 'doctorName' as const,
      render: (v: unknown) => <span className="text-slate-600">{String(v)}</span>,
      width: 100,
    },
    {
      key: 'time',
      title: '操作时间',
      dataIndex: 'startTime' as const,
      render: (v: unknown) => (
        <span className="flex items-center gap-1 text-slate-500 text-sm">
          <Calendar className="w-3 h-3" />
          {formatDateTime(String(v))}
        </span>
      ),
      width: 160,
    },
    {
      key: 'status',
      title: '状态',
      dataIndex: 'status' as const,
      render: (v: unknown) => {
        const s = statusMap[v as RecordStatus];
        return <Badge variant={s.variant}>{s.label}</Badge>;
      },
      width: 90,
    },
    {
      key: 'risk',
      title: '风险标记',
      dataIndex: 'ruleViolations' as const,
      render: (_: unknown, record: CustomerRecord) => {
        const violations = record.ruleViolations;
        const risks = record.riskPoints;
        
        if ((!violations || violations.length === 0) && (!risks || risks.length === 0)) {
          return <span className="text-xs text-slate-400">无</span>;
        }

        const count = (violations?.length || 0) + (risks?.length || 0);
        const highestSeverity = getHighestSeverity(violations);
        const highestRisk = risks?.reduce((prev, curr) => {
          const order = ['low', 'medium', 'high', 'critical'];
          return order.indexOf(curr.level) > order.indexOf(prev.level) ? curr : prev;
        });

        let displayLevel = highestSeverity || highestRisk?.level || 'low';
        if (highestRisk?.level === 'critical' || highestSeverity === 'high') {
          displayLevel = 'high';
        } else if (highestRisk?.level === 'high' || highestSeverity === 'medium') {
          displayLevel = 'medium';
        }

        const rm = riskLevelMap[displayLevel as keyof typeof riskLevelMap];
        return (
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${rm.color}`}>
            <ShieldAlert className="w-3 h-3" />
            {rm.label.replace('风险', '')} · {count}项
          </span>
        );
      },
      width: 120,
    },
    {
      key: 'score',
      title: '质控评分',
      dataIndex: 'qualityScore' as const,
      render: (v: unknown) => {
        const qs = v as CustomerRecord['qualityScore'];
        if (!qs) return <span className="text-xs text-slate-400">未评分</span>;
        return (
          <div className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span className="font-medium text-slate-700">{qs.totalScore}</span>
          </div>
        );
      },
      width: 90,
    },
    {
      key: 'action',
      title: '操作',
      dataIndex: 'id' as const,
      render: (_: unknown, record: CustomerRecord) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => openDetailModal(record)}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-medical-600 hover:bg-medical-50 rounded-lg transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            查看详情
          </button>
          {(record.status === 'pending' || record.status === 'reviewing') && (
            <button
              onClick={() => openDetailModal(record)}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-medical-600 text-white hover:bg-medical-700 rounded-lg transition-colors"
            >
              <FileCheck className="w-3.5 h-3.5" />
              复核
            </button>
          )}
        </div>
      ),
      width: 180,
    },
  ];

  const isReadonly = selectedRecord?.status === 'confirmed' || selectedRecord?.status === 'rejected';

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">记录审核</h1>
          <p className="text-sm text-slate-500 mt-1">审核客户注射记录，进行质控评分和风险管控</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { key: 'all' as const, label: '全部' },
            { key: 'pending' as const, label: '待复核' },
            { key: 'reviewing' as const, label: '审核中' },
            { key: 'confirmed' as const, label: '已确认' },
            { key: 'rejected' as const, label: '已驳回' },
          ].map(tab => (
            <div key={tab.key} className="flex items-center">
              <button
                onClick={() => setActiveStatus(tab.key)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeStatus === tab.key
                    ? 'bg-medical-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab.label}
                <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                  activeStatus === tab.key ? 'bg-white/20' : 'bg-slate-100 text-slate-500'
                }`}>
                  {statusCounts[tab.key]}
                </span>
              </button>
              {tab.key === 'pending' && (
                <button
                  onClick={() => setRulesHelpOpen(true)}
                  className="ml-1 p-1.5 text-slate-400 hover:text-medical-600 hover:bg-medical-50 rounded-full transition-colors"
                  title="查看规则说明"
                >
                  <HelpCircle className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              placeholder="搜索客户姓名/项目/记录号"
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              className="input pl-9 w-60"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={storeFilter}
              onChange={e => setStoreFilter(e.target.value)}
              className="input pl-9 w-40 appearance-none pr-8"
            >
              <option value="">全部门店</option>
              {stores.map(s => <option key={s.id} value={s.id}>{s.shortName}</option>)}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={doctorFilter}
              onChange={e => setDoctorFilter(e.target.value)}
              className="input pl-9 w-36 appearance-none pr-8"
            >
              <option value="">全部医生</option>
              {doctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="input pl-9 w-36 appearance-none pr-8"
            >
              <option value="">全部项目</option>
              {projectCategoryOptions.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
          <input
            type="date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            className="input w-36"
          />
          <span className="text-slate-400">至</span>
          <input
            type="date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            className="input w-36"
          />
          <button
            onClick={() => { setStoreFilter(''); setDoctorFilter(''); setCategoryFilter(''); setDateFrom(''); setDateTo(''); setSearchText(''); }}
            className="btn-secondary"
          >
            重置
          </button>
        </div>
      </div>

      <DataTable
        columns={columns as any}
        dataSource={filteredRecords as any}
        rowKey="id"
        pageSize={10}
      />

      <Modal
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title="审核详情"
        width={960}
        footer={
          selectedRecord && (selectedRecord.status === 'pending' || selectedRecord.status === 'reviewing') ? (
            <div className="flex items-center gap-2 flex-wrap">
              {showModifyInput && (
                <div className="w-full flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    value={modifySuggestion}
                    onChange={(e) => setModifySuggestion(e.target.value)}
                    placeholder="请输入修改意见..."
                    className="flex-1 input"
                    autoFocus
                  />
                  <button onClick={() => setShowModifyInput(false)} className="p-2 text-slate-400 hover:text-slate-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              <button onClick={() => setDetailModalOpen(false)} className="btn-secondary">取消</button>
              <button 
                onClick={handleReturnModify} 
                className="inline-flex items-center gap-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors text-sm font-medium"
              >
                <RotateCcw className="w-4 h-4" />
                {showModifyInput ? '确认退回' : '退回修改'}
              </button>
              <button 
                onClick={handleReject} 
                className="inline-flex items-center gap-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors text-sm font-medium"
              >
                <XCircle className="w-4 h-4" />
                驳回
              </button>
              <button 
                onClick={handleConfirm} 
                className="inline-flex items-center gap-1 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors text-sm font-medium"
              >
                <CheckCircle className="w-4 h-4" />
                确认通过
              </button>
            </div>
          ) : (
            <button onClick={() => setDetailModalOpen(false)} className="btn-primary">关闭</button>
          )
        }
      >
        {selectedRecord && (
          <div className="space-y-6">
            {isReadonly && selectedRecord.reviewedAt && (
              <div className={`p-4 rounded-xl border ${selectedRecord.status === 'confirmed' ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-center gap-2">
                  {selectedRecord.status === 'confirmed' ? (
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                  <span className={`font-semibold ${selectedRecord.status === 'confirmed' ? 'text-emerald-800' : 'text-red-800'}`}>
                    已{selectedRecord.status === 'confirmed' ? '确认通过' : '驳回'}
                  </span>
                  <span className="text-sm text-slate-500 ml-auto">
                    审核人：{selectedRecord.reviewerName} · {formatDateTime(selectedRecord.reviewedAt)}
                  </span>
                </div>
                {selectedRecord.reviewRemark && (
                  <p className={`mt-2 text-sm ${selectedRecord.status === 'confirmed' ? 'text-emerald-700' : 'text-red-700'}`}>
                    审核意见：{selectedRecord.reviewRemark}
                  </p>
                )}
                {selectedRecord.qualityScore && (
                  <div className="mt-2 flex items-center gap-4">
                    <span className="text-sm text-slate-600">
                      评分：<span className="font-semibold text-emerald-600">{selectedRecord.qualityScore.totalScore}</span> 分
                    </span>
                    <span className="text-sm text-slate-600">
                      评级：<Badge variant={selectedRecord.qualityScore.overallRating === 'excellent' ? 'success' : selectedRecord.qualityScore.overallRating === 'good' ? 'info' : selectedRecord.qualityScore.overallRating === 'fair' ? 'warning' : 'danger'}>
                        {getRatingLabel(selectedRecord.qualityScore.overallRating)}
                      </Badge>
                    </span>
                  </div>
                )}
              </div>
            )}

            <RuleViolationPanel violations={selectedRecord.ruleViolations || []} />

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
                      <div className="font-medium text-slate-800">{selectedRecord.customerName}</div>
                    </div>
                    <div>
                      <div className="text-slate-500 text-xs mb-1">性别 / 年龄</div>
                      <div className="font-medium text-slate-800">{selectedRecord.customerGender === 'female' ? '女' : '男'} / {selectedRecord.customerAge}岁</div>
                    </div>
                    <div>
                      <div className="text-slate-500 text-xs mb-1">手机号</div>
                      <div className="font-medium text-slate-800">{selectedRecord.customerPhone}</div>
                    </div>
                    <div>
                      <div className="text-slate-500 text-xs mb-1">就诊门店</div>
                      <div className="font-medium text-slate-800">{selectedRecord.storeName}</div>
                    </div>
                    <div>
                      <div className="text-slate-500 text-xs mb-1">操作医生</div>
                      <div className="font-medium text-slate-800">{selectedRecord.doctorName}</div>
                    </div>
                    <div>
                      <div className="text-slate-500 text-xs mb-1">记录编号</div>
                      <div className="font-medium text-slate-800">{selectedRecord.recordNo}</div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl">
                  <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-medical-500" />
                    注射点位图
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <FaceInjectionMap record={selectedRecord} />
                    <div className="space-y-3">
                      <div className="text-sm text-slate-600">
                        <span className="font-medium text-slate-700">项目：</span>
                        {selectedRecord.projectName}
                      </div>
                      <div className="text-sm text-slate-600">
                        <span className="font-medium text-slate-700">术前评估：</span>
                        {selectedRecord.preOpAssessment}
                      </div>
                      <div className="text-sm text-slate-600">
                        <span className="font-medium text-slate-700">术中记录：</span>
                        {selectedRecord.intraOpNotes}
                      </div>
                      <div className="text-sm text-slate-600">
                        <span className="font-medium text-slate-700">术后交代：</span>
                        {selectedRecord.postOpNotes}
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
                        {selectedRecord.drugs.map(d => (
                          <tr key={d.id} className="border-b border-slate-100 last:border-0">
                            <td className="py-2.5 text-slate-700 font-medium">{d.drugName}</td>
                            <td className="py-2.5 text-slate-600">{d.drugBrand}</td>
                            <td className="py-2.5 text-slate-600">{d.specification}</td>
                            <td className={`py-2.5 font-mono text-xs ${!d.batchNo ? 'text-red-600 font-medium' : 'text-slate-600'}`}>
                              {d.batchNo || <span className="text-red-500">缺失</span>}
                            </td>
                            <td className="py-2.5 text-slate-700 text-right">{d.dosage}{d.unit}</td>
                            <td className="py-2.5 text-slate-700 text-right">¥{d.price.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl">
                  <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-medical-500" />
                    术前/术后照片
                  </h4>
                  <div className="grid grid-cols-4 gap-3">
                    {['术前正面', '术前侧面', '术后正面', '术后侧面'].map((label, idx) => (
                      <div key={label} className={`aspect-[3/4] rounded-lg flex flex-col items-center justify-center ${selectedRecord.beforePhotos && idx < 2 ? 'bg-slate-100' : idx >= 2 && selectedRecord.afterPhotos ? 'bg-slate-100' : 'bg-gradient-to-br from-red-50 to-red-100 border border-red-200'}`}>
                        <ImageIcon className={`w-8 h-8 mb-1 ${selectedRecord.beforePhotos && idx < 2 ? 'text-slate-400' : idx >= 2 && selectedRecord.afterPhotos ? 'text-slate-400' : 'text-red-400'}`} />
                        <span className={`text-xs ${selectedRecord.beforePhotos && idx < 2 ? 'text-slate-400' : idx >= 2 && selectedRecord.afterPhotos ? 'text-slate-400' : 'text-red-500'}`}>{label}</span>
                        {(!selectedRecord.beforePhotos || selectedRecord.beforePhotos.length === 0) && idx < 2 && (
                          <span className="text-xs text-red-500 mt-1">缺失</span>
                        )}
                      </div>
                    ))}
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
                    {selectedRecord.riskPoints && selectedRecord.riskPoints.length > 0 ? (
                      selectedRecord.riskPoints.map(r => {
                        const rm = riskLevelMap[r.level as keyof typeof riskLevelMap];
                        return (
                          <div key={r.id} className={`p-2.5 rounded-lg border ${rm.color} border-current/20`}>
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className={`w-1.5 h-1.5 rounded-full ${rm.color.replace('text-', 'bg-').split(' ')[0]}`} />
                              <span className="text-xs font-medium">{rm.label}</span>
                              <span className="text-xs text-slate-400 ml-auto">{r.category}</span>
                            </div>
                            <p className="text-xs text-slate-600">{r.description}</p>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-sm text-slate-400 text-center py-4">暂无风险点</div>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl">
                  <QualityScorePanel
                    record={selectedRecord}
                    scores={qualityScores}
                    onScoreChange={handleScoreChange}
                    readOnly={isReadonly}
                  />
                  {!isReadonly && (
                    <div className="mt-4">
                      <label className="text-sm text-slate-700 mb-1 block">审核评语</label>
                      <textarea
                        value={reviewRemark}
                        onChange={(e) => setReviewRemark(e.target.value)}
                        placeholder="请输入审核评语..."
                        rows={3}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-medical-500 resize-none"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <RulesHelpModal open={rulesHelpOpen} onClose={() => setRulesHelpOpen(false)} />
    </div>
  );
}
