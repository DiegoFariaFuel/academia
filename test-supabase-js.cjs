const { createClient } = require('@supabase/supabase-js');
const url = 'https://dzsiizepifzoifdhmtxr.supabase.co';
const key = 'sb_publishable_CBAA6lTXswcqrl04A2hUMA_fCGeIQAp';

const supabase = createClient(url, key);

async function test() {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'password123'
    });
    console.log('Result:', { data, error });
  } catch (err) {
    console.error('Exception:', err.message);
  }
}

test();
