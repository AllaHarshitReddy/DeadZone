import { existsSync } from "node:fs";

/**
 * Side-effect-only module: loads apps/ai/.env if present, via Node's
 * built-in process.loadEnvFile (no dotenv dependency). Must be the FIRST
 * import in server.ts -- import order is what guarantees this runs before
 * any other module's top-level code, regardless of whether tsx compiles
 * this file down to ESM or CJS. .env is optional and gitignored;
 * .env.example documents the shape and is committed instead.
 */
if (existsSync(".env")) {
  process.loadEnvFile(".env");
}
