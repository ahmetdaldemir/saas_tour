import { TenantSettings } from '../modules/shared/entities/tenant-settings.entity';

/**
 * Email template layout servisi
 * Tenant'a göre logo ve adres bilgileriyle email layout oluşturur
 */
export class EmailLayoutService {
  /**
   * HTML email layout oluşturur (tenant logo ve adres bilgileriyle)
   */
  static wrapContent(content: string, siteSettings: TenantSettings | null): string {
    const logoUrl = siteSettings?.logoUrl || '';
    const siteName = siteSettings?.siteName || 'Company';
    const companyName = (siteSettings as any)?.companyName || siteSettings?.siteName || '';
    const companyAddress = (siteSettings as any)?.companyAddress || '';
    const companyPhone = (siteSettings as any)?.companyPhone || '';
    const companyEmail = (siteSettings as any)?.companyEmail || siteSettings?.fromEmail || '';
    const companyWebsite = (siteSettings as any)?.companyWebsite || '';

    return `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${siteName}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: Arial, sans-serif;
      background-color: #f4f4f4;
    }
    .email-wrapper {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .email-header {
      background-color: #ffffff;
      padding: 20px;
      text-align: center;
      border-bottom: 1px solid #eeeeee;
    }
    .email-logo {
      max-width: 200px;
      max-height: 80px;
      margin: 0 auto 10px;
    }
    .email-body {
      padding: 30px 20px;
      line-height: 1.6;
      color: #333333;
    }
    .email-footer {
      background-color: #f9f9f9;
      padding: 20px;
      text-align: center;
      border-top: 1px solid #eeeeee;
      font-size: 12px;
      color: #666666;
    }
    .company-info {
      margin-top: 15px;
      line-height: 1.8;
    }
    .company-info p {
      margin: 5px 0;
    }
    .email-content {
      color: #333333;
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-header">
      ${logoUrl ? `<img src="${logoUrl}" alt="${siteName}" class="email-logo" />` : ''}
      <h1 style="margin: 10px 0 0; color: #333333; font-size: 24px;">${siteName}</h1>
    </div>
    <div class="email-body">
      <div class="email-content">
        ${content}
      </div>
    </div>
    <div class="email-footer">
      ${companyName ? `<p><strong>${companyName}</strong></p>` : ''}
      ${companyAddress ? `<p>${companyAddress}</p>` : ''}
      ${companyPhone ? `<p>Tel: ${companyPhone}</p>` : ''}
      ${companyEmail ? `<p>Email: <a href="mailto:${companyEmail}" style="color: #0066cc;">${companyEmail}</a></p>` : ''}
      ${companyWebsite ? `<p>Web: <a href="${companyWebsite}" style="color: #0066cc;">${companyWebsite}</a></p>` : ''}
      <p style="margin-top: 15px; color: #999999; font-size: 11px;">
        © ${new Date().getFullYear()} ${siteName}. Tüm hakları saklıdır.
      </p>
    </div>
  </div>
</body>
</html>
    `.trim();
  }
}

