import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Background */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[50rem] w-[50rem] rounded-full bg-accent/15 blur-[140px] animate-pulse-soft" />
        <div className="absolute bottom-0 right-0 h-[35rem] w-[35rem] rounded-full bg-accent-glow/10 blur-[120px]" />
        <div className="absolute top-1/2 left-0 h-[20rem] w-[20rem] rounded-full bg-accent/8 blur-[100px]" />
        {/* Grid texture */}
        <div className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* Header */}
      <header className="relative z-10 max-w-6xl mx-auto px-5 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 font-bold text-lg tracking-tight group">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent-glow to-accent grid place-items-center shadow-glow-soft transition-transform group-hover:scale-105">
            <span className="text-white text-sm font-black leading-none">S</span>
          </div>
          <span className="bg-gradient-to-r from-text to-text-muted bg-clip-text text-transparent">
            Sohbet
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="text-sm text-text-muted hover:text-text transition px-3 py-2 rounded-xl hover:bg-bg-soft"
          >
            Giriş Yap
          </Link>
          <Link href="/register" className="btn-primary !py-2 !px-4 text-sm">
            Başla →
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 max-w-3xl mx-auto px-5 sm:px-6 pt-16 sm:pt-24 pb-16 text-center animate-slide-up">
        <div className="inline-flex chip-accent mb-8 gap-2">
          <span className="relative flex w-1.5 h-1.5 mt-0.5">
            <span className="absolute inset-0 rounded-full bg-success animate-ping opacity-75" />
            <span className="relative w-1.5 h-1.5 rounded-full bg-success" />
          </span>
          Beta · Arkadaşlar arasında
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tightest leading-[1.03] mb-6">
          Sohbet et,{" "}
          <br className="hidden sm:block" />
          paylaş,{" "}
          <span className="bg-gradient-to-r from-accent-glow via-accent to-accent-glow bg-[length:200%_100%] bg-clip-text text-transparent animate-shimmer">
            yakın kal.
          </span>
        </h1>

        <p className="text-base sm:text-lg text-text-muted leading-relaxed max-w-lg mx-auto mb-10">
          Arkadaşlarınla özel odalar kur, gerçek zamanlı sohbet et,
          fotoğraf ve ses notları paylaş.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/register" className="btn-primary px-7 py-3.5 text-base w-full sm:w-auto group">
            Hemen Başla
            <span className="transition-transform group-hover:translate-x-0.5">→</span>
          </Link>
          <Link href="/login" className="btn-ghost px-7 py-3.5 text-base w-full sm:w-auto">
            Giriş Yap
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 max-w-5xl mx-auto px-5 sm:px-6 pb-20">
        <div className="grid sm:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <div
              key={f.title}
              style={{ animationDelay: `${100 + i * 80}ms` }}
              className="glass-hover p-6 group animate-slide-up"
            >
              <div className={`w-11 h-11 mb-4 rounded-2xl grid place-items-center bg-gradient-to-br ${f.color} shadow-soft transition-transform group-hover:scale-110 duration-200`}>
                {f.icon}
              </div>
              <div className="font-bold text-[15px] mb-1.5 tracking-tight">{f.title}</div>
              <div className="text-sm text-text-muted leading-relaxed">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 max-w-6xl mx-auto px-6 pb-10 text-center">
        <div className="text-xs text-text-faint">
          © {new Date().getFullYear()} Sohbet · Arkadaşlar için yapıldı 💜
        </div>
      </footer>
    </main>
  );
}

const iconCls = "w-5 h-5 text-white";

const features = [
  {
    title: "Gerçek zamanlı odalar",
    desc: "Açık veya özel odalar kur, anında mesajlaş, fotoğraf ve sesli not paylaş.",
    color: "from-violet-500 to-purple-600",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={iconCls}>
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    title: "Sosyal akış",
    desc: "Fotoğraflarını paylaş, beğen, yorum yap. Anılar hepiniz için tek yerde.",
    color: "from-blue-500 to-cyan-500",
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
    desc: "Veriler RLS ile veritabanı düzeyinde korunur. Sadece davetliler görebilir.",
    color: "from-emerald-500 to-teal-500",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={iconCls}>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
];
