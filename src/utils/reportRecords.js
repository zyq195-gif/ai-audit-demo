export function reportSearchText(record) {
  const files = ['report', 'calculation', 'original'].flatMap(type => {
    const value = record.attachments?.[type]
    return Array.isArray(value) ? value : value ? [value] : []
  })
  const issues = record.issues?.length ? record.issues : record.versions?.at(-1)?.issues || []
  return [record.id, record.name, record.organization, record.time, record.reviewedAt,
    record.issuedAt, record.reviewReportName, record.reviewScope, ...files,
    ...issues.flatMap(issue => [issue.title, issue.description, issue.suggestion])]
    .filter(Boolean).join(' ').toLocaleLowerCase()
}

export function reportStatusClass(record) {
  if (record.status === 'issued' && record.deliveryOutcome === 'revise') return 'audit-returned'
  if (record.source !== 'organization' || record.status === 'completed' || record.status === 'issued') return 'audit-issued'
  if (record.status === 'reviewed') return 'audit-reviewed'
  if (record.status === 'reviewing') return 'audit-reviewing'
  if (record.status === 'pending') return 'audit-pending'
  return ''
}

export function reportStatusRank(record) {
  if (record.source !== 'organization') return 3
  if (record.status === 'pending') return 0
  if (record.status === 'reviewing') return 1
  if (record.status === 'reviewed') return 2
  if (record.status === 'issued') return 3
  if (record.status === 'completed') return 4
  return 5
}
