import { create } from "zustand";
import { supabase } from "@/lib/supabase";

export type NotificationFrequency = "low" | "normal" | "high";

interface NotificationPreferences {
  enabled: boolean;
  frequency: NotificationFrequency;
  quietHoursStart: string;
  quietHoursEnd: string;
  timezone: string;
  pausedUntil: string | null;
  categoryOptOuts: string[];
}

interface NotificationState {
  preferences: NotificationPreferences;
  isLoading: boolean;
  loadPreferences: (userId: string) => Promise<void>;
  updatePreferences: (updates: Partial<NotificationPreferences>) => Promise<void>;
  toggleCategory: (slug: string) => Promise<void>;
  pauseNotifications: (days: number) => Promise<void>;
  resumeNotifications: () => Promise<void>;
}

const DEFAULT_PREFS: NotificationPreferences = {
  enabled: true,
  frequency: "normal",
  quietHoursStart: "22:00",
  quietHoursEnd: "08:00",
  timezone: "Europe/Istanbul",
  pausedUntil: null,
  categoryOptOuts: [],
};

export const useNotificationStore = create<NotificationState>((set, get) => ({
  preferences: DEFAULT_PREFS,
  isLoading: false,

  loadPreferences: async (userId: string) => {
    set({ isLoading: true });
    const { data } = await supabase
      .from("notification_preferences")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (data) {
      set({
        preferences: {
          enabled: data.enabled ?? true,
          frequency: data.frequency ?? "normal",
          quietHoursStart: data.quiet_hours_start ?? "22:00",
          quietHoursEnd: data.quiet_hours_end ?? "08:00",
          timezone: data.timezone ?? "Europe/Istanbul",
          pausedUntil: data.paused_until,
          categoryOptOuts: data.category_opt_outs ?? [],
        },
      });
    }
    set({ isLoading: false });
  },

  updatePreferences: async (updates) => {
    const current = get().preferences;
    const merged = { ...current, ...updates };
    set({ preferences: merged });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("notification_preferences").upsert({
      user_id: user.id,
      enabled: merged.enabled,
      frequency: merged.frequency,
      quiet_hours_start: merged.quietHoursStart,
      quiet_hours_end: merged.quietHoursEnd,
      timezone: merged.timezone,
      paused_until: merged.pausedUntil,
      category_opt_outs: merged.categoryOptOuts,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });
  },

  toggleCategory: async (slug: string) => {
    const { preferences, updatePreferences } = get();
    const optOuts = preferences.categoryOptOuts.includes(slug)
      ? preferences.categoryOptOuts.filter((s) => s !== slug)
      : [...preferences.categoryOptOuts, slug];
    await updatePreferences({ categoryOptOuts: optOuts });
  },

  pauseNotifications: async (days: number) => {
    const until = new Date();
    until.setDate(until.getDate() + days);
    await get().updatePreferences({ pausedUntil: until.toISOString() });
  },

  resumeNotifications: async () => {
    await get().updatePreferences({ pausedUntil: null });
  },
}));
