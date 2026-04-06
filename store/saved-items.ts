import { create } from "zustand";
import type { SavedItem, Collection, SavedItemMetadata, UserSubscription, PremiumPlan } from "@/types";
import type { PlatformName } from "@/components/ui/platform-badge";
import { supabase } from "@/lib/supabase";

const freePlan: PremiumPlan = {
  id: "free",
  tier: "free",
  billingPeriod: "monthly",
  price: 0,
  currency: "USD",
  features: ["100 İçerik", "3 Koleksiyon"],
};

const proPlanMonthly: PremiumPlan = {
  id: "pro-monthly",
  tier: "pro",
  billingPeriod: "monthly",
  price: 4.99,
  currency: "USD",
  features: [
    "Sınırsız İçerik",
    "Sınırsız Koleksiyon",
    "Gelişmiş Arama Özellikleri",
    "Öncelikli Müşteri Desteği",
    "Reklamsız Deneyim",
    "Veri Yedekleme ve Geri Yükleme",
    "Erken Erişim Özellikleri",
  ],
};

const proPlanYearly: PremiumPlan = {
  id: "pro-yearly",
  tier: "pro",
  billingPeriod: "yearly",
  price: 33.33,
  currency: "USD",
  features: proPlanMonthly.features,
};

interface SavedItemsState {
  items: SavedItem[];
  collections: Collection[];
  recentSearches: string[];
  subscription: UserSubscription;
  availablePlans: PremiumPlan[];
  isLoading: boolean;

  loadUserData: (userId: string) => Promise<void>;
  clearUserData: () => void;

  addRecentSearch: (query: string) => Promise<void>;
  removeRecentSearch: (query: string) => Promise<void>;
  clearRecentSearches: () => Promise<void>;

  addItem: (item: Omit<SavedItem, "id" | "createdAt" | "updatedAt">) => Promise<string>;
  removeItem: (id: string) => Promise<void>;
  updateItem: (id: string, updates: Partial<SavedItem>) => Promise<void>;
  enrichItem: (id: string, metadata: SavedItemMetadata, title?: string, imageUrl?: string) => Promise<void>;

  addCollection: (collection: Omit<Collection, "id" | "createdAt">) => Promise<string>;
  updateCollection: (id: string, updates: Partial<Pick<Collection, "name" | "emoji" | "bgColor">>) => Promise<void>;
  removeCollection: (id: string) => Promise<void>;
  moveItemToCollection: (itemId: string, collectionId: string | undefined) => Promise<void>;

  upgradeToPremium: (plan: PremiumPlan) => void;
  downgradeToFree: () => void;
}

export const useSavedItemsStore = create<SavedItemsState>((set, get) => ({
  items: [],
  collections: [],
  recentSearches: [],
  subscription: { tier: "free", currentPlan: freePlan },
  availablePlans: [freePlan, proPlanMonthly, proPlanYearly],
  isLoading: false,

  loadUserData: async (userId) => {
    set({ isLoading: true });

    const [{ data: collectionsData }, { data: itemsData }, { data: searchesData }] = await Promise.all([
      supabase
        .from("collections")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true }),
      supabase
        .from("saved_items")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("recent_searches")
        .select("query")
        .eq("user_id", userId)
        .order("searched_at", { ascending: false })
        .limit(20),
    ]);

    const collections: Collection[] = (collectionsData ?? []).map((c) => ({
      id: c.id,
      name: c.name,
      emoji: c.emoji,
      bgColor: c.bg_color,
      itemCount: c.item_count,
      createdAt: c.created_at,
    }));

    const items: SavedItem[] = (itemsData ?? []).map((i) => ({
      id: i.id,
      url: i.url ?? "",
      title: i.title ?? "",
      description: i.description ?? undefined,
      imageUrl: i.image_url ?? undefined,
      platform: (i.platform ?? "link") as PlatformName,
      contentType: i.content_type ?? "link",
      aspectRatio: i.aspect_ratio ?? 1,
      metadata: i.metadata ?? {},
      isEnriched: i.is_enriched ?? false,
      collectionId: i.collection_id ?? undefined,
      createdAt: i.created_at,
      updatedAt: i.updated_at,
    }));

    const recentSearches = (searchesData ?? []).map((s) => s.query as string);

    set({ collections, items, recentSearches, isLoading: false });
  },

  clearUserData: () => set({ items: [], collections: [], recentSearches: [] }),

  addRecentSearch: async (query) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    set((state) => ({
      recentSearches: [trimmed, ...state.recentSearches.filter((q) => q !== trimmed)].slice(0, 20),
    }));

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase
      .from("recent_searches")
      .upsert(
        { user_id: user.id, query: trimmed, searched_at: new Date().toISOString() },
        { onConflict: "user_id,query" }
      );
  },

  removeRecentSearch: async (query) => {
    set((state) => ({
      recentSearches: state.recentSearches.filter((q) => q !== query),
    }));

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase
      .from("recent_searches")
      .delete()
      .eq("user_id", user.id)
      .eq("query", query);
  },

  clearRecentSearches: async () => {
    set({ recentSearches: [] });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase
      .from("recent_searches")
      .delete()
      .eq("user_id", user.id);
  },

  addItem: async (item) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("saved_items")
      .insert({
        user_id: user.id,
        collection_id: item.collectionId ?? null,
        url: item.url,
        title: item.title,
        description: item.description ?? null,
        image_url: typeof item.imageUrl === "string" ? item.imageUrl : null,
        platform: item.platform,
        content_type: item.contentType,
        aspect_ratio: item.aspectRatio ?? 1,
        metadata: item.metadata ?? {},
        is_enriched: item.isEnriched ?? false,
      })
      .select()
      .single();

    if (error) throw error;

    const now = new Date().toISOString();
    const newItem: SavedItem = {
      ...item,
      id: data.id,
      createdAt: data.created_at ?? now,
      updatedAt: data.updated_at ?? now,
    };

    set((state) => ({
      items: [newItem, ...state.items],
      collections: state.collections.map((c) =>
        c.id === item.collectionId ? { ...c, itemCount: c.itemCount + 1 } : c
      ),
    }));
    return data.id;
  },

  removeItem: async (id) => {
    const item = get().items.find((i) => i.id === id);
    await supabase.from("saved_items").delete().eq("id", id);
    set((state) => ({
      items: state.items.filter((i) => i.id !== id),
      collections: state.collections.map((c) =>
        c.id === item?.collectionId ? { ...c, itemCount: Math.max(0, c.itemCount - 1) } : c
      ),
    }));
  },

  updateItem: async (id, updates) => {
    const now = new Date().toISOString();
    set((state) => ({
      items: state.items.map((i) =>
        i.id === id ? { ...i, ...updates, updatedAt: now } : i
      ),
    }));

    const dbUpdates: Record<string, unknown> = { updated_at: now };
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.imageUrl !== undefined) dbUpdates.image_url = typeof updates.imageUrl === "string" ? updates.imageUrl : null;
    if (updates.platform !== undefined) dbUpdates.platform = updates.platform;
    if (updates.contentType !== undefined) dbUpdates.content_type = updates.contentType;
    if (updates.aspectRatio !== undefined) dbUpdates.aspect_ratio = updates.aspectRatio;
    if (updates.collectionId !== undefined) dbUpdates.collection_id = updates.collectionId ?? null;

    await supabase.from("saved_items").update(dbUpdates).eq("id", id);
  },

  enrichItem: async (id, metadata, title, imageUrl) => {
    const now = new Date().toISOString();
    set((state) => ({
      items: state.items.map((i) =>
        i.id === id
          ? {
              ...i,
              metadata,
              ...(title && !i.title ? { title } : {}),
              ...(imageUrl && !i.imageUrl ? { imageUrl } : {}),
              isEnriched: true,
              updatedAt: now,
            }
          : i
      ),
    }));

    await supabase
      .from("saved_items")
      .update({
        metadata,
        ...(title ? { title } : {}),
        ...(imageUrl ? { image_url: imageUrl } : {}),
        is_enriched: true,
        updated_at: now,
      })
      .eq("id", id);
  },

  addCollection: async (collection) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("collections")
      .insert({
        user_id: user.id,
        name: collection.name,
        emoji: collection.emoji,
        bg_color: collection.bgColor,
        item_count: 0,
      })
      .select()
      .single();

    if (error) throw error;

    const newCollection: Collection = {
      id: data.id,
      name: data.name,
      emoji: data.emoji,
      bgColor: data.bg_color,
      itemCount: 0,
      createdAt: data.created_at,
    };

    set((state) => ({ collections: [...state.collections, newCollection] }));
    return data.id;
  },

  updateCollection: async (id, updates) => {
    set((state) => ({
      collections: state.collections.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    }));

    const dbUpdates: Record<string, unknown> = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.emoji !== undefined) dbUpdates.emoji = updates.emoji;
    if (updates.bgColor !== undefined) dbUpdates.bg_color = updates.bgColor;

    await supabase.from("collections").update(dbUpdates).eq("id", id);
  },

  removeCollection: async (id) => {
    await supabase.from("collections").delete().eq("id", id);
    set((state) => ({
      collections: state.collections.filter((c) => c.id !== id),
      items: state.items.map((i) =>
        i.collectionId === id ? { ...i, collectionId: undefined } : i
      ),
    }));
  },

  moveItemToCollection: async (itemId, collectionId) => {
    await supabase
      .from("saved_items")
      .update({ collection_id: collectionId ?? null })
      .eq("id", itemId);

    set((state) => ({
      items: state.items.map((i) =>
        i.id === itemId ? { ...i, collectionId } : i
      ),
      // item_count'u yerel olarak da güncelle
      collections: state.collections.map((c) => {
        const count = state.items.filter(
          (i) => (i.id === itemId ? collectionId : i.collectionId) === c.id
        ).length;
        return { ...c, itemCount: count };
      }),
    }));
  },

  upgradeToPremium: (plan) =>
    set(() => ({
      subscription: {
        tier: "pro",
        currentPlan: plan,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
    })),

  downgradeToFree: () =>
    set(() => ({
      subscription: { tier: "free", currentPlan: freePlan },
    })),
}));
