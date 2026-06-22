"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import OfficialLogo from "@/components/OfficialLogo";

const slides = [
  { word: "PLAY.",    sub: "World-class padel courts under the Bangkok sky",    color: "from-[#1B3A2D] via-[#1B3A2D] to-[#0f2419]" },
  { word: "RELAX.",   sub: "Dive into the Mediterranean at our luxury pool",     color: "from-[#1B3A2D] via-[#163322] to-[#0d2218]" },
  { word: "EAT.",     sub: "Authentic Italian cuisine crafted with soul",         color: "from-[#1B3A2D] via-[#2a2a1a] to-[#1B3A2D]" },
  { word: "CONNECT.", sub: "Where Bangkok's best gather to live the Italian way", color: "from-[#0f2419] via-[#1B3A2D] to-[#2a2a1a]" },
];

/** Logo grande verticale per la HeroSection: padella liscia sopra + manico racchetta sotto. */
function PadelRacket({ className }: { className?: string }) {
  const cx = 60, cy = 88, rOuter = 56, rInner = 50, rim = 6;
  return (
    <svg viewBox="0 0 120 260" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* === Bordo padella (rim esterno) === */}
      <circle cx={cx} cy={cy} r={rOuter} fill="currentColor" opacity="0.55" />
      {/* === Interno padella (concavo) === */}
      <circle cx={cx} cy={cy} r={rOuter - rim} fill="currentColor" opacity="0.95" />
      {/* === Inner shadow del fondo padella (gradient feel via overlay) === */}
      <circle cx={cx + 4} cy={cy + 4} r={rOuter - rim - 6} fill="#0a0a0a" opacity="0.10" />
      {/* === Highlight metallico (suggerisce padella) === */}
      <ellipse cx={cx - 18} cy={cy - 18} rx="14" ry="7" fill="#FFFFFF" opacity="0.25" transform={`rotate(-25 ${cx - 18} ${cy - 18})`} />
      <ellipse cx={cx - 22} cy={cy + 8} rx="3" ry="14" fill="#FFFFFF" opacity="0.10" transform={`rotate(-15 ${cx - 22} ${cy + 8})`} />

      {/* === Junction body→handle (saldatura) === */}
      <rect x={cx - 14} y={cy + rOuter - 4} width="28" height="14" rx="3" fill="currentColor" opacity="0.65" />

      {/* === Manico racchetta (lungo, con grip) === */}
      <rect x={cx - 10} y={cy + rOuter + 8} width="20" height="108" rx="7" fill="currentColor" opacity="0.78" />
      {/* Grip wraps orizzontali (a spirale stilizzata) */}
      {Array.from({ length: 10 }).map((_, i) => {
        const y = cy + rOuter + 14 + i * 10;
        return (
          <line key={`wrap-${i}`} x1={cx - 10} y1={y} x2={cx + 10} y2={y + 3}
                stroke="#0a0a0a" strokeWidth="0.7" opacity="0.32" />
        );
      })}
      {/* Linea centrale verticale del grip */}
      <line x1={cx} y1={cy + rOuter + 12} x2={cx} y2={cy + rOuter + 112} stroke="#0a0a0a" strokeWidth="0.4" opacity="0.18" />

      {/* === Cap finale del manico === */}
      <ellipse cx={cx} cy={cy + rOuter + 120} rx="11" ry="6" fill="currentColor" opacity="0.92" />
    </svg>
  );
}

export default function HeroSection() {
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(true);
  const timer = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const sectionRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] });
  const racketY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const racketRotate = useTransform(scrollYProgress, [0, 1], [-15, 30]);
  const racketOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  useEffect(() => {
    if (playing) {
      timer.current = setInterval(() => setCurrent(c => (c + 1) % slides.length), 4500);
    }
    return () => clearInterval(timer.current);
  }, [playing]);

  const slide = slides[current];

  return (
    <section ref={sectionRef} className="relative min-h-screen flex items-center justify-center overflow-hidden">

      {/* Animated gradient background */}
      <motion.div
        key={current}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ duration: 1.4 }}
        className={`absolute inset-0 bg-gradient-to-br ${slide.color}`}
      />

      {/* Grid texture */}
      <div className="absolute inset-0 opacity-[0.025]"
        style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)", backgroundSize: "60px 60px" }}
      />

      {/* Radial gold glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_40%,rgba(201,168,76,0.07),transparent)]" />

      {/* Ambient decorative elements removed — official logo is the only brand mark */}

      {/* ── MAIN CONTENT ── */}
      <div className="container-padella relative z-10 text-center px-6">

        {/* ── Official PADELLA brand logo ── */}
        <motion.div
          initial={{ opacity: 0, y: -30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.9, ease: [0.4, 0, 0.2, 1] }}
          className="flex items-center justify-center mb-2"
        >
          <div style={{ width: "clamp(280px, 60vw, 640px)" }}>
            <OfficialLogo size={640} priority className="w-full h-auto" />
          </div>
        </motion.div>

        {/* Location line with flag accents */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35, duration: 0.7 }}
          className="flex items-center justify-center gap-2 mb-10"
        >
          <span className="inline-flex rounded overflow-hidden" style={{ height: "10px" }}>
            <span className="block w-[5px] h-full bg-[#009246]" />
            <span className="block w-[5px] h-full bg-[#f0f0f0]" />
            <span className="block w-[5px] h-full bg-[#CE2B37]" />
          </span>
          <span className="text-padella-gold/55 text-[10px] md:text-[11px] font-semibold tracking-[0.35em] uppercase">Bangkok · Italian Destination</span>
          <span className="inline-flex rounded overflow-hidden" style={{ height: "10px" }}>
            <span className="block w-[5px] h-full bg-[#009246]" />
            <span className="block w-[5px] h-full bg-[#f0f0f0]" />
            <span className="block w-[5px] h-full bg-[#CE2B37]" />
          </span>
        </motion.div>

        {/* Rotating slide word */}
        <motion.div
          key={`word-${current}`}
          initial={{ opacity: 0, y: 50, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.65, ease: [0.4, 0, 0.2, 1] }}
          className="mb-4"
        >
          <span
            className="font-display font-bold text-padella-cream/85 leading-none inline-block"
            style={{ fontSize: "clamp(2.2rem, 8vw, 6rem)", letterSpacing: "-0.02em" }}
          >
            {slide.word}
          </span>
        </motion.div>

        {/* Subtitle */}
        <motion.p
          key={`sub-${current}`}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.15 }}
          className="text-padella-cream/55 text-base md:text-lg max-w-sm mx-auto mb-10 font-light leading-relaxed"
        >
          {slide.sub}
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.3 }}
          className="flex flex-wrap gap-4 justify-center mb-14"
        >
          <Link href="/menu" className="btn-primary group">
            View Menu <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <a
            href="https://wa.me/66993741930?text=Hi%20Padella!%20I'd%20like%20to%20book%20a%20table"
            target="_blank" rel="noopener noreferrer"
            className="btn-outline group"
          >
            Reserve a Table
          </a>
        </motion.div>

        {/* Slide dots */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}
          className="flex items-center justify-center gap-3"
        >
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => { setCurrent(i); setPlaying(false); }}
              className={`transition-all duration-500 rounded-full ${
                i === current ? "w-8 h-2 bg-padella-gold" : "w-2 h-2 bg-padella-cream/25 hover:bg-padella-cream/50"
              }`}
            />
          ))}
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <span className="text-padella-cream/30 text-[10px] tracking-[0.3em] uppercase">Scroll</span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-px h-10 bg-gradient-to-b from-padella-gold/40 to-transparent"
        />
      </motion.div>
    </section>
  );
}
