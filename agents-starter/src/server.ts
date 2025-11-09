import { routeAgentRequest, type Schedule } from "agents";

import { getSchedulePrompt } from "agents/schedule";

import { AIChatAgent } from "agents/ai-chat-agent";
import {
  generateId,
  createUIMessageStream,
  convertToModelMessages,
  createUIMessageStreamResponse,
  type StreamTextOnFinishCallback,
  type ToolSet
} from "ai";
//import { openai } from "@ai-sdk/openai";
import { processToolCalls, cleanupMessages } from "./utils";
import { tools, executions } from "./tools";
// import { env } from "cloudflare:workers";

// Cloudflare AI Gateway
// const openai = createOpenAI({
//   apiKey: env.OPENAI_API_KEY,
//   baseURL: env.GATEWAY_BASE_URL,
// });

/**
 * Chat Agent implementation that handles real-time AI chat interactions
 */
export class Chat extends AIChatAgent<Env> {
  /**
   * Handles incoming chat messages and manages the response stream
   */
  async onChatMessage(
    onFinish: StreamTextOnFinishCallback<ToolSet>,
    _options?: { abortSignal?: AbortSignal }
  ) {
    // const mcpConnection = await this.mcp.connect(
    //   "https://path-to-mcp-server/sse"
    // );

    // Collect all tools, including MCP tools
    const allTools = {
      ...tools,
      ...this.mcp.getAITools()
    };

    const stream = createUIMessageStream({
      execute: async ({ writer }) => {
        // Clean up incomplete tool calls to prevent API errors
        const cleanedMessages = cleanupMessages(this.messages);

        // Process any pending tool calls from previous messages
        // This handles human-in-the-loop confirmations for tools
        const processedMessages = await processToolCalls({
          messages: cleanedMessages,
          dataStream: writer,
          tools: allTools,
          executions
        });

        const messages = [
        {
          role: "system",
          content: `You are a helpful assistant.


${getSchedulePrompt({ date: new Date() })}

If the user asks to schedule a task, use the schedule tool.`
          },
          ...convertToModelMessages(processedMessages).map((m) => ({
            role: m.role,
            content: typeof m.content === "string"
              ? m.content
              : (m.content as any[])
                  .filter((p) => p.type === "text")
                  .map((p) => p.text)
                  .join(" ")
          }))
        ];

        // ✅ Workers AI call
        const aiResponse = await this.env.AI.run("@cf/meta/llama-3.3-70b-instruct-fp8-fast", { messages });

        // ✅ Extract text safely (model may return {output_text} or raw string)
        let text: string;
        if (typeof aiResponse === "string") {
          text = aiResponse;
        } else if ("response" in aiResponse && typeof (aiResponse as any).response === "string") {
          text = (aiResponse as any).response;
        } else if ("output_text" in aiResponse && typeof (aiResponse as any).output_text === "string") {
          text = (aiResponse as any).output_text;
        } else {
          text = JSON.stringify(aiResponse);
        }

        const id = generateId();

        // ✅ Stream result back to UI
        writer.write({ type: "start", messageId: id });
        writer.write({ type: "text-start", id });
        writer.write({ type: "text-delta", delta: text, id });
        writer.write({ type: "text-end", id });

        onFinish({} as any);
      }
    });

    return createUIMessageStreamResponse({ stream });
  }

  async executeTask(description: string, _task: Schedule<string>) {
    await this.saveMessages([
      ...this.messages,
      {
        id: generateId(),
        role: "user",
        parts: [{ type: "text", text: `Running scheduled task: ${description}` }],
        metadata: { createdAt: new Date() }
      }
    ]);
  }
}

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext) {
    return (
      (await routeAgentRequest(request, env)) ||
      new Response("Not found", { status: 404 })
    );
  }
} satisfies ExportedHandler<Env>;