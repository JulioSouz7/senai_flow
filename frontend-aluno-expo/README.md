# SENAI Flow | Aluno Expo

Aplicativo React Native independente para testar o portal do aluno no Expo Go. Usa Expo SDK 57, React Native, Expo Router e SecureStore. O Next.js web em `frontend-aluno/` continua separado.

## Executar no Expo Go

1. Instale as dependências em `frontend-aluno-expo/` com `npm install`.
2. Crie `.env.local` a partir de `.env.example` e substitua o endereço pelo IPv4 LAN do computador, por exemplo `http://192.168.0.25:3001`.
3. Conecte o celular e o computador à mesma rede Wi-Fi.
4. Execute `npx expo start` e leia o QR code no Expo Go.

Em emulador Android, pode usar `http://10.0.2.2:3001`; em dispositivo físico, `localhost` aponta para o próprio telefone e não para o computador. Se a rede bloquear conexões locais, tente `npx expo start --tunnel`.

## Recuperação de senha

As telas Expo e Next usam os endpoints públicos comuns do backend. Para enviar links, configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_FROM`, `SMTP_USER` e `SMTP_PASSWORD` no `.env` local do backend. Não coloque credenciais no Git.

O backend usa `PASSWORD_RESET_URL` para formar o link do e-mail. Em teste pelo celular, esse endereço precisa ser alcançável pelo telefone, por exemplo `http://<IP-LAN-DO-COMPUTADOR>:3000/redefinir-senha`. Se o link for aberto no Expo Go e não direcionar ao app, copie o token da URL e cole na tela de redefinição.

## Verificações

```bash
npx tsc --noEmit
npx expo lint
npx expo-doctor
```

O app usa o login comum do backend e aceita apenas o perfil `ALUNO`. O reset por e-mail usa os mesmos endpoints compartilhados; no Expo Go, caso o link abra no navegador, copie o token para a tela de redefinição.

## Nota sobre relatos

A API atual não oferece listagem de relatos filtrada pelo usuário. O app não chama a rota global para evitar exibir dados de outros alunos; mostra somente relatos criados localmente durante a sessão.
### Other setup steps

- To set up ESLint for linting, run `npx expo lint`, or follow our guide on ["Using ESLint and Prettier"](https://docs.expo.dev/guides/using-eslint/)
- If you'd like to set up unit testing, follow our guide on ["Unit Testing with Jest"](https://docs.expo.dev/develop/unit-testing/)
- Learn more about the TypeScript setup in this template in our guide on ["Using TypeScript"](https://docs.expo.dev/guides/typescript/)

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
