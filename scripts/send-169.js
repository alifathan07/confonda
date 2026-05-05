import prisma from '../db.js';
import { whatsappService, getClient } from '../services/whatssapservice.js';
import { generateDemandeFourniturePDFBuffer } from '../controllers/demandeFourniture.js';

async function send169() {
  console.log('🔄 Sending demande #169...');
  
  // Wait for WhatsApp (uses existing session from main app)
  await whatsappService.waitUntilReady();
  console.log('✅ WhatsApp ready');

  // Get demande #169
  const demandes = await prisma.demandeFourniture.findMany({
    where: { numero: 169 },
    include: { user: true, chantier: true, items: true }
  });

  if (demandes.length === 0) {
    console.log('❌ Demande #169 not found');
    return;
  }

  const demande = demandes[0];
  console.log(`📋 Found demande #${demande.numero}`);

  // Get recipients
  const recipients = await prisma.whatsAppNotificationRecipient.findMany({
    where: { active: true, notifyFourniture: true },
    select: { phone: true },
  });

  const numbers = recipients.map(r => r.phone);
  console.log(`📱 Recipients: ${numbers.join(', ')}`);

  // Generate PDF and send
  const pdfBuffer = await generateDemandeFourniturePDFBuffer(demande.id);
  const filename = `demande_fourniture_${demande.numero}.pdf`;
  const message = `Nouvelle commande créée par ${demande.user?.name || 'Unknown'}. Numéro: ${demande.numero}. Date: ${demande.dateDemande.toLocaleDateString('fr-FR')}. Chantier: ${demande.chantier?.nom || 'Unknown'}.`;

  for (const number of numbers) {
    try {
      await whatsappService.sendMessage(number, message, {
        data: pdfBuffer,
        filename,
        mimetype: 'application/pdf',
      });
      console.log(`✅ Sent to ${number}`);
    } catch (err) {
      console.error(`❌ Failed to send to ${number}:`, err.message);
    }
  }

  console.log('✅ Done!');
}

send169().catch(console.error);
