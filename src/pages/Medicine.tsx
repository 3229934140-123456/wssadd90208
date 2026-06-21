import { useState, useMemo } from 'react';
import {
  Pill,
  TrendingUp,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  Eye,
  Search,
  ChevronDown,
  Package,
  Activity,
  BarChart3,
  FileText,
} from 'lucide-react';
import { StatCard, Badge, DataTable } from '../components/ui';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { drugs, customerRecords, projectTemplates } from '../data/mockData';
import type { Drug, DrugUsage } from '../types';

const drugTypeLabel: Record<string, string> = {
  botulinum: '肉毒素',
  hyaluronic_acid: '玻尿酸',
  collagen: '胶原蛋白',
  amino_acid: '修复类',
  vitamin: '动能素',
  other: '其他',
};

const drugStatusMap: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'default' }> = {
  normal: { label: '正常', variant: 'success' },
  expiring: { label: '临期', variant: 'warning' },
  expired: { label: '过期', variant: 'danger' },
  out_of_stock: { label: '缺货', variant: 'danger' },
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function generateTrendData() {
  const types = ['botulinum', 'hyaluronic_acid', 'collagen', 'amino_acid', 'vitamin'];
  const data = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date('2024-06-22');
    d.setDate(d.getDate() - i);
    const entry: any = { date: `${d.getMonth() + 1}/${d.getDate()}` };
    types.forEach(t => {
      const base = t === 'hyaluronic_acid' ? 80 : t === 'botulinum' ? 60 : t === 'vitamin' ? 40 : 20;
      entry[drugTypeLabel[t]] = Math.max(0, base + Math.floor(Math.random() * 40) - 20);
    });
    data.push(entry);
  }
  return data;
}

function generateDrugFlow(drugList: Drug[]) {
  const flows: any[] = [];
  const operators = ['王小护', '张美容', '李整形', '质控张', '刘美丽'];
  let idx = 0;

  drugList.forEach(drug => {
    const flowCount = 2 + Math.floor(Math.random() * 4);
    for (let i = 0; i < flowCount; i++) {
      const isInbound = Math.random() > 0.5;
      const d = new Date('2024-06-22');
      d.setDate(d.getDate() - Math.floor(Math.random() * 30));
      d.setHours(9 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 60));

      flows.push({
        id: `flow_${idx++}`,
        batchNo: drug.batchNo,
        drugName: drug.name,
        type: isInbound ? 'inbound' : 'outbound',
        quantity: isInbound ? 10 + Math.floor(Math.random() * 50) : 1 + Math.floor(Math.random() * 5),
        operator: operators[Math.floor(Math.random() * operators.length)],
        time: d.toISOString(),
      });
    }
  });

  return flows.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
}

export default function Medicine() {
  const [activeTab, setActiveTab] = useState<'inventory' | 'usage' | 'flow'>('inventory');
  const [searchText, setSearchText] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const trendData = useMemo(() => generateTrendData(), []);
  const drugFlows = useMemo(() => generateDrugFlow(drugs), []);

  const kpiData = useMemo(() => {
    const allUsages = customerRecords.flatMap(r => r.drugs);
    const monthStart = new Date('2024-06-01').toISOString();
    const monthUsages = allUsages.filter(u => u.usedAt >= monthStart);
    const warningCount = drugs.filter(d => d.stock <= d.warningStock).length;
    const expiringCount = drugs.filter(d => {
      const exp = new Date(d.expiryDate);
      const now = new Date('2024-06-22');
      const diffDays = (exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return diffDays < 180 && diffDays > 0;
    }).length;

    return {
      specCount: drugs.length,
      monthUsage: monthUsages.length,
      warningCount,
      expiringCount,
    };
  }, []);

  const filteredDrugs = useMemo(() => {
    return drugs.filter(d => {
      if (searchText && !d.name.includes(searchText) && !d.brand.includes(searchText) && !d.batchNo.includes(searchText)) return false;
      if (typeFilter && d.type !== typeFilter) return false;
      if (statusFilter && d.status !== statusFilter) return false;
      return true;
    });
  }, [searchText, typeFilter, statusFilter]);

  const usageStats = useMemo(() => {
    const projectUsageMap = new Map<string, { drugId: string; drugName: string; dosages: number[]; standardDosage: number; unit: string }[]>();

    projectTemplates.forEach(pt => {
      if (!projectUsageMap.has(pt.id)) {
        projectUsageMap.set(pt.id, pt.defaultDrugs.map(dd => ({
          drugId: dd.drugId,
          drugName: dd.drugName,
          dosages: [],
          standardDosage: dd.defaultDosage,
          unit: dd.unit,
        })));
      }
    });

    customerRecords.forEach(r => {
      const projectDrugs = projectUsageMap.get(r.projectId);
      if (projectDrugs) {
        r.drugs.forEach(d => {
          const match = projectDrugs.find(pd => pd.drugId === d.drugId);
          if (match) match.dosages.push(d.dosage);
        });
      }
    });

    const stats: any[] = [];
    projectTemplates.forEach(pt => {
      const projectDrugs = projectUsageMap.get(pt.id);
      if (!projectDrugs) return;
      projectDrugs.forEach(pd => {
        if (pd.dosages.length === 0) return;
        const avg = pd.dosages.reduce((a, b) => a + b, 0) / pd.dosages.length;
        const deviation = pd.standardDosage > 0 ? ((avg - pd.standardDosage) / pd.standardDosage) * 100 : 0;
        stats.push({
          id: `${pt.id}_${pd.drugId}`,
          projectName: pt.name,
          drugName: pd.drugName,
          usageCount: pd.dosages.length,
          avgDosage: Number(avg.toFixed(2)),
          standardDosage: pd.standardDosage,
          unit: pd.unit,
          deviation: Number(deviation.toFixed(1)),
        });
      });
    });

    return stats;
  }, []);

  const inventoryColumns = [
    {
      key: 'drug',
      title: '药品名称',
      dataIndex: 'name' as const,
      render: (_: unknown, record: Drug) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center">
            <Pill className="w-4 h-4 text-primary-500" />
          </div>
          <div>
            <div className="font-medium text-slate-800">{record.name}</div>
            <div className="text-xs text-slate-500">{record.brand}</div>
          </div>
        </div>
      ),
      width: 200,
    },
    {
      key: 'spec',
      title: '规格',
      dataIndex: 'specification' as const,
      render: (v: unknown) => <span className="text-slate-600">{String(v)}</span>,
      width: 100,
    },
    {
      key: 'batch',
      title: '批号',
      dataIndex: 'batchNo' as const,
      render: (v: unknown) => <span className="font-mono text-xs text-slate-600">{String(v)}</span>,
      width: 140,
    },
    {
      key: 'expiry',
      title: '效期',
      dataIndex: 'expiryDate' as const,
      render: (v: unknown) => {
        const exp = new Date(String(v));
        const now = new Date('2024-06-22');
        const diffDays = (exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        const isExpiring = diffDays < 180;
        return (
          <span className={`text-sm ${isExpiring ? 'text-amber-600 font-medium' : 'text-slate-600'}`}>
            {formatDate(String(v))}
          </span>
        );
      },
      width: 120,
    },
    {
      key: 'stock',
      title: '库存数量',
      dataIndex: 'stock' as const,
      render: (v: unknown, record: Drug) => (
        <div className="flex items-center gap-2">
          <span className={`font-semibold ${Number(v) <= record.warningStock ? 'text-red-600' : 'text-slate-700'}`}>
            {Number(v)}
          </span>
          <span className="text-xs text-slate-400">{record.unit}</span>
        </div>
      ),
      width: 100,
    },
    {
      key: 'warning',
      title: '预警阈值',
      dataIndex: 'warningStock' as const,
      render: (v: unknown, record: Drug) => (
        <span className="text-sm text-slate-500">{Number(v)} {record.unit}</span>
      ),
      width: 100,
    },
    {
      key: 'status',
      title: '状态',
      dataIndex: 'status' as const,
      render: (v: unknown) => {
        const s = drugStatusMap[String(v)];
        return <Badge variant={s.variant}>{s.label}</Badge>;
      },
      width: 80,
    },
    {
      key: 'action',
      title: '操作',
      dataIndex: 'id' as const,
      render: (_: unknown) => (
        <button className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-medical-600 hover:bg-medical-50 rounded-lg transition-colors">
          <Eye className="w-3.5 h-3.5" />
          详情
        </button>
      ),
      width: 80,
    },
  ];

  const usageColumns = [
    {
      key: 'project',
      title: '项目名称',
      dataIndex: 'projectName' as const,
      render: (v: unknown) => <span className="font-medium text-slate-700">{String(v)}</span>,
      width: 220,
    },
    {
      key: 'drug',
      title: '药品名称',
      dataIndex: 'drugName' as const,
      render: (v: unknown) => <span className="text-slate-600">{String(v)}</span>,
      width: 180,
    },
    {
      key: 'count',
      title: '使用次数',
      dataIndex: 'usageCount' as const,
      render: (v: unknown) => <span className="text-slate-600">{Number(v)} 次</span>,
      width: 100,
    },
    {
      key: 'avg',
      title: '平均用量',
      dataIndex: 'avgDosage' as const,
      render: (v: unknown, record: any) => <span className="text-slate-700 font-medium">{Number(v)}{record.unit}</span>,
      width: 120,
    },
    {
      key: 'standard',
      title: '标准剂量',
      dataIndex: 'standardDosage' as const,
      render: (v: unknown, record: any) => <span className="text-slate-500">{Number(v)}{record.unit}</span>,
      width: 120,
    },
    {
      key: 'deviation',
      title: '偏差率',
      dataIndex: 'deviation' as const,
      render: (v: unknown) => {
        const dev = Number(v);
        const isHigh = Math.abs(dev) > 20;
        const isPositive = dev >= 0;
        return (
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
            isHigh ? 'bg-red-50 text-red-600' : isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-600'
          }`}>
            {isPositive ? '+' : ''}{dev}%
            {isHigh && <AlertTriangle className="w-3 h-3" />}
          </span>
        );
      },
      width: 100,
    },
  ];

  const flowColumns = [
    {
      key: 'drug',
      title: '药品名称',
      dataIndex: 'drugName' as const,
      render: (v: unknown) => <span className="font-medium text-slate-700">{String(v)}</span>,
      width: 200,
    },
    {
      key: 'batch',
      title: '批号',
      dataIndex: 'batchNo' as const,
      render: (v: unknown) => <span className="font-mono text-xs text-slate-600">{String(v)}</span>,
      width: 160,
    },
    {
      key: 'type',
      title: '出入库类型',
      dataIndex: 'type' as const,
      render: (v: unknown) => {
        const isIn = String(v) === 'inbound';
        return (
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
            isIn ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'
          }`}>
            {isIn ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
            {isIn ? '入库' : '出库'}
          </span>
        );
      },
      width: 120,
    },
    {
      key: 'quantity',
      title: '数量',
      dataIndex: 'quantity' as const,
      render: (v: unknown, record: any) => (
        <span className={`font-semibold ${record.type === 'inbound' ? 'text-emerald-600' : 'text-orange-600'}`}>
          {record.type === 'inbound' ? '+' : '-'}{Number(v)}
        </span>
      ),
      width: 100,
    },
    {
      key: 'operator',
      title: '操作人',
      dataIndex: 'operator' as const,
      render: (v: unknown) => <span className="text-slate-600">{String(v)}</span>,
      width: 120,
    },
    {
      key: 'time',
      title: '操作时间',
      dataIndex: 'time' as const,
      render: (v: unknown) => <span className="text-sm text-slate-500">{formatDate(String(v))}</span>,
      width: 140,
    },
  ];

  const chartColors = ['#3b82f6', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6'];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">药品统计</h1>
          <p className="text-sm text-slate-500 mt-1">药品库存管理、用量趋势与出入库追踪</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <StatCard
          title="药品品规数"
          value={kpiData.specCount}
          icon={<Pill className="w-5 h-5" />}
          trend={5}
          trendLabel="较上月"
          color="blue"
        />
        <StatCard
          title="本月用量"
          value={kpiData.monthUsage}
          icon={<Activity className="w-5 h-5" />}
          trend={12}
          trendLabel="较上月"
          color="pink"
        />
        <StatCard
          title="库存预警数"
          value={kpiData.warningCount}
          icon={<AlertTriangle className="w-5 h-5" />}
          trend={-2}
          trendLabel="较上月"
          color="orange"
        />
        <StatCard
          title="临期药品数"
          value={kpiData.expiringCount}
          icon={<Clock className="w-5 h-5" />}
          trend={3}
          trendLabel="较上月"
          color="green"
        />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-medical-500" />
              近30天用量趋势
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">各品类药品每日用量统计</p>
          </div>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <defs>
                {Object.values(drugTypeLabel).map((label, idx) => (
                  <linearGradient key={label} id={`color${idx}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartColors[idx]} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={chartColors[idx]} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={{ stroke: '#e2e8f0' }}
                tickLine={false}
                interval={4}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={{ stroke: '#e2e8f0' }}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  fontSize: '12px',
                }}
              />
              <Legend
                iconType="circle"
                wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }}
              />
              {Object.values(drugTypeLabel).map((label, idx) => (
                <Area
                  key={label}
                  type="monotone"
                  dataKey={label}
                  stackId="1"
                  stroke={chartColors[idx]}
                  strokeWidth={2}
                  fill={`url(#color${idx})`}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center gap-1 border-b border-slate-200 px-4">
          {[
            { key: 'inventory' as const, label: '药品库存', icon: <Package className="w-4 h-4" /> },
            { key: 'usage' as const, label: '用量统计', icon: <BarChart3 className="w-4 h-4" /> },
            { key: 'flow' as const, label: '耗材追踪', icon: <FileText className="w-4 h-4" /> },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`inline-flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-medical-600 text-medical-600'
                  : 'border-transparent text-slate-600 hover:text-slate-800'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'inventory' && (
          <div>
            <div className="p-4 flex items-center gap-3 flex-wrap border-b border-slate-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  placeholder="搜索药品名称/品牌/批号"
                  value={searchText}
                  onChange={e => setSearchText(e.target.value)}
                  className="input pl-9 w-56"
                />
              </div>
              <div className="relative">
                <select
                  value={typeFilter}
                  onChange={e => setTypeFilter(e.target.value)}
                  className="input w-36 appearance-none pr-8"
                >
                  <option value="">全部类型</option>
                  {Object.entries(drugTypeLabel).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="input w-32 appearance-none pr-8"
                >
                  <option value="">全部状态</option>
                  {Object.entries(drugStatusMap).map(([v, l]) => (
                    <option key={v} value={v}>{l.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
              <button
                onClick={() => { setSearchText(''); setTypeFilter(''); setStatusFilter(''); }}
                className="btn-secondary"
              >
                重置
              </button>
            </div>
            <DataTable
              columns={inventoryColumns as any}
              dataSource={filteredDrugs as any}
              rowKey="id"
              pageSize={8}
            />
          </div>
        )}

        {activeTab === 'usage' && (
          <div>
            <div className="p-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span className="text-sm text-slate-600">
                  偏差率超过 <span className="text-red-600 font-medium">±20%</span> 的项目将高亮显示
                </span>
              </div>
            </div>
            <DataTable
              columns={usageColumns as any}
              dataSource={usageStats as any}
              rowKey="id"
              pageSize={10}
            />
          </div>
        )}

        {activeTab === 'flow' && (
          <DataTable
            columns={flowColumns as any}
            dataSource={drugFlows as any}
            rowKey="id"
            pageSize={10}
          />
        )}
      </div>
    </div>
  );
}
