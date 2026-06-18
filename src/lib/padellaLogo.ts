/** Logo PADELLA come stringa SVG — usato per compositing programmatico sulle foto AI.
 *  Identico al PadellaRacketLogo del frontend ma su sfondo trasparente.
 *  Width/height in pixel (output PNG via sharp). */
export function padellaLogoSvg(widthPx: number): string {
  const w = widthPx;
  const h = Math.round(widthPx * 0.4); // proporzioni ~5:2

  // Coordinate normalizzate per il logo
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 500 200">
  <!-- Icona racchetta+padella a sinistra -->
  <g transform="translate(50, 60)">
    <!-- Bordo padella -->
    <circle cx="30" cy="35" r="28" fill="#F5E6D3" opacity="0.55"/>
    <!-- Interno padella -->
    <circle cx="30" cy="35" r="22" fill="#F5E6D3"/>
    <!-- Shadow interno -->
    <circle cx="32" cy="37" r="17" fill="#0a0a0a" opacity="0.10"/>
    <!-- Highlight -->
    <ellipse cx="21" cy="27" rx="6" ry="3" fill="#FFFFFF" opacity="0.30" transform="rotate(-25 21 27)"/>
    <!-- Junction -->
    <rect x="56" y="31" width="6" height="8" rx="1.5" fill="#F5E6D3" opacity="0.65"/>
    <!-- Manico -->
    <rect x="60" y="30" width="35" height="10" rx="3.5" fill="#F5E6D3" opacity="0.85"/>
    <!-- Cordini grip -->
    <g stroke="#0a0a0a" stroke-width="0.7" opacity="0.32">
      <line x1="65" y1="31" x2="67" y2="39"/>
      <line x1="71" y1="31" x2="73" y2="39"/>
      <line x1="77" y1="31" x2="79" y2="39"/>
      <line x1="83" y1="31" x2="85" y2="39"/>
      <line x1="89" y1="31" x2="91" y2="39"/>
    </g>
    <!-- Cap -->
    <ellipse cx="98" cy="35" rx="4" ry="6" fill="#F5E6D3" opacity="0.92"/>
  </g>

  <!-- Scritta PADELLA -->
  <text x="180" y="105" font-family="Georgia, 'Times New Roman', serif" font-size="58" font-weight="700" fill="#F5E6D3" letter-spacing="6">PADELLA</text>

  <!-- Linea divisoria -->
  <line x1="180" y1="125" x2="450" y2="125" stroke="#F5E6D3" stroke-width="1.2" opacity="0.6"/>

  <!-- Tagline -->
  <text x="195" y="160" font-family="Georgia, 'Times New Roman', serif" font-size="22" font-weight="300" fill="#F5E6D3" opacity="0.85" letter-spacing="4">bites and vibes</text>
</svg>`;
}
