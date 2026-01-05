import { Router } from 'express';
import { CouponController } from '../controllers/coupon.controller';
import { authenticate } from '../../auth/middleware/auth.middleware';
import { authorize } from '../../auth/middleware/authorize.middleware';
import { Permission } from '../../auth/permissions';
import { AuthenticatedRequest } from '../../auth/middleware/auth.middleware';
const router = Router();

// Simple rate limiter for coupon validation (public endpoint)
// Note: For production, consider using express-rate-limit package: npm install express-rate-limit
const createRateLimiter = (windowMs: number, max: number) => {
  const requests = new Map<string, { count: number; resetTime: number }>();
  
  return (req: any, res: any, next: any) => {
    const key = req.ip || req.connection?.remoteAddress || req.headers['x-forwarded-for'] || 'unknown';
    const now = Date.now();
    const record = requests.get(key);

    if (!record || now > record.resetTime) {
      requests.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (record.count >= max) {
      return res.status(429).json({
        success: false,
        message: 'Too many coupon validation requests, please try again later.',
      });
    }

    record.count++;
    next();
  };
};

const validateRateLimiter = createRateLimiter(15 * 60 * 1000, 20); // 20 requests per 15 minutes

// Public endpoints (no auth required, but tenantId must be provided)
router.post('/validate', validateRateLimiter, (req, res, next) =>
  CouponController.validate(req as AuthenticatedRequest, res).catch(next)
);

router.post('/redeem', validateRateLimiter, (req, res, next) =>
  CouponController.redeem(req as AuthenticatedRequest, res).catch(next)
);

// Admin endpoints (require authentication)
router.use(authenticate);

// List coupons
router.get('/', authorize(Permission.CUSTOMER_VIEW), (req, res, next) =>
  CouponController.list(req as AuthenticatedRequest, res).catch(next)
);

// Create coupon
router.post('/', authorize(Permission.CUSTOMER_UPDATE), (req, res, next) =>
  CouponController.create(req as AuthenticatedRequest, res).catch(next)
);

// Get coupon by code
router.get('/:code', authorize(Permission.CUSTOMER_VIEW), (req, res, next) =>
  CouponController.getByCode(req as AuthenticatedRequest, res).catch(next)
);

export default router;

