import express from 'express';
// @ts-ignore
import 'express-async-errors';
import cors from 'cors';
import routes from './routes'; // Importa automaticamente o index.ts
import { errorMiddleware } from './middlewares/errorMiddleware';

const app = express();

app.use(cors());
app.use(express.json());

// Rotas principais registradas na raiz (sem o prefixo /api)
app.use(routes);

app.use(errorMiddleware);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 SENAI Flow Backend rodando na porta ${PORT}`);
});