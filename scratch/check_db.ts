import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

async function check() {
  const { data, error } = await supabase.from('playlists').select('*').limit(1);
  if (error) {
    console.error('Error fetching playlists:', error);
  } else {
    console.log('Playlists table exists. Sample data:', data);
  }
}

check();
