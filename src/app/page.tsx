import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[40rem] w-[40rem] rounded-full bg-accent/20 blur-[120px] animate-pulse-soft" />
        <div className="absolute -bottom-48 -right-32 h-[32rem] w-[32rem] rounded-full bg-accent-glow/15 blur-[110px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(124,92,255,0.08),transparent_60%)]" />
      </div>

      <header className="relative z-10 max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="font-bold text-lg tracking-tight">
          <span className="bg-gradient-to-r from-accent to-accent-glow bg-clip-text text-transparent">
            Sohbet
          </span>
        </Link>
        <div className="flex items-center gap-1">
          <Link
            href="/login"
            className="text-sm text-text-muted hover:text-text transition px-3 py-1.5 rounded-lg"
          >
            Giriş Yap
          </Link>
          <Link href="/register" className="btn-primary !py-1.5 !px-3 text-sm">
            Başla
          </Link>
        </div>
      </header>

      <section className="relative z-10 max-w-3xl mx-auto px-6 pt-16 md:pt-24 pb-20 text-center animate-slide-up">
        <div className="inline-flex chip-accent mb-8">
          <span className="relative flex w-1.5 h-1.5">
            <span className="absolute inset-0 rounded-full bg-success animate-ping opacity-75" />
            <span className="relative w-1.5 h-1.5 rounded-full bg-success" />
          </span>
          Beta — Arkadaşlar arasında
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tightest leading-[1.05]">
          Sohbet et, paylaş,
          <br className="hidden md:block" />
          <span className="bg-gradient-to-r from-accent-glow via-accent to-accent-glow bg-[length:200%_100%] bg-clip-text text-transparent animate-shimmer">
            yakın kal.
          </span>
        </h1>

        <p className="mt-6 text-lg md:text-xl text-text-muted leading-relaxed max-w-xl mx-auto">
          Arkadaşlarınla özel odalar kur, gerçek zamanlı sohbet et,
          fotoğraf ve mesajlarını paylaş. Hepsi tek bir yerde.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/register" className="btn-primary px-6 py-3 text-base group">
            Hemen Başla
            <span className="transition-transform group-hover:translate-x-0.5">→</span>
          </Link>
          <Link href="/login" className="btn-ghost px-6 py-3 text-base">
            Giriş Yap
          </Link>
        </div>
      </section>

      <section className="relative z-10 max-w-5xl mx-auto px-6 pb-24">
        <div className="grid sm:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <div
              key={f.title}
              style={{
                animation: "slideUp 280ms cubic-bezier(0.22, 1, 0.36, 1) both",
                animationDelay: `${120 + i * 90}ms`,
              }}
              className="glass p-6 group transition hover:shadow-lift hover:border-border-strong"
            >
              <div className="w-10 h-10 mb-4 rounded-xl grid place-items-center bg-accent-soft border border-accent/20 text-accent-glow transition group-hover:scale-105 group-hover:border-accent/40">
                {f.icon}
              </div>
              <div className="font-semibold text-base mb-1 tracking-tight">{f.title}</div>
              <div className="text-sm text-text-muted leading-relaxed">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <footer className="relative z-10 max-w-6xl mx-auto px-6 pb-10 text-center">
        <div className="text-xs text-text-faint">
          © {new Date().getFullYear()} Sohbet · Arkadaşlar için tasarlandı
        </div>
      </footer>
    </main>
  );
}

const iconCls = "w-5 h-5";

const features = [
  {
    title: "Gerçek zamanlı odalar",
    desc: "Açık veya özel odalar kur, anında mesajlaş, sesli not bırak.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={iconCls}>
        <path d="M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 0 1-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
  {
    title: "Sosyal akış",
    desc: "Fotoğraflarını paylaş, beğen, yorum yap. Anılar tek yerde.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={iconCls}>
        <rect x="3" y="3" width="18" height="18" rx="3" />
        <circle cx="8.5" cy="9.5" r="1.5" />
        <path d="m21 15-5-5L5 21" />
      </svg>
    ),
  },
  {
    title: "Güvenli ve özel",
    desc: "Veriler RLS ile veritabanı düzeyinde korunur. Sadece davetliler görür.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={iconCls}>
        <rect x="4" y="11" width="16" height="10" rx="2" />
        <path d="M8 11V7a4 4 0 0 1 8 0v4" />
      </svg>
    ),
  },
];
