import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabaseKey) {
    throw new Error(
        'Thiếu biến môi trường Supabase. Hãy tạo file .env từ .env.example rồi chạy lại npm run dev.'
    )
}

export const supabase = createClient(supabaseUrl, supabaseKey)