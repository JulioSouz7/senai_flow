import prisma from '../config/prisma';
import { AppError } from '../errors/AppError';

export interface ICriarAvariaFormsInput {
  nif_docente: string;
  qr_code_sala: string; // [ALTERADO]: Recebe o texto/código do QR Code vindo do Forms
  nif_equipamento?: string;
  descricao: string;
  foto?: string;
  gravidade?: 'BAIXA' | 'MEDIA' | 'ALTA';
}

export class AvariaService {
  async registrarViaForms(dados: ICriarAvariaFormsInput, id_usuario_logado: number) {
    const { nif_docente, qr_code_sala, nif_equipamento, descricao, foto, gravidade } = dados;

    // 1. Validação estrita do NIF do Docente (não aceita número isolado, vazio ou apenas espaços)
    if (!nif_docente || typeof nif_docente !== 'string' || !nif_docente.trim()) {
      throw new AppError('O NIF do docente é obrigatório e deve ser um texto válido.', 400);
    }

    // 2. Validação estrita do NIF do Equipamento (Impede envio de string vazia ou tipo incorreto)
    if (!nif_equipamento || typeof nif_equipamento !== 'string' || !nif_equipamento.trim()) {
      throw new AppError('O NIF do equipamento é obrigatório e deve ser fornecido em formato de texto válido.', 400);
    }

    // 3. Validações da Sala e Descrição
    if (!qr_code_sala || typeof qr_code_sala !== 'string' || !qr_code_sala.trim()) {
      throw new AppError('A identificação da sala via QR Code é obrigatória.', 400);
    }

    if (!descricao || typeof descricao !== 'string' || descricao.trim().length < 30) {
      throw new AppError('A descrição da avaria deve conter no mínimo 30 caracteres.', 400);
    }

    // 4. Validação de perfil (Docente ou Administrador)
    const usuarioLogado = await prisma.usuario.findUnique({
      where: { id_usuario: id_usuario_logado },
      include: { docente: true },
    });

    if (!usuarioLogado) {
      throw new AppError('Usuário autenticado não encontrado.', 404);
    }

    const ehAdmin = usuarioLogado.perfil === 'ADMINISTRADOR';
    const ehDocente = usuarioLogado.perfil === 'DOCENTE' || Boolean(usuarioLogado.docente);

    if (!ehAdmin && !ehDocente) {
      throw new AppError('Acesso negado: Apenas docentes e administradores podem registrar avarias.', 403);
    }

    // 5. Valida se o NIF do Docente existe na tabela DOCENTE
    const docenteEncontrado = await prisma.docente.findFirst({
      where: { nif: String(nif_docente).trim() },
    });

    if (!docenteEncontrado) {
      throw new AppError('Acesso negado: O NIF do docente informado não existe no sistema.', 403);
    }

    // 6. Valida se a Sala existe
    const salaExiste = await prisma.sala.findFirst({
      where: { qr_code: String(qr_code_sala).trim() },
    });

    if (!salaExiste) {
      throw new AppError('A sala informada pelo QR Code não existe no sistema.', 404);
    }

    // 7. Busca o equipamento rigorosamente pelo NIF (Garante preenchimento da FK id_equipamento)
    const equipamentoExiste = await prisma.equipamento.findFirst({
      where: { nif: String(nif_equipamento).trim() },
    });

    if (!equipamentoExiste) {
      throw new AppError('O NIF do equipamento informado não pertence a nenhum equipamento cadastrado no sistema.', 404);
    }

    // 8. Grava no banco relacionando o id_equipamento encontrado
    return await prisma.avaria.create({
      data: {
        id_docente: docenteEncontrado.id_docente,
        id_sala: salaExiste.id_sala, // Atribui a FK do ID da sala localizada
        id_equipamento: equipamentoExiste.id_equipamento,
        descricao: descricao.trim(),
        foto: foto && foto.trim() ? foto.trim() : 'sem-foto.png',
        gravidade: gravidade || 'MEDIA',
        status: 'ENCAMINHADO',
      },
      include: {
        sala: true,
        equipamento: true,
        docente: {
          include: {
            usuario: { select: { id_usuario: true, nome: true, email: true } },
          },
        },
      },
    });
  }

  async listar(status?: string) {
    const statusValidos = ['ENCAMINHADO', 'EM_ANALISE', 'FINALIZADO'];

    // Se um status for informado, valida se ele é um dos status permitidos
    if (status && !statusValidos.includes(status.toUpperCase())) {
      throw new AppError('Status inválido para filtragem. Utilize: ENCAMINHADO, EM_ANALISE ou FINALIZADO.', 400);
    }

    return await prisma.avaria.findMany({
      where: {
        ...(status ? { status: status.toUpperCase() } : {}),
      },
      include: {
        sala: true,
        equipamento: true,
        docente: {
          include: {
            usuario: { select: { id_usuario: true, nome: true, email: true } },
          },
        },
      },
      orderBy: { id_avaria: 'desc' },
    });
  }

  async buscarPorId(id_avaria: number) {
    if (isNaN(id_avaria)) throw new AppError('ID de avaria inválido.', 400);

    const avaria = await prisma.avaria.findUnique({
      where: { id_avaria },
      include: {
        sala: true,
        equipamento: true,
        docente: {
          include: {
            usuario: { select: { id_usuario: true, nome: true, email: true } },
          },
        },
      },
    });

    if (!avaria) throw new AppError('Registro de avaria não encontrado.', 404);

    return avaria;
  }

  async atualizarStatus(id_avaria: number, status: string) {
    if (isNaN(id_avaria)) throw new AppError('ID de avaria inválido.', 400);

    const statusValidos = ['ENCAMINHADO', 'EM_ANALISE', 'FINALIZADO'];
    if (!statusValidos.includes(status)) {
      throw new AppError('Status inválido. Utilize apenas: ENCAMINHADO, EM_ANALISE ou FINALIZADO.', 400);
    }

    const avaria = await prisma.avaria.findUnique({ where: { id_avaria } });
    if (!avaria) throw new AppError('Avaria não encontrada.', 404);

    return await prisma.avaria.update({
      where: { id_avaria },
      data: { status },
      include: { sala: true, equipamento: true },
    });
  }
}

export const avariaService = new AvariaService();