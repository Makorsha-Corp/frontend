import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

function createDisabledClient(): SupabaseClient {
  const noopSub = { unsubscribe: () => {} };

  const chain: unknown = new Proxy(() => chain, {
    apply: () => chain,
    get: (_target, prop) => {
      if (prop === "data") return null;
      if (prop === "error") return null;
      if (prop === "count") return 0;
      if (prop === "subscribe") return () => noopSub;
      return chain;
    },
  });

  const auth = {
    getSession: async () => ({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: noopSub } }),
    signOut: async () => ({ error: null }),
    signInWithPassword: async () => ({
      data: { session: null, user: null },
      error: new Error("Supabase is not configured"),
    }),
  };

  return new Proxy({} as SupabaseClient, {
    get(_target, prop) {
      if (prop === "auth") return auth;
      if (prop === "channel") return () => chain;
      if (prop === "from") return () => chain;
      if (prop === "removeChannel") return () => {};
      return chain;
    },
  });
}

export const supabase_client = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : createDisabledClient();
