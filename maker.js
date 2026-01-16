import prisma from "./db.js";

const runUpdate = async () => {
  try {
    const bc = await prisma.bondeCommandeChantierItem.update({
      where: {
        bondeCommandeId: 3990
      },
      data: {
        chantierId: 1
      }
    });
    if (bc) {
      console.log("Good it works");
    }
  } catch (error) {
    console.log(error);

  }
}

runUpdate();  