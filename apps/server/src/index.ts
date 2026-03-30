import { devToolsMiddleware } from "@ai-sdk/devtools";
import { google } from "@ai-sdk/google";
import { createContext } from "@bagcoin/api/context";
import { appRouter } from "@bagcoin/api/routers/index";
import { auth } from "@bagcoin/auth";
import { env } from "@bagcoin/env/server";
import { cors } from "@elysiajs/cors";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import {
  convertToModelMessages,
  streamText,
  type UIMessage,
  wrapLanguageModel,
} from "ai";
import { Elysia } from "elysia";
import { bankAccountRoutes } from "./routes/bank-accounts";
import { categoryRoutes } from "./routes/categories";
import { creditCardRoutes } from "./routes/credit-cards";
import { dashboardRoutes } from "./routes/dashboard";
import { importRoutes } from "./routes/import";
import { profileRoutes } from "./routes/profile";
import { reportRoutes } from "./routes/reports";
import { transactionRoutes } from "./routes/transactions";

new Elysia()
  .use(
    cors({
      origin: env.CORS_ORIGIN,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    })
  )
  .use(bankAccountRoutes)
  .use(creditCardRoutes)
  .use(categoryRoutes)
  .use(transactionRoutes)
  .use(dashboardRoutes)
  .use(reportRoutes)
  .use(importRoutes)
  .use(profileRoutes)
  .all("/api/auth/*", async (context) => {
    const { request, status } = context;
    if (["POST", "GET"].includes(request.method)) {
      return auth.handler(request);
    }
    return status(405);
  })
  .all("/trpc/*", async (context) => {
    const res = await fetchRequestHandler({
      endpoint: "/trpc",
      router: appRouter,
      req: context.request,
      createContext: () => createContext({ context }),
    });
    return res;
  })
  .post("/ai", async (context) => {
    const body = (await context.request.json()) as {
      messages?: UIMessage[];
    };
    const uiMessages = body.messages ?? [];
    const model = wrapLanguageModel({
      model: google("gemini-2.5-flash"),
      middleware: devToolsMiddleware(),
    });
    const result = streamText({
      model,
      messages: await convertToModelMessages(uiMessages),
    });

    return result.toUIMessageStreamResponse();
  })
  .get("/", () => "OK")
  .listen(Number(process.env.PORT) || 3000, () => {
    console.log(
      `Server is running on port ${Number(process.env.PORT) || 3000}`
    );
  });
