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
  imageUrl?: string | number; // string for network, number for local require()
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

export type PremiumTier = "free" | "pro";

export type BillingPeriod = "monthly" | "yearly";

export interface PremiumPlan {
  id: string;
  tier: PremiumTier;
  billingPeriod: BillingPeriod;
  price: number;
  currency: string;
  features: string[];
}

export interface UserSubscription {
  tier: PremiumTier;
  currentPlan?: PremiumPlan;
  expiresAt?: string;
}
