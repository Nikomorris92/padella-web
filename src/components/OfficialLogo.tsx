import Image from "next/image";

/** Official PADELLA brand logo. Use everywhere instead of any synthetic SVG. */
export default function OfficialLogo({
  size = 64,
  className = "",
  priority = false,
}: { size?: number; className?: string; priority?: boolean }) {
  // Transparent PNG, ratio ~1023x762 = 1.34
  const w = size;
  const h = Math.round(size * 0.745);
  return (
    <Image
      src="/logo-clean.png"
      alt="Padella Bangkok"
      width={w}
      height={h}
      priority={priority}
      className={className}
      style={{ objectFit: "contain" }}
    />
  );
}
