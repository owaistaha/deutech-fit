import { analyzeJobFit, GeminiError } from "~lib/gemini-analyzer"
import type { AnalyzeResponse, ExtensionMessage } from "~lib/messages"
import { LINKEDIN_GUEST_URL } from "~lib/scraper"
import { loadSettings, saveLastAnalysis } from "~lib/storage"
import type { JobPosting, StoredAnalysis } from "~lib/types"

/**
 * Service worker. All Gemini calls happen here (not in the content script) so that:
 *  - the request isn't subject to linkedin.com / stepstone.de CORS rules,
 *  - the API key is never handed to code running inside a third-party page.
 */

// Clicking the toolbar icon opens the side panel (there is no popup; settings live on the options page).
chrome.runtime.onInstalled.addListener((details) => {
  chrome.sidePanel?.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {})
  if (details.reason === "install") chrome.runtime.openOptionsPage()
})
chrome.runtime.onStartup.addListener(() => {
  chrome.sidePanel?.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {})
})

async function handleAnalyze(job: JobPosting): Promise<AnalyzeResponse> {
  const { apiKey, model, profile } = await loadSettings()

  if (!apiKey) {
    return { ok: false, needsSetup: true, error: "Add your Gemini API key in Settings to start." }
  }

  try {
    const analysis = await analyzeJobFit({ apiKey, model, job, profile })
    const { description: _omit, ...jobMeta } = job
    const result: StoredAnalysis = {
      job: jobMeta,
      analysis,
      analyzedAt: Date.now(),
      model,
      profile: { germanLevel: profile.germanLevel, visaType: profile.visaType }
    }
    await saveLastAnalysis(result)
    return { ok: true, result }
  } catch (e) {
    const msg = e instanceof GeminiError ? e.message : "Something went wrong while analyzing."
    if (!(e instanceof GeminiError)) console.error("[DeuTech Fit]", e)
    return { ok: false, error: msg, needsSetup: e instanceof GeminiError && e.status === 400 }
  }
}

chrome.runtime.onMessage.addListener((message: ExtensionMessage, _sender, sendResponse) => {
  switch (message?.type) {
    case "ANALYZE_JOB":
      handleAnalyze(message.job).then(sendResponse)
      return true // keep the channel open for the async response
    case "FETCH_LINKEDIN_JOB": {
      // Only ever fetches LinkedIn's public posting endpoint for a numeric ID — not a generic proxy.
      if (!/^\d{5,15}$/.test(message.jobId)) {
        sendResponse({ ok: false, error: "invalid job ID" })
        return false
      }
      fetch(LINKEDIN_GUEST_URL(message.jobId), { credentials: "omit", signal: AbortSignal.timeout(10_000) })
        .then(async (res) =>
          res.ok ? sendResponse({ ok: true, html: await res.text() }) : sendResponse({ ok: false, error: `HTTP ${res.status}` })
        )
        .catch((e) => sendResponse({ ok: false, error: (e as Error).message || "network error" }))
      return true
    }
    case "OPEN_OPTIONS":
      chrome.runtime.openOptionsPage()
      sendResponse({ ok: true })
      return false
    default:
      return false
  }
})
