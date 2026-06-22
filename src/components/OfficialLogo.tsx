import Image from "next/image";

/** Official PADELLA brand logo. Use everywhere instead of any synthetic SVG. */
export default function OfficialLogo({
  size = 64,
  className = "",
  priority = false,
}: { size?: number; className?: string; priority?: boolean }) {
  // Logo is approximately 3:2 aspect ratio (width:height)
  const w = size;
  const h = Math.round(size * 0.66);
  return (
    <Image
      src="/FullLogo_NoBuffer.jpg"
      alt="Padella Bangkok"
      width={w}
      height={h}
      priority={priority}
      className={className}
      style={{ objectFit: "contain" }}
    />
  );
}
