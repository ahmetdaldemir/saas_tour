import { Repository } from 'typeorm';
import { AppDataSource } from '../../../config/data-source';
import { Reservation, ReservationStatus } from '../entities/reservation.entity';
import { sendSurveyEmailForReservation } from '../../../services/survey-email.service';
import {
  sendReservationConfirmationEmail,
  sendReservationCancelledEmail,
  sendReservationCompletedEmail,
} from '../../../services/reservation-email.service';
import { EmailTemplateType } from '../entities/email-template.entity';
import { sendReservationEmail } from '../../../services/reservation-email.service';

export class ReservationService {
  private static repository(): Repository<Reservation> {
    return AppDataSource.getRepository(Reservation);
  }

  static async getById(id: string): Promise<Reservation | null> {
    return this.repository().findOne({
      where: { id },
      relations: ['tenant', 'tour', 'tourSession', 'customerLanguage'],
    });
  }

  static async updateStatus(
    id: string,
    status: ReservationStatus,
    checkIn?: Date | null,
    checkOut?: Date | null
  ): Promise<Reservation> {
    const repo = this.repository();
    const reservation = await repo.findOne({ where: { id }, relations: ['customerLanguage'] });

    if (!reservation) {
      throw new Error('Reservation not found');
    }

    const previousStatus = reservation.status;

    reservation.status = status;
    if (checkIn !== undefined) {
      reservation.checkIn = checkIn;
    }
    if (checkOut !== undefined) {
      reservation.checkOut = checkOut;
    }

    const updatedReservation = await repo.save(reservation);

    // Credit ParaPuan on reservation completion (idempotent)
    if (status === ReservationStatus.COMPLETED || status === ReservationStatus.CONFIRMED) {
      try {
        const { WalletService } = await import('./wallet.service');
        const { ParaPuanCalculatorService } = await import('./parapuan-calculator.service');
        const { WalletTransactionSource } = await import('../entities/wallet-transaction.entity');

        // Get reservation metadata for total price
        const metadata = reservation.metadata as any;
        const totalPrice = metadata?.totalPrice || 0;

        if (totalPrice > 0) {
          // Calculate points
          const points = await ParaPuanCalculatorService.calculatePoints(
            reservation.tenantId,
            totalPrice
          );

          if (points > 0) {
            // Get customer ID from metadata or reservation
            const customerId = metadata?.customerId || null;
            if (customerId) {
              // Credit points (idempotent via transactionId)
              const transactionId = `reservation_${reservation.id}_${status}`;
              await WalletService.creditPoints({
                tenantId: reservation.tenantId,
                customerId,
                amount: points,
                source: WalletTransactionSource.RESERVATION_COMPLETION,
                description: `Points earned from reservation ${reservation.reference}`,
                reservationId: reservation.id,
                transactionId, // Ensures idempotency
              });
            }
          }
        }
      } catch (error) {
        // Log error but don't fail the reservation update
        console.error('Error crediting ParaPuan:', error);
      }
    }

    // Status değişikliğine göre e-posta gönder (asenkron, ana işlemi bloklama)
    if (previousStatus !== status) {
      if (status === ReservationStatus.CONFIRMED) {
        sendReservationConfirmationEmail(updatedReservation).catch((error) => {
          console.error(`Error sending confirmation email for reservation ${updatedReservation.id}:`, error);
        });
      } else if (status === ReservationStatus.CANCELLED) {
        sendReservationCancelledEmail(updatedReservation).catch((error) => {
          console.error(`Error sending cancellation email for reservation ${updatedReservation.id}:`, error);
        });
      } else if (status === ReservationStatus.COMPLETED) {
        // Rezervasyon tamamlandı emaili gönder
        sendReservationCompletedEmail(updatedReservation).catch((error) => {
          console.error(`Error sending completion email for reservation ${updatedReservation.id}:`, error);
        });
        // Anket emaili gönder
        sendSurveyEmailForReservation(updatedReservation).catch((error) => {
          console.error(`Error sending survey email for reservation ${updatedReservation.id}:`, error);
        });
      }
    }

    return updatedReservation;
  }

  static async update(id: string, data: Partial<Reservation> & { recalculatePrice?: boolean }): Promise<Reservation> {
    const repo = this.repository();
    const reservation = await repo.findOne({ where: { id }, relations: ['customerLanguage'] });

    if (!reservation) {
      throw new Error('Reservation not found');
    }

    const previousStatus = reservation.status;
    const shouldRecalculatePrice = data.recalculatePrice && reservation.type === 'rentacar';

    // Eğer fiyat yeniden hesaplanacaksa, rentacar reservation service'i kullan
    if (shouldRecalculatePrice) {
      const { RentacarReservationService } = await import('../../rentacar/services/rentacar-reservation.service');
      return RentacarReservationService.updateReservation(id, reservation.tenantId, data);
    }

    // Normal güncelleme
    Object.assign(reservation, data);
    const updatedReservation = await repo.save(reservation);

    // Status değişikliğine göre e-posta gönder (asenkron, ana işlemi bloklama)
    if (data.status && previousStatus !== data.status) {
      if (data.status === ReservationStatus.CONFIRMED) {
        sendReservationConfirmationEmail(updatedReservation).catch((error) => {
          console.error(`Error sending confirmation email for reservation ${updatedReservation.id}:`, error);
        });
      } else if (data.status === ReservationStatus.CANCELLED) {
        sendReservationCancelledEmail(updatedReservation).catch((error) => {
          console.error(`Error sending cancellation email for reservation ${updatedReservation.id}:`, error);
        });
      } else if (data.status === ReservationStatus.COMPLETED) {
        // Rezervasyon tamamlandı emaili gönder
        sendReservationCompletedEmail(updatedReservation).catch((error) => {
          console.error(`Error sending completion email for reservation ${updatedReservation.id}:`, error);
        });
        // Anket emaili gönder
        sendSurveyEmailForReservation(updatedReservation).catch((error) => {
          console.error(`Error sending survey email for reservation ${updatedReservation.id}:`, error);
        });
      }
    }

    return updatedReservation;
  }

  static async list(tenantId: string): Promise<Reservation[]> {
    return this.repository().find({
      where: { tenantId },
      relations: ['tenant', 'tour', 'tourSession', 'customerLanguage'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Rezervasyona not ekle
   */
  static async addNote(id: string, note: string): Promise<Reservation> {
    const repo = this.repository();
    const reservation = await repo.findOne({ where: { id } });

    if (!reservation) {
      throw new Error('Reservation not found');
    }

    const existingNotes = reservation.notes || '';
    const timestamp = new Date().toISOString();
    const newNote = `[${timestamp}] ${note}\n`;
    reservation.notes = existingNotes + newNote;

    return repo.save(reservation);
  }

  /**
   * Araç çıkış işlemi (checkIn tarihini set et)
   */
  static async processCheckout(id: string): Promise<Reservation> {
    const repo = this.repository();
    const reservation = await repo.findOne({ where: { id }, relations: ['customerLanguage'] });

    if (!reservation) {
      throw new Error('Reservation not found');
    }

    if (reservation.type !== 'rentacar') {
      throw new Error('Checkout process is only available for rentacar reservations');
    }

    if (reservation.checkIn) {
      throw new Error('Vehicle already checked out');
    }

    reservation.checkIn = new Date();
    
    // Eğer status pending ise confirmed yap
    if (reservation.status === ReservationStatus.PENDING) {
      reservation.status = ReservationStatus.CONFIRMED;
    }

    const updatedReservation = await repo.save(reservation);

    // Onay emaili gönder (asenkron)
    if (reservation.status === ReservationStatus.CONFIRMED) {
      sendReservationConfirmationEmail(updatedReservation).catch((error) => {
        console.error(`Error sending confirmation email for reservation ${updatedReservation.id}:`, error);
      });
    }

    return updatedReservation;
  }

  /**
   * Araç dönüş işlemi (checkOut tarihini set et)
   */
  static async processCheckin(id: string): Promise<Reservation> {
    const repo = this.repository();
    const reservation = await repo.findOne({ where: { id }, relations: ['customerLanguage'] });

    if (!reservation) {
      throw new Error('Reservation not found');
    }

    if (reservation.type !== 'rentacar') {
      throw new Error('Checkin process is only available for rentacar reservations');
    }

    if (!reservation.checkIn) {
      throw new Error('Vehicle must be checked out before checkin');
    }

    if (reservation.checkOut) {
      throw new Error('Vehicle already checked in');
    }

    reservation.checkOut = new Date();
    reservation.status = ReservationStatus.COMPLETED;

    const updatedReservation = await repo.save(reservation);

    // Tamamlandı emaili gönder (asenkron)
    sendReservationCompletedEmail(updatedReservation).catch((error) => {
      console.error(`Error sending completion email for reservation ${updatedReservation.id}:`, error);
    });

    // Anket emaili gönder (asenkron)
    sendSurveyEmailForReservation(updatedReservation).catch((error) => {
      console.error(`Error sending survey email for reservation ${updatedReservation.id}:`, error);
    });

    return updatedReservation;
  }

  /**
   * Rezervasyonu iptal et
   */
  static async cancelReservation(id: string, reason?: string): Promise<Reservation> {
    const repo = this.repository();
    const reservation = await repo.findOne({ where: { id }, relations: ['customerLanguage'] });

    if (!reservation) {
      throw new Error('Reservation not found');
    }

    if (reservation.status === ReservationStatus.CANCELLED) {
      throw new Error('Reservation is already cancelled');
    }

    if (reservation.status === ReservationStatus.COMPLETED) {
      throw new Error('Cannot cancel a completed reservation');
    }

    reservation.status = ReservationStatus.CANCELLED;

    // İptal nedeni varsa notlara ekle
    if (reason) {
      const timestamp = new Date().toISOString();
      const cancelNote = `[${timestamp}] İptal nedeni: ${reason}\n`;
      reservation.notes = (reservation.notes || '') + cancelNote;
    }

    const updatedReservation = await repo.save(reservation);

    // İptal emaili gönder (asenkron) - Yukarıdaki kontrollerden dolayı status zaten CANCELLED değil
    sendReservationCancelledEmail(updatedReservation).catch((error) => {
      console.error(`Error sending cancellation email for reservation ${updatedReservation.id}:`, error);
    });

    return updatedReservation;
  }

  /**
   * Onay emaili gönder (rezervasyon durumunu değiştirme - müşteri onaylayınca CONFIRMED olacak)
   */
  static async sendConfirmationEmail(id: string): Promise<void> {
    const repo = this.repository();
    const reservation = await repo.findOne({ 
      where: { id }, 
      relations: ['customerLanguage'] 
    });

    if (!reservation) {
      throw new Error('Reservation not found');
    }

    if (!reservation.customerEmail) {
      throw new Error('Reservation has no customer email');
    }

    // Sadece pending durumundaki rezervasyonlar için onay maili gönderilebilir
    if (reservation.status !== ReservationStatus.PENDING) {
      throw new Error(`Confirmation email can only be sent for pending reservations. Current status: ${reservation.status}`);
    }

    // Müşterinin diline göre onay emaili gönder (durum hala PENDING, müşteri onaylayınca CONFIRMED olacak)
    await sendReservationEmail(reservation, EmailTemplateType.RESERVATION_CONFIRMATION);
  }

  /**
   * İptal emaili gönder ve rezervasyon durumunu CANCELLED yap
   */
  static async sendCancellationEmail(id: string, reason?: string): Promise<void> {
    const repo = this.repository();
    const reservation = await repo.findOne({ 
      where: { id }, 
      relations: ['customerLanguage'] 
    });

    if (!reservation) {
      throw new Error('Reservation not found');
    }

    if (!reservation.customerEmail) {
      throw new Error('Reservation has no customer email');
    }

    if (reservation.status === ReservationStatus.COMPLETED) {
      throw new Error('Cannot cancel a completed reservation');
    }

    // Rezervasyon durumunu CANCELLED yap
    if (reservation.status !== ReservationStatus.CANCELLED) {
      reservation.status = ReservationStatus.CANCELLED;
      
      // İptal nedeni varsa notlara ekle
      if (reason) {
        const timestamp = new Date().toISOString();
        const cancelNote = `[${timestamp}] İptal nedeni: ${reason}\n`;
        reservation.notes = (reservation.notes || '') + cancelNote;
      }
      
      await repo.save(reservation);
    }

    // Müşterinin diline göre iptal emaili gönder
    await sendReservationEmail(reservation, EmailTemplateType.RESERVATION_CANCELLED);
  }

  /**
   * Müşteri tarafından rezervasyon onaylama (public endpoint)
   */
  static async approveByCustomer(id: string, token: string): Promise<Reservation> {
    const repo = this.repository();
    const reservation = await repo.findOne({ 
      where: { id }, 
      relations: ['customerLanguage'] 
    });

    if (!reservation) {
      throw new Error('Reservation not found');
    }

    // Token doğrulama (basit: id ile token eşleşmeli)
    if (token !== id) {
      throw new Error('Invalid token');
    }

    // Sadece pending durumundaki rezervasyonlar onaylanabilir
    if (reservation.status !== ReservationStatus.PENDING) {
      throw new Error(`Reservation cannot be approved. Current status: ${reservation.status}`);
    }

    // Rezervasyon durumunu CONFIRMED yap
    reservation.status = ReservationStatus.CONFIRMED;
    const updatedReservation = await repo.save(reservation);

    // Onay emaili gönder (asenkron)
    sendReservationConfirmationEmail(updatedReservation).catch((error) => {
      console.error(`Error sending confirmation email for reservation ${updatedReservation.id}:`, error);
    });

    return updatedReservation;
  }

  /**
   * Müşteri tarafından rezervasyon iptal etme (public endpoint)
   */
  static async cancelByCustomer(id: string, token: string, reason?: string): Promise<Reservation> {
    const repo = this.repository();
    const reservation = await repo.findOne({ 
      where: { id }, 
      relations: ['customerLanguage'] 
    });

    if (!reservation) {
      throw new Error('Reservation not found');
    }

    // Token doğrulama
    if (token !== id) {
      throw new Error('Invalid token');
    }

    // Sadece pending veya confirmed durumundaki rezervasyonlar iptal edilebilir
    if (reservation.status !== ReservationStatus.PENDING && reservation.status !== ReservationStatus.CONFIRMED) {
      throw new Error(`Reservation cannot be cancelled. Current status: ${reservation.status}`);
    }

    // Rezervasyon durumunu CANCELLED yap
    reservation.status = ReservationStatus.CANCELLED;
    
    // İptal nedeni varsa notlara ekle
    if (reason) {
      const timestamp = new Date().toISOString();
      const cancelNote = `[${timestamp}] Müşteri tarafından iptal nedeni: ${reason}\n`;
      reservation.notes = (reservation.notes || '') + cancelNote;
    }
    
    const updatedReservation = await repo.save(reservation);

    // İptal emaili gönder (asenkron)
    sendReservationCancelledEmail(updatedReservation).catch((error) => {
      console.error(`Error sending cancellation email for reservation ${updatedReservation.id}:`, error);
    });

    return updatedReservation;
  }
}

