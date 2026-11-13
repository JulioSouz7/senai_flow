export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret) {
    throw new Error('JWT_SECRET precisa estar configurado para iniciar e autenticar a API.');
  }
  return secret;
}
