import type { JobPosting, StoredAnalysis } from "./types"

export type ExtensionMessage =
  | { type: "SCRAPE_JOB" } // side panel -> content script (job-scraper)
  | { type: "ANALYZE_JOB"; job: JobPosting } // any UI -> background
  | { type: "OPEN_OPTIONS" } // content script -> background
  | { type: "FETCH_LINKEDIN_JOB"; jobId: string } // content script -> background (fallback route)

export type ScrapeResponse =
  | { ok: true; job: JobPosting }
  | { ok: false; error: string }

export type AnalyzeResponse =
  | { ok: true; result: StoredAnalysis }
  | { ok: false; error: string; needsSetup?: boolean }

/** Promise wrapper around chrome.runtime.sendMessage that surfaces lastError. */
export function sendToBackground<T>(message: ExtensionMessage): Promise<T> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response: T) => {
      const err = chrome.runtime.lastError
      if (err) reject(new Error(err.message))
      else resolve(response)
    })
  })
}

export function sendToTab<T>(tabId: number, message: ExtensionMessage): Promise<T> {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, message, (response: T) => {
      const err = chrome.runtime.lastError
      if (err) reject(new Error(err.message))
      else resolve(response)
    })
  })
}
