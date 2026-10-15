import { createHash, randomBytes } from "node:crypto";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { Injectable } from "@nestjs/common";

const EXTENSION_BY_MIME: Record<string, string> = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
  "application/pdf": ".pdf",
};

export interface StoredFile {
  storageKey: string;
  checksum: string;
  sizeBytes: number;
}

/**
 * Private file storage abstraction. The MVP uses a local-disk driver suitable
 * for development; the interface maps directly to an S3-compatible driver
 * (MinIO/S3) for production. Keys are always server-generated and tenant-scoped.
 */
@Injectable()
export class StorageService {
  private readonly root = process.env.STORAGE_PATH ?? path.join(process.cwd(), ".local-storage");

  private resolve(storageKey: string): string {
    // storage keys are server-generated ("<orgId>/<hex><ext>"); never trust user input.
    return path.join(this.root, storageKey);
  }

  async save(organizationId: string, data: Buffer, mimeType: string): Promise<StoredFile> {
    const extension = EXTENSION_BY_MIME[mimeType] ?? "";
    const storageKey = `${organizationId}/${randomBytes(16).toString("hex")}${extension}`;
    const fullPath = this.resolve(storageKey);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, data);
    return {
      storageKey,
      checksum: createHash("sha256").update(data).digest("hex"),
      sizeBytes: data.length,
    };
  }

  async read(storageKey: string): Promise<Buffer> {
    return fs.readFile(this.resolve(storageKey));
  }

  async remove(storageKey: string): Promise<void> {
    await fs.rm(this.resolve(storageKey), { force: true });
  }
}
