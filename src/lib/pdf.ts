import * as pdfjsLib from "pdfjs-dist"
// Registers pdf.js' worker code on `window.pdfjsWorker`, so pdf.js runs its "fake worker"
// on the main thread. That avoids loading a separate worker script, which is fragile with
// MV3's CSP and Parcel. A resume is a few pages, so the main-thread cost doesn't matter.
import "pdfjs-dist/build/pdf.worker.entry"

export const MAX_PDF_BYTES = 10 * 1024 * 1024
const MAX_PAGES = 15

export interface ExtractedPdf {
  text: string
  pages: number
}

/** Extracts plain text from a PDF file entirely on-device. */
export async function extractPdfText(file: File): Promise<ExtractedPdf> {
  if (file.type && file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    throw new Error("Please upload a PDF file.")
  }
  if (file.size > MAX_PDF_BYTES) throw new Error("PDF is larger than 10 MB.")

  const data = new Uint8Array(await file.arrayBuffer())
  const doc = await pdfjsLib.getDocument({
    data,
    isEvalSupported: false, // MV3 CSP forbids eval / new Function
    useSystemFonts: true
  }).promise

  try {
    const pageCount = Math.min(doc.numPages, MAX_PAGES)
    const pageTexts: string[] = []
    for (let i = 1; i <= pageCount; i++) {
      const page = await doc.getPage(i)
      const content = await page.getTextContent()
      let line = ""
      const lines: string[] = []
      for (const item of content.items) {
        if (!("str" in item)) continue
        line += item.str
        if (item.hasEOL) {
          lines.push(line)
          line = ""
        } else if (item.str && !item.str.endsWith(" ")) {
          line += " "
        }
      }
      if (line) lines.push(line)
      pageTexts.push(lines.map((l) => l.replace(/\s+/g, " ").trim()).filter(Boolean).join("\n"))
    }

    const text = pageTexts.join("\n\n").trim()
    if (text.length < 50) {
      throw new Error(
        "Almost no text found — this PDF is probably a scanned image. Export your CV as a text-based PDF, or paste the text below."
      )
    }
    return { text, pages: doc.numPages }
  } finally {
    doc.destroy()
  }
}
