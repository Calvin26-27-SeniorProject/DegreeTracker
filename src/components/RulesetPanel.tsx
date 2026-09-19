import type { RulesetResult } from '../types'
import CategoryCard from './CategoryCard'
import ProgressBar from './ProgressBar'
import StatusBadge from './StatusBadge'

export default function RulesetPanel({ result }: { result: RulesetResult }) {
  const { ruleset, status, satisfiedCredits, requiredCredits, categoryResults } = result
  const completeCount = categoryResults.filter((c) => c.status === 'complete').length

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">{ruleset.programName}</h2>
          <p className="text-sm text-slate-500">
            Catalog year {ruleset.catalogYear} · {completeCount}/{categoryResults.length} categories satisfied
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-48">
            <ProgressBar satisfied={satisfiedCredits} required={requiredCredits} status={status} />
          </div>
          <StatusBadge status={status} />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {categoryResults.map((categoryResult) => (
          <CategoryCard key={categoryResult.category.id} result={categoryResult} />
        ))}
      </div>
    </section>
  )
}
