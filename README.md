# Voice Assistant Worker

This Cloudflare Worker implements a conversational AI assistant using the `agents` library with OpenAI integration. It provides stateful conversational experiences with Model Context Protocol (MCP) support for enhanced capabilities.

## Features

- **Stateful Conversations**: Maintains conversation history using Durable Objects
- **OpenAI Integration**: Uses OpenAI's `gpt-4o-mini` model via Cloudflare AI Gateway
- **MCP Protocol Support**: Enhanced capabilities through Model Context Protocol servers
- **Session Management**: Tracks conversation duration and message counts
- **Agent Persistence**: Stateful AI agents that persist across requests

## API Endpoints

- `/text` - POST endpoint for text-based conversation with the AI assistant
- `/status` - GET endpoint for session status information (duration, message count, activity)

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create a `.dev.vars` file in the root directory with your OpenAI API key:

```
HOST="https://your-deployed.worker.dev"
OPENAI_API_KEY="your_openai_api_key_here"
```

To get an OpenAI API key:

1. Go to the [OpenAI Platform](https://platform.openai.com/)
2. Sign in or create an account
3. Navigate to "API Keys" in your dashboard
4. Create a new API key and copy it
5. The `HOST` variable should point to your deployed Worker URL for MCP server connections

### 3. Run the development server

```bash
npm run dev
```

### 4. Test the application

You can test the API endpoints using curl or any HTTP client:

```bash
# Test conversation endpoint
curl -X POST http://localhost:8787/text \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello, how are you?"}'

# Check session status
curl http://localhost:8787/status
```

### 5. Deploy to Cloudflare

```bash
npm run deploy
```

After deployment, you'll need to set up the secrets in your Cloudflare Worker:

```bash
wrangler secret put OPENAI_API_KEY
wrangler secret put HOST
```

## Architecture Details

This application uses the **agents** library for building stateful AI agents on Cloudflare Workers:

- **Agent Framework**: Provides lifecycle management and state persistence
- **OpenAI Integration**: Leverages `gpt-4o-mini` model for conversational AI
- **AI Gateway**: Routes requests through Cloudflare AI Gateway for monitoring and control
- **MCP Protocol**: Integrates with Model Context Protocol servers for enhanced capabilities
- **Durable Objects**: Ensures conversation state persists across requests

## MCP Integration

The assistant connects to MCP servers for extended functionality:

- **Cloudflare Documentation Server**: Provides access to Cloudflare product documentation
- **Berlin Transport Server**: Offers real-time transport information
- **Extensible**: Additional MCP servers can be easily added in the `onStart()` method

## Agent Lifecycle

1. **Initialization**: Agent starts with system prompt optimized for conversational responses
2. **MCP Connection**: Connects to configured MCP servers for enhanced capabilities
3. **Request Processing**: Handles incoming text via `/text` endpoint
4. **State Management**: Maintains conversation history in Durable Object storage
5. **Response Generation**: Uses OpenAI model with MCP tools for intelligent responses

## Type Generation

Generate TypeScript types from your Wrangler configuration:

```bash
npm run cf-typegen
```

This updates `worker-configuration.d.ts` with the latest Cloudflare bindings and environment types.
