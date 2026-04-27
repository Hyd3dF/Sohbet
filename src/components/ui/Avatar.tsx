import { cn, initialsOf } from "@/lib/utils";

interface Props {
  url?: string | null;
  name: string;
  size?: number;
  className?: string;
}

export function Avatar({ url, name, size = 36, className }: Props) {
  const style = { width: size, height: size, fontSize: Math.round(size * 0.4) };
  const baseClass =
    "rounded-full shrink-0 object-cover border border-white/10 bg-bg-soft shadow-[0_6px_20px_rgba(0,0,0,0.24),inset_0_1px_0_rgba(255,255,255,0.08)]";
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={url}
        alt={name}
        style={style}
        className={cn(baseClass, className)}
      />
    );
  }
  return (
    <div
      style={style}
      className={cn(
        baseClass,
        "grid place-items-center bg-[radial-gradient(circle_at_35%_25%,#b7a9ff_0%,#7c5cff_48%,#5b3be8_100%)] text-white font-semibold select-none",
        className,
      )}
    >
      {initialsOf(name) || "?"}
    </div>
  );
}
