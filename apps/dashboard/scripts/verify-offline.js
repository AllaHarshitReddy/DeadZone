#!/usr/bin/env node
/**
 * Verification script: ensures the style JSON references only local resources.
 * Fails loudly if any http:// or https:// URLs are found (except localhost/127.0.0.1).
 * Run: node scripts/verify-offline.js
 */

const fs = require("fs");
const path = require("path");

const styleFile = path.resolve(__dirname, "../src/style.json");

try {
  const styleText = fs.readFileSync(styleFile, "utf-8");
  const style = JSON.parse(styleText);

  const styleStr = JSON.stringify(style, null, 2);

  // Find all URLs in the style
  const urlRegex = /(https?):\/\/([^\s"']+)/g;
  const externalUrls = [];

  let match;
  while ((match = urlRegex.exec(styleStr)) !== null) {
    const url = match[0];
    const host = match[2].split("/")[0]; // Extract hostname

    // Allow localhost/127.0.0.1
    if (!host.includes("localhost") && !host.includes("127.0.0.1")) {
      externalUrls.push(url);
    }
  }

  if (externalUrls.length > 0) {
    console.error("❌ FAIL: Style contains external URLs:\n");
    externalUrls.forEach((url, i) => {
      console.error(`  ${i + 1}. ${url}`);
    });
    console.error("\nStyle must be completely offline.");
    process.exit(1);
  }

  console.log("✅ PASS: Style is offline-only");
  console.log(`  - No http:// or https:// to external hosts`);
  console.log(`  - Glyphs: ${style.glyphs}`);
  console.log(`  - Sprite: ${style.sprite}`);
  console.log(`  - Sources: ${Object.keys(style.sources).join(", ")}`);
  process.exit(0);
} catch (err) {
  console.error("❌ ERROR:", err.message);
  process.exit(1);
}
