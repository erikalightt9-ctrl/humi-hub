import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  transform: {
    "^.+\\.tsx?$": ["ts-jest", { tsconfig: { jsx: "react-jsx" } }],
  },
  testMatch: ["**/__tests__/**/*.test.ts", "**/__tests__/**/*.test.tsx"],
  collectCoverageFrom: [
    "src/lib/**/*.ts",
    "!src/lib/email/templates/**",
    "!src/lib/prisma.ts",
    "!src/lib/mailer.ts",
    "!src/lib/auth.ts",       // NextAuth config — requires live DB
    "!src/lib/utils.ts",      // shadcn cn() utility
    "!src/lib/email/send-confirmation.ts",  // requires Nodemailer transport
  ],
  coverageThreshold: {
    global: { lines: 80 },
  },
};

export default config;
