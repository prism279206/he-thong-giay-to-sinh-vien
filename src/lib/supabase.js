import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
  'https://placeholder.supabase.co';
const supabaseAnonKey =
  (typeof import.meta !== 'undefined' &&
    (import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY ||
      import.meta.env?.VITE_SUPABASE_ANON_KEY)) ||
  'placeholder-anon-key';

if (
  !supabaseUrl ||
  supabaseUrl === 'https://placeholder.supabase.co' ||
  !supabaseAnonKey ||
  supabaseAnonKey === 'placeholder-anon-key'
) {
  console.warn(
    'Chưa cấu hình VITE_SUPABASE_URL hoặc VITE_SUPABASE_PUBLISHABLE_KEY trong file .env!'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

