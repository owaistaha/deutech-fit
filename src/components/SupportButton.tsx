export const SUPPORT_URL = "https://buymeacoffee.com/owaistaha6h"

/**
 * "Buy me a coffee" donation link. Payment happens entirely on buymeacoffee.com in a new tab —
 * the extension never sees or handles any payment data.
 *  - "button": Buy Me a Coffee yellow pill (settings page)
 *  - "card":   small thank-you card with the button (side panel / overlay, after results)
 */
export function SupportButton({ variant = "button" }: { variant?: "button" | "card" }) {
  const button = (
    <a
      href={SUPPORT_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#FFDD00] px-3.5 py-1.5 text-xs font-semibold text-slate-900 no-underline shadow-sm transition hover:bg-[#ffe633] hover:shadow-md">
      <span aria-hidden="true">☕</span> Buy me a coffee
    </a>
  )

  if (variant === "button") return button

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-700/60 bg-slate-800/40 px-3 py-2.5">
      <p className="text-xs leading-snug text-slate-400">
        DeuTech Fit is free. If it helped you, you can support it.
      </p>
      {button}
    </div>
  )
}
