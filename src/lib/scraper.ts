import type { JobPosting, JobSite } from "./types"

/**
 * Job-page extraction for LinkedIn and StepStone.
 *
 * Strategy (most to least reliable):
 *   1. schema.org JobPosting JSON-LD (StepStone always ships it; LinkedIn guest pages do)
 *   2. Site-specific DOM selectors (several generations of class names per field)
 *   3. Heuristic fallback: the longest description-looking block on the page
 *
 * LinkedIn: the job ID from the URL is used to fetch the posting from LinkedIn's
 * public job endpoint first (immune to the hashed class names of the new UI); the
 * in-page DOM, JSON-LD and an "About the job" text anchor are fallbacks.
 */

const MAX_DESCRIPTION_CHARS = 20_000
const MIN_DESCRIPTION_CHARS = 150

// ---------- selectors ----------

const LINKEDIN = {
  title: [
    ".job-details-jobs-unified-top-card__job-title h1",
    ".job-details-jobs-unified-top-card__job-title",
    ".jobs-unified-top-card__job-title",
    ".jobs-details-top-card__job-title",
    "h1.top-card-layout__title", // guest / logged-out view
    ".topcard__title",
    ".jobs-search__job-details h1",
    "main h1"
  ],
  company: [
    ".job-details-jobs-unified-top-card__company-name a",
    ".job-details-jobs-unified-top-card__company-name",
    ".jobs-unified-top-card__company-name a",
    ".jobs-unified-top-card__company-name",
    ".jobs-details-top-card__company-url",
    "a.topcard__org-name-link",
    ".topcard__flavor a"
  ],
  location: [
    ".job-details-jobs-unified-top-card__primary-description-container .tvm__text",
    ".job-details-jobs-unified-top-card__tertiary-description-container .tvm__text",
    ".job-details-jobs-unified-top-card__bullet",
    ".jobs-unified-top-card__bullet",
    ".topcard__flavor--bullet"
  ],
  description: [
    "#job-details",
    ".jobs-description__content .jobs-box__html-content",
    ".jobs-description-content__text",
    ".jobs-description__container",
    ".jobs-box__html-content",
    ".show-more-less-html__markup", // guest view
    ".description__text"
  ]
}

const STEPSTONE = {
  title: [
    '[data-at="header-job-title"]',
    '[data-at="job-ad-header"] h1',
    '[data-genesis-element="JOB_TITLE"]',
    "h1"
  ],
  company: [
    '[data-at="metadata-company-name"]',
    '[data-at="header-company-name"]',
    '[data-at="job-ad-header"] a[href*="/cmp/"]'
  ],
  location: ['[data-at="metadata-location"]', '[data-at="header-location"]'],
  description: [
    '[data-at="job-ad-content"]',
    '[data-at="jobad-content"]',
    ".listing-content-provider",
    '[data-genesis-element="JOB_AD_CONTENT"]'
  ]
}

// Lines that are UI chrome, not job content.
const JUNK_LINE =
  /^(show more|show less|see more|see less|… ?more|mehr anzeigen|weniger anzeigen|apply|easy apply|jetzt bewerben|bewerben|save|speichern|report this job|melden|share|teilen|about the job|über den job)$/i

// ---------- helpers ----------

export function detectSite(url: string = location.href): JobSite {
  const host = new URL(url).hostname
  if (host.endsWith("linkedin.com")) return "linkedin"
  if (host.endsWith("stepstone.de")) return "stepstone"
  return "unknown"
}

function first(selectors: string[], root: ParentNode = document): Element | null {
  for (const sel of selectors) {
    try {
      const el = root.querySelector(sel)
      if (el && el.textContent?.trim()) return el
    } catch {
      /* invalid selector in some engines — skip */
    }
  }
  return null
}

const BLOCK_TAGS = new Set([
  "P", "DIV", "SECTION", "ARTICLE", "UL", "OL", "LI", "BR", "H1", "H2", "H3",
  "H4", "H5", "H6", "TR", "TABLE", "BLOCKQUOTE", "HEADER", "FOOTER"
])
const SKIP_TAGS = new Set([
  "SCRIPT", "STYLE", "NOSCRIPT", "SVG", "BUTTON", "NAV", "FORM", "IFRAME",
  "IMG", "INPUT", "SELECT", "TEMPLATE"
])

/**
 * Converts a DOM subtree to readable plain text, keeping paragraph/bullet structure
 * and dropping buttons, navigation, hidden decorative nodes, etc.
 * Works on detached nodes too (so we can use it on JSON-LD HTML).
 */
export function nodeToText(root: Node): string {
  const out: string[] = []
  const walk = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      out.push(node.textContent ?? "")
      return
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return
    const el = node as Element
    if (SKIP_TAGS.has(el.tagName)) return
    if (el.getAttribute("aria-hidden") === "true") return
    if (el.classList.contains("visually-hidden")) return
    if (el.tagName === "BR") {
      out.push("\n")
      return
    }
    const isBlock = BLOCK_TAGS.has(el.tagName)
    if (isBlock) out.push("\n")
    if (el.tagName === "LI") out.push("• ")
    el.childNodes.forEach(walk)
    if (isBlock) out.push("\n")
  }
  walk(root)
  return cleanText(out.join(""))
}

export function cleanText(raw: string): string {
  return raw
    .replace(/ /g, " ")
    .replace(/[ \t\f\v]+/g, " ")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => !JUNK_LINE.test(l))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/\n\n(?=• )/g, "\n") // keep bullet lists tight
    .trim()
}

const oneLine = (s: string | undefined | null) =>
  (s ?? "").replace(/\s+/g, " ").trim()

function htmlToText(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html") // inert, no script execution
  return nodeToText(doc.body)
}

// ---------- JSON-LD ----------

interface LdJob {
  title: string
  company: string
  location: string
  description: string
}

function readJsonLd(): LdJob | null {
  const scripts = document.querySelectorAll('script[type="application/ld+json"]')
  for (const s of Array.from(scripts)) {
    let data: unknown
    try {
      data = JSON.parse(s.textContent ?? "")
    } catch {
      continue
    }
    const nodes: any[] = []
    const collect = (d: any) => {
      if (!d || typeof d !== "object") return
      if (Array.isArray(d)) return d.forEach(collect)
      nodes.push(d)
      if (d["@graph"]) collect(d["@graph"])
    }
    collect(data)
    const job = nodes.find((n) => {
      const t = n["@type"]
      return t === "JobPosting" || (Array.isArray(t) && t.includes("JobPosting"))
    })
    if (!job) continue

    const locs = Array.isArray(job.jobLocation) ? job.jobLocation : [job.jobLocation]
    const location = locs
      .filter(Boolean)
      .map((l: any) => {
        const a = l.address ?? {}
        return [a.addressLocality, a.addressRegion, a.addressCountry?.name ?? a.addressCountry]
          .filter((x) => typeof x === "string" && x)
          .join(", ")
      })
      .filter(Boolean)
      .join(" | ")
    const remote = job.jobLocationType === "TELECOMMUTE" ? "Remote" : ""

    return {
      title: oneLine(job.title),
      company: oneLine(
        typeof job.hiringOrganization === "string"
          ? job.hiringOrganization
          : job.hiringOrganization?.name
      ),
      location: [location, remote].filter(Boolean).join(" · "),
      description: job.description ? htmlToText(String(job.description)) : ""
    }
  }
  return null
}

// ---------- heuristic fallback ----------

const DESCRIPTION_HINTS =
  /(about the job|job description|responsibilities|requirements|qualifications|your tasks|your profile|stellenbeschreibung|ihre aufgaben|ihr profil|deine aufgaben|dein profil|wir bieten|what we offer)/i

function heuristicDescription(): string {
  const candidates = document.querySelectorAll(
    'article, section, [class*="description"], [id*="description"], [class*="job-details"], [data-at*="content"]'
  )
  let best = ""
  candidates.forEach((el) => {
    const text = (el as HTMLElement).innerText ?? ""
    if (text.length < 300 || text.length > 40_000) return
    if (!DESCRIPTION_HINTS.test(text)) return
    if (text.length > best.length) best = text
  })
  return cleanText(best)
}

// ---------- LinkedIn: job ID + guest endpoint ----------

/**
 * LinkedIn's current UI (/jobs/search-results/, /jobs/collections/, …) uses hashed class
 * names that change constantly. Every view still exposes the job ID, though:
 *   ?currentJobId=4480462153   or   /jobs/view/4480462153/  (optionally with a slug)
 */
export function linkedInJobId(url: string = location.href): string | null {
  const u = new URL(url)
  const q = u.searchParams.get("currentJobId")
  if (q && /^\d+$/.test(q)) return q
  const m = u.pathname.match(/\/jobs\/view\/(?:[^/]*-)?(\d{6,})/)
  return m ? m[1] : null
}

export const LINKEDIN_GUEST_URL = (jobId: string) =>
  `https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/${jobId}`

/** Diagnostics collected during one scrape; shown in the error so failures are debuggable. */
type Diag = string[]

function parseGuestHtml(html: string) {
  const doc = new DOMParser().parseFromString(html, "text/html")
  const descEl = first([".show-more-less-html__markup", ".description__text"], doc)
  return {
    title: oneLine(first(["h2.top-card-layout__title", ".top-card-layout__title", ".topcard__title"], doc)?.textContent),
    company: oneLine(first(["a.topcard__org-name-link", ".topcard__org-name-link", ".topcard__flavor a"], doc)?.textContent),
    location: oneLine(first([".topcard__flavor--bullet"], doc)?.textContent),
    description: descEl ? nodeToText(descEl) : ""
  }
}

/** Route 1: fetch from the content script (same-origin with linkedin.com). */
async function fetchGuestHtmlHere(jobId: string): Promise<string> {
  const res = await fetch(LINKEDIN_GUEST_URL(jobId), {
    credentials: "omit",
    signal: AbortSignal.timeout(10_000)
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.text()
}

/** Route 2: ask the background service worker (no page CSP / page service worker involved). */
function fetchGuestHtmlViaBackground(jobId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ type: "FETCH_LINKEDIN_JOB", jobId }, (res) => {
      const err = chrome.runtime.lastError
      if (err) return reject(new Error(err.message))
      if (res?.ok) resolve(res.html)
      else reject(new Error(res?.error ?? "no response"))
    })
  })
}

/**
 * Fetches the job from LinkedIn's public job-posting endpoint (the one that powers
 * logged-out job pages). Its markup is stable and contains the FULL description, even
 * when the in-page one is collapsed behind "… more". Returns null on failure so the
 * caller can fall back to DOM scraping.
 */
const guestCache = new Map<string, ReturnType<typeof parseGuestHtml>>()
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** LinkedIn throttles this endpoint intermittently (HTTP 429) — retry with backoff. */
async function withRateLimitRetry(fn: () => Promise<string>): Promise<string> {
  const delays = [800, 2000, 4000]
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn()
    } catch (e) {
      if (!/429|999/.test((e as Error).message) || attempt >= delays.length) throw e
      await sleep(delays[attempt])
    }
  }
}

export async function fetchLinkedInGuestJob(jobId: string, diag: Diag = []) {
  const cached = guestCache.get(jobId)
  if (cached) return cached

  const routes: [string, (id: string) => Promise<string>][] = [
    ["page fetch", fetchGuestHtmlHere],
    ["background fetch", fetchGuestHtmlViaBackground]
  ]
  for (const [name, fn] of routes) {
    try {
      const job = parseGuestHtml(await withRateLimitRetry(() => fn(jobId)))
      if (job.description.length >= MIN_DESCRIPTION_CHARS) {
        guestCache.set(jobId, job)
        return job
      }
      diag.push(`${name}: response had no description`)
    } catch (e) {
      diag.push(`${name}: ${(e as Error).message || (e as Error).name}`)
    }
  }
  return null
}

/** Last-resort: find the "About the job" heading by its text and take its container. */
const ABOUT_HEADING =
  /^(about the job|about this job|job description|über den job|über die stelle|info zum job|stellenbeschreibung|à propos de l’offre d’emploi)$/i

function descriptionByHeading(): string {
  // Any leaf element — the new LinkedIn UI renders headings as plain divs/spans with hashed classes.
  const heads = Array.from(document.querySelectorAll("body *")).filter(
    (el) => el.childElementCount === 0 && ABOUT_HEADING.test(el.textContent?.trim() ?? "")
  )
  for (const h of heads) {
    let el: Element | null = h.parentElement
    while (el && el !== document.body) {
      const text = nodeToText(el)
      if (text.length >= 400) return text
      el = el.parentElement
    }
  }
  return ""
}

/** "Unity Developer | headraft | LinkedIn" → { title, company } */
function fromDocumentTitle() {
  const parts = document.title.replace(/^\(\d+\)\s*/, "").split(" | ").map((p) => p.trim())
  if (parts.length >= 3 && /linkedin/i.test(parts[parts.length - 1]))
    return { title: parts[0], company: parts[1] }
  return { title: "", company: "" }
}

// ---------- public API ----------

function fromSelectors(sel: typeof LINKEDIN, site: JobSite) {
  const titleEl = first(sel.title)
  const companyEl = first(sel.company)
  const locationEl = first(sel.location)
  const descEl = first(sel.description)

  let location = oneLine(locationEl?.textContent)
  // LinkedIn packs "Berlin, Germany · 2 weeks ago · 80 applicants" into one line.
  if (site === "linkedin") location = location.split("·")[0].trim()

  return {
    title: oneLine(titleEl?.textContent),
    company: oneLine(companyEl?.textContent),
    location,
    description: descEl ? nodeToText(descEl) : ""
  }
}

function stepstoneSectionsFallback(): string {
  // Older StepStone layouts split the ad into "section-text-*" blocks.
  const parts = Array.from(document.querySelectorAll('[data-at^="section-text-"]'))
  return cleanText(parts.map((p) => nodeToText(p)).join("\n\n"))
}

type JobFields = Omit<JobPosting, "site" | "url">

async function scrapeLinkedIn(diag: Diag): Promise<JobFields> {
  const jobId = linkedInJobId()
  diag.push(`job ID: ${jobId ?? "not in URL"}`)
  const guest = jobId ? await fetchLinkedInGuestJob(jobId, diag) : null
  // Guest data is authoritative for the selected job ID; the DOM only fills gaps.
  if (guest && guest.description.length >= MIN_DESCRIPTION_CHARS) {
    const dom = fromSelectors(LINKEDIN, "linkedin")
    const docTitle = fromDocumentTitle()
    return {
      title: guest.title || dom.title || docTitle.title,
      company: guest.company || dom.company || docTitle.company,
      location: guest.location || dom.location,
      description: guest.description
    }
  }

  const dom = fromSelectors(LINKEDIN, "linkedin")
  const ld = readJsonLd()
  const docTitle = fromDocumentTitle()
  let description = dom.description || ld?.description || ""
  diag.push(`page selectors: ${dom.description.length} chars`)
  if (description.length < MIN_DESCRIPTION_CHARS) {
    const byHeading = descriptionByHeading()
    diag.push(`"About the job" anchor: ${byHeading.length} chars`)
    if (byHeading.length > description.length) description = byHeading
  }
  return {
    title: dom.title || ld?.title || docTitle.title,
    company: dom.company || ld?.company || docTitle.company,
    location: dom.location || ld?.location || "",
    description
  }
}

function scrapeStepStone(): JobFields {
  const ld = readJsonLd()
  const dom = fromSelectors(STEPSTONE, "stepstone")
  return {
    title: ld?.title || dom.title,
    company: ld?.company || dom.company,
    location: ld?.location || dom.location,
    // Prefer whichever is richer — StepStone's JSON-LD occasionally truncates.
    description: [ld?.description ?? "", dom.description, stepstoneSectionsFallback()].sort(
      (a, b) => b.length - a.length
    )[0]
  }
}

/** Scrape the job currently on screen. Throws a user-readable Error if nothing is found. */
export async function scrapeJob(): Promise<JobPosting> {
  const site = detectSite()
  const diag: Diag = []
  const result = site === "linkedin" ? await scrapeLinkedIn(diag) : scrapeStepStone()

  if (result.description.length < MIN_DESCRIPTION_CHARS) {
    const h = heuristicDescription()
    if (h.length > result.description.length) result.description = h
  }

  if (result.description.length < MIN_DESCRIPTION_CHARS) {
    console.warn("[DeuTech Fit] scrape failed", diag)
    const base =
      site === "linkedin"
        ? "Couldn't find a job description. Click a job in the list so its details open on the right, then try again."
        : "Couldn't find a job description. Open a single job ad (not the search results), then try again."
    throw new Error(diag.length ? `${base}\n\nDetails: ${diag.join(" · ")}` : base)
  }

  return {
    site,
    url: location.href,
    title: result.title || document.title,
    company: result.company || "Unknown company",
    location: result.location || "Unknown location",
    description: result.description.slice(0, MAX_DESCRIPTION_CHARS)
  }
}
