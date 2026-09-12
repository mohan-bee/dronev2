import { defineConfig } from "@playwright/test";
import { existsSync } from "node:fs";
const chrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
export default defineConfig({
  testDir: "tests",
  timeout: 90000,
  workers: 1,
  use: {
    baseURL: process.env.TEST_URL ?? "http://127.0.0.1:5174",
    headless: true,
    launchOptions: {
      executablePath: existsSync(chrome) ? chrome : undefined,
      args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
    },
  },
  webServer: process.env.TEST_URL
    ? undefined
    : {
        command: "bun run dev -- --port 5174 --strictPort",
        url: "http://127.0.0.1:5174",
        reuseExistingServer: true,
      },
});
