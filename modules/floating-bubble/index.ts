import { Platform } from "react-native";
import { requireOptionalNativeModule } from "expo";

export interface BubbleCollection {
  id: string;
  name: string;
  emoji: string;
  bgColor: string;
}

export interface BubblePermissions {
  overlay: boolean;
  accessibility: boolean;
}

interface FloatingBubbleNativeModule {
  checkPermissions(): Promise<BubblePermissions>;
  requestOverlayPermission(): Promise<void>;
  requestAccessibilityPermission(): Promise<void>;
  startBubble(): Promise<void>;
  stopBubble(): Promise<void>;
  isBubbleRunning(): Promise<boolean>;
  updateCollections(collections: BubbleCollection[]): Promise<void>;
  getLogs(): Promise<string>;
  clearLogs(): Promise<void>;
}

const native = requireOptionalNativeModule<FloatingBubbleNativeModule>("FloatingBubble");

export async function checkBubblePermissions(): Promise<BubblePermissions> {
  if (Platform.OS !== "android" || !native) return { overlay: false, accessibility: false };
  return native.checkPermissions();
}

export async function requestOverlayPermission(): Promise<void> {
  if (Platform.OS !== "android" || !native) return;
  return native.requestOverlayPermission();
}

export async function requestAccessibilityPermission(): Promise<void> {
  if (Platform.OS !== "android" || !native) return;
  return native.requestAccessibilityPermission();
}

export async function startBubble(): Promise<void> {
  if (Platform.OS !== "android" || !native) return;
  return native.startBubble();
}

export async function stopBubble(): Promise<void> {
  if (Platform.OS !== "android" || !native) return;
  return native.stopBubble();
}

export async function isBubbleRunning(): Promise<boolean> {
  if (Platform.OS !== "android" || !native) return false;
  return native.isBubbleRunning();
}

export async function updateBubbleCollections(collections: BubbleCollection[]): Promise<void> {
  if (Platform.OS !== "android" || !native) return;
  return native.updateCollections(collections);
}

export async function getBubbleLogs(): Promise<string> {
  if (Platform.OS !== "android" || !native) return "";
  return native.getLogs();
}

export async function clearBubbleLogs(): Promise<void> {
  if (Platform.OS !== "android" || !native) return;
  return native.clearLogs();
}
