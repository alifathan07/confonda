import prisma from "../db.js";

// Utility function for logging errors
const logError = (action, error) => {
  console.error(`💥 Error during ${action}:`, error);
};

// GET /dashboard/ventes/clients - Display all clients
export const indexClient = async (req, res) => {
  try {
    const clients = await prisma.client.findMany({
      include: { chantier: true },
      orderBy: { createdAt: 'desc' }
    });

    const chantiers = await prisma.chantier.findMany({
      orderBy: { nom: 'asc' }
    });

    res.render("dashboard/ventes/client/index", { clients, chantiers });
  } catch (error) {
    logError('fetching clients', error);
    res.status(500).render('error', { error: 'Erreur lors du chargement des clients' });
  }
};

// POST /dashboard/ventes/clients - Create new client
export const createClient = async (req, res) => {
  try {
    const { name, email, ice, identifFiscal, telClient, contact, telContact, address, chantierId } = req.body;

    const clientData = {
      name,
      email: email || null,
      ice,
      identifFiscal,
      telClient,
      contact,
      telContact,
      address: address || null,
      chantier: chantierId ? { connect: { id: parseInt(chantierId) } } : undefined
    };

    const client = await prisma.client.create({
      data: clientData,
      include: { chantier: true }
    });

    if (req.xhr || req.headers.accept?.includes('json')) {
      return res.json({ success: true, message: 'Client créé avec succès', client });
    }

    res.redirect('/dashboard/ventes/clients');
  } catch (error) {
    logError('creating client', error);
    if (req.xhr || req.headers.accept?.includes('json')) {
      return res.status(500).json({ success: false, error: 'Erreur lors de la création du client' });
    }
    res.status(500).render('error', { error: 'Erreur lors de la création du client' });
  }
};

// PUT/PATCH /dashboard/ventes/clients/:id - Update client
export const updateClient = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, ice, identifFiscal, telClient, contact, telContact, address, chantierId } = req.body;

    const clientData = {
      name,
      email: email || null,
      ice,
      identifFiscal,
      telClient,
      contact,
      telContact,
      address: address || null,
      chantier: chantierId
        ? { set: [{ id: parseInt(chantierId) }] }
        : { set: [] }
    };

    const client = await prisma.client.update({
      where: { id: parseInt(id) },
      data: clientData,
      include: { chantier: true }
    });

    if (req.xhr || req.headers.accept?.includes('json')) {
      return res.json({ success: true, message: 'Client mis à jour avec succès', client });
    }

    res.redirect('/dashboard/ventes/clients');
  } catch (error) {
    logError('updating client', error);
    if (req.xhr || req.headers.accept?.includes('json')) {
      return res.status(500).json({ success: false, error: 'Erreur lors de la mise à jour du client' });
    }
    res.status(500).render('error', { error: 'Erreur lors de la mise à jour du client' });
  }
};

// DELETE /dashboard/ventes/clients/:id - Delete client
export const deleteClient = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.client.delete({ where: { id: parseInt(id) } });

    if (req.xhr || req.headers.accept?.includes('json')) {
      return res.json({ success: true, message: 'Client supprimé avec succès' });
    }

    res.redirect('/dashboard/ventes/clients');
  } catch (error) {
    logError('deleting client', error);
    if (req.xhr || req.headers.accept?.includes('json')) {
      return res.status(500).json({ success: false, error: 'Erreur lors de la suppression du client' });
    }
    res.status(500).render('error', { error: 'Erreur lors de la suppression du client' });
  }
};
