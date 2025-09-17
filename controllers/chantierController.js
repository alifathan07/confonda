import prisma from "../db.js";

export const indexChantiers = async (req, res) => {
    const chantiers = await prisma.chantier.findMany({
      include : {
          client : true
      }
    });
    const clients = await prisma.client.findMany();
    res.render('dashboard/ventes/chantiers/index', { chantiers , clients });
}
export const postChantier = async (req , res) => {
    const { nom, clientId } = req.body;

    const chantier = await prisma.chantier.create({
      data: {
        nom,
        client: {
          connect: { id: Number(clientId) }
        }
      }
    });
    
    res.status(201).json(chantier);
}
