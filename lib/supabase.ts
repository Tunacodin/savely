import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SUPABASE_URL = "https://djdwolekentrczauhlpl.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqZHdvbGVrZW50cmN6YXVobHBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4NjgwMzUsImV4cCI6MjA5MDQ0NDAzNX0.bzNWqAZA3dg7iUIr9GBMfBFk1oveJk_Q-QmWp7d-HCU";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
