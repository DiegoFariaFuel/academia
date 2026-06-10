const { createClient } = require('@supabase/supabase-js');
const url = 'https://dzsiizepifzoifdhmtxr.supabase.co';
const key = 'sb_publishable_CBAA6lTXswcqrl04A2hUMA_fCGeIQAp';
const supabase = createClient(url, key);

async function test() {
  const { data: { session }, error: signError } = await supabase.auth.signInWithPassword({
    email: 'test@example.com',
    password: 'password123'
  });
  
  if (signError) {
    console.error('Sign in error:', signError.message);
    return;
  }
  
  console.log('Logged in, updating user...');
  const { data, error } = await supabase.auth.updateUser({ password: '123' });
  console.log('Update Result:', { data, error });
}
test();
