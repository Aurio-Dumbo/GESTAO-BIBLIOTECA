import { FastifyInstance } from "fastify";
import {prisma} from "../lib/prisma"


export async function UsuariosRoutes(app: FastifyInstance){
    app.get("/usuarios", async(request, reply) => {
        const usuarios = await prisma.usuario.findMany({
            select: {
                id: true,
                nome: true,
                email: true,
                role: true,                                                     
                ativo: true,
                createdAt: true,
                password: false
            }
        })
        return usuarios
    })
    app.get("/usuarios/:id", async(request, reply) => {
        const {id} = request.params as {id: string}
        const usuario = await prisma.usuario.findUnique({
            where: {id: Number(id)},
            select: {
               id:true,
               nome: true,
               email: true,
               role: true,
               ativo: true,
                createdAt: true,
                password: false 
            }
        })
        if(!usuario){
            return reply.status(404).send({message: "Usuário não encontrado" })
        }
        return usuario
    })
app.post("/usuarios", async(request, reply) => {
    const {nome, email, password, role} = request.body as {
        nome: string;
        email: string;
        password: string;
        role?:"ADMIN" | "BIBLIOTECARIO";
    }
    const usuario = await prisma.usuario.create({
        data: {nome, email, password, role}                          
    })
    return reply.status(201).send(usuario)
})

app.put("/usuarios/:id", async(request, reply) =>{
    const {id} = request.params as {id: string}
    const {nome, email, role, ativo} = request.body as {
        nome?: string;
        email?: string;
        role?: "ADMIN" | "BIBLIOTECARIO";
        ativo?: boolean;
    }
    const usuario = await prisma.usuario.update({
        where: {id: Number(id)},
        data: {nome, email, role, ativo}
    })
    return usuario
})
app.delete("/usuarios/:id", async(request, reply) =>{
    const {id} = request.params as {id: string}
    await prisma.usuario.delete({
        where: {id: Number(id)}
    })
    return reply.status(204)
})
}

