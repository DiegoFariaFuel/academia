const { createClient } = require('@supabase/supabase-js');
const url = 'https://dzsiizepifzoifdhmtxr.supabase.co';
const key = 'sb_publishable_CBAA6lTXswcqrl04A2hUMA_fCGeIQAp';
const supabase = createClient(url, key);

async function test() {
  const { data, error } = await supabase.auth.updateUser({ password: '123' });
  console.log('Result:', { data, error });
}
test();
