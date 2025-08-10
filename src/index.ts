import { Agent, AgentNamespace, getAgentByName } from 'agents';
import { MCPClientManager } from 'agents/mcp/client';
import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createAiGateway } from 'ai-gateway-provider';

interface ConversationState {
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  sessionActive: boolean;
  startTime: number;
}

export class SiriAssistant extends Agent<Cloudflare.Env, ConversationState> {

  // MCP client manager for handling MCP connections
  mcp = new MCPClientManager('siri-assistant', '1.0.0');

  initialState: ConversationState = {
    messages: [
      {
        role: 'system',
        content: 'You are a helpful voice assistant. Provide concise, conversational responses that are easy to understand when spoken aloud. Keep responses brief but informative.'
      }
    ],
    sessionActive: true,
    startTime: Date.now()
  };

  async onStart() {
    console.log('SiriAssistant agent started');
    this.setState({
      ...this.initialState,
      startTime: Date.now()
    });
    // Initialize MCP client
    try {
      // Add MCP servers for various functionalities
      await this.addMcpServer('cloudflare-docs',
        'https://docs.mcp.cloudflare.com/mcp', this.env.HOST);
      await this.addMcpServer('berlin-transport', 'https://berlin-transport.mcp-tools.app/mcp', this.env.HOST);
    } catch (error) {
      console.log('MCP connection failed, continuing without MCP:',
        error);
    }
  }

  async onRequest(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === 'POST' && path === '/text') {
      return this.handleConversation(request);
    }

    if (request.method === 'GET' && path === '/status') {
      return this.getStatus();
    }

    return new Response('Not found', { status: 404 });
  }

  async handleConversation(request: Request): Promise<Response> {
    try {
      const body = await request.json<{ text: string }>();

      if (!this.state.sessionActive) {
        this.setState({
          ...this.initialState,
          startTime: Date.now()
        });
      }

      const userMessage = { role: 'user' as const, content: body.text };
      let updatedMessages = [...this.state.messages, userMessage];


      let responseContent: string;

      // Get MCP tools if available
      const mcpToolsV4 = this.mcp.unstable_getAITools();

      // Use Cloudflare AI Gateway for processing
      const aiGateway = createAiGateway({
        binding: this.env.AI.gateway('siri-assistant'),

      })

      // Create OpenAI client
      const openai = createOpenAI({
        apiKey: this.env.OPENAI_API_KEY,
      })

      // Generate response using AI Gateway with OpenAI model
      // Passing the messages and MCP tools
      const aiResponse = await generateText({
        model: aiGateway([openai('gpt-4o-mini')]),
        messages: updatedMessages,
        tools: mcpToolsV4,
        maxSteps: 10,
      });

      this.mcp.closeAllConnections();

      responseContent = aiResponse.text || 'No response generated';

      const assistantMessage = {
        role: 'assistant' as const,
        content: responseContent
      };

      const finalMessages = [...updatedMessages, assistantMessage];

      this.setState({
        ...this.state,
        messages: finalMessages
      });

      return Response.json({
        response: responseContent,
      });

    } catch (error) {
      console.error('Error in conversation:', error);
      return Response.json(
        { error: 'Failed to process conversation' },
        { status: 500 }
      );
    }
  }

  async getStatus(): Promise<Response> {
    const sessionDuration = Date.now() - this.state.startTime;
    const messageCount = this.state.messages.filter(m => m.role !== 'system').length;

    return Response.json({
      sessionActive: this.state.sessionActive,
      sessionDuration,
      messageCount,
      startTime: this.state.startTime
    });
  }
}

export default {
  async fetch(request: Request, env: Cloudflare.Env): Promise<Response> {
    // For single user, we can use a fixed agent ID
    const agentId = 'siri-user-session';

    try {
      const agent = await getAgentByName<Cloudflare.Env, SiriAssistant>(env.SIRI_ASSISTANT, agentId);
      return agent.fetch(request);
    } catch (error) {
      console.error('Error getting agent:', error);
      return Response.json(
        { error: 'Failed to initialize assistant' },
        { status: 500 }
      );
    }
  }
} satisfies ExportedHandler<Cloudflare.Env>;
