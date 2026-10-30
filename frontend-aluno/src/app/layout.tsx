import type { Metadata } from "next";
import "./globals.scss";

export const metadata: Metadata = {
  title: "SENAI Flow | Aluno",
  description: "Portal mobile do aluno SENAI Flow.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
