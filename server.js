import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Proxy endpoint for Hack Club AI API - get available models
app.post('/api/proxy/models', async (req, res) => {
  try {
    const { apiKey } = req.body;

    if (!apiKey) {
      return res.status(400).json({ error: 'API key is required' });
    }

    const response = await fetch('https://ai.hackclub.com/proxy/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        return res.status(401).json({
          error: 'Invalid or expired API key.',
        });
      }

      return res.status(response.status).json({
        error: `Failed to fetch models: ${response.statusText}`,
      });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Models proxy error:', error);
    res.status(500).json({ error: 'Failed to fetch models' });
  }
});

// Proxy endpoint for Hack Club AI API - streaming chat
app.post('/api/proxy/chat/completions', async (req, res) => {
  try {
    const { apiKey, messages, model, temperature, max_tokens, stream } = req.body;

    if (!apiKey) {
      return res.status(400).json({ error: 'API key is required' });
    }

    const response = await fetch('https://ai.hackclub.com/proxy/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model || 'qwen/qwen3-32b',
        messages,
        temperature: temperature || 0.7,
        max_tokens: max_tokens || 2000,
        stream: stream || false,
      }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        return res.status(401).json({
          error: 'Invalid or expired API key. Please check your API key and try again. Visit https://ai.hackclub.com/dashboard to manage your API keys.',
        });
      }

      if (response.status === 429) {
        return res.status(429).json({
          error: 'Rate limit exceeded. You\'ve made too many requests. Please wait a moment and try again.',
        });
      }

      const errorData = await response.json();
      return res.status(response.status).json({
        error: errorData.error?.message || `API Error: ${response.status} ${response.statusText}`,
      });
    }

    // If streaming is requested, pipe the response
    if (stream) {
      if (!response.body) {
        return res.status(500).json({ error: 'Empty response body from upstream' });
      }

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let cancelled = false;
      req.on('close', async () => {
        cancelled = true;
        try {
          await reader.cancel();
        } catch (e) {}
      });

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done || cancelled) break;
          if (value) {
            const chunk = decoder.decode(value);
            res.write(chunk);
          }
        }
      } finally {
        try { reader.releaseLock(); } catch (e) {}
        try { res.end(); } catch (e) {}
      }
    } else {
      // Non-streaming response
      const data = await response.json();
      res.json(data);
    }
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Proxy server running on http://0.0.0.0:${PORT}`);
  console.log('Press Ctrl+C to stop the server');
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down server...');
  server.close(() => {
    console.log('Server shut down');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('Shutting down server...');
  server.close(() => {
    console.log('Server shut down');
    process.exit(0);
  });
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});
