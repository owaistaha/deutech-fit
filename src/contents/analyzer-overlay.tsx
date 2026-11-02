import cssText from "data-text:~style.css"
import type { PlasmoCSConfig, PlasmoGetShadowHostId, PlasmoGetStyle } from "plasmo"
import { useEffect, useState } from "react"

import { ResultsCard } from "~components/ResultsCard"
import { Logo } from "~components/Logo"
import { SupportButton } from "~components/SupportButton"
import { sendToBackground, type AnalyzeResponse } from "~lib/messages"
import { detectSite, scrapeJob } from "~lib/scraper"
import type { StoredAnalysis } from "~lib/types"

export const config: PlasmoCSConfig = {
  matches: ["https://www.linkedin.com/*", "https://www.stepstone.de/*"],
  run_at: "document_idle"
}

export const getShadowHostId: PlasmoGetShadowHostId = () => "deutech-fit-overlay"

/**
 * Tailwind uses rem, and rem in a shadow root still resolves against the HOST page's
 * <html> font-size (LinkedIn/StepStone don't use 16px). Converting to px keeps the
 * overlay the same size on every site.
 */
export const getStyle: PlasmoGetStyle = () => {
  const style = document.createElement("style")
  style.textContent = cssText.replace(/(-?[\d.]+)rem/g, (_, n) => `${parseFloat(n) * 16}px`)
  return style
}

type Status =
  | { kind: "idle" }
  | { kind: "loading"; step: string }
  | { kind: "error"; message: string; needsSetup?: boolean }
  | { kind: "done"; result: StoredAnalysis }

/** Only show the badge where a job can actually be on screen. */
function isJobContext(): boolean {
  const site = detectSite()
  if (site === "linkedin") return location.pathname.startsWith("/jobs")
  return site === "stepstone"
}

function useJobContext() {
  const [visible, setVisible] = useState(isJobContext())
  const [url, setUrl] = useState(location.href)
  useEffect(() => {
    // SPA navigation (LinkedIn) doesn't fire a load; poll the URL cheaply.
    const id = window.setInterval(() => {
      if (location.href !== url) {
        setUrl(location.href)
        setVisible(isJobContext())
      }
    }, 800)
    return () => window.clearInterval(id)
  }, [url])
  return { visible, url }
}

const AnalyzerOverlay = () => {
  const { visible, url } = useJobContext()
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<Status>({ kind: "idle" })

  // A different job was selected → previous result no longer applies.
  useEffect(() => {
    setStatus((s) => (s.kind === "loading" ? s : { kind: "idle" }))
  }, [url])

  if (!visible) return null

  const analyze = async () => {
    setStatus({ kind: "loading", step: "Reading job ad…" })
    let job
    try {
      job = await scrapeJob()
    } catch (e) {
      setStatus({ kind: "error", message: (e as Error).message })
      return
    }
    setStatus({ kind: "loading", step: "Asking Gemini…" })
    try {
      const res = await sendToBackground<AnalyzeResponse>({ type: "ANALYZE_JOB", job })
      if (res.ok) setStatus({ kind: "done", result: res.result })
      else setStatus({ kind: "error", message: res.error, needsSetup: res.needsSetup })
    } catch (e) {
      // Usually "Extension context invalidated" after reloading the extension in dev.
      setStatus({
        kind: "error",
        message: /context invalidated/i.test((e as Error).message)
          ? "The extension was updated — refresh this page."
          : (e as Error).message
      })
    }
  }

  const openSettings = () => sendToBackground({ type: "OPEN_OPTIONS" }).catch(() => {})

  return (
    <div className="fixed bottom-5 right-5 z-[2147483647] font-sans antialiased">
      {open ? (
        <div className="flex max-h-[min(640px,calc(100vh-40px))] w-[380px] flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 text-slate-100 shadow-2xl shadow-black/50">
          <header className="flex items-center justify-between border-b border-slate-800 bg-slate-950/60 px-4 py-3">
            <div className="flex items-center gap-2">
              <Logo size={28} />
              <div>
                <p className="text-sm font-semibold leading-none text-white">DeuTech Fit</p>
                <p className="mt-0.5 text-[11px] text-slate-400">Job fit for Germany</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={openSettings}
                className="rounded-md px-2 py-1 text-xs text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                title="Settings">
                ⚙︎
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md px-2 py-1 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                aria-label="Minimize">
                ✕
              </button>
            </div>
          </header>

          <div className="dtf-scroll flex-1 overflow-y-auto p-4">
            {status.kind === "done" && (
              <div className="space-y-3">
                <ResultsCard result={status.result} />
                <SupportButton variant="card" />
              </div>
            )}

            {status.kind === "error" && (
              <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-200">
                <p className="whitespace-pre-line break-words">{status.message}</p>
                {status.needsSetup && (
                  <button
                    type="button"
                    onClick={openSettings}
                    className="mt-2 text-xs font-semibold text-indigo-300 underline-offset-2 hover:underline">
                    Open settings →
                  </button>
                )}
              </div>
            )}

            {status.kind === "idle" && (
              <p className="text-sm leading-relaxed text-slate-400">
                Checks this ad for hidden German requirements, visa / Werkstudent compatibility and the German CV
                keywords you're missing.
              </p>
            )}
          </div>

          <footer className="border-t border-slate-800 p-3">
            <button
              type="button"
              onClick={analyze}
              disabled={status.kind === "loading"}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-900/40 transition hover:from-indigo-400 hover:to-purple-500 disabled:cursor-wait disabled:opacity-70">
              {status.kind === "loading" ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  {status.step}
                </>
              ) : status.kind === "done" ? (
                "Re-analyze this job"
              ) : (
                "🇩🇪 Analyze Job Fit for Germany"
              )}
            </button>
          </footer>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 rounded-full border border-indigo-400/30 bg-slate-900/95 py-2 pl-2 pr-4 text-sm font-semibold text-white shadow-xl shadow-black/40 backdrop-blur transition hover:border-indigo-400/70 hover:bg-slate-800">
          <Logo size={28} />
          DeuTech Fit
          {status.kind === "done" && (
            <span className="h-2 w-2 rounded-full bg-emerald-400" title="Analysis ready" />
          )}
        </button>
      )}
    </div>
  )
}

export default AnalyzerOverlay
