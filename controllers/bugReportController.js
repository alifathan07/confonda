import prisma from "../db.js";
import fs from "fs";
import path from "path";
import multer from "multer";
import { whatsappService } from "../services/whatssapservice.js";

const BUG_REPORT_UPLOAD_DIR = "./uploads/bugs";
if (!fs.existsSync(BUG_REPORT_UPLOAD_DIR)) {
  fs.mkdirSync(BUG_REPORT_UPLOAD_DIR, { recursive: true });
}

const bugScreenshotStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, BUG_REPORT_UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, "bug-" + uniqueSuffix + ext);
  }
});

const bugScreenshotFilter = (req, file, cb) => {
  const allowedExts = [".jpg", ".jpeg", ".png", ".gif"];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Type de fichier non autorisé. Seuls JPG, JPEG, PNG et GIF sont acceptés."));
  }
};

export const uploadBugScreenshot = multer({
  storage: bugScreenshotStorage,
  fileFilter: bugScreenshotFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

/**
 * List all bug reports
 */
export const listBugReports = async (req, res) => {
  try {
    const bugReports = await prisma.bugReport.findMany({
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.render('dashboard/bug-reports/list', {
      bugReports,
      user: req.session.user
    });
  } catch (error) {
    console.error('Erreur listBugReports:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

/**
 * Show create bug report form
 */
export const createBugReportForm = async (req, res) => {
  try {
    res.render('dashboard/bug-reports/create', {
      user: req.session.user,
      currentUrl: req.query.url || ''
    });
  } catch (error) {
    console.error('Erreur createBugReportForm:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

/**
 * Create new bug report
 */
export const createBugReport = async (req, res) => {
  try {
    const { title, description, category, priority, url } = req.body;
    const user = req.session.user;

    if (!title || !description) {
      return res.status(400).json({ success: false, error: 'Titre et description obligatoires' });
    }

    const bugReport = await prisma.bugReport.create({
      data: {
        title,
        description,
        category: category || 'autre',
        priority: priority || 'moyenne',
        status: 'en_cours',
        url: url || null,
        userId: user?.id || null,
        userName: user?.name || 'Anonyme',
        userEmail: user?.email || null,
        screenshot: req.file ? req.file.path : null
      }
    });

    // Create popup for the user who reported the bug
    if (user?.id) {
      await prisma.popup.create({
        data: {
          title: 'Bug signalé',
          message: `Merci pour votre signalement, nous traitons votre bug "${title}".`,
          type: 'info',
          status: 'active',
          targetUsers: String(user.id),
          displayMode: 'once_only',
          createdBy: user.id,
          startDate: new Date()
        }
      });
    }

    // Send response immediately - don't wait for WhatsApp
    res.json({ success: true, bugReport, message: 'Bug reporté avec succès', redirect: '/bug-reports' });

    // Send WhatsApp notification asynchronously (fire-and-forget)
    // This runs in background and doesn't block the response
    (async () => {
      try {
        const devPhoneNumber = '0698361022';
        const priorityEmoji = {
          'critique': '🚨',
          'haute': '⚠️',
          'moyenne': 'ℹ️',
          'basse': '📝'
        };
        
        const categoryLabel = {
          'ui': 'Interface',
          'fonctionnalite': 'Fonctionnalité',
          'performance': 'Performance',
          'securite': 'Sécurité',
          'autre': 'Autre'
        };

        const message = `🐛 *NOUVEAU BUG SIGNALÉ*\n\n` +
          `${priorityEmoji[priority] || 'ℹ️'} *Priorité:* ${priority?.toUpperCase() || 'MOYENNE'}\n` +
          `📁 *Catégorie:* ${categoryLabel[category] || 'Autre'}\n` +
          `📝 *Titre:* ${title}\n` +
          `👤 *Signalé par:* ${user?.name || 'Anonyme'}\n` +
          `📅 *Date:* ${new Date().toLocaleString('fr-FR')}\n\n` +
          `📄 *Description:*\n${description?.substring(0, 200)}${description?.length > 200 ? '...' : ''}\n\n` +
          `🔗 *Voir le bug:* http://localhost:3000/bug-reports/${bugReport.id}/edit`;

        await whatsappService.sendMessage(devPhoneNumber, message);
        console.log('WhatsApp notification sent to developer');
      } catch (waError) {
        console.error('Failed to send WhatsApp notification:', waError);
      }
    })();

    // Send Telegram notification asynchronously
    (async () => {
      try {
        const priorityEmoji = {
          'critique': 'CRITIQUE',
          'haute': 'HAUTE',
          'moyenne': 'MOYENNE',
          'basse': 'BASSE'
        };
        
        const categoryLabel = {
          'ui': 'Interface',
          'fonctionnalite': 'Fonctionnalité',
          'performance': 'Performance',
          'securite': 'Sécurité',
          'autre': 'Autre'
        };

        const telegramMessage = `Ali Sir, votre client a un nouveau bug:\n\n` +
          `Priorité: ${priorityEmoji[priority] || 'MOYENNE'}\n` +
          `Catégorie: ${categoryLabel[category] || 'Autre'}\n` +
          `Titre: ${title}\n` +
          `Signalé par: ${user?.name || 'Anonyme'}\n` +
          `Date: ${new Date().toLocaleString('fr-FR')}\n\n` +
          `Description:\n${description}`;

        await fetch('https://api.telegram.org/bot8798805211:AAElHM6qfreLXdTqvIKECcax-CSoDiH2X7A/sendMessage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: 6027161132,
            text: telegramMessage,
            parse_mode: 'HTML'
          })
        });
        console.log('Telegram notification sent');
      } catch (tgError) {
        console.error('Failed to send Telegram notification:', tgError);
      }
    })();
  } catch (error) {
    console.error('Erreur createBugReport:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

/**
 * Show edit bug report form
 */
export const editBugReportForm = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (!id || isNaN(id)) {
      return res.status(400).json({ success: false, error: 'ID invalide' });
    }

    const bugReport = await prisma.bugReport.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    if (!bugReport) {
      return res.status(404).json({ success: false, error: 'Bug report non trouvé' });
    }

    res.render('dashboard/bug-reports/edit', {
      bugReport,
      user: req.session.user
    });
  } catch (error) {
    console.error('Erreur editBugReportForm:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

/**
 * Update bug report
 */
export const updateBugReport = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { title, description, category, priority, status, resolution } = req.body;

    if (!id || isNaN(id)) {
      return res.status(400).json({ success: false, error: 'ID invalide' });
    }

    const updateData = {
      title,
      description,
      category,
      priority,
      status,
      resolution,
      updatedAt: new Date()
    };

    // If status changed to resolved, set resolvedAt
    if (status === 'resolu' || status === 'ferme') {
      updateData.resolvedAt = new Date();
    } else {
      updateData.resolvedAt = null;
    }

    const bugReport = await prisma.bugReport.update({
      where: { id },
      data: updateData
    });

    // Create popup for the reporter when bug is resolved
    if (status === 'resolu' || status === 'ferme') {
      const originalBug = await prisma.bugReport.findUnique({
        where: { id },
        include: { user: true }
      });
      
      if (originalBug && originalBug.userId) {
        await prisma.popup.create({
          data: {
            title: 'Bug résolu',
            message: `Votre Problem  "${originalBug.title}" a été résolu.`,
            type: 'success',
            status: 'active',
            targetUsers: String(originalBug.userId),
            displayMode: 'once_only',
            createdBy: req.session.user.id,
            startDate: new Date()
          }
        });
      }
    }

    res.json({ success: true, bugReport, message: 'Bug mis à jour avec succès' });
  } catch (error) {
    console.error('Erreur updateBugReport:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

/**
 * Delete bug report
 * Developer can delete any bug
 * Users can only delete their own bugs
 */
export const deleteBugReport = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const user = req.session.user;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({ success: false, error: 'ID invalide' });
    }

    // Get bug report
    const bugReport = await prisma.bugReport.findUnique({
      where: { id }
    });

    if (!bugReport) {
      return res.status(404).json({ success: false, error: 'Bug non trouvé' });
    }

    // Check permissions: developer can delete any, others can only delete their own
    const isDeveloper = user?.role === 'developer';
    const isOwner = bugReport.userId === user?.id;
    
    if (!isDeveloper && !isOwner) {
      return res.status(403).json({ success: false, error: 'Accès refusé. Vous ne pouvez supprimer que vos propres bugs.' });
    }

    // Delete screenshot if exists
    if (bugReport?.screenshot && fs.existsSync(bugReport.screenshot)) {
      fs.unlinkSync(bugReport.screenshot);
    }

    await prisma.bugReport.delete({
      where: { id }
    });

    res.json({ success: true, message: 'Bug supprimé avec succès' });
  } catch (error) {
    console.error('Erreur deleteBugReport:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

/**
 * Get bug report by ID (API)
 */
export const getBugReport = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (!id || isNaN(id)) {
      return res.status(400).json({ success: false, error: 'ID invalide' });
    }

    const bugReport = await prisma.bugReport.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    if (!bugReport) {
      return res.status(404).json({ success: false, error: 'Bug report non trouvé' });
    }

    res.json({ success: true, bugReport });
  } catch (error) {
    console.error('Erreur getBugReport:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

/**
 * Get bug statistics
 */
export const getBugStats = async (req, res) => {
  try {
    const stats = await prisma.bugReport.groupBy({
      by: ['status'],
      _count: {
        status: true
      }
    });

    const priorityStats = await prisma.bugReport.groupBy({
      by: ['priority'],
      _count: {
        priority: true
      }
    });

    res.json({ 
      success: true, 
      statusStats: stats,
      priorityStats: priorityStats
    });
  } catch (error) {
    console.error('Erreur getBugStats:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};
