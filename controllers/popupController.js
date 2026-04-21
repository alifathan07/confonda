import prisma from "../db.js";

/**
 * List all popups (for developers)
 */
export const listPopups = async (req, res) => {
  try {
    const popups = await prisma.popup.findMany({
      include: {
        creator: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Get all users for target selection
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, popupEnabled: true },
      orderBy: { name: 'asc' }
    });

    res.render('dashboard/popups/list', {
      popups,
      users,
      user: req.session.user
    });
  } catch (error) {
    console.error('Erreur listPopups:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

/**
 * Show create popup form
 */
export const createPopupForm = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true },
      orderBy: { name: 'asc' }
    });

    res.render('dashboard/popups/create', {
      users,
      user: req.session.user
    });
  } catch (error) {
    console.error('Erreur createPopupForm:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

/**
 * Create new popup
 */
export const createPopup = async (req, res) => {
  try {
    const { title, message, type, targetUsers, targetRoles, showOnce, startDate, endDate, displayMode } = req.body;
    const creatorId = req.session.user.id;

    if (!title || !message) {
      return res.status(400).json({ success: false, error: 'Titre et message obligatoires' });
    }

    // Delete all existing active popups first (only one popup at a time)
   
    const popup = await prisma.popup.create({
      data: {
        title,
        message,
        type: type || 'info',
        status: 'active',
        targetUsers: null,
        targetRoles: null,
        createdBy: creatorId,
        displayMode: 'always',
        showOnce: false,
        startDate: new Date(),
        endDate: null,
        dismissedBy: ''
      }
    });

    res.json({ success: true, popup, message: 'Popup créé avec succès' });
  } catch (error) {
    console.error('Erreur createPopup:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

/**
 * Show edit popup form
 */
export const editPopupForm = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (!id || isNaN(id)) {
      return res.status(400).json({ success: false, error: 'ID invalide' });
    }

    const popup = await prisma.popup.findUnique({
      where: { id },
      include: {
        creator: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    if (!popup) {
      return res.status(404).json({ success: false, error: 'Popup non trouvé' });
    }

    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true },
      orderBy: { name: 'asc' }
    });

    res.render('dashboard/popups/edit', {
      popup,
      users,
      user: req.session.user
    });
  } catch (error) {
    console.error('Erreur editPopupForm:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

/**
 * Update popup
 */
export const updatePopup = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { title, message, type, status, targetUsers, targetRoles, showOnce, startDate, endDate, displayMode } = req.body;

    if (!id || isNaN(id)) {
      return res.status(400).json({ success: false, error: 'ID invalide' });
    }

    const popup = await prisma.popup.update({
      where: { id },
      data: {
        title,
        message,
        type,
        status,
        targetUsers: targetUsers || null,
        targetRoles: targetRoles || null,
        displayMode: displayMode || 'after_login',
        showOnce: showOnce === 'true' || showOnce === true,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : null,
        updatedAt: new Date()
      }
    });

    res.json({ success: true, popup, message: 'Popup mis à jour avec succès' });
  } catch (error) {
    console.error('Erreur updatePopup:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

/**
 * Delete popup
 */
export const deletePopup = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (!id || isNaN(id)) {
      return res.status(400).json({ success: false, error: 'ID invalide' });
    }

    await prisma.popup.delete({
      where: { id }
    });

    res.json({ success: true, message: 'Popup supprimé avec succès' });
  } catch (error) {
    console.error('Erreur deletePopup:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

/**
 * Get active popups for current user
 */
export const getActivePopupsForUser = async (req, res) => {
  try {
    const userId = req.session.user?.id;
    const userRole = req.session.user?.role;
    const dismissedPopups = req.session.dismissedPopups || [];

    if (!userId) {
      return res.json({ success: true, popups: [] });
    }

    const now = new Date();

    // Get all active popups that match user's criteria
    const popups = await prisma.popup.findMany({
      where: {
        status: 'active',
        startDate: { lte: now },
        OR: [
          { endDate: null },
          { endDate: { gte: now } }
        ]
      }
    });

    // Filter popups based on target users/roles and dismissed status
    const filteredPopups = popups.filter(popup => {
      // Check if user already dismissed this popup
      const dismissedBy = popup.dismissedBy ? popup.dismissedBy.split(',').map(id => parseInt(id)) : [];
      if (dismissedBy.includes(userId)) return false;

      // Check if already shown in this session (for showOnce)
      if (popup.showOnce && dismissedPopups.includes(popup.id)) return false;

      // Check target users
      if (popup.targetUsers) {
        const targetUserIds = popup.targetUsers.split(',').map(id => parseInt(id));
        if (!targetUserIds.includes(userId)) return false;
      }

      // Check target roles
      if (popup.targetRoles) {
        const targetRoleList = popup.targetRoles.split(',');
        if (!targetRoleList.includes(userRole)) return false;
      }

      return true;
    });

    res.json({ success: true, popups: filteredPopups });
  } catch (error) {
    console.error('Erreur getActivePopupsForUser:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

/**
 * Dismiss popup for current user
 */
export const dismissPopup = async (req, res) => {
  try {
    const popupId = parseInt(req.params.id);
    const userId = req.session.user?.id;

    if (!popupId || !userId) {
      return res.status(400).json({ success: false, error: 'Paramètres invalides' });
    }

    const popup = await prisma.popup.findUnique({
      where: { id: popupId }
    });

    if (!popup) {
      return res.status(404).json({ success: false, error: 'Popup non trouvé' });
    }

    // Add user to dismissed list
    const dismissedBy = popup.dismissedBy ? popup.dismissedBy.split(',').map(id => parseInt(id)) : [];
    if (!dismissedBy.includes(userId)) {
      dismissedBy.push(userId);
    }

    await prisma.popup.update({
      where: { id: popupId },
      data: { dismissedBy: dismissedBy.join(',') }
    });

    // Track in session for showOnce popups
    if (!req.session.dismissedPopups) {
      req.session.dismissedPopups = [];
    }
    if (!req.session.dismissedPopups.includes(popupId)) {
      req.session.dismissedPopups.push(popupId);
    }

    res.json({ success: true, message: 'Popup dismissé' });
  } catch (error) {
    console.error('Erreur dismissPopup:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

/**
 * Toggle user popup enabled status
 */
export const toggleUserPopup = async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const { enabled } = req.body;

    if (!userId || isNaN(userId)) {
      return res.status(400).json({ success: false, error: 'ID invalide' });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { popupEnabled: enabled }
    });

    res.json({ success: true, user, message: `Popups ${enabled ? 'activés' : 'désactivés'} pour ${user.name}` });
  } catch (error) {
    console.error('Erreur toggleUserPopup:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

/**
 * Get popup statistics
 */
export const getPopupStats = async (req, res) => {
  try {
    const stats = await prisma.popup.groupBy({
      by: ['status'],
      _count: { status: true }
    });

    const typeStats = await prisma.popup.groupBy({
      by: ['type'],
      _count: { type: true }
    });

    res.json({ success: true, statusStats: stats, typeStats });
  } catch (error) {
    console.error('Erreur getPopupStats:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};
