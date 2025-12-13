import { Repository } from 'typeorm';
import { AppDataSource } from '../../../config/data-source';
import { Reservation, ReservationStatus } from '../entities/reservation.entity';
import { sendSurveyEmailForReservation } from '../../../services/survey-email.service';
import {
  sendReservationConfirmationEmail,
  sendReservationCancelledEmail,
  sendReservationCompletedEmail,
} from '../../../services/reservation-email.service';

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

  static async update(id: string, data: Partial<Reservation>): Promise<Reservation> {
    const repo = this.repository();
    const reservation = await repo.findOne({ where: { id }, relations: ['customerLanguage'] });

    if (!reservation) {
      throw new Error('Reservation not found');
    }

    const previousStatus = reservation.status;

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
}

