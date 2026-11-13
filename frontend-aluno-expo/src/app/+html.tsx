import type { PropsWithChildren } from "react";
import { ScrollViewStyleReset, useServerDocumentContext } from "expo-router/html";

export default function Root({ children }: PropsWithChildren) {
  const { headNodes, bodyNodes, htmlAttributes, bodyAttributes } = useServerDocumentContext();

  return (
    <html lang="pt-BR" {...htmlAttributes}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <title>SENAI Flow | Usuário</title>
        <link rel="icon" href="/favicon.ico" />
        {headNodes}
      </head>
      <body {...bodyAttributes}>
        <ScrollViewStyleReset />
        {children}
        {bodyNodes}
      </body>
    </html>
  );
}
