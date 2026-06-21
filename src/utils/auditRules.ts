import type { CustomerRecord, InjectionPoint, ProjectTemplate, RiskPoint, RuleViolation, AuditResult } from '../types'

export type { RuleViolation, AuditResult }

const pointMap = new Map<string, InjectionPoint>()

export function setInjectionPoints(points: InjectionPoint[]) {
  pointMap.clear()
  points.forEach(p => pointMap.set(p.id, p))
}

export function checkDosageRange(record: CustomerRecord, template?: ProjectTemplate): RuleViolation | null {
  const violations: string[] = []
  
  record.injectionPoints.forEach(ip => {
    const point = pointMap.get(ip.pointId)
    if (!point) return
    
    const templatePoint = template?.injectionPoints.find(tp => tp.pointId === ip.pointId)
    const minDosage = templatePoint ? templatePoint.recommendedDosage * 0.7 : point.minDosage
    const maxDosage = templatePoint ? templatePoint.recommendedDosage * 1.3 : point.maxDosage
    
    if (ip.actualDosage < minDosage || ip.actualDosage > maxDosage) {
      violations.push(`${ip.pointName}: ${ip.actualDosage}${ip.unit} (建议范围 ${minDosage}-${maxDosage}${ip.unit})`)
    }
  })
  
  if (violations.length > 0) {
    return {
      ruleId: 'dosage_range',
      ruleName: '剂量超出建议范围',
      severity: 'high',
      description: '部分点位注射剂量与建议范围偏差超过30%',
      evidence: violations.join('；'),
    }
  }
  return null
}

export function checkLeftRightBalance(record: CustomerRecord): RuleViolation | null {
  const leftPoints: Record<string, number> = {}
  const rightPoints: Record<string, number> = {}
  
  record.injectionPoints.forEach(ip => {
    const name = ip.pointName
    if (name.includes('左')) {
      const baseName = name.replace(/左/, '')
      leftPoints[baseName] = (leftPoints[baseName] || 0) + ip.actualDosage
    } else if (name.includes('右')) {
      const baseName = name.replace(/右/, '')
      rightPoints[baseName] = (rightPoints[baseName] || 0) + ip.actualDosage
    }
  })
  
  const imbalances: string[] = []
  const allBaseNames = new Set([...Object.keys(leftPoints), ...Object.keys(rightPoints)])
  
  allBaseNames.forEach(baseName => {
    const left = leftPoints[baseName] || 0
    const right = rightPoints[baseName] || 0
    const maxVal = Math.max(left, right)
    const minVal = Math.min(left, right)
    
    if (maxVal > 0 && (maxVal - minVal) / maxVal > 0.3) {
      imbalances.push(`${baseName}：左侧${left}${record.injectionPoints[0]?.unit || 'U'} vs 右侧${right}${record.injectionPoints[0]?.unit || 'U'}，偏差${Math.round((maxVal - minVal) / maxVal * 100)}%`)
    }
  })
  
  if (imbalances.length > 0) {
    return {
      ruleId: 'left_right_balance',
      ruleName: '左右侧剂量明显不均',
      severity: 'medium',
      description: '双侧对称点位注射剂量差异超过30%',
      evidence: imbalances.join('；'),
    }
  }
  return null
}

export function checkPreOpPhotos(record: CustomerRecord): RuleViolation | null {
  if (!record.beforePhotos || record.beforePhotos.length === 0) {
    return {
      ruleId: 'pre_op_photos',
      ruleName: '术前照片缺失',
      severity: 'high',
      description: '未上传术前照片，不符合操作规范',
      evidence: '术前照片数量为0',
    }
  }
  
  const requiredAngles = ['正位', '侧位45°', '侧位90°']
  const missingAngles: string[] = []
  
  requiredAngles.forEach(angle => {
    const hasAngle = record.beforePhotos?.some(p => p.includes(angle))
    if (!hasAngle) missingAngles.push(angle)
  })
  
  if (missingAngles.length > 0) {
    return {
      ruleId: 'pre_op_photos_incomplete',
      ruleName: '术前拍照角度不全',
      severity: 'medium',
      description: `缺少必要拍照角度：${missingAngles.join('、')}`,
      evidence: `当前有${record.beforePhotos?.length || 0}张照片，缺少${missingAngles.length}个角度`,
    }
  }
  
  return null
}

export function checkDrugBatchNo(record: CustomerRecord): RuleViolation | null {
  const missingBatches: string[] = []
  
  record.drugs.forEach(drug => {
    if (!drug.batchNo || drug.batchNo.trim() === '') {
      missingBatches.push(drug.drugName)
    }
  })
  
  if (missingBatches.length > 0) {
    return {
      ruleId: 'batch_no_missing',
      ruleName: '药品批号未填写',
      severity: 'high',
      description: '部分使用药品未填写生产批号，无法追溯',
      evidence: `缺失批号药品：${missingBatches.join('、')}`,
    }
  }
  return null
}

export function checkRecordCompleteness(record: CustomerRecord): RuleViolation[] {
  const violations: RuleViolation[] = []
  
  if (!record.preOpAssessment || record.preOpAssessment.trim().length < 10) {
    violations.push({
      ruleId: 'pre_op_assessment',
      ruleName: '术前评估不完整',
      severity: 'medium',
      description: '术前评估记录过于简略，应包含过敏史、禁忌症、预期效果沟通等',
      evidence: `当前评估仅${record.preOpAssessment?.length || 0}字`,
    })
  }
  
  if (!record.postOpNotes || record.postOpNotes.trim().length < 10) {
    violations.push({
      ruleId: 'post_op_notes',
      ruleName: '术后交代未填写',
      severity: 'medium',
      description: '术后注意事项、恢复指导等交代内容未填写',
      evidence: `术后记录${record.postOpNotes?.length || 0}字`,
    })
  }
  
  if (!record.doctorSignature) {
    violations.push({
      ruleId: 'doctor_signature',
      ruleName: '医生签名缺失',
      severity: 'low',
      description: '记录未完成医生电子签名确认',
    })
  }
  
  return violations
}

export function runAuditRules(
  record: CustomerRecord,
  template?: ProjectTemplate,
  injectionPoints?: InjectionPoint[]
): AuditResult {
  if (injectionPoints) setInjectionPoints(injectionPoints)
  
  const violations: RuleViolation[] = []
  
  const dosageCheck = checkDosageRange(record, template)
  if (dosageCheck) violations.push(dosageCheck)
  
  const balanceCheck = checkLeftRightBalance(record)
  if (balanceCheck) violations.push(balanceCheck)
  
  const photoCheck = checkPreOpPhotos(record)
  if (photoCheck) violations.push(photoCheck)
  
  const batchCheck = checkDrugBatchNo(record)
  if (batchCheck) violations.push(batchCheck)
  
  violations.push(...checkRecordCompleteness(record))
  
  const riskPoints: RiskPoint[] = violations.map((v, idx) => ({
    id: `rp_${record.id}_${idx}`,
    recordId: record.id,
    level: v.severity,
    category: v.ruleName,
    description: v.description + (v.evidence ? `\n证据：${v.evidence}` : ''),
    identifiedAt: new Date().toISOString(),
    identifiedBy: '系统自动检测',
    status: 'open',
  }))
  
  return {
    needsReview: violations.length > 0,
    violations,
    riskPoints,
  }
}

export function batchProcessRecords(
  records: CustomerRecord[],
  templates: ProjectTemplate[],
  injectionPoints: InjectionPoint[]
): { record: CustomerRecord; auditResult: AuditResult }[] {
  setInjectionPoints(injectionPoints)
  
  return records.map(record => {
    const template = templates.find(t => t.id === record.projectId)
    const auditResult = runAuditRules(record, template)
    
    const updatedRecord: CustomerRecord = {
      ...record,
      status: auditResult.needsReview ? 'pending' : (record.status === 'pending' ? 'confirmed' : record.status),
      riskPoints: auditResult.riskPoints,
    }
    
    return { record: updatedRecord, auditResult }
  })
}
