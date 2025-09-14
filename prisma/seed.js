import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Check if "sege" exists
  const exists = await prisma.chantier.findFirst({
    where: { nom: "siege" }
  });

  if (!exists) {
    await prisma.chantier.create({
      data: {
        nom: "siege",
        clientId: null, // not connected to any client
      }
    });
    console.log('✅ Default chantier "sege" created');
  } else {
    console.log('ℹ️ "sege" chantier already exists');
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
