import { Platform } from "react-native";
import { requireOptionalNativeModule } from "expo";

export interface ShareCollection {
  id: string;
  name: string;
  emoji: string;
  bgColor: string;
}

export interface ShareSession {
  accessToken: string;
  userId: string;
}

export interface PendingShare {
  url: string;
  collectionId: string | null;
  createdCollectionName: string | null;
  createdCollectionEmoji: string | null;
  createdCollectionBgColor: string | null;
}

interface SavelyShareExtensionNativeModule {
  setSession(session: ShareSession): Promise<void>;
  clearSession(): Promise<void>;
  setCollections(collections: ShareCollection[]): Promise<void>;
  drainPendingShares(): Promise<PendingShare[]>;
  consumeOpenedShareUrl(): Promise<string | null>;
}

const native = requireOptionalNativeModule<SavelyShareExtensionNativeModule>("SavelyShareExtension");

export async function setShareSession(session: ShareSession): Promise<void> {
  if (Platform.OS !== "ios" || !native) return;
  await native.setSession(session);
}

export async function clearShareSession(): Promise<void> {
  if (Platform.OS !== "ios" || !native) return;
  await native.clearSession();
}

export async function setShareCollections(collections: ShareCollection[]): Promise<void> {
  if (Platform.OS !== "ios" || !native) return;
  await native.setCollections(collections.slice(0, 6));
}

export async function drainPendingShares(): Promise<PendingShare[]> {
  if (Platform.OS !== "ios" || !native) return [];
  return native.drainPendingShares();
}

export async function consumeOpenedShareUrl(): Promise<string | null> {
  if (Platform.OS !== "ios" || !native) return null;
  return native.consumeOpenedShareUrl();
}
