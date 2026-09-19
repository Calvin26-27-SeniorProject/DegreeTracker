import type {
  CategoryResult,
  Course,
  CourseMatcher,
  RequirementCategory,
  RequirementRule,
  RequirementStatus,
  RuleResult,
  Ruleset,
  RulesetResult,
  StudentRecord,
} from '../types'

const GRADE_VALUES: Record<string, number> = {
  'A+': 4.3,
  A: 4.0,
  'A-': 3.7,
  'B+': 3.3,
  B: 3.0,
  'B-': 2.7,
  'C+': 2.3,
  C: 2.0,
  'C-': 1.7,
  'D+': 1.3,
  D: 1.0,
  'D-': 0.7,
  F: 0.0,
}

function normalizeCode(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, '')
}

function meetsMinGrade(course: Course, minGrade?: string): boolean {
  if (!minGrade) return true
  if (!course.grade) return true // no grade info (e.g. in-progress) — don't block
  const earned = GRADE_VALUES[course.grade.toUpperCase()]
  const required = GRADE_VALUES[minGrade.toUpperCase()]
  if (earned === undefined || required === undefined) return true
  return earned >= required
}

/** Returns true if `course` satisfies the given matcher. */
export function courseMatches(course: Course, matcher: CourseMatcher): boolean {
  if (course.source === 'transfer' && matcher.transferAllowed === false) return false

  const acceptedCodes = new Set(matcher.codes.map(normalizeCode))
  const courseCodes = [course.code, ...(course.equivalentCodes ?? [])].map(normalizeCode)
  const codeMatches = courseCodes.some((code) => acceptedCodes.has(code))
  if (!codeMatches) return false

  return meetsMinGrade(course, matcher.minGrade)
}

/** All of the student's courses that match a given matcher, most-credit-first. */
function findMatches(courses: Course[], matcher: CourseMatcher): Course[] {
  return courses.filter((course) => courseMatches(course, matcher))
}

function describeMatcher(matcher: CourseMatcher): string {
  return matcher.codes.join('/')
}

function evaluateRule(rule: RequirementRule, courses: Course[]): RuleResult {
  switch (rule.type) {
    case 'specificCourses': {
      const matchedCourses: Course[] = []
      const missing: string[] = []
      for (const matcher of rule.matchers) {
        const matches = findMatches(courses, matcher)
        if (matches.length > 0) {
          matchedCourses.push(matches[0])
        } else {
          missing.push(describeMatcher(matcher))
        }
      }
      const satisfiedCredits = matchedCourses.reduce((sum, c) => sum + c.credits, 0)
      const status: RequirementStatus =
        missing.length === 0 ? 'complete' : matchedCourses.length > 0 ? 'in-progress' : 'not-started'
      return {
        rule,
        status,
        satisfiedCredits,
        requiredCredits: rule.matchers.length,
        matchedCourses,
        remainingDescription:
          missing.length > 0 ? `Still need: ${missing.join(', ')}` : undefined,
      }
    }

    case 'chooseN': {
      const matchedCourses: Course[] = []
      const satisfiedMatcherIndexes = new Set<number>()
      rule.matchers.forEach((matcher, index) => {
        const matches = findMatches(courses, matcher)
        if (matches.length > 0) {
          matchedCourses.push(matches[0])
          satisfiedMatcherIndexes.add(index)
        }
      })
      const satisfiedCount = satisfiedMatcherIndexes.size
      const satisfiedCredits = matchedCourses.reduce((sum, c) => sum + c.credits, 0)
      const remainingMatchers = rule.matchers.filter((_, i) => !satisfiedMatcherIndexes.has(i))
      const stillNeeded = Math.max(rule.minCourses - satisfiedCount, 0)
      const status: RequirementStatus =
        stillNeeded === 0 ? 'complete' : satisfiedCount > 0 ? 'in-progress' : 'not-started'
      return {
        rule,
        status,
        satisfiedCredits,
        requiredCredits: rule.minCourses,
        matchedCourses,
        remainingDescription:
          stillNeeded > 0
            ? `Choose ${stillNeeded} more from: ${remainingMatchers.map(describeMatcher).join(', ')}`
            : undefined,
      }
    }

    case 'creditThreshold': {
      const matchedCourses: Course[] = []
      let satisfiedCredits = 0
      for (const matcher of rule.matchers) {
        const matches = findMatches(courses, matcher)
        for (const match of matches) {
          if (!matchedCourses.includes(match)) {
            matchedCourses.push(match)
            satisfiedCredits += match.credits
          }
        }
      }
      const status: RequirementStatus =
        satisfiedCredits >= rule.minCredits
          ? 'complete'
          : satisfiedCredits > 0
            ? 'in-progress'
            : 'not-started'
      return {
        rule,
        status,
        satisfiedCredits,
        requiredCredits: rule.minCredits,
        matchedCourses,
        remainingDescription:
          status !== 'complete'
            ? `${Math.max(rule.minCredits - satisfiedCredits, 0)} more credit(s) needed from: ${rule.matchers
                .map(describeMatcher)
                .join(', ')}`
            : undefined,
      }
    }
  }
}

function combineStatus(statuses: RequirementStatus[]): RequirementStatus {
  if (statuses.length === 0) return 'complete'
  if (statuses.every((s) => s === 'complete')) return 'complete'
  if (statuses.some((s) => s === 'complete' || s === 'in-progress')) return 'in-progress'
  return 'not-started'
}

export function evaluateCategory(category: RequirementCategory, courses: Course[]): CategoryResult {
  const ruleResults = category.rules.map((rule) => evaluateRule(rule, courses))
  const satisfiedCredits = ruleResults.reduce((sum, r) => sum + r.satisfiedCredits, 0)
  const requiredCredits = category.minCredits ?? ruleResults.reduce((sum, r) => sum + r.requiredCredits, 0)
  const status = combineStatus(ruleResults.map((r) => r.status))
  return { category, status, satisfiedCredits, requiredCredits, ruleResults }
}

/**
 * Evaluates a student's coursework against a ruleset (Core/major/minor),
 * returning per-category and per-rule satisfied/remaining detail.
 *
 * The student's `catalogYear` does not need to match `ruleset.catalogYear`
 * exactly — course matching is driven entirely by course codes and their
 * `equivalentCodes`, so a returning student under an older catalog can still
 * be evaluated against a newer ruleset (or vice versa) as long as the
 * ruleset's matchers list the historical code as an alias.
 */
export function evaluateRuleset(student: StudentRecord, ruleset: Ruleset): RulesetResult {
  const categoryResults = ruleset.categories.map((category) => evaluateCategory(category, student.courses))
  const satisfiedCredits = categoryResults.reduce((sum, c) => sum + c.satisfiedCredits, 0)
  const requiredCredits =
    ruleset.totalCreditsRequired ?? categoryResults.reduce((sum, c) => sum + c.requiredCredits, 0)
  const status = combineStatus(categoryResults.map((c) => c.status))
  return { ruleset, status, satisfiedCredits, requiredCredits, categoryResults }
}
