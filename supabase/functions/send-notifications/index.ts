import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

interface EligibleUser {
  user_id: string;
  expo_push_token: string;
  timezone: string;
  frequency: string;
  quiet_hours_start: string;
  quiet_hours_end: string;
  display_name: string | null;
  category_opt_outs: string[];
}

interface Category {
  slug: string;
  display_name: string;
  keywords: string[];
  icon: string;
  priority: number;
}

interface Template {
  id: string;
  category_slug: string | null;
  title: string;
  body: string;
  time_slot: string;
}

interface Collection {
  id: string;
  name: string;
  item_count: number;
}

function getTimeSlot(hour: number): string {
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

function getLocalHour(timezone: string): number {
  try {
    const now = new Date();
    const str = now.toLocaleString("en-US", { timeZone: timezone, hour: "numeric", hour12: false });
    return parseInt(str, 10);
  } catch {
    return new Date().getUTCHours() + 3; // fallback to Turkey
  }
}

function isInQuietHours(hour: number, start: string, end: string): boolean {
  const s = parseInt(start.split(":")[0], 10);
  const e = parseInt(end.split(":")[0], 10);
  if (s > e) {
    // overnight quiet hours (e.g., 22:00 - 08:00)
    return hour >= s || hour < e;
  }
  return hour >= s && hour < e;
}

function matchCollectionToCategory(name: string, categories: Category[]): Category | null {
  const lower = name.toLowerCase().trim();
  const sorted = [...categories].sort((a, b) => b.priority - a.priority);
  for (const cat of sorted) {
    for (const keyword of cat.keywords) {
      if (lower.includes(keyword.toLowerCase())) {
        return cat;
      }
    }
  }
  return null;
}

function renderTemplate(body: string, vars: Record<string, string>): string {
  let result = body;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
  }
  return result;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getMinHoursForFrequency(freq: string): number {
  switch (freq) {
    case "low": return 72;
    case "high": return 4;
    default: return 8;
  }
}

Deno.serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Parse time slot from request body or auto-detect
    let requestedSlot: string | undefined;
    try {
      const body = await req.json();
      requestedSlot = body?.time_slot;
    } catch {
      // no body
    }

    // Load categories
    const { data: categories } = await supabase
      .from("default_categories")
      .select("slug, display_name, keywords, icon, priority")
      .eq("is_active", true);

    if (!categories?.length) {
      return new Response(JSON.stringify({ error: "No categories" }), { status: 500 });
    }

    // Load templates
    const { data: templates } = await supabase
      .from("notification_templates")
      .select("id, category_slug, title, body, time_slot")
      .eq("is_active", true);

    if (!templates?.length) {
      return new Response(JSON.stringify({ error: "No templates" }), { status: 500 });
    }

    // Get eligible users (default 8h gap)
    const { data: users } = await supabase.rpc("get_eligible_notification_users", {
      min_hours_since_last: 4, // minimum gap, frequency check is done per-user
    });

    if (!users?.length) {
      return new Response(JSON.stringify({ success: true, notified: 0, reason: "no eligible users" }));
    }

    const messages: any[] = [];
    const logEntries: any[] = [];

    for (const user of users as EligibleUser[]) {
      // Check quiet hours in user's timezone
      const localHour = getLocalHour(user.timezone);
      if (isInQuietHours(localHour, user.quiet_hours_start, user.quiet_hours_end)) {
        continue;
      }

      const timeSlot = requestedSlot || getTimeSlot(localHour);

      // Get user's collections
      const { data: collections } = await supabase
        .from("collections")
        .select("id, name, item_count")
        .eq("user_id", user.user_id)
        .gt("item_count", 0);

      if (!collections?.length) continue;

      // Pick a random collection
      const collection = pickRandom(collections as Collection[]);

      // Match to category
      const category = matchCollectionToCategory(collection.name, categories as Category[]);
      const categorySlug = category?.slug ?? null;

      // Check if user opted out of this category
      if (categorySlug && user.category_opt_outs.includes(categorySlug)) {
        continue;
      }

      // Find matching templates
      let candidates = templates.filter((t: Template) => t.category_slug === categorySlug);

      // Prefer time-slot specific, fallback to 'any'
      let slotMatches = candidates.filter((t: Template) => t.time_slot === timeSlot);
      if (!slotMatches.length) {
        slotMatches = candidates.filter((t: Template) => t.time_slot === "any");
      }
      if (!slotMatches.length) {
        // Fallback to generic templates
        candidates = templates.filter((t: Template) => t.category_slug === null);
        slotMatches = candidates.filter((t: Template) => t.time_slot === timeSlot);
        if (!slotMatches.length) {
          slotMatches = candidates.filter((t: Template) => t.time_slot === "any");
        }
      }
      if (!slotMatches.length) continue;

      const template = pickRandom(slotMatches as Template[]);

      const renderedBody = renderTemplate(template.body, {
        collection_name: collection.name,
        item_count: String(collection.item_count),
        user_name: user.display_name || "",
      });

      messages.push({
        to: user.expo_push_token,
        title: template.title,
        body: renderedBody,
        sound: "default",
        data: { collectionId: collection.id },
      });

      logEntries.push({
        user_id: user.user_id,
        template_id: template.id,
        category_slug: categorySlug,
        collection_id: collection.id,
        title: template.title,
        body: renderedBody,
        status: "sent",
      });
    }

    // Send in batches of 100
    let totalSent = 0;
    for (let i = 0; i < messages.length; i += 100) {
      const batch = messages.slice(i, i + 100);
      const res = await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(batch),
      });

      if (res.ok) {
        const result = await res.json();
        // Update log entries with ticket IDs
        const batchLogs = logEntries.slice(i, i + 100);
        if (result.data) {
          for (let j = 0; j < result.data.length; j++) {
            if (batchLogs[j] && result.data[j]?.id) {
              batchLogs[j].expo_ticket_id = result.data[j].id;
            }
            if (result.data[j]?.status === "error") {
              batchLogs[j].status = "failed";
            }
          }
        }
        totalSent += batch.length;
      }
    }

    // Log all notifications
    if (logEntries.length > 0) {
      await supabase.from("notification_log").insert(logEntries);
    }

    return new Response(
      JSON.stringify({ success: true, notified: totalSent, total_eligible: users.length }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
