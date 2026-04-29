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
        const {email, telefone, nif, morada, ativo} = request.body as {
            email: string;
            telefone: string;
            nif?: string;
            morada: string;
            ativo: boolean;
        }
        const response = await fetch(`https://consulta.edgarsingui.ao/consultar/${nif}`)
        if(!response.ok) return reply.status(404).send({message: "NIF inválido ou não encontrado!"})
        const data = await response.json() as{
             error: boolean;
             name: string;
            endereco: string;
            data_de_nascimento: string;
         }
       
         const leitorExistente = await prisma.leitor.findUnique({
            where : {nif}
        })
        if(leitorExistente) return reply.status(400).send({"message": "O leitor já registrado."})
        const leitor = await prisma.leitor.create({
            data: {
                nome: data.name,
                email,
                telefone,
                nif,
                morada
            }
    })
        return reply.status(201).send(leitor)
    })
    app.put("/leitores/:id",{preHandler: authenticate}, async(request, reply) =>{
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
