import Fastify from "fastify";
import fastifyJwt from "@fastify/jwt"
import dotenv from "dotenv";
import {UsuariosRoutes} from "./routes/usuarios"
import {LeitoresRoutes} from "./routes/leitores"
import {LivrosRoutes} from "./routes/livros"
import {EmprestimosRoutes} from "./routes/emprestimos"
import {AuthRoutes} from "./routes/auth"


dotenv.config();

const PORT =  Number(process.env.PORT)
const app = Fastify({ logger: true });
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
    await app.listen({ port:PORT });
    console.log(`Servidor a correr em ${PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();