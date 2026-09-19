import type { RequirementStatus } from '../types'

const STYLES: Record<RequirementStatus, { bg: string; text: string; label: string }> = {
  complete: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Satisfied' },
  'in-progress': { bg: 'bg-amber-100', text: 'text-amber-700', label: 'In Progress' },
  'not-started': { bg: 'bg-rose-100', text: 'text-rose-700', label: 'Not Started' },
}

export default function StatusBadge({ status }: { status: RequirementStatus }) {
  const style = STYLES[status]
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${style.bg} ${style.text}`}
    >
      {style.label}
    </span>
  )
}
