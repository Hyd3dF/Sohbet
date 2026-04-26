# Sohbet — Arkadaşlar Arası Sohbet & Paylaşım Platformu

Next.js 15 + Supabase ile inşa edilmiş, gerçek zamanlı sohbet odaları ve sosyal akış içeren modern bir web uygulaması.

## Özellikler

- 📝 **Sosyal akış** — Fotoğraflı/yazılı gönderiler, beğeni, yorum
- 💬 **Sohbet odaları** — Açık veya özel, kapasite kontrollü
- 🎤 **Mesajlaşma** — Metin, fotoğraf, **ses kaydı**
- 👑 **Yetki sistemi** — Sahip / Yetkili / Üye rolleri, rol atama, üye atma
- ⚡ **Gerçek zamanlı** — Supabase Realtime ile anlık güncellemeler
- 🔒 **Güvenli** — Supabase RLS ile veritabanı düzeyinde yetkilendirme
- 🎨 **Modern UI** — Tailwind CSS ile özel tasarım, koyu tema

## Kurulum

### 1. Bağımlılıklar

```bash
npm install
```

### 2. Supabase Projesi

1. [supabase.com](https://supabase.com) üzerinde yeni bir proje oluştur (ücretsiz tier yeterli).
2. Proje **Settings → API** sayfasından şu üç değeri kopyala:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (gizli, sadece sunucu tarafında)

### 3. Ortam Değişkenleri

`.env.example` dosyasını `.env.local` olarak kopyala ve değerleri doldur:

```bash
cp .env.example .env.local
```

`.env.local` **repoda yer almaz** (gitignore'da). Anahtarlar gizli kalır.

### 4. Veritabanı Şeması

`supabase/schema.sql` dosyasının içeriğini Supabase Studio → **SQL Editor** içinde tek seferde çalıştır. Bu işlem:
- Tüm tabloları oluşturur (`profiles`, `posts`, `rooms`, `messages`, ...)
- Row-Level Security politikalarını yazar
- Trigger'ları kurar (otomatik profil oluşturma, kapasite kontrolü, vb.)
- Storage bucket'larını oluşturur (`post-images`, `avatars`, `chat-attachments`)
- Realtime publication'a tabloları ekler

### 5. (Opsiyonel) Email Onayını Kapat

Geliştirme sırasında pratik olması için Supabase Studio → **Authentication → Providers → Email** bölümünden "Confirm email" seçeneğini kapatabilirsin.

### 6. Geliştirme Sunucusunu Başlat

```bash
npm run dev
```

Tarayıcıda [http://localhost:3000](http://localhost:3000) adresini aç.

## Komutlar

| Komut | Açıklama |
|-------|----------|
| `npm run dev` | Geliştirme sunucusu |
| `npm run build` | Üretim için derleme |
| `npm start` | Üretim sunucusu |
| `npm run lint` | Linter |

## Kendi Sunucuna Dağıtım

Bu uygulama herhangi bir Node.js destekleyen ortamda çalışır:

```bash
npm run build
npm start
```

Ortam değişkenlerini sunucunun yapılandırma sistemine ekle. `.env.local` dosyası repoda olmadığı için anahtarlar yalnızca sunucunda yaşar.

## Yetki Sistemi

| Rol | Yetenekler |
|-----|------------|
| **Sahip** (owner) | Her şey: oda silme, ayar değiştirme, üye atma, rol atama |
| **Yetkili** (admin) | Üye atma, üye→yetkili yapma (sahip hariç), her mesajı silme |
| **Üye** (member) | Mesaj gönderme, kendi mesajını silme |

Yetkiler **hem UI hem de RLS düzeyinde** uygulanır — UI bypass edilse bile veritabanı reddeder.

## Mimari Notlar

- **App Router** + Server Components — auth ve veri çekme sunucu tarafında
- `@supabase/ssr` ile cookie tabanlı oturum
- Realtime: `postgres_changes` subscription'ı her sohbet odası ve feed için
- Storage: kullanıcı dosyaları kendi `<user_id>/` klasörüne yüklenir; RLS ile korunur

## Doğrulama

`bana-bir-tane-web-curious-sunbeam.md` planındaki test listesinin tamamı uygulanabilir; başlıca senaryolar:

1. İki tarayıcı, iki kullanıcı → biri gönderi paylaşıyor, diğerinin akışında anında görünüyor
2. Oda oluştur (max 5 üye) → 6. kullanıcı katılmaya çalışınca trigger reddediyor
3. Sahip → bir üyeyi yetkili yapıyor → o üye başka birinin mesajını silebiliyor
4. Sıradan üye silme denerse RLS engelliyor
