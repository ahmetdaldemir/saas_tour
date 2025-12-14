import { Reservation, ReservationStatus } from '../modules/shared/entities/reservation.entity';
import { EmailTemplateService } from '../modules/shared/services/email-template.service';
import { EmailTemplateType } from '../modules/shared/entities/email-template.entity';
import { TenantSettingsService } from '../modules/shared/services/tenant-settings.service';
import { EmailLayoutService } from './email-layout.service';
import { QueueService, EmailJob } from './queue.service';
import nodemailer from 'nodemailer';

/**
 * Rezervasyon email'ini kuyruğa ekle
 */
export const queueReservationEmail = async (
  reservation: Reservation,
  templateType: EmailTemplateType,
  priority: 'normal' | 'high' = 'normal'
): Promise<void> => {
  if (!reservation.customerEmail) {
    console.log(`Reservation ${reservation.id} has no customer email, skipping email.`);
    return;
  }

  try {
    let jobType: EmailJob['type'];
    switch (templateType) {
      case EmailTemplateType.RESERVATION_CONFIRMATION:
        jobType = 'reservation_confirmation';
        break;
      case EmailTemplateType.RESERVATION_CANCELLED:
        jobType = 'reservation_cancelled';
        break;
      case EmailTemplateType.RESERVATION_COMPLETED:
        jobType = 'reservation_completed';
        break;
      default:
        jobType = 'reservation_confirmation';
    }

    await QueueService.publishEmailJob({
      type: jobType,
      tenantId: reservation.tenantId,
      data: {
        reservationId: reservation.id,
        email: reservation.customerEmail,
        languageId: reservation.customerLanguageId || undefined,
      },
      priority,
    });
    console.log(`✅ Reservation email queued: ${jobType} for ${reservation.customerEmail}`);
  } catch (error) {
    console.error('Failed to queue reservation email:', error);
    // Fallback: Direkt gönder (kuyruk yoksa)
    await sendReservationEmailDirect(reservation, templateType);
  }
};

/**
 * Rezervasyon durumuna göre uygun e-posta şablonunu kullanarak mail gönderir
 */
export const sendReservationEmail = async (
  reservation: Reservation,
  templateType: EmailTemplateType
): Promise<void> => {
  // Kuyruk sistemi varsa kuyruğa ekle, yoksa direkt gönder
  const useQueue = process.env.USE_EMAIL_QUEUE !== 'false';
  if (useQueue) {
    return queueReservationEmail(reservation, templateType);
  }
  return sendReservationEmailDirect(reservation, templateType);
};

/**
 * Direkt email gönder (worker tarafından kullanılır)
 */
export const sendReservationEmailDirect = async (
  reservation: Reservation,
  templateType: EmailTemplateType
): Promise<void> => {
  if (!reservation.tenantId) {
    console.error(`Reservation ${reservation.id} has no tenantId, cannot send email.`);
    return;
  }

  // Mail ayarlarını al
  const mailSettings = await TenantSettingsService.getMailSettings(reservation.tenantId);
  if (!mailSettings || !mailSettings.smtpHost || !mailSettings.fromEmail) {
    console.warn(`Mail settings not configured for tenant ${reservation.tenantId}, cannot send email.`);
    return;
  }

  // Müşteri diline göre şablonu al
  const template = await EmailTemplateService.getByType(
    reservation.tenantId,
    templateType,
    reservation.customerLanguageId || undefined
  );

  if (!template) {
    console.warn(`No email template found for type ${templateType} and tenant ${reservation.tenantId}`);
    return;
  }

  // SMTP transporter oluştur
  const transporter = nodemailer.createTransport({
    host: mailSettings.smtpHost,
    port: mailSettings.smtpPort || 587,
    secure: mailSettings.smtpSecure || false,
    auth: {
      user: mailSettings.smtpUser,
      pass: mailSettings.smtpPassword,
    },
  });

  // Rezervasyon değişkenlerini hazırla
  const variables = {
    customerName: reservation.customerName || '',
    customerEmail: reservation.customerEmail || '',
    customerPhone: reservation.customerPhone || '',
    reservationReference: reservation.reference || reservation.id.substring(0, 8).toUpperCase(),
    checkIn: reservation.checkIn ? formatDate(reservation.checkIn) : '',
    checkOut: reservation.checkOut ? formatDate(reservation.checkOut) : '',
    reservationType: getReservationTypeLabel(reservation.type),
    reservationStatus: getReservationStatusLabel(reservation.status),
  };

  // Şablon değişkenlerini değiştir
  const subject = EmailTemplateService.replaceVariables(template.subject, variables);
  const templateBody = EmailTemplateService.replaceVariables(template.body, variables);

  // Site settings'i al (logo ve adres bilgileri için)
  const siteSettings = await TenantSettingsService.getSiteSettings(reservation.tenantId);

  // Layout ile sarmala (logo ve footer bilgileriyle)
  const htmlBody = EmailLayoutService.wrapContent(templateBody, siteSettings);

  // Mail gönder
  try {
    await transporter.sendMail({
      from: `"${mailSettings.fromName || 'Rezervasyon Sistemi'}" <${mailSettings.fromEmail}>`,
      to: reservation.customerEmail,
      subject,
      html: htmlBody,
    });

    console.log(`✅ Reservation email (${templateType}) sent to ${reservation.customerEmail} for reservation ${reservation.id}`);
  } catch (error) {
    console.error(`❌ Failed to send reservation email (${templateType}) for reservation ${reservation.id}:`, (error as Error).message);
    throw error;
  }
};

/**
 * Rezervasyon onaylandığında mail gönder
 */
export const sendReservationConfirmationEmail = async (reservation: Reservation): Promise<void> => {
  if (reservation.status !== ReservationStatus.CONFIRMED) {
    return;
  }
  await sendReservationEmail(reservation, EmailTemplateType.RESERVATION_CONFIRMATION);
};

/**
 * Rezervasyon iptal edildiğinde mail gönder
 */
export const sendReservationCancelledEmail = async (reservation: Reservation): Promise<void> => {
  if (reservation.status !== ReservationStatus.CANCELLED) {
    return;
  }
  await sendReservationEmail(reservation, EmailTemplateType.RESERVATION_CANCELLED);
};

/**
 * Rezervasyon tamamlandığında mail gönder
 */
export const sendReservationCompletedEmail = async (reservation: Reservation): Promise<void> => {
  if (reservation.status !== ReservationStatus.COMPLETED) {
    return;
  }
  await sendReservationEmail(reservation, EmailTemplateType.RESERVATION_COMPLETED);
};

// Helper functions
function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

function getReservationTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    tour: 'Tur',
    rentacar: 'Rent A Car',
    hotel: 'Otel',
  };
  return labels[type] || type;
}

function getReservationStatusLabel(status: ReservationStatus): string {
  const labels: Record<string, string> = {
    [ReservationStatus.PENDING]: 'Beklemede',
    [ReservationStatus.CONFIRMED]: 'Onaylandı',
    [ReservationStatus.REJECTED]: 'Reddedildi',
    [ReservationStatus.CANCELLED]: 'İptal Edildi',
    [ReservationStatus.COMPLETED]: 'Tamamlandı',
  };
  return labels[status] || status;
}

