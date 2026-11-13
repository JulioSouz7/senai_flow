# SENAI Flow

O projeto mantém o frontend web em Vite e o aplicativo nativo em Expo separados. Ambos consomem o backend Express em `backend/`; a versão mobile usa telas React Native e não executa componentes web.

## Frontend desktop (Vite)

No PowerShell, na pasta do projeto:

```powershell
cd frontend_docente_v2
npm install
npm run dev
```

O Vite inicia em `http://localhost:3003`.

## Backend (Express/Prisma)

Em outro terminal:

```powershell
cd backend
npm install
npm run dev
```

O backend usa a porta `3001` por padrão. Configure as variáveis privadas exigidas pelo ambiente (por exemplo, conexão com o banco) no arquivo `.env` do backend; não compartilhe nem versione credenciais.

## Aplicativo Android/iOS pelo Expo Go

1. Instale o aplicativo **Expo Go** no celular.
2. Descubra o endereço IPv4 local do computador com `ipconfig` e conecte computador e celular à mesma rede Wi-Fi.
3. Crie o arquivo de ambiente a partir do exemplo e substitua o endereço pelo IP do computador:

```powershell
cd frontend_docente_v2\meu-app
Copy-Item .env.example .env
```

Edite `.env` com o IPv4 mostrado por `ipconfig` no computador onde a API está rodando:

```dotenv
EXPO_PUBLIC_API_URL=http://192.168.0.25:3001
```

Use o endereço base do backend, sem acrescentar `/api`. `localhost` funciona apenas quando o backend está no mesmo dispositivo; no celular físico, use o IPv4 do computador. Para um emulador Android, pode ser necessário usar `http://10.0.2.2:3001`.

Inicie o Metro e abra o QR Code:

```powershell
npm install
npx expo start
```

No Expo Go, escaneie o QR Code apresentado no terminal ou no navegador. Se a rede local/firewall impedir a conexão, tente `npx expo start --tunnel`.

## Funcionalidades mobile

- Login institucional e troca obrigatória da senha no primeiro acesso.
- Token e perfil persistidos com `expo-secure-store`; logout remove a sessão.
- Navegação por perfil (gestão, docente e aluno) e consulta de dados reais do backend.
- Docentes: solicitação e acompanhamento/cancelamento/encerramento de reservas, central de trocas, solicitação de equipamentos, ranking, mapa, FAQs, comunicados e envio de sugestões.
- Gestão: dashboard, reservas pendentes, solicitações de equipamentos, avarias, salas, comunicados, relatos, usuários e mapa. Ações disponíveis usam as rotas do backend e respeitam as permissões da API.
- Alunos: comunicados, mapa, FAQs e envio de relatos/sugestões.

## Verificações

Na pasta `frontend_docente_v2`, `npm run build` valida o frontend web. Na pasta `frontend_docente_v2\meu-app`, `npx tsc --noEmit` valida o TypeScript mobile e `npx expo-doctor` verifica a configuração e as dependências Expo.
