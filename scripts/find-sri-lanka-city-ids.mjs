// One-time helper: looks up each Sri Lankan city BY NAME against
// OpenWeatherMap (which returns the correct numeric city "id" in the
// response), then writes data/cities.json using those verified IDs.
//
// Run this once from the project root:
//   node scripts/find-sri-lanka-city-ids.mjs
//
// It reads OPENWEATHER_API_KEY from .env.local automatically.

import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

// Load OPENWEATHER_API_KEY from .env.local without extra dependencies
const envContent = readFileSync(path.join(root, ".env.local"), "utf-8");
const match = envContent.match(/OPENWEATHER_API_KEY=(.*)/);
const apiKey = match?.[1]?.trim();

if (!apiKey) {
  console.error("Could not find OPENWEATHER_API_KEY in .env.local");
  process.exit(1);
}

// 15 well-known Sri Lankan cities/towns spread across provinces,
// giving a mix of coastal, hill-country, and dry-zone climates.
const cityNames = [
  "Colombo",
  "Kandy",
  "Trincomalee",
  "Galle",
  "Jaffna",
  "Negombo",
  "Batticaloa",
  "Matara",
  "Kurunegala",
  "Anuradhapura",
  "Ratnapura",
  "Nuwara Eliya",
  "Badulla",
  "Puttalam",
  "Vavuniya",
];

async function lookup(name) {
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
    name
  )},LK&appid=${apiKey}&units=metric`;
  const res = await fetch(url);
  if (!res.ok) {
    console.warn(`  ⚠ ${name}: request failed (${res.status}) — skipping`);
    return null;
  }
  const data = await res.json();
  return {
    cityCode: data.id,
    name: data.name,
    country: data.sys?.country ?? "LK",
  };
}

async function main() {
  console.log("Looking up OpenWeatherMap city IDs for Sri Lankan cities...\n");
  const results = [];

  for (const name of cityNames) {
    const result = await lookup(name);
    if (result) {
      console.log(`  ✓ ${result.name} → id ${result.cityCode}`);
      results.push(result);
    }
    // Small delay to be polite to the free-tier rate limit
    await new Promise((r) => setTimeout(r, 300));
  }

  if (results.length < 10) {
    console.error(
      `\nOnly ${results.length} cities resolved — assignment requires at least 10. Check your API key / city names.`
    );
    process.exit(1);
  }

  const outPath = path.join(root, "data", "cities.json");
  writeFileSync(outPath, JSON.stringify(results, null, 2) + "\n");
  console.log(`\n✅ Wrote ${results.length} cities to data/cities.json`);
}

main();
