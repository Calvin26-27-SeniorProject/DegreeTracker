import { useMemo, useState } from 'react'
import coreRequirements from './data/coreRequirements.json'
import csMajorRequirements from './data/csMajorRequirements.json'
import sampleStudent from './data/sampleStudent.json'
import RulesetPanel from './components/RulesetPanel'
import { evaluateRuleset } from './lib/ruleEngine'
import type { Ruleset, StudentRecord } from './types'

const student = sampleStudent as StudentRecord
const rulesets = [coreRequirements as Ruleset, csMajorRequirements as Ruleset]

function App() {
  const [activeId, setActiveId] = useState(rulesets[0].id)

  const results = useMemo(() => rulesets.map((ruleset) => evaluateRuleset(student, ruleset)), [])
  const activeResult = results.find((r) => r.ruleset.id === activeId) ?? results[0]

  const overallSatisfied = results.reduce((sum, r) => sum + r.satisfiedCredits, 0)
  const overallRequired = results.reduce((sum, r) => sum + r.requiredCredits, 0)

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
          <h1 className="text-2xl font-bold text-slate-900">DegreeTracker</h1>
          <p className="mt-1 text-sm text-slate-500">
            {student.name} · Student ID {student.studentId} · Catalog year {student.catalogYear}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-6">
            <div>
              <div className="text-3xl font-bold text-slate-900">
                {overallSatisfied}
                <span className="text-lg font-normal text-slate-400"> / {overallRequired} cr</span>
              </div>
              <div className="text-xs text-slate-500">Overall credits satisfied</div>
            </div>
            <div className="flex gap-2">
              {results.map((r) => (
                <span
                  key={r.ruleset.id}
                  className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600"
                >
                  {r.ruleset.programName}: {r.categoryResults.filter((c) => c.status === 'complete').length}/
                  {r.categoryResults.length}
                </span>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <nav className="mb-6 flex gap-2 border-b border-slate-200">
          {results.map((r) => (
            <button
              key={r.ruleset.id}
              type="button"
              onClick={() => setActiveId(r.ruleset.id)}
              className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
                activeId === r.ruleset.id
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {r.ruleset.programName}
            </button>
          ))}
        </nav>

        {activeResult && <RulesetPanel result={activeResult} />}
      </main>
    </div>
  )
}

export default App
