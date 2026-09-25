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

// Background for the planner's main panel: a few bundles of flowing
// ribbons in Red Bull red, yellow, and navy that drift slowly, with small
// dashes travelling along some lines. One big composition (no tiling), kept
// in view with sticky positioning and painted behind the cards, so it only
// shows in the gaps between them. Motion stops for prefers-reduced-motion.
function ribbon(y, i, lift, dip, tail) {
  return `M -120 ${y + i * 13} C 320 ${y - lift + i * 9}, 700 ${y + dip + i * 7}, 1340 ${y - tail + i * 12}`;
}

const BUNDLES = [
  { key: "red", y: 150, lift: 150, dip: 190, tail: 60, count: 7, color: "#DB0A40", opacity: 0.16 },
  { key: "navy", y: 400, lift: 110, dip: 130, tail: -30, count: 5, color: "#001C39", opacity: 0.07 },
  { key: "yellow", y: 600, lift: 170, dip: 120, tail: 90, count: 6, color: "#FFC906", opacity: 0.45 },
];

export function FlowBackground() {
  return (
    <div className="flow-bg" aria-hidden="true">
      <svg viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice">
        {BUNDLES.map((b) => (
          <g key={b.key} className={`flow-bundle flow-bundle-${b.key}`} fill="none" stroke={b.color}>
            {Array.from({ length: b.count }, (_, i) => (
              <path
                key={i}
                d={ribbon(b.y, i, b.lift, b.dip, b.tail)}
                strokeWidth={i === Math.floor(b.count / 2) ? 2.4 : 1.2}
                strokeOpacity={b.opacity * (1 - Math.abs(i - b.count / 2) / b.count)}
              />
            ))}
            <path
              className="flow-dashes"
              d={ribbon(b.y, Math.floor(b.count / 2), b.lift, b.dip, b.tail)}
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeDasharray="1 46"
              strokeOpacity={Math.min(1, b.opacity * 3.5)}
            />
          </g>
        ))}
      </svg>
    </div>
  );
}
