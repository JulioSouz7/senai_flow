# SENAI Flow

## Configuração do backend

O backend usa a porta `3001` por padrão. Configure `DATABASE_URL` e um valor forte e privado para `JWT_SECRET` no ambiente do backend antes de iniciar. A API não inicia sem `JWT_SECRET`.

## Endereço da API nos frontends

Configure o mesmo endereço base alcançável pela máquina/dispositivo de apresentação, sem sufixo `/api`:

- Aplicações Web Vite (`frontend-adm` e `frontend_docente_desktop`): `VITE_API_URL`.
- Aplicações Expo (`frontend_adm_mobile`, `frontend-aluno-expo` e `frontend_docente_mobile`): `EXPO_PUBLIC_API_URL`.

Para navegador ou emulador, use o endereço do backend acessível naquele ambiente. Em celular físico, use o endereço de rede do computador que executa a API. Não use `localhost` no telefone: ele apontaria para o próprio telefone. Defina a variável antes de iniciar Vite/Expo; reinicie o servidor de desenvolvimento para que a configuração seja carregada.

O painel administrativo Web já usa `VITE_API_URL`. Os três aplicativos Expo permitem sobrescrever a descoberta/fallback local com `EXPO_PUBLIC_API_URL`.
