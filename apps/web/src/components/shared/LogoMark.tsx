/**
 * LogoMark — CEMAC INTEGRA brand mark
 * A hexagonal hub-and-spoke icon representing the 6 interconnected CEMAC nations.
 */
interface LogoMarkProps {
  size?: number
  className?: string
}

export function LogoMark({ size = 36, className = '' }: LogoMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      {/* Hexagonal background — pointy-top, circumradius 16 */}
      <path
        d="M18 2L32 10V26L18 34L4 26V10Z"
        fill="#1e6b5e"
      />
      {/* Inner accent ring */}
      <path
        d="M18 5.5L29.5 11.75V24.25L18 30.5L6.5 24.25V11.75Z"
        fill="none"
        stroke="white"
        strokeWidth="0.6"
        strokeOpacity="0.2"
      />
      {/* 6 spokes from center to outer nodes */}
      <line x1="18" y1="18" x2="18" y2="11.2"        stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeOpacity="0.55" />
      <line x1="18" y1="18" x2="24" y2="14.6"        stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeOpacity="0.55" />
      <line x1="18" y1="18" x2="24" y2="21.4"        stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeOpacity="0.55" />
      <line x1="18" y1="18" x2="18" y2="24.8"        stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeOpacity="0.55" />
      <line x1="18" y1="18" x2="12" y2="21.4"        stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeOpacity="0.55" />
      <line x1="18" y1="18" x2="12" y2="14.6"        stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeOpacity="0.55" />
      {/* 6 outer nodes — one per CEMAC country */}
      <circle cx="18"   cy="9"    r="2"   fill="white" />
      <circle cx="25.8" cy="13.5" r="2"   fill="white" />
      <circle cx="25.8" cy="22.5" r="2"   fill="white" />
      <circle cx="18"   cy="27"   r="2"   fill="white" />
      <circle cx="10.2" cy="22.5" r="2"   fill="white" />
      <circle cx="10.2" cy="13.5" r="2"   fill="white" />
      {/* Central hub */}
      <circle cx="18" cy="18" r="3.2" fill="white" />
    </svg>
  )
}
