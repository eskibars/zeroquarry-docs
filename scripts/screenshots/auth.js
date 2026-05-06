"use strict";

const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");
const { authStatePath, baseUrl } = require("./config");

async function main() {
  const statePath = authStatePath();
  await fs.promises.mkdir(path.dirname(statePath), { recursive: true });

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    baseURL: baseUrl(),
    viewport: { width: 1440, height: 1000 },
  });
  const page = await context.newPage();

  console.log(`Opening ${baseUrl()}/login`);
  console.log("Sign in with the dedicated docs screenshot account.");
  console.log("When the account page is visible, return here and press Enter.");

  await page.goto("/login", { waitUntil: "domcontentloaded" });

  await new Promise((resolve) => {
    process.stdin.setEncoding("utf8");
    process.stdin.resume();
    process.stdin.once("data", resolve);
  });

  await page.goto("/account", { waitUntil: "networkidle" });
  if (new URL(page.url()).pathname === "/login") {
    throw new Error("Still on /login; auth state was not captured.");
  }

  await context.storageState({ path: statePath });
  console.log(`Saved auth state to ${statePath}`);
  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
