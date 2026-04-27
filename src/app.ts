import Fastify from "fastify";
import dotenv from "dotenv";
import {UsuariosRoutes} from "./routes/usuarios"
import {LeitoresRoutes} from "./routes/leitores"
import {LivrosRoutes} from "./routes/livros"
import {EmprestimosRoutes} from "./routes/emprestimos"

dotenv.config();

const PORT =  Number(process.env.PORT)
const app = Fastify({ logger: true });

app.register(UsuariosRoutes)
app.register(LeitoresRoutes)
app.register(LivrosRoutes)
app.register(EmprestimosRoutes)
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