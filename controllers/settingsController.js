import prisma from "../db.js";

function normalizeNumber (number) {
    let cleaned = String(number || "").replace(/\D/g, "")

    // Morocco fix
    if (cleaned.startsWith("0")) {
        cleaned = "212" + cleaned.slice(1);
    }

    // If already starts with 212, keep it
    if (!cleaned.startsWith("212")) {
        throw new Error("Number must include Morocco country code (212)");
    }

    return cleaned;
}

export const settingsIndex = async (req, res) => {
  try {
    const recipients = await prisma.whatsAppNotificationRecipient.findMany({
      orderBy: { id: 'desc' },
    });

    return res.render('dashboard/settings/index', {
      recipients,
    });
  } catch (error) {
    console.error('Settings error:', error);
    return res.status(500).send('Erreur serveur');
  }
};

export const addNumbers = async (req, res) => {
  try {
    const phoneRaw = (req.body.phone || '').toString();
    const phone = normalizeNumber(phoneRaw)
    if (!phone) {
      return res.status(400).send('Numéro invalide');
    }

    const notifyCaisse = req.body.notifyCaisse === 'on' || req.body.notifyCaisse === 'true' || req.body.notifyCaisse === true;
    const notifyJustiffecaisse = req.body.notifyJustiffecaisse === 'on' || req.body.notifyJustiffecaisse === 'true' || req.body.notifyJustiffecaisse === true;
    const notifyFourniture = req.body.notifyFourniture === 'on' || req.body.notifyFourniture === 'true' || req.body.notifyFourniture === true;
    const active = req.body.active === 'on' || req.body.active === 'true' || req.body.active === true;

    await prisma.whatsAppNotificationRecipient.create({
      data: {
       
        phone,
        notifyCaisse,
        notifyJustiffecaisse,
        notifyFourniture,
        active,
      },
    });

    return res.redirect('/settings');
  } catch (error) {
    console.error('Add WhatsApp recipient error:', error);
    return res.status(500).send('Erreur serveur');
  }
};

export const editSettingNum = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).send('ID invalide');
    }

    const notifyCaisse = req.body.notifyCaisse === 'on' || req.body.notifyCaisse === 'true' || req.body.notifyCaisse === true;
    const notifyJustiffecaisse = req.body.notifyJustiffecaisse === 'on' || req.body.notifyJustiffecaisse === 'true' || req.body.notifyJustiffecaisse === true;
    const notifyFourniture = req.body.notifyFourniture === 'on' || req.body.notifyFourniture === 'true' || req.body.notifyFourniture === true;
    const active = req.body.active === 'on' || req.body.active === 'true' || req.body.active === true;

    await prisma.whatsAppNotificationRecipient.update({
      where: { id },
      data: {
        notifyCaisse,
        notifyJustiffecaisse,
        notifyFourniture,
        active,
      },
    });

    return res.redirect('/settings');
  } catch (error) {
    console.error('Update WhatsApp recipient error:', error);
    return res.status(500).send('Erreur serveur');
  }
};

export const deleteNum =  async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).send('ID invalide');
    }

    await prisma.whatsAppNotificationRecipient.delete({
      where: { id },
    });

    return res.redirect('/settings');
  } catch (error) {
    console.error('Delete WhatsApp recipient error:', error);
    return res.status(500).send('Erreur serveur');
  }
};