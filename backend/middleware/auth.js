const {
  requireAuth,
  requireAdmin,
  optionalAuth,
  isAdminEmail,
  ADMIN_EMAILS
} = require('./clerkAuth');

// Backward-compatible alias used across legacy routes.
const isAdmin = [requireAuth, requireAdmin];

// Legacy optional admin checker, now based on verified optional token auth.
const checkAdmin = [
  optionalAuth,
  async (req, res, next) => {
    try {
      req.isAdmin = Boolean(req.auth?.email && isAdminEmail(req.auth.email));
      if (req.isAdmin) {
        req.adminEmail = req.auth.email;
      }
      next();
    } catch (error) {
      req.isAdmin = false;
      next();
    }
  }
];

// Keep helper exports for existing imports without allowing runtime mutation of admin list.
const addAdminEmail = () => {
  console.warn('addAdminEmail is disabled. Configure admin access via DB role or ADMIN_EMAILS in clerkAuth.');
};

const removeAdminEmail = () => {
  console.warn('removeAdminEmail is disabled. Configure admin access via DB role or ADMIN_EMAILS in clerkAuth.');
};

module.exports = {
  isAdmin,
  checkAdmin,
  addAdminEmail,
  removeAdminEmail,
  isAdminEmail,
  ADMIN_EMAILS
};
