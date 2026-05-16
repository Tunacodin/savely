# Savely

Kullanıcıların farklı platformlardan içerikleri kaydetmelerini sağlayan mobil uygulama.

## Tech Stack

- **Framework:** Expo SDK 54
- **Styling:** NativeWind v4 (TailwindCSS for React Native)
- **Navigation:** Expo Router (file-based routing)
- **Language:** TypeScript
- **State Management:** Zustand
- **Forms:** React Hook Form + Zod
- **Font:** Inter (via @expo-google-fonts/inter)
- **Images:** expo-image

## Commands

```bash
npx expo start          # Dev server başlat
npx expo start --ios    # iOS simulator'da çalıştır
npx expo start --android # Android emulator'da çalıştır
npx expo start --web    # Web'de çalıştır
npm run lint            # ESLint çalıştır
```

## Project Structure

```
app/                     # Expo Router file-based routes
├── _layout.tsx          # Root layout (font loading, providers)
├── index.tsx            # Entry redirect
├── (auth)/              # Auth flow screens
│   ├── login.tsx
│   └── register.tsx
├── (tabs)/              # Tab navigator screens
│   ├── index.tsx        # Home
│   └── profile.tsx      # Profile
└── +not-found.tsx       # 404 screen

components/ui/           # Reusable UI components
constants/               # Colors, typography
hooks/                   # Custom hooks
services/                # API services
store/                   # Zustand stores
types/                   # TypeScript types
utils/                   # Utility functions
```

## Conventions

- NativeWind className kullan, StyleSheet.create yerine
- Font: `font-sans` (Regular), `font-sans-medium`, `font-sans-semibold`, `font-sans-bold`
- Colors: `primary-*`, `secondary-*`, `accent-*`, `neutral-*`, `success`, `warning`, `error`, `info`
- Path alias: `@/` -> proje root
- Her screen SafeAreaView ile sarmalı
- Zustand store dosyaları `store/` altında
- Type tanımları `types/` altında

## Figma

- MCP server: `.claude/settings.local.json` içinde yapılandırılmış
- Figma dosya ID: `GVkZC6rKVh81uGtJl10jbR`

## Build & Submit Stratejisi

EAS production build'leri ücretsiz tier kuyruğunda **uzun sürer** (sıkça 30-60 dk+). Submit işlemi de yetki/track sorunlarıyla zaman kaybettirir. Bu yüzden:

### Yeni build tetiklemeden önce daima:

1. **Tüm native etkili değişiklikleri topla** — herhangi biri yeni AAB gerektiriyorsa hepsini birlikte yap:
   - `app.json` (icon, splash, permissions, intent-filter, plugin config, bundle id, version)
   - `plugins/*` (config plugins)
   - `modules/*/android/**` veya `modules/*/ios/**` (native kod)
   - `package.json` native dependency ekleme/silme
2. **Mevcut bilinen bug'ları gözden geçir** — son build'den bu yana raporlanan tüm sorunları gözden geçir, native kod gerektirenleri bu turun listesine ekle
3. **Sadece JS/TS/asset değişiklikleri OTA ile gider** — bunlar build kuyruğuna girmez, listenin parçası değil

### Build önerirken kullanılacak format:

```
"Şu fix'ler yeni build gerektirir, hepsini şimdi paketleyelim:
- [fix 1] (native)
- [fix 2] (native)
- [fix 3] (native)

OTA ile gönderebileceklerimiz (build sonrası, ayrı):
- [fix A]
- [fix B]

Onaylar mısın?"
```

### Asla:

- Tek bir native fix için build önerme. Önce başka native gereksinim var mı sor/araştır.
- Build sonrası ortaya çıkan native fix için "hemen yeni build" deme. Bekleyebilecek değişiklikler varsa onları da topla.
- Submit takıldığında (yetki, track, vs.) build'i tekrar çalıştırma — submit sorunlarını çöz, AAB değişmediği sürece `eas submit --latest` yeniden çalışır.

### Submit için sabit çalışma sırası:

1. `eas.json`'da `track` ve `releaseStatus` doğru mu (ilk yükleme: `internal`)
2. Service account JSON dosyası proje root'unda doğru ada sahip (`savely-google-console-key.json`)
3. Service account'a Play Console **API erişimi** sayfasından (https://play.google.com/console/api-access) ilgili uygulamaya yetki verilmiş
4. AAB build SHA1'i Play Console upload key SHA1'i ile eşleşiyor (`eas credentials -p android` → SHA1 fingerprint)
5. Sonra `eas submit --platform android --profile production --latest`
