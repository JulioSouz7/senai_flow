import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  // Limites de tempo para a conexão não ficar travada esperando a rede
  connectionTimeout: 5000, // 5 segundos
  greetingTimeout: 5000,
  socketTimeout: 5000,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function enviarEmailRecuperacao(emailDestino: string, token: string) {
  const baseUrl = process.env.PASSWORD_RESET_URL || 'http://localhost:3000/redefinir-senha';
  const linkReset = `${baseUrl}?token=${token}`;

  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'SENAI Flow <no-reply@senaiflow.com>',
    to: emailDestino,
    subject: 'SENAI Flow - Recuperação de Senha',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #1e293b; max-width: 500px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #e11d48; margin-top: 0;">SENAI Flow</h2>
        <p>Recebemos uma solicitação para redefinir a senha da sua conta institucional.</p>
        <p>Clique no botão abaixo para cadastrar a sua nova senha (o link é válido por <strong>1 hora</strong>):</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${linkReset}" target="_blank" style="background-color: #0F172A; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
            Redefinir Minha Senha
          </a>
        </div>

        <p style="font-size: 13px; color: #475569; word-break: break-all;">
          Se o botão não funcionar, copie e cole o seguinte link no seu navegador:<br>
          <a href="${linkReset}" style="color: #2563eb;">${linkReset}</a>
        </p>
      </div>
    `,
  });
}