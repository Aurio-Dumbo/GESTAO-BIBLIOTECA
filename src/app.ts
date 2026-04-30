import Fastify from "fastify";
import fastifyJwt from "@fastify/jwt"
import fastifyCors from "@fastify/cors";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import { prisma } from "./lib/prisma";
import {UsuariosRoutes} from "./routes/usuarios"
import {LeitoresRoutes} from "./routes/leitores"
import {LivrosRoutes} from "./routes/livros"
import {EmprestimosRoutes} from "./routes/emprestimos"
import {AuthRoutes} from "./routes/auth"


dotenv.config();

const PORT =  Number(process.env.PORT)
const app = Fastify({ logger: true });
const ADMIN_USERNAME = "admin";
const ADMIN_PIN = "000000";

function isBcryptHash(value: string) {
  return /^\$2[aby]\$\d{2}\$/.test(value);
}

app.register(fastifyCors, {
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
});
app.register(fastifyJwt, {
  secret: process.env.JWT_SECRET_KEY as string
})
app.register(UsuariosRoutes)
app.register(LeitoresRoutes)
app.register(LivrosRoutes)
app.register(EmprestimosRoutes)
app.register(AuthRoutes)
const start = async () => {
  try {
    // Executa o seed para criar o admin
    const adminExists = await prisma.usuario.findUnique({
      where: { username: ADMIN_USERNAME },
    });

    if (!adminExists) {
      const pinHash = await bcrypt.hash(ADMIN_PIN, 10);

      await prisma.usuario.create({
        data: {
          nome: "Administrador",
          username: ADMIN_USERNAME,
          pin: pinHash,
          role: "ADMIN",
          ativo: true,
        },
      });
      console.log("✓ Admin criado com sucesso");
    } else {
      // Corrige dados antigos onde o admin foi guardado com PIN sem hash.
      if (!isBcryptHash(adminExists.pin)) {
        const pinHash = await bcrypt.hash(ADMIN_PIN, 10);
        await prisma.usuario.update({
          where: { id: adminExists.id },
          data: { pin: pinHash },
        });
        console.log("✓ PIN do admin atualizado para hash");
      }

      console.log("✓ Admin já existe");
    }

    await app.listen({ port:PORT });
    console.log(`Servidor a correr em ${PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();