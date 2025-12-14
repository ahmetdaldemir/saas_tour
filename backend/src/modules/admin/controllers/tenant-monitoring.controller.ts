import { Request, Response } from 'express';
import { AppDataSource } from '../../../config/data-source';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { Reservation } from '../../shared/entities/reservation.entity';
import { Customer } from '../../shared/entities/customer.entity';
import { asyncHandler } from '../../../utils/errors';

export class TenantMonitoringController {
  /**
   * Tüm tenant'ları listele (aktivitelerle birlikte)
   */
  static listTenants = asyncHandler(async (req: Request, res: Response) => {
    const tenantRepo = AppDataSource.getRepository(Tenant);
    const reservationRepo = AppDataSource.getRepository(Reservation);
    const customerRepo = AppDataSource.getRepository(Customer);

    const tenants = await tenantRepo.find({
      order: { createdAt: 'DESC' },
    });

    // Her tenant için istatistikleri al
    const tenantsWithStats = await Promise.all(
      tenants.map(async (tenant) => {
        const [reservationCount, customerCount] = await Promise.all([
          reservationRepo.count({ where: { tenantId: tenant.id } }),
          customerRepo.count({ where: { tenantId: tenant.id } }),
        ]);

        // Son aktiviteler (son 5 rezervasyon)
        const recentReservations = await reservationRepo.find({
          where: { tenantId: tenant.id },
          order: { createdAt: 'DESC' },
          take: 5,
          relations: ['tour', 'tourSession'],
        });

        return {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
          category: tenant.category,
          isActive: tenant.isActive,
          defaultLanguage: tenant.defaultLanguage,
          supportEmail: tenant.supportEmail,
          createdAt: tenant.createdAt,
          updatedAt: tenant.updatedAt,
          stats: {
            reservations: reservationCount,
            customers: customerCount,
          },
          recentActivity: recentReservations.map(r => ({
            id: r.id,
            reference: r.reference,
            type: r.type,
            status: r.status,
            customerName: r.customerName,
            createdAt: r.createdAt,
          })),
        };
      })
    );

    res.json(tenantsWithStats);
  });

  /**
   * Tenant detaylarını getir
   */
  static getTenantDetails = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const tenantRepo = AppDataSource.getRepository(Tenant);
    const reservationRepo = AppDataSource.getRepository(Reservation);
    const customerRepo = AppDataSource.getRepository(Customer);

    const tenant = await tenantRepo.findOne({ where: { id } });

    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    // İstatistikler
    const [reservationCount, customerCount, recentReservations] = await Promise.all([
      reservationRepo.count({ where: { tenantId: tenant.id } }),
      customerRepo.count({ where: { tenantId: tenant.id } }),
      reservationRepo.find({
        where: { tenantId: tenant.id },
        order: { createdAt: 'DESC' },
        take: 20,
        relations: ['tour', 'tourSession'],
      }),
    ]);

    res.json({
      tenant,
      stats: {
        reservations: reservationCount,
        customers: customerCount,
      },
      recentReservations,
    });
  });

  /**
   * Tenant aktivite loglarını getir
   */
  static getTenantActivity = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;
    
    const reservationRepo = AppDataSource.getRepository(Reservation);
    const customerRepo = AppDataSource.getRepository(Customer);

    // Rezervasyon aktiviteleri
    const reservations = await reservationRepo.find({
      where: { tenantId: id },
      order: { updatedAt: 'DESC' },
      take: limit,
    });

    // Müşteri aktiviteleri (son eklenenler)
    const customers = await customerRepo.find({
      where: { tenantId: id },
      order: { createdAt: 'DESC' },
      take: Math.floor(limit / 2),
    });

    const activities = [
      ...reservations.map(r => ({
        type: 'reservation',
        action: r.status,
        entityId: r.id,
        entityName: r.reference,
        description: `Reservation ${r.reference} - ${r.customerName}`,
        timestamp: r.updatedAt,
      })),
      ...customers.map(c => ({
        type: 'customer',
        action: 'created',
        entityId: c.id,
        entityName: c.fullName,
        description: `New customer: ${c.fullName}`,
        timestamp: c.createdAt,
      })),
    ]
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);

    res.json({
      tenantId: id,
      activities,
      total: activities.length,
    });
  });
}

