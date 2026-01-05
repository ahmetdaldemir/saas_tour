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
   * Onay emaili gönder
   */
  static async sendConfirmationEmail(id: string): Promise<void> {
    const reservation = await this.repository().findOne({ 
      where: { id }, 
      relations: ['customerLanguage'] 
    });

    if (!reservation) {
      throw new Error('Reservation not found');
    }

    if (!reservation.customerEmail) {
      throw new Error('Reservation has no customer email');
    }

    // Müşterinin diline göre onay emaili gönder
    await sendReservationEmail(reservation, EmailTemplateType.RESERVATION_CONFIRMATION);
  }
}

