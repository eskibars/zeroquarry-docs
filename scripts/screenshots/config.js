"use strict";

const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..", "..");
const DEFAULT_AUTH_STATE = path.join(ROOT_DIR, ".auth", "zeroquarry-prod.json");
const DEFAULT_OUTPUT_DIR = path.join(ROOT_DIR, "static", "img", "screenshots");
const DEFAULT_BASE_URL = "https://console.zeroquarry.com";
const SESSION_COOKIE_NAME = "vb_session";

const screenshotTargets = [
  {
    name: "workspace",
    path: "/",
    description: "Default project workspace after sign-in",
  },
  {
    name: "account-overview",
    path: "/account",
    description: "Account overview, usage, integrations, and team settings",
  },
];

function env(name, fallback = "") {
  const value = process.env[name];
  return value && value.trim() ? value.trim() : fallback;
}

function baseUrl() {
  return env("ZEROQUARRY_BASE_URL", DEFAULT_BASE_URL).replace(/\/+$/, "");
}

function authStatePath() {
  return path.resolve(env("ZEROQUARRY_AUTH_STATE", DEFAULT_AUTH_STATE));
}

function outputDir() {
  return path.resolve(env("ZEROQUARRY_SCREENSHOT_DIR", DEFAULT_OUTPUT_DIR));
}

function viewport() {
  return {
    width: Number(env("ZEROQUARRY_SCREENSHOT_WIDTH", "1440")),
    height: Number(env("ZEROQUARRY_SCREENSHOT_HEIGHT", "1000")),
  };
}

function cookieDomain() {
  try {
    return new URL(baseUrl()).hostname;
  } catch {
    return "console.zeroquarry.com";
  }
}

module.exports = {
  ROOT_DIR,
  SESSION_COOKIE_NAME,
  authStatePath,
  baseUrl,
  cookieDomain,
  outputDir,
  screenshotTargets,
  viewport,
};
