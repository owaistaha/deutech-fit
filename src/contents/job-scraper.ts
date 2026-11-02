import type { PlasmoCSConfig } from "plasmo"

import type { ExtensionMessage, ScrapeResponse } from "~lib/messages"
import { scrapeJob } from "~lib/scraper"

/**
 * Headless content script: answers "SCRAPE_JOB" requests from the side panel.
 * The extraction logic itself lives in ~lib/scraper so the overlay can reuse it
 * without registering this listener twice.
 *
 * Note: matches all of linkedin.com (not just /jobs/*) because LinkedIn is an SPA —
 * if you land on /feed and click "Jobs", the browser never does a real navigation
 * to /jobs/*, so a /jobs/*-only content script would never be injected.
 */
export const config: PlasmoCSConfig = {
  matches: ["https://www.linkedin.com/*", "https://www.stepstone.de/*"],
  run_at: "document_idle"
}

chrome.runtime.onMessage.addListener((message: ExtensionMessage, _sender, sendResponse) => {
  if (message?.type !== "SCRAPE_JOB") return false
  scrapeJob()
    .then((job): ScrapeResponse => ({ ok: true, job }))
    .catch((e): ScrapeResponse => ({ ok: false, error: (e as Error).message }))
    .then(sendResponse)
  return true // async response
})

export { scrapeJob }
