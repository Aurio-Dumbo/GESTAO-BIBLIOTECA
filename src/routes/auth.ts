import { FastifyInstance } from "fastify";
import {prisma} from "../lib/prisma"
import bcrypt from "bcrypt"

export async function AuthRoutes(app:FastifyInstance){
    app.post("/auth/login",async (request, reply) =>{
        const {username, pin} = request.body as {
            username: string;
            pin : string;
        }
    const usuario =await prisma.usuario.findUnique({
        where: {username}
    })

    if (!usuario) {
        return reply.status(401).send({ message: "Credenciais inválidas." })
    }

    if (!usuario.ativo) {
        return reply.status(403).send({ message: "Utilizador inativo." })
    }

    const pinValido = await bcrypt.compare(pin, usuario.pin)

    if (!pinValido) {
        return reply.status(401).send({ message: "Credenciais inválidas." })
    }

    const token = await reply.jwtSign({
        sub: String(usuario.id),
        username: usuario.username,
        role: usuario.role
    })

    return reply.send({
        token,
        usuario: {
            id: usuario.id,
            nome: usuario.nome,
            username: usuario.username,
            role: usuario.role
        }
    })
    } )
}