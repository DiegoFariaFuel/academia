const { createClient } = require('@supabase/supabase-js');
const url = 'https://dzsiizepifzoifdhmtxr.supabase.co';
const key = 'sb_publishable_CBAA6lTXswcqrl04A2hUMA_fCGeIQAp';

// Force an invalid token into the "storage"
const fakeStorage = {
  getItem: () => JSON.stringify({
    access_token: 'fake_access_token',
    refresh_token: 'fake_refresh_token',
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    user: { id: '123' }
  }),
  setItem: () => {},
  removeItem: () => {}
};

const supabase = createClient(url, key, {
  auth: { storage: fakeStorage, persistSession: true, autoRefreshToken: true }
});

async function test() {
  console.log('Initializing client and getting session...');
  const { data, error } = await supabase.auth.getSession();
  console.log('Session result:', data.session ? 'Found' : 'Null');
  
  // Wait a bit to see if any background requests happen
  await new Promise(r => setTimeout(r, 2000));
  console.log('Done.');
}
test();
