import { getLinkPreview } from "link-preview-js";
import type { PlatformName, SavedItemMetadata } from "@/types";

interface MetadataResult {
  metadata: SavedItemMetadata;
  title?: string;
  imageUrl?: string;
}

const TIMEOUT = 5000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Timeout")), ms)
    ),
  ]);
}

// Tier 1: Direct thumbnail URLs (no network call needed for known patterns)
function getDirectThumbnail(
  platform: PlatformName,
  contentId: string | null
): string | null {
  if (!contentId) return null;

  if (platform === "youtube") {
    return `https://img.youtube.com/vi/${contentId}/hqdefault.jpg`;
  }
  return null;
}

// Tier 2: Free oEmbed endpoints (no auth required)
const OEMBED_ENDPOINTS: Partial<Record<PlatformName, string>> = {
  youtube: "https://www.youtube.com/oembed",
  tiktok: "https://www.tiktok.com/oembed",
  spotify: "https://open.spotify.com/oembed",
  x: "https://publish.twitter.com/oembed",
};

async function fetchOEmbed(
  platform: PlatformName,
  url: string
): Promise<MetadataResult | null> {
  const endpoint = OEMBED_ENDPOINTS[platform];
  if (!endpoint) return null;

  try {
    const oembedUrl = `${endpoint}?url=${encodeURIComponent(url)}&format=json`;
    const response = await withTimeout(fetch(oembedUrl), TIMEOUT);

    if (!response.ok) return null;

    const data = await response.json();
    return {
      metadata: {
        ogTitle: data.title,
        author: data.author_name,
        siteName: data.provider_name,
        thumbnailUrl: data.thumbnail_url,
      },
      title: data.title,
      imageUrl: data.thumbnail_url,
    };
  } catch {
    return null;
  }
}

// Tier 3: OG tag scraping via link-preview-js
async function fetchLinkPreview(url: string): Promise<MetadataResult | null> {
  try {
    const preview = await withTimeout(
      getLinkPreview(url, { timeout: TIMEOUT }),
      TIMEOUT
    );

    if ("title" in preview) {
      const images = "images" in preview ? preview.images : [];
      return {
        metadata: {
          ogTitle: preview.title,
          ogDescription: "description" in preview ? preview.description : undefined,
          ogImage: images[0],
          siteName: preview.siteName,
        },
        title: preview.title,
        imageUrl: images[0],
      };
    }

    if ("mediaType" in preview && preview.mediaType === "image") {
      return {
        metadata: { ogImage: preview.url },
        imageUrl: preview.url,
      };
    }

    return null;
  } catch {
    return null;
  }
}

export async function extractMetadata(
  url: string,
  platform: PlatformName,
  contentId: string | null
): Promise<MetadataResult> {
  const directThumb = getDirectThumbnail(platform, contentId);

  // Tier 2: oEmbed
  const oembedResult = await fetchOEmbed(platform, url);
  if (oembedResult) {
    return {
      ...oembedResult,
      imageUrl: oembedResult.imageUrl ?? directThumb ?? undefined,
    };
  }

  // Tier 3: Link preview
  const previewResult = await fetchLinkPreview(url);
  if (previewResult) {
    return {
      ...previewResult,
      imageUrl: previewResult.imageUrl ?? directThumb ?? undefined,
    };
  }

  // Fallback: return whatever we got from direct thumbnail
  return {
    metadata: {
      thumbnailUrl: directThumb ?? undefined,
    },
    imageUrl: directThumb ?? undefined,
  };
}
