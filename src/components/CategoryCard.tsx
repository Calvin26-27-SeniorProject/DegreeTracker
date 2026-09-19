import { useState } from 'react'
import type { CategoryResult } from '../types'
import ProgressBar from './ProgressBar'
import StatusBadge from './StatusBadge'

export default function CategoryCard({ result }: { result: CategoryResult }) {
  const [expanded, setExpanded] = useState(false)
  const { category, status, satisfiedCredits, requiredCredits, ruleResults } = result

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-start justify-between gap-3 text-left"
      >
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-slate-900">{category.name}</h3>
            <StatusBadge status={status} />
          </div>
          {category.description && (
            <p className="mt-0.5 text-sm text-slate-500">{category.description}</p>
          )}
          <div className="mt-3 max-w-xs">
            <ProgressBar satisfied={satisfiedCredits} required={requiredCredits} status={status} />
          </div>
        </div>
        <span className="mt-1 text-slate-400 select-none">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <ul className="mt-4 space-y-3 border-t border-slate-100 pt-3">
          {ruleResults.map((ruleResult, idx) => (
            <li key={idx} className="text-sm">
              <div className="flex items-center gap-2">
                <StatusBadge status={ruleResult.status} />
                <span className="text-slate-700">{ruleResult.rule.description}</span>
              </div>
              {ruleResult.matchedCourses.length > 0 && (
                <p className="mt-1 pl-1 text-slate-500">
                  Completed:{' '}
                  {ruleResult.matchedCourses
                    .map((c) => `${c.code} (${c.credits} cr${c.source === 'transfer' ? ', transfer' : ''})`)
                    .join(', ')}
                </p>
              )}
              {ruleResult.remainingDescription && (
                <p className="mt-1 pl-1 text-rose-600">{ruleResult.remainingDescription}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
