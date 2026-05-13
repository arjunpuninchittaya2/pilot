/**
 * Hack Club API Client
 * Provides an interface to interact with the Hack Club AI API through a local proxy
 */

const PROXY_BASE_URL = "/api/proxy";

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
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `API Error: ${response.status} ${response.statusText}`
        );
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
      const response = await fetch(`${PROXY_BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          apiKey: this.apiKey,
          messages,
          model,
          temperature,
          max_tokens,
          stream: !!onChunk, // Enable streaming if callback provided
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `API Error: ${response.status} ${response.statusText}`
        );
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
