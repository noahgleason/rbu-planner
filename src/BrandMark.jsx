import React, { useId } from "react";

// Red Bull Mission Manifest's mark: an "RBMM" badge in the brand's red,
// yellow, and navy — a bold italic wordmark on a red chip with a yellow
// speed slash. Deliberately not the Red Bull logo (no bulls, no sun disc).
// Shared by the planner header and the marketing site. textLength pins the
// wordmark's width so it fits whatever font the browser falls back to;
// the clip id comes from useId so two marks on one page never collide.
export default function BrandMark({ height = 32, title = "Red Bull Mission Manifest" }) {
  const id = useId().replace(/:/g, "");
  const clip = `rbmm-clip-${id}`;
  return (
    <svg
      height={height}
      width={(height * 88) / 40}
      viewBox="0 0 88 40"
      role="img"
      aria-label={title}
      style={{ flexShrink: 0, display: "block" }}
    >
      <defs>
        <clipPath id={clip}>
          <rect x="0" y="0" width="88" height="40" rx="8" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clip})`}>
        <rect x="0" y="0" width="88" height="40" fill="#DB0A40" />
        <path d="M60 40 L74 0 H88 V40 Z" fill="#B00833" />
        <path d="M-2 34 H30 L27 40 H-2 Z" fill="#FFC906" />
      </g>
      <text
        x="44"
        y="27.5"
        textAnchor="middle"
        textLength="70"
        lengthAdjust="spacingAndGlyphs"
        fill="#FFFFFF"
        fontFamily="'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif"
        fontSize="22"
        fontWeight="900"
        fontStyle="italic"
        letterSpacing="-0.5"
      >
        RBMM
      </text>
    </svg>
  );
}
