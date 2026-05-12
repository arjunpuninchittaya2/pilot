import { tool } from "ai";
import { z } from "zod";

const SEARCH_API_URL = "https://search.hackclub.com/res/v1/web/search";

export const createWebSearchTool = (searchKey?: string) =>
  tool({
    description: "Search the web for current information.",
    inputSchema: z.object({ query: z.string().min(1) }),
    execute: async ({ query }) => {
      if (!searchKey) {
        throw new Error("Missing Hack Club Search API key.");
      }

      const response = await fetch(
        `${SEARCH_API_URL}?q=${encodeURIComponent(query)}`,
        {
          headers: {
            Authorization: `Bearer ${searchKey}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error(`Hack Club Search request failed (${response.status}).`);
      }

      return response.json();
    },
  });
