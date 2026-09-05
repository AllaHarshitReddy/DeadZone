import { readFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";

/**
 * Transforms a cached Open-Meteo forecast (see scripts/fetch-weather.ts)
 * into a small, prompt-sized object for the LLM's system prompt. The LLM
 * never sees the raw forecast, only these derived facts, so it has no
 * numbers available to invent. See CLAUDE.md: "Life-critical decisions
 * never touch the LLM" -- weather explanation is the one place an LLM is
 * used at all, and only for phrasing; every number below is computed
 * deterministically, not by the model.
 *
 * Timezone note: Open-Meteo (`timezone=auto`) returns hourly/daily
 * timestamps as LOCAL wall-clock strings with no UTC offset attached (e.g.
 * "2026-09-05T14:00"). Parsed naively, `new Date(...)` would interpret that
 * string in whatever timezone THIS PROCESS happens to be running in, which
 * is wrong on any machine not set to IST. The response's own
 * `utc_offset_seconds` is used to attach the correct offset before parsing,
 * so "next 24h from now" compares real instants correctly regardless of
 * where this code runs.
 */

export const WEATHER_CACHE_PATH = path.resolve(import.meta.dirname, "../data/weather.json");

const OpenMeteoForecastSchema = z.object({
  utc_offset_seconds: z.number(),
  timezone: z.string(),
  hourly: z.object({
    time: z.array(z.string()),
    temperature_2m: z.array(z.number()),
    precipitation: z.array(z.number()),
    weathercode: z.array(z.number()),
  }),
  daily: z.object({
    time: z.array(z.string()),
    precipitation_sum: z.array(z.number()),
    weathercode: z.array(z.number()),
  }),
});

export const WeatherCacheSchema = z.object({
  city: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  fetchedAt: z.iso.datetime(),
  forecast: OpenMeteoForecastSchema,
});
export type WeatherCache = z.infer<typeof WeatherCacheSchema>;

export const IMDRiskBandSchema = z.enum(["GREEN", "YELLOW", "ORANGE", "RED"]);
export type IMDRiskBand = z.infer<typeof IMDRiskBandSchema>;

export const CompactWeatherSchema = z.object({
  city: z.string(),
  windowStart: z.iso.datetime(),
  windowEnd: z.iso.datetime(),
  hoursCovered: z.number().int().positive(),
  totalPrecipitationMm: z.number().nonnegative(),
  peakPrecipitationHour: z.object({
    time: z.iso.datetime(),
    precipitationMm: z.number().nonnegative(),
  }),
  worstWeather: z.object({
    code: z.number().int(),
    description: z.string(),
    time: z.iso.datetime(),
  }),
  riskBand: IMDRiskBandSchema,
  riskBandLabel: z.string(),
});
export type CompactWeather = z.infer<typeof CompactWeatherSchema>;

/**
 * WMO weather codes (as used by Open-Meteo), each with a severity rank used
 * ONLY to pick the single "worst" hour for this summary. This ranking is
 * this file's own judgement call, not an official WMO ordering, and it has
 * nothing to do with the IMD risk band below, which is computed separately
 * from total rainfall.
 */
const WMO_CODES: Record<number, { description: string; severity: number }> = {
  0: { description: "Clear sky", severity: 0 },
  1: { description: "Mainly clear", severity: 1 },
  2: { description: "Partly cloudy", severity: 2 },
  3: { description: "Overcast", severity: 3 },
  45: { description: "Fog", severity: 4 },
  48: { description: "Depositing rime fog", severity: 4 },
  51: { description: "Light drizzle", severity: 5 },
  53: { description: "Moderate drizzle", severity: 6 },
  55: { description: "Dense drizzle", severity: 7 },
  56: { description: "Light freezing drizzle", severity: 7 },
  57: { description: "Dense freezing drizzle", severity: 8 },
  61: { description: "Slight rain", severity: 8 },
  63: { description: "Moderate rain", severity: 9 },
  65: { description: "Heavy rain", severity: 12 },
  66: { description: "Light freezing rain", severity: 9 },
  67: { description: "Heavy freezing rain", severity: 11 },
  71: { description: "Slight snow fall", severity: 6 },
  73: { description: "Moderate snow fall", severity: 7 },
  75: { description: "Heavy snow fall", severity: 9 },
  77: { description: "Snow grains", severity: 5 },
  80: { description: "Slight rain showers", severity: 9 },
  81: { description: "Moderate rain showers", severity: 10 },
  82: { description: "Violent rain showers", severity: 13 },
  85: { description: "Slight snow showers", severity: 7 },
  86: { description: "Heavy snow showers", severity: 9 },
  95: { description: "Thunderstorm", severity: 14 },
  96: { description: "Thunderstorm with slight hail", severity: 15 },
  99: { description: "Thunderstorm with heavy hail", severity: 16 },
};

function describeWmoCode(code: number): string {
  return WMO_CODES[code]?.description ?? `Unknown weather code ${code}`;
}

function wmoSeverity(code: number): number {
  return WMO_CODES[code]?.severity ?? -1;
}

/**
 * IMD's real 24-hour cumulative-rainfall colour-code thresholds (Heavy /
 * Very Heavy / Extremely Heavy rainfall warnings) -- not invented values.
 * See CLAUDE.md and the prompt brief for the exact figures.
 */
function riskBandFor(totalPrecipitationMm: number): { band: IMDRiskBand; label: string } {
  if (totalPrecipitationMm >= 204.5) return { band: "RED", label: "Extremely heavy rainfall (IMD Red)" };
  if (totalPrecipitationMm >= 115.6) return { band: "ORANGE", label: "Very heavy rainfall (IMD Orange)" };
  if (totalPrecipitationMm >= 64.5) return { band: "YELLOW", label: "Heavy rainfall (IMD Yellow)" };
  return { band: "GREEN", label: "No significant rainfall warning" };
}

/** Attaches forecast's own UTC offset to a "timezone=auto" local-time string, so it parses to the correct instant. */
function attachOffset(localTime: string, utcOffsetSeconds: number): Date {
  const sign = utcOffsetSeconds >= 0 ? "+" : "-";
  const abs = Math.abs(utcOffsetSeconds);
  const hh = String(Math.floor(abs / 3600)).padStart(2, "0");
  const mm = String(Math.floor((abs % 3600) / 60)).padStart(2, "0");
  return new Date(`${localTime}:00${sign}${hh}:${mm}`);
}

export async function readWeatherCache(cachePath: string = WEATHER_CACHE_PATH): Promise<WeatherCache> {
  let raw: string;
  try {
    raw = await readFile(cachePath, "utf-8");
  } catch (err) {
    throw new Error(
      `No weather cache at ${cachePath}. Run \`pnpm fetch-weather\` first. (${
        err instanceof Error ? err.message : String(err)
      })`,
    );
  }
  return WeatherCacheSchema.parse(JSON.parse(raw));
}

/** Derives the compact, prompt-sized weather object for the next available 24h window as of `now`. */
export function computeCompactWeather(cache: WeatherCache, now: Date = new Date()): CompactWeather {
  const { forecast } = cache;
  const offset = forecast.utc_offset_seconds;

  const hours = forecast.hourly.time.map((time, i) => ({
    at: attachOffset(time, offset),
    precipitation: forecast.hourly.precipitation[i] ?? 0,
    weathercode: forecast.hourly.weathercode[i] ?? 0,
  }));

  const upcoming = hours.filter((h) => h.at.getTime() >= now.getTime());
  if (upcoming.length === 0) {
    throw new Error(
      `Weather cache is stale: no cached hours are at or after ${now.toISOString()}. Re-run \`pnpm fetch-weather\`.`,
    );
  }

  const window = upcoming.slice(0, 24);
  const totalPrecipitationMm = window.reduce((sum, h) => sum + h.precipitation, 0);
  const peak = window.reduce((max, h) => (h.precipitation > max.precipitation ? h : max), window[0]);
  const worst = window.reduce(
    (max, h) => (wmoSeverity(h.weathercode) > wmoSeverity(max.weathercode) ? h : max),
    window[0],
  );
  const { band, label } = riskBandFor(totalPrecipitationMm);

  return CompactWeatherSchema.parse({
    city: cache.city,
    windowStart: window[0].at.toISOString(),
    windowEnd: window[window.length - 1].at.toISOString(),
    hoursCovered: window.length,
    totalPrecipitationMm: Number(totalPrecipitationMm.toFixed(1)),
    peakPrecipitationHour: {
      time: peak.at.toISOString(),
      precipitationMm: peak.precipitation,
    },
    worstWeather: {
      code: worst.weathercode,
      description: describeWmoCode(worst.weathercode),
      time: worst.at.toISOString(),
    },
    riskBand: band,
    riskBandLabel: label,
  });
}
