import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { convertToModelMessages, streamText, type UIMessage } from "ai";

import { createWebSearchTool } from "./lib/tools/search";

export interface Env {
  ASSETS: Fetcher;
  HACKCLUB_MODEL?: string;
  HACKCLUB_AI_KEY?: string;
  HACKCLUB_SEARCH_KEY?: string;
  CLOUDFLARE_KV_REST_API_URL?: string;
  CLOUDFLARE_KV_REST_API_TOKEN?: string;
}

const API_BASE_URL = "https://ai.hackclub.com/proxy/v1";

const persistMessages = async (
  sessionId: string,
  messages: UIMessage[],
  env: Env,
) => {
  const kvRestApiUrl = env.CLOUDFLARE_KV_REST_API_URL;
  const kvRestApiToken = env.CLOUDFLARE_KV_REST_API_TOKEN;

  if (!kvRestApiUrl || !kvRestApiToken) {
    return;
  }

  await fetch(`${kvRestApiUrl}/chat:${encodeURIComponent(sessionId)}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${kvRestApiToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      updatedAt: new Date().toISOString(),
      messages,
    }),
  });
};

const worker = {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/chat" && request.method === "POST") {
      try {
        const { messages }: { messages: UIMessage[] } = await request.json();

        const apiKey =
          request.headers.get("x-api-key") ?? env.HACKCLUB_AI_KEY ?? "";
        const searchKey =
          request.headers.get("x-search-key") ??
          env.HACKCLUB_SEARCH_KEY ??
          "";

        if (!apiKey) {
          return Response.json(
            { error: "Missing Hack Club AI API key." },
            { status: 400 },
          );
        }

        const MODEL = env.HACKCLUB_MODEL ?? "openai/gpt-4o-mini";

        const openrouter = createOpenRouter({
          apiKey,
          baseUrl: API_BASE_URL,
        });

        const result = streamText({
          model: openrouter(MODEL),
          messages: await convertToModelMessages(messages),
          tools: {
            webSearch: createWebSearchTool(searchKey),
          },
        });

        const sessionId =
          request.headers.get("x-session-id") ?? crypto.randomUUID();

        return result.toUIMessageStreamResponse({
          originalMessages: messages,
          onFinish: async ({ messages: finishedMessages }) => {
            try {
              await persistMessages(sessionId, finishedMessages, env);
            } catch (error) {
              console.error("Failed to persist chat messages", error);
            }
          },
          onError: (error) => {
            console.error("Streaming error in /api/chat", error);
            return "An error occurred while streaming the response.";
          },
        });
      } catch (error) {
        console.error("Failed to process /api/chat request", error);
        return Response.json(
          { error: "Invalid chat request." },
          { status: 400 },
        );
      }
    }

    return env.ASSETS.fetch(request);
  },
};

export default worker;
