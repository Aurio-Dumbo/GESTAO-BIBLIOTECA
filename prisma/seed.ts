import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    // Verifica se já existe um admin
    const adminExists = await prisma.usuario.findUnique({
      where: { username: "admin" },
    });

    if (!adminExists) {
      const admin = await prisma.usuario.create({
        data: {
          nome: "Administrador",
          username: "admin",
          pin: "00000",
          role: "ADMIN",
          ativo: true,
        },
      });
      console.log("✓ Admin criado com sucesso:", admin);
    } else {
      console.log("✓ Admin já existe");
    }
  } catch (error) {
    console.error("Erro ao criar admin:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
