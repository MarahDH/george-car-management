interface LogoProps {
  className?: string
  /** Unique suffix so multiple logos on one page don't share gradient ids. */
  id?: string
}

/** GEORGE monogram — an angular metallic "G" with a blue accent edge. */
export default function Logo({ className = 'h-10 w-10', id = 'g' }: LogoProps) {
  const silver = `${id}-silver`
  const blue = `${id}-blue`
  return (
    <svg viewBox="0 0 100 100" className={className} role="img" aria-label="GEORGE">
      <defs>
        <linearGradient id={silver} x1="0.15" y1="0" x2="0.4" y2="1">
          <stop offset="0" stopColor="#f7f9fb" />
          <stop offset="0.45" stopColor="#d0d7de" />
          <stop offset="0.75" stopColor="#aab3bd" />
          <stop offset="1" stopColor="#828d99" />
        </linearGradient>
        <linearGradient id={blue} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#4b8ee8" />
          <stop offset="1" stopColor="#123f8c" />
        </linearGradient>
      </defs>
      {/* blue edge underneath, offset down-right */}
      <path d="M75 31 H33 V71 H75 V53 H54" fill="none" stroke={`url(#${blue})`} strokeWidth="15" strokeLinejoin="miter" strokeLinecap="butt" />
      {/* silver face on top */}
      <path d="M72 28 H30 V68 H72 V50 H51" fill="none" stroke={`url(#${silver})`} strokeWidth="12" strokeLinejoin="miter" strokeLinecap="butt" />
    </svg>
  )
}
