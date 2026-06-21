import { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  LayoutTemplate,
  MapPin,
  Shield,
  X,
  Camera,
  AlertTriangle,
  Pill,
  CheckCircle,
  Eye,
  EyeOff,
  User,
  Users,
  Activity,
  FileText,
  Settings,
  ClipboardCheck,
  BarChart3,
} from 'lucide-react';
import { Modal, Badge, Tag, Empty } from '../components/ui';
import {
  projectTemplates,
  injectionPoints,
  drugs,
} from '../data/mockData';
import type {
  ProjectTemplate,
  InjectionPoint,
  UserRole,
  ProjectCategory,
} from '../types';

type TabKey = 'templates' | 'points' | 'permissions';
type PointCategory = 'face' | 'neck' | 'body';

const categoryLabels: Record<ProjectCategory, string> = {
  injection: '注射美容',
  filling: '填充美容',
  wrinkle_removal: '除皱抗衰',
  hydration: '水光补水',
  lifting: '提升紧致',
  other: '其他',
};

const categoryColors: Record<ProjectCategory, 'blue' | 'pink' | 'green' | 'orange' | 'purple' | 'gray'> = {
  injection: 'blue',
  filling: 'pink',
  wrinkle_removal: 'purple',
  hydration: 'green',
  lifting: 'orange',
  other: 'gray',
};

interface RoleConfig {
  key: UserRole;
  name: string;
  description: string;
  icon: typeof User;
}

const roleConfigs: RoleConfig[] = [
  { key: 'super_admin', name: '超级管理员', description: '系统最高权限，可管理所有功能', icon: Shield },
  { key: 'store_admin', name: '门店院长', description: '管理门店日常运营和人员', icon: Users },
  { key: 'doctor', name: '医生', description: '执行注射操作和病历记录', icon: User },
  { key: 'nurse', name: '护士', description: '协助医生，术前准备和术后护理', icon: Activity },
  { key: 'receptionist', name: '前台接待', description: '客户接待和预约管理', icon: FileText },
  { key: 'quality_inspector', name: '质控专员', description: '医疗质量审核和风险监控', icon: ClipboardCheck },
];

const permissionModules = [
  { key: 'dashboard', name: '经营看板', icon: BarChart3 },
  { key: 'records', name: '诊疗记录', icon: FileText },
  { key: 'templates', name: '项目模板', icon: LayoutTemplate },
  { key: 'points', name: '注射点位', icon: MapPin },
  { key: 'drugs', name: '药品管理', icon: Pill },
  { key: 'quality', name: '质量控制', icon: ClipboardCheck },
  { key: 'reports', name: '报表中心', icon: BarChart3 },
  { key: 'settings', name: '系统设置', icon: Settings },
];

const photoAngles = [
  '正面照',
  '左侧45°',
  '右侧45°',
  '左侧90°',
  '右侧90°',
  '仰头位',
  '低头位',
];

function Switch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-medical-500 focus-visible:ring-offset-2 ${
        checked ? 'bg-medical-600' : 'bg-slate-200'
      }`}
    >
      <span
      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition-transform ${
        checked ? 'translate-x-4' : 'translate-x-0'
      }`}
    />
  </button>
  );
}

function ProjectTemplatesTab() {
  const [searchText, setSearchText] = useState('');
  const [editingTemplate, setEditingTemplate] = useState<ProjectTemplate | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [templates, setTemplates] = useState<ProjectTemplate[]>(projectTemplates);

  const filtered = useMemo(() => {
    if (!searchText.trim()) return templates;
    const kw = searchText.toLowerCase();
    return templates.filter(
      (t) =>
        t.name.toLowerCase().includes(kw) ||
        t.code.toLowerCase().includes(kw) ||
        categoryLabels[t.category].includes(kw)
    );
  }, [templates, searchText]);

  const handleNew = () => {
    const newTemplate: ProjectTemplate = {
      id: `proj_${Date.now()}`,
      name: '',
      category: 'injection',
      code: '',
      duration: 30,
      description: '',
      indications: [],
      contraindications: [],
      injectionPoints: [],
      defaultDrugs: [],
      preOpNotes: [],
      postOpNotes: [],
      followUpDays: [7, 30],
      price: 0,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setEditingTemplate(newTemplate);
    setIsModalOpen(true);
  };

  const handleEdit = (tpl: ProjectTemplate) => {
    setEditingTemplate({ ...tpl });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  };

  const handleToggleStatus = (id: string) => {
    setTemplates((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, status: t.status === 'active' ? 'inactive' : 'active' } : t
      )
    );
  };

  const handleSave = () => {
    if (!editingTemplate) return;
    setTemplates((prev) => {
      const exists = prev.find((t) => t.id === editingTemplate.id);
      if (exists) {
        return prev.map((t) =>
          t.id === editingTemplate.id
            ? { ...editingTemplate, updatedAt: new Date().toISOString() }
            : t
        );
      }
      return [...prev, { ...editingTemplate, createdAt: new Date().toISOString() }];
    });
    setIsModalOpen(false);
    setEditingTemplate(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="搜索项目名称、编码..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="input w-full pl-10"
          />
        </div>
        <button onClick={handleNew} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          新建模板
        </button>
      </div>

      {filtered.length === 0 ? (
        <Empty description="暂无项目模板" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((tpl) => (
            <div key={tpl.id} className="card p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-800 truncate">{tpl.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{tpl.code}</p>
                </div>
                <Tag color={categoryColors[tpl.category]}>
                  {categoryLabels[tpl.category]}
                </Tag>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">价格</span>
                  <span className="font-semibold text-primary-600">¥{tpl.price.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">适用点位</span>
                  <span className="text-slate-700">{tpl.injectionPoints.length} 个</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">时长</span>
                  <span className="text-slate-700">{tpl.duration} 分钟</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">状态</span>
                  <Switch checked={tpl.status === 'active'} onChange={() => handleToggleStatus(tpl.id)} />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                <button
                  onClick={() => handleEdit(tpl)}
                  className="flex-1 btn-secondary flex items-center justify-center gap-1.5 text-xs py-1.5"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  编辑
                </button>
                <button
                  onClick={() => handleDelete(tpl.id)}
                  className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-lg transition-colors text-xs font-medium flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <TemplateEditModal
        open={isModalOpen}
        template={editingTemplate}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTemplate(null);
        }}
        onChange={setEditingTemplate}
        onSave={handleSave}
      />
    </div>
  );
}

interface TemplateEditModalProps {
  open: boolean;
  template: ProjectTemplate | null;
  onClose: () => void;
  onChange: (t: ProjectTemplate | null) => void;
  onSave: () => void;
}

function TemplateEditModal({ open, template, onClose, onChange, onSave }: TemplateEditModalProps) {
  if (!template) return null;

  const updateField = <K extends keyof ProjectTemplate>(key: K, value: ProjectTemplate[K]) => {
    onChange({ ...template, [key]: value });
  };

  const togglePoint = (point: InjectionPoint) => {
    const exists = template.injectionPoints.find((p) => p.pointId === point.id);
    if (exists) {
      onChange({
        ...template,
        injectionPoints: template.injectionPoints.filter((p) => p.pointId !== point.id),
      });
    } else {
      onChange({
        ...template,
        injectionPoints: [
          ...template.injectionPoints,
          {
            pointId: point.id,
            pointName: point.name,
            recommendedDosage: point.minDosage,
            unit: point.unit,
          },
        ],
      });
    }
  };

  const updatePointDosage = (pointId: string, dosage: number) => {
    onChange({
      ...template,
      injectionPoints: template.injectionPoints.map((p) =>
        p.pointId === pointId ? { ...p, recommendedDosage: dosage } : p
      ),
    });
  };

  const toggleDrug = (drugId: string) => {
    const drug = drugs.find((d) => d.id === drugId);
    if (!drug) return;
    const exists = template.defaultDrugs.find((d) => d.drugId === drugId);
    if (exists) {
      onChange({
        ...template,
        defaultDrugs: template.defaultDrugs.filter((d) => d.drugId !== drugId),
      });
    } else {
      onChange({
        ...template,
        defaultDrugs: [
          ...template.defaultDrugs,
          {
            drugId: drug.id,
            drugName: drug.name,
            defaultDosage: 0,
            unit: drug.unit,
          },
        ],
      });
    }
  };

  const updateDrugDosage = (drugId: string, dosage: number) => {
    onChange({
      ...template,
      defaultDrugs: template.defaultDrugs.map((d) =>
        d.drugId === drugId ? { ...d, defaultDosage: dosage } : d
      ),
    });
  };

  const togglePhotoAngle = (angle: string) => {
    const key = 'requiredPhotoAngles' as keyof ProjectTemplate;
    const current = (template as any)[key] || [];
    if (current.includes(angle)) {
      updateField(key, current.filter((a: string) => a !== angle) as any);
    } else {
      updateField(key, [...current, angle]);
    }
  };

  const requiredPhotoAngles = (template as any).requiredPhotoAngles || [];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={template.name ? '编辑项目模板' : '新建项目模板'}
      width={800}
      footer={
        <>
          <button onClick={onClose} className="btn-secondary">
            取消
          </button>
          <button onClick={onSave} className="btn-primary">
            保存
          </button>
        </>
      }
    >
      <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-2">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">项目名称</label>
            <input
              type="text"
              className="input w-full"
              value={template.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="请输入项目名称"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">分类</label>
            <select
              className="input w-full"
              value={template.category}
              onChange={(e) => updateField('category', e.target.value as ProjectCategory)}
            >
              {Object.entries(categoryLabels).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">项目编码</label>
            <input
              type="text"
              className="input w-full"
              value={template.code}
              onChange={(e) => updateField('code', e.target.value)}
              placeholder="如：SL-HL-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">价格（元）</label>
            <input
              type="number"
              className="input w-full"
              value={template.price}
              onChange={(e) => updateField('price', Number(e.target.value))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">时长（分钟）</label>
            <input
              type="number"
              className="input w-full"
              value={template.duration}
              onChange={(e) => updateField('duration', Number(e.target.value))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">状态</label>
            <select
              className="input w-full"
              value={template.status}
              onChange={(e) => updateField('status', e.target.value as 'active' | 'inactive')}
            >
              <option value="active">启用</option>
              <option value="inactive">停用</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">项目描述</label>
          <textarea
            className="input w-full min-h-[60px]"
            value={template.description}
            onChange={(e) => updateField('description', e.target.value)}
            placeholder="请输入项目描述"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">点位配置（多选 + 剂量范围）</label>
          <div className="border border-slate-200 rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto">
            {injectionPoints.map((p) => (
              <div key={p.id} className="flex items-center gap-3">
                <label className="flex items-center gap-2 flex-1">
                  <input
                    type="checkbox"
                    checked={template.injectionPoints.some((ip) => ip.pointId === p.id)}
                    onChange={() => togglePoint(p)}
                    className="w-4 h-4 text-medical-600 rounded"
                  />
                  <span className="text-sm text-slate-700">{p.name}</span>
                  <span className="text-xs text-slate-400">({p.code})</span>
                </label>
                {template.injectionPoints.some((ip) => ip.pointId === p.id) && (
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="0.1"
                      className="input w-20 text-xs py-1"
                      value={template.injectionPoints.find((ip) => ip.pointId === p.id)?.recommendedDosage || 0}
                      onChange={(e) => updatePointDosage(p.id, Number(e.target.value))}
                    />
                    <span className="text-xs text-slate-500">{p.unit}</span>
                    <span className="text-xs text-slate-400">({p.minDosage}-{p.maxDosage} {p.unit})</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">药品配置</label>
          <div className="border border-slate-200 rounded-lg p-3 space-y-2 max-h-40 overflow-y-auto">
            {drugs.slice(0, 10).map((d) => (
              <div key={d.id} className="flex items-center gap-3">
                <label className="flex items-center gap-2 flex-1">
                  <input
                    type="checkbox"
                    checked={template.defaultDrugs.some((dd) => dd.drugId === d.id)}
                    onChange={() => toggleDrug(d.id)}
                    className="w-4 h-4 text-medical-600 rounded"
                  />
                  <span className="text-sm text-slate-700">{d.name}</span>
                  <span className="text-xs text-slate-400">({d.specification})</span>
                </label>
                {template.defaultDrugs.some((dd) => dd.drugId === d.id) && (
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="0.1"
                      className="input w-20 text-xs py-1"
                      value={template.defaultDrugs.find((dd) => dd.drugId === d.id)?.defaultDosage || 0}
                      onChange={(e) => updateDrugDosage(d.id, Number(e.target.value))}
                    />
                    <span className="text-xs text-slate-500">{d.unit}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">术前注意事项</label>
            <textarea
              className="input w-full min-h-[80px]"
              value={template.preOpNotes.join('\n')}
              onChange={(e) => updateField('preOpNotes', e.target.value.split('\n').filter(Boolean))}
              placeholder="每行一条"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">术后注意事项</label>
            <textarea
              className="input w-full min-h-[80px]"
              value={template.postOpNotes.join('\n')}
              onChange={(e) => updateField('postOpNotes', e.target.value.split('\n').filter(Boolean))}
              placeholder="每行一条"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">禁忌备注</label>
          <textarea
            className="input w-full min-h-[60px]"
            value={template.contraindications.join('\n')}
            onChange={(e) => updateField('contraindications', e.target.value.split('\n').filter(Boolean))}
            placeholder="每行一条"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">必须拍照角度</label>
          <div className="flex flex-wrap gap-2">
            {photoAngles.map((angle) => (
              <label
                key={angle}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border cursor-pointer transition-colors ${
                  requiredPhotoAngles.includes(angle)
                    ? 'bg-medical-50 border-medical-300 text-medical-700'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <input
                  type="checkbox"
                  checked={requiredPhotoAngles.includes(angle)}
                  onChange={() => togglePhotoAngle(angle)}
                  className="sr-only"
                />
                <span className="text-xs font-medium">{angle}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}

function InjectionPointsTab() {
  const [activeCategory, setActiveCategory] = useState<PointCategory>('face');
  const [selectedPoint, setSelectedPoint] = useState<InjectionPoint | null>(null);

  const filteredPoints = useMemo(
    () => injectionPoints.filter((p) => p.category === activeCategory),
    [activeCategory]
  );

  const facePoints = useMemo(
    () => injectionPoints.filter((p) => p.category === 'face'),
    []
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {(['face', 'neck', 'body'] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeCategory === cat
                ? 'bg-medical-600 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {cat === 'face' ? '面部' : cat === 'neck' ? '颈部' : '身体'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1 card p-4">
          <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-medical-600" />
            {activeCategory === 'face' ? '面部点位预览' : activeCategory === 'neck' ? '颈部点位预览' : '身体点位预览'}
          </h3>

          {activeCategory === 'face' ? (
            <div className="relative flex items-center justify-center py-4">
              <svg viewBox="0 0 100 100" className="w-full max-w-xs h-auto">
                <ellipse
                  cx="50"
                  cy="50"
                  rx="30"
                  ry="38"
                  fill="#fef3c7"
                  stroke="#fbbf24"
                  strokeWidth="0.8"
                />
                <path
                  d="M35 28 Q50 24 65 28"
                  fill="none"
                  stroke="#78350f"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                />
                <ellipse cx="38" cy="38" rx="3" ry="2.5" fill="#1f2937" />
                <ellipse cx="62" cy="38" rx="3" ry="2.5" fill="#1f2937" />
                <path
                  d="M50 40 L48 48 L52 48 Z"
                  fill="#fca5a5"
                />
                <path
                  d="M44 60 Q50 65 56 60"
                  fill="none"
                  stroke="#dc2626"
                  strokeWidth="1"
                  strokeLinecap="round"
                />
                <ellipse cx="50" cy="95" rx="12" ry="5" fill="#e5e7eb" opacity="0.5" />

                {facePoints.map((point) => (
                  <g key={point.id}>
                    <circle
                      cx={point.coordinates?.x}
                      cy={point.coordinates?.y}
                      r="2.5"
                      fill={selectedPoint?.id === point.id ? '#2563eb' : '#ec4899'}
                      stroke="white"
                      strokeWidth="0.8"
                      className="cursor-pointer transition-all"
                      onClick={() => setSelectedPoint(point)}
                    />
                    <title>{point.name}</title>
                  </g>
                ))}
              </svg>
            </div>
          ) : activeCategory === 'neck' ? (
            <div className="relative flex items-center justify-center py-8">
              <svg viewBox="0 0 100 100" className="w-full max-w-xs h-auto">
                <ellipse cx="50" cy="15" rx="20" ry="12" fill="#fef3c7" stroke="#fbbf24" strokeWidth="0.8" />
                <path d="M35 25 L30 80 Q30 90 50 95 Q70 90 70 80 L65 25" fill="#fef3c7" stroke="#fbbf24" strokeWidth="0.8" />
                {filteredPoints.map((point) => (
                  <g key={point.id}>
                    <circle
                      cx={point.coordinates?.x}
                      cy={point.coordinates?.y}
                      r="2.5"
                      fill={selectedPoint?.id === point.id ? '#2563eb' : '#ec4899'}
                      stroke="white"
                      strokeWidth="0.8"
                      className="cursor-pointer"
                      onClick={() => setSelectedPoint(point)}
                    />
                    <title>{point.name}</title>
                  </g>
                ))}
              </svg>
            </div>
          ) : (
            <div className="py-16 flex items-center justify-center text-slate-400 text-sm">
              身体点位可视化开发中
            </div>
          )}

          {selectedPoint && (
            <div className="mt-4 p-3 bg-medical-50 rounded-lg border border-medical-100">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-slate-800">{selectedPoint.name}</h4>
                <Badge variant="info">{selectedPoint.code}</Badge>
              </div>
              <div className="text-xs text-slate-600 space-y-1">
                <p><span className="text-slate-500">所属区域：</span>{selectedPoint.facialZone}</p>
                <p>
                  <span className="text-slate-500">建议剂量：</span>
                  {selectedPoint.minDosage}-{selectedPoint.maxDosage} {selectedPoint.unit}
                </p>
                {selectedPoint.depthRange && (
                  <p>
                    <span className="text-slate-500">注射深度：</span>
                    {selectedPoint.depthRange.min}-{selectedPoint.depthRange.max} {selectedPoint.depthRange.unit}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          {filteredPoints.length === 0 ? (
            <Empty description="暂无点位数据" />
          ) : (
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        编码
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        名称
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        所属区域
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        剂量范围
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        注射深度
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        关联神经血管
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        注意事项
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredPoints.map((point) => (
                      <tr
                        key={point.id}
                        className={`hover:bg-slate-50 cursor-pointer transition-colors ${
                          selectedPoint?.id === point.id ? 'bg-medical-50' : ''
                        }`}
                        onClick={() => setSelectedPoint(point)}
                      >
                        <td className="px-4 py-3">
                          <Badge variant="info">{point.code}</Badge>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-slate-800">{point.name}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{point.facialZone || '-'}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {point.minDosage}-{point.maxDosage} {point.unit}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {point.depthRange
                            ? `${point.depthRange.min}-${point.depthRange.max} ${point.depthRange.unit}`
                            : '-'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-0.5">
                            {point.relatedNerves?.slice(0, 2).map((n) => (
                            <span key={n} className="text-xs text-slate-500">· {n}</span>
                          ))}
                          {point.relatedBloodVessels?.slice(0, 1).map((v) => (
                            <span key={v} className="text-xs text-slate-500">· {v}</span>
                          ))}
                        </div>
                        </td>
                        <td className="px-4 py-3 max-w-xs">
                          <div className="text-xs text-slate-500 line-clamp-2">
                            {point.precautions.slice(0, 2).join('；')}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PermissionsTab() {
  const defaultPermissions: Record<UserRole, Record<string, boolean>> = {
    super_admin: {
      dashboard: true,
      records: true,
      templates: true,
      points: true,
      drugs: true,
      quality: true,
      reports: true,
      settings: true,
    },
    store_admin: {
      dashboard: true,
      records: true,
      templates: true,
      points: true,
      drugs: true,
      quality: true,
      reports: true,
      settings: false,
    },
    doctor: {
      dashboard: true,
      records: true,
      templates: true,
      points: true,
      drugs: false,
      quality: false,
      reports: false,
      settings: false,
    },
    nurse: {
      dashboard: false,
      records: true,
      templates: false,
      points: true,
      drugs: false,
      quality: false,
      reports: false,
      settings: false,
    },
    receptionist: {
      dashboard: true,
      records: true,
      templates: false,
      points: false,
      drugs: false,
      quality: false,
      reports: false,
      settings: false,
    },
    quality_inspector: {
      dashboard: true,
      records: true,
      templates: false,
      points: false,
      drugs: false,
      quality: true,
      reports: true,
      settings: false,
    },
  };

  const [rolePermissions, setRolePermissions] = useState(defaultPermissions);

  const togglePermission = (role: UserRole, moduleKey: string) => {
    setRolePermissions((prev) => ({
      ...prev,
      [role]: {
        ...prev[role],
        [moduleKey]: !prev[role][moduleKey],
      },
    }));
  };

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-800 sticky left-0 bg-slate-50 z-10 min-w-[180px]">
                <div className="flex flex-col">
                  <span>角色 / 权限模块</span>
                  <span className="text-xs text-slate-500 font-normal mt-0.5">点击开关配置各模块权限</span>
                </div>
              </th>
              {permissionModules.map((mod) => (
                <th
                  key={mod.key}
                  className="px-4 py-4 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap min-w-[100px]"
                >
                  <div className="flex flex-col items-center gap-1">
                    <mod.icon className="w-4 h-4 text-medical-600" />
                    {mod.name}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {roleConfigs.map((role) => {
              const Icon = role.icon;
              return (
                <tr key={role.key} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 sticky left-0 bg-white z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-medical-100 to-medical-200 flex items-center justify-center text-medical-600">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-medium text-slate-800">{role.name}</div>
                        <div className="text-xs text-slate-500">{role.description}</div>
                      </div>
                    </div>
                  </td>
                  {permissionModules.map((mod) => (
                    <td key={mod.key} className="px-4 py-4 text-center">
                      <Switch
                        checked={rolePermissions[role.key][mod.key]}
                        onChange={() => togglePermission(role.key, mod.key)}
                      />
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function Standard() {
  const [activeTab, setActiveTab] = useState<TabKey>('templates');

  const tabs: { key: TabKey; label: string; icon: typeof LayoutTemplate }[] = [
    { key: 'templates', label: '项目模板', icon: LayoutTemplate },
    { key: 'points', label: '注射点位库', icon: MapPin },
    { key: 'permissions', label: '权限管理', icon: Shield },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800">标准设置
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          管理项目模板、注射点位库、角色权限等系统标准配置
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-1 p-2 border-b border-slate-200">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'bg-medical-50 text-medical-700'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="p-5">
          {activeTab === 'templates' && <ProjectTemplatesTab />}
          {activeTab === 'points' && <InjectionPointsTab />}
          {activeTab === 'permissions' && <PermissionsTab />}
        </div>
      </div>
    </div>
  );
}
