import Fastify from "fastify";
import fastifyJwt from "@fastify/jwt"
import fastifyCors from "@fastify/cors";
import dotenv from "dotenv";
import { prisma } from "./lib/prisma";
import {UsuariosRoutes} from "./routes/usuarios"
import {LeitoresRoutes} from "./routes/leitores"
import {LivrosRoutes} from "./routes/livros"
import {EmprestimosRoutes} from "./routes/emprestimos"
import {AuthRoutes} from "./routes/auth"


dotenv.config();

const PORT =  Number(process.env.PORT)
const app = Fastify({ logger: true });
app.register(fastifyCors, {
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
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
      where: { username: "admin" },
    });

    if (!adminExists) {
      await prisma.usuario.create({
        data: {
          nome: "Administrador",
          username: "admin",
          pin: "00000",
          role: "ADMIN",
          ativo: true,
        },
      });
      console.log("✓ Admin criado com sucesso");
    } else {
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