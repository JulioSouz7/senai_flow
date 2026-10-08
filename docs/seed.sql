-- ============================================================
-- SEED.SQL
-- Banco: PostgreSQL
-- Objetivo: popular o banco com dados de teste
-- ============================================================

BEGIN;

-- ============================================================
-- 1. USUÁRIOS
-- ============================================================

INSERT INTO "USUARIO"
    (id_usuario, nome, email, senha, senha_alterada, perfil, status)
VALUES
    (1, 'Administrador Principal', 'admin@escola.com', '$2b$10$hash_admin', true, 'ADMINISTRADOR', 'ATIVO'),
    (2, 'João Silva', 'joao.silva@escola.com', '$2b$10$hash_joao', true, 'DOCENTE', 'ATIVO'),
    (3, 'Maria Santos', 'maria.santos@escola.com', '$2b$10$hash_maria', false, 'DOCENTE', 'ATIVO'),
    (4, 'Carlos Oliveira', 'carlos.oliveira@escola.com', '$2b$10$hash_carlos', true, 'DOCENTE', 'ATIVO'),
    (5, 'Ana Souza', 'ana.souza@escola.com', '$2b$10$hash_ana', false, 'ALUNO', 'ATIVO'),
    (6, 'Pedro Costa', 'pedro.costa@escola.com', '$2b$10$hash_pedro', false, 'ALUNO', 'ATIVO'),
    (7, 'Lucas Ferreira', 'lucas.ferreira@escola.com', '$2b$10$hash_lucas', true, 'ALUNO', 'ATIVO'),
    (8, 'Juliana Alves', 'juliana.alves@escola.com', '$2b$10$hash_juliana', false, 'ALUNO', 'ATIVO'),
    (9, 'Marcos Lima', 'marcos.lima@escola.com', '$2b$10$hash_marcos', false, 'ALUNO', 'ATIVO'),
    (10, 'Fernanda Rocha', 'fernanda.rocha@escola.com', '$2b$10$hash_fernanda', true, 'ALUNO', 'ATIVO');

-- ============================================================
-- 2. ADMINISTRADORES
-- ============================================================

INSERT INTO "ADMINISTRADOR"
    (id_adm, id_usuario)
VALUES
    (1, 1);

-- ============================================================
-- 3. DOCENTES
-- ============================================================

INSERT INTO "DOCENTE"
    (id_docente, id_usuario, nif)
VALUES
    (1, 2, 'DOC-0001'),
    (2, 3, 'DOC-0002'),
    (3, 4, 'DOC-0003');

-- ============================================================
-- 4. PRÉDIOS
-- ============================================================

INSERT INTO "PREDIO"
    (id_predio, nome)
VALUES
    (1, 'Prédio Principal'),
    (2, 'Prédio de Tecnologia'),
    (3, 'Prédio Administrativo');

-- ============================================================
-- 5. SALAS
-- ============================================================

INSERT INTO "SALA"
    (id_sala, id_predio, nome, capacidade, ativa, qr_code)
VALUES
    (1, 1, 'Sala 101', 30, true, 'QR-SALA-101'),
    (2, 1, 'Sala 102', 40, true, 'QR-SALA-102'),
    (3, 1, 'Sala 103', 25, true, 'QR-SALA-103'),
    (4, 2, 'Laboratório 201', 35, true, 'QR-LAB-201'),
    (5, 2, 'Laboratório 202', 30, true, 'QR-LAB-202'),
    (6, 2, 'Laboratório 203', 25, true, 'QR-LAB-203'),
    (7, 3, 'Sala de Reuniões', 20, true, 'QR-REUNIAO-301'),
    (8, 3, 'Auditório', 100, true, 'QR-AUDITORIO');

-- ============================================================
-- 6. EQUIPAMENTOS
-- ============================================================

INSERT INTO "EQUIPAMENTO"
    (id_equipamento, nome, descricao, nif, status)
VALUES
    (1, 'Projetor Epson', 'Projetor multimídia para apresentações', 'EQP-0001', 'DISPONIVEL'),
    (2, 'Computador Desktop', 'Computador para uso acadêmico', 'EQP-0002', 'DISPONIVEL'),
    (3, 'Notebook Dell', 'Notebook para apresentações e aulas', 'EQP-0003', 'DISPONIVEL'),
    (4, 'Microfone', 'Microfone sem fio', 'EQP-0004', 'DISPONIVEL'),
    (5, 'Caixa de Som', 'Caixa de som amplificada', 'EQP-0005', 'DISPONIVEL'),
    (6, 'Quadro Interativo', 'Quadro digital interativo', 'EQP-0006', 'DISPONIVEL'),
    (7, 'Projetor BenQ', 'Projetor multimídia', 'EQP-0007', 'MANUTENCAO'),
    (8, 'Tablet', 'Tablet para atividades acadêmicas', 'EQP-0008', 'DISPONIVEL');

-- ============================================================
-- 7. EQUIPAMENTOS POR SALA
-- ============================================================

INSERT INTO "SALA_EQUIPAMENTO"
    (id_sala, id_equipamento, quantidade)
VALUES
    (1, 1, 1),
    (1, 6, 1),
    (2, 1, 1),
    (2, 2, 10),
    (3, 1, 1),
    (4, 2, 30),
    (4, 6, 1),
    (5, 2, 25),
    (5, 3, 2),
    (6, 2, 20),
    (7, 4, 2),
    (7, 5, 2),
    (8, 4, 4),
    (8, 5, 4);

-- ============================================================
-- 8. ÁREAS DE RISCO
-- ============================================================

INSERT INTO "AREA_RISCO"
    (id_area, id_predio, id_adm, nome, tipo, orientacao_seguranca, andar)
VALUES
    (1, 1, 1, 'Laboratório de Química', 'QUIMICO',
     'Utilizar equipamentos de proteção individual.', 1),
    (2, 2, 1, 'Laboratório de Informática', 'ELETRICO',
     'Não manipular equipamentos elétricos danificados.', 2),
    (3, 3, 1, 'Área Técnica', 'ELETRICO',
     'Acesso restrito a pessoas autorizadas.', 1);

-- ============================================================
-- 9. TURMAS
-- ============================================================

INSERT INTO "TURMA"
    (id_turma, nome, curso, qtd_alunos, carga_horaria_semanal)
VALUES
    (1, 'ADS-2026-1A', 'Análise e Desenvolvimento de Sistemas', 30, 20),
    (2, 'ADS-2026-1B', 'Análise e Desenvolvimento de Sistemas', 28, 20),
    (3, 'SI-2026-1A', 'Sistemas de Informação', 25, 20),
    (4, 'CC-2026-1A', 'Ciência da Computação', 35, 24);

-- ============================================================
-- 10. ALUNOS
-- ============================================================

INSERT INTO "ALUNO"
    (id_aluno, id_usuario, matricula, situacao, id_turma)
VALUES
    (1, 5, '20260001', 'MATRICULADO', 1),
    (2, 6, '20260002', 'MATRICULADO', 1),
    (3, 7, '20260003', 'MATRICULADO', 2),
    (4, 8, '20260004', 'MATRICULADO', 2),
    (5, 9, '20260005', 'MATRICULADO', 3),
    (6, 10, '20260006', 'MATRICULADO', 4);

-- ============================================================
-- 11. DOCENTES POR TURMA
-- ============================================================

INSERT INTO "DOCENTE_TURMA"
    (id_docente, id_turma)
VALUES
    (1, 1),
    (1, 2),
    (2, 2),
    (2, 3),
    (3, 3),
    (3, 4);

-- ============================================================
-- 12. RESERVAS
-- ============================================================

INSERT INTO "RESERVA"
    (
        id_reserva,
        id_sala,
        id_turma,
        id_admin,
        tipo,
        status,
        dt_solicitacao,
        dt_validacao,
        justificativa_urgencia,
        id_reserva_urgencia,
        dt_encerramento,
        sala_em_ordem,
        obs_encerramento
    )
VALUES
    (
        1, 1, 1, 1,
        'NORMAL',
        'CONFIRMADA',
        '2026-10-01 08:00:00',
        '2026-10-01 10:00:00',
        NULL,
        NULL,
        NULL,
        NULL,
        NULL
    ),
    (
        2, 4, 2, 1,
        'NORMAL',
        'CONFIRMADA',
        '2026-10-02 09:00:00',
        '2026-10-02 11:00:00',
        NULL,
        NULL,
        NULL,
        NULL,
        NULL
    ),
    (
        3, 5, 3, NULL,
        'NORMAL',
        'PENDENTE',
        '2026-10-05 08:30:00',
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        NULL
    ),
    (
        4, 8, 4, 1,
        'URGENCIA',
        'CONFIRMADA',
        '2026-10-06 09:00:00',
        '2026-10-06 09:30:00',
        'Necessidade urgente para apresentação acadêmica.',
        NULL,
        NULL,
        NULL,
        NULL
    ),
    (
        5, 2, 1, 1,
        'NORMAL',
        'ENCERRADA',
        '2026-09-20 08:00:00',
        '2026-09-20 09:00:00',
        NULL,
        NULL,
        '2026-09-20 12:00:00',
        true,
        'Sala entregue em boas condições.'
    ),
    (
        6, 6, 4, 1,
        'NORMAL',
        'RECUSADA',
        '2026-09-25 10:00:00',
        '2026-09-25 11:00:00',
        NULL,
        NULL,
        NULL,
        NULL,
        'Conflito com outra reserva.'
    );

-- ============================================================
-- 13. HORÁRIOS DAS RESERVAS
-- ============================================================

INSERT INTO "RESERVA_HORARIO"
    (id_horario, id_reserva, data, hora_inicio, hora_fim)
VALUES
    (1, 1, '2026-10-09', '08:00:00', '10:00:00'),
    (2, 2, '2026-10-09', '10:00:00', '12:00:00'),
    (3, 3, '2026-10-10', '14:00:00', '16:00:00'),
    (4, 4, '2026-10-11', '18:00:00', '20:00:00'),
    (5, 5, '2026-09-20', '10:00:00', '12:00:00'),
    (6, 6, '2026-09-27', '08:00:00', '10:00:00');

-- ============================================================
-- 14. DOCENTES DAS RESERVAS
-- ============================================================

INSERT INTO "RESERVA_DOCENTE"
    (id_reserva_docente, id_reserva, id_docente)
VALUES
    (1, 1, 1),
    (2, 2, 1),
    (3, 3, 2),
    (4, 4, 3),
    (5, 5, 1),
    (6, 6, 3);

-- ============================================================
-- 15. PONTUAÇÕES
-- ============================================================

INSERT INTO "PONTUACAO"
    (id_pontuacao, id_reserva, id_turma, pontos, semestre_letivo)
VALUES
    (1, 1, 1, 10, '2026.2'),
    (2, 2, 2, 15, '2026.2'),
    (3, 5, 1, 20, '2026.2');

-- ============================================================
-- 16. TROCAS DE SALA
-- ============================================================

INSERT INTO "TROCA_SALA"
    (
        id_troca,
        id_reserva,
        id_sala_origem,
        id_sala_destino,
        id_docente_solicitante,
        id_coordenador,
        status,
        motivo,
        dt_troca
    )
VALUES
    (
        1,
        1,
        1,
        2,
        1,
        NULL,
        'PENDENTE',
        'Sala atual sem projetor disponível.',
        '2026-10-07 09:00:00'
    ),
    (
        2,
        2,
        4,
        5,
        1,
        1,
        'ACEITA',
        'Necessidade de maior disponibilidade de computadores.',
        '2026-10-03 14:00:00'
    ),
    (
        3,
        5,
        2,
        3,
        1,
        1,
        'RECUSADA',
        'Sala de destino incompatível com a capacidade da turma.',
        '2026-09-21 09:00:00'
    );

-- ============================================================
-- 17. SOLICITAÇÕES DE EQUIPAMENTO
-- ============================================================

INSERT INTO "SOLICITACAO_EQUIPAMENTO"
    (
        id_solicitacao,
        id_reserva,
        id_docente,
        id_admin_analise,
        status,
        dt_solicitacao,
        dt_resposta
    )
VALUES
    (
        1,
        1,
        1,
        1,
        'APROVADA',
        '2026-10-01 12:00:00',
        '2026-10-01 14:00:00'
    ),
    (
        2,
        2,
        1,
        1,
        'APROVADA',
        '2026-10-02 13:00:00',
        '2026-10-02 15:00:00'
    ),
    (
        3,
        3,
        2,
        NULL,
        'PENDENTE',
        '2026-10-05 10:00:00',
        NULL
    ),
    (
        4,
        4,
        3,
        1,
        'RECUSADA',
        '2026-10-06 12:00:00',
        '2026-10-06 15:00:00'
    );

-- ============================================================
-- 18. ITENS DAS SOLICITAÇÕES
-- ============================================================

INSERT INTO "ITEM_SOLICITACAO"
    (id_item_solicitacao, id_solicitacao, id_equipamento, quantidade)
VALUES
    (1, 1, 1, 1),
    (2, 1, 4, 1),
    (3, 2, 3, 2),
    (4, 2, 5, 1),
    (5, 3, 1, 1),
    (6, 3, 6, 1),
    (7, 4, 7, 1);

-- ============================================================
-- 19. AVARIAS
-- ============================================================

INSERT INTO "AVARIA"
    (
        id_avaria,
        id_docente,
        id_sala,
        id_equipamento,
        id_reserva,
        descricao,
        foto,
        gravidade,
        status
    )
VALUES
    (
        1,
        1,
        1,
        1,
        1,
        'Projetor apresentou falha durante a aula e deixou de transmitir a imagem.',
        'avarias/projetor-sala-101.jpg',
        'MEDIA',
        'EM_ANALISE'
    ),
    (
        2,
        2,
        4,
        2,
        2,
        'Computador apresentou desligamentos inesperados durante a atividade.',
        'avarias/computador-lab-201.jpg',
        'ALTA',
        'ENCAMINHADO'
    ),
    (
        3,
        3,
        5,
        NULL,
        4,
        'Problema na tomada elétrica próxima à mesa do professor.',
        'avarias/tomada-lab-202.jpg',
        'ALTA',
        'FINALIZADO'
    );

-- ============================================================
-- 20. COMUNICADOS
-- ============================================================

INSERT INTO "COMUNICADO"
    (
        id_comunicado,
        id_adm,
        id_turma,
        id_reserva,
        titulo,
        conteudo,
        abrangencia,
        publico_alvo,
        dt_publicacao
    )
VALUES
    (
        1,
        1,
        NULL,
        NULL,
        'Manutenção do Prédio de Tecnologia',
        'O prédio de tecnologia passará por manutenção no próximo sábado.',
        'GERAL',
        'Todos os usuários',
        '2026-10-01 08:00:00'
    ),
    (
        2,
        1,
        1,
        NULL,
        'Alteração de sala',
        'A turma terá aula excepcionalmente na Sala 102.',
        'TURMA',
        'Alunos e docentes da turma ADS-2026-1A',
        '2026-10-05 10:00:00'
    ),
    (
        3,
        1,
        NULL,
        4,
        'Reserva confirmada',
        'A reserva do auditório foi confirmada pela administração.',
        'GERAL',
        'Usuários relacionados à reserva',
        '2026-10-06 16:00:00'
    );

-- ============================================================
-- 21. RELATOS E SUGESTÕES
-- ============================================================

INSERT INTO "RELATOS_SUGESTOES"
    (
        id_relato,
        id_usuario,
        tipo,
        descricao,
        dt_envio,
        prazo_resposta,
        status,
        id_admin,
        resposta,
        encaminhada_corporativo
    )
VALUES
    (
        1,
        5,
        'SUGESTAO',
        'Disponibilizar mais tomadas próximas às mesas dos alunos.',
        '2026-10-01 09:00:00',
        '2026-10-15',
        'LIDO',
        1,
        'Sugestão encaminhada para análise da administração.',
        false
    ),
    (
        2,
        6,
        'RECLAMACAO',
        'A temperatura do laboratório está muito elevada durante as aulas.',
        '2026-10-02 11:00:00',
        '2026-10-16',
        'PENDENTE',
        NULL,
        NULL,
        false
    ),
    (
        3,
        7,
        'APONTAMENTO',
        'Foi identificado equipamento com etiqueta patrimonial danificada.',
        '2026-10-03 14:00:00',
        '2026-10-17',
        'ARQUIVADO',
        1,
        'Equipamento identificado e etiqueta substituída.',
        false
    );

-- ============================================================
-- 22. CHAMADOS DE SUPORTE
-- ============================================================

INSERT INTO "CHAMADO_SUPORTE"
    (
        id_chamado,
        id_usuario,
        id_admin_resp,
        assunto,
        descricao,
        status,
        dt_abertura
    )
VALUES
    (
        1,
        5,
        1,
        'Problema de acesso',
        'Não consigo acessar o sistema com minha senha atual.',
        'RESOLVIDO',
        '2026-10-01 08:30:00'
    ),
    (
        2,
        6,
        1,
        'Erro ao realizar reserva',
        'O sistema apresenta erro ao tentar solicitar uma sala.',
        'EM_ANDAMENTO',
        '2026-10-02 13:00:00'
    ),
    (
        3,
        7,
        NULL,
        'Dúvida sobre equipamentos',
        'Gostaria de saber como solicitar equipamentos para uma aula.',
        'ABERTO',
        '2026-10-05 09:00:00'
    );

-- ============================================================
-- 23. HISTÓRICO DOS CHAMADOS
-- ============================================================

INSERT INTO "CHAMADO_HISTORICO"
    (
        id_historico,
        id_chamado,
        id_admin_status,
        observacao,
        dt_registro
    )
VALUES
    (
        1,
        1,
        1,
        'Senha redefinida e acesso restaurado.',
        '2026-10-01 10:00:00'
    ),
    (
        2,
        1,
        1,
        'Chamado encerrado após confirmação do usuário.',
        '2026-10-01 11:00:00'
    ),
    (
        3,
        2,
        1,
        'Chamado recebido e encaminhado para análise técnica.',
        '2026-10-02 14:00:00'
    );

-- ============================================================
-- 24. FAQ
-- ============================================================

INSERT INTO "FAQ"
    (id_faq, pergunta, resposta, categoria)
VALUES
    (
        1,
        'Como faço uma reserva de sala?',
        'Acesse o módulo de reservas, escolha a sala, a turma e o horário desejado.',
        'RESERVAS'
    ),
    (
        2,
        'Como solicito um equipamento?',
        'Após criar uma reserva, solicite os equipamentos desejados no módulo de equipamentos.',
        'EQUIPAMENTOS'
    ),
    (
        3,
        'Como relato uma avaria?',
        'Acesse a opção de ocorrências e informe a sala, equipamento, descrição e foto da avaria.',
        'AVARIAS'
    ),
    (
        4,
        'Como abrir um chamado?',
        'Acesse o módulo de suporte e informe o assunto e a descrição do problema.',
        'SUPORTE'
    ),
    (
        5,
        'Como enviar uma sugestão?',
        'Utilize o módulo de relatos e sugestões para enviar uma sugestão ou reclamação.',
        'RELATOS'
    );

-- ============================================================
-- 25. AJUSTE DAS SEQUENCES
-- ============================================================
-- Necessário porque os IDs foram inseridos manualmente.

SELECT setval(
    pg_get_serial_sequence('"USUARIO"', 'id_usuario'),
    COALESCE((SELECT MAX(id_usuario) FROM "USUARIO"), 1),
    true
);

SELECT setval(
    pg_get_serial_sequence('"ADMINISTRADOR"', 'id_adm'),
    COALESCE((SELECT MAX(id_adm) FROM "ADMINISTRADOR"), 1),
    true
);

SELECT setval(
    pg_get_serial_sequence('"DOCENTE"', 'id_docente'),
    COALESCE((SELECT MAX(id_docente) FROM "DOCENTE"), 1),
    true
);

SELECT setval(
    pg_get_serial_sequence('"ALUNO"', 'id_aluno'),
    COALESCE((SELECT MAX(id_aluno) FROM "ALUNO"), 1),
    true
);

SELECT setval(
    pg_get_serial_sequence('"PREDIO"', 'id_predio'),
    COALESCE((SELECT MAX(id_predio) FROM "PREDIO"), 1),
    true
);

SELECT setval(
    pg_get_serial_sequence('"SALA"', 'id_sala'),
    COALESCE((SELECT MAX(id_sala) FROM "SALA"), 1),
    true
);

SELECT setval(
    pg_get_serial_sequence('"EQUIPAMENTO"', 'id_equipamento'),
    COALESCE((SELECT MAX(id_equipamento) FROM "EQUIPAMENTO"), 1),
    true
);

SELECT setval(
    pg_get_serial_sequence('"TURMA"', 'id_turma'),
    COALESCE((SELECT MAX(id_turma) FROM "TURMA"), 1),
    true
);

SELECT setval(
    pg_get_serial_sequence('"RESERVA"', 'id_reserva'),
    COALESCE((SELECT MAX(id_reserva) FROM "RESERVA"), 1),
    true
);

SELECT setval(
    pg_get_serial_sequence('"RESERVA_HORARIO"', 'id_horario'),
    COALESCE((SELECT MAX(id_horario) FROM "RESERVA_HORARIO"), 1),
    true
);

SELECT setval(
    pg_get_serial_sequence('"RESERVA_DOCENTE"', 'id_reserva_docente'),
    COALESCE((SELECT MAX(id_reserva_docente) FROM "RESERVA_DOCENTE"), 1),
    true
);

SELECT setval(
    pg_get_serial_sequence('"PONTUACAO"', 'id_pontuacao'),
    COALESCE((SELECT MAX(id_pontuacao) FROM "PONTUACAO"), 1),
    true
);

SELECT setval(
    pg_get_serial_sequence('"TROCA_SALA"', 'id_troca'),
    COALESCE((SELECT MAX(id_troca) FROM "TROCA_SALA"), 1),
    true
);

SELECT setval(
    pg_get_serial_sequence('"SOLICITACAO_EQUIPAMENTO"', 'id_solicitacao'),
    COALESCE((SELECT MAX(id_solicitacao) FROM "SOLICITACAO_EQUIPAMENTO"), 1),
    true
);

SELECT setval(
    pg_get_serial_sequence('"ITEM_SOLICITACAO"', 'id_item_solicitacao'),
    COALESCE((SELECT MAX(id_item_solicitacao) FROM "ITEM_SOLICITACAO"), 1),
    true
);

SELECT setval(
    pg_get_serial_sequence('"AVARIA"', 'id_avaria'),
    COALESCE((SELECT MAX(id_avaria) FROM "AVARIA"), 1),
    true
);

SELECT setval(
    pg_get_serial_sequence('"COMUNICADO"', 'id_comunicado'),
    COALESCE((SELECT MAX(id_comunicado) FROM "COMUNICADO"), 1),
    true
);

SELECT setval(
    pg_get_serial_sequence('"RELATOS_SUGESTOES"', 'id_relato'),
    COALESCE((SELECT MAX(id_relato) FROM "RELATOS_SUGESTOES"), 1),
    true
);

SELECT setval(
    pg_get_serial_sequence('"CHAMADO_SUPORTE"', 'id_chamado'),
    COALESCE((SELECT MAX(id_chamado) FROM "CHAMADO_SUPORTE"), 1),
    true
);

SELECT setval(
    pg_get_serial_sequence('"CHAMADO_HISTORICO"', 'id_historico'),
    COALESCE((SELECT MAX(id_historico) FROM "CHAMADO_HISTORICO"), 1),
    true
);

SELECT setval(
    pg_get_serial_sequence('"AREA_RISCO"', 'id_area'),
    COALESCE((SELECT MAX(id_area) FROM "AREA_RISCO"), 1),
    true
);

SELECT setval(
    pg_get_serial_sequence('"FAQ"', 'id_faq'),
    COALESCE((SELECT MAX(id_faq) FROM "FAQ"), 1),
    true
);

COMMIT;