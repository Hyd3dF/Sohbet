export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "az önce";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} dk`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} sa`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} gün`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks} hf`;
  return new Date(iso).toLocaleDateString("tr-TR");
}

export function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}

export function randomFileName(originalName: string): string {
  const ext = originalName.includes(".") ? originalName.split(".").pop() : "bin";
  const rand = Math.random().toString(36).slice(2, 10);
  return `${Date.now()}-${rand}.${ext}`;
}
