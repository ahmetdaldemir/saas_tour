import { Customer } from '../modules/shared/entities/customer.entity';
import { EmailTemplateService } from '../modules/shared/services/email-template.service';
import { EmailTemplateType } from '../modules/shared/entities/email-template.entity';
import { TenantSettingsService } from '../modules/shared/services/tenant-settings.service';
import { EmailLayoutService } from './email-layout.service';
import { QueueService, EmailJob } from './queue.service';
import nodemailer from 'nodemailer';

/**
 * Yeni müşteri oluşturulduğunda hoş geldin email'i gönderir (kuyruğa ekler)
 * Email'de müşterinin şifresi açık olarak gönderilir
 */
export const queueCustomerWelcomeEmail = async (
  customer: Customer,
  plainPassword: string
): Promise<void> => {
  if (!customer.email) {
    console.log(`Customer ${customer.id} has no email, skipping welcome email.`);
    return;
  }

  try {
    await QueueService.publishEmailJob({
      type: 'customer_welcome',
      tenantId: customer.tenantId,
      data: {
        customerId: customer.id,
        email: customer.email,
        languageId: customer.languageId || undefined,
        password: plainPassword,
        idNumber: customer.idNumber || '',
      },
      priority: 'normal',
    });
    console.log(`✅ Customer welcome email queued for ${customer.email}`);
  } catch (error) {
    console.error('Failed to queue customer welcome email:', error);
    // Fallback: Direkt gönder (kuyruk yoksa)
    await sendCustomerWelcomeEmailDirect(customer, plainPassword);
  }
};

/**
 * Yeni müşteri oluşturulduğunda hoş geldin email'i gönderir (direkt)
 * Email'de müşterinin şifresi açık olarak gönderilir
 */
export const sendCustomerWelcomeEmail = async (
  customer: Customer,
  plainPassword: string
): Promise<void> => {
  // Kuyruk sistemi varsa kuyruğa ekle, yoksa direkt gönder
  const useQueue = process.env.USE_EMAIL_QUEUE !== 'false';
  if (useQueue) {
    return queueCustomerWelcomeEmail(customer, plainPassword);
  }
  return sendCustomerWelcomeEmailDirect(customer, plainPassword);
};

/**
 * Direkt email gönder (worker tarafından kullanılır)
 */
export const sendCustomerWelcomeEmailDirect = async (
  customer: Customer,
  plainPassword: string
): Promise<void> => {
  // Email yoksa gönderme
  if (!customer.email) {
    console.log(`Customer ${customer.id} has no email, skipping welcome email.`);
    return;
  }

  if (!customer.tenantId) {
    console.error(`Customer ${customer.id} has no tenantId, cannot send email.`);
    return;
  }

  // Mail ayarlarını al
  const mailSettings = await TenantSettingsService.getMailSettings(customer.tenantId);
  if (!mailSettings || !mailSettings.smtpHost || !mailSettings.fromEmail) {
    console.warn(`Mail settings not configured for tenant ${customer.tenantId}, cannot send email.`);
    return;
  }

  // Müşteri diline göre şablonu al
  const template = await EmailTemplateService.getByType(
    customer.tenantId,
    EmailTemplateType.CUSTOMER_WELCOME,
    customer.languageId || undefined
  );

  if (!template) {
    console.warn(`No email template found for type ${EmailTemplateType.CUSTOMER_WELCOME} and tenant ${customer.tenantId}`);
    return;
  }

  // SMTP transporter oluştur
  // Port ve secure ayarını otomatik belirle
  const smtpPort = mailSettings.smtpPort || 587;
  // Port 465 ise SSL kullan (secure: true), diğer durumlarda STARTTLS kullan (secure: false)
  const useSecure = mailSettings.smtpSecure !== undefined 
    ? mailSettings.smtpSecure 
    : smtpPort === 465;
  
  const transporter = nodemailer.createTransport({
    host: mailSettings.smtpHost,
    port: smtpPort,
    secure: useSecure,
    requireTLS: !useSecure && smtpPort === 587, // Port 587 için STARTTLS zorunlu
    auth: {
      user: mailSettings.smtpUser,
      pass: mailSettings.smtpPassword,
    },
    tls: {
      // SSL sertifika doğrulamasını atla (development için)
      rejectUnauthorized: false,
    },
  });

  // Müşteri değişkenlerini hazırla
  const variables = {
    customerName: customer.fullName || `${customer.firstName} ${customer.lastName}`,
    customerEmail: customer.email || '',
    customerPhone: customer.mobilePhone || customer.homePhone || '',
    password: plainPassword, // Açık şifre
    idNumber: customer.idNumber || '',
    firstName: customer.firstName || '',
    lastName: customer.lastName || '',
    birthDate: customer.birthDate ? formatDate(customer.birthDate) : '',
    birthPlace: customer.birthPlace || '',
    gender: customer.gender || '',
    country: customer.country || '',
    licenseNumber: customer.licenseNumber || '',
    licenseClass: customer.licenseClass || '',
  };

  // Şablon değişkenlerini değiştir
  const subject = EmailTemplateService.replaceVariables(template.subject, variables);
  const templateBody = EmailTemplateService.replaceVariables(template.body, variables);

  // Site settings'i al (logo ve adres bilgileri için)
  const siteSettings = await TenantSettingsService.getSiteSettings(customer.tenantId);

  // Layout ile sarmala (logo ve footer bilgileriyle)
  const htmlBody = EmailLayoutService.wrapContent(templateBody, siteSettings);

  // Mail gönder
  try {
    await transporter.sendMail({
      from: `"${mailSettings.fromName || 'Müşteri Hizmetleri'}" <${mailSettings.fromEmail}>`,
      to: customer.email,
      subject,
      html: htmlBody,
    });

    console.log(`✅ Customer welcome email sent to ${customer.email} for customer ${customer.id}`);
  } catch (error) {
    console.error(`❌ Failed to send customer welcome email for customer ${customer.id}:`, (error as Error).message);
    throw error;
  }
};

/**
 * Tarihi formatla
 */
function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  
  return `${day}.${month}.${year}`;
}

