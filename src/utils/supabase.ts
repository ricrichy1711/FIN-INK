import { createClient } from '@supabase/supabase-js';

// ¡LAS CLAVES SE QUEDARON FIJAS AQUÍ PARA QUE VERCEL NO FALLE!
// Como el ANON_KEY es público por defecto, es completamente seguro tenerlas aquí.
const supabaseUrl = 'https://oijdhwsuyswmeegcrbuq.supabase.co';
const supabaseAnonKey = 'sb_publishable__A4SMLpftMmIJLHjaUVcMA_6QSnvLTw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
