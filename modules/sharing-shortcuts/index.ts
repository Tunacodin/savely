import { Platform } from "react-native";
import { requireOptionalNativeModule } from "expo";

export interface CollectionShortcut {
  id: string;
  name: string;
  emoji: string;
  bgColor: string;
}

export interface NativeCredentials {
  accessToken: string | null;
  userId: string | null;
  supabaseUrl: string;
  anonKey: string;
}

export interface PendingItem {
  url: string;
  collectionId: string | null;
}

interface SharingShortcutsNativeModule {
  pushCollectionShortcuts(collections: CollectionShortcut[]): Promise<void>;
  removeAllShortcuts(): Promise<void>;
  consumeShortcutId(): Promise<string | null>;
  setCredentials(creds: NativeCredentials): Promise<void>;
  clearCredentials(): Promise<void>;
  drainPendingItems(): Promise<PendingItem[]>;
}

const native = requireOptionalNativeModule<SharingShortcutsNativeModule>("SharingShortcuts");

export async function pushCollectionShortcuts(collections: CollectionShortcut[]): Promise<void> {
  if (Platform.OS !== "android" || !native) return;
  await native.pushCollectionShortcuts(collections.slice(0, 4));
}

export async function removeAllShortcuts(): Promise<void> {
  if (Platform.OS !== "android" || !native) return;
  await native.removeAllShortcuts();
}

export async function consumeShortcutId(): Promise<string | null> {
  if (Platform.OS !== "android" || !native) return null;
  return native.consumeShortcutId();
}

export async function setNativeCredentials(creds: NativeCredentials): Promise<void> {
  if (Platform.OS !== "android" || !native) return;
  await native.setCredentials(creds);
}

export async function clearNativeCredentials(): Promise<void> {
  if (Platform.OS !== "android" || !native) return;
  await native.clearCredentials();
}

export async function drainPendingItems(): Promise<PendingItem[]> {
  if (Platform.OS !== "android" || !native) return [];
  return native.drainPendingItems();
}

export const COLLECTION_SHORTCUT_PREFIX = "collection-";

export function shortcutIdToCollectionId(shortcutId: string | null): string | null {
  if (!shortcutId) return null;
  if (!shortcutId.startsWith(COLLECTION_SHORTCUT_PREFIX)) return null;
  return shortcutId.slice(COLLECTION_SHORTCUT_PREFIX.length);
}
