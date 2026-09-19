import type { RequirementStatus } from '../types'

const BAR_COLORS: Record<RequirementStatus, string> = {
  complete: 'bg-emerald-500',
  'in-progress': 'bg-amber-500',
  'not-started': 'bg-rose-400',
}

interface ProgressBarProps {
  satisfied: number
  required: number
  status: RequirementStatus
}

export default function ProgressBar({ satisfied, required, status }: ProgressBarProps) {
  const pct = required > 0 ? Math.min(100, Math.round((satisfied / required) * 100)) : 100
  return (
    <div className="w-full">
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className={`h-full rounded-full transition-all ${BAR_COLORS[status]}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-1 text-xs text-slate-500">
        {satisfied} / {required} credits
      </div>
    </div>
  )
}
