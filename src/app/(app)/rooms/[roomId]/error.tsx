"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function RoomError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Geliştirme sırasında konsola yaz; ileride Sentry vb. eklenebilir.
    console.error("[room/error]", error);
  }, [error]);

  return (
    <div className="min-h-[80dvh] flex items-center justify-center p-6">
      <div className="max-w-sm w-full glass p-6 text-center space-y-4">
        <div className="text-3xl">😵</div>
        <div className="space-y-1">
          <h1 className="text-lg font-semibold text-text">Oda yüklenemedi</h1>
          <p className="text-sm text-text-dim leading-relaxed">
            Beklenmedik bir hata oldu. Tekrar denemek istersen aşağıdaki butona
            dokun ya da odalar listesine dön.
          </p>
        </div>
        {error?.message && (
          <p className="text-xs text-text-faint break-words font-mono bg-bg-inset/60 rounded-lg p-2">
            {error.message}
          </p>
        )}
        <div className="flex flex-col gap-2">
          <button onClick={() => reset()} className="btn-primary">
            Tekrar dene
          </button>
          <Link href="/rooms" className="btn-ghost">
            Odalara dön
          </Link>
        </div>
      </div>
    </div>
  );
}
