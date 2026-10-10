import type { PipeTransform } from "@nestjs/common";
import { Injectable } from "@nestjs/common";
import type { ZodSchema } from "zod";
import { AppError } from "../errors/app-error";

/**
 * Validates and narrows a request payload with a Zod schema. On failure it
 * throws a safe 400 with field-level issues (no leaked internals).
 */
@Injectable()
export class ZodValidationPipe<T> implements PipeTransform {
  constructor(private readonly schema: ZodSchema<T>) {}

  transform(value: unknown): T {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw AppError.badRequest(
        "VALIDATION_ERROR",
        "The submitted data is invalid.",
        result.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      );
    }
    return result.data;
  }
}
