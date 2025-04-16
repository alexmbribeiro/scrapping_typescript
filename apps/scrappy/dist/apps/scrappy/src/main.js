"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var import_puppeteer_core = __toESM(require("puppeteer-core"));
var import_puppeteer = require("puppeteer");
var import_fetchGraphql = require("./fetchGraphql");
async function run() {
  const browser = await import_puppeteer_core.default.launch({
    executablePath: (0, import_puppeteer.executablePath)(),
    headless: true,
    args: ["--no-sandbox"]
  });
  const page = await browser.newPage();
  const base_url = "https://www.instagram.com/";
  const user = "cristiano";
  await page.goto(base_url + user, { waitUntil: "networkidle2" });
  await page.waitForSelector("article a", { timeout: 1e4 });
  const postUrl = await page.$$eval("article a", (anchors) => {
    const href = anchors[0]?.getAttribute("href");
    return href ? `https://www.instagram.com${href}` : null;
  });
  if (!postUrl) {
    console.error("Could not find any post URL");
    await browser.close();
    return;
  }
  console.log("Most recent post URL:", postUrl);
  const postData = await (0, import_fetchGraphql.getInstagramGraphqlData)(postUrl);
  console.log("GraphQL post data:", postData);
  await browser.close();
}
run();
//# sourceMappingURL=main.js.map
