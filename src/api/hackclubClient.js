/**
 * Hack Club API Client
 * Provides an interface to interact with the Hack Club AI API directly from the browser
 */

const HACKCLUB_API_BASE_URL = "https://ai.hackclub.com/proxy/v1";
const SSE_DATA_FIELD_PREFIX = "data:";
const DEFAULT_MODEL = "~anthropic/claude-sonnet-latest";
 * Direct browser calls to the Hack Club AI API.
 *
 * Note: this exposes the API key to the client and depends on the upstream
 * API allowing CORS from the current origin.
 */

const API_BASE_URL = "https://ai.hackclub.com/proxy/v1";
const DEBUG_CORS_PROXY = import.meta.env.VITE_DEBUG_CORS_PROXY || "";

const normalizeProxyPrefix = (value) => {
  if (!value) return "";
  return value.endsWith("/") ? value : `${value}/`;
};

const PROXY_PREFIX = normalizeProxyPrefix(DEBUG_CORS_PROXY);

const CORS_ANYWHERE_DEMO_URL = "https://cors-anywhere.herokuapp.com/corsdemo";

const buildRequestUrl = (path) => {
  const directUrl = `${API_BASE_URL}${path}`;
  return PROXY_PREFIX ? `${PROXY_PREFIX}${directUrl}` : directUrl;
};

const buildHeaders = (apiKey) => {
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };

  // Helpful for quick debugging with cors-anywhere style proxies.
  if (PROXY_PREFIX) {
    headers["x-requested-with"] = "XMLHttpRequest";
  }

  return headers;
};

const buildErrorMessage = async (response) => {
  const rawText = await response.text().catch(() => "");
  let parsedError = "";

  try {
    const json = rawText ? JSON.parse(rawText) : {};
    parsedError = json.error || json.message || "";
  } catch {
    parsedError = rawText;
  }

  const normalized = String(parsedError || "").toLowerCase();
  const isCorsAnywhereBlocked =
    PROXY_PREFIX.includes("cors-anywhere") &&
    (response.status === 403 || response.status === 303 || normalized.includes("/corsdemo"));

  if (isCorsAnywhereBlocked) {
    return `API Error: ${response.status} ${response.statusText}. Enable temporary access at ${CORS_ANYWHERE_DEMO_URL} and retry.`;
  }

  if (parsedError) {
    return String(parsedError);
  }

  return `API Error: ${response.status} ${response.statusText}`;
};

export class HackClubClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }

  async getModels() {
    if (!this.apiKey) {
      throw new Error("API key is not set. Please provide your Hack Club AI API key.");
    }

    try {
      const response = await fetch(`${PROXY_BASE_URL}/models`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          apiKey: this.apiKey,
        }),
      });

      if (!response.ok) {
        throw new Error(await buildErrorMessage(response));
      }

      const data = await response.json();
      // Extract model IDs from the response
      if (data.data && Array.isArray(data.data)) {
        const ids = data.data.map((model) => model.id).filter(Boolean);
        const unique = Array.from(new Set(ids));
        return unique.sort(); // Sort alphabetically
      }
      return [];
    } catch (error) {
      console.error("Hack Club Models API Error:", error);
      throw error;
    }
  }

  async sendMessage(messages, options = {}) {
    if (!this.apiKey) {
      throw new Error("API key is not set. Please provide your Hack Club AI API key.");
    }

    const {
      model = DEFAULT_MODEL,
      temperature = 0.7,
      max_tokens = 2000,
      plugins = undefined,
      onChunk = null, // Callback for streaming chunks
    } = options;

    try {
      const response = await fetch(`${PROXY_BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages,
          model,
          temperature,
          max_tokens,
          ...(plugins ? { plugins } : {}),
          stream: !!onChunk, // Enable streaming if callback provided
        }),
      });

      if (!response.ok) {
        throw new Error(await buildErrorMessage(response));
      }

      // Handle streaming response
      if (onChunk) {
        if (!response.body) {
          throw new Error("Empty streaming response body");
        }

        let fullContent = "";
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        const parseSSEDataLine = (line) => {
          const normalizedLine = line.trimStart();
          if (!normalizedLine.startsWith(SSE_DATA_FIELD_PREFIX)) {
            return null;
          }
          let data = normalizedLine.slice(SSE_DATA_FIELD_PREFIX.length);
          if (data.startsWith(" ")) data = data.slice(1);
          return data;
        };

        const appendChunkContent = (dataLine) => {
          try {
            const parsed = JSON.parse(dataLine);
            const content = parsed.choices[0]?.delta?.content || '';
            if (content) {
              fullContent += content;
              onChunk(content);
            }
          } catch (error) {
            console.warn("Failed to parse SSE data chunk:", dataLine, error);
          }
        };

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || "";

            for (const line of lines) {
              const data = parseSSEDataLine(line);
              if (!data) continue;
              if (data.trim() === '[DONE]') continue;
              appendChunkContent(data);
            }
          }

          if (buffer) {
            const data = parseSSEDataLine(buffer);
            if (data && data.trim() !== '[DONE]') {
              appendChunkContent(data);
            }
          }
        } finally {
          reader.releaseLock();
        }

        return fullContent;
      } else {
        // Non-streaming response
        const data = await response.json();
        return data.choices?.[0]?.message?.content || data.choices?.[0]?.text || '';
      }
    } catch (error) {
      console.error("Hack Club API Error:", error);
      throw error;
    }
  }

  setApiKey(apiKey) {
    this.apiKey = apiKey;
  }

  getApiKey() {
    return this.apiKey;
  }

  isConfigured() {
    return !!this.apiKey;
  }
}

// Create a singleton instance
let hackclubClientInstance = null;

export function getHackClubClient(apiKey) {
  if (!hackclubClientInstance) {
    hackclubClientInstance = new HackClubClient(apiKey);
  } else if (apiKey) {
    hackclubClientInstance.setApiKey(apiKey);
  }
  return hackclubClientInstance;
}

export default getHackClubClient;
