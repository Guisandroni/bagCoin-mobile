import { createDb } from "@bagcoin/db";
import {
  account,
  accountRelations,
  session,
  sessionRelations,
  user,
  userRelations,
  verification,
} from "@bagcoin/db/schema/auth";
import { env } from "@bagcoin/env/server";
import { expo } from "@better-auth/expo";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

export function createAuth() {
  const db = createDb();

  return betterAuth({
    database: drizzleAdapter(db, {
      provider: "sqlite",

      schema: {
        user,
        session,
        account,
        verification,
        userRelations,
        sessionRelations,
        accountRelations,
      },
    }),
    trustedOrigins: [
      ...(env.CORS_ORIGIN === "*"
        ? ["*"]
        : env.CORS_ORIGIN.split(",").map((o) => o.trim())),
      "bagcoin://",
      "exp://",
      "http://localhost:8081",
      "http://127.0.0.1:8081",
      ...(env.NODE_ENV === "development"
        ? ["exp://**", "exp://192.168.*.*:*/**"]
        : []),
    ],
    emailAndPassword: {
      enabled: true,
    },
    socialProviders:
      env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
        ? {
            google: {
              clientId: env.GOOGLE_CLIENT_ID,
              clientSecret: env.GOOGLE_CLIENT_SECRET,
            },
          }
        : undefined,
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    advanced: {
      defaultCookieAttributes: {
        sameSite: "none",
        secure: true,
        httpOnly: true,
      },
    },
    plugins: [expo()],
  });
}

export const auth = createAuth();
