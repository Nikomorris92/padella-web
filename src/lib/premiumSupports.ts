/** Libreria supporti premium PADELLA.
 *  Mapping: categoria menu → asset di supporto da posizionare sotto il cibo.
 *  Se esiste un PNG personalizzato in public/brand-references/supports/{name}.png lo usa,
 *  altrimenti genera un SVG stilizzato premium. */

export type SupportCategory = "pizza" | "pasta" | "dessert" | "drink" | "default";

/** Mappa categoria menu → tipo di supporto */
export function categoryToSupport(cat: string): SupportCategory {
  const c = cat.toLowerCase();
  if (c === "pizza" || c === "panini") return "pizza";
  if (c === "pasta" || c === "salad" || c === "starter") return "pasta";
  if (c === "dessert" || c === "breakfast") return "dessert";
  if (["cocktails","beer","coffee","smoothies","soft-drinks"].includes(c)) return "drink";
  return "default";
}

/** SVG di un tagliere ovale di legno premium con grain naturale e ombra. */
function woodBoardSvg(W: number, H: number): string {
  const cx = W / 2, cy = H * 0.55;
  const rx = Math.round(W * 0.42), ry = Math.round(H * 0.32);
  return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="woodGrad" cx="50%" cy="40%" r="60%">
        <stop offset="0%" stop-color="#C39A6E"/>
        <stop offset="50%" stop-color="#A87C50"/>
        <stop offset="100%" stop-color="#6B4A2A"/>
      </radialGradient>
      <filter id="boardShadow" x="-20%" y="-20%" width="140%" height="160%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="20"/>
        <feOffset dx="0" dy="30" result="off"/>
        <feComponentTransfer><feFuncA type="linear" slope="0.55"/></feComponentTransfer>
        <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#woodGrad)" filter="url(#boardShadow)"/>
    <!-- Wood grain lines -->
    <g opacity="0.20" stroke="#3D2517" stroke-width="1.2" fill="none">
      <path d="M ${cx-rx*0.85} ${cy-ry*0.4} Q ${cx-rx*0.2} ${cy-ry*0.55} ${cx+rx*0.7} ${cy-ry*0.45}"/>
      <path d="M ${cx-rx*0.8} ${cy-ry*0.1} Q ${cx} ${cy-ry*0.2} ${cx+rx*0.85} ${cy-ry*0.05}"/>
      <path d="M ${cx-rx*0.75} ${cy+ry*0.15} Q ${cx-rx*0.1} ${cy+ry*0.25} ${cx+rx*0.8} ${cy+ry*0.1}"/>
      <path d="M ${cx-rx*0.7} ${cy+ry*0.4} Q ${cx} ${cy+ry*0.45} ${cx+rx*0.75} ${cy+ry*0.35}"/>
    </g>
    <!-- Subtle highlight rim top -->
    <ellipse cx="${cx-rx*0.15}" cy="${cy-ry*0.7}" rx="${rx*0.4}" ry="${ry*0.06}" fill="#E8C699" opacity="0.25"/>
  </svg>`;
}

/** SVG bowl scura premium con riflesso interno. */
function premiumBowlSvg(W: number, H: number): string {
  const cx = W / 2, cy = H * 0.56;
  const rx = Math.round(W * 0.34), ry = Math.round(H * 0.28);
  return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="bowlGrad" cx="50%" cy="35%" r="60%">
        <stop offset="0%" stop-color="#3a3a3a"/>
        <stop offset="60%" stop-color="#1a1a1a"/>
        <stop offset="100%" stop-color="#0a0a0a"/>
      </radialGradient>
      <filter id="bowlShadow" x="-20%" y="-20%" width="140%" height="160%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="18"/>
        <feOffset dx="0" dy="28" result="off"/>
        <feComponentTransfer><feFuncA type="linear" slope="0.6"/></feComponentTransfer>
        <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    <!-- Outer bowl ellipse -->
    <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#bowlGrad)" filter="url(#bowlShadow)"/>
    <!-- Inner depth (slightly smaller, darker) -->
    <ellipse cx="${cx}" cy="${cy + ry*0.05}" rx="${rx*0.85}" ry="${ry*0.78}" fill="#070707" opacity="0.65"/>
    <!-- Top rim highlight -->
    <ellipse cx="${cx}" cy="${cy - ry*0.9}" rx="${rx*0.85}" ry="${ry*0.08}" fill="#5a5a5a" opacity="0.35"/>
    <!-- Subtle reflection -->
    <ellipse cx="${cx - rx*0.4}" cy="${cy - ry*0.5}" rx="${rx*0.3}" ry="${ry*0.08}" fill="#ffffff" opacity="0.10" transform="rotate(-20 ${cx-rx*0.4} ${cy-ry*0.5})"/>
  </svg>`;
}

/** SVG piatto bianco premium ovale con ombra delicata. */
function premiumPlateSvg(W: number, H: number): string {
  const cx = W / 2, cy = H * 0.55;
  const rx = Math.round(W * 0.40), ry = Math.round(H * 0.30);
  return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="plateGrad" cx="50%" cy="40%" r="55%">
        <stop offset="0%" stop-color="#F5F1E8"/>
        <stop offset="70%" stop-color="#E0DAC8"/>
        <stop offset="100%" stop-color="#B4AC95"/>
      </radialGradient>
      <filter id="plateShadow" x="-20%" y="-20%" width="140%" height="160%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="22"/>
        <feOffset dx="0" dy="32" result="off"/>
        <feComponentTransfer><feFuncA type="linear" slope="0.5"/></feComponentTransfer>
        <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#plateGrad)" filter="url(#plateShadow)"/>
    <!-- Inner ring (plate edge) -->
    <ellipse cx="${cx}" cy="${cy}" rx="${rx*0.82}" ry="${ry*0.78}" fill="none" stroke="#9C9275" stroke-width="1.5" opacity="0.4"/>
  </svg>`;
}

/** SVG sottobicchiere premium per drink. */
function drinkCoasterSvg(W: number, H: number): string {
  const cx = W / 2, cy = H * 0.62;
  const r = Math.round(Math.min(W, H) * 0.16);
  return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="coasterGrad" cx="50%" cy="50%" r="60%">
        <stop offset="0%" stop-color="#2a1a0a"/>
        <stop offset="80%" stop-color="#1a0e05"/>
        <stop offset="100%" stop-color="#0a0703"/>
      </radialGradient>
      <filter id="coasterShadow" x="-30%" y="-30%" width="160%" height="180%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="15"/>
        <feOffset dx="0" dy="20" result="off"/>
        <feComponentTransfer><feFuncA type="linear" slope="0.5"/></feComponentTransfer>
        <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#coasterGrad)" filter="url(#coasterShadow)"/>
    <circle cx="${cx}" cy="${cy}" r="${r*0.85}" fill="none" stroke="#5C3A1E" stroke-width="1.5" opacity="0.4"/>
  </svg>`;
}

export function generateSupportSvg(category: SupportCategory, W: number, H: number): string {
  switch (category) {
    case "pizza":   return woodBoardSvg(W, H);
    case "pasta":   return premiumBowlSvg(W, H);
    case "dessert": return premiumPlateSvg(W, H);
    case "drink":   return drinkCoasterSvg(W, H);
    case "default": return premiumPlateSvg(W, H);
  }
}
