/**
 * Hack Club API Client
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
      const response = await fetch(buildRequestUrl("/models"), {
        method: "GET",
        headers: buildHeaders(this.apiKey),
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
      model = "qwen/qwen3-32b",
      temperature = 0.7,
      max_tokens = 2000,
      onChunk = null, // Callback for streaming chunks
    } = options;

    try {
      const response = await fetch(buildRequestUrl("/chat/completions"), {
        method: "POST",
        headers: buildHeaders(this.apiKey),
        body: JSON.stringify({
          messages,
          model,
          temperature,
          max_tokens,
          stream: !!onChunk, // Enable streaming if callback provided
        }),
      });

      if (!response.ok) {
        throw new Error(await buildErrorMessage(response));
      }

      // Handle streaming response
      if (onChunk) {
        let fullContent = "";
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') continue;

                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices[0]?.delta?.content || '';
                  if (content) {
                    fullContent += content;
                    onChunk(content);
                  }
                } catch (e) {
                  // Ignore parse errors
                }
              }
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
