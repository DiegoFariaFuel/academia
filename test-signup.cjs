const { createClient } = require('@supabase/supabase-js');
const url = 'https://dzsiizepifzoifdhmtxr.supabase.co';
const key = 'sb_publishable_CBAA6lTXswcqrl04A2hUMA_fCGeIQAp';
const supabase = createClient(url, key);

async function test() {
  const { data, error } = await supabase.auth.signUp({ 
    email: 'test@example.com', 
    password: 'password123',
    options: {
      data: { nome: 'teste', plano: 'profissional', role: 'staff' }
    }
  });
  console.log('Result:', { data, error });
}
test();
