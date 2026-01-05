import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

import { prisma } from "./prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "sqlite", // Change to "postgresql" for production
  }),

  // Email & Password authentication
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Set to true in production
    minPasswordLength: 6,
  },

  // Session configuration
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Update session every 24 hours
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes
    },
  },

  // User configuration
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
      },
      totalPoints: {
        type: "number",
        defaultValue: 0,
        required: false,
      },
    },
  },

  // Base URL for authentication callbacks
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",

  // Secret key for signing tokens
  secret: process.env.BETTER_AUTH_SECRET ?? "change-this-in-production",
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
