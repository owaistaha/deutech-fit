export const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const
export type CefrLevel = (typeof CEFR_LEVELS)[number]

/** What the job requires. "NONE" = no German needed (not in the original spec, but
 *  without it the model is forced to invent an "A1" for English-only jobs). */
export const JOB_GERMAN_LEVELS = ["NONE", ...CEFR_LEVELS] as const
export type JobGermanLevel = (typeof JOB_GERMAN_LEVELS)[number]

/** What the user speaks. */
export const USER_GERMAN_LEVELS = ["NONE", ...CEFR_LEVELS, "NATIVE"] as const
export type UserGermanLevel = (typeof USER_GERMAN_LEVELS)[number]

export const VISA_TYPES = [
  { id: "student_16b", label: "Student (§ 16b AufenthG)" },
  { id: "language_course_16f", label: "Language course (§ 16f AufenthG)" },
  { id: "job_seeker_20", label: "Job seeker / post-study (§ 20 AufenthG)" },
  { id: "chancenkarte_20a", label: "Opportunity Card / Chancenkarte (§ 20a)" },
  { id: "skilled_worker_18ab", label: "Skilled worker (§ 18a / § 18b)" },
  { id: "blue_card_18g", label: "EU Blue Card (§ 18g)" },
  { id: "permanent_residence", label: "Permanent residence (Niederlassungserlaubnis)" },
  { id: "eu_citizen", label: "EU/EEA/Swiss citizen (no visa needed)" },
  { id: "outside_germany", label: "Not in Germany yet / no permit" }
] as const
export type VisaTypeId = (typeof VISA_TYPES)[number]["id"]

export const visaLabel = (id: string) =>
  VISA_TYPES.find((v) => v.id === id)?.label ?? id

export type JobSite = "linkedin" | "stepstone" | "unknown"

export interface JobPosting {
  site: JobSite
  url: string
  title: string
  company: string
  location: string
  description: string
}

export interface UserProfile {
  germanLevel: UserGermanLevel
  visaType: VisaTypeId
  targetRole: string
  resumeText: string
}

export type VisaFitStatus = "HIGH" | "MEDIUM" | "LOW"

/** The JSON contract Gemini must return. */
export interface FitAnalysis {
  hidden_german_level: JobGermanLevel
  hidden_german_explanation: string
  visa_fit_status: VisaFitStatus
  visa_notes: string
  werkstudent_equivalent: boolean
  title_recommendation: string
  missing_german_keywords: string[]
}

export interface StoredAnalysis {
  job: Omit<JobPosting, "description">
  analysis: FitAnalysis
  analyzedAt: number
  model: string
  profile: Pick<UserProfile, "germanLevel" | "visaType">
}

/** Ordering helper so we can compare "job needs B2" vs "user has B1". */
export const germanRank = (level: string): number => {
  const order = ["NONE", "A1", "A2", "B1", "B2", "C1", "C2", "NATIVE"]
  const i = order.indexOf(level)
  return i === -1 ? 0 : i
}
