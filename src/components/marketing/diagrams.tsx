export function ZonePolygonDiagram() {
  return (
    <svg viewBox="0 0 400 280" className="block w-full h-full" aria-hidden="true">
      <defs>
        <pattern id="zd-grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M20 0H0V20" stroke="var(--rule)" strokeWidth="0.4" fill="none" />
        </pattern>
      </defs>
      <rect width="400" height="280" fill="var(--paper-card)" />
      <rect width="400" height="280" fill="url(#zd-grid)" />
      <path
        d="M70 80 L150 50 L240 60 L300 110 L320 200 L240 240 L130 230 L80 170 Z"
        fill="rgba(30,155,227,0.10)"
        stroke="var(--rust)"
        strokeWidth="1.6"
        strokeDasharray="4 5"
      />
      {[
        [120, 120],
        [200, 100],
        [240, 170],
        [180, 200],
        [280, 150],
      ].map(([x, y], i) => (
        <g key={i} transform={`translate(${x},${y})`}>
          <circle r="4.5" fill="var(--ink)" />
          <circle r="1.5" fill="var(--paper)" />
        </g>
      ))}
      {[
        [70, 80],
        [150, 50],
        [240, 60],
        [300, 110],
        [320, 200],
        [240, 240],
        [130, 230],
        [80, 170],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="3.5" fill="var(--paper)" stroke="var(--rust)" strokeWidth="1.5" />
      ))}
    </svg>
  );
}

export function BroadcastDiagram() {
  return (
    <svg viewBox="0 0 400 280" className="block w-full h-full" aria-hidden="true">
      <defs>
        <pattern id="bd-grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M20 0H0V20" stroke="var(--rule)" strokeWidth="0.4" fill="none" />
        </pattern>
      </defs>
      <rect width="400" height="280" fill="var(--paper-card)" />
      <rect width="400" height="280" fill="url(#bd-grid)" />
      <g transform="translate(200,140)">
        {[40, 75, 115, 150].map((r, i) => (
          <circle
            key={i}
            r={r}
            fill="none"
            stroke="var(--rust)"
            strokeWidth={1.4 - i * 0.2}
            strokeDasharray="3 5"
            opacity={0.7 - i * 0.15}
          />
        ))}
        <circle r="9" fill="var(--rust)" />
        <circle r="3" fill="var(--paper)" />
      </g>
      {[
        [80, 60],
        [320, 70],
        [80, 220],
        [330, 220],
        [50, 140],
        [350, 140],
      ].map(([x, y], i) => (
        <g key={i} transform={`translate(${x - 12},${y - 18})`}>
          <rect x="0" y="0" width="24" height="36" rx="4" fill="var(--paper)" stroke="var(--ink)" strokeWidth="1.5" />
          <rect x="3" y="5" width="18" height="22" fill="var(--rust-soft)" />
          <circle cx="12" cy="32" r="1.5" fill="var(--ink)" />
        </g>
      ))}
    </svg>
  );
}

export function PhonePingDiagram() {
  return (
    <svg viewBox="0 0 200 280" className="block w-full h-full" aria-hidden="true">
      <rect x="40" y="20" width="120" height="240" rx="18" fill="var(--paper)" stroke="var(--ink)" strokeWidth="1.6" />
      <rect x="48" y="42" width="104" height="200" rx="3" fill="var(--paper-2)" />
      <g>
        <rect x="54" y="60" width="92" height="56" rx="6" fill="var(--paper-card)" stroke="var(--rust)" strokeWidth="1.5" />
        <circle cx="68" cy="76" r="5" fill="var(--rust)" />
        <rect x="80" y="71" width="56" height="3" rx="1.5" fill="var(--ink)" />
        <rect x="80" y="80" width="40" height="2.5" rx="1.5" fill="var(--ink-3)" />
        <rect x="62" y="92" width="74" height="3" rx="1.5" fill="var(--ink-2)" />
        <rect x="62" y="100" width="50" height="3" rx="1.5" fill="var(--ink-2)" />
      </g>
      <circle cx="100" cy="252" r="3" fill="var(--ink-3)" />
    </svg>
  );
}
