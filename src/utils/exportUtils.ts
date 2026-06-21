import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

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

function getDateSuffix(): string {
  return new Date().toISOString().slice(0, 10).replace(/-/g, '')
}

function isHighlightRisk(value: any, title: string): boolean {
  if (title.includes('风险') && typeof value === 'number' && value > 0) return true
  return false
}

function isDangerRate(value: any, title: string): boolean {
  if (title.includes('率') && typeof value === 'number' && value < 80) return true
  return false
}

function isSuccessRate(value: any, title: string): boolean {
  if (title.includes('率') && typeof value === 'number' && value >= 90) return true
  return false
}

function generateExcelFile(config: ExportConfig): ExportResult {
  const { name, data, category, columns } = config
  const wb = XLSX.utils.book_new()

  const summaryData = [
    ['报表名称', name],
    ['报表类别', category],
    ['生成时间', new Date().toLocaleString('zh-CN')],
    ['生成平台', '连锁医美机构质控管理平台'],
  ]
  const summaryWs = XLSX.utils.aoa_to_sheet(summaryData)

  summaryWs['!cols'] = [{ wch: 15 }, { wch: 40 }]

  XLSX.utils.book_append_sheet(wb, summaryWs, '汇总')

  const tables: { title: string; data: any[]; columns?: { key: string; title: string }[] }[] = []

  if (Array.isArray(data)) {
    tables.push({ title: '数据', data, columns })
  } else if (data.tables && Array.isArray(data.tables)) {
    tables.push(...data.tables)
  } else if (data && typeof data === 'object') {
    tables.push({ title: '数据', data: [data], columns })
  }

  tables.forEach((table, tableIndex) => {
    if (!table.data || table.data.length === 0) return

    const cols = table.columns ||
      (table.data.length > 0 ? Object.keys(table.data[0]).map(k => ({ key: k, title: k })) : [])

    if (cols.length === 0) return

    const headers = cols.map(c => c.title)
    const rows = table.data.map((row: any) =>
      cols.map(c => {
        const val = row[c.key]
        return val === null || val === undefined ? '' : val
      })
    )

    const wsData = [headers, ...rows]
    const ws = XLSX.utils.aoa_to_sheet(wsData)

    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1')
    const colWidths = cols.map(() => ({ wch: 15 }))
    ws['!cols'] = colWidths

    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C })
      if (!ws[cellAddress]) continue
      ws[cellAddress].s = {
        font: { bold: true, color: { rgb: '1E40AF' } },
        fill: { fgColor: { rgb: 'EFF6FF' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: {
          top: { style: 'thin', color: { rgb: 'BFDBFE' } },
          bottom: { style: 'thin', color: { rgb: 'BFDBFE' } },
          left: { style: 'thin', color: { rgb: 'BFDBFE' } },
          right: { style: 'thin', color: { rgb: 'BFDBFE' } },
        },
      }
    }

    for (let R = range.s.r + 1; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C })
        if (!ws[cellAddress]) continue
        const colTitle = cols[C]?.title || ''
        const cellValue = ws[cellAddress].v

        let cellStyle: any = {
          alignment: { vertical: 'center' },
          border: {
            top: { style: 'thin', color: { rgb: 'E2E8F0' } },
            bottom: { style: 'thin', color: { rgb: 'E2E8F0' } },
            left: { style: 'thin', color: { rgb: 'E2E8F0' } },
            right: { style: 'thin', color: { rgb: 'E2E8F0' } },
          },
        }

        if (isDangerRate(cellValue, colTitle)) {
          cellStyle.font = { color: { rgb: 'DC2626' }, bold: true }
        } else if (isSuccessRate(cellValue, colTitle)) {
          cellStyle.font = { color: { rgb: '059669' }, bold: true }
        }

        if (isHighlightRisk(cellValue, colTitle)) {
          cellStyle.fill = { fgColor: { rgb: 'FEF3C7' } }
        }

        if (R % 2 === 0 && !cellStyle.fill) {
          cellStyle.fill = { fgColor: { rgb: 'F8FAFC' } }
        }

        ws[cellAddress].s = cellStyle
      }
    }

    const sheetName = table.title.length > 31 ? table.title.slice(0, 31) : table.title || `Sheet${tableIndex + 1}`
    let finalSheetName = sheetName
    let counter = 1
    while (wb.SheetNames.includes(finalSheetName)) {
      const suffix = `_${counter}`
      finalSheetName = sheetName.slice(0, 31 - suffix.length) + suffix
      counter++
    }
    XLSX.utils.book_append_sheet(wb, ws, finalSheetName)
  })

  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array', cellStyles: true })
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })

  const fileName = `${name}_${getDateSuffix()}.xlsx`

  return {
    success: true,
    fileName,
    fileSize: blob.size,
    fileSizeFormatted: formatFileSize(blob.size),
    blob,
  }
}

function buildReportHtml(config: ExportConfig): string {
  const { name, data, category, columns } = config
  const generatedAt = new Date().toLocaleString('zh-CN')

  let html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>${name}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Microsoft YaHei', 'SimHei', 'PingFang SC', 'Hiragino Sans GB', sans-serif;
    width: 794px;
    padding: 40px;
    color: #1e293b;
    background: #ffffff;
  }
  .header {
    text-align: center;
    margin-bottom: 30px;
    border-bottom: 3px solid #3b82f6;
    padding-bottom: 20px;
  }
  .header h1 {
    font-size: 28px;
    color: #1e40af;
    margin-bottom: 12px;
    font-weight: bold;
  }
  .header .meta {
    font-size: 13px;
    color: #64748b;
    line-height: 1.8;
  }
  .section {
    margin-bottom: 28px;
  }
  .section-title {
    font-size: 17px;
    font-weight: bold;
    color: #1e40af;
    margin-bottom: 14px;
    border-left: 5px solid #3b82f6;
    padding-left: 12px;
  }
  .summary {
    display: flex;
    gap: 16px;
    margin-bottom: 28px;
    flex-wrap: wrap;
  }
  .summary-card {
    flex: 1;
    min-width: 160px;
    background: linear-gradient(135deg, #eff6ff 0%, #fdf2f8 100%);
    padding: 18px;
    border-radius: 10px;
    border: 1px solid #bfdbfe;
  }
  .summary-card .label {
    font-size: 13px;
    color: #64748b;
    margin-bottom: 8px;
  }
  .summary-card .value {
    font-size: 26px;
    font-weight: bold;
    color: #1e40af;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 16px;
    table-layout: fixed;
  }
  th {
    background: #eff6ff;
    color: #1e40af;
    padding: 10px 12px;
    text-align: left;
    font-size: 13px;
    font-weight: bold;
    border: 1px solid #bfdbfe;
  }
  td {
    padding: 9px 12px;
    font-size: 12px;
    border: 1px solid #e2e8f0;
    color: #334155;
    word-wrap: break-word;
  }
  tr:nth-child(even) td {
    background: #f8fafc;
  }
  .footer {
    text-align: center;
    font-size: 11px;
    color: #94a3b8;
    margin-top: 40px;
    padding-top: 16px;
    border-top: 1px solid #e2e8f0;
  }
  .highlight {
    background: #fef3c7 !important;
  }
  .danger {
    color: #dc2626 !important;
    font-weight: bold;
  }
  .success {
    color: #059669 !important;
    font-weight: bold;
  }
</style>
</head>
<body>
  <div class="header">
    <h1>${name}</h1>
    <div class="meta">
      报表类别：${category} &nbsp;|&nbsp;
      生成时间：${generatedAt} &nbsp;|&nbsp;
      连锁医美机构质控管理平台
    </div>
  </div>
`

  if (data.summary && Array.isArray(data.summary)) {
    html += '<div class="summary">'
    data.summary.forEach((item: { label: string; value: string }) => {
      html += `
        <div class="summary-card">
          <div class="label">${item.label}</div>
          <div class="value">${item.value}</div>
        </div>
      `
    })
    html += '</div>'
  }

  if (data.tables && Array.isArray(data.tables)) {
    data.tables.forEach((table: { title: string; data: any[]; columns?: { key: string; title: string }[] }) => {
      if (!table.data || table.data.length === 0) return

      const cols = table.columns ||
        (table.data.length > 0 ? Object.keys(table.data[0]).map(k => ({ key: k, title: k })) : [])

      if (cols.length === 0) return

      html += `
        <div class="section">
          <div class="section-title">${table.title}</div>
          <table>
            <thead>
              <tr>
                ${cols.map(c => `<th>${c.title}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${table.data.map((row: any) => `
                <tr>
                  ${cols.map(c => {
                    const val = row[c.key]
                    let cellClass = ''
                    if (typeof val === 'number') {
                      if (c.title.includes('率') && val < 80) cellClass = 'danger'
                      if (c.title.includes('率') && val >= 90) cellClass = 'success'
                    }
                    if (c.title.includes('风险') && typeof val === 'number' && val > 0) cellClass = 'highlight'
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

  if (Array.isArray(data) && data.length > 0) {
    const cols: { key: string; title: string }[] = columns || (data.length > 0 ? Object.keys(data[0]).map(k => ({ key: k, title: k })) : [])
    html += `
      <div class="section">
        <div class="section-title">数据明细</div>
        <table>
          <thead>
            <tr>
              ${cols.map((c: { key: string; title: string }) => `<th>${c.title}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${data.map((row: any) => `
              <tr>
                ${cols.map((c: { key: string; title: string }) => {
                  const val = row[c.key]
                  return `<td>${val ?? '-'}</td>`
                }).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `
  }

  html += `
  <div class="footer">
    本报表由连锁医美机构质控管理平台自动生成 | 数据截止时间：${generatedAt}
  </div>
</body>
</html>`

  return html
}

async function htmlToPdfBlob(html: string): Promise<Blob> {
  const container = document.createElement('div')
  container.style.position = 'fixed'
  container.style.left = '-10000px'
  container.style.top = '0'
  container.style.zIndex = '-1'
  container.innerHTML = html
  document.body.appendChild(container)

  try {
    const renderTarget = container.querySelector('body') || container

    const canvas = await html2canvas(renderTarget as HTMLElement, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    })

    const imgWidth = 210
    const pageHeight = 297
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    })

    let heightLeft = imgHeight
    let position = 0

    const imgData = canvas.toDataURL('image/png')

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight

    while (heightLeft > 0) {
      position = heightLeft - imgHeight
      pdf.addPage()
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
    }

    return pdf.output('blob')
  } finally {
    document.body.removeChild(container)
  }
}

async function generatePDFFile(config: ExportConfig): Promise<ExportResult> {
  const html = buildReportHtml(config)
  const blob = await htmlToPdfBlob(html)
  const fileName = `${config.name}_${getDateSuffix()}.pdf`

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
  if (config.type === 'excel') {
    return generateExcelFile(config)
  } else {
    return generatePDFFile(config)
  }
}
