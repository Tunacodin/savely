import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { SavedItem, Collection, SavedItemMetadata } from "@/types";
import type { PlatformName } from "@/components/ui/platform-badge";
import {
  savedItems as mockItems,
  collections as mockCollections,
} from "@/constants/mock-data";

// Convert mock data to full SavedItem format
const initialItems: SavedItem[] = mockItems.map((item) => ({
  id: item.id,
  url: "",
  title: item.title,
  imageUrl: item.imageUrl,
  platform: item.platform as PlatformName,
  contentType: item.contentType,
  metadata: item.metadata,
  isEnriched: !!item.metadata,
  aspectRatio: item.aspectRatio,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}));

const initialCollections: Collection[] = mockCollections.map((c) => ({
  ...c,
  createdAt: new Date().toISOString(),
}));

interface SavedItemsState {
  items: SavedItem[];
  collections: Collection[];
  addItem: (item: Omit<SavedItem, "id" | "createdAt" | "updatedAt">) => string;
  removeItem: (id: string) => void;
  updateItem: (id: string, updates: Partial<SavedItem>) => void;
  enrichItem: (
    id: string,
    metadata: SavedItemMetadata,
    title?: string,
    imageUrl?: string
  ) => void;
  addCollection: (collection: Omit<Collection, "id" | "createdAt">) => string;
  removeCollection: (id: string) => void;
}

export const useSavedItemsStore = create<SavedItemsState>()(
  persist(
    (set) => ({
      items: initialItems,
      collections: initialCollections,

      addItem: (item) => {
        const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
        const now = new Date().toISOString();
        set((state) => ({
          items: [
            { ...item, id, createdAt: now, updatedAt: now },
            ...state.items,
          ],
        }));
        return id;
      },

      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
        })),

      updateItem: (id, updates) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.id === id
              ? { ...i, ...updates, updatedAt: new Date().toISOString() }
              : i
          ),
        })),

      enrichItem: (id, metadata, title, imageUrl) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.id === id
              ? {
                  ...i,
                  metadata,
                  ...(title && !i.title ? { title } : {}),
                  ...(imageUrl && !i.imageUrl ? { imageUrl } : {}),
                  isEnriched: true,
                  updatedAt: new Date().toISOString(),
                }
              : i
          ),
        })),

      addCollection: (collection) => {
        const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
        set((state) => ({
          collections: [
            ...state.collections,
            { ...collection, id, createdAt: new Date().toISOString() },
          ],
        }));
        return id;
      },

      removeCollection: (id) =>
        set((state) => ({
          collections: state.collections.filter((c) => c.id !== id),
        })),
    }),
    {
      name: "savely-saved-items",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
