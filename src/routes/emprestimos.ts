import { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma";
import { authenticate } from "../middleware/authenticate";

export async function EmprestimosRoutes(app: FastifyInstance) {
    app.get("/emprestimos", { preHandler: authenticate }, async (request, reply) => {
        const emprestimos = await prisma.emprestimo.findMany({
            include: { leitor: true, livro: true }
        });
        if (!emprestimos.length) return reply.status(404).send({ message: "Nenhum emprestimo encontrado!" });
        return reply.status(200).send(emprestimos);
    });

    app.get("/emprestimos/:id", { preHandler: authenticate }, async (request, reply) => {
        const { id } = request.params as { id: string };
        const emprestimo = await prisma.emprestimo.findUnique({
            where: { id: Number(id) }
        });
        if (!emprestimo) return reply.status(404).send({ message: "Emprestimo não encontrado." });
        return reply.status(200).send(emprestimo);
    });

    app.post("/emprestimos", { preHandler: authenticate }, async (request, reply) => {
        const { leitorId, livroId, dataPrevista } = request.body as {
            leitorId: string;
            livroId: string;
            dataPrevista: string;
        };

        const leitor = await prisma.leitor.findUnique({ where: { id: Number(leitorId) } });
        if (!leitor) return reply.status(404).send({ message: "Leitor não encontrado." });

        const livro = await prisma.livro.findUnique({ where: { id: Number(livroId) } });
        if (!livro) return reply.status(404).send({ message: "Livro não encontrado." });
        if (livro.disponiveis === 0) return reply.status(400).send({ message: "Livro não disponível." });

        const [emprestimo] = await prisma.$transaction([
            prisma.emprestimo.create({
                data: {
                    leitorId: Number(leitorId),
                    livroId: Number(livroId),
                    dataPrevista: new Date(dataPrevista)
                }
            }),
            prisma.livro.update({
                where: { id: Number(livroId) },
                data: { disponiveis: { decrement: 1 } } 
            })
        ]);

        return reply.status(201).send(emprestimo); 
    });

    app.patch("/emprestimos/:id/devolver", { preHandler: authenticate }, async (request, reply) => {
        const { id } = request.params as { id: string };

        const emprestimo = await prisma.emprestimo.findUnique({ where: { id: Number(id) } });
        if (!emprestimo) return reply.status(404).send({ message: "Emprestimo não encontrado." });
        if (emprestimo.estado !== "ATIVO") return reply.status(400).send({ message: "Este livro já foi devolvido." });

        const agora = new Date();
        const estado = agora > emprestimo.dataPrevista ? "ATRASADO" : "DEVOLVIDO";

        const [emprestimoAtualizado] = await prisma.$transaction([
            prisma.emprestimo.update({
                where: { id: Number(id) },
                data: { dataDevolucao: agora, estado } 
            }),
            prisma.livro.update({
                where: { id: emprestimo.livroId },
                data: { disponiveis: { increment: 1 } } 
            })
        ]);

        return reply.status(200).send(emprestimoAtualizado); 
    });
}