import { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma";
import bcrypt from "bcrypt";
import { authenticate } from "../middleware/authenticate";
export async function UsuariosRoutes(app: FastifyInstance) {

  app.get("/usuarios",{preHandler: authenticate}, async (request, reply) => {
    const usuarios = await prisma.usuario.findMany({
      select: {
        id: true,
        nome: true,
        username: true,
        role: true,
        ativo: true,
        createdAt: true,
        pin: false
      }
    })
    return usuarios
  })

  app.get("/usuarios/:id",{preHandler: authenticate}, async (request, reply) => {
    const { id } = request.params as { id: string }

    const usuario = await prisma.usuario.findUnique({
      where: { id: Number(id) },
      select: {
        id: true,
        nome: true,
        username: true,
        role: true,
        ativo: true,
        createdAt: true,
        pin: false
      }
    })

    if (!usuario) {
      return reply.status(404).send({ message: "Usuário não encontrado." })
    }

    return usuario
  })

  app.post("/usuarios", async (request, reply) => {
    const totalUsuarios = await prisma.usuario.count()

    if (totalUsuarios > 0) {
      await authenticate(request, reply)

      if (reply.sent) {
        return
      }
    }

    const { nome, username, pin, role } = request.body as {
      nome: string;
      username: string;
      pin: string;
      role?: "ADMIN" | "BIBLIOTECARIO";
    }

    // valida que o pin tem 6 dígitos
    if (!/^\d{6}$/.test(pin)) {
      return reply.status(400).send({ message: "O PIN deve ter exatamente 6 dígitos." })
    }

    // encripta o pin
    const pinHash = await bcrypt.hash(pin, 10)

    const usuario = await prisma.usuario.create({
      data: { nome, username, pin: pinHash, role }
    })

    return reply.status(201).send({
      id: usuario.id,
      nome: usuario.nome,
      username: usuario.username,
      role: usuario.role
    })
  })

  app.put("/usuarios/:id",{preHandler: authenticate}, async (request, reply) => {
    const { id } = request.params as { id: string }
    const { nome, username, pin, role, ativo } = request.body as {
      nome?: string;
      username?: string;
      pin?: string;
      role?: "ADMIN" | "BIBLIOTECARIO";
      ativo?: boolean;
    }

    
    let pinHash
    if (pin) {
      if (!/^\d{6}$/.test(pin)) {
        return reply.status(400).send({ message: "O PIN deve ter exatamente 6 dígitos." })
      }
      pinHash = await bcrypt.hash(pin, 10)
    }

    const usuario = await prisma.usuario.update({
      where: { id: Number(id) },
      data: { nome, username, pin: pinHash, role, ativo }
    })

    return {
      id: usuario.id,
      nome: usuario.nome,
      username: usuario.username,
      role: usuario.role,
      ativo: usuario.ativo
    }
  })

  app.delete("/usuarios/:id",{preHandler: authenticate}, async (request, reply) => {
    const { id } = request.params as { id: string }

    await prisma.usuario.delete({
      where: { id: Number(id) }
    })

    return reply.status(204).send()
  })
}