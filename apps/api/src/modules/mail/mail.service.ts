import { Injectable, Logger, type OnModuleInit } from "@nestjs/common";
import nodemailer, { type Transporter } from "nodemailer";
import { env } from "../../common/config/env";

/**
 * SMTP email sender. When SMTP is not configured it logs the message instead
 * of sending (safe for local development) and never throws to callers.
 */
@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;

  onModuleInit(): void {
    if (!env.SMTP_HOST) {
      this.logger.warn("SMTP_HOST not configured; emails will be logged, not sent.");
      return;
    }
    this.transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: false,
      auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD } : undefined,
    });
    this.logger.log(`SMTP configured at ${env.SMTP_HOST}:${env.SMTP_PORT}`);
  }

  async send(to: string, subject: string, text: string, html?: string): Promise<void> {
    if (!this.transporter) {
      this.logger.log(`[mail:noop] to=${to} subject=${subject}`);
      return;
    }
    await this.transporter.sendMail({ from: env.SMTP_FROM, to, subject, text, ...(html ? { html } : {}) });
  }
}
