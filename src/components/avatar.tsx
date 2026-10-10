/* eslint-disable @next/next/no-img-element -- avatars come from arbitrary OAuth CDNs */
export function Avatar({
  src,
  name,
  size = 40,
}: {
  src: string | null;
  name: string;
  size?: number;
}) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        width={size}
        height={size}
        referrerPolicy="no-referrer"
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      className="inline-flex items-center justify-center rounded-full bg-rose-100 font-semibold text-rose-700"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {(name || "?").slice(0, 1).toUpperCase()}
    </span>
  );
}
