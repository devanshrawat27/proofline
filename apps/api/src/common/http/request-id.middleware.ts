import { randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";

/**
 * Attaches a request id (honouring an inbound `x-request-id`) to every request
 * and echoes it back. Used for structured logs and correlating API errors.
 */
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const inbound = req.header("x-request-id");
  const requestId = inbound && inbound.length <= 128 ? inbound : randomUUID();
  (req as Request & { requestId?: string }).requestId = requestId;
  res.setHeader("x-request-id", requestId);
  next();
}
