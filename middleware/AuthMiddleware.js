export class AuthMiddleware {
  constructor(usersDb) {
    this.usersDb = usersDb;
  }

  authenticate() {
    return async (req, res, next) => {
      try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return res.status(401).json({ error: 'Authentication required' });
        }

        const token = authHeader.substring(7);
        const result = await this.usersDb.get(token);
        
        if (!result || !result.isActive) {
          return res.status(401).json({ error: 'Invalid or inactive user' });
        }

        req.user = result;
        next();
      } catch (error) {
        console.error('Auth error:', error);
        return res.status(401).json({ error: 'Authentication failed' });
      }
    };
  }

  authorize(roles = []) {
    return (req, res, next) => {
      if (!req.user) return res.status(401).json({ error: 'Authentication required' });
      if (roles.length === 0 || roles.includes(req.user.role)) {
        return next();
      } else {
        return res.status(403).json({ error: 'Access denied' });
      }
    };
  }

  requirePermission(permission) {
    return (req, res, next) => {
      if (!req.user) return res.status(401).json({ error: 'Authentication required' });
      if (req.user.role === 'admin' || (req.user.permissions?.includes(permission))) {
        return next();
      } else {
        return res.status(403).json({ error: `Missing permission: ${permission}` });
      }
    };
  }

  isolateCustomerData() {
    return (req, res, next) => {
      if (!req.user) return res.status(401).json({ error: 'Authentication required' });
      if (req.user.role === 'admin') return next();

      if (req.user.role === 'customer') {
        req.customerFilter = { customerId: req.user._id };
      }

      if (req.user.role === 'content_creator') {
        req.creatorFilter = { creatorId: req.user._id };
      }

      next();
    };
  }
}
