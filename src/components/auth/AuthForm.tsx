"use client";

import { ChangeEvent, InputHTMLAttributes, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { cn, initialsOf, randomFileName } from "@/lib/utils";

interface Props {
  mode: "login" | "register";
}

export function AuthForm({ mode }: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [displayName, setDisplayName] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isLogin = mode === "login";

  function pickAvatar(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setAvatarFile(f);
    setAvatarPreview(f ? URL.createObjectURL(f) : null);
  }

  function clearAvatar() {
    setAvatarFile(null);
    setAvatarPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!isLogin) {
      if (!displayName.trim()) {
        setError("Lütfen görünen adını gir.");
        return;
      }
      if (password !== passwordConfirm) {
        setError("Şifreler birbiriyle eşleşmiyor.");
        return;
      }
    }

    setLoading(true);
    const supabase = createClient();
    try {
      if (mode === "register") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: displayName.trim() },
          },
        });
        if (error) throw error;

        const signInResult = data.session
          ? { data, error: null }
          : await supabase.auth.signInWithPassword({ email, password });
        if (signInResult.error) throw signInResult.error;

        const userId = signInResult.data.user?.id ?? data.user?.id;
        let avatarUrl: string | null = null;
        if (avatarFile && userId) {
          const path = `${userId}/${randomFileName(avatarFile.name)}`;
          const { error: upErr } = await supabase.storage
            .from("avatars")
            .upload(path, avatarFile, {
              contentType: avatarFile.type,
              upsert: true,
            });
          if (!upErr) {
            avatarUrl = supabase.storage.from("avatars").getPublicUrl(path)
              .data.publicUrl;
          }
        }
        if (userId) {
          await supabase
            .from("profiles")
            .update({
              display_name: displayName.trim() || null,
              ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
            })
            .eq("id", userId);
        }
        router.push("/feed");
        router.refresh();
        return;

      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push("/feed");
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  }

  const mismatch =
    !isLogin && passwordConfirm.length > 0 && password !== passwordConfirm;

  return (
    <main className="relative min-h-screen w-full grid place-items-center px-4 py-10 overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[36rem] w-[36rem] rounded-full bg-accent/20 blur-[120px] animate-pulse-soft" />
        <div className="absolute -bottom-40 -right-32 h-96 w-96 rounded-full bg-accent-glow/15 blur-[110px]" />
      </div>

      <div className="w-full max-w-md animate-slide-up">
        <Link href="/" className="block text-center font-bold text-lg tracking-tight mb-6">
          <span className="bg-gradient-to-r from-accent to-accent-glow bg-clip-text text-transparent">
            Sohbet
          </span>
        </Link>

        <div className="glass p-7 sm:p-8 shadow-lift">
          <header className="text-center space-y-1.5 mb-7">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              {isLogin ? "Tekrar hoş geldin" : "Hesap oluştur"}
            </h1>
            <p className="text-sm text-text-muted">
              {isLogin
                ? "E-posta ve şifrenle devam et."
                : "Birkaç saniyede aramıza katıl."}
            </p>
          </header>

          <form onSubmit={onSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div className="flex items-center justify-center pb-1">
                  <AvatarPicker
                    preview={avatarPreview}
                    name={displayName}
                    onPick={() => fileRef.current?.click()}
                    onClear={clearAvatar}
                  />
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={pickAvatar}
                  />
                </div>

                <Field
                  label="Görünen ad"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Adın veya takma adın"
                  maxLength={40}
                  required
                  autoComplete="name"
                  autoFocus
                />
              </>
            )}

            <Field
              label="E-posta"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ornek@mail.com"
              autoComplete="email"
              autoFocus={isLogin}
            />

            <Field
              label="Şifre"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="En az 6 karakter"
              autoComplete={isLogin ? "current-password" : "new-password"}
            />

            {!isLogin && (
              <Field
                label="Şifre (tekrar)"
                type="password"
                required
                minLength={6}
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                placeholder="Şifreni tekrar gir"
                autoComplete="new-password"
                hint={mismatch ? "Şifreler eşleşmiyor." : undefined}
                hintTone={mismatch ? "danger" : undefined}
              />
            )}

            {error && (
              <Notice tone="danger" role="alert">
                {error}
              </Notice>
            )}
            <button
              type="submit"
              disabled={loading}
              className="relative w-full overflow-hidden btn-primary py-3 text-base group mt-1"
            >
              <span className="relative z-10 inline-flex items-center gap-2">
                {loading ? (
                  <>
                    <Spinner /> Bekleyin...
                  </>
                ) : (
                  <>
                    {isLogin ? "Giriş Yap" : "Hesap Oluştur"}
                    <span className="transition-transform group-hover:translate-x-0.5">→</span>
                  </>
                )}
              </span>
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-[900ms] ease-out bg-gradient-to-r from-transparent via-white/25 to-transparent"
              />
            </button>
          </form>

          <div className="text-sm text-text-muted text-center pt-5">
            {isLogin ? (
              <>
                Hesabın yok mu?{" "}
                <Link
                  href="/register"
                  className="text-accent-glow hover:text-accent transition font-medium"
                >
                  Kayıt ol
                </Link>
              </>
            ) : (
              <>
                Zaten hesabın var mı?{" "}
                <Link
                  href="/login"
                  className="text-accent-glow hover:text-accent transition font-medium"
                >
                  Giriş yap
                </Link>
              </>
            )}
          </div>
        </div>

        <p className="text-xs text-text-faint text-center mt-6">
          © {new Date().getFullYear()} Sohbet
        </p>
      </div>
    </main>
  );
}

function AvatarPicker({
  preview,
  name,
  onPick,
  onClear,
}: {
  preview: string | null;
  name: string;
  onPick: () => void;
  onClear: () => void;
}) {
  const initials = initialsOf(name);
  const hasName = initials.length > 0;
  return (
    <div className="relative group">
      <button
        type="button"
        onClick={onPick}
        aria-label="Profil fotoğrafı seç"
        className={cn(
          "relative w-20 h-20 rounded-full overflow-hidden grid place-items-center transition",
          "focus:outline-none focus-visible:shadow-ring-focus",
          preview
            ? "border border-border-strong"
            : hasName
              ? "bg-gradient-to-br from-accent to-accent-glow text-white"
              : "border-2 border-dashed border-border-strong bg-bg-soft text-text-muted hover:border-accent/60 hover:text-accent",
        )}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="w-full h-full object-cover" />
        ) : hasName ? (
          <span className="text-2xl font-semibold tracking-tight">{initials}</span>
        ) : (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-7 h-7"
            aria-hidden
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
        )}
        <span className="absolute inset-x-0 bottom-0 py-1 bg-black/55 text-white text-[10px] font-medium opacity-0 group-hover:opacity-100 transition">
          {preview ? "Değiştir" : "Ekle"}
        </span>
      </button>
      {preview && (
        <button
          type="button"
          onClick={onClear}
          aria-label="Fotoğrafı kaldır"
          className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-bg-card border border-border-strong text-text-muted hover:text-danger hover:border-danger/50 grid place-items-center text-sm leading-none transition shadow-soft"
        >
          ×
        </button>
      )}
    </div>
  );
}

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  hintTone?: "danger";
}

function Field({ label, hint, hintTone, id, ...rest }: FieldProps) {
  const inputId = id ?? `f-${label}`;
  return (
    <div>
      <label htmlFor={inputId} className="block text-sm font-medium text-text mb-1.5">
        {label}
      </label>
      <input id={inputId} className="input-base" {...rest} />
      {hint && (
        <p
          className={cn(
            "text-xs mt-1.5",
            hintTone === "danger" ? "text-danger" : "text-text-dim",
          )}
        >
          {hint}
        </p>
      )}
    </div>
  );
}

function Notice({
  tone,
  role,
  children,
}: {
  tone: "danger" | "success";
  role: "alert" | "status";
  children: React.ReactNode;
}) {
  const isDanger = tone === "danger";
  return (
    <div
      role={role}
      className={cn(
        "flex items-start gap-2.5 text-sm rounded-xl px-3.5 py-3 border animate-fade-in",
        isDanger
          ? "bg-danger-soft border-danger/30 text-danger"
          : "bg-success-soft border-success/30 text-success",
      )}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.85"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-4 h-4 mt-0.5 shrink-0"
        aria-hidden
      >
        {isDanger ? (
          <>
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </>
        ) : (
          <path d="M20 6 9 17l-5-5" />
        )}
      </svg>
      <span className="leading-relaxed">{children}</span>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 0 1 8-8v3a5 5 0 0 0-5 5H4z"
      />
    </svg>
  );
}
