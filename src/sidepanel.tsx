import { useStorage } from "@plasmohq/storage/hook"
import { useState } from "react"

import "~style.css"

import { ResultsCard } from "~components/ResultsCard"
import { Logo } from "~components/Logo"
import { SupportButton } from "~components/SupportButton"
import { sendToBackground, sendToTab, type AnalyzeResponse, type ScrapeResponse } from "~lib/messages"
import { KEYS, storage } from "~lib/storage"
import type { StoredAnalysis } from "~lib/types"

/**
 * Side panel (opened from the toolbar icon). Analyzes the active tab and always shows
 * the most recent analysis, including ones started from the on-page overlay.
 */
function SidePanel() {
  const [last] = useStorage<StoredAnalysis | null>({ key: KEYS.lastAnalysis, instance: storage }, null)
  const [apiKey] = useStorage<string>({ key: KEYS.apiKey, instance: storage }, "")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const analyzeActiveTab = async () => {
    setError(null)
    setLoading(true)
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      if (!tab?.id) throw new Error("No active tab.")

      let scraped: ScrapeResponse
      try {
        scraped = await sendToTab<ScrapeResponse>(tab.id, { type: "SCRAPE_JOB" })
      } catch {
        throw new Error(
          "Open a LinkedIn or StepStone job ad in this tab. If it's already open, refresh the page once."
        )
      }
      if (!scraped.ok) throw new Error(scraped.error)

      const res = await sendToBackground<AnalyzeResponse>({ type: "ANALYZE_JOB", job: scraped.job })
      if (!res.ok) throw new Error(res.error)
      // `last` updates automatically through useStorage.
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100 antialiased">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-800 bg-slate-950/90 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-2">
          <Logo size={32} />
          <div>
            <h1 className="text-sm font-semibold leading-none">DeuTech Fit</h1>
            <p className="mt-0.5 text-[11px] text-slate-400">Job fit for Germany</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => chrome.runtime.openOptionsPage()}
          className="rounded-lg px-2.5 py-1.5 text-xs text-slate-300 ring-1 ring-slate-700 hover:bg-slate-800">
          Settings
        </button>
      </header>

      <main className="space-y-4 p-4">
        {!apiKey && (
          <div className="rounded-xl border border-indigo-500/40 bg-indigo-500/10 p-3 text-sm text-indigo-100">
            Add your Gemini API key and resume in{" "}
            <button
              type="button"
              className="font-semibold underline underline-offset-2"
              onClick={() => chrome.runtime.openOptionsPage()}>
              Settings
            </button>{" "}
            to get started.
          </div>
        )}

        <button
          type="button"
          onClick={analyzeActiveTab}
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-900/40 hover:from-indigo-400 hover:to-purple-500 disabled:cursor-wait disabled:opacity-70">
          {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />}
          {loading ? "Analyzing…" : "🇩🇪 Analyze Job Fit for Germany"}
        </button>

        {error && (
          <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-200">{error}</div>
        )}

        {last ? (
          <ResultsCard result={last} />
        ) : (
          <p className="text-sm text-slate-400">
            No analysis yet. Open a job on LinkedIn or StepStone and click the button above, or use the floating{" "}
            <b className="text-slate-300">DeuTech Fit</b> badge on the page.
          </p>
        )}

        <SupportButton variant="card" />
      </main>
    </div>
  )
}

export default SidePanel
