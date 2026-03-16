export type { PlatformName } from "@/components/ui/platform-badge";

export type ContentType =
  | "video"
  | "image"
  | "article"
  | "audio"
  | "post"
  | "link";

export interface SavedItemMetadata {
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  siteName?: string;
  author?: string;
  thumbnailUrl?: string;
  duration?: string;
  publishedAt?: string;
  width?: number;
  height?: number;
}

export interface SavedItem {
  id: string;
  url: string;
  title: string;
  description?: string;
  imageUrl?: string;
  platform: import("@/components/ui/platform-badge").PlatformName;
  contentType: ContentType;
  metadata?: SavedItemMetadata;
  collectionId?: string;
  isEnriched: boolean;
  aspectRatio: number;
  createdAt: string;
  updatedAt: string;
}

export interface Collection {
  id: string;
  name: string;
  emoji: string;
  bgColor: string;
  itemCount: number;
  createdAt: string;
}
