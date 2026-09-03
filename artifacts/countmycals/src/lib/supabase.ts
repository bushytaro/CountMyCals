import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const SUPABASE_REQUEST_TIMEOUT_MS = 10_000;

const fetchWithTimeout: typeof fetch = async (input, init) => {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(
    () => controller.abort(),
    SUPABASE_REQUEST_TIMEOUT_MS,
  );

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    window.clearTimeout(timeoutId);
  }
};

export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey, {
      global: { fetch: fetchWithTimeout },
    })
  : null;

export const isSupabaseConfigured = () => !!supabase;
