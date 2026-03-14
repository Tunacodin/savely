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
