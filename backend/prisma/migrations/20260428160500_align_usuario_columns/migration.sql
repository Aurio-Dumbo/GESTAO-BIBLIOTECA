ALTER TABLE "Usuario"
RENAME COLUMN "email" TO "username";

ALTER TABLE "Usuario"
RENAME COLUMN "password" TO "pin";

ALTER INDEX "Usuario_email_key"
RENAME TO "Usuario_username_key";