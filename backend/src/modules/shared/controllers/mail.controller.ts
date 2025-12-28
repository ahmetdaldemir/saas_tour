/**
 * Mail Controller
 * Handles email sending API endpoints
 */

import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../../auth/middleware/auth.middleware';
import { sendMail, sendBulkMail, SendMailInput } from '../../../services/mail.service';
import { logger } from '../../../utils/logger';

export class MailController {
  /**
   * Send email using tenant-specific SMTP settings
   * POST /api/mail/send
   * 
   * Body:
   * {
   *   tenantId: string (optional - will use from auth if authenticated)
   *   to: string | string[]
   *   subject: string
   *   html?: string
   *   text?: string
   *   cc?: string | string[]
   *   bcc?: string | string[]
   *   replyTo?: string
   *   attachments?: Array<{ filename, path?, content?, contentType? }>
   * }
   */
  static async send(req: Request, res: Response) {
    try {
      // Get tenantId from request body or authenticated user
      let tenantId: string | undefined;
      
      if (req.body.tenantId) {
        tenantId = req.body.tenantId;
      } else {
        const authReq = req as AuthenticatedRequest;
        if (authReq.auth?.tenantId) {
          tenantId = authReq.auth.tenantId;
        }
      }

      if (!tenantId) {
        return res.status(400).json({
          success: false,
          error: 'tenantId is required. Provide it in request body or authenticate with a tenant user.',
        });
      }

      // Validate required fields
      const { to, subject, html, text } = req.body;
      
      if (!to) {
        return res.status(400).json({
          success: false,
          error: 'to (recipient email) is required',
        });
      }

      if (!subject) {
        return res.status(400).json({
          success: false,
          error: 'subject is required',
        });
      }

      if (!html && !text) {
        return res.status(400).json({
          success: false,
          error: 'Either html or text content is required',
        });
      }

      // Prepare mail input
      const mailInput: SendMailInput = {
        tenantId,
        to,
        subject,
        html,
        text,
        cc: req.body.cc,
        bcc: req.body.bcc,
        replyTo: req.body.replyTo,
        attachments: req.body.attachments,
      };

      // Send email
      const result = await sendMail(mailInput);

      if (result.success) {
        return res.json({
          success: true,
          message: 'Email sent successfully',
          data: {
            messageId: result.messageId,
            to,
            subject,
            sentAt: new Date().toISOString(),
          },
        });
      } else {
        return res.status(500).json({
          success: false,
          error: result.error || 'Failed to send email',
        });
      }
    } catch (error) {
      logger.error('Error in MailController.send:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Send bulk emails
   * POST /api/mail/send-bulk
   * 
   * Body:
   * {
   *   tenantId: string (optional - will use from auth if authenticated)
   *   recipients: Array<{
   *     to: string
   *     subject: string
   *     html?: string
   *     text?: string
   *   }>
   * }
   */
  static async sendBulk(req: Request, res: Response) {
    try {
      // Get tenantId from request body or authenticated user
      let tenantId: string | undefined;
      
      if (req.body.tenantId) {
        tenantId = req.body.tenantId;
      } else {
        const authReq = req as AuthenticatedRequest;
        if (authReq.auth?.tenantId) {
          tenantId = authReq.auth.tenantId;
        }
      }

      if (!tenantId) {
        return res.status(400).json({
          success: false,
          error: 'tenantId is required. Provide it in request body or authenticate with a tenant user.',
        });
      }

      const { recipients } = req.body;

      if (!Array.isArray(recipients) || recipients.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'recipients array is required and must not be empty',
        });
      }

      // Validate recipients
      for (const recipient of recipients) {
        if (!recipient.to || !recipient.subject) {
          return res.status(400).json({
            success: false,
            error: 'Each recipient must have "to" and "subject" fields',
          });
        }
        if (!recipient.html && !recipient.text) {
          return res.status(400).json({
            success: false,
            error: 'Each recipient must have either "html" or "text" content',
          });
        }
      }

      // Send bulk emails
      const result = await sendBulkMail(tenantId, recipients);

      return res.json({
        success: true,
        message: `Bulk email sending completed. ${result.success} sent, ${result.failed} failed.`,
        data: {
          success: result.success,
          failed: result.failed,
          errors: result.errors,
        },
      });
    } catch (error) {
      logger.error('Error in MailController.sendBulk:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

