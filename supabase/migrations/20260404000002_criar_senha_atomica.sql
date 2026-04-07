-- Garante unicidade de numero_senha por modalidade
ALTER TABLE senhas
  ADD CONSTRAINT uq_senhas_modalidade_numero UNIQUE (modalidade_id, numero_senha);

-- RPC atômica: verifica estoque, gera numero_senha e insere a senha em uma transação
-- Previne race conditions (TOCTOU) via SELECT FOR UPDATE na linha da modalidade
CREATE OR REPLACE FUNCTION criar_senha_atomica(
  p_modalidade_id uuid,
  p_competidor_id uuid,
  p_canal        text,        -- 'presencial' | 'online'
  p_status       text,        -- 'ativa' | 'pendente'
  p_valor_pago   integer,
  p_vendido_por  uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_modalidade   record;
  v_numero       integer;
  v_senha_id     uuid;
BEGIN
  -- Bloqueia a linha da modalidade para evitar concorrência
  SELECT total_senhas, senhas_vendidas, tenant_id
    INTO v_modalidade
    FROM modalidades
   WHERE id = p_modalidade_id
     FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Modalidade não encontrada');
  END IF;

  IF v_modalidade.senhas_vendidas >= v_modalidade.total_senhas THEN
    RETURN jsonb_build_object('error', 'Estoque de senhas esgotado');
  END IF;

  -- Próximo número sequencial
  SELECT COALESCE(MAX(numero_senha), 0) + 1
    INTO v_numero
    FROM senhas
   WHERE modalidade_id = p_modalidade_id;

  -- Inserir a senha
  INSERT INTO senhas (
    modalidade_id, competidor_id, numero_senha,
    canal, status, valor_pago, vendido_por
  )
  VALUES (
    p_modalidade_id, p_competidor_id, v_numero,
    p_canal, p_status, p_valor_pago, p_vendido_por
  )
  RETURNING id INTO v_senha_id;

  -- Incrementar contador atomicamente (dentro da mesma transação)
  UPDATE modalidades
     SET senhas_vendidas = senhas_vendidas + 1
   WHERE id = p_modalidade_id;

  RETURN jsonb_build_object('senha_id', v_senha_id, 'numero_senha', v_numero);
END;
$$;

-- RPC atômica para aprovação de comprovante: verifica estoque e ativa a senha em uma transação
CREATE OR REPLACE FUNCTION aprovar_senha_atomica(
  p_senha_id     uuid,
  p_modalidade_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_modalidade record;
  v_updated    integer;
BEGIN
  -- Bloqueia a linha da modalidade para evitar concorrência
  SELECT total_senhas, senhas_vendidas
    INTO v_modalidade
    FROM modalidades
   WHERE id = p_modalidade_id
     FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Modalidade não encontrada');
  END IF;

  IF v_modalidade.senhas_vendidas >= v_modalidade.total_senhas THEN
    RETURN jsonb_build_object('error', 'Estoque esgotado. Não é possível aprovar.');
  END IF;

  -- Ativa a senha com verificação otimista (só atualiza se ainda estiver pendente)
  UPDATE senhas
     SET status = 'ativa', comprovante_status = 'aprovado'
   WHERE id = p_senha_id
     AND comprovante_status = 'pendente'
     AND status != 'ativa';

  GET DIAGNOSTICS v_updated = ROW_COUNT;

  IF v_updated = 0 THEN
    RETURN jsonb_build_object('error', 'Comprovante já foi processado por outro operador');
  END IF;

  -- Incrementa o contador
  UPDATE modalidades
     SET senhas_vendidas = senhas_vendidas + 1
   WHERE id = p_modalidade_id;

  RETURN jsonb_build_object('success', true);
END;
$$;
