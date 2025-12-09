import "dotenv/config";
import { createContext } from "@GK-Nexus/api/context";
import { appRouter } from "@GK-Nexus/api/routers/index";
import { auth } from "@GK-Nexus/auth";
import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { OpenAPIReferencePlugin } from "@orpc/openapi/plugins";
import { onError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import type { Context, Next } from "hono";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS =
  Number(process.env.RATE_LIMIT_WINDOW_MS) || 900_000; // 15 minutes
const RATE_LIMIT_MAX_REQUESTS =
  Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 100;

// In-memory rate limit store (use Redis for multi-instance deployments)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Cleanup old entries every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 300_000);

// Rate limiting middleware
const rateLimiter = (c: Context, next: Next) => {
  const ip =
    c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ||
    c.req.header("x-real-ip") ||
    "unknown";
  const now = Date.now();
  const record = rateLimitStore.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return next();
  }

  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    const retryAfter = Math.ceil((record.resetTime - now) / 1000);
    c.header("Retry-After", String(retryAfter));
    c.header("X-RateLimit-Limit", String(RATE_LIMIT_MAX_REQUESTS));
    c.header("X-RateLimit-Remaining", "0");
    c.header("X-RateLimit-Reset", String(Math.ceil(record.resetTime / 1000)));
    return c.json({ error: "Too many requests. Please try again later." }, 429);
  }

  record.count += 1;
  c.header("X-RateLimit-Limit", String(RATE_LIMIT_MAX_REQUESTS));
  c.header(
    "X-RateLimit-Remaining",
    String(RATE_LIMIT_MAX_REQUESTS - record.count)
  );
  c.header("X-RateLimit-Reset", String(Math.ceil(record.resetTime / 1000)));
  return next();
};

const app = new Hono();

app.use(logger());

// Rate limiting middleware (100 requests per 15 minutes per IP)
app.use("/*", rateLimiter);

// Security headers middleware
app.use(
  "/*",
  secureHeaders({
    xFrameOptions: "DENY",
    xContentTypeOptions: "nosniff",
    referrerPolicy: "strict-origin-when-cross-origin",
    xXssProtection: "1; mode=block",
    ...(process.env.NODE_ENV === "production" && {
      contentSecurityPolicy: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: [
          "'self'",
          process.env.CORS_ORIGIN || "http://localhost:3001",
        ],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
      },
    }),
  })
);

app.use(
  "/*",
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3001",
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const apiHandler: any = new OpenAPIHandler(appRouter, {
  plugins: [
    new OpenAPIReferencePlugin({
      // Temporarily disabled due to Zod v4 compatibility issue
      // schemaConverters: [new ZodToJsonSchemaConverter()],
    }),
  ],
  interceptors: [
    onError((error) => {
      console.error(error);
    }),
  ],
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const rpcHandler: any = new RPCHandler(appRouter, {
  interceptors: [
    onError((error) => {
      console.error(error);
    }),
  ],
});

app.use("/*", async (c, next) => {
  const context = await createContext({ context: c });

  const rpcResult = await rpcHandler.handle(c.req.raw, {
    prefix: "/rpc",
    context,
  });

  if (rpcResult.matched) {
    return c.newResponse(rpcResult.response.body, rpcResult.response);
  }

  const apiResult = await apiHandler.handle(c.req.raw, {
    prefix: "/api-reference",
    context,
  });

  if (apiResult.matched) {
    return c.newResponse(apiResult.response.body, apiResult.response);
  }

  await next();
});

app.get("/", (c) => c.text("OK"));

export default app;
