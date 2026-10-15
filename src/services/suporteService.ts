import prisma from '../config/prisma';

export class SuporteService {
  async abrirChamado(id_usuario: number, assunto: string, mensagem: string) {
    return await prisma.chamadoSuporte.create({
      data: {
        id_usuario,
        assunto,
        descricao: mensagem,
        status: 'ABERTO',
      },
    });
  }

  async responderChamado(id_chamado: number, resposta: string, id_usuario_admin: number) {
    const admin = await prisma.administrador.findUnique({
      where: { id_usuario: id_usuario_admin },
    });

    const adminId = admin ? admin.id_adm : undefined;

    const chamado = await prisma.chamadoSuporte.update({
      where: { id_chamado },
      data: {
        status: 'RESOLVIDO',
        id_admin_resp: adminId,
      },
    });

    if (adminId) {
      await prisma.chamadoHistorico.create({
        data: {
          id_chamado,
          id_admin_status: adminId,
          observacao: resposta,
        },
      });
    }

    return chamado;
  }
}