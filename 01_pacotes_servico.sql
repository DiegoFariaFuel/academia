CREATE TABLE pacotes_servico (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academia_id  UUID REFERENCES academias(id),
  nome         TEXT NOT NULL,                    
  descricao    TEXT DEFAULT '',                   
  preco        NUMERIC(10,2) NOT NULL DEFAULT 0, 
  duracao_dias INTEGER NOT NULL DEFAULT 30,       
  servicos     TEXT[] DEFAULT '{}',               
  ativo        BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE pacotes_servico ENABLE ROW LEVEL SECURITY;
CREATE POLICY pacotes_staff ON pacotes_servico
  FOR ALL USING (academia_id IN (
    SELECT academia_id FROM staff WHERE id = auth.uid() AND ativo
  ));

ALTER TABLE alunos ADD COLUMN pacote_id UUID REFERENCES pacotes_servico(id);
