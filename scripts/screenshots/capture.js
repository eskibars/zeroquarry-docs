"use strict";

const path = require("path");
const {
  baseUrl,
  outputDir,
  screenshotTargets,
} = require("./config");
const {
  assertSignedIn,
  maskedScreenshot,
  newBrowser,
  newContext,
} = require("./helpers");

async function main() {
  const browser = await newBrowser();

  try {
    const context = await newContext(browser);
    const page = await context.newPage();

    await assertSignedIn(page);

    for (const target of screenshotTargets) {
      const filePath = path.join(outputDir(), `${target.name}.png`);
      await page.goto(target.path, { waitUntil: "networkidle" });
      if (new URL(page.url()).pathname === "/login") {
        throw new Error(`Auth expired while capturing ${target.name}.`);
      }
      await maskedScreenshot(page, filePath);
      console.log(`Captured ${target.name}: ${filePath}`);
    }
  } finally {
    await browser.close();
  }

  console.log(`Screenshots captured from ${baseUrl()}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
