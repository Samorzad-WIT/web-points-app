import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin } from "better-auth/plugins";

import { prisma } from "./prisma";

export const auth = betterAuth({
  plugins: [admin()],
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    minPasswordLength: 6,
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
    },
  },

  user: {
    additionalFields: {
      role: {
        type: ["user", "moderator", "admin"],
        defaultValue: "user",
        required: false,
        input: false,
      },
    },
  },

  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",

  secret: process.env.BETTER_AUTH_SECRET ?? "change-this-in-production",
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
