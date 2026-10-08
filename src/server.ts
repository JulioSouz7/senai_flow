import express from 'express';
import routes from './routes'; 

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'API SENAI Flow rodando com sucesso!' });
});

app.use(routes);

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});