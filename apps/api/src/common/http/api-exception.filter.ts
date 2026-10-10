import type { ArgumentsHost, ExceptionFilter } from "@nestjs/common";
import { Catch, HttpException, Logger } from "@nestjs/common";
import type { Request, Response } from "express";
import { ZodError } from "zod";
import type { ApiErrorBody } from "@goodsignal/shared-types";
import { AppError } from "../errors/app-error";

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { requestId?: string }>();
    const requestId = request.requestId;

    let body: ApiErrorBody;
    let logLevel: "warn" | "error" = "warn";

    if (exception instanceof AppError) {
      body = {
        statusCode: exception.statusCode,
        code: exception.code,
        message: exception.message,
        details: exception.details,
        requestId,
      };
    } else if (exception instanceof ZodError) {
      body = {
        statusCode: 400,
        code: "VALIDATION_ERROR",
        message: "The submitted data is invalid.",
        details: exception.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
        requestId,
      };
    } else if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const res = exception.getResponse();
      const message =
        typeof res === "string"
          ? res
          : ((res as { message?: string | string[] }).message ?? exception.message);
      body = {
        statusCode: status,
        code: status === 401 ? "UNAUTHENTICATED" : status === 403 ? "FORBIDDEN" : "HTTP_ERROR",
        message: Array.isArray(message) ? message.join(", ") : message,
        requestId,
      };
      if (status >= 500) logLevel = "error";
    } else {
      logLevel = "error";
      body = {
        statusCode: 500,
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred. Please try again.",
        requestId,
      };
    }

    if (logLevel === "error") {
      this.logger.error(
        `${request.method} ${request.url} -> ${body.statusCode} [${body.code}]${requestId ? ` req=${requestId}` : ""}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    response.status(body.statusCode).json(body);
  }
}
