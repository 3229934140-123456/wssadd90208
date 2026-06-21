export type Gender = 'male' | 'female' | 'other';

export type UserRole = 'super_admin' | 'store_admin' | 'doctor' | 'nurse' | 'receptionist' | 'quality_inspector';

export type RecordStatus = 'pending' | 'confirmed' | 'rejected' | 'reviewing';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface RuleViolation {
  ruleId: string;
  ruleName: string;
  severity: 'high' | 'medium' | 'low';
  description: string;
  evidence?: string;
}

export interface AuditResult {
  needsReview: boolean;
  violations: RuleViolation[];
  riskPoints: RiskPoint[];
}

export type DrugType = 'botulinum' | 'hyaluronic_acid' | 'collagen' | 'amino_acid' | 'vitamin' | 'other';

export type ProjectCategory = 'injection' | 'filling' | 'wrinkle_removal' | 'hydration' | 'lifting' | 'other';

export interface Store {
  id: string;
  name: string;
  shortName: string;
  address: string;
  phone: string;
  manager: string;
  managerPhone: string;
  licenseNo: string;
  businessHours: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
  description?: string;
  city: string;
  district: string;
}

export interface Doctor {
  id: string;
  name: string;
  gender: Gender;
  age: number;
  avatar?: string;
  phone: string;
  idCardNo: string;
  licenseNo: string;
  title: 'attending' | 'associate_chief' | 'chief' | 'resident';
  specialty: string[];
  yearsOfExperience: number;
  storeId: string;
  storeName?: string;
  status: 'on_duty' | 'off_duty' | 'leave';
  email?: string;
  introduction?: string;
  joinDate: string;
  certifications?: string[];
}

export interface InjectionPoint {
  id: string;
  name: string;
  code: string;
  category: 'face' | 'neck' | 'body';
  facialZone?: string;
  coordinates?: {
    x: number;
    y: number;
    z?: number;
  };
  maxDosage: number;
  minDosage: number;
  unit: string;
  description: string;
  precautions: string[];
  contraindications: string[];
  relatedNerves?: string[];
  relatedBloodVessels?: string[];
  depthRange?: {
    min: number;
    max: number;
    unit: string;
  };
}

export interface ProjectTemplate {
  id: string;
  name: string;
  category: ProjectCategory;
  code: string;
  duration: number;
  description: string;
  indications: string[];
  contraindications: string[];
  injectionPoints: {
    pointId: string;
    pointName: string;
    recommendedDosage: number;
    unit: string;
  }[];
  defaultDrugs: {
    drugId: string;
    drugName: string;
    defaultDosage: number;
    unit: string;
  }[];
  preOpNotes: string[];
  postOpNotes: string[];
  followUpDays: number[];
  price: number;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface Drug {
  id: string;
  name: string;
  brand: string;
  genericName: string;
  type: DrugType;
  specification: string;
  unit: string;
  manufacturer: string;
  batchNo: string;
  productionDate: string;
  expiryDate: string;
  approvalNo: string;
  storageCondition: string;
  price: number;
  stock: number;
  warningStock: number;
  storeId: string;
  storeName?: string;
  status: 'normal' | 'expiring' | 'expired' | 'out_of_stock';
  ingredients?: string[];
  sideEffects?: string[];
  usageInstructions?: string;
}

export interface DrugUsage {
  id: string;
  recordId: string;
  drugId: string;
  drugName: string;
  drugBrand: string;
  specification: string;
  dosage: number;
  unit: string;
  batchNo: string;
  price: number;
  usedAt: string;
  operatorId: string;
  operatorName: string;
}

export interface QualityScore {
  id: string;
  recordId: string;
  inspectorId: string;
  inspectorName: string;
  totalScore: number;
  scores: {
    category: string;
    score: number;
    fullScore: number;
    remark?: string;
  }[];
  overallRating: 'excellent' | 'good' | 'fair' | 'poor';
  remarks?: string;
  suggestions?: string[];
  evaluatedAt: string;
  followUpRequired?: boolean;
  followUpDate?: string;
}

export interface RiskPoint {
  id: string;
  recordId: string;
  level: RiskLevel;
  category: string;
  description: string;
  identifiedAt: string;
  identifiedBy: string;
  status: 'open' | 'mitigated' | 'resolved' | 'closed';
  mitigationMeasures?: string[];
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionNotes?: string;
}

export interface CustomerRecord {
  id: string;
  recordNo: string;
  customerId: string;
  customerName: string;
  customerGender: Gender;
  customerAge: number;
  customerPhone: string;
  storeId: string;
  storeName: string;
  doctorId: string;
  doctorName: string;
  nurseId?: string;
  nurseName?: string;
  projectId: string;
  projectName: string;
  projectCategory: ProjectCategory;
  injectionPoints: {
    pointId: string;
    pointName: string;
    actualDosage: number;
    unit: string;
    depth?: number;
    angle?: number;
  }[];
  drugs: DrugUsage[];
  preOpAssessment?: string;
  intraOpNotes?: string;
  postOpNotes?: string;
  adverseReactions?: string[];
  beforePhotos?: string[];
  afterPhotos?: string[];
  customerSignature?: string;
  doctorSignature?: string;
  status: RecordStatus;
  reviewerId?: string;
  reviewerName?: string;
  reviewRemark?: string;
  reviewedAt?: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  totalAmount: number;
  paidAmount: number;
  paymentStatus: 'unpaid' | 'partial' | 'paid';
  createdAt: string;
  updatedAt: string;
  followUps?: FollowUpRecord[];
  qualityScore?: QualityScore;
  riskPoints?: RiskPoint[];
  ruleViolations?: RuleViolation[];
}

export interface FollowUpRecord {
  id: string;
  recordId: string;
  customerId: string;
  followUpDate: string;
  type: 'phone' | 'wechat' | 'visit' | 'other';
  content: string;
  customerFeedback: string;
  satisfaction: number;
  operatorId: string;
  operatorName: string;
  nextFollowUpDate?: string;
  hasAbnormality: boolean;
  abnormalityDesc?: string;
  photos?: string[];
}

export interface Report {
  id: string;
  type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  periodStart: string;
  periodEnd: string;
  generatedAt: string;
  generatedBy: string;
  storeId?: string;
  storeName?: string;
  summary: {
    totalRecords: number;
    totalRevenue: number;
    totalCustomers: number;
    newCustomers: number;
    averageOrderValue: number;
    doctorCount: number;
    drugUsageCount: number;
  };
  byProject: {
    projectId: string;
    projectName: string;
    count: number;
    revenue: number;
  }[];
  byDoctor: {
    doctorId: string;
    doctorName: string;
    count: number;
    revenue: number;
    avgScore: number;
  }[];
  byStore?: {
    storeId: string;
    storeName: string;
    count: number;
    revenue: number;
  }[];
  qualityStats: {
    avgScore: number;
    excellentCount: number;
    goodCount: number;
    fairCount: number;
    poorCount: number;
  };
  riskStats: {
    total: number;
    lowCount: number;
    mediumCount: number;
    highCount: number;
    criticalCount: number;
    openCount: number;
    resolvedCount: number;
  };
  drugStats: {
    drugId: string;
    drugName: string;
    totalUsage: number;
    unit: string;
    totalValue: number;
  }[];
  customerSatisfaction: {
    avgSatisfaction: number;
    responseRate: number;
    feedbackCount: number;
  };
}

export interface User {
  id: string;
  username: string;
  password?: string;
  name: string;
  gender: Gender;
  phone: string;
  email?: string;
  avatar?: string;
  role: UserRole;
  storeId?: string;
  storeName?: string;
  department?: string;
  position?: string;
  status: 'active' | 'inactive' | 'locked';
  lastLoginAt?: string;
  lastLoginIp?: string;
  createdAt: string;
  updatedAt: string;
  permissions?: string[];
}
