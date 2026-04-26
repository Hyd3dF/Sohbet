import { cn, initialsOf } from "@/lib/utils";

interface Props {
  url?: string | null;
  name: string;
  size?: number;
  className?: string;
}

export function Avatar({ url, name, size = 36, className }: Props) {
  const style = { width: size, height: size, fontSize: Math.round(size * 0.4) };
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={url}
        alt={name}
        style={style}
        className={cn("rounded-full object-cover bg-bg-soft border border-border", className)}
      />
    );
  }
  return (
    <div
      style={style}
      className={cn(
        "rounded-full grid place-items-center bg-gradient-to-br from-accent to-accent-glow text-white font-semibold select-none",
        className,
      )}
    >
      {initialsOf(name) || "?"}
    </div>
  );
}
