import { useState, useEffect, useCallback } from "react";
import { AppState } from "react-native";
import {
  checkBubblePermissions,
  requestOverlayPermission,
  requestAccessibilityPermission,
  startBubble,
  stopBubble,
  isBubbleRunning,
  updateBubbleCollections,
  type BubblePermissions,
} from "@/modules/floating-bubble";
import { useSavedItemsStore } from "@/store/saved-items";

export function useBubble() {
  const [permissions, setPermissions] = useState<BubblePermissions>({ overlay: false, accessibility: false });
  const [running, setRunning] = useState(false);
  const [checking, setChecking] = useState(true);
  const collections = useSavedItemsStore((s) => s.collections);

  const refresh = useCallback(async () => {
    const [perms, isRunning] = await Promise.all([
      checkBubblePermissions(),
      isBubbleRunning(),
    ]);
    setPermissions(perms);
    setRunning(isRunning);
    setChecking(false);
  }, []);

  useEffect(() => {
    refresh();
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") refresh();
    });
    return () => sub.remove();
  }, [refresh]);

  // Keep native side in sync whenever collections change
  useEffect(() => {
    if (collections.length > 0) {
      updateBubbleCollections(
        collections.map((c) => ({ id: c.id, name: c.name, emoji: c.emoji, bgColor: c.bgColor }))
      ).catch(() => {});
    }
  }, [collections]);

  const toggleBubble = useCallback(async () => {
    if (running) {
      await stopBubble();
      setRunning(false);
    } else {
      await startBubble();
      setRunning(true);
    }
  }, [running]);

  return {
    permissions,
    running,
    checking,
    refresh,
    toggleBubble,
    requestOverlayPermission,
    requestAccessibilityPermission,
  };
}
