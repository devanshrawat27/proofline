import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from "@nestjs/common";
import { Queue, Worker } from "bullmq";
import IORedis from "ioredis";
import { env } from "../../common/config/env";
import { MailService } from "./mail.service";

export interface MailJob {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

/**
 * Sends email via a BullMQ queue (retries + backoff) when Redis is configured,
 * and falls back to a best-effort inline send otherwise. Email is never in the
 * critical path: failures are logged and swallowed.
 */
@Injectable()
export class MailQueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MailQueueService.name);
  private connection: IORedis | null = null;
  private queue: Queue<MailJob> | null = null;
  private worker: Worker<MailJob> | null = null;

  constructor(private readonly mail: MailService) {}

  onModuleInit(): void {
    if (!env.REDIS_URL) {
      this.logger.warn("REDIS_URL not set; emails will be sent inline (no retries).");
      return;
    }
    try {
      // BullMQ requires maxRetriesPerRequest: null for worker connections.
      this.connection = new IORedis(env.REDIS_URL, { maxRetriesPerRequest: null });
      this.connection.on("error", (err) => this.logger.warn(`Redis error: ${err.message}`));
      this.queue = new Queue<MailJob>("mail", { connection: this.connection });
      this.worker = new Worker<MailJob>(
        "mail",
        async (job) => {
          await this.mail.send(job.data.to, job.data.subject, job.data.text, job.data.html);
        },
        { connection: this.connection },
      );
      this.queue.on("error", (err) => this.logger.warn(`Mail queue error: ${err.message}`));
      this.worker.on("error", (err) => this.logger.warn(`Mail worker error: ${err.message}`));
      this.worker.on("failed", (job, err) => {
        this.logger.warn(`Mail job ${job?.id ?? "?"} failed: ${err.message}`);
      });
      this.logger.log("Mail queue worker started");
    } catch (error) {
      this.logger.warn(`Mail queue unavailable, using inline send: ${String(error)}`);
      this.queue = null;
      this.worker = null;
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.worker?.close();
    await this.queue?.close();
    this.connection?.disconnect();
  }

  async enqueue(job: MailJob): Promise<void> {
    if (this.queue) {
      try {
        await this.queue.add("send", job, {
          attempts: 3,
          backoff: { type: "exponential", delay: 1000 },
          removeOnComplete: true,
          removeOnFail: 100,
        });
        return;
      } catch (error) {
        this.logger.warn(`Enqueue failed, sending inline: ${String(error)}`);
      }
    }
    await this.mail.send(job.to, job.subject, job.text, job.html).catch((error: unknown) => {
      this.logger.warn(`Inline email failed: ${String(error)}`);
    });
  }
}
