import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { convertToModelMessages, streamText, type UIMessage } from "ai";

import { createWebSearchTool } from "@/lib/tools/search";

export const runtime = "edge";

const MODEL = process.env.HACKCLUB_MODEL ?? "openai/gpt-4o-mini";
const API_BASE_URL = "https://ai.hackclub.com/proxy/v1";

const persistMessages = async (sessionId: string, messages: UIMessage[]) => {
  const kvRestApiUrl = process.env.CLOUDFLARE_KV_REST_API_URL;
  const kvRestApiToken = process.env.CLOUDFLARE_KV_REST_API_TOKEN;

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

export async function POST(req: Request) {
  try {
    const { messages }: { messages: UIMessage[] } = await req.json();

    const apiKey =
      req.headers.get("x-api-key") ?? process.env.HACKCLUB_AI_KEY ?? "";
    const searchKey =
      req.headers.get("x-search-key") ?? process.env.HACKCLUB_SEARCH_KEY ?? "";

    if (!apiKey) {
      return Response.json(
        { error: "Missing Hack Club AI API key." },
        { status: 400 },
      );
    }

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

    const sessionId = req.headers.get("x-session-id") ?? crypto.randomUUID();

    return result.toUIMessageStreamResponse({
      originalMessages: messages,
      onFinish: async ({ messages: finishedMessages }) => {
        try {
          await persistMessages(sessionId, finishedMessages);
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
    return Response.json({ error: "Invalid chat request." }, { status: 400 });
  }
}
