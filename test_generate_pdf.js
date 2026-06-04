import fs from 'fs';
import path from 'path';
import prisma from './db.js';
import * as ctrl from './controllers/justifecaisseController.js';

(async () => {
  try {
    const userId = 2;
    const justif = await prisma.justifCaisse.findFirst({ where: { userId }, orderBy: [{ id: 'desc' }] });
    if (!justif) {
      console.error('No justif found for user', userId);
      process.exit(1);
    }

    const outDir = path.join(process.cwd(), 'tmp');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);
    const outPath = path.join(outDir, `Justif_${justif.id}.pdf`);

    const out = fs.createWriteStream(outPath);
    // Provide setHeader to satisfy controller
    out.setHeader = () => {};

    const req = { params: { id: String(justif.id) }, session: { user: { id: userId, name: `user${userId}`, role: 'user' } } };

    const finished = new Promise((resolve, reject) => {
      out.on('finish', resolve);
      out.on('error', reject);
    });

    // Call controller (it will pipe PDF to our stream)
    await ctrl.generateJustifCaissePDF(req, out);

    // Wait for write stream to finish
    await finished;

    console.log('PDF written to', outPath);
    process.exit(0);
  } catch (e) {
    console.error('Test failed:', e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
