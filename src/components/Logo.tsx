import { useId } from "react"

/**
 * DeuTech Fit logo, the same artwork as assets/icon.svg. It's inlined so it works inside the
 * content-script shadow DOM without needing a web_accessible_resources image.
 */
export function Logo({ size = 28, className = "" }: { size?: number; className?: string }) {
  const id = useId().replace(/:/g, "")
  return (
    <svg
      viewBox="6 6 116 116"
      width={size}
      height={size}
      className={`shrink-0 ${className}`}
      role="img"
      aria-label="DeuTech Fit">
      <defs>
        <linearGradient id={`bg${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6366F1" />
          <stop offset="1" stopColor="#9333EA" />
        </linearGradient>
        <linearGradient id={`sh${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.22" />
          <stop offset="0.55" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
        <clipPath id={`fl${id}`}>
          <circle cx="97" cy="97" r="16" />
        </clipPath>
      </defs>
      <rect x="6" y="6" width="116" height="116" rx="28" fill={`url(#bg${id})`} />
      <rect x="6" y="6" width="116" height="116" rx="28" fill={`url(#sh${id})`} />
      <path d="M31 63 L52 84 L92 41" fill="none" stroke="#FFFFFF" strokeWidth="15" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="97" cy="97" r="20.5" fill="#FFFFFF" />
      <g clipPath={`url(#fl${id})`}>
        <rect x="81" y="81" width="32" height="10.67" fill="#111111" />
        <rect x="81" y="91.67" width="32" height="10.67" fill="#DD0000" />
        <rect x="81" y="102.33" width="32" height="10.67" fill="#FFCE00" />
      </g>
    </svg>
  )
}
