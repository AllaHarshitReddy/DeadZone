import { Router } from "express";
import { z } from "zod";
import { computeCompactWeather, readWeatherCache, type CompactWeather } from "../weather";

/**
 * POST /ai/chat -- the one place an LLM touches this app at all. Per
 * CLAUDE.md, life-critical decisions never touch the LLM; this route only
 * ever produces natural-language *explanation* of weather facts that were
 * already computed deterministically in weather.ts. `lang` is accepted (the
 * client will send it) but not yet acted on -- IndicTrans2 is on the cut
 * list, so the model always answers in English; hand-translated fixed
 * Hindi strings arrive later for the rest of the UI.
 * TODO(post-sih): wire `lang` to the fixed Hindi string table.
 */

function getOllamaConfig() {
  return {
    url: process.env.OLLAMA_URL ?? "http://localhost:11434",
    model: process.env.OLLAMA_MODEL ?? "phi4-mini",
  };
}

const ChatRequestSchema = z.object({
  q: z.string().min(1, "q is required"),
  lang: z.enum(["en", "hi"]).default("en"),
});

const IMDRiskBandSchema = z.enum(["GREEN", "YELLOW", "ORANGE", "RED"]);

const ChatResponseSchema = z.object({
  answer: z.string().min(1),
  riskBand: IMDRiskBandSchema,
  safetyAction: z.string().min(1),
  source: z.string().min(1),
});
export type ChatResponse = z.infer<typeof ChatResponseSchema>;

// Handed to Ollama's `format` option so the model's raw output is
// structurally constrained before it ever reaches the zod validation below.
const CHAT_RESPONSE_JSON_SCHEMA = {
  type: "object",
  properties: {
    answer: { type: "string" },
    riskBand: { type: "string", enum: ["GREEN", "YELLOW", "ORANGE", "RED"] },
    safetyAction: { type: "string" },
    source: { type: "string" },
  },
  required: ["answer", "riskBand", "safetyAction", "source"],
  additionalProperties: false,
};

function buildSystemPrompt(weather: CompactWeather): string {
  return [
    "You are DeadZone's weather assistant inside a disaster-response app.",
    "You may ONLY use the facts in the WEATHER FACTS JSON block below.",
    "Never invent, guess, round differently, or extrapolate any number that",
    "is not present in it.",
    "If the question cannot be answered from this JSON, set `answer` to",
    "exactly: \"I don't have data for that.\"",
    "Otherwise, always end `answer` with exactly one concrete, actionable",
    "safety instruction, and repeat that same instruction in `safetyAction`.",
    "Respond in English only, regardless of what language the question is in.",
    "",
    "WEATHER FACTS (the only facts you know):",
    JSON.stringify(weather, null, 2),
  ].join("\n");
}

export const chatRouter = Router();

chatRouter.post("/chat", async (req, res) => {
  const parsedBody = ChatRequestSchema.safeParse(req.body);
  if (!parsedBody.success) {
    res.status(400).json({ error: "Invalid request", details: parsedBody.error.format() });
    return;
  }
  const { q } = parsedBody.data;

  let weather: CompactWeather;
  try {
    const cache = await readWeatherCache();
    weather = computeCompactWeather(cache);
  } catch (err) {
    res.status(503).json({
      error: "Weather data unavailable",
      details: err instanceof Error ? err.message : String(err),
    });
    return;
  }

  const { url: ollamaUrl, model: ollamaModel } = getOllamaConfig();
  const systemPrompt = buildSystemPrompt(weather);

  let ollamaBody: unknown;
  try {
    const ollamaRes = await fetch(`${ollamaUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: ollamaModel,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: q },
        ],
        format: CHAT_RESPONSE_JSON_SCHEMA,
        stream: false,
      }),
    });
    if (!ollamaRes.ok) {
      throw new Error(`Ollama responded ${ollamaRes.status} ${ollamaRes.statusText}`);
    }
    ollamaBody = await ollamaRes.json();
  } catch (err) {
    res.status(502).json({
      error: "Could not reach Ollama",
      details: err instanceof Error ? err.message : String(err),
    });
    return;
  }

  const messageContent = (ollamaBody as { message?: { content?: unknown } })?.message?.content;
  if (typeof messageContent !== "string") {
    res.status(502).json({ error: "Unexpected Ollama response shape", details: ollamaBody });
    return;
  }

  let parsedModelOutput: unknown;
  try {
    parsedModelOutput = JSON.parse(messageContent);
  } catch {
    res.status(502).json({ error: "Ollama did not return valid JSON", details: messageContent });
    return;
  }

  const validated = ChatResponseSchema.safeParse(parsedModelOutput);
  if (!validated.success) {
    res.status(502).json({ error: "Ollama response failed validation", details: validated.error.format() });
    return;
  }

  // riskBand and source are facts, not phrasing -- overridden with the
  // deterministically-computed values rather than trusting the model to
  // transcribe them correctly, even though the format schema and system
  // prompt both already constrain them. Only `answer`/`safetyAction`, where
  // fluent language is actually the point, come from the model.
  const responseBody: ChatResponse = {
    answer: validated.data.answer,
    riskBand: weather.riskBand,
    safetyAction: validated.data.safetyAction,
    source: "Open-Meteo",
  };

  res.json(responseBody);
});
