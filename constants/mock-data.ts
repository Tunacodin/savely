import type { ContentType, SavedItemMetadata } from "@/types/saved-item";

export type Platform = "youtube" | "instagram" | "pinterest" | "tiktok";

export interface SavedItem {
  id: string;
  title: string;
  imageUrl: string;
  platform: Platform;
  contentType: ContentType;
  aspectRatio: number;
  metadata?: SavedItemMetadata;
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
    title: "Kiralık konut · Kadıköy · ★5,0 · 3 yatak odası · 4 yatak · 1 banyo",
    imageUrl: "https://picsum.photos/seed/airbnb/400/400",
    platform: "airbnb",
    contentType: "link",
    aspectRatio: 1.0,
  },
  {
    id: "2",
    title: "Cüneyt Arkın (@cunetarkin1) · Instagram fotoğrafları ve videoları",
    imageUrl: "https://picsum.photos/seed/arkin/400/400",
    platform: "instagram",
    contentType: "image",
    aspectRatio: 1.0,
  },
  {
    id: "3",
    title: "https://x.com/Haber/status/2033330012544278631?s=20",
    imageUrl: "",
    platform: "x",
    contentType: "post",
    aspectRatio: 1.0,
  },
  {
    id: "4",
    title: "Tuna adlı kullanıcıdan bu Pine göz atın",
    imageUrl: "https://picsum.photos/seed/bmw/400/400",
    platform: "pinterest",
    contentType: "image",
    aspectRatio: 1.0,
  },
  {
    id: "5",
    title: "MUHTEŞEMSİN ARDA GÜLER 🎉 HARİKA GOL 🔥",
    imageUrl: "https://picsum.photos/seed/arda/400/225",
    platform: "youtube",
    contentType: "video",
    aspectRatio: 1.0,
    metadata: { width: 1920, height: 1080 },
  },
  {
    id: "6",
    title: "Yandex — hızlı İnternet araması",
    imageUrl: "",
    platform: "link",
    contentType: "link",
    aspectRatio: 1.0,
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
