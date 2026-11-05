import { Suspense } from "react";
import { PasswordRecoveryScreen } from "@/features/auth/PasswordRecoveryScreen";

interface ResetPasswordPageProps {
  searchParams: Promise<{ token?: string | string[] }>;
}

export default function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  return <Suspense fallback={<main className="boot-screen" aria-label="Carregando"><span className="brand-mark">S</span></main>}><ResetPasswordContent searchParams={searchParams} /></Suspense>;
}

async function ResetPasswordContent({ searchParams }: ResetPasswordPageProps) {
  const params = await searchParams;
  const token = Array.isArray(params.token) ? params.token[0] : params.token;
  return <PasswordRecoveryScreen mode="reset" initialToken={token || ""} />;
}