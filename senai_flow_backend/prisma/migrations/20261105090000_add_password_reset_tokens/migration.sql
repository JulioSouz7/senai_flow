CREATE TABLE "SENHA_RESET_TOKEN" (
    "id_senha_reset_token" SERIAL NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "token_hash" VARCHAR(64) NOT NULL,
    "dt_expiracao" TIMESTAMP(3) NOT NULL,
    "dt_usado" TIMESTAMP(3),
    "dt_criacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SENHA_RESET_TOKEN_pkey" PRIMARY KEY ("id_senha_reset_token")
);

CREATE UNIQUE INDEX "SENHA_RESET_TOKEN_token_hash_key" ON "SENHA_RESET_TOKEN"("token_hash");
CREATE INDEX "SENHA_RESET_TOKEN_id_usuario_dt_expiracao_idx" ON "SENHA_RESET_TOKEN"("id_usuario", "dt_expiracao");

ALTER TABLE "SENHA_RESET_TOKEN"
ADD CONSTRAINT "SENHA_RESET_TOKEN_id_usuario_fkey"
FOREIGN KEY ("id_usuario") REFERENCES "USUARIO"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;