import { useEffect, useState } from "react"

import "~style.css"

import { ResumeDropzone } from "~components/ResumeDropzone"
import { Logo } from "~components/Logo"
import { SupportButton } from "~components/SupportButton"
import { testGeminiConnection } from "~lib/gemini-analyzer"
import { DEFAULT_MODEL, DEFAULT_PROFILE, KEYS, MODEL_OPTIONS, storage } from "~lib/storage"
import { USER_GERMAN_LEVELS, VISA_TYPES, type UserGermanLevel, type VisaTypeId } from "~lib/types"

const LEVEL_LABELS: Record<UserGermanLevel, string> = {
  NONE: "None",
  A1: "A1 — Beginner",
  A2: "A2 — Elementary",
  B1: "B1 — Intermediate",
  B2: "B2 — Upper intermediate",
  C1: "C1 — Advanced",
  C2: "C2 — Proficient",
  NATIVE: "Native speaker"
}

const CUSTOM = "__custom__"

const inputCls =
  "w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
const labelCls = "mb-1.5 block text-xs font-medium text-slate-300"

function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      <h2 className="text-sm font-semibold text-white">{title}</h2>
      {subtitle && <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>}
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  )
}

function OptionsPage() {
  const [loaded, setLoaded] = useState(false)
  const [apiKey, setApiKey] = useState("")
  const [showKey, setShowKey] = useState(false)
  const [modelChoice, setModelChoice] = useState<string>(DEFAULT_MODEL)
  const [customModel, setCustomModel] = useState("")
  const [germanLevel, setGermanLevel] = useState<UserGermanLevel>(DEFAULT_PROFILE.germanLevel)
  const [visaType, setVisaType] = useState<VisaTypeId>(DEFAULT_PROFILE.visaType)
  const [targetRole, setTargetRole] = useState("")
  const [resumeText, setResumeText] = useState("")
  const [resumeFileName, setResumeFileName] = useState("")
  const [saved, setSaved] = useState(false)
  const [test, setTest] = useState<{ state: "idle" | "busy" | "ok" | "fail"; msg?: string }>({ state: "idle" })

  const model = modelChoice === CUSTOM ? customModel.trim() : modelChoice

  useEffect(() => {
    ;(async () => {
      const [k, m, gl, vt, tr, rt, rf] = await Promise.all([
        storage.get<string>(KEYS.apiKey),
        storage.get<string>(KEYS.model),
        storage.get<UserGermanLevel>(KEYS.germanLevel),
        storage.get<VisaTypeId>(KEYS.visaType),
        storage.get<string>(KEYS.targetRole),
        storage.get<string>(KEYS.resumeText),
        storage.get<string>(KEYS.resumeFileName)
      ])
      setApiKey(k ?? "")
      const storedModel = m || DEFAULT_MODEL
      if (MODEL_OPTIONS.some((o) => o.id === storedModel)) setModelChoice(storedModel)
      else {
        setModelChoice(CUSTOM)
        setCustomModel(storedModel)
      }
      if (gl) setGermanLevel(gl)
      if (vt) setVisaType(vt)
      setTargetRole(tr ?? "")
      setResumeText(rt ?? "")
      setResumeFileName(rf ?? "")
      setLoaded(true)
    })()
  }, [])

  const save = async () => {
    await Promise.all([
      storage.set(KEYS.apiKey, apiKey.trim()),
      storage.set(KEYS.model, model || DEFAULT_MODEL),
      storage.set(KEYS.germanLevel, germanLevel),
      storage.set(KEYS.visaType, visaType),
      storage.set(KEYS.targetRole, targetRole.trim()),
      storage.set(KEYS.resumeText, resumeText),
      storage.set(KEYS.resumeFileName, resumeFileName)
    ])
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const onResume = async (text: string, name: string) => {
    setResumeText(text)
    setResumeFileName(name)
    // Persist right away so a parsed CV is never lost if the user forgets to hit Save.
    await Promise.all([storage.set(KEYS.resumeText, text), storage.set(KEYS.resumeFileName, name)])
  }

  const runTest = async () => {
    if (!apiKey.trim()) return setTest({ state: "fail", msg: "Paste a key first." })
    setTest({ state: "busy" })
    try {
      const name = await testGeminiConnection(apiKey.trim(), model || DEFAULT_MODEL)
      setTest({ state: "ok", msg: `Connected — ${name} is available.` })
    } catch (e) {
      setTest({ state: "fail", msg: (e as Error).message })
    }
  }

  if (!loaded) return <div className="min-h-screen bg-slate-950" />

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100 antialiased">
      <div className="mx-auto max-w-2xl px-6 py-10">
        <header className="mb-8 flex items-center gap-3">
          <Logo size={44} />
          <div>
            <h1 className="text-xl font-semibold text-white">DeuTech Fit — Settings</h1>
            <p className="text-sm text-slate-400">Everything is stored locally in this browser only.</p>
          </div>
          <div className="ml-auto">
            <SupportButton />
          </div>
        </header>

        <div className="space-y-5">
          <Card
            title="1. Gemini API key"
            subtitle="Free key from Google AI Studio. Sent only to generativelanguage.googleapis.com.">
            <div>
              <label className={labelCls} htmlFor="key">
                API key
              </label>
              <div className="flex gap-2">
                <input
                  id="key"
                  type={showKey ? "text" : "password"}
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="AIza…"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className={inputCls}
                />
                <button
                  type="button"
                  onClick={() => setShowKey((s) => !s)}
                  className="shrink-0 rounded-lg px-3 text-xs text-slate-300 ring-1 ring-slate-700 hover:bg-slate-800">
                  {showKey ? "Hide" : "Show"}
                </button>
              </div>
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noreferrer"
                className="mt-1.5 inline-block text-xs text-indigo-300 hover:underline">
                Get a free key at aistudio.google.com/apikey →
              </a>
            </div>

            <div>
              <label className={labelCls} htmlFor="model">
                Model
              </label>
              <select
                id="model"
                value={modelChoice}
                onChange={(e) => setModelChoice(e.target.value)}
                className={inputCls}>
                {MODEL_OPTIONS.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
                <option value={CUSTOM}>Custom model ID…</option>
              </select>
              {modelChoice === CUSTOM && (
                <input
                  className={`${inputCls} mt-2`}
                  placeholder="e.g. gemini-3.1-pro-preview"
                  value={customModel}
                  onChange={(e) => setCustomModel(e.target.value)}
                />
              )}
              <p className="mt-1.5 text-xs text-slate-500">
                Gemini 2.0 Flash was retired on 1 June 2026. 3.6 Flash is the default; use "Test connection" to
                check that your key can access a model.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={runTest}
                disabled={test.state === "busy"}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-200 ring-1 ring-slate-700 hover:bg-slate-800 disabled:opacity-60">
                {test.state === "busy" ? "Testing…" : "Test connection"}
              </button>
              {test.msg && (
                <span className={`text-xs ${test.state === "ok" ? "text-emerald-300" : "text-rose-300"}`}>
                  {test.msg}
                </span>
              )}
            </div>
          </Card>

          <Card title="2. Your profile" subtitle="Used to judge language gaps and work-permit compatibility.">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls} htmlFor="level">
                  German level
                </label>
                <select
                  id="level"
                  value={germanLevel}
                  onChange={(e) => setGermanLevel(e.target.value as UserGermanLevel)}
                  className={inputCls}>
                  {USER_GERMAN_LEVELS.map((l) => (
                    <option key={l} value={l}>
                      {LEVEL_LABELS[l]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls} htmlFor="visa">
                  Current residence permit
                </label>
                <select
                  id="visa"
                  value={visaType}
                  onChange={(e) => setVisaType(e.target.value as VisaTypeId)}
                  className={inputCls}>
                  {VISA_TYPES.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className={labelCls} htmlFor="role">
                Target role
              </label>
              <input
                id="role"
                placeholder="e.g. Werkstudent Software Engineering, Junior Data Analyst"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className={inputCls}
              />
            </div>
          </Card>

          <Card
            title="3. Resume / Lebenslauf"
            subtitle="Parsed on-device with pdf.js. Only the extracted text is sent to Gemini during an analysis.">
            <ResumeDropzone fileName={resumeFileName} onExtracted={onResume} />
            <div>
              <label className={labelCls} htmlFor="resume">
                Extracted text{" "}
                <span className="font-normal text-slate-500">
                  ({resumeText.length.toLocaleString()} chars — edit freely, or paste if your PDF is scanned)
                </span>
              </label>
              <textarea
                id="resume"
                rows={10}
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Your CV text will appear here…"
                className={`${inputCls} dtf-scroll font-mono text-xs leading-relaxed`}
              />
            </div>
          </Card>
        </div>

        <div className="sticky bottom-0 mt-6 flex items-center justify-end gap-3 border-t border-slate-800 bg-slate-950/90 py-4 backdrop-blur">
          {saved && <span className="text-sm text-emerald-300">✓ Saved</span>}
          <button
            type="button"
            onClick={save}
            className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-900/40 hover:from-indigo-400 hover:to-purple-500">
            Save settings
          </button>
        </div>
      </div>
    </div>
  )
}

export default OptionsPage
