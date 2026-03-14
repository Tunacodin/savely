export type Platform = "youtube" | "instagram" | "pinterest" | "tiktok";

export interface SavedItem {
  id: string;
  title: string;
  imageUrl: string;
  platform: Platform;
  aspectRatio: number;
}

export interface Collection {
  id: string;
  name: string;
  emoji: string;
  bgColor: string;
  itemCount: number;
}

export const savedItems: SavedItem[] = [
  {
    id: "1",
    title: "Kenan Yildiz Gol Sevinci",
    imageUrl: "https://picsum.photos/seed/kenan/400/600",
    platform: "youtube",
    aspectRatio: 1.5,
  },
  {
    id: "2",
    title: "Siyah Beyaz Oturma Odasi",
    imageUrl: "https://picsum.photos/seed/oda/400/280",
    platform: "pinterest",
    aspectRatio: 0.7,
  },
  {
    id: "3",
    title: "Fit Aksam Yemegi Tabagi",
    imageUrl: "https://picsum.photos/seed/yemek/400/400",
    platform: "tiktok",
    aspectRatio: 1.0,
  },
  {
    id: "4",
    title: "Crossfit Egzersizleri",
    imageUrl: "https://picsum.photos/seed/crossfit/400/500",
    platform: "youtube",
    aspectRatio: 1.25,
  },
  {
    id: "5",
    title: "Goku Telefon Duvar Kagidi",
    imageUrl: "https://picsum.photos/seed/goku/400/700",
    platform: "pinterest",
    aspectRatio: 1.75,
  },
  {
    id: "6",
    title: "Old Money Krem Beyaz Kombin",
    imageUrl: "https://picsum.photos/seed/fashion/400/550",
    platform: "instagram",
    aspectRatio: 1.375,
  },
];

export const collections: Collection[] = [
  {
    id: "1",
    name: "Yemek Tarifleri",
    emoji: "🍲",
    bgColor: "#FFF0DB",
    itemCount: 12,
  },
  {
    id: "2",
    name: "Filmler ve Diziler",
    emoji: "🎬",
    bgColor: "#E8E8E8",
    itemCount: 25,
  },
  {
    id: "3",
    name: "Kombin Onerileri",
    emoji: "👕",
    bgColor: "#D6EEFF",
    itemCount: 8,
  },
  {
    id: "4",
    name: "Yemek Tarifleri",
    emoji: "🛍️",
    bgColor: "#FFE0F0",
    itemCount: 12,
  },
  {
    id: "5",
    name: "Arabalar",
    emoji: "🚗",
    bgColor: "#FFE0E0",
    itemCount: 12,
  },
  {
    id: "6",
    name: "Ders Notlarim",
    emoji: "📚",
    bgColor: "#FFF5E6",
    itemCount: 12,
  },
  {
    id: "7",
    name: "Fitness Hareketleri",
    emoji: "💪",
    bgColor: "#FFF0DB",
    itemCount: 12,
  },
  {
    id: "8",
    name: "Gezilecek Yerler",
    emoji: "🏖️",
    bgColor: "#E0F5FF",
    itemCount: 12,
  },
];
