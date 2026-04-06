import { supabase } from "@/lib/supabase";
import * as FileSystem from "expo-file-system/legacy";

const BUCKET = "item-images";

/** Platforms whose CDN image URLs expire */
const EXPIRING_HOSTS = [
  // Meta (Instagram, Facebook, Threads)
  "cdninstagram.com",
  "fbcdn.net",
  "fbsbx.com",
  "facebook.com/photo",
  // TikTok
  "tiktokcdn.com",
  "tiktokcdn-us.com",
  "musical.ly",
  // LinkedIn
  "media.licdn.com",
  // Snapchat
  "snap-storage",
  "sc-cdn.net",
];

/** Returns true if the image URL will expire and needs to be persisted */
export function isExpiringUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return EXPIRING_HOSTS.some((h) => host.includes(h));
  } catch {
    return false;
  }
}

/**
 * Downloads an image and uploads it to Supabase Storage.
 * Returns the permanent public URL, or the original URL on failure.
 */
export async function persistImage(
  imageUrl: string,
  itemId: string
): Promise<string> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return imageUrl;

    // Determine file extension from content or default to jpg
    const ext = "jpg";
    const path = `${user.id}/${itemId}.${ext}`;

    // Download to temp file
    const tmpPath = `${FileSystem.cacheDirectory}${itemId}.${ext}`;
    const download = await FileSystem.downloadAsync(imageUrl, tmpPath);

    if (download.status !== 200) return imageUrl;

    // Read as base64
    const base64 = await FileSystem.readAsStringAsync(tmpPath, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Decode base64 to Uint8Array for upload
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Upload to Supabase Storage
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, bytes, {
        contentType: "image/jpeg",
        upsert: true,
      });

    if (error) return imageUrl;

    // Get public URL
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);

    // Clean up temp file
    FileSystem.deleteAsync(tmpPath, { idempotent: true });

    return data.publicUrl;
  } catch {
    return imageUrl;
  }
}
