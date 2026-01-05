import { Repository } from 'typeorm';
import { AppDataSource } from '../../../../config/data-source';
import { ReservationInvoice, InvoiceStatus } from '../../entities/reservation-invoice.entity';
import { Reservation } from '../../entities/reservation.entity';
import { TenantSettingsService } from '../tenant-settings.service';
import { IntegratorRegistry } from './integrator-registry';
import { Integrator, InvoiceDto, IssueInvoiceResult } from './integrator.interface';
import { ReservationInvoiceConfigService } from './invoice-config.service';

export interface IssueInvoiceInput {
  reservationId: string;
  tenantId: string;
  userId: string; // Admin user issuing the invoice
  forceReissue?: boolean; // If true, allows re-issuing even if invoice exists
}

export interface InvoiceCalculationResult {
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  total: number;
}

export class InvoiceService {
  private static invoiceRepo(): Repository<ReservationInvoice> {
    return AppDataSource.getRepository(ReservationInvoice);
  }

  private static reservationRepo(): Repository<Reservation> {
    return AppDataSource.getRepository(Reservation);
  }

  /**
   * Calculate invoice amounts based on reservation and tenant VAT rate
   */
  static async calculateInvoice(
    reservation: Reservation,
    vatRate: number
  ): Promise<InvoiceCalculationResult> {
    // Extract final price from reservation metadata
    // For rentacar: metadata.totalPrice is the final price after discounts
    // We treat this as VAT-exclusive subtotal
    const metadata = reservation.metadata || {};
    const finalPrice = Number(metadata.totalPrice || metadata.finalPrice || 0);

    const subtotal = finalPrice;
    const vatAmount = subtotal * (vatRate / 100);
    const total = subtotal + vatAmount;

    return {
      subtotal,
      vatRate,
      vatAmount,
      total,
    };
  }

  /**
   * Build invoice DTO from reservation
   */
  static async buildInvoiceDto(
    reservation: Reservation,
    calculation: InvoiceCalculationResult
  ): Promise<InvoiceDto> {
    const metadata = reservation.metadata || {};
    
    // Build invoice items
    const items = [
      {
        description: `Rezervasyon: ${reservation.reference}`,
        quantity: 1,
        unitPrice: calculation.subtotal,
        total: calculation.subtotal,
      },
    ];

    // Add additional items from metadata if available
    if (metadata.items && Array.isArray(metadata.items)) {
      items.push(...(metadata.items as any[]));
    }

    return {
      reservationId: reservation.id,
      tenantId: reservation.tenantId,
      customerName: reservation.customerName,
      customerEmail: reservation.customerEmail,
      customerTaxNumber: metadata.customerTaxNumber as string | undefined,
      customerAddress: metadata.customerAddress as string | undefined,
      subtotal: calculation.subtotal,
      vatRate: calculation.vatRate,
      vatAmount: calculation.vatAmount,
      total: calculation.total,
      currencyCode: 'TRY', // Default, can be extended
      items,
      metadata,
    };
  }

  /**
   * Issue an invoice for a reservation
   */
  static async issueInvoice(input: IssueInvoiceInput): Promise<ReservationInvoice> {
    const { reservationId, tenantId, userId, forceReissue = false } = input;

    // 1. Validate tenant isolation
    const reservation = await this.reservationRepo().findOne({
      where: { id: reservationId, tenantId },
    });

    if (!reservation) {
      throw new Error('Reservation not found or tenant mismatch');
    }

    // 2. Check for existing invoice (prevent duplicates)
    if (!forceReissue) {
      const existingInvoice = await this.invoiceRepo().findOne({
        where: { reservationId, tenantId },
      });

      if (existingInvoice) {
        throw new Error(`Invoice already exists for reservation ${reservationId}. Use forceReissue=true to re-issue.`);
      }
    }

    // 3. Get tenant invoice settings
    const invoiceSettings = await TenantSettingsService.getInvoiceSettings(tenantId);
    if (!invoiceSettings || !invoiceSettings.metadata) {
      throw new Error('Invoice settings not configured for tenant');
    }

    const metadata = invoiceSettings.metadata as Record<string, unknown>;
    const vatRate = Number(metadata.vatRate || 0);
    const integratorKey = (metadata.eInvoiceIntegrator as string) || 'none';

    // 4. Calculate invoice amounts
    const calculation = await this.calculateInvoice(reservation, vatRate);

    // 5. Build invoice DTO
    const invoiceDto = await this.buildInvoiceDto(reservation, calculation);

    // 6. Get integrator
    let integrator: Integrator | null = null;
    let result: IssueInvoiceResult;

    if (integratorKey === 'none') {
      // No integrator - create invoice as DRAFT
      result = {
        success: true,
        externalInvoiceId: undefined,
        pdfUrl: undefined,
      };
    } else {
      integrator = IntegratorRegistry.getIntegrator(integratorKey);
      if (!integrator) {
        throw new Error(`Integrator '${integratorKey}' not found`);
      }

      // 7. Get integrator config
      const config = await ReservationInvoiceConfigService.getConfig(tenantId, integratorKey);

      // 8. Issue invoice through integrator
      try {
        result = await integrator.issueInvoice(invoiceDto, config || undefined);
      } catch (error) {
        result = {
          success: false,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }

    // 9. Determine invoice status
    let status: InvoiceStatus;
    if (result.success) {
      status = integratorKey === 'none' ? InvoiceStatus.DRAFT : InvoiceStatus.SENT;
    } else {
      status = InvoiceStatus.FAILED;
    }

    // 10. Create or update invoice record
    const invoice = this.invoiceRepo().create({
      tenantId,
      reservationId,
      integratorKey,
      status,
      vatRateUsed: vatRate,
      subtotal: calculation.subtotal,
      vatAmount: calculation.vatAmount,
      total: calculation.total,
      externalInvoiceId: result.externalInvoiceId || null,
      externalReference: result.externalReference || null,
      requestPayload: invoiceDto as any,
      responsePayload: result.responseData || null,
      pdfUrl: result.pdfUrl || null,
      errorMessage: result.errorMessage || null,
    });

    return this.invoiceRepo().save(invoice);
  }

  /**
   * Get invoice for a reservation
   */
  static async getInvoiceByReservation(
    reservationId: string,
    tenantId: string
  ): Promise<ReservationInvoice | null> {
    return this.invoiceRepo().findOne({
      where: { reservationId, tenantId },
    });
  }

  /**
   * Get all invoices for a tenant
   */
  static async getInvoicesByTenant(
    tenantId: string,
    limit = 100,
    offset = 0
  ): Promise<{ invoices: ReservationInvoice[]; total: number }> {
    const [invoices, total] = await this.invoiceRepo().findAndCount({
      where: { tenantId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    return { invoices, total };
  }
}

