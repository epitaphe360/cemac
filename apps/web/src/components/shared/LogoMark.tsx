/**
 * LogoMark — CEMAC INTEGRA brand mark
 * Geometric floral hub inspired by the regional integration identity.
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
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      <circle cx="20" cy="20" r="19" fill="#0B1F17" stroke="#3DDC97" strokeOpacity="0.35" strokeWidth="1" />
      {/* petals */}
      {[0, 60, 120, 180, 240, 300].map((deg) => {
        const rad = (deg * Math.PI) / 180
        const x = 20 + Math.cos(rad) * 9
        const y = 20 + Math.sin(rad) * 9
        return (
          <ellipse
            key={deg}
            cx={x}
            cy={y}
            rx="4.2"
            ry="7.2"
            fill="#3DDC97"
            fillOpacity="0.9"
            transform={`rotate(${deg + 90} ${x} ${y})`}
          />
        )
      })}
      <circle cx="20" cy="20" r="5.2" fill="#D4AF37" />
      <circle cx="20" cy="20" r="2.4" fill="#0B1F17" />
    </svg>
  )
}
