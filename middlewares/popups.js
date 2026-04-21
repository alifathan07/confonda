import prisma from '../db.js';
export const checkPopups = async (req, res, next) => {
  const user = req.session.user;
  
  if (!user || user.popupEnabled === false) {
    return next();
  }

  try {
    const now = new Date();
    const dismissedPopups = req.session.dismissedPopups || [];
    const afterLoginShown = req.session.afterLoginShown || [];
    const afterEveryActionShown = req.session.afterEveryActionShown || [];

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

    const activePopups = popups.filter(popup => {
      const dismissedBy = popup.dismissedBy ? popup.dismissedBy.split(',').map(id => parseInt(id)) : [];
      
      // Check target users
      if (popup.targetUsers) {
        const targetUserIds = popup.targetUsers.split(',').map(id => parseInt(id));
        if (!targetUserIds.includes(user.id)) return false;
      }

      // Check target roles
      if (popup.targetRoles) {
        const targetRoleList = popup.targetRoles.split(',');
        if (!targetRoleList.includes(user.role)) return false;
      }

      // Handle displayMode
      switch (popup.displayMode) {
        case 'once_only':
          // Show once per user permanently (stored in DB)
          if (dismissedBy.includes(user.id)) return false;
          break;
          
        case 'after_login':
          // Show once per session after login - only on dashboard
          if (req.path !== '/dashboard') return false;
          if (afterLoginShown.includes(popup.id)) return false;
          if (!req.session.afterLoginShown) req.session.afterLoginShown = [];
          if (!req.session.afterLoginShown.includes(popup.id)) {
            req.session.afterLoginShown.push(popup.id);
          }
          break;
          
        case 'always':
          // Always show unless dismissed this session
          if (dismissedPopups.includes(popup.id)) return false;
          break;
          
        case 'after_every_action':
          // Show on every page load until dismissed in DB
          if (dismissedBy.includes(user.id)) return false;
          break;
          
        default:
          if (popup.showOnce && dismissedPopups.includes(popup.id)) return false;
      }

      return true;
    });

    res.locals.activePopups = activePopups;
    res.locals.popupDismissUrl = '/api/popups';

    console.log('=== POPUP DEBUG ===');
    console.log('User ID:', user?.id);
    console.log('Total popups in DB:', popups.length);
    console.log('Popups after filtering:', activePopups.map(p => ({id: p.id, mode: p.displayMode, target: p.targetUsers})));
    console.log('===================');
    
  } catch (error) {
    console.error('Error checking popups:', error);
  }

  next();
};
