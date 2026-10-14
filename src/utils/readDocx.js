// Extract readable paragraphs from a local DOCX without sending the file to a server.
export async function readDocxParagraphs(file) {
  const buffer = await file.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  const view = new DataView(buffer)
  let end = -1
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i--) {
    if (view.getUint32(i, true) === 0x06054b50) { end = i; break }
  }
  if (end < 0) throw new Error('Invalid DOCX archive')
  let entry = view.getUint32(end + 16, true)
  const total = view.getUint16(end + 10, true)
  let documentData = null
  for (let i = 0; i < total; i++) {
    if (view.getUint32(entry, true) !== 0x02014b50) break
    const method = view.getUint16(entry + 10, true)
    const size = view.getUint32(entry + 20, true)
    const nameLength = view.getUint16(entry + 28, true)
    const extraLength = view.getUint16(entry + 30, true)
    const commentLength = view.getUint16(entry + 32, true)
    const name = new TextDecoder().decode(bytes.subarray(entry + 46, entry + 46 + nameLength))
    if (name === 'word/document.xml') {
      const local = view.getUint32(entry + 42, true)
      if (view.getUint32(local, true) !== 0x04034b50) break
      const start = local + 30 + view.getUint16(local + 26, true) + view.getUint16(local + 28, true)
      const content = bytes.slice(start, start + size)
      if (method === 0) documentData = content
      else if (method === 8) {
        const stream = new Blob([content]).stream().pipeThrough(new DecompressionStream('deflate-raw'))
        documentData = new Uint8Array(await new Response(stream).arrayBuffer())
      }
      break
    }
    entry += 46 + nameLength + extraLength + commentLength
  }
  if (!documentData) throw new Error('DOCX document body not found')
  const xml = new DOMParser().parseFromString(new TextDecoder().decode(documentData), 'application/xml')
  if (xml.querySelector('parsererror')) throw new Error('Invalid DOCX content')
  return [...xml.getElementsByTagNameNS('*', 'p')]
    .map(paragraph => [...paragraph.getElementsByTagNameNS('*', 't')].map(node => node.textContent).join('').trim())
    .filter(Boolean)
}
