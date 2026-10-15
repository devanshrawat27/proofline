import { Module } from "@nestjs/common";
import { MailQueueService } from "./mail-queue.service";
import { MailService } from "./mail.service";

@Module({
  providers: [MailService, MailQueueService],
  exports: [MailQueueService],
})
export class MailModule {}
