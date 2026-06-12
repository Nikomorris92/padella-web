"use client";

import { useState } from "react";
import QRCode from "react-qr-code";

const QR_ITEMS = [
  { id: "menu", label: "Digital Menu QR", url: "https://padellabangkok.com/qr-menu", desc: "Place on tables — opens directly to menu" },
  { id: "review", label: "Google Review QR", url: "https://g.page/r/XXXXXXXX/review", desc: "Place at exit — opens Google review page" },
  { id: "whatsapp", label: "WhatsApp QR", url: "https://wa.me/66XXXXXXXXX", desc: "Quick WhatsApp contact" },
  { id: "reservation", label: "Reservation QR", url: "https://padellabangkok.com/reservations", desc: "Direct booking link" },
];

export default function QRAdminPage() {
  const [selected, setSelected] = useState("menu");
  const item = QR_ITEMS.find(q => q.id === selected)!;

  return (
    <div className="min-h-screen bg-padella-green pt-20">
      <div className="container-padella py-12 max-w-2xl">
        <h1 className="font-display font-bold text-padella-cream text-3xl mb-2">QR Code Generator</h1>
        <p className="text-padella-cream/50 mb-8">Generate and download QR codes for all Padella touchpoints.</p>

        <div className="flex flex-wrap gap-2 mb-8">
          {QR_ITEMS.map(q => (
            <button key={q.id} onClick={() => setSelected(q.id)}
              className={`px-4 py-2 rounded-full text-sm transition-all ${selected === q.id ? "bg-padella-gold text-padella-green font-semibold" : "glass border border-padella-cream/10 text-padella-cream/60"}`}>
              {q.label}
            </button>
          ))}
        </div>

        <div className="card-premium p-8 text-center">
          <h2 className="font-display font-semibold text-padella-cream text-xl mb-1">{item.label}</h2>
          <p className="text-padella-cream/50 text-sm mb-6">{item.desc}</p>
          <div className="inline-block p-4 bg-white rounded-xl2 mb-6">
            <QRCode value={item.url} size={200} fgColor="#1B3A2D" bgColor="#FFFFFF" />
          </div>
          <div className="text-padella-cream/40 text-xs mb-4 font-mono break-all">{item.url}</div>
          <button
            onClick={() => {
              const svg = document.querySelector("svg");
              if (!svg) return;
              const blob = new Blob([svg.outerHTML], { type: "image/svg+xml" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `padella-qr-${item.id}.svg`;
              a.click();
            }}
            className="btn-primary"
          >
            ⬇️ Download QR Code
          </button>
        </div>
      </div>
    </div>
  );
}
