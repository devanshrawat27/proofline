import { Module } from "@nestjs/common";
import { SupplierModule } from "../supplier/supplier.module";
import { DocumentsController } from "./documents.controller";
import { DocumentsService } from "./documents.service";
import { ExtractionService } from "./extraction.service";
import { StorageService } from "./storage.service";
import { SupplierDocumentsController } from "./supplier-documents.controller";

@Module({
  imports: [SupplierModule],
  controllers: [DocumentsController, SupplierDocumentsController],
  providers: [DocumentsService, StorageService, ExtractionService],
})
export class DocumentsModule {}
