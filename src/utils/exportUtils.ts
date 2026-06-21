export interface ExportConfig {
  type: 'excel' | 'pdf'
  name: string
  category: string
  data: any
  columns?: { key: string; title: string }[]
}

export interface ExportResult {
  success: boolean
  fileName: string
  fileSize: number
  fileSizeFormatted: string
  blob: Blob
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

function escapeCSV(value: any): string {
  if (value === null || value === undefined) return ''
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function convertToCSV(data: any[], columns?: { key: string; title: string }[]): string {
  if (data.length === 0) return ''
  
  const keys = columns?.map(c => c.key) || Object.keys(data[0])
  const headers = columns?.map(c => c.title) || keys
  
  const headerRow = headers.map(escapeCSV).join(',')
  const rows = data.map(row =>
    keys.map(key => escapeCSV(row[key])).join(',')
  )
  
  return [headerRow, ...rows].join('\n')
}

function generateExcelFile(config: ExportConfig): ExportResult {
  const { name, data, columns } = config
  
  let csvContent = ''
  csvContent += `\uFEFF`
  
  csvContent += `${name}\n`
  csvContent += `生成时间: ${new Date().toLocaleString('zh-CN')}\n`
  csvContent += `报表类别: ${config.category}\n`
  csvContent += `\n`
  
  if (Array.isArray(data)) {
    csvContent += convertToCSV(data, columns)
  } else if (data.tables) {
    data.tables.forEach((table: { title: string; data: any[]; columns?: { key: string; title: string }[] }) => {
      csvContent += `\n`
      csvContent += `${table.title}\n`
      csvContent += convertToCSV(table.data, table.columns || columns)
      csvContent += `\n`
    })
  } else {
    csvContent += convertToCSV([data])
  }
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const fileName = `${name}_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.csv`
  
  return {
    success: true,
    fileName,
    fileSize: blob.size,
    fileSizeFormatted: formatFileSize(blob.size),
    blob,
  }
}

function generatePDFFile(config: ExportConfig): ExportResult {
  const { name, data, category } = config
  
  let htmlContent = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>${name}</title>
<style>
  body { font-family: 'Microsoft YaHei', 'SimHei', sans-serif; margin: 40px; color: #1e293b; }
  .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #3b82f6; padding-bottom: 20px; }
  .header h1 { font-size: 24px; color: #1e40af; margin: 0 0 10px 0; }
  .header .meta { font-size: 12px; color: #64748b; }
  .section { margin-bottom: 30px; }
  .section-title { font-size: 16px; font-weight: bold; color: #1e40af; margin-bottom: 15px; border-left: 4px solid #3b82f6; padding-left: 10px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  th { background: #eff6ff; color: #1e40af; padding: 10px; text-align: left; font-size: 13px; border: 1px solid #bfdbfe; }
  td { padding: 8px 10px; font-size: 12px; border: 1px solid #e2e8f0; }
  tr:nth-child(even) { background: #f8fafc; }
  .summary { display: flex; gap: 20px; margin-bottom: 30px; }
  .summary-card { flex: 1; background: linear-gradient(135deg, #eff6ff, #fdf2f8); padding: 15px; border-radius: 8px; }
  .summary-card .label { font-size: 12px; color: #64748b; }
  .summary-card .value { font-size: 24px; font-weight: bold; color: #1e40af; }
  .footer { text-align: center; font-size: 11px; color: #94a3b8; margin-top: 50px; padding-top: 20px; border-top: 1px solid #e2e8f0; }
  .highlight { background: #fef3c7 !important; }
  .danger { color: #dc2626 !important; }
  .success { color: #059669 !important; }
</style>
</head>
<body>
  <div class="header">
    <h1>${name}</h1>
    <div class="meta">
      报表类别：${category} | 
      生成时间：${new Date().toLocaleString('zh-CN')} | 
      连锁医美机构质控管理平台
    </div>
  </div>
`

  if (data.summary && Array.isArray(data.summary)) {
    htmlContent += '<div class="summary">'
    data.summary.forEach((item: { label: string; value: string }) => {
      htmlContent += `
        <div class="summary-card">
          <div class="label">${item.label}</div>
          <div class="value">${item.value}</div>
        </div>
      `
    })
    htmlContent += '</div>'
  }

  if (data.tables && Array.isArray(data.tables)) {
    data.tables.forEach((table: { title: string; data: any[]; columns?: { key: string; title: string }[] }) => {
      if (!table.data || table.data.length === 0) return
      
      const columns = table.columns || (table.data.length > 0 ? Object.keys(table.data[0]).map(k => ({ key: k, title: k })) : [])
      
      htmlContent += `
        <div class="section">
          <div class="section-title">${table.title}</div>
          <table>
            <thead>
              <tr>
                ${columns.map(c => `<th>${c.title}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${table.data.map((row: any) => `
                <tr>
                  ${columns.map(c => {
                    let val = row[c.key]
                    let cellClass = ''
                    if (typeof val === 'number' && c.title.includes('率') && val < 80) cellClass = 'danger'
                    if (typeof val === 'number' && c.title.includes('率') && val >= 90) cellClass = 'success'
                    if (c.title.includes('风险') && val > 0) cellClass = 'highlight'
                    return `<td class="${cellClass}">${val ?? '-'}</td>`
                  }).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `
    })
  }

  htmlContent += `
  <div class="footer">
    本报表由医美质控管理平台自动生成 | 数据截止时间：${new Date().toLocaleString('zh-CN')}
  </div>
</body>
</html>`

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' })
  const fileName = `${name}_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.html`
  
  return {
    success: true,
    fileName,
    fileSize: blob.size,
    fileSizeFormatted: formatFileSize(blob.size),
    blob,
  }
}

export function downloadFile(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export async function exportReport(config: ExportConfig): Promise<ExportResult> {
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000))
  
  let result: ExportResult
  
  if (config.type === 'excel') {
    result = generateExcelFile(config)
  } else {
    result = generatePDFFile(config)
  }
  
  return result
}
