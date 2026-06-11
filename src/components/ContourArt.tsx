/**
 * Faded topographic contour rings: the watch-zone motif. One hand-authored
 * blob path repeated as concentric rings scaled about a focal point, plus a
 * smaller offset family for an organic two-peak feel. The wrapper mask fades
 * the rings out toward the top so they never compete with nav rows.
 * Strokes stay crisp 1px at any scale via vector-effect.
 */

const BLOB =
  "M210 60 C 290 54 352 108 354 170 C 356 234 290 286 205 283 " +
  "C 118 280 62 230 64 168 C 66 108 132 66 210 60 Z";
const CX = 210;
const CY = 170;
const RINGS = [1, 0.8, 0.62, 0.46, 0.32, 0.2];

export function ContourArt({
  className = "",
  opacity = 0.08,
}: {
  className?: string;
  opacity?: number;
}) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none ${className}`}
      style={{
        opacity,
        maskImage: "linear-gradient(to top, black 45%, transparent 100%)",
        WebkitMaskImage: "linear-gradient(to top, black 45%, transparent 100%)",
      }}
    >
      <svg
        viewBox="0 0 420 340"
        fill="none"
        className="h-full w-full"
        preserveAspectRatio="xMidYMax slice"
      >
        <g stroke="currentColor" strokeWidth="1">
          {RINGS.map((k) => (
            <path
              key={k}
              d={BLOB}
              vectorEffect="non-scaling-stroke"
              transform={`translate(${CX * (1 - k)} ${CY * (1 - k)}) scale(${k})`}
            />
          ))}
        </g>
        {/* Secondary, smaller ring family peeking in from the upper left. */}
        <g
          stroke="currentColor"
          strokeWidth="1"
          transform="translate(-150 -150) scale(0.55)"
        >
          {RINGS.slice(2).map((k) => (
            <path
              key={k}
              d={BLOB}
              vectorEffect="non-scaling-stroke"
              transform={`translate(${CX * (1 - k)} ${CY * (1 - k)}) scale(${k})`}
            />
          ))}
        </g>
        {/* The watch-zone pin at the contour center. */}
        <circle cx={CX} cy={CY} r="3" fill="currentColor" />
      </svg>
    </div>
  );
}
