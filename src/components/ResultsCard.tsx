import { useState } from "react"

import { germanRank, type StoredAnalysis, type VisaFitStatus } from "~lib/types"

const VISA_STYLES: Record<VisaFitStatus, { cls: string; label: string; icon: string }> = {
  HIGH: { cls: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30", label: "High visa fit", icon: "✅" },
  MEDIUM: { cls: "bg-amber-500/15 text-amber-300 ring-amber-500/30", label: "Medium visa fit", icon: "⚠️" },
  LOW: { cls: "bg-rose-500/15 text-rose-300 ring-rose-500/30", label: "Low visa fit", icon: "⛔" }
}

function languageBadge(required: string, userLevel: string) {
  if (required === "NONE")
    return { icon: "✅", text: "No German requirement detected", cls: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200" }
  const gap = germanRank(required) - germanRank(userLevel)
  if (gap > 0)
    return {
      icon: "⚠️",
      text: `Buried ${required} German Requirement Found`,
      cls: "border-amber-500/40 bg-amber-500/10 text-amber-100"
    }
  return {
    icon: "✅",
    text: `${required} German expected — you meet it`,
    cls: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
  }
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-700/60 bg-slate-800/50 p-3">
      <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{title}</h3>
      {children}
    </section>
  )
}

export function ResultsCard({ result }: { result: StoredAnalysis }) {
  const { analysis: a, job, profile } = result
  const lang = languageBadge(a.hidden_german_level, profile.germanLevel)
  const visa = VISA_STYLES[a.visa_fit_status]
  const [copied, setCopied] = useState<string | null>(null)

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(text)
      setTimeout(() => setCopied(null), 1200)
    } catch {
      /* clipboard can be blocked on some pages */
    }
  }

  return (
    <div className="space-y-3 text-sm text-slate-200">
      <div>
        <p className="font-semibold leading-snug text-white">{job.title}</p>
        <p className="text-xs text-slate-400">
          {job.company} · {job.location}
        </p>
      </div>

      {/* 1. Language */}
      <div className={`rounded-xl border p-3 ${lang.cls}`}>
        <p className="font-semibold">
          {lang.icon} {lang.text}
        </p>
        <p className="mt-1 text-xs opacity-90">
          Your level: <b>{profile.germanLevel}</b>
          {a.hidden_german_level !== "NONE" && (
            <>
              {" "}· Expected: <b>{a.hidden_german_level}</b>
            </>
          )}
        </p>
        {a.hidden_german_explanation && (
          <p className="mt-2 text-xs leading-relaxed text-slate-300">{a.hidden_german_explanation}</p>
        )}
      </div>

      {/* 2. Visa & Werkstudent */}
      <Section title="Visa & Werkstudent suitability">
        <div className="flex flex-wrap gap-2">
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${visa.cls}`}>
            {visa.icon} {visa.label}
          </span>
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${
              a.werkstudent_equivalent
                ? "bg-indigo-500/15 text-indigo-300 ring-indigo-500/30"
                : "bg-slate-600/30 text-slate-300 ring-slate-500/30"
            }`}>
            {a.werkstudent_equivalent ? "🎓 Werkstudent-compatible" : "Not a Werkstudent role"}
          </span>
        </div>
        {a.visa_notes && <p className="mt-2 text-xs leading-relaxed text-slate-300">{a.visa_notes}</p>}
      </Section>

      {/* 3. Lebenslauf tweaks */}
      <Section title="Resume tweaks for the German market">
        {a.title_recommendation && (
          <div className="mb-3">
            <p className="text-[11px] text-slate-400">Recommended Lebenslauf title</p>
            <button
              type="button"
              onClick={() => copy(a.title_recommendation.split(" — ")[0])}
              title="Click to copy"
              className="mt-1 w-full rounded-lg bg-slate-900/70 px-2.5 py-2 text-left text-xs font-medium text-indigo-200 ring-1 ring-slate-700 hover:ring-indigo-500/60">
              {a.title_recommendation}
              {copied === a.title_recommendation.split(" — ")[0] && (
                <span className="ml-2 text-emerald-400">copied</span>
              )}
            </button>
          </div>
        )}
        {a.missing_german_keywords.length > 0 ? (
          <>
            <p className="text-[11px] text-slate-400">Missing German keywords (click to copy)</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {a.missing_german_keywords.map((k) => (
                <button
                  type="button"
                  key={k}
                  onClick={() => copy(k)}
                  className="rounded-md bg-purple-500/15 px-2 py-1 text-xs text-purple-200 ring-1 ring-purple-500/30 hover:bg-purple-500/25">
                  {copied === k ? "✓ copied" : k}
                </button>
              ))}
            </div>
          </>
        ) : (
          <p className="text-xs text-slate-400">No missing keywords — your CV already covers this ad.</p>
        )}
      </Section>

      <p className="text-[10px] leading-snug text-slate-500">
        AI estimate via {result.model} · {new Date(result.analyzedAt).toLocaleString()}. Not legal advice —
        confirm visa questions with your Ausländerbehörde or university.
      </p>
    </div>
  )
}
