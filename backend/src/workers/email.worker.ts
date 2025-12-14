import { QueueService, EmailJob } from '../services/queue.service';
import { sendCustomerWelcomeEmailDirect } from '../services/customer-email.service';
import { sendReservationEmail } from '../services/reservation-email.service';
import { EmailTemplateType } from '../modules/shared/entities/email-template.entity';
import { AppDataSource } from '../config/data-source';
import { Customer } from '../modules/shared/entities/customer.entity';
import { Reservation } from '../modules/shared/entities/reservation.entity';

/**
 * Email job'larını işleyen worker
 */
export class EmailWorker {
  /**
   * Worker'ı başlat
   */
  static async start(): Promise<void> {
    await QueueService.connect();
    // Arrow function kullanarak this bağlamını koruyoruz
    await QueueService.consumeEmailJobs((job) => EmailWorker.processEmailJob(job));
    console.log('📧 Email worker started');
  }

  /**
   * Email job'unu işle
   */
  private static async processEmailJob(job: EmailJob): Promise<void> {
    console.log(`Processing email job: ${job.type} for ${job.data.email}`);

    try {
      switch (job.type) {
        case 'customer_welcome':
          await EmailWorker.handleCustomerWelcome(job);
          break;

        case 'reservation_confirmation':
          await EmailWorker.handleReservationEmail(job, EmailTemplateType.RESERVATION_CONFIRMATION);
          break;

        case 'reservation_cancelled':
          await EmailWorker.handleReservationEmail(job, EmailTemplateType.RESERVATION_CANCELLED);
          break;

        case 'reservation_completed':
          await EmailWorker.handleReservationEmail(job, EmailTemplateType.RESERVATION_COMPLETED);
          break;

        case 'survey_invitation':
          // Survey email logic buraya eklenecek
          console.log('Survey invitation email not yet implemented in worker');
          break;

        default:
          console.warn(`Unknown email job type: ${job.type}`);
      }

      console.log(`✅ Email job completed: ${job.type} for ${job.data.email}`);
    } catch (error) {
      console.error(`❌ Error processing email job ${job.type}:`, error);
      throw error; // Worker'da nack ile requeue yapılacak
    }
  }

  /**
   * Müşteri hoş geldin email'i gönder
   */
  private static async handleCustomerWelcome(job: EmailJob): Promise<void> {
    if (!job.data.customerId) {
      throw new Error('Customer ID is required for welcome email');
    }

    const customerRepo = AppDataSource.getRepository(Customer);
    const customer = await customerRepo.findOne({
      where: { id: job.data.customerId, tenantId: job.tenantId },
    });

    if (!customer) {
      throw new Error(`Customer not found: ${job.data.customerId}`);
    }

    // Şifre bilgisi job data'sında olmalı
    const plainPassword = job.data.password || job.data.idNumber || '';

    // Worker içinde direkt gönderme fonksiyonunu kullan (kuyruğa eklemeden)
    await sendCustomerWelcomeEmailDirect(customer, plainPassword);
  }

  /**
   * Rezervasyon email'i gönder
   */
  private static async handleReservationEmail(
    job: EmailJob,
    templateType: EmailTemplateType
  ): Promise<void> {
    if (!job.data.reservationId) {
      throw new Error('Reservation ID is required for reservation email');
    }

    const reservationRepo = AppDataSource.getRepository(Reservation);
    const reservation = await reservationRepo.findOne({
      where: { id: job.data.reservationId, tenantId: job.tenantId },
    });

    if (!reservation) {
      throw new Error(`Reservation not found: ${job.data.reservationId}`);
    }

    await sendReservationEmail(reservation, templateType);
  }
}

