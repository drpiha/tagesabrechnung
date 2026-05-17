# Tagesabrechnung – Günlük Kasa Mutabakatı

Almanya kasa standartlarına (GoBD) uygun, çok kullanıcılı, profesyonel günlük kasa mutabakatı web uygulaması.

## Özellikler

- **Deterministik hesaplama motoru** – her zaman doğru, 0.01€ hata imkânsız (cent-bazlı integer aritmetik)
- **Çok kullanıcılı** – e-posta + parola ile kayıt/giriş, her kullanıcı sadece kendi verisini görür
- **Çift dil** – Türkçe + Almanca arayüz, her zaman tek tuşla geçiş
- **Geçmiş arşivi** – tüm günler kayıt altında, tarih bazlı filtre, tek tıkla silme
- **Raporlar & istatistikler** – son 7/30/90/tüm zamanlar, ciro grafiği, haftanın günleri ortalaması
- **PDF dışa aktarım** – baskıya hazır Almanca Tagesabrechnung
- **Excel dışa aktarım** – tarih aralığı için .xlsx
- **Yazıcı dostu** – tarayıcıdan doğrudan yazdırılabilir

## Hızlı Başlangıç (Lokal)

Gereksinim: **Node.js 20+** (https://nodejs.org)

```bash
# 1. Bağımlılıkları yükle
npm install

# 2. Ortam değişkenlerini ayarla
cp .env.example .env
# .env dosyasını aç ve NEXTAUTH_SECRET değerini güncelle
# (terminal: openssl rand -base64 32  veya  https://generate-secret.vercel.app/32 )

# 3. Veritabanını oluştur (lokalde SQLite)
npx prisma db push

# 4. Geliştirme sunucusunu başlat
npm run dev
```

Tarayıcıda http://localhost:3000 açın.

**İlk kullanım:** sağ üstten "Hesap Oluştur" diyerek e-posta ve parola ile bir hesap açın. Aynı bilgilerle giriş yapıp "Dashboard" sayfasına gelin.

**Test girdisi** (Gemini prompt'undaki örnek):
- Tagesumsatz: `628,50`
- Anfangsbestand: `100,00`
- Münzen-Zielwert: `50,00`

→ Sonuç: 6×100€ + 1×50€ + 1×20€ + 1×5€ (Gesamt I = 675,00 €), 9×2€ + 21×1€ + 17×0,50€ + 30×0,20€ (Gesamt II = 53,50 €), Kassenbestand = **728,50 €**

## Canlı Yayınlama (Vercel + Postgres)

### Adım 1 – GitHub'a yükle

1. https://github.com/new sayfasından yeni özel bir repo oluşturun (örn. `tagesabrechnung`).
2. Yerelde terminalde proje klasöründe:

```bash
git init
git add -A
git commit -m "İlk sürüm"
git branch -M main
git remote add origin https://github.com/KULLANICI-ADINIZ/tagesabrechnung.git
git push -u origin main
```

### Adım 2 – Vercel projesi

1. https://vercel.com 'a GitHub ile giriş yapın (ücretsiz Hobby planı yeterli).
2. **Add New → Project**, repo'yu seçin, **Framework: Next.js** otomatik tespit edilir.
3. **Deploy** demeden önce **Environment Variables** alanına şunları ekleyin (ilk açılışta hata vermesi normal, ikinci adımda düzelteceğiz):
   - `NEXTAUTH_SECRET` = (üretmek için: `openssl rand -base64 32`)
   - `NEXTAUTH_URL` = (Vercel size verdiği URL, örn. `https://tagesabrechnung-abc.vercel.app`)

### Adım 3 – Postgres veritabanı

Vercel projenizin **Storage** sekmesinde:
1. **Create Database → Postgres → Continue**
2. Bölge: Frankfurt (eu-central-1) önerilir.
3. Otomatik olarak `POSTGRES_PRISMA_URL` ve `POSTGRES_URL_NON_POOLING` env'leri eklenir.

Şimdi Prisma'nın PostgreSQL kullanmasını söyleyelim. `prisma/schema.prisma` dosyasını açıp `datasource db` bloğunu şöyle değiştirin:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("POSTGRES_PRISMA_URL")
  directUrl = env("POSTGRES_URL_NON_POOLING")
}
```

Bir de `package.json`'da `build` script'ine `prisma db push` ekleyin:

```json
"build": "prisma generate && prisma db push --accept-data-loss && next build",
```

> **Not:** İlk build'de `db push` ile şema oluşturulur. Sonraki build'lerde mevcut tablolara dokunmaz; sadece yeni alan eklerseniz aktarılır.

Commit'leyip push'layın:

```bash
git add -A
git commit -m "PostgreSQL'e geç"
git push
```

Vercel otomatik olarak yeniden deploy eder. 30-60 saniye içinde linkiniz hazır olur.

### Adım 4 – İlk hesap

Verdiği URL'ye gidin → Hesap Oluştur → kullanmaya başlayın. Veriler artık Vercel Postgres'te kalıcı; cihazdan bağımsız erişebilirsiniz.

## Lokal Geliştirme Notları

- Veritabanı görüntüleyici: `npm run db:studio` ile Prisma Studio açılır.
- Hesaplama testleri: `npm run test:calc`
- Yeni veritabanı alanı eklerseniz: `npx prisma db push`
- TypeScript hot-reload otomatik; `npm run dev` çalışırken her dosya değişikliğinde tarayıcı tazelenir.

## Klasör Yapısı

```
src/
  app/             - Next.js App Router sayfaları ve API rotaları
  components/      - React component'leri (CalcForm, TagesabrechnungTable, vb.)
  lib/
    calc.ts        - HESAPLAMA MOTORU (cent-bazlı, deterministik)
    calc.test.ts   - Birim testler
    db.ts          - Prisma client
    auth.ts        - NextAuth ayarları
    i18n.ts        - TR + DE çeviri sözlüğü
prisma/
  schema.prisma    - Veritabanı şeması
```

## Lisans

Sadece kişisel/firma içi kullanım için.
