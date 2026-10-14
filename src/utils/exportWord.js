const encoder = new TextEncoder()

function escapeXml(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[character])
}

function crc32(bytes) {
  let crc = 0xffffffff
  for (const byte of bytes) {
    crc ^= byte
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0)
  }
  return (crc ^ 0xffffffff) >>> 0
}

function zipFiles(files) {
  const chunks = []
  const directory = []
  let offset = 0
  const append = bytes => { chunks.push(bytes); offset += bytes.length }
  const header = length => new Uint8Array(length)
  const date = new Date()
  const dosTime = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2)
  const dosDate = ((Math.max(1980, date.getFullYear()) - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate()

  for (const [path, content] of Object.entries(files)) {
    const name = encoder.encode(path)
    const data = encoder.encode(content)
    const checksum = crc32(data)
    const localOffset = offset
    const local = header(30)
    const view = new DataView(local.buffer)
    view.setUint32(0, 0x04034b50, true)
    view.setUint16(4, 20, true)
    view.setUint16(6, 0x0800, true)
    view.setUint16(10, dosTime, true)
    view.setUint16(12, dosDate, true)
    view.setUint32(14, checksum, true)
    view.setUint32(18, data.length, true)
    view.setUint32(22, data.length, true)
    view.setUint16(26, name.length, true)
    append(local)
    append(name)
    append(data)

    const central = header(46)
    const centralView = new DataView(central.buffer)
    centralView.setUint32(0, 0x02014b50, true)
    centralView.setUint16(4, 20, true)
    centralView.setUint16(6, 20, true)
    centralView.setUint16(8, 0x0800, true)
    centralView.setUint16(12, dosTime, true)
    centralView.setUint16(14, dosDate, true)
    centralView.setUint32(16, checksum, true)
    centralView.setUint32(20, data.length, true)
    centralView.setUint32(24, data.length, true)
    centralView.setUint16(28, name.length, true)
    centralView.setUint32(42, localOffset, true)
    directory.push(central, name)
  }

  const directoryOffset = offset
  for (const part of directory) append(part)
  const end = header(22)
  const endView = new DataView(end.buffer)
  endView.setUint32(0, 0x06054b50, true)
  endView.setUint16(8, Object.keys(files).length, true)
  endView.setUint16(10, Object.keys(files).length, true)
  endView.setUint32(12, offset - directoryOffset, true)
  endView.setUint32(16, directoryOffset, true)
  append(end)
  return new Blob(chunks, { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
}

function paragraph(value, { bold = false, size = 22, color = '243248', spaceAfter = 120 } = {}) {
  return `<w:p><w:pPr><w:spacing w:after="${spaceAfter}"/></w:pPr><w:r><w:rPr>${bold ? '<w:b/>' : ''}<w:color w:val="${color}"/><w:sz w:val="${size}"/><w:rFonts w:eastAsia="Microsoft YaHei"/></w:rPr><w:t xml:space="preserve">${escapeXml(value)}</w:t></w:r></w:p>`
}

function documentXml(record, category) {
  const issues = Array.isArray(record.issues) ? record.issues : []
  const sections = [
    paragraph('AI 报告智能审核', { bold: true, size: 36, color: '235FD6', spaceAfter: 180 }),
    paragraph(`${category} · 审核报告`, { bold: true, size: 28, spaceAfter: 260 }),
    paragraph(`报告文件：${record.name}`),
    paragraph(`提交机构：${record.organization || '—'}`),
    paragraph(`审核时间：${record.reviewedAt || record.time || '—'}`),
    paragraph(`审核范围：${record.reviewScopeLabel || '全部'}`),
    paragraph(`问题数量：${issues.length} 项`, { spaceAfter: 260 }),
    paragraph('审核说明', { bold: true, size: 27, color: '235FD6' }),
    paragraph(record.reviewNote || '请结合鉴定报告及配套资料复核以下问题。', { spaceAfter: 240 }),
    paragraph('问题清单', { bold: true, size: 27, color: '235FD6', spaceAfter: 180 })
  ]
  issues.forEach((issue, index) => {
    sections.push(paragraph(`${String(index + 1).padStart(2, '0')}  ${issue.title || '未命名问题'}`, { bold: true, size: 24, spaceAfter: 100 }))
    sections.push(paragraph(`${issue.level === 'high' ? '重点关注' : '建议复核'} · 第 ${issue.page || 1} 页`, { size: 19, color: '68788F' }))
    sections.push(paragraph(issue.description || '—'))
    sections.push(paragraph(`建议：${issue.suggestion || '—'}`, { color: '235FD6', spaceAfter: 220 }))
  })
  sections.push(paragraph('审核结果请结合原始资料进行人工复核。', { size: 18, color: '8B98AA', spaceAfter: 0 }))
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${sections.join('')}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134"/></w:sectPr></w:body></w:document>`
}

export function createAuditWord(record, category) {
  const blob = zipFiles({
    '[Content_Types].xml': '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>',
    '_rels/.rels': '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
    'word/document.xml': documentXml(record, category)
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = record.name.replace(/\.[^.]+$/i, '').replace(/[\\/:*?"<>|]/g, '_') + '_审核报告.docx'
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
  return blob
}
