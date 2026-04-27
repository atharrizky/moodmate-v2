import { createClient } from '@supabase/supabase-js';

// Mengambil URL dan Key dari file .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Membuat mesin penghubung ke database
export const supabase = createClient(supabaseUrl, supabaseKey);