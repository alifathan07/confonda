import { sendEmail } from "./services/emailservice.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logoPath = path.join(__dirname, "public/img/logo-4.png");

import prisma from "./db.js";
import { getpdfBuffer } from "./services/pdfbcService.js";

async function test() {
  console.log("Fetching BC...");
  const bc = await prisma.bondeCommande.findFirst({
    include: {
        fournisseur: { select: { id: true, name: true, email: true } },
        commandesItems: {
          include: {
            BondeCommandeChantierItem: { include: { chantier: { select: { id: true, nom: true } } } }
          }
        },
        chantier: { select: { id: true, nom: true } },
        bondeLivraisonLinks: {
          include: {
            bondeLivraison: {
              include: { items: true }
            }
          }
        }
      }
  });
  if (!bc) {
    console.log("No BC found");
    return;
  }
  
  console.log("Generating PDF...");
  const pdfBuffer = await getpdfBuffer(bc, { protocol: 'http', get: () => 'localhost:3000' });
  
  console.log("Sending email...");
  const result = await sendEmail({
    to: "confonda@gmail.com",
    subject: "Test real BC email",
    text: "Here is the real BC PDF.",
    html: "<p>Real BC attached.</p>",
    attachments: [
        {
          filename: `bonCommande_${(bc.numero || '').replace(/\//g, '-')}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        },
        {
          filename: 'logo-4.png',
          path: logoPath,
          cid: 'signature-logo'
        }
    ]
  });
  console.log("Result:", result);
}

test();
