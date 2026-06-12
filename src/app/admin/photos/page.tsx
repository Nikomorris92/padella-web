"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Download, Wand2, Trash2, CheckCircle, Loader2, ImageIcon, Sliders, RefreshCw, Layers } from "lucide-react";

// ── Padella brand filter applied via Canvas ──────────────────────────────────
// Warm dark green aesthetic: contrast+, warm highlights, slight desaturation
const FILTER_PRESETS = {
  padella: {
    label: "Padella Brand",
    desc: "Verde scuro, toni caldi dorati",
    brightness: 1.05,
    contrast: 1.18,
    saturation: 0.82,
    warmth: 18,       // adds warm red/yellow tint to shadows
    vignette: 0.38,
    sharpness: 1.2,
    color: "#C9A84C",
  },
  aperitivo: {
    label: "Aperitivo",
    desc: "Toni caldi arancio, vivaci",
    brightness: 1.08,
    contrast: 1.12,
    saturation: 1.15,
    warmth: 28,
    vignette: 0.28,
    sharpness: 1.1,
    color: "#C4634A",
  },
  fresh: {
    label: "Fresh & Clean",
    desc: "Luminoso, fresco, neutro",
    brightness: 1.12,
    contrast: 1.08,
    saturation: 0.95,
    warmth: 8,
    vignette: 0.15,
    sharpness: 1.3,
    color: "#7FB069",
  },
} as const;

type Preset = keyof typeof FILTER_PRESETS;

interface Photo {
  id: string;
  name: string;
  original: string;   // data URL
  processed: string | null;
  bgRemoved: string | null;
  status: "idle" | "processing" | "done" | "error";
  preset: Preset;
}

// Apply filter to ImageData via Canvas
function applyFilter(
  img: HTMLImageElement,
  preset: Preset,
  withBgRemoved?: string | null
): Promise<string> {
  return new Promise(resolve => {
    const { brightness, contrast, saturation, warmth, vignette } = FILTER_PRESETS[preset];
    const canvas = document.createElement("canvas");
    const SIZE = 1200;
    canvas.width = SIZE;
    canvas.height = SIZE;
    const ctx = canvas.getContext("2d")!;

    // Fill dark background (matches Padella green for bg-removed images)
    ctx.fillStyle = "#1B3A2D";
    ctx.fillRect(0, 0, SIZE, SIZE);

    // Draw source (either bg-removed blob or original)
    const source = withBgRemoved
      ? (() => { const i = new Image(); i.src = withBgRemoved; return i; })()
      : img;

    const draw = (src: HTMLImageElement) => {
      // Center-crop to square
      const ratio = src.naturalWidth / src.naturalHeight;
      let sx = 0, sy = 0, sw = src.naturalWidth, sh = src.naturalHeight;
      if (ratio > 1) { sx = (sw - sh) / 2; sw = sh; }
      else           { sy = (sh - sw) / 2; sh = sw; }
      ctx.drawImage(src, sx, sy, sw, sh, 0, 0, SIZE, SIZE);

      // Read pixels and apply color grading
      const id = ctx.getImageData(0, 0, SIZE, SIZE);
      const d = id.data;
      for (let i = 0; i < d.length; i += 4) {
        let r = d[i], g = d[i+1], b = d[i+2];

        // Brightness
        r *= brightness; g *= brightness; b *= brightness;

        // Contrast
        r = (r - 128) * contrast + 128;
        g = (g - 128) * contrast + 128;
        b = (b - 128) * contrast + 128;

        // Saturation
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        r = gray + (r - gray) * saturation;
        g = gray + (g - gray) * saturation;
        b = gray + (b - gray) * saturation;

        // Warmth (add warm cast to shadows, cool to highlights)
        const lum = (r + g + b) / 3;
        const warmFactor = (1 - lum / 255) * warmth;
        r += warmFactor * 1.0;
        g += warmFactor * 0.5;
        b -= warmFactor * 0.3;

        d[i]   = Math.max(0, Math.min(255, r));
        d[i+1] = Math.max(0, Math.min(255, g));
        d[i+2] = Math.max(0, Math.min(255, b));
      }
      ctx.putImageData(id, 0, 0);

      // Vignette
      const vig = ctx.createRadialGradient(SIZE/2, SIZE/2, SIZE*0.35, SIZE/2, SIZE/2, SIZE*0.75);
      vig.addColorStop(0, "rgba(0,0,0,0)");
      vig.addColorStop(1, `rgba(0,0,0,${vignette})`);
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, SIZE, SIZE);

      resolve(canvas.toDataURL("image/jpeg", 0.92));
    };

    if (withBgRemoved) {
      source.onload = () => draw(source as HTMLImageElement);
      if ((source as HTMLImageElement).complete) draw(source as HTMLImageElement);
    } else {
      draw(img);
    }
  });
}

export default function AdminPhotosPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [bgLoaded, setBgLoaded] = useState(false);
  const [bgLoading, setBgLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Lazy-load the heavy background-removal library (client-only, WASM)
  const loadBgLib = useCallback(async () => {
    if (bgLoaded) return true;
    setBgLoading(true);
    try {
      await import("@imgly/background-removal");
      setBgLoaded(true);
      return true;
    } catch {
      return false;
    } finally {
      setBgLoading(false);
    }
  }, [bgLoaded]);

  const onFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach(file => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = e => {
        setPhotos(prev => [...prev, {
          id: Date.now() + Math.random().toString(),
          name: file.name,
          original: e.target!.result as string,
          processed: null,
          bgRemoved: null,
          status: "idle",
          preset: "padella",
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const processPhoto = async (id: string, withBg = false) => {
    setPhotos(prev => prev.map(p => p.id === id ? { ...p, status: "processing" } : p));
    const photo = photos.find(p => p.id === id)!;

    try {
      const img = new Image();
      img.src = photo.original;
      await new Promise(r => { img.onload = r; if (img.complete) r(null); });

      let bgUrl: string | null = photo.bgRemoved;

      if (withBg) {
        const ok = await loadBgLib();
        if (ok) {
          const { removeBackground } = await import("@imgly/background-removal");
          const blob = await fetch(photo.original).then(r => r.blob());
          const result = await removeBackground(blob);
          bgUrl = URL.createObjectURL(result);
        }
      }

      const processed = await applyFilter(img, photo.preset, bgUrl);
      setPhotos(prev => prev.map(p => p.id === id ? { ...p, processed, bgRemoved: bgUrl, status: "done" } : p));
    } catch {
      setPhotos(prev => prev.map(p => p.id === id ? { ...p, status: "error" } : p));
    }
  };

  const processAll = () => {
    photos.filter(p => p.status === "idle").forEach(p => processPhoto(p.id));
  };

  const changePreset = async (id: string, preset: Preset) => {
    setPhotos(prev => prev.map(p => p.id === id ? { ...p, preset, processed: null, status: "idle" } : p));
  };

  const download = (photo: Photo) => {
    const url = photo.processed ?? photo.original;
    const a = document.createElement("a");
    a.href = url;
    a.download = `padella_${photo.name.replace(/\.[^.]+$/, "")}.jpg`;
    a.click();
  };

  const downloadAll = () => {
    photos.filter(p => p.status === "done").forEach(download);
  };

  const selectedPhoto = photos.find(p => p.id === selected) ?? photos[0] ?? null;

  return (
    <div className="min-h-screen bg-[#0f1a14] p-6">

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-padella-cream text-2xl md:text-3xl mb-1">Photo Studio AI</h1>
          <p className="text-padella-cream/40 text-sm">Filtro brand uniforme + rimozione sfondo AI — tutto nel browser</p>
        </div>
        <div className="flex gap-2">
          {photos.some(p => p.status === "idle") && (
            <button onClick={processAll}
              className="flex items-center gap-2 px-4 py-2 bg-padella-gold text-padella-green rounded-full text-sm font-semibold hover:bg-padella-gold/90 transition-all">
              <Wand2 size={14} /> Processa Tutto
            </button>
          )}
          {photos.some(p => p.status === "done") && (
            <button onClick={downloadAll}
              className="flex items-center gap-2 px-4 py-2 bg-[#1a2e1f] border border-padella-cream/10 text-padella-cream/70 rounded-full text-sm hover:bg-padella-cream/5 transition-all">
              <Download size={14} /> Scarica Tutto
            </button>
          )}
        </div>
      </div>

      {/* Filter presets info */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {(Object.entries(FILTER_PRESETS) as [Preset, typeof FILTER_PRESETS[Preset]][]).map(([key, p]) => (
          <div key={key} className="bg-[#1a2e1f] border border-padella-cream/8 rounded-xl p-3 flex items-start gap-3">
            <div className="w-3 h-3 rounded-full mt-1 flex-shrink-0" style={{ background: p.color }} />
            <div>
              <div className="text-padella-cream/80 text-xs font-semibold">{p.label}</div>
              <div className="text-padella-cream/30 text-[10px] mt-0.5">{p.desc}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* ── LEFT: upload + thumbnails ── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Drop zone */}
          <div
            onClick={() => inputRef.current?.click()}
            onDrop={e => { e.preventDefault(); onFiles(e.dataTransfer.files); }}
            onDragOver={e => e.preventDefault()}
            className="border-2 border-dashed border-padella-cream/15 rounded-xl p-6 text-center cursor-pointer hover:border-padella-gold/40 hover:bg-padella-cream/3 transition-all group"
          >
            <Upload size={24} className="text-padella-cream/30 group-hover:text-padella-gold/60 mx-auto mb-2 transition-all" />
            <p className="text-padella-cream/40 text-sm">Trascina foto o clicca per caricare</p>
            <p className="text-padella-cream/20 text-xs mt-1">JPG, PNG, WEBP — anche multiple</p>
            <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={e => onFiles(e.target.files)} />
          </div>

          {/* Thumbnails */}
          <div className="space-y-2 max-h-[50vh] overflow-y-auto scrollbar-hide">
            <AnimatePresence>
              {photos.map(p => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  onClick={() => setSelected(p.id)}
                  className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all border ${
                    selected === p.id || (!selected && photos[0]?.id === p.id)
                      ? "bg-padella-gold/10 border-padella-gold/25"
                      : "bg-[#1a2e1f] border-padella-cream/6 hover:bg-padella-cream/5"
                  }`}
                >
                  {/* Thumb */}
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-[#0f1a14] flex-shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.processed ?? p.original} alt={p.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-padella-cream/70 text-xs font-medium truncate">{p.name}</div>
                    <div className="text-padella-cream/30 text-[10px] mt-0.5 capitalize">{FILTER_PRESETS[p.preset].label}</div>
                  </div>
                  {/* Status */}
                  <div className="flex-shrink-0">
                    {p.status === "processing" && <Loader2 size={14} className="text-padella-gold animate-spin" />}
                    {p.status === "done" && <CheckCircle size={14} className="text-green-400" />}
                    {p.status === "idle" && <div className="w-2 h-2 rounded-full bg-padella-cream/20" />}
                    {p.status === "error" && <div className="w-2 h-2 rounded-full bg-red-400" />}
                  </div>
                  {/* Remove */}
                  <button onClick={e => { e.stopPropagation(); setPhotos(prev => prev.filter(x => x.id !== p.id)); if (selected === p.id) setSelected(null); }}
                    className="text-padella-cream/20 hover:text-red-400 transition-colors flex-shrink-0">
                    <Trash2 size={12} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* ── RIGHT: preview + controls ── */}
        <div className="lg:col-span-3">
          {selectedPhoto ? (
            <div className="space-y-4">

              {/* Before / After */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Originale", src: selectedPhoto.original },
                  { label: "Processata", src: selectedPhoto.processed ?? selectedPhoto.original },
                ].map(({ label, src }) => (
                  <div key={label} className="bg-[#1a2e1f] border border-padella-cream/8 rounded-xl overflow-hidden">
                    <div className="px-3 py-2 border-b border-padella-cream/5 text-padella-cream/40 text-[10px] font-semibold uppercase tracking-wide">{label}</div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt={label} className="w-full aspect-square object-cover" />
                  </div>
                ))}
              </div>

              {/* Preset selector */}
              <div className="bg-[#1a2e1f] border border-padella-cream/8 rounded-xl p-4">
                <div className="text-padella-cream/50 text-[10px] font-semibold uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <Sliders size={11} /> Filtro Brand
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.entries(FILTER_PRESETS) as [Preset, typeof FILTER_PRESETS[Preset]][]).map(([key, p]) => (
                    <button key={key}
                      onClick={() => changePreset(selectedPhoto.id, key)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition-all border ${
                        selectedPhoto.preset === key
                          ? "border-padella-gold/40 bg-padella-gold/10 text-padella-gold"
                          : "border-padella-cream/8 text-padella-cream/40 hover:border-padella-cream/20"
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                        {p.label}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-1 gap-2">
                {/* Apply filter only */}
                <button
                  onClick={() => processPhoto(selectedPhoto.id)}
                  disabled={selectedPhoto.status === "processing"}
                  className="flex items-center justify-center gap-2 py-3 bg-padella-gold text-padella-green rounded-xl font-semibold text-sm hover:bg-padella-gold/90 disabled:opacity-50 transition-all"
                >
                  {selectedPhoto.status === "processing"
                    ? <><Loader2 size={15} className="animate-spin" /> Elaborazione...</>
                    : <><Wand2 size={15} /> Applica Filtro Brand</>
                  }
                </button>

                {/* Remove bg + apply filter */}
                <button
                  onClick={() => processPhoto(selectedPhoto.id, true)}
                  disabled={selectedPhoto.status === "processing" || bgLoading}
                  className="flex items-center justify-center gap-2 py-3 bg-[#1a2e1f] border border-padella-gold/20 text-padella-gold rounded-xl font-semibold text-sm hover:bg-padella-gold/5 disabled:opacity-50 transition-all"
                >
                  {bgLoading
                    ? <><Loader2 size={15} className="animate-spin" /> Carico AI (prima volta ~10s)...</>
                    : selectedPhoto.status === "processing"
                    ? <><Loader2 size={15} className="animate-spin" /> Rimuovo sfondo...</>
                    : <><Layers size={15} /> Rimuovi Sfondo + Filtro Brand</>
                  }
                </button>

                {/* Download */}
                {selectedPhoto.status === "done" && (
                  <motion.button
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    onClick={() => download(selectedPhoto)}
                    className="flex items-center justify-center gap-2 py-3 bg-green-600/20 border border-green-500/30 text-green-400 rounded-xl font-semibold text-sm hover:bg-green-600/30 transition-all"
                  >
                    <Download size={15} /> Scarica Foto Processata
                  </motion.button>
                )}
              </div>

              {/* Info box */}
              <div className="p-3 bg-padella-gold/5 border border-padella-gold/10 rounded-xl">
                <p className="text-padella-cream/40 text-[11px] leading-relaxed">
                  💡 <strong className="text-padella-cream/60">Filtro Brand</strong> applica contrasto, toni caldi e vignette uniforme. <strong className="text-padella-cream/60">Rimuovi Sfondo</strong> usa AI (gira nel browser, niente server) poi piazza il piatto su sfondo verde Padella. Prima esecuzione scarica il modello AI (~30s).
                </p>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-64 flex flex-col items-center justify-center text-center bg-[#1a2e1f] border border-padella-cream/6 rounded-xl p-8">
              <ImageIcon size={40} className="text-padella-cream/15 mb-3" />
              <p className="text-padella-cream/30 text-sm">Carica una foto per iniziare</p>
              <p className="text-padella-cream/20 text-xs mt-1">Il filtro brand verrà applicato automaticamente</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
