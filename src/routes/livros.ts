import { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma";
import { authenticate } from "../middleware/authenticate";

export async function LivrosRoutes(app: FastifyInstance){
    app.get("/livros", async (request, reply) => {
        const livros = await prisma.livro.findMany()
        return livros
    })

    app.get("/livros/:id", async (request, reply) => {
        const {id} =  request.params as {id : string}
        const livro = await prisma.livro.findUnique({
            where: {id: Number(id)}
        })
    if(!livro){
        return reply.code(404).send({message: "Livro não encontrado"})
    }
    return livro
    })
    app.get("/livros/isbn/:isbn", async (request, reply) =>{
        const {isbn}  = request.params as {isbn: string}
        const livro = await prisma.livro.findUnique({
            where: {isbn}
        })
        if(!livro) return reply.status(404).send({message: "Livro não encontrado."})
        return livro
    })

    app.post("/livros",{preHandler: authenticate}, async (request, reply) => {
    const { isbn, quantidade } = request.body as {
        isbn: string;
        quantidade?: number;
    }

    //Open Library
    const response = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`)
    const data = await response.json() as any
    const livroData = data[`ISBN:${isbn}`]

    if (!livroData) {
        return reply.status(404).send({ message: "Livro não encontrado na Open Library." })
    }

    const titulo = livroData.title
    const autor = livroData.authors?.[0]?.name ?? "Desconhecido"
    const ano = livroData.publish_date ? Number(livroData.publish_date.slice(-4)) : null
    const editora = livroData.publishers?.[0]?.name ?? null

    const livro = await prisma.livro.create({
        data: {
            isbn,
            titulo,
            autor,
            ano,
            editora,
            quantidade: quantidade ?? 1,
            disponiveis: quantidade ?? 1
        }
    })

    return reply.status(201).send(livro)
})
    app.put("/livros/:id",{preHandler: authenticate}, async(request, reply) => {
        const {id} = request.params as {id: string}
        const {titulo, autor, isbn, ano, editora, categoria} = request.body as {
            titulo?: string;
            autor?: string;
            isbn?: string;
            ano?: number;
            editora?: string;
            categoria?: string;
        }
        const livro = await prisma.livro.update({
            where: {id: Number(id)},
            data: {titulo, autor, isbn, ano, editora, categoria}
        })
        return livro
    })
    app.delete("/livros:id",{preHandler: authenticate}, async (request, reply) => {
        const {id} = request.params as {id: string}
        await prisma.livro.delete({
            where: {id: Number(id)}
        })
        return reply.status(204).send()
    })
    
}