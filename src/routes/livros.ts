import { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma";
import { authenticate } from "../middleware/authenticate";

type LivroExterno = {
    titulo: string;
    autor: string;
    ano: number | null;
    editora: string | null;
}

async function buscarNaOpenLibrary(isbn: string): Promise<LivroExterno | null> {
    const response = await fetch(
        `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`,
        { signal: AbortSignal.timeout(5000) }
    )

    if (!response.ok) {
        throw new Error(`Open Library respondeu com status ${response.status}`)
    }

    const data = await response.json() as Record<string, {
        title?: string;
        authors?: Array<{ name?: string }>;
        publish_date?: string;
        publishers?: Array<{ name?: string }>;
    }>

    const livroData = data[`ISBN:${isbn}`]
    if (!livroData?.title) {
        return null
    }

    return {
        titulo: livroData.title,
        autor: livroData.authors?.[0]?.name ?? "Desconhecido",
        ano: livroData.publish_date ? Number(livroData.publish_date.slice(-4)) || null : null,
        editora: livroData.publishers?.[0]?.name ?? null
    }
}

async function buscarNoGoogleBooks(isbn: string): Promise<LivroExterno | null> {
    const response = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`,
        { signal: AbortSignal.timeout(5000) }
    )

    if (!response.ok) {
        throw new Error(`Google Books respondeu com status ${response.status}`)
    }

    const data = await response.json() as {
        items?: Array<{
            volumeInfo?: {
                title?: string;
                authors?: string[];
                publishedDate?: string;
                publisher?: string;
            }
        }>;
    }

    const volumeInfo = data.items?.[0]?.volumeInfo
    if (!volumeInfo?.title) {
        return null
    }

    const anoPublicado = volumeInfo.publishedDate
        ? Number(volumeInfo.publishedDate.slice(0, 4)) || null
        : null

    return {
        titulo: volumeInfo.title,
        autor: volumeInfo.authors?.[0] ?? "Desconhecido",
        ano: anoPublicado,
        editora: volumeInfo.publisher ?? null
    }
}

async function buscarLivroPorIsbn(isbn: string): Promise<LivroExterno | null> {
    try {
        const livro = await buscarNaOpenLibrary(isbn)
        if (livro) {
            return livro
        }
    } catch {
        // Segue para o fallback abaixo quando a Open Library estiver indisponivel.
    }

    return buscarNoGoogleBooks(isbn)
}

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

    let livroData: LivroExterno | null

    try {
        livroData = await buscarLivroPorIsbn(isbn)
    } catch (error) {
        request.log.error({ error, isbn }, "Falha ao consultar APIs externas de livros")
        return reply.status(502).send({ message: "Nao foi possivel consultar os catalogos externos no momento." })
    }

    if (!livroData) {
        return reply.status(404).send({ message: "Livro não encontrado para o ISBN informado." })
    }

    const livro = await prisma.livro.create({
        data: {
            isbn,
            titulo: livroData.titulo,
            autor: livroData.autor,
            ano: livroData.ano,
            editora: livroData.editora,
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