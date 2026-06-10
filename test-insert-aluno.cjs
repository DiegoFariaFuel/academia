const { createClient } = require('@supabase/supabase-js');
const url = 'https://dzsiizepifzoifdhmtxr.supabase.co';
const key = 'sb_publishable_CBAA6lTXswcqrl04A2hUMA_fCGeIQAp';

const token = 'eyJhbGciOiJFUzI1NiIsImtpZCI6ImI5MzBhNDkzLTJmNjItNDI1Ny1iZjBjLWYzODQwMTA0ZTI0MiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL2R6c2lpemVwaWZ6b2lmZGhtdHhyLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiI5YmRhMzYzZC1lM2NlLTRjZmItYWU0NC03ODE3YTQwMmRiMGUiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzgwODYwMTUyLCJpYXQiOjE3ODA4NTY1NTIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsInBob25lIjoiIiwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiZW1haWwiLCJwcm92aWRlcnMiOlsiZW1haWwiXX0sInVzZXJfbWV0YWRhdGEiOnsiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsIm5vbWUiOiJ0ZXN0ZSIsInBob25lX3ZlcmlmaWVkIjpmYWxzZSwicGxhbm8iOiJwcm9maXNzaW9uYWwiLCJyb2xlIjoic3RhZmYiLCJzdWIiOiI5YmRhMzYzZC1lM2NlLTRjZmItYWU0NC03ODE3YTQwMmRiMGUifSwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJhYWwiOiJhYWwxIiwiYW1yIjpbeyJtZXRob2QiOiJwYXNzd29yZCIsInRpbWVzdGFtcCI6MTc4MDg1NjU1Mn1dLCJzZXNzaW9uX2lkIjoiNzViOTdlNjQtNTcyNC00OGFjLWIzZjMtYjY0ZmU0MGIzNzk1IiwiaXNfYW5vbnltb3VzIjpmYWxzZX0._I-9xALQ50-VOFyvtcAIaTYMiosIuwtftgFfovvtdhJAXXtcydyugly0FIJyRZx5vRidE9fdTE578WzeqQawIw';

const supabase = createClient(url, key, {
  global: {
    headers: {
      Authorization: `Bearer ${token}`
    }
  }
});

async function test() {
  const { data: user } = await supabase.auth.getUser(token);
  const uid = user?.user?.id;
  const meta = user?.user?.user_metadata;
  
  console.log('User ID:', uid);
  
  // Test createAcademia
  const nome = meta.nome || 'teste';
  const slug = nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, 40);

  const { data: acadData, error: acadError } = await supabase
    .from('academias')
    .insert({ nome, slug: `${slug}-${Date.now().toString(36)}` })
    .select('id')
    .single();

  console.log('Create Academia Result:', { acadData, acadError });

  if (!acadError) {
    const acadId = acadData.id;
    const { error: staffError } = await supabase.from('staff').upsert(
      { id: uid, nome, email: meta.email, ativo: true, academia_id: acadId },
      { onConflict: 'id' },
    );
    console.log('Upsert Staff Result:', { staffError });
  }
}
test();
