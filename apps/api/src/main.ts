import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import type { NextFunction, Request, Response } from "express";
import { AppModule } from "./app.module";
import { ApiExceptionFilter } from "./common/http/api-exception.filter";
import { requestIdMiddleware } from "./common/http/request-id.middleware";
import { corsAllowedOrigins, env } from "./common/config/env";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger:
      env.NODE_ENV === "production"
        ? ["error", "warn", "log"]
        : ["error", "warn", "log", "debug"],
  });

  app.set("trust proxy", 1);
  app.use(helmet());
  app.use(cookieParser());
  app.use(requestIdMiddleware);

  // CSRF defence in depth: reject state-changing requests whose Origin is not
  // in the allowlist. SameSite=Lax cookies are the primary control.
  app.use((req: Request, res: Response, next: NextFunction) => {
    const method = req.method.toUpperCase();
    if (["GET", "HEAD", "OPTIONS"].includes(method)) return next();
    const origin = req.header("origin");
    if (origin && !corsAllowedOrigins.includes(origin)) {
      return res.status(403).json({
        statusCode: 403,
        code: "FORBIDDEN_ORIGIN",
        message: "Request origin is not allowed.",
      });
    }
    return next();
  });

  app.enableCors({
    origin: corsAllowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Request-Id"],
  });

  app.useGlobalFilters(new ApiExceptionFilter());

  app.setGlobalPrefix("api/v1", { exclude: ["health", "ready"] });

  app.enableShutdownHooks();

  await app.listen(env.API_PORT);
  // eslint-disable-next-line no-console
  console.log(`Proofline API listening on ${env.API_PUBLIC_URL} (${env.NODE_ENV})`);
}

void bootstrap();
