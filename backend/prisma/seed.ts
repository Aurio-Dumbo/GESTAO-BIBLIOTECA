import bcrypt from "bcrypt";
import { prisma } from "../src/lib/prisma";

async function main() {
  try {
    // Verifica se já existe um admin
    const adminExists = await prisma.usuario.findUnique({
      where: { username: "admin" },
    });
    if (!adminExists) {
      const pinHash = await bcrypt.hash("000000", 10);
      const admin = await prisma.usuario.create({
        data: {
          nome: "Administrador",
          username: "admin",
          pin: pinHash,
          role: "ADMIN",
          ativo: true,
        },
      });
      console.log(" Admin criado com sucesso:", admin);
    } else {
      console.log("Admin já existe");
    }
  } catch (error) {
    console.error("Erro ao criar admin:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
