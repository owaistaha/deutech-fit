import { Storage } from "@plasmohq/storage"

import type { StoredAnalysis, UserGermanLevel, UserProfile, VisaTypeId } from "./types"

/**
 * Everything lives in chrome.storage.local (never .sync) so the resume text and the
 * Gemini key stay on this machine and aren't uploaded to the user's Google account.
 */
export const storage = new Storage({ area: "local" })

export const KEYS = {
  apiKey: "geminiApiKey",
  model: "geminiModel",
  germanLevel: "germanLevel",
  visaType: "visaType",
  targetRole: "targetRole",
  resumeText: "resumeText",
  resumeFileName: "resumeFileName",
  lastAnalysis: "lastAnalysis"
} as const

/**
 * Gemini 2.0 Flash was shut down on 2026-06-01 and Google lists 3.6 Flash as its
 * replacement. 3.6 Flash is the default (confirmed working end-to-end, Nov 2026).
 */
export const DEFAULT_MODEL = "gemini-3.6-flash"
export const MODEL_OPTIONS = [
  { id: "gemini-3.6-flash", label: "Gemini 3.6 Flash (recommended)" },
  { id: "gemini-3.8-flash", label: "Gemini 3.8 Flash (newest)" },
  { id: "gemini-3.5-flash-lite", label: "Gemini 3.5 Flash-Lite (fastest)" },
  { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash (legacy)" }
] as const

export const DEFAULT_PROFILE: UserProfile = {
  germanLevel: "A2",
  visaType: "student_16b",
  targetRole: "",
  resumeText: ""
}

export interface Settings {
  apiKey: string
  model: string
  profile: UserProfile
}

export async function loadSettings(): Promise<Settings> {
  const [apiKey, model, germanLevel, visaType, targetRole, resumeText] =
    await Promise.all([
      storage.get<string>(KEYS.apiKey),
      storage.get<string>(KEYS.model),
      storage.get<UserGermanLevel>(KEYS.germanLevel),
      storage.get<VisaTypeId>(KEYS.visaType),
      storage.get<string>(KEYS.targetRole),
      storage.get<string>(KEYS.resumeText)
    ])
  return {
    apiKey: (apiKey ?? "").trim(),
    model: (model ?? "").trim() || DEFAULT_MODEL,
    profile: {
      germanLevel: germanLevel ?? DEFAULT_PROFILE.germanLevel,
      visaType: visaType ?? DEFAULT_PROFILE.visaType,
      targetRole: targetRole ?? "",
      resumeText: resumeText ?? ""
    }
  }
}

export const saveLastAnalysis = (a: StoredAnalysis) =>
  storage.set(KEYS.lastAnalysis, a)
