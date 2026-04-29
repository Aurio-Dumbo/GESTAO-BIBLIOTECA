import { FastifyInstance } from "fastify";
import {prisma} from "../lib/prisma"
import { authenticate } from "../middleware/authenticate";
export async function LeitoresRoutes(app: FastifyInstance) {
    app.get("/leitores",{preHandler: authenticate}, async(request, reply) =>{
        const leitores = await prisma.leitor.findMany()
        if(!leitores){
            return reply.code(404).send({message: "Nenhum leitor encontrado."})
        }
        return leitores
    })
    app.get("/leitores/:id",{preHandler: authenticate}, async(request, reply) => {
        const {id} = request.params as {id: string}
        const leitor = await prisma.leitor.findUnique({
            where: {id: Number(id)}
        })
        if(!leitor){
            return reply.code(404).send({send: "Leitor não encontrado"})
        }
        return leitor
    })
    app.post("/leitores",{preHandler: authenticate}, async(request, reply) =>{
        const {nome, email, telefone, nif, morada, ativo} = request.body as {
            nome: string;
            email: string;
            telefone: string;
            nif?: string;
            morada: string;
            ativo: boolean;
        }
        return reply.status(201).send({message: "Leitor criado com sucesso"})
    })
    app.put("/leitores:/id",{preHandler: authenticate}, async(request, reply) =>{
        const{id} = request.params as {id: string}
        const {nome, email, telefone, nif, morada, ativo} = request.body as {
            nome?: string;
            email?: string;
            telefone?: string;
            nif?: string;
            morada?: string;
            ativo?: boolean;
        }
        const leitor = await prisma.leitor.update({
            where: {id: Number(id)},
            data: {nome, email, telefone, nif, morada, ativo}
        })
        return leitor
    })
    app.delete("/leitores/:id",{preHandler: authenticate}, async(request, reply) =>{
        const {id} = request.params as {id: string}
        await prisma.leitor.delete({
            where: {id: Number(id)}
        })
        return reply.status(204).send({message: "Leitor eliminado com sucesso"})
    })
}
