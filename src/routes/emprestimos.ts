import { FastifyInstance } from "fastify";
import {prisma} from "../lib/prisma"
import { authenticate } from "../middleware/authenticate";

export async function EmprestimosRoutes(app:FastifyInstance){
    app.get("/emprestimos",{preHandler: authenticate}, async(request, reply) =>{
        const emprestimos = await prisma.emprestimo.findMany({
            include:{
                leitor: true,
                livro: true
            }
        })
        if(!emprestimos) return reply.status(404).send({message: "Nenhum emprestimo encontrado!"})
        return reply.status(200).send(emprestimos)
    })
app.get("/emprestimos/:id",{preHandler: authenticate}, async(request, reply) =>{
    const {id} = request.params as {id: string}
    const emprestimo = await prisma.emprestimo.findUnique({
        where: {id: Number(id)}
    })
    if(!emprestimo) return reply.status(404).send({message: "Emprestimo não encontrado."})
    return reply.status(200).send(emprestimo)
})
app.post("/emprestimos",{preHandler: authenticate}, async(request, reply) =>{
    const {leitorId, livroId, dataPrevista} = request.body as({
        leitorId: string;
        livroId: string;
        dataPrevista: string
    })
    const livro = await prisma.livro.findUnique({
        where: {id: Number(livroId)}
    })
    if(!livro) return reply.status(404).send({message: "Livro não encontrado."})
    if(livro.disponiveis === 0) return reply.status(400).send({message: "Livro não disponível."})
    
    const emprestimo = await prisma.$transaction([
        prisma.emprestimo.create({
            data: {
                leitorId: Number(leitorId), livroId: Number(livroId), dataPrevista: new Date(dataPrevista)
            }
        }),
        prisma.livro.update({
            where: {id: Number(livroId)},
            data: {disponiveis: livro.disponiveis -1}
        })
    ])
})
    app.put("/emprestimos/:id",{preHandler: authenticate} ,async(request, reply) => {
        const {emprestimoId} = request.body as {emprestimoId: number}
       const emprestimo = await prisma.emprestimo.findUnique({
        where: {id: emprestimoId}
       })
       if(!emprestimo) return reply.status(404).send({message: "Emprestimo não encontrado"})
       if(emprestimo.dataDevolucao) return reply.status(400).send({message: "Este livro já foi devolvido."})
       const agora = new Date()
    const estado = agora > emprestimo.dataPrevista ? "ATRASADO" : "DEVOLVIDO"
    })
}