import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { WEATHER_CACHE_PATH } from "../src/weather";

/**
 * Fetches Open-Meteo once for Bengaluru and caches the result to
 * apps/ai/data/weather.json. Not committed (see .gitignore) -- it's a
 * live-API snapshot, not the fictional seed data that lives under the
 * repo-root data/seed/.
 *
 * "Once" is deliberate: src/weather.ts derives "next 24h" windows from
 * whatever is cached here at request time, so re-run this script before a
 * demo if the cache is more than a few days old (the fetched window is 7
 * days; src/weather.ts throws a clear error if `now` has run past it).
 */

// Bengaluru city centre. Hardcoded -- this is a single-city hackathon build.
const CITY = "Bengaluru";
const LATITUDE = 12.9716;
const LONGITUDE = 77.5946;

const url =
  `https://api.open-meteo.com/v1/forecast?latitude=${LATITUDE}&longitude=${LONGITUDE}` +
  `&hourly=temperature_2m,precipitation,weathercode` +
  `&daily=precipitation_sum,weathercode&timezone=auto`;

async function main() {
  console.log(`Fetching Open-Meteo forecast for ${CITY} (${LATITUDE}, ${LONGITUDE})...`);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Open-Meteo request failed: ${res.status} ${res.statusText}`);
  }
  const forecast = await res.json();

  const cache = {
    city: CITY,
    latitude: LATITUDE,
    longitude: LONGITUDE,
    fetchedAt: new Date().toISOString(),
    forecast,
  };

  await mkdir(path.dirname(WEATHER_CACHE_PATH), { recursive: true });
  await writeFile(WEATHER_CACHE_PATH, JSON.stringify(cache, null, 2));
  console.log(`Cached forecast to ${WEATHER_CACHE_PATH}`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
