import { createHash, randomBytes } from "node:crypto";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { Injectable } from "@nestjs/common";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { env } from "../../common/config/env";

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
 * Private file storage abstraction. Two drivers:
 *  - `local` (default): local-disk, good for development.
 *  - `s3`: any S3-compatible service (AWS S3, Cloudflare R2, Supabase Storage,
 *    MinIO). Keys are always server-generated and tenant-scoped.
 */
@Injectable()
export class StorageService {
  private readonly root = path.join(process.cwd(), ".local-storage");
  private readonly s3: S3Client | null = null;
  private readonly bucket = env.S3_BUCKET ?? "";

  constructor() {
    if (env.STORAGE_DRIVER === "s3") {
      if (!env.S3_ENDPOINT || !env.S3_ACCESS_KEY || !env.S3_SECRET_KEY || !env.S3_BUCKET) {
        throw new Error(
          "STORAGE_DRIVER=s3 requires S3_ENDPOINT, S3_ACCESS_KEY, S3_SECRET_KEY and S3_BUCKET.",
        );
      }
      this.s3 = new S3Client({
        region: env.S3_REGION,
        endpoint: env.S3_ENDPOINT,
        forcePathStyle: env.S3_FORCE_PATH_STYLE,
        credentials: { accessKeyId: env.S3_ACCESS_KEY, secretAccessKey: env.S3_SECRET_KEY },
      });
    }
  }

  private newKey(organizationId: string, mimeType: string): string {
    const extension = EXTENSION_BY_MIME[mimeType] ?? "";
    return `${organizationId}/${randomBytes(16).toString("hex")}${extension}`;
  }

  async save(organizationId: string, data: Buffer, mimeType: string): Promise<StoredFile> {
    const storageKey = this.newKey(organizationId, mimeType);
    const checksum = createHash("sha256").update(data).digest("hex");

    if (this.s3) {
      await this.s3.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: storageKey,
          Body: data,
          ContentType: mimeType,
        }),
      );
    } else {
      const fullPath = path.join(this.root, storageKey);
      await fs.mkdir(path.dirname(fullPath), { recursive: true });
      await fs.writeFile(fullPath, data);
    }

    return { storageKey, checksum, sizeBytes: data.length };
  }

  async read(storageKey: string): Promise<Buffer> {
    if (this.s3) {
      const result = await this.s3.send(
        new GetObjectCommand({ Bucket: this.bucket, Key: storageKey }),
      );
      const bytes = await result.Body?.transformToByteArray();
      if (!bytes) throw new Error("Empty object body");
      return Buffer.from(bytes);
    }
    return fs.readFile(path.join(this.root, storageKey));
  }

  async remove(storageKey: string): Promise<void> {
    if (this.s3) {
      await this.s3.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: storageKey }));
      return;
    }
    await fs.rm(path.join(this.root, storageKey), { force: true });
  }
}
