# SENAI Flow | Portal do Aluno

Front-end mobile-first independente, construído com Next.js, React, TypeScript e SCSS. O portal consome a API Express existente e não contém rotas de administração ou docência.

## Requisitos

- Node.js 20.9 ou superior
- npm
- Backend SENAI Flow disponível em `http://localhost:3001` (ou URL configurada)

## Executar

Na pasta `frontend-aluno/`:

```bash
npm install
npm run dev
```

Abra `http://localhost:3000`. Por padrão, as chamadas usam `http://localhost:3001`. Para outro endereço, crie `.env.local` com:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Verificações

```bash
npm run lint
npm run build
```

## Áreas do aluno

- Minha Turma e Comunicados
- Ranking de salas
- Envio de relatos e sugestões
- Mapa de Risco agrupado por prédio e andar
- Perfil e Central de Suporte com FAQ e abertura de chamados

As chamadas e os limites de formulário correspondem aos endpoints disponíveis no backend atual.
