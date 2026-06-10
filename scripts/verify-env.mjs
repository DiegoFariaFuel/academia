import fs from 'node:fs';

let VITE_SUPABASE_URL = process.env.VITE_SUPABASE_URL;
let VITE_SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!VITE_SUPABASE_URL || !VITE_SUPABASE_ANON_KEY) {
  if (fs.existsSync('.env')) {
    const dotenvContent = fs.readFileSync('.env', 'utf-8');
    const env = {};
    dotenvContent.split('\n').forEach(line => {
      const parts = line.split('=');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
        env[key] = value;
      }
    });
    VITE_SUPABASE_URL = VITE_SUPABASE_URL || env.VITE_SUPABASE_URL;
    VITE_SUPABASE_ANON_KEY = VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY;
  }
}

if (!VITE_SUPABASE_URL) {
  console.error('Error: VITE_SUPABASE_URL is missing.');
  process.exit(1);
}

if (!VITE_SUPABASE_ANON_KEY) {
  console.error('Error: VITE_SUPABASE_ANON_KEY is missing.');
  process.exit(1);
}

if (VITE_SUPABASE_URL.toLowerCase().includes('placeholder')) {
  console.error('Error: VITE_SUPABASE_URL contains a placeholder.');
  process.exit(1);
}

if (VITE_SUPABASE_ANON_KEY.toLowerCase().includes('placeholder')) {
  console.error('Error: VITE_SUPABASE_ANON_KEY contains a placeholder.');
  process.exit(1);
}
