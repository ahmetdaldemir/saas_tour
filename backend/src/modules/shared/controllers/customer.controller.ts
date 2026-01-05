import { Response } from 'express';
import { CustomerService } from '../services/customer.service';
import { AuthenticatedRequest } from '../../auth/middleware/auth.middleware';
import { asyncHandler } from '../../../utils/errors';

export class CustomerController {
  static list = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // Get tenantId from authenticated user's token (security)
    const tenantId = req.auth?.tenantId;
    if (!tenantId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const customers = await CustomerService.list(tenantId);
    res.json(customers);
  });

  static getById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    // Get tenantId from authenticated user's token (security)
    const tenantId = req.auth?.tenantId;
    if (!tenantId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const customer = await CustomerService.getById(id, tenantId);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    res.json(customer);
  });

  static create = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // Get tenantId from authenticated user's token (security: prevent tenant spoofing)
    const tenantId = req.auth?.tenantId;
    if (!tenantId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Override tenantId from body to prevent security issues
    const customer = await CustomerService.create({
      ...req.body,
      tenantId, // Always use authenticated user's tenantId
    });
    res.status(201).json(customer);
  });

  static update = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    // Get tenantId from authenticated user's token (security)
    const tenantId = req.auth?.tenantId;
    if (!tenantId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const customer = await CustomerService.update(id, tenantId, req.body);
    res.json(customer);
  });

  static remove = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    // Get tenantId from authenticated user's token (security)
    const tenantId = req.auth?.tenantId;
    if (!tenantId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    await CustomerService.remove(id, tenantId);
    res.status(204).send();
  });

  static changePassword = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { newPassword } = req.body as { newPassword: string };
    
    // Get tenantId from authenticated user's token (security)
    const tenantId = req.auth?.tenantId;
    if (!tenantId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!newPassword) {
      return res.status(400).json({ message: 'New password is required' });
    }

    const customer = await CustomerService.changePassword(id, tenantId, newPassword);
    res.json({ message: 'Password changed successfully', customer });
  });
}

