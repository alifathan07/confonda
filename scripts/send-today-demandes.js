import { generateDemandeFourniturePDFBuffer } from '../controllers/demandeFourniture.js';
import prisma from '../db.js';
import { whatsappService } from '../services/whatssapservice.js';

async function sendTodayDemandes() {
  // Check for specific demande number argument
  const demandeNumero = process.argv[2] ? parseInt(process.argv[2]) : null;
  
  console.log('🔄 Starting to send demande fourniture...');
  if (demandeNumero) {
    console.log(`📌 Targeting specific demande #${demandeNumero}`);
  }
  
  // Wait for WhatsApp to be ready
  console.log('⏳ Waiting for WhatsApp to be ready...');
  await whatsappService.waitUntilReady();
  console.log('✅ WhatsApp is ready');

  let demandes;
  
  if (demandeNumero) {
    // Get specific demande
    demandes = await prisma.demandeFourniture.findMany({
      where: { numero: demandeNumero },
      include: {
        user: true,
        chantier: true,
        items: true
      }
    });
  } else {
    // Get start and end of today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Find today's demandes
    demandes = await prisma.demandeFourniture.findMany({
      where: {
        dateDemande: {
          gte: today,
          lt: tomorrow
        }
      },
      include: {
        user: true,
        chantier: true,
        items: true
      }
    });
  }

  console.log(`📋 Found ${demandes.length} demandes`);

  if (demandes.length === 0) {
    console.log('No demandes found for today');
    process.exit(0);
  }

  // Get recipients
  const recipients = await prisma.whatsAppNotificationRecipient.findMany({
    where: {
      active: true,
      notifyFourniture: true,
    },
    select: { phone: true },
  });

  const numbers = recipients.map((r) => r.phone);
  console.log(`📱 Will send to ${numbers.length} recipients`);

  let successCount = 0;
  let failCount = 0;

  for (const demande of demandes) {
    console.log(`\n📤 Processing demande #${demande.numero}...`);
    
    try {
      // Generate PDF
      const pdfBuffer = await generateDemandeFourniturePDFBuffer(demande.id);
      const filename = `demande_fourniture_${demande.numero}.pdf`;
      
      // Create message
      const message = `Nouvelle commande créée par ${demande.user?.name || 'Unknown'}. Numéro de commande: ${demande.numero}. Date de création: ${demande.dateDemande.toLocaleDateString("fr-FR")}. Chantier: ${demande.chantier?.nom || 'Unknown'}.`;

      // Send to all recipients
      const results = await Promise.allSettled(
        numbers.map((number) =>
          whatsappService.sendMessage(number, message, {
            data: pdfBuffer,
            filename,
            mimetype: 'application/pdf',
          })
        )
      );

      const sent = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      
      console.log(`   ✅ Sent: ${sent}/${numbers.length}, Failed: ${failed}`);
      
      if (sent > 0) successCount++;
      else failCount++;
      
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
      failCount++;
    }
  }

  console.log(`\n📊 Summary: ${successCount} sent, ${failCount} failed`);
  process.exit(failCount > 0 ? 1 : 0);
}

sendTodayDemandes().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
