import { Request, Response } from 'express';
import { CustomerService } from '../services/customer.service';
import { asyncHandler } from '../../../utils/errors';

export class CustomerController {
  static list = asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.query.tenantId as string;
    if (!tenantId) {
      return res.status(400).json({ message: 'tenantId query param required' });
    }

    const customers = await CustomerService.list(tenantId);
    res.json(customers);
  });

  static getById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const tenantId = req.query.tenantId as string;

    if (!tenantId) {
      return res.status(400).json({ message: 'tenantId query param required' });
    }

    const customer = await CustomerService.getById(id, tenantId);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    res.json(customer);
  });

  static create = asyncHandler(async (req: Request, res: Response) => {
    const customer = await CustomerService.create(req.body);
    res.status(201).json(customer);
  });

  static update = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const tenantId = req.body.tenantId || req.query.tenantId as string;

    if (!tenantId) {
      return res.status(400).json({ message: 'tenantId is required' });
    }

    const customer = await CustomerService.update(id, tenantId, req.body);
    res.json(customer);
  });

  static remove = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const tenantId = req.query.tenantId as string;

    if (!tenantId) {
      return res.status(400).json({ message: 'tenantId query param required' });
    }

    await CustomerService.remove(id, tenantId);
    res.status(204).send();
  });
}

