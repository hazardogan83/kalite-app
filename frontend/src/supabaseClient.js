import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://sehfqtwpvjcyanjzwnxh.supabase.co'
const supabaseAnonKey = 'sb_publishable_q7ZcoqBTFoddR59zhQ9vPA_xHlmtbu3'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)