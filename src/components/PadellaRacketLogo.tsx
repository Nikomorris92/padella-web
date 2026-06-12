/** Logo Padella Bangkok — padella (pan body) con manico stile racchetta da padel. */
export default function PadellaRacketLogo({
  size = 40,
  className = "",
}: { size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Padella Bangkok"
    >
      {/* Bordo padella (rim esterno) */}
      <circle cx="38" cy="50" r="28" fill="currentColor" opacity="0.55" />
      {/* Interno padella (no forellini) */}
      <circle cx="38" cy="50" r="23" fill="currentColor" />
      {/* Inner shadow (concavo) */}
      <circle cx="40" cy="52" r="18" fill="#0a0a0a" opacity="0.10" />
      {/* Highlight metallico in alto-sinistra */}
      <ellipse cx="29" cy="42" rx="7" ry="3.5" fill="#FFFFFF" opacity="0.30" transform="rotate(-25 29 42)" />

      {/* Junction body→handle */}
      <rect x="63" y="46" width="6" height="8" rx="1.5" fill="currentColor" opacity="0.65" />

      {/* Manico racchetta (con grip wraps) */}
      <rect x="68" y="45" width="28" height="10" rx="3.5" fill="currentColor" opacity="0.85" />
      {/* Grip wraps orizzontali stilizzati */}
      <g stroke="#0a0a0a" strokeWidth="0.7" opacity="0.32">
        <line x1="71" y1="46" x2="73" y2="54" />
        <line x1="75" y1="46" x2="77" y2="54" />
        <line x1="79" y1="46" x2="81" y2="54" />
        <line x1="83" y1="46" x2="85" y2="54" />
        <line x1="87" y1="46" x2="89" y2="54" />
        <line x1="91" y1="46" x2="93" y2="54" />
      </g>

      {/* Cap finale del manico */}
      <ellipse cx="96" cy="50" rx="3.5" ry="5.5" fill="currentColor" opacity="0.92" />
    </svg>
  );
}
