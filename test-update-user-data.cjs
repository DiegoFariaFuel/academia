const { createClient } = require('@supabase/supabase-js');
const url = 'https://dzsiizepifzoifdhmtxr.supabase.co';
const key = 'sb_publishable_CBAA6lTXswcqrl04A2hUMA_fCGeIQAp';
const supabase = createClient(url, key);

async function test() {
  const { data: { session }, error: signError } = await supabase.auth.signInWithPassword({
    email: 'test@example.com',
    password: 'password123'
  });
  const { data, error } = await supabase.auth.updateUser({ data: "invalid_data" });
  console.log('Result:', { data, error });
}
test();
