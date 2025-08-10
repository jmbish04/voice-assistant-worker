# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

```bash
# Start development server
npm run dev

# Deploy to Cloudflare Workers
npm run deploy

# Generate TypeScript types from Wrangler configuration
npm run cf-typegen
```

## Architecture Overview

This is a Cloudflare Worker application that implements a conversational AI assistant using the `agents` library with OpenAI integration. The architecture consists of:

### Core Components

- **Agents Library**: Framework for building stateful AI agents on Cloudflare Workers
- **SiriAssistant Agent**: Main agent class handling conversational interactions
- **OpenAI Integration**: Uses OpenAI's `gpt-4o-mini` model via AI Gateway for text generation
- **MCP Client Manager**: Manages Model Context Protocol connections for enhanced capabilities (Cloudflare docs, Berlin transport)
- **AI Gateway**: Cloudflare AI Gateway for request routing and monitoring
- **Smart Placement**: Optimized Worker placement for reduced latency

### API Endpoints

- `/text` - POST endpoint for text-based conversation
- `/status` - GET endpoint for session status information

### Key Features

- **Stateful Conversations**: Maintains conversation history using agent state management
- **Session Management**: Tracks session activity, duration, and message counts
- **MCP Integration**: Supports Model Context Protocol for extended capabilities
- **Agent Persistence**: Uses Durable Objects for stateful agent instances

## Code Structure

### Main Application (`src/index.ts`)

The application is structured around a single agent class with the following key components:

#### SiriAssistant Agent Class
- **State Management**: Maintains conversation history and session information in `ConversationState`
- **Lifecycle Methods**: `onStart()` initializes the agent and MCP connections
- **Request Handling**: `onRequest()` routes incoming requests to appropriate handlers
- **Conversation Logic**: `handleConversation()` processes text input and generates responses
- **Status Reporting**: `getStatus()` provides session metrics

#### Agent State Structure
```typescript
interface ConversationState {
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  sessionActive: boolean;
  startTime: number;
}
```

### Configuration Files

- `wrangler.jsonc`: Cloudflare Worker configuration with Durable Objects, observability, and smart placement
- `worker-configuration.d.ts`: Auto-generated TypeScript definitions for Cloudflare bindings  
- `tsconfig.json`: TypeScript configuration for ESNext with Hono JSX support
- `.dev.vars.example`: Template for environment variables

### Bindings and Environment

- `SIRI_ASSISTANT`: Durable Object namespace for agent instances
- `AI`: Cloudflare AI binding (configured but not actively used)
- `OPENAI_API_KEY`: OpenAI API key for model access
- `HOST`: Environment variable for MCP server connections (self-referential for MCP servers)

## Development Notes

- The application uses a fixed agent ID (`'siri-user-session'`) for single-user scenarios
- Agent state persists across requests using Durable Objects
- MCP integration connects to Cloudflare documentation and Berlin transport servers for enhanced capabilities
- OpenAI requests are routed through Cloudflare AI Gateway (`siri-assistant` gateway) for monitoring and control
- Conversation history includes a system prompt optimized for voice assistant responses
- MCP connections are closed after each request to prevent resource leaks
- Error handling includes proper JSON responses with appropriate HTTP status codes

## Environment Setup

Create a `.dev.vars` file with:
```
HOST="https://your-deployed.worker.dev"
OPENAI_API_KEY="your_openai_api_key"
```

The `HOST` variable should point to your deployed Worker URL for MCP server connections.

## Type Safety

The application uses Wrangler's type generation system. Run `npm run cf-typegen` after modifying `wrangler.jsonc` to update TypeScript definitions. The generated types are imported via `worker-configuration.d.ts`.