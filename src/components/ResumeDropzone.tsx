import { useRef, useState } from "react"

import { extractPdfText } from "~lib/pdf"

interface Props {
  fileName: string
  onExtracted: (text: string, fileName: string) => void
}

/** Drag-and-drop (or click) PDF uploader. Parsing happens fully on-device with pdf.js. */
export function ResumeDropzone({ fileName, onExtracted }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFile = async (file?: File | null) => {
    if (!file) return
    setError(null)
    setBusy(true)
    try {
      const { text } = await extractPdfText(file)
      onExtracted(text, file.name)
    } catch (e) {
      setError((e as Error).message || "Couldn't read that PDF.")
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          handleFile(e.dataTransfer.files?.[0])
        }}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 text-center transition ${
          dragging
            ? "border-indigo-400 bg-indigo-500/10"
            : "border-slate-700 bg-slate-900/60 hover:border-slate-500"
        }`}>
        {busy ? (
          <>
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-300/30 border-t-indigo-300" />
            <p className="mt-3 text-sm text-slate-300">Extracting text…</p>
          </>
        ) : (
          <>
            <span className="text-3xl">📄</span>
            <p className="mt-2 text-sm font-medium text-slate-200">
              {fileName ? `Replace "${fileName}"` : "Drop your CV / Lebenslauf (PDF) here"}
            </p>
            <p className="mt-1 text-xs text-slate-500">or click to browse · max 10 MB · stays on this device</p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>
      {error && <p className="mt-2 text-xs text-rose-300">{error}</p>}
    </div>
  )
}
