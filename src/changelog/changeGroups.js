import { changeTypeOrder } from './changelogData.js'

// One group per known type, in display order. Unknown types count as "changed"
// (as getChangeTypeMeta does); empty groups are dropped.
export function groupChanges(changes) {
  const list = Array.isArray(changes) ? changes : []
  return changeTypeOrder
    .map((type) => ({
      type,
      items: list
        .filter((group) => (changeTypeOrder.includes(group?.type) ? group.type : 'changed') === type)
        .flatMap((group) => (Array.isArray(group.items) ? group.items : [])),
    }))
    .filter((group) => group.items.length > 0)
}

// dateValue is stored as YYYY-MM-DD; anything else falls into one "Undated" bucket.
export function monthOf(dateValue) {
  const match = /^(\d{4})-(\d{2})-\d{2}/.exec(String(dateValue || ''))
  if (!match) return { key: '', label: 'Undated' }
  const label = new Date(Number(match[1]), Number(match[2]) - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  return { key: `${match[1]}-${match[2]}`, label }
}

export const isIsoDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))
