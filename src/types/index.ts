/**
 * Core data schemas for DegreeTracker.
 *
 * These types are intentionally flexible so the same shapes can describe
 * Core/Gen-Ed, major, and minor requirements across different catalog years,
 * and can represent both native and transfer coursework.
 */

/** Where a completed course record originated from. */
export type CourseSource = 'completed' | 'transfer' | 'in-progress' | 'planned'

/** A single course a student has taken, is taking, or has planned. */
export interface Course {
  /** Unique identifier for this course record (not the course code). */
  id: string
  /** Course code as it appears on the transcript, e.g. "CS-104". */
  code: string
  title: string
  credits: number
  /** Term the course was/ is being taken, e.g. "Fall 2024". */
  term?: string
  grade?: string
  source: CourseSource
  /** Institution the credit came from (useful for transfer credit). */
  institution?: string
  /**
   * Alternate/equivalent course codes this record can satisfy, used when a
   * transfer course or an older catalog course code maps onto a current one.
   */
  equivalentCodes?: string[]
}

/**
 * Describes which courses can satisfy part of a requirement. Codes are
 * matched case-insensitively and a course also matches if any of its
 * `equivalentCodes` are listed here — this is what lets a course taken under
 * an older catalog year (with a different code) still count today, and lets
 * transfer courses be mapped onto an equivalent home institution course.
 */
export interface CourseMatcher {
  /** Any of these course codes counts as a match. */
  codes: string[]
  /** If false, transfer credit is not accepted for this matcher. Defaults to true. */
  transferAllowed?: boolean
  /** Minimum letter grade required (e.g. "C"), if any. */
  minGrade?: string
}

/** A rule expresses one way a category's requirement can be fulfilled. */
export type RequirementRule =
  | {
      type: 'specificCourses'
      description: string
      /** All matchers must be satisfied by at least one course each. */
      matchers: CourseMatcher[]
    }
  | {
      type: 'chooseN'
      description: string
      /** Number of distinct matchers that must be satisfied. */
      minCourses: number
      matchers: CourseMatcher[]
    }
  | {
      type: 'creditThreshold'
      description: string
      /** Total credits (summed across matching courses) required. */
      minCredits: number
      matchers: CourseMatcher[]
    }

/** A single graduation requirement grouping, e.g. "Mathematics" or "Fine Arts". */
export interface RequirementCategory {
  id: string
  name: string
  description?: string
  /** Optional overall credit minimum for the whole category. */
  minCredits?: number
  rules: RequirementRule[]
}

export type ProgramType = 'core' | 'major' | 'minor'

/** A full set of requirements for one program in one catalog year. */
export interface Ruleset {
  id: string
  programName: string
  programType: ProgramType
  /** Catalog year this ruleset applies to, e.g. "2023-2024". */
  catalogYear: string
  totalCreditsRequired?: number
  categories: RequirementCategory[]
}

/** A student's academic record used to evaluate rulesets against. */
export interface StudentRecord {
  studentId: string
  name: string
  /** Catalog year the student is held to, e.g. "2023-2024". */
  catalogYear: string
  courses: Course[]
}

// ---------------------------------------------------------------------------
// Evaluation results
// ---------------------------------------------------------------------------

export type RequirementStatus = 'complete' | 'in-progress' | 'not-started'

export interface RuleResult {
  rule: RequirementRule
  status: RequirementStatus
  satisfiedCredits: number
  requiredCredits: number
  /** Courses the student has that count toward this rule. */
  matchedCourses: Course[]
  /** Human-readable remaining work, e.g. "Choose 1 more from: ART-101, MUS-101". */
  remainingDescription?: string
}

export interface CategoryResult {
  category: RequirementCategory
  status: RequirementStatus
  satisfiedCredits: number
  requiredCredits: number
  ruleResults: RuleResult[]
}

export interface RulesetResult {
  ruleset: Ruleset
  status: RequirementStatus
  satisfiedCredits: number
  requiredCredits: number
  categoryResults: CategoryResult[]
}
