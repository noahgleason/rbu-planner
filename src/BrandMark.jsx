import React, { useId } from "react";

// Mission Manifest's mark: a hot lightning bolt breaking out of an electric
// blue badge, with speed streaks and a spark — energy and motion without
// borrowing anyone's trademark (no bulls, no sun disc, no wordmark).
// Shared by the planner header and the marketing site. Gradient ids come
// from useId so two marks on one page never collide.
export default function BrandMark({ size = 32, title = "Mission Manifest" }) {
  const id = useId().replace(/:/g, "");
  const bg = `mm-bg-${id}`;
  const bolt = `mm-bolt-${id}`;
  const glow = `mm-glow-${id}`;
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" role="img" aria-label={title} style={{ flexShrink: 0 }}>
      <defs>
        <linearGradient id={bg} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1B6AEE" />
          <stop offset="1" stopColor="#0A2A66" />
        </linearGradient>
        <linearGradient id={bolt} x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0" stopColor="#FFE14D" />
          <stop offset="0.5" stopColor="#FF8A1F" />
          <stop offset="1" stopColor="#F0194A" />
        </linearGradient>
        <radialGradient id={glow} cx="0.62" cy="0.45" r="0.55">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.28" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x="1" y="1" width="38" height="38" rx="10" fill={`url(#${bg})`} />
      <rect x="1" y="1" width="38" height="38" rx="10" fill={`url(#${glow})`} />
      <g stroke="#FFFFFF" strokeLinecap="round" strokeWidth="2.2">
        <line x1="6" y1="15.5" x2="13" y2="15.5" opacity="0.85" />
        <line x1="4.5" y1="21" x2="10.5" y2="21" opacity="0.6" />
        <line x1="7" y1="26.5" x2="12" y2="26.5" opacity="0.4" />
      </g>
      <path
        d="M25.5 4.5 L12.5 22.5 H20.5 L17 35.5 L31.5 15.5 H23.2 Z"
        fill={`url(#${bolt})`}
        stroke="#FFFFFF"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path d="M32.5 5.5 L33.4 8.4 L36.3 9.3 L33.4 10.2 L32.5 13.1 L31.6 10.2 L28.7 9.3 L31.6 8.4 Z" fill="#FFFFFF" />
    </svg>
  );
}

// Decorative art anchored to the bottom of the planner's left rail — a big,
// faded version of the mark (bolt, energy rings, speed streaks, sparks) so
// the empty space under the roster reads as intentional. Purely visual.
export function RailArt() {
  const id = useId().replace(/:/g, "");
  const bolt = `ra-bolt-${id}`;
  const fade = `ra-fade-${id}`;
  return (
    <svg className="rail-art-svg" viewBox="0 0 200 240" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={bolt} x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0" stopColor="#FFD23F" />
          <stop offset="0.5" stopColor="#FF8A1F" />
          <stop offset="1" stopColor="#F0194A" />
        </linearGradient>
        <linearGradient id={fade} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#1B6AEE" stopOpacity="0" />
          <stop offset="1" stopColor="#1B6AEE" stopOpacity="0.35" />
        </linearGradient>
      </defs>
      <g fill="none" stroke="#1B6AEE" strokeWidth="1.5">
        <circle cx="112" cy="128" r="58" opacity="0.14" strokeDasharray="4 7" />
        <circle cx="112" cy="128" r="84" opacity="0.10" />
        <circle cx="112" cy="128" r="110" opacity="0.07" strokeDasharray="2 9" />
      </g>
      <g fill="#1B6AEE" opacity="0.18">
        {[0, 1, 2, 3].map((r) => [0, 1, 2, 3].map((c) => (
          <circle key={`${r}-${c}`} cx={150 + c * 10} cy={24 + r * 10} r="1.6" />
        )))}
      </g>
      <g stroke={`url(#${fade})`} strokeLinecap="round" strokeWidth="5">
        <line x1="14" y1="98" x2="66" y2="98" />
        <line x1="4" y1="122" x2="50" y2="122" />
        <line x1="20" y1="146" x2="58" y2="146" />
        <line x1="10" y1="170" x2="40" y2="170" />
      </g>
      <path
        d="M124 22 L56 132 H102 L82 226 L166 98 H116 Z"
        fill={`url(#${bolt})`}
        fillOpacity="0.22"
        stroke={`url(#${bolt})`}
        strokeWidth="3"
        strokeLinejoin="round"
        strokeOpacity="0.75"
      />
      <g fill="#FF8A1F" opacity="0.8">
        <path d="M172 60 L174.5 67.5 L182 70 L174.5 72.5 L172 80 L169.5 72.5 L162 70 L169.5 67.5 Z" />
        <path d="M40 200 L41.5 204.5 L46 206 L41.5 207.5 L40 212 L38.5 207.5 L34 206 L38.5 204.5 Z" opacity="0.7" />
      </g>
    </svg>
  );
}
