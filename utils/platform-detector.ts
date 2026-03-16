import type { PlatformName, ContentType } from "@/types";

interface PlatformDetectResult {
  platform: PlatformName;
  contentId: string | null;
}

const PLATFORM_PATTERNS: {
  platform: PlatformName;
  patterns: RegExp[];
  idExtractor?: (url: string) => string | null;
}[] = [
  {
    platform: "youtube",
    patterns: [
      /(?:youtube\.com|youtu\.be)/i,
    ],
    idExtractor: (url) => {
      const match =
        url.match(/(?:v=|\/embed\/|\/v\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/) ??
        url.match(/shorts\/([a-zA-Z0-9_-]{11})/);
      return match?.[1] ?? null;
    },
  },
  {
    platform: "tiktok",
    patterns: [/tiktok\.com/i],
    idExtractor: (url) => {
      const match = url.match(/video\/(\d+)/);
      return match?.[1] ?? null;
    },
  },
  {
    platform: "instagram",
    patterns: [/instagram\.com/i],
    idExtractor: (url) => {
      const match = url.match(/\/(p|reel|tv)\/([A-Za-z0-9_-]+)/);
      return match?.[2] ?? null;
    },
  },
  {
    platform: "x",
    patterns: [/(?:twitter\.com|x\.com)/i],
    idExtractor: (url) => {
      const match = url.match(/status\/(\d+)/);
      return match?.[1] ?? null;
    },
  },
  {
    platform: "spotify",
    patterns: [/spotify\.com/i],
    idExtractor: (url) => {
      const match = url.match(/(?:track|album|playlist|episode)\/([a-zA-Z0-9]+)/);
      return match?.[1] ?? null;
    },
  },
  {
    platform: "reddit",
    patterns: [/reddit\.com/i],
    idExtractor: (url) => {
      const match = url.match(/comments\/([a-z0-9]+)/);
      return match?.[1] ?? null;
    },
  },
  {
    platform: "pinterest",
    patterns: [/pinterest\./i],
    idExtractor: (url) => {
      const match = url.match(/pin\/(\d+)/);
      return match?.[1] ?? null;
    },
  },
  {
    platform: "medium",
    patterns: [/medium\.com/i],
  },
  {
    platform: "behance",
    patterns: [/behance\.net/i],
  },
  {
    platform: "facebook",
    patterns: [/facebook\.com|fb\.watch/i],
  },
  {
    platform: "airbnb",
    patterns: [/airbnb\./i],
  },
];

export function detectPlatform(url: string): PlatformDetectResult {
  for (const entry of PLATFORM_PATTERNS) {
    if (entry.patterns.some((p) => p.test(url))) {
      return {
        platform: entry.platform,
        contentId: entry.idExtractor?.(url) ?? null,
      };
    }
  }
  return { platform: "link", contentId: null };
}

const CONTENT_TYPE_MAP: Partial<Record<PlatformName, ContentType>> = {
  youtube: "video",
  tiktok: "video",
  spotify: "audio",
  pinterest: "image",
  behance: "image",
  medium: "article",
  reddit: "post",
  x: "post",
  facebook: "post",
};

export function inferContentType(platform: PlatformName, url: string): ContentType {
  if (platform === "instagram") {
    if (/\/reel\//i.test(url)) return "video";
    return "image";
  }
  if (platform === "youtube") {
    if (/shorts\//i.test(url)) return "video";
    return "video";
  }
  if (platform === "spotify") {
    if (/episode\//i.test(url)) return "audio";
    if (/track\//i.test(url)) return "audio";
    return "audio";
  }
  return CONTENT_TYPE_MAP[platform] ?? "link";
}

const URL_REGEX = /https?:\/\/[^\s<>"{}|\\^`[\]]+/i;

export function extractUrlFromText(text: string): string | null {
  const match = text.match(URL_REGEX);
  return match?.[0] ?? null;
}
