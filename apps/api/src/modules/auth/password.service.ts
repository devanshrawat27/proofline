import { Injectable } from "@nestjs/common";
import * as bcrypt from "bcryptjs";
import { AppError } from "../../common/errors/app-error";

/**
 * Password hashing. bcrypt (pure-JS) is used for portability across dev
 * environments; the cost factor is configurable and set to a strong default.
 * TODO(security): evaluate migrating to Argon2id in the deployment hardening pass.
 */
@Injectable()
export class PasswordService {
  private static readonly COST = 12;

  async hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, PasswordService.COST);
  }

  async verify(plain: string, hash: string): Promise<boolean> {
    try {
      return await bcrypt.compare(plain, hash);
    } catch {
      // Malformed/legacy hash — treat as a failed verification, never throw details.
      return false;
    }
  }

  assertStrongEnough(plain: string): void {
    if (plain.length < 10) {
      throw AppError.badRequest("WEAK_PASSWORD", "Password must be at least 10 characters.");
    }
  }
}
