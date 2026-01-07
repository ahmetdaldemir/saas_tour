import { Response } from 'express';
import { CustomerAuthService } from '../services/customer-auth.service';
import { TenantRequest } from '../../../middleware/tenant.middleware';
import { CustomerAuthenticatedRequest } from '../middleware/customer-auth.middleware';

export class CustomerAuthController {
  /**
   * Customer Login
   * POST /customers/auth/login
   * Body: { email: string, password: string } or { idNumber: string, password: string }
   */
  static async login(req: TenantRequest, res: Response) {
    try {
      const { email, idNumber, password } = req.body;

      if (!password) {
        return res.status(400).json({ 
          success: false,
          message: 'Password is required' 
        });
      }

      if (!email && !idNumber) {
        return res.status(400).json({ 
          success: false,
          message: 'Email or ID number is required' 
        });
      }

      // Tenant ID from subdomain or body (for mobile apps)
      const tenantId = req.tenant?.id || req.body.tenantId;
      if (!tenantId) {
        return res.status(400).json({ 
          success: false,
          message: 'Tenant not found. Please access via tenant subdomain.' 
        });
      }

      const result = await CustomerAuthService.login({
        tenantId,
        email,
        idNumber,
        password,
      });

      return res.json({
        success: true,
        data: {
          token: result.token,
          customer: {
            id: result.customer.id,
            firstName: result.customer.firstName,
            lastName: result.customer.lastName,
            fullName: result.customer.fullName,
            email: result.customer.email,
            mobilePhone: result.customer.mobilePhone,
            country: result.customer.country,
            languageId: result.customer.languageId,
            isActive: result.customer.isActive,
            tenantId: result.customer.tenantId,
          },
          tenant: result.tenant,
        },
      });
    } catch (error) {
      return res.status(401).json({ 
        success: false,
        message: (error as Error).message 
      });
    }
  }

  /**
   * Customer Profile (Me)
   * GET /customers/auth/me
   * Headers: Authorization: Bearer <token>
   */
  static async me(req: CustomerAuthenticatedRequest, res: Response) {
    try {
      if (!req.customerAuth) {
        return res.status(401).json({ 
          success: false,
          message: 'Unauthorized' 
        });
      }

      const profile = await CustomerAuthService.getProfile(
        req.customerAuth.customerId,
        req.customerAuth.tenantId
      );

      return res.json({
        success: true,
        data: {
          customer: {
            id: profile.customer.id,
            firstName: profile.customer.firstName,
            lastName: profile.customer.lastName,
            fullName: profile.customer.fullName,
            email: profile.customer.email,
            mobilePhone: profile.customer.mobilePhone,
            homePhone: profile.customer.homePhone,
            country: profile.customer.country,
            birthDate: profile.customer.birthDate,
            gender: profile.customer.gender,
            languageId: profile.customer.languageId,
            homeAddress: profile.customer.homeAddress,
            idType: profile.customer.idType,
            idNumber: profile.customer.idNumber,
            licenseNumber: profile.customer.licenseNumber,
            licenseClass: profile.customer.licenseClass,
            isActive: profile.customer.isActive,
            tenantId: profile.customer.tenantId,
          },
          tenant: profile.tenant,
          wallet: profile.wallet,
        },
      });
    } catch (error) {
      return res.status(400).json({ 
        success: false,
        message: (error as Error).message 
      });
    }
  }

  /**
   * Customer Reservations
   * GET /customers/auth/reservations
   * Headers: Authorization: Bearer <token>
   */
  static async myReservations(req: CustomerAuthenticatedRequest, res: Response) {
    try {
      if (!req.customerAuth) {
        return res.status(401).json({ 
          success: false,
          message: 'Unauthorized' 
        });
      }

      const reservations = await CustomerAuthService.getCustomerReservations(
        req.customerAuth.customerId,
        req.customerAuth.tenantId
      );

      return res.json({
        success: true,
        data: reservations,
      });
    } catch (error) {
      return res.status(400).json({ 
        success: false,
        message: (error as Error).message 
      });
    }
  }

  /**
   * Customer Change Password
   * POST /customers/auth/change-password
   * Headers: Authorization: Bearer <token>
   * Body: { currentPassword: string, newPassword: string }
   */
  static async changePassword(req: CustomerAuthenticatedRequest, res: Response) {
    try {
      if (!req.customerAuth) {
        return res.status(401).json({ 
          success: false,
          message: 'Unauthorized' 
        });
      }

      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ 
          success: false,
          message: 'Current password and new password are required' 
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ 
          success: false,
          message: 'New password must be at least 6 characters' 
        });
      }

      await CustomerAuthService.changePassword(
        req.customerAuth.customerId,
        req.customerAuth.tenantId,
        currentPassword,
        newPassword
      );

      return res.json({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (error) {
      return res.status(400).json({ 
        success: false,
        message: (error as Error).message 
      });
    }
  }

  /**
   * Customer Logout
   * POST /customers/auth/logout
   * Headers: Authorization: Bearer <token>
   */
  static async logout(req: CustomerAuthenticatedRequest, res: Response) {
    try {
      // Logout is handled client-side by removing the token
      // This endpoint can be used for server-side session invalidation if needed
      return res.json({ 
        success: true, 
        message: 'Logged out successfully' 
      });
    } catch (error) {
      return res.status(400).json({ 
        success: false,
        message: (error as Error).message 
      });
    }
  }
}

