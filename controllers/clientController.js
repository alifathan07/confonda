import prisma from "../db.js";

export const indexClients = async (req, res) => {
    const clients = await prisma.client.findMany({
      include : {
          chantier : true
      }
    });
    const chantiers = await prisma.chantier.findMany();
    res.render('dashboard/ventes/client/index', { clients , chantiers });
}
export const postClient = async (req , res) => {
      const { name , ice , identifFiscal , telClient , contact , telContact } = req.body;
      const client = await prisma.client.create({
          data : {
              name : name , ice : ice , identifFiscal : identifFiscal , telClient : telClient , contact : contact , telContact : telContact 
          }
      })
      res.status(201).json(client);
}
export const updateClient = async (req, res) => {
  try {
    const { name, ice, identifFiscal, telClient, contact, telContact, chantier } = req.body;
    const { id } = req.params;

    if (!id) return res.status(400).json({ error: "Client ID is required" });
    if (!name || !ice || !identifFiscal) {
      return res.status(400).json({ error: "Name, ICE, and Identifiant Fiscal are required" });
    }

    let chantierConnect = undefined;

    // If chantier is sent as a name (string not a number)
    if (chantier && isNaN(chantier)) {
      const chantierRecord = await prisma.chantier.findFirst({
        where: { nom: chantier },
      });
      if (!chantierRecord) {
        return res.status(400).json({ error: "Chantier not found" });
      }
      chantierConnect = { connect: { id: chantierRecord.id } };
    }
    // If chantier is sent as an ID
    else if (chantier) {
      chantierConnect = { connect: { id: parseInt(chantier) } };
    }

    const updateData = {
      name,
      ice,
      identifFiscal,
      telClient,
      contact,
      telContact,
      chantier: chantierConnect,
    };

    // Update the client
    const client = await prisma.client.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: { chantier: true },
    });

    res.status(200).json(client);
  } catch (error) {
    console.error("Error updating client:", error);
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Client not found" });
    }
    res.status(500).json({ error: "Internal server error" });
  }
};
export const deleteClient = async (req , res) => {
    const { id } = req.params;
    await prisma.client.delete({ where: { id: Number(id) } });
    res.status(200).json({ message: 'Client supprimé avec succès.' });
}