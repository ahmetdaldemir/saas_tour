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
  let template = await EmailTemplateService.getByType(
    reservation.tenantId,
    templateType,
    reservation.customerLanguageId || undefined
  );

  // If no template found, use default template
  if (!template) {
    console.warn(`No email template found for type ${templateType} and tenant ${reservation.tenantId}, using default template`);
    template = {
      id: 'default',
      subject: getDefaultEmailSubject(reservation, templateType),
      body: getDefaultEmailBody(reservation, templateType),
    } as any;
  }

  // Ensure template is not null (TypeScript check)
  if (!template) {
    console.error(`Could not create default template for reservation ${reservation.id}`);
    return;
  }

  // SMTP transporter oluştur
  // Port ve secure ayarını otomatik belirle
  const smtpPort = mailSettings.smtpPort || 587;
  const useSecure = mailSettings.smtpSecure !== undefined 
    ? mailSettings.smtpSecure 
    : smtpPort === 465;
  
  const transporter = nodemailer.createTransport({
    host: mailSettings.smtpHost,
    port: smtpPort,
    secure: useSecure,
    requireTLS: !useSecure && smtpPort === 587,
    auth: {
      user: mailSettings.smtpUser,
      pass: mailSettings.smtpPassword,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  // Rezervasyon değişkenlerini hazırla
  const metadata = reservation.metadata || {};
  
  // Onaylama butonu URL'i oluştur (sadece pending durumunda)
  const baseUrl = process.env.FRONTEND_URL || process.env.PUBLIC_URL || 'https://saastour360.com';
  const approvalUrl = `${baseUrl}/public/reservation/${reservation.id}/approve?token=${encodeURIComponent(reservation.id)}`;
  const cancellationUrl = `${baseUrl}/public/reservation/${reservation.id}/cancel?token=${encodeURIComponent(reservation.id)}`;
  
  const variables: Record<string, string | number> = {
    customerName: reservation.customerName || '',
    customerEmail: reservation.customerEmail || '',
    customerPhone: reservation.customerPhone || '',
    reservationReference: reservation.reference || reservation.id.substring(0, 8).toUpperCase(),
    checkIn: reservation.checkIn ? formatDate(reservation.checkIn) : '',
    checkOut: reservation.checkOut ? formatDate(reservation.checkOut) : '',
    reservationType: getReservationTypeLabel(reservation.type),
    reservationStatus: getReservationStatusLabel(reservation.status),
    approvalUrl,
    cancellationUrl,
  };
  
  // Onaylama butonu HTML'i (sadece pending durumunda ve confirmation email'inde)
  if (reservation.status === ReservationStatus.PENDING && templateType === EmailTemplateType.RESERVATION_CONFIRMATION) {
    variables.approvalButton = `
      <div style="text-align: center; margin: 30px 0;">
        <a href="${approvalUrl}" 
           style="display: inline-block; padding: 14px 28px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
          Rezervasyonu Onayla
        </a>
      </div>
    `;
  } else {
    variables.approvalButton = '';
  }
  
  // İptal butonu HTML'i (confirmed veya pending durumunda ve cancellation email'inde)
  if ((reservation.status === ReservationStatus.CONFIRMED || reservation.status === ReservationStatus.PENDING) && templateType === EmailTemplateType.RESERVATION_CANCELLED) {
    variables.cancellationButton = `
      <div style="text-align: center; margin: 30px 0;">
        <a href="${cancellationUrl}" 
           style="display: inline-block; padding: 14px 28px; background-color: #dc2626; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
          Rezervasyonu İptal Et
        </a>
      </div>
    `;
  } else {
    variables.cancellationButton = '';
  }

  // Rentacar-specific variables
  if (reservation.type === 'rentacar' && metadata) {
    variables.vehicleName = (metadata.vehicleName as string) || '';
    variables.pickupLocationName = (metadata.pickupLocationName as string) || '';
    variables.dropoffLocationName = (metadata.dropoffLocationName as string) || '';
    variables.rentalDays = (metadata.rentalDays as number) || 0;
    variables.vehiclePrice = (metadata.vehiclePrice as number) || 0;
    variables.extrasPrice = (metadata.extrasPrice as number) || 0;
    variables.totalPrice = (metadata.totalPrice as number) || 0;
    variables.currencyCode = (metadata.currencyCode as string) || '';
    variables.paymentMethod = (metadata.paymentMethod as string) || '';
  }

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
  // Format as: "January 1, 2026 at 10:00 AM"
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
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
    [ReservationStatus.PENDING]: 'Pending',
    [ReservationStatus.CONFIRMED]: 'Confirmed',
    [ReservationStatus.REJECTED]: 'Rejected',
    [ReservationStatus.CANCELLED]: 'Cancelled',
    [ReservationStatus.COMPLETED]: 'Completed',
  };
  return labels[status] || status;
}

/**
 * Get default email subject if template not found
 */
function getDefaultEmailSubject(reservation: Reservation, templateType: EmailTemplateType): string {
  if (templateType === EmailTemplateType.RESERVATION_CONFIRMATION) {
    return `Your Reservation Has Been Received - ${reservation.reference || reservation.id.substring(0, 8).toUpperCase()}`;
  }
  return `Reservation Update - ${reservation.reference || reservation.id.substring(0, 8).toUpperCase()}`;
}

/**
 * Get default email body if template not found
 */
function getDefaultEmailBody(reservation: Reservation, templateType: EmailTemplateType): string {
  const metadata = reservation.metadata || {};
  const isRentacar = reservation.type === 'rentacar';
  
  if (templateType === EmailTemplateType.RESERVATION_CONFIRMATION) {
    let body = `
      <h2 style="color: #2c3e50; margin-bottom: 20px;">Dear {{customerName}},</h2>
      <p style="font-size: 16px; line-height: 1.6; margin-bottom: 15px;">
        Thank you for your reservation! We have successfully received your reservation request.
      </p>
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <h3 style="color: #2c3e50; margin-top: 0;">Reservation Details</h3>
        <p><strong>Reservation Reference:</strong> {{reservationReference}}</p>
        <p><strong>Reservation Type:</strong> {{reservationType}}</p>
        <p><strong>Status:</strong> {{reservationStatus}}</p>
    `;

    if (isRentacar && metadata) {
      body += `
        <p><strong>Vehicle:</strong> {{vehicleName}}</p>
        <p><strong>Pickup Location:</strong> {{pickupLocationName}}</p>
        <p><strong>Pickup Date & Time:</strong> {{checkIn}}</p>
        <p><strong>Dropoff Location:</strong> {{dropoffLocationName}}</p>
        <p><strong>Dropoff Date & Time:</strong> {{checkOut}}</p>
        <p><strong>Rental Days:</strong> {{rentalDays}} days</p>
        <p><strong>Vehicle Price:</strong> {{vehiclePrice}} {{currencyCode}}</p>
        <p><strong>Extras Price:</strong> {{extrasPrice}} {{currencyCode}}</p>
        <p><strong>Total Price:</strong> <strong style="color: #e74c3c; font-size: 18px;">{{totalPrice}} {{currencyCode}}</strong></p>
        <p><strong>Payment Method:</strong> {{paymentMethod}}</p>
      `;
    } else {
      body += `
        <p><strong>Check-in:</strong> {{checkIn}}</p>
        <p><strong>Check-out:</strong> {{checkOut}}</p>
      `;
    }

    body += `
      </div>
      <p style="font-size: 16px; line-height: 1.6; margin-top: 20px;">
        Our team will review your reservation and confirm it shortly. You will receive a confirmation email once your reservation is approved.
      </p>
      <p style="font-size: 16px; line-height: 1.6;">
        If you have any questions or need to make changes, please contact us using the information provided in this email.
      </p>
      <p style="font-size: 16px; line-height: 1.6; margin-top: 30px;">
        Best regards,<br>
        <strong>Reservation Team</strong>
      </p>
    `;

    return body;
  }

  // Default body for other template types
  return `
    <h2 style="color: #2c3e50; margin-bottom: 20px;">Dear {{customerName}},</h2>
    <p style="font-size: 16px; line-height: 1.6;">
      This is an update regarding your reservation {{reservationReference}}.
    </p>
    <p style="font-size: 16px; line-height: 1.6;">
      Status: {{reservationStatus}}
    </p>
  `;
}

