import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error("Missing SUPABASE env vars. Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are in .env");
  process.exit(1);
}

const supabase = createClient(url, key);

const tablesToTest = [
  'alunos', 'planos', 'aluno_planos', 'faturas', 'modalidades', 'turmas',
  'anamneses', 'avaliacoes_fisicas', 'evolucao_fisica', 'caixa_diario',
  'contratos', 'comissoes', 'despesas', 'produtos', 'vendas',
  'exercicios', 'treinos', 'treino_exercicios', 'aluno_treinos',
  'checkins', 'tickets', 'aluno_segmentacao', 'regras_acesso',
  'pagamentos', 'mensagens', 'staff', 'biometrias', 'stripe_events',
  'vw_dashboard', 'vw_checkins_hoje', 'vw_inadimplentes'
];

async function run() {
  console.log('--- Iniciando Auditoria de Tabelas e Views no Supabase ---');
  let errors = 0;

  for (const table of tablesToTest) {
    const { error } = await supabase.from(table).select('*').limit(1);
    
    if (error) {
      console.error(`❌ ERRO NA TABELA/VIEW [${table}]:`, error.message, error.details || '');
      errors++;
    } else {
      console.log(`✅ OK: ${table}`);
    }
  }

  console.log('---------------------------------------------------------');
  if (errors > 0) {
    console.error(`🚨 Foram encontrados ${errors} erros de schema/tabela.`);
  } else {
    console.log('🎉 TUDO VERDE! Nenhuma falha estrutural no banco de dados.');
  }
}

run();
