// import { Request, Response } from 'express';
// import { PontuacaoService } from '../services/pontuacaoService';

// const pontuacaoService = new PontuacaoService();

// export class PontuacaoController {
//   async registrar(req: Request, res: Response) {
//     try {
//       const { id_reserva, id_turma, pontos, semestre_letivo } = req.body;

//       const novaPontuacao = await pontuacaoService.registrar({
//         id_reserva: Number(id_reserva),
//         id_turma: Number(id_turma),
//         pontos: Number(pontos),
//         semestre_letivo: semestre_letivo || '2026-2',
//       });

//       return res.status(201).json({
//         message: 'Pontuação atribuída à turma com sucesso!',
//         pontuacao: novaPontuacao,
//       });
//     } catch (error: any) {
//       return res.status(error.statusCode || 400).json({ message: error.message });
//     }
//   }

//   async obterRanking(req: Request, res: Response) {
//     try {
//       const { semestre_letivo } = req.query;
//       const ranking = await pontuacaoService.obterRanking(semestre_letivo as string);
//       return res.status(200).json(ranking);
//     } catch (error: any) {
//       return res.status(error.statusCode || 400).json({ message: error.message });
//     }
//   }

//   async listarPorTurma(req: Request, res: Response) {
//     try {
//       const { id_turma } = req.params;
//       const historico = await pontuacaoService.listarPorTurma(Number(id_turma));
//       return res.status(200).json(historico);
//     } catch (error: any) {
//       return res.status(error.statusCode || 400).json({ message: error.message });
//     }
//   }

//   async resetSemestral(req: Request, res: Response) {
//     try {
//       const { semestre_letivo } = req.body;
//       const resultado = await pontuacaoService.resetSemestral(semestre_letivo);
//       return res.status(200).json(resultado);
//     } catch (error: any) {
//       return res.status(error.statusCode || 400).json({ message: error.message });
//     }
//   }
// }