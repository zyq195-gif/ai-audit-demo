function roundRect(ctx, x, y, w, h, r, fill, stroke) {
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
  if (fill) { ctx.fillStyle = fill; ctx.fill() }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.stroke() }
}
function wrappedText(ctx, value, x, y, maxWidth, lineHeight, maxLines = 3) {
  let line = ''
  let count = 0
  for (const char of value) {
    if (ctx.measureText(line + char).width > maxWidth && line) {
      ctx.fillText(line, x, y + count * lineHeight)
      count++
      line = char
      if (count >= maxLines) return y + count * lineHeight
    } else line += char
  }
  if (line) { ctx.fillText(line, x, y + count * lineHeight); count++ }
  return y + count * lineHeight
}
function pdfFromJpeg(jpegBytes, width, height) {
  const encoder = new TextEncoder()
  const chunks = []
  const offsets = [0]
  let length = 0
  const push = (value) => { const bytes = typeof value === 'string' ? encoder.encode(value) : value; chunks.push(bytes); length += bytes.length }
  push(new Uint8Array([37, 80, 68, 70, 45, 49, 46, 52, 10, 37, 226, 227, 207, 211, 10]))
  const object = (number, body) => { offsets[number] = length; push(number + ' 0 obj\n'); push(body); push('\nendobj\n') }
  object(1, '<< /Type /Catalog /Pages 2 0 R >>')
  object(2, '<< /Type /Pages /Kids [3 0 R] /Count 1 >>')
  object(3, '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>')
  offsets[4] = length
  push('4 0 obj\n<< /Type /XObject /Subtype /Image /Width ' + width + ' /Height ' + height + ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + jpegBytes.length + ' >>\nstream\n')
  push(jpegBytes)
  push('\nendstream\nendobj\n')
  const drawing = 'q\n595.28 0 0 841.89 0 0 cm\n/Im0 Do\nQ\n'
  object(5, '<< /Length ' + drawing.length + ' >>\nstream\n' + drawing + 'endstream')
  const startXref = length
  push('xref\n0 6\n0000000000 65535 f \n')
  for (let i = 1; i <= 5; i++) push(String(offsets[i]).padStart(10, '0') + ' 00000 n \n')
  push('trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n' + startXref + '\n%%EOF')
  return new Blob(chunks, { type: 'application/pdf' })
}
export function createAuditPdf(record, category) {
  const canvas = document.createElement('canvas')
  canvas.width = 1240
  canvas.height = 1754
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas unavailable')
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = '#235FD6'
  ctx.fillRect(0, 0, canvas.width, 18)
  ctx.fillStyle = '#243248'
  ctx.font = 'bold 58px "Microsoft YaHei", "Noto Sans CJK SC", sans-serif'
  ctx.fillText('AI 报告智能审核', 86, 152)
  ctx.fillStyle = '#8B98AA'
  ctx.font = '28px "Microsoft YaHei", sans-serif'
  ctx.fillText(category + ' · 审核结果', 88, 207)
  roundRect(ctx, 86, 255, 1068, 178, 26, '#F5F7FB', '#E5EAF2')
  ctx.fillStyle = '#8B98AA'
  ctx.font = '24px "Microsoft YaHei", sans-serif'
  ctx.fillText('报告文件', 118, 308)
  ctx.fillStyle = '#243248'
  ctx.font = 'bold 32px "Microsoft YaHei", sans-serif'
  wrappedText(ctx, record.name, 118, 357, 990, 42, 2)
  ctx.fillStyle = '#8B98AA'
  ctx.font = '23px "Microsoft YaHei", sans-serif'
  ctx.fillText('审核时间：' + record.time + '    ·    问题：' + record.issues.length + ' 项', 118, 403)
  ctx.fillStyle = '#243248'
  ctx.font = 'bold 34px "Microsoft YaHei", sans-serif'
  ctx.fillText('问题清单', 86, 506)
  ctx.fillStyle = '#A9B4C2'
  ctx.font = '22px "Microsoft YaHei", sans-serif'
  ctx.fillText('以下内容请结合原始资料人工复核', 86, 548)
  let y = 588
  record.issues.forEach((issue, index) => {
    roundRect(ctx, 86, y, 1068, 228, 22, '#ffffff', '#EAF0FF')
    roundRect(ctx, 114, y + 26, 112, 39, 18, issue.level === 'high' ? '#EAF0FF' : '#F5F7FB')
    ctx.fillStyle = issue.level === 'high' ? '#235FD6' : '#CB8E9A'
    ctx.font = 'bold 21px "Microsoft YaHei", sans-serif'
    ctx.fillText(issue.level === 'high' ? '重点关注' : '建议复核', 129, y + 53)
    ctx.fillStyle = '#A9B4C2'
    ctx.font = '22px "Microsoft YaHei", sans-serif'
    ctx.fillText('第 ' + issue.page + ' 页', 1020, y + 53)
    ctx.fillStyle = '#243248'
    ctx.font = 'bold 29px "Microsoft YaHei", sans-serif'
    ctx.fillText(String(index + 1).padStart(2, '0') + '  ' + issue.title, 114, y + 104)
    ctx.fillStyle = '#40516B'
    ctx.font = '22px "Microsoft YaHei", sans-serif'
    wrappedText(ctx, issue.description, 114, y + 145, 990, 32, 2)
    ctx.fillStyle = '#235FD6'
    wrappedText(ctx, '建议：' + issue.suggestion, 114, y + 192, 990, 30, 1)
    y += 244
  })
  ctx.fillStyle = '#EAF0FF'
  ctx.fillRect(86, 1623, 1068, 2)
  ctx.fillStyle = '#A9B4C2'
  ctx.font = '21px "Microsoft YaHei", sans-serif'
  ctx.fillText('审核结果请结合原始资料人工复核', 86, 1670)
  ctx.fillText('ReportAudit AI', 980, 1670)
  const dataUrl = canvas.toDataURL('image/jpeg', 0.92)
  const bytes = Uint8Array.from(atob(dataUrl.split(',')[1]), char => char.charCodeAt(0))
  const blob = pdfFromJpeg(bytes, canvas.width, canvas.height)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = record.name.replace(/\.pdf$/i, '').replace(/[\\/:*?"<>|]/g, '_') + '_审核报告.pdf'
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
  return blob
}
